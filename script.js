/* ==========================================
   SORCERER'S PALETTE: ALCHEMICAL ENGINE
   ========================================== */

// --- 1. THE PRIMARY ESSENCE GENERATOR ---
const paletteGrid = document.getElementById('paletteGrid');
const generateBtn = document.getElementById('generateBtn');
const savePaletteBtn = document.getElementById('savePaletteBtn');

// Holds the currently active primary palette HEX codes
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

    // Generate 5 balanced/random swatches for the primary lab
    for (let i = 0; i < 5; i++) {
        const hex = generateRandomHex();
        currentPalette.push(hex);

        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = hex;
        
        swatch.innerHTML = `
            <div class="swatch-hex" title="Click to copy">${hex}</div>
        `;

        // Click swatch to copy HEX
        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            showNotification(`Essence captured: ${hex}`);
        });

        paletteGrid.appendChild(swatch);
    }
}

// --- 2. THE ALCHEMIST’S ANOMALY (Chaos Generator) ---
const anomalySwatchesContainer = document.getElementById('anomalySwatches');
const brewAnomalyBtn = document.getElementById('brewAnomalyBtn');
const anomalyNote = document.getElementById('anomalyNote');

const alchemicalNotes = [
    "\"A volatile reaction of untamed wavelengths. Use at your own aesthetic peril.\"",
    "\"The retort hissed, turned emerald-black, and spat forth these ungodly shades.\"",
    "\"Loki's personal ledger suggests absolute discord. Magnificent.\"",
    "\"By the third incantation, the pigments began to writhe. Do not stare too long.\"",
    "\"An accidental drop of nightshade in the celestial basin yielded this monstrosity.\""
];

function brewAnomaly() {
    anomalySwatchesContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const hex = generateRandomHex();
        
        const swatch = document.createElement('div');
        swatch.className = 'anomaly-swatch';
        swatch.style.backgroundColor = hex;
        
        swatch.innerHTML = `
            <div class="anomaly-hex">${hex}</div>
        `;

        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            showNotification(`Wild essence captured: ${hex}`);
        });

        anomalySwatchesContainer.appendChild(swatch);
    }
    
    const randomNote = alchemicalNotes[Math.floor(Math.random() * alchemicalNotes.length)];
    anomalyNote.textContent = randomNote;
}


// --- 3. MY GRIMOIRE (Local Storage Archive) ---
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

    grimoire.unshift(newEntry); // Add to top
    localStorage.setItem('sorcery_grimoire', JSON.stringify(grimoire));
    
    renderGrimoire();
    showNotification("Palette inscribed into your Grimoire 📖");
}

function deleteFromGrimoire(id) {
    let grimoire = getStoredGrimoire();
    grimoire = grimoire.filter(item => item.id !== id);
    localStorage.setItem('sorcery_grimoire', JSON.stringify(grimoire));
    renderGrimoire();
    showNotification("Page torn from Grimoire.");
}

function renderGrimoire() {
    const grimoire = getStoredGrimoire();
    
    if (grimoire.length === 0) {
        grimoireArchive.innerHTML = `<p class="empty-grimoire-msg">Your grimoire is currently blank. Inscribe a palette from above to begin your collection.</p>`;
        return;
    }

    grimoireArchive.innerHTML = '';

    grimoire.forEach(entry => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; flex-direction: column; gap: 0.5rem; background: var(--obsidian-panel); padding: 1rem; border-radius: 6px; border: 1px solid rgba(197, 163, 74, 0.15); margin-bottom: 1rem;";

        // Mini swatches row
        const swatchesContainer = document.createElement('div');
        swatchesContainer.style.cssText = "display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem; height: 60px;";

        entry.colors.forEach(hex => {
            const mini = document.createElement('div');
            mini.style.backgroundColor = hex;
            mini.style.borderRadius = "4px";
            mini.style.cursor = "pointer";
            mini.title = `Copy ${hex}`;
            mini.addEventListener('click', () => {
                navigator.clipboard.writeText(hex);
                showNotification(`Copied ${hex}`);
            });
            swatchesContainer.appendChild(mini);
        });

        // Actions & Meta row
        const metaRow = document.createElement('div');
        metaRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; font-family: 'Cormorant Garamond', serif; font-size: 0.95rem; color: var(--text-muted);";
        metaRow.innerHTML = `
            <span>Inscribed on ${entry.date}</span>
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = "Excision [Delete]";
        deleteBtn.style.cssText = "background: none; border: none; color: #a94442; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer;";
        deleteBtn.addEventListener('click', () => deleteFromGrimoire(entry.id));

        metaRow.appendChild(deleteBtn);

        row.appendChild(swatchesContainer);
        row.appendChild(metaRow);
        grimoireArchive.appendChild(row);
    });
}


// --- 4. MAGICAL NOTIFICATION POPUP ---
function showNotification(message) {
    // Remove existing notification if present
    const existing = document.getElementById('alchemicalNotice');
    if (existing) existing.remove();

    const notice = document.createElement('div');
    notice.id = 'alchemicalNotice';
    notice.textContent = `✦ ${message}`;
    notice.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--obsidian);
        color: var(--champagne-gold);
        border: 1px solid var(--antique-gold);
        padding: 0.75rem 1.25rem;
        border-radius: 4px;
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        box-shadow: 0 5px 20px rgba(0,0,0,0.8);
        z-index: 1000;
        animation: fadeInOut 2.5s ease forwards;
    `;

    document.body.appendChild(notice);

    setTimeout(() => {
        notice.remove();
    }, 2500);
}

// Add CSS keyframe for notification dynamically
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
} catch (e) {
    // Fallback if rule insertion fails
}


// --- 5. EVENT LISTENERS & INITIALIZATION ---
generateBtn.addEventListener('click', renderPrimaryPalette);
brewAnomalyBtn.addEventListener('click', brewAnomaly);
savePaletteBtn.addEventListener('click', saveCurrentPaletteToGrimoire);

// Run on initial page load
window.addEventListener('DOMContentLoaded', () => {
    renderPrimaryPalette();
    brewAnomaly();
    renderGrimoire();
});
