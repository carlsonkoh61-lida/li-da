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
    offHigh:      "How far below its recent peak the price is sitting right now.",
    overbought:   "The price has risen fast lately and may be due for a pause or pullback.",
    oversold:     "The price has fallen fast lately and may be due for a bounce.",
    premium:      "Pricier than similar companies — investors are paying up for it.",
    discount:     "Cheaper than similar companies.",
    lean:         "Which way the evidence tilts — buy, sell, or hold. One honest input to weigh, not an instruction.",
    confidence:   "How sure Li-Da is about its lean — low, medium, or high. A level, never a percentage.",
    stop:         "A price where you'd sell to cap your loss if the trade goes against you.",
    target:       "A price where you'd take some profit if the trade works out.",
    riskReward:   "What you stand to gain versus lose — e.g. 2:1 means twice the potential reward as risk."
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
    if (!GLOSSARY[key]) return esc(label); // unknown/no key → plain text, no underline
    scheduleHint(); // a real term was rendered — arm the one-time "tap to learn" hint
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

  // ---- one-time "tap any underlined term" hint ---------------------------
  // The first time a signed-in user sees these terms on any page, show a small
  // dismissible hint, then never again. The "seen" flag is persisted PER USER in
  // Supabase (user_prefs table, RLS), NOT localStorage. Fails soft: if we can't
  // read the flag (not signed in, table missing, network), we simply don't nag.
  var hintSeen = null, hintShown = false, hintQueued = false;
  var seenResolve, seenReady = new Promise(function (r) { seenResolve = r; });

  function loadSeenFlag() {
    var auth = window.lidaAuth;
    if (!auth || !auth.client || !auth.getUser) { hintSeen = true; seenResolve(); return; }
    auth.getUser().then(function (user) {
      if (!user) { hintSeen = true; seenResolve(); return; } // not signed in → can't persist, skip
      auth.client.from("user_prefs").select("glossary_hint_seen").eq("user_id", user.id).maybeSingle()
        .then(function (res) {
          if (res && res.error) { hintSeen = true; seenResolve(); return; } // e.g. table not created yet
          hintSeen = !!(res && res.data && res.data.glossary_hint_seen);
          seenResolve();
        }, function () { hintSeen = true; seenResolve(); });
    }, function () { hintSeen = true; seenResolve(); });
  }

  function markSeen() {
    var auth = window.lidaAuth;
    if (!auth || !auth.client || !auth.getUser) return;
    auth.getUser().then(function (user) {
      if (!user) return;
      auth.client.from("user_prefs")
        .upsert({ user_id: user.id, glossary_hint_seen: true, updated_at: new Date().toISOString() })
        .then(function () {}, function () {});
    }, function () {});
  }

  // Called when the first real term renders; defers to the next tick so the
  // term's markup is already in the DOM before the hint points at it.
  function scheduleHint() {
    if (hintQueued) return;
    hintQueued = true;
    setTimeout(showHintOnce, 0);
  }

  function showHintOnce() {
    seenReady.then(function () {
      if (hintSeen || hintShown) return;
      hintShown = true;
      hintSeen = true;  // lock locally so nothing re-triggers it this load
      markSeen();       // persist per-user so it never shows again
      var bar = document.createElement("div");
      bar.className = "gloss-hint";
      bar.innerHTML =
        '<span>Tap any <span class="gloss-hint-eg">underlined term</span> to learn what it means.</span>' +
        '<button type="button" class="gloss-hint-x" aria-label="Dismiss hint">Got it</button>';
      document.body.appendChild(bar);
      requestAnimationFrame(function () { bar.classList.add("show"); });
      bar.querySelector(".gloss-hint-x").addEventListener("click", function () {
        bar.classList.remove("show");
        setTimeout(function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }, 220);
      });
    });
  }

  loadSeenFlag();

  window.glossTerm = glossTerm;
  window.LIDA_GLOSSARY = GLOSSARY; // exposed so other pages can reuse the same source
})();
