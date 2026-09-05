/* 이달의 운세 — 월건(절기 기준 월주)과 띠·일간 오행의 관계로 월운을 보고, 주별 흐름과 이달의 좋은 날·조심할 날을 일진으로 고른다. 공통 자료는 daily-fortune.js 의 HT.saju */
(function () {
  'use strict';
  const CATS = ['금전운', '애정운', '직장·학업운', '건강운', '대인관계운'];
  const CAT_TXT = {
    '금전운': {
      hi: ['수입이 늘거나 묶였던 돈이 풀리는 달입니다. 월 중반 이후 흐름이 특히 좋습니다.', '돈이 모이는 달입니다. 자동 저축 금액을 이달에 올려 두면 연말이 든든합니다.', '투자한 것이 결실을 보기 시작합니다. 욕심내지 말고 계획했던 선에서 정리하세요.', '뜻밖의 상여금이나 환급이 있을 수 있습니다. 들어온 돈의 절반은 바로 저축하세요.'],
      mid: ['들어오고 나가는 돈이 비슷한 달입니다. 큰 지출만 피하면 무난히 지나갑니다.', '고정비를 점검하기 좋은 달입니다. 구독과 보험을 한 번 정리하면 한 달치 여유가 생깁니다.', '충동구매가 잦아질 수 있습니다. 사고 싶은 것은 목록에 적고 다음 달에 다시 보세요.', '돈보다 시간을 쓰는 달입니다. 지금의 투자는 배움과 사람에 하세요.'],
      lo: ['예정에 없던 지출이 생기기 쉬운 달입니다. 비상금을 미리 떼어 두세요.', '보증·대여·공동 투자는 이달은 피하세요. 관계까지 잃을 수 있습니다.', '새 투자보다 기존 것을 지키는 달입니다. 손절 기준을 미리 정해 두세요.', '계약이나 큰 결제는 서두르지 마세요. 다음 달이 조건이 더 낫습니다.'] },
    '애정운': {
      hi: ['마음이 오가는 달입니다. 혼자라면 새 만남의 기회가, 연인이 있다면 관계가 깊어지는 계기가 옵니다.', '고백이나 중요한 대화를 하기 좋은 달입니다. 월 후반이 특히 순조롭습니다.', '상대의 마음을 얻는 달입니다. 작은 배려가 크게 기억됩니다.', '오랜 인연이 다시 이어질 수 있습니다. 연락이 오면 반갑게 받으세요.'],
      mid: ['안정적인 달입니다. 큰 행사보다 매일의 안부가 관계를 지킵니다.', '상대에게 기대는 만큼 서운함도 생깁니다. 기대치를 조금 낮추세요.', '만남보다 정리의 달일 수 있습니다. 애매한 관계는 이달에 마음을 정하세요.', '혼자라면 자기 관리에 집중하기 좋은 달입니다. 좋은 인연은 그 뒤에 옵니다.'],
      lo: ['오해와 다툼이 생기기 쉬운 달입니다. 중요한 대화는 화가 가라앉은 뒤에 하세요.', '지나간 인연에 마음이 흔들릴 수 있습니다. 하루만 더 생각하고 움직이세요.', '상대의 말보다 행동을 보세요. 말로만 오가는 약속은 이달엔 믿지 마세요.', '외로움에 서둘러 시작한 관계는 오래가지 않습니다. 이달은 천천히 가세요.'] },
    '직장·학업운': {
      hi: ['성과가 드러나는 달입니다. 미뤄 둔 보고·발표·시험에 자신 있게 나서세요.', '새 기회나 제안이 들어옵니다. 조건을 꼼꼼히 보되 긍정적으로 검토하세요.', '집중력이 높은 달입니다. 큰 과제를 이달에 끝내면 다음 달이 가벼워집니다.', '윗사람의 신뢰가 쌓이는 달입니다. 작은 일의 마무리가 평가를 좌우합니다.'],
      mid: ['새 일보다 하던 일을 정리하는 달입니다. 완료 목록을 늘리세요.', '동료와의 협업에서 답이 나옵니다. 혼자 끙끙대지 말고 물어보세요.', '능률이 들쭉날쭉할 수 있습니다. 몸 상태가 좋은 날에 어려운 일을 몰아서 하세요.', '평가나 시험 결과는 기대와 비슷합니다. 준비한 만큼 나옵니다.'],
      lo: ['말실수와 문서 실수를 조심하는 달입니다. 보내기 전에 한 번 더 읽으세요.', '이직이나 전과 같은 큰 결정은 이달을 넘기세요. 다음 달에 정보가 더 들어옵니다.', '일이 밀리는 느낌이 드는 달입니다. 할 일을 셋으로 줄이고 하나씩 지우세요.', '상사나 선생님과 부딪힐 수 있습니다. 변명보다 "알겠습니다"가 낫습니다.'] },
    '건강운': {
      hi: ['체력이 오르는 달입니다. 운동을 시작하기 좋고, 시작하면 오래 갑니다.', '몸이 가벼운 달입니다. 이참에 건강검진을 받아 두면 마음도 가벼워집니다.', '잠의 질이 좋아집니다. 자는 시간을 30분 앞당기면 효과가 배가 됩니다.', '식습관을 바꾸기 좋은 달입니다. 한 끼에 채소 한 접시만 더하세요.'],
      mid: ['큰 문제는 없지만 피로가 쌓이기 쉽습니다. 주 하루는 아무 일정도 잡지 마세요.', '목·어깨·허리가 뻐근할 수 있습니다. 한 시간마다 일어나 움직이세요.', '환절기 감기를 조심하세요. 물을 자주 마시고 손을 씻으세요.', '기분이 몸을 좌우하는 달입니다. 스트레스 푸는 방법을 하나 정해 두세요.'],
      lo: ['면역이 떨어지는 달입니다. 무리한 일정과 야식은 피하세요.', '잔부상과 사고를 조심하세요. 계단·운전·운동에서 특히 주의가 필요합니다.', '소화기와 잠이 예민해집니다. 커피와 술을 절반으로 줄이세요.', '몸이 보내는 신호를 미루지 마세요. 이상하면 이달 안에 병원에 가세요.'] },
    '대인관계운': {
      hi: ['사람 덕을 보는 달입니다. 모임·초대·소개는 거절하지 마세요.', '귀인이 나타나는 달입니다. 평소 안 가던 자리에서 만날 가능성이 큽니다.', '오해가 풀리고 관계가 회복됩니다. 먼저 연락하는 쪽이 이깁니다.', '말에 힘이 실리는 달입니다. 부탁과 제안은 이달에 하세요.'],
      mid: ['평온한 달입니다. 깊은 대화보다 가벼운 안부가 어울립니다.', '남의 일에 끼어들지 마세요. 중재하려다 양쪽에 서운함을 삽니다.', '가족과의 시간이 마음을 채웁니다. 한 번은 얼굴을 보세요.', '새 사람보다 옛 사람을 챙기는 달입니다. 오랜 친구에게 연락하세요.'],
      lo: ['말이 와전되기 쉬운 달입니다. 남의 이야기는 옮기지 마세요.', '돈이 얽힌 부탁을 조심하세요. 거절이 관계를 지킵니다.', '오래된 갈등이 다시 드러날 수 있습니다. 정면 대결보다 시간을 두세요.', '모임에서는 한발 물러서세요. 조용한 편이 평판에 이롭습니다.'] },
  };
  const OPEN = { hi: ['기운이 크게 열리는 달입니다.', '오래 기다린 결실이 보이는 달입니다.', '움직이는 만큼 얻는 달입니다.', '귀인과 기회가 함께 오는 달입니다.'], mid: ['무난하고 안정적인 달입니다.', '기초를 다지는 달입니다.', '큰 기복 없이 흘러가는 달입니다.', '준비의 달입니다. 다음 달을 위해 힘을 모으세요.'], lo: ['숨을 고르는 달입니다.', '지키는 데 집중할 달입니다.', '돌다리를 두드려야 하는 달입니다.', '몸을 낮추고 때를 기다리는 달입니다.'] };
  const KEYWORDS = ['정리', '도전', '휴식', '만남', '배움', '저축', '대화', '건강', '여행', '집중', '용기', '인내', '감사', '결단', '유연함', '균형', '회복', '표현', '기록', '나눔'];
  const ADVICE = ['이달의 목표는 하나만 정하세요. 둘이면 둘 다 놓칩니다.', '월초에 세운 계획을 15일에 한 번 다시 보세요.', '이달 안에 고마운 사람 세 명에게 연락하세요.', '돈은 월초에 저축하고 남은 것으로 사세요.', '한 주에 하루는 아무것도 하지 않는 날로 비워 두세요.', '미뤄 둔 전화 한 통이 이달의 방향을 바꿉니다.', '이달에 배운 것을 한 줄씩 적어 두세요. 다음 달의 자산이 됩니다.', '새로 시작하기보다 하나를 끝내는 달로 삼으세요.', '이달은 "아니요"를 연습하는 달입니다.', '몸이 먼저입니다. 잠을 줄여서 얻는 것은 없습니다.'];
  const MREL = { same: [4, '이달의 기운이 당신의 띠와 같아 자신감이 오르는 달입니다.'], hap6: [8, '이달의 기운과 띠가 육합(六合) — 뜻한 일이 잘 풀리는 달입니다.'], hap3: [6, '이달의 기운과 띠가 삼합(三合) — 주변의 도움이 따르는 달입니다.'], chung: [-8, '이달의 기운과 띠가 충(沖) — 변동이 많은 달이니 큰 결정은 신중히 하세요.'], none: [0, '이달의 기운과 띠 사이에 특별한 합·충은 없습니다.'] };
  const GOOD = { hap6: '육합 — 약속·계약·고백에 좋은 날', hap3: '삼합 — 협업·모임·부탁에 좋은 날', same: '띠와 같은 날 — 자신감이 오르는 날', none: '흐름이 좋은 날 — 미룬 일을 시작하기 좋습니다', chung: '' };
  const COLORS = ['하늘색', '남색', '흰색', '노란색', '연두색', '보라색', '빨간색', '주황색', '검은색', '회색', '분홍색', '갈색', '금색', '은색', '민트색', '베이지색'];

  /* 월건: 달의 지지는 m%12 (1월 축 … 11월 해, 12월 자). 천간은 연간(입춘 전 1월은 전년)에서 정한다 — 갑기년 병인월 규칙 */
  const monthPillar = (y, m) => { const yy = m === 1 ? y - 1 : y; const ys = ((yy - 4) % 10 + 10) % 10; const b = m % 12; return { stem: ((ys % 5) * 2 + b) % 10, branch: b, yearStem: ys, yearBranch: ((yy - 4) % 12 + 12) % 12 }; };

  HT.register({
    id: 'monthly-fortune', cat: '유용한도구', order: 0.3, original: false, name: '이달의 운세', keywords: '이달의운세 월운 월간운세 다음달 운세 길일 좋은날 월건',
    desc: '생년월일로 이번 달과 다음 달의 월운을 봅니다. 총운과 5개 분야, 주별 흐름, 이달의 좋은 날과 조심할 날(날마다 일진과 띠의 합·충으로 판정), 이달의 키워드와 조언을 보여 줍니다.',
    note: '운세는 재미로 보는 내용입니다. 달의 기운(월건)은 절기 기준 월주를 달력의 달에 맞춘 것이고(9월 = 유월), 좋은 날·조심할 날은 그날 일진의 지지와 띠의 육합·삼합·충 관계에 생년월일로 정해지는 편차를 더해 고릅니다. 같은 사람은 같은 달에 언제 봐도 같은 결과가 나오며, 입력한 정보는 이 브라우저 안에만 저장됩니다.',
    render(root) {
      const S = HT.saju; const saved = S.load();
      const out = HT.output(root, '');
      const now = new Date();
      const f = HT.form(root, [
        { id: 'name', label: '이름 또는 별명 (선택)', type: 'text', value: saved.name || '', placeholder: '예: 지민' },
        ...S.birthFields('birth', '생년월일', { cal: saved.birthCal, value: saved.birth || '1995-06-15', lunar: saved.birthL, leap: saved.birthLeap }),
        { id: 'when', label: '보기', type: 'seg', options: [['this', `이번 달 (${now.getMonth() + 1}월)`], ['next', `다음 달 (${(now.getMonth() + 1) % 12 + 1}월)`]], value: 'this' },
        { id: 'remember', label: '이 브라우저에 이름과 생년월일 기억하기', type: 'check', value: true },
      ], calc, { title: '누구의 운세인가요?', extra: HT.el('div', { class: 'help', style: 'margin-top:4px' }, [HT.el('a', { href: '#/daily-fortune' }, '오늘의 운세'), ' · ', HT.el('a', { href: '#/love-match' }, '궁합 보기')]) });

      function calc(v) {
        const R = S.resolveBirth(v, 'birth');
        if (R.err) { out.set(HT.el('div', { class: 'alert' }, R.err)); return; }
        if (!R.solar) { out.set(HT.el('div', { class: 'empty' }, '생년월일을 입력하세요.')); return; }
        const birth = R.solar, b = S.parse(birth);
        if (v.remember) S.save({ ...S.load(), name: v.name.trim(), birth, birthCal: v.birthCal, birthL: v.birthL, birthLeap: v.birthLeap });
        const name = v.name.trim() ? v.name.trim() + '님' : '당신';
        let y = now.getFullYear(), m = now.getMonth() + 1; if (v.when === 'next') { m += 1; if (m > 12) { m = 1; y += 1; } }
        const ym = `${y}-${String(m).padStart(2, '0')}`; const days = new Date(y, m, 0).getDate();
        const [by, bm, bd] = b; const z = S.zodiacOf(by, bm, bd); const myStem = S.dayPillar(by, bm, bd) % 10; const myE = S.STEM_ELEM[myStem];
        const MP = monthPillar(y, m); const mE = S.STEM_ELEM[MP.stem];
        const mrel = S.relation(z, MP.branch); const [relBonus, relTxt] = MREL[mrel.kind];
        /* 월간 오행 vs 일간 오행 */
        let eBonus = 0, eTxt;
        if (mE === myE) { eBonus = 2; eTxt = `이달은 당신과 같은 ${S.ELEM5[mE]} 기운 — 힘이 붙지만 고집도 세집니다.`; }
        else if ((mE + 1) % 5 === myE) { eBonus = 4; eTxt = `이달의 ${S.ELEM5[mE]} 기운이 당신의 ${S.ELEM5[myE]} 기운을 북돋웁니다. 받는 달이니 기회를 잡으세요.`; }
        else if ((myE + 1) % 5 === mE) { eBonus = 0; eTxt = `당신의 ${S.ELEM5[myE]} 기운이 이달의 ${S.ELEM5[mE]} 기운을 살립니다. 쓰는 만큼 얻는 달이니 무리하지 마세요.`; }
        else if ((mE + 2) % 5 === myE) { eBonus = -4; eTxt = `이달의 ${S.ELEM5[mE]} 기운이 당신의 ${S.ELEM5[myE]} 기운을 누릅니다. 쉬어 가며 지키는 달입니다.`; }
        else { eBonus = 1; eTxt = `당신의 ${S.ELEM5[myE]} 기운이 이달의 ${S.ELEM5[mE]} 기운을 다스립니다. 주도적으로 움직이세요.`; }
        /* 날마다 점수 */
        const dayList = [];
        for (let d = 1; d <= days; d++) { const p = S.dayPillar(y, m, d); const rel = S.relation(z, p % 12); const rd = S.rng(S.hash(birth + '|' + ym + '-' + String(d).padStart(2, '0'))); const score = HT.clamp(Math.round(52 + rel.bonus * 4 + (rd() * 30 - 15)), 5, 99); dayList.push({ d, p, kind: rel.kind, score, dow: '일월화수목금토'[new Date(y, m - 1, d).getDay()] }); }
        const good = [...dayList].filter(x => x.kind !== 'chung').sort((a, b2) => b2.score - a.score).slice(0, 3).sort((a, b2) => a.d - b2.d);
        const bad = [...dayList].sort((a, b2) => a.score - b2.score).slice(0, 3).sort((a, b2) => a.d - b2.d);
        const weeks = []; for (let i = 0; i < days; i += 7) { const w = dayList.slice(i, i + 7); weeks.push({ label: `${i + 1}~${Math.min(i + 7, days)}일`, score: Math.round(w.reduce((a, x) => a + x.score, 0) / w.length) }); }
        const dayAvg = dayList.reduce((a, x) => a + x.score, 0) / days;
        /* 분야·총운 */
        const r = S.rng(S.hash('month|' + birth + '|' + ym));
        const bonus = relBonus + eBonus;
        const scores = CATS.map(() => HT.clamp(Math.round(35 + r() * 45 + r() * 20 + bonus / 2), 5, 99));
        const total = HT.clamp(Math.round(scores.reduce((a, x) => a + x, 0) / 5 * 0.75 + dayAvg * 0.25 + bonus), 5, 99);
        const texts = CATS.map((c, i) => S.pick(r, CAT_TXT[c][S.tier(scores[i])]));
        const open = S.pick(r, OPEN[S.tier(total)]); const advice = S.pick(r, ADVICE); const color = S.pick(r, COLORS);
        const kws = [...KEYWORDS].sort(() => r() - .5).slice(0, 3); const num = 1 + Math.floor(r() * 31);
        const top = scores.indexOf(Math.max(...scores)), low = scores.indexOf(Math.min(...scores));
        const bestW = weeks.reduce((bi, w, i) => w.score > weeks[bi].score ? i : bi, 0);
        const pillar = `${S.STEM[MP.yearStem]}${S.BRANCH[MP.yearBranch]}년 ${S.STEM[MP.stem]}${S.BRANCH[MP.branch]}(${S.STEM_H[MP.stem]}${S.BRANCH_H[MP.branch]})월`;

        const chart = HT.barChart(CATS.map((c, i) => ({ label: c, value: scores[i], color: i === top ? 'var(--brand-key)' : 'var(--g2)' })), { fmt: x => x + '점', padL: 96, cap: `가장 좋은 분야는 ${CATS[top]}, 조심할 분야는 ${CATS[low]}입니다.` });
        const weekChart = HT.barChart(weeks.map((w, i) => ({ label: w.label, value: w.score, color: i === bestW ? 'var(--brand-key)' : 'var(--g2)' })), { fmt: x => x + '점', padL: 96, cap: `흐름이 가장 좋은 때는 ${weeks[bestW].label}입니다. 중요한 일은 이때 잡으세요.` });
        const dayRows = (list, isGood) => HT.rows(list.map(x => [`${m}월 ${x.d}일 (${x.dow})`, HT.badge(isGood ? '좋음' : '주의', isGood ? 'ok' : 'warn'), '', `${S.pillarName(x.p)}일 · ${isGood ? GOOD[x.kind] : (x.kind === 'chung' ? '충 — 다툼·실수 조심, 큰 결정은 미루세요' : '기운이 처지는 날 — 무리하지 말고 일찍 쉬세요')}`]));
        const kwGrid = HT.el('div', { class: 'city-grid' }, [...kws.map((k, i) => [`키워드 ${i + 1}`, k]), ['행운의 색', color], ['행운의 숫자', String(num)]].map(([l, val]) => HT.el('div', { class: 'city' }, [HT.el('div', { class: 'n' }, l), HT.el('div', { class: 't', style: 'font-size:18px' }, val)])));

        const shareText = [`🗓️ ${y}년 ${m}월 ${name}의 이달의 운세`, `총운 ${total}점 ${S.stars(total)} ${open}`, CATS.map((c, i) => `${c.replace('·학업', '').replace('운', '')} ${scores[i]}`).join(' · '), `좋은 날 ${good.map(x => x.d + '일').join('·')} / 조심할 날 ${bad.map(x => x.d + '일').join('·')}`, `키워드 ${kws.join(', ')} / 행운의 색 ${color}`, `한마디: ${advice}`, location.href.split('#')[0] + '#/monthly-fortune'].join('\n');
        const bCopy = HT.el('button', { class: 'btn', type: 'button' }, '결과 복사'), bShare = HT.el('button', { class: 'btn primary', type: 'button' }, '공유하기');
        const copyBox = HT.el('textarea', { class: 'out', readonly: '', style: 'display:none;min-height:150px;margin-top:8px' }); copyBox.value = shareText;
        const showBox = () => { copyBox.style.display = 'block'; copyBox.focus(); copyBox.select(); try { document.execCommand('copy'); } catch (e) {} bCopy.textContent = '아래 글을 길게 눌러 복사하세요'; };
        bCopy.addEventListener('click', () => { if (!navigator.clipboard || !navigator.clipboard.writeText) return showBox(); navigator.clipboard.writeText(shareText).then(() => { bCopy.textContent = '복사됨'; setTimeout(() => bCopy.textContent = '결과 복사', 1500); }).catch(showBox); });
        bShare.addEventListener('click', () => { if (navigator.share) navigator.share({ title: '이달의 운세', text: shareText }).catch(() => {}); else bCopy.click(); });

        out.set(
          HT.el('div', { class: 'crumb' }, `${y}년 ${m}월 · ${name}의 이달의 운세`),
          HT.kpi('이달의 총운', `${total}점`, `<span style="color:var(--brand-deep);letter-spacing:.1em">${S.stars(total)}</span> ${HT.esc(open)}`),
          HT.el('p', { style: 'margin:0 0 6px;font-size:14px' }, `${S.ZODIAC_E[z]} ${S.ZODIAC[z]}띠 · 일간 ${S.STEM[myStem]}(${S.STEM_H[myStem]}) ${S.ELEM5[myE]} · 이달은 ${pillar}`),
          HT.el('p', { style: 'margin:0 0 4px;font-size:13px;color:var(--ink-soft)' }, R.text),
          HT.el('p', { style: 'margin:0 0 4px;font-size:13px;color:var(--ink-soft)' }, relTxt),
          HT.el('p', { style: 'margin:0 0 12px;font-size:13px;color:var(--ink-soft)' }, eTxt),
          chart,
          HT.rows(CATS.map((c, i) => [`${c} ${scores[i]}점`, S.stars(scores[i]), i === top ? 'strong' : '', texts[i]])),
          HT.el('h3', { style: 'margin-top:24px' }, '주별 흐름'), weekChart,
          HT.el('h3', { style: 'margin-top:24px' }, '이달의 좋은 날'), dayRows(good, true),
          HT.el('h3', { style: 'margin-top:24px' }, '이달의 조심할 날'), dayRows(bad, false),
          HT.el('h3', { style: 'margin-top:24px' }, '이달의 키워드'), kwGrid,
          HT.note(HT.esc(advice), '이달의 한마디'),
          HT.el('div', { class: 'btns', style: 'margin-top:16px' }, [bShare, bCopy]), copyBox,
        );
      }
      calc(f.values());
    }
  });
})();
