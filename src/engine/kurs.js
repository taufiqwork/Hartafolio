/**
 * Kurs ke Rupiah untuk transaksi bermata uang asing (USD, USDT, atau aset pembayar).
 * Aturan: hari ini = kurs live; tanggal lampau = rata-rata harian; dibekukan saat simpan; manual menang.
 * series: [{waktu:'YYYY-MM-DD HH:MM', harga}] harga Rupiah per 1 unit mata uang itu, dari tab Harga.
 */
(function (root) {
  'use strict';

  function hari(w) { return String(w).slice(0, 10); }

  function resolve(o) {
    if (!o.mataUang || o.mataUang === 'IDR') return { kurs: 1, kurs_sumber: '', kurs_tanggal: '', kurs_waktu: '' };
    if (o.manual > 0) return { kurs: o.manual, kurs_sumber: 'manual', kurs_tanggal: o.tanggal, kurs_waktu: '' };
    var s = (o.series || []).filter(function (x) { return x.harga > 0; }).sort(function (a, b) { return a.waktu < b.waktu ? -1 : 1; });
    if (!s.length) return null;
    if (o.tanggal === o.hariIni) {
      var last = s[s.length - 1];
      return { kurs: last.harga, kurs_sumber: 'realtime', kurs_tanggal: hari(last.waktu), kurs_waktu: String(last.waktu).slice(11, 16) };
    }
    var day = s.filter(function (x) { return hari(x.waktu) === o.tanggal; });
    if (day.length) {
      var avg = day.reduce(function (a, x) { return a + x.harga; }, 0) / day.length;
      return { kurs: Math.round(avg * 100) / 100, kurs_sumber: 'rata_harian', kurs_tanggal: o.tanggal, kurs_waktu: '' };
    }
    // Tidak ada data di hari itu: pakai titik terdekat sebelumnya, ditandai rata_harian pada tanggal titik tersebut.
    var before = s.filter(function (x) { return hari(x.waktu) < o.tanggal; });
    var near = before.length ? before[before.length - 1] : s[0];
    return { kurs: near.harga, kurs_sumber: 'rata_harian', kurs_tanggal: hari(near.waktu), kurs_waktu: '' };
  }

  /** Terapkan hasil resolve ke baris transaksi sebelum disimpan (dibekukan; tidak dihitung ulang). */
  function freeze(trx, r) {
    if (!r) return trx;
    return Object.assign({}, trx, { kurs: r.kurs, kurs_sumber: r.kurs_sumber, kurs_tanggal: r.kurs_tanggal, kurs_waktu: r.kurs_waktu });
  }

  var api = { resolve: resolve, freeze: freeze };
  root.HF = root.HF || {};
  root.HF.kurs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
