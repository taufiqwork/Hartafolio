/**
 * DATA CONTOH (demo) untuk Beranda. Bisa dihapus saat aplikasi selesai: hapus folder `src/demo/`, baris `demo/demo.js` di
 * `src/web/index.html`, dan blok `?demo` di `src/web/js/app.js`. Dipakai hanya dengan `?demo` atau `?demo=banyak` di alamat.
 * Angka disalin dari mockup (Main.dc.html). Ini data tampilan (juta Rp), bukan transaksi: persen anggota dan persen jenis di mockup
 * adalah angka sendiri-sendiri yang tidak bisa dihasilkan satu set transaksi yang sama.
 */
(function (root) {
  'use strict';
  var CLS = ['Emas', 'Crypto', 'Perak', 'Saham', 'Mata uang'];
  var AR = [['PAXG', 'Emas', 'Binance', 'Azlan'], ['Emas fisik', 'Emas', 'Brankas', 'Azlan'], ['BTC', 'Crypto', 'Bybit', 'Azlan'], ['BTC', 'Crypto', 'Binance', 'Azlan'], ['Perak fisik', 'Perak', 'Brankas', 'Azlan'], ['GFI', 'Saham', 'Pluang', 'Azlan'], ['BBCA', 'Saham', 'Pluang', 'Azlan'], ['IDR', 'Mata uang', 'Brankas', 'Azlan'],
    ['PAXG', 'Emas', 'Binance', 'Al Ghafiqi'], ['BTC', 'Crypto', 'Bybit', 'Al Ghafiqi'], ['BBCA', 'Saham', 'Pluang', 'Al Ghafiqi'], ['USDT', 'Mata uang', 'Binance', 'Al Ghafiqi'],
    ['PAXG', 'Emas', 'Binance', 'M. Yahya'], ['BTC', 'Crypto', 'Bybit', 'M. Yahya'], ['Perak fisik', 'Perak', 'Brankas', 'M. Yahya'], ['BBCA', 'Saham', 'Pluang', 'M. Yahya'],
    ['PAXG', 'Emas', 'Binance', 'Yumna'], ['BTC', 'Crypto', 'Bybit', 'Yumna'], ['USDT', 'Mata uang', 'Binance', 'Yumna']];
  var GM = { 'Azlan': '+7,7%', 'Al Ghafiqi': '+9,0%', 'M. Yahya': '+4,5%', 'Yumna': '0%', 'Ibu': '+3,1%', 'Ayah': '+2,2%', 'Kakak': '+1,4%', 'Adik': '0%', 'Paman': '−0,6%' };
  var GC = { 'Emas': '+6,1%', 'Crypto': '+4,2%', 'Perak': '+8,0%', 'Saham': '−1,3%', 'Mata uang': '0%', 'Sisanya': '+2,0%' };
  var HARGA = [['Bitcoin', 'BTC', '₿', 'brand', 'Rp 1,48 M', '↑ +1,8%', 'up', [3, 5, 4, 7, 6, 9, 12]], ['Emas', 'per gram', 'Au', 'gold', 'Rp 2.380.000', '↑ +0,3%', 'up', [5, 5, 6, 6, 7, 7, 8]],
    ['Perak', 'per gram', 'Ag', 'gold', 'Rp 46.600', '↓ −0,2%', 'down', [8, 7, 7, 8, 6, 6, 5]], ['Dolar AS', 'USD', '$', 'brand', 'Rp 16.420', '↑ +0,1%', 'up', [5, 6, 5, 6, 6, 7, 7]]];
  var BASE = { CLS: CLS, AR: AR, GM: GM, GC: GC, spark: [160.8, 164.0, 163.5, 166.6, 170.1, 174.2], harga: HARGA, usd: '$ 9.979', delta: '+2,4% dari Okt', piutang: 'Rp 19,3 jt', notes: 3, live: '14.32' };

  function make(many) {
    var d = Object.assign({}, BASE);
    if (many) {
      var T = [98.4, 24.6, 16.2, 11.3, 8.1, 6.9, 4.2, 3.1, 1.4], PR = [0.40, 0.25, 0.09, 0.18];
      d.MEM = ['Azlan', 'Al Ghafiqi', 'Ibu', 'M. Yahya', 'Ayah', 'Kakak', 'Yumna', 'Adik', 'Paman'];
      d.MX = T.map(function (t) {
        var a = PR.map(function (p) { return Math.round(t * p * 10) / 10; });
        a.push(Math.round((t - a.reduce(function (x, y) { return x + y; }, 0)) * 10) / 10); return a;
      });
    } else {
      d.MEM = ['Azlan', 'Al Ghafiqi', 'M. Yahya', 'Yumna'];
      d.MX = [[69.4, 42.5, 15.6, 9.9, 4.3], [10.2, 2.5, 0, 2.0, 2.3], [9.9, 1.8, 0.1, 2.0, 0], [1.1, 0.2, 0, 0, 0.4]];
    }
    return d;
  }
  root.HF = root.HF || {};
  var BELL = ['perhatian', 'perhatian-kosong', 'perhatian-zakat-piutang'];
  /** variant = nama keadaan board: '', banyak, banyak-sisanya, zakat-hari-h, zakat-terlambat, zakat-mendekati, piutang-hari-h, piutang-terlambat,
      zakat-dan-piutang, perhatian, perhatian-kosong, perhatian-zakat-piutang, tersimpan. */
  function get(variant) {
    var v = variant || '', d = make(v === 'banyak' || v === 'banyak-sisanya'), zpi = v === 'zakat-dan-piutang' || v === 'perhatian-zakat-piutang';
    d.zk = v === 'zakat-hari-h' || zpi ? 'due' : (v === 'zakat-terlambat' ? 'late' : (v === 'zakat-mendekati' ? 'soon' : 'none'));
    d.pk = v === 'piutang-hari-h' ? 'due' : (v === 'piutang-terlambat' || zpi ? 'late' : 'none');
    d.noNotes = v === 'perhatian-kosong';
    d.hi = v === 'banyak-sisanya' ? 4 : null;
    d.perOpen = BELL.indexOf(v) >= 0;
    d.toast = v === 'tersimpan' ? { text: 'Beli PAXG 0,0225 tersimpan', act: 'Lihat' } : null;
    return d;
  }
  root.HF.demo = { get: get };
})(typeof globalThis !== 'undefined' ? globalThis : this);
