/* 퇴직연금 DC vs DB, 퇴직급여 일시금 vs 연금 수령 비교
   DB: 퇴직 시 평균임금(최종 연봉/12) × 근속연수. DC: 매년 연간 임금총액의 1/12을 적립해 운용.
   퇴직소득세: 근속연수공제 → 환산급여(×12/근속) → 환산급여공제 → 세율 → ÷12×근속. 연금 수령 시 퇴직소득세 30% 감면(1~10년차), 40% 감면(11년차~) */
HT.register({
  id: 'retirement-pension', cat: '급여·소득', order: 2.5, name: '퇴직연금 DC vs DB · 일시금 vs 연금', keywords: '퇴직연금 DC DB IRP 일시금 연금수령 퇴직소득세 감면',
  desc: '임금상승률과 운용수익률로 DB(확정급여)와 DC(확정기여) 중 어느 쪽 퇴직급여가 큰지 비교하고, 받은 퇴직급여를 일시금으로 받을 때와 IRP 연금으로 나눠 받을 때의 세금 차이를 계산합니다.',
  note: 'DB는 회사가 운용하고 퇴직 시점 평균임금 × 근속연수를 보장하므로 임금상승률이 높을수록 유리하고, DC는 매년 넣어 준 돈을 내가 운용하므로 운용수익률이 임금상승률보다 높으면 유리합니다. 연금 수령 시 퇴직소득세는 수령 1~10년차 30%, 11년차부터 40% 감면되고, IRP 안에서 불어난 운용수익에는 연금소득세(3.3~5.5%)만 붙습니다. 연금 수령액은 잔액을 남은 기간으로 나누는 방식(잔액 균등)으로 계산했습니다. 퇴직소득세 산식은 퇴직금 계산기와 같습니다.',
  render(root) {
    const wrap = HT.el('div', { class: 'wide' }); root.append(wrap); const body = HT.el('div'); let lastBenefit = 0;
    HT.tabs(wrap, [['dcdb', 'DC vs DB'], ['pay', '일시금 vs 연금 수령']], k => { body.innerHTML = ''; (k === 'dcdb' ? dcdb : payout)(body); }); wrap.append(body);
    function retireTax(sev, n) { n = Math.max(1, Math.ceil(n)); const svc = n <= 5 ? 1e6 * n : n <= 10 ? 5e6 + 2e6 * (n - 5) : n <= 20 ? 15e6 + 2.5e6 * (n - 10) : 40e6 + 3e6 * (n - 20); const conv = Math.max(0, sev - svc) / n * 12; const cd = conv <= 8e6 ? conv : conv <= 7e7 ? 8e6 + (conv - 8e6) * .6 : conv <= 1e8 ? 45.2e6 + (conv - 7e7) * .55 : conv <= 3e8 ? 61.7e6 + (conv - 1e8) * .45 : 151.7e6 + (conv - 3e8) * .35; const t = HT.progressive(Math.max(0, conv - cd), HT.INCOME_TAX).tax / 12 * n; return t * 1.1; }
    function dcdb(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, 'DB vs DC');
      const f = HT.form(inner, [
        { id: 'salary', label: '현재 연봉 (임금총액)', type: 'money', unit: '원', value: 60000000 },
        { id: 'raise', label: '임금상승률 (연)', type: 'number', unit: '%', value: 3, step: 0.5 },
        { id: 'years', label: '앞으로 근속 예정', type: 'number', unit: '년', value: 20, min: 1, max: 40 },
        { id: 'ret', label: 'DC 운용수익률 (연)', type: 'number', unit: '%', value: 4, step: 0.5 },
        { id: 'existing', label: '기존 적립금 (DC 전환 시 이월액, 없으면 0)', type: 'money', unit: '원', value: 0 },
      ], calc);
      function sim(v, ret) { let dc = v.existing; const rows = []; for (let y = 1; y <= v.years; y++) { const sal = v.salary * Math.pow(1 + v.raise / 100, y - 1); dc = dc * (1 + ret / 100) + sal / 12; const db = v.existing * 1 + v.salary * Math.pow(1 + v.raise / 100, y - 1) / 12 * y; rows.push({ y, sal, dc, db }); } return rows; }
      function calc(v) {
        const rows = sim(v, v.ret); const last = rows[rows.length - 1]; lastBenefit = Math.max(last.db, last.dc);
        let lo = -5, hi = 30; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; const r = sim(v, mid); if (r[r.length - 1].dc >= r[r.length - 1].db) hi = mid; else lo = mid; } const be = hi;
        out.set(HT.kpi(last.dc >= last.db ? 'DC가 유리' : 'DB가 유리', HT.wonKor(Math.abs(last.dc - last.db)) + ' 차이', `${v.years}년 후 DB ${HT.wonKor(last.db)} vs DC ${HT.wonKor(last.dc)}`),
          HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(`손익분기 DC 수익률 연 ${HT.pct(be, 2)}`, 'gray'), ' ', HT.badge(v.ret >= be ? `가정 ${v.ret}% ≥ 손익분기 → DC` : `가정 ${v.ret}% < 손익분기 → DB`, v.ret >= be ? 'ok' : 'warn')]),
          HT.stackChart(rows.filter((r, i) => i % Math.ceil(rows.length / 12) === 0 || i === rows.length - 1).map(r => r.y + '년'), [{ name: 'DB (평균임금 × 근속)', color: 'var(--g2)', values: rows.filter((r, i) => i % Math.ceil(rows.length / 12) === 0 || i === rows.length - 1).map(r => r.db) }], { fmt: HT.wonKor, cap: 'DB 예상 퇴직급여 추이 (DC는 아래 표 참조)' }),
          HT.table(['연차', '연봉', 'DB 퇴직급여', 'DC 적립금', '차이 (DC − DB)'], rows.map(r => [r.y + '년', HT.won(r.sal), HT.won(r.db), HT.won(r.dc), (r.dc - r.db >= 0 ? '+' : '') + HT.won(r.dc - r.db)]), { right: [1, 2, 3, 4] }),
          HT.el('div', { class: 'note', html: `<b>보는 법</b> DB는 마지막 연봉이 기준이라 승진·호봉으로 임금이 꾸준히 오르는 직장(임금상승률 ${v.raise}%)에 유리합니다. DC는 매년 연봉의 1/12(${HT.won(v.salary / 12)}부터)을 받아 직접 굴리므로 손익분기 수익률 ${HT.pct(be, 2)}를 꾸준히 넘길 자신이 있을 때 유리합니다. 임금피크제나 이직이 잦으면 DC가, 정년까지 한 직장이면 DB가 보통 낫습니다.` }));
      }
      calc(f.values());
    }
    function payout(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, '일시금 vs 연금');
      const f = HT.form(inner, [
        { id: 'benefit', label: '퇴직급여 (세전)', type: 'money', unit: '원', value: Math.round(lastBenefit) || 150000000, help: 'DC vs DB 탭의 결과가 자동으로 들어옵니다' },
        { id: 'years', label: '근속연수', type: 'number', unit: '년', value: 20, min: 1, max: 45 },
        { id: 'payYears', label: '연금 수령 기간', type: 'number', unit: '년', value: 15, min: 5, max: 40 },
        { id: 'ret', label: 'IRP 운용수익률 (수령 기간 중)', type: 'number', unit: '%', value: 3, step: 0.5 },
        { id: 'ptax', label: '운용수익 연금소득세', type: 'select', options: [['5.5', '5.5% (70세 미만)'], ['4.4', '4.4% (70~80세)'], ['3.3', '3.3% (80세 이상)']], value: '5.5' },
      ], calc);
      function calc(v) {
        const tax = retireTax(v.benefit, v.years); const lump = v.benefit - tax;
        // 연금: 잔액 균등 인출. 원금 인출분에 퇴직소득세 × (1−감면), 운용수익 인출분에 연금소득세
        let bal = v.benefit, prinLeft = v.benefit; let totalGross = 0, taxPrin = 0, taxGain = 0; const rows = []; const ptax = HT.num(v.ptax) / 100;
        for (let y = 1; y <= v.payYears; y++) { bal *= 1 + v.ret / 100; const pay = bal / (v.payYears - y + 1); const prinPart = Math.min(pay, prinLeft * pay / bal); const gainPart = pay - prinPart; const relief = y <= 10 ? .3 : .4; const tp = tax * (prinPart / v.benefit) * (1 - relief), tg = gainPart * ptax; prinLeft -= prinPart; bal -= pay; totalGross += pay; taxPrin += tp; taxGain += tg; rows.push([y + '년차', HT.won(pay), HT.won(tp + tg), HT.won(pay - tp - tg), HT.won(Math.max(0, bal))]); }
        const totalTax = taxPrin + taxGain; const annuityNet = totalGross - totalTax;
        // 비교용: 일시금을 같은 수익률로 굴리며 같은 기간 나눠 쓸 때 (운용수익 15.4% 과세)
        const lumpGain = (totalGross - v.benefit) * (lump / v.benefit); const lumpAlt = lump + lumpGain * (1 - .154);
        out.set(HT.kpi('연금 수령 시 퇴직소득세 절감', HT.won(tax - taxPrin), `일시금 ${HT.won(tax)} → 연금 수령 ${HT.won(taxPrin)} (1~10년차 30%, 이후 40% 감면) · 운용수익 연금소득세 ${HT.won(taxGain)} 별도`),
          HT.kpis([['일시금 세후', HT.won(lump), `퇴직소득세 ${HT.won(tax)} (실효 ${HT.pct(v.benefit ? tax / v.benefit * 100 : 0, 2)})`], [`연금 ${v.payYears}년 총 수령 (세후)`, HT.won(annuityNet), `운용수익 ${HT.won(totalGross - v.benefit)} 포함`], ['일시금을 같은 조건으로 굴릴 때', HT.won(lumpAlt), `운용수익에 15.4% 과세 · 연금이 ${HT.won(annuityNet - lumpAlt)} 유리`]]),
          HT.barChart([{ label: '일시금 세후 (지금)', value: lump, color: 'var(--g3)' }, { label: '일시금 굴려서 나눠 쓸 때', value: lumpAlt, color: 'var(--g2)' }, { label: '연금 총 수령 (세후)', value: annuityNet, color: 'var(--c1)' }], { fmt: HT.wonKor, padL: 160 }),
          HT.table(['연차', '수령액', '세금', '세후', '남은 잔액'], rows, { right: [1, 2, 3, 4] }),
          HT.el('div', { class: 'note', html: `<b>보는 법</b> 연금으로 받으면 퇴직소득세를 1~10년차 30%, 11년차부터 40% 덜 내고, 그 사이 IRP에서 불어난 운용수익에는 연금소득세 ${HT.num(v.ptax)}%만 붙습니다. 대신 돈이 IRP에 묶이고 중도 인출은 제한됩니다. 목돈이 당장 필요(대출 상환 등)하면 일시금, 아니면 연금이 세금 면에서 유리합니다.` }));
      }
      calc(f.values());
    }
  }
});
