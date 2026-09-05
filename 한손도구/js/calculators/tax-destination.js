/* 내 세금이 간 곳 — 내가 낸 국세(소득세 + 부가세 추정)를 2026년 확정 예산 분야별 비율로 나눠 본다
   2026년 예산 727.9조 (국회 확정): 보건·복지·고용 269.1 · 일반·지방행정 121.4 · 교육 99.9 · 국방 65.9 · R&D 35.5 · 산업·중소기업·에너지 31.8
   · 농림·수산·식품 28.0 · SOC 27.7 · 공공질서·안전 27.3 · 환경 13.9 · 문화·체육·관광 9.6 · 외교·통일 7.0 (조원) */
HT.register({
  id: 'tax-destination', cat: '급여·소득', order: 0.95, original: false, name: '내 세금이 간 곳', keywords: '내 세금 사용처 예산 분야별 국방 복지 교육 소득세 부가세 배분',
  desc: '내가 한 해 낸 소득세와 부가세(추정)를 2026년 나라 예산의 분야별 비율로 나눠 "내 돈 얼마가 국방비, 얼마가 복지에 쓰였는지" 보여줍니다.',
  note: '실제 세금은 특정 분야에 꼬리표가 붙지 않고 일반회계로 섞이므로, 이 계산은 "전체 예산 비율대로 내 돈도 쓰였다"는 가정입니다. 지방소득세는 국가 예산이 아니라 사는 지자체로 가고, 4대보험료는 각 보험 기금으로 가서 여기서 뺐습니다. 부가세는 실수령 중 지출 비율과 과세 비율로 추정합니다. 예산 비율은 2026년 국회 확정 예산(총지출 727.9조원) 기준입니다.',
  render(root) {
    const BUDGET = [['보건·복지·고용', 269.1], ['일반·지방행정', 121.4], ['교육', 99.9], ['국방', 65.9], ['연구개발 (R&D)', 35.5], ['산업·중소기업·에너지', 31.8], ['농림·수산·식품', 28.0], ['사회간접자본 (SOC)', 27.7], ['공공질서·안전', 27.3], ['환경', 13.9], ['문화·체육·관광', 9.6], ['외교·통일', 7.0]];
    const SUM = BUDGET.reduce((a, b) => a + b[1], 0);
    const out = HT.output(root, '내 세금의 행방');
    const f = HT.form(root, [
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'fam', label: '부양가족 수 (본인 포함)', type: 'number', unit: '명', value: 1, min: 1 },
      { id: 'spendRate', label: '실수령 중 지출 비율', type: 'number', unit: '%', value: 70, min: 0, max: 100 },
      { id: 'taxable', label: '지출 중 부가세 과세 비율', type: 'number', unit: '%', value: 70, min: 0, max: 100 },
      { id: 'otherTax', label: '그 밖에 낸 국세 (양도세·증여세 등, 선택)', type: 'money', unit: '원', value: 0 },
    ], calc);
    function calc(v) {
      const r = HT.payroll.netMonthly(v.salary, v.fam); const incomeTax = r.tax * 12; const local = r.local * 12; const vat = r.net * 12 * v.spendRate / 100 * v.taxable / 100 * 10 / 110; const national = incomeTax + vat + v.otherTax;
      const rows = BUDGET.map(([n, amt]) => [n, amt, amt / SUM, national * amt / SUM]);
      const share = `내가 올해 낸 국세 ${HT.won(national)} 중 복지·고용에 ${HT.won(rows[0][3])}, 교육에 ${HT.won(rows[2][3])}, 국방에 ${HT.won(rows[3][3])}, R&D에 ${HT.won(rows[4][3])}이 쓰입니다 (2026년 예산 비율) — 한손도구 내 세금이 간 곳`;
      const btns = HT.shareButtons(share, { title: '내 세금이 간 곳 (2026 예산 비율)', big: `국세 ${HT.won(national)}`, lines: [`복지·고용 ${HT.won(rows[0][3])} · 교육 ${HT.won(rows[2][3])}`, `국방 ${HT.won(rows[3][3])} · R&D ${HT.won(rows[4][3])}`], file: 'tax-destination' });
      out.set(HT.kpi('올해 내가 낸 국세 (추정)', HT.won(national), `소득세 ${HT.won(incomeTax)} + 부가세 ${HT.won(vat)}${v.otherTax ? ' + 기타 ' + HT.won(v.otherTax) : ''} · 지방소득세 ${HT.won(local)}은 지자체로, 4대보험 ${HT.won(r.ins.total * 12)}은 보험 기금으로`),
        HT.barChart(rows.map((x, i) => ({ label: x[0], value: x[3], color: i === 0 ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.won, padL: 150, cap: '내 국세가 분야별로 간 금액 (2026년 예산 비율)' }),
        HT.table(['분야', '2026 예산 (조원)', '비율', '내 돈'], rows.map(x => [x[0], HT.fmt(x[1], 1), HT.pct(x[2] * 100, 1), HT.won(x[3])]).concat([['합계', HT.fmt(SUM, 1), '100%', HT.won(national)]]), { right: [1, 2, 3], scroll: false, hi: r => r[0] === '합계' }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 하루로 나누면 내 국세는 하루 ${HT.won(national / 365)}이고, 그중 복지·고용 ${HT.won(rows[0][3] / 365)}, 국방 ${HT.won(rows[3][3] / 365)}입니다. 소득세 결정세액이 0인 근로자(전체의 약 1/3)는 부가세 등 소비세로만 국세를 냅니다. 평생 합계는 <a href="#/lifetime-tax">평생 세금 총액</a>에서.` }));
    }
    calc(f.values());
  }
});
