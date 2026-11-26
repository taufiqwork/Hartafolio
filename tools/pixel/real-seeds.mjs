// Data uji untuk Beranda dari data nyata (bukan data keluarga). Dipakai skenario piksel dan pembuat board (data board = hasil mesin yang sama).
const T = (o) => Object.assign({ status: 'aktif', jam: '09:00', sumber: 'manual', tanggal: '2026-11-10', anggota_id: 'PM-001', lokasi_id: 'LK-001', dibuat_pada: '2026-11-10 09:00' }, o);
const PM = [{ anggota_id: 'PM-001', nama: 'Azlan', hubungan: 'Diri sendiri', is_pengelola: true, aktif: true }, { anggota_id: 'PM-002', nama: 'Yumna', hubungan: 'Anak', is_pengelola: false, aktif: true }];
const LK = [{ lokasi_id: 'LK-001', nama: 'Binance', jenis: 'Exchange crypto', aktif: true }, { lokasi_id: 'LK-002', nama: 'Brankas', jenis: 'Simpanan fisik', aktif: true }, { lokasi_id: 'LK-003', nama: 'Pluang', jenis: 'Aplikasi investasi', aktif: true }];
const KURS = [{ waktu: '2026-11-26 09:00', harga: 16420 }];
const H = (extra) => ({ terakhir: Object.assign({ 'AS-EMAS': { harga: 2380000, mata_uang: 'IDR' }, 'AS-PERAK': { harga: 46600, mata_uang: 'IDR' }, 'AS-USDT': { harga: 1, mata_uang: 'USD' } }, extra), kursSeries: KURS });
const base = (o) => Object.assign({ pengaturan: { setup_selesai: 'ya' }, serverWaktu: '2026-11-26 10:00', anggota: PM, lokasi: LK, piutang: [], zakatBayar: [] }, o);

export const SEEDS = {
  // Bulan pertama, semua aset berharga (Harga diisi). Tampilan akhir: tanpa grafik, "dari bulan lalu", dan kartu Harga.
  awal: base({ harga: H({ 'AS-PAXG': { harga: 72658500, mata_uang: 'IDR' } }), transaksi: [
    T({ trx_id: 'a', jenis: 'Saldo awal', aset_id: 'AS-PAXG', jumlah: 0.5, harga_beli_rata2: 60000000 }),
    T({ trx_id: 'b', jenis: 'Saldo awal', aset_id: 'AS-EMAS', jumlah: 8, lokasi_id: 'LK-002', harga_beli_rata2: 2000000 }),
    T({ trx_id: 'c', jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 50, lokasi_id: 'LK-002', harga_beli_rata2: 40000 }),
    T({ trx_id: 'd', jenis: 'Saldo awal', aset_id: 'AS-USDT', jumlah: 312, anggota_id: 'PM-002' })] }),
  // Tab Harga kosong: PAXG memakai harga Beli terakhir, GFI belum punya harga.
  lonceng: base({ harga: H({}), transaksi: [
    T({ trx_id: 'a', jenis: 'Beli', aset_id: 'AS-PAXG', jumlah: 0.5, harga_per_unit: 72658500, harga_mata_uang: 'IDR', biaya: 0 }),
    T({ trx_id: 'b', jenis: 'Saldo awal', aset_id: 'AS-EMAS', jumlah: 8, lokasi_id: 'LK-002', harga_beli_rata2: 2000000 }),
    T({ trx_id: 'c', jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 50, lokasi_id: 'LK-002', harga_beli_rata2: 40000 }),
    T({ trx_id: 'd', jenis: 'Saldo awal', aset_id: 'AS-USDT', jumlah: 312, anggota_id: 'PM-002' }),
    T({ trx_id: 'e', jenis: 'Saldo awal', aset_id: 'AS-GFI', jumlah: 3.7, lokasi_id: 'LK-003' })] }),
  // Belum ada kurs dolar: hanya Rupiah dan logam, jadi "$ —".
  tanpaKurs: base({ harga: { terakhir: { 'AS-EMAS': { harga: 2380000, mata_uang: 'IDR' }, 'AS-PERAK': { harga: 46600, mata_uang: 'IDR' } }, kursSeries: [] }, transaksi: [
    T({ trx_id: 'b', jenis: 'Saldo awal', aset_id: 'AS-EMAS', jumlah: 8, lokasi_id: 'LK-002', harga_beli_rata2: 2000000 }),
    T({ trx_id: 'c', jenis: 'Saldo awal', aset_id: 'AS-PERAK', jumlah: 50, lokasi_id: 'LK-002', harga_beli_rata2: 40000 }),
    T({ trx_id: 'd', jenis: 'Saldo awal', aset_id: 'AS-IDR', jumlah: 5000000, lokasi_id: 'LK-002', anggota_id: 'PM-002' })] })
};
