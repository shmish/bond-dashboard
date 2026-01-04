document.addEventListener("DOMContentLoaded", async () => {
  // Elements
  const fiveYEl = document.getElementById("fiveYBreakeven");
  const el2Y = document.getElementById("ca2y");
  const el10Y = document.getElementById("ca10y");
  const el10YReal = document.getElementById("ca10yreal");
  const spreadEl = document.getElementById("spread");
  const cpiEl = document.getElementById("cpi");

  // State for spread calculation
  let canada2Y = null;
  let canada10Y = null;

  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();

    // ------------------------------
    // 5Y US Breakeven
    // ------------------------------
    if (fiveYEl) {
      if (data.fiveYBreakeven?.value != null) {
        fiveYEl.textContent = `5Y Breakeven: ${data.fiveYBreakeven.value.toFixed(2)}% (as of ${data.fiveYBreakeven.date})`;
      } else {
        fiveYEl.textContent = "5Y Breakeven: Data unavailable";
      }
    }

    // ------------------------------
    // Canada Yields
    // ------------------------------
    const canadaYields = data.canadaYields || {};
    canada2Y = canadaYields.canada2Y ?? null;
    canada10Y = canadaYields.canada10Y ?? null;
    const canada10YReal = canadaYields.canada10YReal ?? null;
    const canadaDate = canadaYields.date || "";

    if (el2Y) {
      el2Y.textContent = canada2Y != null
        ? `Canada 2Y: ${canada2Y.toFixed(2)}% (as of ${canadaDate})`
        : "Canada 2Y: Data unavailable";
    }

    if (el10Y) {
      el10Y.textContent = canada10Y != null
        ? `Canada 10Y: ${canada10Y.toFixed(2)}% (as of ${canadaDate})`
        : "Canada 10Y: Data unavailable";
    }

    if (el10YReal) {
      el10YReal.textContent = canada10YReal != null
        ? `Canada 10Y Real: ${canada10YReal.toFixed(2)}% (as of ${canadaDate})`
        : "Canada 10Y Real: Data unavailable";
    }

    // ------------------------------
    // Spread calculation (10Y - 2Y)
    // ------------------------------
    if (spreadEl) {
      if (canada2Y != null && canada10Y != null) {
        const spread = (canada10Y - canada2Y).toFixed(2);
        spreadEl.textContent = `10Y − 2Y Spread: ${spread}%`;
      } else if (canada2Y != null || canada10Y != null) {
        spreadEl.textContent = "10Y − 2Y Spread: Partial data available";
      } else {
        spreadEl.textContent = "10Y − 2Y Spread: Data unavailable";
      }
    }

    // ------------------------------
    // Canada CPI YoY
    // ------------------------------
    if (cpiEl) {
      if (data.cpiYoY?.value != null) {
        cpiEl.textContent = `Core CPI YoY: ${data.cpiYoY.value.toFixed(2)}% (as of ${data.cpiYoY.date})`;
      } else {
        cpiEl.textContent = "Core CPI YoY: Data unavailable";
      }
    }

  } catch (err) {
    console.error("Frontend error:", err);

    // Fallback: show "Data unavailable" for all
    [fiveYEl, el2Y, el10Y, el10YReal, spreadEl, cpiEl].forEach(el => {
      if (el) el.textContent = "Data unavailable";
    });
  }
});


