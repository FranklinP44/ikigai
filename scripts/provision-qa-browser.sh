#!/usr/bin/env bash
set -euo pipefail

if [ -z "${FACTORY_API_KEY:-}" ]; then
  echo '::error::FACTORY_API_KEY is unavailable; browser provisioning cannot install the QA plugin.'
  exit 1
fi
droid --version
droid plugin marketplace add https://github.com/Factory-AI/factory-plugins
droid plugin install droid-control@factory-plugins --scope project
droid plugin list --scope project > "$RUNNER_TEMP/qa-plugins.txt"
cat "$RUNNER_TEMP/qa-plugins.txt"
awk '
  /^Active:$/ { active=1; next }
  /^Inactive:$/ { active=0 }
  active && $1=="droid-control@factory-plugins" && $2=="[project]" { found=1 }
  END { exit !found }' "$RUNNER_TEMP/qa-plugins.txt"

npm install --global agent-browser@0.37.1
driver="$(npm prefix --global)/bin/agent-browser"
"$driver" --version > "$RUNNER_TEMP/qa-driver-version.txt"
cat "$RUNNER_TEMP/qa-driver-version.txt"
grep -qx 'agent-browser 0.37.1' "$RUNNER_TEMP/qa-driver-version.txt"

# Clear provider, CDP, profile, state and attachment overrides; do not discover user config.
for variable in ${!AGENT_BROWSER_@}; do unset "$variable"; done
export AGENT_BROWSER_CONFIG="$RUNNER_TEMP/qa-agent-browser.json"
printf '{}\n' > "$AGENT_BROWSER_CONFIG"
"$driver" install --with-deps
shopt -s nullglob
browsers=("$HOME"/.agent-browser/browsers/chrome-*/chrome)
if [ "${#browsers[@]}" -ne 1 ] || [ ! -x "${browsers[0]}" ]; then
  echo '::error::Expected exactly one managed Chrome executable; refusing an ambiguous cache.'
  exit 1
fi
export AGENT_BROWSER_EXECUTABLE_PATH="${browsers[0]}"
"$AGENT_BROWSER_EXECUTABLE_PATH" --version
export AGENT_BROWSER_SESSION="qa-bootstrap-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
cleanup() {
  rc=$?
  trap - EXIT
  if ! timeout 15s "$driver" close; then
    [ "$rc" -ne 0 ] || rc=1
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
"$driver" open about:blank
"$driver" get url > "$RUNNER_TEMP/qa-browser-url.txt"
grep -qx about:blank "$RUNNER_TEMP/qa-browser-url.txt"
{
  echo "QA_AGENT_BROWSER=$driver"
  echo "QA_BROWSER_CONFIG=$AGENT_BROWSER_CONFIG"
  echo "QA_BROWSER_EXECUTABLE_PATH=$AGENT_BROWSER_EXECUTABLE_PATH"
} >> "$GITHUB_ENV"
