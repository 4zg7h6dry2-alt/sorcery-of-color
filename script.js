/* ==========================================
   THE ENCHANTED ATELIER: ALCHEMICAL ENGINE
   ========================================== */

// --- 0. ATMOSPHERIC CHAMBER THEME SWITCHER ---
const bgThemeSelect = document.getElementById('bgThemeSelect');

bgThemeSelect.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    localStorage.setItem('atelier_theme', e.target.value);
    showNotification(`Chamber shift: ${e.target.options[e.target.selectedIndex].text}`);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('atelier_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        bgThemeSelect.value = savedTheme;
    }
});


// --- 1. THE PRIMARY ESSENCE GENERATOR ---
const paletteGrid = document.getElementById('paletteGrid');
const generateBtn = document.getElementById('generateBtn');
const savePaletteBtn = document.getElementById('savePaletteBtn');

let currentPalette = [];

function generateRandomHex() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function renderPrimaryPalette() {
    paletteGrid.innerHTML = '';
    currentPalette = [];

    for (let i = 0; i < 5; i++) {
        const hex = generateRandomHex();
        currentPalette.push(hex);

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = hex;
        
        swatch.innerHTML = `<div class="swatch-hex" title="Click to copy">${hex}</div>`;

        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            showNotification(`ESSENCE CAPTURED: ${hex}`);
        });

        paletteGrid.appendChild(swatch);
    }
}


// --- 2. THE ALCHEMIST’S ANOMALY & CUSTOM SWATCH TRAY ---
const anomalySwatchesContainer = document.getElementById('anomalySwatches');
const customPickersRow = document.getElementById('customPickersRow');
const brewAnomalyBtn = document.getElementById('brewAnomalyBtn');
const saveAnomalyBtn = document.getElementById('saveAnomalyBtn');
const anomalyNote = document.getElementById('anomalyNote');

let anomalyColors = [];

// Your custom remarks & workshop margin notes
const alchemicalNotes = [
    "\"A volatile reaction of untamed wavelengths. Use at your own aesthetic peril.\"",
    "\"Unexpected, but I do adore surprises.\"",
    "\"Oh..! behave!\"",
    "\"Oh, the possibilities!\"",
    "\"Yuck.\"",
    "\"Do not stare too long.\"",
    "\"Too much? Darling, there's no such thing.\"",
    "\"Oh, this one has character!\"",
    "\"There we are. Absolutely bewitching.\"",
    "\"A little more warmth, perhaps?\"",
    "\"A little dramatic, aren't we?\"",
    "\"Not everyone can pull that off, you know.\"",
    "\"What in the celestial basin yielded this monstrosity.\""
];

function brewAnomaly() {
    anomalyColors = [];
    for (let i = 0; i < 5; i++) {
        anomalyColors.push(generateRandomHex());
    }
    renderAnomalyWorkspace();
}

function renderAnomalyWorkspace() {
    anomalySwatchesContainer.innerHTML = '';
    customPickersRow.innerHTML = '';

    anomalyColors.forEach((hex, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'anomaly-swatch';
        swatch.style.backgroundColor = hex;
        swatch.innerHTML = `<div class="anomaly-hex">${hex}</div>`;
        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            showNotification(`WILD ESSENCE CAPTURED: ${hex}`);
        });
        anomalySwatchesContainer.appendChild(swatch);

        const pickerItem = document.createElement('div');
        pickerItem.className = 'custom-picker-item';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = hex;
        
        const hexLabel = document.createElement('span');
        hexLabel.className = 'mono-text';
        hexLabel.style.fontSize = '0.7rem';
        hexLabel.textContent = hex;

        colorInput.addEventListener('input', (e) => {
            const newHex = e.target.value.toUpperCase();
            anomalyColors[index] = newHex;
            swatch.style.backgroundColor = newHex;
            swatch.querySelector('.anomaly-hex').textContent = newHex;
            hexLabel.textContent = newHex;
        });

        pickerItem.appendChild(colorInput);
        pickerItem.appendChild(hexLabel);
        customPickersRow.appendChild(pickerItem);
    });

    const randomNote = alchemicalNotes[Math.floor(Math.random() * alchemicalNotes.length)];
    anomalyNote.textContent = randomNote;
}

