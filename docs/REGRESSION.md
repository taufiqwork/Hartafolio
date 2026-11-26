# REGRESSION — yang tidak boleh rusak

Jalankan daftar ini **sebelum bilang "selesai"** pada tahap apa pun. Satu cek gagal = belum selesai. Tunjukkan hasilnya ke Ticon, jangan hanya menulis "sudah dicek".

Aturan main:
- Klaim "beres" harus punya bukti: keluaran `npm test`, angka hasil ukur, atau diff.
- Yang tidak bisa dicek otomatis (klik di HP, tampilan di Google sungguhan) ditulis **"BELUM TERVERIFIKASI, minta Ticon cek"**. Jangan pasang perbaikan buta lalu bilang beres.
- Probe sementara (console.log, alert) boleh dipasang untuk uji, lalu dihapus. Pastikan bersih: `grep -rn "console.log\|debugger" src/`.

## 1. Selalu dijalankan (otomatis)

```bash
npm test
```
Harus: semua lulus, jumlahnya tidak berkurang dari sebelumnya (sekarang 44). Jumlah uji turun = ada uji yang dihapus, tanyakan kenapa.

```bash
npm run build
```
Harus: berhasil dan `dist/` berisi `Index.html`, `Components.html`, `Code.js`, `Repo.js`, `Setup.js`, `appsscript.json`, dan `engine_*.js`.

## 2. Hitungan inti (dijaga uji di `tests/`)

Perubahan di `src/engine/` wajib menambah atau memperbarui uji, bukan hanya lolos uji lama.

- [ ] **Saldo** per anggota × aset × lokasi benar untuk Beli, Jual, Masuk, Keluar, Pindah, Saldo awal. Jual melebihi saldo ditolak. Uji: `tests/ledger.test.js`.
- [ ] **Hapus = status "dihapus"**, baris tidak hilang, tidak ikut dihitung. Uji: "baris dihapus diabaikan".
- [ ] **Zakat hanya emas dan perak**: nisab 85 g / 595 g, haul 354 hari, tarif 2,5%, per anggota per logam. USDT dan saham tidak dihitung. Emas yang dipinjamkan tidak dihitung. Uji: 8 uji zakat di `tests/engine.test.js`.
- [ ] **Kurs dibekukan** per transaksi; manual menang atas otomatis. Uji: "kurs: hari ini live…".
- [ ] **Piutang tidak mengurangi total harta**; cicilan paling lama dilunasi dulu; "terlambat" dihitung, tidak disimpan. Uji: 4 uji piutang.
- [ ] **Antrean offline tidak menggandakan transaksi**: `trx_id` sama dikirim dua kali = satu baris. Uji: "antrean offline…" dan "apiTransaksiTambah: idempoten…".

## 3. Lapisan Google Sheet

Diuji dengan Sheet tiruan di `tests/gas.test.js`. Sheet tiruan **meniru batas grid Google (1000 baris × 26 kolom)**. Jangan longgarkan batas itu.

- [ ] Siapkan sheet membuat 11 tab, dua kali jalan tidak menggandakan apa pun (Pengaturan 7 baris sejak 24 Nov 2026, Aset tetap).
- [ ] Header salah = menolak baca dan tulis (data tidak rusak diam-diam).
- [ ] Setiap tulis di luar grid didahului `Repo_ensureGrid_`.
- [ ] Penulisan lewat `api*` di server, yang memvalidasi ulang.

**Terverifikasi di Google sungguhan pada 24 Nov 2026** (Sheet uji milik Ticon): Siapkan sheet menghasilkan 11 tab urut benar, Aset 13 baris, Pengaturan 8 baris, Transaksi 28 kolom; dijalankan dua kali tidak dobel; "Header Hartafolio" terlindungi di tab Transaksi.

**Masih BELUM TERVERIFIKASI di Google:** `doGet`, `apiState`, `apiTransaksiTambah`, `apiTransaksiUbah`, menu Periksa struktur, penguncian di tab selain Transaksi. Ulangi cek di atas setiap kali `Setup.js`, `Repo.js`, atau `schema.js` berubah.

## 4. Layar harus identik dengan mockup

Aturan Ticon: tidak ada beda kecil. Tiap layar yang selesai:

