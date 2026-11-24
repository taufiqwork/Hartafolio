// Skenario perbandingan piksel: tiap board mockup dipasangkan dengan keadaan aplikasi yang sama.
// seed = isi data dev (localStorage); step = paksa langkah Setup (hanya mode dev); js = klik/ketik sesudah dimuat.
// Aturan: tiap layar baru WAJIB menambah skenario untuk semua state-nya di sini (lihat docs/REGRESSION.md).
const A = (nama, rel, mgr, i) => ({ anggota_id: 'PM-00' + i, nama, hubungan: rel, is_pengelola: !!mgr, aktif: true });
const L = (nama, jenis, i) => ({ lokasi_id: 'LK-00' + i, nama, jenis, aktif: true });
const seed = (anggota, lokasi) => ({ pengaturan: {}, anggota: anggota || [], lokasi: lokasi || [] });

const AZLAN = [A('Azlan', 'Diri sendiri', true, 1)];
const TIGA = [A('Azlan', 'Diri sendiri', true, 1), A('M. Yahya', 'Anak', false, 2), A('Al Ghafiqi', 'Anak', false, 3)];
const BASE = [L('Binance', 'Exchange crypto', 1), L('Bybit', 'Exchange crypto', 2), L('Pluang', 'Aplikasi investasi', 3), L('Brankas', 'Simpanan fisik', 4)];

// kegagalan/penundaan server yang disuntikkan
const TAHAN = (nama) => `HF.api.call=(n,...a)=>n==='${nama}'?new Promise(()=>{}):orig(n,...a);`;
const GAGAL = (nama) => `HF.api.call=(n,...a)=>n==='${nama}'?Promise.reject(new Error('Service timed out')):orig(n,...a);`;

export const scenarios = [
  { id: '00-Splash', board: '00-Splash', hold: true },
  { id: '01-Setup-1-Akun', board: '01-Setup-1-Akun', seed: seed(), step: 1 },
  { id: '01-Setup-2a-Kosong', board: '01-Setup-2a-Kosong', seed: seed(), step: 2 },
  { id: '01-Setup', board: '01-Setup', seed: seed(TIGA), step: 2 },
  { id: '01-Setup-2b-Hubungan-Terbuka', board: '01-Setup-2b-Hubungan-Terbuka', seed: seed(TIGA), step: 2,
    js: `q('[data-act=add]').click();await sleep(80);type('Yumna');await pick('Anak');await open();` },
  { id: '01-Setup-3a-Kosong', board: '01-Setup-3a-Kosong', seed: seed(AZLAN), step: 3 },
  { id: '01-Setup-3-Lokasi', board: '01-Setup-3-Lokasi', seed: seed(AZLAN, BASE), step: 3 },
  { id: '01-Setup-3b-Ubah', board: '01-Setup-3b-Ubah', seed: seed(AZLAN, BASE), step: 3,
    js: `document.querySelectorAll('.su-edit')[1].click();await sleep(80);` },
  { id: '01-Setup-3c-Pintasan', board: '01-Setup-3c-Pintasan', seed: seed(AZLAN, BASE), step: 3,
    js: `q('[data-act=quick][data-nama=Bank]').click();await sleep(120);` },
  { id: '01-Setup-3d-Lokasi-Lain', board: '01-Setup-3d-Lokasi-Lain', seed: seed(AZLAN, BASE), step: 3,
    js: `q('[data-act=add]').click();await sleep(80);type('Tokopedia Emas');await pick('Emas digital');` },
  { id: '01-Setup-3e-Jenis-Terbuka', board: '01-Setup-3e-Jenis-Terbuka', seed: seed(AZLAN, BASE), step: 3,
    js: `document.querySelectorAll('.su-edit')[1].click();await sleep(80);await open();` },
  { id: '01-Setup-4a-Belum-Pilih', board: '01-Setup-4a-Belum-Pilih', seed: seed(AZLAN, [L('Binance', 'Exchange crypto', 1)]), step: 4,
    deviasi: [{ box: [72, 298, 288, 50], alasan: 'Template tabel dimatikan (Ticon 24 Nov, Import dibangun Tahap 8)' }, { box: [72, 431, 288, 50], alasan: 'Pilih file template dimatikan' }] },
  // Simpan ke Sheet (flow 18)
  { id: '19-Simpan', board: '19-Simpan', seed: seed(AZLAN), step: 2,
    js: `${TAHAN('apiAnggotaTambah')}q('[data-act=add]').click();await sleep(80);type('Yumna');await pick('Anak');q('[data-act=fm-save]').click();await sleep(120);` },
  { id: '19-Simpan-2a-Gagal-Form', board: '19-Simpan-2a-Gagal-Form', seed: seed(AZLAN), step: 2,
    js: `${GAGAL('apiAnggotaTambah')}q('[data-act=add]').click();await sleep(80);type('Yumna');await pick('Anak');q('[data-act=fm-save]').click();await sleep(200);` },
  { id: '19-Simpan-2b-Nama-Ganda', board: '19-Simpan-2b-Nama-Ganda', seed: seed(AZLAN), step: 2,
    js: `q('[data-act=add]').click();await sleep(80);type('Azlan');await pick('Anak');q('[data-act=fm-save]').click();await sleep(200);` },
  { id: '19-Simpan-2c-Gagal-Tambah-Cepat', board: '19-Simpan-2c-Gagal-Tambah-Cepat', seed: seed(AZLAN, [L('Binance', 'Exchange crypto', 1), L('Brankas', 'Simpanan fisik', 2)]), step: 3,
    js: `${GAGAL('apiLokasiTambah')}q('[data-act=quick][data-nama=Pluang]').click();await sleep(200);` },
  { id: '19-Simpan-2d-Gagal-Lewati', board: '19-Simpan-2d-Gagal-Lewati', seed: seed(AZLAN, [L('Binance', 'Exchange crypto', 1)]), step: 4,
    deviasi: [{ box: [72, 426, 288, 50], alasan: 'Template tabel dimatikan' }, { box: [72, 559, 288, 50], alasan: 'Pilih file template dimatikan' }],
    js: `${GAGAL('apiSetupSelesai')}q('.su-foot [data-act=next]').click();await sleep(300);` }
];
