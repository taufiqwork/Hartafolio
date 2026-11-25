/* Simpan transaksi dari layar Catat. Data contoh (?demo): hanya di perangkat (localStorage), TIDAK PERNAH ke Sheet.
   Data nyata: masuk antrean perangkat dulu (trx_id tetap), lalu dikirim lewat apiTransaksiTambah; yang belum terkirim dicoba lagi saat aplikasi dibuka. */
(function (root) {
  'use strict';
  var QK = 'hf-queue', DK = 'hf-demo-trx';
  function read(k) { try { return JSON.parse(root.localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function write(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* penyimpanan diblokir: tetap jalan di memori */ } }
  var memQ = null;
  function queue() { return memQ || (memQ = read(QK)); }
  function saveQ(q) { memQ = q; write(QK, q); }

  function withIds(rows, today) {
    var seq = read(DK).length + queue().length + 1;
    return rows.map(function (r, i) { return Object.assign({ trx_id: root.HF.schema.newTrxId(today, seq + i) }, r); });
  }

  /** rows dari HF.catatCtx.toRows; ctx.demo menentukan tujuan. Mengembalikan Promise berisi baris yang diterima atau ditolak. */
  function submit(rows, demo) {
    var today = rows[0].tanggal, list = withIds(rows, today);
    if (demo) { write(DK, read(DK).concat(list)); return Promise.resolve({ diterima: list.map(function (t) { return t.trx_id; }), ditolak: [] }); }
    var q = queue(); list.forEach(function (t) { q = root.HF.queue.enqueue(q, t); }); saveQ(q);
    return flush();
  }

  /** Kirim semua yang menunggu. Berhasil/duplikat keluar dari antrean; gagal jaringan tetap di antrean. */
  function flush() {
    var q = queue(); if (!q.length) return Promise.resolve({ diterima: [], ditolak: [] });
    return root.HF.api.call('apiTransaksiTambah', root.HF.queue.pending(q)).then(function (res) { saveQ(root.HF.queue.settle(queue(), res)); return res; });
  }

  root.HF = root.HF || {};
  root.HF.catatSave = { submit: submit, flush: flush, pending: function () { return queue().length; }, demoRows: function () { return read(DK); } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
