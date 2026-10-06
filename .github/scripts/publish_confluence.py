#!/usr/bin/env python3
"""Publish the droid-wiki markdown folder to Confluence Cloud.

Reads <WIKI_DIR>/.wiki-meta.json (pageOrder), converts every page to Confluence
storage format, renders ```mermaid blocks to PNG with mermaid-cli, and creates or
updates one Confluence page per markdown file under a single root page. A
directory's index.md is the parent of the other pages in that directory.

Run from the repository root:
    python .github/scripts/publish_confluence.py             # publish
    python .github/scripts/publish_confluence.py --dry-run   # convert + render only

--dry-run writes the converted pages and PNGs to --out (default build/confluence)
and, if credentials are set, only authenticates and resolves the space (no writes).

Environment:
    CONFLUENCE_URL         site URL, e.g. https://acme.atlassian.net
    CONFLUENCE_EMAIL       Atlassian account email
    CONFLUENCE_API_TOKEN   API token for that account
    CONFLUENCE_SPACE_KEY   target space key
    CONFLUENCE_ROOT_TITLE  root page title (default "Ikigai wiki")
    CONFLUENCE_PARENT_ID   parent page id for the root page (default: space homepage)
    WIKI_DIR               wiki folder (default droid-wiki)
    MMDC                   mermaid-cli command (default "mmdc")
    GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_SHA   used for source links
"""
import argparse
import hashlib
import html
import json
import os
import posixpath
import re
import shlex
import subprocess
import sys
import tempfile
import textwrap
import time
import xml.etree.ElementTree as ET
from html.entities import name2codepoint
from pathlib import Path

import markdown
import requests

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = Path.cwd().resolve()
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"
LANGUAGES = {
    "js": "javascript", "javascript": "javascript", "css": "css", "html": "xml", "xml": "xml",
    "bash": "bash", "sh": "bash", "shell": "bash", "zsh": "bash", "json": "json",
    "python": "python", "py": "python", "yaml": "yaml", "yml": "yaml", "sql": "sql", "diff": "diff",
}
XML_NS = 'xmlns:ac="http://atlassian.com/content" xmlns:ri="http://atlassian.com/resource/identifier"'
FENCE = re.compile(r"^(\s*)(`{3,}|~{3,})\s*([\w+-]*)")
LIST_ITEM = re.compile(r"^( *)([-*+]|\d+[.)])\s+")
WARNINGS = []


def log(msg):
    print(msg, flush=True)


def warn(msg):
    WARNINGS.append(msg)
    print(f"::warning::{msg}" if IN_ACTIONS else f"WARNING: {msg}", flush=True)


def fail(msg):
    print(f"ERROR: {msg}", file=sys.stderr, flush=True)
    if IN_ACTIONS:
        print("::error::" + msg.replace("\n", "%0A"), flush=True)
    sys.exit(1)


def attr(value):
    return html.escape(value, quote=True)


def cdata(text):
    return "<![CDATA[" + text.replace("]]>", "]]]]><![CDATA[>") + "]]>"


def git(*args):
    try:
        return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


# ---------------------------------------------------------------- markdown -> storage format

def anchor_key(text):
    return re.sub(r"[^a-z0-9]", "", text.lower())


def clean_heading(text):
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    return re.sub(r"[`*]", "", text).strip().rstrip("#").strip()


def heading_map(md):
    headings, in_fence = {}, False
    for line in md.split("\n"):
        if FENCE.match(line):
            in_fence = not in_fence
        elif not in_fence and (m := re.match(r"#{1,6}\s+(.+)$", line)):
            text = clean_heading(m.group(1))
            headings.setdefault(anchor_key(text), text)
    return headings


def extract_mermaid(md):
    """Swap ```mermaid blocks for placeholder paragraphs; return (markdown, sources)."""
    lines, out, sources, i = md.split("\n"), [], [], 0
    while i < len(lines):
        m = FENCE.match(lines[i])
        if not m:
            out.append(lines[i])
            i += 1
            continue
        indent, fence, lang = m.groups()
        close = re.compile(rf"\s*{re.escape(fence[0])}{{{len(fence)},}}\s*$")
        j = i + 1
        while j < len(lines) and not close.match(lines[j]):
            j += 1
        if lang.lower() == "mermaid":
            sources.append(textwrap.dedent("\n".join(lines[i + 1:j])).strip())
            out += ["", f"{indent}XMERMAIDBLOCK{len(sources) - 1}X", ""]
        else:
            out += lines[i:j + 1]
        i = j + 1
    return "\n".join(out), sources


