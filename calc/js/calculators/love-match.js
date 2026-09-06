/* 궁합 보기 — 띠(합·충) · 별자리 4원소 · 일간 오행(상생·상극) 세 기준으로 두 사람의 궁합을 본다. 공통 자료는 daily-fortune.js 의 HT.saju */
(function () {
  'use strict';
  const CATS = ['성격 궁합', '소통', '가치관', '설렘·케미', '오래 갈 힘'];
  const CAT_TXT = {
    '성격 궁합': {
      hi: ['서로의 빈 곳을 채워 주는 조합입니다. 한쪽이 나서면 다른 쪽이 받쳐 줍니다.', '성향이 비슷해 굳이 설명하지 않아도 통합니다. 침묵도 편안한 사이입니다.', '급한 쪽과 느긋한 쪽이 좋은 박자를 만듭니다. 서로의 속도를 존중하면 오래 갑니다.', '같이 있으면 각자의 좋은 면이 더 드러납니다. 주변에서도 잘 어울린다는 말을 자주 듣습니다.'],
      mid: ['비슷한 점과 다른 점이 반반입니다. 다른 점을 흠이 아니라 재미로 보면 잘 맞습니다.', '처음엔 어색해도 시간이 지날수록 편해지는 조합입니다. 서두르지 마세요.', '둘 다 고집이 있는 편이라 부딪힐 때가 있습니다. 먼저 물러서는 쪽이 이깁니다.', '한쪽이 이끌고 한쪽이 따르는 구도가 자연스럽습니다. 역할이 굳어지지 않게 가끔 바꿔 보세요.'],
      lo: ['성향이 많이 다릅니다. 이해하려 애쓰기보다 "그럴 수 있지"로 넘기는 연습이 필요합니다.', '같은 말을 다르게 듣는 사이입니다. 중요한 이야기는 글로 한 번 더 정리하세요.', '서로 끌리지만 부딪히는 지점도 뚜렷합니다. 규칙을 몇 가지 정해 두면 훨씬 편해집니다.', '한쪽이 참는 관계가 되기 쉽습니다. 서운한 건 쌓아 두지 말고 그날 말하세요.'] },
    '소통': {
      hi: ['말이 잘 통합니다. 농담의 결이 비슷해 대화가 끊기지 않습니다.', '한마디만 해도 뜻을 알아듣는 사이입니다. 다만 짐작만 믿지 말고 가끔은 확인하세요.', '싸워도 오래 가지 않습니다. 먼저 말을 거는 쪽이 늘 있기 때문입니다.', '듣는 힘이 좋은 조합입니다. 서로의 이야기에 진심으로 반응합니다.'],
      mid: ['대화는 잘 되지만 깊은 이야기는 미루는 편입니다. 한 달에 한 번은 속 이야기를 나누세요.', '한쪽이 말이 많고 한쪽이 듣는 구도입니다. 듣는 쪽의 말도 끌어내 주세요.', '문자보다 만나서 하는 대화가 훨씬 잘 통합니다. 중요한 말은 얼굴 보고 하세요.', '표현 방식이 달라 오해가 생길 때가 있습니다. "그 말이 이런 뜻이야?"라고 되물어 보세요.'],
      lo: ['같은 상황을 전혀 다르게 해석할 수 있습니다. 결론부터 말하고 이유는 나중에 붙이세요.', '말수가 줄어드는 순간을 조심하세요. 침묵이 길어지면 거리도 길어집니다.', '한쪽의 농담이 다른 쪽에겐 상처가 될 수 있습니다. 놀리는 말은 줄이세요.', '대화가 자주 논쟁으로 흐릅니다. 이기려 하지 말고 "네 말도 맞아"를 먼저 꺼내세요.'] },
    '가치관': {
      hi: ['돈·시간·사람을 대하는 태도가 닮았습니다. 큰 결정에서 부딪힐 일이 적습니다.', '중요하게 여기는 것의 순서가 비슷합니다. 앞날의 계획을 함께 세우기 좋은 조합입니다.', '서로의 꿈을 응원하는 사이입니다. 각자의 길을 가면서도 방향이 같습니다.', '옳고 그름의 기준이 비슷해 신뢰가 빨리 쌓입니다.'],
      mid: ['큰 틀은 같지만 우선순위가 조금 다릅니다. 돈 이야기는 미루지 말고 일찍 맞추세요.', '한쪽은 안정, 한쪽은 도전을 원할 수 있습니다. 반반씩 양보하면 균형이 잡힙니다.', '가족과 일에 대한 생각이 다를 수 있습니다. 상대가 살아온 배경을 이해하려 해 보세요.', '지금은 잘 맞지만 상황이 바뀌면 다른 답이 나올 수 있습니다. 가끔 서로의 계획을 물어보세요.'],
      lo: ['살아온 방식이 많이 다릅니다. 맞추려 하지 말고 다름을 인정하는 것부터 시작하세요.', '돈이나 시간 씀씀이에서 부딪히기 쉽습니다. 규칙을 미리 정해 두면 다툼이 줄어듭니다.', '한쪽은 계획형, 한쪽은 즉흥형입니다. 여행 한 번 같이 가 보면 답이 나옵니다.', '중요한 가치가 엇갈릴 수 있습니다. 양보할 수 없는 것 세 가지만 서로 알려 주세요.'] },
    '설렘·케미': {
      hi: ['첫 만남부터 눈에 띄는 끌림이 있는 조합입니다. 함께 있으면 시간이 빨리 갑니다.', '서로에게 자꾸 눈이 가는 사이입니다. 주변 사람들도 둘 사이의 분위기를 눈치챕니다.', '웃음 코드가 같아 함께 있으면 유쾌합니다. 사진마다 같이 웃고 있습니다.', '설렘이 오래 가는 편입니다. 익숙해져도 새로움을 찾아내는 조합입니다.'],
      mid: ['설렘보다 편안함이 큰 조합입니다. 오래 만날수록 빛이 나는 사이입니다.', '처음엔 잔잔하다가 서서히 끌리는 편입니다. 첫인상만으로 판단하지 마세요.', '함께하는 활동이 있을 때 케미가 살아납니다. 취미를 하나 같이 만들어 보세요.', '한쪽이 더 적극적일 수 있습니다. 다른 쪽도 가끔은 먼저 표현해 주세요.'],
      lo: ['끌림이 은근해서 서로 알아채기까지 시간이 걸립니다. 호감은 말로 표현하세요.', '설렘의 온도차가 있을 수 있습니다. 기대를 맞추는 대화가 필요합니다.', '친구 같은 편안함이 앞서는 조합입니다. 그것도 충분히 좋은 관계입니다.', '자극보다 안정을 주는 사이입니다. 특별한 날을 만들어 새로움을 더하세요.'] },
    '오래 갈 힘': {
      hi: ['시간이 지날수록 단단해지는 조합입니다. 위기가 와도 함께 넘깁니다.', '서로의 가족이나 친구들과도 잘 어울립니다. 관계의 뿌리가 넓습니다.', '싸움 뒤에 더 가까워지는 사이입니다. 화해하는 방법을 이미 알고 있습니다.', '함께 세운 계획을 끝까지 해내는 힘이 있습니다. 오래 볼 인연입니다.'],
      mid: ['평범한 일상을 함께 견디는 힘은 충분합니다. 기념일보다 매일의 안부를 챙기세요.', '권태기가 올 수 있지만 넘길 수 있는 조합입니다. 새로운 장소에 함께 가 보세요.', '한쪽의 노력에 기대는 관계가 되지 않게 하세요. 역할을 나누면 오래 갑니다.', '주변 환경에 흔들릴 수 있습니다. 둘만의 규칙을 정해 두면 든든합니다.'],
      lo: ['좋을 때와 힘들 때의 차이가 큽니다. 힘들 때 어떻게 대하는지가 관계를 정합니다.', '서로에게 기대는 정도가 다릅니다. 각자의 시간을 존중해야 오래 갑니다.', '바깥 사정에 흔들리기 쉬운 조합입니다. 둘 사이의 일은 둘이서만 결정하세요.', '한 번 멀어지면 되돌리기 어려울 수 있습니다. 작은 서운함도 그때그때 풀어 두세요.'] },
  };
  const OPEN = { hi: ['보기 드문 찰떡궁합입니다.', '서로를 위해 태어난 듯한 조합입니다.', '함께 있을 때 가장 빛나는 두 사람입니다.'], mid: ['노력한 만큼 좋아지는 궁합입니다.', '편안하고 무난한 조합입니다.', '천천히 깊어지는 사이입니다.'], lo: ['다름이 많은 만큼 배울 것도 많은 조합입니다.', '쉽지 않지만 그래서 더 애틋할 수 있는 사이입니다.', '서로를 이해하는 데 시간이 필요한 궁합입니다.'] };
  const REL_ADV = {
    lover: { hi: '지금 그대로가 정답입니다. 서로의 좋은 점을 말로 자주 표현해 주세요.', mid: '함께하는 새로운 경험이 관계를 키웁니다. 이번 달에 안 가 본 곳을 한 군데 정하세요.', lo: '차이를 줄이려 하기보다 차이를 다루는 법을 배우는 관계입니다. 대화의 규칙 하나를 정해 보세요.' },
    crush: { hi: '망설일 이유가 없습니다. 먼저 연락하는 쪽이 후회하지 않습니다.', mid: '조금 더 알아 가도 좋은 사이입니다. 둘이서만 만나는 시간을 만들어 보세요.', lo: '천천히 가는 편이 좋습니다. 친구로 시작해도 나쁘지 않은 조합입니다.' },
    friend: { hi: '평생 갈 친구입니다. 바빠도 한 달에 한 번은 얼굴을 보세요.', mid: '편한 친구지만 돈 거래는 피하세요. 관계를 지키는 가장 쉬운 방법입니다.', lo: '각자의 영역을 존중하면 오래 갑니다. 너무 자주 만나지 않는 것도 방법입니다.' },
    coworker: { hi: '함께 일하면 성과가 나는 조합입니다. 같은 일을 맡아 보세요.', mid: '역할을 분명히 나누면 좋은 팀이 됩니다. 일 이야기와 사적인 이야기를 구분하세요.', lo: '일하는 방식이 다릅니다. 기대치를 먼저 맞추고 일을 시작하세요.' },
  };
  const REL_NAME = { lover: '연인', crush: '썸', friend: '친구', coworker: '동료' };
  const TOGETHER = ['동네 산책', '보드게임', '함께 요리하기', '전시회 관람', '당일치기 기차 여행', '카페에서 책 읽기', '운동 같이 하기', '영화 밤새 보기', '시장 구경', '노래방', '등산', '사진 찍으러 다니기', '캠핑', '맛집 찾아다니기', '방 탈출 카페', '봉사 활동'];
  const TODAY = { hi: ['오늘 만나면 웃을 일이 생깁니다.', '오늘은 둘 사이에 좋은 소식이 오갑니다.', '오늘 함께 결정한 일은 잘 풀립니다.'], mid: ['오늘은 가벼운 안부가 딱 좋습니다.', '오늘 만난다면 짧게, 대신 즐겁게.', '오늘은 서로의 하루를 묻는 것만으로 충분합니다.'], lo: ['오늘은 말을 아끼는 편이 좋습니다.', '오늘 다툼이 생기면 내일 이야기하세요.', '오늘은 각자의 시간을 보내도 좋은 날입니다.'] };
  const Z_SCORE = { hap6: 92, hap3: 88, same: 74, chung: 50, none: 64 };
  const Z_TXT = { hap6: '육합(六合) 관계 — 서로를 가장 잘 알아주는 짝으로 꼽힙니다.', hap3: '삼합(三合) 관계 — 같은 편에 서면 힘이 배가 되는 조합입니다.', same: '같은 띠 — 닮은 점이 많아 편하지만, 같은 고집이 부딪힐 수 있습니다.', chung: '충(沖) 관계 — 끌림은 강하지만 부딪힘도 큽니다. 서로의 다름을 다루는 법이 관건입니다.', none: '특별한 합·충 없이 무난하게 어울리는 조합입니다.' };
  /* 별자리 원소 짝: 0 공기 1 물 2 불 3 흙 */
  const E4 = (a, b) => {
    if (a === b) return [84, `같은 ${HT.saju.ELEM4[a]} 원소 — 성향이 닮아 말이 잘 통합니다.`];
    const k = [a, b].sort().join('');
    return { '02': [84, '공기와 불 — 불은 공기가 있어야 타오릅니다. 서로를 북돋우는 짝입니다.'], '13': [84, '물과 흙 — 흙은 물을 품고 물은 흙을 적십니다. 안정적으로 깊어지는 짝입니다.'], '12': [56, '불과 물 — 서로 끄고 끓이는 사이. 끌림은 강하지만 온도차를 조심하세요.'], '03': [58, '공기와 흙 — 속도가 다릅니다. 한쪽은 날고 한쪽은 딛습니다. 박자를 맞추는 연습이 필요합니다.'], '01': [68, '공기와 물 — 생각과 감정의 짝. 서로 배울 점이 많은 조합입니다.'], '23': [68, '불과 흙 — 열정과 현실의 짝. 흙이 불을 받쳐 주면 오래 갑니다.'] }[k];
  };
  /* 조사 이/가 — 마지막 글자의 받침 유무로 고른다 */
  const ga = (w) => { const c = w.charCodeAt(w.length - 1); return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0 ? '이' : '가'); };
  /* 오행: 상생 목→화→토→금→수→목, 상극 목→토→수→화→금→목 */
  const E5 = (ea, eb, A, B) => {
    const S = HT.saju.ELEM5;
    if (ea === eb) return [72, `둘 다 ${S[ea]} 기운 — 닮은꼴(비화)이라 이해가 빠르지만 경쟁이 되기도 합니다.`];
    if ((ea + 1) % 5 === eb) return [88, `${A}의 ${S[ea]} 기운이 ${B}의 ${S[eb]} 기운을 북돋웁니다(상생). ${ga(A)} 주고 ${ga(B)} 받는 흐름이니 균형을 살피세요.`];
    if ((eb + 1) % 5 === ea) return [88, `${B}의 ${S[eb]} 기운이 ${A}의 ${S[ea]} 기운을 북돋웁니다(상생). ${ga(B)} 주고 ${ga(A)} 받는 흐름이니 균형을 살피세요.`];
    if ((ea + 2) % 5 === eb) return [56, `${A}의 ${S[ea]} 기운이 ${B}의 ${S[eb]} 기운을 누릅니다(상극). 끌림이 강한 대신 ${ga(B)} 지치지 않게 배려가 필요합니다.`];
    return [56, `${B}의 ${S[eb]} 기운이 ${A}의 ${S[ea]} 기운을 누릅니다(상극). 끌림이 강한 대신 ${ga(A)} 지치지 않게 배려가 필요합니다.`];
  };

  HT.register({
    id: 'love-match', cat: '유용한도구', order: 0.5, name: '궁합 보기', keywords: '궁합 연애궁합 띠궁합 별자리궁합 커플 사주궁합 오행 상생 상극 친구 동료',
    desc: '두 사람의 생년월일로 띠(합·충), 별자리 4원소, 일간 오행(상생·상극) 세 가지 기준의 궁합을 봅니다. 연인·썸·친구·동료 관계에 맞는 조언과 오늘 둘의 하루도 함께 보여 줍니다.',
    note: '궁합은 재미로 보는 내용입니다. 띠는 입춘(2월 4일) 기준, 별자리 원소는 서양 점성술의 4원소(불·흙·공기·물), 오행은 태어난 날의 천간(일간)을 목·화·토·금·수로 나눈 것입니다. 세 기준의 점수를 분야별로 섞고 두 사람의 생년월일로 정해지는 작은 편차를 더하므로, 같은 두 사람은 언제 봐도 같은 결과가 나옵니다. 입력한 정보는 어디에도 전송되지 않습니다.',
    render(root) {
      const S = HT.saju; const saved = S.load();
      const out = HT.output(root, '');
      const f = HT.form(root, [
        { id: 'nameA', label: '내 이름 (선택)', type: 'text', value: saved.name || '', placeholder: '나' },
        ...S.birthFields('birthA', '내 생년월일', { cal: saved.birthCal, value: saved.birth || '1995-06-15', lunar: saved.birthL, leap: saved.birthLeap }),
        { id: 'nameB', label: '상대 이름 (선택)', type: 'text', value: '', placeholder: '상대' },
        ...S.birthFields('birthB', '상대 생년월일', { value: '1996-10-20' }),
        { id: 'rel', label: '관계', type: 'seg', options: [['lover', '연인'], ['crush', '썸'], ['friend', '친구'], ['coworker', '동료']], value: 'lover' },
      ], calc, { title: '두 사람', extra: HT.el('div', { class: 'help', style: 'margin-top:4px' }, [HT.el('a', { href: '#/daily-fortune' }, '오늘의 운세'), ' · ', HT.el('a', { href: '#/monthly-fortune' }, '이달의 운세')]) });

      function person(birth) {
        const [y, m, d] = S.parse(birth); const p = S.dayPillar(y, m, d);
        return { z: S.zodiacOf(y, m, d), sg: S.signOf(m, d), p, e5: S.STEM_ELEM[p % 10] };
      }
      function calc(v) {
        const RA = S.resolveBirth(v, 'birthA'), RB = S.resolveBirth(v, 'birthB');
        const errs = [RA.err && '나: ' + RA.err, RB.err && '상대: ' + RB.err].filter(Boolean);
        if (errs.length) { out.set(HT.el('div', { class: 'alert' }, errs.join(' / '))); return; }
        if (!RA.solar || !RB.solar) { out.set(HT.el('div', { class: 'empty' }, '두 사람의 생년월일을 모두 입력하세요.')); return; }
        const birthA = RA.solar, birthB = RB.solar;
        const A = v.nameA.trim() || '나', B = v.nameB.trim() || '상대';
        const PA = person(birthA), PB = person(birthB);
        const zr = S.relation(PA.z, PB.z); const zScore = Z_SCORE[zr.kind];
        const [sScore, sTxt] = E4(S.SIGN_ELEM[PA.sg], S.SIGN_ELEM[PB.sg]);
        const [eScore, eTxt] = E5(PA.e5, PB.e5, A, B);
        const pair = [birthA, birthB].sort().join('|'); const r = S.rng(S.hash('match|' + pair));
        const j = () => Math.round(r() * 16 - 8);
        const raw = [zScore * .55 + eScore * .45, sScore * .55 + zScore * .45, eScore * .5 + zScore * .5, sScore * .55 + eScore * .45, zScore * .4 + eScore * .35 + sScore * .25];
        const scores = raw.map(x => HT.clamp(Math.round(x + j()), 20, 99));
        const total = HT.clamp(Math.round(scores.reduce((x, y) => x + y, 0) / scores.length), 20, 99);
        const texts = CATS.map((c, i) => S.pick(r, CAT_TXT[c][S.tier(scores[i])]));
        const open = S.pick(r, OPEN[S.tier(total)]);
        const together = [...TOGETHER].sort(() => r() - .5).slice(0, 3);
        const todayStr = S.ymd(new Date()); const rt = S.rng(S.hash('match-day|' + pair + '|' + todayStr));
        const todayScore = HT.clamp(Math.round(total * .6 + (30 + rt() * 50) * .4), 20, 99); const todayTxt = S.pick(rt, TODAY[S.tier(todayScore)]);
        const top = scores.indexOf(Math.max(...scores)), low = scores.indexOf(Math.min(...scores));

        const who = (P, n, t) => HT.rows([[n, '', '', `${t} · ${S.ZODIAC_E[P.z]} ${S.ZODIAC[P.z]}띠 · ${S.SIGN_E[P.sg]} ${S.SIGN[P.sg]} · 일주 ${S.pillarName(P.p)} · ${S.ELEM5[P.e5]} 기운`]]);
        const kindBadge = (s) => HT.badge(s >= 75 ? '좋음' : s >= 50 ? '보통' : '주의', s >= 75 ? 'ok' : s >= 50 ? 'gray' : 'warn');
        const basis = HT.rows([
          [`띠 궁합 ${zScore}점`, kindBadge(zScore), '', `${S.ZODIAC_E[PA.z]} ${S.ZODIAC[PA.z]}띠 · ${S.ZODIAC_E[PB.z]} ${S.ZODIAC[PB.z]}띠 — ${Z_TXT[zr.kind]}`],
          [`별자리 궁합 ${sScore}점`, kindBadge(sScore), '', `${S.SIGN_E[PA.sg]} ${S.SIGN[PA.sg]}(${S.ELEM4[S.SIGN_ELEM[PA.sg]]}) · ${S.SIGN_E[PB.sg]} ${S.SIGN[PB.sg]}(${S.ELEM4[S.SIGN_ELEM[PB.sg]]}) — ${sTxt}`],
          [`오행 궁합 ${eScore}점`, kindBadge(eScore), '', eTxt],
        ]);
        const chart = HT.barChart(CATS.map((c, i) => ({ label: c, value: scores[i], color: i === top ? 'var(--brand-key)' : 'var(--g2)' })), { fmt: x => x + '점', padL: 96, cap: `가장 잘 맞는 부분은 ${CATS[top]}, 신경 쓸 부분은 ${CATS[low]}입니다.` });
        const togetherGrid = HT.el('div', { class: 'city-grid' }, together.map((t, i) => HT.el('div', { class: 'city' }, [HT.el('div', { class: 'n' }, '추천 ' + (i + 1)), HT.el('div', { class: 't', style: 'font-size:18px' }, t)])));

        const shareText = [`💞 ${A} ♥ ${B} ${REL_NAME[v.rel]} 궁합`, `궁합 ${total}점 ${S.stars(total)} ${open}`, `띠 ${zScore} · 별자리 ${sScore} · 오행 ${eScore}`, CATS.map((c, i) => `${c} ${scores[i]}`).join(' · '), `조언: ${REL_ADV[v.rel][S.tier(total)]}`, location.href.split('#')[0] + '#/love-match'].join('\n');
        const bCopy = HT.el('button', { class: 'btn', type: 'button' }, '결과 복사'), bShare = HT.el('button', { class: 'btn primary', type: 'button' }, '공유하기');
        const copyBox = HT.el('textarea', { class: 'out', readonly: '', style: 'display:none;min-height:150px;margin-top:8px' }); copyBox.value = shareText;
        const showBox = () => { copyBox.style.display = 'block'; copyBox.focus(); copyBox.select(); try { document.execCommand('copy'); } catch (e) {} bCopy.textContent = '아래 글을 길게 눌러 복사하세요'; };
        bCopy.addEventListener('click', () => { if (!navigator.clipboard || !navigator.clipboard.writeText) return showBox(); navigator.clipboard.writeText(shareText).then(() => { bCopy.textContent = '복사됨'; setTimeout(() => bCopy.textContent = '결과 복사', 1500); }).catch(showBox); });
        bShare.addEventListener('click', () => { if (navigator.share) navigator.share({ title: '궁합 보기', text: shareText }).catch(() => {}); else bCopy.click(); });

        out.set(
          HT.el('div', { class: 'crumb' }, `${REL_NAME[v.rel]} 궁합 · ${A} ♥ ${B}`),
          HT.kpi('궁합 점수', `${total}점`, `<span style="color:var(--brand-deep);letter-spacing:.1em">${S.stars(total)}</span> ${HT.esc(open)}`),
          who(PA, A, RA.text), who(PB, B, RB.text),
          HT.el('h3', { style: 'margin-top:24px' }, '세 가지 기준'), basis,
          HT.el('h3', { style: 'margin-top:24px' }, '분야별 궁합'), chart,
          HT.rows(CATS.map((c, i) => [`${c} ${scores[i]}점`, S.stars(scores[i]), i === top ? 'strong' : '', texts[i]])),
          HT.note(HT.esc(REL_ADV[v.rel][S.tier(total)]), `${REL_NAME[v.rel]} 사이에 드리는 조언`),
          HT.el('h3', { style: 'margin-top:24px' }, '함께하면 좋은 것'), togetherGrid,
          HT.el('h3', { style: 'margin-top:24px' }, `${S.fmtDate(new Date())} 오늘 둘의 하루`),
          HT.rows([[`오늘 둘의 하루 ${todayScore}점`, S.stars(todayScore), '', todayTxt]]),
          HT.el('div', { class: 'btns', style: 'margin-top:16px' }, [bShare, bCopy]), copyBox,
        );
      }
      calc(f.values());
    }
  });
})();
