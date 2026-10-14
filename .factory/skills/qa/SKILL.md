---
name: qa
description: >
  Run QA tests for Ikigai. Analyzes git diff to determine affected areas,
  runs configured test flows with the visitor persona, and generates diff-targeted tests.
  Uses droid-control for browser interactions.
  Use when testing PRs, releases, or smoke testing environments.
---

# QA Orchestrator

**SCOPE: This skill performs manual/functional QA only -- verifying that the application actually works by interacting with it as a real user would (in a browser). Do NOT run or report on CI checks, linting, Oxlint, Oxfmt, typecheck, unit tests, coverage, or any static analysis. Those are handled by `.github/workflows/deploy-pages.yml`.**

**Never silently skip a flow. If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it.**

## Step 1: Load Configuration

Read `.factory/skills/qa/config.yaml` for environment URLs, personas, and app definitions. It is the single source of truth; re-read it on every run.

For every affected interactive app, invoke the `droid-control` skill before interacting with the app. Follow its routing tables:

- Load the target driver selected for the app (the web app uses the browser-use route, driven by agent-browser).
- Use the Capture and Verify stages on every run.
- Load Compose only when both `video_evidence: true` and `droid_control.compose: true`.
- When `droid_control.compose: false`, never invoke Compose. Keep raw captures and text snapshots as evidence.

Treat `droid_control.compose` as a runtime toggle. Read it on every run; do not cache an earlier value. Keep every branch below conditional on the config values so that editing the config is enough to change behavior.

## Step 2: Determine Target Environment

Use `default_target` from config unless the user names a different environment. Respect every entry in that environment's `restrictions`.

- `local` (default): the Vite dev server started from the checked-out branch.
- `preview`: the production build served locally by `vite preview`. This is NOT a hosted preview deployment; the project has none.
- `production`: GitHub Pages. Read-only, and never the target for a pull request run or a CI run, because it serves `main`, not the branch under test. Use it only when the user explicitly asks for a production smoke check outside CI.

In CI (`CI=true`), always use `local`, plus `preview` for the built-page flow. If the local server cannot start, report the flows as BLOCKED. Never fall back to the production URL.

## Step 3: Analyze Git Diff

Determine the diff base: use the base the caller gives (CI passes `origin/<base-branch>`); otherwise use `origin/main`. Run `git diff --name-only <base>...HEAD`, and also include uncommitted changes (`git diff --name-only HEAD`) when running locally. Then read the full diff of the matched files.

Map changed files to apps with each app's `path_patterns`, then drop files that match its `exclude_patterns`. Files that match no app (for example `.factory/skills/**`, `droid-wiki/**`, `.github/**`, `scripts/**`, `README.md`, `AGENTS.md`, `vitest.config.ts`, or unit tests under `src/**/*.test.ts`) are NOT associated with any app. Do NOT run app test flows for them.

For each affected app:

- Run ONLY that app's relevant flows from its sub-skill.
- Generate ADDITIONAL targeted tests based on the specific changes in the diff.

For apps NOT affected by the diff, do not load their sub-skill, run their flows, or run their pre-flight checks.

If NO app is affected by the diff (docs-only, CI-only, test-only, or config-only changes), report a single INCONCLUSIVE row: "No app code changed -- QA not applicable for this diff." Do NOT run any app flows.

## Step 4: Pre-flight Checks (affected apps only)

For the `web` app:

- `droid-control@factory-plugins` is active (`droid plugin list --scope project`).
- `node_modules` exists; if not, run `npm ci`.
- The dev server starts and answers on the configured `local` URL, as described in the qa-web sub-skill's Testing Target section.
- Compose prerequisites from the droid-control skill, only when `video_evidence: true` and `droid_control.compose: true`. Let the droid-control Compose stage resolve its own plugin root and install its renderer dependencies when they are missing. Never install them when Compose is off.

The project has no preview deployments, so the qa-web sub-skill always starts a local server from the branch code (Strategy 2: local dev server). If a pre-flight check fails, report the affected flows as BLOCKED with the specific error and remediation steps.

## Step 5: Execute Diff-Relevant Flows Only

For each affected app, read its sub-skill from `.factory/skills/qa-<app-name>/SKILL.md`. The sub-skill contains a MENU of test flows, not a checklist. You must:

