// glossary.js — Li-Da's shared "tap-to-explain" finance glossary + tooltip.
//
// ONE source of truth for plain-English term explanations, plus one tiny
// tap/click tooltip behavior. Include this script on any page, then wrap a label
// with glossTerm(label, key) to make it tappable. No per-page logic needed — to
// extend to watchlist / alerts / journal later, just add this <script> and wrap
// the labels.
//
// Voice (CLAUDE.md): explain what the term MEANS, never whether the number is
// good or bad. Descriptive, beginner-friendly, ~10–20 words. Never advice.

(function () {
  // term key → one-sentence plain-English explanation. Defined ONCE here so the
  // same term explains identically everywhere it's used.
  var GLOSSARY = {
    marketCap:    "The total value of all the company's shares added together — basically how big the company is.",
    pe:           "How expensive the stock is versus how much the company earns. Higher means pricier.",
    range52:      "The lowest and highest price the stock has traded at over the past year.",
    profitMargin: "Out of every dollar of sales, how much the company keeps as profit after its costs.",
    revGrowth:    "How much the company's total sales have grown or shrunk compared with a year ago.",
    debtToEquity: "How much the company has borrowed versus what its owners put in. Higher means more debt.",
    currentRatio: "Whether it has enough cash and near-cash to cover bills due within a year. Above 1 is comfier.",
    eps:          "Earnings per share — the company's profit split across each share that exists.",
    rsi:          "A 0–100 gauge of how fast the price has moved lately. Over 70 is 'overbought', under 30 'oversold'.",
    ma50:         "The average closing price over the last 50 days — a line that smooths out the trend.",
    beta:         "How much the stock tends to swing versus the whole market. Above 1 means bigger swings.",
    regime:       "A plain label for the stock's current mood — its trend, how jumpy it is, and its trading volume.",
    trend:        "The general direction of the price lately — up, down, or sideways.",
    volatility:   "How much the price has been jumping around recently. Higher means bigger daily moves.",
    volume:       "How many shares are changing hands — whether trading activity is rising, steady, or fading.",
    hot:          "The price has run up fast and far above its recent average, so it may be stretched.",
    offHigh:      "How far below its recent peak the price is sitting right now."
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Returns an HTML string: a tappable term with a dotted underline. Use inside a
  // template literal, e.g. `<span>${glossTerm("P/E (TTM)", "pe")}</span>`.
  // Unknown key → plain escaped text (no underline), so it can never break a label.
  function glossTerm(label, key) {
    if (!GLOSSARY[key]) return esc(label);
    return '<span class="gloss-term" data-gloss="' + esc(key) + '" role="button" tabindex="0" aria-label="' +
      esc(label) + ' — tap to explain">' + esc(label) + "</span>";
  }

  // One shared tooltip element, created lazily.
  var tip = null, openEl = null;
  function ensureTip() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "gloss-tip";
      tip.setAttribute("role", "tooltip");
      document.body.appendChild(tip);
    }
    return tip;
  }
  function hide() {
    if (tip) tip.classList.remove("show");
    openEl = null;
  }
  function show(el) {
    var text = GLOSSARY[el.getAttribute("data-gloss")];
    if (!text) return;
    var t = ensureTip();
    t.textContent = text;
    t.classList.add("show");
    // Position just under the term, clamped to the viewport so it never spills off-screen.
    var r = el.getBoundingClientRect();
    var sx = window.scrollX || window.pageXOffset || 0, sy = window.scrollY || window.pageYOffset || 0;
    t.style.top = (r.bottom + sy + 8) + "px";
    var maxLeft = sx + document.documentElement.clientWidth - t.offsetWidth - 12;
    var left = Math.max(sx + 12, Math.min(r.left + sx, maxLeft));
    t.style.left = left + "px";
    openEl = el;
  }
  function toggle(el) { if (openEl === el) hide(); else show(el); }

  // Tap / click: open a term, or dismiss when tapping anywhere else. Mobile-friendly.
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".gloss-term") : null;
    if (el) { e.preventDefault(); toggle(el); return; }
    if (openEl) hide();
  });
  // Keyboard support: Enter/Space toggles a focused term, Escape dismisses.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { hide(); return; }
    var el = e.target && e.target.classList && e.target.classList.contains("gloss-term") ? e.target : null;
    if (el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(el); }
  });
  window.addEventListener("resize", hide);
  window.addEventListener("scroll", hide, true);

  window.glossTerm = glossTerm;
  window.LIDA_GLOSSARY = GLOSSARY; // exposed so other pages can reuse the same source
})();
