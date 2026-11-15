// Starting palette
const state = [
  { hex: "#FFEBEE", locked: false },
  { hex: "#F8BBD9", locked: false },
  { hex: "#CE93D8", locked: false },
  { hex: "#BA68C8", locked: false },
  { hex: "#AB47BC", locked: false },
];

const paletteEl = document.getElementById("palette");
const toast = document.getElementById("toast");
const sky = document.getElementById("sky");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastTimer;

/* ---------- colour helpers ---------- */
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return ("#" + to(f(0)) + to(f(8)) + to(f(4))).toUpperCase();
}

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

function darkInk() {
  const p = css("--plum");
  return /^#[0-9a-f]{6}$/i.test(p) && lum(p) < 0.2 ? p : "#16161D";
}

function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.35 ? darkInk() : "#FFFFFF";
}

function normaliseHex(v) {
  v = v.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(v)) v = v.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(v) ? "#" + v.toUpperCase() : null;
}

/* ---------- build the swatches once ---------- */
state.forEach((item, i) => {
  const el = document.createElement("div");
  el.className = "swatch";
  el.style.setProperty("--i", i);
  el.innerHTML =
    '<input class="hex" maxlength="7" spellcheck="false" aria-label="Hex code for colour ' + (i + 1) + '">' +
    '<div class="row">' +
    '<button class="mini lock" type="button">Lock</button>' +
    '<button class="mini copy" type="button">Copy</button>' +
    "</div>";
  const input = el.querySelector(".hex");

  input.addEventListener("change", () => {
    const ok = normaliseHex(input.value);
    if (ok) { item.hex = ok; paint(i); }
    else { input.classList.add("bad"); setTimeout(() => input.classList.remove("bad"), 450); paint(i); showToast("Use a hex code like #AB47BC"); }
  });
  el.querySelector(".lock").addEventListener("click", () => {
    item.locked = !item.locked;
    paint(i);
  });
  el.querySelector(".copy").addEventListener("click", (e) => {
    copy(item.hex, "Copied " + item.hex);
    burst(e.clientX, e.clientY, item.hex);
  });
  item.el = el;
  paletteEl.appendChild(el);
  paint(i);
});

function paint(i) {
  const item = state[i];
  const el = item.el;
  el.style.setProperty("--c", item.hex);
  el.style.setProperty("--t", textOn(item.hex));
  el.classList.toggle("locked", item.locked);
  el.querySelector(".hex").value = item.hex;
  el.querySelector(".lock").textContent = item.locked ? "Locked" : "Lock";
  el.querySelector(".lock").setAttribute("aria-pressed", item.locked);
}

/* ---------- generate ---------- */
const schemes = [
  [0, 20, 40, 60, 80],        // analogous
  [0, 120, 240, 30, 150],     // triadic mix
  [0, 150, 210, 20, 180],     // split complementary
  [0, 180, 15, 195, 30],      // complementary
  [0, 90, 180, 270, 45],      // square mix
];

function generate() {
  const base = Math.random() * 360;
  const scheme = schemes[Math.floor(Math.random() * schemes.length)];
  const lights = [88, 78, 66, 54, 42].sort(() => Math.random() - 0.5);
  state.forEach((item, i) => {
    if (item.locked) return;
    const h = (base + scheme[i]) % 360;
    const s = 38 + Math.random() * 42;
    item.hex = hslToHex(h, s, lights[i]);
    paint(i);
    item.el.classList.remove("pop");
    void item.el.offsetWidth;          // restart the animation
    item.el.classList.add("pop");
  });
}

document.getElementById("generate").addEventListener("click", (e) => {
  generate();
  pushRecent();
  burst(e.clientX, e.clientY);
});
document.getElementById("copyAll").addEventListener("click", () => {
  copy(state.map((s) => s.hex).join(", "), "Copied all five codes");
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !document.getElementById("view-lab").hidden && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    generate();
  }
});

/* ---------- copy + toast ---------- */
async function copy(text, message) {
  try { await navigator.clipboard.writeText(text); showToast(message); }
  catch (err) {
    const t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); showToast(message); } catch (e) { showToast("Could not copy"); }
    t.remove();
  }
}
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}

/* ---------- sparkle burst (diamonds) ---------- */
function burst(x, y, color) {
  if (reduceMotion) return;
  const accent = color || css("--fuchsia");
  const alt = css("--pink-manga");
  for (let n = 0; n < 10; n++) {
    const s = document.createElement("span");
    s.className = "spark";
    const ang = (n / 10) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.setProperty("--k", n % 2 ? accent : alt);
    s.style.setProperty("--x", Math.cos(ang) * dist + "px");
    s.style.setProperty("--y", Math.sin(ang) * dist + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 850);
  }
}

/* ---------- floating background stars ---------- */
if (!reduceMotion) {
  // pixel-art sprites: # marks a filled pixel
  const SPRITES = {
    star: ["....#....", "....#....", "...###...", "...###...", "#########", "...###...", "...###...", "....#....", "....#...."],
    plus: ["..#..", "..#..", "#####", "..#..", "..#.."],
    moon: ["..#####.", ".####...", "####....", "###.....", "###.....", "####....", ".####...", "..#####."],
    twinkle: [".#.", "###", ".#."],
  };
  const pixelSvg = (rows) => {
    let d = "";
    rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") d += "M" + x + " " + y + "h1v1h-1z"; }));
    return '<svg viewBox="0 0 ' + rows[0].length + " " + rows.length + '" shape-rendering="crispEdges" aria-hidden="true"><path d="' + d + '"/></svg>';
  };
  const kinds = ["star", "plus", "moon", "twinkle", "plus", "star", "twinkle", "moon", "twinkle"];
  for (let n = 0; n < 36; n++) {
    const kind = kinds[n % kinds.length];
    const rows = SPRITES[kind];
    const scale = kind === "star" || kind === "moon" ? 1 + Math.floor(Math.random() * 2) : 2;   // whole pixels only, so the edges stay crisp
    const s = document.createElement("span");
    s.className = "star" + (kind === "twinkle" ? " tw" : "");
    s.innerHTML = pixelSvg(rows);
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.width = rows[0].length * scale + "px";
    s.style.height = rows.length * scale + "px";
    s.style.setProperty("--dy", 14 + Math.random() * 14 + "s");
    s.style.setProperty("--dx", 18 + Math.random() * 16 + "s");
    s.style.setProperty("--tw", kind === "twinkle" ? 1.2 + Math.random() * 2.4 + "s" : 2.4 + Math.random() * 3 + "s");
    s.style.setProperty("--delay", -Math.random() * 30 + "s");
    sky.appendChild(s);
  }
  window.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * -24;
    const y = (e.clientY / window.innerHeight - 0.5) * -24;
    sky.style.transform = "translate(" + x + "px," + y + "px)";
  });
}

