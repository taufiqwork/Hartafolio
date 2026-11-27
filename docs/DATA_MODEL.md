# Model data v2 (menggantikan draf v1, 3 Nov 2026)

Dasar: `docs/riset/struktur-data-v1.md` (kolom dan rumus rinci tetap berlaku kecuali diubah di bawah). Aturan data v1 (01–08) tetap: ID tidak berubah, tidak ada hapus fisik, snapshot tidak ditimpa, header dikunci, format ISO/desimal titik, harga gagal aman, offline dengan `trx_id` sama, versi skema append-only.

## Tab (11)
Pengaturan, Anggota, Lokasi, Aset, Transaksi, Harga, Snapshot, Riwayat_Nilai, Zakat, **Piutang** (baru), **Zakat_Bayar** (baru).
Tab hasil (Snapshot, Riwayat_Nilai, Zakat) boleh dibangun ulang dari Transaksi + Harga + Piutang + Zakat_Bayar.

## Perubahan terhadap v1

### Aset
- `kelas` (Jenis aset, 8 pilihan, sesuai form "Aset manual" di mockup): Emas · Perak · Crypto · Saham · Reksa dana · Mata uang · Properti · Lainnya ("Crypto", bukan "Kripto"). Satuan: gram, oz, koin, token, lot, lembar, unit, nominal, m².
- Kolom `status` (aktif | tersembunyi | dihapus) menggantikan `aktif`; kolom `mata_uang_harga` (mis. saham GFI dalam USD) ditambahkan.
- `kategori_zakat` diturunkan: hanya kelas Emas dan Perak (fisik/digital, ETF emas/perak); selain itu kosong. Wajib `gram_per_unit` untuk emas/perak yang satuannya bukan gram (1 oz = 31,1035 g). USDT dan mata uang lain tidak dihitung zakat.
- Aset bisa disembunyikan (status tersembunyi) dan dihapus hanya bila tidak punya transaksi; lihat bagian Kelola aset di design-system.md.

### Lokasi
- `jenis` (urutan tampil): Exchange crypto, Wallet crypto, Sekuritas saham, Aplikasi investasi, Emas digital, Bank atau deposito, Dompet digital, Simpanan fisik, Lainnya. (Menggantikan daftar v1.)

### Transaksi
- `jenis`: Beli · Jual · Masuk · Keluar · Pindah · Saldo awal · Zakat · Pinjamkan · Cicilan diterima · Pelunasan diterima · Penyesuaian.
  - Zakat, Pinjamkan, Cicilan diterima, Pelunasan diterima dibuat otomatis dari layar Zakat dan Piutang; pengguna tidak memilihnya di Catat.
  - **Pindah** satu jenis untuk antar lokasi dan antar anggota (kolom `lokasi_tujuan_id`, `anggota_tujuan_id`); jenis "Pindah lokasi/Pindah anggota" di v1 digabung. Biaya Pindah ada di kolom `biaya` baris Pindah, dalam satuan aset yang dipindah, dipotong dari lokasi asal (keputusan 28 Nov; data lama digabung lewat menu Rapikan biaya Pindah).
- Kolom tambahan: `alat_bayar_aset_id` (Beli dibayar dengan aset tercatat; Jual hasil masuk ke aset), `asal_alasan` (Masuk: Hadiah/Warisan/Dari dompet luar/Lainnya; Keluar: Hadiah/Sedekah/Ke dompet luar/Hilang/Lainnya), `link_id` (menaut ke `bayar_id` Zakat_Bayar atau `piutang_id`), `kurs`, `kurs_sumber` (realtime|rata_harian|manual|import), `kurs_tanggal`, `kurs_waktu`, `harga_mata_uang` (IDR|USD|USDT|aset pembayar), `harga_beli_rata2` (hanya Saldo awal, opsional).
- Tanggal dan jam disimpan (jam menit, langkah 5 menit di UI).
- Ubah transaksi: jenis tidak bisa diubah; saldo dihitung ulang dari tanggal itu; badge "Diubah".

