/* 자녀 증여 플래너 — 10년 단위 공제(미성년 2천만·성년 5천만)와 혼인·출산 공제 1억을 활용한 분할 증여 계획
   vs 한 번에 줄 때 세금 비교. 증여 재산은 자녀 명의로 굴러 수익도 자녀 몫이 된다. */
HT.register({
  id: 'gift-planner', cat: '주식·세금', order: 3.5, name: '자녀 증여 플래너', keywords: '증여 플랜 자녀 10년 공제 분할증여 혼인출산공제 절세',
  desc: '자녀 나이와 물려줄 총액을 넣으면 10년마다 돌아오는 증여재산공제(미성년 2천만·성년 5천만원)와 혼인·출산 공제 1억원을 언제 얼마씩 쓰면 세금이 얼마나 줄어드는지, 한 번에 줄 때와 비교해 보여줍니다.',
  note: '직계존속(부모·조부모 합산)이 주는 증여는 10년 동안 합산해 공제하며, 같은 10년 안에 여러 번 주면 앞선 증여를 합산해 누진세율을 적용합니다. 혼인·출산 공제 1억원은 혼인신고일 전후 2년 또는 출생일부터 2년 안에 받는 증여에 평생 한 번 적용됩니다(2024년 시행). 조부모가 손주에게 바로 주면 세율의 30%(미성년 20억 초과 40%)가 할증되지만 부모 세대의 증여세 한 단계를 건너뜁니다. 증여 뒤 자산의 수익은 자녀 소유라 추가 증여세가 없습니다. 상속으로 넘어가는 경우와의 비교는 상속세 계산기를 함께 보세요.',
  render(root) {
    const out = HT.output(root, '증여 계획');
    const f = HT.form(root, [
      { id: 'childAge', label: '자녀 현재 나이', type: 'number', unit: '세', value: 5, min: 0, max: 60 },
      { id: 'endAge', label: '계획 마지막 증여 나이 (자녀 기준)', type: 'number', unit: '세', value: 40, min: 1, max: 80 },
      { id: 'total', label: '총 이전 목표 금액 (현재 가치)', type: 'money', unit: '원', value: 500000000, help: '공제 합계보다 크면 초과분에 세금이 붙습니다' },
      { id: 'mode', label: '초과분 배분', type: 'seg', options: [['even', '매 회차 균등'], ['last', '마지막 회차에 몰아서'], ['none', '공제 한도만 (세금 0)']], value: 'even' },
      { id: 'marryAge', label: '혼인 예정 나이 (혼인·출산 공제 1억, 없으면 0)', type: 'number', unit: '세', value: 32, min: 0, max: 60 },
      { id: 'donor', label: '증여자', type: 'seg', options: [['parent', '부모'], ['grand', '조부모 (세대생략 30% 할증)']], value: 'parent' },
      { id: 'ret', label: '증여 자산 연 수익률 (자녀 명의 운용)', type: 'number', unit: '%', value: 5, step: 0.5 },
      { id: 'lumpAge', label: '비교: 한 번에 줄 때 자녀 나이', type: 'number', unit: '세', value: 40, min: 0, max: 80 },
    ], calc);
    const taxOn = (base) => HT.progressive(Math.max(0, base), HT.GIFT_TAX).tax;
    /* 10년 합산 과세: 사건 목록 [{age, amt, extraDed}] → 각 사건 세액 */
    function planTax(events, v) {
      const done = []; let totalTax = 0;
      events.forEach(e => { const win = done.filter(d => e.age - d.age < 10); const prevAmt = win.reduce((a, d) => a + d.amt, 0);
        const cap = e.age >= 19 ? 5e7 : 2e7; const winExtra = win.reduce((a, d) => a + d.extraDed, 0);
        const ded = cap + e.extraDed + winExtra; // 10년 합산 공제: 기본 5천만(미성년 2천만) + 창구 안 혼인·출산 공제
        const gross = taxOn(prevAmt + e.amt - ded); const prevGross = taxOn(prevAmt - (cap + winExtra)); // 창구 안 앞선 증여에 이미 매겨진 세액
        let tax = Math.max(0, gross - prevGross); const surcharge = v.donor === 'grand' ? tax * 0.3 : 0; tax = (tax + surcharge) * 0.97; // 신고세액공제 3%
        e.tax = tax; e.ded = ded; e.surcharge = surcharge; done.push({ age: e.age, amt: e.amt, extraDed: e.extraDed }); totalTax += tax; });
      return totalTax;
    }
    function calc(v) {
      if (v.endAge <= v.childAge) { out.set(HT.el('div', { class: 'empty' }, '마지막 증여 나이는 현재 나이보다 커야 합니다.')); return; }
      // 회차: 지금부터 10년 간격, 성년(19세) 되는 시점도 추가 회차, 혼인 시점은 별도 사건
      const ages = new Set(); for (let a = v.childAge; a <= v.endAge; a += 10) ages.add(a); if (v.childAge < 19 && 19 <= v.endAge) { const last = [...ages].filter(a => a < 19).pop(); if (last === undefined || 19 - last >= 10) ages.add(19); }
      const events = [...ages].sort((a, b) => a - b).map(a => ({ age: a, amt: 0, extraDed: 0, label: a >= 19 ? '성년 공제 5천만' : '미성년 공제 2천만' }));
      // 회차별 공제 가능액 = 성년 5천만/미성년 2천만에서 10년 내 앞 회차가 쓴 공제를 뺀 값 (10년 합산)
      let used = []; events.forEach(e => { const win = used.filter(u => e.age - u.age < 10); const cap = e.age >= 19 ? 5e7 : 2e7; e.dedAvail = Math.max(0, cap - win.reduce((a, u) => a + u.ded, 0)); used.push({ age: e.age, ded: e.dedAvail }); });
      if (v.marryAge > 0 && v.marryAge >= v.childAge && v.marryAge <= v.endAge) { const same = events.find(e => e.age === v.marryAge); if (same) { same.extraDed = 1e8; same.label += ' + 혼인 공제 1억'; } else events.push({ age: v.marryAge, amt: 0, extraDed: 1e8, dedAvail: 0, label: '혼인·출산 공제 1억' }); events.sort((a, b) => a.age - b.age); }
      const dedTotal = events.reduce((a, e) => a + e.dedAvail + e.extraDed, 0);
      // 금액 배분
      events.forEach(e => { e.amt = e.dedAvail + e.extraDed; });
      const excess = Math.max(0, v.total - dedTotal);
      if (v.mode === 'even' && excess) events.forEach(e => { e.amt += excess / events.length; });
      else if (v.mode === 'last' && excess) events[events.length - 1].amt += excess;
      const planTotal = events.reduce((a, e) => a + e.amt, 0);
      const tax = planTax(events, v);
      // 자녀 자산 성장
      let wealth = 0, prevAge = v.childAge; const rows = events.map(e => { wealth *= Math.pow(1 + v.ret / 100, e.age - prevAge); prevAge = e.age; wealth += e.amt - e.tax; return [e.age + '세', e.label, HT.won(e.amt), HT.won(e.dedAvail + e.extraDed), HT.won(e.tax) + (e.surcharge ? ' (할증 포함)' : ''), HT.won(wealth)]; });
      wealth *= Math.pow(1 + v.ret / 100, Math.max(0, v.endAge - prevAge));
      // 비교: 같은 총액을 한 번에
      const lumpDed = (v.lumpAge >= 19 ? 5e7 : 2e7) + (v.marryAge > 0 && Math.abs(v.lumpAge - v.marryAge) <= 2 ? 1e8 : 0); let lumpTax = taxOn(planTotal - lumpDed); if (v.donor === 'grand') lumpTax *= 1.3; lumpTax *= 0.97;
      const lumpWealth = (planTotal - lumpTax) * Math.pow(1 + v.ret / 100, Math.max(0, v.endAge - v.lumpAge));
      out.set(HT.kpi('분할 증여 총 세금', HT.won(tax), `한 번에 ${v.lumpAge}세에 주면 ${HT.won(lumpTax)} — ${HT.wonKor(lumpTax - tax)} 절세`),
        HT.kpis([['증여 회차', `${events.length}회`, `${v.childAge}세 → ${v.endAge}세`], ['세금 없이 이전 가능', HT.wonKor(dedTotal), '공제 합계'], ['총 이전액', HT.wonKor(planTotal), excess ? `공제 초과 ${HT.wonKor(excess)}` : '공제 한도 안'], [`${v.endAge}세 자녀 자산`, HT.wonKor(wealth), `연 ${v.ret}% 운용 · 일시 증여 시 ${HT.wonKor(lumpWealth)}`]]),
        HT.barChart([{ label: '분할 증여 세금', value: tax, color: 'var(--c1)' }, { label: `${v.lumpAge}세 일시 증여 세금`, value: lumpTax, color: 'var(--g2)' }], { fmt: HT.won, padL: 150 }),
        HT.table(['자녀 나이', '회차', '증여액', '공제', '세금', '자녀 누적 자산'], rows, { right: [2, 3, 4, 5], scroll: false }),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 공제만 쓰면 ${HT.wonKor(dedTotal)}까지 세금 없이 넘길 수 있습니다. 초과분은 낮은 세율 구간(1억 이하 10%)을 여러 번 쓰도록 회차마다 나누는 것이 유리하며, 혼인·출산 시점에 1억원을 더 얹을 수 있습니다. 증여 뒤 자산 수익 ${HT.wonKor(wealth - (planTotal - tax))}은 자녀 것이라 세금이 없습니다. 증여일이 속한 달 말일부터 3개월 안에 신고해야 3% 세액공제를 받고, 부동산·주식은 증여일 시가로 평가합니다.` }));
    }
    calc(f.values());
  }
});
