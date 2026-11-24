/* Setup awal: splash, langkah 1 Akun, 2 Anggota, 3 Lokasi (langkah 4 Import dibangun berikutnya).
   Mengikuti board 00-Splash dan 01-Setup-* di mockup hi-fi. Data lewat HF.api; tidak menghitung apa pun sendiri. */
(function (root) {
  'use strict';
  var F = root.HF.setupForm, esc = F.esc, svg = F.svg;

  var LOGO = '<circle cx="24" cy="30" r="14" fill="var(--gold-fill)"></circle><circle cx="24" cy="30" r="9" fill="none" stroke="var(--gold-soft)" stroke-width="2.5"></circle><path d="M24 16V9" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"></path><path d="M23.07 11.75 C22.76 4.56 28 2 34 2 C34 8 30.04 13 23.07 11.75 Z" fill="var(--brand)"></path><path d="M24.89 12.197 C25.511 6.488 21 5 16 5 C16 10 19.89 12.197 24.89 12.197 Z" fill="var(--brand)"></path>';
  function logo(size, cls) { return '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + LOGO + '</svg>'; }

  var QUICK = [['Binance', 'Exchange crypto'], ['Bybit', 'Exchange crypto'], ['Pluang', 'Aplikasi investasi'], ['Brankas', 'Simpanan fisik'],
    ['Bank', 'Bank atau deposito'], ['Pegadaian', 'Emas digital'], ['Treasury', 'Emas digital'], ['Bibit', 'Aplikasi investasi'],
    ['Indodax', 'Exchange crypto'], ['Ajaib', 'Sekuritas saham'], ['Ledger', 'Wallet crypto'], ['GoPay', 'Dompet digital']];

  function splash() {
    return '<div class="su-splash"><div class="su-splash-in">' + logo(96) +
      '<div class="su-splash-name"><h1 class="title">Hartafolio</h1><p>Harta keluarga, tercatat rapi.</p></div></div>' +
      '<div class="su-splash-load"><div class="hf-track" aria-hidden="true"><span style="width: 100%; background: var(--brand);"></span></div><small>Menyiapkan data Anda</small></div></div>';
  }

  function head(step, label, back, stage) {
    var bar = [1, 2, 3, 4].map(function (i) {
      if (i === 4 && stage) return '<span class="ticks">' + [1, 2, 3].map(function (t) { return '<span' + (t <= stage ? ' class="on"' : '') + '></span>'; }).join('') + '</span>';
      return '<span' + (i <= step ? ' class="on"' : '') + '></span>';
    }).join('');
    return '<div class="hf-head"><div style="display: flex; flex-direction: column; gap: 8px;"><div class="su-bar" aria-hidden="true">' + bar + '</div>' +
      (back ? '<div class="su-headrow"><span class="su-step">Langkah ' + step + ' dari 4 · ' + label + '</span><button class="su-back hf-tap" type="button" data-act="back">' + svg(['m15 18-6-6 6-6'], 16) + 'Kembali</button></div>'
        : '<span class="su-step">Langkah ' + step + ' dari 4 · ' + label + '</span>') + '</div></div>';
  }
  function foot(inner) { return '<footer class="su-foot">' + inner + '</footer>'; }

  function akun() {
    var items = [['Akun', 'Masuk dengan akun Google'], ['Anggota', 'Siapa saja yang dicatat'], ['Lokasi', 'Tempat aset disimpan'], ['Import', 'Pindahkan catatan Excel lama']];
    return head(1, 'Akun', false) + '<main class="su-main su-main-tight hf-scroll">' +
      '<div class="su-hd su-welcome">' + logo(44, 'su-welcome-logo') + '<h1 class="title">Selamat datang di Hartafolio</h1>' +
      '<p class="su-lead">Catat emas, perak, crypto, saham, dan uang keluarga di satu tempat, dengan pengingat zakat.</p></div>' +
      '<section class="su-hd" aria-label="Yang akan disiapkan"><div class="su-steps-head"><span class="heading">Mulai dalam 4 langkah</span><small>sekitar 3 menit</small></div>' +
      '<div class="hf-card su-list su-steps">' + items.map(function (t, i) {
        return '<div class="hf-detail"><span class="su-num' + (i === 0 ? ' on' : '') + '">' + (i + 1) + '</span><div class="hf-detail-main"><span class="hf-detail-name">' + t[0] + '</span><span class="hf-detail-meta">' + t[1] + '</span></div></div>';
      }).join('') + '</div></section>' +
      '<div class="su-priv"><span>' + svg(['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z', 'm9 12 2 2 4-4'], 20) + '</span>' +
      '<span>Data tersimpan di Google Sheet milik Anda sendiri. Hartafolio tidak menyimpan salinan di server lain.</span></div></main>' +
      foot('<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="next">' + svg(['m10 17 5-5-5-5', 'M15 12H3', 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4'], 20) + 'Masuk dengan akun Google</button>' +
        '<span class="su-foot-note">Dipakai untuk membuat dan membuka Google Sheet Anda</span>');
  }

  function emptyCard(icon, title, note) {
    return '<section class="hf-card su-empty" aria-label="' + esc(title) + '"><span class="su-empty-ico">' + svg(icon, 24) + '</span><span class="heading">' + esc(title) + '</span><span class="su-empty-note">' + esc(note) + '</span></section>';
  }
  var PEN = svg(['M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z'], 18);
  function editBtn(label, id) { return '<button type="button" class="su-edit" aria-label="Ubah ' + esc(label) + '" data-act="edit" data-id="' + esc(id) + '">' + PEN + '</button>'; }

  function anggota(d) {
    var rows = d.anggota, n = rows.length;
    var list = n ? '<div class="hf-card su-list" aria-label="Anggota">' + rows.map(function (m) {
      return '<div class="hf-detail" style="grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center;"><span class="su-av' + (m.is_pengelola ? ' mgr' : '') + '">' + esc(m.nama.charAt(0).toUpperCase()) + '</span>' +
        '<div class="hf-detail-main"><span class="hf-detail-name">' + esc(m.nama) + '</span><span class="hf-detail-meta">' + esc(m.hubungan) + '</span></div>' +
        '<span class="su-row-end">' + (m.is_pengelola ? '<span class="hf-badge hf-badge-brand">Pengelola</span>' : '') + editBtn(m.nama, m.anggota_id) + '</span></div>';
    }).join('') + '</div>' : emptyCard(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.128a4 4 0 0 1 0 7.744', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'], 'Belum ada anggota', 'Mulai dari Anda sendiri.');
    return head(2, 'Anggota', true) + '<main class="su-main hf-scroll"><div class="su-hd"><h1 class="title">Siapa saja anggota keluarganya?</h1>' +
      '<p class="su-lead">Tambahkan Anda dan keluarga yang hartanya Anda kelola. Mereka tidak perlu punya akun.</p></div>' + list +
      '<button class="hf-btn hf-btn-block" type="button" data-act="add">' + svg(['M5 12h14', 'M12 5v14'], 18) + '<span>' + (n ? 'Tambah anggota' : 'Tambah diri Anda') + '</span></button></main>' +
      foot(n ? '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="next">Lanjut ke Lokasi</button><span class="su-foot-note">' + n + ' anggota · bisa ditambah kapan saja</span>'
        : '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" disabled>Tambah minimal 1 anggota</button>');
  }

  function lokasi(d, hl) {
    var rows = d.lokasi, n = rows.length, plus = svg(['M5 12h14', 'M12 5v14']);
    var list = n ? '<section class="hf-card su-list" aria-label="Lokasi">' + rows.map(function (l) {
      var ik = F.lokasiIkon(l.jenis), gold = F.GOLD.indexOf(ik) >= 0;
      return '<div class="hf-detail" style="grid-template-columns: 40px minmax(0, 1fr) auto;"><span class="su-tile' + (gold ? ' gold' : '') + '">' + svg(F.IC[ik], 20) + '</span>' +
        '<div class="hf-detail-main"><span class="hf-detail-name">' + esc(l.nama) + '</span><span class="hf-detail-meta">' + esc(l.jenis) + '</span></div>' +
        '<span class="su-row-end">' + (hl === l.nama ? '<span class="hf-badge hf-badge-brand">Baru</span>' : '') + editBtn(l.nama, l.lokasi_id) + '</span></div>';
    }).join('') + '</section>' : emptyCard(F.IC.vault, 'Belum ada lokasi', 'Pilih di Tambah cepat, atau ketuk Lokasi lain.');
    var quick = QUICK.filter(function (q) { return !rows.some(function (l) { return l.nama.toLowerCase() === q[0].toLowerCase(); }); })
      .map(function (q) { return '<button class="hf-chip" type="button" data-act="quick" data-nama="' + esc(q[0]) + '" data-jenis="' + esc(q[1]) + '">' + plus + esc(q[0]) + '</button>'; }).join('');
    return head(3, 'Lokasi', true) + '<main class="su-main hf-scroll"><div class="su-hd"><h1 class="title">Di mana saja aset disimpan?</h1>' +
      '<p class="su-lead">Lokasi membantu memisahkan aset yang sama di tempat berbeda.</p></div>' + list +
      '<section class="su-quick" aria-label="Tambah cepat"><span class="label su-lbl">Tambah cepat</span><div class="su-chips">' + quick +
      '<button class="hf-chip hf-chip-add" type="button" data-act="add">' + plus + 'Lokasi lain</button></div></section></main>' +
      foot(n ? '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="next">Lanjut ke Import</button><span class="su-foot-note">' + n + ' lokasi · bisa diubah nanti</span>'
        : '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" disabled>Tambah minimal 1 lokasi</button>');
  }

  /* Langkah 4, tahap 1 "Pilih file". Unduh template dan Pilih file belum dibangun (Tahap 8): tombolnya mati. */
  function import4() {
    var dl = svg(['M12 15V3', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5'], 18);
    var up = svg(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm17 8-5-5-5 5', 'M12 3v12'], 18);
    return head(4, 'Pilih file (1/3)', true, 1) + '<main class="su-main hf-scroll"><div class="su-hd"><h1 class="title">Punya catatan lama?</h1>' +
      '<p class="su-lead">Pindahkan sekaligus lewat template Hartafolio. Langkah ini opsional, boleh dilewati.</p></div>' +
      '<section class="hf-card su-imp" aria-label="Import dengan template">' +
      '<div class="su-imp-row"><span class="su-imp-n">1</span><div class="su-imp-col"><div class="su-imp-txt"><b>Unduh template</b><span class="caption su-lbl">Anggota dan lokasi tadi sudah jadi pilihan.</span></div>' +
      '<button class="hf-btn hf-btn-block" type="button" disabled>' + dl + 'Template tabel Hartafolio</button></div></div>' +
      '<div class="su-imp-sep"></div>' +
      '<div class="su-imp-row"><span class="su-imp-n">2</span><div class="su-imp-col"><div class="su-imp-txt"><b>Isi, lalu unggah</b><span class="caption su-lbl">Cukup sheet Transaksi, simpan sebagai .xlsx.</span></div>' +
      '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" disabled>' + up + '<span>Pilih file template</span></button></div></div></section></main>' +
      foot('<button class="hf-btn hf-btn-block" type="button" data-act="next">Lewati, mulai dari nol</button><span class="su-foot-note">Import juga bisa dilakukan nanti dari menu Alat</span>');
  }

  /** Pasang Setup ke elemen. onDone dipanggil setelah Setup selesai. */
  function mount(el, data, opts) {
    var st = { step: 1, anggota: data.anggota.filter(function (a) { return a.aktif; }), lokasi: data.lokasi.filter(function (a) { return a.aktif; }), fm: null, hl: null, busy: false };
    if (st.anggota.length && st.lokasi.length) st.step = 4;
    else if (st.anggota.length) st.step = 3;
    else if (st.anggota.length === 0 && opts && opts.skipWelcome) st.step = 2;

    function paint() {
      var scr = [null, akun, anggota, function () { return lokasi(st, st.hl); }, import4][st.step];
      el.innerHTML = '<div class="su">' + scr(st) + (st.fm ? F.render(st.fm) : '') + '</div>';
    }
    function reload(then) {
      return root.HF.api.call('apiState').then(function (s) {
        st.anggota = s.anggota.filter(function (a) { return a.aktif; });
        st.lokasi = s.lokasi.filter(function (a) { return a.aktif; });
        if (then) then(); paint();
      });
    }
    function openForm(k, mode, rec) {
      var anggotaMode = k === 'anggota';
      st.fm = { k: k, mode: mode, owner: anggotaMode && (mode === 'tambah' ? st.anggota.length === 0 : !!rec.is_pengelola),
        name: rec ? rec.nama : '', id: rec ? (anggotaMode ? rec.anggota_id : rec.lokasi_id) : null, pk: null, error: '', busy: false,
        v: rec ? { nama: rec.nama, rel: rec.hubungan, jenis: rec.jenis } : { nama: '', rel: '', jenis: '' },
        sec: mode === 'ubah' && !(anggotaMode && rec.is_pengelola) ? (anggotaMode ? 'Hapus anggota' : 'Hapus lokasi') : null };
      paint();
    }
    function failIn(e) { if (st.fm) { st.fm.busy = false; st.fm.error = e.message; } paint(); }
    function save() {
      var fm = st.fm, api = root.HF.api.call, p;
      fm.busy = true; fm.error = ''; paint();
      if (fm.k === 'anggota') p = fm.mode === 'tambah' ? api('apiAnggotaTambah', { nama: fm.v.nama, hubungan: fm.v.rel }) : api('apiAnggotaUbah', fm.id, { nama: fm.v.nama, hubungan: fm.v.rel });
      else p = fm.mode === 'tambah' ? api('apiLokasiTambah', { nama: fm.v.nama, jenis: fm.v.jenis }) : api('apiLokasiUbah', fm.id, { nama: fm.v.nama, jenis: fm.v.jenis });
      p.then(function (r) { return reload(function () { st.fm = null; if (fm.k === 'lokasi' && fm.mode === 'tambah') st.hl = r.nama; }); }).catch(failIn);
    }
    function remove() {
      var fm = st.fm, call = root.HF.api.call;
      fm.busy = true; paint();
      call(fm.k === 'anggota' ? 'apiAnggotaHapus' : 'apiLokasiHapus', fm.id).then(function () { return reload(function () { st.fm = null; }); }).catch(failIn);
    }

    /* Pilihan di dalam form diperbarui di tempat, tanpa menggambar ulang sheet (animasi buka/tutup tetap jalan, ketikan tidak hilang). */
    function syncSave() {
      var v = st.fm.v, ok = !!String(v.nama).trim() && (st.fm.k === 'anggota' ? (st.fm.owner || !!v.rel) : !!v.jenis);
      var btn = el.querySelector('[data-act="fm-save"]'); if (btn) btn.disabled = !ok || st.fm.busy;
    }
    function syncSelect() {
      var fm = st.fm, key = fm.k === 'anggota' ? 'rel' : 'jenis', val = fm.v[key], b = el.querySelector('[data-act="sel"]');
      var open = fm.pk === key, span = b.firstChild;
      b.setAttribute('aria-expanded', String(open));
      el.querySelector('.hf-collapse').setAttribute('data-open', String(open));
      span.textContent = val || (fm.k === 'anggota' ? 'Pilih hubungan' : 'Pilih jenis lokasi');
      span.className = val ? '' : 'su-ph';
      [].forEach.call(el.querySelectorAll('.su-opt'), function (o) { o.setAttribute('aria-selected', String(o.getAttribute('data-val') === val)); });
      syncSave();
    }

    el.onclick = function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      var act = t.getAttribute('data-act'), id = t.getAttribute('data-id');
      if (act === 'next') {
        if (st.step === 4) { root.HF.api.call('apiSetupSelesai').then(function () { if (opts && opts.onDone) opts.onDone(); }); return; }
        st.step += 1; st.hl = null; paint();
      } else if (act === 'back') { st.step -= 1; st.hl = null; paint(); }
      else if (act === 'add') openForm(st.step === 2 ? 'anggota' : 'lokasi', 'tambah');
      else if (act === 'edit') {
        var k = st.step === 2 ? 'anggota' : 'lokasi', rows = k === 'anggota' ? st.anggota : st.lokasi;
        openForm(k, 'ubah', rows.filter(function (r) { return (r.anggota_id || r.lokasi_id) === id; })[0]);
      } else if (act === 'quick') {
        root.HF.api.call('apiLokasiTambah', { nama: t.getAttribute('data-nama'), jenis: t.getAttribute('data-jenis') })
          .then(function (r) { return reload(function () { st.hl = r.nama; }); });
      } else if (act === 'fm-close') { st.fm = null; paint(); }
      else if (act === 'fm-save') save();
      else if (act === 'fm-sec') remove();
      else if (act === 'sel') { var key = t.getAttribute('data-key'); st.fm.pk = st.fm.pk === key ? null : key; syncSelect(); }
      else if (act === 'opt') { st.fm.v[st.fm.pk] = t.getAttribute('data-val'); st.fm.pk = null; syncSelect(); }
    };
    el.oninput = function (e) {
      var key = e.target.getAttribute('data-in'); if (!key || !st.fm) return;
      st.fm.v[key] = e.target.value; syncSave();
    };
    paint();
  }

  root.HF = root.HF || {};
  root.HF.setup = { mount: mount, splash: splash };
})(typeof globalThis !== 'undefined' ? globalThis : this);
