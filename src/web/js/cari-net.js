/**
 * Pencarian aset lewat jaringan untuk Kelola aset › Tambah aset.
 *  crypto  CoinGecko /search langsung dari browser (izinkan CORS; Google memblokir panggilan dari server, jadi tidak lewat server).
 *  markets CoinGecko /coins/markets: urutan nilai pasar untuk daftar crypto populer.
 *  saham   Yahoo tidak mengizinkan panggilan dari browser, jadi lewat server (apiAsetCari).
 * Semua mengembalikan Promise; galat jaringan menolak Promise dan layar menampilkan "Pencarian belum tersambung".
 */
(function (root) {
  'use strict';
  function ambil(url) {
    return root.fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
  }
  var P = function () { return root.HF.populer; };
  root.HF = root.HF || {};
  root.HF.cariNet = {
    crypto: function (q) { return ambil(P().URL.cariCrypto(q)).then(function (t) { var r = P().parse.coingeckoCari(t); if (!r) throw new Error('jawaban tidak dikenal'); return r.slice(0, 10); }); },
    markets: function () { return ambil(P().URL.markets).then(function (t) { return P().parse.markets(t); }); },
    saham: function (q) { return root.HF.api.call('apiAsetCari', 'saham', q); }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
