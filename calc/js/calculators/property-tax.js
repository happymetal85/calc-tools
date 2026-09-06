HT.register({
  id: 'property-tax', cat: '부동산', order: 8, name: '재산세 계산기', keywords: '재산세 지방교육세 도시지역분 공시가격',
  desc: '주택·건축물·토지의 공시가격(시가표준액)으로 재산세와 지방교육세·도시지역분을 계산합니다.',
  note: '주택 재산세는 7월과 9월에 절반씩 나누어 냅니다(세액 20만원 이하는 7월에 전액). 1세대 1주택 특례세율은 공시가격 9억원 이하 주택에만 적용되며, 현행 법 부칙으로는 2026년분이 마지막이지만 2026년 8월 발표된 지방세제 개편안은 2029년까지 3년 연장하는 내용을 담고 있습니다. 지역자원시설세와 세부담 상한은 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const H_GEN = [[6e7, .001, 0], [1.5e8, .0015, 3e4], [3e8, .0025, 18e4], [Infinity, .004, 63e4]];
    const H_ONE = [[6e7, .0005, 0], [1.5e8, .001, 3e4], [3e8, .002, 18e4], [Infinity, .0035, 63e4]];
    const L_SUM = [[5e7, .002, 0], [1e8, .003, 5e4], [Infinity, .005, 25e4]];
    const L_SEP = [[2e8, .002, 0], [1e9, .003, 20e4], [Infinity, .004, 120e4]];
    const f = HT.form(root, [
      { id: 'kind', label: '부동산 유형', type: 'seg', options: [['house', '주택'], ['bldg', '건축물'], ['land', '토지']], value: 'house' },
      { id: 'price', label: '공시가격 (시가표준액)', type: 'money', unit: '원', value: 800000000, help: '토지는 개별공시지가 × 면적' },
      { id: 'one', label: '1세대 1주택 (특례세율)', type: 'check', value: true, show: v => v.kind === 'house' },
      { id: 'btype', label: '건축물 종류', type: 'select', options: [['gen', '일반 건축물 (0.25%)'], ['golf', '골프장·고급오락장 (4%)'], ['factory', '주거지역 내 공장 (0.5%)']], value: 'gen', show: v => v.kind === 'bldg' },
      { id: 'ltype', label: '토지 구분', type: 'select', options: [['sum', '종합합산 (나대지 등)'], ['sep', '별도합산 (사업용 토지)'], ['farm', '분리과세 — 전·답·과수원·목장 (0.07%)'], ['golf', '분리과세 — 골프장·고급오락장 (4%)'], ['etc', '분리과세 — 기타 (0.2%)']], value: 'sum', show: v => v.kind === 'land' },
      { id: 'urban', label: '도시지역 (도시지역분 0.14% 과세)', type: 'check', value: true },
    ], calc);
    function calc(v) {
      let ratio, base, tax, desc, split = null;
      if (v.kind === 'house') { const one = v.one && v.price <= 9e8; ratio = one ? (v.price <= 3e8 ? .43 : v.price <= 6e8 ? .44 : .45) : .6; base = v.price * ratio; const t = one ? H_ONE : H_GEN; const p = HT.progressive(base, t); tax = p.tax; desc = (one ? '1세대 1주택 특례세율' : (v.one ? '공시가격 9억원 초과로 일반세율' : '일반세율')) + ` ${HT.pct(p.rate * 100, 2)}`; split = HT.bracketSplit(base, t); }
      else if (v.kind === 'bldg') { ratio = .7; base = v.price * ratio; const r = v.btype === 'golf' ? .04 : v.btype === 'factory' ? .005 : .0025; tax = base * r; desc = `건축물 ${HT.pct(r * 100, 2)}`; }
      else { ratio = .7; base = v.price * ratio; if (v.ltype === 'sum') { const p = HT.progressive(base, L_SUM); tax = p.tax; desc = `종합합산 ${HT.pct(p.rate * 100, 1)}`; split = HT.bracketSplit(base, L_SUM); } else if (v.ltype === 'sep') { const p = HT.progressive(base, L_SEP); tax = p.tax; desc = `별도합산 ${HT.pct(p.rate * 100, 1)}`; split = HT.bracketSplit(base, L_SEP); } else { const r = v.ltype === 'farm' ? .0007 : v.ltype === 'golf' ? .04 : .002; tax = base * r; desc = `분리과세 ${HT.pct(r * 100, 2)}`; } }
      const edu = tax * 0.2, urban = v.urban ? base * 0.0014 : 0, total = tax + edu + urban;
      const rows = [['과세표준', HT.won(base), 'strong', `공시가격 × 공정시장가액비율 ${HT.pct(ratio * 100, 0)}`], ['재산세', HT.won(tax), '', desc], ['지방교육세 (재산세의 20%)', HT.won(edu), 'sub'], v.urban ? ['도시지역분 (과세표준 × 0.14%)', HT.won(urban), 'sub'] : null, ['합계', HT.won(total), 'strong']];
      if (v.kind === 'house') { const half = total > 2e5 ? total / 2 : total; rows.push(['7월 납부분', HT.won(half), 'sub'], ['9월 납부분', HT.won(total > 2e5 ? total - half : 0), 'sub']); }
      out.set(HT.kpi('재산세 합계', HT.won(total), '재산세 + 지방교육세' + (v.urban ? ' + 도시지역분' : '')), HT.rows(rows),
        split && split.length > 1 ? HT.barChart(split.map(s => ({ label: `${HT.wonKor(s.from)}~${isFinite(s.to) ? HT.wonKor(s.to) : ''} ${HT.pct(s.rate * 100, 2)}`, value: s.tax, color: 'var(--c1)' })), { padL: 210, fmt: HT.won, cap: '구간별 재산세' }) : null);
    }
    calc(f.values());
  }
});