/* ===== Phase II: views, wheel, harmony, explorer ===== */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (h) => ((h % 360) + 360) % 360;
const hsl = (h, s, l) => hslToHex(mod(h), clamp(s, 0, 100), clamp(l, 0, 100));

function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; }
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h: Math.round(mod(h)), s: Math.round(s * 100), l: Math.round(l * 100) };
}

let base = hexToHsl("#AB47BC");   // shared by Harmony and Explorer

function chip(hex) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = hex;
  b.style.background = hex;
  b.style.color = textOn(hex);
  b.addEventListener("click", (e) => { copy(hex, "Copied " + hex); burst(e.clientX, e.clientY, hex); });
  return b;
}
const fill = (el, list) => el.replaceChildren(...list.map(chip));

/* ---------- tabs (no endless scrolling: one screen at a time) ---------- */
const tabs = [...document.querySelectorAll(".tab")];
function show(name) {
  if (!document.getElementById("view-" + name)) name = "lab";
  tabs.forEach((t) => {
    const on = t.dataset.view === name;
    t.classList.toggle("on", on);
    t.setAttribute("aria-current", on ? "page" : "false");
    document.getElementById("view-" + t.dataset.view).hidden = !on;
  });
  if (history.replaceState) history.replaceState(null, "", "#" + name);
  if (name === "grimoire") renderGrimoire();
  if (name === "contrast") renderContrast();
  if (name === "studio") studioRefresh();
  if (name === "mood") renderMood();
  $("dockWrap").hidden = name !== "lab";
  window.scrollTo(0, 0);
}
tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

/* ---------- harmony ---------- */
const types = {
  "Complementary": { o: [0, 180], why: "Opposites on the wheel. They make each other look brighter, so let one lead and use the other as a pop." },
  "Analogous": { o: [-30, 0, 30], why: "Neighbours on the wheel. They blend smoothly, so the palette feels calm and natural." },
  "Triadic": { o: [0, 120, 240], why: "Three colours spaced evenly. You get variety and balance, so let one colour lead." },
  "Tetradic": { o: [0, 60, 180, 240], why: "Two pairs of opposites. Rich and playful, so choose one dominant colour." },
  "Monochromatic": { o: [0], mono: true, why: "One hue in five lightness steps. It is always harmonious and easy to read." },
  "Split complementary": { o: [0, 150, 210], why: "A colour plus the two beside its opposite. Strong contrast, but gentler than complementary." },
  "Square": { o: [0, 90, 180, 270], why: "Four colours evenly spaced. Bold and lively, so keep the saturation moderate." },
};
let type = "Analogous";

const typesEl = document.getElementById("types");
Object.keys(types).forEach((name) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pill";
  b.textContent = name;
  b.addEventListener("click", () => { type = name; renderAll(); });
  typesEl.appendChild(b);
});

function harmonyColors() {
  const t = types[type];
  if (t.mono) return [18, 34, 50, 66, 82].map((l) => hsl(base.h, base.s, l));
  return t.o.map((o) => hsl(base.h + o, base.s, base.l));
}

/* ---------- colour wheel (canvas) ---------- */
const cv = document.getElementById("wheel");
const ctx = cv.getContext("2d");

function diamond(x, y, size, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y - size); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = css("--plum"); ctx.stroke();
}

function drawWheel() {
  const W = cv.width, c = W / 2, R = c - 12, r = R * 0.5;
  ctx.clearRect(0, 0, W, W);
  for (let i = 0; i < 90; i++) {
    const a0 = (i / 90) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / 90) * 2 * Math.PI - Math.PI / 2 + 0.012;
    ctx.beginPath();
    ctx.arc(c, c, R, a0, a1);
    ctx.arc(c, c, r, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = "hsl(" + i * 4 + ",70%,62%)";
    ctx.fill();
  }
  ctx.fillStyle = hsl(base.h, base.s, base.l);
  ctx.fillRect(c - r * 0.6, c - r * 0.6, r * 1.2, r * 1.2);
  ctx.lineWidth = 3; ctx.strokeStyle = css("--plum");
  ctx.strokeRect(c - r * 0.6, c - r * 0.6, r * 1.2, r * 1.2);

  const t = types[type];
  const hues = t.mono ? [base.h] : t.o.map((o) => base.h + o);
  hues.forEach((h, k) => {
    const a = (mod(h) * Math.PI) / 180 - Math.PI / 2;
    const rr = (R + r) / 2;
    diamond(c + Math.cos(a) * rr, c + Math.sin(a) * rr, k === 0 ? 26 : 18, k === 0 ? "#FFFFFF" : css("--pink-pale"));
  });
}

function pick(e) {
  const rect = cv.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  base.h = Math.round(mod((Math.atan2(x, -y) * 180) / Math.PI));
  renderAll();
}
let dragging = false;
cv.addEventListener("pointerdown", (e) => { dragging = true; cv.setPointerCapture(e.pointerId); pick(e); });
cv.addEventListener("pointermove", (e) => { if (dragging) pick(e); });
cv.addEventListener("pointerup", () => { dragging = false; });


