/* Jembatan layar ke server. Di Apps Script memanggil fungsi api* lewat google.script.run.
   Di `npm run dev` (tanpa Google) memakai tiruan sederhana di localStorage, hanya agar layar bisa dicoba.
   Aturan sebenarnya ada di src/gas/Master.js dan diuji di tests/gas.test.js; tiruan ini BUKAN logika produksi. */
(function (root) {
  'use strict';
  var run = root.google && root.google.script && root.google.script.run;

  function remote(name, args) {
    return new Promise(function (resolve, reject) {
      run.withSuccessHandler(resolve)
        .withFailureHandler(function (e) { reject(new Error(String((e && e.message) || e).replace(/^Error:\s*/, ''))); })[name].apply(run, JSON.parse(JSON.stringify(args || []))); // buang nilai undefined: google.script.run menolaknya
    });
  }

  var KEY = 'hf-dev-state', mem = null;
  /* Hanya mode dev: buka halaman dengan ?reset untuk memulai Setup dari awal. */
  if (!run && /[?&]reset\b/.test(root.location ? root.location.search : '')) {
    try { root.localStorage.removeItem(KEY); root.history.replaceState(null, '', root.location.pathname); } catch (e) { /* abaikan */ }
  }
  function load() {
    if (mem) return mem;
    try { mem = JSON.parse(root.localStorage.getItem(KEY)); } catch (e) { mem = null; }
    return (mem = mem || { pengaturan: {}, anggota: [], lokasi: [] });
  }
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* penyimpanan diblokir: tetap jalan di memori */ } }
  function id(prefix, rows, key) {
    var max = 0; rows.forEach(function (r) { var m = /-(\d+)$/.exec(r[key]); if (m) max = Math.max(max, +m[1]); });
    return prefix + '-' + ('00' + (max + 1)).slice(-3);
  }
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function dupe(rows, nama, skip, key) {
    return rows.some(function (r) { return r.aktif !== false && r[key] !== skip && r.nama.toLowerCase() === nama.toLowerCase(); }); // sama seperti Master.js: yang sudah dihapus (aktif tidak) tidak dihitung
  }
  function fail(msg) { return Promise.reject(new Error(msg)); }

  var dev = {
    apiState: function () {
      var s = JSON.parse(JSON.stringify(load()));
      s.aset = s.aset || (root.HF.catalog ? root.HF.catalog.all() : []); s.transaksi = s.transaksi || []; s.piutang = s.piutang || []; s.harga = s.harga || { terakhir: {}, kursSeries: [] }; return Promise.resolve(s);
    },
    apiTransaksiTambah: function (list) {
      var s = load(); s.transaksi = s.transaksi || []; var ok = [], dup = [], bad = [];
      var ctx = { asetIds: (s.aset || (root.HF.catalog ? root.HF.catalog.all() : [])).map(function (a) { return a.aset_id; }), anggotaIds: s.anggota.map(function (a) { return a.anggota_id; }), lokasiIds: s.lokasi.map(function (a) { return a.lokasi_id; }) };
      list.forEach(function (t) {
        if (s.transaksi.some(function (x) { return x.trx_id === t.trx_id; })) return dup.push(t.trx_id);
        t.status = 'aktif'; ctx.trxList = s.transaksi; var e = root.HF.ledger.validate(t, ctx);
        if (e.length) return bad.push({ trx_id: t.trx_id, error: e[0] });
        s.transaksi.push(t); ok.push(t.trx_id);
      });
      save(); return Promise.resolve({ diterima: ok, duplikat: dup, ditolak: bad });
    },
    /* Koreksi transaksi: aturan sama dengan Repo.js lewat HF.ledger.terapkan (galat jadi penolakan berisi kalimat untuk pengguna). */
    koreksi: function (id, aksi, isi) {
      var s = load(), L = root.HF.ledger; s.transaksi = s.transaksi || [];
      var all = s.aset || (root.HF.catalog ? root.HF.catalog.all() : []);
      var now = new Date(), p2 = function (n) { return ('0' + n).slice(-2); }, stamp = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate()) + ' ' + p2(now.getHours()) + ':' + p2(now.getMinutes());
      var r = L.terapkan(s.transaksi, id, aksi, isi, { asetIds: all.map(function (a) { return a.aset_id; }), anggotaIds: s.anggota.map(function (a) { return a.anggota_id; }), lokasiIds: s.lokasi.map(function (a) { return a.lokasi_id; }) }, stamp);
      if (r.error) return fail(L.pesan(r.error));
      var t = s.transaksi.filter(function (x) { return x.trx_id === id; })[0]; Object.keys(r.patch).forEach(function (k) { t[k] = r.patch[k]; });
      save(); return Promise.resolve({ id: id, diubah_pada: stamp });
    },
    apiTransaksiUbah: function (id, isi) { return dev.koreksi(id, 'ubah', isi); },
    apiTransaksiHapus: function (id) { return dev.koreksi(id, 'hapus', null); },
    apiTransaksiPulihkan: function (id) { return dev.koreksi(id, 'pulihkan', null); },
    apiBootState: function () { return dev.apiState(); },
    apiAnggotaTambah: function (d) {
      var s = load(), nama = clean(d.nama);
      if (!nama) return fail('Nama anggota wajib diisi.');
      if (dupe(s.anggota, nama, null, 'anggota_id')) return fail('Sudah ada anggota bernama "' + nama + '".');
      var pertama = !s.anggota.some(function (a) { return a.is_pengelola; }), hub = pertama ? 'Diri sendiri' : clean(d.hubungan);
      if (!pertama && (!hub || hub === 'Diri sendiri')) return fail('Pilih hubungan dengan Anda.');
      var a = { anggota_id: id('PM', s.anggota, 'anggota_id'), nama: nama, hubungan: hub, is_pengelola: pertama, aktif: true };
      s.anggota.push(a); save(); return Promise.resolve(a);
    },
    apiAnggotaUbah: function (aid, p) {
      var s = load(), a = s.anggota.filter(function (x) { return x.anggota_id === aid; })[0];
      if (!a) return fail('Anggota tidak ditemukan.');
      var nama = clean(p.nama);
      if (!nama) return fail('Nama anggota wajib diisi.');
      if (dupe(s.anggota, nama, aid, 'anggota_id')) return fail('Sudah ada anggota bernama "' + nama + '".');
      a.nama = nama; if (!a.is_pengelola && p.hubungan) a.hubungan = clean(p.hubungan);
      save(); return Promise.resolve(a);
    },
    apiLokasiTambah: function (d) {
      var s = load(), nama = clean(d.nama);
      if (!nama) return fail('Nama lokasi wajib diisi.');
      if (!clean(d.jenis)) return fail('Pilih jenis lokasi.');
      if (dupe(s.lokasi, nama, null, 'lokasi_id')) return fail('Sudah ada lokasi bernama "' + nama + '".');
      var l = { lokasi_id: id('LK', s.lokasi, 'lokasi_id'), nama: nama, jenis: clean(d.jenis), aktif: true };
      s.lokasi.push(l); save(); return Promise.resolve(l);
    },
    apiLokasiUbah: function (lid, p) {
      var s = load(), l = s.lokasi.filter(function (x) { return x.lokasi_id === lid; })[0];
      if (!l) return fail('Lokasi tidak ditemukan.');
      var nama = clean(p.nama);
      if (!nama) return fail('Nama lokasi wajib diisi.');
      if (dupe(s.lokasi, nama, lid, 'lokasi_id')) return fail('Sudah ada lokasi bernama "' + nama + '".');
      l.nama = nama; l.jenis = clean(p.jenis) || l.jenis; save(); return Promise.resolve(l);
    },
    apiAnggotaHapus: function (aid) {
      var s = load(), a = s.anggota.filter(function (x) { return x.anggota_id === aid; })[0];
      if (!a) return fail('Anggota tidak ditemukan.');
      if (a.is_pengelola) return fail('Pengelola tidak bisa dihapus.');
      a.aktif = false; save(); return Promise.resolve(true);
    },
    apiLokasiHapus: function (lid) {
      var s = load(), l = s.lokasi.filter(function (x) { return x.lokasi_id === lid; })[0];
      if (!l) return fail('Lokasi tidak ditemukan.');
      l.aktif = false; save(); return Promise.resolve(true);
    },
    apiAsetTambah: function (d) {
      var s = load(); s.aset = s.aset || (root.HF.catalog ? root.HF.catalog.all() : []);
      var nama = clean(d.nama); if (!nama) return fail('Nama aset wajib diisi.');
      if (s.aset.some(function (a) { return a.nama.toLowerCase() === nama.toLowerCase(); })) return fail('Sudah ada aset bernama "' + nama + '".');
      var a = { aset_id: id('AS', s.aset, 'aset_id'), simbol: nama, nama: nama, kelas: d.kelas, bentuk: 'Fisik', satuan: d.satuan, gram_per_unit: null, mata_uang_harga: 'IDR', sumber_harga: 'manual', status: 'aktif' };
      s.aset.push(a); save(); return Promise.resolve(a);
    },
    /* Kelola aset: aturan sama dengan src/gas/AsetKelola.js lewat HF.kelola (cekStatus, mataManual, namaSimpan). */
    asetCari: function (aid) { var s = load(); s.aset = s.aset || root.HF.catalog.all(); return { s: s, a: s.aset.filter(function (x) { return x.aset_id === aid; })[0] }; },
    apiAsetUbah: function (aid, d) {
      var c = dev.asetCari(aid), s = c.s, a = c.a, K = root.HF.kelola;
      if (!a || a.status === 'dihapus') return fail('Aset tidak ditemukan.');
      var nama = clean(d.nama); if (!nama) return fail('Nama aset wajib diisi.');
      if (d.otomatis && (!K.canAuto(a) || a.sumber_harga === 'tetap')) return fail('Aset ini tidak punya sumber harga otomatis.');
      var simpan = K.namaSimpan({ id: a.aset_id, a: K.lab(a), nama: a.nama }, nama);
      if (s.aset.some(function (x) { return x.aset_id !== aid && x.status !== 'dihapus' && (K.lab(x).toLowerCase() === nama.toLowerCase() || x.nama.toLowerCase() === simpan.toLowerCase()); })) return fail('Sudah ada aset bernama "' + nama + '".');
      s.harga = s.harga || { terakhir: {}, kursSeries: [] };
      var harga = K.num(d.harga);
      if (!d.otomatis && !(harga > 0) && !(s.harga.terakhir[aid] && s.harga.terakhir[aid].harga > 0)) return fail('Isi harga per ' + a.satuan + '.');
      if (simpan !== a.nama) { a.nama = simpan; if (a.bentuk !== 'Fisik' && a.sumber_harga !== 'manual') a.simbol = simpan; }
      a.kunci_manual = !d.otomatis;
      if (!d.otomatis && harga > 0) s.harga.terakhir[aid] = { harga: harga, mata_uang: K.mataManual(a), sumber: 'manual', status: 'manual', waktu: dev.stamp() };
      save(); return Promise.resolve(a);
    },
    apiAsetStatus: function (aid, aksi) {
      var c = dev.asetCari(aid), K = root.HF.kelola, a = c.a;
      if (!a) return fail('Aset tidak ditemukan.');
      var st = K.stats({ transaksi: c.s.transaksi || [], piutang: c.s.piutang || [] });
      var e = K.cekStatus({ a: K.lab(a), own: !!st.held[aid], n: st.jml[aid] || 0 }, a.status || 'aktif', aksi);
      if (e) return fail(e);
      a.status = aksi === 'tampilkan' ? 'aktif' : (aksi === 'sembunyikan' ? 'tersembunyi' : 'dihapus'); save(); return Promise.resolve(a);
    },
    apiAsetKatalogTambah: function (aid) {
      var c = dev.asetCari(aid), cat = root.HF.catalog.katalog().filter(function (x) { return x.aset_id === aid; })[0];
      if (!cat) return fail('Aset tidak ada di katalog.');
      if (c.a && c.a.status !== 'dihapus' && c.a.status !== 'tersembunyi') return fail(cat.simbol + ' sudah ada di daftar.');
      if (c.a) { c.a.status = 'aktif'; c.a.kunci_manual = false; } else c.s.aset.push(cat);
      save(); return Promise.resolve(c.a || cat);
    },
    stamp: function () { var n = new Date(), p2 = function (x) { return ('0' + x).slice(-2); }; return n.getFullYear() + '-' + p2(n.getMonth() + 1) + '-' + p2(n.getDate()) + ' ' + p2(n.getHours()) + ':' + p2(n.getMinutes()); },
    apiBuktiUnggah: function (trxId) { return Promise.resolve({ url: 'https://drive.google.com/file/d/dev-' + trxId + '/view' }); },
    apiSetupSelesai: function () {
      var s = load(); s.pengaturan.setup_selesai = 'ya'; save(); return Promise.resolve(true);
    }
  };

  function call(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    return run ? remote(name, args) : dev[name].apply(null, args);
  }
  root.HF = root.HF || {};
  root.HF.api = { call: call, isDev: !run, resetDev: function () { mem = null; try { root.localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } } };
})(typeof globalThis !== 'undefined' ? globalThis : this);
