const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {};
['format', 'schema', 'catalog', 'populer', 'ledger', 'valuation', 'piutang', 'zakat', 'beranda', 'kelola'].forEach((f) => require('../src/engine/' + f + '.js'));
const K = globalThis.HF.kelola, C = globalThis.HF.catalog;

const T = (o) => Object.assign({ status: 'aktif', anggota_id: 'PM-001', lokasi_id: 'LK-001', jam: '09:00', sumber: 'manual' }, o);
function state(extra) {
  const aset = C.all().concat([{ aset_id: 'AS-X1', simbol: 'GFI2', nama: 'Emas perhiasan', kelas: 'Emas', bentuk: 'Fisik', satuan: 'gram', mata_uang_harga: 'IDR', sumber_harga: 'manual', kunci_manual: true, status: 'aktif' }]);
  return Object.assign({
    aset, anggota: [{ anggota_id: 'PM-001', nama: 'Azlan', aktif: true }], lokasi: [{ lokasi_id: 'LK-001', nama: 'Brankas', aktif: true }], piutang: [],
    transaksi: [
      T({ trx_id: 'A', jenis: 'Saldo awal', tanggal: '2026-05-01', aset_id: 'AS-PAXG', jumlah: 2 }),
      T({ trx_id: 'B', jenis: 'Saldo awal', tanggal: '2026-06-01', aset_id: 'AS-ETH', jumlah: 1 }),
      T({ trx_id: 'C', jenis: 'Keluar', tanggal: '2026-08-20', aset_id: 'AS-ETH', jumlah: 1 })
    ],
    harga: { terakhir: { 'AS-PAXG': { harga: 3650, mata_uang: 'USD', status: 'ok', waktu: '2026-11-28 10:00' }, 'AS-X1': { harga: 1900000, mata_uang: 'IDR', status: 'manual', waktu: '2026-11-02 09:00' } },
      kursSeries: [{ waktu: '2026-11-28 10:00', harga: 16250 }] }
  }, extra || {});
}
const by = (d, id) => d.A.find((r) => r.id === id);

test('fromState: dimiliki, terjual habis, belum dimiliki, harga otomatis dalam Rp, harga manual dengan tanggal', () => {
  const d = K.fromState(state());
  const paxg = by(d, 'AS-PAXG');
  assert.equal(paxg.own, true); assert.equal(paxg.auto, true); assert.equal(paxg.b, 'Rp 59.312.500'); assert.equal(K.sub(paxg), 'per token · otomatis');
  const eth = by(d, 'AS-ETH');
  assert.equal(eth.own, false); assert.equal(eth.sold, 'terjual habis Agu 2026'); assert.equal(eth.n, 2); assert.equal(K.sub(eth), 'per ETH · otomatis · terjual habis Agu 2026');
  const btc = by(d, 'AS-BTC'); assert.equal(btc.n, 0); assert.equal(K.sub(btc), 'per BTC · otomatis · belum dimiliki'); assert.equal(btc.perlu, false); assert.equal(btc.b, ''); // belum dimiliki: tidak perlu harga
  const s2 = state(); s2.transaksi.push(T({ trx_id: 'Q', jenis: 'Saldo awal', tanggal: '2026-10-01', aset_id: 'AS-BTC', jumlah: 1 }));
  const btc2 = by(K.fromState(s2), 'AS-BTC'); assert.equal(btc2.perlu, true); assert.equal(btc2.b, 'Perlu diisi'); // dimiliki tanpa harga
  assert.equal(by(d, 'AS-USD').b, 'Rp 16.250'); assert.equal(K.sub(by(d, 'AS-USD')), 'Dolar AS · otomatis · belum dimiliki');
  const x1 = by(d, 'AS-X1'); assert.equal(K.sub(x1), 'per gram · diisi 2 Nov · belum dimiliki'); assert.equal(x1.b, 'Rp 1.900.000');
  assert.equal(by(d, 'AS-IDR').perlu, false);
});

test('aturan hapus: dimiliki -> tolak; terjual habis dengan riwayat -> sembunyikan; tanpa riwayat -> hapus', () => {
  const d = K.fromState(state());
  assert.equal(K.hapusKeputusan(by(d, 'AS-PAXG')), 'tolak');
  assert.equal(K.hapusKeputusan(by(d, 'AS-ETH')), 'sembunyikan');
  assert.equal(K.hapusKeputusan(by(d, 'AS-ANTM')), 'hapus');
  assert.match(K.cekStatus({ a: 'PAXG', own: true, n: 3 }, 'aktif', 'hapus'), /masih dimiliki/);
  assert.match(K.cekStatus({ a: 'ETH', own: false, n: 2 }, 'aktif', 'hapus'), /Sembunyikan saja/);
  assert.equal(K.cekStatus({ a: 'ETH', own: false, n: 2 }, 'aktif', 'sembunyikan'), '');
  assert.equal(K.cekStatus({ a: 'ANTM', own: false, n: 0 }, 'aktif', 'hapus'), '');
});

