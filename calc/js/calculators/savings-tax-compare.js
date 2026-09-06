/* 예금 vs 적금 vs ISA vs 연금저축 — 같은 돈을 넣을 때 세후 최종 금액 비교
   예·적금 이자소득세 15.4% · ISA 비과세 일반 500만/서민형(총급여 5,000만 이하) 1,000만, 초과분 9.9% (2026 개편)
   연금저축 세액공제 연 600만 한도(IRP 합산 900만), 총급여 5,500만 이하 16.5% / 초과 13.2%, 연금 수령 시 연금소득세 5.5%(70세 미만)·4.4%·3.3%, 55세 이후 수령 */
HT.register({
  id: 'savings-tax-compare', cat: '금융·투자', order: 1.5, name: '예금 · 적금 · ISA · 연금저축 세후 비교', keywords: '예금 적금 ISA 연금저축 IRP 세액공제 비과세 세후 수익 비교',
  desc: '같은 금액을 예금·적금·ISA·연금저축에 넣을 때 세금(이자소득세·ISA 비과세·연금 세액공제·연금소득세)을 모두 반영한 최종 수령액과 실효 수익률을 비교합니다.',
  note: '연금저축은 세액공제 환급이 크지만 55세 이후 연금으로만 받을 수 있고, 중도 해지하면 16.5% 기타소득세를 냅니다. 이 비교는 환급금을 같은 수익률로 따로 굴린다고 가정하고, 만기에 연금소득세 5.5%를 뗀 값을 보여줍니다(연 수령액 1,500만원 이하 분리과세 기준). ISA는 3년 이상 유지해야 비과세이고 만기 후 연금계좌로 옮기면 추가 세액공제(이전액의 10%, 300만원 한도)도 있습니다. 수익률은 가정이며, ISA·연금저축의 투자형 상품은 손실이 날 수 있습니다.',
  render(root) {
    const out = HT.output(root, '세후 비교');
    const f = HT.form(root, [
      { id: 'monthly', label: '월 납입액', type: 'money', unit: '원', value: 500000 },
      { id: 'years', label: '납입·운용 기간', type: 'number', unit: '년', value: 5, min: 1, max: 30 },
      { id: 'depRate', label: '예금 · 적금 금리', type: 'number', unit: '%', value: 3.0, step: 0.1 },
      { id: 'invRate', label: 'ISA · 연금저축 수익률', type: 'number', unit: '%', value: 5.0, step: 0.1, help: '예금형 ISA면 예금 금리와 같게' },
      { id: 'gross', label: '총급여', type: 'money', unit: '원', value: 50000000, help: '5,000만 이하 ISA 서민형 · 5,500만 이하 세액공제 16.5%' },
      { id: 'pensionTax', label: '연금 수령 시 연금소득세', type: 'select', options: [['5.5', '5.5% (70세 미만)'], ['4.4', '4.4% (70~80세)'], ['3.3', '3.3% (80세 이상)']], value: '5.5' },
      { id: 'reinvest', label: '세액공제 환급금을 같은 수익률로 재투자', type: 'check', value: true },
    ], calc);
    function grow(monthly, rate, years, taxOnInterest) { const r = rate / 100 / 12; let bal = 0, prin = 0; for (let k = 0; k < years * 12; k++) { bal = bal * (1 + r) + monthly; prin += monthly; } const gain = bal - prin; return { bal: prin + gain * (1 - taxOnInterest), prin, gain, tax: gain * taxOnInterest }; }
    function calc(v) {
      const n = v.years; const annual = v.monthly * 12;
      // 예금: 매년 초 연 납입액을 1년 예금에 넣고 만기마다 재예치 (연복리, 이자 15.4%)
      let dep = 0, depPrin = 0, depTax = 0; for (let y = 0; y < n; y++) { const gi = (dep + annual) * v.depRate / 100; depTax += gi * .154; dep = dep + annual + gi * (1 - .154); depPrin += annual; } const depGain = dep - depPrin;
      const sav = grow(v.monthly, v.depRate, n, .154);
      const isaLimit = v.gross <= 5e7 ? 1e7 : 5e6; const isaRaw = grow(v.monthly, v.invRate, n, 0); const isaTax = Math.max(0, isaRaw.gain - isaLimit) * .099; const isa = isaRaw.bal - isaTax;
      const credRate = v.gross <= 5.5e7 ? .165 : .132; const credit = Math.min(annual, 6e6) * credRate; let refunds = 0; for (let y = 0; y < n; y++) refunds = refunds * (v.reinvest ? 1 + v.invRate / 100 * (1 - .154) : 1) + credit;
      const pen = grow(v.monthly, v.invRate, n, 0); const ptax = HT.num(v.pensionTax) / 100; const penNet = pen.bal * (1 - ptax); const penTotal = penNet + refunds;
      const rows = [['정기예금 (연 단위 재예치)', dep, depGain + depTax, depTax, '언제든 (중도해지 시 이자 손실)'], ['적금 (월 납입)', sav.bal, sav.gain, sav.tax, '만기까지 (중도해지 시 이자 손실)'], [`ISA (${v.gross <= 5e7 ? '서민형' : '일반형'})`, isa, isaRaw.gain, isaTax, '3년 이상 유지 (납입원금은 중도 인출 가능)'], ['연금저축 (세액공제 + 연금 수령)', penTotal, pen.gain + refunds, pen.bal * ptax, '55세 이후 연금으로 (중도해지 16.5%)']];
      const best = rows.reduce((a, b) => b[1] > a[1] ? b : a); const prin = annual * n;
      const eff = (fin) => (Math.pow(fin / prin, 1 / n) - 1) * 100 * 2; // 월 납입 평균 거치기간 ≈ n/2년 → 근사 연환산
      out.set(HT.kpi('세후 최종 금액이 가장 큰 곳', best[0].split(' (')[0], `${HT.won(best[1])} · 납입 원금 ${HT.won(prin)}`),
        HT.barChart(rows.map(r => ({ label: r[0].split(' (')[0], value: r[1] - prin, color: r === best ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.won, padL: 110, cap: '원금을 뺀 세후 순수익 (세액공제 환급 포함)' }),
        HT.table(['상품', '세후 최종 금액', '세전 수익', '세금', '세후 순수익', '돈이 묶이는 기간'], rows.map(r => [r[0], HT.won(r[1]), HT.won(r[2]), HT.won(r[3]), HT.won(r[1] - prin), r[4]]), { right: [1, 2, 3, 4], scroll: false, hi: r => r[0] === best[0] }),
        HT.rows([['연금저축 세액공제 환급', `연 ${HT.won(credit)} × ${n}년 = ${HT.won(credit * n)}`, '', `납입 ${HT.wonKor(Math.min(annual, 6e6))} × ${credRate * 100}% (연 600만원 한도, IRP 합산 900만원)` + (v.reinvest ? ` · 재투자 후 ${HT.won(refunds)}` : '')], ['ISA 비과세 한도', HT.won(isaLimit), '', isaTax ? `초과 수익 ${HT.won(isaRaw.gain - isaLimit)}에 9.9%` : '수익이 한도 안 — 세금 없음'], ['예·적금 이자소득세', '15.4%', 'sub']]),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 단기(1~3년)에 쓸 돈은 예·적금이나 ISA, 노후 자금은 연금저축이 맞습니다. 연금저축의 우위는 세액공제 환급(연 ${HT.won(credit)})에서 오므로, 환급을 쓰지 않고 다시 투자해야 표의 값이 나옵니다. 연 납입이 600만원을 넘으면 초과분은 세액공제가 없어 ISA가 더 유리해집니다.` }));
    }
    calc(f.values());
  }
});
