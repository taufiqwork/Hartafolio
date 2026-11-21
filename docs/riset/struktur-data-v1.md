
### Pengaturan (REFERENSI)
Pasangan kunci–nilai. Satu baris per setelan.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| kunci | teks | ya | nisab_emas_gram | Nama setelan, tetap. |
| nilai | teks | ya | 85 | Dibaca engine sesuai tipe. |
| keterangan | teks | – | Nisab emas (gram) | Penjelasan untuk pengelola. |
| — |  | – | mata_uang_utama=IDR | Setelan awal: mata_uang_utama, mata_uang_kedua=USD, nisab_emas_gram=85, nisab_perak_gram=595, tarif_zakat=0.025, tanggal_snapshot=1, versi_skema=1. |

### Anggota (REFERENSI)
Akun anggota di dalam salinan. Tidak punya login; pengelola menambah sebanyak yang dibutuhkan.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| anggota_id | teks | ya | PM-002 | Dibuat otomatis, tidak pernah berubah. |
| nama | teks | ya | Aisyah | Nama tampilan di laporan. |
| hubungan | pilihan | ya | Anak | Diri sendiri · Istri · Suami · Anak · Saudara · Orang tua · Lainnya. |
| is_pengelola | ya/tidak | ya | tidak | Tepat satu baris bernilai ya: porsi milik pengelola sendiri. |
| warna | hex | – | #14a374 | Warna di pie chart dan laporan. |
| aktif | ya/tidak | ya | ya | Anggota nonaktif disembunyikan, datanya tetap. |
| dibuat_pada | tanggal-waktu | ya | 2026-11-03 10:12 |  |

### Lokasi (REFERENSI)
Tempat aset disimpan.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| lokasi_id | teks | ya | LK-003 |  |
| nama | teks | ya | Binance |  |
| jenis | pilihan | ya | Exchange | Exchange · Broker saham · Aplikasi emas · Fisik (rumah/brankas) · Bank · Wallet pribadi. |
| aktif | ya/tidak | ya | ya |  |

### Aset (REFERENSI)
Daftar instrumen. Diisi dari katalog bawaan; pengelola bisa menambah.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| aset_id | teks | ya | AS-PAXG |  |
| simbol | teks | ya | PAXG |  |
| nama | teks | ya | Pax Gold |  |
| kelas | pilihan | ya | Emas | Kripto · Emas · Perak · Saham · Mata uang. Pengelola bisa menambah aset di kelas mana pun. |
| bentuk | pilihan | ya | Token | Fisik · Token · Digital (saldo aplikasi). Dasar rincian fisik vs token (Q9). |
| satuan | pilihan | ya | token | gram · koin/token · lembar · IDR · USD · USDT. |
| gram_per_unit | angka | – | 31.1035 | Wajib untuk emas/perak. PAXG & XAUT = 1 troy ons; fisik = 1. |
| sumber_harga | pilihan | ya | coingecko | coingecko (kripto, USDT) · logam (XAU/XAG) · saham IDX · kurs (USD) · tetap (IDR = 1) · manual. |
| kode_sumber | teks | – | pax-gold | ID di sumber harga. Saham IDX memakai kode emiten, mis. BBCA. |
| kunci_manual | ya/tidak | ya | tidak | ya = engine tidak mengambil harga, selalu pakai harga manual terakhir. tidak = harga manual hanya override sementara sampai fetch berikutnya. |
| kategori_zakat | pilihan | ya | emas | emas · perak · uang · tidak. Aset Mata uang default uang (ikut nisab emas); bisa diubah ke tidak per aset. |
| aktif | ya/tidak | ya | ya |  |

