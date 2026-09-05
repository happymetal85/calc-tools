/* 매수 vs 전세+투자 — 같은 자기자본으로 집을 사는 경우와 전세 살며 차액을 투자하는 경우의 N년 뒤 순자산 비교 */
HT.register({
  id: 'buy-vs-rent', cat: '부동산', order: 0.7, name: '매수 vs 전세+투자 비교', keywords: '매수 전세 투자 비교 집값 상승률 보유세 순자산 손익분기',
  desc: '같은 돈으로 집을 사는 경우와 전세를 살며 남는 돈을 투자하는 경우를 보유 기간 동안 시뮬레이션해 최종 순자산을 비교하고, 집값이 연 몇 % 올라야 매수가 유리한지(손익분기 상승률)를 구합니다.',
  note: '매수 쪽은 취득세·중개보수·등기 비용, 주담대 원리금, 매년 보유세(재산세+종부세, 공시가 69% 추정), 매도 시 중개보수와 양도세(1세대 1주택 2년 이상 보유 시 12억원까지 비과세)를 반영합니다. 전세 쪽은 전세대출 이자, 보증보험료, 2년마다 오르는 전세금(추가분은 대출)을 반영하고, 매달 매수 쪽보다 덜 나가는 돈은 투자 수익률로 굴립니다. 집값·전세금·투자 수익률은 가정이며 실제와 다를 수 있습니다. 규제지역 LTV·한도는 반영하지 않으므로 대출 가능 여부는 내 집 마련 시뮬레이터에서 확인하세요.',
  render(root) {
    const out = HT.output(root, '비교 결과');
    const f = HT.form(root, [
      { id: 'price', label: '집값', type: 'money', unit: '원', value: 900000000 },
      { id: 'equity', label: '자기자본', type: 'money', unit: '원', value: 400000000 },
      { id: 'years', label: '보유·거주 기간', type: 'number', unit: '년', value: 10, min: 1, max: 30 },
      { id: 'appr', label: '집값 상승률 (연)', type: 'number', unit: '%', value: 3, step: 0.5 },
      { id: 'mRate', label: '주담대 금리', type: 'number', unit: '%', value: 4.0, step: 0.1 },
      { id: 'mYears', label: '주담대 기간', type: 'number', unit: '년', value: 30, min: 5, max: 40 },
      { id: 'big', label: '전용면적 85㎡ 초과', type: 'check', value: false },
      { id: 'first', label: '생애최초 (취득세 감면 200만원)', type: 'check', value: true },
      { id: 'jeonse', label: '같은 집 전세 보증금', type: 'money', unit: '원', value: 550000000 },
      { id: 'jRise', label: '전세금 상승률 (2년마다)', type: 'number', unit: '%', value: 4, step: 0.5 },
      { id: 'jRate', label: '전세대출 금리', type: 'number', unit: '%', value: 3.8, step: 0.1 },
      { id: 'inv', label: '투자 수익률 (연, 세전)', type: 'number', unit: '%', value: 6, step: 0.5 },
      { id: 'invTax', label: '투자 수익 세율', type: 'number', unit: '%', value: 15.4, step: 0.1, help: '국내 주식 매매차익은 0, 배당·해외·예금은 15.4' },
    ], calc);
    const SALE_FEE = [[5e7, .006, 25e4], [2e8, .005, 80e4], [9e8, .004, 0], [12e8, .005, 0], [15e8, .006, 0], [Infinity, .007, 0]];
    const RENT_FEE = [[5e7, .005, 20e4], [1e8, .004, 30e4], [6e8, .003, 0], [12e8, .004, 0], [15e8, .005, 0], [Infinity, .006, 0]];
    const fee = (P, T) => { const b = T.find(x => P <= x[0]); let fe = P * b[1]; if (b[2] && fe > b[2]) fe = b[2]; return fe * 1.1; };
    const H_ONE = [[6e7, .0005, 0], [1.5e8, .001, 3e4], [3e8, .002, 18e4], [Infinity, .0035, 63e4]]; const H_GEN = [[6e7, .001, 0], [1.5e8, .0015, 3e4], [3e8, .0025, 18e4], [Infinity, .004, 63e4]];
    const R2 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .013, 60e5], [94e8, .02, 235e5], [Infinity, .027, 893e5]];
    function acq(P, v) { const r = P <= 6e8 ? .01 : P <= 9e8 ? Math.round((P * 2 / 3e8 - 3) * 10000) / 1e6 : .03; let t = P * r + P * r / 10 + (v.big ? P * .002 : 0); if (v.first && P <= 12e8) t -= Math.min(P * r, 2e6); return t + fee(P, SALE_FEE) + P * .69 * .026 * .12 + 15e4 + 15000 + 5e5; }
    function holding(P) { const pub = P * .69; const one = pub <= 9e8; const pb = pub * (one ? (pub <= 3e8 ? .43 : pub <= 6e8 ? .44 : .45) : .6); const prop = HT.progressive(pb, one ? H_ONE : H_GEN).tax; const cre = HT.progressive(Math.max(0, pub - 12e8) * .6, R2).tax; return prop * 1.2 + pb * .0014 + cre * 1.2; }
    function capGains(P0, P1, years) { if (P1 <= 12e8) return 0; const gain = (P1 - P0) * (P1 - 12e8) / P1; const lt = years >= 3 ? Math.min(.8, Math.min(.4, .04 * years) * 2) : 0; const base = Math.max(0, gain * (1 - lt) - 2.5e6); return HT.progressive(base, HT.INCOME_TAX).tax * 1.1; }
    function simulate(v, appr) {
      const n = v.years * 12; const r = v.mRate / 100 / 12; const buyCost = acq(v.price, v); let loan = Math.max(0, v.price + buyCost - v.equity); const pm = r ? loan * r * Math.pow(1 + r, v.mYears * 12) / (Math.pow(1 + r, v.mYears * 12) - 1) : loan / (v.mYears * 12);
      let jLoan = Math.max(0, v.jeonse - v.equity), invest = Math.max(0, v.equity - v.jeonse), dep = v.jeonse; const ir = v.inv / 100 / 12 * (1 - v.invTax / 100);
      let price = v.price; const yearly = []; let buyOut = 0, rentOut = 0;
      for (let k = 1; k <= n; k++) {
        const y = Math.floor((k - 1) / 12);
        // 매수: 원리금 + 보유세/12
        const int = loan * r; const prin = Math.min(loan, pm - int); loan -= prin; const bo = pm + holding(v.price * Math.pow(1 + appr / 100, y)) / 12; buyOut += bo;
        // 전세: 이자 + 보증보험 0.128%/12
        if (k > 1 && (k - 1) % 24 === 0) { const add = dep * v.jRise / 100; dep += add; jLoan += add; }
        const ro = jLoan * v.jRate / 100 / 12 + dep * .00128 / 12; rentOut += ro;
        invest = invest * (1 + ir) + (bo - ro); // 덜 나가는 쪽 차액을 투자 (음수면 투자에서 인출)
        price = v.price * Math.pow(1 + appr / 100, k / 12);
        if (k % 12 === 0 || k === n) { const sell = fee(price, SALE_FEE); const cg = capGains(v.price, price, k / 12); yearly.push({ y: k / 12, buy: price - loan - sell - cg, rent: dep + invest - jLoan, price, loan, invest, jLoan, dep }); }
      }
      const last = yearly[yearly.length - 1]; return { yearly, buy: last.buy, rent: last.rent, buyCost, pm, buyOut, rentOut, loan0: Math.max(0, v.price + buyCost - v.equity), jLoan0: Math.max(0, v.jeonse - v.equity) };
    }
    function calc(v) {
      const S = simulate(v, v.appr); const diff = S.buy - S.rent;
      let lo = -10, hi = 20; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const s = simulate(v, mid); if (s.buy - s.rent >= 0) hi = mid; else lo = mid; } const beAppr = hi;
      out.set(HT.kpi(diff >= 0 ? '매수가 유리' : '전세 + 투자가 유리', HT.wonKor(Math.abs(diff)), `${v.years}년 뒤 순자산 차이 · 매수 ${HT.wonKor(S.buy)} vs 전세+투자 ${HT.wonKor(S.rent)}`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(`손익분기 집값 상승률 연 ${HT.pct(beAppr, 2)}`, 'gray'), ' ', HT.badge(v.appr >= beAppr ? `가정 ${v.appr}% ≥ 손익분기 → 매수` : `가정 ${v.appr}% < 손익분기 → 전세`, v.appr >= beAppr ? 'ok' : 'warn')]),
        HT.kpis([['매수: 초기 비용', HT.wonKor(S.buyCost), '취득세·중개·등기 등'], ['매수: 월 부담 (첫 해)', HT.won(S.pm + holding(v.price) / 12), `원리금 ${HT.won(S.pm)} + 보유세`], ['전세: 월 부담 (첫 해)', HT.won(S.jLoan0 * v.jRate / 100 / 12 + v.jeonse * .00128 / 12), `전세대출 ${HT.wonKor(S.jLoan0)} 이자 + 보증보험`]]),
        (() => { const W = 600, H = 210, padL = 80, padB = 26, padT = 10; const ys = S.yearly; const all = ys.flatMap(p => [p.buy, p.rent]); const max = Math.max(...all, 1), min = Math.min(...all, 0); const span = max - min || 1; const px = i => padL + (W - padL - 10) * (ys.length > 1 ? i / (ys.length - 1) : 0), py = val => padT + (H - padT - padB) * (1 - (val - min) / span);
          let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`; [min, (min + max) / 2, max].forEach(t => { s += `<line x1="${padL}" y1="${py(t)}" x2="${W - 10}" y2="${py(t)}" stroke="var(--line)"/><text x="${padL - 6}" y="${py(t) + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${HT.esc(HT.wonKor(t))}</text>`; });
          s += `<polyline fill="none" stroke="var(--brand-key)" stroke-width="2" points="${ys.map((p, i) => px(i) + ',' + py(p.buy)).join(' ')}"/><polyline fill="none" stroke="var(--g1)" stroke-width="2" points="${ys.map((p, i) => px(i) + ',' + py(p.rent)).join(' ')}"/>`;
          const li = ys.length - 1; s += `<text x="${px(li) - 4}" y="${py(ys[li].buy) - 6}" text-anchor="end" font-size="11" fill="var(--brand-deep)">매수</text><text x="${px(li) - 4}" y="${py(ys[li].rent) + 14}" text-anchor="end" font-size="11" fill="var(--ink-soft)">전세+투자</text>`;
          ys.forEach((p, i) => { if (ys.length <= 12 || i % Math.ceil(ys.length / 10) === 0 || i === li) s += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${p.y}년</text>`; });
          const d = HT.el('div', { class: 'chart', html: s + '</svg>' }); d.append(HT.el('div', { class: 'cap' }, '연도별 순자산 (매도·정산 시 기준) — 파랑 매수, 회색 전세+투자')); return d; })(),
        HT.table(['연차', '집값', '주담대 잔액', '매수 순자산', '전세금', '투자자산', '전세대출', '전세 순자산', '차이'], S.yearly.map(p => [p.y + '년', HT.wonKor(p.price), HT.wonKor(p.loan), HT.wonKor(p.buy), HT.wonKor(p.dep), HT.wonKor(p.invest), HT.wonKor(p.jLoan), HT.wonKor(p.rent), (p.buy - p.rent >= 0 ? '+' : '') + HT.wonKor(p.buy - p.rent)]), { right: [1, 2, 3, 4, 5, 6, 7, 8] }),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> ${v.years}년 동안 매수 쪽이 낸 돈은 ${HT.wonKor(S.buyOut)}, 전세 쪽은 ${HT.wonKor(S.rentOut)}입니다. 그 차액을 전세 쪽이 연 ${v.inv}%로 굴린다고 가정했습니다. 집값이 연 ${HT.pct(beAppr, 2)} 이상 오르면 매수가 앞서고, 그보다 덜 오르면 전세+투자가 앞섭니다. 매수 순자산은 지금 팔 때 중개보수와 양도세를 뺀 값, 전세 순자산은 보증금 + 투자자산 − 전세대출입니다.` }));
    }
    calc(f.values());
  }
});
