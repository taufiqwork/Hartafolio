/**
 * Antrean offline: transaksi dibuat di perangkat dengan trx_id tetap, dikirim saat online.
 * Server menerima idempoten: trx_id yang sudah ada dilewati, bukan digandakan.
 * Fungsi murni; penyimpanan (localStorage) ada di web/js, penulisan Sheet ada di gas/Repo.js.
 */
(function (root) {
  'use strict';

  /** Tambah ke antrean; trx_id yang sama tidak masuk dua kali. */
  function enqueue(queue, trx) {
    if (queue.some(function (x) { return x.trx.trx_id === trx.trx_id; })) return queue;
    return queue.concat([{ trx: Object.assign({}, trx, { sumber: 'offline' }), tries: 0, error: '' }]);
  }

  function pending(queue) { return queue.map(function (x) { return x.trx; }); }

  /** Terapkan hasil dari server: {diterima:[id], duplikat:[id], ditolak:[{trx_id, error}]}. Diterima dan duplikat keluar dari antrean. */
  function settle(queue, hasil) {
    var done = {};
    (hasil.diterima || []).concat(hasil.duplikat || []).forEach(function (id) { done[id] = 1; });
    var rej = {};
    (hasil.ditolak || []).forEach(function (r) { rej[r.trx_id] = r.error; });
    return queue.filter(function (x) { return !done[x.trx.trx_id]; }).map(function (x) {
      return rej[x.trx.trx_id] ? { trx: x.trx, tries: x.tries + 1, error: rej[x.trx.trx_id] } : x;
    });
  }

  /** Sisi server: pisahkan kiriman menjadi baru dan duplikat terhadap trx_id yang sudah ada di Sheet. */
  function dedupe(existingIds, incoming) {
    var seen = {}; existingIds.forEach(function (id) { seen[id] = 1; });
    var baru = [], duplikat = [];
    incoming.forEach(function (t) {
      if (seen[t.trx_id]) duplikat.push(t.trx_id); else { seen[t.trx_id] = 1; baru.push(t); }
    });
    return { baru: baru, duplikat: duplikat };
  }

  var api = { enqueue: enqueue, pending: pending, settle: settle, dedupe: dedupe };
  root.HF = root.HF || {};
  root.HF.queue = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
