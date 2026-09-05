/* 결혼·신혼 자금 플래너 — 두 사람 자산 + 양가 지원(혼인 증여공제 1억 + 기본 5천만) − 증여세 − 결혼 비용 → 신혼집(전세/매수) 자기자본
   → 필요 대출(신혼부부 버팀목: 부부합산 7,500만 이하, 보증금의 80%·수도권 3억 한도) → 월 주거비 → 3년 뒤 순자산 */
HT.register({
  id: 'wedding-planner', cat: '내 재무', order: 1, original: false, name: '결혼·신혼 자금 플래너', keywords: '결혼 자금 신혼집 전세 혼인 증여공제 신혼부부 버팀목 대출 신혼 3년',
  desc: '두 사람의 연봉·자산과 양가 지원, 결혼 비용, 신혼집(전세 또는 매수) 조건을 넣으면 증여세, 신혼집에 쓸 수 있는 자기자본, 필요한 대출과 월 주거비, 결혼 후 3년 동안의 저축과 순자산 흐름을 계산합니다.',
  note: '양가 지원은 각각 부모→자녀 기본공제 5천만원에 혼인 증여공제 1억원(혼인신고 전후 2년, 평생 1회)을 더해 1억 5천만원까지 세금이 없고, 초과분에 증여세가 붙습니다. 신혼부부 버팀목 전세대출은 부부합산 연소득 7,500만원 이하(2026년 기준), 보증금의 80% 이내, 수도권 3억원(그 외 2억원) 한도이며 금리는 소득·보증금에 따라 연 1.5~2.7%입니다. 신생아 특례(2년 내 출산)는 소득 요건이 더 넓고 금리가 더 낮습니다. 매수 시 대출 규제(LTV·DSR·집값별 한도)는 내 집 마련 시뮬레이터에서 확인하세요. 세부 조건은 주택도시기금(nhuf.molit.go.kr)에서 확정하세요.',
  render(root) {
    const out = HT.output(root, '결혼 자금 흐름');
    const f = HT.form(root, [
      { id: 'salary', p: 'salary', label: '본인 연봉 (세전)', type: 'money', unit: '원', value: 48000000 },
      { id: 'spouse', p: HT.profile.get().spouseSalary > 0 ? 'spouseSalary' : undefined, label: '배우자 연봉 (세전)', type: 'money', unit: '원', value: 42000000 },
      { id: 'assets', p: 'assets', label: '본인 자산 (현금·예적금·투자)', type: 'money', unit: '원', value: 60000000 },
      { id: 'assets2', label: '배우자 자산', type: 'money', unit: '원', value: 50000000 },
      { id: 'gift1', label: '본인 부모 지원', type: 'money', unit: '원', value: 100000000 },
      { id: 'gift2', label: '배우자 부모 지원', type: 'money', unit: '원', value: 50000000 },
      { id: 'wedding', label: '결혼 비용 (예식·혼수·예물·신혼여행)', type: 'money', unit: '원', value: 40000000 },
      { id: 'mode', label: '신혼집', type: 'seg', options: [['jeonse', '전세'], ['buy', '매수']], value: 'jeonse' },
      { id: 'jeonse', label: '전세 보증금', type: 'money', unit: '원', value: 350000000, show: v => v.mode === 'jeonse' },
      { id: 'metro', label: '수도권 (버팀목 한도 3억)', type: 'check', value: true, show: v => v.mode === 'jeonse' },
      { id: 'btRate', label: '신혼부부 버팀목 금리', type: 'number', unit: '%', value: 2.4, step: 0.1, show: v => v.mode === 'jeonse', help: '연소득·보증금에 따라 1.5~2.7%' },
      { id: 'jRate', label: '일반 전세대출 금리 (버팀목 초과분)', type: 'number', unit: '%', value: 4.0, step: 0.1, show: v => v.mode === 'jeonse' },
      { id: 'price', label: '집값', type: 'money', unit: '원', value: 700000000, show: v => v.mode === 'buy' },
      { id: 'mRate', label: '주담대 금리', type: 'number', unit: '%', value: 4.0, step: 0.1, show: v => v.mode === 'buy' },
      { id: 'first', label: '생애최초 (취득세 감면)', type: 'check', value: true, show: v => v.mode === 'buy' },
      { id: 'living', label: '결혼 후 월 생활비 (주거비 제외, 둘이 합쳐)', type: 'money', unit: '원', value: 2500000 },
      { id: 'manage', label: '월 관리비·공과금', type: 'money', unit: '원', value: 250000 },
      { id: 'ret', label: '저축 운용 수익률', type: 'number', unit: '%', value: 3.5, step: 0.5 },
    ], calc);
    const giftTax = (amt) => { const base = Math.max(0, amt - 1.5e8); return HT.progressive(base, HT.GIFT_TAX).tax * 0.97; };
    const SALE_FEE = [[5e7, .006, 25e4], [2e8, .005, 80e4], [9e8, .004, 0], [12e8, .005, 0], [15e8, .006, 0], [Infinity, .007, 0]]; const RENT_FEE = [[5e7, .005, 20e4], [1e8, .004, 30e4], [6e8, .003, 0], [12e8, .004, 0], [15e8, .005, 0], [Infinity, .006, 0]];
    const fee = (P, T) => { const b = T.find(x => P <= x[0]); let fe = P * b[1]; if (b[2] && fe > b[2]) fe = b[2]; return fe * 1.1; };
    function calc(v) {
      const P = HT.payroll; const net = P.netMonthly(v.salary).net + P.netMonthly(v.spouse).net; const income = v.salary + v.spouse;
      const t1 = giftTax(v.gift1), t2 = giftTax(v.gift2); const cash = v.assets + v.assets2 + v.gift1 + v.gift2 - t1 - t2 - v.wedding;
      let equity, loanA = 0, loanB = 0, rateA = 0, rateB = 0, monthlyHousing = 0, oneOff = 0, label, home = 0, mortgage = 0, pm = 0, bt = null;
      if (v.mode === 'jeonse') {
        oneOff = fee(v.jeonse, RENT_FEE) + 1.5e6; equity = Math.max(0, cash - oneOff); const need = Math.max(0, v.jeonse - equity);
        bt = income <= 7.5e7; const btCap = bt ? Math.min(v.jeonse * .8, v.metro ? 3e8 : 2e8) : 0; loanA = Math.min(need, btCap); loanB = need - loanA; rateA = v.btRate; rateB = v.jRate;
        monthlyHousing = loanA * rateA / 100 / 12 + loanB * rateB / 100 / 12 + v.jeonse * .00128 / 12 + v.manage; label = '전세'; home = v.jeonse;
      } else {
        let r = v.price <= 6e8 ? .01 : v.price <= 9e8 ? Math.round((v.price * 2 / 3e8 - 3) * 10000) / 1e6 : .03; let acq = v.price * r * 1.1; if (v.first && v.price <= 12e8) acq -= Math.min(v.price * r, 2e6);
        oneOff = acq + fee(v.price, SALE_FEE) + v.price * .69 * .026 * .12 + 7e5 + 1.5e6; equity = Math.max(0, cash - oneOff); mortgage = Math.max(0, v.price - equity); const mr = v.mRate / 100 / 12; pm = mr ? mortgage * mr * Math.pow(1 + mr, 360) / (Math.pow(1 + mr, 360) - 1) : mortgage / 360;
        monthlyHousing = pm + v.manage; label = '매수'; home = v.price;
      }
      const shortfall = v.mode === 'jeonse' ? Math.max(0, v.jeonse - equity - loanA - loanB) : 0;
      const stress = v.mode === 'buy' ? (v.metro !== false ? 3.0 : 1.5) : 0; const dsrPm = v.mode === 'buy' ? (() => { const mr = (v.mRate + 3.0) / 100 / 12; return mortgage * mr * Math.pow(1 + mr, 360) / (Math.pow(1 + mr, 360) - 1); })() : (loanA * rateA / 100 / 12 + loanB * rateB / 100 / 12); const dsr = income ? dsrPm * 12 / income * 100 : 0;
      const save = net - v.living - monthlyHousing; const rs = v.ret / 100 / 12; let saved = 0; const path = []; let bal = mortgage; const mr = v.mRate / 100 / 12;
      for (let k = 1; k <= 36; k++) { saved = saved * (1 + rs) + save; if (mortgage) { bal -= pm - bal * mr; } if (k % 12 === 0) path.push({ y: k / 12, saved, net: (v.mode === 'jeonse' ? v.jeonse - loanA - loanB : home - Math.max(0, bal)) + saved }); }
      const startNet = v.mode === 'jeonse' ? v.jeonse - loanA - loanB : home - mortgage;
      out.set(HT.kpi('신혼집에 쓸 수 있는 자기자본', HT.wonKor(equity), `두 사람 자산 ${HT.wonKor(v.assets + v.assets2)} + 지원 ${HT.wonKor(v.gift1 + v.gift2)} − 증여세 ${HT.won(t1 + t2)} − 결혼 비용 ${HT.wonKor(v.wedding)} − 계약 부대비용 ${HT.wonKor(oneOff)}`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [t1 + t2 > 0 ? HT.badge(`증여세 ${HT.won(t1 + t2)} 발생 — 1인당 1억 5천만원 초과분`, 'warn') : HT.badge('양가 지원 모두 공제 범위 (증여세 0)', 'ok'), ' ', v.mode === 'jeonse' ? HT.badge(bt ? '신혼부부 버팀목 대상 (합산 7,500만 이하)' : '버팀목 소득 초과 — 일반 전세대출', bt ? 'ok' : 'gray') : HT.badge(`구입 후 스트레스 DSR ${HT.pct(dsr, 1)}`, dsr > 40 ? 'danger' : 'gray'), ' ', shortfall > 0 ? HT.badge(`보증금 ${HT.wonKor(shortfall)} 부족`, 'danger') : null]),
        HT.kpis([['월 실수령 (합산)', HT.won(net)], [`월 주거비 (${label})`, HT.won(monthlyHousing), v.mode === 'jeonse' ? `버팀목 ${HT.wonKor(loanA)} @${rateA}% + 일반 ${HT.wonKor(loanB)} @${rateB}% 이자 + 보증보험 + 관리비` : `주담대 ${HT.wonKor(mortgage)} 원리금 ${HT.won(pm)} + 관리비`], ['월 저축 여력', HT.won(save), `저축률 ${HT.pct(net ? save / net * 100 : 0, 0)}`], ['3년 뒤 순자산', HT.wonKor(path[2].net), `시작 ${HT.wonKor(startNet)} → 저축 누적 ${HT.wonKor(path[2].saved)}`]]),
        HT.stackChart(['결혼 직후', '1년', '2년', '3년'], [{ name: '주거 순자산 (보증금−대출 / 집−대출)', color: 'var(--g3)', values: [startNet, ...path.map(p => p.net - p.saved)] }, { name: '저축 누적', color: 'var(--c1)', values: [0, ...path.map(p => p.saved)] }], { fmt: HT.wonKor, cap: '결혼 후 3년 순자산' }),
        HT.el('h3', {}, '결혼 자금표'),
        HT.rows([['본인 자산 + 배우자 자산', HT.won(v.assets + v.assets2)], ['본인 부모 지원', HT.won(v.gift1), 'sub', t1 ? `증여세 ${HT.won(t1)} (공제 1억 5천만 초과 ${HT.wonKor(v.gift1 - 1.5e8)})` : '공제 범위 안 (기본 5천만 + 혼인 1억)'], ['배우자 부모 지원', HT.won(v.gift2), 'sub', t2 ? `증여세 ${HT.won(t2)}` : '공제 범위 안'], ['결혼 비용', '-' + HT.won(v.wedding), 'sub'], ['계약 부대비용 (중개보수·이사' + (v.mode === 'buy' ? '·취득세·등기' : '') + ')', '-' + HT.won(oneOff), 'sub'], ['신혼집 자기자본', HT.won(equity), 'strong'], [v.mode === 'jeonse' ? '전세 보증금' : '집값', HT.won(home)], ['필요 대출', HT.won(v.mode === 'jeonse' ? loanA + loanB : mortgage), 'strong', v.mode === 'jeonse' && loanA ? `버팀목 ${HT.wonKor(loanA)} (보증금 80%·${v.metro ? '수도권 3억' : '2억'} 한도)` : ''], ['부부 합산 DSR (스트레스 금리)', HT.pct(dsr, 1), '', v.mode === 'jeonse' ? '전세대출 이자 기준' : '주담대 +3.0%p 기준 · 40% 이내 필요']]),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 양가 지원은 1인당 1억 5천만원(기본 5천만 + 혼인 1억)까지 세금이 없으니, 한쪽에 몰기보다 양쪽으로 나누는 것이 유리합니다. 버팀목 전세대출은 부부합산 소득이 ${HT.wonKor(7.5e7)}를 넘으면 안 되므로, 혼인신고 시점과 연봉 인상 시점을 조정하는 것도 방법입니다. 결혼 직후 3년은 저축률이 가장 높은 시기라 이 기간의 저축 여력(월 ${HT.won(save)})이 내 집 마련 시점을 좌우합니다.` }));
    }
    calc(f.values());
  }
});
