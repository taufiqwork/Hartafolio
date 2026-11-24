# Hartafolio — panduan untuk Claude Code

> **Mulai dari `docs/STATUS.md`** (apa yang sudah selesai, keputusan, langkah berikutnya). Tahap 0–3 selesai; lanjutkan dari Tahap 4.
> **Baca bersama:** `docs/ARCHITECTURE.md` (fitur ada di berkas mana) dan `docs/REGRESSION.md` (yang tidak boleh rusak; jalankan sebelum bilang "selesai").

Kamu membangun **Hartafolio**: pelacak portofolio multi-aset untuk keluarga, UI berbahasa Indonesia. Klien: Irfan. Developer/desainer: Ticon (Rahmat Taufiqurrahman). **Selalu balas Ticon dalam bahasa Indonesia, dengan bahasa chat yang sederhana dan mudah dipahami orang awam.** Hindari istilah teknis; kalau terpaksa, jelaskan dengan satu kalimat. Langkah yang harus Ticon jalankan diberikan satu per satu. Desain sudah selesai dan disetujui klien; tugasmu membangun kode yang **identik dengan mockup dan prototype**.

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
1. **UI harus sama persis dengan mockup hi-fi** (lalu prototype). Tidak ada perbedaan kecil. Bila ada yang tidak jelas, lihat mockup di artifact (tautan di `docs/LINKS.md`; folder `reference/mockups/png/` hanya cadangan bila ada) dan `docs/design/design-system.md`, lalu tanya.
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
- **Mockup hi-fi (artifact, tautan di `docs/LINKS.md`)**: 299 board, semua state tiap alur. Indeks nama board: `docs/MOCKUPS.md`. Buka artifact (Artifact read atau panel artifact) dan lihat board layar terkait sebelum membangun tiap layar, termasuk state kosong, error, menu terbuka, toast, dan sheet. `reference/mockups/` (PNG + sumber) hanya salinan cadangan dan boleh tidak ada.
- **Prototype klik** (artifact, tautan di `docs/LINKS.md`): disetujui klien, hanya sebagian state (69 layar). Cadangan lokal di `reference/prototype/` bila ada.
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
- Deploy ke Apps Script: salin `.clasp.json.example` menjadi `.clasp.json` (isi scriptId), `npx clasp login`, nyalakan Apps Script API di script.google.com/home/usersettings (sekali), lalu `npm run push`. Bila `push` berkata "Skipping push" (manifest berubah, tidak ada yang menjawab konfirmasi), jalankan `npx clasp push --force`.

## Anti-regresi (wajib; tujuannya berhenti "tambal kiri, bocor kanan")
1. **Jalankan `docs/REGRESSION.md` sebelum bilang selesai.** Ada yang gagal = belum selesai. Tunjukkan hasilnya.
2. **Bukti dulu, baru klaim.** Bukti = keluaran uji, angka hasil ukur, atau diff. Bukan "seharusnya begitu".
3. **Yang tidak bisa dicek otomatis** (tampilan di Google sungguhan, klik di HP) ditulis **"BELUM TERVERIFIKASI, minta Ticon cek"**. Jangan pasang perbaikan buta lalu bilang beres.
4. **Satu fitur stabil = satu commit** di cabang. Perbaikan yang merusak: bandingkan dengan commit sehat (`git diff <commit>`), jangan menambal di atasnya.
5. **Area sensitif wajib rencana dulu dan persetujuan Ticon sebelum mengubah kode:** `ledger.js`, `zakat.js`, antrean offline (`queue.js` dan `apiTransaksiTambah`), skema dan `Setup.js` (mengubah kolom Sheet yang sudah dipakai), penulisan di `Repo.js`. Daftar lengkap: `docs/ARCHITECTURE.md` §5.
6. **Mockup bentrok dengan dokumen, atau ada state yang tidak digambar mockup: tanya Ticon, jangan menebak.** Kumpulkan semua pertanyaan jadi satu pesan sebelum mulai membangun layar. Beda yang disengaja dari mockup dicatat beserta alasannya di CHANGELOG.

## Perbandingan piksel (wajib, otomatis, tanpa menunggu perintah Ticon)
Tiap kali membangun sebuah layar, **bandingkan piksel dengan board mockup untuk SEMUA state-nya** sebelum bilang selesai, lalu perbaiki sampai sama. Ticon sudah menetapkan ini (24 Nov 2026); jangan menunggu diminta.
- Cara: tambahkan skenario tiap state ke `tools/pixel/scenarios.mjs` (board, data, klik), lalu `npm run pixel`. Alat me-render board asli dari `reference/mockups/src` dan aplikasi pada 390×844 @1x, membandingkan piksel, dan menulis gambar selisih ke `.pixel/out/`. Lulus = 0 piksel beda (batas 0,3% hanya untuk derau antialias).
- **Animasi juga dibandingkan**, bukan hanya hasil akhir: skenario ber-`frames` mengklik sesuatu lalu membekukan semua animasi dan transisi pada waktu tertentu (mis. 80, 150, 400 ms) di board dan di aplikasi. Interaksi yang memutar animasi (donut, baris naik, menu) wajib punya skenario `frames`. Pembaruan layar harus di tempat (ubah gaya/atribut elemen yang sama) agar transisi jalan; menggambar ulang seluruh kartu memutar ulang animasi dan salah.
- Penyimpangan yang disengaja (mis. tombol dimatikan karena fungsinya belum ada) dicatat sebagai `deviasi` di skenario, lengkap dengan alasan; areanya dikecualikan tapi tetap dilaporkan.
- Board baru atau diubah: segarkan `reference/mockups/src/<nama>.dc.html` dari artifact (Artifact read), karena alat membaca sumber board, bukan PNG lama.
- Pengukuran posisi dengan JavaScript saja tidak cukup: pada 24 Nov 2026 pengaturan `-webkit-font-smoothing: antialiased` membuat semua teks lebih tipis dari mockup dan lolos dari pengukuran posisi; hanya perbandingan piksel yang menangkapnya.

