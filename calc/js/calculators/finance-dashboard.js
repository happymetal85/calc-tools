/* 내 재무 대시보드 — 한 번 입력하면 순자산·실수령·저축률·DSR·비상금·보유세·자동차세가 카드로 뜨고,
   입력값은 브라우저에 저장돼 다른 계산기의 초기값으로 전달된다(HT.profile). */
HT.register({
  id: 'finance-dashboard', cat: '내 재무', order: 0, name: '내 재무 대시보드', keywords: '대시보드 순자산 저축률 DSR 비상금 보유세 재무 진단 프로필',
  desc: '자산·부채·소득·지출을 한 번 넣으면 순자산, 월 실수령액, 저축률, DSR, 비상금 개월수, 연간 보유세·자동차세가 카드로 정리되고, 각 카드에서 해당 계산기로 이어집니다. 입력값은 이 브라우저에만 저장되어 다른 계산기의 초기값으로 자동 전달됩니다.',
  note: '저장은 이 브라우저의 localStorage에만 되며 서버로 보내지 않습니다. 다른 계산기 상단에 "대시보드 값 적용됨" 표시가 뜨면 이 화면의 값이 초기값으로 들어간 것이고, 그 계산기에서 바꿔도 대시보드 값은 그대로입니다. 판정 기준: 저축률 20% 미만 주의, DSR 40% 초과 위험, 비상금 3개월 미만 주의·1개월 미만 위험. 보유세는 1세대 1주택 실거주(공시가 = 시세 69%) 가정, 소득세는 연봉 실수령액 계산기와 같은 방식입니다.',
  render(root) {
    const out = HT.output(root, '재무 카드'); out.wrap.classList.add('wide'); out.wrap.style.order = '0'; // 카드가 위, 입력은 아래
    const clearBtn = HT.el('button', { class: 'btn sm', type: 'button' }, '저장값 지우기');
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '나이 (만)', type: 'number', unit: '세', value: 32, min: 18, max: 90 },
      { id: 'birth', p: 'birth', label: '출생연도', type: 'number', unit: '년', value: 1994, min: 1940, max: 2010 },
      { id: 'salary', p: 'salary', label: '본인 연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'spouseSalary', p: 'spouseSalary', label: '배우자 연봉 (없으면 0)', type: 'money', unit: '원', value: 0 },
      { id: 'sme', p: 'sme', label: '중소기업 재직 (34세 이하 청년 소득세 감면)', type: 'check', value: false },
      { id: 'assets', p: 'assets', label: '금융자산 (현금·예적금·주식·펀드)', type: 'money', unit: '원', value: 50000000 },
      { id: 'noHouse', p: 'noHouse', label: '무주택', type: 'check', value: true },
      { id: 'homeValue', p: 'homeValue', label: '보유 주택 시세', type: 'money', unit: '원', value: 0, show: v => !v.noHouse },
      { id: 'mortgage', p: 'mortgage', label: '주택담보대출 잔액', type: 'money', unit: '원', value: 0, show: v => !v.noHouse },
      { id: 'mortgageRate', p: 'mortgageRate', label: '주담대 금리', type: 'number', unit: '%', value: 4.0, step: 0.1, show: v => !v.noHouse && v.mortgage > 0 },
      { id: 'mortgageYears', label: '주담대 잔여 기간', type: 'number', unit: '년', value: 25, min: 1, max: 40, show: v => !v.noHouse && v.mortgage > 0 },
      { id: 'jeonse', p: 'jeonse', label: '전세 보증금 (전세 거주 시)', type: 'money', unit: '원', value: 0, show: v => v.noHouse },
      { id: 'otherDebt', p: 'otherDebt', label: '기타 대출 잔액 (신용·전세대출 등)', type: 'money', unit: '원', value: 0 },
      { id: 'otherDebtAnnual', p: 'otherDebtAnnual', label: '기타 대출 연간 원리금 상환액', type: 'money', unit: '원', value: 0 },
      { id: 'rent', p: 'rent', label: '월 주거비 (월세·관리비·공과금)', type: 'money', unit: '원', value: 400000 },
      { id: 'fixed', p: 'fixed', label: '월 고정지출 (통신·보험·교통·구독)', type: 'money', unit: '원', value: 300000 },
      { id: 'living', p: 'living', label: '월 생활비 (식비·여가 등)', type: 'money', unit: '원', value: 900000 },
      { id: 'carCC', p: 'carCC', label: '자동차 배기량 (없으면 0, 전기차는 1)', type: 'number', unit: 'cc', value: 0, min: 0 },
    ], calc, { title: '내 정보 (자동 저장)', extra: clearBtn, hideHint: true });
    f.wrap.classList.add('wide');
    clearBtn.addEventListener('click', () => { HT.profile.clear(); location.reload(); });
    const H_ONE = [[6e7, .0005, 0], [1.5e8, .001, 3e4], [3e8, .002, 18e4], [Infinity, .0035, 63e4]]; const H_GEN = [[6e7, .001, 0], [1.5e8, .0015, 3e4], [3e8, .0025, 18e4], [Infinity, .004, 63e4]];
    const R2 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .013, 60e5], [94e8, .02, 235e5], [Infinity, .027, 893e5]];
    function holding(P) { if (!P) return { prop: 0, cre: 0 }; const pub = P * .69; const one = pub <= 9e8; const pb = pub * (one ? (pub <= 3e8 ? .43 : pub <= 6e8 ? .44 : .45) : .6); const prop = HT.progressive(pb, one ? H_ONE : H_GEN).tax * 1.2 + pb * .0014; const cre = HT.progressive(Math.max(0, pub - 12e8) * .6, R2).tax * 1.2; return { prop, cre }; }
    function carTax(cc) { if (!cc) return 0; if (cc === 1) return 130000; return cc * (cc <= 1000 ? 80 : cc <= 1600 ? 140 : 200) * 1.3; }
    const card = (label, value, sub, kind) => HT.el('div', { class: 'dcard ' + (kind || '') }, [HT.el('div', { class: 'l' }, label), HT.el('div', { class: 'v' }, value), HT.el('div', { class: 'html' in {} ? 's' : 's', html: sub || '' })]);
    function calc(v) {
      HT.profile.set({ age: v.age, birth: v.birth, salary: v.salary, spouseSalary: v.spouseSalary, sme: v.sme, assets: v.assets, noHouse: v.noHouse, homeValue: v.noHouse ? 0 : v.homeValue, mortgage: v.noHouse ? 0 : v.mortgage, mortgageRate: v.mortgageRate, jeonse: v.noHouse ? v.jeonse : 0, otherDebt: v.otherDebt, otherDebtAnnual: v.otherDebtAnnual, rent: v.rent, fixed: v.fixed, living: v.living, carCC: v.carCC });
      const P = HT.payroll; const me = P.netMonthly(v.salary), sp = P.netMonthly(v.spouseSalary); let relief = 0; if (v.sme && v.age <= 34) relief = Math.min(me.tax * .9, 2e6 / 12) * 1.1;
      const net = me.net + sp.net + relief; const income = v.salary + v.spouseSalary;
      const home = v.noHouse ? 0 : v.homeValue, mort = v.noHouse ? 0 : v.mortgage, jeonse = v.noHouse ? v.jeonse : 0;
      const totalAssets = v.assets + home + jeonse, totalDebt = mort + v.otherDebt, networth = totalAssets - totalDebt;
      const r = v.mortgageRate / 100 / 12, n = v.mortgageYears * 12; const mortPm = mort ? (r ? mort * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : mort / n) : 0;
      const debtAnnual = mortPm * 12 + v.otherDebtAnnual; const dsr = income ? debtAnnual / income * 100 : 0;
      const spend = v.rent + v.fixed + v.living + mortPm + v.otherDebtAnnual / 12; const save = net - spend; const saveRate = net ? save / net * 100 : 0;
      const emergency = spend ? v.assets / spend : 0;
      const h = holding(home); const car = carTax(v.carCC); const incomeTax = (me.tax + me.local + sp.tax + sp.local) * 12 - relief * 12; const insurance = (me.ins.total + sp.ins.total) * 12;
      const yearTax = incomeTax + h.prop + h.cre + car;
      const link = (id, t) => `<a href="#/${id}">${t} →</a>`;
      out.set(HT.el('div', { class: 'cards' }, [
        card('순자산', HT.wonKor(networth), `자산 ${HT.wonKor(totalAssets)} − 부채 ${HT.wonKor(totalDebt)}`, 'hi'),
        card('월 실수령액' + (v.spouseSalary ? ' (합산)' : ''), HT.won(net), (relief ? `청년 소득세 감면 +${HT.won(relief)} · ` : '') + link('salary-after-tax', '실수령액 계산기')),
        card('월 저축 여력 · 저축률', `${HT.won(save)} · ${HT.pct(saveRate, 0)}`, `지출 ${HT.won(spend)} (대출 상환 포함) · ${link('first-100m', '1억 만들기')}`, saveRate < 0 ? 'danger' : saveRate < 20 ? 'warn' : ''),
        card('DSR (현재 대출 기준)', HT.pct(dsr, 1), `연간 원리금 ${HT.won(debtAnnual)} · ${link('dsr-dti', 'DSR/DTI 계산기')}`, dsr > 40 ? 'danger' : dsr > 30 ? 'warn' : ''),
        card('비상금', `${HT.fmt(emergency, 1)}개월`, `금융자산 ÷ 월 지출 · 3~6개월이 권장 · ${link('savings-tax-compare', '예금·ISA 비교')}`, emergency < 1 ? 'danger' : emergency < 3 ? 'warn' : ''),
        card('연간 세금 합계 (추정)', HT.wonKor(yearTax), `소득세 ${HT.wonKor(incomeTax)}${home ? ` · 보유세 ${HT.wonKor(h.prop + h.cre)}` : ''}${car ? ` · 자동차세 ${HT.wonKor(car)}` : ''} · 4대보험 별도 ${HT.wonKor(insurance)}`),
        home ? card('연간 보유세', HT.wonKor(h.prop + h.cre), `재산세 ${HT.wonKor(h.prop)} · 종부세 ${HT.wonKor(h.cre)} · ${link('property-tax', '재산세')} · ${link('comprehensive-real-estate-tax', '종부세')}`) : card('내 집 마련', v.assets >= 1e8 ? '자기자본 ' + HT.wonKor(v.assets) : `1억까지 ${HT.wonKor(1e8 - v.assets)}`, `${link('home-purchase-simulator', '살 수 있는 집값 보기')} · ${link('rent-compare', '전세·월세 비교')}`),
        card('은퇴 준비', `${v.age}세`, `${link('retirement-fire', '은퇴 시뮬레이터')} · ${link('retirement-pension', '퇴직연금 DC/DB')}`),
        car ? card('자동차세 (연)', HT.won(car), `배기량 ${v.carCC === 1 ? '전기차' : v.carCC + 'cc'} · 연납 시 약 5% 할인 · ${link('car-ownership', '구매/리스/렌트')}`) : null,
      ].filter(Boolean)),
        HT.el('h3', { style: 'margin-top:20px' }, '이 값으로 바로 이어지는 계산기'),
        HT.el('div', { class: 'note', html: ['home-purchase-simulator', 'first-100m', 'retirement-fire', 'job-offer-compare', 'wedding-planner', 'rent-compare', 'dsr-dti', 'salary-after-tax'].map(id => { const c = HT.byId(id); return c ? `<a href="#/${id}">${c.name}</a>` : ''; }).filter(Boolean).join(' · ') + '<br>위 계산기를 열면 연봉·자산·지출이 초기값으로 채워집니다.' }));
    }
    calc(f.values());
  }
});
