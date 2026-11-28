/**
 * Harga otomatis: rencana pengambilan dan penyusunan baris tab Harga. Murni (tanpa UrlFetchApp), diuji di Node.
 * Sumber (semuanya gratis tanpa kunci; belum dikonfirmasi klien, lihat design-system.md):
 *   coingecko  crypto dan token emas, harga USD per koin
 *   logam      emas dan perak spot dari gold-api.com (USD per oz) dikali kurs, per gram. Ini harga spot dunia, bukan harga jual toko emas.
 *   saham      Yahoo Finance chart: saham IDX (kode.JK, per lembar, dikali 100 untuk satuan lot) dan saham luar (USD)
 *   kurs       open.er-api.com, Rupiah per 1 USD; disimpan sebagai baris USDIDR
 * Aset berstatus bukan aktif, bertanda kunci_manual, atau bersumber manual/tetap tidak diambil. Yang gagal ditulis berstatus "gagal"
 * (harga 0); pembaca harga mengabaikannya sehingga harga terakhir yang baik tetap dipakai.
 */
(function (root) {
  'use strict';
  var C = (root.HF && root.HF.catalog) || require('./catalog.js');
  var LOT = 100;

  function otomatis(a) {
    return a.status === 'aktif' && !(a.kunci_manual === true || a.kunci_manual === 'TRUE' || a.kunci_manual === 'true') &&
      ['coingecko', 'logam', 'saham', 'kurs'].indexOf(a.sumber_harga) >= 0;
  }

  function tickerYahoo(a) { return String(a.kode_sumber) + (a.mata_uang_harga === 'IDR' ? '.JK' : ''); }

  /** Apa yang harus diambil: { coingecko:[id], logam:[kode], saham:[{aset_id,ticker}], kurs:bool }. Kurs selalu diambil bila ada kebutuhan USD. */
  function rencana(aset) {
    var p = { coingecko: [], logam: [], saham: [], kurs: false };
    aset.filter(otomatis).forEach(function (a) {
      if (a.sumber_harga === 'coingecko') { if (p.coingecko.indexOf(a.kode_sumber) < 0) p.coingecko.push(a.kode_sumber); p.kurs = true; }
      if (a.sumber_harga === 'logam') { if (p.logam.indexOf(a.kode_sumber) < 0) p.logam.push(a.kode_sumber); p.kurs = true; }
      if (a.sumber_harga === 'saham') p.saham.push({ aset_id: a.aset_id, ticker: tickerYahoo(a) });
      if (a.sumber_harga === 'kurs') p.kurs = true;
      if (a.mata_uang_harga === 'USD') p.kurs = true;
    });
    return p;
  }

  function urls(p) {
    return {
      coingecko: p.coingecko.length ? 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' + p.coingecko.join(',') : null,
      logam: p.logam.map(function (k) { return { kode: k, url: 'https://api.gold-api.com/price/' + k }; }),
      saham: p.saham.map(function (s) { return { ticker: s.ticker, url: 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s.ticker) + '?range=1d&interval=1d' }; }),
      kurs: p.kurs ? 'https://open.er-api.com/v6/latest/USD' : null
    };
  }

  function num(x) { return typeof x === 'number' && isFinite(x) && x > 0 ? x : null; }
  function json(t) { try { return JSON.parse(t); } catch (e) { return null; } }

  /** Pengurai jawaban mentah (teks) menjadi angka. Mengembalikan null bila bentuknya tidak dikenal. */
  var parse = {
    coingecko: function (t) { var j = json(t); return j && typeof j === 'object' ? j : null; },
    logam: function (t) { var j = json(t); return j ? num(j.price) : null; },
    kurs: function (t) { var j = json(t); return j && j.result === 'success' && j.rates ? num(j.rates.IDR) : null; },
    saham: function (t) {
      var j = json(t), m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
      return m && num(m.regularMarketPrice) ? { harga: m.regularMarketPrice, mata_uang: m.currency || 'IDR' } : null;
    }
  };

  /**
   * hasil: { coingecko:{id:{usd}}|null, logam:{kode:usdPerOz}, saham:{ticker:{harga,mata_uang}}, kurs:number|null }
   * Mengembalikan baris Harga (tanpa waktu diisi dari argumen).
   */
  function susun(aset, hasil, waktu) {
    var rows = [], kurs = num(hasil.kurs);
    function ok(id, harga, cur, sumber) { rows.push({ waktu: waktu, aset_id: id, harga: harga, mata_uang: cur, sumber: sumber, status: 'ok' }); }
    function gagal(id, cur, sumber) { rows.push({ waktu: waktu, aset_id: id, harga: 0, mata_uang: cur, sumber: sumber, status: 'gagal' }); }
    var p = rencana(aset);
    if (p.kurs) { if (kurs) ok(C.KURS_ID, kurs, 'IDR', 'kurs'); else gagal(C.KURS_ID, 'IDR', 'kurs'); }
    aset.filter(otomatis).forEach(function (a) {
      var s = a.sumber_harga, cur = a.mata_uang_harga || 'IDR';
      if (s === 'kurs') { if (kurs) ok(a.aset_id, kurs, 'IDR', 'kurs'); else gagal(a.aset_id, 'IDR', 'kurs'); return; }
      if (s === 'coingecko') {
        var c = hasil.coingecko && hasil.coingecko[a.kode_sumber], usd = c && num(c.usd);
        if (usd) ok(a.aset_id, usd, 'USD', 'coingecko'); else gagal(a.aset_id, 'USD', 'coingecko');
        return;
      }
      if (s === 'logam') {
        var oz = hasil.logam && num(hasil.logam[a.kode_sumber]);
        var perGram = oz && kurs ? oz * kurs / C.OZ : null;
        var gpu = C.gramPerUnit(a);
        if (perGram && gpu > 0) ok(a.aset_id, perGram * gpu, 'IDR', 'logam'); else gagal(a.aset_id, 'IDR', 'logam');
        return;
      }
      if (s === 'saham') {
        var h = hasil.saham && hasil.saham[tickerYahoo(a)];
        if (!h) { gagal(a.aset_id, cur, 'saham'); return; }
        var harga = h.mata_uang === 'IDR' && a.satuan === 'lot' ? h.harga * LOT : h.harga;
        ok(a.aset_id, harga, h.mata_uang, 'saham');
      }
    });
    return rows;
  }

  var api = { rencana: rencana, urls: urls, parse: parse, susun: susun, otomatis: otomatis, LOT: LOT };
  root.HF = root.HF || {};
  root.HF.hargaFetch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
