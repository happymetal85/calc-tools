HT.register({
  id: 'salary-to-hourly', cat: '급여·소득', order: 3, name: '연봉-시급 변환기', keywords: '시급 연봉 월급 최저임금 209시간',
  desc: '연봉과 시급을 서로 바꾸고 일급·주급·월급으로 환산합니다. 2026년 최저임금과도 비교합니다.',
  note: '세전 기준이라 실수령액과 다릅니다. 월급은 월 소정근로시간 209시간(주 40시간 + 주휴 8시간) 기준으로도 함께 보여줍니다. 2026년 최저임금은 시급 10,320원, 월 2,156,880원(209시간)입니다. 연장·야간·휴일근로는 통상임금의 50% 이상을 가산합니다.',
  render(root) {
    const MIN = 10320; const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'mode', label: '변환 방식', type: 'seg', options: [['s2h', '연봉 → 시급'], ['h2s', '시급 → 연봉']], value: 's2h' },
      { id: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 36000000, show: v => v.mode === 's2h' },
      { id: 'hourly', label: '시급', type: 'money', unit: '원', value: 12000, show: v => v.mode === 'h2s' },
      { id: 'hpw', label: '주당 근무시간', type: 'number', unit: '시간', value: 40, min: 1 },
      { id: 'wpy', label: '연간 근무주수', type: 'number', unit: '주', value: 52, min: 1 },
    ], calc);
    function calc(v) {
      const hoursY = v.hpw * v.wpy; let hourly, salary;
      if (v.mode === 's2h') { salary = v.salary; hourly = salary / hoursY; } else { hourly = v.hourly; salary = hourly * hoursY; }
      const daily = hourly * Math.min(8, v.hpw / 5 * 1), weekly = hourly * v.hpw, monthly = salary / 12; const m209 = hourly * 209;
      const ok = hourly >= MIN;
      out.set(HT.kpi(v.mode === 's2h' ? '시급' : '연봉', HT.won(v.mode === 's2h' ? hourly : salary), `연 ${HT.fmt(hoursY)}시간 근무 기준`),
        HT.rows([['시급', HT.won(hourly)], ['일급', HT.won(daily), '', `${HT.fmt(Math.min(8, v.hpw / 5), 1)}시간 기준`], ['주급', HT.won(weekly)], ['월급 (연봉 ÷ 12)', HT.won(monthly)], ['월급 (209시간 환산)', HT.won(m209), 'sub', '주 40시간 + 주휴수당 8시간'], ['연봉', HT.won(salary), 'strong'], ['최저임금 비교', HT.badge(ok ? `최저임금 이상 (${HT.won(MIN)})` : `최저임금 미만 (${HT.won(MIN)})`, ok ? 'ok' : 'danger')]]));
    }
    calc(f.values());
  }
});
