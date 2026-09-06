HT.register({
  id: 'comprehensive-income-tax', cat: '급여·소득', order: 5, name: '종합소득세 계산기', keywords: '종합소득세 사업소득 필요경비 단순경비율',
  desc: '수입금액과 필요경비, 소득공제·세액공제로 종합소득세 결정세액과 환급·추가 납부액을 계산합니다.',
  note: '단순경비율은 업종별로 다르므로(예: 인적용역 프리랜서 약 64%) 국세청 고시 경비율을 확인해 입력하세요. 자녀세액공제는 2025년 개정(1명 25만, 2명 55만, 3명부터 1명당 40만원 추가)을 적용했습니다. 매년 5월 1일부터 31일까지 신고·납부합니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'rev', label: '총 수입금액', type: 'money', unit: '원', value: 60000000 },
      { id: 'emode', label: '필요경비', type: 'seg', options: [['direct', '직접 입력'], ['simple', '단순경비율']], value: 'direct' },
      { id: 'exp', label: '필요경비', type: 'money', unit: '원', value: 20000000, show: v => v.emode === 'direct' },
      { id: 'erate', label: '단순경비율', type: 'number', unit: '%', value: 64.1, step: 0.1, show: v => v.emode === 'simple' },
      { id: 'fam', label: '부양가족 수 (본인 제외)', type: 'number', unit: '명', value: 0, min: 0 },
      { id: 'np', label: '국민연금 납부액 (연)', type: 'money', unit: '원', value: 2000000 },
      { id: 'hi', label: '건강보험 납부액 (연)', type: 'money', unit: '원', value: 1500000 },
      { id: 'etc', label: '기타 소득공제', type: 'money', unit: '원', value: 0 },
      { id: 'kids', label: '자녀세액공제 대상 (8세 이상)', type: 'number', unit: '명', value: 0, min: 0 },
      { id: 'paid', label: '기납부세액 (원천징수 등)', type: 'money', unit: '원', value: 1980000, help: '프리랜서 3.3% 중 소득세 3% 부분' },
    ], calc);
    function calc(v) {
      const exp = v.emode === 'direct' ? v.exp : v.rev * v.erate / 100; const income = Math.max(0, v.rev - exp);
      const personal = 1.5e6 * (1 + v.fam); const ded = personal + v.np + v.hi + v.etc; const base = Math.max(0, income - ded);
      const p = HT.progressive(base, HT.INCOME_TAX); const kids = HT.payroll.childCredit(v.kids); const std = kids ? 0 : 70000;
      const final = Math.max(0, p.tax - kids - std); const local = final * 0.1; const diff = v.paid - final;
      const split = HT.bracketSplit(base, HT.INCOME_TAX);
      out.set(HT.kpi(diff >= 0 ? '예상 환급액' : '예상 추가 납부액', HT.won(Math.abs(diff)), diff >= 0 ? '기납부세액이 결정세액보다 많습니다' : '지방소득세 별도'),
        HT.rows([['수입금액', HT.won(v.rev)], ['필요경비', '-' + HT.won(exp), 'sub', v.emode === 'simple' ? `단순경비율 ${v.erate}%` : ''], ['종합소득금액', HT.won(income)], ['소득공제 합계', '-' + HT.won(ded), 'sub', `인적공제 ${HT.won(personal)} + 연금·건강보험 + 기타`], ['과세표준', HT.won(base), 'strong'], ['적용 세율', HT.pct(p.rate * 100, 0) + (p.deduct ? ` (누진공제 ${HT.won(p.deduct)})` : '')], ['산출세액', HT.won(p.tax)], kids ? ['자녀세액공제', '-' + HT.won(kids), 'sub'] : ['표준세액공제', '-' + HT.won(std), 'sub'], ['결정세액', HT.won(final), 'strong'], ['지방소득세 (10%)', HT.won(local), 'sub'], ['총 납부세액', HT.won(final + local), 'strong'], ['기납부세액', HT.won(v.paid)], [diff >= 0 ? '환급' : '추가 납부', HT.won(Math.abs(diff)), diff >= 0 ? 'pos' : 'neg']]),
        split.length ? HT.barChart(split.map(s => ({ label: `${HT.pct(s.rate * 100, 0)} 구간`, value: s.tax, color: 'var(--c1)' })), { fmt: HT.won, cap: '세율 구간별 산출세액' }) : null);
    }
    calc(f.values());
  }
});
