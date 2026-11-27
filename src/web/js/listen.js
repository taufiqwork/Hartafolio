/**
 * Pendengar klik/ketik milik layar yang sedang tampil. Semua layar menggambar ke satu elemen (#app) yang tidak pernah diganti,
 * jadi pendengar yang dipasang layar lama ikut hidup dan menjalankan data lamanya (Simpan di Catat menyimpan ulang transaksi
 * sebelumnya). Layar memasang pendengar lewat `on`; `reset` dipanggil app.js sebelum layar berikutnya digambar.
 */
(function (root) {
  'use strict';
  var PROP = ['onclick', 'oninput', 'onkeydown', 'onchange', 'onfocusout'];

  /** Pasang pendengar dan catat supaya bisa dilepas oleh reset. */
  function on(el, type, fn) {
    el.addEventListener(type, fn);
    (el.__hfOff = el.__hfOff || []).push(function () { el.removeEventListener(type, fn); });
  }

  /** Lepas semua pendengar yang dipasang lewat `on`, dan kosongkan handler berbentuk properti (layar Setup dan Riwayat). */
  function reset(el) {
    (el.__hfOff || []).forEach(function (off) { off(); });
    el.__hfOff = [];
    PROP.forEach(function (p) { el[p] = null; });
  }

  var api = { on: on, reset: reset };
  root.HF = root.HF || {};
  root.HF.listen = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
