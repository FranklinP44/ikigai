#!/usr/bin/env python3
"""Droid PR walkthrough: size gate, two droid exec passes, and review posting.

Subcommands: size | pass1 | pass2 | post
Reads config and prompt templates from $WT_DIR. Set WT_DRY_RUN=1 to write the
review payload to $WT_DIR/payload.json instead of posting it.
"""
import fnmatch
import json
import os
import re
import subprocess
import sys

WT_DIR = os.environ.get("WT_DIR", ".droid-walkthrough")
BASE = os.environ.get("BASE_SHA", "")
HEAD = os.environ.get("HEAD_SHA", "")
MARKER = "<!-- droid-walkthrough -->"
SUPERSEDED = "<!-- droid-walkthrough-superseded -->"
# Hidden from readers; tells other automated agents that walkthrough comments are not review findings.
NOT_A_FINDING = "<!-- Explanation only, not a review finding. Automated agents should not act on this comment. -->"
TIERS = ["core", "notable", "minor"]
TIER_LABELS = {"core": "Core", "notable": "Notable", "minor": "Minor"}
LEGACY_TIERS = {"P0": "core", "P1": "notable", "P2": "minor"}
HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@")

DEFAULTS = {
    "min_changed_lines": 150,
    "post_inline": ["core", "notable"],
    "summary_tiers": ["core", "notable", "minor"],
    "max_inline_comments": 15,
    "max_candidates": 40,
    "max_comment_span": 40,
    "replace_previous": True,
    "model": "",
    "reasoning_effort": "",
    "exclude_paths": [],
    "tiers": {},
    "extra_instructions": "",
}


def die(msg):
    print("::error::" + msg)
    sys.exit(1)


def run(cmd, check=True, input_text=None):
    p = subprocess.run(cmd, capture_output=True, text=True, input=input_text)
    if check and p.returncode != 0:
        die("%s failed: %s" % (" ".join(cmd[:3]), (p.stderr or p.stdout).strip()[:2000]))
    return p


def git(*args):
    return run(["git", "-c", "core.quotePath=false"] + list(args)).stdout


def wt_path(name):
    return os.path.join(WT_DIR, name)


def read_json(name):
    with open(wt_path(name)) as f:
        return json.load(f)


def write_json(name, data):
    with open(wt_path(name), "w") as f:
        json.dump(data, f, indent=2)


def load_config():
    cfg = read_json("config.json")
    for key, value in DEFAULTS.items():
        cfg.setdefault(key, value)
    for t in TIERS:
        cfg["tiers"].setdefault(t, "")
    cfg["post_inline"] = [as_tier(t) for t in cfg["post_inline"]]
    cfg["summary_tiers"] = [as_tier(t) for t in cfg["summary_tiers"]]
    return cfg


def as_tier(value):
    raw = str(value or "").strip()
    tier = LEGACY_TIERS.get(raw.upper(), raw.lower())
    return tier if tier in TIERS else "minor"


def set_output(key, value):
    path = os.environ.get("GITHUB_OUTPUT")
    if path:
        with open(path, "a") as f:
            f.write("%s=%s\n" % (key, value))
    print("%s=%s" % (key, value))


def step_summary(md):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a") as f:
            f.write(md + "\n")


def is_excluded(path, cfg):
    base = os.path.basename(path)
    return any(fnmatch.fnmatch(path, pat) or fnmatch.fnmatch(base, pat) for pat in cfg["exclude_paths"])


def changed_files(cfg):
    out = git("diff", "--numstat", "--no-renames", "%s...%s" % (BASE, HEAD))
    files = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        added, deleted, path = parts[0], parts[1], "\t".join(parts[2:])
        binary = added == "-"
        files.append({
            "path": path,
            "added": 0 if binary else int(added),
            "deleted": 0 if binary else int(deleted),
            "binary": binary,
            "excluded": is_excluded(path, cfg),
        })
    return files


