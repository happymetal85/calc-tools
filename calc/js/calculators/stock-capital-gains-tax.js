HT.register({
  id: 'stock-capital-gains-tax', cat: '주식·세금', order: 1, name: '주식 양도소득세 계산기', keywords: '주식 양도세 해외주식 대주주',
  desc: '국내주식(대주주)과 해외주식의 양도차익에 기본공제 250만원과 세율을 적용해 양도소득세를 계산합니다.',
  note: '상장주식 소액주주는 양도소득세가 없지만, 해외주식은 모든 투자자가 과세 대상입니다. 해외주식은 매수·매도 시점의 환율로 원화 환산한 금액이 기준이며 환차익도 포함됩니다. 같은 해의 손익은 통산하고, 다음 해 5월에 신고합니다. 필요경비에는 거래수수료·거래세가 들어갑니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'type', label: '투자 유형', type: 'seg', options: [['dom', '국내주식 (대주주)'], ['for', '해외주식']], value: 'for' },
      { id: 'buy', label: '매수금액 (원화 환산)', type: 'money', unit: '원', value: 20000000 },
      { id: 'sell', label: '매도금액 (원화 환산)', type: 'money', unit: '원', value: 30000000 },
      { id: 'cost', label: '필요경비 (수수료 등)', type: 'money', unit: '원', value: 50000 },
      { id: 'sme', label: '중소기업 주식', type: 'check', value: false, show: v => v.type === 'dom' },
      { id: 'short', label: '1년 미만 보유 (대기업)', type: 'check', value: false, show: v => v.type === 'dom' && !v.sme },
    ], calc);
    function calc(v) {
      const gain = v.sell - v.buy - v.cost; const base = Math.max(0, gain - 2.5e6); let tax, rateTxt;
      if (v.type === 'for') { tax = base * .2; rateTxt = '20%'; }
      else if (v.sme) { tax = base * .2; rateTxt = '20% (중소기업)'; }
      else if (v.short) { tax = base * .3; rateTxt = '30% (대기업 1년 미만)'; }
      else { tax = base <= 3e8 ? base * .2 : 3e8 * .2 + (base - 3e8) * .25; rateTxt = base <= 3e8 ? '20% (3억원 이하)' : '20% + 3억원 초과분 25%'; }
      const local = tax * .1;
      out.set(HT.kpi('총 납부세액', HT.won(tax + local), gain <= 0 ? '양도차손 — 납부세액 없음' : `양도소득세 + 지방소득세`),
        HT.rows([['양도차익', HT.won(gain), gain < 0 ? 'neg' : '', '매도금액 − 매수금액 − 필요경비'], ['기본공제', '-2,500,000원', 'sub', '연 1회'], ['과세표준', HT.won(base), 'strong'], ['적용 세율', rateTxt], ['양도소득세', HT.won(tax)], ['지방소득세 (10%)', HT.won(local), 'sub'], ['총 납부세액', HT.won(tax + local), 'strong'], ['세후 순이익', HT.won(gain - tax - local), gain - tax - local >= 0 ? 'pos' : 'neg']]));
    }
    calc(f.values());
  }
});
