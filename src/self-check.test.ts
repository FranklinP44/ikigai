import { describe, expect, it } from "vitest";
import { ZONES, type ZoneKey } from "./data";
import {
  DEFAULT_SCORES,
  SCORE_MAX,
  THRESHOLD,
  clampScore,
  decodeScores,
  describeResult,
  encodeScores,
  nextStep,
  normalizeScores,
  parseStoredScores,
  zoneForScores,
  type Scores,
} from "./self-check";

function scores(l: number, g: number, n: number, p: number): Scores {
  return { L: l, G: g, N: n, P: p };
}

describe("clampScore", () => {
  it.each([
    [-3, 0],
    [0, 0],
    [4.4, 4],
    [4.6, 5],
    [10, 10],
    [42, 10],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])("turns %d into %d", (input, expected) => {
    expect(clampScore(input)).toBe(expected);
  });
});

describe("normalizeScores", () => {
  it("clamps numbers and falls back to the defaults for missing or non-numeric values", () => {
    expect(normalizeScores({ L: 12, G: "7", N: 3.6 })).toStrictEqual(scores(10, 5, 4, 5));
  });
});

describe("zoneForScores", () => {
  it.each<[string, Scores, ZoneKey | null]>([
    ["no strong circles", scores(5, 5, 5, 5), null],
    ["one strong circle", scores(8, 2, 2, 2), "L"],
    ["two neighboring circles", scores(8, 7, 2, 2), "LG"],
    ["three circles", scores(8, 7, 6, 2), "LGN"],
    ["all four circles", scores(6, 6, 6, 6), "LGNP"],
    ["opposite circles L and P, keeping the stronger", scores(6, 0, 0, 9), "P"],
    ["opposite circles G and N, keeping the stronger", scores(0, 9, 7, 0), "G"],
    ["a tie between opposite circles, keeping the later one", scores(7, 0, 0, 7), "P"],
  ])("returns the zone for %s", (_name, input, expected) => {
    expect(zoneForScores(input)).toBe(expected);
  });
});

describe("nextStep", () => {
  it("returns null when every circle is strong", () => {
    expect(nextStep(scores(9, 8, 7, 6))).toBeNull();
  });

  it.each<[Scores, string]>([
    [scores(9, 8, 5, 2), "N"],
    [scores(2, 8, 9, 5), "P"],
  ])("picks the missing circle closest to the threshold in %j", (input, circle) => {
    expect(nextStep(input)?.circle).toBe(circle);
  });

  it("reports the gap and the zone the step reaches", () => {
    expect(nextStep(scores(9, 8, 5, 2))).toStrictEqual({ circle: "N", gap: 1, zone: "LGN" });
  });

  it("reports the zone you would actually reach, even across opposite circles", () => {
    expect(nextStep(scores(0, 0, 0, 9))).toStrictEqual({ circle: "L", gap: THRESHOLD, zone: "P" });
  });
});

describe("describeResult", () => {
  it("explains a starting point with no strong circles", () => {
    expect(describeResult(scores(5, 5, 5, 5))).toStrictEqual({
      zone: null,
      headline: "Not in any circle yet",
      detail: "Raise “What you love” by 1 point to reach What you love.",
    });
  });

  it("names the current zone and pluralizes the gap", () => {
    const result = describeResult(scores(9, 8, 3, 1));
    expect(result.zone).toBe("LG");
    expect(result.headline).toBe(`You’re in ${ZONES.LG.title}`);
    expect(result.detail).toBe(
      `Raise “What the world needs” by 3 points to reach ${ZONES.LGN.title}.`,
    );
  });

  it("celebrates when all four circles are strong", () => {
    expect(describeResult(scores(6, 7, 8, 9)).detail).toBe(
      "All four circles are strong. That’s your ikigai.",
    );
  });
});

describe("encodeScores", () => {
  it("writes the scores in L-G-N-P order", () => {
    expect(encodeScores(scores(1, 2, 3, 10))).toBe("#check=1-2-3-10");
  });
});

describe("decodeScores", () => {
  it("round-trips encoded scores", () => {
    const input = scores(0, 6, 9, SCORE_MAX);
    expect(decodeScores(encodeScores(input))).toStrictEqual(input);
  });

  it.each([
    "",
    "#zone=LG",
    "#check=1-2-3",
    "#check=1-2-3-4-5",
    "#check=1-2-x-4",
    "#check=1-2-3-11",
  ])("rejects %j", hash => {
    expect(decodeScores(hash)).toBeNull();
  });
});

describe("parseStoredScores", () => {
  it("reads saved scores", () => {
    expect(parseStoredScores(JSON.stringify(scores(1, 2, 3, 4)))).toStrictEqual(scores(1, 2, 3, 4));
  });

  it.each([null, "", "not json", "[1,2,3,4]", "null", "7"])("ignores %j", raw => {
    expect(parseStoredScores(raw)).toBeNull();
  });

  it("fills missing circles with the defaults", () => {
    expect(parseStoredScores('{"L":9}')).toStrictEqual({ ...DEFAULT_SCORES, L: 9 });
  });
});