document.getElementById("toLab").addEventListener("click", () => {
  const list = harmonyColors();
  const n0 = list.length;
  for (let k = 0; list.length < 5; k++) {
    const c = hexToHsl(list[k % n0]);
    list.push(hsl(c.h, c.s, c.l + (k % 2 ? -20 : 20)));
  }
  state.forEach((item, i) => {
    item.hex = list[i];
    item.locked = false;
    paint(i);
    item.el.classList.remove("pop");
    void item.el.offsetWidth;
    item.el.classList.add("pop");
  });
  show("lab");
  showToast("Sent to the Laboratory");
});

/* ---------- explorer ---------- */
const $ = (id) => document.getElementById(id);

function renderExplorer() {
  const hex = hsl(base.h, base.s, base.l);
  const rgb = hexToRgb(hex);
  $("picker").value = hex.toLowerCase();
  $("hexIn").value = hex;
  $("rIn").value = rgb.r; $("gIn").value = rgb.g; $("bIn").value = rgb.b;
  $("hIn").value = base.h; $("sIn").value = base.s; $("lIn").value = base.l;
  fill($("baseChip"), [hex]);
  const bright = Math.round(((0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255) * 100);
  $("exInfo").textContent = "Brightness " + bright + "%. Saturation " + base.s + "%. White text " + contrast(hex, "#FFFFFF").toFixed(1) + ":1. Dark text " + contrast(hex, "#1A1A1A").toFixed(1) + ":1.";

  const steps = [1, 2, 3, 4, 5];
  const rows = [
    ["Lighter", steps.map((k) => hsl(base.h, base.s, base.l + ((96 - base.l) * k) / 5))],
    ["Darker", steps.map((k) => hsl(base.h, base.s, base.l * (1 - k / 6)))],
    ["Muted", steps.map((k) => hsl(base.h, base.s * (1 - k / 5.5), base.l))],
    ["Saturated", steps.map((k) => hsl(base.h, base.s + ((100 - base.s) * k) / 5, base.l))],
    ["Complementary", [-16, -8, 0, 8, 16].map((d) => hsl(base.h + 180 + d, base.s, base.l))],
    ["Similar", [-40, -20, 20, 40, 60].map((d) => hsl(base.h + d, base.s, base.l))],
  ];
  $("variations").replaceChildren(...rows.map(([name, list]) => {
    const row = document.createElement("div");
    row.className = "vrow";
    const label = document.createElement("span");
    label.className = "vname";
    label.textContent = name;
    const chips = document.createElement("div");
    chips.className = "chips";
    fill(chips, list);
    row.append(label, chips);
    return row;
  }));
}

function setFromHex(hex) { base = hexToHsl(hex); renderAll(); }
$("picker").addEventListener("input", (e) => setFromHex(e.target.value.toUpperCase()));
$("hexIn").addEventListener("change", (e) => {
  const ok = normaliseHex(e.target.value);
  if (ok) setFromHex(ok); else { showToast("Use a hex code like #AB47BC"); renderAll(); }
});
["rIn", "gIn", "bIn"].forEach((id) => $(id).addEventListener("change", () => {
  setFromHex(rgbToHex(+$("rIn").value, +$("gIn").value, +$("bIn").value));
}));
["hIn", "sIn", "lIn"].forEach((id) => $(id).addEventListener("change", () => {
  base = { h: mod(+$("hIn").value), s: clamp(+$("sIn").value, 0, 100), l: clamp(+$("lIn").value, 0, 100) };
  renderAll();
}));

/* ---------- render everything ---------- */
function renderAll() {
  [...typesEl.children].forEach((b) => b.classList.toggle("on", b.textContent === type));
  drawWheel();
  renderFree();
  fill($("harmonyChips"), harmonyColors());
  $("why").textContent = types[type].why;
  renderExplorer();
}


/* ===== Phase III: My Grimoire (saved palettes, collections, recent) ===== */
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
let grimoire = store.get("soc.grimoire", []);
let recent = store.get("soc.recent", []);
const collections = ["Personal favourites", "Dark and mysterious", "Botanical", "Vintage", "Experimental", "Client projects"];
let filter = "All";

const labColors = () => state.map((s) => s.hex);

function pushRecent() {
  const c = labColors();
  if (recent[0] && recent[0].join() === c.join()) return;
  recent.unshift(c);
  recent = recent.slice(0, 12);
  store.set("soc.recent", recent);
}

function saveBook() { store.set("soc.grimoire", grimoire); }

function savePalette(colors, name) {
  grimoire.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: name || "Untitled spell " + (grimoire.length + 1),
    desc: "",
    col: "Personal favourites",
    colors: [...colors],
  });
  saveBook();
  showToast("Saved to My Grimoire");
}

function loadToLab(colors) {
  state.forEach((item, i) => {
    item.hex = colors[i] || item.hex;
    item.locked = false;
    paint(i);
    item.el.classList.remove("pop");
    void item.el.offsetWidth;
    item.el.classList.add("pop");
  });
  show("lab");
}