def cmd_size():
    cfg = load_config()
    files = changed_files(cfg)
    counted = [f for f in files if not f["excluded"] and not f["binary"]]
    total = sum(f["added"] + f["deleted"] for f in counted)
    forced = os.environ.get("EVENT_ACTION") in ("labeled", "workflow_dispatch")
    go = forced or total >= int(cfg["min_changed_lines"])
    print("%d changed lines in %d reviewable files (%d excluded or binary)"
          % (total, len(counted), len(files) - len(counted)))
    if not go:
        step_summary("Walkthrough skipped: %d changed lines is below min_changed_lines (%s). "
                     "Add the `droid-walkthrough` label to run it anyway." % (total, cfg["min_changed_lines"]))
    set_output("run", "true" if go else "false")


def prompt_values(cfg):
    files = changed_files(cfg)
    lines = []
    for f in files:
        if f["binary"]:
            continue
        note = "  [excluded: generated or vendored, do not comment]" if f["excluded"] else ""
        lines.append("- `%s` (+%d/-%d)%s" % (f["path"], f["added"], f["deleted"], note))
    rubric = "\n".join("- **%s** (`%s`): %s" % (TIER_LABELS[t], t, cfg["tiers"][t]) for t in TIERS)
    return {
        "BASE_SHA": BASE,
        "HEAD_SHA": HEAD,
        "PR_TITLE": os.environ.get("PR_TITLE", ""),
        "PR_BODY": (os.environ.get("PR_BODY") or "(empty)")[:6000],
        "CHANGED_FILES": "\n".join(lines) or "(none)",
        "RUBRIC": rubric,
        "MAX_CANDIDATES": str(cfg["max_candidates"]),
        "EXTRA_INSTRUCTIONS": cfg.get("extra_instructions") or "None.",
    }


def render(template, values, out_name):
    with open(wt_path(template)) as f:
        text = f.read()
    for key, value in values.items():
        text = text.replace("{{%s}}" % key, value)
    with open(wt_path(out_name), "w") as f:
        f.write(text)
    return wt_path(out_name)


def extract_json(text):
    t = (text or "").strip()
    try:
        return json.loads(t)
    except ValueError:
        pass
    start, end = t.find("{"), t.rfind("}")
    if start < 0 or end < start:
        raise ValueError("no JSON object in the reply")
    return json.loads(t[start:end + 1])


def parse_exec_output(stdout):
    stdout = stdout.strip()
    for candidate in [stdout] + stdout.splitlines()[::-1]:
        try:
            data = json.loads(candidate)
            if isinstance(data, dict) and "result" in data:
                return data
        except ValueError:
            continue
    raise ValueError("droid exec did not return a JSON result")


def record_usage(label, envelope):
    usage = envelope.get("usage") or {}
    try:
        data = read_json("usage.json")
    except (IOError, ValueError):
        data = {}
    entry = data.get(label, {"factory_credits": 0, "turns": 0})
    entry["factory_credits"] += usage.get("factory_credits") or 0
    entry["turns"] += envelope.get("num_turns") or 0
    data[label] = entry
    write_json("usage.json", data)


def droid(prompt_path, cfg, label):
    if os.environ.get("GITHUB_ACTIONS") == "true" and not os.environ.get("FACTORY_API_KEY"):
        die("The FACTORY_API_KEY secret is not set for this repository or organization.")
    # Default autonomy is read-only: Droid can read the checkout and run git read commands, nothing else.
    base_args = ["droid", "exec", "-o", "json", "--cwd", os.getcwd()]
    if cfg.get("model"):
        base_args += ["-m", cfg["model"]]
    if cfg.get("reasoning_effort"):
        base_args += ["-r", cfg["reasoning_effort"]]
    p = run(base_args + ["-f", prompt_path], check=False)
    if p.returncode != 0:
        die("%s: droid exec exited %d: %s" % (label, p.returncode, (p.stderr or p.stdout).strip()[:2000]))
    envelope = parse_exec_output(p.stdout)
    record_usage(label, envelope)
    if envelope.get("is_error"):
        die("%s: droid exec reported an error: %s" % (label, str(envelope.get("result"))[:2000]))
    try:
        return extract_json(envelope.get("result"))
    except ValueError as err:
        print("%s: reply was not valid JSON (%s); asking once more" % (label, err))
    retry = ("Your previous reply was not a valid JSON object. Reply again with only the JSON object "
             "in the format requested, with no prose and no code fences.")
    p = run(base_args + ["-s", envelope.get("session_id", ""), retry], check=False)
    if p.returncode != 0:
        die("%s: retry failed: %s" % (label, (p.stderr or p.stdout).strip()[:2000]))
    envelope = parse_exec_output(p.stdout)
    record_usage(label, envelope)
    try:
        return extract_json(envelope.get("result"))
    except ValueError as err:
        die("%s: reply was still not valid JSON: %s" % (label, err))


