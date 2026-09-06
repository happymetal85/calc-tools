/* 또래 백분위 — 내 연봉·순자산이 전체와 같은 나이대에서 어디쯤인지
   근로소득: 국세청 2023년 귀속 근로소득 백분위(상위 0.1% 11.38억, 1% 2.17억, 10% 1.01억, 20% 7,624만, 중위 4,272만, 평균 5,482만, 1,368만명)
   연령별 소득: 통계청 2023년 임금근로일자리 소득 — 월평균 20대 263만·30대 386만·40대 451만·50대 429만·60세 이상 250만, 전체 평균 363만·중위 278만
   순자산: 통계청 2025년 가계금융복지조사(2025.3 기준) — 상위 0.1% 86.7억, 0.5% 44.2억, 1% 33억, 5% 15.2억, 10% 10.5억, 20% 7억, 중위 2.6억, 하위 20% 1.4억,
          평균 4.71억 / 연령별 평균 30대 이하 2.5억·40대 4.3억·50대 5.5억·60세 이상 5.2억
   중간 구간은 로그 보간, 연령대 안 분포는 로그정규 근사 — 결과는 통계적 추정치 */
HT.register({
  id: 'peer-percentile', cat: '내 재무', order: 2, name: '나는 상위 몇 %? (또래 백분위)', keywords: '연봉 순위 상위 몇 퍼센트 또래 백분위 순자산 순위 비교',
  desc: '내 연봉과 순자산이 전체 근로자·가구 중 상위 몇 %인지, 같은 나이대에서는 어디쯤인지 공식 통계(국세청 근로소득 백분위, 통계청 임금근로일자리 소득·가계금융복지조사)로 추정해 공유용 문장으로 만들어 줍니다.',
  note: '연봉 순위는 국세청 2023년 귀속 근로소득 백분위(2025년 공개)의 공개 구간을 로그 보간한 값이라 구간 사이는 추정입니다. 또래 순위는 통계청 임금근로일자리 연령별 평균소득에 로그정규 분포를 가정한 근사치이며, 순자산은 가구 단위 통계(가구주 연령)라 1인 가구가 아니면 배우자 자산을 합쳐 넣어야 맞습니다. 순자산 연령별은 평균만 공개되어 전체 분포 모양을 빌려 추정했습니다. 재미와 감 잡기용이며 정확한 순위가 아닙니다.',
  render(root) {
    const out = HT.output(root, '내 위치');
    // 상위 p% 경계값 (연소득, 원) — 폼보다 먼저 선언 (f.set이 즉시 calc를 부른다)
    const INCOME_PTS = [[0.1, 1137690000], [1, 216730000], [10, 100570000], [20, 76240000], [50, 42720000]];
    const NW_PTS = [[0.1, 8.67e9], [0.5, 4.42e9], [1, 3.3e9], [5, 1.52e9], [10, 1.05e9], [20, 7e8], [50, 2.6e8], [80, 1.4e8]];
    const AGE_INCOME = [[29, 2630000], [39, 3860000], [49, 4510000], [59, 4290000], [200, 2500000]]; const SIG_INC = Math.sqrt(2 * Math.log(3630000 / 2780000));
    const AGE_NW = [[39, 2.5e8], [49, 4.3e8], [59, 5.5e8], [200, 5.2e8]]; const SIG_NW = Math.sqrt(2 * Math.log(4.71e8 / 2.6e8));
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '나이 (만)', type: 'number', unit: '세', value: 32, min: 18, max: 90 },
      { id: 'salary', p: 'salary', label: '연봉 (세전, 근로소득)', type: 'money', unit: '원', value: 50000000 },
      { id: 'nw', label: '순자산 (자산 − 부채, 배우자 포함 가구 기준)', type: 'money', unit: '원', value: 150000000, help: '대시보드에 입력했다면 금융자산 + 주택 − 대출로 채워집니다' },
    ], calc);
    const prof = HT.profile.get(); if (prof.assets != null) { const nw = (prof.assets || 0) + (prof.homeValue || 0) + (prof.jeonse || 0) - (prof.mortgage || 0) - (prof.otherDebt || 0); if (nw) f.set('nw', nw); }
    // 표에서 값 → 상위 % (로그-로그 보간, 표 밖은 로그정규 꼬리로 외삽)
    function topPct(val, pts, sigma) {
      if (val >= pts[0][1]) { return Math.max(0.01, pts[0][0] * Math.pow(pts[0][1] / val, 1.2)); } // 최상위: 파레토 근사
      for (let i = 0; i < pts.length - 1; i++) { const [p1, v1] = pts[i], [p2, v2] = pts[i + 1]; if (val <= v1 && val >= v2) { const t = (Math.log(v1) - Math.log(val)) / (Math.log(v1) - Math.log(v2)); return Math.exp(Math.log(p1) + t * (Math.log(p2) - Math.log(p1))); } }
      const [pL, vL] = pts[pts.length - 1]; if (val <= 0) return 99.9; // 마지막 점 아래: 로그정규 꼬리 (중위 기준 σ)
      const z = Math.log(vL / val) / sigma; const zL = invNorm(1 - pL / 100); return Math.min(97, (1 - cdf(zL - z)) * 100); // 최하위는 97%(하위 3%)에서 멈춤 — 음(−)의 순자산 가구가 있어 꼬리 추정이 거칠다
    }
    function cdf(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z >= 0 ? 1 - p : p; }
    function invNorm(p) { let lo = -6, hi = 6; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (cdf(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
    function agePercentile(val, age, table, sigma) { const mean = (table.find(t => age <= t[0]) || table[table.length - 1])[1]; const mu = Math.log(mean) - sigma * sigma / 2; if (val <= 0) return { top: 99.9, mean }; const z = (Math.log(val) - mu) / sigma; return { top: (1 - cdf(z)) * 100, mean }; }
    function fmtTop(p) { return p < 1 ? `상위 ${HT.fmt(p, 1)}%` : p <= 50 ? `상위 ${HT.fmt(p, 0)}%` : `하위 ${HT.fmt(100 - p, 0)}%`; }
    function bar(p, label) { const x = HT.clamp(100 - p, 0, 100); return HT.el('div', { class: 'chart', html: `<svg viewBox="0 0 600 44"><rect x="0" y="16" width="600" height="12" rx="6" fill="var(--g4)"/><rect x="0" y="16" width="${x * 6}" height="12" rx="6" fill="var(--c2)"/><circle cx="${x * 6}" cy="22" r="8" fill="var(--brand-deep)"/><text x="0" y="10" font-size="10" fill="var(--ink-soft)">하위</text><text x="600" y="10" font-size="10" text-anchor="end" fill="var(--ink-soft)">상위</text><text x="${HT.clamp(x * 6, 40, 560)}" y="42" font-size="11" text-anchor="middle" fill="var(--brand-deep)">${HT.esc(label)}</text></svg>` }); }
    function calc(v) {
      const incAll = topPct(v.salary, INCOME_PTS, 0.688); const incAge = agePercentile(v.salary / 12, v.age, AGE_INCOME, SIG_INC);
      const nwAll = topPct(v.nw, NW_PTS, SIG_NW); const nwAge = agePercentile(v.nw, v.age, AGE_NW, SIG_NW);
      const ageLabel = v.age <= 29 ? '20대' : v.age <= 39 ? '30대' : v.age <= 49 ? '40대' : v.age <= 59 ? '50대' : '60세 이상';
      const share = `내 연봉은 대한민국 근로자 중 ${fmtTop(incAll)}, ${ageLabel} 중 ${fmtTop(incAge.top)}. 순자산은 전체 가구 중 ${fmtTop(nwAll)} — 숫자맛집 또래 백분위`;
      const btns = HT.shareButtons(share, { title: '나는 상위 몇 %?', big: `연봉 ${fmtTop(incAll)}`, lines: [`${ageLabel} 안에서 ${fmtTop(incAge.top)}`, `순자산 ${fmtTop(nwAll)} (${ageLabel} ${fmtTop(nwAge.top)})`], file: 'percentile' });
      const nextInc = [...INCOME_PTS].reverse().find(p => p[1] > v.salary); const nextNw = [...NW_PTS].reverse().find(p => p[1] > v.nw); // 바로 위 구간
      out.set(HT.kpi('연봉 순위 (전체 근로자)', fmtTop(incAll), `연봉 ${HT.wonKor(v.salary)} · 국세청 2023년 귀속 근로소득 1,368만명 기준 · 중위 4,272만 · 평균 5,482만`), bar(incAll, `내 연봉 ${HT.wonKor(v.salary)}`),
        HT.kpis([[`${ageLabel} 안에서`, fmtTop(incAge.top), `${ageLabel} 월평균 ${HT.won(incAge.mean)} (연 ${HT.wonKor(incAge.mean * 12)}) 대비 ${HT.fmt(v.salary / 12 / incAge.mean, 2)}배`], ['다음 구간까지', nextInc ? `${HT.wonKor(nextInc[1] - v.salary)} 더` : '최상위 구간', nextInc ? `상위 ${nextInc[0]}% 경계 ${HT.wonKor(nextInc[1])}` : '']]),
        HT.kpi('순자산 순위 (전체 가구)', fmtTop(nwAll), `순자산 ${HT.wonKor(v.nw)} · 통계청 2025년 가계금융복지조사 · 중위 2.6억 · 평균 4.71억`), bar(nwAll, `내 순자산 ${HT.wonKor(v.nw)}`),
        HT.kpis([[`${ageLabel} 가구주 안에서`, fmtTop(nwAge.top), `${ageLabel} 평균 순자산 ${HT.wonKor(nwAge.mean)} 대비 ${HT.fmt(v.nw / nwAge.mean, 2)}배`], ['다음 구간까지', nextNw ? `${HT.wonKor(nextNw[1] - v.nw)} 더` : '최상위 구간', nextNw ? `상위 ${nextNw[0]}% 경계 ${HT.wonKor(nextNw[1])}` : '']]),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('h3', { style: 'margin-top:16px' }, '기준표'),
        HT.table(['상위', '근로소득 (2023 귀속)', '가구 순자산 (2025.3)'], [['0.1%', HT.wonKor(INCOME_PTS[0][1]), HT.wonKor(NW_PTS[0][1])], ['1%', HT.wonKor(INCOME_PTS[1][1]), HT.wonKor(NW_PTS[2][1])], ['5%', '약 ' + HT.wonKor(Math.exp(Math.log(INCOME_PTS[1][1]) + (Math.log(INCOME_PTS[2][1]) - Math.log(INCOME_PTS[1][1])) * (Math.log(5) / Math.log(10))) ) + ' (보간)', HT.wonKor(NW_PTS[3][1])], ['10%', HT.wonKor(INCOME_PTS[2][1]), HT.wonKor(NW_PTS[4][1])], ['20%', HT.wonKor(INCOME_PTS[3][1]), HT.wonKor(NW_PTS[5][1])], ['50% (중위)', HT.wonKor(INCOME_PTS[4][1]), HT.wonKor(NW_PTS[6][1])], ['80%', '추정', HT.wonKor(NW_PTS[7][1])]], { right: [1, 2], scroll: false, hi: r => (r[0] === (nextInc ? nextInc[0] + '%' : '')) }));
    }
    calc(f.values());
  }
});
