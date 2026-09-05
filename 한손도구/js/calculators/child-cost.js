/* 아이 한 명 키우는 데 얼마 — 출생~대학 졸업 양육비(나이대별 월 비용 + 사교육 + 대학) − 2026년 정부 지원 = 순부담
   지원(2026): 첫만남이용권 첫째 200만·둘째 이상 300만 / 부모급여 0세 월 100만·1세 월 50만 / 아동수당 8세 미만 월 10만(비수도권 10.5만) / 자녀세액공제 8~20세 첫째 연 25만·둘째 30만·셋째~ 40만
   사교육비(2024 조사, 참여학생 월평균 59.2만 · 전체 47.4만, 서울 67.3만) / 양육비 총액 옛 통계 3억 896만(2012) */
HT.register({
  id: 'child-cost', cat: '내 재무', order: 5, original: false, name: '아이 한 명 키우는 데 얼마', keywords: '양육비 총액 아이 키우는 비용 출산 지원금 부모급여 아동수당 사교육비 대학 등록금',
  desc: '출생부터 대학 졸업까지 나이대별 양육비와 사교육비, 대학 비용을 쌓고 2026년 정부 지원(첫만남이용권·부모급여·아동수당·자녀세액공제)을 빼서 실제 부담을 보여줍니다. 사교육 포함/제외, 물가 반영, 둘째 여부를 바꿔 볼 수 있습니다.',
  note: '나이대별 월 비용 기본값은 보건사회연구원·육아정책연구소 조사와 2024년 사교육비 조사를 참고한 평균치이며 가정마다 크게 다르므로 직접 고쳐 쓰세요. 지원금은 2026년 기준 국가 사업만 넣었고 지자체 출산장려금·육아휴직 급여·보육료(어린이집 무상)·누리과정은 뺐습니다. 물가 반영을 켜면 해마다 비용이 오르는 명목 금액이 됩니다.',
  render(root) {
    const out = HT.output(root, '양육비 계산');
    const f = HT.form(root, [
      { id: 'order', label: '몇째 아이', type: 'seg', options: [['1', '첫째'], ['2', '둘째'], ['3', '셋째 이상']], value: '1' },
      { id: 'c0', label: '0~2세 월 비용 (기저귀·분유·용품·돌봄)', type: 'money', unit: '원', value: 900000 },
      { id: 'c3', label: '3~5세 월 비용 (유치원·놀이·식비)', type: 'money', unit: '원', value: 800000 },
      { id: 'c6', label: '6~12세 월 비용 (사교육 제외)', type: 'money', unit: '원', value: 700000 },
      { id: 'c13', label: '13~18세 월 비용 (사교육 제외)', type: 'money', unit: '원', value: 900000 },
      { id: 'edu', label: '사교육 포함', type: 'check', value: true },
      { id: 'e6', label: '초등 사교육 (월)', type: 'money', unit: '원', value: 500000, show: v => v.edu, help: '2024 참여학생 평균 초 58만·중 65만·고 74만 안팎' },
      { id: 'e13', label: '중학 사교육 (월)', type: 'money', unit: '원', value: 650000, show: v => v.edu },
      { id: 'e16', label: '고등 사교육 (월)', type: 'money', unit: '원', value: 750000, show: v => v.edu },
      { id: 'univ', label: '대학 4년', type: 'seg', options: [['none', '안 감 / 본인 부담'], ['home', '통학 (등록금만)'], ['away', '자취 (등록금 + 생활비)']], value: 'home' },
      { id: 'tuition', label: '연간 등록금', type: 'money', unit: '원', value: 7000000, show: v => v.univ !== 'none', help: '국립 약 420만 · 사립 약 760만' },
      { id: 'living', label: '자취 생활비 (월)', type: 'money', unit: '원', value: 800000, show: v => v.univ === 'away' },
      { id: 'metro', label: '수도권 거주 (아동수당 10만, 비수도권 10.5만)', type: 'check', value: true },
      { id: 'infl', label: '물가 반영 (연 2.5%)', type: 'check', value: false },
    ], calc);
    function calc(v) {
      const g = (y) => v.infl ? Math.pow(1.025, y) : 1; const bands = []; let total = 0, eduTotal = 0;
      const push = (label, from, to, monthly, edu) => { let cost = 0, e = 0; for (let y = from; y <= to; y++) { cost += monthly * 12 * g(y); e += (edu || 0) * 12 * g(y); } bands.push({ label, cost, edu: e, years: to - from + 1 }); total += cost + e; eduTotal += e; };
      push('0~2세 (영아)', 0, 2, v.c0, 0); push('3~5세 (유아)', 3, 5, v.c3, 0); push('6~12세 (초등)', 6, 12, v.c6, v.edu ? v.e6 : 0); push('13~15세 (중등)', 13, 15, v.c13, v.edu ? v.e13 : 0); push('16~18세 (고등)', 16, 18, v.c13, v.edu ? v.e16 : 0);
      if (v.univ !== 'none') { let c = 0; for (let y = 19; y <= 22; y++) c += (v.tuition + (v.univ === 'away' ? v.living * 12 : 0)) * g(y); bands.push({ label: '19~22세 (대학)', cost: c, edu: 0, years: 4 }); total += c; }
      // 지원
      const first = v.order === '1' ? 2e6 : 3e6; const parent = 1e6 * 12 + 5e5 * 12; let child = 0; for (let y = 0; y < 8; y++) child += (v.metro ? 1e5 : 1.05e5) * 12 * g(y); let credit = 0; const cr = v.order === '1' ? 25e4 : v.order === '2' ? 30e4 : 40e4; for (let y = 8; y <= 20; y++) credit += cr * g(y);
      const support = first + parent + child + credit; const net = total - support;
      const share = `아이 한 명 키우는 데 ${HT.wonKor(total)} (출생~${v.univ === 'none' ? '고교' : '대학'}${v.edu ? ', 사교육 포함' : ''}), 정부 지원 ${HT.wonKor(support)} 빼면 순부담 ${HT.wonKor(net)} — 월평균 ${HT.won(net / ((v.univ === 'none' ? 19 : 23) * 12))} · 한손도구`;
      out.set(HT.kpi('순부담 (지원금 뺀 뒤)', HT.wonKor(net), `총 양육비 ${HT.wonKor(total)} − 정부 지원 ${HT.wonKor(support)} · 월평균 ${HT.won(net / ((v.univ === 'none' ? 19 : 23) * 12))}`),
        HT.kpis([['총 양육비', HT.wonKor(total), v.edu ? `사교육 ${HT.wonKor(eduTotal)} 포함` : '사교육 제외'], ['정부 지원 합계', HT.wonKor(support), '첫만남·부모급여·아동수당·자녀세액공제'], ['서울 아파트 대비', HT.fmt(net / 1508100000 * 100, 0) + '%', '평균 15억 810만원 기준']]),
        HT.stackChart(bands.map(b => b.label.split(' ')[0]), [{ name: '기본 양육비', color: 'var(--c2)', values: bands.map(b => b.cost) }, { name: '사교육', color: 'var(--c1)', values: bands.map(b => b.edu) }], { fmt: HT.wonKor, cap: '나이대별 비용' }),
        HT.table(['시기', '기간', '기본 비용', '사교육', '합계', '월평균'], bands.map(b => [b.label, b.years + '년', HT.won(b.cost), HT.won(b.edu), HT.won(b.cost + b.edu), HT.won((b.cost + b.edu) / b.years / 12)]), { right: [1, 2, 3, 4, 5], scroll: false }),
        HT.el('h3', { style: 'margin-top:16px' }, '2026년 정부 지원 (국가 사업)'),
        HT.rows([['첫만남이용권', HT.won(first), '', v.order === '1' ? '첫째 200만원' : '둘째 이상 300만원'], ['부모급여 (0세 월 100만 · 1세 월 50만)', HT.won(parent)], ['아동수당 (8세 미만 월 ' + (v.metro ? '10만' : '10.5만') + ')', HT.won(child)], ['자녀세액공제 (8~20세, 연 ' + HT.won(cr) + ')', HT.won(credit)], ['합계', HT.won(support), 'strong'], ['그 밖에', '지자체 출산장려금 · 육아휴직 급여(월 최대 250만) · 어린이집 무상보육 · 누리과정', 'sub']]),
        HT.shareButtons(share, { title: '아이 한 명 키우는 데', big: HT.wonKor(net), lines: [`총 양육비 ${HT.wonKor(total)}${v.edu ? ' (사교육 포함)' : ''}`, `정부 지원 ${HT.wonKor(support)}`, `월평균 ${HT.won(net / ((v.univ === 'none' ? 19 : 23) * 12))}`], file: 'child-cost' }),
        HT.el('div', { class: 'note', html: `<b>보는 법</b> 옛 공식 통계(2012년)로는 대학 졸업까지 3억 896만원이었고, 물가를 반영하면 지금은 4~5억원대로 봅니다. 위 계산은 우리 집 기준으로 직접 맞출 수 있습니다. 둘째부터는 첫만남이용권이 300만원, 자녀세액공제가 30만원으로 늘고 옷·용품을 물려 써 실제 비용은 첫째보다 적습니다. 결혼·출산 자금 흐름은 <a href="#/wedding-planner">결혼·신혼 자금 플래너</a>에서.` }));
    }
    calc(f.values());
  }
});
