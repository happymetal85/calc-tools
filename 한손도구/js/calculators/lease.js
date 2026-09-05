HT.register({
  id: 'lease', cat: '금융·투자', order: 3, name: '리스 계산기', keywords: '리스 금리 역산 자동차 잔존가치',
  desc: '취득원가·잔존가치·리스 기간·월 납입금·선수금으로 리스 견적에 실제로 적용된 연이율을 거꾸로 계산합니다.',
  note: '월 납입금에는 보험료·세금·정비비를 뺀 순수 금융 리스료만 넣으세요. 2026년 기준 신차 캐피탈 리스 금리는 3~5%, 일반 리스사 5~8%, 중고차 7~12% 수준입니다. 선수금은 만기 때 돌려받지 못하는 금액입니다. 사업자는 리스료 전액을 비용으로 처리할 수 있습니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'cost', label: '취득원가 (부가세 포함)', type: 'money', unit: '원', value: 50000000 },
      { id: 'resid', label: '잔존가치 (만기 시)', type: 'money', unit: '원', value: 25000000 },
      { id: 'months', label: '리스 기간', type: 'number', unit: '개월', value: 36, min: 1 },
      { id: 'pmt', label: '월 납입금', type: 'money', unit: '원', value: 750000 },
      { id: 'down', label: '선수금 (선택)', type: 'money', unit: '원', value: 0 },
    ], calc);
    function solve(P, R, n, m) { // P: 순금융원금, R: 잔가, n: 기간, m: 월납 → 월이율 r
      const fn = r => { if (r === 0) return m * n + R - P; const a = (1 - Math.pow(1 + r, -n)) / r; return m * a + R * Math.pow(1 + r, -n) - P; };
      let lo = 0, hi = 0.1; if (fn(lo) < 0) return null; // 납입 총액이 원금보다 작으면 금리가 음수
      for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (fn(mid) > 0) lo = mid; else hi = mid; } return (lo + hi) / 2;
    }
    function calc(v) {
      const P = v.cost - v.down; const n = Math.round(v.months); const r = solve(P, v.resid, n, v.pmt);
      const totalPaid = v.pmt * n + v.down; const interest = totalPaid + v.resid - v.cost; const approx = (P + v.resid) * (n / 12) ? interest * 2 / ((P + v.resid) * (n / 12)) * 100 : 0;
      if (r == null) { out.set(HT.el('div', { class: 'empty' }, '납입 총액이 원금보다 작아 금리를 계산할 수 없습니다. 입력값을 확인하세요.')); return; }
      out.set(HT.kpi('적용 연이율 (역산)', HT.pct(r * 12 * 100, 2), `월이율 ${HT.pct(r * 100, 3)}`),
        HT.rows([['금융 원금 (취득원가 − 선수금)', HT.won(P)], ['총 납입액 (월납 × 기간 + 선수금)', HT.won(totalPaid)], ['총 이자 (납입 + 잔가 − 취득원가)', HT.won(interest), interest < 0 ? 'neg' : ''], ['단순 근사 연이율', HT.pct(approx, 2), 'sub', '총이자 × 2 ÷ ((원금 + 잔가) × 기간(년))'], ['적정 금리 참고', r * 12 < .05 ? HT.badge('신차 캐피탈 수준 (3~5%)', 'ok') : r * 12 < .08 ? HT.badge('일반 리스사 수준 (5~8%)', 'gray') : HT.badge('높은 편 (8% 이상)', 'warn')]]));
    }
    calc(f.values());
  }
});
