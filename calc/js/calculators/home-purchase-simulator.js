/* 내 집 마련 시뮬레이터 — 연봉·자기자본 → 실수령액 → 대출 한도(DSR·LTV·절대한도) → 살 수 있는 집값 → 부대비용 → 월 부담 → 보유세
   규제: 6.27·10.15 대책(2026.12.31까지 한시), 스트레스 DSR 3단계. 세제: 현행(2026) / 개정안(2026 세제개편안·지방세제 개편안, 2027년 시행 예정) 전환 */
HT.register({
  id: 'home-purchase-simulator', cat: '부동산', order: 0, name: '내 집 마련 시뮬레이터', keywords: '내집마련 주택 구입 대출 한도 LTV DSR 취득세 보유세 자금계획',
  desc: '연봉과 자기자본을 넣으면 실수령액, 대출 한도(DSR·LTV·집값별 한도), 살 수 있는 집값, 취득세·중개보수·등기 비용, 월 상환 부담, 매년 낼 보유세까지 한 흐름으로 계산합니다.',
  note: '대출 규제는 2025년 10월 15일 대책 기준입니다. 규제지역(서울 전역·경기 12곳)은 LTV 40%(생애최초 70%), 주담대 한도는 집값 15억원 이하 6억, 15~25억 4억, 25억 초과 2억원이며 수도권은 만기 30년까지입니다. 규제지역 지정은 2026년 12월 31일까지 한시이므로 이후 달라질 수 있습니다. "개정안 적용"을 고르면 2026년 세제개편안(종부세 실거주 1주택 공제 14억, 공정시장가액비율 70%, 2027년 세율표, 세액공제 한도 800만원)과 지방세제 개편안(생애최초 감면 2028년까지 연장, 40세 미만 청년 300만원, 1주택 재산세 특례 2029년까지 연장)을 반영합니다. 두 개편안 모두 국회 심의 전 정부안이라 확정 시 수치가 바뀔 수 있습니다. 공시가격은 시세의 69%(2026년 현실화율)로 추정했고, 은행 우대금리·보금자리론 등 정책대출은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root, '시뮬레이션 결과');
    const f = HT.form(root, [
      { id: 'tax', label: '세제 기준', type: 'seg', options: [['now', '현행 (2026)'], ['reform', '개정안 적용 (2027 예정)']], value: 'now' },
      { id: 'salary', p: 'salary', label: '본인 연봉 (세전)', type: 'money', unit: '원', value: 60000000 },
      { id: 'spouse', p: 'spouseSalary', label: '배우자 연봉 (세전, 없으면 0)', type: 'money', unit: '원', value: 40000000, help: '부부 합산 소득으로 DSR을 계산합니다' },
      { id: 'equity', p: 'assets', label: '자기자본 (현금·전세보증금 회수액 등)', type: 'money', unit: '원', value: 300000000 },
      { id: 'other', p: 'otherDebtAnnual', label: '기존 대출 연간 원리금 상환액', type: 'money', unit: '원', value: 0, help: '신용대출·자동차할부 등 (DSR에서 차감)' },
      { id: 'region', label: '주택 소재지', type: 'select', options: [['reg', '규제지역 (서울 전역·경기 12곳)'], ['metro', '수도권 비규제지역'], ['local', '지방']], value: 'reg' },
      { id: 'bigcity', label: '특별시·광역시 소재 (국민주택채권 매입률)', type: 'check', value: true },
      { id: 'first', p: 'noHouse', label: '생애최초 주택 구입', type: 'check', value: true },
      { id: 'young', label: '40세 미만 청년 또는 소형주택·인구감소지역 (감면 한도 300만원)', type: 'check', value: false, show: v => v.first },
      { id: 'big', label: '전용면적 85㎡ 초과', type: 'check', value: false },
      { id: 'rate', label: '주담대 금리', type: 'number', unit: '%', value: 4.0, step: 0.1 },
      { id: 'years', label: '대출 기간', type: 'number', unit: '년', value: 30, min: 1, max: 40, help: '수도권·규제지역은 30년 이내' },
      { id: 'target', label: '목표 집값 (비우면 최대 가능 집값 계산)', type: 'money', unit: '원', placeholder: '예: 900,000,000' },
      { id: 'disc', label: '국민주택채권 할인율', type: 'number', unit: '%', value: 12, step: 0.1, help: '2026년 1월 12.46%' },
      { id: 'legal', label: '법무사 보수', type: 'money', unit: '원', value: 500000 },
      { id: 'move', label: '이사·입주 비용', type: 'money', unit: '원', value: 1500000 },
    ], calc);

    const SALE_FEE = [[5e7, .006, 25e4], [2e8, .005, 80e4], [9e8, .004, 0], [12e8, .005, 0], [15e8, .006, 0], [Infinity, .007, 0]];
    const BOND_BIG = [[5e7, .013], [1e8, .019], [1.6e8, .021], [2.6e8, .023], [6e8, .026], [Infinity, .031]];
    const BOND_ETC = [[5e7, 0], [1e8, .014], [1.6e8, .016], [2.6e8, .018], [6e8, .021], [Infinity, .026]];
    const R2_NOW = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .013, 60e5], [94e8, .02, 235e5], [Infinity, .027, 893e5]];
    const R2_2027 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .013, 42e5], [25e8, .015, 66e5], [50e8, .02, 191e5], [94e8, .027, 541e5], [Infinity, .035, 1293e5]];
    const H_ONE = [[6e7, .0005, 0], [1.5e8, .001, 3e4], [3e8, .002, 18e4], [Infinity, .0035, 63e4]];
    const H_GEN = [[6e7, .001, 0], [1.5e8, .0015, 3e4], [3e8, .0025, 18e4], [Infinity, .004, 63e4]];

    function acqTax(P, v) { let r = P <= 6e8 ? .01 : P <= 9e8 ? Math.round((P * 2 / 3e8 - 3) * 10000) / 1e6 : .03; const t = P * r, edu = P * r / 10, rural = v.big ? P * .002 : 0;
      let relief = 0; if (v.first && P <= 12e8) { const cap = v.young ? 3e6 : 2e6; relief = Math.min(t, cap); }
      return { rate: r, tax: t, edu, rural, relief, total: t + edu + rural - relief }; }
    function brokerFee(P) { const b = SALE_FEE.find(x => P <= x[0]); let fee = P * b[1]; if (b[2] && fee > b[2]) fee = b[2]; return { fee, rate: b[1], vat: fee * .1 }; }
    function bondCost(P, v) { const std = P * .69; const t = (v.bigcity ? BOND_BIG : BOND_ETC).find(x => std <= x[0]); const buy = std * t[1]; return { std, rate: t[1], buy, cost: buy * v.disc / 100 }; }
    function stamp(P) { return P <= 1e7 ? 0 : P <= 3e7 ? 2e4 : P <= 5e7 ? 4e4 : P <= 1e8 ? 7e4 : P <= 1e9 ? 15e4 : 35e4; }
    function costs(P, v) { const a = acqTax(P, v), b = brokerFee(P), c = bondCost(P, v); const st = stamp(P); const total = a.total + b.fee + b.vat + c.cost + st + 15000 + v.legal + v.move; return { a, b, c, st, total }; }
    function loanCap(P, v) { // 규제·LTV·절대한도
      const ltv = v.region === 'reg' ? (v.first ? .7 : .4) : .7; let cap = Infinity, capTxt = '';
      if (v.region !== 'local') { cap = 6e8; capTxt = '수도권 한도 6억'; if (v.region === 'reg') { if (P > 25e8) { cap = 2e8; capTxt = '25억 초과 한도 2억'; } else if (P > 15e8) { cap = 4e8; capTxt = '15~25억 한도 4억'; } else capTxt = '15억 이하 한도 6억'; } }
      return { ltv, ltvAmt: P * ltv, cap, capTxt }; }
    function pmt(L, r, n) { const m = r / 12, k = n * 12; return m ? L * m * Math.pow(1 + m, k) / (Math.pow(1 + m, k) - 1) : L / k; }
    function maxLoanByPmt(annual, r, n) { const m = r / 12, k = n * 12; const p = annual / 12; return m ? p * (Math.pow(1 + m, k) - 1) / (m * Math.pow(1 + m, k)) : p * k; }
    function loanFor(P, v, dsrMax) { const c = loanCap(P, v); const L = Math.max(0, Math.min(dsrMax, c.ltvAmt, c.cap)); const bind = L === dsrMax ? 'DSR 40%' : L === c.cap ? c.capTxt : `LTV ${c.ltv * 100}%`; return { L, bind, ...c }; }
    function feasible(P, v, dsrMax) { const L = loanFor(P, v, dsrMax).L; return v.equity >= P - L + costs(P, v).total; }
    function holdingTax(P, v, reform) { // 1세대 1주택 실거주 가정, 공시가 = 시세 × 69%
      const pub = P * .69; const ratio = pub <= 3e8 ? .43 : pub <= 6e8 ? .44 : .45; const useSpecial = pub <= 9e8; // 특례: 현행 2026년분까지, 개정안 2029년까지 연장
      const pb = pub * (useSpecial ? ratio : .6); const prop = HT.progressive(pb, useSpecial ? H_ONE : H_GEN).tax; const edu = prop * .2, urban = pb * .0014;
      const ded = reform ? 14e8 : 12e8, fr = reform ? .7 : .6; const cb = Math.max(0, pub - ded) * fr; const cre = HT.progressive(cb, reform ? R2_2027 : R2_NOW).tax; const rural = cre * .2;
      return { pub, prop, edu, urban, propTotal: prop + edu + urban, cre, rural, creTotal: cre + rural, total: prop + edu + urban + cre + rural, useSpecial }; }

    function calc(v) {
      const P = HT.payroll; const me = P.netMonthly(v.salary), sp = P.netMonthly(v.spouse); const netM = me.net + sp.net; const income = v.salary + v.spouse;
      if (!income) { out.set(HT.el('div', { class: 'empty' }, '연봉을 입력하세요.')); return; }
      const years = v.region === 'local' ? v.years : Math.min(30, v.years); const stress = v.region === 'local' ? 1.5 : 3.0;
      const dsrRoom = Math.max(0, income * .4 - v.other); const dsrMax = maxLoanByPmt(dsrRoom, (v.rate + stress) / 100, years);
      // 최대 집값 탐색 (이분법)
      let lo = 0, hi = 2e10; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (feasible(mid, v, dsrMax)) lo = mid; else hi = mid; } const maxP = Math.floor(lo / 1e6) * 1e6;
      const price = v.target > 0 ? v.target : maxP; const ln = loanFor(price, v, dsrMax); const cs = costs(price, v); const need = price - ln.L + cs.total; const short = need - v.equity;
      const monthly = pmt(ln.L, v.rate / 100, years); const ratio = netM ? monthly / netM * 100 : 0; const dsrAfter = income ? (pmt(ln.L, (v.rate + stress) / 100, years) * 12 + v.other) / income * 100 : 0;
      const kind = ratio <= 30 ? 'ok' : ratio <= 40 ? 'warn' : 'danger'; const kindTxt = ratio <= 30 ? '안정 (실수령의 30% 이하)' : ratio <= 40 ? '주의 (30~40%)' : '위험 (40% 초과)';
      const hNow = holdingTax(price, v, false), hRef = holdingTax(price, v, true); const h = v.tax === 'reform' ? hRef : hNow;
      const bad = v.target > 0 && short > 0;
      out.set(
        HT.kpi(v.target > 0 ? '목표 집값 자금 판정' : '살 수 있는 최대 집값', v.target > 0 ? (bad ? `${HT.wonKor(short)} 부족` : '가능') : HT.wonKor(maxP), v.target > 0 ? `목표 ${HT.wonKor(price)} · 최대 가능 ${HT.wonKor(maxP)}` : `자기자본 ${HT.wonKor(v.equity)} + 대출 ${HT.wonKor(ln.L)} − 부대비용 ${HT.wonKor(cs.total)}`),
        HT.kpis([['① 월 실수령액 (합산)', HT.won(netM), `본인 ${HT.won(me.net)}${v.spouse ? ' + 배우자 ' + HT.won(sp.net) : ''}`], ['② 대출 가능액', HT.won(ln.L), `제약: ${ln.bind}`], ['③ 월 상환액', HT.won(monthly), `연 ${v.rate}% · ${years}년 원리금균등`], ['④ 연간 보유세', HT.won(h.total), v.tax === 'reform' ? '개정안 (2027~)' : '현행 (2026)']]),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(`월 상환 부담 ${HT.pct(ratio, 1)} — ${kindTxt}`, kind), ' ', HT.badge(`구입 후 스트레스 DSR ${HT.pct(dsrAfter, 1)}`, dsrAfter <= 40 ? 'gray' : 'danger')]),
        HT.barChart([{ label: '자기자본', value: Math.min(v.equity, need), color: 'var(--c1)' }, { label: '주택담보대출', value: ln.L, color: 'var(--c2)' }, { label: '부대비용', value: cs.total, color: 'var(--g2)' }, bad ? { label: '부족 자금', value: short, color: 'var(--danger)' } : null].filter(Boolean), { fmt: HT.wonKor, cap: `집값 ${HT.wonKor(price)} 기준 자금 구성` }),
        HT.el('h3', {}, '② 대출 한도 산정'),
        HT.rows([['부부 합산 연소득', HT.won(income)], ['DSR 40% 기준 연간 상환 여력', HT.won(dsrRoom), 'sub', v.other ? `기존 대출 ${HT.won(v.other)} 차감` : ''], ['DSR 한도 (스트레스 금리 적용)', HT.won(dsrMax), '', `연 ${HT.fmt(v.rate + stress, 2)}% (가산 ${stress}%p) · ${years}년`], [`LTV ${ln.ltv * 100}% 한도`, HT.won(ln.ltvAmt), '', v.region === 'reg' ? (v.first ? '규제지역 생애최초 70%' : '규제지역 무주택 40%') : '비규제지역 70%'], isFinite(ln.cap) ? ['집값별 절대 한도', HT.won(ln.cap), '', ln.capTxt] : null, ['적용 대출액 (세 값 중 최소)', HT.won(ln.L), 'strong']]),
        HT.el('h3', { style: 'margin-top:16px' }, '④ 부대비용'),
        HT.rows([['취득세', HT.won(cs.a.tax), '', `세율 ${HT.pct(cs.a.rate * 100, 2)}`], ['지방교육세', HT.won(cs.a.edu), 'sub'], cs.a.rural ? ['농어촌특별세 (85㎡ 초과)', HT.won(cs.a.rural), 'sub'] : null, cs.a.relief ? ['생애최초 취득세 감면', '-' + HT.won(cs.a.relief), 'sub', `한도 ${HT.won(v.young ? 3e6 : 2e6)} · 취득가 12억원 이하`] : null, ['중개보수 (부가세 포함)', HT.won(cs.b.fee + cs.b.vat), '', `요율 ${HT.pct(cs.b.rate * 100, 1)}`], ['국민주택채권 할인 비용', HT.won(cs.c.cost), '', `시가표준액 ${HT.wonKor(cs.c.std)} × 매입률 ${HT.pct(cs.c.rate * 100, 1)} = ${HT.wonKor(cs.c.buy)} 매입 후 즉시매도 (할인율 ${v.disc}%)`], ['인지세 + 등기신청수수료', HT.won(cs.st + 15000), 'sub'], ['법무사 보수 + 이사비', HT.won(v.legal + v.move), 'sub'], ['부대비용 합계', HT.won(cs.total), 'strong', `집값의 ${HT.pct(cs.total / price * 100, 2)}`]]),
        HT.el('h3', { style: 'margin-top:16px' }, '⑥ 연간 보유세 (1세대 1주택 실거주, 공시가 ' + HT.wonKor(h.pub) + ' 추정)'),
        HT.table(['항목', '현행 (2026)', '개정안 (2027~)'], [['재산세 (+교육세·도시지역분)', HT.won(hNow.propTotal), HT.won(hRef.propTotal)], ['종합부동산세 (+농특세)', HT.won(hNow.creTotal), HT.won(hRef.creTotal)], ['합계', HT.won(hNow.total), HT.won(hRef.total)]], { right: [1, 2], scroll: false, hi: (r, i) => i === 2 }),
        HT.el('div', { class: 'note', html: `재산세는 공시 9억원 이하 1주택 특례세율(공정시장가액비율 43~45%)을 적용했고, 종부세는 현행 공제 12억·비율 60%, 개정안 공제 14억(실거주)·비율 70%·2027년 세율표를 적용했습니다. 월 환산 보유세는 약 <b>${HT.won(h.total / 12)}</b>이며 월 상환액과 합치면 실수령의 ${HT.pct((monthly + h.total / 12) / (netM || 1) * 100, 1)}입니다.` }));
    }
    calc(f.values());
  }
});
