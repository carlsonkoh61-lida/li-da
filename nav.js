// Li-Da unified shell — one nav across all rooms.
// Put this at the repo root as /nav.js, then add this line before </body> on each page:
//   <script src="/nav.js" defer></script>
//
// If any of your file names differ, just edit the ROOMS list below.

(function () {
  var ROOMS = [
    { label: "Home", href: "/index.html" },
    { label: "Desk", href: "/research.html" },
    { label: "Journal", href: "/journal.html" },
    { label: "Tasks", href: "/lida-tasks.html" },
    { label: "Second Thought", href: "/second-thought.html" },
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
    '.lida-shell-brand{color:#C9BEFF;font-weight:600;font-size:12px;letter-spacing:0.12em;' +
    'text-transform:uppercase;padding:0 8px;white-space:nowrap;}' +
    '.lida-shell-link{color:#8A92A8;text-decoration:none;font-size:12px;letter-spacing:0.04em;' +
    'padding:7px 12px;border-radius:999px;white-space:nowrap;transition:color .15s,background .15s;}' +
    '.lida-shell-link:hover{color:#EDEFF7;}' +
    '.lida-shell-link.active{color:#C9BEFF;background:rgba(133,118,255,0.16);}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var nav = document.createElement("nav");
  nav.className = "lida-shell";
  var html = '<span class="lida-shell-brand">Li-Da</span>';
  ROOMS.forEach(function (r) {
    var active = base(r.href) === cur;
    html += '<a class="lida-shell-link' + (active ? " active" : "") + '" href="' + r.href + '">' + r.label + "</a>";
  });
  nav.innerHTML = html;

  function mount() { if (document.body) document.body.appendChild(nav); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