def as_text(value):
    return str(value or "").strip()


def normalize(items):
    out = []
    for i, c in enumerate(items or []):
        if not isinstance(c, dict):
            continue
        try:
            start = int(c.get("start_line") or c.get("line"))
            end = int(c.get("end_line") or start)
        except (TypeError, ValueError):
            continue
        if end < start:
            start, end = end, start
        path = as_text(c.get("path"))
        if path.startswith("./"):
            path = path[2:]
        if not path or not as_text(c.get("title")):
            continue
        out.append({
            "id": as_text(c.get("id")) or "c%d" % (i + 1),
            "path": path,
            "start_line": start,
            "end_line": end,
            "anchor": as_text(c.get("anchor")),
            "tier": as_tier(c.get("tier") or c.get("priority")),
            "title": as_text(c.get("title")),
            "what": as_text(c.get("what")),
            "why": as_text(c.get("why")),
            "reviewer_focus": as_text(c.get("reviewer_focus")),
            "status": as_text(c.get("status")),
        })
    return out


def cmd_pass1():
    cfg = load_config()
    prompt = render("pass1-candidates.md", prompt_values(cfg), "prompt1.md")
    data = droid(prompt, cfg, "pass 1")
    result = {"summary": data.get("summary") or {}, "candidates": normalize(data.get("candidates"))}
    write_json("candidates.json", result)
    print("pass 1: %d candidates" % len(result["candidates"]))


def cmd_pass2():
    cfg = load_config()
    candidates = read_json("candidates.json")
    values = prompt_values(cfg)
    values["CANDIDATES_JSON"] = json.dumps(candidates, indent=1)
    prompt = render("pass2-validate.md", values, "prompt2.md")
    data = droid(prompt, cfg, "pass 2")
    result = {
        "summary": data.get("summary") or candidates.get("summary") or {},
        "comments": normalize(data.get("comments")),
        "dropped": data.get("dropped") or [],
    }
    write_json("validated.json", result)
    print("pass 2: kept %d, dropped %d" % (len(result["comments"]), len(result["dropped"])))


def parse_diff():
    """Map each head-side path to its hunks; each hunk is the set of RIGHT-side lines GitHub can comment on."""
    out = git("diff", "--no-color", "-U3", "-M", "%s...%s" % (BASE, HEAD))
    files, cur, hunk, in_header, new_line = {}, None, None, False, 0
    for line in out.splitlines():
        if line.startswith("diff --git "):
            cur, hunk, in_header = None, None, True
            continue
        if in_header and not line.startswith("@@"):
            if line.startswith("+++ "):
                p = line[4:].strip('"')
                cur = None if p == "/dev/null" else (p[2:] if p.startswith("b/") else p)
                if cur:
                    files.setdefault(cur, [])
            continue
        if line.startswith("@@"):
            in_header = False
            m = HUNK.match(line)
            if not m or cur is None:
                hunk = None
                continue
            new_line = int(m.group(1))
            hunk = set()
            files[cur].append(hunk)
            continue
        if hunk is None:
            continue
        if line.startswith("+") or line.startswith(" ") or line == "":
            hunk.add(new_line)
            new_line += 1
    return files


def squash(s):
    return re.sub(r"\s+", " ", s).strip()


