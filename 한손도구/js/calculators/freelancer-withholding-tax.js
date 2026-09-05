HT.register({
  id: 'freelancer-withholding-tax', cat: '급여·소득', order: 7, name: '프리랜서 3.3% 원천징수 계산기', keywords: '프리랜서 3.3% 원천징수 사업소득',
  desc: '계약금액에서 원천징수되는 소득세 3%와 지방소득세 0.3%를 빼거나, 원하는 실수령액에서 세전 계약금액을 거꾸로 계산합니다.',
  note: '3.3%는 소득세법 제129조에 따라 지급자가 미리 떼어 내는 선납 세금이며, 확정 세금이 아닙니다. 다음 해 5월 종합소득세 신고에서 정산해 환급받거나 더 냅니다. 소득세·지방소득세는 각각 원 미만을 버립니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'mode', label: '계산 방향', type: 'seg', options: [['fwd', '계약금액 → 실수령액'], ['rev', '실수령액 → 계약금액']], value: 'fwd' },
      { id: 'gross', label: '계약금액 (세전)', type: 'money', unit: '원', value: 3000000, show: v => v.mode === 'fwd' },
      { id: 'net', label: '실수령액 (세후)', type: 'money', unit: '원', value: 2901000, show: v => v.mode === 'rev' },
    ], calc);
    function calc(v) {
      let gross = v.mode === 'fwd' ? v.gross : Math.ceil(v.net / 0.967);
      const tax = Math.floor(gross * 0.03), local = Math.floor(tax * 0.1); const net = gross - tax - local;
      out.set(HT.kpi(v.mode === 'fwd' ? '실수령액' : '필요한 계약금액 (세전)', HT.won(v.mode === 'fwd' ? net : gross), v.mode === 'fwd' ? `원천징수 ${HT.won(tax + local)}` : `실수령 ${HT.won(net)}`),
        HT.rows([['계약금액 (세전)', HT.won(gross)], ['소득세 (3%)', '-' + HT.won(tax), 'sub'], ['지방소득세 (0.3%)', '-' + HT.won(local), 'sub'], ['원천징수 합계 (3.3%)', '-' + HT.won(tax + local)], ['실수령액', HT.won(net), 'strong']]));
    }
    calc(f.values());
  }
});
