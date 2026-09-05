HT.register({
  id: 'investment-simulator', cat: '금융·투자', order: 8, name: '적립식 투자 시뮬레이터', keywords: '적립식 투자 월 투자 수익률 시뮬레이션',
  desc: '매달 일정 금액을 투자할 때 예상 연수익률에 따라 기간 후 자산이 얼마가 되는지 월복리로 계산합니다.',
  note: '매월 말 투자하고 수익은 자동 재투자(복리)한다고 가정합니다. 월수익률은 연수익률을 12로 나눈 값입니다. 코스피 장기 평균 수익률은 연 8~10% 수준이지만 해마다 크게 달라지며, 세금·수수료·물가상승은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'pmt', label: '월 투자금', type: 'money', unit: '원', value: 500000 },
      { id: 'years', label: '투자 기간', type: 'number', unit: '년', value: 20, min: 1, max: 60 },
      { id: 'rate', label: '예상 연수익률', type: 'number', unit: '%', value: 8, step: 0.1 },
    ], calc);
    function calc(v) {
      const r = v.rate / 100 / 12; const labels = [], prin = [], gain = []; let fv = 0;
      for (let y = 1; y <= v.years; y++) { const n = y * 12; fv = r ? v.pmt * (Math.pow(1 + r, n) - 1) / r : v.pmt * n; labels.push(y + '년'); prin.push(v.pmt * n); gain.push(fv - v.pmt * n); }
      const invested = v.pmt * 12 * v.years; const profit = fv - invested;
      const alt = [0, 3, 5, 8, 10].map(p => { const rr = p / 100 / 12, n = v.years * 12; return [p + '%', HT.won(rr ? v.pmt * (Math.pow(1 + rr, n) - 1) / rr : v.pmt * n)]; });
      out.set(HT.kpi('예상 자산', HT.won(fv), `${v.years}년 후 · 수익률 ${HT.pct(invested ? profit / invested * 100 : 0, 1)}`),
        HT.rows([['총 투자금', HT.won(invested), '', `월 ${HT.won(v.pmt)} × ${v.years * 12}개월`], ['수익금', HT.won(profit), 'pos'], ['예상 자산', HT.won(fv), 'strong']]),
        HT.stackChart(labels, [{ name: '투자원금', color: 'var(--g3)', values: prin }, { name: '수익', color: 'var(--c1)', values: gain }], { fmt: HT.wonKor, cap: '연도별 자산 성장' }),
        HT.table(['연수익률', `${v.years}년 후 자산`], alt, { right: [1], scroll: false, hi: r => HT.num(r[0]) === v.rate }));
    }
    calc(f.values());
  }
});
