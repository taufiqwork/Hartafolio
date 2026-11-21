/* Halaman uji komponen: mengisi ikon dan mengganti tema. */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('i[data-icon]'), function (el) {
    var tmp = document.createElement('span');
    tmp.innerHTML = HF.icon(el.getAttribute('data-icon'), el.getAttribute('data-size') || null);
    el.replaceWith(tmp.firstChild);
  });
  function theme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.getElementById('tLight').setAttribute('aria-pressed', String(t === 'light'));
    document.getElementById('tDark').setAttribute('aria-pressed', String(t === 'dark'));
  }
  document.getElementById('tLight').addEventListener('click', function () { theme('light'); });
  document.getElementById('tDark').addEventListener('click', function () { theme('dark'); });
})();