def gfm_compat(md):
    """Bridge GFM habits Python-Markdown does not accept: lists or tables right after a
    paragraph (needs a blank line) and 2/3-space nested lists (needs 4 spaces per level)."""
    out, in_fence, prev, stack = [], False, "", []
    for line in md.split("\n"):
        if FENCE.match(line):
            in_fence = not in_fence
        elif not in_fence:
            item = LIST_ITEM.match(line)
            starts_block = item or (line.lstrip().startswith("|") and not prev.lstrip().startswith("|"))
            if starts_block and prev.strip() and not stack and not prev.startswith((" ", "#")):
                out.append("")
            if item:
                indent = len(item.group(1))
                while stack and indent < stack[-1]:
                    stack.pop()
                if not stack or indent > stack[-1]:
                    stack.append(indent)
                line = "    " * (len(stack) - 1) + line.lstrip()
            elif stack and line.startswith(" ") and line.strip():
                line = "    " * len(stack) + line.lstrip()
            elif line.strip():
                stack = []
        out.append(line)
        prev = line
    return "\n".join(out)


def fix_entities(text):
    def repl(m):
        name = m.group(1)
        if name in ("amp", "lt", "gt", "quot", "apos") or name not in name2codepoint:
            return m.group(0)
        return f"&#{name2codepoint[name]};"
    return re.sub(r"&([A-Za-z][A-Za-z0-9]*);", repl, text)


def code_macro(lang, code):
    lang = LANGUAGES.get((lang or "").lower())
    param = f'<ac:parameter ac:name="language">{lang}</ac:parameter>' if lang else ""
    return (f'<ac:structured-macro ac:name="code">{param}'
            f'<ac:plain-text-body>{cdata(code.rstrip())}</ac:plain-text-body></ac:structured-macro>')


def diagram_name(source):
    return f"mermaid-{hashlib.sha1(source.encode()).hexdigest()[:12]}.png"


def diagram_markup(source):
    return (f'<p><ac:image ac:align="center"><ri:attachment ri:filename="{diagram_name(source)}" />'
            '</ac:image></p><ac:structured-macro ac:name="expand">'
            '<ac:parameter ac:name="title">Diagram source</ac:parameter>'
            f'<ac:rich-text-body>{code_macro(None, source)}</ac:rich-text-body></ac:structured-macro>')


