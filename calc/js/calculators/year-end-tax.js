HT.register({
  id: 'year-end-tax', cat: '급여·소득', order: 4, name: '연말정산 계산기', keywords: '연말정산 환급 신용카드 공제 의료비',
  desc: '총급여와 카드 사용액·의료비·교육비·기부금으로 결정세액을 구하고 환급(또는 추가 납부) 예상액을 계산합니다.',
  note: '카드 공제는 총급여의 25%를 넘는 사용액부터 신용카드 15%, 체크카드·현금영수증 30%를 적용하고, 한도는 총급여 7천만원 이하 300만원, 초과 250만원입니다. 의료비는 총급여 3% 초과분의 15%, 교육비 15%, 기부금 15%(1천만원 초과분 30%) 세액공제를 적용했습니다. 자녀세액공제는 현행(첫째 25만, 둘째 30만, 셋째부터 40만원)을 적용했고, 국민연금 4.75%·건강보험 3.595%·장기요양 13.14%·고용보험 0.9%로 보험료 공제를 추정했습니다. 주택자금·연금저축·보험료·월세 등 다른 공제는 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root); const P = HT.payroll;
    const f = HT.form(root, [
      { id: 'gross', label: '총급여 (연간, 비과세 제외)', type: 'money', unit: '원', value: 50000000 },
      { id: 'fam', label: '부양가족 수 (본인 제외)', type: 'number', unit: '명', value: 1, min: 0 },
      { id: 'kids', label: '8세 이상 20세 이하 자녀 수', type: 'number', unit: '명', value: 0, min: 0 },
      { id: 'credit', label: '신용카드 사용액', type: 'money', unit: '원', value: 15000000 },
      { id: 'check', label: '체크카드·현금영수증', type: 'money', unit: '원', value: 5000000 },
      { id: 'med', label: '의료비', type: 'money', unit: '원', value: 2000000 },
      { id: 'edu', label: '교육비', type: 'money', unit: '원', value: 0 },
      { id: 'don', label: '기부금', type: 'money', unit: '원', value: 500000 },
      { id: 'paid', label: '기납부세액 (원천징수된 소득세)', type: 'money', unit: '원', value: 0, help: '비우면 매월 원천징수 추정액으로 계산' },
    ], calc);
    function calc(v) {
      const g = v.gross; const ins = P.monthly(g / 12);
      const eid = P.earnedIncomeDeduction(g); const income = g - eid;
      const personal = 1.5e6 * (1 + v.fam); const pension = ins.np * 12; const health = (ins.hi + ins.ltc + ins.ei) * 12;
      const th = g * .25; let card = 0; if (v.credit >= th) card = (v.credit - th) * .15 + v.check * .3; else card = Math.max(0, v.check - (th - v.credit)) * .3; card = Math.min(card, g <= 7e7 ? 3e6 : 2.5e6);
      const base = Math.max(0, income - personal - pension - health - card); const calcTax = HT.progressive(base, HT.INCOME_TAX).tax;
      const cEarned = P.earnedIncomeCredit(calcTax, g), cKids = P.childCredit(v.kids);
      const cMed = Math.max(0, v.med - g * .03) * .15, cEdu = v.edu * .15, cDon = v.don <= 1e7 ? v.don * .15 : 1.5e6 + (v.don - 1e7) * .3;
      const special = cMed + cEdu + cDon; const cStd = special === 0 ? 130000 : 0;
      const final = Math.max(0, calcTax - cEarned - cKids - Math.min(special, calcTax) - cStd);
      // 기납부 추정: 간이세액 ≈ 부양가족·자녀만 반영한 결정세액
      let paid = v.paid; if (!paid) { const b0 = Math.max(0, income - personal - pension); const t0 = HT.progressive(b0, HT.INCOME_TAX).tax; paid = Math.max(0, t0 - P.earnedIncomeCredit(t0, g) - cKids); }
      const diff = paid - final;
      out.set(HT.kpi(diff >= 0 ? '예상 환급액' : '예상 추가 납부액', HT.won(Math.abs(diff) * 1.1), `소득세 ${HT.won(Math.abs(diff))} + 지방소득세 10%`),
        HT.rows([['총급여', HT.won(g)], ['근로소득공제', '-' + HT.won(eid), 'sub'], ['근로소득금액', HT.won(income)], ['인적공제', '-' + HT.won(personal), 'sub', `본인 + 부양가족 ${v.fam}명 × 150만원`], ['연금보험료공제 (국민연금)', '-' + HT.won(pension), 'sub'], ['건강·고용보험료공제', '-' + HT.won(health), 'sub'], ['신용카드 등 소득공제', '-' + HT.won(card), 'sub', `총급여 25% (${HT.won(th)}) 초과분`], ['과세표준', HT.won(base), 'strong'], ['산출세액', HT.won(calcTax)], ['근로소득세액공제', '-' + HT.won(cEarned), 'sub'], v.kids ? ['자녀세액공제', '-' + HT.won(cKids), 'sub'] : null, ['의료비 세액공제', '-' + HT.won(cMed), 'sub'], ['교육비 세액공제', '-' + HT.won(cEdu), 'sub'], ['기부금 세액공제', '-' + HT.won(cDon), 'sub'], cStd ? ['표준세액공제', '-' + HT.won(cStd), 'sub'] : null, ['결정세액', HT.won(final), 'strong'], ['기납부세액', HT.won(paid), '', v.paid ? '' : '추정치'], [diff >= 0 ? '환급 (소득세)' : '추가 납부 (소득세)', HT.won(Math.abs(diff)), diff >= 0 ? 'pos' : 'neg']]));
    }
    calc(f.values());
  }
});
