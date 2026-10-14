import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const HEADER = ["#", "Test Case", "App", "Persona", "Result", "Notes"];
const MARKERS = {
  PASS: [":white_check_mark:", "✅"],
  FAIL: [":x:", "❌"],
  BLOCKED: [":no_entry:", ":no_entry_sign:", "⛔", "🚫"],
  FLAKY: [":warning:", "⚠️", "⚠"],
  INCONCLUSIVE: [":grey_question:", "❔"],
};
const NO_APP_CHANGE = "No app code changed -- QA not applicable for this diff.";

function cellsOf(line) {
  const row = line.trim();
  if (!row.startsWith("|") || !row.endsWith("|")) throw new Error("Malformed table row");
  const cells = [];
  let cell = "";
  for (let i = 1; i < row.length - 1; i += 1) {
    if (row[i] === "\\" && row[i + 1] === "|") {
      cell += "|";
      i += 1;
    } else if (row[i] === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += row[i];
    }
  }
  cells.push(cell.trim());
  if (cells.length !== HEADER.length) throw new Error("Expected six table cells");
  return cells;
}

function withoutEmphasis(value) {
  let text = value.trim();
  for (const marker of ["**", "__", "*", "_"]) {
    if (text.startsWith(marker) && text.endsWith(marker) && text.length > marker.length * 2) {
      text = withoutEmphasis(text.slice(marker.length, -marker.length));
    }
  }
  return text;
}

function statusOf(value) {
  const text = withoutEmphasis(value);
  for (const [status, markers] of Object.entries(MARKERS)) {
    if (text === status) return status;
    for (const marker of markers) {
      if (text.startsWith(`${marker} `) && withoutEmphasis(text.slice(marker.length)) === status) {
        return status;
      }
    }
  }
  throw new Error("Unknown or mismatched Result status");
}

function parseReport(report) {
  if (typeof report !== "string" || !report.trim()) throw new Error("Missing or empty report");
  if (/\{\{[\s\S]*?\}\}/.test(report)) throw new Error("Unresolved report template placeholder");
  const lines = report.trim().split(/\r?\n/);
  if (lines.shift().trim() !== "## QA Report") throw new Error("Missing QA Report heading");
  while (lines[0]?.trim() === "") lines.shift();
  const header = cellsOf(lines.shift() ?? "");
  if (!HEADER.every((value, i) => header[i] === value)) throw new Error("Invalid results header");
  if (!cellsOf(lines.shift() ?? "").every(value => /^:?-{3,}:?$/.test(value))) {
    throw new Error("Invalid table separator");
  }

  const rows = [];
  const ids = new Set();
  while (lines[0]?.trim().startsWith("|")) {
    const cells = cellsOf(lines.shift());
    const [id, testCase, app, persona, result, notes] = cells;
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || ids.has(id)) {
      throw new Error("Invalid or duplicate row id");
    }
    if (!testCase || !app || !persona || !result) throw new Error("Incomplete test row");
    ids.add(id);
    rows.push({ id, testCase, app, persona, status: statusOf(result), notes });
  }
  if (!rows.length) throw new Error("No test results");
  for (const line of lines) {
    const text = line.trim();
    if (/^#{1,6}\s|^<details(?:\s|>)/.test(text)) break;
    if (text.startsWith("|") || /^[^|]+\|(?:[^|]*\|){3,}/.test(text)) {
      throw new Error("Malformed or fragmented results table");
    }
  }
  const inconclusive = rows.filter(row => row.status === "INCONCLUSIVE");
  if (
    inconclusive.length &&
    (rows.length !== 1 ||
      inconclusive[0].id !== "1" ||
      inconclusive[0].testCase !== NO_APP_CHANGE ||
      inconclusive[0].app !== "N/A" ||
      inconclusive[0].persona !== "N/A" ||
      inconclusive[0].notes !== "No browser validation performed.")
  ) {
    throw new Error("INCONCLUSIVE is only allowed for the documented no-app-diff row");
  }
  return rows;
}

export function evaluateQaReport(report, processOutcome = "success") {
  try {
    const rows = parseReport(report);
    const failed = rows.filter(row => row.status === "FAIL" || row.status === "BLOCKED");
    const processFailed = processOutcome !== "success";
    return {
      passed: !processFailed && failed.length === 0,
      message: processFailed
        ? `QA process did not succeed (${processOutcome}); ${failed.length} FAIL/BLOCKED rows`
        : failed.length
          ? `QA reported ${failed.length} FAIL/BLOCKED rows`
          : rows[0].status === "INCONCLUSIVE"
            ? "QA not applicable: no app diff; no browser validation performed"
            : `QA report accepted: ${rows.length} test results`,
      rows,
    };
  } catch (error) {
    return { passed: false, message: `Invalid QA report: ${error.message}`, rows: [] };
  }
}

export function checkQaReportFile(path, processOutcome = "success") {
  let report;
  try {
    report = readFileSync(path, "utf8");
  } catch {
    return { passed: false, message: "QA report could not be read", rows: [] };
  }
  return evaluateQaReport(report, processOutcome);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkQaReportFile(process.argv[2], process.argv[3] ?? "success");
  console.log(result.message);
  if (!result.passed) process.exitCode = 1;
}
