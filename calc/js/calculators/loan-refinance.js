/* 대출 갈아타기(대환) 손익 시뮬레이터
   기존 대출 유지 vs 새 대출로 교체: 중도상환수수료(3년 이내 잔여기간 비례) + 부대비용 대비 이자 절감을
   보유 예정 기간 기준으로 비교하고, 손익분기 시점과 손익분기 금리를 구한다. */
HT.register({
  id: 'loan-refinance', cat: '금융·투자', order: 6.5, name: '대출 갈아타기 손익 시뮬레이터', keywords: '대환 갈아타기 중도상환수수료 금리 손익분기 주담대 신용대출',
  desc: '기존 대출을 유지할 때와 낮은 금리로 갈아탈 때의 상환액·이자를 비교해, 중도상환수수료와 부대비용을 빼고도 이득인지, 몇 개월 뒤부터 이득인지, 몇 %까지 금리가 내려와야 이득인지 계산합니다.',
  note: '중도상환수수료는 2025년 1월 13일 이후 신규 대출부터 실비 기준으로 낮아져 주택담보대출 약 0.5~0.7%, 신용대출 약 0.1%이며, 대출 실행 후 3년이 지나면 면제됩니다(잔여기간 비례 부과). 인지세는 대출 5천만원 초과~1억원 7만원, 1억원 초과~10억원 15만원을 은행과 절반씩 부담합니다. 근저당 설정비는 대개 은행이 부담합니다. 갈아탈 때도 DSR 심사를 다시 받으며 스트레스 금리가 적용되므로 한도가 줄 수 있습니다. 비교는 "보유 예정 기간 동안 낸 돈 + 그 시점의 남은 원금"을 기준으로 하여 상환 방식·기간이 달라도 공정하게 견줍니다.',
  render(root) {
    const out = HT.output(root, '손익 비교');
    const METHODS = [['equal', '원리금균등'], ['principal', '원금균등'], ['bullet', '만기일시']];
    const f = HT.form(root, [
      { id: 'bal', label: '기존 대출 잔액', type: 'money', unit: '원', value: 300000000 },
      { id: 'oRate', label: '기존 금리', type: 'number', unit: '%', value: 4.8, step: 0.01 },
      { id: 'oMonths', label: '기존 잔여 기간', type: 'number', unit: '개월', value: 300, min: 1 },
      { id: 'oMethod', label: '기존 상환 방식', type: 'seg', options: METHODS, value: 'equal' },
      { id: 'elapsed', label: '기존 대출 실행 후 경과', type: 'number', unit: '개월', value: 12, min: 0, help: '36개월 이상이면 중도상환수수료 면제' },
      { id: 'feeRate', label: '중도상환수수료율', type: 'number', unit: '%', value: 0.6, step: 0.01, help: '주담대 0.5~0.7% · 신용대출 0.1% (2025.1.13 이후 신규 기준)' },
      { id: 'nRate', label: '새 대출 금리', type: 'number', unit: '%', value: 3.9, step: 0.01 },
      { id: 'nMonths', label: '새 대출 기간', type: 'number', unit: '개월', value: 300, min: 1 },
      { id: 'nMethod', label: '새 상환 방식', type: 'seg', options: METHODS, value: 'equal' },
      { id: 'extra', label: '기타 부대비용 (보증료·감정료 등)', type: 'money', unit: '원', value: 0, help: '인지세는 자동 계산' },
      { id: 'hold', label: '보유 예정 기간 (이 대출을 유지할 기간)', type: 'number', unit: '년', value: 5, min: 1, max: 40 },
    ], calc);
    function schedule(P, rate, n, method) { const r = rate / 100 / 12; const s = []; let bal = P; const eq = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n;
      for (let k = 1; k <= n; k++) { const int = bal * r; let prin; if (method === 'equal') prin = eq - int; else if (method === 'principal') prin = P / n; else prin = k === n ? bal : 0; bal = Math.max(0, bal - prin); s.push({ pay: int + prin, int, prin, bal }); } return s; }
    function paidPlusBal(s, m) { let paid = 0; for (let i = 0; i < Math.min(m, s.length); i++) paid += s[i].pay; const bal = m >= s.length ? 0 : s[m - 1].bal; return { paid, bal, cost: paid + bal }; }
    function stamp(P) { return P <= 5e7 ? 0 : P <= 1e8 ? 7e4 / 2 : P <= 1e9 ? 15e4 / 2 : 35e4 / 2; }
    function fee(v) { const remain = Math.max(0, 36 - v.elapsed); return v.bal * v.feeRate / 100 * remain / 36; }
    function advantage(v, nRate, H) { const so = schedule(v.bal, v.oRate, v.oMonths, v.oMethod), sn = schedule(v.bal, nRate, v.nMonths, v.nMethod); const a = paidPlusBal(so, H), b = paidPlusBal(sn, H); return a.cost - b.cost - fee(v) - stamp(v.bal) - v.extra; }
    function calc(v) {
      if (v.bal <= 0) { out.set(HT.el('div', { class: 'empty' }, '대출 잔액을 입력하세요.')); return; }
      const H = Math.min(v.hold * 12, Math.max(v.oMonths, v.nMonths)); const so = schedule(v.bal, v.oRate, v.oMonths, v.oMethod), sn = schedule(v.bal, v.nRate, v.nMonths, v.nMethod);
      const feeAmt = fee(v), st = stamp(v.bal), costs = feeAmt + st + v.extra;
      const a = paidPlusBal(so, H), b = paidPlusBal(sn, H); const net = a.cost - b.cost - costs;
      const intO = so.slice(0, H).reduce((x, s) => x + s.int, 0), intN = sn.slice(0, H).reduce((x, s) => x + s.int, 0);
      const intOAll = so.reduce((x, s) => x + s.int, 0), intNAll = sn.reduce((x, s) => x + s.int, 0);
      // 손익분기 시점
      let be = null; const curve = []; for (let m = 1; m <= H; m++) { const x = paidPlusBal(so, m), y = paidPlusBal(sn, m); const d = x.cost - y.cost - costs; curve.push(d); if (be === null && d >= 0) be = m; }
      // 손익분기 금리 (보유기간 기준)
      let lo = 0, hi = v.oRate + 5; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (advantage(v, mid, H) >= 0) lo = mid; else hi = mid; } const beRate = lo;
      const mo = so[0].pay, mn = sn[0].pay;
      const kind = net > 0 ? 'ok' : 'danger';
      out.set(HT.kpi(net > 0 ? '갈아타면 이득' : '갈아타면 손해', HT.won(Math.abs(net)), `${v.hold}년 보유 기준 · 수수료·부대비용 ${HT.won(costs)} 반영`),
        HT.el('div', { style: 'margin:-6px 0 14px' }, [HT.badge(be ? `손익분기 ${be}개월째 (${HT.fmt(be / 12, 1)}년)` : `${v.hold}년 안에 손익분기 없음`, be ? 'ok' : 'danger'), ' ', HT.badge(`손익분기 금리 ${HT.pct(beRate, 2)} 이하면 이득`, 'gray')]),
        HT.kpis([['월 상환액', `${HT.won(mo)} → ${HT.won(mn)}`, `${mn < mo ? '-' : '+'}${HT.won(Math.abs(mo - mn))}/월 (첫 달 기준)`], [`${v.hold}년간 이자`, `${HT.wonKor(intO)} → ${HT.wonKor(intN)}`, `${HT.wonKor(intO - intN)} 절감`], ['만기까지 총이자', `${HT.wonKor(intOAll)} → ${HT.wonKor(intNAll)}`, v.nMonths > v.oMonths ? '새 대출 기간이 더 길어 총이자는 늘 수 있음' : `${HT.wonKor(intOAll - intNAll)} 절감`]]),
        curveChart(curve, be),
        HT.rows([['중도상환수수료', HT.won(feeAmt), '', v.elapsed >= 36 ? '3년 경과 — 면제' : `잔액 × ${v.feeRate}% × 잔여 ${36 - v.elapsed}/36개월`], ['인지세 (본인 부담 절반)', HT.won(st), 'sub'], v.extra ? ['기타 부대비용', HT.won(v.extra), 'sub'] : null, ['갈아타기 비용 합계', HT.won(costs), 'strong'], [`${v.hold}년간 낸 돈 + 남은 원금 (기존)`, HT.won(a.cost), '', `상환 ${HT.wonKor(a.paid)} + 잔액 ${HT.wonKor(a.bal)}`], [`${v.hold}년간 낸 돈 + 남은 원금 (신규)`, HT.won(b.cost), '', `상환 ${HT.wonKor(b.paid)} + 잔액 ${HT.wonKor(b.bal)}`], ['차이 (기존 − 신규)', HT.won(a.cost - b.cost), 'sub'], ['순 손익 (차이 − 비용)', (net >= 0 ? '+' : '') + HT.won(net), net >= 0 ? 'pos strong' : 'neg strong']]),
        HT.table(['경과', '기존 누적 상환', '기존 잔액', '신규 누적 상환', '신규 잔액', '누적 손익'], Array.from({ length: Math.ceil(H / 12) }, (_, i) => { const m = Math.min(H, (i + 1) * 12); const x = paidPlusBal(so, m), y = paidPlusBal(sn, m); return [`${Math.round(m / 12 * 10) / 10}년`, HT.won(x.paid), HT.won(x.bal), HT.won(y.paid), HT.won(y.bal), HT.won(x.cost - y.cost - costs)]; }), { right: [1, 2, 3, 4, 5], hi: r => HT.num(r[5]) >= 0 && be && HT.num(r[0]) * 12 >= be && HT.num(r[0]) * 12 < be + 12 }));
    }
    function curveChart(vals, be) { // 누적 손익 (음수 허용)
      const W = 600, H = 200, padL = 70, padB = 26, padT = 10; const n = vals.length; const max = Math.max(...vals, 0), min = Math.min(...vals, 0); const span = (max - min) || 1;
      const px = i => padL + (W - padL - 10) * (n > 1 ? i / (n - 1) : 0), py = v => padT + (H - padT - padB) * (1 - (v - min) / span);
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`; [min, 0, max].forEach(t => { const y = py(t); s += `<line x1="${padL}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="${t === 0 ? 'var(--ink-soft)' : 'var(--line)'}"/><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${HT.esc(HT.wonKor(t))}</text>`; });
      s += `<polyline fill="none" stroke="var(--brand-key)" stroke-width="2" points="${vals.map((v, i) => px(i) + ',' + py(v)).join(' ')}"/>`;
      if (be) s += `<circle cx="${px(be - 1)}" cy="${py(vals[be - 1])}" r="4" fill="var(--brand-deep)"/><text x="${px(be - 1) + 6}" y="${py(vals[be - 1]) - 6}" font-size="11" fill="var(--brand-deep)">손익분기 ${be}개월</text>`;
      for (let y = 12; y <= n; y += 12) s += `<text x="${px(y - 1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--ink-soft)">${y / 12}년</text>`;
      s += '</svg>'; const d = HT.el('div', { class: 'chart', html: s }); d.append(HT.el('div', { class: 'cap' }, '월별 누적 손익 (기존 대비 신규, 비용 차감 후) — 0선 위가 이득')); return d;
    }
    calc(f.values());
  }
});