class Converter:
    def __init__(self, wiki_dir, pages, blob_base):
        self.wiki_dir, self.pages, self.blob_base = wiki_dir, pages, blob_base

    def repo_file(self, rel):
        rel = rel.strip().removeprefix("./")
        if not rel or rel.startswith(("/", "-")) or " " in rel or ".." in rel.split("/"):
            return None
        path = REPO_ROOT / rel
        return rel if path.is_file() and ".git" not in path.parts else None

    def convert(self, page):
        md, diagrams = extract_mermaid(page["md"])
        out = markdown.markdown(gfm_compat(md), extensions=["tables", "fenced_code", "sane_lists"],
                                output_format="xhtml")
        stash = []

        def keep(fragment):
            stash.append(fragment)
            return f"\x00{len(stash) - 1}\x00"

        # Order matters: code blocks and diagrams are stashed first so the link and
        # inline-code passes never touch their (CDATA) contents.
        out = re.sub(r'<pre><code(?: class="language-([^"]+)")?>(.*?)</code></pre>',
                     lambda m: keep(code_macro(m.group(1), html.unescape(m.group(2)))), out, flags=re.S)
        out = re.sub(r"(?:<p>)?XMERMAIDBLOCK(\d+)X(?:</p>)?",
                     lambda m: keep(diagram_markup(diagrams[int(m.group(1))])), out)
        out = re.sub(r'<a href="([^"]*)"[^>]*>(.*?)</a>',
                     lambda m: self.link(m, page, keep), out, flags=re.S)
        out = re.sub(r"<code>([^<]*)</code>", self.code_link, out)
        out = re.sub(r"</?t(?:head|body)>\s*", "", out)
        out = out.replace("<table>", "<table><tbody>").replace("</table>", "</tbody></table>")
        out = fix_entities(out)
        body = re.sub(r"\x00(\d+)\x00", lambda m: stash[int(m.group(1))], out).strip()
        return body, sorted({diagram_name(s) for s in diagrams}), diagrams

    def link(self, m, page, keep):
        href, inner = html.unescape(m.group(1)), m.group(2)
        if re.match(r"[a-z][a-z0-9+.-]*:", href, re.I):
            return keep(fix_entities(m.group(0)))
        text = html.unescape(re.sub(r"<[^>]+>", "", inner))
        path, _, anchor = href.partition("#")
        target = page
        if path:
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(page["path"]), path))
            target = self.pages.get(resolved) or self.pages.get(posixpath.join(resolved, "index.md"))
            if target is None:
                on_disk = (self.wiki_dir / posixpath.dirname(page["path"]) / path).resolve()
                if on_disk.is_file() and on_disk.is_relative_to(REPO_ROOT):
                    rel = on_disk.relative_to(REPO_ROOT).as_posix()
                    return keep(f'<a href="{attr(self.blob_base + rel)}">{fix_entities(inner)}</a>')
                warn(f"{page['path']}: unresolved link '{href}' left as plain text")
                return inner
        anchor_attr = ""
        if anchor:
            heading = target["headings"].get(anchor_key(anchor))
            if heading is None:
                warn(f"{page['path']}: anchor '#{anchor}' not found in {target['path']}")
            anchor_attr = f' ac:anchor="{attr(heading or anchor)}"'
        ref = "" if target is page else f'<ri:page ri:content-title="{attr(target["title"])}" />'
        return keep(f"<ac:link{anchor_attr}>{ref}<ac:plain-text-link-body>{cdata(text)}"
                    "</ac:plain-text-link-body></ac:link>")

    def code_link(self, m):
        rel = self.repo_file(html.unescape(m.group(1)))
        return f'<a href="{attr(self.blob_base + rel)}">{m.group(0)}</a>' if rel else m.group(0)


# ---------------------------------------------------------------- wiki loading

def load_pages(wiki_dir):
    meta = json.loads((wiki_dir / ".wiki-meta.json").read_text(encoding="utf-8"))
    order = meta.get("pageOrder") or fail(f"{wiki_dir}/.wiki-meta.json has no pageOrder")
    pages = {}
    for rel in order:
        rel = posixpath.normpath(rel)
        file = wiki_dir / rel
        if not file.is_file():
            fail(f"{rel} is listed in pageOrder but {file} does not exist")
        lines = file.read_text(encoding="utf-8").lstrip("\ufeff").split("\n")
        first = next((i for i, line in enumerate(lines) if line.strip()), 0)
        if re.match(r"#\s", lines[first]):
            title, body = clean_heading(lines[first][1:]), "\n".join(lines[first + 1:])
        else:
            warn(f"{rel} does not start with a '# Title' heading; using the file name")
            title, body = Path(rel).stem.replace("-", " ").title(), "\n".join(lines)
        pages[rel] = {"path": rel, "title": title, "md": body, "headings": heading_map(body)}
    titles = [p["title"] for p in pages.values()]
    if dupes := {t for t in titles if titles.count(t) > 1}:
        fail(f"Duplicate page titles (Confluence titles must be unique in a space): {sorted(dupes)}")
    for rel, page in pages.items():
        section = posixpath.dirname(rel)
        if posixpath.basename(rel) == "index.md":
            section = posixpath.dirname(section)
        parent = f"{section}/index.md" if section else None
        if parent and parent not in pages:
            warn(f"{rel}: {parent} is not in pageOrder; placing the page under the root page")
            parent = None
        page["parent"] = parent
    ordered = []

    def visit(rel):
        if rel not in ordered:
            if pages[rel]["parent"]:
                visit(pages[rel]["parent"])
            ordered.append(rel)
    for rel in pages:
        visit(rel)
    return meta, pages, ordered


