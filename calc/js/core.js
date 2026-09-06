/* 숫자맛집 — 공통 코어
   계산기는 HT.register({ id, cat, name, desc, render(root) }) 로 등록한다. */
(function () {
  'use strict';
  const HT = { calcs: [], cats: ['내 재무', '부동산', '급여·소득', '주식·세금', '금융·투자', '단위변환기', '유용한도구'] };
  window.HT = HT;

  /* ---------- 내 재무 프로필 — 계산기 간 값 전달 ----------
     대시보드가 저장하고, 다른 계산기는 필드에 p:'키'를 달아 초기값으로 받는다. 브라우저(localStorage)에만 저장. */
  const PKEY = 'ht_profile';
  HT.profile = {
    get() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) { return {}; } },
    set(patch) { const p = Object.assign(this.get(), patch); try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} return p; },
    clear() { try { localStorage.removeItem(PKEY); } catch (e) {} },
    has() { return Object.keys(this.get()).length > 0; },
  };

  /* ---------- 숫자 ---------- */
  HT.num = (s) => { if (typeof s === 'number') return s; const v = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, '')); return isNaN(v) ? 0 : v; };
  HT.fmt = (n, d = 0) => (isFinite(n) ? Number(n).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '-');
  HT.won = (n) => HT.fmt(Math.round(n)) + '원';
  HT.pct = (n, d = 2) => HT.fmt(n, d) + '%';
  HT.floor10 = (n) => Math.floor(n / 10) * 10;
  HT.floor = Math.floor;
  HT.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  HT.wonKor = (n) => { // 1억 2,345만원 식 표기
    n = Math.round(n); if (!isFinite(n)) return '-'; const sign = n < 0 ? '-' : ''; n = Math.abs(n);
    const eok = Math.floor(n / 1e8), man = Math.floor((n % 1e8) / 1e4), won = n % 1e4; const p = [];
    if (eok) p.push(HT.fmt(eok) + '억'); if (man) p.push(HT.fmt(man) + '만'); if (won && !eok) p.push(HT.fmt(won));
    return sign + (p.length ? p.join(' ') : '0') + '원';
  };
  /* 누진세 — brackets: [[상한, 세율, 누진공제], ...] */
  HT.progressive = (base, brackets) => {
    if (base <= 0) return { tax: 0, rate: 0, deduct: 0 };
    for (const [lim, rate, ded] of brackets) if (base <= lim) return { tax: Math.max(0, base * rate - ded), rate, deduct: ded };
    const [, rate, ded] = brackets[brackets.length - 1]; return { tax: base * rate - ded, rate, deduct: ded };
  };
  /* 구간별 세액 분해(차트용) */
  HT.bracketSplit = (base, brackets) => {
    const out = []; let prev = 0;
    for (const [lim, rate] of brackets) { if (base <= prev) break; const amt = Math.min(base, lim) - prev; out.push({ from: prev, to: Math.min(base, lim), rate, tax: amt * rate }); prev = lim; }
    return out;
  };
  HT.INCOME_TAX = [[14e6, .06, 0], [50e6, .15, 1.26e6], [88e6, .24, 5.76e6], [150e6, .35, 15.44e6], [300e6, .38, 19.94e6], [500e6, .40, 25.94e6], [1e9, .42, 35.94e6], [Infinity, .45, 65.94e6]];
  HT.GIFT_TAX = [[1e8, .10, 0], [5e8, .20, 1e7], [1e9, .30, 6e7], [3e9, .40, 1.6e8], [Infinity, .50, 4.6e8]];
  HT.daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

  /* ---------- DOM ---------- */
  HT.el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== null && v !== undefined) e.setAttribute(k, v); }
    (Array.isArray(children) ? children : [children]).forEach(c => { if (c == null) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return e;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  HT.esc = esc;

  /* 부드럽게 스크롤하되, 브라우저가 무시하면 그냥 이동한다 */
  HT.scrollTo = (el, gap = 8) => {
    const y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - gap), from = window.scrollY;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
    setTimeout(() => { if (Math.abs(window.scrollY - from) < 4) window.scrollTo(0, y); }, 400);
  };

  /* ---------- 입력 폼 ----------
     fields: { id, label, type: money|number|select|check|date|text|seg|range, value, unit, options:[[v,label]], help, min, max, step, show(v) }
     onChange(values) 는 값이 바뀔 때마다 호출. 반환: { values(), set(id,v), el(id), refresh() } */
  HT.form = (root, fields, onChange, opts = {}) => {
    const wrap = HT.el('div', { class: 'panel' });
    if (opts.title !== null) wrap.append(HT.el('h3', {}, opts.title || '입력'));
    const inputs = {}, boxes = {}; const prof = opts.noProfile ? {} : HT.profile.get(); let applied = 0;
    fields = fields.map(f => { if (f.p && prof[f.p] !== undefined && prof[f.p] !== null && prof[f.p] !== '') { applied++; return Object.assign({}, f, { value: prof[f.p] }); } return f; });
    const values = () => { const v = {}; for (const f of fields) { const i = inputs[f.id]; if (!i) continue;
      if (f.type === 'check') v[f.id] = i.checked; else if (f.type === 'money' || f.type === 'number' || f.type === 'range') v[f.id] = HT.num(i.value); else if (f.type === 'seg') v[f.id] = i.dataset.value; else v[f.id] = i.value; }
      return v; };
    const refresh = () => { const v = values(); for (const f of fields) if (f.show) boxes[f.id].style.display = f.show(v) ? '' : 'none'; };
    const fire = () => { refresh(); onChange && onChange(values()); };
    for (const f of fields) {
      const box = HT.el('div', { class: 'field' + (f.type === 'check' ? ' check' : ''), 'data-t': f.type || 'text' }); boxes[f.id] = box;
      let input;
      if (f.type === 'select') { input = HT.el('select', { id: f.id }); (f.options || []).forEach(([v, l]) => input.append(HT.el('option', { value: v }, l))); if (f.value != null) input.value = f.value; input.addEventListener('change', fire); }
      else if (f.type === 'seg') { input = HT.el('div', { class: 'seg', id: f.id }); input.dataset.value = f.value ?? f.options[0][0];
        (f.options || []).forEach(([v, l]) => { const b = HT.el('button', { type: 'button', class: v === input.dataset.value ? 'active' : '' }, l); b.addEventListener('click', () => { input.dataset.value = v; [...input.children].forEach(c => c.classList.toggle('active', c === b)); fire(); }); input.append(b); }); }
      else if (f.type === 'check') { input = HT.el('input', { type: 'checkbox', id: f.id }); input.checked = !!f.value; input.addEventListener('change', fire); }
      else if (f.type === 'money') { input = HT.el('input', { type: 'text', id: f.id, inputmode: 'numeric', placeholder: f.placeholder || '0' }); input.value = f.value != null ? HT.fmt(f.value) : '';
        input.addEventListener('input', () => { const raw = input.value.replace(/[^0-9\-]/g, ''); const pos = input.selectionStart; const before = input.value.length; input.value = raw === '' || raw === '-' ? raw : HT.fmt(parseInt(raw, 10)); const after = input.value.length; try { input.setSelectionRange(pos + after - before, pos + after - before); } catch (e) {} fire(); }); }
      else if (f.type === 'range') { input = HT.el('input', { type: 'range', id: f.id, min: f.min ?? 0, max: f.max ?? 100, step: f.step ?? 1 }); input.value = f.value ?? 0; input.addEventListener('input', () => { if (f.showValue) box.querySelector('.rv').textContent = input.value + (f.unit || ''); fire(); }); }
      else { input = HT.el('input', { type: f.type === 'number' ? 'number' : (f.type || 'text'), id: f.id, placeholder: f.placeholder || '', min: f.min, max: f.max, step: f.step }); if (f.value != null) input.value = f.value; input.addEventListener('input', fire); input.addEventListener('change', fire); }
      inputs[f.id] = input;
      if (f.type === 'check') box.append(HT.el('label', {}, [input, f.label]));
      else { const lab = HT.el('label', { for: f.id }, f.label); if (f.type === 'range' && f.showValue) lab.append(' ', HT.el('span', { class: 'rv' }, input.value + (f.unit || ''))); box.append(lab); const inw = HT.el('div', { class: 'in' }, [input]); if (f.unit && f.type !== 'range') inw.append(HT.el('span', { class: 'unit' }, f.unit)); box.append(inw); }
      if (f.help) box.append(HT.el('div', { class: 'help', html: f.help }));
      wrap.append(box);
    }
    if (opts.extra) wrap.append(opts.extra);
    if (applied && !opts.hideHint) wrap.prepend(HT.el('div', { class: 'help profile-hint', html: `<a href="#/finance-dashboard">내 재무 대시보드</a>의 값 ${applied}개를 초기값으로 넣었습니다.` }));
    root.append(wrap); refresh();
    return { values, refresh, el: (id) => inputs[id], set: (id, v) => { const i = inputs[id]; const f = fields.find(x => x.id === id); if (!i) return; if (f.type === 'check') i.checked = !!v; else if (f.type === 'money') i.value = HT.fmt(v); else if (f.type === 'seg') { i.dataset.value = v; [...i.children].forEach((c, k) => c.classList.toggle('active', f.options[k][0] === v)); } else i.value = v; fire(); }, fire, wrap };
  };

  /* ---------- 결과 패널 ---------- */
  HT.output = (root, title = '결과') => {
    const wrap = HT.el('div', { class: 'panel out' }); if (title) wrap.append(HT.el('h3', {}, title));
    const body = HT.el('div'); wrap.append(body); root.append(wrap);
    return { el: body, wrap, clear: () => { body.innerHTML = ''; }, add: (...n) => { n.forEach(x => { if (x != null) body.append(x); }); }, set: (...n) => { body.innerHTML = ''; n.forEach(x => { if (x != null) body.append(x); }); } };
  };
  HT.kpi = (label, value, sub) => HT.el('div', { class: 'kpi' }, [HT.el('div', { class: 'lbl' }, label), HT.el('div', { class: 'val' }, value), sub ? HT.el('div', { class: 'sub', html: sub }) : null]);
  HT.kpis = (items) => HT.el('div', { class: 'kpis' }, items.map(([l, v, s]) => HT.kpi(l, v, s)));
  /* rows: [[label, value, cls?, hint?]] */
  HT.rows = (rows) => { const t = HT.el('table', { class: 'rows' }); rows.forEach(r => { if (!r) return; const [l, v, cls, hint] = r; const td1 = HT.el('td', {}, l); if (hint) td1.append(HT.el('span', { class: 'hint', html: hint })); t.append(HT.el('tr', { class: cls || '' }, [td1, HT.el('td', {}, v)])); }); return t; };
  HT.table = (headers, rows, opts = {}) => { const t = HT.el('table', { class: 'grid' }); const th = HT.el('tr'); headers.forEach((h, i) => th.append(HT.el('th', { class: (opts.right || []).includes(i) ? 'r' : '' }, h))); t.append(HT.el('thead', {}, th));
    const tb = HT.el('tbody'); rows.forEach((r, ri) => { const tr = HT.el('tr', { class: opts.hi && opts.hi(r, ri) ? 'hi' : '' }); r.forEach((c, i) => tr.append(HT.el('td', { class: (opts.right || []).includes(i) ? 'r' : '' }, c))); tb.append(tr); }); t.append(tb);
    return opts.scroll === false ? t : HT.el('div', { class: 'scroll-x' }, t); };
  HT.note = (html, title) => HT.el('div', { class: 'note', html: (title ? '<b>' + esc(title) + '</b> ' : '') + html });
  HT.badge = (text, kind = 'ok') => HT.el('span', { class: 'badge ' + kind }, text);
  HT.tabs = (root, items, onSel) => { // items: [[key,label]]
    const bar = HT.el('div', { class: 'tabs' }); let cur = items[0][0];
    const sel = (k) => { cur = k; [...bar.children].forEach(b => b.classList.toggle('active', b.dataset.k === k)); onSel(k); };
    items.forEach(([k, l]) => { const b = HT.el('button', { type: 'button', 'data-k': k }, l); b.addEventListener('click', () => sel(k)); bar.append(b); });
    root.append(bar); sel(cur); return { sel, get: () => cur };
  };

  /* ---------- 차트 (SVG) ----------
     가로 막대: items [{label, value, color?}] — 0 기준선, 값 라벨 직접 표기 */
  HT.barChart = (items, opts = {}) => {
    const W = 560, rowH = 26, padL = opts.padL || 120, padR = 90, H = items.length * rowH + 8;
    const max = Math.max(...items.map(i => Math.abs(i.value)), 1e-9); const fmt = opts.fmt || (v => HT.fmt(v));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || '')}">`;
    items.forEach((it, i) => { const y = i * rowH + 4, w = Math.max(0, Math.abs(it.value) / max * (W - padL - padR)); const col = it.color || 'var(--g2)';
      s += `<text x="${padL - 8}" y="${y + 17}" text-anchor="end" font-size="12" fill="var(--ink-soft)">${esc(it.label)}</text>`;
      s += `<rect x="${padL}" y="${y + 4}" width="${w}" height="${rowH - 10}" fill="${col}" rx="2"/>`;
      s += `<text x="${padL + w + 6}" y="${y + 17}" font-size="12" fill="var(--ink)">${esc(fmt(it.value))}</text>`; });
    s += `<line x1="${padL}" y1="0" x2="${padL}" y2="${H}" stroke="var(--line)"/></svg>`;
    const d = HT.el('div', { class: 'chart', html: s }); if (opts.cap) d.append(HT.el('div', { class: 'cap' }, opts.cap)); return d;
  };
  /* 세로 누적 막대 (연도별 원금/수익 등): series [{name,color,values[]}], labels[] */
  HT.stackChart = (labels, series, opts = {}) => {
    const W = 600, H = 220, padL = 56, padB = 28, padT = 10; const n = labels.length; const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] || 0), 0));
    const max = Math.max(...totals, 1e-9); const bw = Math.max(4, (W - padL - 10) / n * 0.7), step = (W - padL - 10) / n; const fmt = opts.fmt || (v => HT.fmt(v));
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    [0, .5, 1].forEach(t => { const y = padT + (H - padT - padB) * (1 - t); s += `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="var(--line)"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${esc(fmt(max * t))}</text>`; });
    labels.forEach((l, i) => { let y0 = H - padB; const x = padL + step * i + (step - bw) / 2;
      series.forEach(sr => { const v = sr.values[i] || 0; const h = v / max * (H - padT - padB); y0 -= h; s += `<rect x="${x}" y="${y0}" width="${bw}" height="${h}" fill="${sr.color}"><title>${esc(l)} ${esc(sr.name)}: ${esc(fmt(v))}</title></rect>`; });
      if (n <= 16 || i % Math.ceil(n / 12) === 0) s += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${esc(l)}</text>`; });
    s += '</svg>';
    const d = HT.el('div', { class: 'chart', html: s });
    const leg = HT.el('div', { class: 'cap' }); series.forEach(sr => leg.append(HT.el('span', { style: 'margin-right:14px' }, [HT.el('span', { style: `display:inline-block;width:10px;height:10px;background:${sr.color};margin-right:5px;vertical-align:middle` }), sr.name]))); if (opts.cap) leg.append(HT.el('span', { style: 'display:block' }, opts.cap)); d.append(leg); return d;
  };
  /* 선 그래프: points [{x,y}], 0 기준 */
  HT.lineChart = (labels, values, opts = {}) => {
    const W = 600, H = 200, padL = 56, padB = 26, padT = 10; const max = Math.max(...values, 1e-9); const n = values.length; const fmt = opts.fmt || (v => HT.fmt(v));
    const px = i => padL + (W - padL - 10) * (n > 1 ? i / (n - 1) : 0), py = v => padT + (H - padT - padB) * (1 - v / max);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    [0, .5, 1].forEach(t => { const y = py(max * t); s += `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="var(--line)"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${esc(fmt(max * t))}</text>`; });
    s += `<polyline fill="none" stroke="var(--brand-key)" stroke-width="2" points="${values.map((v, i) => px(i) + ',' + py(v)).join(' ')}"/>`;
    labels.forEach((l, i) => { if (n <= 12 || i % Math.ceil(n / 10) === 0 || i === n - 1) s += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${esc(l)}</text>`; });
    s += '</svg>'; const d = HT.el('div', { class: 'chart', html: s }); if (opts.cap) d.append(HT.el('div', { class: 'cap' }, opts.cap)); return d;
  };

  /* ---------- 공유 카드 (캔버스 → PNG) ----------
     card: { title, big, lines: [], footer } — 1080×1080 정사각형, Tide 색. HT.shareButtons(text, card)는 "문장 복사 + 이미지 저장" 버튼 묶음 */
  HT.shareCard = (card) => {
    const W = 1080, H = 1080; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H); g.fillStyle = '#0092C8'; g.fillRect(0, 0, W, 22);
    const font = (px, w) => `${w || 400} ${px}px "Gothic A1", "Noto Sans KR", "Malgun Gothic", sans-serif`;
    const wrap = (text, px, maxW, weight) => { g.font = font(px, weight); const out = []; let line = ''; for (const ch of String(text)) { if (g.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; } if (line) out.push(line); return out; };
    let y = 130; g.fillStyle = '#646E76'; g.font = font(40, 500); g.fillText(card.title || '', 80, y); y += 70;
    let px = 96; let lines = wrap(card.big || '', px, W - 160, 700); while (lines.length > 2 && px > 48) { px -= 8; lines = wrap(card.big, px, W - 160, 700); }
    g.fillStyle = '#00678C'; g.font = font(px, 700); lines.forEach(l => { y += px; g.fillText(l, 80, y); }); y += 40;
    g.fillStyle = '#DCE1E4'; g.fillRect(80, y, W - 160, 3); y += 60;
    g.fillStyle = '#23282D'; (card.lines || []).forEach(t => { wrap(t, 34, W - 160, 400).forEach(l => { y += 52; if (y < H - 140) g.fillText(l, 80, y); }); y += 14; });
    g.fillStyle = '#646E76'; g.font = font(28, 400); g.fillText(card.footer || '숫자맛집 · 궁금한 건 다 있습니다', 80, H - 70);
    g.fillStyle = '#0092C8'; g.fillRect(80, H - 110, 60, 6);
    return cv;
  };
  HT.shareButtons = (text, card) => {
    const copy = HT.el('button', { class: 'btn sm', type: 'button' }, '결과 문장 복사'); copy.addEventListener('click', () => { navigator.clipboard?.writeText(text); copy.textContent = '복사됨'; setTimeout(() => copy.textContent = '결과 문장 복사', 1500); });
    const img = HT.el('button', { class: 'btn sm', type: 'button' }, '이미지 카드 저장'); img.addEventListener('click', () => { try { const cv = HT.shareCard(card || { title: '숫자맛집', big: text }); cv.toBlob(b => { const a = HT.el('a', { href: URL.createObjectURL(b), download: (card && card.file || 'sutjamatjip') + '.png' }); a.click(); img.textContent = '저장됨'; setTimeout(() => img.textContent = '이미지 카드 저장', 1500); }, 'image/png'); } catch (e) { img.textContent = '저장 실패'; } });
    return HT.el('div', { class: 'btns' }, [copy, img]);
  };

  /* ---------- 등록·라우팅 ---------- */
  HT.register = (def) => { HT.calcs.push(def); };
  HT.byId = (id) => HT.calcs.find(c => c.id === id);
  let cleanup = null;
  const narrow = () => window.matchMedia('(max-width: 900px)').matches;
  function renderHome(main) {
    main.innerHTML = '';
    main.append(HT.el('h1', { class: 'page-title' }, '오늘은 뭘 계산해 볼까요'), HT.el('p', { class: 'page-desc' }, `집·급여·세금·노후를 숫자로 확인하는 계산기 ${HT.calcs.length}개. 모든 계산은 브라우저 안에서 이루어지며 입력값은 어디에도 전송되지 않습니다.`));
    const q = HT.el('input', { class: 'home-search', type: 'search', placeholder: '계산기 검색 — 이름·키워드' });
    main.append(q);
    const grid = HT.el('div', { class: 'home-grid' });
    const openByDefault = !narrow();
    HT.cats.forEach(cat => { const list = HT.calcs.filter(c => c.cat === cat); if (!list.length) return;
      const card = HT.el('details', { class: 'card' }); card.open = openByDefault;
      card.append(HT.el('summary', {}, HT.el('h3', {}, [cat, HT.el('span', { class: 'cnt' }, list.length + '개')])));
      const ul = HT.el('ul'); list.forEach(c => ul.append(HT.el('li', { 'data-id': c.id }, HT.el('a', { href: '#/' + c.id }, c.name)))); card.append(ul); grid.append(card); });
    main.append(grid);
    q.addEventListener('input', () => {
      const s = q.value.trim().toLowerCase();
      grid.querySelectorAll('details.card').forEach(card => {
        let any = false;
        card.querySelectorAll('li').forEach(li => {
          const c = HT.byId(li.dataset.id);
          const hit = !s || c.name.toLowerCase().includes(s) || (c.keywords || '').includes(s) || (c.cat || '').includes(s);
          li.classList.toggle('hidden', !hit); any = any || hit;
        });
        card.classList.toggle('hidden', !any);
        card.open = s ? any : openByDefault;
      });
    });
    main.append(HT.el('div', { class: 'foot', html: '기준: 2026년 9월 5일 현재 시행 중인 세법·요율(각 계산기 안내 참조). 결과는 참고용이며 실제 세액·요금은 개인 상황과 고시에 따라 달라질 수 있습니다.' }));
  }

  /* 좁은 화면에서 결과가 화면 밖에 있을 때 핵심 숫자를 위에 붙여 둔다 */
  let kpiBar = null, kpiIO = null, kpiMO = null, kpiSeen = null, kpiScroll = null;
  function clearKpiBar() {
    if (kpiIO) kpiIO.disconnect(); if (kpiMO) kpiMO.disconnect();
    if (kpiScroll) window.removeEventListener('scroll', kpiScroll);
    if (kpiBar) kpiBar.remove();
    kpiBar = kpiIO = kpiMO = kpiSeen = kpiScroll = null;
  }
  function setupKpiBar(root) {
    const out = root.querySelector('.panel.out');
    if (!out || !narrow() || !window.IntersectionObserver) return;
    const lbl = HT.el('span', { class: 'l' }), val = HT.el('span', { class: 'v' });
    const btn = HT.el('button', { class: 'btn sm', type: 'button' }, '결과 보기 ↓');
    kpiBar = HT.el('div', { class: 'kpibar' }, [HT.el('div', { class: 't' }, [lbl, val]), btn]);
    btn.addEventListener('click', () => HT.scrollTo(out));
    document.body.append(kpiBar);
    const sync = () => {
      const k = out.querySelector('.kpi');
      if (!k) { kpiBar.classList.remove('on'); return; }
      lbl.textContent = (k.querySelector('.lbl') || {}).textContent || '결과';
      val.textContent = (k.querySelector('.val') || {}).textContent || '';
      if (k !== kpiSeen) {
        kpiSeen = k;
        if (kpiIO) kpiIO.disconnect();
        kpiIO = new IntersectionObserver(es => {
          const e = es[0];
          kpiBar.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top > 0);
        }, { threshold: 0 });
        kpiIO.observe(k);
      }
    };
    kpiMO = new MutationObserver(sync);
    kpiMO.observe(out, { childList: true, subtree: true, characterData: true });
    // 맨 위에서는 메뉴 버튼을 가리지 않도록 조금 내려간 뒤부터 띄운다
    kpiScroll = () => kpiBar && kpiBar.classList.toggle('past', window.scrollY > 140);
    window.addEventListener('scroll', kpiScroll, { passive: true });
    kpiScroll();
    sync();
  }
  function renderCalc(main, c) {
    main.innerHTML = '';
    main.append(HT.el('div', { class: 'crumb' }, [HT.el('a', { href: '#/' }, '홈'), ' › ', c.cat]), HT.el('h1', { class: 'page-title' }, c.name), HT.el('p', { class: 'page-desc' }, c.desc || ''));
    const root = HT.el('div', { class: 'calc' }); main.append(root);
    try { cleanup = c.render(root) || null; } catch (e) { root.append(HT.el('div', { class: 'alert' }, '계산기를 불러오지 못했습니다: ' + e.message)); console.error(e); }
    if (c.note) main.append(HT.note(c.note, '안내'));
    main.append(HT.el('div', { class: 'foot', html: '계산은 모두 브라우저 안에서 이루어지며 입력값은 어디에도 전송되지 않습니다. 결과는 참고용이니 신고·계약 전에는 세무사·금융기관에 확인하세요.' }));
    setupKpiBar(root);
  }
  function buildSide(side) {
    const q = HT.el('input', { class: 'search', type: 'search', placeholder: '계산기 검색' });
    side.append(HT.el('a', { class: 'logo', href: '#/' }, '숫자맛집'), HT.el('p', { class: 'tagline' }, `계산기 ${HT.calcs.length}개 · 2026년 기준`), q);
    HT.cats.forEach(cat => { const list = HT.calcs.filter(c => c.cat === cat); if (!list.length) return; const box = HT.el('div', { class: 'cat', 'data-cat': cat }); box.append(HT.el('h4', {}, cat)); list.forEach(c => box.append(HT.el('a', { href: '#/' + c.id, 'data-id': c.id }, c.name))); side.append(box); });
    q.addEventListener('input', () => { const s = q.value.trim().toLowerCase(); side.querySelectorAll('.cat').forEach(box => { let any = false; box.querySelectorAll('a').forEach(a => { const hit = !s || a.textContent.toLowerCase().includes(s) || (HT.byId(a.dataset.id)?.keywords || '').includes(s); a.classList.toggle('hidden', !hit); any = any || hit; }); box.classList.toggle('hidden', !any); }); });
  }
  function route() {
    const main = document.getElementById('main'), side = document.getElementById('side');
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    clearKpiBar();
    const id = (location.hash || '#/').replace(/^#\/?/, '');
    side.querySelectorAll('a[data-id]').forEach(a => a.classList.toggle('active', a.dataset.id === id));
    side.classList.remove('open');
    const c = id && HT.byId(id);
    if (c) { renderCalc(main, c); document.title = c.name + ' — 숫자맛집'; } else { renderHome(main); document.title = '숫자맛집 · 궁금한 건 다 있습니다'; }
    window.scrollTo(0, 0);
  }
  document.addEventListener('DOMContentLoaded', () => { HT.calcs.sort((a, b) => HT.cats.indexOf(a.cat) - HT.cats.indexOf(b.cat) || (a.order || 0) - (b.order || 0)); buildSide(document.getElementById('side')); document.getElementById('menu').addEventListener('click', () => document.getElementById('side').classList.toggle('open')); route(); window.addEventListener('hashchange', route); });
})();
