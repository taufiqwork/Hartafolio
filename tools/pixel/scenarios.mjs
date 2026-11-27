// Skenario perbandingan piksel: tiap board mockup dipasangkan dengan keadaan aplikasi yang sama.
// seed = isi data dev (localStorage); step = paksa langkah Setup (hanya mode dev); js = klik/ketik sesudah dimuat.
// Aturan: tiap layar baru WAJIB menambah skenario untuk semua state-nya di sini (lihat docs/REGRESSION.md).
import { SEEDS } from './real-seeds.mjs';
const A = (nama, rel, mgr, i) => ({ anggota_id: 'PM-00' + i, nama, hubungan: rel, is_pengelola: !!mgr, aktif: true });
const L = (nama, jenis, i) => ({ lokasi_id: 'LK-00' + i, nama, jenis, aktif: true });
const seed = (anggota, lokasi) => ({ pengaturan: {}, anggota: anggota || [], lokasi: lokasi || [] });

const AZLAN = [A('Azlan', 'Diri sendiri', true, 1)];
const TIGA = [A('Azlan', 'Diri sendiri', true, 1), A('M. Yahya', 'Anak', false, 2), A('Al Ghafiqi', 'Anak', false, 3)];
const BASE = [L('Binance', 'Exchange crypto', 1), L('Bybit', 'Exchange crypto', 2), L('Pluang', 'Aplikasi investasi', 3), L('Brankas', 'Simpanan fisik', 4)];

// kegagalan/penundaan server yang disuntikkan
const TAHAN = (nama) => `HF.api.call=(n,...a)=>n==='${nama}'?new Promise(()=>{}):orig(n,...a);`;
const GAGAL = (nama) => `HF.api.call=(n,...a)=>n==='${nama}'?Promise.reject(new Error('Service timed out')):orig(n,...a);`;


// Catat transaksi (?demo&mulai=...: data contoh dan keadaan awal sama dengan prop `mulai` board). Patch 2n: lihat deviasi di docs/CHANGELOG.
const CT = (id, mulai, extra) => Object.assign({ id: '04-Catat' + id, board: '04-Catat' + id, query: 'demo&mulai=' + mulai, hash: '#/catat' }, extra || {});
const TOMBOL_40 = [['width: auto; height: 44px; padding: 0; font: inherit', 'width: auto; height: 40px; padding: 0; font: inherit'], ['width: auto; height: 44px; font: inherit', 'width: auto; height: 40px; font: inherit'], ['right: 4px; top: 4px; width: 44px; height: 44px', 'right: 4px; top: 4px; width: 40px; height: 40px'], ['width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 12px', 'width: 40px; height: 40px; border: 1px solid var(--line); border-radius: 12px']];
const SCROLL = `document.querySelector('.hf-scroll').scrollTop = 99999;`;
const DEV_FOTO = []; // Pajak, catatan kini aktif; Lampirkan foto masih dimatikan tetapi tampil sama dengan board
export const catatScenarios = [
  CT('', 'beli'), CT('-2a-Jual', 'jual'), CT('-2b-Masuk', 'masuk'), CT('-2k-Keluar', 'keluar'), CT('-2m-Beli-Dari-Luar', 'beli-luar'),
  CT('-2o-Pilih-Alat-Bayar', 'bayar-lain'), CT('-2p-Bayar-Dengan-BTC', 'bayar-btc'), CT('-2q-Bayar-Dari-Bybit', 'bayar-bybit'),
  CT('-2r-Tanggal-Lalu', 'tanggal-lalu'), CT('-2s-Kurs-Manual', 'kurs-manual'),
  CT('-2n-Pilih-Tanggal', 'pilih-tanggal', { patch: TOMBOL_40 }),
  // putaran B dan C
  CT('-2c-Pindah', 'pindah'), CT('-2e-Pindah-Anggota', 'pindah-anggota'), CT('-2f-Pindah-Anggota-Beda-Lokasi', 'pindah-anggota-lokasi'),
  CT('-2d-Saldo-Awal', 'awal'), CT('-2g-Saldo-Awal-Lanjut', 'awal-lanjut'), CT('-2h-Cari-Aset', 'cari-aset'), CT('-2i-Lokasi-Baru', 'lokasi-baru'), CT('-2j-Aset-Manual', 'aset-manual')
];

