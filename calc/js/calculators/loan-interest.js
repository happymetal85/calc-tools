HT.register({
  id: 'loan-interest', cat: '금융·투자', order: 6, name: '대출이자 계산기', keywords: '대출 이자 원리금균등 원금균등 만기일시 상환 스케줄',
  desc: '원리금균등·원금균등·만기일시 상환 방식별 월 납입금과 총이자를 계산하고 회차별 상환 일정을 보여줍니다.',
  note: '실제 대출에는 중도상환수수료·취급수수료·인지세 등 부대비용이 더 붙을 수 있습니다. 월 상환액이 가계 소득의 30~40%를 넘지 않는지 확인하는 것이 건전한 재무 관리의 기본입니다. 거치기간은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'method', label: '상환 방식', type: 'seg', options: [['equal', '원리금균등'], ['principal', '원금균등'], ['bullet', '만기일시']], value: 'equal' },
      { id: 'amt', label: '대출금액', type: 'money', unit: '원', value: 100000000 },
      { id: 'rate', label: '연이율', type: 'number', unit: '%', value: 3.6, step: 0.01 },
      { id: 'months', label: '대출기간', type: 'number', unit: '개월', value: 360, min: 1 },
    ], calc);
    function calc(v) {
      const P = v.amt, n = Math.max(1, Math.round(v.months)), r = v.rate / 100 / 12; const sched = []; let bal = P, totalI = 0;
      for (let k = 1; k <= n; k++) { let pay, int = bal * r, prin;
        if (v.method === 'equal') { pay = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n; prin = pay - int; }
        else if (v.method === 'principal') { prin = P / n; pay = prin + int; }
        else { prin = k === n ? P : 0; pay = int + prin; }
        bal -= prin; totalI += int; sched.push([k, pay, prin, int, Math.max(0, bal)]); }
      const first = sched[0][1], last = sched[n - 1][1];
      const yearly = []; for (let y = 0; y < n; y += 12) { const chunk = sched.slice(y, y + 12); yearly.push({ label: (y / 12 + 1) + '년', prin: chunk.reduce((a, s) => a + s[2], 0), int: chunk.reduce((a, s) => a + s[3], 0) }); }
      out.set(HT.kpi(v.method === 'equal' ? '월 납입금' : '첫 달 납입금', HT.won(first), v.method === 'equal' ? '매월 동일' : `마지막 달 ${HT.won(last)}`),
        HT.rows([['대출금액', HT.won(P)], ['총 이자', HT.won(totalI), '', `연 ${v.rate}% · ${n}개월`], ['총 상환금액', HT.won(P + totalI), 'strong'], v.method === 'principal' ? ['월 원금', HT.won(P / n), 'sub'] : null, v.method === 'bullet' ? ['월 이자', HT.won(P * r), 'sub', '만기에 원금 일시 상환'] : null]),
        HT.stackChart(yearly.map(y => y.label), [{ name: '원금', color: 'var(--g3)', values: yearly.map(y => y.prin) }, { name: '이자', color: 'var(--c1)', values: yearly.map(y => y.int) }], { fmt: HT.wonKor, cap: '연도별 상환액 구성' }),
        HT.table(['회차', '납입금', '원금', '이자', '잔액'], sched.map(s => [s[0], HT.won(s[1]), HT.won(s[2]), HT.won(s[3]), HT.won(s[4])]), { right: [1, 2, 3, 4] }));
    }
    calc(f.values());
  }
});
