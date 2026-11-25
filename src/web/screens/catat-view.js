/* Catat transaksi: markup form (header, isi, footer). Hanya menghasilkan HTML dari vm (engine/catat.js); state dan klik ada di catat.js.
   Mengikuti board 04-Catat*.dc.html. Gaya: kelas ct-* di docs/design/bundle.css. Sheet ada di catat-sheets.js. */
(function (root) {
  'use strict';
  var S = root.HF.setupForm, esc = S.esc, svg = S.svg;
  var PLUS = svg(['M5 12h14', 'M12 5v14']);
  var CAL = svg(['M8 2v4', 'M16 2v4', 'M3 10h18'], 20).replace('</svg>', '<rect width="18" height="18" x="3" y="4" rx="2"></rect></svg>');
  var CAMERA = svg(['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z'], 20).replace('</svg>', '<circle cx="12" cy="13" r="3"></circle></svg>');
  var CHEV = svg(['m9 18 6-6-6-6'], 18);

  function chip(l, on, act, v) { return '<button class="hf-chip" type="button" aria-pressed="' + on + '" data-act="' + act + '" data-v="' + esc(v === undefined ? l : v) + '">' + esc(l) + '</button>'; }
  function add(act, label) { return '<button class="hf-chip hf-chip-add" type="button" data-act="' + act + '">' + PLUS + label + '</button>'; }
  function group(label, inner, id) { return '<div class="ct-f"><span class="label ct-m"' + (id ? ' id="' + id + '"' : '') + '>' + esc(label) + '</span>' + inner + '</div>'; }
  function wrap(inner) { return '<div class="ct-wrap">' + inner + '</div>'; }
  function toggle(list, cols, act, cls) {
    return '<div class="hf-toggle ct-tg' + (cls || '') + '" role="group" style="grid-template-columns: repeat(' + cols + ', minmax(0, 1fr));">' + list.map(function (p) {
      return '<button type="button" aria-pressed="' + p.pressed + '" data-act="' + act + '" data-v="' + esc(p.key) + '"' + (p.off ? ' disabled' : '') + '>' + esc(p.l) + '</button>'; }).join('') + '</div>';
  }
  function pills(names, cur) { return names.map(function (n) { return { l: n, key: n, pressed: String(n === cur) }; }); }
  function mini(list, act) { // alih kecil (IDR USD USDT, Rp satuan)
    return '<div class="hf-toggle ct-ct" role="group">' + list.map(function (p) { return '<button type="button" aria-pressed="' + p.pressed + '" data-act="' + act + '" data-v="' + esc(p.key) + '">' + esc(p.l) + '</button>'; }).join('') + '</div>';
  }
  function num(id, label, val, act, extra) {
    return '<div class="ct-f"><label for="' + id + '" class="label ct-m">' + esc(label) + '</label><input class="hf-input hf-input-num" id="' + id + '" type="text" inputmode="decimal" value="' + esc(val) + '" data-in="' + act + '"' + (extra || '') + '></div>';
  }
  function dateBtn(id, label, text, hint) {
    return '<div class="ct-f"><span class="label ct-m" id="' + id + '">' + label + '</span><button class="hf-input hf-input-num" type="button" data-act="open-tgl" aria-labelledby="' + id + '"><span>' + esc(text) + '</span><span class="ct-m ct-ic">' + CAL + '</span></button>' +
      (hint ? '<span class="caption ct-m">' + hint + '</span>' : '') + '</div>';
  }
  function sumLine(a, b, cls, c) { return '<div class="ct-sum"><span><span class="ct-b">' + esc(a[0]) + '</span> <span class="ct-m">· ' + esc(a[1]) + '</span></span><span class="amount ct-amt ' + cls + '">' + esc(c) + '</span></div>'; }

  function header(vm) {
    return '<header class="ct-head"><h1 class="title ct-title">' + vm.title + '</h1><button type="button" class="ct-close" data-act="close" aria-label="Tutup">' + svg(['M18 6 6 18', 'm6 6 12 12'], 20) + '</button></header>';
  }

  function recorded(vm) {
    return vm.showRecorded ? '<section class="hf-card ct-rec" aria-label="Sudah dicatat"><span class="label ct-m ct-rec-h">Sudah dicatat · 2 aset</span>' +
      '<div class="hf-detail ct-det"><div class="hf-detail-main"><span class="hf-detail-name">PAXG</span><span class="hf-detail-meta">Azlan · Binance</span></div><span class="hf-detail-amount">0,52 PAXG</span></div>' +
      '<div class="hf-detail ct-det"><div class="hf-detail-main"><span class="hf-detail-name">Emas fisik</span><span class="hf-detail-meta">Azlan · Brankas</span></div><span class="hf-detail-amount">8 gram</span></div></section>' : '';
  }

  function moveCards(vm) {
    var from = '<section class="hf-card ct-mv" aria-label="' + vm.fromTitle + '"><div class="ct-mv-h"><span class="hf-badge hf-badge-brand">' + vm.fromTitle + '</span><span class="caption ct-m ct-r">' + esc(vm.fromSum) + '</span></div>' +
      group(vm.ownerLabel, wrap(vm.anggota.map(function (n) { return chip(n, n === vm.fM, 'anggota'); }).join(''))) +
      group('Aset', wrap(vm.aset.map(function (n) { return chip(n, n === vm.fA, 'aset'); }).join(''))) +
      group('Lokasi asal', wrap(vm.lokasi.map(function (n) { return chip(n, n === vm.fL, 'lokasi'); }).join(''))) +
      '<span class="caption" style="color: ' + vm.balColor + ';">' + esc(vm.balTxt) + '</span></section>';
    var arrow = '<div class="ct-arrow"><span aria-hidden="true">' + svg(['M12 5v14', 'm19 12-7 7-7-7'], 20) + '</span></div>';
    var to = '<section class="hf-card ct-mv" aria-label="' + vm.toTitle + '"><div class="ct-mv-h"><span class="hf-badge hf-badge-gold">' + vm.toTitle + '</span><span class="caption ct-m ct-r">' + esc(vm.toSum) + '</span></div>' +
      (vm.isMoveMem ? group('Anggota penerima', wrap(vm.keAnggota.map(function (n) { return chip(n, n === vm.fR, 'ke-anggota'); }).join(''))) : '') +
      group(vm.keLokLabel, wrap(vm.keLokasi.map(function (n) { return chip(n, n === (vm.isMoveMem ? vm.fKa : vm.fK), 'ke-lokasi'); }).join('') + add('open-lok-to', 'Lokasi'))) + '</section>';
    return from + arrow + to;
  }

  function pick(vm) {
    return group('Anggota', wrap(vm.anggota.map(function (n) { return chip(n, n === vm.fM, 'anggota'); }).join(''))) +
      group('Aset · milik ' + vm.fM, wrap(vm.aset.map(function (n) { return chip(n, n === vm.fA, 'aset'); }).join('') + (vm.showCari ? add('open-aset', 'Aset lain') : ''))) +
      group('Lokasi', wrap(vm.lokasi.map(function (n) { return chip(n, n === vm.fL, 'lokasi'); }).join('') + (vm.showPlusLok ? add('open-lok-from', 'Lokasi') : '')));
  }

  function tradeBlock(vm) {
    var payRow = '<div class="ct-f"><span class="label ct-m">' + vm.payLabel + '</span>' + wrap(vm.payPills.map(function (p) { return chip(p.l, p.pressed, 'pay', p.key); }).join('') +
      '<button class="hf-chip hf-chip-add" type="button" data-act="open-bayar">' + vm.payMoreL + '</button>') + '<span class="caption" style="color: ' + vm.payColor + ';">' + esc(vm.payNote) + '</span></div>';
    var curs = vm.curTabs.map(function (c) { return { l: c, key: c, pressed: String(vm.curSel === c) }; });
    var price = '<div class="ct-f"><div class="ct-lr"><label for="hrg" class="label ct-m">' + vm.pLabel + '</label>' +
      (vm.curFree ? mini(curs, 'cur') : '<span class="hf-badge">dalam <span>' + vm.cur + '</span> · ikut alat bayar</span>') + '</div><input class="hf-input hf-input-num" id="hrg" type="text" inputmode="decimal" value="' + esc(vm.pv) + '" data-in="pv"></div>';
    var kurs = vm.showKurs ? '<div class="ct-f"><label for="kurs" class="label ct-m">Rp per 1 ' + vm.cur + '</label><div class="ct-kv"><input class="hf-input hf-input-num" id="kurs" type="text" inputmode="decimal" value="' + esc(vm.kv) + '" data-in="kv" style="flex: 1; padding: 0 ' + vm.kvPad + ' 0 12px;">' +
      (vm.kvManual ? '<button type="button" class="ct-kv-reset" data-act="reset-kv" aria-label="Kembali ke kurs otomatis" title="Kembali ke kurs otomatis">' + svg(['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'], 18) + '</button>' : '') +
      '</div><span class="caption ct-m ct-live">' + (vm.kvLive ? '<span class="hf-live" aria-hidden="true"></span>' : '') + esc(vm.kursNote) + '</span></div>' : '';
    var fee = '<div class="ct-fee" style="grid-template-columns: ' + (vm.showKurs ? 'repeat(2, minmax(0, 1fr))' : '1fr') + ';"><div class="ct-f"><label for="biaya" class="label ct-m">Biaya (opsional)</label><input class="hf-input hf-input-num" id="biaya" type="text" inputmode="decimal" value="' + esc(vm.fee) + '" data-in="fee"><span class="caption ct-m">dalam ' + vm.cur + '</span></div>' + kurs + '</div>';
    return payRow + price + fee;
  }

  function moveFee(vm) {
    var u = vm.feeUnits.map(function (c) { return { l: c, key: c, pressed: String(vm.feeUnit === c) }; });
    return '<div class="ct-f"><div class="ct-lr"><label for="biayaP" class="label ct-m">Biaya (opsional)</label>' + mini(u, 'fu') + '</div><input class="hf-input hf-input-num" id="biayaP" type="text" inputmode="decimal" value="' + esc(vm.fee) + '" data-in="fee"><span class="caption ct-m">' + vm.feeNote + '</span></div>';
  }
  function awalBlock(vm) {
    var curs = vm.curTabs.map(function (c) { return { l: c, key: c, pressed: String(vm.curSel === c) }; });
    return '<div class="ct-f"><div class="ct-lr"><label for="avg" class="label ct-m">Harga beli rata-rata (opsional)</label>' + mini(curs, 'cur') + '</div><input class="hf-input hf-input-num" id="avg" type="text" inputmode="decimal" value="' + esc(vm.avg) + '" placeholder="Kosongkan bila tidak tahu" data-in="avg"><span class="caption ct-m">Per ' + esc(vm.unit) + ', dari catatan lama atau pernyataan pialang. Dipakai untuk menghitung untung-rugi.</span></div>' +
      dateBtn('tglA', 'Tanggal saldo', vm.tglAwal, 'Ubah bila sudah dimiliki sejak lama.');
  }

  function proof() {
    return '<section class="ct-f" aria-label="Bukti"><div class="ct-lr ct-base"><span class="label ct-m">Bukti</span><span class="caption ct-m">opsional</span></div><div class="hf-card ct-proof">' +
      '<button type="button" class="ct-photo" disabled><span class="ct-photo-ic">' + CAMERA + '</span><span class="ct-photo-tx"><span class="ct-photo-t">Lampirkan foto</span><span class="caption ct-m">Nota, struk, atau tangkapan layar</span></span><span class="ct-m ct-ic">' + CHEV + '</span></button>' +
      '<label for="nota" class="ct-nota"><span class="ct-photo-t">No. referensi</span><input class="hf-input" id="nota" type="text" placeholder="No. nota, ID order, atau tx hash" data-in="nota"><span class="caption ct-m ct-n4">Dipakai agar import ulang tidak dobel.</span></label></div></section>' +
      '<button class="hf-btn hf-btn-ghost ct-more" type="button" disabled>' + PLUS + 'Pajak, catatan</button>';
  }

  function main(vm) {
    var h = '';
    if (vm.showJenis) h += toggle(['Beli', 'Jual', 'Masuk', 'Keluar', 'Pindah'].map(function (l) { return { l: l, key: l, pressed: String(vm.fJ === l) }; }), 5, 'jenis');
    if (vm.isMove) h += toggle([['lokasi', 'Antar lokasi'], ['anggota', 'Antar anggota']].map(function (x) { return { l: x[1], key: x[0], pressed: String(vm.fP === x[0]) }; }), 2, 'sub');
    h += '<p class="ct-hint" style="margin: ' + vm.hintMt + ' 0 0;">' + esc(vm.modeHint) + (vm.showSaldoLink ? ' <a class="ct-link" data-act="saldo-awal">Punya aset lama yang belum tercatat? Catat saldo awal.</a>' : '') + '</p>';
    h += recorded(vm);
    h += vm.isMove ? moveCards(vm) : pick(vm);
    if (vm.showAsal) h += group(vm.asalLabel, wrap(vm.asalList.map(function (n) { return chip(n, n === vm.fS, 'asal'); }).join('')));
    if (vm.showTgl) h += dateBtn('tglL', 'Tanggal', vm.tglTxt);
    h += '<div class="ct-f"><label for="jml" class="label ct-m">' + esc(vm.qLabel) + '</label><input class="hf-input hf-input-num" id="jml" type="text" inputmode="decimal" value="' + esc(vm.q) + '" data-in="qv" aria-invalid="' + (vm.qErr || vm.qMissing) + '" style="border-color: ' + (vm.qErr || vm.qMissing ? 'var(--loss)' : 'var(--line-strong)') + ';">' +
      (vm.showBalQ ? '<span class="caption" style="color: ' + vm.balColor + ';">' + esc(vm.balTxt) + '</span>' : '') + '</div>';
    if (vm.isTrade) h += tradeBlock(vm);
    if (vm.isMove) h += moveFee(vm);
    if (vm.awal) h += awalBlock(vm);
    return h + proof();
  }

  function footer(vm) {
    var h = '';
    if (vm.isMoveMem) {
      h += '<div class="ct-impact" aria-label="Dampak ke saldo">' + sumLine([vm.fM, vm.fL], '', 'ct-loss', vm.minusTxt) + sumLine([vm.fR, vm.recNote], '', 'ct-brand', vm.plusTxt) +
        (vm.hasFee ? '<div class="ct-sum"><span class="ct-m">Biaya</span><span class="amount ct-amt ct-loss">−Rp ' + esc(vm.fee) + '</span></div>' : '') + '<span class="caption ct-m">' + vm.famNote + '</span></div>';
    }
    if (vm.showTotal) h += '<div class="ct-tot"><span class="label ct-m">' + vm.totLabel + '</span><span class="amount ct-tot-v">' + esc(vm.totValue) + '</span></div>';
    h += '<button class="hf-btn hf-btn-primary hf-btn-block" type="button" data-act="save" aria-disabled="' + vm.invalid + '" style="opacity: ' + (vm.invalid ? '0.45' : '1') + '; pointer-events: ' + (vm.invalid ? 'none' : 'auto') + ';">' + vm.saveLabel + '</button>';
    if (vm.awal) h += '<button class="hf-btn hf-btn-ghost hf-btn-block" type="button" data-act="save-more">Simpan &amp; tambah aset lain</button>';
    return h;
  }

  root.HF = root.HF || {};
  root.HF.catatView = { header: header, main: main, footer: footer, chip: chip, toggle: toggle, pills: pills, group: group, wrap: wrap, add: add, PLUS: PLUS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
