document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("dataBody");

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

  function td(text, cls) {
    const el = document.createElement("td");
    el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }

  function deltaClass(d) {
    if (d == null) return "";
    if (d > 0) return "num delta-pos";
    if (d < 0) return "num delta-neg";
    return "num";
  }

  function makeRow(label, curObj, prevObj, unit = "%", digits = 2) {
    const cur = num(curObj?.value);
    const prev = num(prevObj?.value);
    const d = (cur != null && prev != null) ? (cur - prev) : null;

    const tr = document.createElement("tr");
    tr.append(
      td(label),
      td(cur != null ? `${fmt(cur, digits)}${unit}` : "—", "num"),
      td(prev != null ? `${fmt(prev, digits)}${unit}` : "—", "num"),
      td(d != null ? `${fmtSigned(d, digits)}${unit}` : "—", deltaClass(d)),
      td("", "num")
    );
    return tr;
  }

  function makeSpreadRow(label, curY, curX, prevY, prevX, digits = 2) {
    const curYv = num(curY?.value);
    const curXv = num(curX?.value);
    const prevYv = num(prevY?.value);
    const prevXv = num(prevX?.value);

    const curSpread = (curYv != null && curXv != null) ? (curYv - curXv) : null;
    const prevSpread = (prevYv != null && prevXv != null) ? (prevYv - prevXv) : null;
    const d = (curSpread != null && prevSpread != null) ? (curSpread - prevSpread) : null;

    const tr = document.createElement("tr");
    tr.append(
      td(label),
      td(curSpread != null ? `${fmt(curSpread, digits)}%` : "—", "num"),
      td(prevSpread != null ? `${fmt(prevSpread, digits)}%` : "—", "num"),
      td(d != null ? `${fmtSigned(d, digits)}%` : "—", deltaClass(d)),
      td("", "num")
    );
    return tr;
  }

  function computeSignalScoreAll(C, P) {
    const CY = C.canadaYields || {};
    const PY = P.canadaYields || {};

    const cur10 = num(CY.canada10Y), prev10 = num(PY.canada10Y);
    const cur2  = num(CY.canada2Y),  prev2  = num(PY.canada2Y);
    const cur10r = num(CY.canada10YReal), prev10r = num(PY.canada10YReal);

    const curSpread = (cur10 != null && cur2 != null) ? (cur10 - cur2) : null;
    const prevSpread = (prev10 != null && prev2 != null) ? (prev10 - prev2) : null;

    const curBE = num(C.fiveYBreakeven?.value), prevBE = num(P.fiveYBreakeven?.value);
    const curCPI = num(C.cpiTrimYoY?.value), prevCPI = num(P.cpiTrimYoY?.value);
    const curU = num(C.caUnemployment?.value), prevU = num(P.caUnemployment?.value);
    const curPMI = num(C.iveyPmiSA?.value);
    const curIG = num(C.igCreditSpread?.value), prevIG = num(P.igCreditSpread?.value);

    let score = 0;
    let possible = 0;

    function cmp(cur, prev, whenLess, whenMore, whenEqual = 0) {
      if (cur == null || prev == null) return;
      possible++;
      if (cur < prev) score += whenLess;
      else if (cur > prev) score += whenMore;
      else score += whenEqual;
    }

    // +1 if lower, -1 if higher
    cmp(cur10, prev10, +1, -1);
    cmp(cur2,  prev2,  +1, -1);

    // spread: +1 if more, -1 if less
    cmp(curSpread, prevSpread, -1, +1);

    cmp(cur10r, prev10r, +1, -1);
    cmp(curBE,  prevBE,  +1, -1);
    cmp(curCPI, prevCPI, +1, -1);

    // unemployment: +1 if rising, -1 if falling
    cmp(curU, prevU, -1, +1);

    // PMI vs 50: +1 if <50, -1 if >50
    if (curPMI != null) {
      possible++;
      if (curPMI < 50) score += +1;
      else if (curPMI > 50) score += -1;
    }

    // IG OAS: +1 if more, -1 if less
    cmp(curIG, prevIG, -1, +1);

    return { score, possible };
  }

  function makeSignalSummaryRow(scoreObj) {
    const tr = document.createElement("tr");
    tr.className = "row-strong";

    const pill = (scoreObj.possible > 0)
      ? `${scoreObj.score}/${scoreObj.possible}`
      : "—";

    const tdSignal = document.createElement("td");
    tdSignal.className = "num";
    tdSignal.innerHTML = scoreObj.possible > 0
      ? `<span class="score-pill">${pill}</span>`
      : "—";

    tr.append(
      td("Signal Score (All Rules)"),
      td("", "num"),
      td("", "num"),
      td("", "num"),
      tdSignal
    );
    return tr;
  }

  function setErrorRow(msg) {
    tableBody.innerHTML = "";
    const tr = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "muted";
    cell.textContent = msg;
    tr.appendChild(cell);
    tableBody.appendChild(tr);
  }

  try {
    const res = await fetch("https://bondsignal.onrender.com/api/yields", { cache: "no-store" });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();

    const C = data.current || {};
    const P = data.monthAgo || {};
    const CY = C.canadaYields || {};
    const PY = P.canadaYields || {};

    const scoreObj = computeSignalScoreAll(C, P);

    tableBody.innerHTML = "";
    tableBody.append(
      makeRow("US 5Y Breakeven", C.fiveYBreakeven, P.fiveYBreakeven, "%", 2),

      makeRow("Canada 2Y", { value: CY.canada2Y }, { value: PY.canada2Y }, "%", 2),
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
      makeRow("Ivey PMI (SA)", C.iveyPmiSA, P.iveyPmiSA, "", 1),
      makeRow("IG Credit Spread (OAS)", C.igCreditSpread, P.igCreditSpread, "%", 2),

      makeSignalSummaryRow(scoreObj)
    );

  } catch (err) {
    console.error("Frontend error:", err);
    setErrorRow("Data unavailable");
  }
});
