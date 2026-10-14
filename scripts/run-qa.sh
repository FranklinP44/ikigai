#!/usr/bin/env bash
set -euo pipefail

mkdir -p qa-results
if [ -z "${FACTORY_API_KEY:-}" ]; then
  echo '::error::FACTORY_API_KEY is not available. Add the repository secret; fork PRs do not receive it.'
  exit 1
fi
if [ "${VIDEO_EVIDENCE:-false}" != false ] || [ "${COMPOSE:-false}" != false ]; then
  echo '::error::CI QA permits text and screenshot evidence only; video and Compose must be false.'
  exit 1
fi
for variable in ${!AGENT_BROWSER_@}; do unset "$variable"; done
: "${QA_AGENT_BROWSER:?Missing provisioned driver}" "${QA_BROWSER_CONFIG:?Missing isolated config}" "${QA_BROWSER_EXECUTABLE_PATH:?Missing managed Chrome}"
[[ "$QA_AGENT_BROWSER" = /* && -x "$QA_AGENT_BROWSER" ]]
[[ "$QA_BROWSER_CONFIG" = /* && -f "$QA_BROWSER_CONFIG" ]]
[[ "$QA_BROWSER_EXECUTABLE_PATH" = /* && -x "$QA_BROWSER_EXECUTABLE_PATH" ]]
export AGENT_BROWSER_CONFIG="$QA_BROWSER_CONFIG"
export AGENT_BROWSER_EXECUTABLE_PATH="$QA_BROWSER_EXECUTABLE_PATH"
export AGENT_BROWSER_SESSION="qa-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
"$QA_AGENT_BROWSER" --version > "$RUNNER_TEMP/qa-driver-check.txt"
grep -qx 'agent-browser 0.37.1' "$RUNNER_TEMP/qa-driver-check.txt"
cleanup() {
  rc=$?
  trap - EXIT
  if ! timeout 15s "$QA_AGENT_BROWSER" close; then
    [ "$rc" -ne 0 ] || rc=1
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

prompt="Run the qa skill in non-interactive CI. There is no human: never use AskUser or wait for input. Compare origin/${BASE_REF}...HEAD. Follow the skill's diff targeting: when no app code changed, write only its documented INCONCLUSIVE no-app-diff row, never claim successful browser validation. For affected flows start this checkout's local Vite server, poll http://localhost:5173, and use local preview on port 4173 for the built-page flow. Never target production or fall back to any external app URL. Use droid-control for every real pointer/keyboard interaction. Every browser command MUST invoke the absolute executable in QA_AGENT_BROWSER, not bare agent-browser or npx. Preserve AGENT_BROWSER_SESSION, AGENT_BROWSER_CONFIG and AGENT_BROWSER_EXECUTABLE_PATH from this process; never attach via CDP/auto-connect, use system Chrome, install/upgrade tools, or close other sessions. Close only this named session and stop only servers you started. Read .factory/skills/qa/config.yaml. Capture text/screenshot evidence only: video_evidence=false, droid_control.compose=false; never record, render, or upload video. Write the final report to qa-results/report.md using the template's contiguous results table. FAIL and BLOCKED both fail the check; describe blocked flows honestly."
droid exec --cwd "$GITHUB_WORKSPACE" --auto high "$prompt" 2>&1 | tee qa-output.txt
