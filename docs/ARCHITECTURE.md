# ARCHITECTURE — fitur ada di berkas mana

Baca ini sekali, lalu kamu tahu berkas mana yang dibuka untuk satu bug atau fitur. **Perbarui di commit yang sama** saat struktur berubah. Dokumen yang diperbarui belakangan pasti basi.

## 1. Alur dari kode sampai layar

1. `src/engine/*.js`: JS murni, tanpa Google. Diuji di Node. Tiap berkas memasang dirinya di `HF.<nama>` dan tidak memakai `SpreadsheetApp`.
2. `src/gas/*.js`: lapisan Apps Script. Membaca/menulis Sheet dan memanggil engine lewat `HF`.
3. `src/web/`: HTML/CSS/JS tampilan. `tools/build.mjs` menggabungkannya jadi `dist/Index.html` (CSS, JS, font ditanam di dalam satu berkas, karena HtmlService tidak melayani berkas statis).
4. `npm run push` = build lalu `clasp push` dari `dist/`.

Urutan muat engine di Apps Script mengikuti abjad nama berkas (`engine_catalog`, `engine_dates`, …). Berkas yang butuh engine lain saat dimuat (`piutang`, `zakat`, `valuation`) hanya boleh bergantung pada berkas yang abjadnya lebih awal. Saat ini terpenuhi.

## 2. Fitur → berkas pemilik

| Fitur / area bug | Berkas | Yang diekspor / titik masuk |
|---|---|---|
| Format Rupiah, persen, gram, tanggal | `src/engine/format.js` | `HF.format` |
| Daftar kolom, tipe, pilihan, header, ID baru | `src/engine/schema.js` | `HF.schema` (`TABS`, `colNames`, `checkHeader`, `rowToObj`, `objToRow`, `nextId`, `newTrxId`) |
| Katalog 13 aset bawaan | `src/engine/catalog.js` | `HF.catalog` |
| Saldo, validasi, modal rata-rata | `src/engine/ledger.js` | `balances`, `rollup`, `validate`, `costBasis`, `effects`, `sortTrx` |
| Kurs beku | `src/engine/kurs.js` | `resolve`, `freeze` |
| Harga ke Rupiah, total 3 tingkat, untung/rugi | `src/engine/valuation.js` | `hargaIdr`, `nilai`, `persenKelas`, `untung` |
| Zakat emas dan perak | `src/engine/zakat.js` | `hitung` |
| Piutang (jadwal, status, penerimaan) | `src/engine/piutang.js` | `jadwal`, `terbayar`, `status`, `trxPinjam`, `trxTerima`, `validasiTerima` |
| Antrean offline | `src/engine/queue.js` | `enqueue`, `pending`, `settle`, `dedupe` |
| Tanggal (tambah bulan, akhir bulan) | `src/engine/dates.js` | `HF.dates` |
| Titik masuk web app | `src/gas/Code.js` | `doGet` (hanya menyajikan halaman) |
| Menu "Siapkan sheet", header terkunci, isi awal | `src/gas/Setup.js` | `onOpen`, `setupHartafolio`, `periksaStruktur` |
| Baca/tulis baris Sheet, batas grid, endpoint data | `src/gas/Repo.js` | `Repo_read_`, `Repo_append_`, `Repo_update_`, `Repo_ensureGrid_`, `apiState`, `apiTransaksiTambah`, `apiTransaksiUbah` |
| Boot: splash lalu Setup atau shell 5 tab, rute | `src/web/js/app.js` | IIFE; Setup bila `pengaturan.setup_selesai` bukan "ya" |
| Jembatan layar ke server (dan tiruan untuk `npm run dev`) | `src/web/js/api.js` | `HF.api.call(nama, ...args)` |
| Beranda: tampilan (kepala, total, kartu Pembagian harta, Harga terkini, kosong) | `src/web/screens/beranda.js` | `HF.berandaScreen.html/bind/overlays` (lembar lonceng dan toast) |
| Beranda: logika kartu (urutan, Sisanya, donut, sorotan, pilihan) dan pengingat (banner, lonceng) | `src/engine/beranda.js` | `HF.beranda.view`, `attention`, `fromState(state, {hariIni})` (kosong bila tanpa transaksi; data nyata dari ledger, valuation, zakat, piutang). Grafik, "dari Okt", dan kartu Harga di data nyata masih dummy sementara di `app.js` (`berandaNyata`, tanda `// DUMMY`) |
| Data contoh Beranda (bisa dihapus) | `src/demo/demo.js` | `HF.demo.get('' \| 'banyak')`; aktif dengan `?demo` atau `?demo=<keadaan>` (banyak, zakat-hari-h, zakat-terlambat, zakat-mendekati, piutang-hari-h, piutang-terlambat, zakat-dan-piutang, perhatian, perhatian-kosong, perhatian-zakat-piutang, tersimpan) |
| Catat: logika (vm, reduksi state, kalender, saldo, kurs) | `src/engine/catat.js` | `HF.catat.view(st, ctx, {mulai})`, `reduce`, `calendar` |
| Catat: data nyata → ctx, keadaan layar → baris Transaksi | `src/engine/catat-ctx.js` | `HF.catatCtx.fromState`, `toRows`, `nowOf` |
| Catat: markup form dan lembar | `src/web/screens/catat-view.js`, `catat-sheets.js` | `HF.catatView`, `HF.catatSheets` (form Lokasi baru dan Aset manual memakai `HF.setupForm`) |
| Catat: state, klik, pasang | `src/web/screens/catat.js` | `HF.catatScreen.mount(el, {ctx, mulai, onClose, onSave, onLokasi, onAset})` |
| Catat: simpan (antrean perangkat, kirim, data contoh hanya lokal) | `src/web/js/catat-save.js` | `HF.catatSave.submit/flush/pending` |
| Pembaruan DOM di tempat (transisi dan animasi tetap jalan) | `src/web/js/morph.js` | `HF.morph(el, html)` |
| Data contoh Catat (bisa dihapus) | `src/demo/catat-demo.js` | `HF.demo.catat()`; `?demo&mulai=beli\|jual\|masuk\|keluar\|pindah\|awal...` |
| Foto bukti: validasi dan pengecilan di perangkat | `src/web/js/foto.js` | `HF.foto.prepare/pilih` |
| Foto bukti: unggah ke Drive (izin `drive.file`) | `src/gas/Bukti.js` | `apiBuktiUnggah` |
| Aset buatan sendiri | `src/gas/Master.js` | `apiAsetTambah` |
| Setup: splash, langkah 1 Akun, 2 Anggota, 3 Lokasi, 4 Import (tahap 1; tombol unduh/pilih file mati sampai Tahap 8) | `src/web/screens/setup.js` | `HF.setup.mount`, `HF.setup.splash` |
| Form bersama tambah/ubah anggota dan lokasi (hfForm) | `src/web/screens/setup-form.js` | `HF.setupForm.render` |
| Tambah/ubah/hapus-lunak anggota dan lokasi, penanda Setup selesai | `src/gas/Master.js` | `apiAnggotaTambah/Ubah/Hapus`, `apiLokasiTambah/Ubah/Hapus`, `apiSetupSelesai` |
| Ikon | `src/web/js/icons.js` | `HF.icon(nama)` |
| Gaya shell | `src/web/css/shell.css` | tipis; gaya komponen **hanya** di `docs/design/` |
| Token dan komponen `.hf-*` | `docs/design/tokens.css`, `docs/design/bundle.css` | disalin ke `dist` oleh build |
| Uji komponen | `src/web/components.html`, `src/web/js/components.js` | `?page=components` |
| Perbandingan piksel board vs aplikasi | `tools/pixel/run.mjs`, `scenarios.mjs`, `diff.py` | `npm run pixel`; runtime board di `reference/mockups/runtime/` |
| Build | `tools/build.mjs` | daftar JS per halaman ada di komentar `<!-- @js:... -->` di `src/web/index.html` |

