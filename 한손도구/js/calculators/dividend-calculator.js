HT.register({
  id: 'dividend-calculator', cat: '주식·세금', order: 3, name: '배당금 수익률 계산기', keywords: '배당 배당수익률 배당소득세 15.4%',
  desc: '현재 주가·보유 주수·주당 배당금으로 연간 배당금과 배당소득세(15.4%)를 뺀 세후 수령액, 배당수익률을 계산합니다.',
  note: '배당소득세는 소득세 14%와 지방소득세 1.4%를 합친 15.4%를 원천징수합니다. 이자·배당을 합한 금융소득이 연 2,000만원을 넘으면 초과분이 종합과세(6~45%) 대상입니다. 2026년부터 2028년까지는 고배당기업(배당성향 40% 이상 등) 배당에 한해 분리과세(2,000만원 이하 14%, 3억원 이하 20%, 초과 25%)를 선택할 수 있습니다. 배당락일 전에 매수해야 배당을 받고, 배당수익률이 지나치게 높은 종목은 주가 하락에 따른 착시(배당 함정)일 수 있습니다. 종목 자동 조회는 지원하지 않습니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'price', label: '현재 주가', type: 'money', unit: '원', value: 60000 },
      { id: 'qty', label: '보유 주수', type: 'number', unit: '주', value: 100, min: 0 },
      { id: 'dps', label: '주당 배당금 (연)', type: 'money', unit: '원', value: 2400 },
      { id: 'years', label: '재투자 시뮬레이션 기간', type: 'number', unit: '년', value: 10, min: 1, max: 40 },
    ], calc);
    function calc(v) {
      const invest = v.price * v.qty, gross = v.dps * v.qty, tax = Math.floor(gross * .154), net = gross - tax;
      const yPre = v.price ? v.dps / v.price * 100 : 0, yPost = yPre * .846;
      const over = gross > 2e7;
      // 배당 재투자(세후) 시뮬레이션 — 주가·배당 고정 가정
      const labels = [], principal = [], gain = []; let shares = v.qty; for (let y = 1; y <= v.years; y++) { shares += shares * v.dps * .846 / (v.price || 1); labels.push(y + '년'); principal.push(invest); gain.push(shares * v.price - invest); }
      out.set(HT.kpi('세후 연간 배당금', HT.won(net), `세전 ${HT.won(gross)} · 배당소득세 ${HT.won(tax)}`),
        HT.rows([['투자금액', HT.won(invest)], ['연간 배당금 (세전)', HT.won(gross)], ['배당소득세 (15.4%)', '-' + HT.won(tax), 'sub'], ['세후 수령액', HT.won(net), 'strong'], ['배당수익률 (세전)', HT.pct(yPre, 2)], ['배당수익률 (세후)', HT.pct(yPost, 2), 'strong'], ['월 환산 배당 (세후)', HT.won(net / 12), 'sub'], ['금융소득종합과세', HT.badge(over ? '2,000만원 초과 — 종합과세 대상' : '2,000만원 이하', over ? 'warn' : 'gray')]]),
        HT.stackChart(labels, [{ name: '투자원금', color: 'var(--g3)', values: principal }, { name: '배당 재투자 평가이익', color: 'var(--c1)', values: gain }], { fmt: HT.wonKor, cap: '세후 배당을 전액 재투자할 때 (주가·배당 고정 가정)' }));
    }
    calc(f.values());
  }
});
