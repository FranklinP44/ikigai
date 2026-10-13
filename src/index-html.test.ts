import { describe, expect, it } from "vitest";
import html from "../index.html?raw";
import { ORDER, ZONES, isZoneKey } from "./data";
import { CENTERS, R, zoneAt } from "./geometry";

// Loaded as text; importing main.ts as a module would run it against a missing DOM.
const mainSource = Object.values(
  import.meta.glob<string>("./main.ts", { query: "?raw", import: "default", eager: true }),
).join("");

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];
}

function numAttr(tag: string, name: string): number {
  const value = attr(tag, name);
  if (value === undefined) throw new Error(`${tag} has no ${name} attribute`);
  return Number(value);
}

function circlesWithClass(cls: string): string[] {
  return [...html.matchAll(/<circle\b[^>]*>/g)]
    .map(match => match[0])
    .filter(tag => attr(tag, "class") === cls);
}

function textsWithClass(cls: string): { x: number; y: number; text: string }[] {
  return [...html.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)]
    .filter(match => attr(match[0], "class") === cls)
    .map(match => ({ x: numAttr(match[0], "x"), y: numAttr(match[0], "y"), text: match[2] }));
}

describe("index.html", () => {
  it.each(["circle", "outline"])("draws the .%s circles at CENTERS with radius R", cls => {
    const circles = circlesWithClass(cls).map(tag => ({
      cx: numAttr(tag, "cx"),
      cy: numAttr(tag, "cy"),
      r: numAttr(tag, "r"),
    }));
    expect(circles).toStrictEqual(ORDER.map(k => ({ cx: CENTERS[k][0], cy: CENTERS[k][1], r: R })));
  });

  it("places a white dot inside each of the four three-circle zones", () => {
    const zones = circlesWithClass("dot").map(tag =>
      zoneAt(numAttr(tag, "cx"), numAttr(tag, "cy")),
    );
    expect(zones).toHaveLength(4);
    expect(new Set(zones)).toStrictEqual(new Set(["LGN", "LNP", "GNP", "LGP"]));
  });

  it("places each pair label inside the zone it names", () => {
    const labels = textsWithClass("label-pair");
    expect(labels).toHaveLength(4);
    for (const label of labels) {
      const key = zoneAt(label.x, label.y);
      expect(key ? ZONES[key].title : `no zone at (${label.x}, ${label.y})`).toBe(label.text);
    }
  });

  it("gives each Explore pill a valid zone key and that zone's title", () => {
    const pills = [...html.matchAll(/<button class="pill" data-zone="([^"]*)">([^<]*)<\/button>/g)];
    expect(pills.length).toBeGreaterThan(0);
    for (const [, zone, label] of pills) {
      expect(isZoneKey(zone) ? ZONES[zone].title : `invalid zone ${zone}`).toBe(label);
    }
  });

  it("contains every element id that main.ts looks up with byId()", () => {
    const ids = [...mainSource.matchAll(/byId\("([^"]+)"/g)].map(match => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    const missing = ids.filter(id => !new RegExp(`\\sid="${id}"`).test(html));
    expect(missing).toStrictEqual([]);
  });
});
