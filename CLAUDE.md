# Hartafolio — panduan untuk Claude Code

Kamu membangun **Hartafolio**: pelacak portofolio multi-aset untuk keluarga, UI berbahasa Indonesia. Klien: Irfan. Developer/desainer: Ticon (Rahmat Taufiqurrahman). **Selalu balas Ticon dalam bahasa Indonesia.** Desain sudah selesai dan disetujui klien; tugasmu membangun kode yang **identik dengan mockup dan prototype**.

## Arsitektur (sudah diputuskan, jangan tanya ulang)
- **Web app Google Apps Script + Google Sheet.** Dibuka di browser HP dan laptop. Tidak ada server pusat, biaya server Rp 0.
- **Model "template salinan":** satu master template (Sheet + Apps Script + tampilan web). Tiap keluarga menyalinnya lewat link "Buat salinan" ke akun Google sendiri; data terpisah per akun.
- **Logika inti di library Apps Script pusat**; tiap salinan hanya pembungkus tipis yang memanggil library. Perbaikan dirilis sekali, pengguna menekan "perbarui".
- Hanya **Pengelola** yang login (akun Google). Anggota keluarga tidak login; mereka hanya menerima laporan.
- Database: Google Sheet di Drive pengguna, satu tab per tabel, tab penting dikunci. **Transaksi adalah satu-satunya sumber kebenaran**; saldo, nilai, snapshot, zakat dihitung engine.
- Harga: trigger terjadwal beberapa kali sehari, disimpan dengan sumber dan waktu; bisa ditimpa manual. Snapshot: trigger bulanan (draf otomatis, dikunci setelah diperiksa).
- Offline: transaksi dicatat di perangkat (antrean), dikirim dengan `trx_id` yang sama saat online, tidak boleh dobel.
- Target jadwal: 24 hari kerja, 3 Nov–4 Des 2026. Garansi bug 30 hari. Serah terima: master template, akses kode, panduan setup, video singkat.

## Struktur kode yang disarankan
```
src/engine/    JS murni (tanpa SpreadsheetApp): saldo, nilai, kurs, zakat, haul, piutang, impor. Diuji di Node (node:test), dipakai juga di Apps Script.
src/gas/       Lapisan Apps Script: akses Sheet, trigger, doGet, endpoint ke UI, harga.
src/web/       HTML/CSS/JS tampilan (HtmlService). Token dan komponen dari docs/design/.
tests/         Uji engine (angka zakat, kurs, saldo, piutang, duplikat offline).
docs/          Dokumen ini.
```
Deploy dengan `clasp` (Ticon login sendiri: `clasp login`; kamu tidak bisa login Google untuk dia). Pisahkan engine murni dari SpreadsheetApp supaya bisa diuji tanpa Google.

## Aturan kerja Ticon (wajib)
1. **UI harus sama persis dengan mockup hi-fi** (lalu prototype). Tidak ada perbedaan kecil. Bila ada yang tidak jelas, lihat `reference/mockups/png/` dan `docs/design/design-system.md`, lalu tanya.
2. **Perubahan UI masuk ke Design System.** Komponen baru atau aturan baru dicatat di `docs/design/design-system.md` dan CSS di `docs/design/bundle.css`; jangan menulis gaya inline per layar.
3. **Pertanyaan adalah pertanyaan, bukan perintah.** Jawab/nilai dulu; jangan langsung membangun.
4. Setiap putaran kerja dicatat singkat di `docs/CHANGELOG.md` (apa berubah, kenapa).
5. Piutang hanya ke orang luar (peminjam diketik sebagai nama); jangan tambah fitur di luar mockup.
6. Salinan teks UI persis dari mockup (bahasa Indonesia, tanpa emoji/tanda seru). Angka gaya Indonesia: koma desimal, titik ribuan, "Rp 174,2 jt" ringkas, "Rp 2.380.000" di form; minus asli "−".
7. Kategori aset ditulis **Emas, Perak, Crypto, Saham, Mata uang** ("Crypto", bukan "Kripto"). Urutan daftar kategori selalu dari nilai terbesar.
8. Jangan menghapus fisik data; hapus = status "dihapus", bisa dipulihkan. Jangan bangun purge otomatis (jendela retensi belum diputuskan).
9. Jangan menerbitkan prototype klien atau mengubah artifact desain; itu urusan Ticon di sesi desain.