def render_diagrams(diagrams, out_dir):
    """diagrams: {filename: (source, page path)} -> {filename: png path}."""
    att_dir = out_dir / "attachments"
    att_dir.mkdir(parents=True, exist_ok=True)
    cmd = shlex.split(os.environ.get("MMDC") or "mmdc")
    config = SCRIPT_DIR / "puppeteer-config.json"
    with tempfile.TemporaryDirectory() as tmp:
        for name, (source, page_path) in diagrams.items():
            png = att_dir / name
            if png.is_file() and png.stat().st_size:
                continue
            mmd = Path(tmp) / f"{name}.mmd"
            mmd.write_text(source + "\n", encoding="utf-8")
            args = cmd + ["-i", str(mmd), "-o", str(png), "-b", "white", "-s", "2", "-p", str(config)]
            try:
                result = subprocess.run(args, capture_output=True, text=True, timeout=300)
            except FileNotFoundError:
                fail(f"mermaid-cli '{cmd[0]}' not found. Run 'npm install -g @mermaid-js/mermaid-cli@11' "
                     "or set MMDC.")
            except subprocess.TimeoutExpired:
                fail(f"Rendering a Mermaid diagram in {page_path} timed out")
            if result.returncode != 0 or not png.is_file():
                fail(f"Mermaid diagram in {page_path} failed to render:\n"
                     f"{(result.stderr or result.stdout).strip()}\n--- diagram source ---\n{source}")
            log(f"Rendered {name} (from {page_path})")
    return {name: att_dir / name for name in diagrams}


# ---------------------------------------------------------------- Confluence API

class Confluence:
    def __init__(self, site, email, token):
        self.site = site
        self.session = requests.Session()
        self.session.auth = (email, token)
        self.session.headers.update({"Accept": "application/json", "User-Agent": "wiki-confluence-sync"})

    def call(self, method, path, **kwargs):
        if path.startswith("http"):
            url = path
        else:
            url = self.site + (path if path.startswith("/wiki/") else "/wiki" + path)
        for attempt in range(5):
            try:
                resp = self.session.request(method, url, timeout=60, **kwargs)
            except requests.RequestException as exc:
                if attempt == 4:
                    fail(f"{method} {url} failed: {exc}")
                time.sleep(2 ** attempt)
                continue
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < 4:
                try:
                    wait = float(resp.headers.get("Retry-After", ""))
                except ValueError:
                    wait = 2 ** attempt
                log(f"  {resp.status_code} from {method} {url}; retrying in {wait:.0f}s")
                time.sleep(min(wait, 60))
                continue
            if resp.status_code >= 400:
                fail(f"{method} {url} -> HTTP {resp.status_code}\n{resp.text[:3000]}")
            return resp.json() if resp.content else {}

    def space(self, key):
        results = self.call("GET", "/api/v2/spaces", params={"keys": key}).get("results") or []
        if not results:
            fail(f"Space '{key}' was not found or is not visible to this account")
        return results[0]

    def find_page(self, space_id, title):
        params = {"space-id": space_id, "title": title, "status": "current"}
        results = self.call("GET", "/api/v2/pages", params=params).get("results") or []
        return results[0] if results else None

    def attachment_names(self, page_id):
        names, url, params = set(), f"/api/v2/pages/{page_id}/attachments", {"limit": 250}
        while url:
            data = self.call("GET", url, params=params)
            names |= {a.get("title") for a in data.get("results", [])}
            url, params = (data.get("_links") or {}).get("next"), None
        return names

    def sync(self, space_id, page, parent_id, pngs):
        """Create or update one page; returns (page id, status, url)."""
        found = self.find_page(space_id, page["title"])
        content = {"spaceId": space_id, "status": "current", "title": page["title"],
                   "body": {"representation": "storage", "value": page["body"]}}
        if parent_id:
            content["parentId"] = parent_id
        if found:
            current, status = self.call("GET", f"/api/v2/pages/{found['id']}"), "unchanged"
            message = (current.get("version") or {}).get("message") or ""
            if parent_id and str(current.get("parentId")) != str(parent_id) and not message.startswith("wiki-sync"):
                fail(f"A page titled '{page['title']}' already exists elsewhere in this space "
                     f"(id {found['id']}) and was not created by this publisher. Rename or move it, "
                     "or publish to another space.")
        else:
            current, status = self.call("POST", "/api/v2/pages", json=content), "created"
        page_id = current["id"]
        present = self.attachment_names(page_id) if page["attachments"] else set()
        for name in [n for n in page["attachments"] if n not in present]:
            self.call("PUT", f"/rest/api/content/{page_id}/child/attachment",
                      headers={"X-Atlassian-Token": "no-check"}, data={"minorEdit": "true"},
                      files={"file": (name, pngs[name].read_bytes(), "image/png")})
            log(f"  uploaded {name}")
        # The v2 create endpoint takes no version message, so new pages get one follow-up
        # PUT that stamps the sync hash; later runs skip pages whose hash still matches.
        marker = f"wiki-sync {page['hash']}"
        moved = parent_id and str(current.get("parentId")) != str(parent_id)
        if (current.get("version") or {}).get("message") != marker or moved:
            content.update(id=page_id, version={"number": current["version"]["number"] + 1, "message": marker})
            current = self.call("PUT", f"/api/v2/pages/{page_id}", json=content)
            status = "updated" if status == "unchanged" else status
        webui = (current.get("_links") or {}).get("webui")
        return page_id, status, f"{self.site}/wiki{webui}" if webui else f"{self.site}/wiki/pages/{page_id}"


