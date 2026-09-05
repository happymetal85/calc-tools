/* 구독료 총액 · 습관 지출 30년 — 매달 새는 돈을 연 단위와 30년 복리로, 노동시간으로 환산 */
HT.register({
  id: 'subscription-habit', cat: '내 재무', order: 6, original: false, name: '구독료 · 습관 지출의 진실', keywords: '구독료 총액 넷플릭스 유튜브 통신비 커피 배달 담배 습관 지출 30년 복리',
  desc: '쓰고 있는 구독 서비스를 체크하고 커피·배달·택시 같은 습관 지출을 넣으면 월·연 총액, 30년 뒤 복리 가치, 내 시급으로 몇 시간어치인지 보여줍니다. 하나씩 끊었을 때의 효과도 계산합니다.',
  note: '구독 요금은 2026년 9월 기준 대표 요금제이며 직접 고칠 수 있습니다. 30년 복리는 그 돈을 매달 연 5%(세후 4.2%)로 굴렸을 때의 값으로, 기대값일 뿐 보장이 아닙니다. 시급은 대시보드의 연봉으로 세후 실수령 기준 계산합니다. 목적은 "끊어라"가 아니라 "알고 쓰자"입니다.',
  render(root) {
    const SUBS = [['넷플릭스 (광고형)', 5500], ['넷플릭스 (스탠다드)', 13500], ['유튜브 프리미엄', 14900], ['디즈니+', 9900], ['티빙', 9500], ['쿠팡플레이·와우', 7890], ['왓챠', 7900], ['멜론', 10900], ['스포티파이', 10900], ['애플 뮤직', 8900], ['네이버플러스', 4900], ['배민클럽', 3990], ['챗GPT Plus', 29000], ['클라우드 (iCloud·구글)', 3300], ['게임 구독 (게임패스 등)', 13900], ['헬스장', 60000], ['통신비', 55000], ['정수기·렌털', 30000]];
    const HABITS = [['커피', 4500, 5, '주'], ['배달 (배달비·최소주문 차액)', 6000, 3, '주'], ['택시', 12000, 2, '주'], ['담배', 4500, 5, '주'], ['술자리', 40000, 1, '주'], ['편의점 간식', 3000, 5, '주'], ['온라인 쇼핑 충동구매', 30000, 2, '월']];
    const out = HT.output(root, '새는 돈');
    const subBox = HT.el('div'); const habBox = HT.el('div'); const state = { subs: {}, habits: {} }; try { Object.assign(state, JSON.parse(localStorage.getItem('ht_subs') || '{}')); } catch (e) {}
    const prof = HT.profile.get(); const salaryDefault = prof.salary || 50000000;
    const f = HT.form(root, [{ id: 'salary', p: 'salary', label: '연봉 (시급 환산용)', type: 'money', unit: '원', value: salaryDefault }, { id: 'rate', label: '복리 수익률 (세전)', type: 'number', unit: '%', value: 5, step: 0.5 }, { id: 'years', label: '기간', type: 'number', unit: '년', value: 30, min: 1, max: 50 }], run, { extra: HT.el('div', {}, [HT.el('h3', {}, '구독 서비스 (체크·금액 수정)'), subBox, HT.el('h3', { style: 'margin-top:14px' }, '습관 지출'), habBox]) });
    function save() { try { localStorage.setItem('ht_subs', JSON.stringify(state)); } catch (e) {} }
    SUBS.forEach(([n, p], i) => { const st = state.subs[i] || { on: false, price: p }; state.subs[i] = st; const cb = HT.el('input', { type: 'checkbox' }); cb.checked = st.on; const inp = HT.el('input', { type: 'text', value: HT.fmt(st.price), style: 'width:90px;text-align:right;padding:4px 6px;border:1px solid var(--line);border-radius:3px' }); cb.addEventListener('change', () => { st.on = cb.checked; save(); run(f.values()); }); inp.addEventListener('input', () => { st.price = HT.num(inp.value); save(); run(f.values()); }); subBox.append(HT.el('div', { class: 'field check', style: 'display:grid;grid-template-columns:1fr auto;align-items:center;margin-bottom:6px' }, [HT.el('label', {}, [cb, n]), HT.el('div', { class: 'in' }, [inp, HT.el('span', { class: 'unit' }, '원/월')])])); });
    HABITS.forEach(([n, p, times, per], i) => { const st = state.habits[i] || { price: p, times: 0, per }; if (state.habits[i] == null) st.times = 0; state.habits[i] = st; const inpP = HT.el('input', { type: 'text', value: HT.fmt(st.price), style: 'width:80px;text-align:right;padding:4px 6px;border:1px solid var(--line);border-radius:3px' }); const inpT = HT.el('input', { type: 'number', value: st.times, min: 0, style: 'width:60px;padding:4px 6px;border:1px solid var(--line);border-radius:3px' }); inpP.addEventListener('input', () => { st.price = HT.num(inpP.value); save(); run(f.values()); }); inpT.addEventListener('input', () => { st.times = HT.num(inpT.value); save(); run(f.values()); }); habBox.append(HT.el('div', { class: 'field', style: 'display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;margin-bottom:6px' }, [HT.el('label', { style: 'margin:0' }, n), HT.el('div', { class: 'in' }, [inpP, HT.el('span', { class: 'unit' }, '원')]), HT.el('div', { class: 'in' }, [inpT, HT.el('span', { class: 'unit' }, `회/${per}`)])])); });
    function run(v) {
      const subs = SUBS.map(([n], i) => ({ n, m: state.subs[i].on ? state.subs[i].price : 0 })).filter(x => x.m > 0);
      const habits = HABITS.map(([n, , , per], i) => { const st = state.habits[i]; return { n, m: st.times > 0 ? st.price * st.times * (per === '주' ? 52 / 12 : 1) : 0 }; }).filter(x => x.m > 0);
      const all = [...subs, ...habits]; const monthly = all.reduce((a, b) => a + b.m, 0); if (!monthly) { out.set(HT.el('div', { class: 'empty' }, '구독을 체크하거나 습관 지출 횟수를 넣으세요.')); return; }
      const r = v.rate / 100 * (1 - .154) / 12, n = v.years * 12; const fv = (m) => r ? m * (Math.pow(1 + r, n) - 1) / r : m * n; const hourly = HT.payroll.netMonthly(v.salary).net * 12 / 2080;
      all.sort((a, b) => b.m - a.m); const top = all[0];
      const share = `매달 구독·습관에 ${HT.won(monthly)}, 1년이면 ${HT.wonKor(monthly * 12)}. ${v.years}년 굴리면 ${HT.wonKor(fv(monthly))}. 가장 큰 건 ${top.n} 월 ${HT.won(top.m)} — 한손도구 구독료·습관 지출의 진실`;
      out.set(HT.kpi('매달 새는 돈', HT.won(monthly), `연 ${HT.wonKor(monthly * 12)} · 내 시급(${HT.won(hourly)})으로 매달 ${HT.fmt(monthly / hourly, 1)}시간어치`),
        HT.kpis([[`${v.years}년 뒤 (복리 ${v.rate}%)`, HT.wonKor(fv(monthly)), `원금 ${HT.wonKor(monthly * n)} + 수익 ${HT.wonKor(fv(monthly) - monthly * n)}`], ['구독 · 습관', `${HT.won(subs.reduce((a, b) => a + b.m, 0))} · ${HT.won(habits.reduce((a, b) => a + b.m, 0))}`, `${subs.length}개 구독 · ${habits.length}개 습관`], ['월 저축 여력 대비', prof.rent != null ? HT.pct(monthly / Math.max(1, HT.payroll.netMonthly(v.salary).net - (prof.rent + prof.fixed + prof.living)) * 100, 0) : '-', '대시보드 지출 기준']]),
        HT.barChart(all.slice(0, 10).map((x, i) => ({ label: x.n, value: x.m, color: i === 0 ? 'var(--c1)' : 'var(--g3)' })), { fmt: HT.won, padL: 170, cap: '항목별 월 지출' }),
        HT.el('h3', {}, '하나 끊으면'),
        HT.table(['항목', '월', '연', `${v.years}년 복리`, '시급 환산'], all.map(x => [x.n, HT.won(x.m), HT.won(x.m * 12), HT.wonKor(fv(x.m)), HT.fmt(x.m / hourly, 1) + '시간/월']), { right: [1, 2, 3, 4], scroll: false }),
        HT.shareButtons(share, { title: '구독료 · 습관 지출의 진실', big: `매달 ${HT.won(monthly)}`, lines: [`1년 ${HT.wonKor(monthly * 12)}`, `${v.years}년 복리 ${HT.wonKor(fv(monthly))}`, `가장 큰 항목: ${top.n}`], file: 'subscription' }),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 통신비처럼 필수 항목은 끊는 게 아니라 요금제를 바꾸는 것(알뜰폰 등)이 답입니다. 습관 지출은 "0으로" 대신 "절반으로" 잡아도 ${v.years}년 뒤 ${HT.wonKor(fv(habits.reduce((a, b) => a + b.m, 0) / 2))} 차이가 납니다. 노동시간으로 다시 보려면 <a href="#/labor-price-tag">노동시간 가격표</a>.` }));
    }
    run(f.values());
  }
});
