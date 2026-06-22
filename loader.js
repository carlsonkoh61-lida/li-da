// loader.js — Li-Da's shared, calm read-loading state.
//
// One component used in BOTH places a read is awaited: the anonymous inline read
// on the home page and the Desk read flow. It shows a soft full-screen overlay
// ("loading wall") with the LI·DA mark (the diamond dot gently pulsing — a quiet
// heartbeat while it weighs both sides), ONE steady fact, and an honest status
// line. When the read is ready, the overlay fades out to reveal it underneath.
// Purely cosmetic — it does not touch the read, the data calls, or the model.
//
// Usage:  window.lidaLoader.show();   // raise the overlay
//         ...when the read resolves...  window.lidaLoader.hide();

(function () {
  // Easy to extend — just add lines. Emojis are intentional.
  var FACTS = [
    "Hype is a great salesman and a terrible advisor. 🎩",
    "Li-Da gives you a second opinion — not a fortune teller. The call is yours. 🔮",
    "Decide when you'll walk away before you fall in love with the stock. 💔",
    "Anyone can sell you the dream. Li-Da shows you the fine print too. 🔍",
    "\"Trust me, it'll moon\" is not a strategy. 🌙",
    "Slow is the point. The market loves to punish people in a hurry. 🐢",
    "Funny thing: most investors earn less than the funds they own — by buying high and panic-selling low. 📉",
    "Most \"expert\" stock pickers can't beat a boring index fund. Humbling, really. 🥱",
    "\"Past performance doesn't predict the future\" — boring, but they're not lying. 🥱",
    "Don't put all your eggs in one stock. Eggs break. Stocks too. 🥚",
    "The four most expensive words in investing: \"this time is different.\" 💸",
    "Take a breath. A good decision rarely needs to be rushed. 🌱",
    "The bull case and the bear case, side by side — that's the whole idea.",
    "Hype is loud. Good thinking is quiet.",
    "You don't need to catch every move. You need to avoid the big mistakes.",
    "A confident \"maybe\" beats a reckless \"definitely.\"",
    "The goal isn't to be right every time — it's to think clearly every time. ✨",
  ];

  var STATUS = "Pulling the latest data and weighing both sides…";
  var FADE_MS = 300; // overlay fade-out duration — keep in sync with the CSS transition
  var last = -1;

  var overlay = null, removeTimer = null;

  // Random fact index, never the immediately-previous one (variety across loads).
  function pick() {
    if (FACTS.length <= 1) return 0;
    var i;
    do { i = Math.floor(Math.random() * FACTS.length); } while (i === last);
    last = i;
    return i;
  }

  function lockScroll() {
    document.documentElement.classList.add("lida-noscroll");
    if (document.body) document.body.classList.add("lida-noscroll");
  }
  function unlockScroll() {
    document.documentElement.classList.remove("lida-noscroll");
    if (document.body) document.body.classList.remove("lida-noscroll");
  }

  // Raise the soft full-screen overlay with ONE steady fact (no rotation).
  function show() {
    if (overlay) return;             // already up
    clearTimeout(removeTimer);
    overlay = document.createElement("div");
    overlay.className = "lida-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");
    overlay.innerHTML =
      '<div class="lida-loader">' +
        '<div class="lida-loader-mark">LI<span class="lida-dot"><span class="d-r"></span><span class="d-l"></span></span>DA</div>' +
        '<div class="lida-loader-fact"></div>' +
        '<div class="lida-loader-status"></div>' +
      "</div>";
    var factEl = overlay.querySelector(".lida-loader-fact");
    var statusEl = overlay.querySelector(".lida-loader-status");
    if (factEl) factEl.textContent = FACTS[pick()];  // textContent → emojis render, no escaping
    if (statusEl) statusEl.textContent = STATUS;
    document.body.appendChild(overlay);
    lockScroll();
    void overlay.offsetWidth;          // force reflow so the fade-in transition runs
    overlay.classList.add("is-visible");
  }

  // Fade the overlay out and reveal the finished read underneath.
  function hide() {
    if (!overlay) return;
    var el = overlay;
    overlay = null;
    el.classList.remove("is-visible");
    clearTimeout(removeTimer);
    removeTimer = setTimeout(function () {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      if (!overlay) unlockScroll();    // only unlock if no newer overlay is up
    }, FADE_MS);
  }

  window.lidaLoader = { show: show, hide: hide, facts: FACTS };
})();
