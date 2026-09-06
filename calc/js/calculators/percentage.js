HT.register({
  id: 'percentage', cat: '금융·투자', order: 5, name: '퍼센트 계산기', keywords: '퍼센트 백분율 증감률 변화율 할인',
  desc: '어떤 값의 몇 %, 두 값의 비율, 이전 값에서 이후 값으로의 증감률을 계산합니다.',
  note: '기준값이 0이면 비율을 구할 수 없어 결과를 표시하지 않습니다. 음수도 넣을 수 있으며, 변화율이 음수면 감소를 뜻합니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'mode', label: '계산 종류', type: 'seg', options: [['of', 'A의 B%'], ['ratio', 'A는 B의 몇 %'], ['change', '변화율']], value: 'of' },
      { id: 'a1', label: '값 A', type: 'number', value: 50000, step: 'any', show: v => v.mode === 'of' },
      { id: 'b1', label: '퍼센트 B', type: 'number', unit: '%', value: 30, step: 'any', show: v => v.mode === 'of' },
      { id: 'a2', label: '비교값 A', type: 'number', value: 45, step: 'any', show: v => v.mode === 'ratio' },
      { id: 'b2', label: '기준값 B', type: 'number', value: 100, step: 'any', show: v => v.mode === 'ratio' },
      { id: 'a3', label: '이전 값', type: 'number', value: 800, step: 'any', show: v => v.mode === 'change' },
      { id: 'b3', label: '이후 값', type: 'number', value: 1000, step: 'any', show: v => v.mode === 'change' },
    ], calc);
    function calc(v) {
      if (v.mode === 'of') { const r = v.a1 * v.b1 / 100; out.set(HT.kpi(`${HT.fmt(v.a1, 2)}의 ${HT.fmt(v.b1, 2)}%`, HT.fmt(r, 2), 'A × B ÷ 100'), HT.rows([['A + B%', HT.fmt(v.a1 + r, 2), '', '할증·세금 포함 금액'], ['A − B%', HT.fmt(v.a1 - r, 2), '', '할인 후 금액']])); }
      else if (v.mode === 'ratio') { if (!v.b2) { out.set(HT.el('div', { class: 'empty' }, '기준값 B가 0이면 계산할 수 없습니다.')); return; } const r = v.a2 / v.b2 * 100; out.set(HT.kpi(`${HT.fmt(v.a2, 2)}는 ${HT.fmt(v.b2, 2)}의`, HT.pct(r, 2), '(A ÷ B) × 100'), HT.rows([['B − A', HT.fmt(v.b2 - v.a2, 2)], ['A ÷ B', HT.fmt(v.a2 / v.b2, 4)]])); }
      else { if (!v.a3) { out.set(HT.el('div', { class: 'empty' }, '이전 값이 0이면 변화율을 계산할 수 없습니다.')); return; } const r = (v.b3 - v.a3) / Math.abs(v.a3) * 100; out.set(HT.kpi('변화율', (r > 0 ? '+' : '') + HT.pct(r, 2), r >= 0 ? '증가' : '감소'), HT.rows([['변화량', (v.b3 - v.a3 > 0 ? '+' : '') + HT.fmt(v.b3 - v.a3, 2)], ['배율', HT.fmt(v.b3 / v.a3, 3) + '배']])); }
    }
    calc(f.values());
  }
});
