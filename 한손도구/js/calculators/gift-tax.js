HT.register({
  id: 'gift-tax', cat: '주식·세금', order: 4, name: '증여세 계산기', keywords: '증여세 증여재산공제 배우자 자녀',
  desc: '증여자와의 관계별 공제와 10년 이내 기증여 재산을 반영해 증여세를 계산합니다.',
  note: '공제는 10년 동안 합산해 적용합니다(배우자 6억, 직계존속→성년 자녀 5천만, 미성년 2천만, 직계비속 5천만, 기타 친족 1천만원). 혼인·출산 공제(1억원)는 반영하지 않았습니다. 증여받은 날이 속한 달의 말일부터 3개월 안에 신고하면 산출세액의 3%를 공제합니다.',
  render(root) {
    const out = HT.output(root);
    const REL = { spouse: 6e8, adult: 5e7, minor: 2e7, desc: 5e7, other: 1e7 };
    const f = HT.form(root, [
      { id: 'rel', label: '증여자와의 관계 (수증자 기준)', type: 'select', options: [['spouse', '배우자'], ['adult', '직계존속 → 성년 자녀'], ['minor', '직계존속 → 미성년 자녀'], ['desc', '직계비속 (자녀 → 부모)'], ['other', '기타 친족']], value: 'adult' },
      { id: 'amt', label: '증여재산가액', type: 'money', unit: '원', value: 300000000 },
      { id: 'prev', label: '10년 이내 기증여재산', type: 'money', unit: '원', value: 0 },
      { id: 'prevTax', label: '기증여 시 납부한 증여세', type: 'money', unit: '원', value: 0, show: v => v.prev > 0 },
      { id: 'report', label: '기한 내 신고 (3% 세액공제)', type: 'check', value: true },
    ], calc);
    function calc(v) {
      const ded = REL[v.rel]; const total = v.amt + v.prev; const base = Math.max(0, total - ded); const p = HT.progressive(base, HT.GIFT_TAX);
      const credit = v.report ? p.tax * .03 : 0; const final = Math.max(0, p.tax - v.prevTax - credit); const split = HT.bracketSplit(base, HT.GIFT_TAX);
      out.set(HT.kpi('납부할 증여세', HT.won(final), `실효세율 ${HT.pct(v.amt ? final / v.amt * 100 : 0, 2)}`),
        HT.rows([['증여재산가액', HT.won(v.amt)], v.prev ? ['기증여재산 합산', '+' + HT.won(v.prev), 'sub'] : null, ['증여재산공제', '-' + HT.won(ded), 'sub'], ['과세표준', HT.won(base), 'strong'], ['적용 세율', HT.pct(p.rate * 100, 0) + (p.deduct ? ` (누진공제 ${HT.won(p.deduct)})` : '')], ['산출세액', HT.won(p.tax)], v.prevTax ? ['기납부 증여세', '-' + HT.won(v.prevTax), 'sub'] : null, ['신고세액공제 (3%)', '-' + HT.won(credit), 'sub'], ['납부세액', HT.won(final), 'strong']]),
        split.length ? HT.barChart(split.map(s => ({ label: `${HT.pct(s.rate * 100, 0)} 구간`, value: s.tax, color: 'var(--c1)' })), { fmt: HT.won, cap: '구간별 산출세액' }) : null);
    }
    calc(f.values());
  }
});