# ---------------------------------------------------------------- main

def page_hash(page, parent_key):
    payload = json.dumps([page["title"], parent_key, page["body"], page["attachments"]])
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def write_summary(heading, rows):
    if path := os.environ.get("GITHUB_STEP_SUMMARY"):
        lines = [f"## {heading}", "", "| Page | Status | Link |", "| --- | --- | --- |"]
        for title, status, link in rows:
            cell = f"[open]({link})" if link.startswith("http") else f"`{link}`"
            lines.append(f"| {title.replace('|', '/')} | {status} | {cell} |")
        with open(path, "a", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Publish the markdown wiki to Confluence Cloud.")
    parser.add_argument("--dry-run", action="store_true", help="convert and render only; no Confluence writes")
    parser.add_argument("--out", type=Path, default=Path("build/confluence"), help="output dir for previews")
    args = parser.parse_args()

    wiki_dir = Path(os.environ.get("WIKI_DIR") or "droid-wiki")
    if not (wiki_dir / ".wiki-meta.json").is_file():
        fail(f"{wiki_dir}/.wiki-meta.json not found (run from the repo root or set WIKI_DIR)")
    meta, pages, order = load_pages(wiki_dir)

    server = (os.environ.get("GITHUB_SERVER_URL") or "https://github.com").rstrip("/")
    repo = os.environ.get("GITHUB_REPOSITORY")
    if not repo:
        m = re.search(r"github\.com[:/](.+?)(?:\.git)?$", git("remote", "get-url", "origin"))
        repo = m.group(1) if m else "FranklinP44/ikigai"
    # Prefer the commit the wiki was generated from so source links stay stable across publishes.
    sha = meta.get("commitHash") or os.environ.get("GITHUB_SHA") or git("rev-parse", "HEAD") or "main"
    repo_url = f"{server}/{repo}"
    converter = Converter(wiki_dir, pages, f"{repo_url}/blob/{sha}/")

    wiki_abs = wiki_dir.resolve()
    wiki_label = wiki_abs.relative_to(REPO_ROOT).as_posix() if wiki_abs.is_relative_to(REPO_ROOT) else wiki_abs.name
    root_title = os.environ.get("CONFLUENCE_ROOT_TITLE") or "Ikigai wiki"
    parent_cfg = os.environ.get("CONFLUENCE_PARENT_ID") or ""
    root = {"path": "(root)", "title": root_title, "attachments": [], "body": (
        '<ac:structured-macro ac:name="info"><ac:rich-text-body>'
        f'<p>These pages are generated from the <a href="{attr(repo_url)}">{attr(repo)}</a> GitHub '
        f'repository (<code>{attr(wiki_label)}/</code>). Manual edits made in Confluence will '
        'be overwritten the next time the wiki is published.</p>'
        f'<p>Source commit: <a href="{attr(repo_url)}/commit/{attr(sha)}"><code>{attr(sha[:7])}</code></a></p>'
        '</ac:rich-text-body></ac:structured-macro>'
        '<ac:structured-macro ac:name="children"><ac:parameter ac:name="all">true</ac:parameter>'
        '</ac:structured-macro>')}
    if root_title in {p["title"] for p in pages.values()}:
        fail(f"Root title '{root_title}' collides with a wiki page title; set CONFLUENCE_ROOT_TITLE")
    root["hash"] = page_hash(root, parent_cfg or "space-homepage")

    pages_dir = args.out / "pages"
    diagrams = {}
    for rel in order:
        page = pages[rel]
        page["body"], page["attachments"], sources = converter.convert(page)
        for source in sources:
            diagrams.setdefault(diagram_name(source), (source, rel))
        parent_title = pages[page["parent"]]["title"] if page["parent"] else root_title
        page["hash"] = page_hash(page, parent_title)
    for page in [root] + [pages[rel] for rel in order]:
        name = "_root" if page is root else page["path"].removesuffix(".md")
        target = pages_dir / f"{name}.storage.xml"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(page["body"] + "\n", encoding="utf-8")
        try:
            ET.fromstring(f"<root {XML_NS}>{page['body']}</root>")
        except ET.ParseError as exc:
            fail(f"{page['path']}: generated storage format is not well-formed XML ({exc}); see {target}")
    pngs = render_diagrams(diagrams, args.out)
    manifest = [{k: pages[rel][k] for k in ("path", "title", "parent", "attachments", "hash")} for rel in order]
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    log(f"Converted {len(order)} pages and rendered {len(pngs)} diagrams into {args.out}/")

    env = {k: os.environ.get(k, "").strip() for k in
           ("CONFLUENCE_URL", "CONFLUENCE_EMAIL", "CONFLUENCE_API_TOKEN", "CONFLUENCE_SPACE_KEY")}
    missing = [k for k, v in env.items() if not v]
    site = re.sub(r"/wiki$", "", env["CONFLUENCE_URL"].rstrip("/"))
    api = None if missing else Confluence(site, env["CONFLUENCE_EMAIL"], env["CONFLUENCE_API_TOKEN"])

    if args.dry_run:
        if api:
            space = api.space(env["CONFLUENCE_SPACE_KEY"])
            existing = api.find_page(space["id"], root_title)
            log(f"Authenticated; space '{space.get('name')}' (id {space['id']}) resolved. Root page "
                f"'{root_title}' {'exists (id ' + existing['id'] + ')' if existing else 'would be created'}.")
        else:
            warn(f"Skipping read-only Confluence checks; missing {', '.join(missing)}")
        write_summary("Confluence wiki dry run", [(pages[r]["title"], f"{len(pages[r]['attachments'])} diagrams",
                                                    f"{pages_dir.as_posix()}/{r.removesuffix('.md')}.storage.xml")
                                                   for r in order])
        log(f"Dry run complete with {len(WARNINGS)} warning(s); nothing was written to Confluence.")
        return

    if missing:
        fail(f"Missing required environment variables: {', '.join(missing)}")
    space = api.space(env["CONFLUENCE_SPACE_KEY"])
    root_parent = parent_cfg or space.get("homepageId")
    ids, rows = {}, []
    for page in [root] + [pages[rel] for rel in order]:
        parent_id = root_parent if page is root else ids[page["parent"] or "(root)"]
        log(f"Syncing {page['title']} ({page['path']})")
        ids[page["path"]], status, url = api.sync(space["id"], page, parent_id, pngs)
        rows.append((page["title"], status, url))
        log(f"  {status}: {url}")
    counts = {s: sum(1 for r in rows if r[1] == s) for s in ("created", "updated", "unchanged")}
    log("\n" + ", ".join(f"{v} {k}" for k, v in counts.items()) + f"; root page: {rows[0][2]}")
    log("Note: pages removed from the wiki are not deleted from Confluence; remove them manually if needed.")
    write_summary("Confluence wiki publish", rows)


if __name__ == "__main__":
    main()