## Sumber kebenaran dan urutan prioritas
**Bila ada bentrok, mockup hi-fi menang.** Di sanalah Ticon bereksperimen dan menetapkan apa yang dipakai. Urutan: (1) mockup hi-fi, (2) prototype, (3) design-system.md, (4) DATA_MODEL.md, (5) draf riset v1. Bila kamu menemukan bentrok antara mockup dan dokumen teks, ikuti mockup, lalu **laporkan** ke Ticon supaya dokumennya diperbaiki di sesi desain.
- `reference/mockups/`: **299 board hi-fi, semua state tiap alur** (PNG + sumber). Indeks: `docs/MOCKUPS.md`. Lihat PNG layar terkait sebelum membangun tiap layar, termasuk state kosong, error, menu terbuka, toast, dan sheet.
- `reference/prototype/`: prototype klik yang disetujui klien (hanya sebagian state; 69 layar). Jalankan lewat server statis (`python3 -m http.server`, buka `index.html`).
- `docs/design/design-system.md`: **baca penuh sebelum membangun UI.** Token, tipografi, komponen, aturan perilaku, spek build (zakat, kurs, impor, Catat, piutang, notifikasi). `docs/design/tokens.css` (token) dan `docs/design/bundle.css` (komponen `.hf-*`).
- `docs/DATA_MODEL.md`: model data v2 (sudah disesuaikan dengan desain akhir). `docs/riset/struktur-data-v1.md`: draf awal 3 Nov, hanya pembanding.
- `docs/SCREENS.md`: daftar layar phone. `docs/BUILD_PLAN.md`: urutan build. `docs/LINKS.md`: tautan desain online milik Ticon.

## Keputusan produk penting (ringkas; detail di design-system.md)
- **Zakat hanya emas dan perak** (fisik dan digital, termasuk token PAXG/XAUT dan ETF emas/perak). Uang, saham, crypto lain tidak dihitung. Nisab 85 g emas dan 595 g perak, haul 354 hari, tarif 2,5%, per anggota per logam. Ini menggantikan aturan awal "uang digabung nisab emas" di draf riset.
- **Catat transaksi** = Beli, Jual, Masuk, Keluar, Pindah, Saldo awal. Zakat dan piutang bukan jenis di Catat: punya layar sendiri, tetapi hasilnya otomatis tampil di Riwayat sebagai Zakat, Pinjamkan, Cicilan diterima, Pelunasan diterima.
- **Piutang** (Alat › Piutang): aset dipinjamkan ke orang luar, ditagih dalam aset yang sama; pemberi pinjaman = anggota pemilik aset (selalu disebut); sekali bayar atau cicilan; tanpa bunga/denda; piutang tidak mengurangi total harta; selama dipinjamkan emas/perak itu tidak dihitung zakat.
- **Kurs ke Rupiah** dibekukan per transaksi (`kurs`, `kurs_sumber`, `kurs_tanggal`, `kurs_waktu`); ikuti spek "kurs ke Rupiah" di design-system.md persis.
- **Import hanya dari template Hartafolio**; ekspor satu sheet, dua mode (Ringkasan | Data lengkap).

## Perintah proyek
- `npm test` uji engine (Node 20+). `npm run build` membangun `dist/`. `npm run dev` melayani `dist/` di localhost:8080.
- Deploy ke Apps Script: salin `.clasp.json.example` menjadi `.clasp.json` (isi scriptId), `clasp login`, lalu `npm run push`.
