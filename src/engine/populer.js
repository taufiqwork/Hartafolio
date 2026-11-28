/**
 * Daftar populer dan pencarian aset untuk Kelola aset > Tambah aset (board 14-Aset-2q sampai 2u). Murni, diuji di Node.
 * Keputusan Ticon 28 Nov 2026: daftar awal memakai aset yang dikenal keluarga, bukan urutan nilai pasar mentah.
 *  - Crypto: allowlist koin yang dikenal; urutan hidup dari nilai pasar CoinGecko bila bisa diambil (parse.markets), kalau tidak urutan tetap di sini.
 *  - Saham, mata uang, emas, perak: daftar tetap di bawah (tidak ada sumber gratis yang mengurutkannya). Diperbarui TANGGAL; segarkan bila diminta.
 *  - Token emas dan perak dikenali dari daftar tetap (TOKEN_LOGAM); token lain dari CoinGecko masuk Crypto dan bisa diubah jenisnya di Ubah.
 * Kunci pilihan: 'coingecko:<id>', 'saham:<ticker Yahoo>', 'kurs:<kode>', 'logam:<XAU|XAG>' (spot, per gram).
 */
(function (root) {
  'use strict';
  var C = (root.HF && root.HF.catalog) || require('./catalog.js');
  var OZ = C.OZ, TANGGAL = '2026-11-28';

  /** [id CoinGecko, kode, nama] dalam urutan populer (dipakai bila nilai pasar tidak bisa diambil). 40 koin; yang tampil 20 teratas yang belum ada di daftar. */
  var CRYPTO = [['bitcoin', 'BTC', 'Bitcoin'], ['ethereum', 'ETH', 'Ethereum'], ['tether', 'USDT', 'Tether'], ['binancecoin', 'BNB', 'BNB'], ['ripple', 'XRP', 'XRP'],
    ['usd-coin', 'USDC', 'USD Coin'], ['solana', 'SOL', 'Solana'], ['tron', 'TRX', 'TRON'], ['dogecoin', 'DOGE', 'Dogecoin'], ['cardano', 'ADA', 'Cardano'],
    ['chainlink', 'LINK', 'Chainlink'], ['stellar', 'XLM', 'Stellar'], ['avalanche-2', 'AVAX', 'Avalanche'], ['shiba-inu', 'SHIB', 'Shiba Inu'], ['the-open-network', 'TON', 'Toncoin'],
    ['polkadot', 'DOT', 'Polkadot'], ['litecoin', 'LTC', 'Litecoin'], ['bitcoin-cash', 'BCH', 'Bitcoin Cash'], ['monero', 'XMR', 'Monero'], ['uniswap', 'UNI', 'Uniswap'],
    ['near', 'NEAR', 'NEAR Protocol'], ['aptos', 'APT', 'Aptos'], ['ethereum-classic', 'ETC', 'Ethereum Classic'], ['internet-computer', 'ICP', 'Internet Computer'], ['pepe', 'PEPE', 'Pepe'],
    ['cosmos', 'ATOM', 'Cosmos'], ['filecoin', 'FIL', 'Filecoin'], ['arbitrum', 'ARB', 'Arbitrum'], ['optimism', 'OP', 'Optimism'], ['hedera-hashgraph', 'HBAR', 'Hedera'],
    ['vechain', 'VET', 'VeChain'], ['algorand', 'ALGO', 'Algorand'], ['aave', 'AAVE', 'Aave'], ['the-graph', 'GRT', 'The Graph'], ['maker', 'MKR', 'Maker'],
    ['sui', 'SUI', 'Sui'], ['polygon-ecosystem-token', 'POL', 'Polygon'], ['zcash', 'ZEC', 'Zcash'], ['dai', 'DAI', 'Dai'], ['leo-token', 'LEO', 'UNUS SED LEO']];

  /** Token berisi logam (daftar tetap). id CoinGecko -> [kelas, gram per token, satuan]. */
  var TOKEN_LOGAM = {
    'pax-gold': ['Emas', OZ], 'tether-gold': ['Emas', OZ], 'matrixdock-gold': ['Emas', OZ], 'kinesis-gold': ['Emas', 1], 'kinesis-silver': ['Perak', OZ]
  };

  /** [kode Yahoo tanpa akhiran, nama, bursa]: BEI (per lot, Rp) dan bursa Amerika (per lembar, US$). */
  var SAHAM = [['BBCA', 'Bank Central Asia', 'BEI'], ['BBRI', 'Bank Rakyat Indonesia', 'BEI'], ['BMRI', 'Bank Mandiri', 'BEI'], ['BBNI', 'Bank Negara Indonesia', 'BEI'], ['TLKM', 'Telkom Indonesia', 'BEI'],
    ['ASII', 'Astra International', 'BEI'], ['UNVR', 'Unilever Indonesia', 'BEI'], ['ICBP', 'Indofood CBP', 'BEI'], ['INDF', 'Indofood Sukses Makmur', 'BEI'], ['KLBF', 'Kalbe Farma', 'BEI'],
    ['GOTO', 'GoTo Gojek Tokopedia', 'BEI'], ['ADRO', 'Alamtri Resources', 'BEI'], ['AMMN', 'Amman Mineral', 'BEI'], ['BREN', 'Barito Renewables', 'BEI'], ['ANTM', 'Aneka Tambang', 'BEI'],
    ['AAPL', 'Apple', 'US'], ['MSFT', 'Microsoft', 'US'], ['NVDA', 'NVIDIA', 'US'], ['TSLA', 'Tesla', 'US'], ['GOOGL', 'Alphabet', 'US'], ['AMZN', 'Amazon', 'US']];

  /** [kode, nama]: 20 populer dulu, lalu pelengkap pencarian. */
  var MATA_UANG = [['USD', 'Dolar AS'], ['SGD', 'Dolar Singapura'], ['EUR', 'Euro'], ['JPY', 'Yen Jepang'], ['SAR', 'Riyal Saudi'], ['MYR', 'Ringgit Malaysia'], ['AUD', 'Dolar Australia'],
    ['GBP', 'Pound Inggris'], ['CNY', 'Yuan Tiongkok'], ['HKD', 'Dolar Hong Kong'], ['THB', 'Baht Thailand'], ['KRW', 'Won Korea'], ['AED', 'Dirham UEA'], ['CHF', 'Franc Swiss'],
    ['CAD', 'Dolar Kanada'], ['NZD', 'Dolar Selandia Baru'], ['INR', 'Rupee India'], ['TWD', 'Dolar Taiwan'], ['PHP', 'Peso Filipina'], ['VND', 'Dong Vietnam'],
    ['BND', 'Dolar Brunei'], ['QAR', 'Riyal Qatar'], ['KWD', 'Dinar Kuwait'], ['TRY', 'Lira Turki'], ['EGP', 'Pound Mesir'], ['ZAR', 'Rand Afrika Selatan'], ['SEK', 'Krona Swedia'], ['NOK', 'Krone Norwegia'], ['PKR', 'Rupee Pakistan'], ['BDT', 'Taka Bangladesh']];

  /** Emas dan perak yang bisa ditambah (selain yang sudah dibawa Setup). [kunci, simbol, nama, kelas, keterangan] */
  var LOGAM = [['coingecko:matrixdock-gold', 'XAUM', 'Matrixdock Gold', 'Emas', 'token emas · 1 token = 31,1 gram'], ['coingecko:kinesis-gold', 'KAU', 'Kinesis Gold', 'Emas', 'token emas · 1 token = 1 gram'],
    ['coingecko:kinesis-silver', 'KAG', 'Kinesis Silver', 'Perak', 'token perak · 1 token = 31,1 gram']];

  var KELAS_CHIP = ['Semua', 'Crypto', 'Saham', 'Emas', 'Perak', 'Mata uang'];

  function item(key, n, f, c) { return { key: key, n: n, f: f, c: c }; }

  function itemCrypto(id, kode, nama) { var t = TOKEN_LOGAM[id]; return item('coingecko:' + id, kode, nama + (t ? (t[0] === 'Emas' ? ' · token emas' : ' · token perak') : ''), t ? t[0] : 'Crypto'); }
  function itemSaham(k, nama, bursa) { return item('saham:' + k + (bursa === 'BEI' ? '.JK' : ''), k, nama + ' · ' + (bursa === 'BEI' ? 'BEI · per lot' : 'bursa AS · per lembar · US$'), 'Saham'); }

  /**
   * Sudah ada di daftar keluarga (bukan dihapus)? ada = { coingecko:{id:1}, saham:{ticker:1}, kurs:{kode:1}, logam:{kode:1} } dari fromAset.
   */
  function fromAset(aset) {
    var o = { coingecko: {}, saham: {}, kurs: {}, logam: {} };
    (aset || []).forEach(function (a) {
      if (a.status === 'dihapus') return;
      if (a.sumber_harga === 'coingecko') o.coingecko[a.kode_sumber] = 1;
      else if (a.sumber_harga === 'saham') o.saham[String(a.kode_sumber) + (a.mata_uang_harga === 'IDR' ? '.JK' : '')] = 1;
      else if (a.sumber_harga === 'kurs' || a.sumber_harga === 'tetap') o.kurs[a.kode_sumber || a.simbol] = 1;
      else if (a.sumber_harga === 'logam') o.logam[a.kode_sumber] = 1;
    });
    return o;
  }
  /** Kunci pilihan sebuah baris Aset (kebalikan jadiAset), atau '' bila bukan sumber yang bisa dicari. */
  function kunci(a) {
    if (a.sumber_harga === 'coingecko') return 'coingecko:' + a.kode_sumber;
    if (a.sumber_harga === 'saham') return 'saham:' + a.kode_sumber + (a.mata_uang_harga === 'IDR' ? '.JK' : '');
    if (a.sumber_harga === 'kurs' || a.sumber_harga === 'tetap') return 'kurs:' + (a.kode_sumber || a.simbol);
    if (a.sumber_harga === 'logam') return 'logam:' + a.kode_sumber;
    return '';
  }
  function sudah(ada, key) { var p = key.split(':'); return !!(ada[p[0]] && ada[p[0]][p.slice(1).join(':')]); }

  /** Crypto populer: urutan hidup (idUrut = id CoinGecko dari nilai pasar tertinggi, boleh null), tanpa yang sudah ada, paling banyak `n`. */
  function cryptoPopuler(ada, idUrut, n) {
    var by = {}; CRYPTO.forEach(function (c) { by[c[0]] = c; });
    var urut = (idUrut && idUrut.length ? idUrut.filter(function (id) { return by[id]; }) : []).concat(CRYPTO.map(function (c) { return c[0]; }))
      .filter(function (id, i, a) { return a.indexOf(id) === i; });
    return urut.map(function (id) { return by[id]; }).map(function (c) { return itemCrypto(c[0], c[1], c[2]); }).filter(function (i) { return !sudah(ada, i.key); }).slice(0, n || 20);
  }
  function sahamPopuler(ada, n) { return SAHAM.map(function (s) { return itemSaham(s[0], s[1], s[2]); }).filter(function (i) { return !sudah(ada, i.key); }).slice(0, n || 20); }
  function kursPopuler(ada, n) {
    return MATA_UANG.slice(0, 20).map(function (m) { return item('kurs:' + m[0], m[0], m[1] + ' · kurs ke Rupiah', 'Mata uang'); })
      .filter(function (i) { return !sudah(ada, i.key); }).slice(0, n || 20);
  }
  function logamPopuler(ada) { return LOGAM.map(function (l) { return item(l[0], l[1], l[2] + ' · ' + l[4], l[3]); }).filter(function (i) { return !sudah(ada, i.key); }); }

  /**
   * Daftar awal Tambah aset per chip. kelas: Semua | Crypto | Saham | Emas | Perak | Mata uang. Semua = 20 campuran bergiliran.
   * Mengembalikan [{ t, items }] (bagian dengan judul).
   */
  function daftar(kelas, aset, idUrut) {
    var ada = fromAset(aset), cr = cryptoPopuler(ada, idUrut, 20), sa = sahamPopuler(ada, 20), ku = kursPopuler(ada, 20), lo = logamPopuler(ada);
    var em = lo.filter(function (i) { return i.c === 'Emas'; }), pe = lo.filter(function (i) { return i.c === 'Perak'; });
    if (kelas === 'Crypto') return cr.length ? [{ t: 'Crypto populer', items: cr }] : [];
    if (kelas === 'Saham') return sa.length ? [{ t: 'Saham populer', items: sa }] : [];
    if (kelas === 'Mata uang') return ku.length ? [{ t: 'Mata uang populer', items: ku }] : [];
    if (kelas === 'Emas') return em.length ? [{ t: 'Emas', items: em }] : [];
    if (kelas === 'Perak') return pe.length ? [{ t: 'Perak', items: pe }] : [];
    var mix = [], src = [cr, sa, ku, em, pe], i = 0;
    while (mix.length < 20 && src.some(function (s) { return s.length > i; })) { src.forEach(function (s) { if (s[i] && mix.length < 20) mix.push(s[i]); }); i++; }
    return mix.length ? [{ t: 'Populer · harga otomatis', items: mix }] : [];
  }

  /** Cari di daftar tetap (saham, mata uang, logam) menurut kode atau nama. */
  function cariTetap(q, kelas, aset) {
    var s = String(q || '').trim().toLowerCase(), ada = fromAset(aset), out = [];
    if (!s) return out;
    function cocok(a, b) { return (a + ' ' + b).toLowerCase().indexOf(s) >= 0; }
    if (!kelas || kelas === 'Semua' || kelas === 'Saham') SAHAM.forEach(function (x) { if (cocok(x[0], x[1])) out.push(itemSaham(x[0], x[1], x[2])); });
    if (!kelas || kelas === 'Semua' || kelas === 'Mata uang') MATA_UANG.forEach(function (x) { if (cocok(x[0], x[1])) out.push(item('kurs:' + x[0], x[0], x[1] + ' · kurs ke Rupiah', 'Mata uang')); });
    if (!kelas || kelas === 'Semua' || kelas === 'Emas' || kelas === 'Perak') LOGAM.forEach(function (x) { if (cocok(x[1], x[2]) && (!kelas || kelas === 'Semua' || kelas === x[3])) out.push(item(x[0], x[1], x[2] + ' · ' + x[4], x[3])); });
    return out.filter(function (i) { return !sudah(ada, i.key); });
  }

  /** Pengurai jawaban mentah (teks). Mengembalikan null bila bentuknya tidak dikenal. */
  function json(t) { try { return JSON.parse(t); } catch (e) { return null; } }
  var parse = {
    /** CoinGecko /search: hasil per koin, berurut peringkat nilai pasar. */
    coingeckoCari: function (t) {
      var j = json(t), c = j && j.coins; if (!Array.isArray(c)) return null;
      return c.filter(function (x) { return x && x.id && x.symbol; }).map(function (x) {
        var tk = TOKEN_LOGAM[x.id], rank = x.market_cap_rank ? ' · peringkat ' + x.market_cap_rank : '';
        var ket = tk ? ' · 1 token = ' + (tk[1] === 1 ? '1 gram' : '31,1 gram') : '';
        return item('coingecko:' + x.id, String(x.symbol).toUpperCase(), (x.name || x.id) + rank + ket, tk ? tk[0] : 'Crypto');
      });
    },
    /** CoinGecko /coins/markets (urut nilai pasar): daftar id. */
    markets: function (t) { var j = json(t); return Array.isArray(j) ? j.filter(function (x) { return x && x.id; }).map(function (x) { return x.id; }) : null; },
    /** Yahoo /v1/finance/search: saham BEI (.JK) dan bursa Amerika saja. */
    yahooCari: function (t) {
      var j = json(t), q = j && j.quotes; if (!Array.isArray(q)) return null;
      var US = ['NMS', 'NYQ', 'NGM', 'NCM', 'ASE', 'PCX', 'BTS'];
      return q.filter(function (x) { return x && x.quoteType === 'EQUITY' && x.symbol && (/\.JK$/.test(x.symbol) || US.indexOf(x.exchange) >= 0); }).map(function (x) {
        var idx = /\.JK$/.test(x.symbol), kode = x.symbol.replace(/\.JK$/, '');
        return item('saham:' + x.symbol, kode, (x.longname || x.shortname || kode) + ' · ' + (idx ? 'BEI · per lot' : 'bursa AS · per lembar · US$'), 'Saham');
      });
    }
  };

  var URL = {
    markets: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
    cariCrypto: function (q) { return 'https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(q); },
    cariSaham: function (q) { return 'https://query1.finance.yahoo.com/v1/finance/search?quotesCount=10&newsCount=0&q=' + encodeURIComponent(q); }
  };

  /**
   * Baris Aset untuk pilihan (tanpa aset_id dan dibuat_pada; server mengisinya). pilih = item dari daftar atau pencarian ({ key, n, f, c }).
   * Mengembalikan null bila kunci tidak dikenal.
   */
  function jadiAset(pilih) {
    var k = String(pilih && pilih.key || ''), p = k.indexOf(':'), tipe = k.slice(0, p), kode = k.slice(p + 1), n = String(pilih.n || '').trim(), nama = String(pilih.nama || pilih.f || n).split(' · ')[0].trim();
    if (!tipe || !kode || !n) return null;
    var a = { simbol: n, nama: nama || n, kunci_manual: false, status: 'aktif' };
    if (tipe === 'coingecko') {
      var t = TOKEN_LOGAM[kode];
      return Object.assign(a, { kelas: t ? t[0] : 'Crypto', bentuk: 'Token', satuan: t ? 'token' : 'koin', gram_per_unit: t ? t[1] : null, mata_uang_harga: 'USD', sumber_harga: 'coingecko', kode_sumber: kode,
        kategori_zakat: t ? C.zakatKategori({ kelas: t[0] }) : '' });
    }
    if (tipe === 'saham') {
      var idx = /\.JK$/.test(kode);
      return Object.assign(a, { kelas: 'Saham', bentuk: 'Digital', satuan: idx ? 'lot' : 'lembar', gram_per_unit: null, mata_uang_harga: idx ? 'IDR' : 'USD', sumber_harga: 'saham', kode_sumber: kode.replace(/\.JK$/, ''), kategori_zakat: '' });
    }
    if (tipe === 'kurs') {
      var m = MATA_UANG.filter(function (x) { return x[0] === kode; })[0];
      return Object.assign(a, { simbol: kode, nama: m ? m[1] : nama, kelas: 'Mata uang', bentuk: 'Digital', satuan: 'nominal', gram_per_unit: null, mata_uang_harga: 'IDR', sumber_harga: 'kurs', kode_sumber: kode, kategori_zakat: '' });
    }
    return null;
  }

  var api = { TANGGAL: TANGGAL, CRYPTO: CRYPTO, TOKEN_LOGAM: TOKEN_LOGAM, SAHAM: SAHAM, MATA_UANG: MATA_UANG, LOGAM: LOGAM, KELAS_CHIP: KELAS_CHIP, URL: URL, parse: parse, fromAset: fromAset, daftar: daftar,
    cariTetap: cariTetap, cryptoPopuler: cryptoPopuler, jadiAset: jadiAset, kunci: kunci };
  root.HF = root.HF || {};
  root.HF.populer = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
