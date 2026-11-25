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

  var lastTab = 'beranda', appState = null;
  /* Catat transaksi: layar penuh di atas shell. Data contoh (?demo) atau data nyata dari apiState. */
  /* Unggah foto bukti di belakang layar. Gagal = toast dengan Coba lagi (foto ditahan di memori selama aplikasi terbuka). */
  function unggah(id, photo) {
    HF.api.call('apiBuktiUnggah', id, { nama: photo.nama, mime: photo.mime, base64: photo.base64 }).then(function () {
      HF.berandaScreen.flash({ text: 'Foto terunggah' });
    }).catch(function () {
      HF.berandaScreen.flash({ text: 'Foto belum terunggah. Transaksi sudah tersimpan.', act: 'Coba lagi', on: function () { unggah(id, photo); } });
    });
  }
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
          if (photo && !ctx.demo) done.then(function (r) { if (!(r.ditolak || []).length) unggah(r.utama, photo); });
          HF.berandaScreen.flash({ text: vm.fJ + ' ' + (vm.fA || '') + ' ' + vm.q + ' tersimpan', act: 'Lihat' });
          location.hash = '#/' + lastTab;
        } });
    }
    if (demoParam !== null) return go(HF.demo.catat());
    function ready(s) { appState = s; go(HF.catatCtx.fromState(s, HF.catatCtx.nowOf())); }
    if (appState) ready(appState); else HF.api.call('apiState').then(ready).catch(function (e) { el.innerHTML = HF.setup.splash().replace('Menyiapkan data Anda', e.message); });
  }

  function render() {
    var r = route();
    if (r === 'catat') { document.title = 'Catat transaksi · Hartafolio'; return openCatat(); }
    lastTab = r;
    if (r === 'beranda') {
      var el = document.getElementById('app');
      el.innerHTML = HF.berandaScreen.html(berandaData) + nav('beranda') + '<div class="br-overlays">' + HF.berandaScreen.overlays(berandaData) + '</div>';
      HF.berandaScreen.bind(el, berandaData);
      document.title = 'Beranda · Hartafolio';
      return;
    }
    var screen = '<main class="app-screen hf-scroll" id="screen">' +
      '<h1 class="app-title">' + TITLES[r] + '</h1>' +
      '<p class="app-soon">Layar ini dibangun pada tahap berikutnya.</p></main>';
    document.getElementById('app').innerHTML = screen + nav(r === 'catat' ? 'beranda' : r);
    document.title = TITLES[r] + ' · Hartafolio';
  }

  function startShell() {
    window.addEventListener('hashchange', render);
    render();
  }

  /* Pertama kali: splash, lalu Setup bila belum selesai, kalau sudah ke shell. */
  var app = document.getElementById('app');
  app.innerHTML = HF.setup.splash();
  /* Hanya mode dev (untuk perbandingan piksel): ?hold menahan splash, ?step=N memaksa langkah Setup. */
  var dev = HF.api.isDev, hold = dev && /[?&]hold\b/.test(location.search), forced = dev && /[?&]step=(\d)/.exec(location.search);
  function openSetup(s, err) {
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
