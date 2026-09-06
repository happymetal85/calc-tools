HT.register({
  id: 'brokerage-fee', cat: '부동산', order: 4, name: '부동산 중개수수료 계산기', keywords: '복비 중개보수 중개수수료',
  desc: '주택·오피스텔·비주택의 매매·전세·월세 거래에 대한 법정 상한 중개보수를 계산합니다.',
  note: '표시된 요율은 법정 상한이며, 실제 보수는 한도 안에서 협의합니다. 부가세는 일반과세 중개업소 기준 10%이고, 간이과세자는 다를 수 있습니다. 매도·매수(임대·임차) 양쪽이 각각 부담합니다.',
  render(root) {
    const out = HT.output(root);
    const SALE = [[5e7, .006, 25e4], [2e8, .005, 80e4], [9e8, .004, 0], [12e8, .005, 0], [15e8, .006, 0], [Infinity, .007, 0]];
    const RENT = [[5e7, .005, 20e4], [1e8, .004, 30e4], [6e8, .003, 0], [12e8, .004, 0], [15e8, .005, 0], [Infinity, .006, 0]];
    const f = HT.form(root, [
      { id: 'kind', label: '물건 종류', type: 'seg', options: [['house', '주택'], ['officetel', '오피스텔'], ['other', '비주택']], value: 'house' },
      { id: 'deal', label: '거래 유형', type: 'seg', options: [['sale', '매매·교환'], ['jeonse', '전세'], ['monthly', '월세']], value: 'sale' },
      { id: 'amt', label: '거래금액', type: 'money', unit: '원', value: 800000000, show: v => v.deal !== 'monthly' },
      { id: 'dep', label: '보증금', type: 'money', unit: '원', value: 50000000, show: v => v.deal === 'monthly' },
      { id: 'rent', label: '월세', type: 'money', unit: '원', value: 800000, show: v => v.deal === 'monthly' },
      { id: 'vat', label: '부가세 10% 포함', type: 'check', value: true },
    ], calc);
    function calc(v) {
      let base = v.amt, hint = '';
      if (v.deal === 'monthly') { base = v.dep + v.rent * 100; if (base < 5e7) { base = v.dep + v.rent * 70; hint = '환산액 = 보증금 + 월세 × 70 (환산액 5천만원 미만)'; } else hint = '환산액 = 보증금 + 월세 × 100'; }
      let rate, cap = 0, label;
      if (v.kind === 'house') { const t = v.deal === 'sale' ? SALE : RENT; const b = t.find(x => base <= x[0]); rate = b[1]; cap = b[2]; label = '주택 ' + (v.deal === 'sale' ? '매매·교환' : '임대차'); }
      else if (v.kind === 'officetel') { rate = v.deal === 'sale' ? .005 : .004; label = '주거용 오피스텔 (85㎡ 이하, 부엌·화장실 구비)'; }
      else { rate = .009; label = '비주택 (상가·토지 등) — 0.9% 이내 협의'; }
      let fee = base * rate; if (cap && fee > cap) fee = cap;
      const vat = v.vat ? fee * 0.1 : 0;
      out.set(HT.kpi('중개보수 (상한)', HT.won(fee + vat), v.vat ? '부가세 포함' : '부가세 별도'),
        HT.rows([v.deal === 'monthly' ? ['월세 환산 거래금액', HT.won(base), '', hint] : ['거래금액', HT.won(base)], ['적용 요율', HT.pct(rate * 100, 2) + (cap ? ` (한도 ${HT.won(cap)})` : ''), '', label], ['중개보수', HT.won(fee)], v.vat ? ['부가세 (10%)', HT.won(vat), 'sub'] : null, ['합계', HT.won(fee + vat), 'strong']]));
    }
    calc(f.values());
  }
});
