/* 은퇴 시뮬레이터 (FIRE) — 저축·수익률·국민연금(2026 개혁 반영)으로 은퇴 가능 나이와 자산 소진 시점을 계산
   국민연금: 기본연금액(연) = 1.29 × (A + B) × (1 + 0.05 × (가입연수 − 20)) — 2026년 비례상수(소득대체율 43%), A값 3,193,511원(2026)
   수급개시연령: 1961~64년생 63세, 1965~68년생 64세, 1969년생 이후 65세. 모든 금액은 현재 가치(실질) 기준 */
HT.register({
  id: 'retirement-fire', cat: '금융·투자', order: 0.5, name: '은퇴 시뮬레이터 (FIRE)', keywords: '은퇴 FIRE 국민연금 예상수령액 노후 자산 소진 4% 룰',
  desc: '현재 자산·월 저축·수익률과 은퇴 후 생활비, 국민연금 예상액을 넣으면 목표 나이에 은퇴해도 자산이 기대수명까지 버티는지, 가장 빨리 은퇴할 수 있는 나이는 언제인지, 무엇을 바꾸면 얼마나 앞당겨지는지 계산합니다.',
  note: '모든 금액은 오늘의 물가 기준(실질 가치)이며 수익률에서 물가상승률을 뺀 실질 수익률로 굴립니다. 국민연금은 2026년 개혁(소득대체율 43%, 비례상수 1.29, A값 3,193,511원)을 가입기간 전체에 단순 적용한 근사치라 실제 예상연금(국민연금공단 조회)과 차이가 날 수 있습니다. 4% 룰은 "은퇴 첫해 자산의 4%를 매년 인출해도 30년 이상 버틴다"는 경험칙이며 보장이 아닙니다. 퇴직연금·개인연금은 월 수령액을 직접 입력하세요.',
  render(root) {
    const out = HT.output(root, '은퇴 진단');
    const A_VALUE = 3193511;
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '현재 나이', type: 'number', unit: '세', value: 35, min: 18, max: 80 },
      { id: 'birth', p: 'birth', label: '출생연도', type: 'number', unit: '년', value: 1991, min: 1940, max: 2010 },
      { id: 'retire', label: '목표 은퇴 나이', type: 'number', unit: '세', value: 55, min: 30, max: 80 },
      { id: 'life', label: '기대수명 (자산이 버텨야 하는 나이)', type: 'number', unit: '세', value: 90, min: 60, max: 110 },
      { id: 'assets', p: 'assets', label: '현재 금융자산', type: 'money', unit: '원', value: 100000000 },
      { id: 'save', label: '월 저축·투자액 (은퇴 전)', type: 'money', unit: '원', value: 1500000 },
      { id: 'ret1', label: '은퇴 전 연 수익률 (명목)', type: 'number', unit: '%', value: 6, step: 0.5 },
      { id: 'ret2', label: '은퇴 후 연 수익률 (명목, 보수적으로)', type: 'number', unit: '%', value: 4, step: 0.5 },
      { id: 'infl', label: '물가상승률', type: 'number', unit: '%', value: 2.5, step: 0.1 },
      { id: 'spend', label: '은퇴 후 월 생활비 (현재 물가 기준)', type: 'money', unit: '원', value: 3000000 },
      { id: 'npsYears', label: '국민연금 총 가입기간 (은퇴 시점까지 예상)', type: 'number', unit: '년', value: 30, min: 0, max: 45, help: '10년 미만이면 연금 없음(반환일시금)' },
      { id: 'income', label: '본인 평균 소득월액 (세전, 가입기간 평균)', type: 'money', unit: '원', value: 4500000, help: '기준소득월액 상한 659만원' },
      { id: 'other', label: '퇴직연금·개인연금 월 수령액 (현재 가치)', type: 'money', unit: '원', value: 500000 },
      { id: 'otherAge', label: '그 연금 수령 시작 나이', type: 'number', unit: '세', value: 60, min: 40, max: 80 },
    ], calc);
    function npsAge(birth) { return birth <= 1952 ? 60 : birth <= 1956 ? 61 : birth <= 1960 ? 62 : birth <= 1964 ? 63 : birth <= 1968 ? 64 : 65; }
    function npsMonthly(v) { if (v.npsYears < 10) return 0; const B = Math.min(v.income, 6590000); const n = v.npsYears; return 1.29 * (A_VALUE + B) * (1 + 0.05 * Math.max(0, n - 20)) * Math.min(1, n / 20) / 12 * (n < 20 ? 1 : 1); }
    /* 가입 20년 미만은 (1+0.05(n−20))이 1 미만이 아니라 감액 없이 비례 — 법정 산식은 20년 기준 완전연금에 가입연수 비례. 위 식은 20년 미만을 n/20 비례로 근사 */
    function simulate(v, retireAge) {
      const r1 = (1 + v.ret1 / 100) / (1 + v.infl / 100) - 1, r2 = (1 + v.ret2 / 100) / (1 + v.infl / 100) - 1; const nps = npsMonthly(v), npsStart = npsAge(v.birth);
      let a = v.assets; const path = []; let runOut = null;
      for (let age = v.age; age <= v.life; age++) {
        path.push({ age, assets: a });
        if (age < retireAge) { a = a * (1 + r1) + v.save * 12 * (1 + r1 / 2); }
        else { const income = (age >= npsStart ? nps : 0) + (age >= v.otherAge ? v.other : 0); const need = Math.max(0, v.spend - income) * 12; a = a * (1 + r2) - need; if (a < 0 && runOut === null) runOut = age; if (a < 0) a = Math.min(a, 0); }
      }
      return { path, runOut, nps, npsStart, atRetire: path.find(p => p.age === retireAge)?.assets ?? a, r1, r2 };
    }
    function earliest(v) { for (let age = v.age; age <= v.life; age++) { if (simulate(v, age).runOut === null) return age; } return null; }
    function calc(v) {
      if (v.retire <= v.age) { out.set(HT.el('div', { class: 'empty' }, '은퇴 나이는 현재 나이보다 커야 합니다.')); return; }
      const S = simulate(v, v.retire); const early = earliest(v);
      const gap = Math.max(0, v.spend - S.nps - v.other); const need4 = gap * 12 / 0.04; const gapBeforeNps = Math.max(0, v.spend - (v.retire >= v.otherAge ? v.other : 0));
      const ok = S.runOut === null;
      const sens = [['현재 계획', early], ['월 저축 +50만원', earliest({ ...v, save: v.save + 5e5 })], ['은퇴 후 생활비 −50만원', earliest({ ...v, spend: v.spend - 5e5 })], ['은퇴 전 수익률 +2%p', earliest({ ...v, ret1: v.ret1 + 2 })], ['은퇴 전 수익률 −2%p', earliest({ ...v, ret1: v.ret1 - 2 })], ['국민연금 가입 +5년', earliest({ ...v, npsYears: v.npsYears + 5 })], ['현재 자산 +5,000만원', earliest({ ...v, assets: v.assets + 5e7 })]];
      const labels = S.path.filter((p, i) => i % 5 === 0 || p.age === v.retire).map(p => p.age + '세'); const vals = S.path.filter((p, i) => i % 5 === 0 || p.age === v.retire).map(p => Math.max(0, p.assets));
      out.set(HT.kpi(ok ? `${v.retire}세 은퇴 가능` : `${v.retire}세 은퇴 시 ${S.runOut}세에 자산 소진`, early ? `가장 빠른 은퇴 ${early}세` : `${v.life}세까지 버티는 은퇴 나이 없음`, `은퇴 시점 자산 ${HT.wonKor(S.atRetire)} (현재 가치) · 기대수명 ${v.life}세 기준`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(ok ? `${v.life}세까지 자산 유지` : `${S.runOut}세 소진 — ${v.life - S.runOut}년 부족`, ok ? 'ok' : 'danger'), ' ', HT.badge(`4% 룰 필요 자산 ${HT.wonKor(need4)}`, S.atRetire >= need4 ? 'ok' : 'warn')]),
        HT.kpis([['국민연금 예상액 (월, 현재 가치)', HT.won(S.nps), `${S.npsStart}세부터 · 가입 ${v.npsYears}년`], ['은퇴 후 월 부족액', HT.won(gap), `생활비 − 국민연금 − 기타연금 (${S.npsStart}세 이후)`], [`${v.retire}~${S.npsStart - 1}세 월 부족액`, HT.won(gapBeforeNps), '국민연금 받기 전 공백기']]),
        HT.lineChart(labels, vals, { fmt: HT.wonKor, cap: `나이별 금융자산 (현재 가치) · 실질 수익률 은퇴 전 ${HT.pct(S.r1 * 100, 2)} / 후 ${HT.pct(S.r2 * 100, 2)}` }),
        HT.el('h3', {}, '무엇을 바꾸면 은퇴가 얼마나 빨라지나'),
        HT.table(['변화', '가장 빠른 은퇴 나이', '차이'], sens.map(([l, a]) => [l, a ? a + '세' : '불가', a && early ? (a === early ? '변화 없음' : a < early ? `${early - a}년 앞당김` : `${a - early}년 늦어짐`) : '-']), { right: [1, 2], scroll: false, hi: (r, i) => i === 0 }),
        HT.el('h3', { style: 'margin-top:16px' }, '5년 단위 자산 추이'),
        HT.table(['나이', '금융자산 (현재 가치)', '단계'], S.path.filter((p, i) => i % 5 === 0 || p.age === v.retire || p.age === S.npsStart).map(p => [p.age + '세', HT.won(Math.max(0, p.assets)), p.age < v.retire ? '적립' : p.age < S.npsStart ? '인출 (연금 전 공백기)' : '인출 + 국민연금']), { right: [1], hi: r => HT.num(r[0]) === v.retire }));
    }
    calc(f.values());
  }
});
