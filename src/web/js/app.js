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
  var TITLES = { beranda: 'Beranda', aset: 'Aset', riwayat: 'Riwayat', alat: 'Alat', catat: 'Catat transaksi' };

  function route() {
    var h = (location.hash || '#/beranda').replace(/^#\//, '');
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
  /* Beranda dari data nyata. SEMENTARA: grafik kecil, "dari Okt", dan kartu Harga terkini memakai data contoh (belum ada sumber nyata, Tahap 6)
     agar tampilannya bisa dinilai. Setelah Ticon setuju: hapus blok DUMMY di bawah dan sembunyikan ketiganya (lihat CHANGELOG). */
  function berandaNyata(s) {
    var d = HF.beranda.fromState(s, {}); if (!d) return null;
    if (param('tanpa-dummy') !== null) return d; // tampilan akhir (setelah dummy dibuang): tanpa grafik, "dari bulan lalu", dan kartu Harga
    var dm = HF.demo.get(''); // DUMMY
    d.spark = dm.spark; d.delta = dm.delta; d.harga = dm.harga; d.live = dm.live; // DUMMY
    return d;
  }
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
  function flash(t) { (lastTab === 'riwayat' ? HF.riwayatScreen : HF.berandaScreen).flash(t); }
  function openCatat() {
    var el = document.getElementById('app'), mulai = demoParam !== null ? (param('mulai') || 'beli') : 'beli';
    function go(ctx) {
      HF.catatScreen.mount(el, { ctx: ctx, mulai: mulai,
        onClose: function () { location.hash = '#/' + lastTab; },
        onLokasi: ctx.demo ? null : function (nama, jenis) { return HF.api.call('apiLokasiTambah', { nama: nama, jenis: jenis }); },
        onAset: ctx.demo ? null : function (d) { return HF.api.call('apiAsetTambah', d); },
        onSave: function (res, vm, c, photo) {
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
        } });
    }
    if (demoParam !== null) return go(HF.demo.catat());
    function ready(s) { appState = s; go(HF.catatCtx.fromState(s, HF.catatCtx.nowOf())); }
    if (appState) ready(appState); else HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  /* Riwayat: data contoh (?demo=keadaan) atau data nyata dari apiState (transaksi + anggota, lokasi, aset). */
  function renderRiwayat() {
    var el = document.getElementById('app'), seq = ++loadSeq;
    document.title = 'Riwayat · Hartafolio';
    if (demoParam !== null) { var g = HF.riwayatDemo.get(demoParam); return HF.riwayatScreen.mount(el, { data: g.data, ui: g.ui, saved: g.saved, real: false }, nav('riwayat')); }
    var ready = function (s) {
      appState = s;
      if (route() !== 'riwayat' || seq !== loadSeq) return;
      var now = new Date(), hari = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2);
      HF.riwayatScreen.mount(el, { data: HF.riwayat.fromState(s, { hariIni: (s.serverWaktu || '').slice(0, 10) || hari }), real: true }, nav('riwayat'));
    };
    if (appState) return ready(appState);
    el.innerHTML = HF.setup.splash();
    HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  function render() {
    HF.listen.reset(document.getElementById('app')); // pendengar layar sebelumnya dilepas (kalau tidak, tombol Simpan di Catat jalan berlipat)
    var r = route();
    if (r === 'catat') { document.title = 'Catat transaksi · Hartafolio'; return openCatat(); }
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
