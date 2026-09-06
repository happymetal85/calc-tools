/* 1억 만들기 시뮬레이터 — 사회초년생 자산 형성
   실수령액 → 저축 여력 → 정책상품 순서대로 배분(물 붓기) → 목표 도달 시점. 3가지 전략 비교 + 민감도.
   2026.9 기준 상품 조건:
   · 청년미래적금: 19~34세, 총급여 7,500만 이하, 월 50만·3년, 기본 5.0% + 우대 최대 3.0%p, 비과세,
     정부기여금 납입액의 12%(총급여 3,600만 이하) / 6%(6,000만 이하) / 0%(6,000~7,500만). 2026.6.22 출시(청년도약계좌 후속)
   · 청년 주택드림 청약통장: 19~34세 무주택, 총급여 5,000만 이하, 최고 4.5%, 월 100만 한도, 5년 이상 유지 시 비과세
   · ISA: 연 납입 4,000만(총 2억), 비과세 일반 500만 · 서민형(총급여 5,000만 이하) 1,000만, 초과분 9.9% 분리과세
   · 중소기업 취업 청년 소득세 감면: 34세 이하, 5년간 90%, 연 200만원 한도 (2026.12.31까지 취업자) */
HT.register({
  id: 'first-100m', cat: '금융·투자', order: 0, name: '1억 만들기 시뮬레이터', keywords: '1억 모으기 사회초년생 청년미래적금 청약 ISA 저축 목돈',
  desc: '사회초년생이 연봉과 지출을 넣으면 저축 여력을 계산하고, 청년미래적금·청약통장·ISA·투자 순으로 돈을 배분하는 세 가지 전략으로 목표 금액(기본 1억원)까지 걸리는 기간을 비교합니다. 월별 실행 계획과 "무엇을 바꾸면 얼마나 빨라지는지"도 보여줍니다.',
  note: '투자 수익률은 보장이 아니라 가정이며 해마다 크게 달라집니다. 결과의 "투자수익"은 기대값이고 손실이 날 수도 있습니다. 청년미래적금은 2026년 6월 22일부터 7월 3일까지 첫 가입 신청을 받았고 추가 모집 여부는 금융위원회 안내를 확인해야 합니다. 청약통장 돈은 당첨 전에는 꺼내 쓰기 어려우므로 목표 기간 안에 쓸 돈이면 납입액을 줄이세요. 세금은 예적금 이자 15.4%, 비과세 계좌 0%, ISA 한도 초과분 9.9%, 일반 투자 수익 15.4%(국내 주식 매매차익은 실제로는 비과세)를 단순 적용했습니다. 연봉·지출은 해마다 입력한 비율로 오른다고 가정합니다.',
  render(root) {
    const out = HT.output(root, '시뮬레이션 결과');
    const f = HT.form(root, [
      { id: 'target', label: '목표 금액', type: 'money', unit: '원', value: 100000000 },
      { id: 'goalYears', label: '목표 기간 (역산용)', type: 'number', unit: '년', value: 5, min: 1, max: 30 },
      { id: 'age', p: 'age', label: '나이 (만)', type: 'number', unit: '세', value: 27, min: 18, max: 60 },
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 36000000 },
      { id: 'sme', p: 'sme', label: '중소기업 재직 (청년 소득세 90% 감면)', type: 'check', value: true },
      { id: 'noHouse', p: 'noHouse', label: '무주택 (청년 주택드림 청약 가능)', type: 'check', value: true },
      { id: 'assets', p: 'assets', label: '현재 모아둔 돈', type: 'money', unit: '원', value: 5000000 },
      { id: 'rent', p: 'rent', label: '월 주거비 (월세·관리비)', type: 'money', unit: '원', value: 500000 },
      { id: 'fixed', p: 'fixed', label: '월 고정지출 (통신·교통·보험·구독)', type: 'money', unit: '원', value: 250000 },
      { id: 'living', p: 'living', label: '월 생활비 (식비·여가 등)', type: 'money', unit: '원', value: 700000 },
      { id: 'raise', label: '연봉 인상률 (연)', type: 'number', unit: '%', value: 4, step: 0.5 },
      { id: 'infl', label: '지출 증가율 (연)', type: 'number', unit: '%', value: 2, step: 0.5 },
      { id: 'strategy', label: '기본 전략 (실행 계획·민감도 기준)', type: 'seg', options: [['s1', '예적금만'], ['s2', '정책상품 풀활용'], ['s3', '정책상품 + 투자']], value: 's3' },
      { id: 'cheongyak', label: '청약통장 월 납입액', type: 'money', unit: '원', value: 200000, help: '월 100만원까지 인정. 당첨 전에는 묶이는 돈', show: v => v.noHouse },
      { id: 'miraeRate', label: '청년미래적금 금리 (기본 5% + 우대)', type: 'number', unit: '%', value: 6.0, step: 0.1 },
      { id: 'depRate', label: '일반 예적금 금리', type: 'number', unit: '%', value: 3.0, step: 0.1 },
      { id: 'invRate', label: '투자 기대수익률 (연)', type: 'number', unit: '%', value: 7, step: 0.5, help: '보수 4% · 기본 7% · 낙관 10%' },
    ], calc);
    const P = HT.payroll; const MAX = 360;
    function eligibility(v) { const young = v.age >= 19 && v.age <= 34; return {
      mirae: young && v.salary <= 7.5e7, miraeGov: v.salary <= 3.6e7 ? .12 : v.salary <= 6e7 ? .06 : 0,
      cheongyak: young && v.noHouse && v.salary <= 5e7, isaLimit: v.salary <= 5e7 ? 1e7 : 5e6, sme: young && v.sme }; }
    function netMonthly(salary, sme) { const r = P.netMonthly(salary); let relief = 0; if (sme) relief = Math.min(r.tax * .9, 2e6 / 12) * 1.1; return { net: r.net + relief, relief }; }
    /* 한 전략 시뮬레이션. opts.saveOverride: 월 저축액 고정(역산용) */
    function run(v, strat, opts = {}) {
      const el = eligibility(v); const inv = strat === 's3'; const initial = v.assets;
      const B = { mirae: 0, cy: 0, isa: 0, dep: 0, inv: 0 }; if (inv) B.inv = initial; else B.dep = initial;
      const T = { principal: initial, interest: 0, gov: 0, invest: 0, taxSaved: 0, relief: 0 }; let isaGain = 0, isaYearIn = 0; const series = []; let reached = null; let plan = null;
      let govAccrued = 0; // 미래적금 기여금은 만기 지급 → 만기 전에는 별도 적립
      for (let k = 1; k <= MAX; k++) {
        const y = Math.floor((k - 1) / 12); if ((k - 1) % 12 === 0) isaYearIn = 0;
        const sal = v.salary * Math.pow(1 + v.raise / 100, y); const nm = netMonthly(sal, el.sme && k <= 60); const exp = (v.rent + v.fixed + v.living) * Math.pow(1 + v.infl / 100, y);
        let save = opts.saveOverride != null ? opts.saveOverride : Math.max(0, nm.net - exp); T.relief += nm.relief;
        const alloc = { mirae: 0, cy: 0, isa: 0, dep: 0, inv: 0 };
        if (strat !== 's1') {
          if (el.mirae && k <= 36) { alloc.mirae = Math.min(save, 5e5); save -= alloc.mirae; }
          if (el.cheongyak) { alloc.cy = Math.min(save, Math.min(v.cheongyak, 1e6)); save -= alloc.cy; }
          const isaCap = Math.max(0, 4e7 - isaYearIn); alloc.isa = Math.min(save, isaCap); save -= alloc.isa; isaYearIn += alloc.isa;
        }
        if (inv) alloc.inv = save; else alloc.dep = save;
        if (k === 1) plan = alloc;
        // 납입
        for (const b in alloc) { B[b] += alloc[b]; T.principal += alloc[b]; }
        govAccrued += alloc.mirae * el.miraeGov;
        // 이자·수익
        const im = B.mirae * v.miraeRate / 100 / 12; B.mirae += im; T.interest += im; T.taxSaved += im * .154;
        const ic = B.cy * 4.5 / 100 / 12; B.cy += ic; T.interest += ic; T.taxSaved += ic * .154;
        const isaRate = inv ? v.invRate : v.depRate; const ii = B.isa * isaRate / 100 / 12; let iiTax = 0; if (isaGain + ii > el.isaLimit) iiTax = Math.max(0, isaGain + ii - Math.max(isaGain, el.isaLimit)) * .099; isaGain += ii; B.isa += ii - iiTax; if (inv) T.invest += ii - iiTax; else T.interest += ii - iiTax; T.taxSaved += ii * .154 - iiTax;
        const id = B.dep * v.depRate / 100 / 12 * (1 - .154); B.dep += id; T.interest += id;
        const iv = B.inv * v.invRate / 100 / 12 * (1 - .154); B.inv += iv; T.invest += iv;
        if (k === 36 && el.mirae && strat !== 's1') { T.gov += govAccrued; const payout = B.mirae + govAccrued; B.mirae = 0; govAccrued = 0; if (inv) B.inv += payout; else B.dep += payout; }
        const total = B.mirae + B.cy + B.isa + B.dep + B.inv + govAccrued;
        if (k % 12 === 0 || k === 1) series.push({ k, principal: T.principal, interest: T.interest, gov: T.gov + govAccrued, invest: T.invest, total });
        if (reached === null && total >= v.target) reached = k;
        if (reached !== null && k % 12 === 0 && k >= reached) break;
      }
      return { months: reached, series, plan, T, B, el, save0: (() => { const nm = netMonthly(v.salary, el.sme); return { net: nm.net, relief: nm.relief, exp: v.rent + v.fixed + v.living, save: Math.max(0, nm.net - (v.rent + v.fixed + v.living)) }; })() };
    }
    const ym = (m) => m == null ? `${MAX / 12}년 넘게 걸림` : `${Math.floor(m / 12)}년 ${m % 12}개월`;
    function calc(v) {
      if (!v.salary || !v.target) { out.set(HT.el('div', { class: 'empty' }, '연봉과 목표 금액을 입력하세요.')); return; }
      const R = { s1: run(v, 's1'), s2: run(v, 's2'), s3: run(v, 's3') }; const base = R[v.strategy]; const s0 = base.save0; const el = base.el;
      const names = { s1: '예적금만', s2: '정책상품 풀활용', s3: '정책상품 + 투자' };
      // 역산: 목표 기간 안에 만들려면 월 저축 얼마
      let lo = 0, hi = 2e7; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const m = run(v, v.strategy, { saveOverride: mid }).months; if (m != null && m <= v.goalYears * 12) hi = mid; else lo = mid; } const needSave = hi;
      // 민감도
      const sens = [['저축 여력 그대로', base.months], ['월 저축 +10만원 (지출 절감)', run({ ...v, living: v.living - 1e5 }, v.strategy).months], ['월 주거비 −20만원', run({ ...v, rent: Math.max(0, v.rent - 2e5) }, v.strategy).months], ['연봉 +300만원', run({ ...v, salary: v.salary + 3e6 }, v.strategy).months], ['연봉 인상률 0%', run({ ...v, raise: 0 }, v.strategy).months], ['투자 수익률 −3%p (보수)', run({ ...v, invRate: v.invRate - 3 }, v.strategy).months], ['투자 수익률 +3%p (낙관)', run({ ...v, invRate: v.invRate + 3 }, v.strategy).months], ['모아둔 돈 +1,000만원', run({ ...v, assets: v.assets + 1e7 }, v.strategy).months]];
      const bestKey = Object.keys(R).reduce((a, b) => (R[b].months ?? 9e9) < (R[a].months ?? 9e9) ? b : a);
      const labels = base.series.map(s => s.k === 1 ? '시작' : (s.k / 12) + '년');
      const planRows = [['청년미래적금 (3년)', base.plan.mirae, el.mirae ? `${v.miraeRate}% 비과세 + 기여금 ${el.miraeGov * 100}%` : '가입 불가'], ['청년 주택드림 청약', base.plan.cy, el.cheongyak ? '4.5% 비과세' : '가입 불가'], ['ISA', base.plan.isa, v.strategy === 's3' ? `투자 ${v.invRate}% · 비과세 ${HT.wonKor(el.isaLimit)}` : `예금 ${v.depRate}% · 비과세 ${HT.wonKor(el.isaLimit)}`], ['일반 예적금', base.plan.dep, `${v.depRate}% (세후 ${HT.fmt(v.depRate * .846, 2)}%)`], ['일반 투자 계좌', base.plan.inv, `${v.invRate}% 기대 (세후 가정)`]].filter(r => r[1] > 0 || r[0].includes('미래') || r[0].includes('청약'));
      out.set(HT.kpi(`${HT.wonKor(v.target)}까지`, ym(base.months), `${names[v.strategy]} 전략 · 월 저축 여력 ${HT.won(s0.save)}` + (bestKey !== v.strategy ? ` · 가장 빠른 전략은 ${names[bestKey]} (${ym(R[bestKey].months)})` : '')),
        HT.kpis([['월 실수령액', HT.won(s0.net), s0.relief ? `청년 소득세 감면 +${HT.won(s0.relief)} 포함` : ''], ['월 지출', HT.won(s0.exp), `저축률 ${HT.pct(s0.net ? s0.save / s0.net * 100 : 0, 0)}`], [`${v.goalYears}년 안에 만들려면`, HT.won(needSave) + '/월', needSave > s0.save ? `지금보다 ${HT.won(needSave - s0.save)} 더` : '지금 여력으로 충분']]),
        HT.barChart(['s1', 's2', 's3'].map(k => ({ label: names[k], value: R[k].months ?? MAX, color: k === v.strategy ? 'var(--c1)' : 'var(--g3)' })), { fmt: x => x >= MAX ? '30년+' : ym(x), padL: 130, cap: '전략별 목표 도달 기간 (짧을수록 좋음)' }),
        HT.stackChart(labels, [{ name: '원금', color: 'var(--g3)', values: base.series.map(s => s.principal) }, { name: '이자', color: 'var(--c2)', values: base.series.map(s => s.interest) }, { name: '정부기여금', color: 'var(--c1)', values: base.series.map(s => s.gov) }, { name: '투자수익', color: 'var(--pair-navy)', values: base.series.map(s => s.invest) }], { fmt: HT.wonKor, cap: `${names[v.strategy]} 전략의 자산 구성` }),
        HT.el('h3', {}, '첫 달 실행 계획 — 어디에 얼마'),
        HT.table(['계좌', '월 납입', '조건'], planRows.map(r => [r[0], r[1] > 0 ? HT.won(r[1]) : '-', r[2]]), { right: [1], scroll: false, hi: r => r[1] !== '-' }),
        HT.el('h3', { style: 'margin-top:16px' }, '도달 시점 요약'),
        HT.rows([['총 납입 원금', HT.wonKor(base.T.principal)], ['이자 (세후)', HT.wonKor(base.T.interest), 'sub'], ['정부기여금 (청년미래적금)', HT.wonKor(base.T.gov), 'sub', base.months != null && base.months < 36 && base.el.mirae ? '만기(3년) 전 도달 — 기여금은 만기 때 받음' : ''], ['투자수익 (기대값)', HT.wonKor(base.T.invest), 'sub'], ['비과세로 아낀 세금 + 소득세 감면', HT.wonKor(base.T.taxSaved + base.T.relief), 'sub'], ['자격', HT.el('span', {}, [HT.badge('청년미래적금 ' + (el.mirae ? `가능 · 기여금 ${el.miraeGov * 100}%` : '불가'), el.mirae ? 'ok' : 'gray'), ' ', HT.badge('주택드림 청약 ' + (el.cheongyak ? '가능' : '불가'), el.cheongyak ? 'ok' : 'gray'), ' ', HT.badge('ISA ' + (v.salary <= 5e7 ? '서민형' : '일반형'), 'ok'), ' ', HT.badge('소득세 감면 ' + (el.sme ? '적용' : '해당 없음'), el.sme ? 'ok' : 'gray')])]]),
        HT.el('h3', { style: 'margin-top:16px' }, '무엇을 바꾸면 얼마나 빨라지나'),
        HT.table(['변화', '도달 기간', '차이'], sens.map(([l, m]) => [l, ym(m), m == null || base.months == null ? '-' : (m - base.months === 0 ? '변화 없음' : (m < base.months ? `${base.months - m}개월 단축` : `${m - base.months}개월 지연`))]), { right: [1, 2], scroll: false, hi: (r, i) => i === 0 }));
    }
    calc(f.values());
  }
});