function make(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function smallButton(label, onClick) {
  const b = make("button", "pill", label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}
function strip(colors) {
  const d = make("div", "strip");
  colors.forEach((hex) => {
    const b = make("button", "sw");
    b.type = "button";
    b.style.background = hex;
    b.title = hex;
    b.setAttribute("aria-label", "Copy " + hex);
    b.addEventListener("click", (e) => { copy(hex, "Copied " + hex); burst(e.clientX, e.clientY, hex); });
    d.appendChild(b);
  });
  return d;
}

function savedCard(g) {
  const card = make("article", "gcard");
  const name = make("input", "field gname");
  name.value = g.name;
  name.setAttribute("aria-label", "Palette name");
  name.addEventListener("change", () => { g.name = name.value.trim() || "Untitled spell"; saveBook(); });

  const desc = make("input", "field");
  desc.value = g.desc;
  desc.placeholder = "Add a description";
  desc.setAttribute("aria-label", "Description");
  desc.addEventListener("change", () => { g.desc = desc.value; saveBook(); });

  const sel = make("select", "field");
  sel.setAttribute("aria-label", "Collection");
  collections.forEach((c) => { const o = make("option", "", c); o.value = c; sel.appendChild(o); });
  sel.value = g.col;
  sel.addEventListener("change", () => { g.col = sel.value; saveBook(); if (filter !== "All") renderGrimoire(); });

  const row = make("div", "pills");
  row.append(
    smallButton("Use", () => loadToLab(g.colors)),
    smallButton("Copy", () => copy(g.name + ": " + g.colors.join(", "), "Copied " + g.name)),
    smallButton("PNG", () => downloadPNG(g.colors, g.name)),
  );
  const del = smallButton("Delete", () => {
    if (!del.classList.contains("on")) {
      del.classList.add("on");
      del.textContent = "Sure?";
      setTimeout(() => { del.classList.remove("on"); del.textContent = "Delete"; }, 2200);
      return;
    }
    grimoire = grimoire.filter((x) => x.id !== g.id);
    saveBook();
    renderGrimoire();
  });
  row.appendChild(del);
  card.append(strip(g.colors), name, desc, sel, row);
  return card;
}

function recentCard(colors) {
  const card = make("article", "gcard");
  card.append(strip(colors), make("p", "why", "Generated recently"));
  const row = make("div", "pills");
  row.append(
    smallButton("Use", () => loadToLab(colors)),
    smallButton("Save", () => { savePalette(colors); }),
  );
  card.appendChild(row);
  return card;
}

function renderGrimoire() {
  const f = $("gFilters");
  f.replaceChildren(...["All", ...collections, "Recent"].map((n) => {
    const b = smallButton(n, () => { filter = n; renderGrimoire(); });
    b.classList.toggle("on", filter === n);
    return b;
  }));
  $("copyBook").hidden = filter === "Recent";

  const list = $("gList");
  const items = filter === "Recent"
    ? recent.map(recentCard)
    : grimoire.filter((g) => filter === "All" || g.col === filter).map(savedCard);

  if (!items.length) {
    const empty = make("div", "panel");
    empty.append(make("p", "why", filter === "Recent"
      ? "Nothing generated yet. Make a palette in the Laboratory."
      : "Nothing here yet. Save a palette from the Laboratory and it will appear in this book."));
    empty.appendChild(smallButton("Go to the Laboratory", () => show("lab")));
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren(...items);
}

$("saveBtn").addEventListener("click", (e) => { savePalette(labColors()); burst(e.clientX, e.clientY); });
$("copyBook").addEventListener("click", () => {
  if (!grimoire.length) { showToast("Your grimoire is empty"); return; }
  copy(grimoire.map((g) => g.name + " (" + g.col + ")" + (g.desc ? "\n" + g.desc : "") + "\n" + g.colors.join(", ")).join("\n\n"), "Copied your whole grimoire");
});

/* ===== Phase IV: Moodboard, Palette of the Day, spells ===== */
const hexes = (t) => t.split(" ").map((x) => "#" + x);
const mood = {
  Aesthetics: {
    "Dark Academia": hexes("2B2118 4A3728 6B4F3A 8C7355 C9B79C"),
    "Light Academia": hexes("F5EBDD E6D5B8 CDB892 A68A64 6F5B3E"),
    "Gothic Romance": hexes("1A0F1F 3D1630 6E1F3E A32A4B D9B8C4"),
    "Vintage": hexes("EBDDC3 D9B382 C27C5A 8E5B4A 5C4A42"),
    "Fairycore": hexes("E8F5E1 C5E8B7 F3C6E1 B7A8E8 8FD3C1"),
    "Cottagecore": hexes("F6EDD9 E3C9A1 B7C58A 8FA06B C9826B"),
    "Art Nouveau": hexes("2F4F3E 7A8F5A C5A34A E4D2A0 8A5A44"),
    "Minimalism": hexes("FAFAF7 E6E4DF BDBAB3 8A8780 2E2D2B"),
    "Cyberpunk": hexes("0D0221 261447 FF2A6D 05D9E8 D1F7FF"),
    "Retro": hexes("F2A541 E4572E F3E3C3 2E8B8B 3B3355"),
  },
  Moods: {
    "Mysterious": hexes("14101F 2D2547 4B3F72 7B6BA8 BDB3D9"),
    "Romantic": hexes("FFE5EC FFC2D1 FF8FAB C9547A 7D2E4A"),
    "Dreamy": hexes("E0D4F7 C8B6F0 A8D8F0 F7CFE5 FFF2D9"),
    "Nostalgic": hexes("F0E1C6 D8B98A B98B6A 8C6A5A 5E4B4A"),
    "Dramatic": hexes("0B0B0F 3A0F1A 8B1E2D D64545 F2E5D5"),
    "Peaceful": hexes("E8F1EF CFE3DE A8CBC4 7FAEA6 4F8079"),
    "Whimsical": hexes("FFD6E8 FFE8A3 C7F0D8 BFD8FF E3C4FF"),
    "Melancholic": hexes("2C3544 46556B 6C7F99 9DAAB8 D3D9DF"),
  },
  Nature: {
    "Forests": hexes("1F3B2D 35593F 5E8450 9AB87A D6E2B8"),
    "Flowers": hexes("FFD9E8 FF9EC4 C86BAF 7C4B9E F6E58D"),
    "Oceans": hexes("0C2D48 145DA0 2E8BC0 B1D4E0 E8F4F8"),
    "Sunsets": hexes("3B1C4A 8E2C57 E4572E F29E4C F8D98B"),
    "Autumn leaves": hexes("5A2A1A A0441F D9822B E8B04A 7A6A3A"),
    "Mountains": hexes("1F2A38 4A5D70 8697A8 C7D1DB F2F5F8"),
  },
  Spells: {
    "Enchantment": hexes("1B1033 3E1F6B 7B3FA8 C58BE8 F7D9FF"),
    "Jealousy": hexes("0F2A1D 1F5A3A 4F9B5C A8C96B E3E8A0"),
    "Serenity": hexes("EAF4F4 CFE6E8 A9D0D6 8DB6C4 6F93A8"),
    "Chaos": hexes("FF2E63 FFE600 08D9D6 6A0DAD 111111"),
    "Nostalgia": hexes("F2E3C6 DDB892 B08968 7F5539 9C6644"),
    "Devotion": hexes("FFD6DD F4A6B7 D4577A 8F2D56 4A1942"),
  },
};
const moodNotes = {
  Aesthetics: "An aesthetic to borrow today.",
  Moods: "A mood to wear today.",
  Nature: "A piece of the outdoors to carry with you.",
  Spells: "A spell to try today.",
};
let moodGroup = "Today";
const moodItem = {};

function paletteOfTheDay() {
  const all = [];
  Object.entries(mood).forEach(([g, items]) => Object.entries(items).forEach(([n, c]) => all.push({ g, n, c })));
  const d = new Date();
  const day = Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
  return all[day % all.length];
}

function renderMood() {
  $("mGroups").replaceChildren(...["Today", ...Object.keys(mood)].map((g) => {
    const b = smallButton(g, () => { moodGroup = g; renderMood(); });
    b.classList.toggle("on", moodGroup === g);
    return b;
  }));

  let cur;
  const items = $("mItems");
  if (moodGroup === "Today") {
    items.replaceChildren();
    cur = paletteOfTheDay();
  } else {
    const names = Object.keys(mood[moodGroup]);
    if (!names.includes(moodItem[moodGroup])) moodItem[moodGroup] = names[0];
    items.replaceChildren(...names.map((n) => {
      const b = smallButton(n, () => { moodItem[moodGroup] = n; renderMood(); });
      b.classList.toggle("on", moodItem[moodGroup] === n);
      return b;
    }));
    const n = moodItem[moodGroup];
    cur = { g: moodGroup, n, c: mood[moodGroup][n] };
  }

  const card = $("mCard");
  const big = strip(cur.c);
  big.classList.add("big");
  const row = make("div", "pills");
  row.append(
    smallButton("Use", () => loadToLab(cur.c)),
    smallButton("Save", () => savePalette(cur.c, cur.n)),
    smallButton("Copy", () => copy(cur.n + ": " + cur.c.join(", "), "Copied " + cur.n)),
  );
  card.replaceChildren(
    make("p", "why", moodGroup === "Today" ? "Palette of the Day" : cur.g),
    make("h3", "feature-name", cur.n),
    big,
    make("p", "why", moodNotes[cur.g]),
    row,
  );
  card.style.animation = "none";
  void card.offsetWidth;
  card.style.animation = "";
}

/* ---------- spells in the Laboratory ---------- */
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

function applyList(list) {
  state.forEach((item, i) => {
    if (item.locked) return;
    item.hex = list[i];
    paint(i);
    item.el.classList.remove("pop");
    void item.el.offsetWidth;
    item.el.classList.add("pop");
  });
  pushRecent();
}

/* ---------- remarks for Surprise me and The Trickster ---------- */
const REMARKS = [
  "Oh, that's positively scrumptious!",
  "Well, look who's feeling fancy.",
  "A touch of elegance never hurt.",
  "Goodness, that's rather enchanting.",
  "Oh!…behave! ;)",
  "Now we're getting somewhere!",
  "Not quite what I imagined, but delightful nonetheless.",
  "What a curious little beauty.",
  "I could stare at this all afternoon.",
  "Mmm. A most agreeable shade.",
  "Oh, you've outdone yourself, darling.",
  "That colour has an attitude. I approve.",
  "A little dramatic, aren't we?",
  "Well, someone clearly enjoys attention.",
  "How very audacious of you.",
  "I see potential. And quite a bit of vanity.",
  "Not everyone can pull that off, you know.",
  "Oh, don't be shy. Show yourself!",
  "A bold choice. I respect the audacity.",
  "That one's got expensive taste.",
  "Some colours simply know they're gorgeous.",
  "A little piece of twilight, perhaps?",
  "Like something stolen from a fairy's garden.",
  "There's a certain magic in this one.",
  "Well! Fancy that",
  "Are you sure..?",
];
let remarkBag = [];
let lastRemark = "";

function nextRemark() {
  if (!remarkBag.length) {
    remarkBag = shuffle(REMARKS);
    // never repeat the one we just showed
    if (remarkBag[remarkBag.length - 1] === lastRemark) remarkBag.unshift(remarkBag.pop());
  }
  lastRemark = remarkBag.pop();
  return lastRemark;
}
let remarkTimer, remarkTimer2;
function showBox(text) {
  const el = $("remark");
  clearTimeout(remarkTimer);
  clearTimeout(remarkTimer2);
  el.textContent = text;
  el.classList.remove("show", "hide");
  void el.offsetWidth;
  el.classList.add("show");
  // stays for a few seconds, then fades away
  remarkTimer = setTimeout(() => {
    el.classList.add("hide");
    remarkTimer2 = setTimeout(clearRemark, 550);
  }, 4800);
}
function showRemark() { showBox("\u201C" + nextRemark() + "\u201D"); }
function clearRemark() {
  clearTimeout(remarkTimer);
  clearTimeout(remarkTimer2);
  const el = $("remark");
  el.textContent = "";
  el.classList.remove("show", "hide");
}
$("generate").addEventListener("click", clearRemark);

$("surprise").addEventListener("click", (e) => {
  applyList(Array.from({ length: 5 }, () => hsl(rnd(0, 360), rnd(30, 95), rnd(25, 85))));
  burst(e.clientX, e.clientY);
  showRemark();
});

$("trickster").addEventListener("click", (e) => {
  const h = rnd(0, 360);
  const hues = [0, 137, 222, 45, 301].map((o) => h + o + rnd(-15, 15));
  const sats = shuffle([95, 20, 85, 10, 100]);
  const lights = shuffle([20, 90, 45, 70, 35]);
  applyList(hues.map((x, i) => hsl(x, sats[i], lights[i])));
  burst(e.clientX, e.clientY);
  showRemark();
});

$("alchemist").addEventListener("click", (e) => {
  let src = state.findIndex((s) => s.locked);
  if (src < 0) src = 0;
  const b = hexToHsl(state[src].hex);
  const v = [
    hsl(b.h + 25, b.s, b.l + 12),
    hsl(b.h - 25, b.s, b.l - 12),
    hsl(b.h + 180, b.s - 10, b.l),
    hsl(b.h + 205, b.s, b.l + 18),
  ];
  let k = 0;
  applyList(state.map((s, i) => (i === src ? s.hex : v[k++])));
  burst(e.clientX, e.clientY);
  showBox("Transformed from colour " + (src + 1));
});


/* ===== Themes (side tab) ===== */
const THEMES = {
  "moonlit-orchid": { name: "Moonlit Orchid",        dots: ["#FFEBEE", "#F8BBD9", "#CE93D8", "#BA68C8", "#AB47BC"] },
  "berry-cauldron": { name: "Berry Cauldron", dots: ["#D66B9A", "#B83D78", "#8B2A5C", "#5C1A3B", "#2D0A1E"] },
  "cherry-hex": { name: "Cherry Hex",     dots: ["#D64070", "#B82850", "#8A1E3C", "#5C1428", "#2E0A14"] },
  "storm-charm": { name: "Storm Charm",    dots: ["#C7D4DF", "#8DA1B4", "#5A7186", "#374955", "#1E2832"] },
  "mermaid-brew": { name: "Mermaid Brew",     dots: ["#90E0EF", "#00B4D8", "#0077B6", "#023E8A", "#03045E"] },
  "candlelit-honey": { name: "Candlelit Honey", dots: ["#F5DEB3", "#E8C9A0", "#DEB887", "#D4A574", "#C9A86C"] },
  "cupcake-coven": { name: "Cupcake Coven",      dots: ["#FF69B4", "#FFFACD", "#ADD8E6", "#F5DEB3", "#FFFFFF"] },
  "dune-alchemist": { name: "Dune Alchemist",        dots: ["#F5DEB3", "#D4A574", "#C77B4A", "#8B4513", "#4A2C17"] },
  "mossy-grimoire": { name: "Mossy Grimoire",     dots: ["#6BB89B", "#4A8B7A", "#2E5C5C", "#1A3D3D", "#0A1A1A"] },
  "strawberry-matcha": { name: "Strawberry Matcha", dots: ["#FEFFF5", "#E2E1CA", "#E0B9C5", "#B2C7A6", "#3A3936"] },
  "night-owl":         { name: "Night Owl",         dots: ["#32324F", "#28283F", "#1E1E2F", "#14141F", "#0A0A0F"] },
  "hallows-eve":       { name: "Hallows Eve",       dots: ["#F5F5F0", "#FF9933", "#FF6600", "#3D3D3D", "#1A1A1A"] },
};
const themesEl = $("themes");
const themesPanel = $("themesPanel");

themesPanel.appendChild(make("p", "vname", "Themes"));
Object.entries(THEMES).forEach(([key, t]) => {
  const b = make("button", "theme-opt");
  b.type = "button";
  b.dataset.theme = key;
  b.appendChild(make("span", "", t.name));
  const row = make("span", "dots");
  t.dots.forEach((c) => { const d = document.createElement("i"); d.style.background = c; row.appendChild(d); });
  b.appendChild(row);
  b.addEventListener("click", () => applyTheme(key));
  themesPanel.appendChild(b);
});

function toggleThemes(force) {
  const open = force === undefined ? !themesEl.classList.contains("open") : force;
  themesEl.classList.toggle("open", open);
  $("themesTab").setAttribute("aria-expanded", open);
}
$("themesTab").addEventListener("click", () => toggleThemes());
document.addEventListener("click", (e) => { if (themesEl.classList.contains("open") && !themesEl.contains(e.target)) toggleThemes(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleThemes(false); });

function applyTheme(key) {
  if (!THEMES[key]) key = "moonlit-orchid";
  document.documentElement.dataset.theme = key;
  store.set("soc.theme", key);
  [...themesPanel.querySelectorAll(".theme-opt")].forEach((b) => b.classList.toggle("on", b.dataset.theme === key));
  state.forEach((_, i) => paint(i));
  renderAll();
  renderGrimoire();
  renderMood();
}

/* ===== Phase V: contrast checker and PNG export ===== */
function lum(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

let fgCol = "#3B1B47";
let bgCol = "#FFEBEE";

function renderContrast() {
  $("fgPick").value = fgCol.toLowerCase(); $("fgHex").value = fgCol;
  $("bgPick").value = bgCol.toLowerCase(); $("bgHex").value = bgCol;
  const sample = $("sample");
  sample.style.color = fgCol;
  sample.style.background = bgCol;
  const r = contrast(fgCol, bgCol);
  $("ratio").textContent = (Math.floor(r * 100) / 100).toFixed(2) + " : 1";
  $("verdict").textContent = r >= 7 ? "Excellent. Easy to read." : r >= 4.5 ? "Good for everyday text." : r >= 3 ? "Fine for big text and icons only." : "Too faint. Try another pair.";
  const rules = [["Normal text, AA", 4.5], ["Normal text, AAA", 7], ["Large text, AA", 3], ["Large text, AAA", 4.5], ["Buttons and icons", 3]];
  $("checks").replaceChildren(...rules.map(([name, min]) => {
    const ok = r >= min;
    const row = make("div", "check " + (ok ? "pass" : "fail"));
    row.append(make("span", "", name), make("b", "", ok ? "✓ Pass" : "✕ Fail"));
    return row;
  }));
}

function setColour(which, value) {
  const ok = normaliseHex(value);
  if (!ok) { showToast("Use a hex code like #AB47BC"); renderContrast(); return; }
  if (which === "fg") fgCol = ok; else bgCol = ok;
  renderContrast();
}
$("fgPick").addEventListener("input", (e) => setColour("fg", e.target.value));
$("bgPick").addEventListener("input", (e) => setColour("bg", e.target.value));
$("fgHex").addEventListener("change", (e) => setColour("fg", e.target.value));
$("bgHex").addEventListener("change", (e) => setColour("bg", e.target.value));
$("swapColors").addEventListener("click", () => { [fgCol, bgCol] = [bgCol, fgCol]; renderContrast(); });
$("bestPair").addEventListener("click", () => {
  const c = labColors();
  let best = [c[0], c[1], 0];
  for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) {
    const r = contrast(c[i], c[j]);
    if (r > best[2]) best = [c[i], c[j], r];
  }
  const [a, b] = best;
  if (lum(a) < lum(b)) { fgCol = a; bgCol = b; } else { fgCol = b; bgCol = a; }
  renderContrast();
});

/* ---------- PNG export ---------- */
function paletteCanvas(colors, name) {
  const W = 1500, H = 600, band = 70;
  const cv2 = document.createElement("canvas");
  cv2.width = W; cv2.height = H;
  const g = cv2.getContext("2d");
  const w = W / colors.length;
  colors.forEach((hex, i) => {
    g.fillStyle = hex;
    g.fillRect(i * w, 0, w, H);
    g.fillStyle = textOn(hex);
    g.font = "700 38px Cinzel, serif";
    g.textAlign = "left";
    g.fillText(hex, i * w + 34, H - band - 34);
  });
  g.fillStyle = css("--pink-pale");
  g.fillRect(0, H - band, W, band);
  g.fillStyle = css("--plum");
  g.font = "700 28px Cinzel, serif";
  g.textAlign = "left";
  g.fillText((name || "Palette").toUpperCase(), 34, H - 26);
  g.textAlign = "right";
  g.fillText("SORCERY OF COLOR", W - 34, H - 26);
  return cv2;
}
async function downloadPNG(colors, name) {
  try { await document.fonts.load("700 38px Cinzel"); } catch (e) { /* fall back to default serif */ }
  const canvas = paletteCanvas(colors, name);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) { showToast("Could not make the image"); return; }
  const filename = (name || "palette").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
  const file = new File([blob], filename, { type: "image/png" });
  const url = URL.createObjectURL(blob);

  const overlay = make("div", "imgdlg");
  const box = make("div", "imgdlg-box");
  const img = document.createElement("img");
  img.src = url;
  img.alt = "Your palette: " + colors.join(", ");
  const hint = make("p", "why", "Press and hold the picture to save it, or tap Save.");
  const row = make("div", "pills");
  const close = () => { overlay.remove(); URL.revokeObjectURL(url); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  row.append(
    smallButton("Save", async () => {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: name || "Palette" });
          return;
        }
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("If nothing downloaded, press and hold the picture");
    }),
    smallButton("Close", close),
  );
  box.append(img, hint, row);
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}
$("pngBtn").addEventListener("click", () => downloadPNG(labColors(), "Sorcery palette"));

/* ===== Spell dock: pixel icons ===== */
const ICONS = {
  star:  ["....#....", "....#....", "...###...", "...###...", "#########", "...###...", "...###...", "....#....", "....#...."],
  dice:  ["#######", "#.....#", "#.#.#.#", "#.....#", "#.#.#.#", "#.....#", "#######"],
  mask:  [".#######.", "#########", "##.###.##", "#########", ".##...##.", "..#####.."],
  flask: ["..###..", "..###..", "..###..", ".#####.", "#######", "##.####", "#######", ".#####."],
  heart: [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."],
  copy:  ["####...", "#..#...", "#..####", "####..#", "...#..#", "...####"],
  lock:     ["..###..", ".#...#.", ".#...#.", "#######", "#######", "###.###", "###.###", "#######"],
  lockopen: ["..###..", ".#...#.", ".#.....", "#######", "#######", "###.###", "###.###", "#######"],
  help:  [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."],
  down:  ["...#...", "...#...", "...#...", "#.###.#", ".#####.", "..###..", "...#..."],
};
function pixelIcon(rows, scale) {
  let d = "";
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === "#") d += "M" + x + " " + y + "h1v1h-1z"; }));
  const w = rows[0].length, h = rows.length;
  return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w * scale + '" height="' + h * scale + '" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true"><path d="' + d + '"/></svg>';
}
document.querySelectorAll("[data-sprite]").forEach((el) => {
  el.innerHTML = pixelIcon(ICONS[el.dataset.sprite], +el.dataset.scale || 2);
});