1. Read the diff carefully and identify which flows are relevant to the change.
2. Run those flows PLUS adjacent flows that verify the change integrates correctly (for example, a changed zone description should also be checked through the matching Explore pill, not only by hovering).
3. Do NOT run unrelated flows.
4. If no existing flow covers the change, write a NEW ad-hoc test that directly verifies the changed behavior.
5. Do NOT run unit tests, lint, typecheck, or any automated test suite.

The only persona is `visitor` (anonymous). There are no permission boundaries to test, so do not invent negative permission tests; use boundary and error-path checks from the sub-skill instead.

## Step 6: Evidence Capture

Generate a unique `RUN_ID` (for example `RUN_ID="$(date +%s)-$$"`) and save all files under `./qa-results/$RUN_ID/`. After each significant test step, capture evidence. Use **text snapshots as primary evidence**; they render inline in the PR comment.

For the web app (agent-browser):

- Use the `droid-control` web route; let its browser-use atom own browser mechanics and its Capture atom own the recording lifecycle.
- Capture the relevant part of the page's accessibility tree or the panel's text as evidence through the routed driver.
- Save screenshot files to `./qa-results/$RUN_ID/` for the artifact upload.
- When `video_evidence: false` (or when an upload fails): do NOT embed `![image](url)` markdown in the report; artifact and repository URLs cannot be displayed inline in GitHub PR comments. Mention the filename and note that it is in the downloadable artifacts.

**Video evidence (only when `video_evidence: true` in config.yaml):**

1. Follow the droid-control Capture atom for recording start, interactions, recording stop, and raw-output verification.
2. Record exactly one video per flow, never one video for the whole run.
3. If `droid_control.compose: false`, keep the driver's raw WebM. Upload it only when it is a verified playable video.
4. If `droid_control.compose: true`, hand the raw recording to the droid-control Compose atom and render `./qa-results/$RUN_ID/<flow-slug>.mp4`.
   - Use a `single` layout and pass the literal `"preset": "factory"` to Compose. Do not offer, select, or permit any other preset.
   - Trim dead time, add a concise title card, and use annotations only when they clarify the proof.
   - Keep the final video at 60 seconds or less, and verify it with the Compose atom's finalization checks before upload.
5. Verify the evidence file exists and is non-empty. If capture or Compose fails, retry that stage once; if it still fails, fall back to text evidence and keep any raw capture in the artifacts.
6. Upload each video through GitHub's user-attachments endpoint (undocumented; trust the live response over this text):

   ```bash
   REPO_ID="${REPO_ID:-$(gh api "repos/$GITHUB_REPOSITORY" --jq .id)}"
   curl -sS --fail-with-body --request POST \
     --header "Authorization: Bearer $QA_EVIDENCE_TOKEN" \
     --header "Content-Type: application/octet-stream" \
     --header "Accept: application/json" \
     --header "X-GitHub-Api-Version: 2022-11-28" \
     "https://uploads.github.com/user-attachments/assets?name=<evidence-file>&content_type=<url-encoded-content-type>&repository_id=$REPO_ID" \
     --data-binary "@./qa-results/$RUN_ID/<evidence-file>" \
   | jq -e '.url'
   ```

   The endpoint accepts only classic PATs with `repo` scope (or OAuth user tokens). A 404 with a valid `repository_id` means an installation token such as `GITHUB_TOKEN`; 403 `Resource not accessible by personal access token` means a fine-grained PAT; 403 `Resource protected by organization SAML enforcement` means the classic PAT needs SSO authorization. If `QA_EVIDENCE_TOKEN` is unset, skip uploads and use text evidence.

   Use the raw WebM's filename and `video/webm` when Compose is off, and `<flow-slug>.mp4` with `video/mp4` when Compose is on.

7. Put the returned `url` on its own line in the Evidence section, directly under the flow's label, with nothing else on that line. NEVER wrap a video URL in `![name](url)`; that stops GitHub from rendering the player.
8. Screenshots (`.png`) can be uploaded the same way and DO use image markdown: `![name](asset-url)`.
9. If an upload fails, fall back to text evidence and note the filename is in the artifacts. Never embed a link that did not come back from the upload API.

Evidence quality rules:

- Focus on the RELEVANT content. Trim snapshots to the meaningful part (usually the panel text, the active pill, and the active zone).
- Label each snapshot clearly: what it shows and why it matters for the test.
- NEVER embed broken image links.
- The workflow uploads everything in `./qa-results/` as a downloadable artifact; reference that for visual evidence.

