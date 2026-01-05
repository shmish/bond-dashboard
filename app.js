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
    const s = v > 0 ? "+" : "";   // 0 stays "0.00"
    return s + v.toFixed(digits);
  }

  function fmtSignedInt(v) {
    if (v == null) return "—";
    if (v > 0) return `+${v}`;
    return `${v}`; // includes 0 and negative
  }

  function dateText(d) {
    return d ? d : "—";
  }

  function makeCell(text, cls) {
    const td = document.createElement("td");
    td.textContent = text;
    if (cls) td.className = cls;
    return td;
  }

  // Indicator | Cur | CurDate | Prev | PrevDate | Δ | Signal(blank)
  function makeRow(label, curObj, prevObj, unit = "%", digits = 2) {
    const cur = num(curObj?.value);
    const prev = num(prevObj?.value);
    const d = (cur != null && prev != null) ? (cur - prev) : null;

    const tr = document.createElement("tr");
    tr.append(
      makeCell(label),
      makeCell(cur != null ? `${fmt(cur, digits)}${unit}` : "—", "num"),
      makeCell(dateText(curObj?.date)),
      makeCell(prev != null ? `${fmt(prev, digits)}${unit}` : "—", "num"),
      makeCell(dateText(prevObj?.date)),
      makeCell(d != null ? `${fmtSigned(d, digits)}${unit}` : "—", "num"),
      makeCell("", "num")
    );
    return tr;
  }

  // Spread row derives value + dates from the provided objects
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
      makeCell(curSpread != null ? `${fmt(curSpread, digits)}%` : "—", "num"),
      makeCell(dateText(curY?.date || curX?.date)),
      makeCell(prevSpread != null ? `${fmt(prevSpread, digits)}%` : "—", "num"),
      makeCell(dateText(prevY?.date || prevX?.date)),
      makeCell(d != null ? `${fmtSigned(d, digits)}%` : "—", "num"),
      makeCell("", "num")
    );
    return tr;
  }

  function setErrorRow(msg) {
    tableBody.innerHTML = "";
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = msg;
    tr.appendChild(td);
    tableBody.appendChild(tr);
  }

  // ---------- scoring (your full rules) ----------
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

    function cmp(cur, prev, whenLess, whenMore, whenEqual = 0) {
      if (cur == null || prev == null) return;
      if (cur < prev) score += whenLess;
      else if (cur > prev) score += whenMore;
      else score += whenEqual;
    }

    // 10Y / 2Y: +1 if less, -1 if more
    cmp(cur10, prev10, +1, -1);
    cmp(cur2,  prev2,  +1, -1);

    // Spread: +1 if more, -1 if less
    cmp(curSpread, prevSpread, -1, +1);

    // 10Y real: +1 if less, -1 if more
    cmp(cur10r, prev10r, +1, -1);

    // Breakeven: +1 if less, -1 if more
    cmp(curBE, prevBE, +1, -1);

    // CPI: +1 if less, -1 if more
    cmp(curCPI, prevCPI, +1, -1);

    // Unemployment: +1 if rising, -1 if falling
    cmp(curU, prevU, -1, +1);

    // PMI vs 50: +1 if <50, -1 if >50
    if (curPMI != null) {
      if (curPMI < 50) score += +1;
      else if (curPMI > 50) score += -1;
    }

    // IG credit spread: +1 if more, -1 if less
    cmp(curIG, prevIG, -1, +1);

    return score;
  }

  function makeSignalSummaryRow(score) {
    const tr = document.createElement("tr");
    tr.append(
      makeCell("Signal Score (All Rules)"),
      makeCell("", "num"),
      makeCell(""),
      makeCell("", "num"),
      makeCell(""),
      makeCell("", "num"),
      makeCell(fmtSignedInt(score), "num")
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

    const signalScore = computeSignalScoreAll(C, P);

    tableBody.innerHTML = "";

    tableBody.append(
      // FRED-style objects already have {date, value}
      makeRow("US 5Y Breakeven", C.fiveYBreakeven, P.fiveYBreakeven, "%", 2),

      // BoC yields: adapt into {date, value}
      makeRow("Canada 2Y",      { value: CY.canada2Y,      date: CY.date }, { value: PY.canada2Y,      date: PY.date }, "%", 2),
      makeRow("Canada 10Y",     { value: CY.canada10Y,     date: CY.date }, { value: PY.canada10Y,     date: PY.date }, "%", 2),
      makeRow("Canada 10Y Real",{ value: CY.canada10YReal, date: CY.date }, { value: PY.canada10YReal, date: PY.date }, "%", 2),

      makeSpreadRow(
        "Canada 10Y − 2Y Spread",
        { value: CY.canada10Y, date: CY.date }, { value: CY.canada2Y, date: CY.date },
        { value: PY.canada10Y, date: PY.date }, { value: PY.canada2Y, date: PY.date },
        2
      ),

      makeRow("CPI-Trim YoY", C.cpiTrimYoY, P.cpiTrimYoY, "%", 2),
      makeRow("Canada Unemployment", C.caUnemployment, P.caUnemployment, "%", 1),

      // PMI is index points
      makeRow("Ivey PMI (SA)", C.iveyPmiSA, P.iveyPmiSA, "", 1),

      makeRow("IG Credit Spread (OAS)", C.igCreditSpread, P.igCreditSpread, "%", 2),

      makeSignalSummaryRow(signalScore)
    );
  } catch (err) {
    console.error("Frontend error:", err);
    setErrorRow("Data unavailable");
  }
});