## Cara menulis kode
- **Satu berkas, satu urusan.** Layar baru = berkas baru di `src/web/screens/`. `app.js` hanya rute dan shell. Berkas baru ditambahkan ke daftar `<!-- @js:... -->` di `src/web/index.html`, kalau tidak layar tidak ikut `dist/`.
- **Alarm ±400 baris.** Berkas lewat sekitar 400 baris atau mulai mencampur dua urusan: pecah dulu sebelum commit.
- **Satu jalur antar-bagian.** Layar ke server hanya lewat fungsi `api*`. Layar tidak menghitung sendiri; hitungan lewat `HF.ledger`, `HF.valuation`, `HF.zakat`, `HF.piutang`. Bagian lain: `docs/ARCHITECTURE.md` §3.
- **Rapikan sedikit area yang disentuh** (boy-scout), tanpa mengubah perilaku.
- **Perbarui `docs/ARCHITECTURE.md` di commit yang sama** saat struktur berubah.

## Jebakan (tulis di sini tiap kali menemukan yang baru)
- **Sheet baru Google hanya 1000 baris × 26 kolom.** Menulis atau memformat di luar itu gagal. Selalu lewat `Repo_ensureGrid_`. Sheet tiruan di `tests/gas.test.js` meniru batas ini; jangan dilonggarkan.
- **Sheet tiruan yang terlalu longgar menyembunyikan bug.** Bug grid di atas lolos 44 uji karena tiruannya tanpa batas. Saat menemukan perilaku Google yang berbeda dari tiruan, perbaiki tiruannya dulu sampai uji gagal, baru perbaiki kode.
- **Apps Script memuat berkas menurut abjad, semuanya satu lingkup global.** Engine yang butuh engine lain saat dimuat harus bergantung hanya pada berkas yang abjadnya lebih awal.
- **`clasp` terpasang lokal, bukan global.** Pakai `npx clasp ...` atau `npm run push`. `npm install -g` ditolak izin macOS (`/usr/local` milik root); jangan pakai `sudo`.
- **Login Google (`npx clasp login`) hanya bisa dilakukan Ticon.** Jangan mencoba menyiasati.
- **Jangan memasang `-webkit-font-smoothing` atau pengaturan render teks lain di CSS aplikasi**: mockup memakai bawaan browser, dan penghalus huruf mengubah ketebalan teks.
- **Tampilan dibangun jadi satu berkas `Index.html`** (CSS, JS, font ditanam). Gambar atau berkas statis terpisah tidak dilayani HtmlService.
- **Ikon harus `<svg>` nyata, garis pemisah harus elemen nyata** (bukan CSS mask atau `border-top`), supaya bisa diukur terhadap mockup.
- **Tracking huruf di spek desain adalah persen dari ukuran font, bukan piksel.**
- **Google Apps Script lambat: tiap panggilan `google.script.run` ke Sheet butuh sekitar 1 sampai 5 detik**, dan `apiState` yang membaca semua tab lebih lambat lagi. Di `npm run dev` (localStorage) semuanya instan, jadi bug kecepatan tidak terlihat di sana. Aturan: tampilan berubah dulu (optimistik), server menyusul di belakang, gagal = batalkan dan tampilkan pesan. Jangan menunggu server untuk menutup sheet atau menampilkan baris, dan jangan memuat ulang seluruh data setelah tiap simpan. Gunakan endpoint ringan (`apiBootState`) untuk membuka aplikasi.
- **Uji kecepatan:** bungkus `HF.api.call` dengan penundaan 4 detik (dan satu kasus gagal) lalu ukur waktu sampai tampilan berubah; harus di bawah 100 ms.

## Selesai berarti (Definition of Done)
- [ ] `docs/REGRESSION.md` dijalankan dan lolos, dengan bukti.
- [ ] `npm test` lulus, jumlah uji tidak turun.
- [ ] Layar identik dengan mockup (state kosong, error, menu, toast, sheet ikut), dengan angka ukur di laporan.
- [ ] Kode di berkas yang benar; tidak ada berkas yang melewati ±400 baris.
- [ ] `docs/ARCHITECTURE.md` diperbarui bila struktur berubah.
- [ ] Tercatat di `docs/CHANGELOG.md`; satu commit per fitur.
- [ ] Yang tidak terverifikasi ditandai jelas ke Ticon.