// Animasi Catat: klik di board dan di aplikasi, bekukan pada T ms. Selektor berdasarkan teks tombol (sama di keduanya).
const KLIK = (txt) => `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(txt)}).click();`;
const CTF = (id, mulai, act, at) => ({ id: '04-Catat@' + id, board: '04-Catat' + (mulai === 'pilih-tanggal' ? '' : ''), query: 'demo&mulai=beli', hash: '#/catat', frames: { act, at } });
// Tiap board form digulir: tengah (400 px) dan dasar, supaya bagian di bawah lipatan layar ikut dibandingkan.
const FORM = [['', 'beli'], ['-2a-Jual', 'jual'], ['-2b-Masuk', 'masuk'], ['-2k-Keluar', 'keluar'], ['-2m-Beli-Dari-Luar', 'beli-luar'], ['-2p-Bayar-Dengan-BTC', 'bayar-btc'], ['-2q-Bayar-Dari-Bybit', 'bayar-bybit'], ['-2r-Tanggal-Lalu', 'tanggal-lalu'], ['-2s-Kurs-Manual', 'kurs-manual'],
  ['-2c-Pindah', 'pindah'], ['-2e-Pindah-Anggota', 'pindah-anggota'], ['-2f-Pindah-Anggota-Beda-Lokasi', 'pindah-anggota-lokasi'], ['-2d-Saldo-Awal', 'awal'], ['-2g-Saldo-Awal-Lanjut', 'awal-lanjut']];
const MID = `document.querySelector('.hf-scroll').scrollTop = 400;`;
export const catatScroll = FORM.flatMap(([id, mulai]) => [
  CT(id + '@tengah', mulai, { board: '04-Catat' + id, boardJs: MID, js: MID }),
  CT(id + '@bawah', mulai, { board: '04-Catat' + id, boardJs: SCROLL, js: SCROLL, deviasi: DEV_FOTO })]);
// Interaksi Catat: aksi yang sama dijalankan di board dan aplikasi (boardJs = js), lalu keduanya dibandingkan.
const SET = (sel, v) => `{const i=document.querySelector(${JSON.stringify(sel)});i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('input',{bubbles:true}));}await new Promise(r=>setTimeout(r,60));`;
const KLIKI = (txt) => `[...document.querySelectorAll('button')].find(b=>b.textContent.includes(${JSON.stringify(txt)})).click();await new Promise(r=>setTimeout(r,80));`;
const KLIKT = (txt) => KLIK(txt) + `await new Promise(r=>setTimeout(r,80));`;
const ACT = (id, board, mulai, act, extra) => CT(id, mulai, Object.assign({ board, boardJs: act, js: act }, extra || {}));
export const catatActions = [
  ACT('@x-jual-lebih-saldo', '04-Catat-2a-Jual', 'jual', SET('#jml', '99')),
  ACT('@x-keluar-lebih-saldo', '04-Catat-2k-Keluar', 'keluar', SET('#jml', '700')),
  ACT('@x-pindah-lebih-saldo', '04-Catat-2c-Pindah', 'pindah', SET('#jml', '9')),
  ACT('@x-bayar-tak-cukup', '04-Catat-2q-Bayar-Dari-Bybit', 'bayar-bybit', SET('#jml', '10')),
  ACT('@x-kurs-diketik', '04-Catat', 'beli', SET('#kurs', '16.100') + SCROLL, { deviasi: DEV_FOTO }),
  ACT('@x-kurs-reset', '04-Catat-2s-Kurs-Manual', 'kurs-manual', `document.querySelector('[aria-label="Kembali ke kurs otomatis"]').click();await new Promise(r=>setTimeout(r,80));` + SCROLL, { deviasi: DEV_FOTO }),
  ACT('@x-jenis-masuk-asal', '04-Catat-2b-Masuk', 'masuk', KLIK('Warisan')),
  ACT('@x-hari-dipilih', '04-Catat-2n-Pilih-Tanggal', 'pilih-tanggal', KLIKT('5'), { patch: TOMBOL_40 }),
  ACT('@x-jam-dipilih', '04-Catat-2n-Pilih-Tanggal', 'pilih-tanggal', `[...document.querySelectorAll('.hf-wheel')].filter(b=>b.textContent.trim()==='15')[0].click();await new Promise(r=>setTimeout(r,80));`, { patch: TOMBOL_40 }),
  ACT('@x-sekarang', '04-Catat-2n-Pilih-Tanggal', 'pilih-tanggal', KLIKT('Sekarang'), { patch: TOMBOL_40 }),
  ACT('@x-cari-bri', '04-Catat-2h-Cari-Aset', 'cari-aset', SET('#cariA', 'bri')),
  ACT('@x-cari-filter-saham', '04-Catat-2h-Cari-Aset', 'cari-aset', KLIK('Saham')),
  ACT('@x-cari-pilih-eth', '04-Catat-2h-Cari-Aset', 'cari-aset', KLIKI('Ethereum')),
  ACT('@x-cari-keluarga', '04-Catat-2h-Cari-Aset', 'cari-aset', KLIKT('Mata uang')),
  ACT('@x-lokasi-jenis-terbuka', '04-Catat-2i-Lokasi-Baru', 'lokasi-baru', `document.querySelector('.hf-select-btn').click();await new Promise(r=>setTimeout(r,120));`),
  ACT('@x-manual-jenis-crypto', '04-Catat-2j-Aset-Manual', 'aset-manual', `document.querySelector('.hf-select-btn').click();await new Promise(r=>setTimeout(r,80));[...document.querySelectorAll('[role=option]')].find(b=>b.textContent.includes('Crypto')).click();await new Promise(r=>setTimeout(r,120));`),
  ACT('@x-manual-satuan-oz', '04-Catat-2j-Aset-Manual', 'aset-manual', KLIK('oz')),
  ACT('@x-bayar-pilih-bybit', '04-Catat-2o-Pilih-Alat-Bayar', 'bayar-lain', KLIKI('USDT · Bybit')),
  ACT('@x-pindah-ke-lokasi-baru', '04-Catat-2c-Pindah', 'pindah', KLIKI('Lokasi') ),
  ACT('@x-awal-pilih-aset', '04-Catat-2d-Saldo-Awal', 'awal', KLIK('BTC') + KLIK('Bybit')),
  ACT('@x-beli-ganti-anggota', '04-Catat', 'beli', KLIK('Yumna')),
  ACT('@x-beli-lokasi-lain', '04-Catat', 'beli', KLIK('Bybit'))
];
// Boards foto dan pajak (dibuat 25 Nov, 05.u sampai 05.y). Keadaan awal = prop mulai board.
export const catatBukti = [['-2t-Foto-Pilih', 'foto-pilih', false], ['-2z-Foto-Kamera', 'foto-kamera', false], ['-2u-Foto-Terlampir', 'foto-terlampir', true], ['-2v-Foto-Gagal', 'foto-gagal', true], ['-2w-Pajak-Catatan', 'pajak-catatan', true], ['-2x-Pajak-Catatan-Terisi', 'pajak-terisi', true]]
  .map(([id, mulai, gulir]) => CT(id, mulai, gulir ? { boardJs: SCROLL, js: SCROLL, deviasi: [] } : {}));
