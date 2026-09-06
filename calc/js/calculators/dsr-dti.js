HT.register({
  id: 'dsr-dti', cat: '부동산', order: 6, name: 'DSR/DTI 계산기', keywords: 'DSR DTI 대출 한도 스트레스',
  desc: '보유 대출의 연간 원리금 상환액으로 총부채원리금상환비율(DSR)과 총부채상환비율(DTI)을 계산하고, 규제 한도 안에서 추가로 받을 수 있는 대출 금액을 추정합니다.',
  note: 'DSR은 모든 대출의 연간 원리금 상환액 합계를 연소득으로 나눈 값이고, DTI는 주택담보대출 원리금과 기타 대출 이자만 반영합니다. 은행권 DSR 한도는 40%, DTI는 규제지역 40~50%·비규제지역 60%입니다. 만기일시 신용대출 원금은 5년 분할로 환산했습니다. 스트레스 DSR 가산금리는 2025년 10월 16일부터 수도권·규제지역 주택담보대출 3.0%p, 지방 주택담보대출은 2026년 말까지 2단계(1.5%p)가 유지되며, 신용대출은 1.5%p입니다.',
  render(root) {
    const TYPES = [['mort', '주택담보대출'], ['credit', '신용대출'], ['car', '자동차대출'], ['card', '카드론'], ['etc', '기타대출']];
    const METHODS = [['equal', '원리금균등'], ['principal', '원금균등'], ['bullet', '만기일시']];
    const out = HT.output(root);
    let loans = [{ type: 'mort', bal: 300000000, rate: 4.0, months: 360, method: 'equal' }, { type: 'credit', bal: 30000000, rate: 6.0, months: 12, method: 'bullet' }];
    const listBox = HT.el('div');
    const addBtn = HT.el('button', { class: 'btn sm', type: 'button' }, '+ 대출 추가');
    addBtn.addEventListener('click', () => { if (loans.length >= 10) return; loans.push({ type: 'credit', bal: 0, rate: 5, months: 12, method: 'bullet' }); drawLoans(); run(); });
    const extra = HT.el('div', {}, [HT.el('h3', {}, '보유 대출 (최대 10건)'), listBox, addBtn]);
    const f = HT.form(root, [
      { id: 'income', p: 'salary', label: '연소득 (세전)', type: 'money', unit: '원', value: 70000000 },
      { id: 'zone', label: '규제지역 구분', type: 'select', options: [['spec', '투기지역·투기과열지구'], ['adj', '조정대상지역'], ['none', '비규제지역']], value: 'adj' },
      { id: 'metro', label: '수도권·규제지역 주담대 (스트레스 가산 3.0%p, 지방은 1.5%p)', type: 'check', value: true },
      { id: 'stress', label: '스트레스 DSR 적용', type: 'check', value: true },
      { id: 'nrate', label: '신규 대출 금리', type: 'number', unit: '%', value: 4.5, step: 0.1 },
      { id: 'nyears', label: '신규 대출 기간', type: 'number', unit: '년', value: 30 },
    ], run, { extra });
    function drawLoans() {
      listBox.innerHTML = '';
      loans.forEach((l, i) => {
        const sel = (opts, key) => { const s = HT.el('select'); opts.forEach(([v, t]) => s.append(HT.el('option', { value: v }, t))); s.value = l[key]; s.addEventListener('change', () => { l[key] = s.value; run(); }); return s; };
        const num = (key, unit, step) => { const inp = HT.el('input', { type: 'text', inputmode: 'decimal', value: key === 'bal' ? HT.fmt(l[key]) : l[key] }); inp.addEventListener('input', () => { l[key] = HT.num(inp.value); if (key === 'bal') inp.value = HT.fmt(l[key]); run(); }); return HT.el('div', { class: 'in' }, [inp, HT.el('span', { class: 'unit' }, unit)]); };
        const del = HT.el('button', { class: 'btn sm', type: 'button' }, '삭제'); del.addEventListener('click', () => { loans.splice(i, 1); drawLoans(); run(); });
        listBox.append(HT.el('div', { class: 'field', style: 'border:1px solid var(--line);border-radius:4px;padding:10px' }, [
          HT.el('div', { class: 'row2' }, [HT.el('div', {}, [HT.el('label', {}, '대출 유형'), sel(TYPES, 'type')]), HT.el('div', {}, [HT.el('label', {}, '상환 방식'), sel(METHODS, 'method')])]),
          HT.el('div', { style: 'margin-top:8px' }, [HT.el('label', {}, '대출 잔액'), num('bal', '원')]),
          HT.el('div', { class: 'row2', style: 'margin-top:8px' }, [HT.el('div', {}, [HT.el('label', {}, '연이율'), num('rate', '%')]), HT.el('div', {}, [HT.el('label', {}, '잔여 만기'), num('months', '개월')])]),
          HT.el('div', { style: 'margin-top:8px;text-align:right' }, del)]));
      });
    }
    function annual(l, rateAdd) {
      const r = (l.rate + rateAdd) / 100 / 12, n = Math.max(1, Math.round(l.months)), P = l.bal; if (P <= 0) return { pi: 0, i: 0 };
      if (l.method === 'equal') { const m = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n; return { pi: m * 12, i: Math.min(12, n) * P * r }; }
      if (l.method === 'principal') { const pr = P / n; let i = 0, bal = P; for (let k = 0; k < Math.min(12, n); k++) { i += bal * r; bal -= pr; } return { pi: pr * Math.min(12, n) + i, i }; }
      const i = P * r * 12; const prin = l.type === 'mort' ? P / Math.max(1, n / 12) : P / 5; return { pi: i + prin, i };
    }
    function run() {
      const v = f.values(); const add = v.stress ? (v.metro ? 3.0 : 1.5) : 0; const addCredit = v.stress ? 1.5 : 0;
      let dsrSum = 0, dsrStress = 0, dtiSum = 0;
      loans.forEach(l => { const a = annual(l, 0); dsrSum += a.pi; const s = annual(l, l.type === 'mort' ? add : l.type === 'credit' ? addCredit : 0); dsrStress += s.pi; dtiSum += l.type === 'mort' ? a.pi : a.i; });
      const inc = v.income || 1; const dsr = dsrSum / inc * 100, dsrS = dsrStress / inc * 100, dti = dtiSum / inc * 100;
      const dsrLimit = 40, dtiLimit = v.zone === 'spec' ? 40 : v.zone === 'adj' ? 50 : 60;
      const useDsr = v.stress ? dsrS : dsr;
      const room = Math.max(0, inc * dsrLimit / 100 - (v.stress ? dsrStress : dsrSum));
      const nr = (v.nrate + add) / 100 / 12, nn = v.nyears * 12; const maxLoan = nr ? room / 12 * (Math.pow(1 + nr, nn) - 1) / (nr * Math.pow(1 + nr, nn)) : room / 12 * nn;
      const badge = (val, lim) => HT.badge(val <= lim ? `한도 이내 (${lim}%)` : `한도 초과 (${lim}%)`, val <= lim ? 'ok' : 'danger');
      out.set(HT.kpis([['DSR', HT.pct(dsr, 1), '연간 원리금 ' + HT.won(dsrSum)], ['스트레스 DSR', HT.pct(dsrS, 1), `주담대 +${add}%p · 신용 +${addCredit}%p`], ['DTI', HT.pct(dti, 1), '연간 ' + HT.won(dtiSum)]]),
        HT.rows([['DSR 판정', badge(useDsr, dsrLimit), '', v.stress ? '스트레스 금리 기준' : '실제 금리 기준'], ['DTI 판정', badge(dti, dtiLimit)], ['DSR 여유 상환액 (연)', HT.won(room)], ['추가 대출 가능 금액 (추정)', HT.won(maxLoan), 'strong', `원리금균등 ${v.nyears}년 · 연 ${HT.fmt(v.nrate + add, 2)}% 기준`]]),
        HT.barChart([{ label: 'DSR', value: dsr, color: 'var(--c1)' }, { label: '스트레스 DSR', value: dsrS, color: 'var(--c2)' }, { label: 'DTI', value: dti, color: 'var(--g2)' }, { label: 'DSR 한도', value: dsrLimit, color: 'var(--g3)' }], { fmt: x => HT.pct(x, 1) }));
    }
    drawLoans(); run();
  }
});
