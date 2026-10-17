// Pure family logic: graph, generations, layout and relationship naming.
// No DOM here, so tests can run it in Node.
(function (root) {
  // People that the data does not connect to anyone in the main tree.
  // Layout only: puts each loose group next to a sensible neighbor in the
  // right row. This does not change any relationship.
  const LOOSE_ANCHORS = {
    edward_k: ['charles_r', 0], daniel_k: ['charles_r', 0], evelyn_k: ['charles_r', 0],
    milton_k: ['charles_r', 0], irving_k: ['charles_r', 0], sidney_k: ['charles_r', 0],
    dorothy_k: ['charles_r', 0], stevens_k: ['charles_r', 0],
    unknown_brother1: ['herschel_h', 0], unknown_brother2: ['herschel_h', 0],
    ira_diamond: ['gussie_t', 0], harry_frincola: ['becky_t', 0], ed_glickman: ['minnie_t', 0],
    milton_c: ['lee_c', 0], max_kapstein: ['fanny_e', 0],
    pinchas_f: ['keila_f', 1], chaim_furer: ['keila_f', 1], chaim_tish: ['keila_f', 1],
    edward_p: ['doris_r', 0], andy_r: ['doris_r', 0], thomas_boyer: ['polly_r_ga', 0],
    jane_r: ['bruce_r', 0], joseph_r: ['bruce_r', 0], martin_r: ['ab_r', 0], ellen_berger: ['doris_r', 0],
    mary_squires: ['david_farkas', 0], nell_lauritzen: ['peter_petach', 0], bill_archibald: ['esta_bloom', 0], nathan_gard: ['marian_goldman', 0],
  };
  const BRANCH_ORDER = ['greenwald', 'weinhaus', 'gerald', 'center', 'gervitz', 'kapstein', 'eisenberg', 'hoffman', 'tolarsky', 'bloom', 'reeves', 'cohens'];

  function buildGraph(PEOPLE, COUPLES) {
    const ids = Object.keys(PEOPLE);
    const parents = {}, children = {}, spouses = {};
    ids.forEach(id => { parents[id] = []; children[id] = []; spouses[id] = []; });
    const families = COUPLES.map(([a, b, kids], i) => ({ i, a, b, kids: kids || [] }));
    families.forEach(({ a, b, kids }) => {
      if (b) { if (!spouses[a].includes(b)) spouses[a].push(b); if (!spouses[b].includes(a)) spouses[b].push(a); }
      kids.forEach(k => {
        [a, b].forEach(p => { if (p) { if (!parents[k].includes(p)) parents[k].push(p); if (!children[p].includes(k)) children[p].push(k); } });
      });
    });
    const siblings = {};
    ids.forEach(id => {
      const s = new Set();
      parents[id].forEach(p => children[p].forEach(c => { if (c !== id) s.add(c); }));
      siblings[id] = [...s];
    });
    return { ids, parents, children, spouses, siblings, families };
  }

  // Generation number: Max = 0, parents = 1, grandparents = 2 ...
  function generations(G, start = 'max') {
    const gen = {};
    const flood = (seed, g0) => {
      gen[seed] = g0; const q = [seed];
      while (q.length) {
        const x = q.shift();
        const nb = [...G.spouses[x].map(y => [y, 0]), ...G.parents[x].map(y => [y, 1]), ...G.children[x].map(y => [y, -1])];
        nb.forEach(([y, d]) => { if (gen[y] === undefined) { gen[y] = gen[x] + d; q.push(y); } });
      }
    };
    flood(start, 0);
    let guard = 0;
    while (guard++ < 50) {
      let progressed = false;
      for (const [id, [anchor, off]] of Object.entries(LOOSE_ANCHORS)) {
        if (G.parents[id] && gen[id] === undefined && gen[anchor] !== undefined) { flood(id, gen[anchor] + off); progressed = true; }
      }
      if (!progressed) break;
    }
    G.ids.forEach(id => { if (gen[id] === undefined) flood(id, 0); });
    return gen;
  }

  // Least-squares placement of ordered blocks with fixed widths (no overlap).
  function packBlocks(desired, widths, gap) {
    // block i has center desired[i]; convert to left-edge offsets
    const n = desired.length; const off = []; let acc = 0;
    for (let i = 0; i < n; i++) { off.push(acc + widths[i] / 2); acc += widths[i] + gap; }
    const y = desired.map((d, i) => d - off[i]);
    const stack = []; // pool adjacent violators
    y.forEach(v => { stack.push({ sum: v, n: 1 }); while (stack.length > 1 && stack[stack.length - 2].sum / stack[stack.length - 2].n > stack[stack.length - 1].sum / stack[stack.length - 1].n) { const t = stack.pop(); stack[stack.length - 1].sum += t.sum; stack[stack.length - 1].n += t.n; } });
    const out = []; stack.forEach(s => { for (let k = 0; k < s.n; k++) out.push(s.sum / s.n); });
    return out.map((v, i) => v + off[i]);
  }

  function layout(PEOPLE, COUPLES, opts = {}) {
    const SLOT = opts.slot || 150, ROW = opts.row || 230, GAP = opts.gap || 30;
    const G = buildGraph(PEOPLE, COUPLES);
    const gen = generations(G);
    const rows = {};
    G.ids.forEach(id => { (rows[gen[id]] = rows[gen[id]] || []).push(id); });
    const genKeys = Object.keys(rows).map(Number).sort((a, b) => b - a); // oldest first
    // units: a person plus partners in the same row, kept side by side
    const unitOf = {}, unitsByRow = {};
    genKeys.forEach(g => {
      const seen = new Set(); unitsByRow[g] = [];
      rows[g].forEach(id => {
        if (seen.has(id)) return;
        const u = []; const st = [id];
        while (st.length) { const x = st.pop(); if (seen.has(x)) continue; seen.add(x); u.push(x); G.spouses[x].forEach(s => { if (gen[s] === g && !seen.has(s)) st.push(s); }); }
        // order inside a unit: person with parents in tree stays nearer the middle; keep data order otherwise
        u.sort((a, b) => G.ids.indexOf(a) - G.ids.indexOf(b));
        const unit = { ids: u, x: 0 }; u.forEach(m => unitOf[m] = unit); unitsByRow[g].push(unit);
      });
    });
    const x = {};
    const branchRank = id => { const r = BRANCH_ORDER.indexOf(PEOPLE[id].branch); return r < 0 ? 99 : r; };
    const setUnitX = (unit, cx) => { unit.x = cx; const w = unit.ids.length * SLOT; unit.ids.forEach((m, i) => x[m] = cx - w / 2 + SLOT / 2 + i * SLOT); };
    const place = (g, desiredFn) => {
      const units = unitsByRow[g];
      units.forEach(u => { u.want = desiredFn(u); });
      units.sort((p, q) => (p.want - q.want) || (p.ids[0] < q.ids[0] ? -1 : 1));
      const xs = packBlocks(units.map(u => u.want), units.map(u => u.ids.length * SLOT), GAP);
      units.forEach((u, i) => setUnitX(u, xs[i]));
      // put the partner who has parents on the side closer to them
      units.forEach(u => {
        if (u.ids.length !== 2) return;
        const pc = m => { const ps = G.parents[m].filter(p => x[p] !== undefined); return ps.length ? avg(ps.map(p => x[p])) : null; };
        const [a, b] = u.ids; const pa = pc(a), pb = pc(b);
        const swap = (pa !== null && pa > u.x && (pb === null || pb < pa)) || (pa === null && pb !== null && pb < u.x);
        if (swap) { u.ids.reverse(); setUnitX(u, u.x); }
      });
    };
    const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
    // initial top-down pass
    genKeys.forEach((g, gi) => {
      const idxInRow = new Map(rows[g].map((id, i) => [id, i]));
      place(g, u => {
        const ps = u.ids.flatMap(m => G.parents[m]).filter(p => x[p] !== undefined);
        if (ps.length) return avg(ps.map(p => x[p]));
        const anc = u.ids.map(m => LOOSE_ANCHORS[m]).find(Boolean);
        if (anc && x[anc[0]] !== undefined) return x[anc[0]] + 1;
        return branchRank(u.ids[0]) * 2000 + idxInRow.get(u.ids[0]) * SLOT;
      });
    });
    // refine: alternate bottom-up and top-down
    for (let it = 0; it < 6; it++) {
      [...genKeys].reverse().forEach(g => place(g, u => {
        const ks = u.ids.flatMap(m => G.children[m]);
        if (ks.length) return avg(ks.map(k => x[k]));
        return u.x;
      }));
      genKeys.forEach(g => place(g, u => {
        const ps = u.ids.flatMap(m => G.parents[m]);
        const ks = u.ids.flatMap(m => G.children[m]);
        if (ps.length && ks.length) return (avg(ps.map(p => x[p])) + avg(ks.map(k => x[k]))) / 2;
        if (ps.length) return avg(ps.map(p => x[p]));
        const anc = u.ids.map(m => LOOSE_ANCHORS[m]).find(Boolean);
        if (anc && !ks.length) return x[anc[0]] + 1;
        return u.x;
      }));
    }
    // close empty vertical corridors (no one in any row) so the tree stays compact
    const compact = () => {
      const all = [...new Set(Object.values(x).map(v => Math.round(v)))].sort((a, b) => a - b);
      const maxGap = SLOT * 1.6;
      let shift = 0; const cuts = [];
      for (let i = 1; i < all.length; i++) { const g = all[i] - all[i - 1]; if (g > maxGap) cuts.push([all[i - 1], g - maxGap]); }
      if (!cuts.length) return;
      Object.keys(x).forEach(id => { let d = 0; cuts.forEach(([at, by]) => { if (x[id] > at + 1) d += by; }); x[id] -= d; });
    };
    compact();
    const minX = Math.min(...Object.values(x));
    const pos = {}; const top = genKeys[0];
    G.ids.forEach(id => { pos[id] = { x: x[id] - minX + SLOT, y: (top - gen[id]) * ROW + 120, gen: gen[id] }; });
    return { G, gen, pos, genKeys, SLOT, ROW };
  }

  const ord = n => n === 1 ? '' : n === 2 ? '2nd ' : n === 3 ? '3rd ' : n + 'th ';
  const greats = n => n <= 0 ? '' : n === 1 ? 'great-' : ord(n) + 'great-';
  function kinTerm(up, down, gender) {
    const F = gender === 'F', M = gender === 'M';
    const g = (m, f, x) => M ? m : F ? f : x;
    if (up === 0 && down === 0) return 'self';
    if (down === 0) return up === 1 ? g('father', 'mother', 'parent') : greats(up - 2) + g('grandfather', 'grandmother', 'grandparent');
    if (up === 0) return down === 1 ? g('son', 'daughter', 'child') : greats(down - 2) + g('grandson', 'granddaughter', 'grandchild');
    if (up === 1 && down === 1) return g('brother', 'sister', 'sibling');
    if (up === 1) return (down === 2 ? '' : greats(down - 3) + 'grand') + g('nephew', 'niece', 'niece/nephew');
    if (down === 1) return greats(up - 2) + g('uncle', 'aunt', 'aunt/uncle');
    const deg = Math.min(up, down) - 1, rem = Math.abs(up - down);
    const remTxt = rem === 0 ? '' : rem === 1 ? ' once removed' : rem === 2 ? ' twice removed' : ` ${rem} times removed`;
    return `${deg === 1 ? '1st' : ord(deg).trim()} cousin${remTxt}`;
  }

  // Shortest path between two people over parent/child/partner links.
  function findPath(G, from, to) {
    if (from === to) return [{ id: from }];
    const prev = { [from]: null }; const q = [from];
    while (q.length) {
      const x = q.shift();
      const nb = [...G.parents[x].map(y => [y, 'parent']), ...G.children[x].map(y => [y, 'child']), ...G.spouses[x].map(y => [y, 'partner'])];
      for (const [y, how] of nb) {
        if (y in prev) continue; prev[y] = { x, how };
        if (y === to) { const path = [{ id: to, how }]; let c = x; while (c !== from) { path.unshift({ id: c, how: prev[c].how }); c = prev[c].x; } path.unshift({ id: from }); return path; }
        q.push(y);
      }
    }
    return null;
  }

  // Blood relationship via nearest common ancestor; returns null if none.
  function bloodRelation(G, PEOPLE, from, to) {
    const depth = (s) => { const d = { [s]: 0 }; const q = [s]; while (q.length) { const x = q.shift(); G.parents[x].forEach(p => { if (!(p in d)) { d[p] = d[x] + 1; q.push(p); } }); } return d; };
    const a = depth(from), b = depth(to);
    let best = null;
    Object.keys(a).forEach(k => { if (k in b) { const s = a[k] + b[k]; if (!best || s < best.s) best = { s, up: a[k], down: b[k], via: k }; } });
    if (!best) return null;
    let term = kinTerm(best.up, best.down, PEOPLE[to].gender);
    // half relation: siblings-level share only one parent
    if (best.up >= 1 && best.down >= 1) {
      const shared = Object.keys(a).filter(k => k in b && a[k] === best.up && b[k] === best.down);
      if (shared.length === 1 && G.spouses[best.via].length) {
        const sp = G.spouses[best.via];
        const coupleKnown = sp.some(s => s in a && s in b && a[s] === best.up && b[s] === best.down);
        if (!coupleKnown) term = 'half ' + term;
      }
    }
    return { term, up: best.up, down: best.down, via: best.via };
  }

  function describe(G, PEOPLE, from, to) {
    const blood = bloodRelation(G, PEOPLE, from, to);
    const path = findPath(G, from, to);
    let term = blood ? blood.term : null;
    if (!term && path) term = path.some(s => s.how === 'partner') ? 'related by marriage' : 'related';
    return { term, blood, path };
  }

  const api = { buildGraph, generations, layout, packBlocks, kinTerm, findPath, bloodRelation, describe, LOOSE_ANCHORS, BRANCH_ORDER };
  if (typeof module !== 'undefined') module.exports = api; else root.Family = api;
})(this);
