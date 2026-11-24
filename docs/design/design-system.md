Hartafolio is a family wealth tracker: one manager records gold, silver, crypto, shares and cash for each family member, sees the total at a glance, and knows when zakat is due. The interface should feel like a calm, trustworthy ledger, never like a trading app. The first screen answers one question: "how is the family's wealth doing?". Detail is always one tap away and never pushed forward. The client's reference app is Catatan Keuangan: detailed figures that are always correct.

## Content

- Write all UI copy in Bahasa Indonesia. Address the user neutrally with imperatives ("Catat transaksi", "Pilih anggota"); use "Anda" only in full sentences.
- Write numbers the Indonesian way: comma for decimals, dot for thousands. Use "Rp 174,2 jt" in summaries and "Rp 2.380.000" in forms and transaction detail. Show USD as "$ 9.979". Write gram as "g" ("612 g") and crypto amounts in full decimals ("0,0219").
- Write dates as "6 Nov 2026"; group lists by day with "Hari ini · 4 Nov".
- Every change in value shows a sign: "+7,7%", "−1,3%". Use the true minus sign (−), not a hyphen. Name the reference point once per block, not on every number: a caption under the breakdown card says "% = perubahan sejak awal dicatat"; a single figure with a different reference names it inline ("+2,4% dari Okt").
- Keep zakat terms (zakat, nishob, haul) and explain them in one plain line where they first appear: "Haul berjalan · hari 76 dari 354".
- Name things the way the family talks (the category is written "Crypto", in English, not "Kripto"): anggota, lokasi (Binance, Brankas, Pluang), jenis aset (Emas, Perak, Crypto, Saham, Mata uang). Say "manual" when a price was typed in and "import" for data from the old Excel file.
- No emoji, no exclamation marks, no urgency words like "Segera!". Warnings state the fact and the next step: "Perak Azlan dekat batas nishob · 612 g, hanya 17 g di atas nishob".

## Colour

- Build every screen on `surface`. Put content blocks on `surface-raised` cards with a `line` border and `shadow-card`. Use `surface-sunken` for unselected chips, inputs and progress tracks.
- Set text in `ink`. Use `ink-muted` for labels, captions and the second line of a row. Both read on every surface and soft tint in both themes.
- `brand` is the one action colour: the primary button, the selected chip, the active tab, links and chart series 1. Text on a brand fill is `on-brand`.
- `gold` belongs to gold, silver and zakat: nishob bars, haul status, attention items. Use `gold` for gold text, `gold-fill` for gold fills (text on it is `on-gold`, never white), and `gold-soft` behind an attention item.
- Increases use `gain` and decreases use `loss`, always together with a + or − sign so the meaning never depends on colour. Use `loss-soft` behind errors such as a failed price fetch.
- Chart series follow `chart-1` to `chart-5` in order of share, largest first. Separate donut segments with a visible gap (see Beranda donut) and print the percentage beside the label, so the series stay readable for colour-blind users.
- Keyboard focus is a solid 2px `focus-ring` outline with a 2px offset on every interactive element.

## Type

- Use Plus Jakarta Sans for everything. It is an Indonesian-made typeface, loaded from Google Fonts. Set every amount with tabular figures so columns of Rupiah line up.
- `amount-hero` appears once per screen, for the family total on Beranda. Screen titles use `title`, card titles `heading`, running text `body`.
- Amounts in rows and cards use `amount`, right-aligned. Labels, chips and tabs use `label`; buttons follow the Button spec below. Second lines and chart axes use `caption`.

## Space, shape, layout

- Design for a 360–430px phone first. Keep a `space-4` side gutter, `space-4` card padding, `space-5` to `space-6` between cards, 14px vertical padding inside rows and `space-1` between a row's two lines.
- Respect the phone's safe areas: content starts below the status bar (`env(safe-area-inset-top)`, 47px on the 390×844 mockups) and the bottom bar and sticky footers pad by the home-indicator inset (34px on the mockups).
- Scroll areas show no fixed scrollbar; the phone draws its own floating indicator while scrolling.
- Cards are `radius-lg`, buttons, inputs and the select `radius-md`, chips and badges `radius-pill`.
- Touch targets are at least 44px tall; the primary button is 48px.
- In two-line rows, align the swatch, icon or avatar with the first line, not the middle of the row.
- Progress tracks use `line` behind the fill so the empty part stays visible on white and tinted cards.
- Show values in the Aset list with three decimals ("Rp 50,400 jt"); summaries elsewhere keep one ("Rp 174,2 jt").
- Order Beranda as: total with sparkline, the breakdown card, then the attention list, so warnings are visible without scrolling. Navigation is the five-tab bottom bar with a round add button in the middle.

## Breakdown on Beranda

- The breakdown card has a mode toggle (person icon = per anggota, grid icon = per jenis aset) and a select below it ("Semua anggota" with a `chevron-down`) to pick one member or one asset type. The client chose this pattern on 6 Nov 2026.
- Each detail row shows the name with its asset count and locations on the second line, and on the right the amount and its change since first recorded as a bare percentage ("+7,7%"), explained once by the caption under the card. If this proves too busy in testing, drop the second lines and keep name and amount only.

## Icons

- Lucide (lucide.dev, free, ISC licence) is Hartafolio's icon set. Use its icons as they come: 24px grid, 2px stroke, round caps and joins, drawn in `currentColor`. Never mix in another set or hand-drawn icons.
- Bottom navigation uses closed-shape icons so the active tab can turn into a solid glyph: Beranda = `house`, Aset = `layout-grid`, Riwayat = `receipt-text`, Alat = `wrench`, add = `plus`. Inactive tabs are outlines in `ink-muted`; the active tab is duotone: its outer shape fills with `brand-soft` and every line, inner details included, stays `brand`. The round add button carries a soft green shadow.
- Other icons in use: `user` and `layout-grid` (breakdown mode), `chevron-down` (every select and filter chip; never a "▾" character), `chevron-left` (back), `chevron-right` (list rows), `check`, `x`, `search`, `camera`, `calendar`, `chart-column`, `coins`; transaction types `plus` (beli), `minus` (jual), `arrow-down-to-line` (masuk), `arrow-left-right` (pindah lokasi).
- Logo: "Koin bertunas" (a gold coin with a green sprout), chosen by Ticon on 6 Nov 2026. Beside it, set the name "Hartafolio" in Plus Jakarta Sans 700 with "folio" in `brand`. The light app icon is the mark on a cream (`gold-soft`) tile; the dark one sits on the dark surface. Do not add a third variant on a green tile.


## Behaviour rules (read before building)

