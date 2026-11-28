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
    var u = a.kelas === 'Crypto' && a.satuan === 'koin' ? a.simbol : a.satuan;
    return 'per ' + u + (a.mata_uang_harga === 'USD' && a.sumber_harga !== 'coingecko' ? ' · US$' : '');
  }
  function canAuto(a) { return ['coingecko', 'logam', 'saham', 'kurs', 'tetap'].indexOf(a.sumber_harga) >= 0; }
  function isKunci(a) { return a.kunci_manual === true || a.kunci_manual === 'TRUE' || a.kunci_manual === 'true'; }

  /** Teks harga untuk daftar: Rp penuh; aset berharga USD yang diisi manual tampil "US$ 33,10". */
  function hargaTeks(a, p, kurs, auto) {
    if (a.sumber_harga === 'tetap') return '';
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
    var bal = Lg.balances(trx), held = {}, jml = {}, last = {};
    Object.keys(bal).forEach(function (k) { if (bal[k] > 0) held[Lg.parseKey(k).aset_id] = true; });
    ((state && state.piutang) || []).forEach(function (p) { if (p.status !== 'lunas') held[p.aset_id] = true; });
    allTrx.forEach(function (t) {
      [t.aset_id, t.alat_bayar_aset_id].forEach(function (id) { if (id) { jml[id] = (jml[id] || 0) + 1; if (!last[id] || String(t.tanggal) > last[id]) last[id] = String(t.tanggal); } });
    });
    return { held: held, jml: jml, last: last, trx: trx };
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
    var held = st.held, jml = st.jml, last = st.last, hp = B.hargaPerkiraan(state, st.trx);
    var harga = (state.harga && state.harga.terakhir) || {};
    function row(a) {
      var auto = canAuto(a) && !isKunci(a), p = harga[a.aset_id] || hp.prices[a.aset_id], h = V.hargaIdr(a, hp.prices, hp.kurs);
      var man = harga[a.aset_id] && harga[a.aset_id].status === 'manual' ? harga[a.aset_id] : null;
      var perlu = a.sumber_harga !== 'tetap' && h === null;
      return { id: a.aset_id, a: lab(a), nama: a.nama, kelas: a.kelas, per: perLabel(a), unit: a.satuan, auto: auto, canAuto: canAuto(a) && a.sumber_harga !== 'tetap', tetap: a.sumber_harga === 'tetap',
        b: perlu ? 'Perlu diisi' : hargaTeks(a, p, hp.kurs, auto), diisi: !auto && man ? 'diisi ' + tglPendek(man.waktu) : '', own: !!held[a.aset_id],
        sold: !held[a.aset_id] && last[a.aset_id] ? 'terjual habis ' + blnTahun(last[a.aset_id]) : '', perlu: perlu, n: jml[a.aset_id] || 0, simbol: a.simbol,
        mata: a.mata_uang_harga || 'IDR', mataMan: mataManual(a), punyaHarga: !!(p && p.harga > 0), kunci: isKunci(a), kelasAset: a.kelas };
    }
    var aktif = (state.aset || []).filter(function (a) { return !a.status || a.status === 'aktif'; }).map(row);
    var tersembunyi = (state.aset || []).filter(function (a) { return a.status === 'tersembunyi'; }).map(row);
    var ada = {}; (state.aset || []).forEach(function (a) { if (a.status !== 'dihapus') ada[a.aset_id] = true; });
    var kat = root.HF.catalog.katalog().filter(function (c) { return !ada[c.aset_id]; }).map(function (c) {
      return { n: c.simbol, f: c.nama, c: c.kelas, id: c.aset_id, auto: true, per: perLabel(c) };
    });
    return { real: true, A: aktif, HID: tersembunyi, KAT: kat };
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

  var api = { KELAS: KELAS, stats: stats, mataManual: mataManual, cekStatus: cekStatus, fromState: fromState, list: list, sub: sub, hapusKeputusan: hapusKeputusan, cekUbah: cekUbah, katalog: katalog,
    namaSimpan: namaSimpan, tglPendek: tglPendek, blnTahun: blnTahun, num: num, lab: lab, canAuto: canAuto, perLabel: perLabel };
  root.HF = root.HF || {};
  root.HF.kelola = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
