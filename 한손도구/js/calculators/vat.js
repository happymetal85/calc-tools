HT.register({
  id: 'vat', cat: '금융·투자', order: 2, name: '부가세 계산기', keywords: '부가세 부가가치세 공급가액 합계금액',
  desc: '공급가액에 부가세 10%를 더하거나, 부가세가 포함된 합계금액에서 공급가액과 부가세를 거꾸로 계산합니다.',
  note: '농산물, 교육·의료 서비스, 도서 등 면세 품목에는 부가세가 붙지 않습니다. 간이과세자는 업종별 부가가치율(15~40%)을 적용해 세액이 다릅니다. 역산할 때 부가세는 합계금액 ÷ 11이며 원 미만은 버립니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'mode', label: '계산 방식', type: 'seg', options: [['fwd', '공급가액 → 합계'], ['rev', '합계 → 공급가액']], value: 'fwd' },
      { id: 'supply', label: '공급가액 (세전)', type: 'money', unit: '원', value: 1000000, show: v => v.mode === 'fwd' },
      { id: 'total', label: '합계금액 (부가세 포함)', type: 'money', unit: '원', value: 1100000, show: v => v.mode === 'rev' },
    ], calc);
    function calc(v) {
      let supply, vat, total;
      if (v.mode === 'fwd') { supply = v.supply; vat = Math.floor(supply * .1); total = supply + vat; } else { total = v.total; vat = Math.floor(total / 11); supply = total - vat; }
      out.set(HT.kpi(v.mode === 'fwd' ? '합계금액' : '공급가액', HT.won(v.mode === 'fwd' ? total : supply), `부가세 ${HT.won(vat)}`),
        HT.rows([['공급가액', HT.won(supply)], ['부가세 (10%)', HT.won(vat), 'sub'], ['합계금액', HT.won(total), 'strong']]));
    }
    calc(f.values());
  }
});
