document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("dataBody");

  function fmt(v, digits = 2) {
    return (v == null || !Number.isFinite(v)) ? "—" : v.toFixed(digits);
  }

  function row(label, cur, prev, unit = "%", digits = 2) {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;

    const tdCur = document.createElement("td");
    tdCur.textContent = cur?.value != null
      ? `${fmt(cur.value, digits)}${unit}`
      : "—";

    const tdPrev = document.createElement("td");
    tdPrev.textContent = prev?.value != null
      ? `${fmt(prev.value, digits)}${unit}`
      : "—";

    tr.append(tdLabel, tdCur, tdPrev);
    return tr;
  }

  function spreadRow(label, curY, curX, prevY, prevX) {
    const tr = document.createElement("tr");

    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;

    const cur =
      curY?.value != null && curX?.value != null
        ? (curY.value - curX.value)
        : null;

    const prev =
      prevY?.value != null && prevX?.value != null
        ? (prevY.value - prevX.value)
        : null;

    const tdCur = document.createElement("td");
    tdCur.textContent = cur != null ? `${cur.toFixed(2)}%` : "—";

    const tdPrev = document.createElement("td");
    tdPrev.textContent = prev != null ? `${prev.toFixed(2)}%` : "—";

    tr.append(tdLabel, tdCur, tdPrev);
    return tr;
  }

  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields");
    const data = await res.json();

    const C = data.current || {};
    const P = data.monthAgo || {};

    tableBody.append(
      row("US 5Y Breakeven", C.fiveYBreakeven, P.fiveYBreakeven),
      row("Canada 2Y", C.canadaYields, P.canadaYields, "%", 2),
      row("Canada 10Y", {
        value: C.canadaYields?.canada10Y
      }, {
        value: P.canadaYields?.canada10Y
      }),
      row("Canada 10Y Real", {
        value: C.canadaYields?.canada10YReal
      }, {
        value: P.canadaYields?.canada10YReal
      }),
      spreadRow(
        "Canada 10Y − 2Y Spread",
        { value: C.canadaYields?.canada10Y },
        { value: C.canadaYields?.canada2Y },
        { value: P.canadaYields?.canada10Y },
        { value: P.canadaYields?.canada2Y }
      ),
      row("CPI-Trim YoY", C.cpiTrimYoY, P.cpiTrimYoY),
      row("Canada Unemployment", C.caUnemployment, P.caUnemployment, "%", 1),
      row("Ivey PMI (SA)", C.iveyPmiSA, P.iveyPmiSA, "", 1),
      row("IG Credit Spread (OAS)", C.igCreditSpread, P.igCreditSpread)
    );

  } catch (err) {
    console.error("Frontend error:", err);
    tableBody.innerHTML =
      "<tr><td colspan='3'>Data unavailable</td></tr>";
  }
});