- [ ] **`npm run pixel` lulus untuk semua skenario** (perbandingan piksel penuh board vs aplikasi, 390×844 @1x). Terukur 24 Nov 2026: 17 state Setup dan Simpan ke Sheet, 0 piksel beda (2 dengan penyimpangan tercatat: tombol Import dimatikan). Layar atau state baru tanpa skenario = belum selesai.
- [ ] Buka board mockupnya di artifact (nama board ada di `docs/MOCKUPS.md`), **termasuk state kosong, error, menu terbuka, toast, sheet**.
- [ ] **Teks disalin dari mockup, bukan diketik ulang** (satu contoh nyata di proyek lain: panjang sandi diketik 8, mockup menulis 12). Bandingkan tiap kalimat.
- [ ] **Ukur, bukan lihat**: buka layar di `npm run dev`, baca nilai nyata dari halaman (ukuran, jarak, warna, radius, font) dan cocokkan dengan nilai di mockup. Jangan menilai dari tangkapan layar. Cantumkan angkanya di laporan: berapa elemen diukur, berapa yang beda.
- [ ] **Elemen yang digambar mockup sebagai garis harus berupa elemen**, bukan `border-top` (border tidak punya kotak, tidak bisa diukur).
- [ ] **Ikon berupa `<svg>` nyata**, bukan CSS mask.
- [ ] **Tidak ada gaya inline per layar**. Komponen baru masuk `docs/design/design-system.md` dan `docs/design/bundle.css`.
- [ ] Angka gaya Indonesia: "Rp 174,2 jt", "Rp 2.380.000", koma desimal, minus asli "−". Kategori: Emas, Perak, Crypto, Saham, Mata uang. Tanpa emoji dan tanda seru.
- [ ] Mockup dan dokumen teks bentrok = ikuti mockup, lalu **laporkan** ke Ticon. Keadaan yang tidak digambar mockup = **tanya, jangan menebak**.
- [ ] Layar punya banyak jalan masuk (mis. Harga terkini dibuka dari Beranda dan Zakat): sebut tiap jalan masuk di laporan, tandai yang belum dicoba "BELUM TERVERIFIKASI".

Yang tidak bisa saya cek sendiri di Google Apps Script: tampilan di HP sungguhan dan di dalam sandbox HtmlService. Tandai "BELUM TERVERIFIKASI".

## 4b. Setup (Tahap 4), tiap perubahan di `setup*.js`, `Master.js`, atau `api.js`
Dijalankan di `npm run dev` (ukuran 390×844) dan dibandingkan dengan `reference/mockups/png/01-Setup-*.png`:
- [ ] Langkah 1, 2 (kosong dan 3 anggota), 3 (kosong dan 4 lokasi) sama dengan mockup. Terukur 24 Nov 2026: posisi dan tinggi tiap elemen sama sampai piksel (bar, kartu, daftar, garis pemisah, chip, tombol, footer).
- [ ] Form (tambah anggota, hubungan terbuka, ubah lokasi, jenis terbuka): sheet, kolom, daftar pilihan, tombol sama dengan mockup **setelah animasi selesai** (`document.getAnimations().forEach(a => a.finish())`; tanpa itu angka meleset 24px karena animasi masuk).
- [ ] **Kecepatan:** dengan `HF.api.call` ditunda 4 detik, simpan anggota, tambah cepat lokasi, dan "Lewati, mulai dari nol" mengubah tampilan dalam <100 ms; kegagalan server membatalkan perubahan dan memunculkan kartu notice sesuai board 18.a sampai 18.e (`19-Simpan*`): baris "Menyimpan…" dengan ikon putar dan tombol ubah redup; form dibuka lagi dengan notice, isian tetap, tombol "Coba lagi"; nama ganda "Nama sudah dipakai"; Tambah cepat gagal dan Lewati gagal (kembali ke langkah 4). Terukur 24 Nov 2026: 41 sampai 62 ms.
- [ ] Memilih hubungan/jenis tidak menggambar ulang sheet (nama yang diketik tidak hilang).
- [ ] Nama ganda ditolak server; Pengelola tetap "Diri sendiri" dan tidak bisa dihapus; hapus = aktif "tidak"; muat ulang tetap melanjutkan dari langkah terakhir.
- [ ] Langkah 4 (tahap Pilih file): kartu dua langkah, pemisah, footer, 3 tanda di bar sama dengan `01-Setup-4a-Belum-Pilih.png`; "Lewati, mulai dari nol" mengisi `setup_selesai` dan membuka shell.
- [ ] Uji server: `tests/gas.test.js` (anggota, lokasi, hapus, Setup selesai).