// Toast foto di Beranda (boards Main-2s dan Main-2t, dibuat 25 Nov).
export const berandaFoto = [{ id: 'Main-2s-Foto-Gagal', board: 'Main-2s-Foto-Gagal', query: 'demo=foto-gagal' }, { id: 'Main-2t-Foto-Terunggah', board: 'Main-2t-Foto-Terunggah', query: 'demo=foto-terunggah' }];
export const catatLengkap = [CT('-2y-Belum-Lengkap', 'belum-lengkap', { boardJs: `document.querySelector('.hf-scroll').scrollTop = 300;`, js: `document.querySelector('.hf-scroll').scrollTop = 300;` })];
// Pajak dibuka: layar menggulir halus ke bawah (diukur setelah gulir selesai).
const BUKA_PAJAK = KLIK('Pajak, catatan') + `await new Promise(r=>setTimeout(r,900));`;
export const catatPajakGulir = [ACT('@x-pajak-gulir', '04-Catat-2u-Foto-Terlampir', 'foto-terlampir', SCROLL + BUKA_PAJAK)];
// Angka diformat otomatis dan galat penulisan (boards 3a sampai 3d, dibuat 25 Nov).
const GULIR300 = `document.querySelector('.hf-scroll').scrollTop = 300;`;
export const catatAngka = [['-3a-Angka-Format', 'angka-format'], ['-3b-Angka-Titik-Desimal', 'angka-titik'], ['-3c-Angka-Format-Inggris', 'angka-inggris'], ['-3d-Angka-Banyak-Koma', 'angka-koma']]
  .map(([id, mulai]) => CT(id, mulai, Object.assign({ boardJs: GULIR300, js: GULIR300 }, id === '-3a-Angka-Format' ? { deviasi: [{ box: [184, 712, 192, 32], alasan: 'Keputusan Ticon 27 Nov: nilai miliar ditulis "M" dan triliun "T" (board lama: 1.491.315.983,43 jt)' }] } : {})));
export const catatAsetAngka = [CT('-3e-Aset-Manual-Angka', 'aset-manual-angka')];

