/// Starting palette
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

function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.35 ? "#3B1B47" : "#FFFFFF";
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
  burst(e.clientX, e.clientY, "#AB47BC");
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
  for (let n = 0; n < 10; n++) {
    const s = document.createElement("span");
    s.className = "spark";
    const ang = (n / 10) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.setProperty("--k", n % 2 ? color : "#F8BBD9");
    s.style.setProperty("--x", Math.cos(ang) * dist + "px");
    s.style.setProperty("--y", Math.sin(ang) * dist + "px");
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 850);
  }
}

/* ---------- floating background stars ---------- */
if (!reduceMotion) {
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0L14.6 9.4 24 12 14.6 14.6 12 24 9.4 14.6 0 12 9.4 9.4Z"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  for (let n = 0; n < 30; n++) {
    const s = document.createElement("span");
    s.className = "star";
    s.innerHTML = n % 3 === 0 ? MOON : STAR;
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    const size = 12 + Math.random() * 22;
    s.style.width = size + "px";
    s.style.height = size + "px";
    s.style.setProperty("--d", 4 + Math.random() * 5 + "s");
    s.style.setProperty("--delay", -Math.random() * 6 + "s");
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
  ctx.lineWidth = 3; ctx.strokeStyle = "#3B1B47"; ctx.stroke();
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
  ctx.lineWidth = 3; ctx.strokeStyle = "#3B1B47";
  ctx.strokeRect(c - r * 0.6, c - r * 0.6, r * 1.2, r * 1.2);

  const t = types[type];
  const hues = t.mono ? [base.h] : t.o.map((o) => base.h + o);
  hues.forEach((h, k) => {
    const a = (mod(h) * Math.PI) / 180 - Math.PI / 2;
    const rr = (R + r) / 2;
    diamond(c + Math.cos(a) * rr, c + Math.sin(a) * rr, k === 0 ? 26 : 18, k === 0 ? "#FFFFFF" : "#FFEBEE");
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

const satEl = document.getElementById("sat");
const ligEl = document.getElementById("lig");
satEl.addEventListener("input", () => { base.s = +satEl.value; renderAll(); });
ligEl.addEventListener("input", () => { base.l = +ligEl.value; renderAll(); });

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
  satEl.value = base.s;
  ligEl.value = base.l;
  drawWheel();
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

function savePalette(colors) {
  grimoire.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: "Untitled spell " + (grimoire.length + 1),
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

$("saveBtn").addEventListener("click", (e) => { savePalette(labColors()); burst(e.clientX, e.clientY, "#AB47BC"); });
$("copyBook").addEventListener("click", () => {
  if (!grimoire.length) { showToast("Your grimoire is empty"); return; }
  copy(grimoire.map((g) => g.name + " (" + g.col + ")" + (g.desc ? "\n" + g.desc : "") + "\n" + g.colors.join(", ")).join("\n\n"), "Copied your whole grimoire");
});

/* ---------- start up ---------- */
pushRecent();
renderAll();
show((location.hash || "#lab").slice(1));