test('piutang berjalan dan transaksi yang sudah dihapus tetap dihitung: tidak boleh disembunyikan/dihapus', () => {
  const s = state({ piutang: [{ aset_id: 'AS-ETH', status: 'berjalan' }] });
  assert.equal(by(K.fromState(s), 'AS-ETH').own, true);
  const s2 = state(); s2.transaksi.push(T({ trx_id: 'D', jenis: 'Saldo awal', tanggal: '2026-09-01', aset_id: 'AS-ANTM', jumlah: 1, status: 'dihapus' }));
  const antm = by(K.fromState(s2), 'AS-ANTM'); assert.equal(antm.n, 1); assert.equal(K.hapusKeputusan(antm), 'sembunyikan');
});

test('tersembunyi dan dihapus keluar dari daftar; katalog menawarkan yang belum ada atau sudah dihapus (BNB hanya di katalog)', () => {
  const s = state(); s.aset.find((a) => a.aset_id === 'AS-ETH').status = 'tersembunyi'; s.aset.find((a) => a.aset_id === 'AS-ANTM').status = 'dihapus';
  const d = K.fromState(s);
  assert.equal(by(d, 'AS-ETH'), undefined); assert.equal(by(d, 'AS-ANTM'), undefined);
  assert.deepEqual(d.HID.map((r) => r.id), ['AS-ETH']);
  assert.deepEqual(d.KAT.map((k) => k.n).sort(), ['ANTM', 'BNB']);
  assert.deepEqual(K.katalog(d, 'bn', 'Semua').map((k) => k.n), ['BNB']);
  assert.deepEqual(K.katalog(d, '', 'Saham').map((k) => k.n), ['ANTM']);
});

test('list: kelompok per jenis, "Lainnya" memuat jumlah tersembunyi, pemberitahuan harga untuk aset yang perlu diisi', () => {
  const s0 = state(); s0.transaksi.push(T({ trx_id: 'Q', jenis: 'Saldo awal', tanggal: '2026-10-01', aset_id: 'AS-BTC', jumlah: 1 }));
  const d = K.fromState(s0), l = K.list(d);
  assert.equal(l.groups[l.groups.length - 1].t, 'Lainnya'); assert.equal(l.groups[l.groups.length - 1].rows[0].b, '0');
  assert.ok(l.need > 0);
  assert.ok(l.groups.find((g) => g.t === 'Crypto').rows.some((r) => r.bad));
});

test('cekUbah dan namaSimpan: nama kosong, manual tanpa harga, otomatis tanpa sumber; " fisik" tidak ikut disimpan', () => {
  const r = { canAuto: false, punyaHarga: false, unit: 'gram' };
  assert.equal(K.cekUbah(r, { nama: ' ', otomatis: false, harga: '1' }), 'Nama aset wajib diisi.');
  assert.equal(K.cekUbah(r, { nama: 'A', otomatis: true }), 'Aset ini tidak punya sumber harga otomatis.');
  assert.equal(K.cekUbah(r, { nama: 'A', otomatis: false, harga: '' }), 'Isi harga per gram.');
  assert.equal(K.cekUbah(Object.assign({}, r, { punyaHarga: true }), { nama: 'A', otomatis: false, harga: '' }), '');
  assert.equal(K.namaSimpan({ id: 'AS-EMAS', a: 'Emas fisik', nama: 'Emas' }, 'Emas Antam fisik'), 'Emas Antam');
  assert.equal(K.namaSimpan({ id: 'AS-X1', a: 'Emas perhiasan', nama: 'Emas perhiasan' }, 'Perhiasan'), 'Perhiasan');
});