### Transaksi (INPUT)
Satu-satunya tab yang diisi pengelola. Semua angka lain diturunkan dari sini.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| trx_id | teks | ya | TX-20261103-0007 | Dibuat otomatis, unik. |
| tanggal | tanggal | ya | 2026-11-03 |  |
| jenis | pilihan | ya | Beli | Beli · Jual · Masuk (hadiah/hibah/saldo awal) · Keluar · Pindah lokasi · Pindah anggota · Penyesuaian (koreksi saldo ±). |
| anggota_id | ref | ya | PM-002 |  |
| aset_id | ref | ya | AS-PAXG |  |
| lokasi_id | ref | ya | LK-003 | Lokasi asal untuk jenis Pindah. |
| lokasi_tujuan_id | ref | – | LK-001 | Hanya untuk Pindah lokasi. |
| anggota_tujuan_id | ref | – | PM-001 | Hanya untuk Pindah anggota. |
| jumlah | angka | ya | 0.25 | Positif; arah ditentukan jenis. Hanya Penyesuaian yang boleh negatif. |
| harga_per_unit | angka | – | 2650 | Wajib untuk Beli/Jual. |
| mata_uang | pilihan | – | USD | IDR · USD. |
| kurs_usdidr | angka | – | 16420 | Diisi otomatis dari Harga pada tanggal itu; boleh dikoreksi. |
| biaya | angka | – | 1.5 | Fee, dalam mata_uang yang sama. |
| pajak | angka | – | 0 | Dari kolom Pajak di Excel klien. |
| bukti | teks | – | 0x9f…a21 | Tx hash atau nota. Dari kolom Tx Hash / Bukti. |
| catatan | teks | – | DCA bulanan |  |
| sumber | pilihan | ya | manual | manual · import · offline. |
| status | pilihan | ya | aktif | aktif · dihapus. Baris tidak pernah dihapus fisik. |
| dibuat_pada / diubah_pada | tanggal-waktu | ya | 2026-11-03 10:15 | Jejak perubahan. |

### Harga (HASIL ENGINE)
Riwayat harga dan kurs yang diambil engine. Kurs USD/IDR disimpan sebagai aset_id USDIDR.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| waktu | tanggal-waktu | ya | 2026-11-03 07:00 |  |
| aset_id | ref | ya | AS-PAXG |  |
| harga | angka | ya | 2651.20 |  |
| mata_uang | pilihan | ya | USD |  |
| sumber | teks | ya | coingecko | Ditampilkan di aplikasi sebagai label sumber. |
| status | pilihan | ya | ok | ok · gagal · manual. Harga gagal tidak menimpa harga terakhir yang ok. Override manual berlaku untuk semua aset. |

### Snapshot (HASIL ENGINE)
Dibekukan tiap tanggal_snapshot. Satu baris per anggota × aset × lokasi yang saldonya ≠ 0. Tidak pernah ditimpa.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| periode | teks | ya | 2026-11 | Kunci bulan. |
| dibuat_pada | tanggal-waktu | ya | 2026-12-01 00:05 |  |
| anggota_id / aset_id / lokasi_id | ref | ya | PM-002 · AS-PAXG · LK-003 |  |
| jumlah | angka | ya | 1.75 | Saldo per akhir periode. |
| harga_idr | angka | ya | 43 532 000 |  |
| nilai_idr / nilai_usd | angka | ya | 76 181 000 · 4 640 |  |
| kurs_usdidr | angka | ya | 16420 | Kurs yang dipakai saat dibekukan. |

### Riwayat_Nilai (HASIL ENGINE)
Total harian per anggota untuk grafik tren. Ringan: satu baris per anggota per hari.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| tanggal | tanggal | ya | 2026-11-03 |  |
| anggota_id | ref | ya | PM-002 |  |
| total_idr / total_usd | angka | ya | 312 400 000 · 19 025 |  |

### Zakat (HASIL ENGINE)
Catatan perhitungan dan pembayaran zakat emas & perak.

