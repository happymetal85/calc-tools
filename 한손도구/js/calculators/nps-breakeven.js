/* 국민연금 본전 나이 — 낸 보험료 총액 vs 받을 연금, 몇 살까지 살아야 본전인지, 수익비, 조기·연기 수령 비교
   2026 개혁: 보험료율 9.5%(2033년 13%까지 매년 0.5%p↑), 소득대체율 43%, 기본연금액(연) = 1.29 × (A + B) × (1 + 0.05 × (n − 20)), A값 3,193,511원
   조기수령: 최대 5년, 1년당 6% 감액. 연기수령: 최대 5년, 1년당 7.2% 증액. 모든 금액은 현재 가치(실질) */
HT.register({
  id: 'nps-breakeven', cat: '급여·소득', order: 0.8, original: false, name: '국민연금 본전 나이', keywords: '국민연금 본전 수익비 손익분기 나이 조기수령 연기수령 예상수령액',
  desc: '내가 낼 국민연금 보험료 총액과 받을 연금을 견주어 몇 살까지 살아야 본전인지, 기대수명까지 살면 낸 돈의 몇 배를 받는지(수익비), 조기·연기 수령 중 무엇이 유리한지 계산합니다.',
  note: '보험료는 2026년 9.5%에서 2033년 13%까지 오르는 개혁 일정을 반영했고, 본인 부담(절반)과 사업장 전체(회사 부담 포함) 두 기준으로 본전을 냅니다. 연금액은 2026년 개혁 산식(소득대체율 43%)을 가입기간 전체에 단순 적용한 근사치이며 국민연금공단 예상연금 조회와 다를 수 있습니다. 모든 금액은 오늘의 물가 기준(연금은 물가 연동)입니다. 부양가족연금, 유족연금, 소득 있는 업무 종사 시 감액 등은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root, '본전 계산');
    const A = 3193511;
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '현재 나이', type: 'number', unit: '세', value: 32, min: 18, max: 64 },
      { id: 'birth', p: 'birth', label: '출생연도', type: 'number', unit: '년', value: 1994, min: 1940, max: 2010 },
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000, help: '기준소득월액 상한 659만원 적용' },
      { id: 'paid', label: '지금까지 가입 기간', type: 'number', unit: '년', value: 6, min: 0, max: 45 },
      { id: 'future', label: '앞으로 더 낼 기간', type: 'number', unit: '년', value: 26, min: 0, max: 45 },
      { id: 'life', label: '기대수명', type: 'number', unit: '세', value: 88, min: 60, max: 110 },
      { id: 'timing', label: '수령 시점', type: 'seg', options: [['-5', '5년 조기'], ['-3', '3년 조기'], ['0', '정상'], ['3', '3년 연기'], ['5', '5년 연기']], value: '0' },
    ], calc);
    const startAge = (birth) => birth <= 1952 ? 60 : birth <= 1956 ? 61 : birth <= 1960 ? 62 : birth <= 1964 ? 63 : birth <= 1968 ? 64 : 65;
    const rateIn = (year) => Math.min(13, 9.5 + 0.5 * Math.max(0, year - 2026)) / 100;
    function calc(v) {
      const B = Math.min(v.salary / 12, 6590000); const n = v.paid + v.future; if (n < 10) { out.set(HT.el('div', { class: 'empty' }, '가입 기간이 10년 미만이면 연금이 아니라 반환일시금을 받습니다. 기간을 10년 이상으로 넣으세요.')); return; }
      // 납입 총액: 과거는 9%, 앞으로는 개혁 일정
      let paidOwn = B * 0.09 * 12 * v.paid / 2; let paidTotal = B * 0.09 * 12 * v.paid; for (let y = 0; y < v.future; y++) { const r = rateIn(2026 + y); paidOwn += B * r * 12 / 2; paidTotal += B * r * 12; }
      const base = 1.29 * (A + B) * (1 + 0.05 * Math.max(0, n - 20)) * Math.min(1, n / 20) / 12; const s0 = startAge(v.birth); const shift = HT.num(v.timing);
      const factor = shift < 0 ? 1 + 0.06 * shift : 1 + 0.072 * shift; const monthly = base * factor; const start = s0 + shift;
      const beOwn = start + paidOwn / (monthly * 12), beTotal = start + paidTotal / (monthly * 12);
      const years = Math.max(0, v.life - start); const received = monthly * 12 * years; const ratioOwn = received / paidOwn, ratioTotal = received / paidTotal;
      // 수령 시점별 비교 (기대수명까지 총액)
      const cmp = [-5, -3, 0, 3, 5].map(s => { const fct = s < 0 ? 1 + 0.06 * s : 1 + 0.072 * s; const m = base * fct; const yrs = Math.max(0, v.life - (s0 + s)); return { s, m, total: m * 12 * yrs, start: s0 + s }; }); const best = cmp.reduce((a, b) => b.total > a.total ? b : a);
      // 정상 vs 조기/연기 교차 나이
      const cross = cmp.filter(c => c.s !== 0).map(c => { const m0 = base; const a0 = s0; let age = null; for (let t = Math.min(a0, c.start); t <= 110; t++) { const tot0 = m0 * 12 * Math.max(0, t - a0), tot1 = c.m * 12 * Math.max(0, t - c.start); if ((c.s < 0 && tot0 >= tot1 && t > c.start) || (c.s > 0 && tot1 >= tot0 && t > c.start)) { age = t; break; } } return [c.s, age]; });
      out.set(HT.kpi('본전 나이 (본인 부담 기준)', `${HT.fmt(beOwn, 1)}세`, `${start}세부터 월 ${HT.won(monthly)} 수령 · 본인이 낸 ${HT.wonKor(paidOwn)}을 ${HT.fmt(beOwn - start, 1)}년 만에 회수`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(`회사 부담 포함 기준 본전 ${HT.fmt(beTotal, 1)}세`, beTotal <= v.life ? 'ok' : 'warn'), ' ', HT.badge(`${v.life}세까지 수익비 ${HT.fmt(ratioOwn, 2)}배 (전체 ${HT.fmt(ratioTotal, 2)}배)`, ratioTotal >= 1 ? 'ok' : 'danger')]),
        HT.kpis([['낼 보험료 총액 (본인)', HT.wonKor(paidOwn), `전체(회사 포함) ${HT.wonKor(paidTotal)} · 가입 ${n}년`], ['예상 연금 (월, 현재 가치)', HT.won(monthly), shift ? `정상 ${HT.won(base)} × ${HT.pct(factor * 100, 1)}` : `소득대체율 43% 산식`], [`${v.life}세까지 총 수령`, HT.wonKor(received), `${years}년 × 12개월`]]),
        HT.el('h3', {}, '수령 시점별 비교 (기대수명 ' + v.life + '세 기준)'),
        HT.table(['시점', '시작 나이', '월 연금', '총 수령액', '정상 수령과 교차하는 나이'], cmp.map(c => { const cr = cross.find(x => x[0] === c.s); return [c.s === 0 ? '정상' : c.s < 0 ? `${-c.s}년 조기` : `${c.s}년 연기`, c.start + '세', HT.won(c.m), HT.wonKor(c.total), c.s === 0 ? '-' : cr && cr[1] ? `${cr[1]}세` + (c.s < 0 ? ' 이후 정상이 유리' : ' 이후 연기가 유리') : '-']; }), { right: [1, 2, 3], scroll: false, hi: r => r[3] === HT.wonKor(best.total) }),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 기대수명 ${v.life}세라면 <b>${best.s === 0 ? '정상 수령' : best.s < 0 ? best.s * -1 + '년 조기 수령' : best.s + '년 연기 수령'}</b>이 총액이 가장 큽니다. 조기 수령은 대략 ${cross.find(x => x[0] === -5)?.[1] || '-'}세 전에 사망할 때만 유리하고, 연기 수령은 ${cross.find(x => x[0] === 5)?.[1] || '-'}세 넘게 살 때 유리합니다. 건강·다른 소득·배우자 유족연금까지 고려해 정하세요. 국민연금은 물가에 연동되고 평생 지급되는 점이 사적연금과 다른 가치입니다.` }));
    }
    calc(f.values());
  }
});
