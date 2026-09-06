/* 2027 신년운세 — 정미년(丁未, 붉은 양). 띠와 未의 관계(육합 午 · 삼합 亥卯 · 충 丑 · 형 戌 · 해 子)로 기본 등급을 잡고
   생년월일 해시로 5분야 점수·월별 흐름을 결정적으로 만든다. HT.saju(오늘의 운세)가 있으면 그 해시·띠 계산을 재사용 */
HT.register({
  id: 'new-year-fortune', cat: '유용한도구', order: 0.35, name: '2027 신년운세 (정미년)', keywords: '2027 신년운세 정미년 양띠 해 띠별 운세 새해 운세',
  desc: '생년월일을 넣으면 2027년 정미년(붉은 양의 해) 총운과 재물·직장·사랑·건강·학업 다섯 분야, 월별 흐름, 좋은 달·조심할 달, 나이대별 조언을 보여줍니다. 띠와 그해 지지(未)의 합·충 관계를 바탕으로 합니다.',
  note: '동양 역술의 합·충·형·해 관계와 오행을 단순화한 재미용 운세이며 같은 생년월일은 항상 같은 결과가 나옵니다. 중요한 결정은 숫자(이 사이트의 계산기들)로 확인하세요. 띠는 입춘(2월 4일) 기준입니다.',
  render(root) {
    const S = window.HT.saju; const ZOD = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
    const hash = S ? S.hash : (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    const REL = { 6: ['육합', 92, '未와 午는 육합. 귀인이 붙고 일이 순조롭게 풀리는 해'], 11: ['삼합', 88, '亥·卯·未 삼합. 협력과 확장의 해'], 3: ['삼합', 88, '亥·卯·未 삼합. 협력과 확장의 해'], 7: ['본띠', 76, '본인의 해. 변화가 크고 주목받지만 체력 관리가 관건'], 1: ['충', 58, '丑未 충. 계획이 자주 바뀌니 큰 투자·이직은 검토를 두 번'], 10: ['형', 64, '戌未 형. 관계 마찰과 서류·계약 실수를 조심'], 0: ['해', 66, '子未 해. 사소한 오해가 쌓이니 말을 아끼는 해'] };
    const FIELDS = ['재물', '직장·사업', '사랑·인연', '건강', '학업·자기계발']; const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const TXT = { 재물: ['큰돈보다 새는 돈을 막는 해. 구독·습관 지출을 점검하면 뜻밖의 여유가 생긴다.', '수입이 늘 조짐. 다만 들어온 만큼 나가기 쉬우니 자동이체 저축을 먼저.', '투자 성과가 따르는 해. 분산과 현금 비중을 지키면 결실이 크다.'], '직장·사업': ['버티는 해. 성과보다 관계와 기록을 남기면 하반기에 인정받는다.', '역할이 넓어진다. 제안이 오면 총보상으로 비교해 결정할 것.', '승진·이직·창업 모두 길. 준비된 사람에게 기회가 온다.'], '사랑·인연': ['혼자만의 시간이 유익. 서두르면 어긋난다.', '소개와 모임에서 인연. 오래 알던 사람을 다시 보게 된다.', '결혼·동거·재회 등 관계가 한 단계 나아가는 해.'], 건강: ['잔병과 피로 주의. 수면과 허리·목을 챙길 것.', '무난하나 과로가 쌓인다. 정기 검진을 미루지 말 것.', '컨디션이 좋다. 운동을 시작하면 오래 간다.'], '학업·자기계발': ['집중이 흩어진다. 짧은 목표를 여러 개로.', '배운 것이 쓸모를 찾는 해. 자격·어학이 잘 붙는다.', '시험·합격운이 강하다. 도전을 미루지 말 것.'] };
    const AGE = [[19, '10대: 진로보다 습관. 올해 붙인 공부·운동 습관이 10년을 간다.'], [29, '20대: 첫 목돈의 해. 1억 만들기 시뮬레이터로 배분부터.'], [39, '30대: 집·결혼·이직이 겹치는 시기. 큰 결정은 숫자로.'], [49, '40대: 벌이는 정점, 지출도 정점. 노후 준비를 시작할 마지막 좋은 때.'], [59, '50대: 지키는 해. 은퇴 시뮬레이터로 부족분을 미리 확인.'], [200, '60대 이후: 건강이 곧 재물. 연금 수령 시점을 최적화.']];
    const out = HT.output(root, '2027년 정미년 운세'); out.wrap.classList.add('wide');
    const f = HT.form(root, [{ id: 'birth', p: 'birth', label: '생년월일 (양력)', type: 'date', value: '1994-05-15' }, { id: 'gender', label: '성별 (문구 참고용)', type: 'seg', options: [['x', '선택 안 함'], ['f', '여'], ['m', '남']], value: 'x' }], calc);
    if (S && S.load) { try { const st = S.load(); if (st && st.birth) f.set('birth', st.birth); } catch (e) {} }
    function calc(v) {
      const d = new Date(v.birth); if (isNaN(d)) { out.set(HT.el('div', { class: 'empty' }, '생년월일을 입력하세요.')); return; }
      const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate(); const z = S ? S.zodiacOf(y, m, dd) : ((((m < 2 || (m === 2 && dd < 4)) ? y - 1 : y) - 4) % 12 + 12) % 12;
      const rel = REL[z] || ['평', 72, '未와 특별한 합·충이 없는 해. 스스로 만드는 만큼 얻는다']; const seed = hash(`${v.birth}|2027`); const rnd = (i) => (hash(seed + ':' + i) % 1000) / 1000;
      const scores = FIELDS.map((fld, i) => HT.clamp(Math.round(rel[1] + (rnd(i) - 0.5) * 30), 35, 99)); const total = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const months = MONTHS.map((_, i) => HT.clamp(Math.round(total + (rnd(20 + i) - 0.5) * 40), 30, 99)); const best = [...months.keys()].sort((a, b) => months[b] - months[a]).slice(0, 3).sort((a, b) => a - b); const worst = [...months.keys()].sort((a, b) => months[a] - months[b]).slice(0, 2).sort((a, b) => a - b);
      const age = 2027 - y; const ageTxt = AGE.find(a => age <= a[0])[1]; const lucky = { color: ['흰색', '남색', '초록', '금색', '보라'][seed % 5], num: [(seed % 9) + 1, ((seed >> 3) % 9) + 1].join('·'), dir: ['동', '서', '남', '북', '동남', '서북'][(seed >> 5) % 6] };
      const grade = (s) => s >= 85 ? '상' : s >= 70 ? '중상' : s >= 55 ? '중' : '하'; const stars = (s) => '★'.repeat(Math.round(s / 20)) + '☆'.repeat(5 - Math.round(s / 20));
      const share = `2027 정미년 ${ZOD[z]}띠 총운 ${total}점(${grade(total)}) · ${rel[0]} — 재물 ${scores[0]} 직장 ${scores[1]} 사랑 ${scores[2]} 건강 ${scores[3]} 학업 ${scores[4]} · 좋은 달 ${best.map(i => MONTHS[i]).join('·')} — 한손도구 신년운세`;
      out.set(HT.kpi(`${ZOD[z]}띠 · 2027 정미년 총운`, `${total}점 ${stars(total)}`, `${rel[0]} — ${rel[2]}`),
        HT.el('div', { class: 'kpis' }, FIELDS.map((fld, i) => HT.kpi(fld, `${scores[i]} ${stars(scores[i])}`, TXT[fld][scores[i] >= 80 ? 2 : scores[i] >= 60 ? 1 : 0]))),
        HT.stackChart(MONTHS, [{ name: '월별 흐름', color: 'var(--c1)', values: months }], { fmt: x => Math.round(x) + '점', cap: `좋은 달 ${best.map(i => MONTHS[i]).join(' · ')} — 조심할 달 ${worst.map(i => MONTHS[i]).join(' · ')}` }),
        HT.rows([['나이대 조언', ageTxt], ['행운의 색 · 숫자 · 방향', `${lucky.color} · ${lucky.num} · ${lucky.dir}`], ['정미년의 기운', '丁(불) 위에 未(흙·양). 따뜻하지만 마르기 쉬운 해 — 성급함을 줄이고 꾸준함을 지키는 사람에게 유리합니다.']]),
        HT.shareButtons(share, { title: `2027 정미년 신년운세 · ${ZOD[z]}띠`, big: `총운 ${total}점 ${grade(total)}`, lines: [rel[2], `재물 ${scores[0]} · 직장 ${scores[1]} · 사랑 ${scores[2]} · 건강 ${scores[3]} · 학업 ${scores[4]}`, `좋은 달 ${best.map(i => MONTHS[i]).join('·')} / 조심할 달 ${worst.map(i => MONTHS[i]).join('·')}`], file: 'newyear-2027' }),
        HT.el('div', { class: 'note', html: `<a href="#/daily-fortune">오늘의 운세</a> · <a href="#/monthly-fortune">이달의 운세</a> · <a href="#/love-match">궁합 보기</a> · <a href="#/tarot">타로 한 장</a> · <a href="#/good-day">택일 도우미</a>` }));
    }
    calc(f.values());
  }
});
