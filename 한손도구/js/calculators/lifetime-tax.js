/* 평생 세금 총액 — 지금부터 기대수명까지 낼 소득세·4대보험·부가세·보유세·자동차세를 생애 소득 곡선 위에서 합산 */
HT.register({
  id: 'lifetime-tax', cat: '급여·소득', order: 0.9, name: '평생 세금 총액', keywords: '평생 세금 총액 소득세 4대보험 부가세 보유세 자동차세 생애 세금',
  desc: '지금 연봉과 인상률, 은퇴 나이, 소비 습관을 넣으면 평생 낼 소득세·지방소득세·4대보험(본인 부담)·부가세·보유세·자동차세 총액을 계산하고, 그 돈이 서울 아파트 몇 채인지, 평생 소득의 몇 %인지 보여줍니다.',
  note: '명목 금액(물가 반영 없이 그해 낼 돈의 합)이며 "현재 가치" 전환을 켜면 물가상승률로 할인합니다. 부가세는 지출 중 과세 대상 비율(기본 70%)에 10/110을 곱해 추정했고, 유류세·개별소비세·담뱃세 등 개별 소비세는 빼서 실제보다 적습니다. 4대보험은 근로자 부담분만이며 은퇴 후 건강보험 지역가입자 보험료는 월 입력값으로 잡습니다. 은퇴 후에는 국민연금 등 소득에 소득세가 거의 없다고 보고 소비세만 계산합니다.',
  render(root) {
    const out = HT.output(root, '평생 세금');
    const f = HT.form(root, [
      { id: 'age', p: 'age', label: '현재 나이', type: 'number', unit: '세', value: 32, min: 18, max: 80 },
      { id: 'retire', label: '은퇴 나이', type: 'number', unit: '세', value: 60, min: 30, max: 80 },
      { id: 'life', label: '기대수명', type: 'number', unit: '세', value: 88, min: 60, max: 110 },
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'raise', label: '연봉 인상률 (연)', type: 'number', unit: '%', value: 3, step: 0.5 },
      { id: 'spendRate', label: '실수령 중 지출 비율', type: 'number', unit: '%', value: 70, min: 0, max: 100 },
      { id: 'taxable', label: '지출 중 부가세 과세 비율', type: 'number', unit: '%', value: 70, min: 0, max: 100, help: '식료품·의료·교육·월세 등 면세 제외' },
      { id: 'retireSpend', label: '은퇴 후 월 지출 (현재 가치)', type: 'money', unit: '원', value: 2500000 },
      { id: 'hiRetire', label: '은퇴 후 건강보험료 (월, 지역가입)', type: 'money', unit: '원', value: 150000 },
      { id: 'homeValue', p: 'homeValue', label: '보유 주택 시세 (없으면 0)', type: 'money', unit: '원', value: 0 },
      { id: 'carCC', p: 'carCC', label: '자동차 배기량 (없으면 0, 전기차 1)', type: 'number', unit: 'cc', value: 0 },
      { id: 'real', label: '현재 가치로 환산 (물가상승률 할인)', type: 'check', value: false },
      { id: 'infl', label: '물가상승률', type: 'number', unit: '%', value: 2.5, step: 0.1, show: v => v.real },
    ], calc);
    const H_ONE = [[6e7, .0005, 0], [1.5e8, .001, 3e4], [3e8, .002, 18e4], [Infinity, .0035, 63e4]]; const H_GEN = [[6e7, .001, 0], [1.5e8, .0015, 3e4], [3e8, .0025, 18e4], [Infinity, .004, 63e4]]; const R2 = [[3e8, .005, 0], [6e8, .007, 6e5], [12e8, .01, 24e5], [25e8, .013, 60e5], [94e8, .02, 235e5], [Infinity, .027, 893e5]];
    function holding(P) { if (!P) return 0; const pub = P * .69; const one = pub <= 9e8; const pb = pub * (one ? (pub <= 3e8 ? .43 : pub <= 6e8 ? .44 : .45) : .6); return HT.progressive(pb, one ? H_ONE : H_GEN).tax * 1.2 + pb * .0014 + HT.progressive(Math.max(0, pub - 12e8) * .6, R2).tax * 1.2; }
    function carTax(cc, year) { if (!cc) return 0; if (cc === 1) return 130000; return cc * (cc <= 1000 ? 80 : cc <= 1600 ? 140 : 200) * 1.3 * (1 - Math.min(.5, Math.max(0, year - 2) * .05)); }
    function calc(v) {
      const P = HT.payroll; const bands = {}; const T = { income: 0, ins: 0, vat: 0, hold: 0, car: 0 }; let earned = 0; const rows = [];
      for (let age = v.age; age < v.life; age++) { const y = age - v.age; const disc = v.real ? Math.pow(1 + v.infl / 100, -y) : 1; const g = age < v.retire ? v.salary * Math.pow(1 + v.raise / 100, y) : 0;
        let income = 0, ins = 0, spend; if (g) { const r = P.netMonthly(g); income = (r.tax + r.local) * 12; ins = r.ins.total * 12; spend = r.net * 12 * v.spendRate / 100; earned += g * disc; } else { ins = v.hiRetire * 12 * Math.pow(1 + (v.real ? 0 : v.infl) / 100, y); spend = v.retireSpend * 12 * Math.pow(1 + (v.real ? 0 : v.infl) / 100, y); }
        const vat = spend * v.taxable / 100 * 10 / 110; const hold = holding(v.homeValue) * (v.real ? 1 : Math.pow(1 + v.infl / 100, y)); const car = age < v.retire + 20 ? carTax(v.carCC, Math.min(15, y + 1)) : 0;
        const b = Math.floor(age / 10) * 10 + '대'; bands[b] = bands[b] || { income: 0, ins: 0, vat: 0, hold: 0, car: 0 };
        for (const [k, val] of Object.entries({ income, ins, vat, hold, car })) { T[k] += val * disc; bands[b][k] += val * disc; }
        if (y % 10 === 0 || age === v.retire) rows.push([age + '세', HT.won(g), HT.won(income * disc), HT.won(ins * disc), HT.won(vat * disc), HT.won((hold + car) * disc)]); }
      const total = T.income + T.ins + T.vat + T.hold + T.car; const labels = Object.keys(bands);
      const share = `나는 ${v.age}세부터 ${v.life}세까지 세금·보험료로 ${HT.wonKor(total)}을 냅니다 (소득세 ${HT.wonKor(T.income)} · 4대보험 ${HT.wonKor(T.ins)} · 부가세 ${HT.wonKor(T.vat)}). 서울 아파트 ${HT.fmt(total / 1508100000, 1)}채 값 — 한손도구 평생 세금 총액`;
      const btns = HT.shareButtons(share, { title: '평생 세금 총액', big: HT.wonKor(total), lines: [`${v.age}~${v.life}세 · 소득세 ${HT.wonKor(T.income)} · 4대보험 ${HT.wonKor(T.ins)} · 부가세 ${HT.wonKor(T.vat)}`, `서울 아파트 ${HT.fmt(total / 1508100000, 1)}채`], file: 'lifetime-tax' });
      out.set(HT.kpi('평생 낼 세금 + 보험료', HT.wonKor(total), `${v.age}~${v.life}세 · ${v.real ? '현재 가치' : '명목'} · 서울 아파트(15억) ${HT.fmt(total / 1508100000, 1)}채 · 평생 근로소득 ${HT.wonKor(earned)}의 ${HT.pct(earned ? total / earned * 100 : 0, 0)}`),
        HT.barChart([{ label: '소득세+지방세', value: T.income, color: 'var(--c1)' }, { label: '4대보험 (본인)', value: T.ins, color: 'var(--c2)' }, { label: '부가세 (추정)', value: T.vat, color: 'var(--c3)' }, { label: '보유세', value: T.hold, color: 'var(--g2)' }, { label: '자동차세', value: T.car, color: 'var(--g3)' }].filter(x => x.value > 0), { fmt: HT.wonKor, cap: '항목별 평생 합계' }),
        HT.stackChart(labels, [{ name: '소득세', color: 'var(--c1)', values: labels.map(l => bands[l].income) }, { name: '4대보험', color: 'var(--c2)', values: labels.map(l => bands[l].ins) }, { name: '부가세', color: 'var(--c3)', values: labels.map(l => bands[l].vat) }, { name: '보유·자동차세', color: 'var(--g2)', values: labels.map(l => bands[l].hold + bands[l].car) }], { fmt: HT.wonKor, cap: '나이대별 세금' }),
        HT.table(['나이', '연봉', '소득세+지방세', '4대보험', '부가세', '보유·자동차세'], rows, { right: [1, 2, 3, 4, 5], scroll: false }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 4대보험은 세금이 아니라 돌려받는 보험(국민연금·건강보험)이지만 매달 급여에서 빠지는 돈이라 함께 넣었습니다. 소득세만 따지면 평생 ${HT.wonKor(T.income)}이고, 그 돈이 어디에 쓰이는지는 <a href="#/tax-destination">내 세금이 간 곳</a>에서 볼 수 있습니다.` }));
    }
    calc(f.values());
  }
});
