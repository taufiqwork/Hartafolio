/**
 * Buku besar: saldo dan modal dihitung dari Transaksi (satu-satunya sumber data).
 * Hanya baris status "aktif". Pindah satu baris; engine menghitung dua sisi.
 * Biaya Pindah adalah transaksi sendiri (Keluar), bukan kolom di baris Pindah.
 */
(function (root) {
  'use strict';

  var KEY_SEP = '|';
  function key(a, s, l) { return a + KEY_SEP + s + KEY_SEP + l; }
  function num(v) { return typeof v === 'number' && !isNaN(v) ? v : 0; }

  /** Urutan kronologis: tanggal, jam, dibuat_pada, trx_id. */
  function sortTrx(list) {
    return list.slice().sort(function (a, b) {
      var ka = (a.tanggal || '') + ' ' + (a.jam || '00:00');
      var kb = (b.tanggal || '') + ' ' + (b.jam || '00:00');
      if (ka !== kb) return ka < kb ? -1 : 1;
      var ca = a.dibuat_pada || '', cb = b.dibuat_pada || '';
      if (ca !== cb) return ca < cb ? -1 : 1;
      return String(a.trx_id) < String(b.trx_id) ? -1 : String(a.trx_id) > String(b.trx_id) ? 1 : 0;
    });
  }

  function isActive(t) { return !t.status || t.status === 'aktif'; }

  /** Total yang dibayar dalam mata uang harga: jumlah x harga. */
  function gross(t) { return num(t.jumlah) * num(t.harga_per_unit); }

  /** Biaya + pajak dalam mata uang harga. */
  function fees(t) { return num(t.biaya) + num(t.pajak); }

  /**
   * Efek satu transaksi pada saldo: daftar { anggota_id, aset_id, lokasi_id, delta, role }.
   * role: 'utama' | 'bayar' | 'tujuan' | 'asal' dipakai untuk modal.
   */
  function effects(t) {
    var A = t.anggota_id, S = t.aset_id, L = t.lokasi_id, q = num(t.jumlah), out = [];
    var PL = t.alat_bayar_lokasi_id || L; // lokasi aset pembayar; kosong = lokasi transaksi (baris v1)
    function add(a, s, l, d, role) { out.push({ anggota_id: a, aset_id: s, lokasi_id: l, delta: d, role: role }); }
    switch (t.jenis) {
      case 'Beli':
        add(A, S, L, q, 'utama');
        if (t.alat_bayar_aset_id) add(A, t.alat_bayar_aset_id, PL, -(gross(t) + fees(t)), 'bayar');
        break;
      case 'Jual':
        add(A, S, L, -q, 'utama');
        if (t.alat_bayar_aset_id) add(A, t.alat_bayar_aset_id, PL, gross(t) - fees(t), 'bayar');
        break;
      case 'Masuk': case 'Saldo awal': case 'Cicilan diterima': case 'Pelunasan diterima':
        add(A, S, L, q, 'utama');
        break;
      case 'Keluar': case 'Zakat': case 'Pinjamkan':
        add(A, S, L, -q, 'utama');
        break;
      case 'Penyesuaian':
        add(A, S, L, q, 'utama'); // jumlah boleh negatif
        break;
      case 'Pindah':
        add(A, S, L, -q, 'asal');
        add(t.anggota_tujuan_id || A, S, t.lokasi_tujuan_id || L, q, 'tujuan');
        break;
    }
    return out;
  }

  /** Saldo per kunci "anggota|aset|lokasi". opts.sampai = "YYYY-MM-DD" (termasuk hari itu). */
  function balances(trxList, opts) {
    var upto = opts && opts.sampai, res = {};
    trxList.filter(isActive).forEach(function (t) {
      if (upto && t.tanggal > upto) return;
      effects(t).forEach(function (e) {
        var k = key(e.anggota_id, e.aset_id, e.lokasi_id);
        res[k] = (res[k] || 0) + e.delta;
      });
    });
    Object.keys(res).forEach(function (k) { if (Math.abs(res[k]) < 1e-12) delete res[k]; else res[k] = Math.round(res[k] * 1e10) / 1e10; });
    return res;
  }

  function parseKey(k) { var p = k.split(KEY_SEP); return { anggota_id: p[0], aset_id: p[1], lokasi_id: p[2] }; }

  /** Jumlahkan saldo per (anggota, aset) lintas lokasi, dst. group: 'anggota'|'aset'|'anggota+aset'. */
  function rollup(bal, group) {
    var r = {};
    Object.keys(bal).forEach(function (k) {
      var p = parseKey(k);
      var g = group === 'anggota' ? p.anggota_id : group === 'aset' ? p.aset_id : p.anggota_id + KEY_SEP + p.aset_id;
      r[g] = (r[g] || 0) + bal[k];
    });
    return r;
  }

  /** Daftar galat validasi untuk satu transaksi baru. ctx: { trxList, asetIds, anggotaIds, lokasiIds }. */
  function validate(t, ctx) {
    var e = [];
    function req(f) { if (t[f] === undefined || t[f] === null || t[f] === '') e.push('wajib:' + f); }
    ['trx_id', 'tanggal', 'jenis', 'anggota_id', 'aset_id', 'lokasi_id'].forEach(req);
    if (t.jenis === 'Penyesuaian') { if (!num(t.jumlah)) e.push('jumlah:nol'); }
    else if (!(num(t.jumlah) > 0)) e.push('jumlah:harus-positif');
    if (t.jenis === 'Beli' || t.jenis === 'Jual') {
      if (!(t.harga_per_unit >= 0) || t.harga_per_unit === '' || t.harga_per_unit == null) e.push('wajib:harga_per_unit');
      if (t.harga_mata_uang && t.harga_mata_uang !== 'IDR' && !(num(t.kurs) > 0)) e.push('wajib:kurs');
    }
    if (t.jenis === 'Pindah') {
      if (!t.lokasi_tujuan_id && !t.anggota_tujuan_id) e.push('wajib:tujuan');
      if ((t.lokasi_tujuan_id || t.lokasi_id) === t.lokasi_id && (t.anggota_tujuan_id || t.anggota_id) === t.anggota_id) e.push('pindah:tujuan-sama');
    }
    if (ctx) {
      if (ctx.trxList && ctx.trxList.some(function (x) { return x.trx_id === t.trx_id; })) e.push('trx_id:duplikat');
      if (ctx.asetIds && t.aset_id && ctx.asetIds.indexOf(t.aset_id) < 0) e.push('aset:tidak-ada');
      if (ctx.anggotaIds && t.anggota_id && ctx.anggotaIds.indexOf(t.anggota_id) < 0) e.push('anggota:tidak-ada');
      if (ctx.lokasiIds && t.lokasi_id && ctx.lokasiIds.indexOf(t.lokasi_id) < 0) e.push('lokasi:tidak-ada');
      else if (ctx.lokasiIds && t.alat_bayar_lokasi_id && ctx.lokasiIds.indexOf(t.alat_bayar_lokasi_id) < 0) e.push('lokasi:tidak-ada');
      if (ctx.trxList && e.length === 0) {
        // Saldo tidak boleh minus setelah transaksi ini (Jual, Keluar, Pindah, Zakat, Pinjamkan, bayar dengan aset).
        var bal = balances(ctx.trxList.concat([t]));
        effects(t).forEach(function (f) {
          if (f.delta < 0 && (bal[key(f.anggota_id, f.aset_id, f.lokasi_id)] || 0) < -1e-9) e.push('saldo:kurang:' + f.aset_id);
        });
      }
    }
    return e;
  }

  /**
   * Modal dengan metode rata-rata per (anggota, aset), dalam IDR memakai kurs yang dibekukan di baris.
   * Mengembalikan { posisi: { "anggota|aset": {qty, qtyKnown, cost} }, realized: { "anggota|aset": n } }.
   * qtyKnown = jumlah yang modalnya diketahui (Masuk/Saldo awal tanpa harga tidak punya modal).
   * Pinjamkan memindahkan modal ke posisi sementara per piutang dan kembali saat diterima.
   */
  function costBasis(trxList) {
    var pos = {}, realized = {};
    function P(a, s) { var k = a + KEY_SEP + s; return pos[k] || (pos[k] = { qty: 0, qtyKnown: 0, cost: 0 }); }
    function take(p, q) { // ambil q unit dari posisi p secara proporsional; kembalikan {known, cost}
      if (p.qty <= 0 || q <= 0) return { known: 0, cost: 0 };
      var f = Math.min(1, q / p.qty);
      var r = { known: p.qtyKnown * f, cost: p.cost * f };
      p.qty -= Math.min(q, p.qty); p.qtyKnown -= r.known; p.cost -= r.cost;
      if (p.qty < 1e-12) { p.qty = 0; p.qtyKnown = 0; p.cost = 0; }
      return r;
    }
    function give(p, q, r) { p.qty += q; p.qtyKnown += r.known; p.cost += r.cost; }
    function kurs(t) { return !t.harga_mata_uang || t.harga_mata_uang === 'IDR' ? 1 : num(t.kurs); }

    sortTrx(trxList.filter(isActive)).forEach(function (t) {
      var A = t.anggota_id, S = t.aset_id, q = num(t.jumlah), k = kurs(t);
      switch (t.jenis) {
        case 'Beli': {
          var costIdr = (gross(t) + fees(t)) * k;
          if (t.alat_bayar_aset_id) take(P(A, t.alat_bayar_aset_id), gross(t) + fees(t));
          give(P(A, S), q, { known: q, cost: costIdr });
          break;
        }
        case 'Jual': {
          var taken = take(P(A, S), q);
          var proceeds = (gross(t) - fees(t)) * k;
          var kk = realized[A + KEY_SEP + S] || 0;
          var share = q > 0 ? taken.known / q : 0; // bagian yang modalnya diketahui
          realized[A + KEY_SEP + S] = kk + proceeds * share - taken.cost;
          if (t.alat_bayar_aset_id) give(P(A, t.alat_bayar_aset_id), gross(t) - fees(t), { known: gross(t) - fees(t), cost: proceeds });
          break;
        }
        case 'Saldo awal': {
          var has = t.harga_beli_rata2 != null && t.harga_beli_rata2 !== '' && num(t.harga_beli_rata2) > 0;
          give(P(A, S), q, { known: has ? q : 0, cost: has ? q * num(t.harga_beli_rata2) : 0 });
          break;
        }
        case 'Masuk': case 'Penyesuaian':
          if (q >= 0) give(P(A, S), q, { known: 0, cost: 0 }); else take(P(A, S), -q);
          break;
        case 'Keluar': case 'Zakat':
          take(P(A, S), q);
          break;
        case 'Pinjamkan': {
          var moved = take(P(A, S), q);
          give(P(A, S + '~' + t.link_id), q, moved);
          break;
        }
        case 'Cicilan diterima': case 'Pelunasan diterima': {
          var back = take(P(A, S + '~' + t.link_id), q);
          give(P(A, S), q, back.known + back.cost > 0 || q === 0 ? back : { known: 0, cost: 0 });
          break;
        }
        case 'Pindah': {
          var B = t.anggota_tujuan_id || A;
          var mv = take(P(A, S), q);
          give(P(B, S), q, mv);
          break;
        }
      }
    });
    return { posisi: pos, realized: realized };
  }

  var api = { key: key, parseKey: parseKey, sortTrx: sortTrx, effects: effects, balances: balances, rollup: rollup,
    validate: validate, costBasis: costBasis };
  root.HF = root.HF || {};
  root.HF.ledger = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
