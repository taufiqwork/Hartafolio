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

  function render() {
    var r = route();
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
