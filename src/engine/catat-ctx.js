/**
 * Catat transaksi: dari data nyata ke `ctx` (lihat engine/catat.js) dan dari keadaan layar ke baris Transaksi.
 * Murni, bisa diuji di Node. Harga dan kurs belum punya sumber otomatis (Tahap 6): kosong berarti diisi manual.
 */
(function (root) {
  'use strict';

  /** Nama tampilan sebuah aset di pilihan: fisik bawaan = "Emas fisik", buatan sendiri = namanya, selain itu simbol (PAXG, BTC, GFI). */
  function label(a) { return a.sumber_harga === 'manual' ? a.nama : (a.bentuk === 'Fisik' ? a.nama + ' fisik' : a.simbol); }
  function aktif(r) { return r.aktif !== false && r.aktif !== 'tidak'; }

  /** state = hasil apiState (anggota, lokasi, aset, transaksi). now = { y, m, d, hh, mm }. */
  function fromState(state, now) {
    var L = root.HF.ledger;
    var members = state.anggota.filter(aktif), lokasi = state.lokasi.filter(aktif), aset = (state.aset || []).filter(function (a) { return a.status !== 'dihapus' && a.status !== 'tersembunyi'; });
    var ids = { members: {}, lokasi: {}, aset: {} }, byId = { m: {}, l: {}, a: {} };
    members.forEach(function (m) { ids.members[m.nama] = m.anggota_id; byId.m[m.anggota_id] = m.nama; });
    lokasi.forEach(function (l) { ids.lokasi[l.nama] = l.lokasi_id; byId.l[l.lokasi_id] = l.nama; });
    aset.forEach(function (a) { ids.aset[label(a)] = a.aset_id; byId.a[a.aset_id] = label(a); });
    var bal = {}, held = {};
    members.forEach(function (m) { held[m.nama] = []; });
    var raw = L.balances(state.transaksi || []);
    Object.keys(raw).forEach(function (k) {
      var p = L.parseKey(k), m = byId.m[p.anggota_id], a = byId.a[p.aset_id], l = byId.l[p.lokasi_id];
      if (!m || !a || !l || raw[k] <= 0) return;
      bal[m + '|' + a + '|' + l] = raw[k];
      var row = held[m].filter(function (x) { return x[0] === a; })[0];
      if (!row) held[m].push([a, [l]]); else if (row[1].indexOf(l) < 0) row[1].push(l);
    });
    var assets = {};
    aset.forEach(function (a) { assets[label(a)] = { unit: a.satuan, cat: a.kelas, quote: a.mata_uang_harga && a.mata_uang_harga !== 'IDR' ? a.mata_uang_harga : undefined }; });
    var cat = aset.filter(function (a) { return a.aset_id !== 'AS-IDR'; }).map(function (a) { return [label(a), a.nama, a.kelas, a.satuan]; });
    return { demo: false, members: members.map(function (m) { return m.nama; }), lokasi: lokasi.map(function (l) { return l.nama; }), held: held, bal: bal, assets: assets, rates: {},
      payCur: aset.filter(function (a) { return a.kelas === 'Mata uang' && a.aset_id !== 'AS-IDR' || a.simbol === 'USDT'; }).map(label), catalog: cat, now: now, ids: ids,
      awalBase: function (all) { return aset.filter(function (a) { return a.aset_id !== 'AS-IDR'; }).map(function (a) { return [label(a), all]; }); } };
  }

  function two(n) { return String(n).padStart(2, '0'); }
  function nowOf(d) { d = d || new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), hh: d.getHours(), mm: d.getMinutes() }; }

  /**
   * Baris Transaksi dari keadaan layar (vm hasil HF.catat.view). Mengembalikan { rows:[...], error } .
   * Pindah dengan biaya Rupiah menghasilkan baris Keluar tambahan (aturan: biaya Pindah = transaksi Keluar sendiri).
   */
  function toRows(vm, ctx, o) {
    var N = root.HF.catat.num, ids = ctx.ids, id = function (k, v) { return ids[k][v]; };
    var date = vm.dy + '-' + two(vm.dm) + '-' + two(vm.dd), time = two(vm.hh) + ':' + two(vm.mm);
    var base = { tanggal: date, jam: time, jenis: vm.fJ, anggota_id: id('members', vm.fM), aset_id: id('aset', vm.fA), lokasi_id: id('lokasi', vm.fL), jumlah: N(vm.q), sumber: 'manual' };
    if (vm.awal) { base.jenis = 'Saldo awal'; base.tanggal = date; var avg = N(o.avg); if (avg > 0) { base.harga_beli_rata2 = avg; } }
    if (vm.fJ === 'Beli' || vm.fJ === 'Jual') {
      base.harga_per_unit = N(vm.pv); base.harga_mata_uang = vm.cur === 'IDR' || vm.pay !== 'luar' ? (vm.pay === 'luar' ? 'IDR' : vm.pc) : vm.cur; base.biaya = N(vm.fee) || 0;
      if (vm.cur !== 'IDR') { base.kurs = vm.rate; base.kurs_sumber = vm.kursManualFlag ? 'manual' : 'otomatis'; base.kurs_tanggal = date; base.kurs_waktu = time; }
      if (vm.pay !== 'luar') { base.alat_bayar_aset_id = id('aset', vm.pc); base.alat_bayar_lokasi_id = id('lokasi', vm.pl); }
    }
    if ((vm.isIn || vm.isOut) && !vm.awal) base.asal_alasan = vm.fS;
    if (vm.isMove) {
      if (vm.isMoveMem) { base.anggota_tujuan_id = id('members', vm.fR); base.lokasi_tujuan_id = id('lokasi', vm.fKa); } else base.lokasi_tujuan_id = id('lokasi', vm.fK);
    }
    var rows = [base];
    if (vm.isMove && vm.hasFee) {
      var fee = N(vm.fee);
      if (vm.feeUnit === vm.unit && vm.unit !== 'Rp') rows.push(Object.assign({}, base, { jenis: 'Keluar', jumlah: fee, asal_alasan: 'Biaya', lokasi_tujuan_id: undefined, anggota_tujuan_id: undefined }));
      else return { rows: rows, error: 'biaya-rupiah' }; // dibahas di putaran Pindah
    }
    if (o.nomor) base.bukti = o.nomor;
    return { rows: rows, error: null };
  }

  var api = { label: label, fromState: fromState, nowOf: nowOf, toRows: toRows };
  root.HF = root.HF || {};
  root.HF.catatCtx = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