### Zakat (hasil engine) — hanya emas dan perak
- Satu baris per anggota × logam (emas, perak). Hapus kolom `uang_idr`, `setara_gram_emas`; `wajib_emas/wajib_perak` jadi `wajib` per baris.
- Kolom: `anggota_id, logam, mulai_haul, status_haul (belum nisab|berjalan|jatuh tempo|terlambat|dibayar), gram_fisik, gram_digital, saldo_akhir_haul, zakat_idr, haul_id`.
- Haul 354 hari per anggota per logam. Turun di bawah nisab mengosongkan `mulai_haul` dan mulai lagi saat nisab tercapai (berbasis gram, bukan harga). Setelah pembayaran: haul berikutnya mulai pada tanggal bayar **hanya bila sisa ≥ nisab**.
- Emas/perak yang sedang dipinjamkan (Piutang aktif) tidak dihitung dan mengurangi harta zakat pemberi; dihitung lagi saat diterima kembali.
- `zakat_idr` = 2,5% × nilai `saldo_akhir_haul` pada harga hari jatuh tempo.

### Zakat_Bayar (baru, input)
`bayar_id, haul_id, anggota_id, logam, jumlah_idr, tanggal_bayar, sumber (luar|aset), aset_id (bila sumber=aset), trx_id (transaksi jenis Zakat bila sumber=aset), status (aktif|dihapus), dibuat_pada`.
Aturan lengkap (qty dibulatkan ke atas ke satuan terkecil, Urungkan menghapus record dan transaksi, aset hanya milik anggota yang sama) ada di bagian "Build spec: Zakat mal payment" di design-system.md.

### Piutang (baru, input) — Adendum 1
`piutang_id, pemberi_anggota_id (pemilik aset), peminjam_nama (teks bebas), aset_id, lokasi_id (lokasi asal, tempat kembali), jumlah_pokok, cara (sekali|cicilan), jumlah_cicilan, mulai_atau_jatuh_tempo (tanggal), catatan, status (berjalan|lunas), dibuat_pada, diubah_pada`.
- Jadwal cicilan diturunkan: cicilan pertama pada tanggal mulai, lalu tiap bulan di tanggal yang sama (tanggal 29–31 mundur ke hari terakhir bulan). Chip cepat Bulan depan / 3 / 6 bulan / 1 tahun memakai tanggal 15; ada "Pilih tanggal".
- Pembayaran diterima = transaksi `Cicilan diterima` / `Pelunasan diterima` dengan `link_id = piutang_id`; melunasi cicilan paling lama lebih dulu. Status terlambat dihitung (jatuh tempo lewat tanpa pembayaran), bukan disimpan.
- Pemberian pinjaman = transaksi `Pinjamkan` (aset keluar dari saldo pemberi di lokasinya). Cicilan selalu kembali ke pemberi dan lokasi asal. Total harta tidak berubah; nilai piutang = sisa × harga hari ini (baris "Termasuk piutang Rp X" di kartu total Beranda).
- Tanpa bunga dan tanpa denda.

### Pengaturan
Tujuh kunci awal: `mata_uang_utama=IDR`, `mata_uang_kedua=USD`, `nisab_emas_gram=85`, `nisab_perak_gram=595`, `tarif_zakat=0.025`, `haul_hari=354`, `versi_skema=1`. `tanggal_snapshot` dihapus: snapshot selalu tanggal 1 (design-system, "Snapshot merged into Laporan"). Kunci `setup_selesai=ya` ditulis saat Setup awal selesai. Bila skema berubah ke 2, naikkan `versi_skema` dan hanya tambah kolom di kanan.

## Notifikasi Beranda (diturunkan, tidak disimpan)
Banner tunggal (zakat lebih dulu, lalu piutang) + lonceng berisi semua; aturannya di design-system.md "Notifikasi Beranda".

## Keputusan yang dulu terbuka
(Diputuskan 24 Nov 2026, lihat `docs/STATUS.md`.) `Pindah` disimpan satu baris dan engine menghitung dua sisi. Tab `Piutang_Jadwal` tidak ada; jadwal diturunkan.
