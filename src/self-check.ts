import { CIRCLE, ORDER, ZONES, isZoneKey, type CircleKey, type ZoneKey } from "./data";

export type Scores = Record<CircleKey, number>;

export const SCORE_MIN = 0;
export const SCORE_MAX = 10;
// A circle counts toward your result once you rate it at least this high.
export const THRESHOLD = 6;
export const DEFAULT_SCORES: Readonly<Scores> = { L: 5, G: 5, N: 5, P: 5 };
export const STORAGE_KEY = "ikigai.self-check.v1";

const HASH_PREFIX = "#check=";

export interface NextStep {
  circle: CircleKey;
  gap: number;
  zone: ZoneKey;
}

export interface CheckResult {
  zone: ZoneKey | null;
  headline: string;
  detail: string;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return SCORE_MIN;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(value)));
}

export function normalizeScores(input: Partial<Record<CircleKey, unknown>>): Scores {
  const scores = { ...DEFAULT_SCORES };
  for (const k of ORDER) {
    const value = input[k];
    if (typeof value === "number") scores[k] = clampScore(value);
  }
  return scores;
}

function weakestOf(circles: readonly CircleKey[], scores: Scores): CircleKey {
  return circles.reduce((a, b) => (scores[b] < scores[a] ? b : a));
}

// Opposite circles (L and P, G and N) never overlap in the diagram, so a set of strong circles
// can have no region. Dropping the weakest circle always ends at a real zone, because every
// single circle is one.
function largestZone(circles: readonly CircleKey[], scores: Scores): ZoneKey {
  const key = circles.join("");
  if (isZoneKey(key)) return key;
  const weakest = weakestOf(circles, scores);
  return largestZone(
    circles.filter(k => k !== weakest),
    scores,
  );
}

export function zoneForScores(scores: Scores): ZoneKey | null {
  const strong = ORDER.filter(k => scores[k] >= THRESHOLD);
  return strong.length > 0 ? largestZone(strong, scores) : null;
}

// The cheapest move toward the center: the missing circle that is closest to the threshold.
export function nextStep(scores: Scores): NextStep | null {
  const missing = ORDER.filter(k => scores[k] < THRESHOLD);
  if (missing.length === 0) return null;
  const circle = missing.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  const raised = { ...scores, [circle]: THRESHOLD };
  const strong = ORDER.filter(k => raised[k] >= THRESHOLD);
  return { circle, gap: THRESHOLD - scores[circle], zone: largestZone(strong, raised) };
}

export function describeResult(scores: Scores): CheckResult {
  const zone = zoneForScores(scores);
  const step = nextStep(scores);
  const headline = zone ? `You’re in ${ZONES[zone].title}` : "Not in any circle yet";
  if (!step) {
    return { zone, headline, detail: "All four circles are strong. That’s your ikigai." };
  }
  const points = step.gap === 1 ? "1 point" : `${step.gap} points`;
  const detail = `Raise “${CIRCLE[step.circle].name}” by ${points} to reach ${ZONES[step.zone].title}.`;
  return { zone, headline, detail };
}

export function encodeScores(scores: Scores): string {
  return HASH_PREFIX + ORDER.map(k => scores[k]).join("-");
}

export function decodeScores(hash: string): Scores | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const parts = hash.slice(HASH_PREFIX.length).split("-");
  if (parts.length !== ORDER.length || parts.some(p => !/^\d{1,2}$/.test(p))) return null;
  const values = parts.map(Number);
  if (values.some(v => v > SCORE_MAX)) return null;
  const scores = { ...DEFAULT_SCORES };
  ORDER.forEach((k, i) => {
    scores[k] = values[i];
  });
  return scores;
}

export function parseStoredScores(raw: string | null): Scores | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  return normalizeScores(data);
}