// Riwayat (?demo=<keadaan>#/riwayat: data contoh src/demo/riwayat-demo.js, keadaan awal sama dengan prop `mulai` board). Ubah dimatikan sampai putaran E.
const RW = (id, mulai, extra) => Object.assign({ id: '05-Riwayat' + id, board: '05-Riwayat' + id, query: 'demo=' + mulai, hash: '#/riwayat' }, extra || {});
const UBAH = { deviasi: [{ box: [16, 744, 176, 56], alasan: 'Tombol Ubah dimatikan: layar Ubah transaksi dibangun di putaran E' }] };
const RWF = (id, mulai, board, act, at, extra) => Object.assign({ id: '05-Riwayat@' + id, board, query: 'demo=' + mulai, hash: '#/riwayat', frames: { act, at } }, extra || {});
export const riwayatFrames = [
  RWF('buka-menu', 'default', '05-Riwayat', `document.querySelectorAll('.hf-chip')[1].click();`, [0, 100, 300]),
  RWF('buka-detail', 'default', '05-Riwayat', `document.querySelectorAll('.hf-detail[role=button]')[2].click();`, [0, 150, 400], UBAH),
  RWF('hapus', 'detail', '05-Riwayat-2b-Detail', `document.querySelector('.hf-btn-danger').click();`, [0, 150, 400]),
  RWF('pilih-filter', 'filter', '05-Riwayat-2a-Filter', `document.querySelectorAll('.hf-select-opt')[1].click();`, [0, 150, 400])
];
export const riwayat = [RW('', 'default'), RW('-2a-Filter', 'filter'), RW('-2b-Detail', 'detail', UBAH), RW('-2c-Terhapus', 'terhapus'), RW('-2d-Kosong', 'kosong'), RW('-2e-Daftar-Terhapus', 'daftar-terhapus'),
  RW('-2f-Tersimpan', 'tersimpan'), RW('-2g-Diubah', 'diubah'), RW('-2h-Detail-Zakat', 'detail-zakat', UBAH), RW('-2i-Detail-Pinjamkan', 'detail-pinjam', UBAH), RW('-2j-Detail-Cicilan', 'detail-cicilan', UBAH),
  RW('-2k-Detail-Pelunasan', 'detail-lunas', UBAH), RW('-2l-Detail-Pindah', 'detail-pindah', UBAH)];

