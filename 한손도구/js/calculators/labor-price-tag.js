/* 노동시간 가격표 — 내 시급으로 물건값을 "일한 시간"으로 바꿔 보기 */
HT.register({
  id: 'labor-price-tag', cat: '급여·소득', order: 0.7, name: '노동시간 가격표', keywords: '시급 환산 노동시간 가격표 커피 아이폰 자동차 집 몇 시간 일해야',
  desc: '내 연봉을 세후 시급으로 바꾼 뒤 커피·배달·아이폰·여행·자동차·집이 각각 "몇 시간(며칠, 몇 년) 일한 값"인지 보여줍니다. 품목과 가격은 직접 바꿀 수 있습니다.',
  note: '시급은 연 실수령액을 연간 근로시간(주 근무시간 × 52주)으로 나눈 값이며, 세전으로 보고 싶으면 전환하세요. "며칠"은 하루 8시간, "몇 년"은 연간 근로시간 기준입니다. 집·자동차 같은 큰 금액은 저축 전액을 쓴다는 가정이 아니라 단순 환산이므로, 실제로는 생활비를 뺀 저축 여력으로 나눈 값(아래 "저축으로 사려면")이 더 현실적입니다.',
  render(root) {
    const out = HT.output(root, '가격표');
    const DEFAULT = [['아메리카노 한 잔', 4500], ['배달 한 끼', 15000], ['넷플릭스 한 달', 17000], ['헬스장 한 달', 60000], ['월세 한 달', 700000], ['아이폰', 1550000], ['해외여행 (일주일)', 2500000], ['노트북', 2000000], ['결혼식 (평균)', 40000000], ['국산 중형차', 40000000], ['서울 아파트 (평균)', 1508100000]];
    const f = HT.form(root, [
      { id: 'salary', p: 'salary', label: '연봉 (세전)', type: 'money', unit: '원', value: 50000000 },
      { id: 'basis', label: '시급 기준', type: 'seg', options: [['net', '세후 실수령'], ['gross', '세전']], value: 'net' },
      { id: 'hpw', label: '주당 실제 근무시간', type: 'number', unit: '시간', value: 40, min: 1, max: 80, help: '야근 포함 실제 시간을 넣으면 시급이 내려갑니다' },
      { id: 'save', label: '월 저축 여력 (큰 물건용, 선택)', type: 'money', unit: '원', value: 1000000 },
      { id: 'customName', label: '내 품목 이름', type: 'text', value: '갖고 싶은 것' },
      { id: 'customPrice', label: '내 품목 가격', type: 'money', unit: '원', value: 300000 },
    ], calc);
    function calc(v) {
      const hoursY = v.hpw * 52; const annual = v.basis === 'net' ? HT.payroll.netMonthly(v.salary).net * 12 : v.salary; const hourly = hoursY ? annual / hoursY : 0;
      if (!hourly) { out.set(HT.el('div', { class: 'empty' }, '연봉을 입력하세요.')); return; }
      const items = [[v.customName || '내 품목', v.customPrice], ...DEFAULT];
      const fmtT = (h) => h < 1 ? `${HT.fmt(h * 60, 0)}분` : h < 8 ? `${HT.fmt(h, 1)}시간` : h < hoursY ? `${HT.fmt(h / 8, 1)}일 (${HT.fmt(h, 0)}시간)` : `${HT.fmt(h / hoursY, 1)}년`;
      const rows = items.map(([n, p]) => { const h = p / hourly; const saveM = v.save > 0 ? p / v.save : null; return [n, HT.won(p), fmtT(h), saveM == null ? '-' : saveM < 1 ? '한 달 안' : saveM < 12 ? `${HT.fmt(saveM, 1)}개월` : `${HT.fmt(saveM / 12, 1)}년`]; });
      const share = `내 시급은 ${HT.won(hourly)}. 아메리카노는 ${fmtT(4500 / hourly)}, 아이폰은 ${fmtT(1550000 / hourly)}, 서울 아파트는 ${fmtT(1508100000 / hourly)}어치 노동 — 한손도구 노동시간 가격표`;
      const btns = HT.shareButtons(share, { title: '노동시간 가격표', big: `시급 ${HT.won(hourly)}`, lines: [`아메리카노 ${fmtT(4500 / hourly)}`, `아이폰 ${fmtT(1550000 / hourly)}`, `서울 아파트 ${fmtT(1508100000 / hourly)}`], file: 'labor' });
      out.set(HT.kpi(`내 시급 (${v.basis === 'net' ? '세후' : '세전'})`, HT.won(hourly), `연 ${HT.wonKor(annual)} ÷ ${HT.fmt(hoursY)}시간 · 1분에 ${HT.won(hourly / 60)}`),
        HT.table(['품목', '가격', '일해야 하는 시간', '저축으로 사려면'], rows, { right: [1, 2, 3], scroll: false, hi: (r, i) => i === 0 }),
        HT.barChart(items.slice(1, 9).map(([n, p]) => ({ label: n, value: p / hourly, color: 'var(--c2)' })), { fmt: h => fmtT(h), padL: 150, cap: '노동시간으로 본 가격 (긴 막대일수록 비싼 것)' }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns);
    }
    calc(f.values());
  }
});
