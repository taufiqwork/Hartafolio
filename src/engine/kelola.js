/**
 * Kelola aset: daftar aset keluarga dan sumber harganya (board 14-Aset*). JS murni, tanpa DOM. Aturan hapus/sembunyikan/harga di sini
 * dipakai bersama oleh layar, tiruan dev, dan server (src/gas/Master.js), supaya tidak ada dua versi aturan.
 * Satu baris aset: { id, a: nama tampil, kelas, per: 'per gram', auto, b: teks harga, diisi: 'diisi 2 Nov'|'', own, sold: 'terjual habis Agu 2026'|'',
 *   perlu, n: jumlah transaksi, unit, kunci, canAuto, mata, simbol }. Data contoh (src/demo/kelola-demo.js) dan data nyata (fromState) sama bentuk.
 */
(function (root) {
  'use strict';
  var KELAS = ['Emas', 'Perak', 'Crypto', 'Saham', 'Reksa dana', 'Mata uang', 'Properti', 'Lainnya'];
  var BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  function F() { return root.HF.format; }
  function num(s) { return Number(String(s == null ? '' : s).replace(/\./g, '').replace(',', '.')); }
  function lab(a) { return a.sumber_harga === 'manual' ? a.nama : (a.bentuk === 'Fisik' ? a.nama + ' fisik' : a.simbol); }
  function tglPendek(d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || '')); return m ? (+m[3]) + ' ' + BLN[+m[2] - 1] : ''; }
  function blnTahun(d) { var m = /^(\d{4})-(\d{2})/.exec(String(d || '')); return m ? BLN[+m[2] - 1] + ' ' + m[1] : ''; }
  function perLabel(a) {
    if (a.kelas === 'Mata uang') return a.nama;
    var u = a.kelas === 'Crypto' && a.satuan === 'koin' ? a.simbol : a.satuan;
    return 'per ' + u + (a.mata_uang_harga === 'USD' && a.sumber_harga !== 'coingecko' ? ' · US$' : '');
  }
  function canAuto(a) { return ['coingecko', 'logam', 'saham', 'kurs', 'tetap'].indexOf(a.sumber_harga) >= 0; }
  function isKunci(a) { return a.kunci_manual === true || a.kunci_manual === 'TRUE' || a.kunci_manual === 'true'; }

  /** Teks harga untuk daftar: Rp penuh; aset berharga USD yang diisi manual tampil "US$ 33,10". */
  function hargaTeks(a, p, kurs, auto) {
    if (a.sumber_harga === 'tetap') return '';
    if (a.sumber_harga === 'kurs') return kurs > 0 ? F().rupiah(Math.round(kurs)) : '';
    if (!p || !(p.harga > 0)) return '';
    if (!auto && p.mata_uang === 'USD') return 'US$ ' + F().number(p.harga, 2);
    var idr = p.mata_uang === 'USD' || p.mata_uang === 'USDT' ? p.harga * (kurs || 0) : p.harga;
    return idr > 0 ? F().rupiah(Math.round(idr)) : '';
  }

  /** Aturan hapus: 'tolak' (masih dimiliki), 'sembunyikan' (sudah terjual habis tapi punya riwayat), 'hapus' (belum pernah dipakai). */
  function hapusKeputusan(r) { return r.own ? 'tolak' : (r.n > 0 ? 'sembunyikan' : 'hapus'); }

  /** Aturan Sumber harga + isi harga manual. Mengembalikan teks galat atau ''. */
  function cekUbah(r, o) {
    if (!String(o.nama || '').trim()) return 'Nama aset wajib diisi.';
    if (o.otomatis && !r.canAuto) return 'Aset ini tidak punya sumber harga otomatis.';
    if (!o.otomatis && !(num(o.harga) > 0) && !r.punyaHarga) return 'Isi harga per ' + r.unit + '.';
    return '';
  }

  /** Fakta per aset dari transaksi dan piutang: held (masih dimiliki), jml (jumlah transaksi apa pun statusnya), last (tanggal terakhir). */
  function stats(state) {
    var Lg = root.HF.ledger, allTrx = (state && state.transaksi) || [], trx = allTrx.filter(function (t) { return !t.status || t.status === 'aktif'; });
    var bal = Lg.balances(trx), held = {}, jml = {}, last = {}, qty = {}, mem = {};
    Object.keys(bal).forEach(function (k) {
      if (!(bal[k] > 0)) return;
      var q = Lg.parseKey(k); held[q.aset_id] = true; qty[q.aset_id] = (qty[q.aset_id] || 0) + bal[k]; (mem[q.aset_id] = mem[q.aset_id] || {})[q.anggota_id] = 1;
    });
    ((state && state.piutang) || []).forEach(function (p) { if (p.status !== 'lunas') held[p.aset_id] = true; });
    allTrx.forEach(function (t) {
      [t.aset_id, t.alat_bayar_aset_id].forEach(function (id) { if (id) { jml[id] = (jml[id] || 0) + 1; if (!last[id] || String(t.tanggal) > last[id]) last[id] = String(t.tanggal); } });
    });
    return { held: held, jml: jml, last: last, trx: trx, qty: qty, mem: mem };
  }

  /** Mata uang harga manual: dolar hanya untuk saham luar negeri; aset lain diisi dalam Rupiah. */
  function mataManual(a) { return a.sumber_harga === 'saham' && a.mata_uang_harga === 'USD' ? 'USD' : 'IDR'; }

  /** Galat bila aksi pada aset tidak boleh ('' = boleh). r = { a, own, n }, status = status aset di Sheet. */
  function cekStatus(r, status, aksi) {
    if (aksi === 'tampilkan') return status === 'tersembunyi' ? '' : r.a + ' tidak sedang tersembunyi.';
    if (status !== 'aktif') return r.a + ' tidak ada di daftar.';
    if (r.own) return r.a + ' masih dimiliki. Jual atau pindahkan dulu sampai saldonya nol.';
    if (aksi === 'hapus' && r.n > 0) return r.a + ' sudah punya riwayat, jadi tidak bisa dihapus. Sembunyikan saja.';
    return '';
  }

  /**
   * Data nyata. Aset tersembunyi dipisah; yang dihapus tidak tampil. Dimiliki = saldo > 0 di mana pun, atau piutang berjalan.
   * "Perlu diisi" = tidak ada harga yang bisa dipakai (sama dengan titik merah Aset).
   */
  function fromState(state) {
    var B = root.HF.beranda, V = root.HF.valuation, st = stats(state);
    var held = st.held, jml = st.jml, last = st.last, qty = st.qty, mem = st.mem, hp = B.hargaPerkiraan(state, st.trx);
    var harga = (state.harga && state.harga.terakhir) || {};
    function row(a) {
      var auto = canAuto(a) && !isKunci(a), p = harga[a.aset_id] || hp.prices[a.aset_id], h = V.hargaIdr(a, hp.prices, hp.kurs);
      var man = harga[a.aset_id] && harga[a.aset_id].status === 'manual' ? harga[a.aset_id] : null;
      var perlu = a.sumber_harga !== 'tetap' && h === null && !!held[a.aset_id]; // hanya aset yang dimiliki butuh harga; yang belum dimiliki cukup kosong
      return { id: a.aset_id, a: lab(a), nama: a.nama, kelas: a.kelas, per: perLabel(a), unit: a.satuan, auto: auto, canAuto: canAuto(a) && a.sumber_harga !== 'tetap', tetap: a.sumber_harga === 'tetap',
        b: perlu ? 'Perlu diisi' : hargaTeks(a, p, hp.kurs, auto), diisi: !auto && man ? 'diisi ' + tglPendek(man.waktu) : '', own: !!held[a.aset_id],
        sold: !held[a.aset_id] && last[a.aset_id] ? 'terjual habis ' + blnTahun(last[a.aset_id]) : '', perlu: perlu, n: jml[a.aset_id] || 0, simbol: a.simbol,
        saldo: held[a.aset_id] ? (qty[a.aset_id] ? F().number(Math.round(qty[a.aset_id] * 1e8) / 1e8) + ' ' + a.satuan + ' · ' + Object.keys(mem[a.aset_id] || {}).length + ' anggota' : 'masih ada') : '',
        upd: p && p.waktu && p.status !== 'manual' ? String(p.waktu).slice(11, 16).replace(':', '.') : '',
        hargaIsi: man ? (man.mata_uang === 'USD' ? F().number(man.harga, 2) : F().number(man.harga)) : (mataManual(a) === 'IDR' && h > 0 ? F().number(Math.round(h)) : ''),
        hidNote: 'Terjual habis ' + blnTahun(last[a.aset_id]) + ' · ' + (jml[a.aset_id] || 0) + ' transaksi' + (auto ? '' : ' · harga manual'),
        nilai: held[a.aset_id] && h > 0 && qty[a.aset_id] ? qty[a.aset_id] * h : 0,
        mata: a.mata_uang_harga || 'IDR', mataMan: mataManual(a), punyaHarga: !!(p && p.harga > 0), kunci: isKunci(a), kelasAset: a.kelas };
    }
    var aktif = (state.aset || []).filter(function (a) { return !a.status || a.status === 'aktif'; }).map(row);
    var tersembunyi = (state.aset || []).filter(function (a) { return a.status === 'tersembunyi'; }).map(row);
    var ada = {}; (state.aset || []).forEach(function (a) { if (a.status !== 'dihapus') ada[a.aset_id] = true; });
    var kat = root.HF.catalog.katalog().filter(function (c) { return !ada[c.aset_id]; }).map(function (c) {
      return { n: c.simbol, f: c.nama, c: c.kelas, id: c.aset_id, auto: true, per: perLabel(c) };
    });
    var tot = {}; aktif.forEach(function (r) { tot[r.kelas] = (tot[r.kelas] || 0) + (r.nilai || 0); });
    var order = KELAS.concat(aktif.map(function (r) { return r.kelas; })).filter(function (k, i, a) { return a.indexOf(k) === i && aktif.some(function (r) { return r.kelas === k; }); })
      .sort(function (x, y) { return (tot[y] || 0) - (tot[x] || 0); }); // urutan jenis: dari nilai terbesar (aturan proyek); seri mengikuti urutan KELAS
    return { real: true, A: aktif, HID: tersembunyi, KAT: kat, order: order };
  }

  function sub(r) {
    return r.per + ' · ' + (r.auto ? 'otomatis' : (r.diisi || 'manual')) + (r.own ? '' : (r.sold ? ' · ' + r.sold : ' · belum dimiliki'));
  }

  /** Model daftar: kelompok per jenis (urutan nilai tidak ada di sini: mengikuti urutan KELAS), baris, pemberitahuan, dan kelompok "Lainnya". */
  function list(d) {
    var rows = d.A, need = rows.filter(function (r) { return r.perlu; });
    var order = KELAS.filter(function (k) { return rows.some(function (r) { return r.kelas === k; }); });
    var seen = {}; order.forEach(function (k) { seen[k] = 1; });
    d.A.forEach(function (r) { if (!seen[r.kelas]) { seen[r.kelas] = 1; order.push(r.kelas); } });
    if (d.order) order = d.order;
    var groups = order.map(function (k) {
      return { t: k, rows: rows.map(function (r, i) { return { r: r, i: i }; }).filter(function (o) { return o.r.kelas === k; }).map(function (o) {
        return { a: o.r.a, sub: sub(o.r), b: o.r.b, bad: o.r.b === 'Perlu diisi', i: o.i }; }) };
    });
    groups.push({ t: 'Lainnya', rows: [{ a: 'Aset tersembunyi', sub: 'Tidak muncul di daftar dan pilihan Catat', b: String(d.HID.length), bad: false, i: -1, hid: true }] });
    return { title: 'Kelola aset', intro: 'Aset keluarga dan sumber harganya: otomatis dari pasar, atau diisi sendiri.', need: need.length, needName: need.length ? need[0].a : '', groups: groups };
  }

  function katalog(d, q, kelas) {
    var s = String(q || '').trim().toLowerCase();
    return d.KAT.filter(function (k) { return (!kelas || kelas === 'Semua' || k.c === kelas) && (!s || (k.n + ' ' + k.f).toLowerCase().indexOf(s) >= 0); });
  }

  /** Nama baru dari isian: aset fisik menyimpan nama tanpa akhiran " fisik" (daftar menambahkannya sendiri). */
  function namaSimpan(r, isi) {
    var n = String(isi || '').replace(/\s+/g, ' ').trim();
    return r.id && /fisik$/i.test(r.a) && r.a !== r.nama ? n.replace(/\s+fisik$/i, '') : n;
  }

  /** Isi lembar (board 14·2a sampai 2p). ui = { sheet, sel, opt, nama, harga, pk, q, hid, added }. null bila tak ada lembar atau lembar form manual. */
  function sheet(d, ui) {
    var id = ui.sheet, r = d.A[ui.sel || 0] || {};
    if (!id || id === 'manual') return null;
    if (id === 'tambah') return { title: 'Tambah aset', picker: { ph: 'Nama atau kode aset', q: ui.q || '', chips: ['Semua', 'Crypto', 'Saham', 'Emas', 'Perak', 'Mata uang'], cat: ui.pk || 'Semua',
      items: katalog(d, ui.q, ui.pk), sec: 'Katalog harga otomatis', note: 'Tidak ada di daftar? Tambahkan dengan harga sendiri.', link: 'Tambah aset baru' } };
    if (id === 'saldo' || id === 'saldo-manual') { var ad = ui.added || {};
      return { title: ad.n + ' ditambahkan', desc: 'Belum dimiliki siapa pun. Catat jumlah yang sudah ada sekarang?', lines: [['Harga', ad.harga], ['Di daftar', ad.c + ' · belum dimiliki']],
        primary: { l: 'Catat saldo awal', act: 'saldo-awal' }, secondary: { l: 'Nanti saja', act: 'nanti' } }; }
    if (id === 'tersembunyi') { var o = ui.hid || 0, h = d.HID[o];
      return { title: 'Aset tersembunyi', desc: 'Aset terjual habis yang disembunyikan. Riwayatnya tetap dihitung.', opts: d.HID.map(function (x) { return { l: x.a, d: x.kelas + ' · ' + x.hidNote }; }), optDef: o,
        primary: { l: 'Tampilkan ' + (h ? h.a : '') + ' lagi', act: 'tampilkan' }, secondary: { l: 'Tutup', act: 'tutup' } }; }
    if (id === 'hapus') {
      var k = hapusKeputusan(r);
      if (k === 'tolak') return { title: r.a + ' belum bisa dihapus', desc: r.a + ' masih dimiliki. Menghapus atau menyembunyikannya akan membuat total harta salah. Jual atau pindahkan dulu sampai saldonya nol.',
        lines: [['Saldo', r.saldo || 'masih ada'], ['Riwayat', r.n ? r.n + ' transaksi' : 'ada']], primary: { l: 'Mengerti', act: 'ubah' } };
      if (k === 'sembunyikan') return { title: r.a + ' tidak bisa dihapus', desc: r.a + ' ' + (r.sold || 'sudah terjual habis') + ', tapi riwayatnya dipakai untuk nilai bulan-bulan yang sudah tercatat. Sembunyikan saja: aset hilang dari daftar dan pilihan Catat, riwayatnya tetap.',
        primary: { l: 'Sembunyikan dari daftar', act: 'sembunyikan' }, secondary: { l: 'Batal', act: 'ubah' } };
      return { title: 'Hapus ' + r.a + '?', desc: r.a + ' belum dimiliki siapa pun dan tidak punya riwayat, jadi aman dihapus. Bisa ditambahkan lagi kapan saja dari katalog.',
        primary: { l: 'Hapus aset', danger: true, act: 'hapus' }, secondary: { l: 'Batal', act: 'ubah' } };
    }
    /* ubah */
    var unit = r.per.replace('per ', ''), opts = r.canAuto ? [{ l: 'Otomatis', d: 'Harga pasar, diperbarui otomatis' }, { l: 'Manual', d: 'Anda isi sendiri harganya' }]
      : (r.tetap ? [{ l: 'Otomatis', d: 'Nilainya selalu 1 Rupiah' }] : [{ l: 'Manual', d: 'Aset ini tidak punya sumber harga otomatis' }]);
    var def = r.canAuto ? (r.auto ? 0 : 1) : 0, opt = ui.opt === undefined || ui.opt === null ? def : ui.opt, manual = opts[opt].l === 'Manual', usd = /US\$/.test(unit) || r.mataMan === 'USD';
    var u = unit.replace(' · US$', ''), nama = ui.nama === undefined || ui.nama === null ? r.a : ui.nama;
    var hint = r.canAuto ? 'Dipakai sampai Anda menyalakan harga otomatis lagi. Harga pasar tidak dipakai selama mode manual.' : (r.perluNote || 'Aset ini tidak punya harga otomatis.' + (r.diisi ? ' Terakhir ' + r.diisi + '.' : ''));
    if (r.canAuto && r.perluNote) hint = r.perluNote;
    var price = manual ? { l: 'Harga manual per ' + u + (usd ? ' (US$)' : ' (Rp)'), v: ui.harga === undefined || ui.harga === null ? (r.hargaIsi || '') : ui.harga, input: true, hint: hint }
      : { l: 'Harga otomatis sekarang', v: (r.b || '-') + ' per ' + u, input: false, hint: 'Pasar · diperbarui ' + (r.upd || '-') + '. Hanya info, tidak bisa diubah.' };
    var gfi = manual && r.perlu;
    return { title: 'Ubah ' + r.a, fields: [{ l: 'Nama', v: nama, input: true, key: 'nama' }, { l: 'Jenis', v: r.kelas }, { l: 'Satuan', v: unit, hint: 'Jenis dan satuan tidak bisa diubah setelah aset dipakai.' }],
      fields2: [price], optLabel: 'Sumber harga', opts: opts, optDef: opt,
      primary: { l: gfi ? 'Simpan harga' : 'Simpan', act: 'simpan-ubah' }, secondary: { l: 'Hapus aset', danger: true, act: 'hapus-buka' } };
  }

  /**
   * Perubahan lokal seketika (sebelum server menjawab); salinan baru dikembalikan, data asli tidak diubah. Setelah server menjawab,
   * layar memuat ulang dari Sheet sehingga hasil akhir selalu dari server. aksi: ubah | sembunyikan | tampilkan | hapus | katalog | manual.
   */
  function patch(d, aksi, p, hariIni) {
    var n = { A: d.A.map(function (r) { return Object.assign({}, r); }), HID: d.HID.map(function (r) { return Object.assign({}, r); }), KAT: d.KAT.slice(), order: d.order };
    if (aksi === 'ubah') {
      var r = n.A[p.i], usd = r.mataMan === 'USD';
      r.a = String(p.nama || r.a).trim() || r.a; r.auto = !!p.otomatis; r.kunci = !p.otomatis;
      if (!p.otomatis && num(p.harga) > 0) { r.b = usd ? 'US$ ' + F().number(num(p.harga), 2) : F().rupiah(Math.round(num(p.harga))); r.diisi = 'diisi ' + tglPendek(hariIni); r.perlu = false; r.punyaHarga = true; r.hargaIsi = p.harga; }
      if (r.perlu && !r.auto && !(num(p.harga) > 0)) r.perlu = true;
    } else if (aksi === 'sembunyikan') {
      var h = n.A.splice(p.i, 1)[0]; h.hidNote = 'Terjual habis ' + (h.sold ? h.sold.replace('terjual habis ', '') : '') + ' · ' + h.n + ' transaksi' + (h.auto ? '' : ' · harga manual'); n.HID.push(h);
    } else if (aksi === 'tampilkan') {
      n.A.push(n.HID.splice(p.i, 1)[0]);
    } else if (aksi === 'hapus') {
      n.A.splice(p.i, 1);
    } else if (aksi === 'katalog') {
      var k = n.KAT.filter(function (x) { return x.id === p.id; })[0];
      if (k) { n.KAT = n.KAT.filter(function (x) { return x.id !== p.id; }); n.A.push({ id: k.id, a: k.n, kelas: k.c, per: k.per || 'per unit', auto: true, canAuto: true, b: '', diisi: '', own: false, sold: '', perlu: false, n: 0, unit: (k.per || 'per unit').replace('per ', ''), mataMan: 'IDR', punyaHarga: false, hargaIsi: '' }); }
    } else if (aksi === 'manual') {
      n.A.push({ id: 'baru-' + n.A.length, a: p.nama, kelas: p.kelas, per: 'per ' + p.satuan, auto: false, canAuto: false, b: F().rupiah(Math.round(num(p.harga))), diisi: 'diisi ' + tglPendek(hariIni), own: false, sold: '', perlu: false, n: 0, unit: p.satuan, mataMan: 'IDR', punyaHarga: num(p.harga) > 0, hargaIsi: p.harga });
    }
    return n;
  }

  var api = { patch: patch, sheet: sheet, KELAS: KELAS, stats: stats, mataManual: mataManual, cekStatus: cekStatus, fromState: fromState, list: list, sub: sub, hapusKeputusan: hapusKeputusan, cekUbah: cekUbah, katalog: katalog,
    namaSimpan: namaSimpan, tglPendek: tglPendek, blnTahun: blnTahun, num: num, lab: lab, canAuto: canAuto, perLabel: perLabel };
  root.HF = root.HF || {};
  root.HF.kelola = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
