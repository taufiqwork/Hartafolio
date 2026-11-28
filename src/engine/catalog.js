/**
 * Katalog aset bawaan (harga otomatis). Diisi ke tab Aset saat setup; pengelola bisa menambah manual.
 * Zakat hanya Emas dan Perak (keputusan klien 11 Nov 2026); gram_per_unit wajib bila satuan bukan gram.
 */
(function (root) {
  'use strict';
  var OZ = 31.1035;

  // [aset_id, simbol, nama, kelas, bentuk, satuan, gram_per_unit, mata_uang_harga, sumber_harga, kode_sumber]
  var SEED = [
    ['AS-EMAS', 'EMAS', 'Emas', 'Emas', 'Fisik', 'gram', 1, 'IDR', 'logam', 'XAU'],
    ['AS-PERAK', 'PERAK', 'Perak', 'Perak', 'Fisik', 'gram', 1, 'IDR', 'logam', 'XAG'],
    ['AS-PAXG', 'PAXG', 'PAX Gold', 'Emas', 'Token', 'token', OZ, 'USD', 'coingecko', 'pax-gold'],
    ['AS-XAUT', 'XAUT', 'Tether Gold', 'Emas', 'Token', 'token', OZ, 'USD', 'coingecko', 'tether-gold'],
    ['AS-BTC', 'BTC', 'Bitcoin', 'Crypto', 'Token', 'koin', null, 'USD', 'coingecko', 'bitcoin'],
    ['AS-ETH', 'ETH', 'Ethereum', 'Crypto', 'Token', 'koin', null, 'USD', 'coingecko', 'ethereum'],
    ['AS-USDT', 'USDT', 'Tether', 'Crypto', 'Token', 'koin', null, 'USD', 'coingecko', 'tether'],
    ['AS-USD', 'USD', 'Dolar AS', 'Mata uang', 'Digital', 'nominal', null, 'IDR', 'kurs', 'USD'],
    ['AS-IDR', 'IDR', 'Rupiah', 'Mata uang', 'Digital', 'nominal', null, 'IDR', 'tetap', 'IDR'],
    ['AS-BBRI', 'BBRI', 'Bank BRI', 'Saham', 'Digital', 'lot', null, 'IDR', 'saham', 'BBRI'],
    ['AS-BBCA', 'BBCA', 'Bank BCA', 'Saham', 'Digital', 'lot', null, 'IDR', 'saham', 'BBCA'],
    ['AS-ANTM', 'ANTM', 'Aneka Tambang', 'Saham', 'Digital', 'lot', null, 'IDR', 'saham', 'ANTM'],
    ['AS-GFI', 'GFI', 'Gold Fields', 'Saham', 'Digital', 'lembar', null, 'USD', 'saham', 'GFI']
  ];

  /** Katalog tambahan: tidak ikut ditanam di Setup; baru masuk daftar keluarga lewat Kelola aset › Tambah aset. */
  var EXTRA = [
    ['AS-BNB', 'BNB', 'BNB', 'Crypto', 'Token', 'koin', null, 'USD', 'coingecko', 'binancecoin']
  ];

  /** Kunci USD/IDR yang disimpan di tab Harga (bukan aset). */
  var KURS_ID = 'USDIDR';

  function toObj(r) {
    return { aset_id: r[0], simbol: r[1], nama: r[2], kelas: r[3], bentuk: r[4], satuan: r[5], gram_per_unit: r[6],
      mata_uang_harga: r[7], sumber_harga: r[8], kode_sumber: r[9], kunci_manual: false,
      kategori_zakat: zakatKategori({ kelas: r[3] }), status: 'aktif' };
  }

  /** Hanya kelas Emas dan Perak yang dihitung zakat; lainnya kosong. */
  function zakatKategori(aset) {
    return aset.kelas === 'Emas' ? 'emas' : aset.kelas === 'Perak' ? 'perak' : '';
  }

  /** Gram per satuan efektif: gram=1, oz=31,1035, selain itu nilai di aset. */
  function gramPerUnit(aset) {
    if (aset.satuan === 'gram') return 1;
    if (aset.satuan === 'oz') return OZ;
    return aset.gram_per_unit || 0;
  }

  /** Cari katalog menurut nama atau simbol (huruf besar kecil diabaikan). */
  function search(q) {
    var s = String(q || '').trim().toLowerCase();
    return SEED.map(toObj).filter(function (a) {
      return !s || a.simbol.toLowerCase().indexOf(s) >= 0 || a.nama.toLowerCase().indexOf(s) >= 0;
    });
  }

  var api = { OZ: OZ, SEED: SEED, EXTRA: EXTRA, KURS_ID: KURS_ID, all: function () { return SEED.map(toObj); }, katalog: function () { return SEED.concat(EXTRA).map(toObj); },
    search: search, zakatKategori: zakatKategori, gramPerUnit: gramPerUnit };
  root.HF = root.HF || {};
  root.HF.catalog = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
