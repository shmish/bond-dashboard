async function loadData() {
  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();
  
    // Handle backend errors
    if (!res.ok || !data.twoY || !data.tenY) {
      document.getElementById("twoY").textContent = "2Y: error";
      document.getElementById("tenY").textContent = "10Y: error";
      document.getElementById("signal").textContent = "Signal: unavailable";
      return;
    }

    const twoY = data.twoY.yield;
    const tenY = data.tenY.yield;
    const tenYReal = data.tenYReal.yield;
    const spread = data.spread;
    const fiveYBreakeven = data.fiveYBreakeven.value;

    document.getElementById("twoY").textContent = "2Y: " + twoY.toFixed(2) + "%";
    document.getElementById("tenY").textContent = "10Y: " + tenY.toFixed(2) + "%";
    document.getElementById("spread").textContent = "2Y/10Y Spread: " + spread.toFixed(2) + "%";
    if (fiveYBreakeven !== null) {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: " + fiveYBreakeven.toFixed(2) + "%";
    } else {
      document.getElementById("fiveYBreakeven").textContent = "5Y Breakeven: N/A";
    }

    if (tenYReal !== null) {
      document.getElementById("tenYReal").textContent = "10Y Real: " + tenYReal.toFixed(2) + "%";
    } else {
      document.getElementById("tenYReal").textContent = "10Y Real: N/A";
    }

    let signal;
    if (spread > 0) signal = "Favour XBB";
    else if (spread < 0) signal = "Favour XSB";
    else signal = "Neutral";

    document.getElementById("signal").textContent = "Signal: " + signal;

  } catch (err) {
    console.error("Frontend error:", err);

    document.getElementById("twoY").textContent = "2Y: error";
    document.getElementById("tenY").textContent = "10Y: error";
    document.getElementById("signal").textContent = "Signal: unavailable";
  }
}

loadData();

