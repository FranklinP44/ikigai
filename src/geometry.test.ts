import { describe, expect, it } from "vitest";
import { ORDER, ZONE_KEYS, isZoneKey, type CircleKey, type ZoneKey } from "./data";
import { CENTERS, R, zoneAt } from "./geometry";

// The circles a point lies inside, in L-G-N-P order, without filtering to known zones.
function circlesAt(x: number, y: number): string {
  return ORDER.filter(k => Math.hypot(x - CENTERS[k][0], y - CENTERS[k][1]) <= R).join("");
}

// Every integer point in the square that bounds all four circles.
function* gridPoints(): Generator<[number, number]> {
  const xs = ORDER.map(k => CENTERS[k][0]);
  const ys = ORDER.map(k => CENTERS[k][1]);
  for (let x = Math.min(...xs) - R; x <= Math.max(...xs) + R; x += 1) {
    for (let y = Math.min(...ys) - R; y <= Math.max(...ys) + R; y += 1) yield [x, y];
  }
}

describe("CENTERS", () => {
  it("places the circles symmetrically around the diagram center", () => {
    expect(CENTERS.L[0]).toBe(CENTERS.P[0]);
    expect(CENTERS.G[1]).toBe(CENTERS.N[1]);
    expect((CENTERS.L[1] + CENTERS.P[1]) / 2).toBe(CENTERS.G[1]);
    expect((CENTERS.G[0] + CENTERS.N[0]) / 2).toBe(CENTERS.L[0]);
  });
});

describe("zoneAt", () => {
  it.each<[string, number, number, ZoneKey]>([
    ["the diagram center", 400, 400, "LGNP"],
    ["the top of the love circle", 400, 150, "L"],
    ["the left of the good-at circle", 160, 400, "G"],
    ["the right of the world-needs circle", 641, 400, "N"],
    ["the bottom of the paid-for circle", 400, 650, "P"],
    ["the Passion label", 282, 287, "LG"],
    ["the Mission label", 518, 287, "LN"],
    ["the Profession label", 282, 527, "GP"],
    ["the Vocation label", 518, 527, "NP"],
    ["the top dot", 400, 291, "LGN"],
    ["the right dot", 509, 400, "LNP"],
    ["the bottom dot", 400, 509, "GNP"],
    ["the left dot", 291, 400, "LGP"],
    ["the center of the love circle", 400, 270, "LGN"],
  ])("returns the zone at %s", (_name, x, y, expected) => {
    expect(zoneAt(x, y)).toBe(expected);
  });

  it.each([
    ["the top-left corner", 0, 0],
    ["the bottom-right corner", 800, 800],
    ["just above the love circle", CENTERS.L[0], CENTERS.L[1] - R - 1],
    ["between the love and good-at circles' outer edges", 180, 180],
  ])("returns null outside every circle, at %s", (_name, x, y) => {
    expect(zoneAt(x, y)).toBeNull();
  });

  // The outermost point of each circle, on the side facing away from the diagram center.
  it.each<[CircleKey, number, number]>([
    ["L", CENTERS.L[0], CENTERS.L[1] - R],
    ["G", CENTERS.G[0] - R, CENTERS.G[1]],
    ["N", CENTERS.N[0] + R, CENTERS.N[1]],
    ["P", CENTERS.P[0], CENTERS.P[1] + R],
  ])("counts a point exactly on the edge of %s as inside it", (key, x, y) => {
    expect(zoneAt(x, y)).toBe(key);
    expect(zoneAt(x + Math.sign(x - 400), y + Math.sign(y - 400))).toBeNull();
  });

  it("only produces combinations that are known zones, and reaches all of them", () => {
    const unknown = new Set<string>();
    const mismatched: string[] = [];
    const seen = new Set<ZoneKey>();
    for (const [x, y] of gridPoints()) {
      const raw = circlesAt(x, y);
      const key = zoneAt(x, y);
      if (raw !== "" && !isZoneKey(raw)) unknown.add(raw);
      if ((key ?? "") !== raw) mismatched.push(`(${x}, ${y})`);
      if (key) seen.add(key);
    }
    expect(unknown).toStrictEqual(new Set());
    expect(mismatched).toStrictEqual([]);
    expect(seen).toStrictEqual(new Set(ZONE_KEYS));
  });
});
