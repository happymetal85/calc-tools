HT.register({
  id: 'stock-return', cat: '주식·세금', order: 2, name: '주식 투자 수익률 계산기', keywords: '주식 수익률 증권거래세 수수료 손익',
  desc: '매수·매도 단가와 수량, 수수료율, 거래세를 반영해 순수익과 수익률을 계산합니다.',
  note: '2026년 1월 1일 양도분부터 거래세율이 올랐습니다. 코스피는 증권거래세 0.05% + 농어촌특별세 0.15% = 0.20%, 코스닥은 증권거래세 0.20%(농특세 없음)로 두 시장 모두 매도금액의 0.20%입니다. 손실이 나도 수수료와 거래세는 그대로 나가므로 실제 손실이 더 커집니다. 종목 시세 자동 조회는 지원하지 않으며 단가를 직접 입력합니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'mkt', label: '시장', type: 'seg', options: [['kospi', 'KOSPI'], ['kosdaq', 'KOSDAQ'], ['custom', '직접 입력']], value: 'kospi' },
      { id: 'taxRate', label: '거래세율 (매도 시)', type: 'number', unit: '%', value: 0.20, step: 0.01, show: v => v.mkt === 'custom' },
      { id: 'buy', label: '매수 단가', type: 'money', unit: '원', value: 50000 },
      { id: 'sell', label: '매도 단가', type: 'money', unit: '원', value: 58000 },
      { id: 'qty', label: '수량', type: 'number', unit: '주', value: 100, min: 0 },
      { id: 'fee', label: '수수료율 (매수·매도 각각)', type: 'number', unit: '%', value: 0.015, step: 0.001 },
    ], calc);
    function calc(v) {
      const tr = v.mkt === 'custom' ? v.taxRate / 100 : 0.0020; const bt = v.buy * v.qty, st = v.sell * v.qty; const diff = st - bt;
      const fee = Math.floor(bt * v.fee / 100) + Math.floor(st * v.fee / 100); const tax = Math.floor(st * tr); const net = diff - fee - tax; const rate = bt ? net / bt * 100 : 0;
      out.set(HT.kpi(net >= 0 ? '순수익' : '순손실', HT.won(Math.abs(net)), `수익률 ${HT.pct(rate, 2)} (세금·수수료 반영)`),
        HT.rows([['매수 총액', HT.won(bt)], ['매도 총액', HT.won(st)], ['매매차익', HT.won(diff), diff < 0 ? 'neg' : ''], ['거래세 (매도금액 × ' + HT.pct(tr * 100, 2) + ')', '-' + HT.won(tax), 'sub', v.mkt === 'kospi' ? '증권거래세 0.05% + 농어촌특별세 0.15%' : v.mkt === 'kosdaq' ? '증권거래세 0.20%' : ''], ['수수료 합계', '-' + HT.won(fee), 'sub', `매수·매도 각 ${v.fee}%`], ['순수익', HT.won(net), net >= 0 ? 'pos strong' : 'neg strong'], ['수익률', HT.pct(rate, 2), 'strong', '순수익 ÷ 매수 총액'], ['손익분기 매도가', HT.won(v.buy * (1 + v.fee / 100) / (1 - v.fee / 100 - tr)), 'sub', '수수료·세금을 빼고 0이 되는 단가']]));
    }
    calc(f.values());
  }
});
