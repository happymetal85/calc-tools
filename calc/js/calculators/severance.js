HT.register({
  id: 'severance', cat: '급여·소득', order: 2, name: '퇴직금 계산기', keywords: '퇴직금 평균임금 퇴직소득세',
  desc: '입사일·퇴사일과 최근 3개월 임금으로 1일 평균임금과 예상 퇴직금, 퇴직소득세를 계산합니다.',
  note: '퇴직금은 1년 이상 계속 근로한 근로자에게 지급되며, 퇴직일부터 14일 안에 지급해야 합니다(지연 시 연 20% 이자). 평균임금이 통상임금보다 적으면 통상임금으로 계산합니다. 상여금·연차수당은 퇴직 전 1년치의 3/12을 3개월 임금에 더합니다. IRP 계좌로 받으면 퇴직소득세 납부가 연금 수령 시점까지 미뤄지고 30~40% 감면됩니다.',
  render(root) {
    const out = HT.output(root);
    const today = new Date().toISOString().slice(0, 10);
    const f = HT.form(root, [
      { id: 'd1', label: '입사일', type: 'date', value: '2019-01-02' },
      { id: 'd2', label: '퇴사일 (마지막 근무일 다음 날)', type: 'date', value: today },
      { id: 'base', label: '월 기본급 (퇴직 전 3개월 평균)', type: 'money', unit: '원', value: 3500000 },
      { id: 'bonus', label: '연간 상여금', type: 'money', unit: '원', value: 4000000 },
      { id: 'leave', label: '연차수당 (연간)', type: 'money', unit: '원', value: 800000 },
    ], calc);
    function calc(v) {
      const days = HT.daysBetween(v.d1, v.d2); if (days <= 0) { out.set(HT.el('div', { class: 'empty' }, '퇴사일이 입사일보다 뒤여야 합니다.')); return; }
      const end = new Date(v.d2); const start3 = new Date(end); start3.setMonth(start3.getMonth() - 3); const days3 = Math.round((end - start3) / 864e5);
      const wage3 = v.base * 3 + v.bonus * 3 / 12 + v.leave * 3 / 12; let avg = wage3 / days3; const ordinary = v.base / 209 * 8; let used = '평균임금';
      if (ordinary > avg) { avg = ordinary; used = '통상임금 (평균임금보다 커서 적용)'; }
      const years = days / 365; const sev = years >= 1 ? avg * 30 * years : 0;
      const yy = Math.floor(days / 365), mm = Math.floor((days % 365) / 30), dd = days - yy * 365 - mm * 30;
      // 퇴직소득세
      const n = Math.ceil(days / 365); const svcDed = n <= 5 ? 1e6 * n : n <= 10 ? 5e6 + 2e6 * (n - 5) : n <= 20 ? 15e6 + 2.5e6 * (n - 10) : 40e6 + 3e6 * (n - 20);
      const conv = Math.max(0, sev - svcDed) / n * 12;
      const convDed = conv <= 8e6 ? conv : conv <= 7e7 ? 8e6 + (conv - 8e6) * .6 : conv <= 1e8 ? 45.2e6 + (conv - 7e7) * .55 : conv <= 3e8 ? 61.7e6 + (conv - 1e8) * .45 : 151.7e6 + (conv - 3e8) * .35;
      const base = Math.max(0, conv - convDed); const convTax = HT.progressive(base, HT.INCOME_TAX).tax; const tax = convTax / 12 * n; const local = tax * 0.1;
      out.set(HT.kpi('예상 퇴직금 (세전)', HT.won(sev), years < 1 ? '근속 1년 미만은 퇴직금 지급 대상이 아닙니다' : `세후 약 ${HT.won(sev - tax - local)}`),
        HT.rows([['총 근무기간', `${yy}년 ${mm}개월 ${dd}일`, '', `총 ${HT.fmt(days)}일`], ['퇴직 전 3개월 임금총액', HT.won(wage3), '', `기본급 3개월 + 상여 3/12 + 연차수당 3/12 · ${days3}일`], ['1일 평균임금', HT.won(avg), '', used], ['퇴직금', HT.won(sev), 'strong', '1일 평균임금 × 30일 × (근속일수 ÷ 365)'], ['근속연수공제', '-' + HT.won(svcDed), 'sub', `근속 ${n}년`], ['환산급여 / 환산급여공제', `${HT.won(conv)} / ${HT.won(convDed)}`, 'sub'], ['퇴직소득 과세표준', HT.won(base), 'sub'], ['퇴직소득세', HT.won(tax), '', '환산산출세액 ÷ 12 × 근속연수'], ['지방소득세', HT.won(local), 'sub'], ['세후 수령액', HT.won(sev - tax - local), 'strong']]));
    }
    calc(f.values());
  }
});
