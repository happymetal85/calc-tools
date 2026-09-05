/* 전세 · 월세 · 반전세 비교 + 현재 전세 → 반전세 전환 시뮬레이션
   법정 전월세 전환율 = min(10%, 기준금리 + 2%p). 기준금리 3.00% (2026.8.27 금통위) → 5.0%
   월세 세액공제: 총급여 5,500만 이하 17%, 8,000만 이하 15%, 월세 연 1,000만원 한도 (무주택 세대주)
   주택임차차입금 원리금상환액 소득공제: 상환액의 40%, 연 400만원 한도 */
HT.register({
  id: 'rent-compare', cat: '부동산', order: 0.5, name: '전세 · 월세 · 반전세 비교', keywords: '전세 월세 반전세 전환율 비교 임대차 갱신 5% 보증보험',
  desc: '전세·반전세·월세의 월 실질 비용을 한 줄로 비교하고, 지금 사는 전세를 반전세로 바꿀 때 법정 전환율과 5% 상한에 맞는지 확인하며, 보증금 인상 요구에 전세 유지·반전세·이사 세 가지로 대응할 때 2년 총비용을 비교합니다.',
  note: '법정 전월세 전환율 상한(기준금리 + 2%p = 5.0%)과 임대료 5% 인상 상한은 계약을 갱신하거나 계약 기간 중에 전세를 월세로 바꿀 때 적용됩니다. 새 계약(신규 세입자)에는 적용되지 않아 시장 전환율(대개 5~7%)로 정해집니다. 보증금 기회비용은 예금 수익률에 이자소득세 15.4%를 뺀 값으로, 전세대출은 이자만 내는 만기일시 상환으로 가정했습니다. 세제혜택은 무주택 세대주 근로자 기준이며 연말정산 때 돌려받는 금액을 월로 나눈 것입니다.',
  render(root) {
    const BASE_RATE = 3.0, LEGAL = Math.min(10, BASE_RATE + 2);
    const wrap = HT.el('div', { class: 'wide' }); root.append(wrap);
    const body = HT.el('div'); HT.tabs(wrap, [['cmp', '전세 · 월세 · 반전세 비교'], ['conv', '현재 전세 → 반전세 전환'], ['raise', '보증금 인상 대응 3안']], k => { body.innerHTML = ''; ({ cmp: compare, conv: convert, raise: raiseOptions })[k](body); }); wrap.append(body);

    /* ---- 공통 ---- */
    function marginal(gross) { if (!gross) return 0; const P = HT.payroll; const inc = gross - P.earnedIncomeDeduction(gross); const base = Math.max(0, inc - 1.5e6 - P.monthly(gross / 12).np * 12); return HT.progressive(base, HT.INCOME_TAX).rate * 1.1; }
    function rentCredit(gross, rentY) { if (!gross || gross > 8e7) return 0; return Math.min(rentY, 1e7) * (gross <= 5.5e7 ? .17 : .15); }
    function loanDeduct(gross, payY) { return gross ? Math.min(payY * .4, 4e6) * marginal(gross) : 0; }
    const RENT_FEE = [[5e7, .005, 20e4], [1e8, .004, 30e4], [6e8, .003, 0], [12e8, .004, 0], [15e8, .005, 0], [Infinity, .006, 0]];
    function rentBrokerFee(dep, rent) { let base = dep + rent * 100; if (base < 5e7) base = dep + rent * 70; const b = RENT_FEE.find(x => base <= x[0]); let fee = base * b[1]; if (b[2] && fee > b[2]) fee = b[2]; return { fee: fee * 1.1, rate: b[1], base }; }

    /* ---- 탭 3: 보증금 인상 대응 3안 ---- */
    function raiseOptions(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, '3안 비교 (2년 기준)');
      const f = HT.form(inner, [
        { id: 'cur', label: '현재 전세 보증금', type: 'money', unit: '원', value: 500000000 },
        { id: 'raise', label: '집주인 인상 요구액', type: 'money', unit: '원', value: 50000000 },
        { id: 'renew', label: '갱신청구권 사용 (5% 상한 적용)', type: 'check', value: true },
        { id: 'cash', label: '추가로 넣을 수 있는 현금', type: 'money', unit: '원', value: 20000000, help: '나머지는 전세대출 증액으로 충당' },
        { id: 'loanRate', label: '전세대출 금리', type: 'number', unit: '%', value: 4.0, step: 0.1 },
        { id: 'depRate', label: '예금·투자 수익률 (세전)', type: 'number', unit: '%', value: 3.2, step: 0.1 },
        { id: 'gross', label: '총급여 (세제혜택)', type: 'money', unit: '원', value: 50000000 },
        { id: 'offer', label: 'B안 · 집주인 제시 월세 (없으면 법정 전환율)', type: 'money', unit: '원', value: 0 },
        { id: 'base', label: '기준금리', type: 'number', unit: '%', value: BASE_RATE, step: 0.25 },
        { id: 'nDep', label: 'C안 · 이사할 집 보증금', type: 'money', unit: '원', value: 450000000 },
        { id: 'nRent', label: 'C안 · 이사할 집 월세 (전세면 0)', type: 'money', unit: '원', value: 0 },
        { id: 'move', label: 'C안 · 이사비 (포장이사·청소·입주)', type: 'money', unit: '원', value: 2000000 },
        { id: 'etc', label: 'C안 · 기타 일회성 비용 (도배·인테리어 등)', type: 'money', unit: '원', value: 0 },
      ], calc);
      function calc(v) {
        if (v.raise <= 0) { out.set(HT.el('div', { class: 'empty' }, '인상 요구액을 입력하세요.')); return; }
        const legal = Math.min(10, v.base + 2); const M = 24; const oppRate = v.depRate / 100 * .846;
        const capOk = v.raise <= v.cur * .05;
        // A안: 증액분 대출·현금으로 충당, 전세 유지
        const aCash = Math.min(v.cash, v.raise), aLoan = v.raise - aCash; const aInt = aLoan * v.loanRate / 100 / 12, aOpp = aCash * oppRate / 12, aDed = aLoan ? loanDeduct(v.gross, aLoan * v.loanRate / 100) / 12 : 0;
        const A = { name: 'A안 · 증액분 대출로 전세 유지', monthly: aInt + aOpp - aDed, once: 0, parts: [['대출 증액', HT.wonKor(aLoan)], ['월 대출이자', HT.won(aInt)], ['현금 투입 기회비용 (월)', HT.won(aOpp)], ['원리금 소득공제 (월 환산)', aDed ? '-' + HT.won(aDed) : '-']] };
        // B안: 증액분을 월세로 (반전세)
        const bRent = v.offer > 0 ? v.offer : v.raise * legal / 100 / 12; const bCredit = rentCredit(v.gross, bRent * 12) / 12; const bRate = bRent * 12 / v.raise * 100;
        const B = { name: 'B안 · 증액분을 월세로 (반전세)', monthly: bRent - bCredit, once: 0, parts: [['월세', HT.won(bRent) + (v.offer > 0 ? ` (전환율 ${HT.pct(bRate, 2)})` : ` (법정 ${legal}%)`)], ['월세 세액공제 (월 환산)', bCredit ? '-' + HT.won(bCredit) : '-'], ['보증금', '현재 그대로 ' + HT.wonKor(v.cur)]] };
        // C안: 이사
        const delta = v.nDep - v.cur; let cInt = 0, cOpp = 0, cDed = 0, cLoan = 0, cCash = 0, cSave = 0;
        if (delta > 0) { cCash = Math.min(v.cash, delta); cLoan = delta - cCash; cInt = cLoan * v.loanRate / 100 / 12; cOpp = cCash * oppRate / 12; cDed = cLoan ? loanDeduct(v.gross, cLoan * v.loanRate / 100) / 12 : 0; } else cSave = -delta * oppRate / 12; // 보증금이 줄면 돌아온 돈의 세후 이자만큼 이득
        const cCredit = rentCredit(v.gross, v.nRent * 12) / 12; const bf = rentBrokerFee(v.nDep, v.nRent); const cOnce = bf.fee + v.move + v.etc;
        const C = { name: 'C안 · 이사 (다른 집 계약)', monthly: cInt + cOpp - cDed + v.nRent - cCredit - cSave, once: cOnce, parts: [['보증금 차이', (delta >= 0 ? '+' : '') + HT.wonKor(delta)], delta > 0 ? ['월 대출이자 + 현금 기회비용', HT.won(cInt + cOpp)] : ['돌아온 보증금 세후 이자 (월)', '-' + HT.won(cSave)], v.nRent ? ['월세 − 세액공제', HT.won(v.nRent - cCredit)] : null, ['중개보수 (부가세 포함, 일회)', HT.won(bf.fee) + ` (요율 ${HT.pct(bf.rate * 100, 1)})`], ['이사비 + 기타 (일회)', HT.won(v.move + v.etc)]].filter(Boolean) };
        const opts = [A, B, C].map(o => ({ ...o, total: o.monthly * M + o.once })); const best = opts.reduce((a, b) => b.total < a.total ? b : a);
        out.set(HT.kpi('2년 기준 가장 유리한 선택', best.name.split(' · ')[0], `${best.name.split(' · ')[1]} · 2년 ${HT.wonKor(best.total)} (월 환산 ${HT.won(best.total / M)})`),
          HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(capOk ? `인상률 ${HT.pct(v.raise / v.cur * 100, 1)} — 5% 상한 이내` : `인상률 ${HT.pct(v.raise / v.cur * 100, 1)} — 갱신청구권 사용 시 5% 초과분 거절 가능`, capOk ? 'ok' : 'danger'), ' ', v.offer > 0 && v.renew && bRate > legal + 0.01 ? HT.badge(`B안 월세 전환율 ${HT.pct(bRate, 2)} — 법정 ${legal}% 초과`, 'danger') : null]),
          HT.barChart(opts.map(o => ({ label: o.name.split(' · ')[0], value: o.total, color: o === best ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.wonKor, cap: '2년 총 추가 비용 (현재 조건 유지 대비 증가분)' }),
          HT.table(['항목', 'A안 전세 유지', 'B안 반전세', 'C안 이사'], [['월 추가 비용', ...opts.map(o => HT.won(o.monthly))], ['일회성 비용', ...opts.map(o => HT.won(o.once))], ['2년 총 추가 비용', ...opts.map(o => HT.wonKor(o.total))], ['월 환산 (2년)', ...opts.map(o => HT.won(o.total / M))], ['4년 기준 (재갱신 없이 유지 시)', ...opts.map(o => HT.wonKor(o.monthly * 48 + o.once))]], { right: [1, 2, 3], scroll: false, hi: (r, i) => i === 2 }),
          HT.el('div', { class: 'row3', style: 'margin-top:14px' }, opts.map(o => HT.el('div', {}, [HT.el('h3', {}, o.name), HT.rows(o.parts.map(p => [p[0], p[1]]))]))),
          HT.el('div', { class: 'note', html: `<b>돈 말고 따질 것</b> A안은 갱신청구권(2년 보장)을 쓰고 전세가율이 올라 반환 위험이 커집니다. B안은 보증금이 그대로라 반환 위험이 늘지 않고 월세 세액공제를 받지만, 집주인이 법정 전환율(${legal}%)을 넘는 월세를 요구하면 거절할 수 있습니다. C안은 이사비·중개보수가 일회성으로 들지만 보증금을 줄이거나 조건을 새로 고를 수 있습니다. 인상률이 5%를 넘는 요구는 갱신청구권 사용 시 초과분을 거절할 수 있고, 집주인 실거주 등 정당한 거절 사유가 없으면 갱신을 막을 수 없습니다.` }));
      }
      calc(f.values());
    }
    function monthlyCost(dep, rent, v) { // 월 실질 비용 분해
      const loan = Math.max(0, dep - v.cash); const own = Math.min(dep, v.cash);
      const interest = loan * v.loanRate / 100 / 12; const opp = own * v.depRate / 100 * .846 / 12; const ins = v.insure ? dep * v.insRate / 100 / 12 : 0;
      const credit = rentCredit(v.gross, rent * 12) / 12; const ded = loan ? loanDeduct(v.gross, loan * v.loanRate / 100) / 12 : 0;
      return { dep, rent, loan, own, interest, opp, ins, credit, ded, total: interest + opp + ins + rent - credit - ded, equiv: dep + rent * 12 / (v.conv / 100) };
    }

    /* ---- 탭 1: 비교 ---- */
    function compare(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, '월 실질 비용 비교');
      const f = HT.form(inner, [
        { id: 'jDep', label: '① 전세 보증금', type: 'money', unit: '원', value: 500000000 },
        { id: 'hDep', label: '② 반전세 보증금', type: 'money', unit: '원', value: 300000000 },
        { id: 'hRent', label: '② 반전세 월세', type: 'money', unit: '원', value: 800000 },
        { id: 'mDep', label: '③ 월세 보증금', type: 'money', unit: '원', value: 50000000 },
        { id: 'mRent', label: '③ 월세', type: 'money', unit: '원', value: 1800000 },
        { id: 'cash', p: 'assets', label: '보유 현금 (보증금에 넣을 수 있는 돈)', type: 'money', unit: '원', value: 200000000, help: '부족분은 전세(보증금)대출로 채운다고 가정' },
        { id: 'loanRate', label: '전세대출 금리', type: 'number', unit: '%', value: 4.0, step: 0.1 },
        { id: 'depRate', label: '여유 자금 예금·투자 수익률 (세전)', type: 'number', unit: '%', value: 3.2, step: 0.1, help: '보증금에 묶이는 돈의 기회비용' },
        { id: 'insure', label: '전세보증금 반환보증 가입', type: 'check', value: true },
        { id: 'insRate', label: '보증료율 (연)', type: 'number', unit: '%', value: 0.128, step: 0.001, show: v => v.insure, help: 'HUG 0.097~0.211%' },
        { id: 'gross', label: '총급여 (세제혜택 계산, 없으면 0)', type: 'money', unit: '원', value: 50000000 },
        { id: 'conv', label: '환산에 쓸 전환율', type: 'number', unit: '%', value: LEGAL, step: 0.1, help: `법정 상한 ${LEGAL}% (기준금리 ${BASE_RATE}% + 2%p)` },
      ], calc);
      function calc(v) {
        const opts = [['전세', monthlyCost(v.jDep, 0, v)], ['반전세', monthlyCost(v.hDep, v.hRent, v)], ['월세', monthlyCost(v.mDep, v.mRent, v)]];
        const best = opts.reduce((a, b) => b[1].total < a[1].total ? b : a); const worst = opts.reduce((a, b) => b[1].total > a[1].total ? b : a);
        const row = (label, fn, cls) => [label, ...opts.map(o => fn(o[1]))];
        out.set(HT.kpi('가장 유리한 선택', best[0], `월 ${HT.won(best[1].total)} · 가장 비싼 ${worst[0]}보다 월 ${HT.won(worst[1].total - best[1].total)} (연 ${HT.wonKor((worst[1].total - best[1].total) * 12)}) 절약`),
          HT.barChart(opts.map(o => ({ label: o[0], value: o[1].total, color: o === best ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.won, cap: '월 실질 비용 (세제혜택 반영)' }),
          HT.table(['항목', '① 전세', '② 반전세', '③ 월세'], [
            row('보증금', o => HT.wonKor(o.dep)), row('월세', o => HT.won(o.rent)),
            row('전세대출액', o => HT.wonKor(o.loan)), row('대출이자 (월)', o => HT.won(o.interest)),
            row('보증금 기회비용 (월, 세후)', o => HT.won(o.opp)), row('보증보험료 (월)', o => HT.won(o.ins)),
            row('월세 세액공제 (월 환산)', o => o.credit ? '-' + HT.won(o.credit) : '-'), row('전세대출 원리금 소득공제 (월 환산)', o => o.ded ? '-' + HT.won(o.ded) : '-'),
            row('월 실질 비용', o => HT.won(o.total)), row('2년 총비용', o => HT.wonKor(o.total * 24)),
            row(`환산 전세가 (전환율 ${v.conv}%)`, o => HT.wonKor(o.equiv)),
          ], { right: [1, 2, 3], scroll: false, hi: (r, i) => i === 8 }),
          HT.el('div', { class: 'note', html: `<b>보는 법</b> 환산 전세가는 "보증금 + 월세 × 12 ÷ 전환율"로, 세 조건을 같은 잣대로 놓은 값입니다. 환산 전세가가 ①보다 크면 집주인이 법정 전환율보다 비싸게 월세를 매긴 것입니다. 전세대출 금리(${v.loanRate}%)가 전환율(${v.conv}%)보다 낮으면 대출을 받아서라도 전세가 유리하고, 반대면 월세 쪽이 유리해집니다.${v.gross > 8e7 ? ' 총급여 8,000만원 초과라 월세 세액공제는 적용되지 않았습니다.' : ''}` }));
      }
      calc(f.values());
    }

    /* ---- 탭 2: 전환 ---- */
    function convert(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, '전환 결과');
      const f = HT.form(inner, [
        { id: 'cur', label: '현재 전세 보증금', type: 'money', unit: '원', value: 500000000 },
        { id: 'mode', label: '전환 상황', type: 'seg', options: [['renew', '계약 갱신 (갱신청구권·5% 상한 적용)'], ['new', '새 계약·이사 (상한 미적용)']], value: 'renew' },
        { id: 'how', label: '전환 방식', type: 'seg', options: [['back', '보증금 일부를 돌려받고 월세로'], ['raise', '집주인 인상 요구분을 월세로']], value: 'back' },
        { id: 'back', label: '돌려받을 보증금', type: 'money', unit: '원', value: 200000000, show: v => v.how === 'back' },
        { id: 'raise', label: '집주인이 올려달라는 금액 (전세 기준)', type: 'money', unit: '원', value: 50000000, show: v => v.how === 'raise' },
        { id: 'offer', label: '집주인이 제시한 월세 (없으면 0)', type: 'money', unit: '원', value: 900000 },
        { id: 'base', label: '한국은행 기준금리', type: 'number', unit: '%', value: BASE_RATE, step: 0.25, help: '2026년 8월 27일 3.00%' },
        { id: 'use', label: '돌려받은 보증금 사용처', type: 'seg', options: [['loan', '전세대출 상환'], ['save', '예금·투자']], value: 'loan', show: v => v.how === 'back' },
        { id: 'loanRate', label: '전세대출 금리', type: 'number', unit: '%', value: 4.0, step: 0.1 },
        { id: 'depRate', label: '예금·투자 수익률 (세전)', type: 'number', unit: '%', value: 3.2, step: 0.1 },
        { id: 'gross', label: '총급여 (월세 세액공제)', type: 'money', unit: '원', value: 50000000 },
        { id: 'price', label: '집 시세 (깡통전세·보증보험 점검, 선택)', type: 'money', unit: '원', value: 0 },
        { id: 'metro', label: '수도권 소재', type: 'check', value: true, show: v => v.price > 0 },
      ], calc);
      function calc(v) {
        const legal = Math.min(10, v.base + 2); const convAmt = v.how === 'back' ? v.back : v.raise; if (convAmt <= 0 || (v.how === 'back' && v.back > v.cur)) { out.set(HT.el('div', { class: 'empty' }, '전환할 금액을 확인하세요.')); return; }
        const legalRent = convAmt * legal / 100 / 12; const newDep = v.how === 'back' ? v.cur - v.back : v.cur; const rent = v.offer > 0 ? v.offer : legalRent;
        const offerRate = v.offer > 0 ? v.offer * 12 / convAmt * 100 : legal;
        const equivNew = newDep + rent * 12 / (legal / 100); const cap = v.cur * 1.05; const overCap = v.mode === 'renew' && equivNew > cap; const overLegal = v.mode === 'renew' && v.offer > legalRent + 1;
        // 월 비용 전/후
        const credit = rentCredit(v.gross, rent * 12) / 12;
        let before, after, beforeTxt, afterTxt;
        if (v.how === 'back') { const r = v.use === 'loan' ? v.loanRate / 100 : v.depRate / 100 * .846; before = v.back * r / 12; after = rent - credit; beforeTxt = v.use === 'loan' ? `돌려받을 ${HT.wonKor(v.back)}에 붙던 대출이자` : `${HT.wonKor(v.back)}를 예금할 때 세후 이자(기회비용)`; afterTxt = `월세 ${HT.won(rent)}${credit ? ' − 세액공제 ' + HT.won(credit) : ''}`; }
        else { before = v.raise * v.loanRate / 100 / 12; after = rent - credit; beforeTxt = `인상분 ${HT.wonKor(v.raise)}을 대출받을 때 월 이자`; afterTxt = `월세 ${HT.won(rent)}${credit ? ' − 세액공제 ' + HT.won(credit) : ''}`; }
        const diff = after - before; const beRate = (v.how === 'back' ? (v.use === 'loan' ? v.loanRate : v.depRate * .846) : v.loanRate);
        const rows = [['법정 전환율 상한', HT.pct(legal, 2), '', `기준금리 ${v.base}% + 2%p (10% 이내)`], ['전환 대상 금액', HT.wonKor(convAmt)], ['법정 상한 월세', HT.won(legalRent), 'strong', '전환 금액 × 전환율 ÷ 12'],
          v.offer > 0 ? ['집주인 제시 월세', HT.won(v.offer), overLegal ? 'neg' : '', `적용 전환율 ${HT.pct(offerRate, 2)}` + (overLegal ? ' — 갱신 시 법정 상한 초과' : v.mode === 'new' ? ' (새 계약은 상한 미적용)' : ' — 상한 이내')] : null,
          ['전환 후 조건', `보증금 ${HT.wonKor(newDep)} + 월 ${HT.won(rent)}`], ['환산 보증금 (법정 전환율)', HT.wonKor(equivNew), overCap ? 'neg' : '', v.mode === 'renew' ? `갱신 상한 ${HT.wonKor(cap)} (현재 × 105%)` + (overCap ? ' 초과' : ' 이내') : '갱신이 아니면 5% 상한 없음'],
          ['전환 전 월 부담', HT.won(before), '', beforeTxt], ['전환 후 월 부담', HT.won(after), '', afterTxt], ['월 차이', (diff > 0 ? '+' : '') + HT.won(diff), diff > 0 ? 'neg' : 'pos', diff > 0 ? '반전세가 더 비쌈' : '반전세가 더 쌈'], ['손익분기 전환율', HT.pct(beRate, 2), 'sub', `전환율이 이보다 높으면 전세 유지가 유리`]];
        const extra = [];
        if (v.price > 0) { const ratio = v.cur / v.price * 100; const hugOk = v.cur <= (v.metro ? 7e8 : 5e8) && ratio <= 90; extra.push(HT.el('h3', { style: 'margin-top:16px' }, '보증금 안전 점검'), HT.rows([['전세가율 (보증금 ÷ 시세)', HT.pct(ratio, 1), ratio >= 80 ? 'neg' : '', ratio >= 80 ? '80% 이상 — 깡통전세 위험' : ratio >= 70 ? '70~80% — 주의' : '70% 미만 — 비교적 안전'], ['HUG 반환보증 가입 가능', HT.badge(hugOk ? '가능' : '불가 (전세가율 90% 초과 또는 한도 초과)', hugOk ? 'ok' : 'danger'), '', `전세가율 90% 이내 · 보증금 ${v.metro ? '수도권 7억' : '지방 5억'} 이하`], v.how === 'back' ? ['반전세 전환 후 전세가율', HT.pct(newDep / v.price * 100, 1), '', '보증금이 줄어 반환 위험도 줄어듭니다'] : null])); }
        out.set(HT.kpi(diff <= 0 ? '반전세 전환이 유리' : '전세 유지가 유리', HT.won(Math.abs(diff)) + '/월', diff <= 0 ? `연 ${HT.wonKor(-diff * 12)} 절약` : `연 ${HT.wonKor(diff * 12)} 더 부담`),
          HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(overLegal ? '법정 전환율 초과' : '법정 전환율 이내', overLegal ? 'danger' : 'ok'), ' ', v.mode === 'renew' ? HT.badge(overCap ? '5% 인상 상한 초과' : '5% 상한 이내', overCap ? 'danger' : 'ok') : HT.badge('새 계약 — 상한 미적용', 'gray')]),
          HT.rows(rows), ...extra,
          HT.el('div', { class: 'note', html: `<b>협상 포인트</b> 갱신 시 집주인이 전환율 ${legal}%를 넘는 월세를 요구하면 법적 근거가 없으며, 환산 보증금이 현재의 105%를 넘는 인상도 거절할 수 있습니다(갱신청구권 1회, 2년). 반대로 새 계약이면 상한이 없으므로 이 계산의 "법정 상한 월세"는 협상 기준값으로만 쓰세요.` }));
      }
      calc(f.values());
    }
  }
});
