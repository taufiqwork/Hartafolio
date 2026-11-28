/**
 * Harga otomatis: rencana pengambilan dan penyusunan baris tab Harga. Murni (tanpa UrlFetchApp), diuji di Node.
 * Sumber (semuanya gratis tanpa kunci; belum dikonfirmasi klien, lihat design-system.md):
 *   coingecko  crypto dan token emas, harga USD per koin
 *   logam      emas dan perak spot dari gold-api.com (USD per oz) dikali kurs, per gram. Ini harga spot dunia, bukan harga jual toko emas.
 *   saham      Yahoo Finance chart: saham IDX (kode.JK, per lembar, dikali 100 untuk satuan lot) dan saham luar (USD)
 *   llama      cadangan crypto bila CoinGecko gagal: coins.llama.fi, memakai id CoinGecko yang sama (harga USD per koin)
 *   kurs       open.er-api.com, Rupiah per 1 USD; disimpan sebagai baris USDIDR
 * Dolar AS: bila aset Dolar AS dikunci manual, kurs manual itu yang dipakai dan baris USDIDR tidak diambil/ditulis (kursKunci).
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

  function kunciManual(a) { return a.kunci_manual === true || a.kunci_manual === 'TRUE' || a.kunci_manual === 'true'; }

  /** Apa yang harus diambil: { coingecko:[id], logam:[kode], saham:[{aset_id,ticker}], kurs:bool, kursKunci:bool }. Kurs dibutuhkan bila ada kebutuhan USD; kursKunci = Dolar AS dikunci manual. */
  function rencana(aset) {
    var p = { coingecko: [], logam: [], saham: [], kurs: false, kursKunci: aset.some(function (a) { return a.status === 'aktif' && a.sumber_harga === 'kurs' && kunciManual(a); }) };
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
      llama: p.coingecko.length ? 'https://coins.llama.fi/prices/current/' + p.coingecko.map(function (k) { return 'coingecko:' + k; }).join(',') : null,
      logam: p.logam.map(function (k) { return { kode: k, url: 'https://api.gold-api.com/price/' + k }; }),
      saham: p.saham.map(function (s) { return { ticker: s.ticker, url: 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s.ticker) + '?range=1d&interval=1d' }; }),
      kurs: p.kurs && !p.kursKunci ? 'https://open.er-api.com/v6/latest/USD' : null
    };
  }

  function num(x) { return typeof x === 'number' && isFinite(x) && x > 0 ? x : null; }
  function json(t) { try { return JSON.parse(t); } catch (e) { return null; } }

  /** Pengurai jawaban mentah (teks) menjadi angka. Mengembalikan null bila bentuknya tidak dikenal. */
  var parse = {
    coingecko: function (t) { var j = json(t); return j && typeof j === 'object' ? j : null; },
    logam: function (t) { var j = json(t); return j ? num(j.price) : null; },
    llama: function (t) {
      var j = json(t), c = j && j.coins, o = {}, n = 0;
      if (!c || typeof c !== 'object') return null;
      Object.keys(c).forEach(function (k) { var u = c[k] && num(c[k].price); if (u && /^coingecko:/.test(k)) { o[k.slice(10)] = { usd: u }; n++; } });
      return n ? o : null;
    },
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
    if (p.kurs && !p.kursKunci) { if (kurs) ok(C.KURS_ID, kurs, 'IDR', 'kurs'); else gagal(C.KURS_ID, 'IDR', 'kurs'); }
    aset.filter(otomatis).forEach(function (a) {
      var s = a.sumber_harga, cur = a.mata_uang_harga || 'IDR';
      if (s === 'kurs') { if (kurs) ok(a.aset_id, kurs, 'IDR', 'kurs'); else gagal(a.aset_id, 'IDR', 'kurs'); return; }
      if (s === 'coingecko') {
        var c = (hasil.coingecko && hasil.coingecko[a.kode_sumber] && num(hasil.coingecko[a.kode_sumber].usd) ? hasil.coingecko : hasil.llama || {})[a.kode_sumber], usd = c && num(c.usd);
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

  function hari(w) { return String(w || '').slice(0, 10); }

  /**
   * Baris yang perlu ditulis: yang gagal tidak ditulis (catatannya ada di Pengaturan), dan harga yang sama dengan baris terakhir
   * (status ok) tidak ditulis ulang, kecuali baris terakhir itu bukan dari hari ini (satu baris per hari tetap ada supaya
   * "diperbarui" tidak tampak basi). terakhir = { aset_id: { harga, waktu, status } }.
   */
  function saring(baris, terakhir, waktu) {
    return baris.filter(function (r) {
      if (r.status !== 'ok') return false;
      var t = terakhir && terakhir[r.aset_id];
      return !(t && t.status === 'ok' && t.harga === r.harga && hari(t.waktu) === hari(waktu));
    });
  }

  /**
   * Padatkan tab Harga. Baris sebelum `batas` (teks 'yyyy-MM-dd HH:mm'): satu baris terakhir per aset per hari; yang gagal dibuang.
   * Baris manual tidak pernah dibuang; baris dari batas ke atas tetap utuh. Urutan asal dipertahankan.
   * Mengembalikan { simpan: [baris], buang: n }.
   */
  function padatkan(rows, batas) {
    var akhir = {};
    rows.forEach(function (r, i) { if (r.status === 'ok' && r.waktu < batas) akhir[r.aset_id + '|' + hari(r.waktu)] = i; });
    var simpan = rows.filter(function (r, i) {
      if (r.status === 'manual' || r.waktu >= batas) return true;
      return r.status === 'ok' && akhir[r.aset_id + '|' + hari(r.waktu)] === i;
    });
    return { simpan: simpan, buang: rows.length - simpan.length };
  }

  var api = { saring: saring, padatkan: padatkan, rencana: rencana, urls: urls, parse: parse, susun: susun, otomatis: otomatis, LOT: LOT };
  root.HF = root.HF || {};
  root.HF.hargaFetch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
