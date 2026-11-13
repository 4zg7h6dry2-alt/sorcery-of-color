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
  burst(e.clientX, e.clientY, "#AB47BC");
});
document.getElementById("copyAll").addEventListener("click", () => {
  copy(state.map((s) => s.hex).join(", "), "Copied all five codes");
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
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
  const glyphs = ["✦", "✧", "◆", "✦"];
  const tints = ["#AB47BC", "#BA68C8", "#CE93D8", "#F8BBD9"];
  for (let n = 0; n < 28; n++) {
    const s = document.createElement("span");
    s.className = "star";
    s.textContent = glyphs[n % glyphs.length];
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.fontSize = 10 + Math.random() * 22 + "px";
    s.style.color = tints[n % tints.length];
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