export const catatFrames = [
  CTF('pilih-jual', 'beli', KLIK('Jual'), [0, 80, 150, 300]), CTF('pilih-aset-btc', 'beli', KLIK('BTC'), [0, 80, 150, 300]),
  CTF('buka-tanggal', 'beli', `document.querySelector('button.hf-input').click();`, [0, 100, 250, 450]),
  CTF('buka-bayar', 'beli', KLIK('Aset lain…'), [0, 100, 250, 450]), CTF('buka-aset', 'beli', KLIK('Aset lain'), [0, 100, 250, 450])
];

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
    js: `${GAGAL('apiSetupSelesai')}q('.su-foot [data-act=next]').click();await sleep(300);` },
  // Beranda tahap A (data contoh src/demo; kosong memakai data nyata tanpa transaksi)
  { id: 'Main', board: 'Main', query: 'demo' },
  { id: 'Main-2a-Per-Aset', board: 'Main-2a-Per-Aset', query: 'demo', js: `q('[data-act=mode][data-mode=aset]').click();await sleep(80);` },
  { id: 'Main-2b-Menu-Anggota', board: 'Main-2b-Menu-Anggota', query: 'demo', js: `q('[data-act=menu]').click();await sleep(80);` },
  { id: 'Main-2c-Satu-Anggota', board: 'Main-2c-Satu-Anggota', query: 'demo', js: `q('[data-act=menu]').click();await sleep(60);document.querySelectorAll('[data-act=opt]')[1].click();await sleep(80);` },
  // Beranda data nyata (tampilan akhir tanpa grafik, "dari bulan lalu", dan kartu Harga): data uji di tools/pixel/real-seeds.mjs
  { id: 'Main-2u-Data-Nyata', board: 'Main-2u-Data-Nyata', seed: SEEDS.awal, query: 'tanpa-dummy' },
  { id: 'Main-2v-Data-Nyata-Lonceng', board: 'Main-2v-Data-Nyata-Lonceng', seed: SEEDS.lonceng, query: 'tanpa-dummy', js: `q('[data-act=bell]').click();await sleep(300);` },
  { id: 'Main-2w-Data-Nyata-Tanpa-Kurs', board: 'Main-2w-Data-Nyata-Tanpa-Kurs', seed: SEEDS.tanpaKurs, query: 'tanpa-dummy' },
  { id: 'Main-2d-Kosong', board: 'Main-2d-Kosong', seed: { pengaturan: { setup_selesai: 'ya' }, anggota: AZLAN, lokasi: [L('Binance', 'Exchange crypto', 1)] } },
  { id: 'Main-2k-Banyak-Anggota', board: 'Main-2k-Banyak-Anggota', query: 'demo=banyak' },
  { id: 'Main-2l-Banyak-Sisanya', board: 'Main-2l-Banyak-Sisanya', query: 'demo=banyak', js: `document.querySelectorAll('[data-act=row]')[4].click();await sleep(80);` },
  { id: 'Main-2m-Satu-Anggota-Pilih', board: 'Main-2m-Satu-Anggota-Pilih', query: 'demo', js: `q('[data-act=menu]').click();await sleep(60);document.querySelectorAll('[data-act=opt]')[1].click();await sleep(60);document.querySelectorAll('[data-act=row]')[0].click();await sleep(80);` },
  { id: 'Main-2n-Per-Aset-Pilih', board: 'Main-2n-Per-Aset-Pilih', query: 'demo', js: `q('[data-act=mode][data-mode=aset]').click();await sleep(60);document.querySelectorAll('[data-act=row]')[0].click();await sleep(80);` },
  // Animasi Beranda: bekukan pada waktu tertentu setelah klik (board vs aplikasi). Selector kelas dipakai bersama oleh board dan aplikasi.
  { id: 'Main@sorot-baris', board: 'Main', query: 'demo', frames: { act: `document.querySelectorAll('.hf-legend')[1].click();`, at: [0, 80, 150, 300] } },
  { id: 'Main@tampilan-aset', board: 'Main', query: 'demo', frames: { act: `document.querySelector('button[aria-label="Per jenis aset"]').click();`, at: [0, 150, 400, 800, 1200] } },
  { id: 'Main@pilih-anggota', board: 'Main', query: 'demo', frames: { act: `document.querySelector('.hf-select-btn').click();await new Promise(r=>setTimeout(r,80));document.querySelectorAll('.hf-select-opt')[1].click();`, at: [0, 150, 400, 800, 1200] } },
  { id: 'Main@buka-menu', board: 'Main', query: 'demo', frames: { act: `document.querySelector('.hf-select-btn').click();`, at: [0, 100, 300] } },
  // Beranda tahap B (banner, lonceng, toast; keadaan awal dari data contoh)
  { id: 'Main-2e-Zakat-Hari-H', board: 'Main-2e-Zakat-Hari-H', query: 'demo=zakat-hari-h' },
  { id: 'Main-2f-Zakat-Terlambat', board: 'Main-2f-Zakat-Terlambat', query: 'demo=zakat-terlambat' },
  { id: 'Main-2g-Zakat-Mendekati', board: 'Main-2g-Zakat-Mendekati', query: 'demo=zakat-mendekati' },
  { id: 'Main-2h-Tersimpan', board: 'Main-2h-Tersimpan', query: 'demo=tersimpan' },
  { id: 'Main-2i-Perhatian', board: 'Main-2i-Perhatian', query: 'demo=perhatian' },
  { id: 'Main-2j-Perhatian-Kosong', board: 'Main-2j-Perhatian-Kosong', query: 'demo=perhatian-kosong' },
  { id: 'Main-2o-Piutang-Hari-H', board: 'Main-2o-Piutang-Hari-H', query: 'demo=piutang-hari-h' },
  { id: 'Main-2p-Piutang-Terlambat', board: 'Main-2p-Piutang-Terlambat', query: 'demo=piutang-terlambat' },
  { id: 'Main-2q-Zakat-Dan-Piutang', board: 'Main-2q-Zakat-Dan-Piutang', query: 'demo=zakat-dan-piutang' },
  { id: 'Main-2r-Perhatian-Zakat-Piutang', board: 'Main-2r-Perhatian-Zakat-Piutang', query: 'demo=perhatian-zakat-piutang' },
  { id: 'Main@buka-lonceng', board: 'Main', query: 'demo', frames: { act: `document.querySelector('.hf-iconbtn').click();`, at: [0, 100, 250, 450] } }
  ,...catatScenarios, ...catatScroll, ...catatActions, ...catatBukti, ...catatLengkap, ...catatAngka, ...catatAsetAngka, ...catatPajakGulir, ...berandaFoto, ...catatFrames, ...riwayat, ...riwayatFrames
];
