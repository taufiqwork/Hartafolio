/**
 * DATA CONTOH untuk layar Catat (?demo). Dapat dihapus bersama src/demo/. Angka disalin dari skrip board 04-Catat.dc.html
 * (FM, FA, PIDR, BAL, CAT) supaya tiap state board bisa dibandingkan piksel. Memakai bentuk `ctx` yang sama dengan data nyata
 * (src/engine/catat-ctx.js), jadi layar tidak tahu ia sedang memakai data contoh. Transaksi dari mode ini hanya disimpan di perangkat.
 */
(function (root) {
  'use strict';
  var FM = { 'Azlan': [['PAXG', ['Binance']], ['Emas fisik', ['Brankas']], ['BTC', ['Bybit', 'Binance']], ['Perak fisik', ['Brankas']], ['GFI', ['Pluang']], ['USDT', ['Binance', 'Bybit']], ['USD', ['Pluang']]],
    'Al Ghafiqi': [['PAXG', ['Binance']], ['BTC', ['Bybit']], ['USDT', ['Binance']]], 'M. Yahya': [['PAXG', ['Binance']], ['BTC', ['Bybit']]], 'Yumna': [['PAXG', ['Binance']], ['BTC', ['Bybit']], ['USDT', ['Binance']]] };
  var BAL = { 'Azlan|USDT|Binance': 312.4, 'Azlan|USDT|Bybit': 150, 'Azlan|USD|Pluang': 68.08, 'Azlan|PAXG|Binance': 0.52, 'Azlan|Emas fisik|Brankas': 8, 'Azlan|BTC|Bybit': 0.0219, 'Azlan|BTC|Binance': 0.0097, 'Azlan|Perak fisik|Brankas': 612, 'Azlan|GFI|Pluang': 3.7,
    'Al Ghafiqi|PAXG|Binance': 0.105, 'Al Ghafiqi|BTC|Bybit': 0.0019, 'Al Ghafiqi|USDT|Binance': 140, 'M. Yahya|PAXG|Binance': 0.102, 'M. Yahya|BTC|Bybit': 0.0013, 'Yumna|PAXG|Binance': 0.011, 'Yumna|BTC|Bybit': 0.0001, 'Yumna|USDT|Binance': 24 };
  // [jumlah awal, satuan, harga IDR per satuan, mata uang harga, kelas, teks nilai di board]
  var FA = { 'PAXG': ['0,0225', 'PAXG', 72658500, 'USD', 'Emas', 'Rp 1,63 jt'], 'Emas fisik': ['1', 'gram', 2380000, null, 'Emas', 'Rp 2,38 jt'], 'BTC': ['0,002', 'BTC', 1683050000, 'USD', 'Crypto', 'Rp 3,37 jt'],
    'Perak fisik': ['50', 'gram', 46600, null, 'Perak', 'Rp 2,33 jt'], 'GFI': ['2', 'lembar', 540546, 'USD', 'Saham', 'Rp 70.000'], 'USDT': ['100', 'USDT', 16420, null, 'Mata uang', 'Rp 1,65 jt'], 'USD': ['50', 'USD', 16420, null, 'Mata uang', undefined] };
  var CAT = [['ETH', 'Ethereum', 'Crypto', 'ETH'], ['SOL', 'Solana', 'Crypto', 'SOL'], ['BNB', 'BNB', 'Crypto', 'BNB'], ['XAUT', 'Tether Gold', 'Emas', 'XAUT'], ['Emas Antam', 'Logam mulia', 'Emas', 'gram'], ['BBRI', 'Bank BRI', 'Saham', 'lot'], ['TLKM', 'Telkom Indonesia', 'Saham', 'lot'], ['USD', 'Dolar AS', 'Mata uang', 'USD']];

  function ctx() {
    var assets = {};
    Object.keys(FA).forEach(function (k) { var a = FA[k]; assets[k] = { unit: a[1], price: a[2], quote: a[3] || undefined, cat: a[4], q0: a[0], valText: a[5] }; });
    var ids = { members: {}, lokasi: {}, aset: {} }; // id palsu agar Simpan di mode contoh berjalan (hanya disimpan di perangkat)
    Object.keys(FM).forEach(function (m, i) { ids.members[m] = 'PM-D' + (i + 1); });
    ['Binance', 'Bybit', 'Pluang', 'Brankas'].forEach(function (l, i) { ids.lokasi[l] = 'LK-D' + (i + 1); });
    Object.keys(FA).forEach(function (a, i) { ids.aset[a] = 'AS-D' + (i + 1); });
    CAT.forEach(function (c, i) { ids.aset[c[0]] = 'AS-D' + (20 + i); });
    return {
      ids: ids, demo: true, members: Object.keys(FM), lokasi: ['Binance', 'Bybit', 'Pluang', 'Brankas'], held: FM, bal: BAL, assets: assets, rates: { USD: 16420, USDT: 16420 }, payCur: ['USDT', 'USD'], catalog: CAT,
      now: { y: 2026, m: 11, d: 11, hh: 14, mm: 20 },
      awalBase: function (all) { return [['PAXG', all], ['Emas fisik', ['Brankas']], ['BTC', all], ['Perak fisik', ['Brankas']], ['GFI', ['Pluang']], ['USDT', ['Binance']]]; }
    };
  }
  root.HF = root.HF || {};
  root.HF.demo = root.HF.demo || {};
  root.HF.demo.catat = ctx;
})(typeof globalThis !== 'undefined' ? globalThis : this);