/* ===== Help window ===== */
function openHelp() {
  if (document.querySelector(".imgdlg.help")) return;
  const overlay = make("div", "imgdlg help");
  const box = make("div", "imgdlg-box helpbox");
  const list = make("dl", "helplist");
  [
    ["Generate", "Makes a new palette. On a keyboard, press the space bar."],
    ["Lock", "Tap Lock on a colour to keep it when you generate again."],
    ["Surprise", "Five completely random colours."],
    ["Trickster", "Unusual, clashing colours that shouldn't work, but do."],
    ["Alchemist", "Builds a palette around your locked colour, or the first colour if none is locked."],
    ["Lock tab", "Lock keeps the dock on screen as you scroll. Release lets it rest at the bottom of the page."],
    ["Save", "Adds the palette to My Grimoire."],
    ["Copy codes", "Copies all five hex codes."],
    ["PNG", "Makes a picture of the palette."],
  ].forEach(([t, d]) => list.append(make("dt", "", t), make("dd", "", d)));
  const row = make("div", "pills");
  const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  row.appendChild(smallButton("Close", close));
  box.append(make("h3", "helptitle", "How it works"), list, row);
  overlay.appendChild(box);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
}
$("helpBtn").addEventListener("click", openHelp);

/* ===== Harmony: free picker (square + hue strip) ===== */
let free = { ...base };   // the free picker has its own colour, separate from the harmony base
const svCv = $("svPick"), svCtx = svCv.getContext("2d");
const hueCv = $("huePick"), hueCtx = hueCv.getContext("2d");

