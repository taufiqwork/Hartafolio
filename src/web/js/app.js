/* Shell aplikasi Hartafolio: rute, bottom bar 5 tab, tombol Catat. Isi layar dibangun per tahap (docs/BUILD_PLAN.md). */
(function () {
  'use strict';
  var ic = HF.icon;

  // Tab sesuai mockup hi-fi: Beranda, Aset, [+ Catat], Riwayat, Alat (ikon kunci inggris).
  var TABS = [
    { id: 'beranda', label: 'Beranda', icon: 'house' },
    { id: 'aset', label: 'Aset', icon: 'grid' },
    { id: 'catat', add: true, label: 'Catat transaksi' },
    { id: 'riwayat', label: 'Riwayat', icon: 'receipt' },
    { id: 'alat', label: 'Alat', icon: 'wrench' }
  ];
  var TITLES = { beranda: 'Beranda', aset: 'Aset', riwayat: 'Riwayat', alat: 'Alat', catat: 'Catat transaksi', kelola: 'Kelola aset' };

  var ubahId = null; // #/ubah/<trx_id>: layar Ubah transaksi (bagian dari alur Riwayat)
  function route() {
    var h = (location.hash || '#/beranda').replace(/^#\//, '');
    if (/^ubah\//.test(h)) { ubahId = decodeURIComponent(h.slice(5)); return 'ubah'; }
    return TITLES[h] ? h : 'beranda';
  }

  function nav(current) {
    return '<nav class="hf-nav" aria-label="Menu utama">' + TABS.map(function (t) {
      if (t.add) return '<a class="hf-add" href="#/catat" aria-label="' + t.label + '">' + ic('plus') + '</a>';
      return '<a href="#/' + t.id + '"' + (t.id === current ? ' aria-current="page"' : '') + '>' + ic(t.icon) + t.label + '</a>';
    }).join('') + '</nav>';
  }

  /* Parameter alamat. Di Google, alamat asli tidak terlihat dari dalam halaman, jadi doGet menyuntikkannya ke window.HF_PARAMS. */
  function param(name) {
    var p = window.HF_PARAMS || {};
    if (p[name] !== undefined && p[name] !== null) return p[name];
    var m = new RegExp('[?&]' + name + '(?:=([\\w-]*))?(?:&|$)').exec(location.search);
    return m ? (m[1] || '') : null;
  }
  var demoParam = param('demo'), berandaData = demoParam === null ? null : HF.demo.get(demoParam); // ?demo = data contoh (src/demo)

  var lastTab = 'beranda', appState = null, loadSeq = 0; // loadSeq: data yang telat tiba tidak boleh menimpa layar yang sudah berganti (mis. Setup yang dibuka lagi)
  /* Beranda dari data nyata: hanya yang benar-benar ada di Sheet (tanpa grafik, persen "dari bulan lalu", dan kartu Harga terkini; ketiganya menunggu sumber harga, Tahap 6). */
  function berandaNyata(s) { return HF.beranda.fromState(s, {}); }
  /* Catat transaksi: layar penuh di atas shell. Data contoh (?demo) atau data nyata dari apiState. */
  /* Unggah foto bukti di belakang layar. Gagal = toast dengan Coba lagi (foto ditahan di memori selama aplikasi terbuka). */
  function unggah(id, photo) {
    HF.api.call('apiBuktiUnggah', id, { nama: photo.nama, mime: photo.mime, base64: photo.base64 }).then(function () {
      flash({ text: 'Foto terunggah' });
    }).catch(function (e) {
      if (window.console) console.warn('Unggah foto gagal:', e && e.message);
      flash({ text: 'Foto belum terunggah. Transaksi sudah tersimpan.', act: 'Coba lagi', on: function () { unggah(id, photo); } });
    });
  }
  /* Toast setelah Catat menyimpan: tampil di tab yang akan dibuka (Beranda atau Riwayat). */
  function flash(t) { (lastTab === 'riwayat' ? HF.riwayatScreen : lastTab === 'aset' ? HF.asetScreen : HF.berandaScreen).flash(t); }
  /* Koreksi data nyata (Ubah, Hapus, Pulihkan): aturan yang sama dengan server dicek di perangkat dulu (jawaban cepat, tanpa menunggu Google),
     lalu layar langsung diperbarui dan server dikirimi; bila server menolak atau gagal, data dimuat ulang dari Sheet. */
  function koreksiLokal(id, aksi, isi) {
    var s = appState; if (!s) return { error: 'Data belum dimuat. Coba lagi sebentar.' };
    var r = HF.ledger.terapkan(s.transaksi || [], id, aksi, isi, { asetIds: (s.aset || []).map(function (a) { return a.aset_id; }), anggotaIds: s.anggota.map(function (a) { return a.anggota_id; }), lokasiIds: s.lokasi.map(function (a) { return a.lokasi_id; }) }, (s.serverWaktu || '').slice(0, 16));
    if (r.error) return { error: HF.ledger.pesan(r.error) };
    s.transaksi = s.transaksi.map(function (t) { return t.trx_id === id ? Object.assign({}, t, r.patch) : t; });
    return { ok: true };
  }
  function kirimKoreksi(api, id, aksi, isi) {
    var c = koreksiLokal(id, aksi, isi); if (c.error) return Promise.reject(new Error(c.error));
    return HF.api.call(api, id, isi).catch(function (e) { appState = null; throw e; }); // ditolak server: muat ulang dari Sheet agar layar sama dengan Sheet
  }
  var riwayatAksi = {
    ubah: function (id) { location.hash = '#/ubah/' + encodeURIComponent(id); },
    hapus: function (id) { return kirimKoreksi('apiTransaksiHapus', id, 'hapus', null); },
    pulihkan: function (id) { return kirimKoreksi('apiTransaksiPulihkan', id, 'pulihkan', null); }
  };
  var catatMulai = null, kelolaDari = 'aset'; // catatMulai: 'awal' dari Kelola aset (Catat saldo awal); kelolaDari: layar yang membuka Kelola aset
  var tokoHapus = null; // id transaksi yang baru dihapus dari layar Ubah: Riwayat menampilkan toast Pulihkan
  function openCatat(ubah) {
    var el = document.getElementById('app'), mulai = ubah ? 'ubah' : (demoParam !== null ? (param('mulai') || 'beli') : (catatMulai || 'beli')), baris = null;
    catatMulai = null;
    function simpanBaru(ctx) {
      return function (res, vm, c, photo) {
        if (res.error) return;
        var done = HF.catatSave.submit(res.rows, ctx.demo);
        // Perbarui data lokal langsung (Beranda dan Catat berikutnya tidak menunggu Google); ditolak server = muat ulang nanti.
        if (appState && done.rows) appState.transaksi = (appState.transaksi || []).concat(done.rows.map(function (t) { return Object.assign({ status: 'aktif' }, t); }));
        else appState = null;
        done.then(function (r) { if ((r.ditolak || []).length) appState = null; }).catch(function () { /* tetap di antrean perangkat; data lokal sudah mencakupnya */ });
        if (photo && !ctx.demo) done.then(function (r) { if (!(r.ditolak || []).length) unggah(r.utama, photo); });
        done.then(function (r) { if ((r.ditolak || []).length) flash({ text: 'Transaksi ditolak server: ' + (/saldo/.test(r.ditolak[0].error) ? 'saldo tidak cukup.' : r.ditolak[0].error) }); })
          .catch(function () { flash({ text: 'Transaksi belum terkirim. Tersimpan di perangkat, dikirim ulang saat aplikasi dibuka.' }); });
        flash(ctx.demo ? { text: 'Contoh: ' + vm.fJ + ' ' + (vm.fA || '') + ' tidak masuk ke Sheet' } : { text: vm.fJ + ' ' + (vm.fA || '') + ' ' + vm.q + ' tersimpan', act: 'Lihat' });
        location.hash = '#/' + lastTab;
      };
    }
    /* Ubah transaksi nyata: dicek di perangkat (aturan sama dengan server), layar langsung diperbarui, lalu dikirim. Ditolak = tetap di form dengan alasannya. */
    function simpanUbah(res, vm, c, photo, st) {
      if (res.error) return;
      var id = baris.trx_id, isi = Object.assign({}, res.rows[0], { nomor: (st && st.nota) || '' }), extra = res.rows.slice(1);
      HF.catatCtx.kursUbah(isi, baris); // kurs tidak disentuh: sumber, tanggal, waktu lama tetap; kurs diganti: kurs_waktu = jam perubahan
      var k = koreksiLokal(id, 'ubah', isi); if (k.error) return { error: k.error };
      HF.api.call('apiTransaksiUbah', id, isi).then(function () {
        if (extra.length) { var d = HF.catatSave.submit(extra, false); if (appState && d.rows) appState.transaksi = appState.transaksi.concat(d.rows.map(function (t) { return Object.assign({ status: 'aktif' }, t); })); }
        if (photo) unggah(id, photo);
      }).catch(function (e) { appState = null; flash({ text: 'Perubahan belum tersimpan: ' + ((e && e.message) || 'coba lagi') }); });
      flash({ text: 'Perubahan disimpan · saldo dihitung ulang' });
      location.hash = '#/riwayat';
    }
    function hapusDariUbah() {
      var k = koreksiLokal(baris.trx_id, 'hapus', null); if (k.error) return { error: k.error };
      HF.api.call('apiTransaksiHapus', baris.trx_id).catch(function (e) { appState = null; flash({ text: 'Hapus belum tersimpan: ' + ((e && e.message) || 'coba lagi') }); });
      tokoHapus = baris.trx_id; location.hash = '#/riwayat';
    }
    function go(ctx, init) {
      HF.catatScreen.mount(el, { ctx: ctx, mulai: mulai, init: init,
        onClose: function () { location.hash = '#/' + lastTab; },
        onLokasi: ctx.demo ? null : function (nama, jenis) { return HF.api.call('apiLokasiTambah', { nama: nama, jenis: jenis }); },
        onAset: ctx.demo ? null : function (d) { return HF.api.call('apiAsetTambah', d); },
        onSave: ubah && !ctx.demo ? simpanUbah : simpanBaru(ctx),
        onHapus: ubah ? (ctx.demo ? function () { location.hash = '#/riwayat'; } : hapusDariUbah) : null });
    }
    if (demoParam !== null) return go(HF.demo.catat());
    function ready(s) {
      appState = s;
      var now = HF.catatCtx.nowOf();
      if (!ubah) return go(HF.catatCtx.fromState(s, now));
      baris = (s.transaksi || []).filter(function (t) { return t.trx_id === ubahId && t.status !== 'dihapus'; })[0];
      var ctx = baris && ['Beli', 'Jual', 'Masuk', 'Keluar', 'Pindah'].indexOf(baris.jenis) >= 0 && !baris.link_id ? HF.catatCtx.forUbah(s, baris, now) : null;
      if (!ctx) { flash({ text: 'Transaksi ini tidak bisa diubah. Aset, anggota, atau lokasinya sudah tidak ada, atau jenisnya belum didukung.' }); location.hash = '#/riwayat'; return; }
      go(ctx, HF.catatCtx.stateOfTrx(baris, ctx));
    }
    if (appState) ready(appState); else HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  /* Riwayat: data contoh (?demo=keadaan) atau data nyata dari apiState (transaksi + anggota, lokasi, aset). */
  function renderRiwayat() {
    var el = document.getElementById('app'), seq = ++loadSeq;
    document.title = 'Riwayat · Hartafolio';
    if (demoParam !== null) { var g = HF.riwayatDemo.get(demoParam); return HF.riwayatScreen.mount(el, { data: g.data, ui: g.ui, saved: g.saved, real: false, on: { ubah: riwayatAksi.ubah } }, nav('riwayat')); }
    var ready = function (s) {
      appState = s;
      if (route() !== 'riwayat' || seq !== loadSeq) return;
      var now = new Date(), hari = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
      var toast = tokoHapus; tokoHapus = null;
      HF.riwayatScreen.mount(el, { data: HF.riwayat.fromState(s, { hariIni: (s.serverWaktu || '').slice(0, 10) || hari }), real: true, on: riwayatAksi, ui: toast ? { toast: toast } : null }, nav('riwayat'));
    };
    if (appState) return ready(appState);
    el.innerHTML = HF.setup.splash();
    HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  /* Aset: data contoh (?demo=keadaan) atau data nyata dari apiState (posisi dari saldo x harga). */
  function renderAset() {
    var el = document.getElementById('app'), seq = ++loadSeq;
    document.title = 'Aset · Hartafolio';
    if (demoParam !== null) { var g = HF.asetDemo.get(demoParam); return HF.asetScreen.mount(el, { data: g.data, ui: g.ui, saved: g.saved, real: false }, nav('aset')); }
    var ready = function (s) {
      appState = s;
      if (route() !== 'aset' || seq !== loadSeq) return;
      HF.asetScreen.mount(el, { data: HF.aset.fromState(s, {}), real: true }, nav('aset'));
    };
    if (appState) return ready(appState);
    el.innerHTML = HF.setup.splash();
    HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  /* Kelola aset (layar penuh, tanpa menu bawah): data contoh (?demo=keadaan) atau data nyata dari apiState. Tulis ke Sheet lewat apiAset*. */
  function renderKelola() {
    var el = document.getElementById('app'), seq = ++loadSeq, dari = kelolaDari;
    document.title = 'Kelola aset · Hartafolio';
    if (demoParam !== null) { var g = HF.kelolaDemo.get(demoParam); return HF.kelolaScreen.mount(el, { data: g.data, ui: g.ui, toast: g.toast, notice: g.notice, simpan: g.simpan, dari: g.dari, real: false }); }
    var segar = function () { return HF.api.call('apiState').then(function (s) { appState = s; return HF.kelola.fromState(s); }); };
    var ready = function (s) {
      appState = s;
      if (route() !== 'kelola' || seq !== loadSeq) return;
      HF.kelolaScreen.mount(el, { data: HF.kelola.fromState(s), real: true, dari: dari, refresh: segar, net: HF.cariNet,
        on: { ubah: function (id, d) { appState = null; return HF.api.call('apiAsetUbah', id, d); }, status: function (id, aksi) { appState = null; return HF.api.call('apiAsetStatus', id, aksi); },
          katalog: function (id) { appState = null; return HF.api.call('apiAsetKatalogTambah', id); }, cari: function (pilih) { appState = null; return HF.api.call('apiAsetCariTambah', pilih); }, manual: function (d) { appState = null; return HF.api.call('apiAsetTambah', d); },
          saldoAwal: function () { catatMulai = 'awal'; location.hash = '#/catat'; } } });
    };
    if (appState) return ready(appState);
    el.innerHTML = HF.setup.splash();
    HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  function render() {
    HF.listen.reset(document.getElementById('app')); // pendengar layar sebelumnya dilepas (kalau tidak, tombol Simpan di Catat jalan berlipat)
    var r = route();
    if (r === 'catat') { document.title = 'Catat transaksi · Hartafolio'; return openCatat(); }
    if (r === 'ubah') { document.title = 'Ubah transaksi · Hartafolio'; lastTab = 'riwayat'; return openCatat(true); }
    if (r === 'kelola') { kelolaDari = lastTab === 'kelola' ? kelolaDari : lastTab; lastTab = r; return renderKelola(); }
    lastTab = r;
    if (r === 'beranda') {
      var el = document.getElementById('app');
      document.title = 'Beranda · Hartafolio';
      var seq = ++loadSeq;
      var draw = function (d) {
        if (route() !== 'beranda' || seq !== loadSeq) return; // pengguna sudah pindah layar (atau Setup dibuka lagi) selama data dimuat
        el.innerHTML = HF.berandaScreen.html(d) + nav('beranda') + '<div class="br-overlays">' + HF.berandaScreen.overlays(d) + '</div>';
        HF.berandaScreen.bind(el, d);
      };
      if (demoParam !== null) return draw(berandaData);
      var ready = function (s) { appState = s; draw(berandaNyata(s)); };
      if (appState) return ready(appState);
      el.innerHTML = HF.setup.splash();
      HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
      return;
    }
    if (r === 'riwayat') return renderRiwayat();
    if (r === 'aset') return renderAset();
    var screen = '<main class="app-screen hf-scroll" id="screen">' +
      '<h1 class="app-title">' + TITLES[r] + '</h1>' +
      '<p class="app-soon">Layar ini dibangun pada tahap berikutnya.</p></main>';
    document.getElementById('app').innerHTML = screen + nav(r === 'catat' ? 'beranda' : r);
    document.title = TITLES[r] + ' · Hartafolio';
  }

  function startShell() {
    if (demoParam === null) HF.catatSave.flush().catch(function () { /* tetap di antrean perangkat */ }); // kirim ulang yang belum terkirim
    window.addEventListener('hashchange', render);
    render();
    /* Harga segar saat dibuka (server membatasi: paling sering tiap 30 menit). Layar yang memakai harga digambar ulang bila ada yang baru. */
    if (demoParam === null && !HF.api.isDev) HF.api.call('apiHargaSegarkan').then(function (r) {
      if (!r || !r.diperbarui) return;
      appState = null;
      if (['beranda', 'aset'].indexOf(route()) >= 0) render();
    }).catch(function () { /* harga yang ada tetap dipakai */ });
  }

  /* Pertama kali: splash, lalu Setup bila belum selesai, kalau sudah ke shell. */
  var app = document.getElementById('app');
  app.innerHTML = HF.setup.splash();
  /* Hanya mode dev (untuk perbandingan piksel): ?hold menahan splash, ?step=N memaksa langkah Setup. */
  var dev = HF.api.isDev, hold = dev && /[?&]hold\b/.test(location.search), forced = dev && /[?&]step=(\d)/.exec(location.search);
  function openSetup(s, err) {
    HF.listen.reset(app);
    loadSeq++; // batalkan gambar Beranda yang masih menunggu data
    HF.setup.mount(app, s, { err: err, step: forced ? +forced[1] : 0, onDone: startShell, onFail: function (now) { openSetup({ pengaturan: s.pengaturan, anggota: now.anggota, lokasi: now.lokasi }, 'lewati'); } });
  }
  if (demoParam !== null) startShell(); // data contoh: langsung ke aplikasi
  else if (!hold) HF.api.call('apiBootState').then(function (s) {
    if (s.pengaturan && s.pengaturan.setup_selesai === 'ya') startShell();
    else openSetup(s);
  }).catch(function (e) {
    app.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message);
  });
})();
