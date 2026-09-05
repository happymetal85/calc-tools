/* 그때 샀더라면 — 과거 연도에 일시 또는 매년 투자했을 때 지금(2025년 말) 얼마인지
   연말 기준 데이터(2010~2025): 코스피(KRX), S&P 500, 원/달러(연말 종가), 국제 금(달러/온스 → 원/g 환산), 비트코인(달러 연말 → 원 환산), 서울 아파트 평균 매매가(KB 월간, 12월).
   출처: 코스피 위키백과 연말 종가표·2025년 12월 30일 4,214.17 / S&P 500 2025.12.31 6,845.50 / 원달러 2025.12.30 1,429.8 / 비트코인 2025.12.31 87,646달러·2024 93,425달러
   서울 아파트 2025.12 15억 810만(KB)·2025.7 14억 572만, 2017년 이전 값과 금 2025년 값(+65% 반영)은 근사치 — 각 값은 표에서 확인·수정 가능 */
HT.register({
  id: 'what-if-invested', cat: '금융·투자', order: 0.7, original: false, name: '그때 샀더라면', keywords: '그때 샀더라면 과거 투자 코스피 삼성전자 비트코인 금 서울 아파트 수익 후회 계산기',
  desc: '몇 년 전에 목돈을 넣었거나 매년 꾸준히 넣었다면 지금 얼마가 됐을지, 코스피·미국 주식·금·달러·비트코인·서울 아파트를 나란히 보여줍니다. 예금에 넣었을 때와도 비교합니다.',
  note: '연말 기준 값으로 계산하며 배당·이자·세금·환전 수수료·거래세·보유세는 반영하지 않았습니다. 서울 아파트는 KB 평균 매매가격이라 개별 단지와 다르고 실제로는 대출·취득세·보유세가 듭니다. 2017년 이전 아파트 값과 2025년 금값은 발표 자료를 토대로 한 근사치입니다. 과거 수익률은 미래를 보장하지 않으며, 비트코인은 같은 기간에 70% 넘게 빠진 해도 있었습니다. 표의 값은 직접 고칠 수 있습니다.',
  render(root) {
    const YEARS = Array.from({ length: 16 }, (_, i) => 2010 + i); // 2010..2025
    const DATA = {
      kospi: { name: '코스피', unit: 'pt', v: [2051.00, 1825.74, 1997.05, 2011.34, 1915.59, 1961.31, 2026.46, 2467.49, 2041.04, 2197.67, 2873.47, 2977.65, 2236.40, 2655.28, 2399.49, 4214.17] },
      spx: { name: '미국 S&P 500 (원화)', unit: 'pt', v: [1257.64, 1257.60, 1426.19, 1848.36, 2058.90, 2043.94, 2238.83, 2673.61, 2506.85, 3230.78, 3756.07, 4766.18, 3839.50, 4769.83, 5881.63, 6845.50], fx: true },
      usd: { name: '달러 (현금)', unit: '원/$', v: [1134.8, 1151.8, 1070.6, 1055.4, 1099.3, 1172.5, 1207.7, 1070.5, 1115.7, 1156.4, 1086.3, 1188.8, 1264.5, 1288.0, 1472.5, 1429.8] },
      gold: { name: '금 (원화)', unit: '$/oz', v: [1405, 1531, 1657, 1202, 1199, 1060, 1146, 1303, 1282, 1517, 1898, 1829, 1824, 2063, 2624, 4320], fx: true },
      btc: { name: '비트코인 (원화)', unit: '$', v: [null, null, null, 754, 320, 430, 963, 13860, 3742, 7194, 28990, 46306, 16547, 42265, 93425, 87646], fx: true },
      apt: { name: '서울 아파트 평균', unit: '만원', v: [53700, 54400, 53700, 53100, 55000, 57700, 59000, 66700, 81600, 85400, 104300, 125000, 126400, 120000, 128000, 150810] },
    };
    const out = HT.output(root, '지금 얼마?');
    const f = HT.form(root, [
      { id: 'year', label: '투자 시작 연도 (그해 연말)', type: 'select', options: YEARS.slice(0, -1).map(y => [String(y), y + '년']), value: '2015' },
      { id: 'mode', label: '투자 방식', type: 'seg', options: [['lump', '한 번에 목돈'], ['annual', '매년 같은 금액']], value: 'lump' },
      { id: 'lump', label: '목돈', type: 'money', unit: '원', value: 10000000, show: v => v.mode === 'lump' },
      { id: 'annual', label: '매년 투자액 (매년 연말)', type: 'money', unit: '원', value: 3600000, show: v => v.mode === 'annual', help: '월 30만원이면 360만원' },
      { id: 'depRate', label: '비교용 예금 금리 (세후 15.4% 차감)', type: 'number', unit: '%', value: 2.5, step: 0.1 },
    ], calc);
    const price = (k, i) => { const d = DATA[k]; const raw = d.v[i]; if (raw == null) return null; return d.fx ? raw * DATA.usd.v[i] : raw; }; // 원화 환산 가격 (S&P·금·BTC는 달러 × 연말 환율)
    function simulate(k, v) { const i0 = YEARS.indexOf(HT.num(v.year)); const iN = YEARS.length - 1; let units = 0, invested = 0; const path = [];
      for (let i = i0; i <= iN; i++) { const p = price(k, i); if (p == null) { path.push(null); continue; } if (v.mode === 'lump' ? i === i0 : i < iN) { const amt = v.mode === 'lump' ? v.lump : v.annual; units += amt / p; invested += amt; } path.push(units * p); }
      const pN = price(k, iN); if (!units) return null; return { value: units * pN, invested, path, mult: units * pN / invested }; }
    function calc(v) {
      const i0 = YEARS.indexOf(HT.num(v.year)); const yrs = YEARS.length - 1 - i0; const rs = v.depRate / 100 * (1 - .154);
      let dep = 0, depIn = 0; for (let i = i0; i < YEARS.length; i++) { if (v.mode === 'lump' ? i === i0 : i < YEARS.length - 1) { dep += v.mode === 'lump' ? v.lump : v.annual; depIn += v.mode === 'lump' ? v.lump : v.annual; } if (i < YEARS.length - 1) dep *= 1 + rs; }
      const res = Object.keys(DATA).map(k => ({ k, name: DATA[k].name, r: simulate(k, v) })).filter(x => x.r); const best = res.reduce((a, b) => b.r.value > a.r.value ? b : a);
      const invested = best.r.invested; const share = `${v.year}년 연말에 ${v.mode === 'lump' ? HT.wonKor(v.lump) + '을 한 번에' : '매년 ' + HT.wonKor(v.annual) + '씩'} ${best.name}에 넣었다면 2025년 말 ${HT.wonKor(best.r.value)} (${HT.fmt(best.r.mult, 1)}배). 예금이면 ${HT.wonKor(dep)} — 한손도구 그때 샀더라면`;
      const btns = HT.shareButtons(share, { title: `${v.year}년에 샀더라면`, big: HT.wonKor(best.r.value), lines: [`${best.name} · 원금 ${HT.wonKor(invested)}의 ${HT.fmt(best.r.mult, 1)}배`, `예금이면 ${HT.wonKor(dep)}`], file: 'whatif' });
      const labels = YEARS.slice(i0).map(y => String(y).slice(2) + "'");
      const chart = (() => { const W = 600, H = 220, padL = 70, padB = 26, padT = 10; const series = res.filter(x => x.k !== 'btc' || true); const all = series.flatMap(x => x.r.path.filter(p => p != null)); const max = Math.max(...all, dep, 1); const n = labels.length; const px = i => padL + (W - padL - 10) * (n > 1 ? i / (n - 1) : 0), py = val => padT + (H - padT - padB) * (1 - Math.log10(1 + val / invested * 10) / Math.log10(1 + max / invested * 10));
        let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`; [1, 2, 5, 10, 20, 50].filter(m => m * invested <= max * 1.2).forEach(m => { const y = py(m * invested); s += `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="var(--line)"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${m}배</text>`; });
        const colors = { kospi: 'var(--c1)', spx: 'var(--pair-navy)', usd: 'var(--g2)', gold: 'var(--warn)', btc: 'var(--cat2)', apt: 'var(--c3)' };
        series.forEach(x => { const pts = x.r.path.map((p, i) => p == null ? null : px(i) + ',' + py(p)).filter(Boolean).join(' '); s += `<polyline fill="none" stroke="${colors[x.k]}" stroke-width="${x === best ? 2.5 : 1.5}" points="${pts}"/>`; const last = x.r.path[x.r.path.length - 1]; s += `<text x="${px(n - 1) - 4}" y="${py(last) - 3}" text-anchor="end" font-size="10" fill="${colors[x.k]}">${HT.esc(x.name.split(' ')[0])}</text>`; });
        labels.forEach((l, i) => { if (n <= 12 || i % 2 === 0) s += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${l}</text>`; });
        const d = HT.el('div', { class: 'chart', html: s + '</svg>' }); d.append(HT.el('div', { class: 'cap' }, '투자 원금 대비 배수 (로그 눈금) — 선 끝의 이름으로 구분')); return d; })();
      out.set(HT.kpi(`${best.name}에 넣었다면`, HT.wonKor(best.r.value), `${v.year}년 말 → 2025년 말 (${yrs}년) · 원금 ${HT.wonKor(invested)}의 ${HT.fmt(best.r.mult, 1)}배` + (v.mode === 'lump' ? ` · 연평균 ${HT.pct((Math.pow(best.r.mult, 1 / yrs) - 1) * 100, 1)}` : ` · 매년 ${HT.wonKor(v.annual)} × ${yrs}회`)),
        chart,
        HT.table(['자산', '2025년 말 평가액', '원금', '배수', '예금 대비'], [...res.sort((a, b) => b.r.value - a.r.value).map(x => [x.name, HT.won(x.r.value), HT.won(x.r.invested), HT.fmt(x.r.mult, 2) + '배', (x.r.value - dep >= 0 ? '+' : '') + HT.wonKor(x.r.value - dep)]), [`예금 (세후 ${HT.fmt(rs * 100, 2)}%)`, HT.won(dep), HT.won(depIn), HT.fmt(dep / depIn, 2) + '배', '-']], { right: [1, 2, 3, 4], scroll: false, hi: r => r[0] === best.name }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('h3', { style: 'margin-top:16px' }, '연말 기준 데이터 (수정 가능)'),
        dataTable());
    }
    function dataTable() { const keys = Object.keys(DATA); const t = HT.el('table', { class: 'grid' }); const th = HT.el('tr'); ['연도', ...keys.map(k => DATA[k].name.split(' (')[0] + ' (' + DATA[k].unit + ')')].forEach(h => th.append(HT.el('th', { class: 'r' }, h))); t.append(HT.el('thead', {}, th)); const tb = HT.el('tbody');
      YEARS.forEach((y, i) => { const tr = HT.el('tr'); tr.append(HT.el('td', {}, y + '년')); keys.forEach(k => { const inp = HT.el('input', { type: 'text', value: DATA[k].v[i] == null ? '' : DATA[k].v[i], style: 'width:90px;text-align:right' }); inp.addEventListener('change', () => { DATA[k].v[i] = inp.value === '' ? null : HT.num(inp.value); calc(f.values()); }); tr.append(HT.el('td', { class: 'r' }, inp)); }); tb.append(tr); }); t.append(tb); return HT.el('div', { class: 'scroll-x' }, t); }
    calc(f.values());
  }
});
