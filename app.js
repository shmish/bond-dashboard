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

  function makeCell(text) {
    const td = document.createElement("td");
    td.textContent = text;
    return td;
  }

  // Adds: Indicator | Current | 1 Month Ago | Δ | Signal
  function makeRow(label, curObj, prevObj, unit = "%", digits = 2) {
    const cur = num(curObj?.value);
    const prev = num(prevObj?.value);
    const d = (cur != null && prev != null) ? (cur - prev) : null;

    const tr = document.createElement("tr");
    tr.append(
      makeCell(label),
      makeCell(cur != null ? `${fmt(cur, digits)}${unit}` : "—"),
      makeCell(prev != null ? `${fmt(prev, digits)}${unit}` : "—"),
      makeCell(d != null ? `${fmtSigned(d, digits)}${unit}` : "—"),
      makeCell("") // signal column (blank for normal rows)
    );
    return tr;
  }

  // Spread row (computed), Signal blank
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
      makeCell(label),
      makeCell(curSpread != null ? `${fmt(curSpread, digits)}%` : "—"),
      makeCell(prevSpread != null ? `${fmt(prevSpread, digits)}%` : "—"),
      makeCell(d != null ? `${fmtSigned(d, digits)}%` : "—"),
      makeCell("")
    );
    return tr;
  }

  function setErrorRow(msg, colSpan) {
    tableBody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = colSpan;
    td.textContent = msg;
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  // ---------- scoring ----------
  // Returns { score, possible, details[] }
  // details: [{name, points, reason}]
  function computeSignalScoreAll(C, P) {
    const CY = C.canadaYields || {};
    const PY = P.canadaYields || {};

    const cur10 = num(CY.canada10Y);
    const prev10 = num(PY.canada10Y);

    const cur2 = num(CY.canada2Y);
    const prev2 = num(PY.canada2Y);

    const cur10r = num(CY.canada10YReal);
    const prev10r = num(PY.canada10YReal);

    const curSpread = (cur10 != null && cur2 != null) ? (cur10 - cur2) : null;
    const prevSpread = (prev10 != null && prev2 != null) ? (prev10 - prev2) : null;

    const curBE = num(C.fiveYBreakeven?.value);
    const prevBE = num(P.fiveYBreakeven?.value);

    const curCPI = num(C.cpiTrimYoY?.value);
    const prevCPI = num(P.cpiTrimYoY?.value);

    const curU = num(C.caUnemployment?.value);
    const prevU = num(P.caUnemployment?.value);

    const curPMI = num(C.iveyPmiSA?.value); // index points
    // PMI rule is vs 50, no "month ago" needed

    const curIG = num(C.igCreditSpread?.value);
    const prevIG = num(P.igCreditSpread?.value);

    let score = 0;
    let possible = 0;
    const details = [];

    // helper to score comparisons: (+1 if less, -1 if more) etc.
    function cmp(name, cur, prev, whenLess, whenMore, whenEqual = 0) {
      if (cur == null || prev == null) return;
      possible += 1;
      let pts = whenEqual;
      let reason = "equal";
      if (cur < prev) { pts = whenLess; reason = "lower"; }
      else if (cur > prev) { pts = whenMore; reason = "higher"; }
      score += pts;
      details.push({ name, points: pts, reason });
    }

    // Yields
    cmp("10Y yield vs month ago", cur10, prev10, +1, -1, 0);
    cmp("2Y yield vs month ago", cur2, prev2, +1, -1, 0);
    // Spread: +1 if spread more than month before, -1 if less
    cmp("10Y-2Y spread vs month ago", curSpread, prevSpread, -1, +1, 0); // careful: lower spread is bearish per your rule
    // Your rule: +1 if spread is MORE than month before; -1 if spread is LESS
    // That means: cur > prev => +1, cur < prev => -1
    // Our cmp signature is (whenLess, whenMore), so:
    //   whenLess = -1, whenMore = +1
    // We implemented that above.

    // 10Y Real: +1 if less, -1 if more
    cmp("10Y real vs month ago", cur10r, prev10r, +1, -1, 0);

    // Breakeven: +1 if less, -1 if more
    cmp("5Y breakeven vs month ago", curBE, prevBE, +1, -1, 0);

    // CPI-Trim YoY: +1 if less, -1 if more
    cmp("CPI-trim YoY vs month ago", curCPI, prevCPI, +1, -1, 0);

    // Unemployment: +1 if rising, -1 if falling
    // rising => cur > prev => +1; falling => cur < prev => -1
    // so (whenLess=-1, whenMore=+1)
    cmp("Unemployment vs month ago", curU, prevU, -1, +1, 0);

    // PMI level vs 50: +1 if < 50, -1 if > 50
    if (curPMI != null) {
      possible += 1;
      let pts = 0;
      let reason = "at 50";
      if (curPMI < 50) { pts = +1; reason = "< 50"; }
      else if (curPMI > 50) { pts = -1; reason = "> 50"; }
      score += pts;
      details.push({ name: "PMI vs 50", points: pts, reason });
    }

    // IG credit spread: +1 if more than month before; -1 if less
    // (whenLess=-1, whenMore=+1)
    cmp("IG OAS vs month ago", curIG, prevIG, -1, +1, 0);

    return { score, possible, details };
  }

  function makeSignalSummaryRow(scoreObj) {
    const tr = document.createElement("tr");

    const label = "Signal Score (All Rules)";
    const summary =
      scoreObj.possible > 0 ? `${scoreObj.score}/${scoreObj.possible}` : "—";

    tr.append(
      makeCell(label),
      makeCell(""),
      makeCell(""),
      makeCell(""),
      makeCell(summary)
    );
    return tr;
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
    setErrorRow("Data unavailable", 5);
  }
});
