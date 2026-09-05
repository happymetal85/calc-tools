/* 조기상환 시뮬레이터 — 매달 추가 납입 또는 목돈 일시 상환이 이자·기간을 얼마나 줄이는지,
   중도상환수수료를 빼고도 이득인지, 같은 돈을 예금했을 때와 비교 */
HT.register({
  id: 'loan-prepayment', cat: '금융·투자', order: 6.7, name: '조기상환 시뮬레이터', keywords: '조기상환 중도상환 추가납입 일시상환 이자 절감 기간 단축',
  desc: '대출을 매달 조금씩 더 갚거나 목돈으로 한 번에 갚을 때 이자가 얼마나 줄고 만기가 얼마나 앞당겨지는지, 중도상환수수료를 빼고도 이득인지, 그 돈을 예금할 때와 무엇이 나은지 계산합니다.',
  note: '조기상환 뒤 "기간 단축"은 월 납입액을 그대로 두고 만기를 앞당기는 방식이고, "월 납입 감소"는 만기를 두고 남은 원금으로 월 납입액을 다시 계산하는 방식입니다. 이자 절감은 기간 단축이 훨씬 큽니다. 중도상환수수료는 대출 실행 후 3년 이내에 갚는 금액에만 잔여기간 비례로 붙고, 많은 은행이 매년 대출금의 10%까지는 수수료 없이 갚게 해 줍니다(상품별 확인). 예금 비교는 이자소득세 15.4%를 뺀 세후 수익률로, 추가 납입 대신 예금하는 경우와 조기상환으로 일찍 끝나거나 줄어든 납입액을 예금하는 경우를 원래 만기 시점 자산으로 견줍니다. 대출금리가 예금 세후 수익률보다 높으면 갚는 쪽이 유리합니다.',
  render(root) {
    const out = HT.output(root, '조기상환 효과');
    const f = HT.form(root, [
      { id: 'bal', label: '현재 대출 잔액', type: 'money', unit: '원', value: 300000000 },
      { id: 'rate', label: '대출 금리', type: 'number', unit: '%', value: 4.5, step: 0.01 },
      { id: 'months', label: '잔여 기간', type: 'number', unit: '개월', value: 300, min: 1 },
      { id: 'method', label: '상환 방식', type: 'seg', options: [['equal', '원리금균등'], ['principal', '원금균등']], value: 'equal' },
      { id: 'elapsed', label: '대출 실행 후 경과', type: 'number', unit: '개월', value: 12, min: 0 },
      { id: 'feeRate', label: '중도상환수수료율', type: 'number', unit: '%', value: 0.6, step: 0.01, help: '3년 이내 상환분에 잔여기간 비례 부과' },
      { id: 'freeRatio', label: '연간 수수료 면제 한도 (대출금의 %)', type: 'number', unit: '%', value: 10, step: 1, help: '대부분 은행 10% · 없으면 0' },
      { id: 'extra', label: '매달 추가 납입액', type: 'money', unit: '원', value: 300000 },
      { id: 'lump', label: '목돈 일시 상환액', type: 'money', unit: '원', value: 0 },
      { id: 'lumpAt', label: '일시 상환 시점', type: 'number', unit: '개월 후', value: 1, min: 1, show: v => v.lump > 0 },
      { id: 'lumpRepeat', label: '매년 같은 금액 반복 상환', type: 'check', value: false, show: v => v.lump > 0 },
      { id: 'after', label: '상환 후 처리', type: 'seg', options: [['shorten', '기간 단축 (월 납입 유지)'], ['reduce', '월 납입 감소 (기간 유지)']], value: 'shorten' },
      { id: 'depRate', label: '비교용 예금·투자 수익률 (세전)', type: 'number', unit: '%', value: 3.2, step: 0.1 },
    ], calc);
    function pmt(P, r, n) { return r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n; }
    function simulate(v, prepay) {
      const r = v.rate / 100 / 12; let bal = v.bal, n = v.months; let pay = v.method === 'equal' ? pmt(bal, r, n) : null; let prinFixed = v.method === 'principal' ? bal / n : null;
      const rows = []; let totalInt = 0, totalFee = 0, totalExtra = 0; let yearFree = v.bal * v.freeRatio / 100, yearIdx = 0;
      for (let k = 1; k <= 1200 && bal > 0.5; k++) {
        if (Math.floor((k - 1) / 12) !== yearIdx) { yearIdx = Math.floor((k - 1) / 12); yearFree = v.bal * v.freeRatio / 100; }
        const int = bal * r; let prin = v.method === 'equal' ? Math.min(bal, pay - int) : Math.min(bal, prinFixed); let sched = prin + int; bal -= prin; totalInt += int;
        let ex = 0;
        if (prepay) { ex += v.extra; if (v.lump > 0 && (k === v.lumpAt || (v.lumpRepeat && k > v.lumpAt && (k - v.lumpAt) % 12 === 0))) ex += v.lump; ex = Math.min(ex, bal); }
        if (ex > 0) { const feeable = Math.max(0, ex - yearFree); yearFree = Math.max(0, yearFree - ex); const remain = Math.max(0, 36 - (v.elapsed + k)); totalFee += feeable * v.feeRate / 100 * remain / 36; bal -= ex; totalExtra += ex;
          if (v.after === 'reduce' && bal > 0) { const left = n - k; if (v.method === 'equal') pay = pmt(bal, r, left); else prinFixed = bal / left; } }
        rows.push({ k, int, pay: sched + ex, bal: Math.max(0, bal) });
        if (bal <= 0.5) break;
      }
      return { rows, months: rows.length, totalInt, totalFee, totalExtra, firstPay: rows[0].pay, lastPay: rows[rows.length - 1].pay };
    }
    function calc(v) {
      if (v.bal <= 0) { out.set(HT.el('div', { class: 'empty' }, '대출 잔액을 입력하세요.')); return; }
      if (v.extra <= 0 && v.lump <= 0) { out.set(HT.el('div', { class: 'empty' }, '매달 추가 납입액이나 목돈 일시 상환액을 입력하세요.')); return; }
      const base = simulate(v, false), pre = simulate(v, true);
      const saved = base.totalInt - pre.totalInt; const net = saved - pre.totalFee; const cut = base.months - pre.months;
      // 예금 대안 비교: 두 시나리오의 월 현금흐름 차이를 세후 예금수익률로 원래 만기까지 굴렸을 때의 자산 차이
      // (조기상환으로 일찍 끝나거나 줄어든 납입액은 예금한다고 가정 → 재투자 가정을 양쪽에 똑같이 적용)
      const rs = v.depRate / 100 * .846 / 12; let adv = 0;
      for (let k = 1; k <= base.months; k++) { const bp = base.rows[k - 1].pay, pp = k <= pre.months ? pre.rows[k - 1].pay : 0; adv += (bp - pp) * Math.pow(1 + rs, base.months - k); }
      adv -= pre.totalFee * Math.pow(1 + rs, base.months - 1);
      const better = adv >= 0;
      const yrs = Math.floor(cut / 12), mos = cut % 12;
      // 잔액 추이 (연 단위)
      const labels = [], bBase = [], bPre = []; for (let y = 0; y * 12 < base.months; y++) { const i = y * 12; labels.push(y + '년'); bBase.push(base.rows[i]?.bal ?? 0); bPre.push(pre.rows[i]?.bal ?? 0); }
      labels.push(Math.ceil(base.months / 12) + '년'); bBase.push(0); bPre.push(0);
      out.set(HT.kpi('순 이자 절감액', HT.won(net), `이자 절감 ${HT.won(saved)} − 중도상환수수료 ${HT.won(pre.totalFee)}`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(v.after === 'shorten' ? `만기 ${yrs}년 ${mos}개월 단축 (${base.months}개월 → ${pre.months}개월)` : `월 납입 ${HT.won(base.firstPay)} → ${HT.won(pre.lastPay)} (마지막 달 기준, 추가 납입 포함)`, 'ok'), ' ', HT.badge(better ? `예금보다 조기상환이 만기 시점 ${HT.wonKor(adv)} 유리` : `예금이 만기 시점 ${HT.wonKor(-adv)} 유리`, better ? 'ok' : 'warn')]),
        HT.kpis([['총 이자 (기존 → 조기상환)', `${HT.wonKor(base.totalInt)} → ${HT.wonKor(pre.totalInt)}`], ['추가로 갚은 원금 합계', HT.wonKor(pre.totalExtra), `매달 ${HT.won(v.extra)}${v.lump ? ' + 목돈 ' + HT.wonKor(v.lump) + (v.lumpRepeat ? ' 매년' : '') : ''}`], ['상환 완료', `${pre.months}개월 후`, `${HT.fmt(pre.months / 12, 1)}년 (기존 ${HT.fmt(base.months / 12, 1)}년)`]]),
        HT.el('div', { class: 'chart', html: balanceChart(labels, bBase, bPre) }),
        HT.rows([['이자 절감액', HT.won(saved), 'pos'], ['중도상환수수료', '-' + HT.won(pre.totalFee), 'sub', pre.totalFee ? `3년 이내 상환분 × ${v.feeRate}% × 잔여기간 비례 (연 ${v.freeRatio}% 면제 적용)` : '면제 한도 안이거나 3년 경과'], ['순 절감액', HT.won(net), 'strong'], [`예금 대비 만기 시점 자산 차이 (세후 ${HT.fmt(v.depRate * .846, 2)}%)`, (adv >= 0 ? '+' : '') + HT.won(adv), adv >= 0 ? 'pos' : 'neg', '추가 납입 대신 예금하고, 조기상환으로 줄어든 납입액도 예금한다고 가정해 원래 만기 시점에 비교'], ['판정', HT.badge(better ? '조기상환 유리' : '예금·투자 유리', better ? 'ok' : 'warn'), '', `대출금리 ${v.rate}% vs 예금 세후 ${HT.fmt(v.depRate * .846, 2)}%`]]),
        HT.table(['경과', '기존 잔액', '조기상환 잔액', '기존 누적 이자', '조기상환 누적 이자', '누적 절감'], labels.slice(1).map((l, i) => { const m = Math.min((i + 1) * 12, base.months); const cum = s => s.rows.slice(0, m).reduce((a, x) => a + x.int, 0); const cb = cum(base), cp = cum(pre); return [l, HT.won(base.rows[m - 1]?.bal ?? 0), HT.won(pre.rows[m - 1]?.bal ?? 0), HT.won(cb), HT.won(cp), HT.won(cb - cp)]; }), { right: [1, 2, 3, 4, 5] }));
    }
    function balanceChart(labels, a, b) { const W = 600, H = 200, padL = 70, padB = 26, padT = 10; const n = labels.length; const max = Math.max(...a, 1);
      const px = i => padL + (W - padL - 10) * (n > 1 ? i / (n - 1) : 0), py = v => padT + (H - padT - padB) * (1 - v / max);
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`; [0, .5, 1].forEach(t => { const y = py(max * t); s += `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="var(--line)"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${HT.esc(HT.wonKor(max * t))}</text>`; });
      s += `<polyline fill="none" stroke="var(--g2)" stroke-width="2" points="${a.map((v, i) => px(i) + ',' + py(v)).join(' ')}"/><polyline fill="none" stroke="var(--brand-key)" stroke-width="2" points="${b.map((v, i) => px(i) + ',' + py(v)).join(' ')}"/>`;
      s += `<text x="${px(Math.floor(n * 0.55))}" y="${py(a[Math.floor(n * 0.55)]) - 6}" font-size="11" fill="var(--ink-soft)">기존</text><text x="${px(Math.floor(n * 0.3))}" y="${py(b[Math.floor(n * 0.3)]) + 14}" font-size="11" fill="var(--brand-deep)">조기상환</text>`;
      labels.forEach((l, i) => { if (n <= 12 || i % Math.ceil(n / 10) === 0 || i === n - 1) s += `<text x="${px(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${HT.esc(l)}</text>`; });
      return s + '</svg><div class="cap">대출 잔액 추이 — 회색 기존, 파랑 조기상환</div>'; }
    calc(f.values());
  }
});
