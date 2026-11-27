/**
 * Aset (tab): posisi per anggota, aset, dan lokasi, dikelompokkan per kelas aset. JS murni, tanpa DOM. Mengikuti board 03-Aset*.
 * Satu posisi = [nama aset, kelas, lokasi, anggota, teks jumlah, nilai dalam juta Rupiah, manual]. Data contoh (src/demo/aset-demo.js)
 * dan data nyata (fromState) memakai bentuk yang sama.
 */
(function (root) {
  'use strict';
  var CLS = ['Emas', 'Perak', 'Crypto', 'Saham', 'Mata uang'];
  var UNIT = { gram: ' g', token: ' token', lot: ' lot', lembar: ' lembar' }; // koin dan nominal ditulis tanpa satuan
  var ICON = {
    'Emas': ['M6 3h12l4 6-10 13L2 9Z', 'M11 3 8 9l4 13 4-13-3-6', 'M2 9h20'],
    'Crypto': ['M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727'],
    'Perak': ['M14 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0', 'M18.09 10.37A6 6 0 1 1 10.34 18', 'M7 6h1v4', 'm16.71 13.88.7.71-2.82 2.82'],
    'Saham': ['M9 5v4', 'M7 10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z', 'M9 15v2', 'M17 3v2', 'M15 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z', 'M17 13v3', 'M3 3v16a2 2 0 0 0 2 2h16'],
    'Mata uang': ['M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2', 'M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0', 'M6 12h.01M18 12h.01']
  };
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function jt(v) { return root.HF.beranda.jt(v); } // sama dengan Beranda: "Rp 174,2 jt", mulai 1.000 jt "Rp 1,2 M"
  function lab(a) { return a.sumber_harga === 'manual' ? a.nama : (a.bentuk === 'Fisik' ? a.nama + ' fisik' : a.simbol); }
  function numStr(n) { return root.HF.format.number(Math.round(n * 1e8) / 1e8); }

  /** Posisi dari data Sheet. Aset tanpa harga tidak punya nilai: dihitung di `tanpaHarga` (titik merah di tombol Kelola). */
  function fromState(state, o) {
    var Lg = root.HF.ledger, B = root.HF.beranda, V = root.HF.valuation;
    var trx = ((state && state.transaksi) || []).filter(function (t) { return !t.status || t.status === 'aktif'; });
    var A = {}, M = {}, Lk = {}, anggota = (state.anggota || []).filter(function (m) { return m.aktif !== false; });
    (state.aset || []).forEach(function (a) { A[a.aset_id] = a; });
    anggota.forEach(function (m) { M[m.anggota_id] = m.nama; });
    (state.lokasi || []).forEach(function (l) { Lk[l.lokasi_id] = l.nama; });
    var hp = B.hargaPerkiraan(state, trx), bal = Lg.balances(trx), AR = [], tanpa = [];
    Object.keys(bal).forEach(function (k) {
      var p = Lg.parseKey(k), a = A[p.aset_id];
      if (!(bal[k] > 0) || !a || !M[p.anggota_id] || !Lk[p.lokasi_id]) return;
      var h = V.hargaIdr(a, hp.prices, hp.kurs);
      if (h === null) { if (tanpa.indexOf(a.aset_id) < 0) tanpa.push(a.aset_id); return; }
      var q = a.aset_id === 'AS-IDR' ? 'tunai' : numStr(bal[k]) + (UNIT[a.satuan] || '');
      AR.push([lab(a), a.kelas, Lk[p.lokasi_id], M[p.anggota_id], q, bal[k] * h / 1e6, a.sumber_harga === 'manual']);
    });
    return { real: true, MEM: anggota.map(function (m) { return m.nama; }), AR: AR, tanpaHarga: tanpa.length };
  }

  /**
   * Model tampilan. ui = { aM: anggota|null, aL: lokasi|null, lokOpen: bool }. Tanpa anggota dipilih, aset yang sama di lokasi yang sama
   * dari beberapa anggota digabung ("Milik 3 anggota"); dengan anggota dipilih, jumlahnya tampil.
   */
  function view(d, ui) {
    ui = ui || {};
    var aM = ui.aM || null, aL = ui.aL || null, AR = d.AR || [], empty = AR.length === 0, all = 0, count = 0;
    var LOK = []; AR.forEach(function (r) { if (LOK.indexOf(r[2]) < 0) LOK.push(r[2]); });
    if (d.LOK) LOK = d.LOK;
    function lokTot(l) { return sum(AR.filter(function (r) { return r[2] === l && (!aM || r[3] === aM); }).map(function (r) { return r[5]; })); }
    var pills = [null].concat(d.MEM).map(function (m) { return { l: m || 'Semua', pressed: String(aM === m), v: m }; });
    var groups = CLS.map(function (k) {
      var rows = AR.filter(function (r) { return r[1] === k && (!aM || r[3] === aM) && (!aL || r[2] === aL); });
      if (!aM) {
        var g = {};
        rows.forEach(function (r) { var key = r[0] + '|' + r[2]; (g[key] = g[key] || []).push(r); });
        rows = Object.keys(g).map(function (key) { var rs = g[key]; return [rs[0][0], k, rs[0][2], rs.length > 1 ? 'Milik ' + rs.length + ' anggota' : rs[0][3], rs.length > 1 ? '' : rs[0][4], sum(rs.map(function (x) { return x[5]; })), rs.some(function (x) { return x[6]; })]; });
      }
      count += rows.length; var gv = sum(rows.map(function (r) { return r[5]; })); all += gv;
      var gold = k === 'Emas' || k === 'Perak';
      return { k: k, gv: gv, n: rows.length, paths: ICON[k], tint: gold ? 'var(--gold-soft)' : 'var(--brand-soft)', ink: gold ? 'var(--gold)' : 'var(--brand)', v: jt(gv),
        rows: rows.map(function (r) { return { a: r[0], l: r[2], q: aM ? r[4] : (r[4] ? r[4] + ' · ' : ''), p: aM ? '' : r[3], v: jt(r[5]), num: r[5], manual: !!r[6] }; }) };
    }).filter(function (g) { return g.rows.length; }).sort(function (x, y) { return y.gv - x.gv; });
    groups.forEach(function (g) { g.rows.sort(function (x, y) { return y.num - x.num; }); g.share = Math.round(g.gv / all * 100) + '%'; });
    var lokOpts = [null].concat(LOK).map(function (l) { return { l: l || 'Semua', v: jt(l ? lokTot(l) : sum(AR.filter(function (r) { return !aM || r[3] === aM; }).map(function (r) { return r[5]; }))), sel: String(aL === l), val: l }; });
    return { hasRows: !empty, empty: empty, pills: pills, groups: groups, count: count, total: jt(all), lokOpen: !!ui.lokOpen, lokOpts: lokOpts, lokLabel: aL || 'Semua', perluHarga: d.tanpaHarga || 0 };
  }

  var api = { fromState: fromState, view: view, CLS: CLS };
  root.HF = root.HF || {};
  root.HF.aset = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
