// Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { PEOPLE, COUPLES } = require('../data.js');
// Reviewed snapshot. Change it only on purpose, with evidence noted in docs/family-data-changes.md.
const snapshot = require('./data-snapshot.json');
const F = require('../family.js');

test('family data matches the reviewed snapshot (nothing changed by accident)', () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify({ PEOPLE, COUPLES })), snapshot);
});

test('every relationship points at a real person', () => {
  COUPLES.forEach(([a, b, kids]) => [a, b, ...kids].filter(Boolean).forEach(id => assert.ok(PEOPLE[id], `unknown id ${id}`)));
});

test('layout places everyone, with no overlaps, children one row below parents', () => {
  const L = F.layout(PEOPLE, COUPLES, { slot: 160, row: 240, gap: 34 });
  Object.keys(PEOPLE).forEach(id => assert.ok(L.pos[id], `${id} not placed`));
  const rows = {};
  Object.entries(L.pos).forEach(([id, p]) => (rows[p.y] = rows[p.y] || []).push(p.x));
  Object.values(rows).forEach(xs => { xs.sort((a, b) => a - b); for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 159, 'overlapping people'); });
  COUPLES.forEach(([a, b, kids]) => kids.forEach(k => assert.strictEqual(L.pos[k].y - L.pos[a].y, 240, `${k} not one row below ${a}`)));
  COUPLES.forEach(([a, b]) => { if (b) assert.strictEqual(Math.round(Math.abs(L.pos[a].x - L.pos[b].x)), 160, `${a} and ${b} not side by side`); });
});

test('relationship finder names close relatives correctly', () => {
  const G = F.buildGraph(PEOPLE, COUPLES);
  const t = id => F.describe(G, PEOPLE, 'max', id).term;
  assert.strictEqual(t('bradley'), 'father');
  assert.strictEqual(t('grace'), 'sister');
  assert.strictEqual(t('gerald'), 'grandfather');
  assert.strictEqual(t('ruthie_gg'), '1st cousin');
  assert.strictEqual(t('boruch_gw'), '2nd great-grandfather');
  assert.strictEqual(t('dorothy_leitman'), '1st cousin twice removed');
  assert.strictEqual(t('sara_monasch'), '3rd cousin');
  assert.strictEqual(F.kinTerm(1, 3, 'M'), 'grandnephew');
  assert.strictEqual(F.kinTerm(3, 1, 'F'), 'great-aunt');
});

test('links are {label,url} with https URLs, and photos exist on disk', () => {
  const fs = require('node:fs'); const path = require('node:path');
  Object.entries(PEOPLE).forEach(([id, p]) => {
    if (p.links !== undefined) {
      assert.ok(Array.isArray(p.links) && p.links.length, `${id}.links should be a non-empty array`);
      p.links.forEach(l => { assert.ok(l.label && typeof l.label === 'string', `${id} link label`); assert.match(l.url, /^https?:\/\//, `${id} link url`); });
    }
    if (p.photo) {
      assert.ok(fs.existsSync(path.join(__dirname, '..', p.photo)), `${id} photo missing: ${p.photo}`);
      assert.match(p.photoSource || '', /^https?:\/\//, `${id} photo needs a photoSource URL`);
    }
  });
});