| Kolom | Tipe | Wajib | Contoh | Keterangan |
|---|---|---|---|---|
| tanggal_hitung | tanggal | ya | 2026-11-03 |  |
| anggota_id | ref | ya | PM-002 | Satu baris per anggota per kategori. Total gabungan hanya ditampilkan sebagai info, tidak disimpan. |
| kategori | pilihan | ya | perak | emas (termasuk uang) · perak. Haul masing-masing terpisah. |
| mulai_haul | tanggal | – | 2026-08-20 | Tanggal saldo pertama kali mencapai nisab. Kosong = belum nisab. |
| status_haul | pilihan | ya | berjalan | belum nisab · berjalan · jatuh tempo · dibayar. Bila saldo turun di bawah nisab: mulai_haul dikosongkan, mulai lagi saat nisab tercapai. Jatuh tempo = mulai_haul + 354 hari. |
| gram_emas_fisik / gram_emas_token | angka | ya | 50 · 54.4 | Dijumlah untuk nisab, ditampilkan terpisah. |
| gram_perak_fisik / gram_perak_token | angka | ya | 400 · 0 |  |
| uang_idr / setara_gram_emas | angka | ya | 25 000 000 · 15.6 | Total aset kategori uang, dikonversi ke gram emas lalu digabung untuk nisab emas. |
| wajib_emas / wajib_perak | ya/tidak | ya | ya · tidak | Total gram ≥ nisab di Pengaturan. |
| saldo_akhir_haul | angka | ya | 612 g | Saldo pada hari terakhir haul, bukan saldo saat nisab pertama tercapai. |
| zakat_idr | angka | ya | 6 542 000 | 2,5% × nilai saldo_akhir_haul pada harga hari itu. Kenaikan saldo selama haul tidak memulai ulang hitungan; hanya turun di bawah nisab yang mengulang. |
| dibayar_pada | tanggal | – | 2026-11-10 | Diisi pengelola setelah membayar. |

## Rumus

**Saldo**
```
saldo(anggota, aset, lokasi) = Σ Beli + Masuk + Pindah·masuk − Σ Jual + Keluar + Pindah·keluar ± Penyesuaian
```
Hanya baris status = aktif. Jual yang melebihi saldo ditolak di formulir.

**Harga dalam Rupiah**
```
harga_idr = harga_terakhir(aset) × (mata_uang = USD ? kurs_terakhir(USDIDR) : 1)
```
Menghapus konversi dua tahap manual (Q7). USD ditampilkan sebagai nilai kedua.

**Nilai**
```
nilai_idr = saldo × harga_idr   ·   nilai_usd = nilai_idr ÷ kurs
```
Dasar semua total dan pie chart.

**Tiga tingkat total**
```
per anggota = Σ nilai(anggota)
milik pengelola = anggota dengan is_pengelola
total salinan = Σ semua anggota aktif
```
Jawaban Q8. Total tidak mencakup salinan lain.

**Modal & untung/rugi**
```
modal = Σ (jumlah × harga + biaya) Beli, metode rata-rata
untung = nilai_idr − modal tersisa
```
Dihitung dalam IDR memakai kurs_usdidr di baris transaksi.

**Gram untuk zakat**
```
gram = saldo × gram_per_unit, dikelompokkan kategori_zakat × bentuk
```
Fisik dan token dijumlah untuk nisab 85 g / 595 g, tapi ditampilkan terpisah (Q9).

**Ringkasan triwulan**
```
triwulan(Q) = snapshot bulan terakhir di Q, dibanding triwulan sebelumnya
```
Tidak perlu tab sendiri (Q4).

## Aturan data
- 01 ID tidak pernah berubah: Semua relasi lewat *_id, bukan nama. Ganti nama anggota tidak merusak riwayat.
- 02 Tidak ada hapus fisik: Hapus = status dihapus. Bisa dikembalikan, dan snapshot lama tetap konsisten.
- 03 Snapshot tidak ditimpa: Periode yang sudah ada dilewati. Koreksi dilakukan lewat transaksi Penyesuaian, bukan edit snapshot.
- 04 Header dikunci: Baris 1 setiap tab diproteksi; engine memeriksa urutan kolom sebelum menulis.
- 05 Format tetap: Tanggal ISO (YYYY-MM-DD), desimal titik, angka tanpa pemisah ribuan di Sheet. Format Rupiah hanya di tampilan.
- 06 Harga gagal aman: Fetch gagal ditulis status gagal; nilai tetap memakai harga ok terakhir dan aplikasi menandai umurnya.
- 07 Offline: Transaksi offline disimpan di perangkat, dikirim saat online dengan trx_id yang sama sehingga tidak dobel.
- 08 Versi skema: versi_skema di Pengaturan. Pembaruan template menambah kolom di kanan, tidak mengubah yang ada.
