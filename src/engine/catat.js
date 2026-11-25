/**
 * Catat transaksi: model tampilan (view-model). Murni, tanpa DOM. Diport dari skrip board 04-Catat.dc.html
 * (renderVals) dan dibuat bergantung pada `ctx` supaya data contoh (?demo) dan data nyata memakai logika yang sama.
 *
 * ctx = {
 *   members: [nama], lokasi: [nama], held: { nama: [[aset, [lokasi]]] }, bal: { 'anggota|aset|lokasi': angka },
 *   assets: { label: { unit, cat, quote, price (IDR per unit), q0, valText } }, rates: { USD, USDT } (kosong = kurs manual),
 *   payCur: ['USDT','USD'], catalog: [[kode, nama, kelas, satuan]], now: { y, m, d, hh, mm }, demo: boolean
 * }
 * st = keadaan layar (fJ, fA, fL, qv, pv, ...). opt = { mulai } untuk keadaan awal (dipakai board dan skenario piksel).
 * Hasil: objek vm dengan nama yang sama dengan properti di board, dikonsumsi web/screens/catat*.js.
 */
(function (root) {
  'use strict';
  var BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var BULAN_PENUH = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var PHYS = ['Emas fisik', 'Perak fisik'];
  var HINT = { Beli: 'Aset bertambah. Bila dibayar dengan aset tercatat, saldonya ikut berkurang.', Jual: 'Aset berkurang. Hasilnya bisa masuk ke aset tercatat.',
    Masuk: 'Datang dari luar tanpa dibeli, misalnya hadiah atau warisan.', Keluar: 'Pergi ke luar tanpa dijual, misalnya hadiah atau sedekah.',
    Pindah: 'Antar lokasi atau anggota. Total harta tetap, kecuali biaya.' };
  var JENIS_MULAI = { 'pilih-tanggal': 'Beli', 'tanggal-lalu': 'Beli', 'kurs-manual': 'Beli', 'bayar-lain': 'Beli', 'bayar-btc': 'Beli', 'bayar-bybit': 'Beli', beli: 'Beli', 'beli-luar': 'Beli',
    jual: 'Jual', masuk: 'Masuk', keluar: 'Keluar', pindah: 'Pindah', 'pindah-anggota': 'Pindah', 'pindah-anggota-lokasi': 'Pindah', awal: 'Masuk', 'awal-lanjut': 'Masuk', 'cari-aset': 'Beli', 'lokasi-baru': 'Beli', 'aset-manual': 'Beli', 'foto-pilih': 'Beli', 'aset-manual-angka': 'Beli', 'angka-format': 'Beli', 'angka-titik': 'Beli', 'angka-inggris': 'Beli', 'angka-koma': 'Beli', 'foto-kamera': 'Beli', 'foto-terlampir': 'Beli', 'foto-gagal': 'Beli' };
  var INIT = { 'pilih-tanggal': { sheet: 'tgl', d: 10 }, 'tanggal-lalu': { d: 10 }, 'kurs-manual': { kv: '16.250' }, 'bayar-lain': { sheet: 'bayar' }, 'bayar-btc': { pay: 'BTC@Binance', fee: '0' },
    'bayar-bybit': { pay: 'USDT@Bybit' }, 'beli-luar': { fA: 'Emas fisik', fee: '0' }, keluar: { fA: 'Perak fisik', qv: '10' }, jual: { fA: 'GFI' },
    'foto-pilih': { sheet: 'foto' }, 'cari-aset': { sheet: 'aset' }, 'lokasi-baru': { sheet: 'lokasi' }, 'aset-manual': { sheet: 'manual' }, 'aset-manual-angka': { sheet: 'manual' } };

  function num(x) { return parseFloat(String(x).replace(/\./g, '').replace(',', '.')); }
  function fmt(n, d) { return (isFinite(n) ? n : 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: d }); }
  function rp(n) { return n >= 1e6 ? 'Rp ' + fmt(n / 1e6, 2) + ' jt' : 'Rp ' + fmt(n, 0); }
  function p2(n) { return String(n).padStart(2, '0'); }
  function pill(l, on, key) { return { l: l, pressed: String(on), key: key === undefined ? l : key }; }
  function has(arr, v) { return arr.indexOf(v) >= 0; }

  /** Pilihan hari untuk kalender: bulan (y, m) dengan hari ini di ctx.now. */
  function calendar(st, ctx, sel) {
    var now = ctx.now, mo = st.mo || 0, y = now.y, m = now.m + mo;
    while (m < 1) { m += 12; y--; }
    var first = new Date(y, m - 1, 1).getDay(), lead = (first + 6) % 7, days = new Date(y, m, 0).getDate();
    var cur = mo === 0, dd = sel.d, dm = sel.m, dy = sel.y;
    var cells = [];
    for (var k = 0; k < lead + days; k++) { // sel awal kosong sampai hari pertama, tanpa sel sisa (November 2026 = 36 sel)
      var n = k - lead + 1, real = n >= 1 && n <= days;
      var future = cur && n > now.d, selected = real && n === dd && m === dm && y === dy;
      cells.push({ n: real ? n : '', vis: real ? 'visible' : 'hidden', on: String(selected), off: !real || future, ring: cur && n === now.d && !(dd === now.d && dm === now.m) ? 'inset 0 0 0 1.5px var(--brand)' : 'none', pick: real ? n : null });
    }
    return { cells: cells, title: BULAN_PENUH[m - 1] + ' ' + y, nextOff: cur, y: y, m: m };
  }

  function view(st, ctx, opt) {
    opt = opt || {};
    var mulai = opt.mulai || 'beli', I = (ctx.demo && INIT[mulai]) || {};
    var now = ctx.now, FM = ctx.held, BAL = ctx.bal, AS = ctx.assets, CURA = ctx.payCur || [];
    var awal = mulai === 'awal' || mulai === 'awal-lanjut';
    var nl = st.nl || [], ext = st.ext || [];
    var ALL_LOC = ctx.lokasi.concat(nl);
    var fJ = st.fJ || JENIS_MULAI[mulai] || 'Beli';
    var fP = st.fP || (mulai.indexOf('pindah-anggota') === 0 ? 'anggota' : 'lokasi');
    var fM = st.fM || ctx.members[0];
    var isTrade = fJ === 'Beli' || fJ === 'Jual', isIn = fJ === 'Masuk', isOut = fJ === 'Keluar', isMove = fJ === 'Pindah';
    var isMoveMem = isMove && fP === 'anggota';
    var canNew = fJ === 'Beli' || isIn || awal;
    var unitOf = function (a) { return (AS[a] && AS[a].unit) || (ext.filter(function (e) { return e[0] === a; })[0] || [0, 0, 0, 'unit'])[3]; };
    var base = awal ? ctx.awalBase(ALL_LOC) : (FM[fM] || []);
    var fAs = canNew ? base.concat(ext.filter(function (e) { return !base.some(function (b) { return b[0] === e[0]; }); }).map(function (e) { return [e[0], ALL_LOC]; })) : base;
    var fA0 = st.fA === undefined ? I.fA : st.fA;
    var fA = awal ? (st.fA === undefined ? null : st.fA) : (fA0 && fAs.some(function (x) { return x[0] === fA0; }) ? fA0 : (fAs[0] ? fAs[0][0] : null));
    var held = fA ? (fAs.filter(function (x) { return x[0] === fA; })[0] || [0, []])[1] : (awal ? ALL_LOC : []);
    var fLs = canNew && fA && !awal ? held.concat(has(PHYS, fA) ? [] : ALL_LOC.filter(function (l) { return !has(held, l); }), nl.filter(function (l) { return !has(held, l) && has(PHYS, fA); })) : held;
    var fL0 = st.fL === undefined ? (st.fA === undefined ? I.fL : undefined) : st.fL;
    var fL = awal && !st.fL ? null : (fL0 && has(fLs, fL0) ? fL0 : fLs[0]);
    var asetInfo = fA ? (AS[fA] || { unit: unitOf(fA) }) : null;
    var unit = asetInfo ? asetInfo.unit || 'unit' : 'unit';
    var q0 = asetInfo && asetInfo.q0 !== undefined && ctx.demo ? asetInfo.q0 : '';
    var q = st.qv != null ? st.qv : (st.fA === undefined && I.qv ? I.qv : (awal && !fA ? '' : q0));
    var fee = st.fee != null ? st.fee : (I.fee != null ? I.fee : (mulai === 'pindah-anggota-lokasi' ? '16.500' : (isTrade && ctx.demo ? '0,1' : '0')));
    var _A = root.HF && root.HF.angka, bad = function (t) { var g = _A && t ? _A.analisis(t).galat : null; return !!(g && g.jenis !== 'karakter' && g.pasti); };
    var qn = bad(q) ? '' : q, feen = bad(fee) ? '' : fee;
    var hasFee = isMove && num(feen) > 0;
    var toL = ALL_LOC.filter(function (l) { return l !== fL; });
    var fK = st.fK && has(toL, st.fK) ? st.fK : toL[0];
    var fKa = st.fKa && has(ALL_LOC, st.fKa) ? st.fKa : (mulai === 'pindah-anggota-lokasi' ? 'Bybit' : fL);
    var fKr = isMoveMem ? fKa : fK;
    var others = ctx.members.filter(function (m) { return m !== fM; });
    var fR = st.fR && has(others, st.fR) ? st.fR : others[0];
    var fS = st.fS || (isOut ? 'Sedekah' : 'Hadiah');
    var bal = BAL[fM + '|' + fA + '|' + fL], balTxt0 = bal ? fmt(bal, 8) : null;
    var checksBal = isMove || fJ === 'Jual' || isOut;
    var qErr = !!(checksBal && bal && num(qn) > bal);
    // waktu
    var dd = st.d != null ? st.d : (I.d || now.d), hh = st.hh != null ? st.hh : (I.hh != null ? I.hh : now.hh), mm = st.mm != null ? st.mm : (I.mm != null ? I.mm : now.mm);
    var dm = st.dm != null ? st.dm : now.m, dy = st.dy != null ? st.dy : now.y;
    var isToday = dd === now.d && dm === now.m && dy === now.y;
    var kTgl = dd + ' ' + BULAN[dm - 1];
    var dayDiff = isToday ? 0 : Math.max(1, Math.round((Date.UTC(now.y, now.m - 1, now.d) - Date.UTC(dy, dm - 1, dd)) / 864e5));
    var kF = isToday ? 1 : 1 - dayDiff * 0.0008;
    var tglTxt = (isToday ? 'Hari ini, ' : '') + dd + ' ' + BULAN[dm - 1] + ' ' + dy + ' · ' + p2(hh) + '.' + p2(mm);
    // alat bayar, mata uang, kurs
    var own = FM[fM] || [];
    var sameCur = fA && fL ? CURA.filter(function (c) { return c !== fA && BAL[fM + '|' + c + '|' + fL]; }).map(function (c) { return c + '@' + fL; }) : [];
    var payD = st.pay != null ? st.pay : (st.fA === undefined && I.pay ? I.pay : (sameCur[0] || 'luar'));
    var payOpts = ['luar'].concat(sameCur, payD !== 'luar' && !has(sameCur, payD) && fA && payD.split('@')[0] !== fA ? [payD] : []);
    var pay = has(payOpts, payD) ? payD : 'luar';
    var pc = pay === 'luar' ? null : pay.split('@')[0], pl = pay === 'luar' ? null : pay.split('@')[1];
    var curD = st.cur != null ? st.cur : ((asetInfo && asetInfo.quote) || 'IDR');
    var cur = pay !== 'luar' ? pc : curD;
    var rateOf = function (c) { return c === 'IDR' ? 1 : (ctx.rates[c] != null ? ctx.rates[c] : (AS[c] && AS[c].price != null ? AS[c].price : null)); };
    var hasAuto = cur === 'IDR' || rateOf(cur) != null;
    var rateAuto = cur === 'IDR' ? 1 : (rateOf(cur) != null ? rateOf(cur) * kF : null);
    var isCrypto = cur !== 'IDR' && ctx.rates[cur] == null && rateOf(cur) != null;
    var dC = cur === 'IDR' ? 0 : (isCrypto ? 6 : 2);
    var kvS = (st.kv !== undefined ? st.kv : I.kv) || '';
    var rate = kvS ? num(kvS) : (rateAuto == null ? 0 : rateAuto);
    var price = asetInfo && asetInfo.price != null ? asetInfo.price : null;
    var pDef = fA && price != null && rateAuto ? fmt(price * (fA === 'USDT' || fA === 'USD' ? 1 : kF) / rateAuto, dC) : '';
    var pv = st.pv != null ? st.pv : (st.fA === undefined && st.cur === undefined && I.pv ? I.pv : pDef);
    var pvn = bad(pv) ? '' : pv, pajn = bad(st.pajakV) ? '' : st.pajakV;
    var gross = (bad(q) ? 0 : num(q)) * (bad(pv) ? 0 : num(pv)), feeN = (bad(fee) ? 0 : num(fee)) || 0, pajN = num(pajn) || 0;
    var net = fJ === 'Jual' ? gross - feeN - pajN : gross + feeN + pajN; // pajak ikut total, seperti biaya (ledger.fees)
    var curTxt = function (n) { return cur === 'IDR' ? rp(n) : fmt(n, dC) + ' ' + cur; };
    var payBal = pay !== 'luar' ? (BAL[fM + '|' + pc + '|' + pl] || 0) : 0;
    var payErr = fJ === 'Beli' && pay !== 'luar' && net > payBal;
    var avgCur = st.cur != null ? st.cur : ((asetInfo && asetInfo.quote) || 'IDR');
    var recHas = !!fA && (FM[fR] || []).some(function (x) { return x[0] === fA && has(x[1], fKr); });
    var sheet = st.sheet === undefined ? (I.sheet || null) : st.sheet;
    // sheet cari aset
    var sq = st.sq || '', cat = st.cat || 'Semua';
    var haveA = function (n) { return base.some(function (b) { return b[0] === n; }) || ext.some(function (e) { return e[0] === n; }); };
    var okq = function (t) { return t.toLowerCase().indexOf(sq.toLowerCase()) >= 0; }, okc = function (c) { return cat === 'Semua' || c === cat; };
    var kat = ctx.catalog.filter(function (c) { return !haveA(c[0]) && okq(c[0] + ' ' + c[1]) && okc(c[2]); });
    var famMap = {};
    ctx.members.filter(function (m) { return m !== fM; }).forEach(function (m) { (FM[m] || []).forEach(function (x) { if (!haveA(x[0])) (famMap[x[0]] = famMap[x[0]] || []).push(m); }); });
    var fam = Object.keys(famMap).filter(function (n) { return okq(n) && okc((AS[n] || {}).cat); }).map(function (n) { return { n: n, f: 'Dipakai ' + famMap[n].join(', '), c: (AS[n] || {}).cat, unit: unitOf(n) }; });
    var cal = calendar(st, ctx, { d: dd, m: dm, y: dy });
    var payNote;
    if (pay === 'luar') payNote = fJ === 'Jual' ? 'Ke rekening atau tunai yang tidak dicatat.' : 'Dari rekening atau tunai yang tidak dicatat.';
    else if (payErr) payNote = 'Saldo ' + pc + ' di ' + pl + ' hanya ' + fmt(payBal, 8) + '. Kurangi jumlah atau pilih alat bayar lain.';
    else payNote = pc + ' di ' + pl + (fJ === 'Jual' ? ' bertambah ' : ' berkurang ') + fmt(net, dC) + (fJ === 'Jual' ? '.' : ', sisa ' + fmt(payBal - net, dC) + '.') + (pl !== fL ? ' Dibayar dari lokasi lain.' : '') + (isCrypto ? ' ' + pc + ' dianggap dijual seharga ' + rp(net * rate) + '.' : '');
    var needPrice = isTrade && !(num(pv) >= 0) || (isTrade && cur !== 'IDR' && !(rate > 0));
    var needQ = !(num(q) > 0) && !awal || (awal && !fA);
    var invalid = qErr || payErr; // tampilan tombol Simpan (aturan board): redup hanya bila saldo kurang atau bayar tidak cukup
    var feeNoPrice = isMove && hasFee && (st.fu || 'Rp') === 'Rp' && !(price > 0); // biaya Rupiah butuh harga aset untuk dipotong dari aset yang dipindah
    var incomplete = feeNoPrice || (isTrade && (needPrice || !(num(q) > 0))) || (!isTrade && !awal && !(num(q) > 0)) || (awal && (!fA || !fL || !(num(q) > 0))) || (isMove && !fKr) || (isMoveMem && !fR) || !fA || !fL;
    var miss = []; // yang belum diisi, untuk pesan di atas tombol Simpan dan garis merah (diketuk Simpan saat belum lengkap)
    if (!fA) miss.push('aset'); else if (!fL) miss.push('lokasi');
    if (!(num(q) > 0)) miss.push('jumlah');
    if (isTrade && !String(pv).trim()) miss.push('harga');
    if (isTrade && cur !== 'IDR' && !(rate > 0)) miss.push('kurs');
    if (isMove && !fKr) miss.push('lokasi tujuan');
    if (isMoveMem && !fR) miss.push('anggota penerima');
    if (feeNoPrice) miss.push('harga aset untuk biaya');
    // Galat penulisan angka (titik dan koma tertukar dll). Yang masih ragu (mungkin awal "1.000") baru ditandai sesudah kolom ditinggalkan atau Simpan diketuk.
    var nErr = {}, nBlur = st.nBlur || {}, A = root.HF && root.HF.angka;
    if (A) [['qv', st.qv], ['pv', st.pv], ['fee', st.fee], ['kv', st.kv], ['pajakV', st.pajakV], ['avg', st.avg]].forEach(function (f) {
      var g = f[1] ? A.analisis(f[1]).galat : null;
      if (g && g.jenis !== 'karakter' && (g.pasti || nBlur[f[0]] || st.tried)) nErr[f[0]] = { pesan: g.pesan, perbaiki: g.perbaiki };
    });
    var nErrAda = Object.keys(nErr).length;
    if (nErrAda) { invalid = true; miss.push('angka yang benar'); incomplete = true; }
    var valueText = fA && asetInfo ? (asetInfo.valText || (asetInfo.price != null ? rp(num(q) * asetInfo.price) : '—')) : '—';
    var qtyIdr = fA && asetInfo && asetInfo.price != null ? num(q) * asetInfo.price : null;
    var vm = {
      mulai: mulai, awal: awal, fJ: fJ, fP: fP, fM: fM, fA: fA, fL: fL, fK: fK, fKa: fKa, fKr: fKr, fR: fR, fS: fS, unit: unit, isTrade: isTrade, isIn: isIn, isOut: isOut, isMove: isMove, isMoveMem: isMoveMem, isMoveLok: isMove && fP === 'lokasi',
      q: q, pv: pv, fee: fee, hasFee: hasFee, cur: cur, pay: pay, payOpts: payOpts, pc: pc, pl: pl, kv: kvS || (rateAuto != null ? fmt(rateAuto, 0) : ''), kvManual: !!kvS && hasAuto, kvLive: !kvS && isToday && rateAuto != null && cur !== 'IDR',
      kvPad: kvS && hasAuto ? '48px' : '12px', kursNote: kvS ? 'Diisi manual' : (!hasAuto ? 'Isi sendiri, kurs otomatis belum tersedia' : (isToday ? 'Real-time · ' + p2(now.hh) + '.' + p2(now.mm) : 'Rata-rata ' + kTgl)),
      showKurs: cur !== 'IDR', rate: rate, kursManualFlag: !!kvS || !hasAuto,
      dd: dd, dm: dm, dy: dy, hh: hh, mm: mm, isToday: isToday, tglTxt: tglTxt, tglAwal: tglTxt.replace(/ · .*/, ''), tglBtn: 'Pakai ' + (isToday ? 'hari ini' : dd + ' ' + BULAN[dm - 1]) + ' · ' + p2(hh) + '.' + p2(mm),
      cal: cal, kTgl: kTgl,
      sheet: sheet, sq: sq, cat: cat, kat: kat, fam: fam,
      qErr: qErr, payErr: payErr, invalid: !!invalid, incomplete: !!incomplete, nErr: nErr, tried: !!st.tried, missing: miss, missOn: !!(st.tried && miss.length), missTxt: 'Lengkapi dulu: ' + miss.join(', ') + '.',
      qMiss: !!(st.tried && !(num(q) > 0)), pMiss: !!(st.tried && isTrade && !String(pv).trim()), kMiss: !!(st.tried && isTrade && cur !== 'IDR' && !(rate > 0)), bal: balTxt0, balTxt: qErr ? 'Melebihi saldo ' + fM + ' di ' + fL + ': ' + balTxt0 + ' ' + unit + '.' : 'Saldo ' + fM + ' di ' + fL + ': ' + (balTxt0 || '—') + ' ' + unit,
      showBalQ: (fJ === 'Jual' || isOut) && !!bal, payNote: payNote, payColor: payErr ? 'var(--loss)' : 'var(--ink-muted)',
      modeHint: awal ? 'Aset yang sudah Anda miliki. Bukan pembelian, jadi tidak memengaruhi untung-rugi.' : (isMoveMem ? 'Saldo pengirim berkurang, penerima bertambah. Lokasinya boleh berbeda.' : HINT[fJ]),
      payLabel: fJ === 'Jual' ? 'Hasilnya masuk ke' : 'Dibayar dengan', payMoreL: fJ === 'Jual' ? 'Ke aset lain…' : 'Aset lain…',
      byTitle: fJ === 'Jual' ? 'Hasil masuk ke aset lain' : 'Bayar dengan aset lain', byDesc: 'Aset milik ' + fM + ' di Hartafolio. Harga ikut aset yang dipilih.',
      curFree: pay === 'luar', curLocked: pay !== 'luar', curTabs: ['IDR', 'USD', 'USDT'], curSel: awal ? avgCur : cur,
      feeUnits: ['Rp', unit], feeUnit: st.fu || 'Rp', feeNote: feeNoPrice ? 'Harga ' + (fA || 'aset') + ' belum ada, jadi biaya Rupiah belum bisa dihitung. Pilih satuan ' + unit + ' atau isi harga di Kelola aset.' : ((st.fu || 'Rp') === 'Rp' ? 'Dalam Rupiah. Boleh nol.' : 'Dipotong dari aset yang dipindah.'),
      asalLabel: isOut ? 'Alasan' : 'Asal', asalList: isOut ? ['Hadiah', 'Sedekah', 'Ke dompet luar', 'Hilang', 'Lainnya'] : ['Hadiah', 'Warisan', 'Dari dompet luar', 'Lainnya'],
      showJenis: !awal, showAsal: (isIn || isOut) && !awal, showSaldoLink: !awal && (fJ === 'Beli' || isIn), showCari: canNew, showPlusLok: canNew,
      title: awal ? 'Saldo awal' : 'Catat transaksi', saveLabel: awal ? 'Simpan & selesai' : 'Simpan transaksi', hintMt: !awal ? '-6px' : '0px',
      showTotal: !isMoveMem, showTgl: !awal, qLabel: fA ? 'Jumlah (' + unit + ')' : 'Jumlah', pLabel: fA ? 'Harga per ' + unit : 'Harga per unit',
      anggotaLabel: 'Anggota', ownerLabel: isMoveMem ? 'Anggota' : 'Pemilik', fromTitle: isMoveMem ? 'Pengirim' : 'Dari', toTitle: isMoveMem ? 'Penerima' : 'Ke', keLokLabel: isMoveMem ? 'Lokasi penerima' : 'Lokasi tujuan',
      fromSum: fM + ' · ' + (fA || '—') + ' · ' + (fL || '—'), toSum: isMoveMem ? fR + ' · ' + fKr : fKr,
      minusTxt: '−' + q + ' ' + unit, plusTxt: '+' + q + ' ' + unit, recNote: recHas ? fKr : fKr + ' · posisi baru', famNote: hasFee ? 'Total harta turun sebesar biaya.' : 'Total harta keluarga tidak berubah.',
      totLabel: isTrade ? (fJ === 'Jual' ? 'Hasil bersih' : 'Total dibayar') : (isIn ? 'Nilai saat ini' : (isOut ? 'Nilai yang keluar' : 'Nilai harta')),
      totValue: nErrAda ? '—' : isTrade ? (cur === 'IDR' ? rp(net) : curTxt(net) + ' · ' + rp(net * rate)) : (isIn ? valueText : (isOut ? (qtyIdr != null ? '−' + rp(qtyIdr) : '—') : (hasFee ? '−Rp ' + fee : 'Tidak berubah'))),
      foto: st.foto || null, nota: st.nota || '', pajakOn: !!st.pajakOn, pajakV: st.pajakV || '', catatanV: st.catatanV || '', showRecorded: mulai === 'awal-lanjut', avg: st.avg || '',
      anggota: ctx.members, aset: fAs.map(function (x) { return x[0]; }), lokasi: fLs, keLokasi: isMoveMem ? ALL_LOC : toL, keAnggota: others,
      balColor: qErr ? 'var(--loss)' : 'var(--ink-muted)',
      catChips: ['Semua', 'Crypto', 'Saham', 'Emas', 'Mata uang'], byGroups: [
        { t: 'Mata uang di lokasi lain', note: 'Bila uangnya dipindah dulu, catat Pindah agar biaya transfer tercatat.', items: own.filter(function (x) { return has(CURA, x[0]); }).reduce(function (a, x) { return a.concat(x[1].filter(function (l) { return l !== fL && BAL[fM + '|' + x[0] + '|' + l]; }).map(function (l) { return { n: x[0] + ' · ' + l, s: 'Mata uang', b: fmt(BAL[fM + '|' + x[0] + '|' + l], 8) + ' ' + x[0], pay: x[0] + '@' + l }; })); }, []) },
        { t: 'Aset lain di ' + fL, note: 'Seperti tukar aset: aset pembayar dianggap dijual seharga pasar.', items: own.filter(function (x) { return !has(CURA, x[0]) && x[0] !== fA && has(x[1], fL) && BAL[fM + '|' + x[0] + '|' + fL]; }).map(function (x) { return { n: x[0] + ' · ' + fL, s: (AS[x[0]] || {}).cat || 'Aset', b: fmt(BAL[fM + '|' + x[0] + '|' + fL], 8) + ' ' + ((AS[x[0]] || {}).unit || ''), pay: x[0] + '@' + fL }; }) }
      ].filter(function (g) { return g.items.length; }),
      pCaps: { fromName: fM }
    };
    vm.payPills = payOpts.map(function (k) { return pill(k === 'luar' ? 'Di luar Hartafolio' : k.replace('@', ' · '), pay === k, k); });
    vm.gram = null;
    return vm;
  }

  /** Perubahan state ketika sebuah pilihan diketuk (dipakai layar dan diuji). */
  function reduce(st, action, v) {
    var P = {
      jenis: { fJ: v, qv: undefined, fS: undefined }, sub: { fP: v }, anggota: { fM: v, fA: null, fL: null, fR: null, fKa: null, qv: undefined },
      aset: { fA: v, fL: null, qv: undefined }, lokasi: { fL: v, fK: null, fKa: null }, ke: v && v.mem ? { fKa: v.l } : { fK: v && v.l }, keAnggota: { fR: v },
      asal: { fS: v }, pay: { pay: v, pv: undefined, kv: undefined }, cur: { cur: v, pv: undefined }, fu: { fu: v }
    };
    return Object.assign({}, st, P[action] || {});
  }

  var api = { view: view, reduce: reduce, calendar: calendar, fmt: fmt, num: num, rp: rp, BULAN: BULAN, BULAN_PENUH: BULAN_PENUH, PHYS: PHYS };
  root.HF = root.HF || {};
  root.HF.catat = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