## Step 7: Test Quality Gate

1. CHANGE-SPECIFIC FIRST. At least half the tests must directly verify the behavioral change in the diff.
2. INTEGRATION TESTS ARE VALID. Tests that check the change works with existing behavior (hover, pin, pills, keyboard, built page) are not smoke tests.
3. NO UNRELATED FLOWS.
4. NO AUTOMATED TEST SUITES. Do NOT run vitest, `npm test`, or any CI-style check.
5. NEGATIVE TESTS. Include at least 1 test of a boundary or error path related to the change (for example, hovering outside every circle, or clicking outside every circle).
6. INTERACTIVE TESTING. Use real pointer moves, clicks, and key presses through droid-control, not JavaScript that calls the app's handlers.
7. INCONCLUSIVE IF UNSURE. If you cannot articulate what the PR changes, mark it INCONCLUSIVE rather than PASS.

## Step 8: Handle Failures

**Never silently skip a flow.** If a flow cannot complete, report it as BLOCKED with what was tried and how the user can fix it. Then continue to the next flow; never abort the whole run for a single failure. Stop any dev or preview server the run started before finishing.

## Step 9: Generate Report

Write the report to `./qa-results/report.md` using `.factory/skills/qa/REPORT-TEMPLATE.md`. Key rules:

- Start with the `## QA Report` heading followed by the test results table.
- The Result column MUST use emojis: :white_check_mark: PASS, :x: FAIL, :no_entry: BLOCKED, :warning: FLAKY, :grey_question: INCONCLUSIVE. The workflow fails the check when a table row contains `:x: FAIL`.
- Keep it CONCISE: the table, a short "Action Required" section (if any), and the collapsed evidence block are the entire report.
- Do NOT include a "Behavioral Change Summary", "Blocked Flows" prose, an "Info" metadata table, or a long explanation of the diff.
- Do NOT report setup steps (installing, building, starting servers) as test rows. Only report rows that verify user-facing behavior or the specific change.
- Put ALL evidence in a single collapsed `<details>` block. Embed text snapshots as labeled fenced code blocks (for example `### Snapshot 1: Panel after hovering Passion`).
- With `video_evidence: false`, or for any flow whose upload failed: reference screenshot filenames as artifacts, with no `![image](url)` markdown.
- With `video_evidence: true`: put each returned user-attachments video URL on its own bare line; screenshots use `![name](asset-url)`.

## Step 10: Suggest Skill Updates (Failure Learning)

After generating the report, check whether any BLOCKED or FAIL result revealed a **testing environment insight** that would help future runs and is not already in the sub-skill's Known Failure Modes. This is about how the environment behaves, NOT about bad selectors, skill typos, or behavior the PR intentionally changed.

Good suggestions:

- "Port 5173 is already taken on the runner; start Vite with a free port and pass the URL to the flows"
- "Google Fonts requests are blocked in the sandbox; treat font network errors as environment noise"
- "agent-browser needs its bundled Chromium installed before the first run on this runner image"

Bad suggestions (fix these directly instead): a selector that does not exist, or button text that the PR changed on purpose.

Format:

## Suggested Skill Updates (N issues found)

| #   | Severity        | File     | Issue               | Fix Prompt                                                                           |
| --- | --------------- | -------- | ------------------- | ------------------------------------------------------------------------------------ |
| 1   | <emoji> <level> | `<file>` | <short description> | <details><summary>Copy</summary><br>`<full droid prompt to fix the issue>`</details> |

Severity levels:

- `🔴 Breaking`: causes test failures every run (wrong URL, missing required step).
- `🟡 Degraded`: causes intermittent failures or suboptimal behavior (timing, blocked fonts).
- `🔵 Info`: new knowledge that improves future runs without causing failures.

Each Fix Prompt must be a self-contained instruction that Droid can run when pasted, naming the target file (for example `.factory/skills/qa-web/SKILL.md`) and the section to append to (`Known Failure Modes`). Omit this section entirely when there are no genuinely new insights.

Read `failure_learning` from config.yaml:

- `suggest_in_report`: include the table in the report only. Do NOT write `qa-results/skill-updates.json`.
- `auto_commit` or `open_pr`: also write `qa-results/skill-updates.json` as an array of `{ "file", "section", "action": "append" | "replace", "content" }` edits. The current workflow has no step that applies this file, so add a note under Action Required that the edits must be applied by hand until such a step is added.
