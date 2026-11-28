/**
 * DATA CONTOH (demo) untuk Kelola aset, disalin dari board 14-Aset. Dipakai dengan `?demo=<keadaan>#/kelola`.
 * Bisa dihapus bersama src/demo/ (lihat catatan di demo.js). Keadaan = prop `mulai` board: default, ubah-otomatis, ubah-manual, isi-harga,
 * harga-tersimpan, tambah, tambah-manual, tambah-digital, tanya-saldo, isi-harga-beranda, hapus-ditolak, hapus-sembunyikan, hapus-konfirmasi,
 * tersembunyi, ditampilkan, saldo-tersimpan; `dari` = alat atau beranda mengganti tautan kembali.
 */
(function (root) {
  'use strict';
  var OWN = ['PAXG', 'Emas fisik', 'BTC', 'USDT', 'Perak fisik', 'BBCA', 'GFI', 'IDR'];
  var SOLD = { 'ETH': 'terjual habis Agu 2026' };
  /* [nama, kelas, per, otomatis, harga, keterangan harga manual] sama dengan array A di board */
  function base(saved) {
    return [['PAXG', 'Emas', 'per oz', 1, 'Rp 74.120.000'], ['Emas fisik', 'Emas', 'per gram', 1, 'Rp 2.380.000'], ['BTC', 'Crypto', 'per BTC', 1, 'Rp 1.452.000.000'], ['ETH', 'Crypto', 'per ETH', 1, 'Rp 52.300.000'],
      ['USDT', 'Crypto', 'per USDT', 1, 'Rp 16.250'], ['SOL', 'Crypto', 'per SOL', 1, 'Rp 2.890.000'], ['Perak fisik', 'Perak', 'per gram', 1, 'Rp 31.400'], ['BBCA', 'Saham', 'per lot', 1, 'Rp 960.000'],
      ['BBRI', 'Saham', 'per lot', 1, 'Rp 420.000'], ['BMRI', 'Saham', 'per lot', 1, 'Rp 580.000'],
      ['GFI', 'Saham', 'per lembar · US$', 0, saved ? 'US$ 33,10' : 'Perlu diisi', saved ? 'diisi 10 Nov' : 'harga kemarin US$ 32,92'],
      ['Reksa dana Bibit', 'Saham', 'per unit', 0, 'Rp 1.450', 'diisi 2 Nov'], ['IDR', 'Mata uang', 'Rupiah', 1, ''], ['USD', 'Mata uang', 'Dolar AS', 1, 'Rp 16.250'], ['SGD', 'Mata uang', 'Dolar Singapura', 1, 'Rp 12.180']];
  }
  function mk(x, shown) {
    var gfi = x[0] === 'GFI', kosong = x[4] === 'Perlu diisi';
    return { id: 'AS-' + x[0], a: x[0], kelas: x[1], per: x[2], auto: !!x[3], canAuto: !!x[3] && x[0] !== 'IDR', tetap: x[0] === 'IDR', b: x[4], diisi: x[3] ? '' : (x[5] || ''),
      own: OWN.indexOf(x[0]) >= 0, sold: OWN.indexOf(x[0]) >= 0 ? '' : (SOLD[x[0]] || (x[0] === 'DOGE' && shown ? 'terjual habis Jun 2026' : '')), perlu: kosong, n: x[0] === 'ETH' ? 7 : (x[0] === 'PAXG' ? 12 : (OWN.indexOf(x[0]) >= 0 ? 4 : (x[0] === 'DOGE' ? 4 : 0))),
      unit: x[2].replace('per ', ''), saldo: x[0] === 'PAXG' ? '0,74 token · 4 anggota' : '', upd: '14.32', mataMan: gfi ? 'USD' : 'IDR', punyaHarga: !kosong,
      hargaIsi: gfi ? (x[4] === 'US$ 33,10' ? '33,10' : '32,92') : x[4].replace('Rp ', ''), perluNote: gfi ? 'Harga otomatis GFI gagal diambil. Isi harga hari ini.' : '' };
  }

  function get(mulai) {
    var saved = mulai === 'harga-tersimpan', shown = mulai === 'ditampilkan', rows = base(saved);
    if (shown) rows.splice(6, 0, ['DOGE', 'Crypto', 'per DOGE', 1, 'Rp 2.100']);
    if (mulai === 'tanya-saldo') rows.splice(10, 0, ['ANTM', 'Saham', 'per lot', 1, 'Rp 158.000']);
    var A = rows.map(function (x) { return mk(x, shown); });
    var HID = [{ id: 'AS-DOGE', a: 'DOGE', kelas: 'Crypto', hidNote: 'Terjual habis Jun 2026 · 4 transaksi' }, { id: 'AS-UBS', a: 'Emas UBS', kelas: 'Emas', hidNote: 'Terjual habis Mar 2026 · 2 transaksi · harga manual' }];
    if (shown) HID.shift();
    var KAT = [['ANTM', 'Aneka Tambang', 'Saham'], ['BNB', 'BNB', 'Crypto'], ['XAUT', 'Tether Gold', 'Emas'], ['Emas Antam', 'Logam mulia', 'Emas'], ['TLKM', 'Telkom Indonesia', 'Saham']]
      .map(function (k) { return { n: k[0], f: k[1], c: k[2], id: 'AS-' + k[0], auto: true }; });
    var idx = function (n) { for (var i = 0; i < A.length; i++) if (A[i].a === n) return i; return 0; };
    var ui = { sheet: null, sel: 0, toast: '', pk: 'Semua', q: '', hid: 0, added: null, opt: null };
    var S = { 'ubah-otomatis': ['ubah', 'Emas fisik'], 'ubah-manual': ['ubah', 'Emas fisik'], 'isi-harga': ['ubah', 'GFI'], 'isi-harga-beranda': ['ubah', 'GFI'], 'hapus-ditolak': ['hapus', 'PAXG'], 'hapus-sembunyikan': ['hapus', 'ETH'], 'hapus-konfirmasi': ['hapus', 'SOL'],
      'tambah': ['tambah'], 'tambah-manual': ['manual'], 'tambah-digital': ['manual'], 'tanya-saldo': ['saldo'], 'tersembunyi': ['tersembunyi'] }[mulai];
    if (S) { ui.sheet = S[0]; if (S[1]) ui.sel = idx(S[1]); }
    if (mulai === 'ubah-otomatis' || mulai === 'ubah-manual') ui.sel = idx('BTC'); // board: T[mulai] = 2
    if (mulai === 'ubah-manual') ui.opt = 1;
    if (mulai === 'isi-harga' || mulai === 'isi-harga-beranda') ui.sel = idx('GFI');
    if (mulai === 'tanya-saldo') ui.added = { n: 'ANTM', harga: 'Otomatis · Rp 158.000 per lot', c: 'Saham' };
    ui.manual = mulai === 'tambah-digital' ? { nama: 'GLD · ETF emas', jenis: 'Emas', sat: 'lembar', gram: '2,88', harga: '6.950.000' } : { nama: 'Emas perhiasan', jenis: 'Emas', sat: 'gram', gram: '31,1035', harga: '1.900.000' };
    var toast = saved ? 'Harga GFI disimpan' : (shown ? 'DOGE tampil lagi di daftar' : '');
    return { data: { A: A, HID: HID, KAT: KAT, order: ['Emas', 'Crypto', 'Perak', 'Saham', 'Mata uang'] }, ui: ui, toast: toast, notice: !saved, simpan: mulai === 'saldo-tersimpan' ? { text: 'Saldo awal ANTM tersimpan', act: 'Lihat' } : null,
      dari: mulai === 'dari-lainnya' ? 'alat' : (mulai === 'isi-harga-beranda' ? 'beranda' : 'aset') };
  }
  root.HF = root.HF || {};
  root.HF.kelolaDemo = { get: get };
})(typeof globalThis !== 'undefined' ? globalThis : this);
