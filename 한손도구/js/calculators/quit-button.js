/* 퇴사 버튼 — 지금 그만두면 몇 개월 버티나: 비상금 + 퇴직금 + 실업급여(비자발 퇴사만) vs 월 지출 + 건강보험 지역가입 전환
   2026 구직급여: 평균임금(퇴직 전 3개월)의 60%, 1일 상한 68,100원(5.12 이후 이직자) · 하한 66,048원(최저임금 80%)
   소정급여일수: 50세 미만 — 가입 1년 미만 120일 · 1~3년 150 · 3~5년 180 · 5~10년 210 · 10년 이상 240 / 50세 이상·장애인 — 120 · 180 · 210 · 240 · 270 */
HT.register({
  id: 'quit-button', cat: '급여·소득', order: 0.6, original: false, name: '퇴사 버튼 (몇 개월 버티나)', keywords: '퇴사 버티기 실업급여 구직급여 퇴직금 비상금 런웨이 몇 개월',
  desc: '지금 퇴사하면 비상금·퇴직금·실업급여로 몇 개월을 버틸 수 있는지, 그 사이 건강보험료는 얼마나 오르는지 계산합니다. 자발적 퇴사와 권고사직·계약만료(실업급여 대상)를 나눠 봅니다.',
  note: '실업급여(구직급여)는 비자발적 이직(권고사직·계약만료·폐업 등)일 때만 받을 수 있고, 자발적 퇴사는 원칙적으로 받지 못합니다. 2026년 기준 1일 상한 68,100원(5월 12일 이후 이직자), 하한 66,048원이며 퇴직 전 3개월 평균임금의 60%입니다. 퇴직금은 1년 이상 근속 시 발생하고 여기서는 세전 기준 1개월 급여 × 근속연수로 단순 계산했습니다(정확한 값은 퇴직금 계산기). 퇴사 후 건강보험은 지역가입자로 바뀌어 보험료가 달라지며 "임의계속가입"으로 직장 보험료를 최대 36개월 유지할 수 있습니다. 국민연금은 납부예외 신청이 가능합니다.',
  render(root) {
    const out = HT.output(root, '버티기 계산');
    const prof = HT.profile.get(); const spendDefault = (prof.rent || 0) + (prof.fixed || 0) + (prof.living || 0) || 1800000;
    const f = HT.form(root, [
      { id: 'assets', p: 'assets', label: '지금 쓸 수 있는 돈 (현금·예적금)', type: 'money', unit: '원', value: 20000000 },
      { id: 'spend', label: '월 지출 (주거·고정·생활비)', type: 'money', unit: '원', value: spendDefault, help: '대시보드의 주거비+고정지출+생활비' },
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'years', label: '현 직장 근속', type: 'number', unit: '년', value: 3, min: 0, step: 0.5 },
      { id: 'age', p: 'age', label: '나이', type: 'number', unit: '세', value: 32, min: 18, max: 70 },
      { id: 'reason', label: '퇴사 유형', type: 'seg', options: [['vol', '자발적 퇴사'], ['invol', '권고사직·계약만료 (실업급여)']], value: 'vol' },
      { id: 'hiNow', label: '지금 내는 건강보험료 (월, 본인 부담)', type: 'money', unit: '원', value: 0, help: '0이면 연봉으로 자동 계산' },
      { id: 'hiAfter', label: '퇴사 후 건강보험료 (월, 지역가입 예상)', type: 'money', unit: '원', value: 150000, help: '재산·차 없는 1인은 약 7~15만원, 임의계속가입 시 직장 보험료 유지' },
      { id: 'debt', label: '월 대출 상환액 (있으면)', type: 'money', unit: '원', value: 0 },
      { id: 'cut', label: '퇴사 후 지출 절감', type: 'number', unit: '%', value: 15, min: 0, max: 60, help: '출퇴근·점심·의류비 등 줄어드는 몫' },
    ], calc);
    function calc(v) {
      const r = HT.payroll.netMonthly(v.salary); const hiNow = v.hiNow || r.ins.hi + r.ins.ltc; const sev = v.years >= 1 ? v.salary / 12 * v.years : 0;
      let ui = 0, uiDays = 0, uiDaily = 0, uiMonths = 0;
      if (v.reason === 'invol' && v.years >= 0.5) { const daily = HT.clamp(v.salary / 365 * 0.6, 66048, 68100); uiDaily = daily; const y = v.years; uiDays = v.age < 50 ? (y < 1 ? 120 : y < 3 ? 150 : y < 5 ? 180 : y < 10 ? 210 : 240) : (y < 1 ? 120 : y < 3 ? 180 : y < 5 ? 210 : y < 10 ? 240 : 270); ui = daily * uiDays; uiMonths = uiDays / 30; }
      const monthly = v.spend * (1 - v.cut / 100) + v.debt + v.hiAfter; const uiPerMonth = uiMonths ? ui / uiMonths : 0;
      // 월별 잔액 시뮬레이션
      let bal = v.assets + sev; const path = []; let months = 0; for (let m = 1; m <= 120; m++) { bal += (m <= uiMonths ? uiPerMonth : 0) - monthly; path.push(Math.max(0, bal)); if (bal < 0) { months = m - 1 + (bal + monthly) / monthly; break; } months = m; }
      const kind = months >= 12 ? 'ok' : months >= 6 ? 'warn' : 'danger';
      const share = `지금 퇴사하면 ${HT.fmt(months, 1)}개월 버팁니다 (비상금 ${HT.wonKor(v.assets)} + 퇴직금 ${HT.wonKor(sev)}${ui ? ' + 실업급여 ' + HT.wonKor(ui) : ''}, 월 ${HT.won(monthly)} 지출) — 한손도구 퇴사 버튼`;
      const btns = HT.shareButtons(share, { title: '지금 퇴사하면', big: `${HT.fmt(months, 1)}개월 버팀`, lines: [`비상금 ${HT.wonKor(v.assets)} + 퇴직금 ${HT.wonKor(sev)}${ui ? ' + 실업급여 ' + HT.wonKor(ui) : ''}`, `퇴사 후 월 지출 ${HT.won(monthly)}`], file: 'quit' });
      const labels = path.map((_, i) => (i + 1) + '개월').filter((_, i) => i % Math.max(1, Math.ceil(path.length / 12)) === 0 || i === path.length - 1); const vals = path.filter((_, i) => i % Math.max(1, Math.ceil(path.length / 12)) === 0 || i === path.length - 1);
      out.set(HT.kpi('지금 퇴사하면', `${HT.fmt(months, 1)}개월 버팀`, `월 ${HT.won(monthly)} 쓴다고 보면 · 권장 6개월 이상`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(months >= 12 ? '1년 이상 — 여유' : months >= 6 ? '6개월 이상 — 준비됨' : months >= 3 ? '3~6개월 — 빠듯' : '3개월 미만 — 위험', kind), ' ', v.reason === 'vol' ? HT.badge('자발적 퇴사 — 실업급여 없음', 'gray') : HT.badge(`실업급여 ${uiDays}일 × ${HT.won(uiDaily)} = ${HT.wonKor(ui)}`, 'ok'), ' ', HT.badge(`건강보험 ${HT.won(hiNow)} → ${HT.won(v.hiAfter)}/월`, v.hiAfter > hiNow ? 'warn' : 'gray')]),
        HT.kpis([['쓸 수 있는 돈', HT.wonKor(v.assets + sev + ui), `비상금 ${HT.wonKor(v.assets)} + 퇴직금 ${HT.wonKor(sev)} + 실업급여 ${HT.wonKor(ui)}`], ['퇴사 후 월 지출', HT.won(monthly), `생활비 ${HT.won(v.spend * (1 - v.cut / 100))} + 대출 ${HT.won(v.debt)} + 건보 ${HT.won(v.hiAfter)}`], ['지금 실수령 대비', HT.pct(r.net ? monthly / r.net * 100 : 0, 0), `월 실수령 ${HT.won(r.net)}`]]),
        HT.lineChart(labels, vals, { fmt: HT.wonKor, cap: '퇴사 후 통장 잔액 추이' }),
        HT.rows([['퇴직금 (세전, 단순)', HT.won(sev), '', v.years < 1 ? '근속 1년 미만 — 퇴직금 없음' : `월급 ${HT.won(v.salary / 12)} × ${v.years}년 · 정확한 값은 <a href="#/severance">퇴직금 계산기</a>`], ['실업급여', HT.won(ui), '', v.reason === 'vol' ? '자발적 퇴사는 대상 아님 (예외: 임금체불·괴롭힘 등)' : `평균임금 60% → 1일 ${HT.won(uiDaily)} (상한 68,100 · 하한 66,048) × ${uiDays}일`], ['건강보험 변화', `${HT.won(hiNow)} → ${HT.won(v.hiAfter)}`, '', '임의계속가입 신청 시 직장 보험료로 최대 36개월 유지'], ['국민연금', '납부예외 가능', 'sub', '가입기간에서는 빠짐 — 나중에 추납 가능'], ['6개월 버티려면 필요한 돈', HT.won(monthly * 6 - sev - ui), monthly * 6 - sev - ui > v.assets ? 'neg' : 'pos', `지금 ${v.assets >= monthly * 6 - sev - ui ? '충분' : HT.wonKor(monthly * 6 - sev - ui - v.assets) + ' 부족'}`]]),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('div', { class: 'note', html: `<b>퇴사 전 체크</b> ① 연차 정산·미사용 연차수당 ② 퇴직금은 퇴직 후 14일 안에 지급 ③ 건강보험 임의계속가입은 퇴직 후 2개월 안에 신청 ④ 실업급여는 이직일 다음 날부터 12개월 안에 다 받아야 함 ⑤ 이직 제안이 있다면 <a href="#/job-offer-compare">이직 제안 비교</a>로 총보상을 먼저 확인.` }));
    }
    calc(f.values());
  }
});
