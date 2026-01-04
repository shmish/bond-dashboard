document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();

    // 5Y Breakeven
    const fiveYEl = document.getElementById("fiveYBreakeven");
    if (fiveYEl && data.fiveYBreakeven?.value != null) {
      fiveYEl.textContent = `5Y Breakeven: ${data.fiveYBreakeven.value.toFixed(2)}%`;
    }

    // Canada Yields
    const { canada2Y, canada10Y, canada10YReal } = data.canadaYields || {};

    const el2Y = document.getElementById("ca2y");
    if (el2Y && canada2Y != null) el2Y.textContent = `Canada 2Y: ${canada2Y.toFixed(2)}%`;

    const el10Y = document.getElementById("ca10y");
    if (el10Y && canada10Y != null) el10Y.textContent = `Canada 10Y: ${canada10Y.toFixed(2)}%`;

    const el10YReal = document.getElementById("ca10yreal");
    if (el10YReal && canada10YReal != null) el10YReal.textContent = `Canada 10Y Real: ${canada10YReal.toFixed(2)}%`;

  } catch (err) {
    console.error("Frontend error:", err);
  }
});

