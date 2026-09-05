HT.register({
  id: 'capital-gains-tax', cat: '부동산', order: 2, name: '양도소득세 계산기', keywords: '양도세 양도소득세 장기보유특별공제 1세대1주택',
  desc: '주택 양도차익에 장기보유특별공제·기본공제·누진세율을 적용해 양도소득세를 계산합니다. (2026년 기준)',
  note: '1세대 1주택은 2년 이상 보유(조정대상지역은 2년 이상 거주)하면 양도가액 12억원까지 비과세이고, 12억원 초과분만 과세합니다. 다주택자 양도세 중과 유예가 2026년 5월 9일 끝나, 조정대상지역 주택을 양도하면 2주택자는 기본세율 + 20%p, 3주택 이상은 + 30%p가 붙고 장기보유특별공제를 받지 못합니다. 다른 양도소득과의 합산, 감면 특례는 반영하지 않았습니다.',
  render(root) {
    const out = HT.output(root);
    const today = new Date().toISOString().slice(0, 10);
    const f = HT.form(root, [
      { id: 'buy', label: '취득가액', type: 'money', unit: '원', value: 600000000 },
      { id: 'sell', label: '양도가액', type: 'money', unit: '원', value: 1500000000 },
      { id: 'cost', label: '필요경비', type: 'money', unit: '원', value: 20000000, help: '취득세·중개수수료·자본적 지출 등' },
      { id: 'd1', label: '취득일', type: 'date', value: '2018-03-01' },
      { id: 'd2', label: '양도일', type: 'date', value: today },
      { id: 'cnt', label: '세대 보유 주택 수', type: 'seg', options: [['1', '1주택'], ['2', '2주택'], ['3', '3주택 이상']], value: '1' },
      { id: 'adj', label: '조정대상지역 주택', type: 'check', value: true },
      { id: 'live', label: '거주 기간', type: 'number', unit: '년', value: 5, min: 0, show: v => v.cnt === '1' },
    ], calc);
    function calc(v) {
      const days = HT.daysBetween(v.d1, v.d2); const holdY = Math.floor(days / 365.25);
      const gain = v.sell - v.buy - v.cost;
      if (days <= 0 || v.sell <= 0) { out.set(HT.el('div', { class: 'empty' }, '취득일·양도일과 금액을 확인하세요.')); return; }
      const rows = [['양도차익', HT.won(gain), '', `보유 ${holdY}년 (${HT.fmt(days)}일)`]];
      let exempt = false, taxable = gain; const one = v.cnt === '1';
      const qualifies = one && holdY >= 2 && (!v.adj || v.live >= 2);
      const heavy = !one && v.adj; const surcharge = heavy ? (v.cnt === '2' ? 0.2 : 0.3) : 0; // 2026.5.9 중과 유예 종료
      if (qualifies) { if (v.sell <= 1.2e9) { exempt = true; taxable = 0; } else { taxable = gain * (v.sell - 1.2e9) / v.sell; rows.push(['과세 대상 양도차익', HT.won(taxable), '', '12억원 초과분 비율만 과세']); } }
      let ltRate = 0;
      if (holdY >= 3 && !heavy) { if (qualifies) { ltRate = Math.min(0.4, 0.04 * holdY) + (v.live >= 2 ? Math.min(0.4, 0.04 * Math.floor(v.live)) : 0); } else ltRate = Math.min(0.3, 0.06 + 0.02 * (holdY - 3)); }
      let ltDed = Math.max(0, taxable) * ltRate; const income = Math.max(0, taxable - ltDed); const base = Math.max(0, income - 2.5e6);
      let tax, rateTxt;
      if (holdY < 1) { tax = base * 0.7; rateTxt = '70% (1년 미만 보유)'; } else if (holdY < 2) { tax = base * 0.6; rateTxt = '60% (2년 미만 보유)'; }
      else { const p = HT.progressive(base, HT.INCOME_TAX); tax = p.tax + base * surcharge; rateTxt = HT.pct(p.rate * 100, 0) + (surcharge ? ` + 중과 ${surcharge * 100}%p` : '') + (p.deduct ? ' (누진공제 ' + HT.won(p.deduct) + ')' : ''); }
      const local = tax * 0.1;
      if (exempt) { out.set(HT.kpi('양도소득세', '0원', '1세대 1주택 비과세 (양도가액 12억원 이하)'), HT.rows(rows)); return; }
      rows.push(['장기보유특별공제', '-' + HT.won(ltDed), 'sub', heavy ? '중과 대상은 장기보유특별공제 배제' : `공제율 ${HT.pct(ltRate * 100, 0)}`], ['양도소득금액', HT.won(income)], ['기본공제', '-2,500,000원', 'sub'], ['과세표준', HT.won(base), 'strong'], ['적용 세율', rateTxt], ['산출세액 (양도소득세)', HT.won(tax)], ['지방소득세 (10%)', HT.won(local), 'sub']);
      const sub = qualifies ? '1세대 1주택 · 12억원 초과분 과세' : one ? '1세대 1주택 요건 미충족 (보유·거주 기간)' : heavy ? `조정대상지역 ${v.cnt === '2' ? '2주택' : '3주택 이상'} 중과` : '다주택 · 비조정지역 일반 과세';
      out.set(HT.kpi('총 납부세액', HT.won(tax + local), sub), HT.rows(rows), HT.badge(gain < 0 ? '양도차손' : heavy ? '중과세' : '과세', gain < 0 ? 'gray' : heavy ? 'danger' : 'ok'));
    }
    calc(f.values());
  }
});
