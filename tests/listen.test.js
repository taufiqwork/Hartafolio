const test = require('node:test'), assert = require('node:assert');
const L = require('../src/web/js/listen.js');

function fakeEl() {
  const h = {};
  return {
    h, onclick: () => 1, oninput: () => 1,
    addEventListener(t, f) { (h[t] = h[t] || []).push(f); },
    removeEventListener(t, f) { h[t] = (h[t] || []).filter((x) => x !== f); },
    fire(t) { (h[t] || []).slice().forEach((f) => f()); }
  };
}

test('listen: pendengar dari layar lama tidak jalan lagi setelah reset', () => {
  const el = fakeEl(); let simpan = 0;
  for (let kunjungan = 0; kunjungan < 3; kunjungan++) { L.reset(el); L.on(el, 'click', () => simpan++); }
  el.fire('click');
  assert.strictEqual(simpan, 1); // tanpa reset: 3 (Simpan berlipat)
});

test('listen: reset juga mengosongkan handler properti layar sebelumnya', () => {
  const el = fakeEl(); L.on(el, 'input', () => {}); L.reset(el);
  assert.strictEqual(el.onclick, null); assert.strictEqual(el.oninput, null); assert.strictEqual(el.h.input.length, 0);
});
