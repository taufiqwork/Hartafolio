/* Foto bukti: validasi (JPG atau PNG, paling besar 10 MB), dikecilkan di perangkat (sisi terpanjang 1600 px, JPEG), siap dikirim.
   Tidak menyimpan apa pun; unggah ke Google Drive dilakukan server (gas/Bukti.js) sesudah transaksi tersimpan. */
(function (root) {
  'use strict';
  var MAX_BYTES = 10 * 1024 * 1024, MAX_SIDE = 1600, TYPES = ['image/jpeg', 'image/png'];

  function baseName(n) { return String(n || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\- ]+/g, '').trim().slice(0, 40) || 'foto'; }

  /** Kembalikan Promise { ok:true, nama, kb, mime, base64 } atau { ok:false, alasan }. */
  function prepare(file) {
    if (!file) return Promise.resolve({ ok: false, alasan: 'kosong' });
    if (TYPES.indexOf(file.type) < 0) return Promise.resolve({ ok: false, alasan: 'format' });
    if (file.size > MAX_BYTES) return Promise.resolve({ ok: false, alasan: 'besar' });
    return new Promise(function (resolve) {
      var url = root.URL.createObjectURL(file), img = new root.Image();
      img.onerror = function () { root.URL.revokeObjectURL(url); resolve({ ok: false, alasan: 'baca' }); };
      img.onload = function () {
        var k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height)), c = root.document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        var data = c.toDataURL('image/jpeg', 0.82); root.URL.revokeObjectURL(url);
        var b64 = data.slice(data.indexOf(',') + 1);
        resolve({ ok: true, nama: baseName(file.name) + '.jpg', kb: Math.max(1, Math.round(b64.length * 0.75 / 1024)), mime: 'image/jpeg', base64: b64 });
      };
      img.src = url;
    });
  }

  /** Buka pemilih berkas (kamera atau galeri) lalu panggil cb(hasil). Harus dipanggil dari ketukan pengguna. */
  function pilih(kamera, cb) {
    var i = root.document.createElement('input'); i.type = 'file'; i.accept = 'image/jpeg,image/png';
    if (kamera) i.setAttribute('capture', 'environment');
    i.onchange = function () { prepare(i.files && i.files[0]).then(cb); };
    i.click();
  }

  root.HF = root.HF || {};
  root.HF.foto = { prepare: prepare, pilih: pilih, MAX_BYTES: MAX_BYTES };
})(typeof globalThis !== 'undefined' ? globalThis : this);