- Lists of asset categories are ordered by value, largest first, on every screen that shows them (Beranda, Aset, Laporan). Never use a fixed order. On a tie, fall back to Emas, Perak, Crypto, Saham, Mata uang. Chart colours follow the same order (`chart-1` is the largest). A category with no positions is hidden. Decided by Ticon on 7 Nov 2026; it replaces the earlier fixed-order rule.
- Deleting a transaction is a soft delete: the row gets a "dihapus" status, leaves totals and snapshots calculations, and can be restored. The client approved this in the wireframe ("hapus = status dihapus, bisa dipulihkan"). The retention window (the "30 hari" idea) is NOT confirmed with the client: do not build an automatic purge until the window is decided. Until then, deleted rows stay restorable.
- On the Aset list with "Semua" selected, one row can combine the same asset at the same location across members. Its second line reads "Milik N anggota" (N = how many members hold it). Choosing one member shows that member's own quantity instead.
- Riwayat rows have two figures. Top: the change in asset quantity. Bottom: its value in rupiah on the transaction day. A location move (Pindah lokasi) keeps the same value, so its second line simply shows that value with no extra label; a fee, if any, is recorded as its own transaction.
- Location types (the "Jenis" of a lokasi), in this order: Exchange crypto (Binance, Indodax), Wallet crypto (Ledger, MetaMask), Sekuritas saham (Ajaib, IPOT), Aplikasi investasi (Pluang, Bibit), Emas digital (Pegadaian, Treasury), Bank atau deposito (rekening, deposito, safe deposit), Dompet digital (GoPay, OVO), Simpanan fisik (brankas, laci, lemari di rumah), Lainnya. Each has a Lucide icon (chart-line, key-round, trending-up, smartphone, coins, landmark, wallet, vault, ellipsis).
- Overlays: when a select or menu is open, dim everything behind it with a 42% `ink` scrim; tapping the scrim closes it. A short list (up to about 6 options) is an anchored menu under its field; a longer list (the 9 location types) is a bottom sheet with a drag handle, icon, name, example and a check on the selected row.
- Import inside Setup step 4 has three stages (File, Periksa, Simpan). Do not add a second progress bar: the fourth segment of the Setup bar splits into three ticks that fill as the stages pass. "Mulai kosong" skips the stages and shows a plain fourth segment.
- First asset: from an empty Beranda or an empty Aset list, "Catat aset pertama" opens the Saldo awal screen (title "Saldo awal", no type toggle, no Asal row, a "Tanggal saldo" field). Its Simpan button returns to Beranda; "Simpan & tambah aset lain" reopens the same screen.
- Recommended import format is .xlsx (keeps sheets, dates and number formats); .csv is accepted.
- Saldo awal is not a Terima variant. It records what the family already holds today, is not a purchase (no price, no fee) and does not affect profit or loss. Terima is only for assets that arrive from outside the family later (Asal: Hadiah, Warisan, Lainnya).
- There is no "Aset baru" button on the Aset list. An asset exists because a transaction was recorded; the FAB (+) in the bottom bar is the only entry to record one, and the empty states point to Saldo awal.
- Moving an asset between members is a Pindah transaction (sub-toggle "Antar lokasi | Antar anggota"), never a Terima. It writes two linked entries: the sender's balance goes down (shown in `loss`), the receiver's goes up. The receiver's location defaults to the sender's but can be any location ("Ke lokasi"); a position the receiver does not hold yet is marked "posisi baru". The sender's balance is shown under the amount and Simpan is disabled when the amount exceeds it. Total family wealth does not change, except for the fee.
- The quantity label follows the selected asset: crypto uses its ticker (Jumlah (PAXG), Jumlah (BTC), Jumlah (USDT)), physical gold and silver use gram, stocks use lot, cash uses Rp. Before an asset is chosen the label is plain "Jumlah" and the price label is "Harga per unit". Never write the generic words "token" or "unit" in a label once the asset is known.
- Riwayat: rows open a detail sheet (Ubah, Hapus). Deleting shows a toast with "Pulihkan". Jenis, Anggota and Bulan are anchored menus with the 42% scrim. Snapshot: months are closed on the 1st and never change; a month made from an import has no per-member or per-asset breakdown.
- Biaya is always labelled "Biaya (opsional)" and may be zero. It appears on Beli, Jual and every Pindah (antar lokasi and antar anggota), in Rp, and is recorded as a separate expense. When it is above zero the footer shows it in `loss` and the family total drops by that amount.
- Saldo awal can hold many assets. Entry points: "Catat aset pertama" on empty Beranda and Aset; the line "Catat saldo awal" under the Beli and Terima hints; the line under the Aset list; and Import (bulk). After each save, "Simpan & tambah aset lain" reopens the screen with a "Sudah dicatat" list; "Simpan & selesai" returns to Beranda.
- "Cari aset lain" (a bottom sheet with search and a catalogue) and "+ Lokasi" (a bottom sheet with a name and one of the 9 location types) appear only where something new can enter: Beli, Terima, Saldo awal, and "Ke lokasi" of a Pindah. They never appear on Jual or on the "Dari" side of a Pindah, which can only use what is already held.
- Deleted transactions: the toast after Hapus is a convenience that disappears after about 6 seconds and when the screen is left. The permanent way back is the "Terhapus (n)" navigation row in Riwayat (shown only when n is above 0; icon tile, label and `chevron-right`, never a pill), which lists them with a Pulihkan button each.
- A control that expands content in place (rincian per aset, a select) shows `chevron-down`, turning to `chevron-up` when open. `chevron-right` is only for opening another screen.
- Controls: a pill or chip changes state in place (filter, toggle). A control that opens another screen is a navigation row or a link with `chevron-right`, never a pill. Example: "Terhapus (n)" in Riwayat.
- Pindah layout: two labelled cards joined by an arrow. Antar lokasi: "Dari" (owner, asset, source location, balance) and "Ke" (destination location, "+ Lokasi"). Antar anggota: "Pengirim" (member, asset, location, balance) and "Penerima" (member, receiver location). Each card shows a one-line summary in its header. Other transaction types keep the flat field list.
- "Cari aset lain" is never random. The sheet has three parts: "Dipakai anggota lain" (assets other family members already hold, taken from the family's own records), "Katalog harga otomatis" (assets with automatic prices, filterable by category and search), and "Tambah aset manual". The real catalogue and price source are NOT confirmed with the client or backend; the catalogue items in the mockup are samples.
- A dropdown that sits last on its screen with nothing beneath it (Hubungan in Setup, Anggota) is a native select and needs no scrim. The 42% scrim applies only when the open list covers other components.
- Laporan: period toggle (Bulanan, Triwulan), anggota menu (with scrim), chip "Tampilkan dalam USD" (rate 16.420), export bottom sheet (PDF or Excel .xlsx) and an empty state with a "Catat transaksi" button. Figures follow the selected member.
- Zakat mal: per member, emas and perak apart (only gold and silver count, see "Zakat: only gold and silver" below). "Apa itu nishob dan haul?" opens an info sheet (nishob 85 g gold, 595 g silver; haul 354 days; 2.5%). When a haul completes, the due card shows the amount and "Catat pembayaran"; paying restarts the haul on the same day. "Riwayat haul & pembayaran" lists running and finished hauls. With no gold or silver, an empty state points to Saldo awal.
- Zakat mal rules (Ticon, 9 Nov 2026): the screen and menu are named "Zakat mal". Calculated per member only; never show a combined family figure. Haul is one year (354 days). The next haul starts one year after the LAST PAYMENT DATE, not the due date, even when the payment is late. Gold and silver values come from the automatic market price; the user does not enter them (nishob 85 g / 595 g is editable in Lainnya, Perhitungan).
- Zakat reminders: the user is reminded before the due date (30, 7 and 1 day before, on the day) and every day after it until paid. Each time is a checkbox in the "Pengingat zakat" sheet. States: mendekati (X hari lagi, estimate marked "±"), jatuh tempo hari ini, terlambat (N hari, `loss` badge).
- Harga terkini (screen 11, reached from Alat, Pasar): live market prices for the asset kinds the family holds (crypto, emas, perak, saham, kurs) with a 24-hour change and a small trend line, a "Live · diperbarui" status, filters, and a stale state ("Terakhir diperbarui", "Coba lagi") when updating fails. Values elsewhere use these same prices. Manual assets do not appear here. The real price sources per asset kind are NOT confirmed with the client or backend.
- Laporan bars: the number above a bar is the nominal change in value (Rp juta, or USD), never a percentage; the percentage sits beside the total. Export: PDF is a 2-page summary, Excel (.xlsx) has 3 sheets (Ringkasan, Per aset, Transaksi); file name Hartafolio-Laporan-<periode>.<ext>.
- "Tambah aset manual" is pinned at the bottom of the "Cari aset lain" sheet, outside the scrolling list.
- Price sources (decided 9 Nov 2026, to be verified with the client): crypto from the Binance public market-data API (ticker price and 24h change, USDT pairs converted to IDR with the USD/IDR rate), Bybit public tickers as fallback, because the family holds assets on both. Gold and silver per gram from a spot-metal price (XAU/XAG) converted to IDR; PAXG comes from Binance. Stocks and exchange rates from a market-data feed (the Google Sheet GOOGLEFINANCE function can serve as a start, up to ~20 minutes delayed; IDX coverage must be checked). A price that cannot be fetched falls back to the last price with a warning, and the user may fill it manually. Still to confirm: commercial-use terms of the exchange APIs, availability in Indonesia, and the paid metal-price provider.
- Chips: a chip changes the list in place. One group of chips is one choice and stays on ONE row; if it is too wide it scrolls sideways, never wraps to a second row. A separate on/off filter (for example "Hanya yang saya miliki") is a switch row, not a chip placed in the same group. A standing on/off view option may stay a single labelled chip (Laporan, "Tampilkan dalam USD").
- Harga terkini list rows use fixed columns so every row aligns: name and caption (flexible), a 44 px trend line, and a 136 px right-aligned price with the 24h change below it. The Beranda "Harga terkini" card uses the same grid (36 px icon · 1fr · 44 px · 136 px), so the trend lines form one vertical column. "Dimiliki" is a badge after the name.
- Beranda reminders: the zakat reminder sits directly under the total, above everything else, and is not tied to the member filter. Three levels: more than 7 days away (soft gold card, "Lihat"), due today (gold card, primary "Catat pembayaran"), late (loss card, loss-coloured "Catat pembayaran"). It disappears once paid. A compact "Harga terkini" card (four held assets, 24h change, "Live · diperbarui", "Lihat semua") sits after the breakdown card, above "Perlu perhatian". The header badge reads "Live · <time>".
- "Tambah aset manual" opens a bottom sheet: Nama aset, Kategori (one scrolling row), Satuan (unit, lot, gram, lembar) and Harga per satuan (Rp). Save is disabled until name, category and price are filled.
- Export samples: PDF is two A4 pages (page 1: total change, monthly bars, per jenis aset; page 2: per anggota and calculation notes). Excel has three sheets: Ringkasan, Per aset, Transaksi, with full figures and formulas.
- Pointing to a menu (Ticon, 9 Nov 2026): never write a bare "di Alat". Name the full path: "lewat menu Alat, bagian Harga & isi manual", "nanti dari menu Alat". Applies on every screen.
- Beranda zakat reminder is not permanent. It appears only from the first reminder time (default 30 days before the haul ends) and stays until paid. Levels: soft-gold (more than 7 days), gold with primary button (due today), loss/red (late). Before that, Beranda shows no zakat card.
- Beranda order: total, zakat reminder (when due), breakdown, attention items, then the "Harga terkini" card last (2x2 grid, "Lihat semua" to 11 Harga).
- 11 Harga: owned assets are marked with a small check circle (aria-label "Dimiliki"), never the word. The first row has no divider above it. Chip rows scroll sideways with the scrollbar hidden (`scrollbar-width: none`) and 6px bottom padding so nothing touches the chips.
- Chart captions sit below the chart, one short line starting with "*": "* Angka di atas batang: perubahan nilai (juta Rp), bukan persen."
- Wording: "Perubahan" (never "Ubah") for the change column in screen, PDF and Excel. "Ubah" stays only as the edit verb on buttons and links.
- Export PDF is paginated A4 (595x842): page 1 overview + start of "Rincian per aset" with "Bersambung ke halaman berikutnya", page 2 continues the table then "Per anggota", page 3 "Transaksi periode ini" + "Catatan perhitungan". Page count follows the data. Footer "n / total" on every page. Excel has 3 sheets: Ringkasan, Per aset, Transaksi.
- Price sources are NOT verified from the design side. Binance/Bybit public market-data endpoints, GOOGLEFINANCE for IDX and a spot-metal provider are candidates only until Claude Code confirms them live from Indonesia (status, rate limits, terms, IDR pairs). Do not hard-code a source in the UI copy before that report exists.
- Beranda "Harga terkini" card (Ticon, 9 Nov 2026): list rows on a raised card, never grey tiles (they read as disabled). Each row: 36px round icon (brand-soft for crypto and currency, gold-soft for gold and silver), name + unit caption, price in ink 15px/600 and the change below it, right-aligned. Divider between rows only.
- Report chart: the area below the axis exists only when some bar is negative; otherwise x labels sit right under the axis. A card shows the LATEST 6 months only (monthly) or Q3 and Q4 (quarterly); there is no pager and no older window. Older months live in Snapshot (06), which is the history. The latest bar's label is bold. Caption format: "*Angka di atas diagram batang: perubahan nilai (juta Rp), bukan persen."
- Export PDF is a summary only: overview, chart, Per jenis aset, Per anggota, Transaksi, notes. No per-asset breakdown (that lives in Excel). All section titles use one style (11px/600). Excel has 4 sheets: Ringkasan, Per anggota (SUMIF from Per aset), Per aset, Transaksi.
- Zakat "Catat pembayaran": opens a sheet (amount, date, "Setelah disimpan" list: haul closed as paid, next haul starts from the payment date, reminders stop, asset values unchanged). "Simpan pembayaran" closes the sheet, the card shows the paid state and a toast "Pembayaran zakat Rp … dicatat" with "Urungkan".

## Build spec: Zakat mal payment (for Claude Code, Ticon 10 Nov 2026)
Screen: 08 Zakat mal, button "Catat pembayaran" (shown when the haul is due or late). It opens a sheet with a required choice "Dibayar dari":
1. `luar` (default): paid from money outside Hartafolio (cash, bank). Writes ONLY a zakat payment record (member, haul id, amount Rp, pay date). No asset changes, no row in Riwayat transactions.
2. `aset`: paid from an asset recorded in Hartafolio. The user picks one asset of the SAME member (sheet "Aset yang dikurangi"; every asset with enough balance is listed with the quantity that would be deducted). Quantity = amount Rp / market price per unit at pay time, rounded up to the asset's smallest unit. Writes the payment record AND one transaction of the new jenis "Zakat".
Zakat transaction: jenis = "Zakat" (outflow, like a withdrawal). Fields: date = pay date, member, asset, location (the asset's own location), quantity (negative), price = market price at pay time, fee = 0, link to the payment record id. It lowers the asset balance, appears in Riwayat (add "Zakat" to the Jenis filter) and in the transaction list of Laporan/Export. It is NOT a sale: it does not count as realised gain or loss, and Laporan "perubahan nilai" treats it as an outflow, not as a loss.
Rules:
- The amount stays editable (default = computed zakat, Rp 712.980 in the mock). If it is edited, recompute the deducted quantity.
- Nishob after paying (decided 10 Nov 2026). Paying from silver or gold lowers the holding. Compute `after = holding - deducted quantity`. If `after >= nishob`, the new haul starts on the pay date. If `after < nishob`, NO haul runs: the card shows "Belum nishob" with "Kurang X g lagi. Haul mulai otomatis saat nishob tercapai.", and the haul starts on the first day the member's holding is >= nishob again (a purchase, transfer in or price-independent gram top-up; the nishob is weight-based, so price moves never restart it). Show this before saving: in the asset picker each row shows "sisa X g" (gold text and "di bawah nishob" when below), and the pay sheet shows a gold alert "Di bawah nishob. Sisa perak 588,9 g, 6,1 g di bawah nishob (595 g). Setelah dibayar, haul baru belum mulai." The "Setelah disimpan" list line 3 then reads "Haul baru BELUM mulai karena sisa perak di bawah nishob". Example numbers in the mock: holding 604 g, zakat 2,5% = 15,1 g = Rp 703.660, after = 588,9 g.
- After "Simpan pembayaran": close the sheet, mark the haul as paid, start the next haul from the pay date (even when late) ONLY if the remaining holding is still >= nishob (see the nishob rule above), stop reminders, show toast "Pembayaran zakat Rp ... dicatat" (source `luar`) or "Zakat dicatat · <aset> berkurang <qty>" (source `aset`), both with "Urungkan". Undo deletes the payment record and, for `aset`, the Zakat transaction, and restores the haul.
- The asset picker is per member only. Never combine members. Zakat is never deducted from another member's asset.
- Persist `sumber` (`luar` | `aset`) on the payment record so Riwayat haul can show "dibayar dari aset" later.
Mockups: 08 Zakat 2j (sheet, luar), 2l (sheet, aset), 2m (pilih aset), 2k (toast, luar), 2n (toast, aset), 2o (pilih aset, sisa di bawah nishob), 2p (sheet, peringatan di bawah nishob), 2q (dibayar, haul menunggu nishob), 2r (nishob tercapai lagi, haul mulai).
Toast actions (10 Nov 2026): an action inside a toast ("Urungkan") is an OUTLINE button (1.5px gold-fill border, 10px radius, min-height 36px, 14px padding). Toast container padding is 8px top, right and bottom and 16px left, so the button has the same gap on three sides. This covers "Urungkan" (zakat) and "Pulihkan" (Riwayat); text-only toasts use 12px 16px. so it reads as tappable. Never bare text. Applies to every toast with an action, in every screen.
Radio (10 Nov 2026): 22px ring (2px border), 10px inner dot, `flex: none; min-width: 22px; aspect-ratio: 1/1` so it never squashes into an oval inside a grid or flex row. Selected ring and dot use `brand`, unselected ring `line-strong`.
Select field with a caption and a value (such as "Aset yang dikurangi"): min-height 68px, padding 14px 16px.

## Build spec: Laporan header text
The headline above the chart covers ONLY the latest period (decided 10 Nov 2026). Monthly: "November 2026 (sampai 9 Nov)", value = that month's change, percent = change / total at the start of the month. Quarterly: "Q4 2026 (sampai 9 Nov)", value = that quarter's change. The chart shows the latest 6 months (monthly) or Q3 and Q4 (quarterly) as context. No pager, no older windows; the month-by-month history is Snapshot (06). Export (PDF/Excel) uses the same period: header = latest period, chart = the latest 6 months, file name "Hartafolio-Laporan-Nov-2026" or "-Q4-2026". The PDF "Transaksi" section lists the 8 latest transactions, not period-filtered; the full list is in Excel.

## Alat map (every row has a destination)
09 Alat: Harga terkini → 11; Anggota → 12; Lokasi → 13; Mata uang (sheet), Nishob → 16, Pengingat zakat → 08 (sheet Pengingat), Import / Export → 10 (stepper File, Periksa, Simpan; tab Export; sheets Lengkapi aset and Template); Google Sheet → 17; Pasang di layar HP (sheet). The separate "Harga & isi manual" screen no longer exists, and "Aset dan harga" is no longer an Alat row: its only entry is the Aset tab (see Flow audit).
Rules for 12 and 13: a member or location that still holds assets cannot be deleted; the sheet explains how to move them first (Catat, Pindah). Names can be changed any time without touching history. A location's jenis cannot change once it is used.
Rule for 14 (now named "Kelola aset", see below; merged 10 Nov 2026): one screen lists every asset with its price and source ("per gram · otomatis" or "per lot · diisi 2 Nov"). Tapping an asset opens "Ubah <aset>": Nama, Jenis and Satuan (the last two locked once the asset is used) and the radio "Sumber harga": Otomatis shows the current market price as a read-only glimpse ("Harga otomatis sekarang"), Manual shows an editable field "Harga manual per <satuan> (Rp)" prefilled with the last price. An asset with no automatic source is manual only. A manual asset without a price today shows the red badge "Perlu diisi" and a gold notice at the top; saving the sheet stores the price with the date. Assets with a balance or history are hidden, never deleted. Entry: only from the Aset tab (card "Aset dan harga" at the end of the list, with the badge "1 perlu harga"); back link "‹ Aset". Why merged: price source is a property of the asset, so one place avoids two screens that edit the same thing; the Alat row carries the badge "1 perlu harga" so a missing manual price is still found.
Rule for 16: nishob changes recompute running hauls. The "Ubah nishob" link in the Zakat info sheet opens 16.


## Navigation and actions (Ticon, 10 Nov 2026)
Bottom nav (Beranda, Aset, +, Riwayat, Alat) shows ONLY on the four tab roots: Beranda, Aset (03), Riwayat (05), Alat (09). Every pushed screen reached from them (Laporan 07, Zakat 08, Rincian bulan 07·3, Harga terkini 11, Anggota 12, Lokasi 13, Aset dan harga 14, Nishob 16, Google Sheet 17, Import / Export 10) hides the bottom nav and shows a back link at the top ("‹ Alat"). Reason: the center "+" records a transaction; showing it on a settings or list screen makes it look like "add a member / add an asset". Full-screen flows (Catat 04, Setup 01) also have no nav. Screens without the nav pad the bottom with the home-indicator inset.
Sticky page action: the main action of a screen (Simpan, Tambah aset, Lanjut, Unduh, Hubungkan ulang) lives in a footer that does not scroll: `flex: none`, `surface-raised` background, 1px top `line`, padding 12px 16px plus the safe-area inset. The content above scrolls and ends with 24px padding. The same applies inside bottom sheets: title and fields scroll, the buttons stay fixed at the bottom of the sheet (max height 90%). Import has no footer until a file is chosen (the empty state has its own actions). Toasts float 16px above the footer (80px + inset when a footer or the nav is present). Buttons inside an empty state card or a card that is one of several on the screen are contextual and stay in the card: "Catat pembayaran" lives inside the "Zakat <anggota>" card of screen 08 (the screen holds several cards), never in a footer.

## Build spec: Import (decided 10 Nov 2026)
Import is never only "saldo awal". After choosing a file, the user picks what the file is: `Transaksi` (default when Hartafolio already has records) or `Saldo awal`.
- Transaksi: rows are APPENDED as new transactions with the date from the file. Existing records are never changed or overwritten. A row is a duplicate when date + member + asset + location + quantity + price all equal an existing transaction; duplicates are skipped and counted in the "dobel" tile and explained ("9 baris sudah ada ... Dilewati, tidak ditimpa"). Rows dated in a month whose snapshot is closed are still added, but the closed snapshot is NOT recomputed (a note says so).
- Saldo awal: one opening balance per asset on a date the user picks. Assets that already have any transaction are skipped, so the balance is not doubled. Use it for new assets or for the first import (Setup 01 step 4 is this mode).
- Steps stay File, Cocokkan, Periksa, Simpan. The done screen reports "77 transaksi baru ditambahkan dan 9 baris dobel dilewati. Catatan lama tidak diubah." and offers "Urungkan import ini": every import is one batch id, so undo deletes exactly the rows of that batch (toast "Import dibatalkan · 77 transaksi dihapus").
- Writing happens to the connected Google Sheet; nothing is written before the user confirms in Periksa.
Mockups: 10 Import 2a (file dipilih, mode Transaksi), 2k (mode Saldo awal), 2b-2e (cocokkan, periksa), 2f (menyimpan), 2g (selesai), 2l (diurungkan), 2h-2i (export), 2j (template).

## Build spec: Google Sheet (screen 17, 10 Nov 2026)
The connected Google Sheet IS the Hartafolio database: every record is written there as it is made, Hartafolio keeps no copy on its own server. It is not an export. Export (.xlsx or .zip of CSV) is a one-time downloaded copy for backup or other apps; editing it does not change Hartafolio. The screen explains this in the card "Bedanya dengan Export" and warns not to edit the sheet by hand.
Create a new sheet: "Ganti atau buat sheet baru" (or "Buat sheet baru" when nothing is connected) opens a sheet with the user's Hartafolio sheets found in Drive plus "Buat sheet baru". Choosing it explains that Hartafolio creates the file "Hartafolio · Keluarga" in the user's Google Drive with the tabs Transaksi, Aset, Anggota, Lokasi, Snapshot and Pengaturan, empty. The Google permission covers only files created or picked by Hartafolio (scope drive.file), not the whole Drive. The old sheet is not moved or deleted; to carry data over, Export then Import into the new sheet. Other actions: open in Google Sheet, putuskan (data stays in the sheet, can be reconnected), hubungkan ulang after a lost connection.
Mockups: 17 default (terhubung), 2a ganti, 2b buat sheet baru, 2c sheet baru dibuat, 2d keluar dari akun, 2f terputus, 2g hubungkan ulang. (2e "belum terhubung" removed: see Google Sheet is mandatory.)

## Flow audit and entry rules (Ticon, 10 Nov 2026)
Back rule: the back link of a pushed screen names the screen that opened it (a stack, not a fixed parent). A screen with more than one entry point therefore has one mockup per origin, differing only in the back label: 07 Laporan, 08 Zakat and 11 Harga from Beranda ("‹ Beranda") or Alat ("‹ Alat"); 11 Harga and 16 Nishob from Zakat ("‹ Zakat mal"). The real app can use plain history back.
Single home per object: Anggota and Lokasi live only in Alat; Import / Export only in Alat (Aset no longer links to it: the Aset empty state offers "Catat aset pertama"; Setup has its own import step); Aset dan harga only in the Aset tab.
"Tambah aset" (superseded 11 Nov 2026, see Kelola aset below).
Import states (10): no file chosen = upload card + "Belum punya file? Unduh template Hartafolio" card, NO footer. After a file is chosen the footer appears ("Lanjut: cocokkan kolom"). Reading the file shows "Membaca file…" (2m), moving from Cocokkan to Periksa shows "Memeriksa 86 baris…" (2n); both hide the footer and last a few seconds. Template sheet lists Sheet, Kolom wajib and Contoh as labelled rows.
07 Export Excel / PDF boards are sample output files of the Export sheet in 07 Laporan, not screens, so they have no inbound or outbound links.
Checked: no dead links, every screen reachable, every pushed screen has a back link, bottom nav only on the four tab roots.


## Snapshot merged into Laporan (Ticon, 11 Nov 2026)
Snapshot is no longer a menu. The data stays (sheet "Snapshot" in the Google Sheet: one closed row per month, written automatically on the 1st, never recalculated), but the user sees it only inside Laporan.
- Laporan (07) ends with "Riwayat bulanan": the running month ("berjalan · dicatat 1 Des", not tappable) then every closed month, newest first, with total, change versus the previous month, and a chevron. Tapping opens 07·3 "Rincian bulan" (back "‹ Laporan"): family total, per member bars, per category list. A month that came from an import opens 07·3a: total only, with the note that per-member and per-asset detail is not available.
- The month list always shows the family total; the member and USD filters apply to the chart and table above it, not to the list.
- The snapshot date is fixed on the 1st. The "Tanggal snapshot" setting is removed, so every month compares the same point in time.
- Old monthly totals are imported through Import / Export with a third mode, "Nilai bulanan lama" (10·2o): one row per month and total; months already recorded are skipped; no transactions or balances are created.
- Beranda: the attention item reads "Nilai November dicatat 1 Des · Masuk ke riwayat Laporan" and opens Laporan; the sparkline also opens Laporan.
- Alat shortcuts are Laporan and Zakat mal only.


## Kelola aset (Ticon, 11 Nov 2026)
Screen 14 is named "Kelola aset" (subtitle "Daftar aset dan sumber harganya"); the tab stays "Aset". The tab answers "what do we own now", Kelola aset is master data, like Anggota and Lokasi.
- Entries: the "Kelola" button in the Aset header (gear icon + label, outline, red 10px dot when an asset needs a price), Alat › Data › "Kelola aset" (badge "1 perlu harga"), and Beranda › Perlu perhatian › "Isi" (opens the Isi harga sheet directly, 14·2i). Back names the origin: ‹ Aset, ‹ Alat, ‹ Beranda. The "Aset dan harga" card at the bottom of the Aset list is removed.
- Rows show unit, price source and, when nobody holds the asset, "· belum dimiliki".
- Sticky "Tambah aset" opens a sheet over Kelola aset (no screen change): search the catalog first (results have automatic prices), "Tidak ketemu? Buat aset manual" opens the manual sheet (Nama, Jenis, Satuan, Harga). After saving, a sheet says "<aset> ditambahkan · belum dimiliki siapa pun, jadi belum muncul di tab Aset" with "Catat saldo awal" (opens Catat, mode Saldo awal) or "Nanti saja" (toast, stays on Kelola aset). An asset can switch from manual to automatic later through "Sumber harga".
- Inside Catat, "+ Tambah aset baru" stays as the in-transaction shortcut (sheet 2h has the catalog, 2j manual); after saving it returns to the transaction with the asset selected.

## Google Sheet is mandatory (Ticon, 11 Nov 2026)
A sheet is connected in Setup step 1 and the app never runs without one. There is no "belum terhubung" state. "Putuskan sambungan" is replaced by "Keluar dari akun Google": a confirm sheet, then back to Setup › Akun; the data stays in Drive. "Terputus" (deleted, moved, access revoked) remains an error state with "Hubungkan ulang".

## Import conflicts and errors (Ticon, 11 Nov 2026)
Import never overwrites existing records.
- File unreadable (10·2p): wrong format, too large or no header row. Red-bordered card, what can be read, "Pilih file lain" and the template link. Nothing is saved; no footer.
- Saldo awal (10·2r): a row is skipped when that asset + member + location already has any record (saldo awal or transaction). Periksa lists the skipped rows with "Tercatat" vs "Di file"; differences are highlighted gold. To replace an existing saldo awal the user edits or deletes it in Riwayat, then imports again.
- Nilai bulanan lama (10·2q cocokkan: Bulan, Total nilai; 10·2s periksa; 10·2t selesai): months recorded automatically are always skipped (computed from real data); differences are highlighted. A month that itself came from an earlier import can be replaced with "Ganti dengan nilai dari file". Undo removes the months added by that import.

## Export: one sheet, two modes (Ticon, 11 Nov 2026; renamed "Ringkasan | Data lengkap")
Every export opens the same content with a segmented toggle "Ringkasan | Data lengkap". The word "cadangan" is not used anywhere in the UI.
- Ringkasan: a monthly summary that is easy to read (chart, per asset type, per member, recent transactions). One period (month, quarter, or a picked month); follows the member and currency filters when opened from Laporan. PDF (2 pages) or Excel (Ringkasan, Per anggota, Per aset, Transaksi periode ini). Button "Unduh ringkasan PDF/Excel"; file Hartafolio-Ringkasan-<periode>.pdf/.xlsx.
- Data lengkap: always all data since the start, no date range, ignores screen filters. Excel in exactly the template format (re-importable) or CSV per sheet in a .zip for other apps. Button "Unduh data lengkap"; file Hartafolio-Data-lengkap-<tanggal>.xlsx/.zip.
- Entry points and the preselected mode: Laporan › header button "Export" (download icon, right of the title, same style as "Kelola" on Aset) → Ringkasan (07·2e; 07·2h shows Data lengkap); Alat › Import / Export › tab Export → Data lengkap (10·2h; 10·2v shows Ringkasan); Google Sheet › "Unduh data lengkap" → sheet with Data lengkap formats only (17·2h). Setup has import only.

## Kelola aset: delete, hide, and the manual form (Ticon, 11 Nov 2026)
- "Ubah <aset>" ends with "Hapus aset" (danger text button). Rules, updated 11 Nov: still held (balance > 0) → "belum bisa dihapus", sell or move it to zero first (14·2j); balance 0 with history ("terjual habis") → cannot be deleted, "Sembunyikan dari daftar" instead (14·2l); no history → delete after confirm (14·2k). See "Aset tersembunyi" below.
- Manual asset form: Jenis is a single-select chip row (Emas, Perak, Crypto, Saham, Reksa dana, Mata uang, Properti, Lainnya), never free text, because the zakat calculation depends on it; the hint under it says how that type is counted for zakat. Satuan is a segmented control whose options follow Jenis (Emas/Perak: gram, oz; Crypto: koin, token; Saham: lot, lembar; Reksa dana: unit; Mata uang: nominal; Properti: unit, m²; Lainnya: unit, gram, lot, lembar). The price label reads "Harga per <satuan>".
- Import "Nilai bulanan lama" column sheet offers only Bulan, Total nilai, Mata uang, Abaikan (10·2u). The transaction column list uses "Abaikan" (short label) as well.


## Shared "Tambah aset" component (Ticon, 11 Nov 2026)
Catat and Kelola aset use the same two sheets, pixel for pixel.
- Picker: title, search field with icon ("Nama atau kode aset"), category chips, sections of rows (name, sub, category badge), and a pinned footer "Tidak ada di daftar? …" + "+ Tambah aset baru". Only the content differs by context: Catat is titled "Cari aset lain" and adds the section "Dipakai anggota lain" (choosing an asset for this transaction); Kelola aset is titled "Tambah aset" and lists only "Katalog harga otomatis" (assets not yet in the family list). Picking a catalog row in Catat selects it for the transaction; in Kelola aset it adds it and offers "Catat saldo awal".
- Manual form ("Aset manual"): Nama, Jenis chips (8) with the zakat hint, Satuan segmented by Jenis, Harga per satuan; sticky footer "Tambah aset" + "Kembali ke daftar". After saving, Catat returns to the transaction with the asset selected; Kelola aset shows the saldo awal offer.

## Aset tersembunyi (Ticon, 11 Nov 2026)
- Only assets with balance 0 and history can be hidden. Hidden assets are removed from Kelola aset, the Catat picker and the Aset tab; their transactions stay in Riwayat and in closed months.
- Kelola aset ends with group "Lainnya" › "Aset tersembunyi" with the count. It opens a sheet listing hidden assets (name, type, "Terjual habis <bulan> · n transaksi"); pick one and tap "Tampilkan <aset> lagi" (14·2m). The asset returns to its group with the sub "terjual habis <bulan>" and a toast (14·2n).
- An import row or a "Cari aset lain" search that matches a hidden asset shows it with the tag "tersembunyi"; using it makes it visible again automatically.

## Zakat: only gold and silver (client decision, 11 Nov 2026)
- Zakat mal counts only emas and perak, physical and digital (gold/silver tokens such as PAXG and XAUT, gold/silver ETFs such as GLD and SLV). Uang, saham (including gold-mining stocks such as GFI), crypto other than gold/silver tokens, reksa dana and properti are not counted. This replaces the earlier "emas + uang" rule.
- Two separate cards per member: Emas (nishob 85 g) and Perak (nishob 595 g); each shows "fisik X g · digital Y g". Nishob and haul run per metal.
- The asset's Jenis decides it: only Jenis Emas and Perak count. Digital or non-gram units need "Gram per satuan" (asset field; the catalog fills it, the manual form asks for it when Jenis is Emas/Perak and Satuan is not gram; 14·2o). 1 oz = 31,1035 g.
- Paying zakat can still come from any asset (IDR, USDT…): the payment source is not the zakat base.
- Copy updated: Zakat intro, empty state, info sheet, Nishob screen, the Jenis hints in both asset forms ("Tidak dihitung untuk zakat mal. Zakat hanya dari emas dan perak.").
- Data fix: GFI is a US stock in US$ per lembar (was IDX per lot).

## Import only from the Hartafolio template (Ticon, 11 Nov 2026; supersedes every earlier Import rule)
The app does not read broker or exchange formats (Binance, Bybit, Pluang…). Import accepts ONLY the Hartafolio template (.xlsx) or a Data lengkap Excel file; anything else is rejected and no data is saved. Data from a broker is copied into the template by the user; a few transactions are faster through the + button. This supersedes every earlier mention of import modes, "Cocokkan kolom", "Pilih arti kolom", "Isi file ini adalah", "Nilai bulanan lama" as a mode, "format belum dikenal" and "Padanan nilai". Full spec on the canvas board "Template Hartafolio · format baku" (page Alur & IA) and the sample file Hartafolio-Template-Azlan.xlsx.

Template file (downloaded per account from 10 · 2k or Setup step 4, named Hartafolio-Template-<nama>.xlsx):
- Petunjuk; Transaksi (the only required sheet); Aset (optional: only new assets that are not in the price catalogue); Nilai bulanan (optional: months before using Hartafolio); a hidden Daftar sheet that feeds the dropdowns (explained in Petunjuk: not read on import, do not edit, unhide via right-click, download again for fresh lists). No Anggota/Lokasi sheets: they are dropdown sources only.
- Transaksi columns: Tanggal*, Jenis* (Saldo awal, Beli, Jual, Masuk, Keluar, Pindah, Zakat), Anggota*, Aset*, Jumlah*, Lokasi*, Harga per satuan (Beli/Jual; Saldo awal = harga beli rata-rata, optional), Mata uang (price and fee currency, IDR when empty; for a Pindah fee it may be the asset code, e.g. BTC), Biaya, Kurs (Rupiah per 1 unit of Mata uang; empty = daily average of Tanggal; Data lengkap always writes the stored rate), Dibayar dengan (Beli: asset that decreases; Jual: asset that receives the proceeds; empty = outside Hartafolio; when it is an asset, Mata uang = that asset), Lokasi bayar (location of the paying asset; empty = same as Lokasi), Ke anggota, Ke lokasi, Catatan, ID (order number; prevents duplicates on re-import).
- Aset columns: Kode*, Nama*, Jenis aset*, Satuan*, Gram per satuan (Emas/Perak not in gram), Mata uang harga, Sumber harga (Otomatis/Manual), Harga manual. Nilai bulanan: Bulan (YYYY-MM), Total (IDR).
- Dropdowns: Jenis, Jenis aset, Satuan, Sumber harga are fixed lists and reject other input. Mata uang (IDR, USD, USDT, SGD, EUR) only warns, because a Pindah fee can be an asset code. Anggota, Lokasi, Aset, Ke anggota, Ke lokasi, Dibayar dengan are filled from the account when the template is downloaded and only warn on a new name, which is created after review.

Import flow (10 and Setup step 4 are the same: File · Periksa · Simpan):
- 10 empty: two numbered cards "1 Unduh template" (outline button) and "2 Isi, lalu pilih filenya" (primary "Pilih file template"), plus "Hanya beberapa transaksi? Lebih cepat lewat tombol +". No footer.
- 10 · 2a file chosen: one row per sheet read (Transaksi wajib, Aset, Nilai bulanan, Petunjuk "tidak dibaca"); footer "Lanjut: periksa N baris". 2b reading, 2d checking (busy, no footer).
- 10 · 2c not a template: "Ini bukan template Hartafolio", lists the missing required columns, says the app does not read broker formats, primary "Unduh template Hartafolio", link "Pilih file lain". No footer.
- 10 · 2e Periksa: tiles siap disimpan / perlu dilengkapi / dilewati; "Dibuat otomatis" (new location/member/asset names; an asset that is neither in the catalogue nor in the Aset sheet gets a gold "Lengkapi" button, sheet 2f: Nama, Jenis chips, Satuan by Jenis, Gram per satuan when needed); "N baris tidak bisa dibaca" by row number (skipped; fix the file and import again, rows already imported do not duplicate); "baris sudah ada"; saldo awal already recorded (tercatat vs di file); months already recorded. Footer disabled "Lengkapi 1 aset dulu" until done (2g), then "Simpan 77 transaksi dan 12 bulan".
- 2h saving, 2i done with "Urungkan import ini" (one batch id), 2j undone toast.
- Never overwrite: unchanged.
- Setup: 01 · 4 / 4a (no file yet, no segmented control: title "Punya catatan lama?", ONE card with two numbered steps "1 Unduh template" (outline button with a download icon, label "Template tabel Hartafolio") and "2 Isi, lalu unggah" (primary "Pilih file template" with an upload icon); footer outline "Lewati, mulai dari nol" and the line "Import juga bisa dilakukan nanti dari menu Alat") / 4c Periksa with 1 asset to complete / 4d ready / 4e done. The fourth Setup segment splits into 3 ticks. There is no "Mulai kosong" mode and no board 4b: starting empty is the skip button (see "Step 4, Import template").

## Export formats (Ticon, 11 Nov 2026)
- Ringkasan · PDF (06 · Hasil export, PDF, 2 pages): title "Ringkasan bulanan", change this period, 6-month bar chart, per asset type, per member, recent transactions, calculation notes. Follows period and filters. File Hartafolio-Ringkasan-<periode>.pdf.
- Ringkasan · Excel (06 · Hasil export, Excel): sheets Ringkasan, Per anggota, Per aset (holdings with amount, unit, price, value), Transaksi (that period). Rupiah, no rounding.
- Data lengkap · Excel (06 · Hasil export, Data lengkap, new boards): exactly the template format without Petunjuk/Daftar, plus Anggota, Lokasi, Pengaturan; Aset gains "Tersembunyi", Nilai bulanan gains "Sumber" (Otomatis/Import). The separate "Snapshot" sheet no longer exists. Re-importable. File Hartafolio-Data-lengkap-<tanggal>.xlsx.
- Data lengkap · CSV (.zip): one CSV per sheet, same columns, for other apps; cannot be imported.
- Data lengkap has no date range: it is always everything, so it can restore a sheet.

## Catat transaksi (04), I1–I6 (Ticon, 11 Nov 2026)
- Tabs: Beli · Jual · Masuk · Keluar · Pindah. "Terima" is renamed "Masuk" everywhere (earlier mentions of Terima mean Masuk). Saldo awal keeps its own screen; Zakat is recorded from the Zakat screen and stored as Jenis Zakat.
  - Beli/Jual: exchange at a price. Masuk: comes in from OUTSIDE Hartafolio without buying (Asal: Hadiah, Warisan, Dari dompet luar, Lainnya). Keluar: goes OUTSIDE without selling (Alasan: Hadiah, Sedekah, Ke dompet luar, Hilang, Lainnya). Pindah: between locations/members that exist in Hartafolio.
  - Hints (one line each, 12 Nov 2026): Beli "Aset bertambah. Bila dibayar dengan aset tercatat, saldonya ikut berkurang." Jual "Aset berkurang. Hasilnya bisa masuk ke aset tercatat." Masuk "Datang dari luar tanpa dibeli, misalnya hadiah atau warisan." Keluar "Pergi ke luar tanpa dijual, misalnya hadiah atau sedekah." Pindah "Antar lokasi atau anggota. Total harta tetap, kecuali biaya."
- I2 "Dibayar dengan" (Beli) / "Hasilnya masuk ke" (Jual): chips "Di luar Hartafolio" + every currency asset (USDT, USD) the member holds at the same location, e.g. "USDT · Binance" (default when it exists), + a dashed chip "Aset lain…" that opens the sheet "Bayar dengan aset lain" (04 · 2o) with two groups: "Mata uang di lokasi lain" (e.g. USDT · Bybit; note: if the money was moved first, record a Pindah so the transfer fee is kept) and "Aset lain di <lokasi>" (non-currency holdings, e.g. BTC · Binance; note: works like a swap, the paying asset is treated as sold at its market value that day). Only assets the member holds in Hartafolio are listed. The chosen asset becomes a chip. Caption shows the balance change; over the balance it turns red and Simpan is disabled. 04 · Beli (USDT), 2a Jual (USD · Pluang), 2m dari luar, 2p bayar BTC, 2q USDT dari Bybit.
- I3 Price currency: mini toggle IDR · USD · USDT next to "Harga per <satuan>" when paying from outside; when paying with an asset the price is written in that asset (badge "dalam BTC · ikut alat bayar", e.g. 0,043171 BTC per PAXG). Non-IDR shows an editable field "Rp per 1 <USDT/BTC>" filled automatically (see "Kurs ke Rupiah" below). Total "99,66 USDT · Rp 1,64 jt".
- I4 Biaya (opsional) on Beli/Jual in the price currency; on Pindah with a toggle Rp · <aset> (network fee in the asset).
- I5 Keluar tab (04 · 2k) with the balance check under Jumlah; Jual also checks the balance.
- I6 Saldo awal: "Harga beli rata-rata (opsional)" with currency toggle; empty = unknown.
- I1 Ubah transaksi (04 · 2l) from Riwayat › Detail › Ubah: prefilled with that transaction. The Jenis rail is replaced by a read-only row "Jenis transaksi [Beli]" with "Tidak bisa diubah karena terhubung ke catatan lain… Salah jenis? Hapus transaksi ini lalu catat ulang." (a type change rewrites linked entries: the paying asset, the two sides of a Pindah). Gold note that balances from that date are recalculated, footer "Simpan perubahan" + red "Hapus transaksi". Close returns to Riwayat detail, save to Riwayat with toast "Perubahan disimpan · saldo dihitung ulang" (05 · 2g).
- Tanggal (above Jumlah, every mode; supersedes the Sekarang/Kemarin chips, 12 Nov 2026): one field, prefilled with today and the current time ("Hari ini, 11 Nov 2026 · 14.20"), calendar icon on the right. Tapping opens the sheet "Tanggal dan jam" (04 · 2n): month calendar (Monday first, future days disabled, today ringed, selected filled brand), a wheel for hour and minute (minutes in steps of 5), a "Sekarang" link that resets both, footer "Pakai 10 Nov · 14.20". No typing. Saldo awal "Tanggal saldo" uses the same picker. Changing the date refreshes the default price and rate (04 · 2r); a rate the user typed is kept.
- Kurs ke Rupiah (non-IDR price): editable field, caption one line under it:
  - Today: "Real-time · 14.20" with a small pulsing live dot. The rate is the live rate when the form opens and is frozen when the transaction is saved.
  - Earlier date: "Rata-rata 10 Nov" = the daily average of that date (crypto: mean of the hourly candles; fiat: the provider's daily mid/close when it has no intraday data). The hour does not change the rate.
  - Typed by the user: "Diisi manual" + a reset icon button inside the field (aria-label "Kembali ke kurs otomatis") that restores the automatic value for the chosen date (04 · 2s).
- Placeholders in inputs use weight 400 and ink-muted at 75% opacity, never the 600 weight of a filled value.
- Riwayat filter Jenis: Semua, Beli, Jual, Masuk, Keluar, Pindah, Saldo awal; saldo awal rows show Jenis "Saldo awal".
- I10 Catat is a modal. Close (X) and save return to the screen that opened it (data-prop `dari`): Beranda (04), Aset (3a; saldo awal 3d), Riwayat (3b), Alat (3c), Kelola aset (saldo awal 3e), Laporan kosong (3f), Zakat kosong (saldo awal 3g), Harga terkini (3h). After saving, the opener shows a toast "Beli PAXG 0,0225 tersimpan" with the outline action "Lihat" (to Riwayat detail): Main 2h, 03 · 2d, 09 · 2d, 14 · 2p; from Riwayat the toast has no action because the new row is on top (05 · 2f). The + buttons and empty-state links of each screen point to their own variant.

## Copy voice (audit 12 Nov 2026, board Alur 6)
- Calm and plain, like someone looking after family money. One core sentence per hint: what happens, then what the user can do. Longer explanations move to a link, a sheet, or the template's Petunjuk.
- Number first ("77 transaksi tersimpan", "Kurang 46,7 g lagi"). Buttons are verbs (Simpan transaksi, Unduh template, Pilih file, Pulihkan), never "OK" or "Lanjut".
- Fixed terms: nishob, haul, saldo awal, Data lengkap, Nilai bulanan (never "Snapshot"), Masuk/Keluar (never Terima/Kirim), Pindah, Lokasi. Errors always give the way out ("Dilewati. Perbaiki lalu import lagi; tidak akan dobel.").
- 75 strings were shortened, on average by 45%. Do not reintroduce the longer versions.

## Motion and gradient (audit 12 Nov 2026, board Alur 7)
Rules live at the end of `components/bundle.css`. Short, calm, never bouncy; everything is switched off under `prefers-reduced-motion`.
- Press: buttons, chips, select options and the + button scale to .97 (120 ms). Colour/state transitions 180 ms.
- Bottom sheets (`[role="dialog"]`) rise 24 px + fade, 320 ms, `cubic-bezier(.2,.8,.2,1)`. Toasts rise 12 px, 300 ms. Select menus 160 ms.
- Progress tracks (`.hf-track > span`, Zakat) grow from the left, 900 ms.
- Beranda: the total counts up once (900 ms, `@property --n`), the sparkline draws in with a soft area fill, the donut sweeps in, member rows rise in a 60 ms stagger. Tapping a member row highlights its segment (others drop to 22% opacity, the selected one thickens) and the donut centre shows name, value and "x% dari total"; tap again to clear. Caption: "Ketuk baris untuk menyorot · % sejak awal dicatat".
- Laporan: bars grow with a 60 ms stagger; each bar is a button. The selected bar is full strength, the others 55%; the card head shows that month's value and change.
- Harga mini rows: a 24-hour sparkline per asset and a short flash when a price changes. Only one looping animation per screen (the live dot).
- Gradients: one hue to a 14–22% lighter tint of the same hue, never two hues. Used on the Beranda hero card, the primary button, the + button, chart fills (area 28% → 0%; bars light brand → brand; losses use the loss hue) and the urgent attention item (gold-soft). Never on text, icons, the screen background, chips or disabled buttons.
- Placeholders: weight 400, ink-muted, 75% opacity, globally. Inputs get the `focus-ring` outline on `:focus-visible`.
- Still to build as components (not yet in the mockups): one Sheet component (handle, title + close, max-height 82%), a fixed toast position 16 px above the nav or footer, an `.hf-input` (label, help, error, trailing action) and one 32 px dashed "chip-add".

## Build spec: kurs ke Rupiah (Ticon, 12 Nov 2026) — implement exactly
Applies to every amount in a non-IDR currency (USD, USDT, SGD, EUR) or priced in another asset (BTC, PAXG) when it is converted to Rupiah: Catat (Beli, Jual, Saldo awal harga beli, Biaya), Ubah transaksi, Zakat bayar dari aset, and Import.

Which rate is the default
- Transaction date = today (device time zone, Asia/Jakarta by default): the live rate at the moment the form opens. Caption "Real-time · HH.MM" with the live dot. If the form stays open more than 5 minutes, refresh the default once and update the time in the caption (never while the user is typing in the field).
- Transaction date before today: the daily average of that calendar date. Crypto and crypto-quoted assets (USDT, BTC, PAXG): mean of the 24 hourly candle closes for that date. Fiat (USD, SGD, EUR): the provider's daily mid rate, or its daily close when it has no intraday data. Caption "Rata-rata D Mmm". The chosen hour never changes this rate.
- No rate for that date (weekend or holiday for fiat): use the last available rate before it and caption "Rata-rata D Mmm (kurs D Mmm)". No rate at all (provider down): leave the field empty, show the field error "Kurs belum tersedia. Isi manual." and keep Simpan disabled until a value is entered.
- Date changes (picker): re-run the default for the new date unless the rate is manual.

Manual override and reset
- Typing a value sets source = manual; caption "Diisi manual"; a reset icon button appears inside the field (aria-label "Kembali ke kurs otomatis"). Reset restores the automatic default for the currently chosen date and source = otomatis. A manual rate survives date changes.

What is stored (never recompute later)
- Per transaction: `kurs` (Rp per 1 unit, decimal, not rounded), `kurs_sumber` (realtime | rata_harian | manual | import), `kurs_tanggal` (the date the rate is for), `kurs_waktu` (timestamp of the live quote, realtime only). Rupiah values shown anywhere for that transaction use this stored rate. Saving freezes it.
- Ubah transaksi opens with the stored rate and source. Changing only notes, amount or location keeps the stored rate. Changing the date re-runs the default unless the source is manual.
- Portfolio value today does NOT use transaction rates: it uses today's prices. Transaction rates only feed cost basis, untung-rugi and the Rupiah value of that event.

Import
- Column "Kurs" (after Biaya, optional; decided by Ticon 12 Nov 2026). Filled = stored as is (source = manual). Empty on a non-IDR row = daily average of Tanggal (source = import), or the live rate when Tanggal is today. Rows in the past where no rate exists are listed in Periksa as "Kurs belum tersedia" with the row number and skipped.
- Data lengkap always writes the stored rate in Kurs for every non-IDR row, so restoring never changes historical Rupiah values. Boards: Alur 5 (Template), 06 · Hasil export Data lengkap.

## Beranda donut (Ticon, 12 Nov 2026)
- 208 px, ring radius 86 in a 200 viewBox, stroke 14 with round caps, a 6-unit visual gap between segments (dash = arc − 6 − stroke). Every segment gets at least 26 units of arc (so a 1% share is a short pill, never hidden under a neighbour's cap); the other segments are scaled to fill the rest. The legend keeps the true values, a surface-sunken track behind, segments start at 12 o'clock clockwise, largest first. A segment too small for its caps is drawn as a dot.
- Centre (max width = inner diameter − 2×40 px padding, never overlapping the ring): label 12/18 ink-muted, value 20/28 bold nowrap, and when a row is selected a brand-soft pill "x% dari total" (12/18, 600).
- Selected row: its segment thickens to 20, others drop to 22% opacity; tap again to clear. Reference pattern: thin rounded-segment rings as in Apple Screen Time and Revolut analytics; the value lives in the centre, the legend carries the detail.
- The `.hf-donut` rules in bundle.css still describe the older 168 px / stroke 22 version used in the BreakdownCard preview; the Beranda mockups override them in their own styles. Build the component from this section.

## Components v2 and the audit of 12 Nov 2026 (board Alur 7) — build from these, not from inline styles
All rules are classes in `components/bundle.css`. Mockups may add layout inline (grid placement, width, margin) but never size, padding, radius or type.

Type scale (11 steps; nothing else is allowed): amount-hero 32/38/700 · amount-lg 24/32/700 · title 22/30/700 · amount-md 20/28/700 · heading 16/24/600 · input 16/24 (400, numbers 600) · body 15/24/400 · amount 15/22/600 (row names 15/22/500–600) · body-sm 14/20/400–600 · label 13/20/500 · caption 12/18/400 · micro 11/16/600. Weight 700 only from 20 px up. Inputs are 16 px so iOS never zooms.

Spacing and shape: gaps 4, 8, 12, 16, 20, 24 only (two stacked text lines 4). Radius sm 8, md 12, lg 20, pill. Card padding 16, rows 14/0, sticky footer `12px 16px calc(safe-bottom + 12px)`. Colours only from tokens; hex only inside gradients and masks.

Button
- `.hf-btn` md: 48 high, padding 0 20, gap 8, radius 12, 15/22/600, icon 20. Variants: primary (gradient brand), default outline (surface-raised, line-strong border, ink text: the only outline style), ghost (text), `.hf-btn-danger` (loss text), `.hf-btn-on-ink` (gold outline on the dark toast).
- `.hf-btn-sm`: 36 high, padding 0 12, gap 6, radius 8, 14/20/600, icon 16.
- Ghost that is not block = text action: 36 high, no padding, 14/20/600, aligned with the text above it.
- Placement: sticky footer → md, full width of the screen. Inside a card → md, full width of the card (or of the content column when the card has step numbers). A pair inside a card → `.hf-actions`, Batal (outline) left, main action right, 1 : 1.6. Screen or card header, row actions, toasts → sm, hug.

Segmented control (`.hf-toggle`): outer radius 12, inset 3, inner radius 9 so the corners are concentric. Full-width segments 40 high (14/20/600); mini segments 28 high (12/18/600).

Input (`.hf-input`, `.hf-input-num` for amounts): 48 high, padding 0 12, border 1.5 line-strong, radius 12, 16/24. Pickers that open a sheet (Tanggal) are `button.hf-input` with the value left and the icon right. Error = `aria-invalid="true"` → loss border. `.hf-select-btn` and native selects are 48 too.

Sheet: `.hf-scrim` + `.hf-sheet` (radius 20 top, `.hf-sheet-handle` 40×4, padding 8/16/12 + safe area, gap 12, max 88% of the screen) or `.hf-sheet-flush` for sheets whose list scrolls (padding 8/0/0, gap 0, the content pads itself). Rises 24 px in 320 ms.

Toast (`.hf-toast`): dark ink pill, radius 12, min 52 high, padding 8/8/8/16, text 14/20, one `.hf-btn-sm.hf-btn-on-ink` action. Position is always 16 px above whatever sits at the bottom: bottom bar → `--toast-bottom: calc(var(--safe-bottom) + 83px)`; one-button sticky footer → `+ 85px`; nothing → `safe-bottom + 16px` (default).

Chip "add" (`.hf-chip.hf-chip-add`): the normal 32 px chip with a dashed line-strong border, ink-muted text and a Lucide plus icon. Never a typed "+".


## Desktop and tablet (12 Nov 2026, canvas pages "Desktop 1440" and "Tablet 1024")
Same tokens, type scale and components as mobile; only the shell and the placement of overlays change. 39 boards (WD-*, WT-*): every main screen plus the states whose layout differs on a wide screen.

Breakpoints
- Mobile < 768: bottom nav with the + button (existing boards).
- Tablet 768–1279 (board 1024×768 landscape): 88 px rail on the left: logo, the Catat button (52×52, radius 16, brand gradient) on top, then Beranda, Aset, Riwayat, Laporan, Zakat, Alat (icon 24 inside a 44×28 pill that turns brand-soft when active, label 11/16). Harga, Kelola aset, Anggota, Lokasi, Import live under Alat as on mobile. Content padding 24, gap 16.
- Desktop ≥ 1280 (board 1440×900): 248 px sidebar: logo, "Catat transaksi" primary block button, primary items (Beranda, Aset, Riwayat, Laporan, Zakat mal with a count badge, Harga), section "Data" (Kelola aset with a loss count badge, Anggota, Lokasi, Import / Export, Pengaturan), account row at the bottom (Google Sheet sync status). Items 40 high, radius 12, 14/20; active = brand-soft background, brand text 600. Content padding 32/40, max width 1120, centred.
- Laporan and Zakat are first-level on tablet and desktop (they sit under Alat on mobile only because the bottom bar has five slots).

Grid: 12 columns, gap 24 (desktop) / 16 (tablet). Page header: title 22/30 left, actions right (sm buttons, select, Live pill). Desktop Beranda: hero with a 6-month area chart (8) + Perlu perhatian (4); donut with legend beside it (7) + Harga terkini (5); Transaksi terakhir (7) + Zakat mal (5). Tablet stacks hero and donut full width, the rest in two columns.

Tables replace stacked rows when there is width: Aset (aset · lokasi, pemilik, jumlah, harga, nilai, perubahan, grouped by jenis with a 12 px allocation bar on top), Riwayat (date groups, jam, jumlah, nilai saat itu), Harga (jenis, 7-day sparkline 110 px, harga, 24 jam), Laporan nilai bulanan, Import Periksa (with the Kurs column). Numbers right-aligned, tabular. Rows highlight on hover (surface-sunken 60%).

Overlays
- Bottom sheets become a centred dialog (`.wx-dialog`: radius 20, max-height 86%, header 20/24 with a 40 px round close button, body padding 24 with gap 20, footer with a top border; actions right-aligned and hug, or total left + actions right in Catat). Widths: Catat 720 (two-column fields: Anggota|Lokasi, Tanggal|Jumlah, Harga|Kurs, Biaya|Bukti), Zakat bayar 600, Export 520.
- Details open in a right side panel (`.wx-panel`, 420 desktop / 400 tablet) over a light scrim (ink 18%), list stays visible: Riwayat rincian with Hapus | Ubah at the bottom (1 : 1.6).
- Pickers open as a popover under their field instead of a sheet: Tanggal = month calendar + hour/minute columns side by side, "Sekarang" and "Pakai …" at the bottom.
- Master–detail instead of a new screen where it saves a step: Kelola aset list (6 cols) + edit form (6 cols).
- Toast: bottom-left of the content area (left = sidebar/rail width + content padding), 440 wide, 24 px from the bottom.
- Setup on desktop: 480 px brand-tinted side panel (value props) + a 560 px centred form; on tablet the form alone, centred.

Button placement follows the same rules: md block inside cards and side panels; dialogs and page headers use hug buttons aligned right.

## Setup updates (Ticon, 13 Nov 2026)
- Splash (`00-Splash`): one screen before step 1. Plain `--surface` background (no gradient), 96 px mark, "Hartafolio" in `.title`, tagline "Harta keluarga, tercatat rapi.", a 96 px `.hf-track` + caption "Menyiapkan data Anda" at the bottom. Tapping opens step 1.
- Step 2 "Hubungan" is a select button that opens a sheet (same pattern as "Jenis lokasi"). Options, in this order: Diri sendiri, Pasangan, Anak, Orang tua, Saudara, Lainnya.
- Icon button that opens an inline form (pencil in step 3): while the form is open the button is active (`aria-expanded="true"`, `--brand-soft` fill, `--brand` icon, 1.5 px inset brand ring) and its row stays visible above the form. Tap again to close.
- Step 3 empty-state copy must name what is on screen: "Pilih di Tambah cepat, atau ketuk Lokasi lain."
- Step 3 description (user-edited, do not revert): "Lokasi membantu memisahkan aset yang sama di tempat berbeda."

## Round 2 (Ticon, 13 Nov 2026)

Sheet gap rule: gap follows how much text a row carries, not one fixed value.
- Single-line options, up to 8 rows (Hubungan): gap 4, padding-inline 8.
- Two-line options (title + description), 5 or more rows (Jenis lokasi): gap 8.
- Two-line options, 4 or fewer rows: gap 4.
- Bordered radio cards: gap 8. Popover menus and divider lists keep their own spacing.
Rows are min 48 px, radius 12, selected = `--brand-soft` + check.

Artboard roots that hold an overlay (sheet, scrim, toast) must have `position: relative`. Without it the rising sheet animation extends the document and a second scrollbar appears next to the artboard's own (cause of the double scrollbar in step 2, Hubungan open).

Button states (bundle.css, block "Button states"): text colour is locked per variant, so a page-level `a:hover` colour can never change it.
| Variant | Hover (pointer only) | Active/pressed | Text |
| --- | --- | --- | --- |
| primary | gradient darkens 6 / 18 % | darker again, no shadow | `--on-brand` always |
| outline (default) | `--surface-sunken` + border `--ink-muted` | sunken + border `--ink` | `--ink` |
| ghost | `--brand-soft` | brand-soft stronger | `--brand` |
| danger | `--loss-soft` | stronger | `--loss` |
| on-ink | white 12 % over ink | white 20 % | white |
| gold (`.hf-btn-gold`) | gold darkens | darker | dark ink |
Hover is wrapped in `@media (hover: hover)`, so touch screens never show a stuck hover. Disabled buttons have no hover. Inline gold buttons were replaced with `hf-btn hf-btn-sm hf-btn-gold`.

Step 4, Import template (replaces the segmented control):
- The step is optional and says so: the footer always shows the primary action and an outline "Lewati, mulai dari nol", so skipping never needs scrolling. Before a file is chosen the primary is "Pilih file template"; after, "Periksa file".
- One vocabulary everywhere. File card lines: nama file, ukuran, jumlah baris. Template of this example: 88 baris = 81 transaksi (11 di antaranya saldo awal) + 7 nilai bulanan; sheet Aset kosong.
- Periksa: stacked bar + legend with three states only: Siap (81), Perlu dilengkapi (5), Dilewati (2). Rows beneath use the same three words as chips. Footer "Simpan 81 baris" stays disabled-looking until nothing is left to complete, unless the user skips the 5 rows.
- Lengkapi (board 4f): tap opens a sheet per unknown asset with Nama, Jenis, Satuan. Simpan marks the row done and shows a toast (86 siap / 0 perlu dilengkapi / 2 dilewati). "Lewati 5 baris" moves them to Dilewati (81 / 0 / 7) and the footer reads "Simpan 81 baris".
- Selesai: 79 transaksi, 7 nilai bulanan, 9 aset baru, 2 baris dilewati.
- Board 4b (Nol) is removed; "start empty" is the skip button, not a mode.

Wide layouts added: Splash, Setup-2 and Setup-2 with the Hubungan popover (popover under the field instead of a sheet), Setup-4, Setup-4 Periksa and Setup-4 Lengkapi (dialog 520), for desktop and tablet.

## Round 3

- Tab name: "Lainnya" is now **Alat** (wrench icon). In running text always write "menu Alat", never a bare name. "Lainnya" stays only as a value (asset category, location type).
- Header: Hartafolio logo + **bell** (`.hf-iconbtn`, 44 px circle, `.hf-countbadge`, `.is-loss`). The bell holds every "perlu perhatian" item in a sheet over a dimmed scrim (`.hf-notif` rows, each navigates to its screen; empty state "Semua beres"). The "Live" pill and the Beranda "Perlu perhatian" section are gone. The zakat reminder uses a calendar-clock tile, never a bell, so the two cannot be confused.
- Zakat card button follows status: mendekati = default, hari H = `.hf-btn-gold` (gradient), terlambat = `.hf-btn-loss` (gradient). Hover for pointer only, active darker.
- Donut: no track/rail; segments animate on load, on per-aset/per-anggota toggle and on dropdown change (retrigger by alternating keyframe names per state counter). Center shows name, context line (e.g. "Emas / Azlan"), value, share. More than 5 items: top 4 + "Sisanya" (`.s6`, `--chart-more`) expandable. Chart palette: `--chart-3` and `--chart-5` retuned, `--chart-more` added.
- Sparkline end dot: line is revealed with a clip-path wipe, because `stroke-dasharray` under `vector-effect: non-scaling-stroke` is measured in screen px and truncated the line.
- Toast: inside the sticky footer (`position: relative`), `--toast-bottom: calc(100% + 17px)` = 16 px above the footer.
- "No. referensi" (optional) in template, export, Catat and Riwayat: order number, receipt or broker transaction hash. A matching reference already in the Sheet makes the row "Sudah ada" and it is skipped.
- Import states 4g to 4q and the rule table Alur-8 define every condition. New page "Arsip" keeps rejected designs with reasons.

Hollow buttons (`.hf-btn-ghost`, including ghost + danger) and text links never get a background on hover or press. Feedback is an underline plus a slightly darker text colour. Buttons with a border or fill (outline, primary, gold, loss) keep their own states.

## Round 4

- Border weight follows role, not just "is it tappable". Things whose only affordance is their outline (input, select, outline button, outline icon button) use `--line-strong` at 1.5 px. Segmented controls / view toggles (`.hf-toggle`) and chips are a filled track (`--surface-sunken`) with a 1 px `--line` hairline; the selected segment is raised (`--surface-raised`) with brand ink. A strong border there makes it compete with inputs (Emphasis, Course 5 Module 2).
- Count badges (`.hf-countbadge`, `.hf-attn-count`) use `--badge-gold` with `--on-badge-gold`: deep gold with white digits in light mode (5.6:1), the bright gold with dark digits in dark mode. White on the bright `--gold-fill` is only 2.7:1 and is not used. Size 22 px, 12 px bold.
- Zakat "mendekati" button: `.hf-btn-gold-line` (white, gold border), so it matches the gold card without competing with the filled `.hf-btn-gold` of hari H.
- Donut sweep starts at 12 o'clock, clockwise. The mask is offset 6° so the round cap of the first segment is not cut.
- "No. referensi" lives inside the Bukti section of Catat (photo + number); no separate field.

## Round 5 rules (Ticon, 14 Nov 2026)
- Border by role (Course 5 module 2: emphasis, figure-ground, unity with variety): controls that are defined by their outline (`.hf-input`, `.hf-select-btn`, outline `.hf-btn`, `.hf-iconbtn`) use `--line-strong` 1.5. Segmented controls (`.hf-toggle`) and chips are a filled sunken track with a 1px `--line` hairline and a raised selected segment, so they never compete with inputs and dropdowns.
- An open dropdown (member menu) stays above the scrim: `.hf-select` is z-index 30 while its menu is open, 10 when a sheet is open (the sheet dims it).
- Add-forms are one component wherever they appear (menu Alat or inside Catat): Anggota = Nama + Hubungan dengan Anda (Pasangan, Anak, Orang tua, Saudara, Lainnya; "Diri sendiri" only in Setup and fixed for the owner); Lokasi = Nama + Jenis (9 types: Exchange crypto, Wallet crypto, Sekuritas saham, Aplikasi investasi, Emas digital, Bank atau deposito, Dompet digital, Simpanan fisik, Lainnya); Aset = Nama, Jenis, Satuan, Setara gram. Creating from inside Catat is allowed because it opens the same form and returns to the transaction with the new item selected.
- Excel column order is one standard: Data lengkap order (Tanggal, Jenis, Anggota, Aset, Jumlah, Lokasi, Harga, ...). The Ringkasan Transaksi sheet is a subset in the same relative order. Import template = Data lengkap structure (Transaksi, Aset, Nilai bulanan; Anggota, Lokasi, Pengaturan come from the hidden Daftar dropdowns).
- Second currency options: USD, SGD, EUR, GBP (Poundsterling), or none.
- Export ends on a full screen "Export berhasil" (file name, contents count, Buka file, Bagikan, Selesai), not only a toast: the file is the product of the action and has next steps. Toasts stay for undoable or low-stakes confirmations.
- Pasang di layar HP shows where to tap: Safari iPhone = Bagikan icon in the bottom bar; Chrome Android = three-dot menu at top right.

## Round 6 rules (Ticon, 14 Nov 2026): one function, one form
- **Shared form component (`hfForm`).** Tambah/Ubah anggota, Tambah/Ubah lokasi, and Aset manual are ONE bottom-sheet component, identical in Setup (langkah 2 and 3), Catat, menu Alat (Anggota, Lokasi, Kelola aset), and Import (lengkapi aset, tambah anggota dari file). Same title, fields, order, controls, hints, and button labels everywhere; only the post-save destination differs by context.
  - Anggota: Nama + Hubungan dengan Anda (select). Owner is always "Diri sendiri" and read-only; other members can change Hubungan any time (it is only a label).
  - Lokasi: Nama lokasi + Jenis (select, 9 types with examples). Jenis can be changed any time (grouping only).
  - Aset manual: Nama, Jenis (select, 8 types), Satuan (segmented, depends on Jenis), Setara gram (Emas/Perak not in gram), Harga per satuan. Jenis and Satuan lock after the asset is used.
- **Categorical choice inside a form = select field that opens a picker sheet** (icon + example line where useful), never chips. Chips are for filters and quick picks in a screen (Catat anggota/aset/lokasi, Tambah cepat), not for form fields. Reason: works the same inline and inside a sheet, scales past 5 options, and carries examples that help users classify.
- Setup langkah 2 and 3 no longer use inline form cards: "Tambah anggota", "Lokasi lain", and the pencil button open the shared sheet. This also removes the second filled primary button (Simpan anggota next to Lanjut).
- **Dropdown chip** (filter chip with caret: Semua anggota, Semua lokasi, Riwayat filters) is a chip: sunken fill + 1px `--line` hairline, selected = brand fill. No inline `--line-strong` override.
- **Shared export panel (`hfExport`).** Same body in menu Alat (tab Export, full screen) and as a sheet in Laporan and Google Sheet: Ringkasan / Data lengkap toggle, Periode and Anggota selects (Ringkasan), Format radio cards, Unduh button with file name; states Membuat file, Export berhasil (full content with Buka file, Bagikan, Selesai), File belum tersimpan (Coba lagi).
- **Import flow is one component (`gen_import_flow.py`)** generated for Setup langkah 4 and menu Alat. Only the header (stepper "Langkah 4 dari 4" vs "Import ·" + tabs on the first screen) and the setup-only "Lewati, mulai dari nol" differ. States: belum pilih, template diunduh, file dipilih, membaca, periksa, lengkapi, siap, menyimpan, selesai, diurungkan, plus 4g–4t error and decision states.
- **Excel structure is one format.** Template import = export Data lengkap without data: visible Petunjuk, Transaksi, Aset, Nilai bulanan; hidden Anggota (Nama, Hubungan, Urutan), Lokasi (Nama, Jenis lokasi), Pengaturan, Daftar. Hidden sheets feed dropdowns and import matching; users can still Unhide them.
- Second currency options: USD, SGD, EUR, GBP, JPY, or none.

## Round 7 rules
- **Chip tidak boleh terlihat nonaktif.** Chip (pilihan, filter, dropdown) = isi putih (`--surface-raised`), garis 1px `--line-strong`, teks `--ink`. Terpilih = isi merek. Latar sunken + garis tipis dicabut karena hampir sama dengan latar halaman dan terbaca sebagai disabled. Toggle segmented tetap memakai track sunken karena thumb putihnya yang menandai pilihan.
- **Target sentuh 44px.** Tombol kecil (`.hf-btn-sm`, `.hf-btn-ghost`), chip, dan tautan teks boleh tampil ringkas, tetapi area sentuhnya 44px lewat `::after` (kelas `.hf-tap` untuk tautan inline). Elemen mandiri (Kembali, nomor kalender, tombol bulan) tingginya benar-benar 44px. Chip dalam baris yang dibungkus tetap 32px karena jarak 8px antarbaris; area sentuh efektifnya 40px.
- **Desktop dan tablet memakai isi form yang sama dengan HP.** Form anggota ("Tambah anggota": Nama, Hubungan dengan Anda), form aset ("Aset manual": Nama, Jenis, Satuan, Harga per satuan) dan panel Export (Ringkasan/Data lengkap, Periode, Anggota, Format) tampil sebagai dialog di tengah layar, bukan sheet bawah. Judul, urutan field, label, dan teks bantu identik.

## Round 8 rules
- **Header lengket**: setiap layar HP punya `.hf-head` di luar `<main class="hf-scroll">` (judul; bila ada: tombol kembali, segmented control, chip filter, pencarian). Header tidak ikut scroll; hairline `--line` di bawahnya. Jangan pakai `.hf-bar` (itu kelas batang grafik).
- **Status bar** diam di atas viewport; hanya konten `<main>` yang bergulir.
- **Prototype**: splash otomatis lanjut ke Setup langkah 1 (~2 detik); chip alur mengikuti layar yang sedang tampil, bukan hanya yang diklik.
- **Tablet/desktop (WD/WT)**: `.wx-stick` membungkus judul halaman (+ pencarian/filter/chip/stepper bila ada), lengket di atas area gulir; sisi kiri (sidebar/rail) tetap diam. Layar wizard Setup: stepper yang lengket. Splash tanpa header.
- **Navigasi**: `nav a` tidak boleh memakai pemisah baris (`a+a`); garis di atas ikon menu adalah kebocoran aturan itu dan sudah dimatikan.
- **Tekan tombol**: tombol terisi (primary, gold, loss) tidak mengganti warna latar saat `:active`, karena latarnya gradien yang tak bisa dianimasikan dan menyebabkan kedipan. Cukup `filter: brightness` dan skala .97, tanpa transisi saat ditekan; sorotan ketuk bawaan browser seluler dimatikan.
- **Menu di dalam header lengket**: header berada di z 8, di bawah scrim (z 20). Bila ia berisi dropdown terbuka (`.hf-select-menu`), header otomatis naik ke z 22 supaya menu dan chip tidak ikut redup dan bisa diklik.
- **Garis tepi (Round 9)**: semua kontrol bergaris luar (tombol, chip, tombol ikon, input, select) memakai 1px `--line-strong`. Sebelumnya tombol 1,5px dan chip 1px. Pedoman Material 3: tombol outlined dan chip outlined sama-sama 1dp warna `outline`; kontras 3:1 untuk komponen UI (WCAG 1.4.11) terpenuhi oleh `--line-strong`. Tombol tutup (X) di header Catat juga bergaris 1px, berlatar `--surface-raised`.
- **Pilihan di dalam sheet**: sheet tidak ditumpuk di atas sheet. Pilihan dari field (Hubungan, Jenis lokasi, Jenis aset) terbuka inline di bawah field (listbox), bukan sheet kedua. Sheet pemilih terpisah hanya dipakai dari layar penuh.

## Gerak (Round 10)
- Buka/tutup yang mengubah tinggi (daftar pilihan di dalam sheet) beranimasi, tidak berubah instan: `.hf-collapse` (grid 0fr ke 1fr, 280 ms) dan chevron berputar 180 derajat.
- Elemen yang muncul dan hilang (sheet, scrim, menu, toast) punya animasi masuk dan keluar. Masuk lewat CSS, keluar lewat `motion.js` kecil di prototype.
- Pindah layar: isi layar (`main.hf-scroll`) memudar masuk 240 ms, header dan menu bawah diam.
- Semua gerak tenang, tidak memantul, dan mati saat pengguna memilih reduced motion.

### Judul layar (Round 11)

Judul di `.hf-head` (`.title`, 22/30) punya tinggi kotak 36px, sama dengan tombol kecil `.hf-btn-sm` (Kelola, Riwayat haul, Export). Teks tetap 22/30 dan sejajar vertikal di tengah. Akibatnya baris judul setinggi 36px baik ada tombol di sebelahnya maupun tidak, sehingga jarak judul ke tombol Kembali di atasnya selalu sama dan judul tidak terlihat turun saat berdampingan dengan tombol aksi. Tombol aksi di sebelah judul harus `.hf-btn-sm` (36px); jangan pakai tombol 48px di baris judul.

### Penomoran mockup hi-fi (Round 11, disusun ulang di Round 13)

Setiap board di kanvas bernomor `NN.l`: dua angka untuk layar, satu huruf kecil untuk state. Contoh: `06.c` = Riwayat, state "Detail transaksi". Nomor layar mengikuti sitemap: pintu masuk (00–01), lima tab bawah berurutan (02 Beranda, 03 Aset, 05 Catat, 06 Riwayat, 07 Alat; 04 Kelola aset menyusul Aset), lalu layar yang dibuka dari Alat dan Beranda (08 Laporan sampai 17 Google Sheet). Huruf mengikuti **urutan baca di kanvas**, dan letak board di kanvas mengikuti urutan alur pemakaian: satu bagian = satu kolom (Setup dan Import / Export punya beberapa kolom, satu per langkah atau jenis), dibaca dari atas ke bawah lalu kolom berikutnya; bagian itu sendiri berjajar dari kiri ke kanan menurut nomornya. `a` adalah state utama, lalu `b`, `c`, dan seterusnya (misalnya Catat: Beli, Jual, Masuk, Keluar, Pindah, Saldo awal, Piutang, lalu dibuka dari layar lain). Bila state lebih dari 26, huruf dilanjutkan `aa`, `ab`. Bagian dengan satu board tidak memakai huruf. Di desktop dan tablet satu baris = satu bagian, dibaca kiri ke kanan, baris berikutnya ke bawah.

**Menyisipkan atau menambah board.** Jangan memberi huruf dengan tangan. Daftar urutan ada di `tools/flow.json` (di folder kerja Claude, bukan di artifact ini) (satu daftar per bagian, per kolom). Sisipkan nama file di posisi alurnya, jalankan `python3 tools/renumber.py`: judul, huruf, dan letak semua board dihitung ulang, lalu skrip memeriksa bahwa huruf berurutan tanpa celah, tidak ada judul ganda, tidak ada board bertumpuk, dan bagian berurutan dari kiri ke kanan. Skrip yang sama dijalankan dengan `--check` sebelum setiap publish. Kode nomor di board Alur (A1 sitemap, A2 userflow, A3 sampai A7) ikut diperbarui dengan `tools/alur_fix.py`, dan nomor yang disebut di Log perubahan menunjuk nomor saat ronde itu ditulis. Desktop memakai awalan `D` (D06.b) dan tablet `T` (T06.b) dengan angka layar yang sama dengan versi HP. Halaman lain: Alur `A1`–`A8`, Logo `L1`–`L2`, Arsip `R0`–`R6`.

| No. | Layar |
| --- | --- |
| 00 | Splash |
| 01 | Setup awal (akun, anggota, lokasi, import) |
| 02 | Beranda |
| 03 | Aset |
| 04 | Kelola aset |
| 05 | Catat |
| 06 | Riwayat |
| 07 | Alat |
| 08 | Laporan |
| 09 | Hasil export (PDF, Excel, Data lengkap) |
| 10 | Zakat mal |
| 11 | Nishob |
| 12 | Harga terkini |
| 13 | Import / Export |
| 14 | Anggota |
| 15 | Lokasi |
| 16 | Piutang |
| 17 | Google Sheet |

Perubahan dari penomoran Round 11: Kelola aset (dulu 14) menjadi 04, Catat (04) menjadi 05, Riwayat (05) menjadi 06, Alat (09) menjadi 07, Laporan (07) menjadi 08, Hasil export (06) menjadi 09, Zakat mal (08) menjadi 10, Nishob (16) menjadi 11, Harga terkini (11) menjadi 12, Import / Export (10) menjadi 13, Anggota (12) menjadi 14, Lokasi (13) menjadi 15, Piutang (15) menjadi 16. Nama file board tidak berubah, hanya judul di kanvas.

### Jarak header sticky ke konten (Round 13)

Garis bawah header sticky punya dua jarak yang tetap di semua layar HP: **12px** dari elemen terakhir di dalam header ke garis (padding bawah header), dan **16px** dari garis ke elemen pertama di area gulir (`padding-top` dari `<main class="hf-scroll">`, dipasang juga lewat `.hf-scroll{padding-top:16px}`). Sebelumnya 186 layar memakai 4px sehingga kartu, kolom cari, dan chip terlihat menempel ke garis, sementara layar form memakai 16px dan Alat bahkan 32px. Aturan pemakaian: elemen pertama di main tidak boleh memakai margin negatif atau pembungkus kosong yang menambah gap (pembungkus kosong dibungkus `sc-if`). Target ketuk 44px di baris pertama dikompensasi `margin-top:-6px` agar ikon tetap 16px dari garis.

### Piutang (Round 11, diperbarui Round 15)

Piutang adalah aset yang dipinjamkan ke orang lain, ditagih dalam aset yang sama. Piutang hanya dicatat dari Alat › Piutang (tombol Catat), tidak ada di Catat transaksi. Peminjam diketik sebagai nama. Aturannya:

- **Pemilik aset selalu disebut (Round 16).** Form Catat piutang punya field "Pemberi pinjaman (pemilik aset)" berisi anggota, lalu "Aset milik <anggota>" yang hanya menampilkan aset anggota itu beserta lokasi dan saldonya ("Emas fisik · Brankas", saldo 8 g). Hint, ringkasan "Yang akan terjadi", toast, daftar piutang ("Dari Azlan · Emas fisik · sisa 4 g"), detail ("Pemberi pinjaman"), sheet cicilan ("kembali ke aset Azlan"), teks zakat ("mengurangi harta zakat Azlan"), dan Riwayat ("Azlan · Brankas · ke Pak Rahman") memakai nama anggota yang sama. Cicilan selalu kembali ke anggota pemberi.

- Aset keluar dari saldo pemberi saat dicatat dan masuk lagi tiap cicilan diterima. Total harta tidak berubah; nilai piutang dihitung dengan harga hari ini.
- Zakat: selama dipinjamkan, emas atau perak itu tidak dihitung zakat dan mengurangi harta zakat pemberi. Setelah diterima kembali, otomatis dihitung lagi. USDT tidak dihitung zakat mal.
- Tanpa bunga dan tanpa denda. Pembayaran yang masuk melunasi cicilan paling lama lebih dulu.

### Apa yang masuk Catat transaksi (Round 15)

**Catat transaksi = kejadian pada aset yang berdiri sendiri dan selesai dalam satu kali catat**: Beli, Jual, Masuk, Keluar, Pindah, dan Saldo awal. Zakat dan piutang **bukan** jenis di Catat karena masing-masing punya siklus sendiri (haul, nishob, cicilan, jatuh tempo, status lunas atau terlambat) dan dicatat di layarnya sendiri: Zakat mal untuk membayar zakat, Alat › Piutang untuk meminjamkan dan menerima cicilan. Keduanya tetap mengubah saldo, dan hasilnya otomatis muncul di Riwayat sebagai "Zakat", "Pinjamkan", "Cicilan diterima", dan "Pelunasan diterima", lengkap dengan lokasi dan nilai saat itu.

Aturan pakai: satu fungsi punya satu tempat input. Jenis baru masuk Catat hanya bila ia kejadian tunggal tanpa jadwal. Bila punya jadwal atau status yang berjalan, ia butuh layar sendiri.

### Mulai melunasi dan Jatuh tempo (Round 15)

Satu pola untuk semua form piutang (Catat piutang dan Ubah rencana pelunasan, keduanya di layar Piutang): **deretan chip, lalu satu chip "Pilih tanggal"**, bukan dropdown.

- Chip cepat: Bulan depan, 3 bulan lagi, 6 bulan lagi, 1 tahun lagi. Semuanya jatuh tempo tanggal 15 di bulan tujuan. Satu chip aktif sekaligus.
- Chip "Pilih tanggal" (ikon kalender) membuka sheet kalender: judul "Pilih tanggal mulai melunasi" (cicilan) atau "Pilih tanggal jatuh tempo" (sekali bayar), navigasi bulan, tanggal sampai hari ini tidak bisa dipilih, tombol "Pakai 20 Jan 2027" dan "Kembali". Kalender memakai komponen yang sama dengan pemilih tanggal Catat (`.hf-day`, bersama `.hf-wheel` untuk jam, kini ada di `bundle.css` dan tidak lagi ditulis inline per layar), tanpa pilihan jam. Setelah dipilih, chip berubah jadi tanggalnya dan ikut aktif.
- Teks di bawah chip selalu menyebut tanggal hasilnya: "Cicilan pertama jatuh tempo 20 Jan 2027, lalu tiap bulan di tanggal yang sama." Bila tanggal 29 sampai 31 jatuh di bulan yang lebih pendek, jatuh tempo mundur ke hari terakhir bulan itu.
- Label field: "Mulai melunasi" untuk cicilan, "Jatuh tempo" untuk sekali bayar.

### Catat transaksi dan Saldo awal: ke mana Tutup dan Simpan kembali (Round 15)

Satu layar Catat dipakai dari semua pintu masuk. Isinya sama; yang berbeda hanya **ke mana tombol Tutup (X) dan Simpan membawa pengguna**. Karena itu tidak ada board terpisah per pintu masuk: satu board Catat per jenis cukup, dan tabel ini jadi aturannya (prototipe sudah mengikutinya).

| Dibuka dari | Tutup (X) | Setelah Simpan |
|---|---|---|
| Beranda (tombol +) | Beranda | Beranda, toast "Tersimpan" dengan tautan Lihat |
| Aset (tombol +) | Aset | Aset, toast dengan tautan Lihat |
| Riwayat (tombol +) | Riwayat | Riwayat dengan baris baru di atas, toast |
| Alat | Alat | Alat, toast |
| Laporan kosong (Catat transaksi pertama) | Laporan kosong | Laporan berisi |
| Harga terkini | Harga terkini | Harga terkini |
| Saldo awal dari Aset | Aset | Aset, toast |
| Saldo awal dari Kelola aset | Kelola aset | Kelola aset, "Saldo tersimpan" |
| Saldo awal dari Zakat kosong | Zakat kosong | Zakat berisi |
| Ubah transaksi (dari Detail Riwayat) | Detail transaksi | Detail transaksi, badge "Diubah" |

Aturan umum: Tutup selalu kembali ke layar asal tanpa menyimpan, dan Simpan kembali ke layar asal dengan toast yang memuat tautan "Lihat" ke transaksi di Riwayat. Satu-satunya pengecualian adalah layar kosong (Laporan, Zakat) yang berubah jadi berisi setelah ada data. Saat menambah pintu masuk baru, tambahkan satu baris ke tabel ini, bukan board baru. Board baru hanya perlu bila isi layarnya berbeda.

### Notifikasi Beranda: banner dan lonceng (Round 14)

Kartu total Beranda punya satu baris redup "Termasuk piutang Rp X" (kelas `.hf-total-link`, bisa diketuk ke Piutang) di bawah selisih bulanan, hanya bila ada data. Nilai itu bagian dari total, bukan tambahan. Saat baris ini ada, kartu memakai modifier `.hf-total-with-link`: grafik garis memanjang dari atas angka total sampai baris terakhir, dan label sumbu (Jun · 6 bln · Nov) segaris dengan baris piutang. Tanpa baris piutang, grafik kembali ke tinggi biasa (48px).

Beranda menampilkan **satu banner saja** di bawah kartu total, dan lonceng di pojok kanan atas memuat **semua** hal yang perlu perhatian. Aturannya:

- Prioritas banner: zakat mal lebih dulu, lalu piutang. Bila keduanya aktif, banner zakat yang tampil dan piutang hanya ada di lonceng.
- Banner piutang muncul saat ada cicilan jatuh tempo hari ini (kartu emas, tombol "Catat cicilan diterima") atau terlambat (kartu merah, tombol "Lihat tunggakan"). Tiga hari sebelum jatuh tempo cukup pengingat di lonceng, tanpa banner. Ikon ubin banner piutang: koin (lingkaran dengan tanda dolar), beda dari zakat yang memakai kalender-jam.
- Lonceng memuat item yang sedang jadi banner juga, jadi daftarnya selalu lengkap dan angka di lonceng sama dengan jumlah baris. Urutan baris: zakat, piutang, lalu yang lain.
- Warna angka di lonceng mengikuti yang paling parah: merah bila ada yang terlambat (zakat atau piutang), emas bila tidak.
- Satu banner tidak memuat banyak orang. Piutang yang terlambat di banner menyebut peminjam dengan tunggakan terlama dan jumlah cicilannya; sisanya di Piutang.

### Angka di dalam badge (Round 14)

`.hf-attn-count` dan `.hf-countbadge` memakai `box-sizing: border-box`, tinggi 22px, `min-width` 22px, padding horizontal 5px. Satu digit menghasilkan lingkaran 22px (sebelumnya 34×22, lonjong), dua digit melebar mengikuti isi. Angka di tengah kedua sumbu lewat `place-items: center` dan `line-height: 1`. Baris judul sheet yang memuat badge memakai `.hf-sheet-headrow` (padding `0 12px 6px 8px`): tepi kiri judul sejajar ikon baris di bawahnya (16px dari tepi layar) dan tepi kanan badge sejajar tepi kanan chevron baris (370px pada layar 390px).


### Segmented control: kolom mengikuti jumlah opsi (Round 15)

Kolom grid segmented control selalu sama dengan jumlah opsinya (`repeat(n, minmax(0, 1fr))`). Saat opsi ditambah atau dihapus, angka kolom ikut diubah; kolom kosong membuat opsi bergeser dan tidak simetris.


## Setup build notes (Claude Code, 24 Nov 2026)
Setup (screens 00 and 01-2/3) is built with classes `su-*` at the end of `bundle.css`; values are copied one-to-one from the mockup boards. The form `hfForm` is one component (`src/web/screens/setup-form.js`) for anggota and lokasi. Step 1 only continues (no login button logic): Google handles sign-in before the web app opens.
