HT.register({
  id: 'financial-products', cat: '금융·투자', order: 7, name: '금융상품 금리 비교', keywords: '예금 적금 금리 비교 대출 우대금리',
  desc: '예금·적금·대출 상품의 금리를 직접 입력해 같은 조건에서 예상 이자와 상환액을 비교합니다.',
  note: '금융감독원 금융상품통합비교공시(finlife.fss.or.kr) API는 서버에서만 호출할 수 있어, 여기서는 상품을 직접 입력해 비교합니다. 예금 이자는 단리·만기 지급, 적금은 월초 납입 단리, 대출은 원리금균등 기준이며 이자소득세 15.4%를 뺀 세후 이자도 함께 보여줍니다. 예금자보호는 1인당 1금융기관 5,000만원까지입니다.',
  render(root) {
    const out = HT.output(root);
    let products = [{ bank: '예시 A은행', name: '정기예금', base: 3.0, max: 3.4 }, { bank: '예시 B저축은행', name: '정기예금', base: 3.5, max: 3.8 }, { bank: '예시 C은행', name: '특판예금', base: 3.2, max: 4.0 }];
    const listBox = HT.el('div');
    const addBtn = HT.el('button', { class: 'btn sm', type: 'button' }, '+ 상품 추가'); addBtn.addEventListener('click', () => { products.push({ bank: '', name: '', base: 3, max: 3 }); draw(); run(); });
    const f = HT.form(root, [
      { id: 'type', label: '상품 유형', type: 'select', options: [['deposit', '정기예금'], ['savings', '적금'], ['loan', '대출 (주택담보·전세·신용)']], value: 'deposit' },
      { id: 'amt', label: '예금액 / 월 납입액 / 대출금액', type: 'money', unit: '원', value: 10000000 },
      { id: 'months', label: '기간', type: 'select', options: [['6', '6개월'], ['12', '12개월'], ['24', '24개월'], ['36', '36개월'], ['120', '10년'], ['360', '30년']], value: '12' },
      { id: 'sort', label: '정렬', type: 'seg', options: [['rate', '금리순'], ['name', '은행명순']], value: 'rate' },
      { id: 'useMax', label: '최고 우대금리로 계산', type: 'check', value: true },
    ], run, { extra: HT.el('div', {}, [HT.el('h3', {}, '비교할 상품'), listBox, addBtn]) });
    function draw() { listBox.innerHTML = ''; products.forEach((p, i) => { const inp = (k, ph, num) => { const e = HT.el('input', { type: 'text', value: p[k], placeholder: ph }); e.addEventListener('input', () => { p[k] = num ? HT.num(e.value) : e.value; run(); }); return e; }; const del = HT.el('button', { class: 'btn sm', type: 'button' }, '×'); del.addEventListener('click', () => { products.splice(i, 1); draw(); run(); });
      listBox.append(HT.el('div', { class: 'field', style: 'display:grid;grid-template-columns:1.2fr 1.2fr .7fr .7fr auto;gap:6px;align-items:center' }, [inp('bank', '금융기관'), inp('name', '상품명'), inp('base', '기본%', true), inp('max', '최고%', true), del])); }); }
    function run() {
      const v = f.values(); const n = HT.num(v.months); const rows = products.map(p => { const r = (v.useMax ? p.max : p.base) / 100; let interest = 0, total = 0, monthly = 0;
        if (v.type === 'deposit') { interest = v.amt * r * n / 12; total = v.amt + interest; } else if (v.type === 'savings') { interest = v.amt * r / 12 * n * (n + 1) / 2; total = v.amt * n + interest; } else { const mr = r / 12; monthly = mr ? v.amt * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1) : v.amt / n; total = monthly * n; interest = total - v.amt; }
        return { ...p, r, interest, total, monthly, net: interest * .846 }; });
      rows.sort((a, b) => v.sort === 'rate' ? (v.type === 'loan' ? a.r - b.r : b.r - a.r) : (a.bank || '').localeCompare(b.bank || '', 'ko'));
      if (!rows.length) { out.set(HT.el('div', { class: 'empty' }, '비교할 상품을 추가하세요.')); return; }
      const best = rows[0];
      out.set(HT.kpi(v.type === 'loan' ? '가장 낮은 금리' : '가장 높은 금리', `${best.bank || '-'} ${HT.pct(best.r * 100, 2)}`, v.type === 'loan' ? `월 상환액 ${HT.won(best.monthly)} · 총이자 ${HT.won(best.interest)}` : `예상 이자 ${HT.won(best.interest)} (세후 ${HT.won(best.net)})`),
        v.type === 'loan' ? HT.table(['금융기관', '상품명', '금리', '월 상환액', '총 이자', '총 상환액'], rows.map(p => [p.bank, p.name, HT.pct(p.r * 100, 2), HT.won(p.monthly), HT.won(p.interest), HT.won(p.total)]), { right: [2, 3, 4, 5], hi: (r, i) => i === 0 })
          : HT.table(['금융기관', '상품명', '기본금리', '최고금리', '예상 이자 (세전)', '세후 이자', '만기 수령액'], rows.map(p => [p.bank, p.name, HT.pct(p.base, 2), HT.pct(p.max, 2), HT.won(p.interest), HT.won(p.net), HT.won(p.total - p.interest + p.net)]), { right: [2, 3, 4, 5, 6], hi: (r, i) => i === 0 }),
        HT.barChart(rows.slice(0, 8).map((p, i) => ({ label: p.bank || '(이름 없음)', value: p.r * 100, color: i === 0 ? 'var(--c1)' : 'var(--g3)' })), { fmt: x => HT.pct(x, 2), cap: '적용 금리 비교' }));
    }
    draw(); run();
  }
});
