/* 이직 제안 비교 — 현 직장 vs 제안을 세후 총보상으로 환산
   실수령(4대보험·소득세, 청년 소득세 감면) + 퇴직금 적립 가치 + 성과급(세후) + 복지 + 연차 가치 − 통근 비용·시간 가치 */
HT.register({
  id: 'job-offer-compare', cat: '급여·소득', order: 0.5, original: false, name: '이직 제안 비교', keywords: '이직 연봉 협상 제안 비교 총보상 실수령 퇴직금 복지 통근',
  desc: '현 직장과 이직 제안의 연봉·성과급·퇴직금·복지·연차·통근을 모두 세후 연간 금액으로 환산해 "실제로 얼마나 더 받는 것인지"를 비교합니다. 연봉 인상액이 실수령으로는 얼마인지, 통근 시간까지 돈으로 치면 어느 쪽이 나은지 보여줍니다.',
  note: '연봉에 퇴직금이 포함(13분할)된 곳은 실제 기본 연봉이 12/13이므로 해당 옵션을 켜세요. 성과급은 세전 예상액을 넣으면 한계세율(지방소득세 포함)로 세후 환산합니다. 통근 시간 가치는 시급(연봉 ÷ 2,080시간)의 절반으로 계산했으며 0으로 바꿀 수 있습니다. 중소기업 청년 소득세 감면(34세 이하, 5년간 90%, 연 200만원 한도)은 새 직장이 중소기업이면 이어서 받을 수 있습니다. 수습 기간 감액·사이닝 보너스·스톡옵션은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root, '세후 총보상 비교');
    const side = (k, label, def) => [
      { id: k + 'Salary', p: k === 'a' ? 'salary' : undefined, label: `${label} · 연봉 (세전, 고정상여 포함)`, type: 'money', unit: '원', value: def.salary },
      { id: k + 'Incl', label: `${label} · 연봉에 퇴직금 포함 (13분할)`, type: 'check', value: false },
      { id: k + 'Bonus', label: `${label} · 연간 성과급 예상 (세전)`, type: 'money', unit: '원', value: def.bonus },
      { id: k + 'Welfare', label: `${label} · 복지포인트·식대·기타 비과세 지원 (연)`, type: 'money', unit: '원', value: def.welfare },
      { id: k + 'Leave', label: `${label} · 연차 일수`, type: 'number', unit: '일', value: def.leave, min: 0 },
      { id: k + 'Commute', label: `${label} · 편도 통근 시간`, type: 'number', unit: '분', value: def.commute, min: 0 },
      { id: k + 'CommuteCost', label: `${label} · 월 통근 비용`, type: 'money', unit: '원', value: def.cost },
      { id: k + 'Sme', p: k === 'a' ? 'sme' : undefined, label: `${label} · 중소기업 (청년 소득세 감면)`, type: 'check', value: def.sme },
    ];
    const prof = HT.profile.get(); const offerDefault = prof.salary > 0 ? Math.round(prof.salary * 1.15 / 1e5) * 1e5 : 58000000; // 대시보드 연봉이 있으면 제안은 15% 인상으로 시작
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '나이 (만)', type: 'number', unit: '세', value: 30, min: 18, max: 70 },
      { id: 'fam', label: '부양가족 수 (본인 포함)', type: 'number', unit: '명', value: 1, min: 1 },
      { id: 'timeValue', label: '통근 시간 가치 (시급 대비)', type: 'number', unit: '%', value: 50, min: 0, max: 100, help: '0이면 시간은 돈으로 치지 않음' },
      { id: 'workdays', label: '연간 출근일', type: 'number', unit: '일', value: 240, min: 0 },
      ...side('a', '현 직장', { salary: 50000000, bonus: 2000000, welfare: 1200000, leave: 15, commute: 40, cost: 100000, sme: false }),
      ...side('b', '이직 제안', { salary: offerDefault, bonus: 3000000, welfare: 600000, leave: 15, commute: 60, cost: 150000, sme: false }),
    ], calc);
    function evalSide(v, k) {
      const gross = v[k + 'Salary']; const base = v[k + 'Incl'] ? gross * 12 / 13 : gross; const sev = base / 12; // 퇴직금 적립 가치 (연 1개월분)
      const pay = HT.payroll.netMonthly(base, v.fam); let relief = 0; if (v[k + 'Sme'] && v.age <= 34) relief = Math.min(pay.tax * .9, 2e6 / 12) * 1.1;
      const netY = (pay.net + relief) * 12;
      const inc = base - HT.payroll.earnedIncomeDeduction(base); const marg = HT.progressive(Math.max(0, inc - 1.5e6 * v.fam - pay.ins.np * 12), HT.INCOME_TAX).rate * 1.1; const bonusNet = v[k + 'Bonus'] * (1 - marg - 0.0895); // 성과급에도 4대보험(약 8.95%)·소득세
      const hourly = base / 2080; const leaveVal = v[k + 'Leave'] * hourly * 8; const commuteHours = v[k + 'Commute'] * 2 / 60 * v.workdays; const commuteTime = commuteHours * hourly * v.timeValue / 100; const commuteCost = v[k + 'CommuteCost'] * 12;
      const total = netY + sev + bonusNet + v[k + 'Welfare'] + leaveVal - commuteCost - commuteTime;
      return { gross, base, netY, relief: relief * 12, sev, bonusNet, welfare: v[k + 'Welfare'], leaveVal, commuteCost, commuteTime, commuteHours, total, marg, ins: pay.ins.total * 12, tax: (pay.tax + pay.local) * 12 };
    }
    function calc(v) {
      const A = evalSide(v, 'a'), B = evalSide(v, 'b'); const d = B.total - A.total;
      const rows = [['기본 연봉 (퇴직금 제외)', A.base, B.base], ['연 실수령액 (4대보험·소득세 차감)', A.netY, B.netY], ['퇴직금 적립 가치 (연 1개월분)', A.sev, B.sev], ['성과급 (세후)', A.bonusNet, B.bonusNet], ['복지·비과세 지원', A.welfare, B.welfare], ['연차 가치 (일수 × 일급)', A.leaveVal, B.leaveVal], ['통근 비용 (연)', -A.commuteCost, -B.commuteCost], [`통근 시간 가치 (연 ${HT.fmt(A.commuteHours, 0)} / ${HT.fmt(B.commuteHours, 0)}시간)`, -A.commuteTime, -B.commuteTime], ['세후 총보상 (연)', A.total, B.total]];
      out.set(HT.kpi(d >= 0 ? '이직 제안이 유리' : '현 직장이 유리', HT.won(Math.abs(d)) + '/년', `월 ${HT.won(Math.abs(d) / 12)} · 세전 연봉 차이 ${HT.won(B.gross - A.gross)}가 세후 총보상으로는 ${HT.won(d)}`),
        HT.kpis([['연봉 인상률 (세전)', HT.pct(A.gross ? (B.gross - A.gross) / A.gross * 100 : 0, 1)], ['실수령 증가 (월)', HT.won((B.netY - A.netY) / 12), `세전 인상분의 ${HT.pct(B.gross - A.gross ? (B.netY - A.netY) / (B.gross - A.gross) * 100 : 0, 0)}만 손에 들어옴`], ['제안 쪽 한계세율', HT.pct(B.marg * 100, 1), '인상분 1원당 세금 비율']]),
        HT.barChart([{ label: '현 직장', value: A.total, color: 'var(--g3)' }, { label: '이직 제안', value: B.total, color: d >= 0 ? 'var(--c1)' : 'var(--g2)' }], { fmt: HT.wonKor, cap: '세후 연간 총보상' }),
        HT.table(['항목', '현 직장', '이직 제안', '차이'], rows.map(r => [r[0], HT.won(r[1]), HT.won(r[2]), (r[2] - r[1] >= 0 ? '+' : '') + HT.won(r[2] - r[1])]), { right: [1, 2, 3], scroll: false, hi: r => r[0].startsWith('세후 총보상') }),
        HT.el('div', { class: 'note', html: `<b>협상 포인트</b> 세전 연봉 ${HT.won(B.gross - A.gross)} 인상은 세후로 월 ${HT.won((B.netY - A.netY) / 12)}입니다. 같은 효과를 내려면 복지포인트·식대(비과세)나 연차 추가가 세금이 없어 효율이 높습니다. 통근 편도 ${v.bCommute}분은 연 ${HT.fmt(B.commuteHours, 0)}시간으로 시급 기준 ${HT.wonKor(B.commuteTime)}의 가치입니다. 이직 첫해에는 연차가 비례 발생(입사 후 1년 미만 월 1일)하고 퇴직금은 1년 근속 후부터 생기므로 첫해 총보상은 표보다 적습니다.` }));
    }
    calc(f.values());
  }
});
