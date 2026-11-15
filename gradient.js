/* Gradient Maker: three blends of the day, a maker, and your saved gradients.
   Needs script.js (it uses its helpers). */
(function () {
  const TYPES = ["linear", "radial", "conic"];
  const WORDS_A = ["Velvet", "Moonlit", "Honeyed", "Electric", "Dusty", "Glass", "Midnight", "Peachy", "Wild", "Sleepy", "Silken", "Neon", "Foggy", "Candied", "Hushed", "Gilded"];
  const WORDS_B = ["Hour", "Haze", "Spell", "Tide", "Bloom", "Static", "Lullaby", "Mirage", "Sorbet", "Ember", "Dream", "Orbit", "Whisper", "Aurora", "Potion", "Glow"];

  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dayKey() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }

  function cssFor(g) {
    const stops = [...g.stops].sort((a, b) => a.pos - b.pos).map((s) => s.hex + " " + s.pos + "%").join(", ");
    if (g.type === "radial") return "radial-gradient(circle at center, " + stops + ")";
    if (g.type === "conic") return "conic-gradient(from " + g.angle + "deg at 50% 50%, " + stops + ")";
    return "linear-gradient(" + g.angle + "deg, " + stops + ")";
  }
  const copyCss = (g) => copy("background: " + cssFor(g) + ";", "Copied the gradient CSS");

  /* three different blends, the same all day, new ones tomorrow */
  function dailyBlends() {
    const rnd = seeded(dayKey());
    const pool = typeof curated !== "undefined" ? curated.map((c) => c.colors) : [labColors()];
    const picks = [];
    while (picks.length < Math.min(3, pool.length)) {
      const i = Math.floor(rnd() * pool.length);
      if (!picks.includes(i)) picks.push(i);
    }
    return picks.map((pi, k) => {
      const cols = [...pool[pi]];
      for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
      const n = 3 + Math.floor(rnd() * 2);
      const chosen = cols.slice(0, n).sort((a, b) => hexToHsl(a).l - hexToHsl(b).l);
      return {
        name: WORDS_A[Math.floor(rnd() * WORDS_A.length)] + " " + WORDS_B[Math.floor(rnd() * WORDS_B.length)],
        type: TYPES[k % 3],
        angle: Math.floor(rnd() * 72) * 5,
        stops: chosen.map((hex, i) => ({ hex, pos: Math.round((i / (n - 1)) * 100) })),
      };
    });
  }

  const copyOf = (g) => ({ type: g.type, angle: g.angle, stops: g.stops.map((s) => ({ ...s })) });
  let saved = store.get("soc.gradients", []);
  const maker = { type: "linear", angle: 135, stops: [] };

  function defaultStops() {
    const c = labColors();
    return [c[0], c[2], c[4]].map((hex, i) => ({ hex, pos: [0, 50, 100][i] }));
  }

  function build(el) {
    maker.stops = defaultStops();
    const sub = make("div", "pills");
    const panes = { today: make("div", "tool"), make: make("div", "tool"), saved: make("div", "tool") };
    const subBtns = {};
    function showPane(name) {
      Object.entries(panes).forEach(([k, p]) => { p.hidden = k !== name; });
      Object.entries(subBtns).forEach(([k, b]) => b.classList.toggle("on", k === name));
      if (name === "saved") renderSaved();
    }
    [["today", "Today"], ["make", "Make your own"], ["saved", "Saved"]].forEach(([k, label]) => {
      subBtns[k] = smallButton(label, () => showPane(k));
      sub.appendChild(subBtns[k]);
    });

    /* ----- today ----- */
    const todayBox = make("div", "gridp");
    panes.today.append(make("p", "why", "Three blends, fresh every day. Tap Edit to tweak one."), todayBox);
    function renderToday() {
      todayBox.replaceChildren(...dailyBlends().map((g) => {
        const card = make("article", "gcard");
        const prev = make("div", "gprev");
        prev.style.background = cssFor(g);
        const row = make("div", "pills");
        row.append(
          smallButton("Copy CSS", () => copyCss(g)),
          smallButton("Edit", () => { Object.assign(maker, copyOf(g)); rebuildStops(); update(); showPane("make"); }),
          smallButton("Save", () => saveGradient(g, g.name)),
        );
        card.append(prev, make("div", "cname", g.name), make("p", "why", g.type + (g.type === "radial" ? "" : ", " + g.angle + " degrees")), row);
        return card;
      }));
    }

    /* ----- maker ----- */
    const preview = make("div", "gprev big");
    const out = make("pre", "gcode");
    const typeRow = make("div", "pills");
    const typeBtns = TYPES.map((t) => {
      const b = smallButton(t[0].toUpperCase() + t.slice(1), () => { maker.type = t; update(); });
      typeRow.appendChild(b);
      return b;
    });
    const angleRow = make("label", "angle");
    const angleRange = document.createElement("input");
    angleRange.type = "range"; angleRange.min = 0; angleRange.max = 360;
    const angleVal = make("span", "");
    angleRow.append(make("span", "", "Angle"), angleRange, angleVal);
    angleRange.addEventListener("input", () => { maker.angle = +angleRange.value; update(); });
    const stopsBox = make("div", "tool");

    function update() {
      preview.style.background = cssFor(maker);
      out.textContent = "background: " + cssFor(maker) + ";";
      typeBtns.forEach((b, i) => b.classList.toggle("on", TYPES[i] === maker.type));
      angleRow.hidden = maker.type === "radial";
      angleRange.value = maker.angle;
      angleVal.textContent = maker.angle + "°";
    }
    function rebuildStops() {
      stopsBox.replaceChildren(...maker.stops.map((s, i) => {
        const row = make("div", "stoprow");
        const pick = document.createElement("input");
        pick.type = "color"; pick.value = s.hex.toLowerCase();
        pick.setAttribute("aria-label", "Colour " + (i + 1));
        const hexIn = make("input", "field");
        hexIn.value = s.hex; hexIn.maxLength = 7; hexIn.spellcheck = false;
        const pos = make("input", "field");
        pos.type = "number"; pos.min = 0; pos.max = 100; pos.value = s.pos;
        pos.setAttribute("aria-label", "Position " + (i + 1));
        const del = smallButton("Del", () => { if (maker.stops.length > 2) { maker.stops.splice(i, 1); rebuildStops(); update(); } });
        pick.addEventListener("input", () => { s.hex = pick.value.toUpperCase(); hexIn.value = s.hex; update(); });
        hexIn.addEventListener("change", () => {
          const ok = normaliseHex(hexIn.value);
          if (ok) { s.hex = ok; pick.value = ok.toLowerCase(); update(); } else { showToast("Use a hex code like #AB47BC"); }
          hexIn.value = s.hex;
        });
        pos.addEventListener("change", () => { s.pos = clamp(Math.round(+pos.value || 0), 0, 100); pos.value = s.pos; update(); });
        row.append(pick, hexIn, pos, del);
        return row;
      }));
    }

    const actions = make("div", "pills");
    actions.append(
      smallButton("Add colour", () => {
        if (maker.stops.length >= 6) { showToast("Six colours is the limit"); return; }
        const last = maker.stops[maker.stops.length - 1];
        maker.stops.push({ hex: hsl(Math.random() * 360, 70, 60), pos: clamp(last.pos + 10, 0, 100) });
        rebuildStops(); update();
      }),
      smallButton("Laboratory colours", () => {
        const c = labColors();
        maker.stops = c.map((hex, i) => ({ hex, pos: Math.round((i / (c.length - 1)) * 100) }));
        rebuildStops(); update();
      }),
      smallButton("Surprise me", () => {
        const pool = typeof curated !== "undefined" ? curated.map((c) => c.colors) : [labColors()];
        const cols = [...pool[Math.floor(Math.random() * pool.length)]].sort((a, b) => hexToHsl(a).l - hexToHsl(b).l);
        maker.type = TYPES[Math.floor(Math.random() * 3)];
        maker.angle = Math.floor(Math.random() * 72) * 5;
        maker.stops = cols.map((hex, i) => ({ hex, pos: Math.round((i / (cols.length - 1)) * 100) }));
        rebuildStops(); update();
      }),
    );
    const actions2 = make("div", "pills");
    actions2.append(
      smallButton("Copy CSS", () => copyCss(maker)),
      smallButton("Save", () => saveGradient(maker, "")),
    );
    panes.make.append(preview, typeRow, angleRow, stopsBox, actions, out, actions2);

    /* ----- saved ----- */
    const savedBox = make("div", "gridp");
    panes.saved.appendChild(savedBox);
    function renderSaved() {
      if (!saved.length) {
        const empty = make("div", "panel");
        empty.append(make("p", "why", "No saved gradients yet. Make one, then tap Save."), smallButton("Make one", () => showPane("make")));
        savedBox.replaceChildren(empty);
        return;
      }
      savedBox.replaceChildren(...saved.map((g) => {
        const card = make("article", "gcard");
        const prev = make("div", "gprev");
        prev.style.background = cssFor(g);
        const name = make("input", "field gname");
        name.value = g.name; name.setAttribute("aria-label", "Gradient name");
        name.addEventListener("change", () => { g.name = name.value.trim() || "My gradient"; store.set("soc.gradients", saved); });
        const row = make("div", "pills");
        const del = smallButton("Delete", () => {
          if (!del.classList.contains("on")) {
            del.classList.add("on"); del.textContent = "Sure?";
            setTimeout(() => { del.classList.remove("on"); del.textContent = "Delete"; }, 2200);
            return;
          }
          saved = saved.filter((x) => x.id !== g.id);
          store.set("soc.gradients", saved);
          renderSaved();
        });
        row.append(
          smallButton("Edit", () => { Object.assign(maker, copyOf(g)); rebuildStops(); update(); showPane("make"); }),
          smallButton("Copy CSS", () => copyCss(g)),
          del,
        );
        card.append(prev, name, row);
        return card;
      }));
    }
    function saveGradient(g, name) {
      saved.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: name || "My gradient " + (saved.length + 1), ...copyOf(g) });
      store.set("soc.gradients", saved);
      showToast("Saved to your gradients");
    }

    el.append(sub, panes.today, panes.make, panes.saved);
    rebuildStops();
    update();
    renderToday();
    showPane("today");
    el.refreshToday = renderToday;
  }

  registerTool("gradients", "Gradients", build, (el) => { if (el.refreshToday) el.refreshToday(); });
  window.SOC = window.SOC || {};
  window.SOC.cssFor = cssFor;
  window.SOC.dailyBlends = dailyBlends;
})();
