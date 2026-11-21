// Membangun dist/ untuk Apps Script (clasp rootDir = dist) dan uji lokal.
// - Index.html dan Components.html berisi CSS dan JS inline (HtmlService tidak melayani file statis).
// - src/gas/*.js dan appsscript.json disalin apa adanya; src/engine/*.js ikut dikirim agar bisa dipakai server.
// Sumber CSS: docs/design/tokens.css + docs/design/bundle.css + src/web/css/shell.css (Design System tetap satu-satunya sumber gaya komponen).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist');
const read = (p) => readFileSync(join(root, p), 'utf8');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Font Plus Jakarta Sans (SIL OFL, lihat src/web/fonts/OFL-LICENSE.txt) ditanam sebagai data URI:
// tidak bergantung pada jaringan atau Google Fonts, dan tetap tampil di dalam sandbox HtmlService.
const fontCss = [400, 500, 600, 700, 800].map((w) => {
  const b64 = readFileSync(join(root, `src/web/fonts/plus-jakarta-sans-latin-${w}-normal.woff2`)).toString('base64');
  return `@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2");}`;
}).join('\n');

const css = [`/* font */\n${fontCss}`, ...['docs/design/tokens.css', 'docs/design/bundle.css', 'src/web/css/shell.css']
  .map((p) => `/* ${p} */\n` + read(p))].join('\n');

function page(srcFile, outName) {
  let html = read(srcFile);
  html = html.replace('<!-- @css -->', () => `<style>\n${css}\n</style>`);
  html = html.replace(/<!-- @js:([^>]+?) -->/, (_, list) => {
    const js = list.split(',').map((p) => `/* ${p.trim()} */\n` + read('src/' + p.trim())).join('\n');
    return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>`;
  });
  writeFileSync(join(out, outName), html);
}

page('src/web/index.html', 'Index.html');
page('src/web/components.html', 'Components.html');

for (const f of readdirSync(join(root, 'src/gas'))) copyFileSync(join(root, 'src/gas', f), join(out, f));
for (const f of readdirSync(join(root, 'src/engine'))) copyFileSync(join(root, 'src/engine', f), join(out, 'engine_' + f));

// Salinan untuk server dev statis.
copyFileSync(join(out, 'Index.html'), join(out, 'index.html'));
copyFileSync(join(out, 'Components.html'), join(out, 'components.html'));
console.log('dist/ siap:', readdirSync(out).join(', '));