function drawPicker() {
  const W = svCv.width, H = svCv.height;
  svCtx.fillStyle = "hsl(" + free.h + ",100%,50%)";
  svCtx.fillRect(0, 0, W, H);
  let g = svCtx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "#fff"); g.addColorStop(1, "rgba(255,255,255,0)");
  svCtx.fillStyle = g; svCtx.fillRect(0, 0, W, H);
  g = svCtx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "#000");
  svCtx.fillStyle = g; svCtx.fillRect(0, 0, W, H);

  // where the current colour sits in the square
  const l = free.l / 100, sl = free.s / 100;
  const v = l + sl * Math.min(l, 1 - l);
  const sv = v === 0 ? 0 : 2 * (1 - l / v);
  const px = sv * W, py = (1 - v) * H;
  svCtx.beginPath();
  svCtx.moveTo(px, py - 22); svCtx.lineTo(px + 22, py); svCtx.lineTo(px, py + 22); svCtx.lineTo(px - 22, py);
  svCtx.closePath();
  svCtx.fillStyle = hsl(free.h, free.s, free.l); svCtx.fill();
  svCtx.lineWidth = 5; svCtx.strokeStyle = "#FFFFFF"; svCtx.stroke();
  svCtx.lineWidth = 2; svCtx.strokeStyle = "#1A1A1A"; svCtx.stroke();

  const hw = hueCv.width, hh = hueCv.height;
  const hg = hueCtx.createLinearGradient(0, 0, hw, 0);
  for (let i = 0; i <= 6; i++) hg.addColorStop(i / 6, "hsl(" + i * 60 + ",100%,50%)");
  hueCtx.fillStyle = hg; hueCtx.fillRect(0, 0, hw, hh);
  const hx = (free.h / 360) * hw;
  hueCtx.fillStyle = "#FFFFFF"; hueCtx.fillRect(hx - 8, 0, 16, hh);
  hueCtx.lineWidth = 3; hueCtx.strokeStyle = "#1A1A1A"; hueCtx.strokeRect(hx - 8, 1.5, 16, hh - 3);
}

