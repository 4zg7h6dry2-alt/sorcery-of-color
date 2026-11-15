/* Colour Thief: upload a picture, steal its colours.
   Needs script.js (it uses its helpers). Pictures never leave the device. */
(function () {
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const toHex = (c) => "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();

  /* the main colours of a picture, biggest first */
  function extract(px, k) {
    if (!px.length) return [];
    const buckets = new Map();
    px.forEach((p) => {
      const key = ((p[0] >> 4) << 8) | ((p[1] >> 4) << 4) | (p[2] >> 4);
      const b = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      b.n++; b.r += p[0]; b.g += p[1]; b.b += p[2];
      buckets.set(key, b);
    });
    const ranked = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => [b.r / b.n, b.g / b.n, b.b / b.n]);
    const cent = [];
    for (const c of ranked) {
      if (cent.every((o) => dist(o, c) > 48)) cent.push(c);
      if (cent.length === k) break;
    }
    const nearest = (p) => { let best = 0, bd = Infinity; cent.forEach((c, j) => { const d = dist(c, p); if (d < bd) { bd = d; best = j; } }); return best; };
    for (let i = 0; i < 8; i++) {
      const sums = cent.map(() => [0, 0, 0, 0]);
      px.forEach((p) => { const s = sums[nearest(p)]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
      sums.forEach((s, j) => { if (s[3]) cent[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    const counts = cent.map(() => 0);
    px.forEach((p) => { counts[nearest(p)]++; });
    const seen = new Set();
    return cent
      .map((c, j) => ({ hex: toHex(c), share: counts[j] / px.length }))
      .filter((o) => o.share > 0)
      .sort((a, b) => b.share - a.share)
      .filter((o) => !seen.has(o.hex) && seen.add(o.hex));
  }

  function build(el) {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.hidden = true;
    const choose = smallButton("Choose an image", () => input.click());
    choose.classList.add("on");
    const chooseRow = make("div", "pills");
    chooseRow.appendChild(choose);
    const note = make("p", "why", "Pick a photo, screenshot or artwork. Everything happens on this device. Nothing is uploaded.");

    const canvas = document.createElement("canvas");
    canvas.className = "thief-canvas";
    const pickedBox = make("div", "chips");
    const previewBox = make("div", "tool");
    previewBox.hidden = true;
    previewBox.append(canvas, make("p", "why", "Tap the picture to pick any single colour from it."), pickedBox);
    const res = make("div", "tool");
    el.append(input, chooseRow, note, previewBox, res);

    function section(title, ...nodes) {
      const box = make("div", "panel");
      box.append(make("span", "vname", title), ...nodes);
      return box;
    }
    const variant = (hex, dl) => { const c = hexToHsl(hex); return hsl(c.h, c.s, c.l + dl); };

    function showResults(found) {
      const hexes = found.map((f) => f.hex);
      const cols = make("div", "tcols");
      found.forEach((f) => {
        const col = make("div", "tcol");
        col.append(chip(f.hex), make("span", "", f.share < 0.01 ? "<1%" : Math.round(f.share * 100) + "%"));
        cols.appendChild(col);
      });
      const actions = make("div", "pills");
      actions.append(
        smallButton("Use in Laboratory", () => loadToLab(hexes)),
        smallButton("Save", () => savePalette(hexes)),
        smallButton("PNG", () => downloadPNG(hexes, "Colour thief")),
      );
      const codes = make("p", "why", hexes.join("   "));
      const copyBtn = make("div", "pills");
      copyBtn.appendChild(smallButton("Copy codes", () => copy(hexes.join(", "), "Copied all codes")));
      const light = make("div", "chips"), dark = make("div", "chips");
      fill(light, hexes.map((h) => variant(h, 16)));
      fill(dark, hexes.map((h) => variant(h, -16)));
      res.replaceChildren(
        section("Dominant colours", cols),
        section("Five-colour palette", strip(hexes), actions),
        section("Hex codes", codes, copyBtn),
        section("Lighter versions", light),
        section("Darker versions", dark),
      );
      if (found.length < 5) res.appendChild(make("p", "why", "This picture only has " + found.length + " clearly different colours."));
    }

    function process(img) {
      const scale = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = Math.max(1, Math.floor(Math.sqrt((canvas.width * canvas.height) / 5000)));
      const px = [];
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          if (data[i + 3] > 125) px.push([data[i], data[i + 1], data[i + 2]]);
        }
      }
      previewBox.hidden = false;
      pickedBox.replaceChildren();
      const found = extract(px, 5);
      if (!found.length) { res.replaceChildren(make("p", "why", "That picture looks empty. Try another one.")); return; }
      showResults(found);
    }

    function handleFile(file) {
      if (!file || !file.type.startsWith("image/")) { showToast("Please choose an image"); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { process(img); URL.revokeObjectURL(url); };
      img.onerror = () => { showToast("Could not open that image"); URL.revokeObjectURL(url); };
      img.src = url;
    }
    input.addEventListener("change", () => { handleFile(input.files[0]); input.value = ""; });
    el.addEventListener("dragover", (e) => e.preventDefault());
    el.addEventListener("drop", (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); });

    canvas.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = clamp(Math.floor(((e.clientX - r.left) * canvas.width) / r.width), 0, canvas.width - 1);
      const y = clamp(Math.floor(((e.clientY - r.top) * canvas.height) / r.height), 0, canvas.height - 1);
      const d = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
      pickedBox.replaceChildren(chip(toHex([d[0], d[1], d[2]])));
    });
  }

  registerTool("thief", "Colour Thief", build);
  window.SOC = window.SOC || {};
  window.SOC.extract = extract;
})();
