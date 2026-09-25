const NS = "http://www.w3.org/2000/svg";
const R = 200;
const ORDER = "LGNP";
const C = { L: [400, 270], G: [270, 400], N: [530, 400], P: [400, 530] };
const CIRCLE = {
  L: { name: "What you love", color: "var(--love)" },
  G: { name: "What you’re good at", color: "var(--good)" },
  N: { name: "What the world needs", color: "var(--needs)" },
  P: { name: "What you can be paid for", color: "var(--paid)" },
};

// Keys list the circles a region sits inside, in L-G-N-P order.
const ZONES = {
  L: { eyebrow: "One circle", title: "What you love",
       desc: "The activities, topics, and people that energize you. Time disappears when you’re doing them." },
  G: { eyebrow: "One circle", title: "What you’re good at",
       desc: "Your skills, strengths, and hard-won expertise. The things people come to you for help with." },
  N: { eyebrow: "One circle", title: "What the world needs",
       desc: "Problems worth solving and contributions that make life better for other people." },
  P: { eyebrow: "One circle", title: "What you can be paid for",
       desc: "Work the market values enough to pay for. The economic engine that sustains everything else." },
  LG: { eyebrow: "Two circles overlap", title: "Passion",
        desc: "What you love and what you’re good at. Deeply satisfying, but on its own it may not help others or pay the bills." },
  LN: { eyebrow: "Two circles overlap", title: "Mission",
        desc: "What you love and what the world needs. Purpose-driven and meaningful, but it may lack the skill or income to sustain it." },
  GP: { eyebrow: "Two circles overlap", title: "Profession",
        desc: "What you’re good at and what you can be paid for. A solid career, but without love or wider meaning it can feel hollow." },
  NP: { eyebrow: "Two circles overlap", title: "Vocation",
        desc: "What the world needs and what you can be paid for. Useful, valued work, but it may not draw on your talents or passion." },
  LGN: { eyebrow: "Passion + Mission", title: "Delight and fullness, but no wealth",
         desc: "You love it, you’re good at it, and it matters. It just doesn’t pay yet, so it often lives as a side project or volunteer work." },
  LNP: { eyebrow: "Mission + Vocation", title: "Excitement, but uncertainty",
         desc: "You love it, it matters, and it pays, but your skills haven’t caught up. Expect some self-doubt until your craft grows." },
  GNP: { eyebrow: "Profession + Vocation", title: "Comfortable, but empty",
         desc: "You’re good at it, it’s needed, and it pays. Stable and secure, but without love something feels missing." },
  LGP: { eyebrow: "Passion + Profession", title: "Satisfaction, but uselessness",
         desc: "You love it, you’re skilled, and you’re paid, but it doesn’t feel like it serves a bigger need." },
  LGNP: { eyebrow: "All four circles", title: "Ikigai",
          desc: "Where all four meet: something you love, are good at, the world needs, and can be paid for. In this model, that intersection is your reason for being." },
};

const EXAMPLES = {
  L: ["Cooking elaborate weekend dinners", "Hiking and being outdoors", "Getting lost in a good novel"],
  G: ["Explaining complex ideas simply", "Bringing order to chaotic projects", "Spotting patterns in messy data"],
  N: ["Better mental health support", "Affordable housing", "Practical climate solutions"],
  P: ["Software engineering", "Sales and account management", "Accounting and finance"],
  LG: ["A skilled amateur photographer who shoots just for fun", "A home baker whose bread friends rave about", "A gifted guitarist who plays only for themselves"],
  LN: ["Volunteering at a local food bank", "Campaigning for a cause you care about", "Mentoring young people on weekends"],
  GP: ["A capable lawyer who finds the work dull", "An accountant who is great with numbers but uninspired", "A consultant who excels but feels detached from the outcome"],
  NP: ["A call-center agent solving problems all day", "A data-entry clerk keeping records accurate", "A temp worker filling an essential but unfamiliar role"],
  LGN: ["A talented artist running free community workshops", "A skilled developer maintaining open-source tools unpaid", "A retired teacher tutoring neighborhood kids for free"],
  LNP: ["A career changer in their first year as a nurse", "A first-time founder building a product they believe in", "A junior developer at a climate-tech startup"],
  GNP: ["An experienced doctor who has lost the spark", "A senior engineer on critical but uninspiring infrastructure", "An expert accountant keeping a charity solvent"],
  LGP: ["A designer crafting ads for products they don’t believe in", "A gifted trader who loves the game but questions its impact", "A talented developer shipping yet another ad-tech feature"],
  LGNP: ["A doctor who loves medicine, excels at it, and is fairly paid", "A teacher who is gifted, fulfilled, and valued", "An engineer building clean-energy tech they care about"],
};

