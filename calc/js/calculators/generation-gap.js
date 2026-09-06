/* 부모 세대 vs 나 — 부모가 내 나이였을 때와 지금의 집값·임금·물가·최저임금을 같은 잣대로 비교
   자료(근사, 표에서 수정 가능):
   · 소비자물가지수(2020=100): 1993 46.8 · 2003 69.9 · 2013 93.0 · 2023 111.6, 1990년 1원 = 2025년 3.03원 (통계청)
   · 서울 아파트 평균 매매가: 2010.12 5.3억 · 2020.12 10.43억 · 2025.12 15.08억 (KB 월간), 2005년 이전은 언론·연구 자료 근사(1990 약 1억, 1995 1.3억, 2000 1.6억)
   · 상용근로자 월평균 임금총액(고용노동부 사업체노동력조사, 5인 이상) 근사
   · 최저임금 시급: 1990 690 · 1995 1,170 · 2000 1,600 · 2005 2,840 · 2010 4,110 · 2015 5,580 · 2020 8,590 · 2025 10,030 · 2026 10,320 */
HT.register({
  id: 'generation-gap', cat: '내 재무', order: 3, name: '부모 세대 vs 나', keywords: '부모 세대 비교 PIR 집값 연봉 배수 물가 최저임금 세대 격차',
  desc: '부모님이 내 나이였던 해와 지금을 비교합니다. 그때 서울 아파트는 월급 몇 년치였는지(PIR), 그 시절 월급 100만원은 지금 얼마인지, 최저임금은 몇 배가 됐는지를 한 화면에서 보여줍니다.',
  note: '과거 값은 공식 통계를 5년 단위로 요약한 근사치이며 그 사이 연도는 보간했습니다. 서울 아파트는 평균 매매가격 기준이라 부모님이 실제 사신 집·지역과 다릅니다. 임금은 상용근로자 월평균 임금총액(세전)이며 개인의 연봉과 다르므로 "내 연봉"은 직접 넣습니다. 표의 값은 수정할 수 있고, 비교의 목적은 정확한 숫자보다 "몇 배 벌어졌는가"의 감을 잡는 것입니다.',
  render(root) {
    const YRS = [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];
    const T = {
      cpi: { name: '소비자물가지수 (2020=100)', v: [31.0, 38.5, 54.0, 63.2, 75.0, 85.2, 95.0, 100.0, 116.7] },
      apt: { name: '서울 아파트 평균 매매가 (만원)', v: [3500, 10000, 13000, 16000, 35000, 53000, 56000, 104300, 150810] }, // 2010 이후 KB 월간 평균매매가, 그 이전은 언론·연구 자료 근사
      wage: { name: '상용근로자 월평균 임금 (만원)', v: [39, 64, 127, 165, 241, 283, 330, 366, 435] },
      min: { name: '최저임금 시급 (원)', v: [null, 690, 1170, 1600, 2840, 4110, 5580, 8590, 10030] },
    };
    const out = HT.output(root, '세대 비교');
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '내 나이', type: 'number', unit: '세', value: 32, min: 18, max: 80 },
      { id: 'parentAge', label: '부모님 나이 (아버지 또는 어머니)', type: 'number', unit: '세', value: 62, min: 35, max: 100 },
      { id: 'salary', p: 'salary', label: '내 연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'parentSalary', label: '부모님이 내 나이였을 때 연봉 (모르면 0 → 당시 평균임금 적용)', type: 'money', unit: '원', value: 0 },
      { id: 'house', label: '비교할 집값 (지금)', type: 'money', unit: '원', value: 1508100000, help: 'KB 2025.12 서울 아파트 평균 15억 810만' },
    ], calc);
    function at(key, year) { const v = T[key].v; year = HT.clamp(year, YRS[0], YRS[YRS.length - 1]); for (let i = 0; i < YRS.length - 1; i++) { if (year >= YRS[i] && year <= YRS[i + 1]) { const a = v[i], b = v[i + 1]; if (a == null) return b; const t = (year - YRS[i]) / (YRS[i + 1] - YRS[i]); return a * Math.pow(b / a, t); } } return v[v.length - 1]; }
    function calc(v) {
      const now = 2025; const then = now - (v.parentAge - v.age); if (then < 1985) { out.set(HT.el('div', { class: 'empty' }, `부모님이 ${v.age}세였던 ${then}년은 자료 범위(1985년~) 밖입니다.`)); return; }
      const cpiRatio = at('cpi', now) / at('cpi', then); const aptThen = at('apt', then) * 1e4, aptNow = at('apt', now) * 1e4; const wageThen = at('wage', then) * 1e4 * 12, wageNow = at('wage', now) * 1e4 * 12;
      const pSalary = v.parentSalary > 0 ? v.parentSalary : wageThen; const pirThen = aptThen / pSalary, pirNow = v.house / v.salary; const pirAvgThen = aptThen / wageThen, pirAvgNow = aptNow / wageNow;
      const minThen = at('min', then), minNow = 10320;
      const share = `부모님이 내 나이(${v.age}세)였던 ${then}년: 서울 아파트 ${HT.wonKor(aptThen)} = 연봉 ${HT.fmt(pirThen, 1)}년치. 지금 나: ${HT.wonKor(v.house)} = 연봉 ${HT.fmt(pirNow, 1)}년치. 집값 ${HT.fmt(aptNow / aptThen, 1)}배, 임금 ${HT.fmt(wageNow / wageThen, 1)}배, 물가 ${HT.fmt(cpiRatio, 1)}배 — 숫자맛집 부모 세대 vs 나`;
      const btns = HT.shareButtons(share, { title: `${then}년 부모님 vs ${now}년 나`, big: `집 = 연봉 ${HT.fmt(pirThen, 1)}년 → ${HT.fmt(pirNow, 1)}년`, lines: [`집값 ${HT.fmt(aptNow / aptThen, 1)}배 · 임금 ${HT.fmt(wageNow / wageThen, 1)}배 · 물가 ${HT.fmt(cpiRatio, 1)}배`, `최저임금 ${HT.won(minThen)} → ${HT.won(minNow)}`], file: 'generation' });
      out.set(HT.kpi(`집 한 채 = 연봉 몇 년치 (PIR)`, `${HT.fmt(pirThen, 1)}년 → ${HT.fmt(pirNow, 1)}년`, `${then}년 부모님 ${HT.fmt(pirThen, 1)}년치 vs ${now}년 나 ${HT.fmt(pirNow, 1)}년치 · 평균임금 기준으로는 ${HT.fmt(pirAvgThen, 1)}년 → ${HT.fmt(pirAvgNow, 1)}년`),
        HT.barChart([{ label: `${then}년 부모님`, value: pirThen, color: 'var(--g2)' }, { label: `${now}년 나`, value: pirNow, color: 'var(--c1)' }], { fmt: x => HT.fmt(x, 1) + '년치', cap: '집값 ÷ 연봉 (안 쓰고 모아야 하는 햇수)' }),
        HT.kpis([['집값', `${HT.fmt(aptNow / aptThen, 1)}배`, `${HT.wonKor(aptThen)} → ${HT.wonKor(aptNow)} (서울 평균)`], ['평균 임금', `${HT.fmt(wageNow / wageThen, 1)}배`, `월 ${HT.won(wageThen / 12)} → ${HT.won(wageNow / 12)}`], ['물가', `${HT.fmt(cpiRatio, 1)}배`, `${then}년 100만원 = 지금 ${HT.won(1e6 * cpiRatio)}`], ['최저임금', `${HT.fmt(minNow / minThen, 1)}배`, `시급 ${HT.won(minThen)} → ${HT.won(minNow)}`]]),
        HT.table(['항목', `${then}년 (부모님 ${v.age}세)`, `${now}년 (나 ${v.age}세)`, '배수'], [['서울 아파트 평균', HT.wonKor(aptThen), HT.wonKor(aptNow), HT.fmt(aptNow / aptThen, 1) + '배'], ['연봉 (본인/부모)', HT.wonKor(pSalary) + (v.parentSalary ? '' : ' (평균)'), HT.wonKor(v.salary), HT.fmt(v.salary / pSalary, 1) + '배'], ['물가로 환산한 부모님 연봉', HT.wonKor(pSalary * cpiRatio) + ' (지금 돈)', HT.wonKor(v.salary), HT.fmt(v.salary / (pSalary * cpiRatio), 2) + '배 (실질)'], ['최저임금 월급 (209시간)', HT.won(minThen * 209), HT.won(minNow * 209), HT.fmt(minNow / minThen, 1) + '배'], ['아파트 ÷ 최저임금 연봉', HT.fmt(aptThen / (minThen * 209 * 12), 1) + '년', HT.fmt(aptNow / (minNow * 209 * 12), 1) + '년', '']], { right: [1, 2, 3], scroll: false }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('h3', { style: 'margin-top:16px' }, '기준 자료 (수정 가능)'), dataTable());
    }
    function dataTable() { const keys = Object.keys(T); const t = HT.el('table', { class: 'grid' }); const th = HT.el('tr'); ['연도', ...keys.map(k => T[k].name)].forEach(h => th.append(HT.el('th', { class: 'r' }, h))); t.append(HT.el('thead', {}, th)); const tb = HT.el('tbody');
      YRS.forEach((y, i) => { const tr = HT.el('tr'); tr.append(HT.el('td', {}, y + '년')); keys.forEach(k => { const inp = HT.el('input', { type: 'text', value: T[k].v[i] == null ? '' : T[k].v[i], style: 'width:90px;text-align:right' }); inp.addEventListener('change', () => { T[k].v[i] = inp.value === '' ? null : HT.num(inp.value); calc(f.values()); }); tr.append(HT.el('td', { class: 'r' }, inp)); }); tb.append(tr); }); t.append(tb); return HT.el('div', { class: 'scroll-x' }, t); }
    calc(f.values());
  }
});