function pickSquare(e) {
  const r = svCv.getBoundingClientRect();
  const x = clamp((e.clientX - r.left) / r.width, 0, 1);
  const v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
  const l = v * (1 - x / 2);
  const s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  free.s = Math.round(clamp(s, 0, 1) * 100);
  free.l = Math.round(l * 100);
  renderFree();
}
function pickHue(e) {
  const r = hueCv.getBoundingClientRect();
  free.h = Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * 359);
  renderFree();
}
[[svCv, pickSquare], [hueCv, pickHue]].forEach(([cvEl, fn]) => {
  let down = false;
  cvEl.addEventListener("pointerdown", (e) => { down = true; cvEl.setPointerCapture(e.pointerId); fn(e); });
  cvEl.addEventListener("pointermove", (e) => { if (down) fn(e); });
  cvEl.addEventListener("pointerup", () => { down = false; });
  cvEl.addEventListener("pointercancel", () => { down = false; });
});

function renderFree() {
  drawPicker();
  const hex = hsl(free.h, free.s, free.l);
  fill($("freeChip"), [hex]);
  const { r, g, b } = hexToRgb(hex);
  $("freeInfo").textContent = "RGB " + r + ", " + g + ", " + b + ".  HSL " + free.h + ", " + free.s + "%, " + free.l + "%.";
}
$("freeToBase").addEventListener("click", () => { base = { ...free }; renderAll(); showToast("Now the base colour"); });

