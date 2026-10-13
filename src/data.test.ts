import { describe, expect, it } from "vitest";
import { CIRCLE, EXAMPLES, ORDER, ZONES, ZONE_KEYS, isZoneKey, type ZoneKey } from "./data";

const PAIR_KEYS = ZONE_KEYS.filter(key => key.length === 2);

describe("ORDER", () => {
  it("lists the four circles in L-G-N-P order", () => {
    expect(ORDER).toStrictEqual(["L", "G", "N", "P"]);
  });
});

describe("ZONE_KEYS", () => {
  it("has 13 unique keys", () => {
    expect(ZONE_KEYS).toHaveLength(13);
    expect(new Set(ZONE_KEYS).size).toBe(ZONE_KEYS.length);
  });

  it("writes each key's circles once, in L-G-N-P order", () => {
    for (const key of ZONE_KEYS) {
      expect(key).toBe(ORDER.filter(k => key.includes(k)).join(""));
    }
  });

  it("starts with the four single circles so they render beneath the overlaps", () => {
    expect(ZONE_KEYS.slice(0, 4)).toStrictEqual([...ORDER]);
  });

  it("puts every zone after the zones it contains", () => {
    for (const [index, key] of ZONE_KEYS.entries()) {
      const later = ZONE_KEYS.slice(index + 1);
      expect(later.filter(other => [...other].every(k => key.includes(k)))).toStrictEqual([]);
    }
  });
});

describe("isZoneKey", () => {
  it.each(ZONE_KEYS)("accepts %s", key => {
    expect(isZoneKey(key)).toBe(true);
  });

  it.each(["", "X", "lg", "GL", "LP", "GN", "LGX", "LGNPL", " LG", "LG "])("rejects %j", key => {
    expect(isZoneKey(key)).toBe(false);
  });
});

describe("CIRCLE", () => {
  it("defines exactly the circles in ORDER", () => {
    expect(new Set(Object.keys(CIRCLE))).toStrictEqual(new Set(ORDER));
  });

  it("uses each circle's name as the title of its single-circle zone", () => {
    for (const key of ORDER) expect(ZONES[key].title).toBe(CIRCLE[key].name);
  });

  it("colors each circle with its own CSS custom property", () => {
    const colors = ORDER.map(key => CIRCLE[key].color);
    for (const color of colors) expect(color).toMatch(/^var\(--[a-z-]+\)$/);
    expect(new Set(colors).size).toBe(ORDER.length);
  });
});

describe("ZONES", () => {
  it("defines exactly the keys in ZONE_KEYS", () => {
    expect(new Set(Object.keys(ZONES))).toStrictEqual(new Set(ZONE_KEYS));
  });

  it.each(ZONE_KEYS)("gives %s a non-empty eyebrow, title and description", key => {
    const zone = ZONES[key];
    expect(zone.eyebrow.trim()).not.toBe("");
    expect(zone.title.trim()).not.toBe("");
    expect(zone.desc.trim()).not.toBe("");
  });

  it("gives every zone a distinct title", () => {
    const titles = ZONE_KEYS.map(key => ZONES[key].title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("labels one-, two- and four-circle zones by how many circles they cover", () => {
    const eyebrows: Record<number, string> = {
      1: "One circle",
      2: "Two circles overlap",
      4: "All four circles",
    };
    for (const key of ZONE_KEYS.filter(k => k.length !== 3)) {
      expect(ZONES[key].eyebrow).toBe(eyebrows[key.length]);
    }
  });

  it("names each three-circle zone after the two named pairs it contains", () => {
    for (const key of ZONE_KEYS.filter(k => k.length === 3)) {
      const pairs: ZoneKey[] = PAIR_KEYS.filter(pair => [...pair].every(k => key.includes(k)));
      expect(pairs).toHaveLength(2);
      expect(ZONES[key].eyebrow).toBe(pairs.map(pair => ZONES[pair].title).join(" + "));
    }
  });
});

describe("EXAMPLES", () => {
  it("defines exactly the keys in ZONE_KEYS", () => {
    expect(new Set(Object.keys(EXAMPLES))).toStrictEqual(new Set(ZONE_KEYS));
  });

  it.each(ZONE_KEYS)("gives %s three distinct, non-empty examples", key => {
    const examples = EXAMPLES[key];
    expect(examples).toHaveLength(3);
    expect(new Set(examples).size).toBe(3);
    for (const example of examples) expect(example.trim()).not.toBe("");
  });

  it("contains no markup, because examples are rendered with innerHTML", () => {
    for (const key of ZONE_KEYS) {
      for (const example of EXAMPLES[key]) expect(example).not.toMatch(/[<>&"]/);
    }
  });
});
