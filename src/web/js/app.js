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

  function render() {
    var r = route();
    var screen = '<main class="app-screen hf-scroll" id="screen">' +
      '<h1 class="app-title">' + TITLES[r] + '</h1>' +
      '<p class="app-soon">Layar ini dibangun pada tahap berikutnya.</p></main>';
    document.getElementById('app').innerHTML = screen + nav(r === 'catat' ? 'beranda' : r);
    document.title = TITLES[r] + ' · Hartafolio';
  }

  window.addEventListener('hashchange', render);
  render();
})();
