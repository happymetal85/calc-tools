HT.register({
  id: 'comprehensive-real-estate-tax', cat: '부동산', order: 7, name: '종합부동산세 계산기', keywords: '종부세 종합부동산세 공시가격',
  desc: '주택 공시가격 합산액과 보유 유형으로 종합부동산세와 농어촌특별세를 계산합니다. (공정시장가액비율 60%)',
  note: '기본공제는 1세대 1주택 12억원, 그 외 9억원(인별)입니다. 1세대 1주택자는 고령자·장기보유 세액공제를 합쳐 최대 80%까지 받습니다. 재산세와 이중과세되는 부분의 공제, 세부담 상한은 반영하지 않았습니다. 매년 12월 1일부터 15일까지 납부합니다. 2026년 세제개편안(실거주 1주택 공제 14억원, 공정시장가액비율 70%, 세율 조정)은 국회 통과 시 2027년분부터 적용될 예정이라 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const R2 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .013, 60e5], [94e8, .02, 235e5], [Infinity, .027, 893e5]];
    const R3 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .02, 144e5], [50e8, .03, 394e5], [94e8, .04, 894e5], [Infinity, .05, 1834e5]];
    const f = HT.form(root, [
      { id: 'type', label: '주택 보유 유형', type: 'seg', options: [['one', '1세대 1주택'], ['two', '2주택 이하'], ['three', '3주택 이상']], value: 'one' },
      { id: 'price', label: '공시가격 합산액', type: 'money', unit: '원', value: 2000000000 },
      { id: 'age', label: '소유자 나이', type: 'select', options: [['0', '60세 미만'], ['20', '60세 이상 65세 미만'], ['30', '65세 이상 70세 미만'], ['40', '70세 이상']], value: '0', show: v => v.type === 'one' },
      { id: 'hold', label: '보유 기간', type: 'select', options: [['0', '5년 미만'], ['20', '5년 이상 10년 미만'], ['40', '10년 이상 15년 미만'], ['50', '15년 이상']], value: '0', show: v => v.type === 'one' },
    ], calc);
    function calc(v) {
      const ded = v.type === 'one' ? 12e8 : 9e8; const base = Math.max(0, v.price - ded) * 0.6;
      const table = v.type === 'three' ? R3 : R2; const p = HT.progressive(base, table);
      const credit = v.type === 'one' ? Math.min(0.8, (HT.num(v.age) + HT.num(v.hold)) / 100) : 0;
      const creditAmt = p.tax * credit; const tax = p.tax - creditAmt; const rural = tax * 0.2;
      const split = HT.bracketSplit(base, table);
      out.set(HT.kpi('총 납부세액', HT.won(tax + rural), '종합부동산세 + 농어촌특별세'),
        HT.rows([['공시가격 합산액', HT.won(v.price)], ['기본공제', '-' + HT.won(ded), 'sub'], ['과세표준', HT.won(base), 'strong', '(합산액 − 공제) × 공정시장가액비율 60%'], ['적용 세율', HT.pct(p.rate * 100, 1) + (p.deduct ? ` (누진공제 ${HT.won(p.deduct)})` : '')], ['산출세액', HT.won(p.tax)], v.type === 'one' ? ['세액공제 (고령자+장기보유)', '-' + HT.won(creditAmt), 'sub', `공제율 ${HT.pct(credit * 100, 0)} (한도 80%)`] : null, ['종합부동산세', HT.won(tax), 'strong'], ['농어촌특별세 (20%)', HT.won(rural), 'sub']]),
        split.length ? HT.barChart(split.map(s => ({ label: `${HT.wonKor(s.from)}~${isFinite(s.to) ? HT.wonKor(s.to) : ''} ${HT.pct(s.rate * 100, 1)}`, value: s.tax, color: 'var(--c1)' })), { padL: 200, fmt: HT.won, cap: '세율 구간별 세액' }) : null);
    }
    calc(f.values());
  }
});