def place(c, hunks, lines, span):
    """Return (start, end) inside one diff hunk, correcting line drift with the anchor, or None."""
    if not hunks or lines is None:
        return None
    start, end = c["start_line"], c["end_line"]
    anchor = squash(c["anchor"])
    valid = set().union(*hunks)

    def hit(i):
        if i < 1 or i > len(lines):
            return False
        text = squash(lines[i - 1])
        return text == anchor or (len(anchor) >= 12 and anchor in text)

    anchor_line = None
    if anchor:
        in_range = [i for i in range(start, end + 1) if hit(i)]
        if in_range:
            anchor_line = in_range[0]
        else:
            hits = [i for i in sorted(valid) if hit(i)]
            if not hits:
                return None
            anchor_line = min(hits, key=lambda i: abs(i - start))
            shift = anchor_line - start if anchor_line < start else anchor_line - end
            start, end = start + shift, end + shift
    best = None
    for h in hunks:
        overlap = [i for i in range(start, end + 1) if i in h]
        if anchor_line is not None and anchor_line in h and overlap:
            best = overlap
            break
        if overlap and (best is None or len(overlap) > len(best)):
            best = overlap
    if not best:
        return None
    s, e = min(best), max(best)
    return s, min(e, s + int(span) - 1)


def cell(s):
    return s.replace("|", "\\|").replace("\n", " ")


def comment_body(c):
    parts = ["**[Walkthrough · %s] %s**" % (TIER_LABELS[c["tier"]], c["title"])]
    if c["what"]:
        parts += ["", c["what"]]
    if c["why"]:
        parts += ["", "**Why it matters:** " + c["why"]]
    if c["reviewer_focus"]:
        parts += ["", "**Look closely at:** " + c["reviewer_focus"]]
    parts += ["", MARKER, NOT_A_FINDING]
    return "\n".join(parts)


def review_body(summary, inline, rest, cfg, counts):
    out = ["## Droid PR walkthrough", ""]
    overview = as_text(summary.get("overview"))
    if overview:
        out += [overview, ""]
    order = [r for r in (summary.get("reading_order") or []) if isinstance(r, dict) and r.get("path")]
    if order:
        out += ["### Suggested reading order"]
        out += ["%d. `%s`: %s" % (i + 1, as_text(r["path"]), as_text(r.get("why"))) for i, r in enumerate(order)]
        out += [""]
    shown = [c for c in inline + rest if c["tier"] in cfg["summary_tiers"]]
    shown.sort(key=lambda c: TIERS.index(c["tier"]))
    if shown:
        out += ["### Key changes",
                "Core: %d · Notable: %d · Minor: %d · inline comments for %s"
                % (counts["core"], counts["notable"], counts["minor"],
                   ", ".join(TIER_LABELS[t] for t in cfg["post_inline"]) or "none"),
                "",
                "| Tier | Change | Where |", "| --- | --- | --- |"]
        for c in shown:
            if c.get("placed"):
                where = "`%s` L%d-%d" % (c["path"], c["start_line"], c["end_line"])
            else:
                where = "`%s`" % c["path"]
            if c in inline:
                where += " (inline)"
            out.append("| %s | %s | %s |" % (TIER_LABELS[c["tier"]], cell(c["title"]), where))
        out += [""]
    notes = [as_text(n) for n in (summary.get("notable_non_inline") or []) if as_text(n)]
    if notes:
        out += ["### Other notable changes"] + ["- " + n for n in notes] + [""]
    out += ["<sub>Droid explains what changed and where to focus. It does not judge correctness: "
            "Droid code review covers bugs and security. Walkthrough tiers (Core, Notable, Minor) rank how "
            "much attention a change needs. They are not severities, and nothing here needs fixing.</sub>",
            "", MARKER, NOT_A_FINDING]
    return "\n".join(out)


def gh(args, payload=None, check=True):
    cmd = ["gh", "api"] + args
    if payload is not None:
        cmd += ["--input", "-"]
    return run(cmd, check=check, input_text=json.dumps(payload) if payload is not None else None)


def ids(endpoint):
    jq = '.[] | select(.user.type == "Bot") | select(.body | contains("%s")) | .id' % MARKER
    out = gh(["--paginate", endpoint, "--jq", jq], check=False).stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def replace_previous(repo, pr):
    for cid in ids("repos/%s/pulls/%s/comments" % (repo, pr)):
        gh(["-X", "DELETE", "repos/%s/pulls/comments/%s" % (repo, cid)], check=False)
    for rid in ids("repos/%s/pulls/%s/reviews" % (repo, pr)):
        gh(["-X", "PUT", "repos/%s/pulls/%s/reviews/%s" % (repo, pr, rid)],
           payload={"body": "_Superseded by a newer Droid walkthrough below._\n\n" + SUPERSEDED}, check=False)