test('patch: ubah, sembunyikan, tampilkan, hapus, katalog, manual mengubah salinan, bukan data asli', () => {
  const d = K.fromState(state()), ix = (id) => d.A.findIndex((r) => r.id === id), jumlah = d.A.length;
  const u = K.patch(d, 'ubah', { i: ix('AS-PAXG'), nama: 'PAXG', otomatis: false, harga: '3.700.000' }, '2026-11-28');
  assert.equal(u.A[ix('AS-PAXG')].auto, false); assert.equal(u.A[ix('AS-PAXG')].b, 'Rp 3.700.000'); assert.equal(u.A[ix('AS-PAXG')].diisi, 'diisi 28 Nov');
  assert.equal(d.A[ix('AS-PAXG')].auto, true); // asli utuh
  const s = K.patch(d, 'sembunyikan', { i: ix('AS-ETH') });
  assert.equal(s.A.length, jumlah - 1); assert.equal(s.HID[0].hidNote, 'Terjual habis Agu 2026 · 2 transaksi');
  const t = K.patch(s, 'tampilkan', { i: 0 }); assert.equal(t.A.length, jumlah); assert.equal(t.HID.length, 0);
  assert.equal(K.patch(d, 'hapus', { i: ix('AS-ANTM') }).A.length, jumlah - 1);
  const k = K.patch(d, 'katalog', { id: 'AS-BNB' }); assert.equal(k.A.length, jumlah + 1); assert.ok(!k.KAT.some((x) => x.id === 'AS-BNB'));
  const m = K.patch(d, 'manual', { nama: 'Emas perhiasan', kelas: 'Emas', satuan: 'gram', harga: '1.900.000' }, '2026-11-28');
  assert.equal(m.A[m.A.length - 1].b, 'Rp 1.900.000');
});

test('sheet: ubah (otomatis/manual), hapus tiga jalur, tersembunyi, tambah dan saldo', () => {
  const g = require('../src/demo/kelola-demo.js') && globalThis.HF.kelolaDemo.get('ubah-otomatis'), d = g.data;
  let S = K.sheet(d, g.ui); assert.equal(S.title, 'Ubah BTC'); assert.equal(S.fields2[0].l, 'Harga otomatis sekarang'); assert.equal(S.fields2[0].v, 'Rp 1.452.000.000 per BTC'); assert.equal(S.optDef, 0);
  S = K.sheet(d, Object.assign({}, g.ui, { opt: 1 })); assert.equal(S.fields2[0].l, 'Harga manual per BTC (Rp)'); assert.equal(S.fields2[0].v, '1.452.000.000');
  const h = (n) => K.sheet(d, { sheet: 'hapus', sel: d.A.findIndex((r) => r.a === n) });
  assert.equal(h('PAXG').title, 'PAXG belum bisa dihapus'); assert.deepEqual(h('PAXG').lines[0], ['Saldo', '0,74 token · 4 anggota']);
  assert.equal(h('ETH').primary.l, 'Sembunyikan dari daftar'); assert.equal(h('SOL').title, 'Hapus SOL?'); assert.equal(h('SOL').primary.danger, true);
  const gf = K.sheet(d, { sheet: 'ubah', sel: d.A.findIndex((r) => r.a === 'GFI') }); assert.equal(gf.primary.l, 'Simpan harga'); assert.equal(gf.fields2[0].l, 'Harga manual per lembar (US$)');
  assert.equal(K.sheet(d, { sheet: 'tersembunyi', hid: 1 }).primary.l, 'Tampilkan Emas UBS lagi');
  assert.equal(K.sheet(d, { sheet: 'tambah', pk: 'Saham' }).picker.sections[0].items.map((x) => x.n).join(), 'ANTM,TLKM'); // data contoh tanpa daftar populer: hanya katalog
});

test('urutan jenis dari nilai terbesar (aturan proyek), bukan urutan tetap', () => {
  const s = state(); s.transaksi.push(T({ trx_id: 'Z', jenis: 'Saldo awal', tanggal: '2026-09-01', aset_id: 'AS-X1', jumlah: 1000 })); // emas perhiasan 1000 g x 1,9 jt
  const d = K.fromState(s); assert.equal(d.order[0], 'Emas');
  s.transaksi.push(T({ trx_id: 'Y', jenis: 'Saldo awal', tanggal: '2026-09-01', aset_id: 'AS-IDR', jumlah: 5e10 }));
  assert.equal(K.fromState(s).order[0], 'Mata uang');
});

