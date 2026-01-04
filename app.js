async function loadData() {
  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();
  
    const fiveYBreakeven = data.fiveYBreakeven.value;
    const { canada2Y, canada10Y, canada10YReal } = data.canadaYields;

    const spread = canada10Y - canada2Y


    if (fiveYBreakeven !== null) {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: " + fiveYBreakeven.toFixed(2) + "%";
    } else {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: N/A";
    }

    document.getElementById("ca2y").textContent = `Canada 2Y: ${canada2Y.toFixed(2)}%`;
    document.getElementById("ca10y").textContent = `Canada 10Y: ${canada10Y.toFixed(2)}%`;
    document.getElementById("spread").textContent = "2Y/10Y Spread: " + spread.toFixed(2) + "%";
    document.getElementById("ca10yreal").textContent = `Canada 10Y Real: ${canada10YReal.toFixed(2)}%`;

  } catch (err) {
    console.error("Frontend error:", err);
  }
}

loadData();