Belum terukur: tahap Periksa/Lengkapi/Simpan Import (belum dibangun) dan mode gelap (alat baru memotret mode terang).

## 4c. Beranda (Tahap 4A)
- [ ] `npm run pixel`: Main, 2a, 2b, 2c, 2d, 2k, 2l, 2m, 2n = 0 piksel beda (terukur 25 Nov 2026).
- [ ] `npm test`: `tests/beranda.test.js` (urutan terbesar, Sisanya, sorotan, kosong tanpa transaksi).
- [ ] **Animasi** sama dengan board: 4 skenario `frames` (`Main@sorot-baris`, `@tampilan-aset`, `@pilih-anggota`, `@buka-menu`; 17 frame) = 0 piksel beda. Terbukti alat mendeteksi: kode lama yang menggambar ulang kartu gagal di 80 ms (donut).
- [ ] Menyorot baris hanya mengubah gaya lingkaran (transisi); mengganti tampilan memutar ulang sapuan donut dan baris naik; membuka menu tidak menyentuh yang lain. Hitung naik di total tidak mengulang.
- [ ] Tanpa `?demo` dan tanpa transaksi = Beranda kosong; dengan `?demo` = data contoh. Data contoh tidak pernah menulis ke Sheet.
- [ ] Tanpa `?demo` dan dengan transaksi = Beranda dari data nyata (`HF.beranda.fromState`): total sama dengan jumlah aset x harga yang diisi, aset tanpa harga muncul di lonceng, banner zakat dan piutang dari data. Setelah Setup gagal simpan lalu dibuka lagi, Beranda yang telat tiba tidak boleh menimpa Setup (skenario piksel `19-Simpan-2d-Gagal-Lewati`).
- [ ] **Tahap B** `npm run pixel`: Main-2e, 2f, 2g, 2h, 2i, 2j, 2o, 2p, 2q, 2r + animasi `Main@buka-lonceng` = 0 piksel beda (terukur 25 Nov 2026). Seluruh suite: 57 perbandingan, 0 gagal.
- [ ] Banner: zakat menang atas piutang; piutang yang kalah tetap ada di lonceng. Angka lonceng merah (`is-loss`) bila zakat atau piutang terlambat.

## 4d. Catat (Tahap 5 A sampai C), tiap perubahan di `catat*.js`, `morph.js`, `catat-save.js`, `catat-demo.js`
- [ ] `npm run pixel`: semua skenario `04-Catat*` (19 board, 28 gulir, 22 interaksi, 5 animasi) = 0 piksel beda. Deviasi sah: tombol Pajak, catatan dimatikan (`DEV_FOTO`), board 2n memakai `patch` 44 ke 40 px.
- [ ] `npm test`: `tests/catat.test.js` (total sama dengan board, saldo kurang, bayar tidak cukup, kalender, data nyata, baris lolos `ledger.validate`, bayar lokasi lain diblokir, data contoh tidak pernah memanggil server).
- [ ] Data contoh (`?demo`) tidak pernah ke Sheet. Data nyata: baris masuk antrean (`hf-queue`) lalu `apiTransaksiTambah`; `trx_id` tetap.
- [ ] Foto: skenario 2t, 2u, 2v = 0 piksel beda; `apiBuktiUnggah` diuji (folder sekali, tautan di `bukti`). Izin tetap `drive.file`, jangan melebar ke `drive`.
- [ ] Pembaruan layar di tempat (`HF.morph`): mengetik tidak menghilangkan fokus; animasi lembar hanya memutar saat lembar baru muncul.

## 5. Data dan aturan produk

- [ ] Tidak ada hapus fisik data, tidak ada purge otomatis.
- [ ] Tidak ada fitur di luar mockup. Piutang hanya ke orang luar.
- [ ] Transaksi tetap satu-satunya sumber kebenaran. Saldo, nilai, snapshot, zakat dihitung engine, tidak disimpan sebagai angka mandiri.
- [ ] Hanya Pengelola yang login.

## Catatan jebakan
Daftar jebakan lengkap ada di `CLAUDE.md` bagian "Jebakan". Tambahkan di sana tiap kali menemukan yang baru.
