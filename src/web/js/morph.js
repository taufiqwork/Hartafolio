/* Perbarui DOM di tempat: samakan isi `el` dengan `html` tanpa membuang elemen yang sama.
   Elemen yang tetap ada hanya berubah atribut dan teksnya, sehingga transisi CSS jalan, fokus ketikan tidak hilang,
   dan animasi masuk hanya memutar untuk elemen yang benar-benar baru (sama seperti board). */
(function (root) {
  'use strict';
  function attrs(a, b) {
    var i, n;
    for (i = a.attributes.length - 1; i >= 0; i--) { n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
    for (i = 0; i < b.attributes.length; i++) { n = b.attributes[i].name; if (a.getAttribute(n) !== b.attributes[i].value) a.setAttribute(n, b.attributes[i].value); }
    if (a.nodeName === 'INPUT' && a !== document.activeElement && a.value !== b.getAttribute('value')) a.value = b.getAttribute('value') || '';
    if (a.nodeName === 'TEXTAREA' && a !== document.activeElement && a.value !== b.value) a.value = b.value;
  }
  function sync(a, b) {
    var ac = [].slice.call(a.childNodes), bc = [].slice.call(b.childNodes), i;
    for (i = 0; i < bc.length; i++) {
      var x = ac[i], y = bc[i];
      if (!x) { a.appendChild(y.cloneNode(true)); continue; }
      if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) { a.replaceChild(y.cloneNode(true), x); continue; }
      if (x.nodeType === 3) { if (x.data !== y.data) x.data = y.data; continue; }
      if (x.nodeType !== 1) continue;
      attrs(x, y); sync(x, y);
    }
    while (a.childNodes.length > bc.length) a.removeChild(a.lastChild);
  }
  root.HF = root.HF || {};
  root.HF.morph = function (el, html) { var t = document.createElement('template'); t.innerHTML = html; sync(el, t.content); };
})(typeof globalThis !== 'undefined' ? globalThis : this);
