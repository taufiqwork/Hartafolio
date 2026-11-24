/* hfForm: bottom sheet bersama untuk tambah/ubah anggota dan lokasi (satu sumber, sama di Setup, Alat, dan Catat).
   Markup dan salinan mengikuti board 01-Setup-2a-Kosong (blok hfForm). Hanya menghasilkan HTML; state dipegang pemanggil. */
(function (root) {
  'use strict';
  var A = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  function svg(paths, size, sw) {
    var a = sw ? A.replace('stroke-width="2"', 'stroke-width="' + sw + '"') : A;
    return '<svg ' + a + (size ? ' width="' + size + '" height="' + size + '"' : '') + '>' + paths.map(function (d) { return '<path d="' + d + '"></path>'; }).join('') + '</svg>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var IC = {
    exchange: ['M3 3v16a2 2 0 0 0 2 2h16', 'm19 9-5 5-4-4-3 3'],
    wallet: ['M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z', 'M16.5 7.5h.01'],
    sekuritas: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17'],
    app: ['M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z', 'M12 18h.01'],
    coin: ['M13.744 17.736a6 6 0 1 1-7.48-7.48', 'M15 6h1v4', 'm6.134 14.768.866-.5 2 3.464', 'M22 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0'],
    bank: ['M10 18v-7', 'M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z', 'M14 18v-7', 'M18 18v-7', 'M3 22h18', 'M6 18v-7'],
    ewallet: ['M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1', 'M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4'],
    vault: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2', 'M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0', 'M7 7h.01', 'M17 7h.01', 'M7 17h.01', 'M17 17h.01'],
    dots: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01']
  };
  /* [kunci ikon, nama jenis, contoh]. Urutan dan salinan persis seperti mockup. */
  var LOK = [['exchange', 'Exchange crypto', 'Binance, Indodax'], ['wallet', 'Wallet crypto', 'Ledger, MetaMask'],
    ['sekuritas', 'Sekuritas saham', 'Ajaib, IPOT'], ['app', 'Aplikasi investasi', 'Pluang, Bibit'], ['coin', 'Emas digital', 'Pegadaian, Treasury'],
    ['bank', 'Bank atau deposito', 'Rekening, deposito, safe deposit'], ['ewallet', 'Dompet digital', 'GoPay, OVO'],
    ['vault', 'Simpanan fisik', 'Brankas, laci, lemari di rumah'], ['dots', 'Lainnya', 'Tempat lain yang tidak ada di daftar']];
  var GOLD = ['coin', 'vault'];
  var REL = ['Pasangan', 'Anak', 'Orang tua', 'Saudara', 'Lainnya'];
  function lokasiIkon(jenis) {
    for (var i = 0; i < LOK.length; i++) if (LOK[i][1] === jenis) return LOK[i][0];
    return 'dots';
  }

  var ALERT = '<svg ' + A + ' width="20" height="20"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>';
  /** Kartu notice galat (board 19-Simpan*): judul, lalu fakta dan langkah berikutnya. */
  function notice(title, text) {
    return '<div class="su-notice" role="alert"><span class="su-notice-ico">' + ALERT + '</span><span class="su-notice-txt"><b>' + esc(title) + '</b><span>' + esc(text) + '</span></span></div>';
  }

  /** fm = { k:'anggota'|'lokasi', mode:'tambah'|'ubah', owner, name, v:{nama,rel,jenis}, pk:'rel'|'jenis'|null, error, busy, sec } */
  function render(fm) {
    var ubah = fm.mode === 'ubah', v = fm.v, nama = String(v.nama || '').trim(), title, desc, primary, ok, fields = [], opts;
    if (fm.k === 'anggota') {
      title = ubah ? 'Ubah ' + fm.name : (fm.owner ? 'Tambah diri Anda' : 'Tambah anggota');
      desc = ubah ? '' : (fm.owner ? 'Anda pengelola akun ini. Anggota lain ditambahkan setelah ini.' : 'Mulai tanpa aset. Saldo awalnya bisa dicatat setelah ini.');
      primary = ubah ? 'Simpan' : 'Tambah anggota';
      opts = REL.map(function (l) { return { l: l, sub: '', ik: null }; });
      fields.push(input('nama', 'Nama', 'Nama panggilan', ubah ? 'Mengganti nama tidak mengubah riwayat. Nama baru muncul di semua laporan.' : '', v.nama));
      fields.push(fm.owner ? ro('Hubungan dengan Anda', 'Diri sendiri', ubah ? 'Pengelola akun selalu Diri sendiri.' : '')
        : select('rel', 'Hubungan dengan Anda', 'Pilih hubungan', ubah ? 'Hanya label. Tidak mengubah aset maupun riwayat.' : '', v.rel, fm.pk === 'rel'));
      ok = !!nama && (fm.owner || !!v.rel);
    } else {
      title = ubah ? 'Ubah ' + fm.name : 'Tambah lokasi';
      desc = ubah ? '' : 'Lokasi baru langsung bisa dipilih saat mencatat transaksi.';
      primary = ubah ? 'Simpan' : 'Tambah lokasi';
      opts = LOK.map(function (o) { return { l: o[1], sub: o[2], ik: o[0] }; });
      fields.push(input('nama', 'Nama lokasi', 'Contoh: Tokopedia Emas', ubah ? 'Mengganti nama tidak mengubah riwayat.' : '', v.nama));
      fields.push(select('jenis', 'Jenis', 'Pilih jenis lokasi', ubah ? 'Hanya pengelompokan. Bisa diubah kapan saja.' : '', v.jenis, fm.pk === 'jenis'));
      ok = !!nama && !!v.jenis;
    }
    function field(label, inner, hint) {
      return '<div class="su-fld"><span class="label su-lbl">' + esc(label) + '</span>' + inner +
        (hint ? '<span class="caption su-lbl">' + esc(hint) + '</span>' : '') + '</div>';
    }
    function input(key, label, ph, hint, val) {
      return field(label, '<input class="hf-input" type="text" data-in="' + key + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '" aria-label="' + esc(label) + '">', hint);
    }
    function ro(label, val, hint) { return field(label, '<span class="su-ro">' + esc(val) + '</span>', hint); }
    function select(key, label, ph, hint, val, open) {
      var list = '<div class="hf-collapse" data-open="' + open + '"><div class="hf-collapse-in"><div class="su-fm-opts" role="listbox" aria-label="' + esc(label) + '">' +
        opts.map(function (o) {
          var on = val === o.l;
          return '<button type="button" class="su-opt' + (o.ik ? ' ico' : '') + '" role="option" aria-selected="' + on + '" data-act="opt" data-val="' + esc(o.l) + '">' +
            (o.ik ? '<span class="su-opt-ic' + (GOLD.indexOf(o.ik) >= 0 ? ' gold' : '') + '">' + svg(IC[o.ik], 18) + '</span>' : '') +
            '<span class="su-opt-t"><b>' + esc(o.l) + '</b>' + (o.sub ? '<span class="caption su-lbl">' + esc(o.sub) + '</span>' : '') + '</span>' +
            '<span class="su-opt-ck">' + svg(['M20 6 9 17l-5-5'], 20, 2.5) + '</span></button>';
        }).join('') + '</div></div></div>';
      return field(label, '<button class="hf-select-btn su-sel" type="button" aria-haspopup="listbox" aria-expanded="' + open + '" data-act="sel" data-key="' + key + '">' +
        '<span' + (val ? '' : ' class="su-ph"') + '>' + esc(val || ph) + '</span>' + svg(['m6 9 6 6 6-6']) + '</button>' + list, hint);
    }
    return '<div class="hf-scrim" data-act="fm-close"></div>' +
      '<section class="hf-sheet hf-sheet-flush" role="dialog" aria-label="' + esc(title) + '">' +
      '<span aria-hidden="true" class="hf-sheet-handle" style="margin-bottom: 8px;"></span>' +
      '<div class="su-fm-body"><div class="su-fm-head"><span class="heading">' + esc(title) + '</span>' + (desc ? '<span class="su-fm-desc">' + esc(desc) + '</span>' : '') + '</div>' +
      fields.join('') + (fm.error ? notice(fm.error.title, fm.error.text) : '') + '</div>' +
      '<div class="su-fm-foot">' +
      '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="fm-save"' + (ok && !fm.busy ? '' : ' disabled') + '>' + (fm.error && fm.error.retry ? 'Coba lagi' : primary) + '</button>' +
      (fm.sec ? '<button class="hf-btn hf-btn-ghost hf-btn-block hf-btn-danger" type="button" data-act="fm-sec">' + esc(fm.sec) + '</button>' : '') +
      '</div></section>';
  }

  root.HF = root.HF || {};
  root.HF.setupForm = { render: render, notice: notice, svg: svg, esc: esc, IC: IC, LOK: LOK, GOLD: GOLD, lokasiIkon: lokasiIkon };
})(typeof globalThis !== 'undefined' ? globalThis : this);
