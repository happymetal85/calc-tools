HT.register({
  id: 'compound-interest', cat: '금융·투자', order: 1, name: '복리 계산기', keywords: '복리 이자 적립 미래가치 72의 법칙',
  desc: '초기 투자금과 월 적립금에 복리 이자율을 적용해 기간 후 최종 금액과 총이자, 물가를 반영한 실질 가치를 계산합니다.',
  note: '복리는 이자에 다시 이자가 붙는 방식이라 기간이 길수록 차이가 커집니다. 72를 연이율로 나누면 원금이 두 배가 되는 대략의 햇수입니다(72의 법칙). 이자소득세 15.4%와 수수료는 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'pv', label: '초기 투자금', type: 'money', unit: '원', value: 10000000 },
      { id: 'pmt', label: '월 적립금', type: 'money', unit: '원', value: 500000 },
      { id: 'rate', label: '연 이자율', type: 'number', unit: '%', value: 5, step: 0.1 },
      { id: 'years', label: '투자 기간', type: 'number', unit: '년', value: 10, min: 1, max: 60 },
      { id: 'freq', label: '복리 주기', type: 'select', options: [['12', '월복리'], ['4', '분기복리'], ['2', '반기복리'], ['1', '연복리']], value: '12' },
      { id: 'infl', label: '물가상승률 반영', type: 'check', value: false },
      { id: 'inflRate', label: '연 물가상승률', type: 'number', unit: '%', value: 2.5, step: 0.1, show: v => v.infl },
    ], calc);
    function calc(v) {
      const n = HT.num(v.freq), r = v.rate / 100 / n; const perPeriod = v.pmt * 12 / n; const labels = [], prin = [], intr = [];
      let fvFinal = 0;
      for (let y = 1; y <= v.years; y++) { const k = n * y; const fv1 = v.pv * Math.pow(1 + r, k); const fv2 = r ? perPeriod * (Math.pow(1 + r, k) - 1) / r : perPeriod * k; const total = fv1 + fv2; const p = v.pv + v.pmt * 12 * y; labels.push(y + '년'); prin.push(p); intr.push(total - p); if (y === v.years) fvFinal = total; }
      const principal = v.pv + v.pmt * 12 * v.years; const interest = fvFinal - principal; const real = v.infl ? fvFinal / Math.pow(1 + v.inflRate / 100, v.years) : null;
      out.set(HT.kpi('최종 금액', HT.won(fvFinal), `${v.years}년 후 · 총 수익률 ${HT.pct(principal ? interest / principal * 100 : 0, 1)}`),
        HT.rows([['총 투자원금', HT.won(principal), '', `초기 ${HT.won(v.pv)} + 월 ${HT.won(v.pmt)} × ${v.years * 12}개월`], ['총 이자수익', HT.won(interest), 'pos'], ['최종 금액', HT.won(fvFinal), 'strong'], real != null ? ['물가 반영 실질 금액', HT.won(real), '', `연 ${v.inflRate}% 기준 · 실질 수익률 연 ${HT.pct(((1 + v.rate / 100) / (1 + v.inflRate / 100) - 1) * 100, 2)}`] : null, ['원금 2배 소요 기간 (72의 법칙)', v.rate > 0 ? HT.fmt(72 / v.rate, 1) + '년' : '-', 'sub']]),
        HT.stackChart(labels, [{ name: '원금', color: 'var(--g3)', values: prin }, { name: '이자', color: 'var(--c1)', values: intr }], { fmt: HT.wonKor, cap: '연도별 자산 성장' }),
        HT.table(['연차', '누적 원금', '누적 이자', '평가액'], labels.map((l, i) => [l, HT.won(prin[i]), HT.won(intr[i]), HT.won(prin[i] + intr[i])]), { right: [1, 2, 3] }));
    }
    calc(f.values());
  }
});
