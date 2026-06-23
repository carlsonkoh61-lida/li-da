// footer.js — Li-Da's shared legal/disclaimer footer.
//
// Injected on every page (same pattern as nav.js) so the disclaimer line and the
// Disclaimer · Terms · Privacy links are edited in ONE place — when the lawyer
// changes the wording, you change it here, not on every page.
//
// Add to a page with:  <script src="/footer.js" defer></script>
// Requires lida.css (loaded by every page) so the var(--…) tokens resolve.

(function () {
  var css =
    '.lida-footer{max-width:680px;margin:48px auto 0;padding:20px 22px 36px;' +
    'border-top:1px solid var(--line);text-align:center;font-family:var(--font-body);}' +
    '.lida-footer .lf-line{font-size:13px;line-height:1.5;color:var(--gold);}' +
    '.lida-footer .lf-links{margin-top:8px;font-size:12.5px;}' +
    '.lida-footer .lf-links a{color:var(--gold);text-decoration:underline;}' +
    '.lida-footer .lf-links a:hover{text-decoration:none;}';

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var footer = document.createElement("footer");
  footer.className = "lida-footer";
  footer.innerHTML =
    '<p class="lf-line">Data and reasoning, never a verdict. The call is always yours.</p>' +
    '<p class="lf-links">' +
      '<a href="/disclaimer.html">Disclaimer</a> · ' +
      '<a href="/terms.html">Terms</a> · ' +
      '<a href="/privacy.html">Privacy</a>' +
    '</p>';

  function mount() { if (document.body) document.body.appendChild(footer); }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
