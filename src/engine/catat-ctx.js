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
    var assets = {}, H = state.harga || {}, last = H.terakhir || {}, ks = H.kursSeries || [], usdidr = ks.length ? ks[ks.length - 1].harga : null;
    aset.forEach(function (a) {
      var h = last[a.aset_id], price = null; // harga IDR per satuan dari tab Harga (aset manual atau harga otomatis kelak); kosong = belum ada
      if (h && h.mata_uang === 'IDR') price = h.harga; else if (h && h.mata_uang === 'USD' && usdidr) price = h.harga * usdidr;
      assets[label(a)] = { unit: a.satuan, cat: a.kelas, quote: a.mata_uang_harga && a.mata_uang_harga !== 'IDR' ? a.mata_uang_harga : undefined, price: price };
    });
    var cat = aset.filter(function (a) { return a.aset_id !== 'AS-IDR'; }).map(function (a) { return [label(a), a.nama, a.kelas, a.satuan]; });
    return { demo: false, members: members.map(function (m) { return m.nama; }), lokasi: lokasi.map(function (l) { return l.nama; }), held: held, bal: bal, assets: assets, rates: {},
      payCur: aset.filter(function (a) { return a.kelas === 'Mata uang' && a.aset_id !== 'AS-IDR' || a.simbol === 'USDT'; }).map(label), catalog: cat, now: now, ids: ids,
      awalBase: function (all) { return aset.filter(function (a) { return a.aset_id !== 'AS-IDR'; }).map(function (a) { return [label(a), all]; }); } };
  }


  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function nameOf(map, id) { var k = Object.keys(map).filter(function (n) { return map[n] === id; })[0]; return k || null; }

  /**
   * ctx untuk Ubah transaksi: saldo dihitung TANPA transaksi yang diubah (supaya saldo dan batas jumlah wajar), lalu aset dan lokasi
   * milik transaksi itu dimasukkan lagi ke pilihan. Mengembalikan null bila anggota, aset, atau lokasinya sudah tidak ada (dihapus atau disembunyikan).
   */
  function forUbah(state, trx, now) {
    var rest = Object.assign({}, state, { transaksi: (state.transaksi || []).filter(function (t) { return t.trx_id !== trx.trx_id; }) });
    var ctx = fromState(rest, now), m = nameOf(ctx.ids.members, trx.anggota_id), a = nameOf(ctx.ids.aset, trx.aset_id), l = nameOf(ctx.ids.lokasi, trx.lokasi_id);
    if (!m || !a || !l) return null;
    var row = (ctx.held[m] = ctx.held[m] || []).filter(function (x) { return x[0] === a; })[0];
    if (!row) ctx.held[m].push([a, [l]]); else if (row[1].indexOf(l) < 0) row[1].push(l);
    var p = trx.tanggal.split('-'); ctx.ubah = { dicatat: +p[2] + ' ' + BLN[+p[1] - 1] + ' ' + p[0] };
    return ctx;
  }

  /** Keadaan awal layar Catat (mulai 'ubah') dari satu transaksi: kebalikan dari toRows. */
  function stateOfTrx(trx, ctx) {
    var C = root.HF.catat, f = function (n) { return C.fmt(+n, 8); }, nm = function (map, id) { return nameOf(map, id); };
    var p = trx.tanggal.split('-'), jam = String(trx.jam || '00:00').split(':');
    var st = { fJ: trx.jenis, fM: nm(ctx.ids.members, trx.anggota_id), fA: nm(ctx.ids.aset, trx.aset_id), fL: nm(ctx.ids.lokasi, trx.lokasi_id), qv: f(trx.jumlah), fee: '0',
      dy: +p[0], dm: +p[1], d: +p[2], hh: +jam[0], mm: +jam[1] || 0, sheet: null };
    if (trx.jenis === 'Beli' || trx.jenis === 'Jual') {
      st.pv = f(trx.harga_per_unit); st.fee = trx.biaya > 0 ? f(trx.biaya) : '0';
      var pa = trx.alat_bayar_aset_id ? nm(ctx.ids.aset, trx.alat_bayar_aset_id) : null, pl = trx.alat_bayar_lokasi_id ? nm(ctx.ids.lokasi, trx.alat_bayar_lokasi_id) : st.fL;
      st.pay = pa ? pa + '@' + pl : 'luar';
      if (!pa) st.cur = trx.harga_mata_uang || 'IDR';
      if (trx.harga_mata_uang && trx.harga_mata_uang !== 'IDR' && trx.kurs > 0) st.kv = f(trx.kurs); // kurs yang dibekukan tetap dipakai, bukan kurs hari ini
    }
    if (trx.jenis === 'Masuk' || trx.jenis === 'Keluar') st.fS = trx.asal_alasan || undefined;
    if (trx.jenis === 'Pindah') {
      var mem = trx.anggota_tujuan_id && trx.anggota_tujuan_id !== trx.anggota_id;
      st.fP = mem ? 'anggota' : 'lokasi';
      if (mem) { st.fR = nm(ctx.ids.members, trx.anggota_tujuan_id); st.fKa = nm(ctx.ids.lokasi, trx.lokasi_tujuan_id || trx.lokasi_id); } else st.fK = nm(ctx.ids.lokasi, trx.lokasi_tujuan_id);
      if (trx.biaya > 0) { st.fee = f(trx.biaya); st.fu = (ctx.assets[st.fA] || {}).unit; } else st.fu = 'Rp'; // biaya tersimpan dalam satuan aset
    }
    var nota = String(trx.bukti || '').split(/\s+/).filter(function (x) { return x && !/^https?:/.test(x); }).join(' ');
    if (nota) st.nota = nota;
    if (trx.pajak > 0) { st.pajakOn = true; st.pajakV = f(trx.pajak); }
    if (trx.catatan) { st.pajakOn = true; st.catatanV = trx.catatan; }
    return st;
  }

  function two(n) { return String(n).padStart(2, '0'); }
  function nowOf(d) { d = d || new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), hh: d.getHours(), mm: d.getMinutes() }; }

  /**
   * Baris Transaksi dari keadaan layar (vm hasil HF.catat.view). Mengembalikan { rows:[...], error } .
   * Biaya Pindah ikut satu baris dengan Pindah (kolom biaya, satuan aset yang dipindah).
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
    if (vm.isMove && vm.hasFee) {
      var fee = N(vm.fee);
      var price = (ctx.assets[vm.fA] || {}).price, qty = vm.feeUnit === 'Rp' ? (price > 0 ? Math.round(fee / price * 1e8) / 1e8 : 0) : fee;
      if (!(qty > 0)) return { rows: [base], error: 'biaya-rupiah' }; // Rp tanpa harga aset: tidak bisa dikonversi
      base.biaya = qty; // satu baris Pindah: biaya dalam satuan aset, dipotong dari lokasi asal (Rp dibagi harga hari itu). Keputusan Ticon 28 Nov.
    }
    var rows = [base];
    if (o.nomor) base.bukti = o.nomor;
    if (N(o.pajak) > 0) base.pajak = N(o.pajak);
    if (o.catatan && String(o.catatan).trim()) base.catatan = String(o.catatan).trim();
    return { rows: rows, error: null };
  }

  /**
   * Kurs pada baris yang diubah (Ubah). Kurs tidak disentuh: sumber, tanggal, dan waktu kurs lama dipertahankan.
   * Kurs diganti pengguna: kurs_waktu menjadi jam perubahan itu (now = nowOf()), supaya terlihat kapan kurs terakhir diubah.
   */
  function kursUbah(isi, lama, now) {
    if (!(+isi.kurs > 0)) return isi;
    if (+isi.kurs === +lama.kurs) { isi.kurs_sumber = lama.kurs_sumber; isi.kurs_tanggal = lama.kurs_tanggal; isi.kurs_waktu = lama.kurs_waktu; }
    else { now = now || nowOf(); isi.kurs_waktu = two(now.hh) + ':' + two(now.mm); }
    return isi;
  }

  var api = { kursUbah: kursUbah, forUbah: forUbah, stateOfTrx: stateOfTrx, label: label, fromState: fromState, nowOf: nowOf, toRows: toRows };
  root.HF = root.HF || {};
  root.HF.catatCtx = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