test('picker Tambah aset (data nyata): populer per jenis tanpa yang sudah ada; pencarian menyaring, mencatat yang sudah ada, dan gagal jadi pemberitahuan', () => {
  const d = K.fromState(state()), P = globalThis.HF.populer, ids = (x) => x.sections.reduce((a, s) => a.concat(s.items.map((i) => i.n)), []);
  const semua = K.picker(d, { pk: 'Semua' }); assert.equal(semua.chips.join(), 'Semua,Crypto,Saham,Emas,Perak,Mata uang');
  assert.ok(ids(semua).length >= 10 && ids(semua).length <= 40);
  const cr = K.picker(d, { pk: 'Crypto' }); assert.equal(cr.sections[cr.sections.length - 1].t, 'Crypto populer');
  assert.ok(!ids(cr).includes('BTC') && !ids(cr).includes('USDT') && ids(cr).includes('XRP')); // yang sudah di daftar tidak ditawarkan
  const urut = K.picker(d, { pk: 'Crypto', urut: ['solana', 'ripple'] }).sections.find((x) => x.t === 'Crypto populer'); assert.deepEqual(urut.items.slice(0, 2).map((i) => i.n), ['SOL', 'XRP']); // urutan hidup dari nilai pasar; BNB ada di katalog, bukan di sini
  const sa = K.picker(d, { pk: 'Saham' }), cs = sa.sections.find((s) => s.t === 'Saham populer'); assert.ok(cs.items.length > 10 && cs.items.length <= 20 && cs.items.every((i) => i.c === 'Saham'));
  assert.equal(K.picker(d, { pk: 'Mata uang' }).sections.slice(-1)[0].items.length >= 15, true);
  // pencarian: daftar tetap dan hasil jaringan digabung; PAXG sudah ada dan disebut di catatan
  const hasil = [{ key: 'coingecko:kinesis-gold', n: 'KAU', f: 'Kinesis Gold · peringkat 120', c: 'Emas' }, { key: 'coingecko:pax-gold', n: 'PAXG', f: 'PAX Gold', c: 'Emas' }, { key: 'coingecko:goldfish-gold', n: 'GGBR', f: 'Goldfish Gold', c: 'Crypto' }];
  const p = K.picker(d, { q: 'gold', pk: 'Semua', hasil: hasil }); assert.equal(p.sections[0].t, 'Hasil pencarian · harga otomatis');
  assert.deepEqual(p.sections[0].items.map((i) => i.n).sort(), ['GGBR', 'KAU', 'XAUM']); // PAXG disembunyikan: sudah ada; XAUM dari daftar tetap, KAU dari jaringan
  assert.match(p.note, /sudah ada di daftar/);
  assert.deepEqual(K.picker(d, { q: 'gold', pk: 'Crypto', hasil: hasil }).sections[0].items.map((i) => i.n), ['GGBR']);
  const g = K.picker(d, { q: 'pepe', pk: 'Crypto', cariGagal: true }); assert.equal(g.sections.length, 0); assert.match(g.notice.t, /belum tersambung/); assert.equal(g.notice.act, 'Coba lagi');
  assert.equal(K.picker(d, { q: 'pepe', pk: 'Crypto', cariGagal: true, hasil: [{ key: 'coingecko:pepe', n: 'PEPE', f: 'Pepe', c: 'Crypto' }] }).notice, null);
  assert.ok(P.TANGGAL);
});

test('Ubah token crypto: Jenis aset (Crypto, Emas, Perak), setara gram hanya untuk Emas dan Perak, wajib diisi; lainnya tetap tampil Jenis tanpa pilihan', () => {
  const s = state(); const d = K.fromState(s), i = d.A.findIndex((r) => r.simbol === 'BTC');
  let S = K.sheet(d, { sheet: 'ubah', sel: i });
  assert.deepEqual(S.fields.map((f) => f.l), ['Nama', 'Jenis aset', 'Satuan']); assert.deepEqual(S.fields[1].seg, ['Crypto', 'Emas', 'Perak']); assert.equal(S.fields[1].v, 'Crypto');
  assert.match(S.fields[1].hint, /Zakat yang sudah dibayar tidak berubah/);
  S = K.sheet(d, { sheet: 'ubah', sel: i, kelas: 'Emas' });
  assert.deepEqual(S.fields.map((f) => f.l), ['Nama', 'Jenis aset', 'Setara gram per token', 'Satuan']); assert.equal(S.fields[2].v, '');
  const r = d.A[i];
  assert.match(K.cekUbah(r, { nama: 'BTC', otomatis: true, kelas: 'Emas', gram: '' }), /setara gram/); assert.equal(K.cekUbah(r, { nama: 'BTC', otomatis: true, kelas: 'Emas', gram: '1' }), '');
  assert.equal(K.cekUbah(r, { nama: 'BTC', otomatis: true, kelas: 'Crypto' }), '');
  const n = K.patch(d, 'ubah', { i: i, nama: 'BTC', otomatis: true, kelas: 'Emas', gram: '1' }, '2026-11-28'); assert.equal(n.A[i].kelas, 'Emas'); assert.equal(d.A[i].kelas, 'Crypto');
  const fisik = d.A.findIndex((x) => x.simbol === 'EMAS' || x.a === 'Emas fisik'); assert.deepEqual(K.sheet(d, { sheet: 'ubah', sel: fisik }).fields.map((f) => f.l), ['Nama', 'Jenis', 'Satuan']);
});