def cmd_post():
    cfg = load_config()
    data = read_json("validated.json")
    data["comments"] = normalize(data.get("comments"))
    diff = parse_diff()
    cache = {}
    placed, unplaced = [], []
    for c in data["comments"]:
        if is_excluded(c["path"], cfg):
            continue
        if c["path"] not in cache:
            p = run(["git", "show", "%s:%s" % (HEAD, c["path"])], check=False)
            cache[c["path"]] = p.stdout.splitlines() if p.returncode == 0 else None
        spot = place(c, diff.get(c["path"]), cache[c["path"]], cfg["max_comment_span"])
        if spot:
            c["start_line"], c["end_line"] = spot
            c["placed"] = True
            placed.append(c)
        else:
            unplaced.append(c)

    counts = dict((t, 0) for t in TIERS)
    for c in placed + unplaced:
        counts[c["tier"]] += 1
    # Stable sort: within a tier, keep the validator's most-important-first order.
    placed.sort(key=lambda c: TIERS.index(c["tier"]))
    inline, rest = [], list(unplaced)
    for c in placed:
        overlaps = any(o["path"] == c["path"] and o["start_line"] <= c["end_line"] and c["start_line"] <= o["end_line"]
                       for o in inline)
        if c["tier"] in cfg["post_inline"] and len(inline) < int(cfg["max_inline_comments"]) and not overlaps:
            inline.append(c)
        else:
            rest.append(c)

    def gh_comment(c):
        item = {"path": c["path"], "body": comment_body(c), "line": c["end_line"], "side": "RIGHT"}
        if c["start_line"] < c["end_line"]:
            item["start_line"], item["start_side"] = c["start_line"], "RIGHT"
        return item

    payload = {"commit_id": HEAD, "event": "COMMENT",
               "body": review_body(data.get("summary") or {}, inline, rest, cfg, counts),
               "comments": [gh_comment(c) for c in inline]}
    write_json("payload.json", payload)
    print("posting: %d inline comments, %d in summary only, %d could not be placed on the diff"
          % (len(inline), len(rest) - len(unplaced), len(unplaced)))

    usage = {}
    try:
        usage = read_json("usage.json")
    except (IOError, ValueError):
        pass
    credits = sum(v.get("factory_credits", 0) for v in usage.values())
    step_summary("### Droid PR walkthrough\n\n- Inline comments: %d\n- Summary-only items: %d\n"
                 "- Dropped by validator: %d\n- Factory credits used: %s\n"
                 % (len(inline), len(rest), len(data.get("dropped") or []), credits))

    if os.environ.get("WT_DRY_RUN") == "1":
        print("dry run: payload written to %s" % wt_path("payload.json"))
        return
    repo, pr = os.environ["GITHUB_REPOSITORY"], os.environ["PR_NUMBER"]
    if cfg.get("replace_previous"):
        replace_previous(repo, pr)
    p = gh(["-X", "POST", "repos/%s/pulls/%s/reviews" % (repo, pr)], payload=payload, check=False)
    if p.returncode != 0:
        # One rejected comment position fails the whole review, so fall back to a summary-only review.
        print("::warning::GitHub rejected the inline comments (%s); posting the summary only" % p.stderr.strip()[:500])
        payload["body"] = review_body(data.get("summary") or {}, [], inline + rest, cfg, counts)
        payload["comments"] = []
        gh(["-X", "POST", "repos/%s/pulls/%s/reviews" % (repo, pr)], payload=payload)
    if os.environ.get("EVENT_ACTION") == "labeled":
        gh(["-X", "DELETE", "repos/%s/issues/%s/labels/droid-walkthrough" % (repo, pr)], check=False)


if __name__ == "__main__":
    commands = {"size": cmd_size, "pass1": cmd_pass1, "pass2": cmd_pass2, "post": cmd_post}
    if len(sys.argv) != 2 or sys.argv[1] not in commands:
        die("usage: walkthrough.py size|pass1|pass2|post")
    if not BASE or not HEAD:
        die("BASE_SHA and HEAD_SHA must be set")
    commands[sys.argv[1]]()
