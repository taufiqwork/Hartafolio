/**
 * DATA CONTOH (demo) untuk Aset, disalin dari board 03-Aset. Dipakai dengan `?demo=<keadaan>#/aset`.
 * Bisa dihapus bersama src/demo/ (lihat catatan di demo.js). Keadaan: default, satu, lokasi, kosong, tersimpan.
 * Posisi = [aset, kelas, lokasi, anggota, jumlah, nilai (juta Rp), manual]; GFI manual seperti di board.
 */
(function (root) {
  'use strict';
  var AR = [['PAXG','Emas','Binance','Azlan','0,52 token',50.4],['Emas fisik','Emas','Brankas','Azlan','8 g',19.0],['BTC','Crypto','Bybit','Azlan','0,0219',29.5],['BTC','Crypto','Binance','Azlan','0,0097',13.0],['Perak fisik','Perak','Brankas','Azlan','612 g',15.6],['GFI','Saham','Pluang','Azlan','4,81 lembar',2.6],['BBCA','Saham','Pluang','Azlan','8 lot',7.3],['IDR','Mata uang','Brankas','Azlan','tunai',4.3],
    ['PAXG','Emas','Binance','Al Ghafiqi','0,105 token',10.2],['BTC','Crypto','Bybit','Al Ghafiqi','0,0019',2.5],['BBCA','Saham','Pluang','Al Ghafiqi','2 lot',2.0],['USDT','Mata uang','Binance','Al Ghafiqi','140',2.3],
    ['PAXG','Emas','Binance','M. Yahya','0,102 token',9.9],['BTC','Crypto','Bybit','M. Yahya','0,0013',1.8],['Perak fisik','Perak','Brankas','M. Yahya','4 g',0.1],['BBCA','Saham','Pluang','M. Yahya','2 lot',2.0],
    ['PAXG','Emas','Binance','Yumna','0,011 token',1.1],['BTC','Crypto','Bybit','Yumna','0,0001',0.2],['USDT','Mata uang','Binance','Yumna','24',0.4]]
    .map(function (r) { return r.concat([r[0] === 'GFI']); });

  function get(mulai) {
    var kosong = mulai === 'kosong';
    return { data: { MEM: ['Azlan', 'Al Ghafiqi', 'M. Yahya', 'Yumna'], LOK: ['Binance', 'Bybit', 'Pluang', 'Brankas'], AR: kosong ? [] : AR, tanpaHarga: kosong ? 0 : 1 },
      ui: { aM: mulai === 'satu' ? 'Azlan' : null, aL: null, lokOpen: mulai === 'lokasi' }, saved: mulai === 'tersimpan' ? { text: 'Beli PAXG 0,0225 tersimpan', act: 'Lihat' } : null };
  }
  root.HF = root.HF || {};
  root.HF.asetDemo = { get: get };
})(typeof globalThis !== 'undefined' ? globalThis : this);
