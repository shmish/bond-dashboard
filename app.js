document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("dataBody");

  // ---------- helpers ----------
  function num(x) {
    const v = (x == null) ? null : Number(x);
    return Number.isFinite(v) ? v : null;
  }

  function fmt(v, digits = 2) {
    return v == null ? "—" : v.toFixed(digits);
  }

  function fmtSigned(v, digits = 2) {
    if (v == null) return "—";
    const s = v >= 0 ? "+" : "";
    return s + v.toFixed(digits);
  }

  function makeRow(label, curObj, prevObj, unit = "%", digits = 2) {
    const tr = document.createElement("tr");

    const cur = num(curObj?.value);
    const prev = num(prevObj?.value);
    const d = (cur != null && prev != null) ? (cur - prev) : null;

    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;

    const tdCur = document.createElement("td");
    tdCur.textContent = cur != null ? `${fmt(cur, digits)}${unit}` : "—";

    const tdPrev = document.createElement("td");
    tdPrev.textContent = prev != null ? `${fmt(prev, digits)}${unit}` : "—";

    const tdDelta = document.createElement("td");
    tdDelta.textContent = d != null ? `${fmtSigned(d, digits)}${unit}` : "—";

    tr.append(tdLabel, tdCur, tdPrev, tdDelta);
    return tr;
  }

  // For spreads like 10Y-2Y (computed from two series)
  function makeSpreadRow(label, curY, curX, prevY, prevX, digits = 2) {
    const tr = document.createElement("tr");

    const curYv = num(curY?.value);
    const curXv = num(curX?.value);
    const prevYv = num(prevY?.value);
    const prevXv = num(prevX?.value);

    const curSpread = (curYv != null && curXv != null) ? (curYv - curXv) : null;
    const prevSpread = (prevYv != null && prevXv != null) ? (prevYv - prevXv) : null;
    const d = (curSpread != null && prevSpread != null) ? (curSpread - prevSpread) : null;

    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;

    const tdCur = document.createElement("td");
    tdCur.textContent = curSpread != null ? `${fmt(curSpread, digits)}%` : "—";

    const tdPrev = document.createElement("td");
    tdPrev.textContent = prevSpread != null ? `${fmt(prevSpread, digits)}%` : "—";

    const tdDelta = document.createElement("td");
    tdDelta.textContent = d != null ? `${fmtSigned(d, digits)}%` : "—";

    tr.append(tdLabel, tdCur, tdPrev, tdDelta);
    return tr;
  }

  function setErrorRow(msg) {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = msg;
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  // ---------- main ----------
  if (!tableBody) {
    console.error("Missing <tbody id='dataBody'> in index.html");
    return;
  }

  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields", { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();

    const C = data.current || {};
    const P = data.monthAgo || {};
    const CY = C.canadaYields || {};
    const PY = P.canadaYields || {};

    console.log("Canada yields (current):", CY);
    console.log("Canada yields (monthAgo):", PY);

    tableBody.innerHTML = "";

    tableBody.append(
      makeRow("US 5Y Breakeven", C.fiveYBreakeven, P.fiveYBreakeven, "%", 2),

      makeRow("Canada 2Y", { value: CY.canada2Y }, { value: PY.canada2Y }, "%", 2),
      makeRow(
        "Canada 2Y",
        { value: CY.canada2Y },
        { value: PY.canada2Y },
        "%", 2
      ),

      makeRow("Canada 10Y", { value: CY.canada10Y }, { value: PY.canada10Y }, "%", 2),
      makeRow("Canada 10Y Real", { value: CY.canada10YReal }, { value: PY.canada10YReal }, "%", 2),

      makeSpreadRow(
        "Canada 10Y − 2Y Spread",
        { value: CY.canada10Y }, { value: CY.canada2Y },
        { value: PY.canada10Y }, { value: PY.canada2Y },
        2
      ),

      makeRow("CPI-Trim YoY", C.cpiTrimYoY, P.cpiTrimYoY, "%", 2),
      makeRow("Canada Unemployment", C.caUnemployment, P.caUnemployment, "%", 1),

      // PMI is index points, not percent
      makeRow("Ivey PMI (SA)", C.iveyPmiSA, P.iveyPmiSA, "", 1),

      makeRow("IG Credit Spread (OAS)", C.igCreditSpread, P.igCreditSpread, "%", 2),
    );
  } catch (err) {
    console.error("Frontend error:", err);
    setErrorRow("Data unavailable");
  }
});