/* ===== Dock: lock and release ===== */
function setPinned(pinned) {
  $("dockWrap").classList.toggle("pinned", pinned);
  document.body.classList.toggle("dock-pinned", pinned);
  $("pinBtn").setAttribute("aria-pressed", pinned);
  $("pinBtn").title = pinned ? "Release the dock to the bottom of the page" : "Lock the dock to the screen";
  $("pinLabel").textContent = pinned ? "Release" : "Lock";
  store.set("soc.dockPinned", pinned);
}
$("pinBtn").addEventListener("click", () => setPinned(!$("dockWrap").classList.contains("pinned")));

/* ===== Studio: a shelf for tools. Each tool lives in its own file and registers itself ===== */
const STUDIO = { tools: [], active: null };
function registerTool(id, label, build, onShow) {
  STUDIO.tools.push({ id, label, build, onShow, el: null });
  studioRefresh();
}
function studioRefresh() {
  const stage = $("studioStage");
  if (!stage || !STUDIO.tools.length) return;
  if (!STUDIO.active) STUDIO.active = STUDIO.tools[0].id;
  $("studioNav").replaceChildren(...STUDIO.tools.map((t) => {
    const b = smallButton(t.label, () => { STUDIO.active = t.id; studioRefresh(); });
    b.classList.toggle("on", t.id === STUDIO.active);
    return b;
  }));
  STUDIO.tools.forEach((t) => {
    if (!t.el) { t.el = make("div", "tool"); stage.appendChild(t.el); t.build(t.el); }
    t.el.hidden = t.id !== STUDIO.active;
  });
  const cur = STUDIO.tools.find((t) => t.id === STUDIO.active);
  if (cur && cur.onShow && !$("view-studio").hidden) cur.onShow(cur.el);
}

/* ---------- start up ---------- */
setPinned(store.get("soc.dockPinned", false));
renderContrast();
applyTheme(store.get("soc.theme", "moonlit-orchid"));
pushRecent();
renderAll();
show((location.hash || "#lab").slice(1));
