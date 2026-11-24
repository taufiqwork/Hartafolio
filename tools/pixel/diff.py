"""Bandingkan dua PNG (board vs aplikasi). Pakai: diff.py board.png app.png out_diff.png
Keluaran JSON: rasio piksel beda, wilayah beda (kotak 8px digabung), dan gambar diff (merah = beda)."""
import sys, json
import numpy as np
from PIL import Image
TH = 40          # selisih kanal terbesar (0-255) yang dianggap beda; di bawahnya = anti-alias
CELL = 8
a = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(int)
b = np.asarray(Image.open(sys.argv[2]).convert('RGB')).astype(int)
if a.shape != b.shape:
    print(json.dumps({'error': 'ukuran beda', 'board': a.shape[:2], 'app': b.shape[:2]})); sys.exit(0)
d = np.abs(a - b).max(axis=2) > TH
skip = 0
for (mx, my, mw, mh) in (json.loads(sys.argv[4]) if len(sys.argv) > 4 else []):   # penyimpangan yang sengaja dicatat
    skip += int(d[my:my+mh, mx:mx+mw].sum()); d[my:my+mh, mx:mx+mw] = False
H, W = d.shape
gh, gw = (H + CELL - 1) // CELL, (W + CELL - 1) // CELL
cells = np.zeros((gh, gw), int)
for y in range(gh):
    for x in range(gw):
        cells[y, x] = d[y*CELL:(y+1)*CELL, x*CELL:(x+1)*CELL].sum()
seen = np.zeros_like(cells, bool); regions = []
for y in range(gh):
    for x in range(gw):
        if cells[y, x] and not seen[y, x]:
            st = [(y, x)]; seen[y, x] = True; ys = []; xs = []; tot = 0
            while st:
                cy, cx = st.pop(); ys.append(cy); xs.append(cx); tot += cells[cy, cx]
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy+dy, cx+dx
                        if 0 <= ny < gh and 0 <= nx < gw and cells[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True; st.append((ny, nx))
            regions.append({'x': min(xs)*CELL, 'y': min(ys)*CELL, 'w': (max(xs)-min(xs)+1)*CELL, 'h': (max(ys)-min(ys)+1)*CELL, 'px': int(tot)})
regions.sort(key=lambda r: -r['px'])
out = (b * 0.35 + 255 * 0.65).astype('uint8'); out[d] = [220, 30, 30]
Image.fromarray(out).save(sys.argv[3])
print(json.dumps({'dikecualikan_px': skip, 'beda_px': int(d.sum()), 'rasio': round(float(d.mean()), 5), 'wilayah': regions[:8]}))
