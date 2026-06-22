// Li-Da unified shell — one nav across all rooms.
// Put this at the repo root as /nav.js, then add this line before </body> on each page:
//   <script src="/nav.js" defer></script>
//
// If any of your file names differ, just edit the ROOMS list below.

(function () {
  var ROOMS = [
    { label: "Desk", href: "/research.html" },
    { label: "Watchlist", href: "/watchlist.html" },
    { label: "Alerts", href: "/alerts.html" },
    { label: "Journal", href: "/journal.html" },
  ];

  function base(p) {
    return (p || "").replace(/^\//, "").replace(/\.html$/i, "").toLowerCase() || "index";
  }
  var cur = base(window.location.pathname);

  var css =
    '.lida-shell{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:9999;' +
    'display:flex;align-items:center;gap:4px;background:rgba(20,24,38,0.72);' +
    '-webkit-backdrop-filter:blur(14px) saturate(125%);backdrop-filter:blur(14px) saturate(125%);' +
    'border:1px solid rgba(255,255,255,0.10);border-radius:999px;padding:6px 8px;' +
    'box-shadow:0 10px 36px -12px rgba(0,0,0,0.6);font-family:"IBM Plex Mono",ui-monospace,monospace;' +
    'max-width:calc(100vw - 24px);overflow-x:auto;scrollbar-width:none;}' +
    '.lida-shell::-webkit-scrollbar{display:none;}' +
    '.lida-shell-brand{color:#B3C8E2;font-weight:600;font-size:12px;letter-spacing:0.12em;' +
    'text-transform:uppercase;padding:0 8px;white-space:nowrap;}' +
    '.lida-shell-link{color:#8A92A8;text-decoration:none;font-size:12px;letter-spacing:0.04em;' +
    'padding:7px 12px;border-radius:999px;white-space:nowrap;transition:color .15s,background .15s;}' +
    '.lida-shell-link:hover{color:#EDEFF7;}' +
    '.lida-shell-link.active{color:#B3C8E2;background:rgba(143,176,214,0.18);}' +
    '.lida-shell-sep{width:1px;height:16px;background:rgba(255,255,255,0.12);margin:0 4px;flex:0 0 auto;}' +
    '.lida-shell-who{color:#6E7488;font-size:11px;letter-spacing:0.02em;padding:0 6px;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;}' +
    '.lida-shell-signout{color:#8A92A8;}.lida-shell-signout:hover{color:#D9706B;}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var nav = document.createElement("nav");
  nav.className = "lida-shell";
  // Wordmark uses the shared "The Point" diamond mark (.lida-dot in lida.css).
  var html = '<span class="lida-shell-brand">LI<span class="lida-dot"><span class="d-r"></span><span class="d-l"></span></span>DA</span>';
  ROOMS.forEach(function (r) {
    var active = base(r.href) === cur;
    html += '<a class="lida-shell-link' + (active ? " active" : "") + '" href="' + r.href + '">' + r.label + "</a>";
  });
  nav.innerHTML = html;

  // ---- signed-in indicator / sign-out ----
  var sep = document.createElement("span");
  sep.className = "lida-shell-sep";
  var authSlot = document.createElement("span");
  authSlot.className = "lida-shell-authslot";
  authSlot.style.display = "flex";
  authSlot.style.alignItems = "center";

  function renderAuth() {
    function asSignIn() { authSlot.innerHTML = '<a class="lida-shell-link" href="/login.html">Sign in</a>'; }
    if (!window.lidaAuth) { asSignIn(); return; }
    window.lidaAuth.getSession().then(function (session) {
      if (session && session.user) {
        var email = session.user.email || "account";
        authSlot.innerHTML =
          '<span class="lida-shell-who" title="' + email + '">' + email + '</span>' +
          '<a class="lida-shell-link lida-shell-signout" href="#">Sign out</a>';
        var so = authSlot.querySelector(".lida-shell-signout");
        if (so) so.onclick = function (e) {
          e.preventDefault();
          window.lidaAuth.signOut().then(function () { window.location.href = "/login.html"; });
        };
      } else { asSignIn(); }
    }).catch(asSignIn);
  }
  nav.appendChild(sep);
  nav.appendChild(authSlot);
  renderAuth();

  function mount() { if (document.body) document.body.appendChild(nav); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
