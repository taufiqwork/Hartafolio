"""Membuat 3 board Beranda data nyata dari Main.dc.html (komponen yang sama, `mulai` baru), dengan angka dari mesin
(tools/pixel/real-board-data.mjs) supaya board dan aplikasi memakai data uji yang sama. Jalankan dari akar repo: python3 tools/pixel/gen-board-beranda-nyata.py"""


import json, re, subprocess, html
SRC = 'reference/mockups/src/Main.dc.html'
base = open(SRC).read()
data = json.loads(subprocess.check_output(['node', 'tools/pixel/real-board-data.mjs']))

VARS = {  # mulai -> (berkas, judul, kunci data)
  'data-nyata': ('Main-2u-Data-Nyata', 'Beranda · data nyata, bulan pertama', 'awal'),
  'data-nyata-lonceng': ('Main-2v-Data-Nyata-Lonceng', 'Beranda · data nyata, lonceng harga', 'lonceng'),
  'data-nyata-tanpa-kurs': ('Main-2w-Data-Nyata-Tanpa-Kurs', 'Beranda · data nyata, kurs belum ada', 'tanpaKurs'),
}
REAL = {}
for mulai, (_, _, key) in VARS.items():
  d = data[key]
  notes = []
  for n in d['att']['notes']:
    if n['t'].endswith('dari transaksi terakhir'): notes.append({'t': n['t'], 'd': n['d'], 'ic': 'info', 'tcls': 'is-info'})
    else: notes.append({'t': n['t'], 'd': n['d'], 'ic': 'cloud', 'tcls': ''})
  REAL[mulai] = {'MEM': d['MEM'], 'CLS': d['CLS'], 'MX': d['MX'], 'AR': d['AR'], 'GM': d['GM'], 'GC': d['GC'], 'usd': d['usd'], 'NOTES': notes}

def rep(b, old, new, count=1):
  assert old in b, old[:80]
  return b.replace(old, new, count)

b = base
# --- template ---
b = rep(b, '<span class="hf-total-sub">$ 9.979 · <span class="hf-delta hf-delta-up">↑ +2,4% dari Okt</span></span>',
        '<span class="hf-total-sub">{{ usdStr }}<sc-if value="{{ showDelta }}" hint-placeholder-val="{{ true }}"> · <span class="hf-delta hf-delta-up">↑ +2,4% dari Okt</span></sc-if></span>')
b = rep(b, '<sc-if value="{{ hasData }}" hint-placeholder-val="{{ true }}"><a class="hf-total-link"', '<sc-if value="{{ showPiutang }}" hint-placeholder-val="{{ true }}"><a class="hf-total-link"')
b = rep(b, '<sc-if value="{{ hasData }}" hint-placeholder-val="{{ true }}"><a class="hf-spark"', '<sc-if value="{{ showSpark }}" hint-placeholder-val="{{ true }}"><a class="hf-spark"')
b = rep(b, '<sc-if value="{{ hasData }}" hint-placeholder-val="{{ true }}"><section class="hf-card" aria-label="Harga terkini"', '<sc-if value="{{ showHarga }}" hint-placeholder-val="{{ true }}"><section class="hf-card" aria-label="Harga terkini"')
# --- logika ---
b = rep(b, "const mulai = this.props.mulai ?? 'default';", "const mulai = this.props.mulai ?? 'default';\n    const REAL = " + json.dumps(REAL, ensure_ascii=False) + "[mulai] || null, real = !!REAL;")
b = rep(b, "const MEM = many ?", "const MEM = real ? REAL.MEM : many ?")
b = rep(b, "const CLS = ['Emas', 'Crypto', 'Perak', 'Saham', 'Mata uang'];", "const CLS = real ? REAL.CLS : ['Emas', 'Crypto', 'Perak', 'Saham', 'Mata uang'];")
m = re.search(r"    else MX = \[\[69\.4.*?\]\];\n", b, re.S); assert m
b = b.replace(m.group(0), m.group(0) + "    if (real) MX = REAL.MX;\n", 1)
b = rep(b, "const AR = [['PAXG'", "let AR = [['PAXG'")
b = rep(b, "    const sum = a => a.reduce((x, y) => x + y, 0);", "    if (real) { AR = REAL.AR; Object.keys(GM).forEach(k => delete GM[k]); Object.keys(GC).forEach(k => delete GC[k]); Object.assign(GM, REAL.GM); Object.assign(GC, REAL.GC); }\n    const sum = a => a.reduce((x, y) => x + y, 0);\n    const grandR = real ? sum(MX.map(sum)) : 0;")
b = rep(b, "jt(i === null ? 174.2 : totFor(i))", "jt(i === null ? (real ? grandR : 174.2) : totFor(i))")
b = rep(b, "const notes = mulai === 'kosong' ||", "const notes = real ? REAL.NOTES.map(n => mk(n.t, n.d, '14-Aset-2i-Isi-Harga-Dari-Beranda.dc.html', n.ic, n.tcls)) : mulai === 'kosong' ||")
b = rep(b, "(mulai === 'perhatian' || mulai === 'perhatian-kosong' || mulai === 'perhatian-zakat-piutang')", "(mulai === 'perhatian' || mulai === 'perhatian-kosong' || mulai === 'perhatian-zakat-piutang' || mulai === 'data-nyata-lonceng')")
b = rep(b, "heroMod: mulai === 'kosong' ? '' : 'hf-total-with-link'", "heroMod: mulai === 'kosong' || real ? '' : 'hf-total-with-link'")
b = rep(b, "totalStr: mulai === 'kosong' ? 'Rp 0' : 'Rp 174,2 jt'", "totalStr: mulai === 'kosong' ? 'Rp 0' : (real ? jt(grandR) : 'Rp 174,2 jt'), usdStr: real ? REAL.usd : '$ 9.979', showDelta: !real, showPiutang: !real && mulai !== 'kosong', showSpark: !real && mulai !== 'kosong', showHarga: !real && mulai !== 'kosong'")
b = rep(b, "totalInt: mulai === 'kosong' ? 0 : 174, totalDec: mulai === 'kosong' ? '' : ',2 jt'", "totalInt: mulai === 'kosong' ? 0 : (real ? Math.floor(grandR + 1e-9) : 174), totalDec: mulai === 'kosong' ? '' : (real ? ',' + Math.round((grandR - Math.floor(grandR + 1e-9)) * 10) + ' jt' : ',2 jt')")
# --- props: tambah pilihan dan bawaan ---
pm = re.search(r'data-props="(.*?)"', b, re.S); props = json.loads(html.unescape(pm.group(1)))
for k in VARS:
  if k not in props['mulai']['options']: props['mulai']['options'].append(k)
for mulai, (name, title, _) in VARS.items():
  p = json.loads(json.dumps(props)); p['mulai']['default'] = mulai
  out = b.replace(pm.group(0), "data-props='" + json.dumps(p, ensure_ascii=False) + "'", 1)
  out = rep(out, '<title>Beranda</title>', '<title>' + title + '</title>')
  open('reference/mockups/src/' + name + '.dc.html', 'w').write(out)
  print('ditulis', name)
