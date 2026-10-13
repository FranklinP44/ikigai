// Fails when AGENTS.md drifts from the repository. Checks that:
// - every `npm run <script>` it mentions exists in package.json,
// - every package.json script and every `npm run` step in CI is documented in it,
// - every file path it cites in inline code exists,
// - every identifier, CSS name, attribute, or lint rule it cites in inline code still appears in
//   the source or config files.
// Usage: node scripts/check-agents-md.mjs [path-to-doc]   (defaults to AGENTS.md)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DOC_PATH = resolve(process.argv[2] ?? join(ROOT, "AGENTS.md"));
const DOC_NAME = relative(ROOT, DOC_PATH).startsWith("..") ? DOC_PATH : relative(ROOT, DOC_PATH);

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build"]);
const PATH_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yml",
  ".yaml",
  ".html",
  ".css",
]);
// npm runs these itself, so they are not commands a contributor needs to know.
const LIFECYCLE_SCRIPTS = new Set([
  "prepare",
  "preinstall",
  "install",
  "postinstall",
  "prepack",
  "postpack",
]);
const CORPUS_FILES = [
  "index.html",
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "vitest.config.ts",
  ".oxlintrc.json",
  ".oxfmtrc.json",
  ".husky/pre-commit",
];
const CORPUS_DIRS = ["src/"];

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (SKIP_DIRS.has(entry.name)) return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [relative(ROOT, full).split("\\").join("/")];
  });
}

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const readRepoFile = rel => readFileSync(join(ROOT, rel), "utf8");

const repoFiles = listFiles(ROOT);
const doc = readFileSync(DOC_PATH, "utf8");
const scripts = Object.keys(JSON.parse(readRepoFile("package.json")).scripts ?? {});
const corpus = [
  ...CORPUS_FILES.filter(file => existsSync(join(ROOT, file))),
  ...repoFiles.filter(file => CORPUS_DIRS.some(dir => file.startsWith(dir))),
]
  .map(readRepoFile)
  .join("\n");

const errors = [];
const counts = { scripts: 0, paths: 0, names: 0 };
const lineOf = index => doc.slice(0, index).split("\n").length;
const fail = (index, message) => errors.push(`${DOC_NAME}:${lineOf(index)}: ${message}`);

// Commands: AGENTS.md and package.json scripts must match in both directions.
const documentedScripts = new Set();
for (const match of doc.matchAll(/npm run ([\w:-]+)/g)) {
  const name = match[1];
  documentedScripts.add(name);
  counts.scripts += 1;
  if (!scripts.includes(name))
    fail(match.index, `"npm run ${name}" is not a script in package.json`);
}
for (const name of scripts) {
  if (!LIFECYCLE_SCRIPTS.has(name) && !documentedScripts.has(name)) {
    errors.push(`${DOC_NAME}: package.json script "${name}" is not documented`);
  }
}
for (const workflow of repoFiles.filter(file => /^\.github\/workflows\/.+\.ya?ml$/.test(file))) {
  for (const match of readRepoFile(workflow).matchAll(/npm run ([\w:-]+)/g)) {
    if (!documentedScripts.has(match[1])) {
      errors.push(
        `${workflow}: CI runs "npm run ${match[1]}", which ${DOC_NAME} does not document`,
      );
    }
  }
}

function isRepoPath(token) {
  if (PATH_EXTENSIONS.has(extname(token))) return true;
  return token.includes("/") && existsSync(join(ROOT, token.split("/")[0]));
}

function checkPath(token, index) {
  counts.paths += 1;
  const found = token.includes("/")
    ? existsSync(join(ROOT, token))
    : existsSync(join(ROOT, token)) || repoFiles.some(file => basename(file) === token);
  if (!found) fail(index, `path \`${token}\` does not exist`);
}

function checkName(name, token, index) {
  counts.names += 1;
  const escaped = escapeRegExp(name);
  const whole = new RegExp(`(?<![\\w$-])${escaped}(?![\\w$-])`);
  // A capitalized token may name a suffix convention (`El`, `Key`), so a camelCase ending counts.
  const suffix = /^[A-Z]/.test(name) && new RegExp(`(?<=[a-z0-9])${escaped}(?![\\w$-])`);
  if (!whole.test(corpus) && !(suffix && suffix.test(corpus)))
    fail(index, `\`${token}\` no longer appears in the source or config`);
}

// Inline code outside fenced blocks. Fences are blanked out so match offsets keep their lines.
const prose = doc.replace(/```[\s\S]*?```/g, block => block.replace(/[^\n]/g, " "));
for (const match of prose.matchAll(/`([^`\n]+)`/g)) {
  const token = match[1].trim();
  const call = /^([A-Za-z_$][\w$]*)\(.*\)$/.exec(token);
  const attribute = /^([a-z][\w-]*)=/.exec(token);
  if (call) checkName(call[1], token, match.index);
  else if (/\s/.test(token) || token.startsWith("-")) continue; // commands, phrases, CLI flags
  else if (isRepoPath(token)) checkPath(token, match.index);
  else if (attribute) checkName(attribute[1], token, match.index);
  else if (/^\.?[A-Za-z_$][\w$-]*$/.test(token))
    checkName(token.replace(/^\./, ""), token, match.index);
  else if (/^[\w@-]+(\/[\w-]+)+$/.test(token)) {
    counts.names += 1;
    if (!corpus.includes(token)) fail(match.index, `\`${token}\` no longer appears in the config`);
  }
}

if (errors.length > 0) {
  console.error(`${DOC_NAME} is out of date with the repository:`);
  for (const error of errors) console.error(`  ${error}`);
  console.error(`Update ${DOC_NAME} (or the code) so they agree.`);
  process.exit(1);
}
console.log(
  `${DOC_NAME} OK: ${counts.scripts} commands, ${counts.paths} paths, ${counts.names} names checked.`,
);
