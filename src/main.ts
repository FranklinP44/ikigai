import { CIRCLE, EXAMPLES, ORDER, ZONES, ZONE_KEYS, isZoneKey, type ZoneKey } from "./data";
import { CENTERS, R, zoneAt } from "./geometry";

const NS = "http://www.w3.org/2000/svg";

function byId<T extends Element>(id: string, type: { new (): T; prototype: T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing #${id}`);
  return node;
}

const svg = byId("ikigai", SVGSVGElement);
const defs = byId("defs", SVGDefsElement);
const zonesLayer = byId("zones", SVGGElement);
const centerFill = byId("centerFill", SVGGElement);
const content = byId("content", HTMLElement);
const eyebrowEl = byId("eyebrow", HTMLElement);
const titleEl = byId("title", HTMLElement);
const descEl = byId("desc", HTMLElement);
const chipsEl = byId("chips", HTMLElement);
const examplesEl = byId("examples", HTMLElement);
const pills = document.querySelectorAll<HTMLButtonElement>(".pill");

type Attrs = Record<string, string | number>;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs, parent?: Element): SVGElementTagNameMap[K] {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(n);
  return n;
}

// Masks instead of clip-paths so region edges stay anti-aliased.
const FULL: Attrs = { maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 800, height: 800 };
for (const k of ORDER) {
  const inc = el("mask", { id: "in-" + k, ...FULL }, defs);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill: "#000" }, inc);
  el("circle", { cx: CENTERS[k][0], cy: CENTERS[k][1], r: R, fill: "#fff" }, inc);
}

let uid = 0;
function region(key: ZoneKey, fill: string, parent: Element, cls?: string): SVGGElement {
  const out = el("mask", { id: "out-" + uid++, ...FULL }, defs);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill: "#fff" }, out);
  ORDER.filter(k => !key.includes(k))
    .forEach(k => el("circle", { cx: CENTERS[k][0], cy: CENTERS[k][1], r: R, fill: "#000" }, out));
  const g = el("g", { mask: `url(#${out.id})`, class: cls || "", "data-zone": key }, parent);
  let inner: SVGGElement = g;
  for (const k of key) inner = el("g", { mask: `url(#in-${k})` }, inner);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill }, inner);
  return g;
}

region("LGNP", "url(#gold)", centerFill);
const zoneEls = {} as Record<ZoneKey, SVGGElement>;
for (const key of ZONE_KEYS) {
  zoneEls[key] = region(key, key === "LGNP" ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.5)", zonesLayer, "zone");
}

function toSvg(e: PointerEvent | MouseEvent): DOMPoint | null {
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  return new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
}

function zoneForEvent(e: PointerEvent | MouseEvent): ZoneKey | null {
  const p = toSvg(e);
  return p ? zoneAt(p.x, p.y) : null;
}

let current: ZoneKey | null = null;
let pinned: ZoneKey = "LGNP";
let swapTimer: number | undefined;

function render(key: ZoneKey): void {
  const z = ZONES[key];
  eyebrowEl.textContent = z.eyebrow;
  titleEl.textContent = z.title;
  descEl.textContent = z.desc;
  // Content is static and trusted, so markup strings keep the DOM identical to the original page.
  chipsEl.innerHTML = ORDER.map(k =>
    `<span class="chip ${key.includes(k) ? "" : "off"}"><i style="background:${CIRCLE[k].color}"></i>${CIRCLE[k].name}</span>`
  ).join("");
  examplesEl.innerHTML = EXAMPLES[key].map(x => `<li>${x}</li>`).join("");
}

function setZone(key: ZoneKey, instant = false): void {
  if (key === current) return;
  current = key;
  for (const k of ZONE_KEYS) zoneEls[k].classList.toggle("active", k === key);
  pills.forEach(p => p.classList.toggle("active", p.dataset.zone === key));
  window.clearTimeout(swapTimer);
  if (instant) { render(key); return; }
  content.classList.add("swap");
  swapTimer = window.setTimeout(() => { render(key); content.classList.remove("swap"); }, 140);
}

svg.addEventListener("pointermove", e => {
  const key = zoneForEvent(e);
  svg.classList.toggle("hovering", !!key);
  setZone(key || pinned);
});
svg.addEventListener("pointerleave", () => { svg.classList.remove("hovering"); setZone(pinned); });
svg.addEventListener("click", e => {
  const key = zoneForEvent(e);
  if (key) { pinned = key; setZone(key); }
});
pills.forEach(p => p.addEventListener("click", () => {
  const zone = p.dataset.zone;
  if (zone && isZoneKey(zone)) { pinned = zone; setZone(pinned); }
}));

setZone("LGNP", true);
