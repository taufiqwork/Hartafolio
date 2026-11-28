const test = require('node:test');
const assert = require('node:assert/strict');
global.HF = {};
['format', 'schema', 'catalog', 'ledger', 'valuation', 'piutang', 'zakat', 'beranda', 'kelola'].forEach((f) => require('../src/engine/' + f + '.js'));
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
  const btc = by(d, 'AS-BTC'); assert.equal(btc.n, 0); assert.equal(K.sub(btc), 'per BTC · otomatis · belum dimiliki'); assert.equal(btc.perlu, true); assert.equal(btc.b, 'Perlu diisi');
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
  const d = K.fromState(state()), l = K.list(d);
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
