// loader.js — Li-Da's shared, calm read-loading state.
//
// One component used in BOTH places a read is awaited: the anonymous inline read
// on the home page and the Desk read flow. It shows the LI·DA mark (the diamond
// dot gently pulsing — a quiet heartbeat while it weighs both sides), a rotating
// "fact" line, and an honest, generic status line. Purely cosmetic — it does not
// touch the read, the data calls, or the model.
//
// Usage:  var ctl = window.lidaLoader.mount(containerEl);   // renders + starts
//         ...when the read resolves...  ctl.stop();          // clears the timer

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
  var ROTATE_MS = 5000; // fade to another fact if the wait runs past ~5s
  var FADE_MS = 320;    // keep in sync with the .lida-loader-fact transition
  var last = -1;

  // Random fact index, never the immediately-previous one.
  function pick() {
    if (FACTS.length <= 1) return 0;
    var i;
    do { i = Math.floor(Math.random() * FACTS.length); } while (i === last);
    last = i;
    return i;
  }

  function mount(container) {
    if (!container) return { stop: function () {} };
    container.innerHTML =
      '<div class="lida-loader">' +
        '<div class="lida-loader-mark">LI<span class="lida-dot"><span class="d-r"></span><span class="d-l"></span></span>DA</div>' +
        '<div class="lida-loader-fact"></div>' +
        '<div class="lida-loader-status"></div>' +
      "</div>";
    var factEl = container.querySelector(".lida-loader-fact");
    var statusEl = container.querySelector(".lida-loader-status");
    if (factEl) factEl.textContent = FACTS[pick()];   // textContent → emojis render, no escaping
    if (statusEl) statusEl.textContent = STATUS;

    var timer = setInterval(function () {
      if (!factEl || !factEl.isConnected) { clearInterval(timer); return; } // self-clear if detached
      factEl.classList.add("is-fading");
      setTimeout(function () {
        if (!factEl || !factEl.isConnected) return;
        factEl.textContent = FACTS[pick()];
        factEl.classList.remove("is-fading");
      }, FADE_MS);
    }, ROTATE_MS);

    return { stop: function () { clearInterval(timer); } };
  }

  window.lidaLoader = { mount: mount, facts: FACTS };
})();
