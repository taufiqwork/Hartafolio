/* Jembatan layar ke server. Di Apps Script memanggil fungsi api* lewat google.script.run.
   Di `npm run dev` (tanpa Google) memakai tiruan sederhana di localStorage, hanya agar layar bisa dicoba.
   Aturan sebenarnya ada di src/gas/Master.js dan diuji di tests/gas.test.js; tiruan ini BUKAN logika produksi. */
(function (root) {
  'use strict';
  var run = root.google && root.google.script && root.google.script.run;

  function remote(name, args) {
    return new Promise(function (resolve, reject) {
      run.withSuccessHandler(resolve)
        .withFailureHandler(function (e) { reject(new Error(String((e && e.message) || e).replace(/^Error:\s*/, ''))); })[name].apply(run, args || []);
    });
  }

  var KEY = 'hf-dev-state', mem = null;
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
    return rows.some(function (r) { return r[key] !== skip && r.nama.toLowerCase() === nama.toLowerCase(); });
  }
  function fail(msg) { return Promise.reject(new Error(msg)); }

  var dev = {
    apiState: function () { return Promise.resolve(JSON.parse(JSON.stringify(load()))); },
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
