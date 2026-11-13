const fan = document.getElementById("fan");
const toast = document.getElementById("toast");
let toastTimer;

// Open the swatch fan once the page has loaded
window.addEventListener("load", () => {
  requestAnimationFrame(() => fan.classList.add("open"));
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

async function copyHex(hex) {
  try {
    await navigator.clipboard.writeText(hex);
    showToast("Copied " + hex);
  } catch (err) {
    // Fallback for browsers that block the clipboard API
    const input = document.createElement("input");
    input.value = hex;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      showToast("Copied " + hex);
    } catch (e) {
      showToast("Could not copy " + hex);
    }
    input.remove();
  }
}

fan.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => copyHex(swatch.dataset.hex));
});