## 3. Satu jalur antar-bagian

- **Server ↔ layar**: hanya lewat fungsi `api*` di `Repo.js`. `apiState()` mengirim seluruh data; layar menghitung dengan engine yang sama (engine diinline ke `Index.html`). Penulisan selalu lewat `api*`, yang memvalidasi ulang.
- **Antar-engine**: lewat `HF.<nama>`. Jangan `require` silang di luar pola yang sudah ada.
- **Layar → data**: layar tidak menghitung sendiri. Saldo, nilai, zakat, piutang datang dari `HF.ledger`, `HF.valuation`, `HF.zakat`, `HF.piutang`.
- **Gaya**: layar tidak punya CSS sendiri. Butuh gaya baru = tambah komponen ke Design System dulu.

## 4. Rencana struktur untuk Tahap 4 (belum ada)

`app.js` hanya rute, boot, dan shell. Jangan menumpuk layar di sana. Aturan:

- `src/web/screens/setup.js` (sudah ada), `beranda.js`, dst.: **satu berkas per layar**. Berkas lewat sekitar 400 baris atau mencampur dua urusan = dipecah dulu.
- `app.js` tetap hanya rute dan shell.
- Tiap berkas baru ditambahkan ke daftar `<!-- @js:... -->` di `src/web/index.html`, kalau tidak, tidak ikut `dist/` dan layar kosong tanpa galat.
- Endpoint baru Tahap 4 (tambah anggota, tambah lokasi, simpan setelan) masuk `Repo.js` atau berkas `src/gas/` baru bila `Repo.js` mendekati 400 baris (sekarang 154).
- Setelah Tahap 4 jadi, perbarui tabel §2 di commit yang sama.

## 5. Area sensitif (wajib rencana dan persetujuan Ticon sebelum mengubah)

1. **`ledger.js`**: semua angka lain bergantung padanya.
2. **`zakat.js`**: aturan agama dan uang orang; salah hitung tidak kelihatan.
3. **`queue.js` + `apiTransaksiTambah`**: salah sedikit = transaksi dobel atau hilang.
4. **`schema.js` dan `Setup.js`**: mengubah kolom pada Sheet yang sudah dipakai keluarga bisa merusak data mereka. Perubahan kolom butuh `versi_skema` naik dan jalur migrasi.
5. **`Repo.js` penulisan**: kunci dokumen, idempoten, hapus-lunak.

## 6. Kesehatan berkas (cek tiap akhir tahap, 2 menit)

```bash
find src tools tests -name '*.js' -o -name '*.mjs' | xargs wc -l | sort -rn | head
git log --since="30 days ago" --name-only --pretty=format: | grep '^src/' | sort | uniq -c | sort -rn | head
```
Satu berkas jauh di atas 400 baris atau mendominasi perubahan = jadwalkan dipecah di tugas berikutnya.
