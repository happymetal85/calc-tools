HT.register({
  id: 'electricity-bill', cat: '유용한도구', order: 2, name: '전기요금 계산기', keywords: '전기요금 누진제 kWh 한전 주택용',
  desc: '월 사용량과 계절로 주택용(저압) 누진 전기요금을 계산합니다. 기본요금·전력량요금·기후환경요금·연료비조정액·부가세·전력산업기반기금을 모두 포함합니다.',
  note: '주택용 저압 기준입니다. 하계(7~8월)는 누진 구간이 300/450kWh로 완화되고, 하계·동계에 1,000kWh를 넘으면 슈퍼유저 요금(736.2원/kWh)이 적용됩니다. 실제 고지서에는 TV수신료(2,500원), 복지할인, 자동이체 할인, 대가족·다자녀 할인 등이 더해지거나 빠질 수 있습니다. 절약 팁: 대기전력 차단, 에어컨 26°C, 냉장고 60% 채우기, LED 교체.',
  render(root) {
    const out = HT.output(root);
    const PRICE = [120.0, 214.6, 307.3], BASE = [910, 1600, 7300], CLIMATE = 9.0, FUEL = 5.0, SUPER = 736.2;
    const f = HT.form(root, [
      { id: 'kwh', label: '월 사용량', type: 'number', unit: 'kWh', value: 350, min: 0, help: '1~2인 150~250 · 3~4인 300~450 · 5인 이상 400~600kWh' },
      { id: 'season', label: '계절', type: 'seg', options: [['other', '기타계절 (3~6, 9~11월)'], ['summer', '하계 (7~8월)'], ['winter', '동계 (12~2월)']], value: 'other' },
    ], calc);
    function bill(kwh, season) {
      const lim = season === 'summer' ? [300, 450] : [200, 400]; const superOn = season !== 'other' && kwh > 1000;
      const tier = kwh <= lim[0] ? 0 : kwh <= lim[1] ? 1 : 2; const parts = [];
      let rest = kwh; const t1 = Math.min(rest, lim[0]); parts.push([t1, PRICE[0]]); rest -= t1; const t2 = Math.min(rest, lim[1] - lim[0]); parts.push([t2, PRICE[1]]); rest -= t2;
      if (superOn) { const t3 = Math.min(rest, 1000 - lim[1]); parts.push([t3, PRICE[2]]); rest -= t3; parts.push([rest, SUPER]); } else parts.push([rest, PRICE[2]]);
      const energy = parts.reduce((a, p) => a + p[0] * p[1], 0); const base = BASE[tier]; const climate = kwh * CLIMATE, fuel = kwh * FUEL;
      const sub = Math.floor(base + energy + climate + fuel); const vat = Math.round(sub * 0.1); const fund = HT.floor10(sub * 0.037); const total = HT.floor10(sub + vat + fund);
      return { tier, parts, base, energy, climate, fuel, sub, vat, fund, total, lim, superOn };
    }
    function calc(v) {
      const b = bill(v.kwh, v.season); const labels = [], vals = []; for (let k = 100; k <= 800; k += 100) { labels.push(k + 'kWh'); vals.push(bill(k, v.season).total); }
      out.set(HT.kpi('예상 청구금액', HT.won(b.total), `${v.kwh}kWh · ${b.tier + 1}단계 구간` + (b.superOn ? ' · 슈퍼유저 적용' : '')),
        HT.rows([['기본요금', HT.won(b.base), '', `${b.tier + 1}단계 (${b.tier === 0 ? b.lim[0] + 'kWh 이하' : b.tier === 1 ? b.lim[0] + 1 + '~' + b.lim[1] + 'kWh' : b.lim[1] + 'kWh 초과'})`], ['전력량요금', HT.won(b.energy)], ...b.parts.filter(p => p[0] > 0).map((p, i) => [`${i + 1}단계 ${HT.fmt(p[0])}kWh × ${p[1]}원`, HT.won(p[0] * p[1]), 'sub']), ['기후환경요금 (9.0원/kWh)', HT.won(b.climate), 'sub'], ['연료비조정액 (5.0원/kWh)', HT.won(b.fuel), 'sub'], ['전기요금 합계', HT.won(b.sub), 'strong'], ['부가가치세 (10%)', HT.won(b.vat), 'sub'], ['전력산업기반기금 (3.7%)', HT.won(b.fund), 'sub'], ['청구금액 (10원 미만 절사)', HT.won(b.total), 'strong']]),
        HT.lineChart(labels, vals, { fmt: HT.wonKor, cap: '사용량별 청구금액 (같은 계절 기준)' }));
    }
    calc(f.values());
  }
});
