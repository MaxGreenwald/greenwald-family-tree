/* global PEOPLE, COUPLES, Family */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ME = 'max';
  const L = Family.layout(PEOPLE, COUPLES, { slot: 160, row: 240, gap: 34 });
  const { G, pos } = L;
  const ids = G.ids;
  const color = id => `var(--b-${PEOPLE[id].branch}, #888)`;
  const titleCase = s => s.toLowerCase().replace(/\b([a-z])/g, m => m.toUpperCase()).replace(/\b(1st|2nd|3rd)\b/gi, m => m.toLowerCase());
  const GEN_NAMES = { 0: "Max's generation", 1: "Parents' generation", 2: "Grandparents' generation", 3: "Great-grandparents' generation", 4: "2nd great-grandparents' generation", 5: "3rd great-grandparents' generation" };
  const BRANCH_LABEL = { center: 'Max & siblings', gerald: 'Greenwald (Gerald & Gigi)', greenwald: 'Greenwald (older)', weinhaus: 'Weinhaus', gervitz: 'Gervitz', kapstein: 'Kapstein', eisenberg: 'Eisenberg', hoffman: 'Hoffman', tolarsky: 'Tolarsky', bloom: 'Bloom', reeves: 'Reeves', cohens: 'Cohens' };

  $('#subtitle').textContent = `${ids.length} people · ${L.genKeys.length} generations`;

  // ---------- Theme ----------
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('ft-theme');
  root.dataset.theme = savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  $('#themeBtn').onclick = () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('ft-theme', root.dataset.theme); };

  // ---------- Draw ----------
  const svg = $('#svg'), vp = $('#viewport');
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const xs = ids.map(i => pos[i].x), ysAll = ids.map(i => pos[i].y);
  const bounds = { x0: Math.min(...xs) - 160, x1: Math.max(...xs) + 160, y0: Math.min(...ysAll) - 120, y1: Math.max(...ysAll) + 120 };

  // generation bands
  const bands = $('#genBands');
  L.genKeys.forEach((g, i) => {
    const y = pos[ids.find(id => pos[id].gen === g)].y;
    const b = el('g', { class: 'band' }, bands);
    if (i % 2 === 0) el('rect', { x: bounds.x0 - 4000, y: y - 110, width: bounds.x1 - bounds.x0 + 8000, height: 240 }, b);
    const t = el('text', { x: bounds.x0 + 10, y: y - 80 }, b); t.textContent = GEN_NAMES[g] || `Generation ${g}`;
    t.dataset.gen = g;
  });

  // edges: one group per family so we can highlight it
  const edgesG = $('#edges');
  const famEls = [];
  const rowStagger = {};
  G.families.forEach(f => {
    const a = pos[f.a], b = f.b ? pos[f.b] : null;
    const grp = el('g', { 'data-fam': f.i }, edgesG);
    const parts = [];
    if (b) { const p = el('path', { class: 'edge couple', d: `M${a.x},${a.y} L${b.x},${b.y}` }, grp); parts.push(p); }
    if (f.kids.length) {
      const px = b ? (a.x + b.x) / 2 : a.x, py = a.y;
      const ky = Math.min(...f.kids.map(k => pos[k].y));
      const key = Math.round(py); rowStagger[key] = (rowStagger[key] || 0) + 1;
      const bar = py + (ky - py) * 0.55 + ((rowStagger[key] % 5) - 2) * 7;
      const kxs = f.kids.map(k => pos[k].x);
      const lo = Math.min(px, ...kxs), hi = Math.max(px, ...kxs);
      let d = `M${px},${py + (b ? 0 : 34)} V${bar} M${lo},${bar} H${hi}`;
      f.kids.forEach(k => { d += ` M${pos[k].x},${bar} V${pos[k].y - 34}`; });
      parts.push(el('path', { class: 'edge', d }, grp));
    }
    famEls[f.i] = parts;
  });

  // nodes
  const nodesG = $('#nodes');
  const nodeEl = {};
  const wrap = (s, n) => { if (s.length <= n) return [s]; const w = s.split(' '); const out = ['']; w.forEach(x => { if ((out[out.length - 1] + ' ' + x).trim().length > n && out[out.length - 1]) out.push(x); else out[out.length - 1] = (out[out.length - 1] + ' ' + x).trim(); }); return out.slice(0, 2).map((l, i, arr) => (i === 1 && out.length > 2) ? l + '…' : l); };
  ids.forEach(id => {
    const p = PEOPLE[id], { x, y } = pos[id];
    const g = el('g', { class: 'node' + (id === ME ? ' me' : ''), transform: `translate(${x},${y})`, tabindex: 0, role: 'button', 'aria-label': `${p.name}, ${titleCase(p.rel)}`, 'data-id': id }, nodesG);
    el('rect', { class: 'hit', x: -75, y: -36, width: 150, height: 120 }, g);
    const r = id === ME ? 34 : 28;
    el('circle', { class: 'ring', r: r + 5 }, g);
    el('circle', { class: 'disc', r, fill: color(id) }, g);
    el('text', { class: 'ini', y: 1 }, g).textContent = p.initials;
    const lines = wrap(p.name, 18);
    lines.forEach((l, i) => { el('text', { class: 'nm', y: r + 22 + i * 17 }, g).textContent = l; });
    el('text', { class: 'rl', y: r + 22 + lines.length * 17 }, g).textContent = p.rel;
    nodeEl[id] = g;
  });

  // ---------- Pan & zoom ----------
  const view = { x: 0, y: 0, k: 1 };
  const MINK = 0.03, MAXK = 2.5;
  const apply = () => {
    vp.setAttribute('transform', `translate(${view.x},${view.y}) scale(${view.k})`);
    svg.classList.toggle('far', view.k < 0.32);
  };
  const clampK = k => Math.max(MINK, Math.min(MAXK, k));
  const zoomAt = (k, cx, cy) => { k = clampK(k); view.x = cx - (cx - view.x) * (k / view.k); view.y = cy - (cy - view.y) * (k / view.k); view.k = k; apply(); };
  let anim = null;
  const animateTo = (tx, ty, tk, ms = 450) => {
    cancelAnimationFrame(anim);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 0;
    const s = { ...view }, t0 = performance.now();
    const step = now => { const t = ms ? Math.min(1, (now - t0) / ms) : 1, e = 1 - Math.pow(1 - t, 3);
      view.x = s.x + (tx - s.x) * e; view.y = s.y + (ty - s.y) * e; view.k = s.k + (tk - s.k) * e; apply(); if (t < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  };
  const stageSize = () => { const r = svg.getBoundingClientRect(); return { w: r.width, h: r.height }; };
  const topPad = () => $('.topbar').getBoundingClientRect().height;
  const cardCover = () => { const c = $('#card'); if (c.hidden) return { right: 0, bottom: 0 }; const r = c.getBoundingClientRect(); return innerWidth <= 760 ? { right: 0, bottom: r.height } : { right: r.width + 14, bottom: 0 }; };
  const flyTo = (x, y, k = Math.max(view.k, 0.85), ms) => {
    const { w, h } = stageSize(), tp = topPad(), cc = cardCover();
    const cx = (w - cc.right) / 2, cy = tp + (h - tp - cc.bottom) / 2;
    animateTo(cx - x * k, cy - y * k, clampK(k), ms);
  };
  const fitBox = (x0, y0, x1, y1, ms) => {
    const { w, h } = stageSize(), tp = topPad(), cc = cardCover();
    const k = clampK(Math.min((w - cc.right - 40) / (x1 - x0), (h - tp - cc.bottom - 40) / (y1 - y0)));
    animateTo((w - cc.right) / 2 - (x0 + x1) / 2 * k, tp + (h - tp - cc.bottom) / 2 - (y0 + y1) / 2 * k, k, ms);
  };
  const fitAll = ms => fitBox(bounds.x0, bounds.y0, bounds.x1, bounds.y1, ms);
  const homeView = ms => { // Max, siblings and parents, readable size
    const k = innerWidth <= 760 ? 0.62 : 0.8;
    flyTo(pos[ME].x, pos[ME].y - L.ROW * 0.45, k, ms);
  };
  const pointers = new Map(); let pinch = null, moved = false, lastTap = 0;
  svg.addEventListener('pointerdown', e => {
    svg.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); cancelAnimationFrame(anim);
    moved = false;
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.k }; }
  });
  svg.addEventListener('pointermove', e => {
    const prev = pointers.get(e.pointerId); if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY }; pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      view.x += cur.x - prev.x; view.y += cur.y - prev.y; apply();
      if (dragDist(e) > 6) moved = true;
      svg.classList.add('dragging');
    } else if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      zoomAt(pinch.k * d / pinch.d, mx, my);
      // pan with the midpoint as well
      if (pinch.mx !== undefined) { view.x += mx - pinch.mx; view.y += my - pinch.my; apply(); }
      pinch.mx = mx; pinch.my = my; moved = true;
    }
  });
  let downAt = null;
  svg.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; }, true);
  const dragDist = e => downAt ? Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) : 0;
  const endPointer = e => {
    pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
    svg.classList.remove('dragging');
    if (e.type === 'pointerup' && !moved && pointers.size === 0) {
      const n = document.elementFromPoint(e.clientX, e.clientY)?.closest('.node');
      const now = performance.now();
      if (n) select(n.dataset.id, { fly: false });
      else if (now - lastTap < 320) zoomAt(view.k * 1.8, e.clientX, e.clientY);
      else if (!$('#card').hidden) closeCard();
      lastTap = now;
    }
  };
  svg.addEventListener('pointerup', endPointer); svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('wheel', e => {
    e.preventDefault(); cancelAnimationFrame(anim);
    const mouseWheel = e.deltaMode !== 0 || (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
    if (e.ctrlKey || mouseWheel) {
      zoomAt(view.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX, e.clientY);
    } else { view.x -= e.deltaX; view.y -= e.deltaY; apply(); }
  }, { passive: false });
  const centerZoom = f => { const { w, h } = stageSize(); const k = clampK(view.k * f); const cx = w / 2, cy = h / 2; animateTo(cx - (cx - view.x) * (k / view.k), cy - (cy - view.y) * (k / view.k), k, 220); };
  $('#zIn').onclick = () => centerZoom(1.4); $('#zOut').onclick = () => centerZoom(1 / 1.4);
  $('#zFit').onclick = () => fitAll(); $('#zMe').onclick = () => { select(ME, { fly: false }); homeView(); };
  addEventListener('resize', () => apply());

  // ---------- Highlight ----------
  const lineage = id => {
    const s = new Set([id]);
    const up = x => G.parents[x].forEach(p => { if (!s.has(p)) { s.add(p); up(p); } });
    const down = x => G.children[x].forEach(c => { if (!s.has(c)) { s.add(c); down(c); } });
    up(id); down(id); G.spouses[id].forEach(p => s.add(p));
    return s;
  };
  const clearHL = () => { svg.classList.remove('dimmed'); svg.querySelectorAll('.hl,.path,.sel').forEach(e => e.classList.remove('hl', 'path', 'sel')); legendBtns.forEach(b => b.setAttribute('aria-pressed', 'false')); };
  const highlight = (set, pathPairs) => {
    clearHL(); svg.classList.add('dimmed');
    set.forEach(i => nodeEl[i].classList.add('hl'));
    G.families.forEach(f => {
      const ps = [f.a, f.b].filter(Boolean);
      const lit = ps.some(p => set.has(p)) && (f.kids.some(k => set.has(k)) || (ps.length === 2 && ps.every(p => set.has(p))));
      if (lit) famEls[f.i].forEach(e => e.classList.add('hl'));
      if (pathPairs && pathPairs.some(([u, v]) => (ps.includes(u) && (f.kids.includes(v) || ps.includes(v))) || (ps.includes(v) && (f.kids.includes(u) || ps.includes(u)))))
        famEls[f.i].forEach(e => e.classList.add('path'));
    });
  };

  // ---------- Person card ----------
  const card = $('#card'), cardBody = $('#cardBody');
  let current = null;
  const chip = id => `<button class="chip" data-go="${id}"><span class="d" style="background:${color(id)}">${esc(PEOPLE[id].initials)}</span>${esc(PEOPLE[id].name)}</button>`;
  const group = (title, list) => list.length ? `<h3>${title}</h3><div class="chips">${list.map(chip).join('')}</div>` : '';
  // Only flag a mismatch that means something (not aunt vs. AUNT/UNCLE wording).
  const differs = (stored, term) => {
    const strip = t => t.toLowerCase().replace(/-/g, ' ').replace(/\b(aunt\/uncle|aunt|uncle|grandparent|grandmother|grandfather|niece\/nephew|niece|nephew|half)\b/g, 'X').replace(/\s+/g, ' ').trim();
    return stored === 'RELATIVE' || strip(stored) !== strip(term);
  };
  // Online sources (obituaries, Find a Grave, notices). Only http(s) URLs are rendered.
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '';
  function linksSection(p) {
    const links = (p.links || []).filter(l => l && safeUrl(l.url));
    const credit = p.photo && safeUrl(p.photoSource) ? `<p class="muted small photo-credit">Photo: <a href="${esc(p.photoSource)}" target="_blank" rel="noopener noreferrer">source</a></p>` : '';
    if (!links.length) return credit;
    return `<h3>Links</h3><ul class="links">${links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label || l.url)}</a></li>`).join('')}</ul>${credit}`;
  }
  function renderCard(id) {
    const p = PEOPLE[id];
    const rel = id === ME ? null : Family.describe(G, PEOPLE, ME, id);
    const facts = [];
    if (p.born) facts.push(['Born', p.born]); if (p.died) facts.push(['Died', p.died]);
    facts.push(['Branch', BRANCH_LABEL[p.branch] || p.branch]);
    facts.push(['Generation', GEN_NAMES[pos[id].gen] || pos[id].gen]);
    if (rel && rel.term && differs(p.rel, rel.term)) facts.push(['By the links', `Max's ${rel.term}`]);
    if (rel && !rel.path) facts.push(['By the links', 'Not linked to Max yet']);
    cardBody.innerHTML = `
      <div class="hero"><div class="avatar" style="background:${color(id)}">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(p.initials)}</div>
      <div><h2>${esc(p.name)}</h2><span class="tag">${id === ME ? 'You' : esc(titleCase(p.rel))}</span></div></div>
      ${p.notes ? `<div class="note">${esc(p.notes)}</div>` : ''}
      <dl class="facts">${facts.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl>
      ${group('Parents', G.parents[id])}${group(G.spouses[id].length > 1 ? 'Partners' : 'Partner', G.spouses[id])}
      ${group('Siblings', G.siblings[id])}${group('Children', G.children[id])}
      ${linksSection(p)}
      ${!G.parents[id].length && !G.children[id].length && !G.spouses[id].length && !G.siblings[id].length ? '<p class="muted small">Not yet connected to anyone else in the tree.</p>' : ''}
      <div class="row">${id !== ME ? `<button class="btn primary small" data-rel="${id}">How is ${esc(p.name.split(' ')[0])} related to Max?</button>` : ''}<button class="btn small" data-share="${id}">Share</button></div>`;
  }
  function select(id, { fly = true, push = true } = {}) {
    current = id; renderCard(id); card.hidden = false; document.body.classList.add('card-open');
    highlight(lineage(id)); nodeEl[id].classList.add('sel');
    if (fly) flyTo(pos[id].x, pos[id].y); else ensureVisible(id);
    if (push) history.replaceState(null, '', '#p=' + id);
  }
  const ensureVisible = id => {
    const { w, h } = stageSize(), sx = pos[id].x * view.k + view.x, sy = pos[id].y * view.k + view.y, cc = cardCover();
    if (sx < 40 || sx > w - cc.right - 40 || sy < topPad() + 40 || sy > h - cc.bottom - 40) flyTo(pos[id].x, pos[id].y, view.k);
  };
  function closeCard() { card.hidden = true; document.body.classList.remove('card-open'); current = null; clearHL(); history.replaceState(null, '', location.pathname + location.search); }
  $('#cardClose').onclick = closeCard;
  card.addEventListener('click', e => {
    const go = e.target.closest('[data-go]'); if (go) { if (!$('#list').hidden) setView('tree'); select(go.dataset.go); }
    const r = e.target.closest('[data-rel]'); if (r) openRel(ME, r.dataset.rel);
    const s = e.target.closest('[data-share]'); if (s) share(s.dataset.share);
  });
  // swipe the sheet down to close (phone)
  let sheetY = null;
  card.addEventListener('touchstart', e => { if (card.scrollTop <= 0) sheetY = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchmove', e => { if (sheetY !== null) { const d = e.touches[0].clientY - sheetY; if (d > 0) card.style.transform = `translateY(${d}px)`; } }, { passive: true });
  card.addEventListener('touchend', e => { if (sheetY === null) return; const d = e.changedTouches[0].clientY - sheetY; card.style.transform = ''; sheetY = null; if (d > 90) closeCard(); });
  nodesG.addEventListener('keydown', e => { const n = e.target.closest('.node'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(n.dataset.id); } });

  // ---------- Search ----------
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const index = ids.map(id => ({ id, hay: norm(`${PEOPLE[id].name} ${PEOPLE[id].notes || ''} ${PEOPLE[id].rel} ${PEOPLE[id].branch}`), name: norm(PEOPLE[id].name) }));
  const input = $('#search'), results = $('#results');
  let hits = [], hi = 0;
  const showResults = () => {
    const q = norm(input.value.trim());
    if (!q) { results.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    const terms = q.split(/\s+/);
    hits = index.filter(r => terms.every(t => r.hay.includes(t)))
      .sort((a, b) => (b.name.startsWith(q) - a.name.startsWith(q)) || (b.name.includes(q) - a.name.includes(q)) || a.name.localeCompare(b.name)).slice(0, 12);
    hi = 0;
    results.innerHTML = hits.length ? hits.map((r, i) => `<li role="option" id="opt${i}" data-id="${r.id}" aria-selected="${i === hi}"><span class="dot" style="background:${color(r.id)}">${esc(PEOPLE[r.id].initials)}</span><span><div class="r1">${esc(PEOPLE[r.id].name)}</div><div class="r2">${esc(titleCase(PEOPLE[r.id].rel))}${PEOPLE[r.id].notes ? ' · ' + esc(PEOPLE[r.id].notes) : ''}</div></span></li>`).join('') : '<li class="muted">No one by that name yet</li>';
    results.hidden = false; input.setAttribute('aria-expanded', 'true');
  };
  const pick = id => { input.value = ''; results.hidden = true; input.blur(); if (!$('#list').hidden) setView('tree'); select(id, { fly: true }); };
  input.addEventListener('input', showResults);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); [...results.children].forEach((li, i) => li.setAttribute('aria-selected', i === hi)); input.setAttribute('aria-activedescendant', 'opt' + hi); }
    else if (e.key === 'Enter' && hits[hi]) pick(hits[hi].id);
    else if (e.key === 'Escape') { input.value = ''; showResults(); input.blur(); }
  });
  results.addEventListener('pointerdown', e => { const li = e.target.closest('li[data-id]'); if (li) { e.preventDefault(); pick(li.dataset.id); } });
  input.addEventListener('blur', () => setTimeout(() => { results.hidden = true; }, 150));

  // ---------- Legend / branch filter ----------
  const branches = [...new Set(ids.map(i => PEOPLE[i].branch))].sort((a, b) => Family.BRANCH_ORDER.indexOf(a) - Family.BRANCH_ORDER.indexOf(b));
  $('#legendItems').innerHTML = branches.map(b => `<button data-branch="${b}" aria-pressed="false"><span class="sw" style="background:var(--b-${b})"></span>${esc(BRANCH_LABEL[b] || b)}<span class="n">${ids.filter(i => PEOPLE[i].branch === b).length}</span></button>`).join('');
  const legendBtns = [...document.querySelectorAll('#legendItems button')];
  legendBtns.forEach(btn => btn.onclick = () => {
    const on = btn.getAttribute('aria-pressed') === 'true';
    if (!card.hidden) closeCard();
    clearHL();
    if (on) return;
    const set = new Set(ids.filter(i => PEOPLE[i].branch === btn.dataset.branch));
    highlight(set); btn.setAttribute('aria-pressed', 'true');
    const bx = [...set].map(i => pos[i].x), by = [...set].map(i => pos[i].y);
    fitBox(Math.min(...bx) - 100, Math.min(...by) - 80, Math.max(...bx) + 100, Math.max(...by) + 110);
  });

  // ---------- List view ----------
  const list = $('#list');
  list.innerHTML = L.genKeys.map(g => {
    const people = ids.filter(i => pos[i].gen === g).sort((a, b) => pos[a].x - pos[b].x);
    return `<section><h2>${esc(GEN_NAMES[g] || 'Generation ' + g)}<small>${people.length}</small></h2><div class="grid">${people.map(i => `<button data-go="${i}"><span class="d" style="background:${color(i)}">${esc(PEOPLE[i].initials)}</span><span><div>${esc(PEOPLE[i].name)}</div><div class="t2">${esc(PEOPLE[i].rel)}</div></span></button>`).join('')}</div></section>`;
  }).reverse().join('');
  list.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { renderCard(b.dataset.go); current = b.dataset.go; card.hidden = false; document.body.classList.add('card-open'); } });
  function setView(v) {
    const tree = v === 'tree';
    list.hidden = tree; svg.style.visibility = tree ? '' : 'hidden';
    $('#viewTree').classList.toggle('on', tree); $('#viewList').classList.toggle('on', !tree);
    $('#viewTree').setAttribute('aria-pressed', tree); $('#viewList').setAttribute('aria-pressed', !tree);
    document.querySelector('.zoom').style.display = tree ? '' : 'none'; $('#legend').style.display = tree ? '' : 'none';
    if (tree && current) select(current);
  }
  $('#viewTree').onclick = () => setView('tree'); $('#viewList').onclick = () => setView('list');

  // ---------- Relationship finder ----------
  const dlg = $('#relDialog'), selA = $('#relA'), selB = $('#relB');
  const opts = [...ids].sort((a, b) => PEOPLE[a].name.localeCompare(PEOPLE[b].name)).map(i => `<option value="${i}">${esc(PEOPLE[i].name)}${PEOPLE[i].name.length < 12 ? ' (' + esc(titleCase(PEOPLE[i].rel)) + ')' : ''}</option>`).join('');
  selA.innerHTML = opts; selB.innerHTML = opts;
  const STEP = { parent: (g) => g === 'M' ? 'father' : g === 'F' ? 'mother' : 'parent', child: g => g === 'M' ? 'son' : g === 'F' ? 'daughter' : 'child', partner: () => 'partner' };
  let lastRel = null;
  function computeRel() {
    const a = selA.value, b = selB.value;
    const r = Family.describe(G, PEOPLE, a, b); lastRel = { a, b, r };
    const A = PEOPLE[a].name, B = PEOPLE[b].name;
    if (a === b) { $('#relOut').innerHTML = '<div class="big">Same person</div>'; return; }
    if (!r.path) { $('#relOut').innerHTML = `<div class="big">No known link yet</div><p class="muted small">The tree doesn't connect ${esc(A)} and ${esc(B)}.</p>`; return; }
    const steps = r.path.slice(1).map((s, i) => `<li>${esc(PEOPLE[r.path[i].id].name.split(' ')[0])}'s ${STEP[s.how](PEOPLE[s.id].gender)}: <b>${esc(PEOPLE[s.id].name)}</b></li>`).join('');
    $('#relOut').innerHTML = `<div class="big">${esc(B)} is ${esc(A.split(' ')[0])}'s ${esc(r.term)}</div>${r.blood && r.blood.via !== a && r.blood.via !== b ? `<p class="muted small">Common ancestor: ${esc(PEOPLE[r.blood.via].name)}</p>` : ''}<ol>${steps}</ol>`;
  }
  function openRel(a = ME, b) { selA.value = a; selB.value = b || (current && current !== a ? current : 'boruch_gw'); computeRel(); if (!dlg.open) dlg.showModal(); }
  selA.onchange = selB.onchange = computeRel;
  $('#relSwap').onclick = () => { const t = selA.value; selA.value = selB.value; selB.value = t; computeRel(); };
  $('#relBtn').onclick = () => openRel(ME);
  $('#relShow').onclick = () => {
    if (!lastRel || !lastRel.r.path) return; dlg.close(); setView('tree');
    const p = lastRel.r.path, set = new Set(p.map(s => s.id)), pairs = p.slice(1).map((s, i) => [p[i].id, s.id]);
    card.hidden = true; document.body.classList.remove('card-open');
    highlight(set, pairs);
    const bx = p.map(s => pos[s.id].x), by = p.map(s => pos[s.id].y);
    fitBox(Math.min(...bx) - 120, Math.min(...by) - 90, Math.max(...bx) + 120, Math.max(...by) + 120);
  };

  // ---------- Menu: share, print, download ----------
  const menu = $('#moreMenu'), moreBtn = $('#moreBtn');
  const toggleMenu = (show = menu.hidden) => { menu.hidden = !show; moreBtn.setAttribute('aria-expanded', show); };
  moreBtn.onclick = e => { e.stopPropagation(); toggleMenu(); };
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) toggleMenu(false); });
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };
  async function share(id) {
    const url = location.origin + location.pathname + (id ? '#p=' + id : '');
    const title = id ? `${PEOPLE[id].name} · Greenwald Family Tree` : 'Greenwald Family Tree';
    try { if (navigator.share) { await navigator.share({ title, url }); return; } await navigator.clipboard.writeText(url); toast('Link copied'); }
    catch (_) { prompt('Copy this link:', url); }
  }
  $('#mShare').onclick = () => { toggleMenu(false); share(current); };
  $('#mHelp').onclick = () => { toggleMenu(false); $('#helpDialog').showModal(); };
  $('#mPrint').onclick = () => { toggleMenu(false); window.print(); };
  addEventListener('beforeprint', () => { clearHL(); const k = Math.min(1100 / (bounds.x1 - bounds.x0), 700 / (bounds.y1 - bounds.y0)); view.k = k; view.x = -bounds.x0 * k; view.y = -bounds.y0 * k; apply(); });
  $('#mSvg').onclick = () => {
    toggleMenu(false);
    const clone = svg.cloneNode(true); clone.classList.remove('dimmed', 'far');
    clone.querySelector('#viewport').setAttribute('transform', `translate(${-bounds.x0},${-bounds.y0})`);
    clone.setAttribute('xmlns', NS); clone.setAttribute('width', bounds.x1 - bounds.x0); clone.setAttribute('height', bounds.y1 - bounds.y0);
    const cs = getComputedStyle(root);
    let css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.cssText); } catch (_) { return []; } }).filter(t => /^(\.node|\.edge|\.band)/.test(t)).join('\n');
    css = css.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (m, v, f) => cs.getPropertyValue(v).trim() || f || '#888');
    clone.querySelectorAll('[fill^="var("]').forEach(n => { const v = n.getAttribute('fill').match(/var\((--[\w-]+)/)[1]; n.setAttribute('fill', cs.getPropertyValue(v).trim()); });
    const st = document.createElementNS(NS, 'style'); st.textContent = css + `\nsvg{background:${cs.getPropertyValue('--bg')}}`; clone.insertBefore(st, clone.firstChild);
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenwald-family-tree.svg'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  // ---------- Keyboard ----------
  addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const step = 80;
    switch (e.key) {
      case '/': e.preventDefault(); input.focus(); break;
      case '+': case '=': centerZoom(1.4); break;
      case '-': case '_': centerZoom(1 / 1.4); break;
      case '0': fitAll(); break;
      case 'm': case 'M': select(ME, { fly: false }); homeView(); break;
      case 'ArrowLeft': view.x += step; apply(); break;
      case 'ArrowRight': view.x -= step; apply(); break;
      case 'ArrowUp': if (!e.target.closest('.node')) { view.y += step; apply(); e.preventDefault(); } break;
      case 'ArrowDown': if (!e.target.closest('.node')) { view.y -= step; apply(); e.preventDefault(); } break;
      case 'Escape': if (!card.hidden) closeCard(); else clearHL(); break;
      case '?': $('#helpDialog').showModal(); break;
    }
  });

  // ---------- Start ----------
  const fromHash = () => { const m = location.hash.match(/p=([\w]+)/); return m && PEOPLE[m[1]] ? m[1] : null; };
  const initial = fromHash();
  if (initial) { select(initial, { fly: false, push: false }); flyTo(pos[initial].x, pos[initial].y, 0.9, 0); }
  else homeView(0);
  addEventListener('hashchange', () => { const id = fromHash(); if (id && id !== current) select(id); });
  window.__tree = { view, pos, select, fitAll, homeView, openRel, G }; // for tests
})();
