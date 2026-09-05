HT.register({
  id: 'inheritance-tax', cat: '주식·세금', order: 5, name: '상속세 계산기', keywords: '상속세 일괄공제 배우자공제 금융재산',
  desc: '상속재산에서 채무와 각종 공제를 빼고 누진세율과 세대생략 할증, 신고세액공제를 적용해 상속세를 계산합니다.',
  note: '일괄공제 5억원과 "기초공제 2억원 + 인적공제" 중 큰 쪽을 선택할 수 있습니다. 배우자공제는 실제 상속받은 금액 기준으로 최소 5억원, 최대 30억원입니다. 금융재산공제는 순금융재산의 20%(2천만원 이하는 전액, 한도 2억원)입니다. 상속개시일이 속한 달의 말일부터 6개월 안에 신고하면 3%를 공제합니다. 상속인이 여럿이면 세액을 상속 지분대로 나누어 냅니다. 2024년 말 정부가 낸 개편안(최고세율 40%, 자녀공제 5억원)은 국회에서 부결되어 현행 세율·공제를 그대로 적용합니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'asset', label: '총 상속재산가액', type: 'money', unit: '원', value: 2000000000 },
      { id: 'debt', label: '채무·공과금·장례비', type: 'money', unit: '원', value: 100000000 },
      { id: 'gift', label: '사전증여재산 (10년 이내)', type: 'money', unit: '원', value: 0 },
      { id: 'mode', label: '공제 방식', type: 'seg', options: [['lump', '일괄공제 5억'], ['basic', '기초공제 + 인적공제']], value: 'lump' },
      { id: 'kids', label: '자녀 수 (1인당 5천만원)', type: 'number', unit: '명', value: 2, min: 0, show: v => v.mode === 'basic' },
      { id: 'spouse', label: '배우자 있음', type: 'check', value: true },
      { id: 'spAmt', label: '배우자 실제 상속액', type: 'money', unit: '원', value: 800000000, show: v => v.spouse, help: '5억~30억원 범위로 자동 조정' },
      { id: 'fin', label: '순금융재산 (예금·주식 등)', type: 'money', unit: '원', value: 300000000 },
      { id: 'house', label: '동거주택 가액 (10년 이상 동거 1주택)', type: 'money', unit: '원', value: 0 },
      { id: 'skip', label: '세대생략 할증', type: 'select', options: [['0', '해당 없음'], ['30', '세대생략 (30%)'], ['40', '세대생략 · 미성년 20억 초과 (40%)']], value: '0' },
      { id: 'report', label: '기한 내 신고 (3% 세액공제)', type: 'check', value: true },
    ], calc);
    function calc(v) {
      const taxable = v.asset - v.debt + v.gift;
      const basic = v.mode === 'lump' ? 5e8 : Math.max(5e8, 2e8 + 5e7 * v.kids); // 기초+인적이 5억 미만이면 일괄공제가 유리
      const sp = v.spouse ? HT.clamp(v.spAmt, 5e8, 3e9) : 0;
      const fin = v.fin <= 2e7 ? v.fin : Math.min(2e8, Math.max(2e7, v.fin * .2));
      const house = Math.min(6e8, v.house);
      const ded = basic + sp + fin + house; const base = Math.max(0, taxable - ded); const p = HT.progressive(base, HT.GIFT_TAX);
      const surcharge = p.tax * HT.num(v.skip) / 100; const credit = v.report ? (p.tax + surcharge) * .03 : 0; const final = Math.max(0, p.tax + surcharge - credit);
      const split = HT.bracketSplit(base, HT.GIFT_TAX);
      out.set(HT.kpi('납부할 상속세', HT.won(final), `실효세율 ${HT.pct(v.asset ? final / v.asset * 100 : 0, 2)}`),
        HT.rows([['총 상속재산', HT.won(v.asset)], ['채무·공과금·장례비', '-' + HT.won(v.debt), 'sub'], v.gift ? ['사전증여재산', '+' + HT.won(v.gift), 'sub'] : null, ['상속세 과세가액', HT.won(taxable)], [v.mode === 'lump' ? '일괄공제' : '기초공제 + 인적공제', '-' + HT.won(basic), 'sub', v.mode === 'basic' && basic === 5e8 ? '5억원 미만이라 일괄공제 적용' : ''], v.spouse ? ['배우자 상속공제', '-' + HT.won(sp), 'sub'] : null, ['금융재산 상속공제', '-' + HT.won(fin), 'sub'], house ? ['동거주택 상속공제', '-' + HT.won(house), 'sub'] : null, ['공제 합계', '-' + HT.won(ded)], ['과세표준', HT.won(base), 'strong'], ['적용 세율', HT.pct(p.rate * 100, 0) + (p.deduct ? ` (누진공제 ${HT.won(p.deduct)})` : '')], ['산출세액', HT.won(p.tax)], surcharge ? ['세대생략 할증', '+' + HT.won(surcharge), 'sub'] : null, ['신고세액공제 (3%)', '-' + HT.won(credit), 'sub'], ['납부세액', HT.won(final), 'strong']]),
        split.length ? HT.barChart(split.map(s => ({ label: `${HT.pct(s.rate * 100, 0)} 구간`, value: s.tax, color: 'var(--c1)' })), { fmt: HT.won, cap: '구간별 산출세액' }) : null);
    }
    calc(f.values());
  }
});