function saveAnomalyToGrimoire() {
    if (anomalyColors.length === 0) return;
    const grimoire = getStoredGrimoire();
    grimoire.unshift({
        id: Date.now(),
        colors: [...anomalyColors],
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('atelier_grimoire', JSON.stringify(grimoire));
    renderGrimoire();
    showNotification("ANOMALY INSCRIBED TO GRIMOIRE ⚡");
}


// --- 3. UNIVERSAL SPECTRUM CONSOLE (HSL SLIDER CRAFTER) ---
const hueSlider = document.getElementById('hueSlider');
const satSlider = document.getElementById('satSlider');
const lightSlider = document.getElementById('lightSlider');
const hueVal = document.getElementById('hueVal');
const satVal = document.getElementById('satVal');
const lightVal = document.getElementById('lightVal');
const spectrumPreviewBox = document.getElementById('spectrumPreviewBox');
const spectrumHexBadge = document.getElementById('spectrumHexBadge');
const copySpectrumBtn = document.getElementById('copySpectrumBtn');
const sendToInspectorBtn = document.getElementById('sendToInspectorBtn');

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function updateSpectrum() {
    const h = parseInt(hueSlider.value);
    const s = parseInt(satSlider.value);
    const l = parseInt(lightSlider.value);

    hueVal.textContent = `${h}°`;
    satVal.textContent = `${s}%`;
    lightVal.textContent = `${l}%`;

    const hex = hslToHex(h, s, l);
    spectrumPreviewBox.style.backgroundColor = hex;
    spectrumHexBadge.textContent = hex;
}

hueSlider.addEventListener('input', updateSpectrum);
satSlider.addEventListener('input', updateSpectrum);
lightSlider.addEventListener('input', updateSpectrum);

copySpectrumBtn.addEventListener('click', () => {
    const hex = spectrumHexBadge.textContent;
    navigator.clipboard.writeText(hex);
    showNotification(`COPIED PIGMENT: ${hex}`);
});

sendToInspectorBtn.addEventListener('click', () => {
    const hex = spectrumHexBadge.textContent;
    updateInspector(hex);
    window.location.hash = '#inspector-section';
    showNotification(`INSPECTING: ${hex}`);
});


// --- 4. THE CODEX INSPECTOR ---
const inspectHexInput = document.getElementById('inspectHexInput');
const inspectorSwatchBox = document.getElementById('inspectorSwatchBox');
const readoutRgb = document.getElementById('readoutRgb');
const readoutHsl = document.getElementById('readoutHsl');
const readoutContrast = document.getElementById('readoutContrast');

function hexToRgb(hex) {
    let bigint = parseInt(hex.replace('#',''), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
}

function updateInspector(hex) {
    if (!hex.startsWith('#') || hex.length !== 7) return;
    inspectHexInput.value = hex;
    inspectorSwatchBox.style.backgroundColor = hex;

    const rgb = hexToRgb(hex);
    readoutRgb.textContent = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    readoutContrast.textContent = luminance > 0.5 ? "RATING: HIGH (LIGHT)" : "RATING: HIGH (DARK)";

    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    readoutHsl.textContent = `HSL(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

inspectHexInput.addEventListener('input', (e) => {
    let val = e.target.value.toUpperCase();
    if (val.startsWith('#') && val.length === 7) {
        updateInspector(val);
    }
});


// --- 5. MY GRIMOIRE (Local Storage) ---
const grimoireArchive = document.getElementById('grimoireArchive');
const savePaletteBtn = document.getElementById('savePaletteBtn');

function getStoredGrimoire() {
    const saved = localStorage.getItem('atelier_grimoire');
    return saved ? JSON.parse(saved) : [];
}

function saveCurrentPaletteToGrimoire() {
    if (currentPalette.length === 0) return;

    const grimoire = getStoredGrimoire();
    grimoire.unshift({
        id: Date.now(),
        colors: [...currentPalette],
        date: new Date().toLocaleDateString()
    });
    localStorage.setItem('atelier_grimoire', JSON.stringify(grimoire));
    
    renderGrimoire();
    showNotification("PALETTE INSCRIBED TO GRIMOIRE 📖");
}

function deleteFromGrimoire(id) {
    let grimoire = getStoredGrimoire();
    grimoire = grimoire.filter(item => item.id !== id);
    localStorage.setItem('atelier_grimoire', JSON.stringify(grimoire));
    renderGrimoire();
    showNotification("PAGE TORN FROM GRIMOIRE.");
}

function renderGrimoire() {
    const grimoire = getStoredGrimoire();
    
    if (grimoire.length === 0) {
        grimoireArchive.innerHTML = `<p class="empty-grimoire-msg">// Your grimoire is currently blank. Inscribe a palette from above to begin your collection.</p>`;
        return;
    }

    grimoireArchive.innerHTML = '';

    grimoire.forEach(entry => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem; background: var(--bg-main); padding: 1rem; border: 1px solid var(--border-accent); margin-bottom: 1rem;";

        const swatchesContainer = document.createElement('div');
        swatchesContainer.style.cssText = "display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; height: 50px;";

        entry.colors.forEach(hex => {
            const mini = document.createElement('div');
            mini.style.backgroundColor = hex;
            mini.style.border = "1px solid rgba(255,255,255,0.15)";
            mini.style.cursor = "pointer";
            mini.title = `Copy ${hex}`;
            mini.addEventListener('click', () => {
                navigator.clipboard.writeText(hex);
                showNotification(`COPIED ${hex}`);
            });
            swatchesContainer.appendChild(mini);
        });

        const metaRow = document.createElement('div');
        metaRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; font-family: 'DM Mono', monospace; font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;";
        metaRow.innerHTML = `<span>Inscribed: ${entry.date}</span>`;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "EXCISION [DELETE]";
        deleteBtn.style.cssText = "background: none; border: none; color: #a94442; font-family: 'DM Mono', monospace; font-size: 0.75rem; cursor: pointer; letter-spacing: 0.05em;";
        deleteBtn.addEventListener('click', () => deleteFromGrimoire(entry.id));

        metaRow.appendChild(deleteBtn);
        row.appendChild(swatchesContainer);
        row.appendChild(metaRow);
        grimoireArchive.appendChild(row);
    });
}


// --- 6. NOTIFICATION SYSTEM ---
function showNotification(message) {
    const existing = document.getElementById('alchemicalNotice');
    if (existing) existing.remove();

    const notice = document.createElement('div');
    notice.id = 'alchemicalNotice';
    notice.textContent = `✦ ${message}`;
    notice.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--bg-card);
        color: var(--text-primary);
        border: 1px solid var(--antique-gold);
        padding: 0.75rem 1.25rem;
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        box-shadow: 0 5px 25px rgba(0,0,0,0.8);
        z-index: 1000;
        text-transform: uppercase;
        animation: fadeInOut 2.5s ease forwards;
    `;

    document.body.appendChild(notice);
    setTimeout(() => notice.remove(), 2500);
}

const styleSheet = document.styleSheets[0];
try {
    styleSheet.insertRule(`
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(10px); }
            15% { opacity: 1; transform: translateY(0); }
            85% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(10px); }
        }
    `, styleSheet.cssRules.length);
} catch (e) {}


// --- 7. INITIALIZATION ---
generateBtn.addEventListener('click', renderPrimaryPalette);
brewAnomalyBtn.addEventListener('click', brewAnomaly);
savePaletteBtn.addEventListener('click', saveCurrentPaletteToGrimoire);
saveAnomalyBtn.addEventListener('click', saveAnomalyToGrimoire);

window.addEventListener('DOMContentLoaded', () => {
    renderPrimaryPalette();
    brewAnomaly();
    updateSpectrum();
    updateInspector('#17291F');
    renderGrimoire();
});
