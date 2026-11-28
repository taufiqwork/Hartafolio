/**
 * Harga ke Rupiah, nilai, tiga tingkat total, rincian per kelas, dan untung/rugi.
 * prices: { aset_id: { harga, mata_uang } } harga terakhir yang status ok; kursUsd: Rupiah per 1 USD.
 */
(function (root) {
  'use strict';
  var L = (root.HF && root.HF.ledger) || require('./ledger.js');

  function hargaIdr(aset, prices, kursUsd) {
    if (aset.sumber_harga === 'tetap') return 1;
    if (aset.sumber_harga === 'kurs' && (aset.kode_sumber || 'USD') === 'USD') return kursUsd || 0; // Dolar AS = kurs aplikasi; mata uang lain memakai harga barisnya sendiri
    var p = prices && prices[aset.aset_id];
    if (!p || !(p.harga >= 0)) return null; // belum ada harga
    if (p.mata_uang === 'USD' || p.mata_uang === 'USDT') return p.harga * (kursUsd || 0);
    return p.harga;
  }

  function mapBy(list, f) { var m = {}; list.forEach(function (x) { m[x[f]] = x; }); return m; }

  /**
   * Nilai seluruh salinan. o: { bal, aset[], anggota[], prices, kursUsd, piutang: [{pemberi_anggota_id, aset_id, sisa}] }
   * Hasil: perAnggota{id:{total,perAset,perKelas}}, pengelola, salinan, piutang, tanpaHarga[]
   * Piutang dihitung sebagai bagian total pemberi (sisa x harga hari ini).
   */
  function nilai(o) {
    var A = mapBy(o.aset, 'aset_id'), res = { perAnggota: {}, tanpaHarga: [], piutang: 0 };
    function bucket(id) { return res.perAnggota[id] || (res.perAnggota[id] = { total: 0, piutang: 0, perAset: {}, perKelas: {} }); }
    function add(anggota, aset, qty, piutang) {
      var h = hargaIdr(aset, o.prices, o.kursUsd);
      if (h === null) { if (res.tanpaHarga.indexOf(aset.aset_id) < 0) res.tanpaHarga.push(aset.aset_id); return; }
      var v = qty * h, b = bucket(anggota);
      b.total += v;
      if (piutang) { b.piutang += v; res.piutang += v; }
      b.perAset[aset.aset_id] = (b.perAset[aset.aset_id] || 0) + v;
      b.perKelas[aset.kelas] = (b.perKelas[aset.kelas] || 0) + v;
    }
    Object.keys(o.bal).forEach(function (k) {
      var p = L.parseKey(k), aset = A[p.aset_id];
      if (aset) add(p.anggota_id, aset, o.bal[k], false);
    });
    (o.piutang || []).forEach(function (p) { var aset = A[p.aset_id]; if (aset && p.sisa > 0) add(p.pemberi_anggota_id, aset, p.sisa, true); });
    o.anggota.forEach(function (m) { bucket(m.anggota_id); });
    var aktif = o.anggota.filter(function (m) { return m.aktif !== false; });
    res.salinan = aktif.reduce(function (s, m) { return s + res.perAnggota[m.anggota_id].total; }, 0);
    var owner = aktif.filter(function (m) { return m.is_pengelola; })[0];
    res.pengelola = owner ? res.perAnggota[owner.anggota_id].total : 0;
    res.usd = kursUsdSafe(o.kursUsd) ? res.salinan / o.kursUsd : null;
    return res;
  }
  function kursUsdSafe(k) { return k > 0; }

  /** Persentase per kelas (pie), diurutkan terbesar; kelas nol dibuang. */
  function persenKelas(perKelas) {
    var tot = Object.keys(perKelas).reduce(function (s, k) { return s + Math.max(0, perKelas[k]); }, 0);
    if (!tot) return [];
    return Object.keys(perKelas).filter(function (k) { return perKelas[k] > 0; })
      .map(function (k) { return { kelas: k, nilai: perKelas[k], persen: perKelas[k] / tot * 100 }; })
      .sort(function (a, b) { return b.nilai - a.nilai; });
  }

  /** Untung/rugi belum terealisasi dari satu posisi modal. Hanya bagian yang modalnya diketahui. */
  function untung(posisi, hargaNow) {
    if (!posisi || !(posisi.qtyKnown > 0) || hargaNow === null) return null;
    var nilaiNow = posisi.qtyKnown * hargaNow;
    return { modal: posisi.cost, nilai: nilaiNow, untung: nilaiNow - posisi.cost, persen: posisi.cost > 0 ? (nilaiNow - posisi.cost) / posisi.cost * 100 : null,
      sebagian: posisi.qtyKnown < posisi.qty - 1e-9 };
  }

  var api = { hargaIdr: hargaIdr, nilai: nilai, persenKelas: persenKelas, untung: untung };
  root.HF = root.HF || {};
  root.HF.valuation = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