const svg = document.getElementById("ikigai");
const defs = document.getElementById("defs");
const zonesLayer = document.getElementById("zones");

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// Masks instead of clip-paths so region edges stay anti-aliased.
const FULL = { maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 800, height: 800 };
for (const k of ORDER) {
  const inc = el("mask", { id: "in-" + k, ...FULL }, defs);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill: "#000" }, inc);
  el("circle", { cx: C[k][0], cy: C[k][1], r: R, fill: "#fff" }, inc);
}

let uid = 0;
function region(key, fill, parent, cls) {
  const out = el("mask", { id: "out-" + uid++, ...FULL }, defs);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill: "#fff" }, out);
  [...ORDER].filter(k => !key.includes(k))
    .forEach(k => el("circle", { cx: C[k][0], cy: C[k][1], r: R, fill: "#000" }, out));
  const g = el("g", { mask: `url(#${out.id})`, class: cls || "", "data-zone": key }, parent);
  let inner = g;
  for (const k of key) inner = el("g", { mask: `url(#in-${k})` }, inner);
  el("rect", { x: 0, y: 0, width: 800, height: 800, fill }, inner);
  return g;
}

region("LGNP", "url(#gold)", document.getElementById("centerFill"));
const zoneEls = {};
for (const key in ZONES) {
  zoneEls[key] = region(key, key === "LGNP" ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.5)", zonesLayer, "zone");
}

function zoneAt(x, y) {
  let key = "";
  for (const k of ORDER) if (Math.hypot(x - C[k][0], y - C[k][1]) <= R) key += k;
  return ZONES[key] ? key : null;
}

function toSvg(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}

const content = document.getElementById("content");
const pills = document.querySelectorAll(".pill");
let current = null;
let pinned = "LGNP";
let swapTimer;

function render(key) {
  const z = ZONES[key];
  document.getElementById("eyebrow").textContent = z.eyebrow;
  document.getElementById("title").textContent = z.title;
  document.getElementById("desc").textContent = z.desc;
  document.getElementById("chips").innerHTML = [...ORDER].map(k =>
    `<span class="chip ${key.includes(k) ? "" : "off"}"><i style="background:${CIRCLE[k].color}"></i>${CIRCLE[k].name}</span>`
  ).join("");
  document.getElementById("examples").innerHTML = EXAMPLES[key].map(x => `<li>${x}</li>`).join("");
}

function setZone(key, instant) {
  if (key === current) return;
  current = key;
  for (const k in zoneEls) zoneEls[k].classList.toggle("active", k === key);
  pills.forEach(p => p.classList.toggle("active", p.dataset.zone === key));
  clearTimeout(swapTimer);
  if (instant) { render(key); return; }
  content.classList.add("swap");
  swapTimer = setTimeout(() => { render(key); content.classList.remove("swap"); }, 140);
}

svg.addEventListener("pointermove", e => {
  const p = toSvg(e);
  const key = zoneAt(p.x, p.y);
  svg.classList.toggle("hovering", !!key);
  setZone(key || pinned);
});
svg.addEventListener("pointerleave", () => { svg.classList.remove("hovering"); setZone(pinned); });
svg.addEventListener("click", e => {
  const p = toSvg(e);
  const key = zoneAt(p.x, p.y);
  if (key) { pinned = key; setZone(key); }
});
pills.forEach(p => p.addEventListener("click", () => { pinned = p.dataset.zone; setZone(pinned); }));

setZone("LGNP", true);
