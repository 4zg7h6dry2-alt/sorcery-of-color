/* ==========================================
   SORCERY OF COLOR: ALCHEMICAL ENGINE
   ========================================== */

// --- 0. ATMOSPHERIC CHAMBER THEME SWITCHER ---
const bgThemeSelect = document.getElementById('bgThemeSelect');

bgThemeSelect.addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    localStorage.setItem('sorcery_theme', e.target.value);
    showNotification(`Chamber shift: ${e.target.options[e.target.selectedIndex].text}`);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('sorcery_theme');
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
            updateInspector(hex);
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

const alchemicalNotes = [
    "\"This one belongs in a storybook.\"",
    "\"A whisper of something extraordinary.\"",
    "\"How wonderfully peculiar.\"",
    "\"If moonlight had a favourite colour, surely this would be it.\"",
    "\"Oof!…Behave! ;)\"",
    "\"Splendid!\"",
    "\"Rather lovely!\"",
    "\"Fascinating!\"",
    "\"Not bad at all!\"",
    "\"Aha! There it is!\"",
    "\"Simply marvellous!\"",
    "\"Well, fancy that!\"",
    "\"Quite the discovery!\"",
    "\"Oh, how pretty!\"",
    "\"Ooh, that's rather delicious.\"",
    "\"A little more warmth, perhaps?\"",
    "\"Well, aren't you a pretty little thing?\"",
    "\"Now that's a shade worth keeping.\"",
    "\"Unexpected, but I do adore surprises.\"",
    "\"Too much? Darling, there's no such thing.\"",
    "\"Oh, this one has character!\"",
    "\"A rather peculiar combination, wouldn't you say?\"",
    "\"How charmingly unpredictable.\"",
    "\"There we are. Absolutely bewitching.\"",
    "\"That colour has an attitude. I approve.\"",
    "\"A little dramatic, aren't we?\"",
    "\"Well, someone clearly enjoys attention.\"",
    "\"How very audacious of you.\"",
    "\"I see potential. And quite a bit of vanity.\"",
    "\"Not everyone can pull that off, you know.\"",
    "\"Oh, don't be shy. Show yourself!\"",
    "\"A bold choice. I respect the audacity.\"",
    "\"That one's got expensive taste.\"",
    "\"Some colours simply know they're gorgeous.\""
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
            updateInspector(hex);
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
    const newEntry = {
        id: Date.now(),
        colors: [...anomalyColors],
        date: new Date().toLocaleDateString()
    };

    grimoire.unshift(newEntry);
    localStorage.setItem('sorcery_grimoire', JSON.stringify(grimoire));
    renderGrimoire();
    showNotification("ANOMALY INSCRIBED TO GRIMOIRE 📖");
}


// --- 3. UNIVERSAL SPECTRUM CONSOLE (HSL Sliders) ---
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

let currentSpectrumHex = "#087A50";

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

    currentSpectrumHex = hslToHex(h, s, l);
    spectrumPreviewBox.style.backgroundColor = currentSpectrumHex;
    spectrumHexBadge.textContent = currentSpectrumHex;
}

hueSlider.addEventListener('input', updateSpectrum);
satSlider.addEventListener('input', updateSpectrum);
lightSlider.addEventListener('input', updateSpectrum);

copySpectrumBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentSpectrumHex);
    showNotification(`PIGMENT CAPTURED: ${currentSpectrumHex}`);
});

sendToInspectorBtn.addEventListener('click', () => {
    updateInspector(currentSpectrumHex);
    showNotification(`INSPECTING: ${currentSpectrumHex}`);
    document.getElementById('inspector-section').scrollIntoView({ behavior: 'smooth' });
});


// --- 4. THE CODEX INSPECTOR ---
const inspectHexInput = document.getElementById('inspectHexInput');
const inspectorSwatchBox = document.getElementById('inspectorSwatchBox');
const readoutRgb = document.getElementById('readoutRgb');
const readoutHsl = document.getElementById('readoutHsl');
const readoutContrast = document.getElementById('readoutContrast');

function hexToRgb(hex) {
    let cleanHex = hex.replace('#','');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    let bigint = parseInt(cleanHex, 16);
    if (isNaN(bigint)) return { r: 0, g: 0, b: 0 };
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return { r, g, b };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
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
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function updateInspector(hex) {
    if (!hex.startsWith('#')) hex = '#' + hex;
    inspectHexInput.value = hex;
    inspectorSwatchBox.style.backgroundColor = hex;

    const rgb = hexToRgb(hex);
    readoutRgb.textContent = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    readoutHsl.textContent = `HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`;

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    readoutContrast.textContent = luminance > 0.5 ? "RATING: HIGH (LIGHT)" : "RATING: HIGH (DARK)";
}

inspectHexInput.addEventListener('input', (e) => {
    let val = e.target.value.toUpperCase();
    if (val.length <= 7) {
        if (val.length === 7 || val.length === 4) {
            updateInspector(val);
        }
    }
});


// --- 5. MY GRIMOIRE ---
const grimoireArchive = document.getElementById('grimoireArchive');

function getStoredGrimoire() {
    const saved = localStorage.getItem('sorcery_grimoire');
    return saved ? JSON.parse(saved) : [];
}

function saveCurrentPaletteToGrimoire() {
    if (currentPalette.length === 0) return;

    const grimoire = getStoredGrimoire();
    const newEntry = {
        id: Date.now(),
        colors: [...currentPalette],
        date: new Date().toLocaleDateString()
    };

    grimoire.unshift(newEntry);
    localStorage.setItem('sorcery_grimoire', JSON.stringify(grimoire));
    renderGrimoire();
    showNotification("PALETTE INSCRIBED TO GRIMOIRE 📖");
}

function deleteFromGrimoire(id) {
    let grimoire = getStoredGrimoire();
    grimoire = grimoire.filter(item => item.id !== id);
    localStorage.setItem('sorcery_grimoire', JSON.stringify(grimoire));
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
                updateInspector(hex);
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
saveAnomalyBtn.addEventListener('click', saveAnomalyToGrimoire);
savePaletteBtn.addEventListener('click', saveCurrentPaletteToGrimoire);

window.addEventListener('DOMContentLoaded', () => {
    renderPrimaryPalette();
    brewAnomaly();
    updateSpectrum();
    updateInspector('#123B2B');
    renderGrimoire();
});
