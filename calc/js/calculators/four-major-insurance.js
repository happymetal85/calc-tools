HT.register({
  id: 'four-major-insurance', cat: '급여·소득', order: 6, name: '4대보험료 계산기', keywords: '4대보험 국민연금 건강보험 고용보험 산재보험',
  desc: '월 보수액으로 국민연금·건강보험·장기요양·고용보험·산재보험의 근로자·사업주 부담액을 계산합니다. (2026년 요율)',
  note: '국민연금은 2026년부터 9.5%(근로자 4.75% + 사업주 4.75%)로 올랐고, 기준소득월액은 41만~659만원(2026년 7월부터)입니다. 건강보험은 7.19%(각 3.595%), 장기요양은 0.9448%(건강보험료의 13.14%)입니다. 고용보험 사업주분은 실업급여 0.9%에 고용안정·직업능력개발 요율(기업 규모별 0.25~0.85%)이 더해집니다. 산재보험은 사업주가 전액 부담하며 업종별 요율(0.7~18.6%)이 다릅니다. 보수액은 식대 등 비과세를 뺀 과세 대상 금액입니다.',
  render(root) {
    const out = HT.output(root); const P = HT.payroll;
    const f = HT.form(root, [
      { id: 'pay', label: '월 보수액 (과세 대상)', type: 'money', unit: '원', value: 3500000 },
      { id: 'size', label: '기업 규모', type: 'select', options: [['0.25', '150인 미만'], ['0.45', '150인 이상 (우선지원대상기업)'], ['0.65', '150인 이상 1,000인 미만'], ['0.85', '1,000인 이상 · 국가·지자체']], value: '0.25' },
      { id: 'ia', label: '산재보험 요율 (업종별)', type: 'number', unit: '%', value: 0.7, step: 0.01, help: '금융·보험 0.7%, 도소매 0.9%, 제조 평균 1~2%, 건설 3.6% 등' },
    ], calc);
    function calc(v) {
      const w = P.monthly(v.pay); const extra = HT.num(v.size) / 100; const eiEmp = Math.floor(v.pay * (P.EI_RATE + extra) / 10) * 10; const ia = Math.floor(v.pay * v.ia / 100 / 10) * 10;
      const emp = w.np + w.hi + w.ltc + eiEmp + ia; const rows = [['국민연금', w.np, w.np, '4.75% + 4.75%'], ['건강보험', w.hi, w.hi, '3.595% + 3.595%'], ['장기요양보험', w.ltc, w.ltc, '건강보험료의 13.14% 절반씩'], ['고용보험', w.ei, eiEmp, `0.9% / 0.9% + ${HT.num(v.size)}%`], ['산재보험', 0, ia, `사업주 ${v.ia}%`]];
      out.set(HT.kpis([['근로자 부담', HT.won(w.total), HT.pct(v.pay ? w.total / v.pay * 100 : 0, 2)], ['사업주 부담', HT.won(emp), HT.pct(v.pay ? emp / v.pay * 100 : 0, 2)], ['총 보험료', HT.won(w.total + emp)]]),
        HT.table(['보험', '근로자', '사업주', '합계', '요율'], rows.map(r => [r[0], HT.won(r[1]), HT.won(r[2]), HT.won(r[1] + r[2]), r[3]]).concat([['합계', HT.won(w.total), HT.won(emp), HT.won(w.total + emp), '']]), { right: [1, 2, 3], scroll: false, hi: (r, i) => i === rows.length }),
        HT.barChart([{ label: '근로자', value: w.total, color: 'var(--c1)' }, { label: '사업주', value: emp, color: 'var(--g2)' }], { fmt: HT.won }));
    }
    calc(f.values());
  }
});
