async function loadData() {
  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();
  
    const fiveYBreakeven = data.fiveYBreakeven.value;

    if (fiveYBreakeven !== null) {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: " + fiveYBreakeven.toFixed(2) + "%";
    } else {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: N/A";
    }


  } catch (err) {
    console.error("Frontend error:", err);
  }
}

loadData();

