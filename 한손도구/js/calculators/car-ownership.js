/* 자동차 구매 vs 리스 vs 장기렌트 총비용 비교
   취득세 7%(전기차 최대 140만 감면, 2026.12.31까지), 자동차세 배기량 cc당 80/140/200원 + 지방교육세 30%, 3년차부터 매년 5% 경감(최대 50%),
   전기차 자동차세 13만원(교육세 포함). 사업자 비용처리: 업무용승용차 연 1,500만원 한도(감가상각 800만원 포함, 운행기록부 없을 때) */
HT.register({
  id: 'car-ownership', cat: '금융·투자', order: 4.5, name: '자동차 구매 vs 리스 vs 렌트', keywords: '자동차 구매 할부 리스 장기렌트 총비용 비교 취득세 자동차세 잔존가치',
  desc: '같은 차를 현금·할부로 사는 경우, 리스하는 경우, 장기렌트하는 경우의 보유 기간 총비용(세금·보험·정비·이자·잔존가치 반영)을 비교합니다. 사업자는 비용처리 절세 효과까지 반영합니다.',
  note: '구매 총비용은 "낸 돈 − 기간 끝의 차량 잔존가치"입니다. 리스는 만기에 반납하거나 정해진 잔가로 인수할 수 있고, 인수하면 시장 잔존가치와 잔가의 차이가 이득·손해로 잡힙니다. 장기렌트료에는 보통 보험·자동차세가 포함되고 리스료에는 포함되지 않는 경우가 많으니 견적서를 확인해 입력하세요. 사업자 비용처리는 운행기록부 없이 인정되는 연 1,500만원(감가상각 800만원 포함) 한도로 계산했고, 절세액은 한계세율(지방소득세 포함)로 추정합니다. 리스·렌트료는 부가세 포함 금액이며, 개인은 부가세를 돌려받지 못합니다.',
  render(root) {
    const out = HT.output(root, '총비용 비교');
    const f = HT.form(root, [
      { id: 'price', label: '차량 가격 (부가세 포함 출고가)', type: 'money', unit: '원', value: 50000000 },
      { id: 'months', label: '보유·계약 기간', type: 'number', unit: '개월', value: 36, min: 12, max: 84 },
      { id: 'ev', label: '전기차 (취득세 140만 감면·자동차세 13만원)', type: 'check', value: false },
      { id: 'cc', label: '배기량', type: 'number', unit: 'cc', value: 2000, min: 0, show: v => !v.ev },
      { id: 'resid', label: '기간 끝 시장 잔존가치율', type: 'number', unit: '%', value: 55, step: 1, help: '3년 55~60%, 5년 40~45%가 보통' },
      { id: 'ins', label: '연 보험료 (본인 명의 기준)', type: 'money', unit: '원', value: 1000000 },
      { id: 'maint', label: '연 정비·소모품비', type: 'money', unit: '원', value: 500000 },
      { id: 'down', label: '구매 · 자기자금 비율', type: 'number', unit: '%', value: 30, min: 0, max: 100 },
      { id: 'loanRate', label: '구매 · 할부 금리', type: 'number', unit: '%', value: 6.0, step: 0.1 },
      { id: 'bond', label: '구매 · 공채 할인비용 + 등록 부대비용', type: 'money', unit: '원', value: 500000 },
      { id: 'lPre', label: '리스 · 선납금·보증금 중 돌려받지 못하는 금액', type: 'money', unit: '원', value: 0 },
      { id: 'lPay', label: '리스 · 월 리스료', type: 'money', unit: '원', value: 850000 },
      { id: 'lIns', label: '리스 · 보험료를 내가 부담', type: 'check', value: true },
      { id: 'lEnd', label: '리스 · 만기 처리', type: 'seg', options: [['return', '반납'], ['buy', '잔가 인수']], value: 'return' },
      { id: 'lResid', label: '리스 · 인수 잔가율', type: 'number', unit: '%', value: 45, step: 1, show: v => v.lEnd === 'buy' },
      { id: 'rPay', label: '렌트 · 월 렌트료 (보험·세금 포함)', type: 'money', unit: '원', value: 950000 },
      { id: 'biz', label: '사업자 (비용처리 절세 반영)', type: 'check', value: false },
      { id: 'mrate', label: '한계세율 (지방소득세 포함)', type: 'number', unit: '%', value: 26.4, step: 0.1, show: v => v.biz, help: '과세표준 5천~8,800만 26.4%, 8,800만~1.5억 38.5%' },
    ], calc);
    function carTax(v, year) { if (v.ev) return 130000; const per = v.cc <= 1000 ? 80 : v.cc <= 1600 ? 140 : 200; const base = v.cc * per * 1.3; const cut = Math.min(0.5, Math.max(0, year - 2) * 0.05); return base * (1 - cut); }
    function calc(v) {
      const yrs = v.months / 12; const fullY = Math.ceil(yrs);
      const taxSum = Array.from({ length: fullY }, (_, i) => carTax(v, i + 1) * Math.min(1, yrs - i)).reduce((a, b) => a + b, 0);
      const insSum = v.ins * yrs, maintSum = v.maint * yrs; const residVal = v.price * v.resid / 100;
      // 구매
      let acq = v.price * 0.07; if (v.ev) acq = Math.max(0, acq - 1.4e6);
      const downAmt = v.price * v.down / 100, loan = v.price - downAmt; const r = v.loanRate / 100 / 12; const pm = r ? loan * r * Math.pow(1 + r, v.months) / (Math.pow(1 + r, v.months) - 1) : loan / v.months; const interest = pm * v.months - loan;
      const buyPaid = v.price + acq + v.bond + interest + insSum + taxSum + maintSum; const buy = buyPaid - residVal;
      // 리스
      let lease = v.lPre + v.lPay * v.months + (v.lIns ? insSum : 0) + maintSum; let leaseNote = '만기 반납';
      if (v.lEnd === 'buy') { const buyout = v.price * v.lResid / 100; lease += buyout - residVal; leaseNote = `잔가 ${HT.wonKor(buyout)}에 인수 → 시장가 ${HT.wonKor(residVal)}`; }
      // 렌트
      const rent = v.rPay * v.months;
      // 사업자 절세
      let save = { buy: 0, lease: 0, rent: 0 };
      if (v.biz) { const cap = 1.5e7 * yrs; const dep = Math.min(8e6, v.price / 5) * yrs; const buyDed = Math.min(cap, dep + insSum + taxSum + maintSum + interest); const leaseDed = Math.min(cap, v.lPay * 12 * yrs + (v.lIns ? insSum : 0) + maintSum); const rentDed = Math.min(cap, rent); save = { buy: buyDed * v.mrate / 100, lease: leaseDed * v.mrate / 100, rent: rentDed * v.mrate / 100 }; }
      const opts = [['구매 (할부)', buy - save.buy, buy, save.buy], ['리스', lease - save.lease, lease, save.lease], ['장기렌트', rent - save.rent, rent, save.rent]]; const best = opts.reduce((a, b) => b[1] < a[1] ? b : a);
      out.set(HT.kpi(`${yrs % 1 ? HT.fmt(yrs, 1) : yrs}년 기준 가장 저렴한 방식`, best[0], `총비용 ${HT.wonKor(best[1])} (월 환산 ${HT.won(best[1] / v.months)})`),
        HT.barChart(opts.map(o => ({ label: o[0], value: o[1], color: o === best ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.wonKor, cap: '보유 기간 총비용' + (v.biz ? ' (비용처리 절세 반영)' : '') }),
        HT.table(['항목', '구매', '리스', '렌트'], [
          ['차량가 / 리스·렌트료 합계', HT.won(v.price), HT.won(v.lPay * v.months), HT.won(rent)],
          ['취득세 (7%)', HT.won(acq), '리스료에 포함', '렌트료에 포함'], ['공채·등록비', HT.won(v.bond), '-', '-'], ['할부 이자', HT.won(interest), '-', '-'], ['선납·보증금 손실', '-', HT.won(v.lPre), '-'],
          ['보험료', HT.won(insSum), v.lIns ? HT.won(insSum) : '리스료에 포함', '렌트료에 포함'], ['자동차세 (교육세 포함)', HT.won(taxSum), '리스료에 포함', '렌트료에 포함'], ['정비·소모품', HT.won(maintSum), HT.won(maintSum), '렌트료에 포함'],
          ['기간 끝 잔존가치', '-' + HT.won(residVal), v.lEnd === 'buy' ? leaseNote : '반납 (해당 없음)', '반납'],
          v.biz ? ['비용처리 절세 (한계세율 ' + v.mrate + '%)', '-' + HT.won(save.buy), '-' + HT.won(save.lease), '-' + HT.won(save.rent)] : null,
          ['총비용', HT.won(opts[0][1]), HT.won(opts[1][1]), HT.won(opts[2][1])], ['월 환산', HT.won(opts[0][1] / v.months), HT.won(opts[1][1] / v.months), HT.won(opts[2][1] / v.months)],
        ].filter(Boolean), { right: [1, 2, 3], scroll: false, hi: r => r[0] === '총비용' }),
        HT.el('div', { class: 'note', html: `<b>돈 말고 따질 것</b> 구매는 기간이 길수록 유리해지고(잔존가치 하락이 완만해짐) 주행거리 제한이 없습니다. 리스·렌트는 초기 목돈이 적고 사업자 비용처리가 단순하지만 약정 주행거리 초과·중도 해지 위약금이 큽니다. 렌트는 번호판이 "하·허·호"이고 보험 경력이 쌓이지 않으며, 리스는 본인 명의 보험이라 경력이 인정됩니다. 자동차세 연납(1월) 시 약 5% 할인이 추가로 있습니다.` }));
    }
    calc(f.values());
  }
});
