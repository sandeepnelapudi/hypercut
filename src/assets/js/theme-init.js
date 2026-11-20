// Runs before paint to avoid a theme flash. Kept tiny and dependency-free.
(function () {
  try {
    var t = localStorage.getItem('hc:v1~theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) { /* storage blocked: keep default */ }
})();
