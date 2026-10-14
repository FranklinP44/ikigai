import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkQaReportFile, evaluateQaReport } from "./check-qa-report.mjs";

const HEADER = "| # | Test Case | App | Persona | Result | Notes |";
const SEPARATOR = "| --- | --- | --- | --- | --- | --- |";
const LEGEND =
  "Result values: :white_check_mark: PASS, :x: FAIL, :no_entry: BLOCKED, :warning: FLAKY, :grey_question: INCONCLUSIVE";
const row = (status = ":white_check_mark: PASS", id = "1", notes = "Verified") =>
  `| ${id} | Hover updates the panel | web | visitor | ${status} | ${notes} |`;
const report = (rows = row(), tail = LEGEND) =>
  `## QA Report\n\n${HEADER}\n${SEPARATOR}\n${rows}\n\n${tail}`;
const NO_APP_ROW =
  "| 1 | No app code changed -- QA not applicable for this diff. | N/A | N/A | :grey_question: INCONCLUSIVE | No browser validation performed. |";

describe("evaluateQaReport", () => {
  it("accepts passing rows despite the normal failure legend", () => {
    expect(evaluateQaReport(report()).passed).toBe(true);
  });

  it("ignores FAIL and BLOCKED in Notes, prose, evidence and unrelated tables", () => {
    const tail = `${LEGEND}\n\nFAIL and BLOCKED are documented outcomes.\n\n### Evidence\n\n${HEADER}\n${SEPARATOR}\n${row(":x: FAIL")}\n\n<details>\nBLOCKED example\n</details>`;
    expect(
      evaluateQaReport(report(row(":white_check_mark: PASS", "1", "FAIL / BLOCKED examples"), tail))
        .passed,
    ).toBe(true);
  });

  it.each([
    "PASS",
    "✅ PASS",
    "**:white_check_mark: PASS**",
    ":white_check_mark: **PASS**",
    "__PASS__",
  ])("accepts the passing marker %s", status => {
    expect(evaluateQaReport(report(row(status))).passed).toBe(true);
  });

  it.each([
    "FAIL",
    ":x: FAIL",
    "❌ FAIL",
    "**❌ FAIL**",
    ":x: **FAIL**",
    "BLOCKED",
    ":no_entry: BLOCKED",
    "⛔ BLOCKED",
    "🚫 BLOCKED",
    "**:no_entry: BLOCKED**",
  ])("fails for the actual Result cell %s", status => {
    expect(evaluateQaReport(report(row(status))).passed).toBe(false);
  });

  it.each([":x: FAIL", ":no_entry: BLOCKED"])("fails mixed PASS and %s rows", status => {
    expect(evaluateQaReport(report(`${row()}\n${row(status, "2")}`)).passed).toBe(false);
  });

  it.each(["FLAKY", ":warning: FLAKY", "⚠️ FLAKY", "⚠ FLAKY"])(
    "accepts the known flaky result %s",
    status => {
      expect(evaluateQaReport(report(row(status))).passed).toBe(true);
    },
  );

  it("accepts only the documented no-app-diff row without claiming browser validation", () => {
    const result = evaluateQaReport(report(NO_APP_ROW));
    expect(result.passed).toBe(true);
    expect(result.message).toContain("no browser validation performed");
  });

  it.each([
    row(":grey_question: INCONCLUSIVE"),
    NO_APP_ROW.replace("N/A", "web"),
    NO_APP_ROW.replace("| 1 |", "| 2 |"),
    NO_APP_ROW.replace("No browser validation performed.", "Browser smoke passed"),
    `${NO_APP_ROW}\n${row("PASS", "2")}`,
  ])("rejects an unsupported INCONCLUSIVE report row %s", rows => {
    expect(evaluateQaReport(report(rows)).passed).toBe(false);
  });

  it.each([
    ["empty", ""],
    ["legend only", LEGEND],
    ["heading plus legend", `## QA Report\n\n${LEGEND}`],
    ["no heading", report().replace("## QA Report", "QA Report")],
    ["wrong heading order", `Setup succeeded\n${report()}`],
    ["missing header", report().replace(`${HEADER}\n`, "")],
    ["wrong header", report().replace("| Persona |", "| Person |")],
    ["missing separator", report().replace(`${SEPARATOR}\n`, "")],
    ["invalid separator", report().replace(SEPARATOR, "| - | - | - | - | - | - |")],
    ["header only", report("")],
    ["placeholder only", report("{{TEST_ROWS}}")],
    ["unresolved row placeholder", report(row("PASS", "1", "{{NOTES}}"))],
    ["unknown status", report(row("SKIPPED"))],
    ["mismatched emoji", report(row(":x: PASS"))],
    ["status with extra text", report(row("PASS but blocked"))],
    ["missing result", report(row(""))],
    ["missing test case", report(row().replace("Hover updates the panel", ""))],
    ["too many cells", report(row().replace("Verified", "Verified | extra"))],
    ["too few cells", report(row().replace("| web | visitor", "| visitor"))],
    ["invalid row id", report(row("PASS", "abc"))],
    ["zero row id", report(row("PASS", "0"))],
    ["negative row id", report(row("PASS", "-1"))],
    ["unsafe row id", report(row("PASS", "999999999999999999"))],
    ["duplicate row id", report(`${row()}\n${row()}`)],
    ["fragmented table", report(`${row()}\n\n${row("BLOCKED", "2")}`)],
    [
      "fragmented table with prose",
      report(`${row()}\n\nInterrupted row\n\n${row("BLOCKED", "2")}`),
    ],
    ["missing outer pipe", report(`${row()}\n${row("BLOCKED", "2").slice(1)}`)],
  ])("fails closed for %s", (_name, text) => {
    expect(evaluateQaReport(text).passed).toBe(false);
  });

  it("accepts escaped pipes and emphasis in notes without changing the Result", () => {
    expect(evaluateQaReport(report(row("PASS", "1", "Example FAIL \\| **BLOCKED**"))).passed).toBe(
      true,
    );
  });

  it("accepts aligned separators and Windows line endings", () => {
    const text = report()
      .replace(SEPARATOR, "| :--- | ---: | :---: | --- | --- | --- |")
      .replaceAll("\n", "\r\n");
    expect(evaluateQaReport(text).passed).toBe(true);
  });

  it.each(["failure", "cancelled", "skipped", ""])(
    "fails a valid PASS report when the QA process outcome is %s",
    outcome => {
      expect(evaluateQaReport(report(), outcome).passed).toBe(false);
    },
  );
});

describe("checkQaReportFile", () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "ikigai-qa-gate-"));
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("fails closed for a missing report", () => {
    expect(checkQaReportFile(join(dir, "missing.md")).passed).toBe(false);
  });

  it.each([
    ["PASS", "success", 0],
    ["PASS", "failure", 1],
    ["BLOCKED", "success", 1],
    ["FAIL", "success", 1],
  ])("propagates CLI status for %s rows with process outcome %s", (status, outcome, code) => {
    const file = join(dir, `${status}-${outcome}.md`);
    writeFileSync(file, report(row(status)));
    const cli = fileURLToPath(new URL("./check-qa-report.mjs", import.meta.url));
    const result = spawnSync(process.execPath, [cli, file, outcome], { encoding: "utf8" });
    expect(result.status).toBe(code);
  });
});
