document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();

    // 5Y US breakeven
    const fiveYEl = document.getElementById("fiveYBreakeven");
    if (fiveYEl && data.fiveYBreakeven?.value != null) {
      fiveYEl.textContent = `5Y Breakeven: ${data.fiveYBreakeven.value.toFixed(2)}% (as of ${data.fiveYBreakeven.date})`;
    }

    // Canada yields
    const { canada2Y, canada10Y, canada10YReal, date: canadaDate } = data.canadaYields || {};

    const el2Y = document.getElementById("ca2y");
    if (el2Y && canada2Y != null) el2Y.textContent = `Canada 2Y: ${canada2Y.toFixed(2)}% (as of ${canadaDate})`;

    const el10Y = document.getElementById("ca10y");
    if (el10Y && canada10Y != null) el10Y.textContent = `Canada 10Y: ${canada10Y.toFixed(2)}% (as of ${canadaDate})`;

    const el10YReal = document.getElementById("ca10yreal");
    if (el10YReal && canada10YReal != null) el10YReal.textContent = `Canada 10Y Real: ${canada10YReal.toFixed(2)}% (as of ${canadaDate})`;

    const spreadEl = document.getElementById("spread");
    if (spreadEl && canada10Y != null && canada2Y != null) {
      const spread = (canada10Y - canada2Y).toFixed(2);
      spreadEl.textContent = `10Y − 2Y Spread: ${spread}%`;
    }

  } catch (err) {
    console.error("Frontend error:", err);

    // fallback if API fails
    const fallbackEls = [
      "fiveYBreakeven",
      "ca2y",
      "ca10y",
      "ca10yreal",
      "spread"
    ];
    fallbackEls.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "Data unavailable";
    });
  }
});

