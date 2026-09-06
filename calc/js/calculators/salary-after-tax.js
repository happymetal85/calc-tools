/* 공통 급여 계산 함수 — 다른 계산기(4대보험·연말정산)도 같이 쓴다 */
HT.payroll = {
  // 2026년 요율 — 국민연금 9.5%(근로자 4.75%), 기준소득월액 41만~659만원(2026.7~2027.6)
  // 건강보험 7.19%(근로자 3.595%), 장기요양 0.9448%(건강보험료 × 0.9448/7.19 = 13.14%), 고용보험 0.9%
  NP_RATE: 0.0475, NP_MIN: 410000, NP_MAX: 6590000,
  HI_RATE: 0.03595, LTC_RATE: 0.9448 / 7.19, EI_RATE: 0.009,
  monthly(gross) { // gross: 월 과세 보수
    const f10 = x => Math.floor(Math.round(x) / 10) * 10; // 원 단위 반올림 후 10원 미만 절사 (부동소수점 오차 방지)
    const npBase = HT.clamp(gross, this.NP_MIN, this.NP_MAX); const np = f10(npBase * this.NP_RATE);
    const hi = f10(gross * this.HI_RATE); const ltc = f10(hi * this.LTC_RATE); const ei = f10(gross * this.EI_RATE);
    return { np, hi, ltc, ei, total: np + hi + ltc + ei };
  },
  earnedIncomeDeduction(g) { if (g <= 5e6) return g * .7; if (g <= 15e6) return 3.5e6 + (g - 5e6) * .4; if (g <= 45e6) return 7.5e6 + (g - 15e6) * .15; if (g <= 1e8) return 12e6 + (g - 45e6) * .05; return Math.min(2e7, 14.75e6 + (g - 1e8) * .02); },
  earnedIncomeCredit(calc, g) { let c = calc <= 1.3e6 ? calc * .55 : 715000 + (calc - 1.3e6) * .3; let cap = g <= 33e6 ? 740000 : g <= 70e6 ? Math.max(660000, 740000 - (g - 33e6) * .008) : Math.max(500000, 660000 - (g - 70e6) / 2); return Math.min(c, cap); },
  childCredit(n) { return n <= 0 ? 0 : n === 1 ? 250000 : n === 2 ? 550000 : 550000 + (n - 2) * 400000; },
  /* 연봉 → 월 실수령액 (다른 계산기에서 재사용) */
  netMonthly(salary, fam = 1, kids = 0, nontax = 200000) {
    if (!salary) return { net: 0, ins: { total: 0 }, tax: 0, local: 0 };
    const taxableM = Math.max(0, salary / 12 - nontax); const ins = this.monthly(taxableM); const annual = taxableM * 12;
    const income = annual - this.earnedIncomeDeduction(annual); const base = Math.max(0, income - 1.5e6 * Math.max(1, fam) - ins.np * 12);
    const calc = HT.progressive(base, HT.INCOME_TAX).tax; const yearTax = Math.max(0, calc - this.earnedIncomeCredit(calc, annual) - this.childCredit(kids));
    const tax = Math.floor(yearTax / 12 / 10) * 10, local = Math.floor(tax * 0.1 / 10) * 10;
    return { net: salary / 12 - ins.total - tax - local, ins, tax, local };
  },
};
HT.register({
  id: 'salary-after-tax', cat: '급여·소득', order: 1, name: '연봉 실수령액 계산기', keywords: '연봉 실수령액 월급 세후',
  desc: '연봉에서 4대보험과 소득세·지방소득세를 빼고 매달 실제로 받는 금액을 계산합니다. (2026년 요율)',
  note: '소득세는 근로소득공제·인적공제·연금보험료공제·근로소득세액공제·자녀세액공제를 반영해 연간 결정세액을 12로 나눈 값으로, 간이세액표와 비슷하지만 똑같지는 않습니다. 2026년 요율은 국민연금 4.75%(연금개혁으로 9%에서 9.5%로 인상), 건강보험 3.595%, 장기요양 건강보험료의 13.14%, 고용보험 0.9%이며, 국민연금 기준소득월액은 41만~659만원(2026년 7월 고시)을 적용했습니다. 회사의 비과세 항목·부양가족 등록 상황에 따라 실제 급여명세와 차이가 날 수 있습니다.',
  render(root) {
    const out = HT.output(root); const P = HT.payroll;
    const f = HT.form(root, [
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'fam', label: '부양가족 수 (본인 포함)', type: 'number', unit: '명', value: 1, min: 1 },
      { id: 'kids', label: '8세 이상 20세 이하 자녀 수', type: 'number', unit: '명', value: 0, min: 0 },
      { id: 'nontax', label: '비과세액 (월)', type: 'money', unit: '원', value: 200000, help: '식대 등, 월 20만원까지 비과세' },
    ], calc);
    function calc(v) {
      const gross = v.salary; const taxableM = Math.max(0, gross / 12 - v.nontax); const ins = P.monthly(taxableM);
      const annualTaxable = taxableM * 12;
      const eid = P.earnedIncomeDeduction(annualTaxable); const income = annualTaxable - eid;
      const base = Math.max(0, income - 1.5e6 * Math.max(1, v.fam) - ins.np * 12);
      const calcTax = HT.progressive(base, HT.INCOME_TAX).tax;
      const credit = P.earnedIncomeCredit(calcTax, annualTaxable) + P.childCredit(v.kids);
      const yearTax = Math.max(0, calcTax - credit); const tax = Math.floor(yearTax / 12 / 10) * 10, local = Math.floor(tax * 0.1 / 10) * 10;
      const ded = ins.total + tax + local; const net = gross / 12 - ded;
      out.set(HT.kpi('월 실수령액', HT.won(net), `연 ${HT.won(net * 12)} · 실효세율 ${HT.pct(gross ? ded * 12 / gross * 100 : 0, 1)}`),
        HT.rows([['월 세전 급여', HT.won(gross / 12)], ['국민연금 (4.75%)', '-' + HT.won(ins.np), 'sub'], ['건강보험 (3.595%)', '-' + HT.won(ins.hi), 'sub'], ['장기요양 (건보의 13.14%)', '-' + HT.won(ins.ltc), 'sub'], ['고용보험 (0.9%)', '-' + HT.won(ins.ei), 'sub'], ['소득세', '-' + HT.won(tax), 'sub', `연 결정세액 ${HT.won(yearTax)} ÷ 12`], ['지방소득세 (소득세의 10%)', '-' + HT.won(local), 'sub'], ['월 공제 합계', '-' + HT.won(ded), 'strong'], ['월 실수령액', HT.won(net), 'strong']]),
        HT.barChart([{ label: '실수령액', value: net, color: 'var(--c1)' }, { label: '4대보험', value: ins.total, color: 'var(--g2)' }, { label: '소득세+지방세', value: tax + local, color: 'var(--g3)' }], { fmt: HT.won, cap: '월 급여 구성' }));
    }
    calc(f.values());
  }
});
