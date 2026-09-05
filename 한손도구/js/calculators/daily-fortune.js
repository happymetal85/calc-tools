/* 오늘의 운세 — 띠·별자리·일진 공통 자료는 HT.saju 로 내보내 궁합(love-match.js)에서도 쓴다. */
(function () {
  'use strict';
  /* ---------- 공통 자료 ---------- */
  const STEM = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'], STEM_H = '甲乙丙丁戊己庚辛壬癸';
  const BRANCH = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'], BRANCH_H = '子丑寅卯辰巳午未申酉戌亥';
  const ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  const ZODIAC_E = ['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'];
  const ZODIAC_T = ['눈치가 빠르고 위기에 강합니다.', '묵묵히 끝까지 해내는 뚝심이 있습니다.', '추진력과 당당함으로 앞장섭니다.', '온화하고 섬세해 사람을 편하게 합니다.', '큰 그림을 그리고 남을 이끕니다.', '직관이 깊고 판단이 냉철합니다.', '활동적이고 자유로우며 낙천적입니다.', '다정하고 예술 감각이 뛰어납니다.', '재치와 응용력이 남다릅니다.', '꼼꼼하고 책임감이 강합니다.', '의리 있고 정직해 신뢰를 얻습니다.', '너그럽고 복이 많은 성품입니다.'];
  const SIGN = ['물병자리', '물고기자리', '양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '사수자리', '염소자리'];
  const SIGN_E = ['♒', '♓', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑'];
  const SIGN_START = [[1, 20], [2, 19], [3, 21], [4, 20], [5, 21], [6, 22], [7, 23], [8, 23], [9, 23], [10, 24], [11, 23], [12, 25]];
  const SIGN_T = ['독창적이고 자유로운 생각', '풍부한 감수성과 공감 능력', '도전적이고 솔직한 성격', '끈기 있고 현실적인 태도', '호기심과 말재주', '깊은 정과 가정적인 마음', '당당한 존재감', '분석력과 완벽을 향한 눈', '균형 감각과 사교성', '집중력과 깊은 열정', '낙천성과 모험심', '성실함과 뚜렷한 목표'];
  /* 별자리 4원소: 0 공기 1 물 2 불 3 흙 (물병·쌍둥이·천칭 공기 / 물고기·게·전갈 물 / 양·사자·사수 불 / 황소·처녀·염소 흙) */
  const SIGN_ELEM = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3], ELEM4 = ['공기', '물', '불', '흙'];
  /* 천간 오행: 0 목 1 화 2 토 3 금 4 수 */
  const STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4], ELEM5 = ['목(나무)', '화(불)', '토(흙)', '금(쇠)', '수(물)'];
  const HAP6 = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]], HAP3 = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];

  /* ---------- 난수 (같은 입력 → 같은 결과) ---------- */
  const hash = (s) => { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h1 ^ h2) >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const tier = (s) => s >= 75 ? 'hi' : s >= 50 ? 'mid' : 'lo';
  const stars = (s) => { const n = HT.clamp(Math.round(s / 20), 1, 5); return '★'.repeat(n) + '☆'.repeat(5 - n); };

  /* ---------- 날짜·띠·별자리·일진 ---------- */
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parse = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null; };
  const zodiacOf = (y, m, d) => (((m < 2 || (m === 2 && d < 4) ? y - 1 : y) - 4) % 12 + 12) % 12;
  const signOf = (m, d) => { let i = 11; SIGN_START.forEach(([sm, sd], k) => { if (m > sm || (m === sm && d >= sd)) i = k; }); return i; };
  const dayPillar = (y, m, d) => { const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 864e5); return ((54 + days) % 60 + 60) % 60; };
  const pillarName = (p) => `${STEM[p % 10]}${BRANCH[p % 12]}(${STEM_H[p % 10]}${BRANCH_H[p % 12]})`;
  const relation = (z, b) => { // 두 지지의 관계
    if (z === b) return { kind: 'same', bonus: 3, txt: '같은 기운이 겹쳐 힘이 나는 날' };
    if (HAP6.some(([a, c]) => (a === z && c === b) || (a === b && c === z))) return { kind: 'hap6', bonus: 6, txt: '육합(六合)이 드는 날 · 뜻이 잘 맞고 일이 순조롭습니다' };
    if (HAP3.some(g => g.includes(z) && g.includes(b))) return { kind: 'hap3', bonus: 4, txt: '삼합(三合)이 드는 날 · 주변의 도움이 따릅니다' };
    if ((z + 6) % 12 === b) return { kind: 'chung', bonus: -6, txt: '충(沖)이 드는 날 · 서두르면 어긋나기 쉬우니 한 박자 늦추세요' };
    return { kind: 'none', bonus: 0, txt: '' };
  };
  const fmtDate = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`;
  const KEY = 'ht_fortune';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };

  /* ---------- 생년월일 입력 (양력/음력 전환 + 윤달) ----------
     birthFields(id, label, { cal, value, lunar, leap }) → HT.form 필드 4개 (id+'Cal', id, id+'L', id+'Leap')
     resolveBirth(values, id) → { solar: 'YYYY-MM-DD'|null, lunar, err, text } */
  const birthFields = (id, label, o = {}) => [
    { id: id + 'Cal', label: label + ' 기준', type: 'seg', options: [['solar', '양력'], ['lunar', '음력']], value: o.cal === 'lunar' ? 'lunar' : 'solar' },
    { id, label: label + ' (양력)', type: 'date', value: o.value || '', min: '1900-02-01', max: o.max || ymd(new Date()), show: v => v[id + 'Cal'] !== 'lunar' },
    { id: id + 'L', label: label + ' (음력)', type: 'text', value: o.lunar || '', placeholder: '예: 1990-02-05', help: '연-월-일 순서로 적습니다. 표 범위 1900~2049년', show: v => v[id + 'Cal'] === 'lunar' },
    { id: id + 'Leap', label: '윤달 생일', type: 'check', value: !!o.leap, show: v => v[id + 'Cal'] === 'lunar' },
  ];
  const resolveBirth = (v, id) => {
    const L = HT.lunar;
    if (v[id + 'Cal'] !== 'lunar') {
      const raw = v[id]; const b = parse(raw); if (!b) return { solar: null, lunar: null, err: null, text: '' };
      if (b[0] < 1900) return { solar: null, lunar: null, err: '1900년 이후 생년월일만 지원합니다.', text: '' };
      const l = L ? L.toLunar(b[0], b[1], b[2]) : null;
      return { solar: raw, lunar: l, err: null, text: `양력 ${b[0]}년 ${b[1]}월 ${b[2]}일${l ? ' = ' + L.fmt(l) : ''}` };
    }
    const raw = (v[id + 'L'] || '').trim(); const m = /(\d{4})\D+(\d{1,2})\D+(\d{1,2})/.exec(raw);
    if (!m) return { solar: null, lunar: null, err: raw ? '음력 생일은 "1990-02-05"처럼 연-월-일로 적어 주세요.' : null, text: '' };
    if (!L) return { solar: null, lunar: null, err: '음력 표를 불러오지 못했습니다.', text: '' };
    const ly = +m[1], lm = +m[2], ld = +m[3], leap = !!v[id + 'Leap'];
    if (ly < L.minYear || ly > L.maxYear) return { solar: null, lunar: null, err: `음력 표 범위(${L.minYear}~${L.maxYear}년) 밖입니다.`, text: '' };
    if (lm < 1 || lm > 12 || ld < 1 || ld > 30) return { solar: null, lunar: null, err: '음력 월은 1~12, 일은 1~30이어야 합니다.', text: '' };
    if (leap && L.leapMonthOf(ly) !== lm) { const w = L.leapMonthOf(ly); return { solar: null, lunar: null, err: w ? `${ly}년의 윤달은 윤${w}월뿐입니다.` : `${ly}년에는 윤달이 없습니다.`, text: '' }; }
    const s = L.fromLunar(ly, lm, leap, ld); if (!s) return { solar: null, lunar: null, err: `음력 ${ly}년 ${leap ? '윤' : ''}${lm}월은 29일까지라 ${ld}일이 없습니다.`, text: '' };
    const sb = parse(s);
    return { solar: s, lunar: { ly, lm, leap, ld }, err: null, text: `음력 ${ly}년 ${leap ? '윤' : ''}${lm}월 ${ld}일 = 양력 ${sb[0]}년 ${sb[1]}월 ${sb[2]}일` };
  };

  HT.saju = { STEM, STEM_H, BRANCH, BRANCH_H, ZODIAC, ZODIAC_E, ZODIAC_T, SIGN, SIGN_E, SIGN_T, SIGN_ELEM, ELEM4, STEM_ELEM, ELEM5, hash, rng, pick, tier, stars, ymd, parse, zodiacOf, signOf, dayPillar, pillarName, relation, fmtDate, load, save, birthFields, resolveBirth };

  /* ---------- 운세 문장 ---------- */
  const CATS = ['금전운', '애정운', '직장·학업운', '건강운', '대인관계운'];
  const CAT_TXT = {
    '금전운': {
      hi: ['뜻밖의 수입이나 잊고 있던 돈이 돌아올 수 있는 날입니다. 작은 지출은 아끼지 않아도 좋습니다.', '금전 흐름이 순조롭습니다. 미뤄 둔 계약이나 협상은 오늘 마무리하면 유리합니다.', '돈이 들어오는 길이 열립니다. 다만 들어온 만큼 나가기 쉬우니 저축 계좌를 먼저 채우세요.', '투자한 것에서 좋은 소식이 들릴 수 있습니다. 욕심을 더 내기보다 수익을 챙기는 편이 낫습니다.', '주머니가 든든해지는 날입니다. 오래 갖고 싶던 물건이 있다면 오늘 값을 비교해 보세요.', '재물운이 오르는 중입니다. 들어오는 제안은 조건을 꼼꼼히 보되 긍정적으로 검토하세요.'],
      mid: ['큰 변동은 없습니다. 계획한 대로 쓰고, 계획에 없던 지출은 하루만 미루세요.', '들어오는 돈과 나가는 돈이 비슷합니다. 가계부를 한 번 정리하면 새는 곳이 보입니다.', '충동구매 유혹이 살짝 있습니다. 장바구니에 담아 두고 내일 다시 보면 대부분 사라집니다.', '소소한 지출이 이어질 수 있습니다. 커피 한 잔 줄이는 정도로 충분히 균형이 맞습니다.', '금전운은 평온합니다. 오늘은 벌기보다 지키는 데 집중하기 좋은 날입니다.', '돈 문제로 남과 얽히는 일은 피하세요. 빌려주는 것도 빌리는 것도 오늘은 보류가 답입니다.'],
      lo: ['예상하지 못한 지출이 생길 수 있습니다. 카드보다 현금으로, 큰 결제는 내일로 미루세요.', '귀가 얇아지는 날입니다. "오늘만 특가"라는 말에 지갑을 열지 마세요.', '돈이 새기 쉬운 하루입니다. 자동이체와 구독 내역을 한 번 살펴보면 손실을 막습니다.', '투자 결정을 서두르면 후회할 수 있습니다. 오늘은 지켜보기만 해도 충분합니다.', '누군가의 부탁으로 돈이 나갈 수 있습니다. 거절이 어렵다면 금액을 절반으로 줄이세요.', '계산 실수나 누락이 생기기 쉽습니다. 영수증과 잔액을 저녁에 꼭 맞춰 보세요.'] },
    '애정운': {
      hi: ['마음이 통하는 날입니다. 연인에게는 먼저 연락하고, 혼자라면 모임에 나가 보세요.', '호감이 오가는 기운이 강합니다. 평소보다 밝은 색 옷이 상대의 눈길을 끕니다.', '오래 품었던 말을 꺼내기 좋은 날입니다. 진심은 오늘 특히 잘 전해집니다.', '관계가 한 단계 깊어질 수 있습니다. 상대의 이야기를 끝까지 들어 주는 것만으로 충분합니다.', '새로운 인연이 가까이 있습니다. 익숙한 길 대신 다른 길로 가 보세요.', '다툼이 있었다면 오늘 풀립니다. 먼저 손을 내밀면 관계가 더 단단해집니다.'],
      mid: ['잔잔한 하루입니다. 특별한 선물보다 짧은 안부 한마디가 더 큰 힘이 됩니다.', '상대의 말을 곧이곧대로 받아들이세요. 숨은 뜻을 찾으려다 오해가 생길 수 있습니다.', '혼자만의 시간이 관계에 도움이 되는 날입니다. 서로의 공간을 존중하세요.', '설렘보다 편안함이 앞서는 날입니다. 익숙한 사람과의 시간이 마음을 채웁니다.', '기대를 조금 낮추면 만족이 커집니다. 있는 그대로의 상대를 봐 주세요.', '썸이 있다면 서두르지 마세요. 오늘은 한 걸음 물러나야 상대가 다가옵니다.'],
      lo: ['말 한마디가 오해를 부를 수 있습니다. 문자보다 목소리로, 목소리보다 얼굴을 보고 이야기하세요.', '감정 기복이 있는 날입니다. 서운한 일이 있어도 오늘은 결론을 내리지 마세요.', '지난 인연이 떠오를 수 있습니다. 연락하기 전에 하루만 더 생각해 보세요.', '질투나 의심이 스치는 날입니다. 상대를 추궁하기보다 내 마음을 먼저 들여다보세요.', '약속이 어긋나기 쉽습니다. 시간과 장소를 한 번 더 확인하면 다툼을 막습니다.', '혼자라면 오늘은 나를 돌보는 날로 쓰세요. 좋은 인연은 내가 괜찮을 때 찾아옵니다.'] },
    '직장·학업운': {
      hi: ['집중력이 최고조입니다. 미뤄 둔 어려운 일을 오전에 끝내면 하루가 가볍습니다.', '노력이 인정받는 날입니다. 보고나 발표가 있다면 자신 있게 나서세요.', '좋은 생각이 샘솟습니다. 떠오르는 생각을 바로 적어 두면 나중에 큰 자산이 됩니다.', '협업이 잘 풀리는 날입니다. 도움을 요청하면 생각보다 흔쾌한 답이 돌아옵니다.', '시험이나 면접이 있다면 준비한 만큼 나옵니다. 마지막까지 기본을 다시 보세요.', '윗사람의 눈에 띄는 날입니다. 작은 일도 마무리를 깔끔하게 하면 신뢰가 쌓입니다.'],
      mid: ['무난한 하루입니다. 새 일을 벌이기보다 하던 일을 정리하는 데 알맞습니다.', '사소한 실수가 있을 수 있습니다. 보내기 전에 한 번 더 읽으면 대부분 걸러집니다.', '능률이 오후에 오릅니다. 오전은 단순한 일, 오후는 머리 쓰는 일로 나누세요.', '회의나 수업에서 말수를 줄이고 들어 보세요. 뜻밖의 힌트를 얻습니다.', '늘 하던 순서가 힘이 되는 날입니다. 익숙한 방식대로 하면 안정적으로 마무리됩니다.', '동료와의 의견 차이는 오늘 굳이 좁히려 하지 마세요. 내일이면 저절로 정리됩니다.'],
      lo: ['집중이 흐트러지기 쉽습니다. 알림을 끄고 25분씩 끊어서 일하면 나아집니다.', '말실수를 조심하세요. 특히 뒷말이나 농담은 오늘 오해를 부르기 쉽습니다.', '일이 자꾸 밀리는 느낌이 들 수 있습니다. 할 일을 셋으로 줄이고 하나씩 지우세요.', '중요한 결정은 내일로 미루세요. 오늘 내린 판단은 다시 보면 아쉬울 수 있습니다.', '상사나 선생님의 지적이 있을 수 있습니다. 변명보다 "알겠습니다" 한마디가 낫습니다.', '문서나 파일을 잃어버리기 쉬운 날입니다. 저장 버튼을 두 번 누르세요.'] },
    '건강운': {
      hi: ['몸이 가볍고 활력이 넘칩니다. 미뤄 둔 운동을 시작하기에 더없이 좋은 날입니다.', '몸 상태가 좋습니다. 오늘의 기운을 내일까지 이어가려면 밤 12시 전에 잠드세요.', '회복력이 높은 날입니다. 오래된 통증이 있다면 오늘 병원에 가면 좋은 답을 듣습니다.', '식욕이 살아납니다. 좋아하는 음식을 즐기되 채소를 한 접시 더 곁들이세요.', '햇볕이 보약이 되는 날입니다. 점심 뒤 10분만 걸어도 오후가 달라집니다.', '마음이 편안해 몸도 따라 좋아집니다. 오늘 밤은 깊은 잠이 예상됩니다.'],
      mid: ['큰 문제는 없지만 어깨와 목이 뻐근할 수 있습니다. 한 시간마다 기지개를 켜세요.', '물을 평소보다 두 잔 더 마시세요. 두통과 피로 대부분이 거기서 옵니다.', '소화가 조금 더딜 수 있습니다. 저녁은 가볍게, 야식은 건너뛰세요.', '눈이 쉽게 피로해지는 날입니다. 화면을 20분 볼 때마다 먼 곳을 20초 바라보세요.', '체력은 보통입니다. 무리한 운동보다 가벼운 몸풀기가 몸에 맞는 하루입니다.', '기분이 몸을 좌우하는 날입니다. 좋아하는 음악 한 곡이 약보다 낫습니다.'],
      lo: ['면역이 살짝 떨어지는 날입니다. 손을 자주 씻고 찬 음식은 피하세요.', '피로가 쌓여 있습니다. 오늘은 일정 하나를 빼고 일찍 쉬세요.', '잔부상을 조심하세요. 계단과 젖은 바닥, 운전 중 급정거에 특히 주의가 필요합니다.', '속이 예민해질 수 있습니다. 커피와 매운 음식은 오늘만 쉬어 가세요.', '잠이 부족하면 하루가 무너집니다. 낮잠 15분이 커피보다 낫습니다.', '몸이 보내는 신호를 무시하지 마세요. 이상한 느낌이 들면 미루지 말고 확인하세요.'] },
    '대인관계운': {
      hi: ['사람 덕을 보는 날입니다. 오랜만의 연락이나 초대는 거절하지 마세요.', '말에 힘이 실립니다. 부탁이나 제안은 오늘 하면 이루어질 가능성이 높습니다.', '귀인이 가까이 있습니다. 평소 무심히 지나치던 사람에게 인사를 건네 보세요.', '모임에서 중심이 되는 날입니다. 분위기를 이끌되 남의 말도 챙겨 들으세요.', '오해가 풀리고 관계가 회복됩니다. 먼저 연락하는 쪽이 이깁니다.', '새 사람과의 만남에서 좋은 인상을 남깁니다. 명함이나 연락처를 챙기세요.'],
      mid: ['평온한 관계운입니다. 깊은 대화보다 가벼운 안부가 어울리는 날입니다.', '남의 일에 끼어들지 마세요. 중재하려다 양쪽 모두에게 서운함을 살 수 있습니다.', '약속은 지키되 새 약속은 만들지 마세요. 일정이 겹쳐 곤란해질 수 있습니다.', '듣는 역할이 잘 어울리는 날입니다. 조언보다 공감이 상대를 움직입니다.', '가족과의 시간이 마음을 채웁니다. 짧은 전화 한 통이면 충분합니다.', 'SNS와 거리를 두면 마음이 편해집니다. 오늘은 남과 비교하지 않는 날로 정하세요.'],
      lo: ['말이 와전되기 쉬운 날입니다. 남의 이야기는 듣기만 하고 옮기지 마세요.', '사소한 일로 감정이 상할 수 있습니다. 상대의 의도를 먼저 좋게 해석해 보세요.', '부탁을 받으면 바로 답하지 말고 하루 생각할 시간을 두세요.', '모임에서는 한발 물러서세요. 오늘은 조용히 있는 편이 평판에 이롭습니다.', '오래된 갈등이 다시 드러날 수 있습니다. 정면으로 맞서기보다 시간을 두세요.', '약속 취소나 연락 두절에 마음 쓰지 마세요. 상대의 사정이지 당신 탓이 아닙니다.'] },
  };
  const OPEN = {
    hi: ['기운이 활짝 열린 날입니다.', '오늘은 당신의 날입니다.', '하늘이 돕는 하루입니다.', '막혔던 길이 뚫리는 날입니다.', '무엇을 해도 술술 풀리는 날입니다.', '준비한 사람에게 기회가 오는 날입니다.'],
    mid: ['무난하고 안정적인 하루입니다.', '잔잔한 물결 같은 날입니다.', '큰 기복 없이 흘러가는 하루입니다.', '평범함이 오히려 복이 되는 날입니다.', '조금만 신경 쓰면 좋은 하루가 됩니다.', '하던 대로가 정답인 날입니다.'],
    lo: ['한 박자 쉬어 가야 하는 날입니다.', '몸을 낮추고 때를 기다리는 날입니다.', '돌다리도 두드려 건너야 하는 하루입니다.', '작은 것을 지키는 데 집중할 날입니다.', '오늘의 조심이 내일의 복이 됩니다.', '서두르지 않는 사람이 이기는 날입니다.'],
  };
  const ADVICE = ['급할수록 돌아가세요. 오늘의 지름길은 대개 막다른 길입니다.', '말은 반으로, 귀는 두 배로.', '지금 하기 싫은 그 일이 오늘 가장 먼저 할 일입니다.', '웃는 얼굴이 오늘의 부적입니다.', '비교는 어제의 나와만 하세요.', '받은 친절을 오늘 한 번 돌려주세요. 두 배가 되어 돌아옵니다.', '10분 일찍 나서면 하루가 30분 길어집니다.', '오늘 정리한 책상이 내일의 집중력입니다.', '"괜찮아"라는 말을 자신에게 먼저 해 주세요.', '처음 든 생각을 믿으세요. 두 번째 생각은 대개 두려움입니다.', '작은 약속을 지키는 사람에게 큰 기회가 옵니다.', '오늘 만나는 사람 중 한 명이 답을 가지고 있습니다.', '쓰지 않은 돈이 오늘의 수익입니다.', '완벽보다 완료. 일단 끝내면 고칠 수 있습니다.', '고마운 사람에게 지금 문자 한 통 보내세요.', '오늘 걷는 한 걸음이 내일의 방향을 정합니다.', '거절도 대답입니다. 미루는 것보다 낫습니다.', '오늘의 실수는 내일의 이야깃거리입니다. 가볍게 넘기세요.'];
  const SIGN_ADV = ['세부보다 큰 그림을 먼저 보세요.', '직감이 맞는 날입니다. 믿고 움직이세요.', '말보다 행동이 먼저인 날입니다.', '천천히 가도 늦지 않습니다.', '궁금한 것을 오늘 물어보세요.', '집이 가장 좋은 충전소입니다.', '칭찬 한마디를 아끼지 마세요.', '80점에서 멈춰도 충분합니다.', '한쪽 편을 들지 마세요.', '마음에 담아 둔 말을 꺼내세요.', '새 길로 퇴근해 보세요.', '오늘의 계획표가 내일의 성적표입니다.'];
  const RANK_TXT = { hi: ['귀인이 돕는 날', '뜻대로 풀리는 날', '웃을 일이 생기는 날', '먼저 나서면 얻는 날'], mid: ['평온하게 흐르는 날', '하던 대로가 정답인 날', '조금만 신경 쓰면 좋은 날', '듣는 사람이 이기는 날'], lo: ['말을 아껴야 하는 날', '돌다리를 두드릴 날', '일찍 쉬는 게 남는 날', '결정을 미루면 좋은 날'] };
  const COLORS = ['하늘색', '남색', '흰색', '노란색', '연두색', '보라색', '빨간색', '주황색', '검은색', '회색', '분홍색', '갈색', '금색', '은색', '민트색', '베이지색'];
  const DIRS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '동북쪽', '서남쪽', '서북쪽'];
  const TIMES = ['오전 5~7시', '오전 7~9시', '오전 9~11시', '오전 11시~오후 1시', '오후 1~3시', '오후 3~5시', '오후 5~7시', '오후 7~9시', '오후 9~11시'];
  const ITEMS = ['손수건', '볼펜', '우산', '동전', '책', '이어폰', '손목시계', '머리끈', '향수', '텀블러', '열쇠고리', '작은 화분', '편지', '사진', '모자', '스카프', '안경', '껌', '메모지', '에코백'];
  const FOODS = ['두부', '달걀', '사과', '김밥', '커피', '녹차', '국수', '떡', '귤', '초콜릿', '미역국', '견과류', '요구르트', '바나나', '고구마', '샌드위치'];

  HT.register({
    id: 'daily-fortune', cat: '유용한도구', order: 0, original: false, name: '오늘의 운세', keywords: '운세 오늘의운세 내일운세 띠별운세 별자리운세 행운 일진 사주 총운 금전운 애정운',
    desc: '생년월일을 넣으면 오늘과 내일의 총운과 금전·애정·직장·건강·대인관계 운세, 행운의 숫자·색·방향, 띠별 순위를 보여 줍니다. 결과는 생년월일과 날짜로 정해져 같은 날에는 같은 결과가 나오고, 날이 바뀌면 새로 바뀝니다.',
    note: '운세는 재미로 보는 내용이며 어떤 결정의 근거로 삼지 않기를 권합니다. 띠는 입춘(2월 4일)을 기준으로 나누고, 일진(日辰)은 60갑자를 날짜에 차례로 배당한 것입니다(2000년 1월 1일 = 무오일). 점수는 생년월일·날짜·띠와 일진의 합(合)·충(沖) 관계로 정해지며, 입력한 이름과 생년월일은 이 브라우저 안에만 저장됩니다.',
    render(root) {
      const saved = load();
      const streakUpdate = (today) => { // 연속 확인 일수 (오늘 운세를 볼 때만)
        const s = load(); if (s.last === today) return s.streak || 1;
        const y = new Date(today); y.setDate(y.getDate() - 1);
        const streak = s.last === ymd(y) ? (s.streak || 1) + 1 : 1; save({ ...s, last: today, streak }); return streak;
      };
      const out = HT.output(root, '');
      const f = HT.form(root, [
        { id: 'name', label: '이름 또는 별명 (선택)', type: 'text', value: saved.name || '', placeholder: '예: 지민' },
        ...birthFields('birth', '생년월일', { cal: saved.birthCal, value: saved.birth || '1995-06-15', lunar: saved.birthL, leap: saved.birthLeap }),
        { id: 'when', label: '보기', type: 'seg', options: [['today', '오늘'], ['tomorrow', '내일']], value: 'today' },
        { id: 'remember', label: '이 브라우저에 이름과 생년월일 기억하기', type: 'check', value: true },
      ], calc, { title: '누구의 운세인가요?', extra: HT.el('div', { class: 'help', style: 'margin-top:4px' }, [HT.el('a', { href: '#/monthly-fortune' }, '이달의 운세'), ' · ', HT.el('a', { href: '#/love-match' }, '두 사람의 궁합 보기')]) });

      function fortune(birth, dateStr, zodiacScore) {
        const [by, bm, bd] = parse(birth), [y, m, d] = parse(dateStr);
        const z = zodiacOf(by, bm, bd), sg = signOf(bm, bd), dp = dayPillar(y, m, d), db = dp % 12;
        const rel = relation(z, db);
        const r = rng(hash(birth + '|' + dateStr));
        const cats = CATS.map(() => Math.round(35 + r() * 45 + r() * 20));
        const base = cats.reduce((a, b) => a + b, 0) / cats.length;
        const total = HT.clamp(Math.round(base * 0.7 + zodiacScore * 0.3 + rel.bonus), 5, 99);
        const scores = cats.map(s => HT.clamp(s + Math.round(rel.bonus / 2), 5, 99));
        const texts = CATS.map((c, i) => pick(r, CAT_TXT[c][tier(scores[i])]));
        const n1 = 1 + Math.floor(r() * 45); let n2 = 1 + Math.floor(r() * 45); if (n2 === n1) n2 = n2 % 45 + 1;
        return { z, sg, dp, db, rel, total, scores, texts, open: pick(r, OPEN[tier(total)]), advice: pick(r, ADVICE), signAdv: pick(r, SIGN_ADV),
          lucky: { num: [n1, n2].sort((a, b) => a - b).join(', '), color: pick(r, COLORS), dir: pick(r, DIRS), time: pick(r, TIMES), item: pick(r, ITEMS), food: pick(r, FOODS) } };
      }
      function zodiacRank(dateStr) { // 오늘의 띠별 점수 12개
        const [y, m, d] = parse(dateStr), db = dayPillar(y, m, d) % 12;
        return ZODIAC.map((name, i) => { const r = rng(hash('zodiac|' + dateStr + '|' + i)); const rel = relation(i, db); const score = HT.clamp(Math.round(40 + r() * 40 + r() * 20 + rel.bonus), 5, 99); return { i, name, score, txt: pick(r, RANK_TXT[tier(score)]) }; }).sort((a, b) => b.score - a.score);
      }

      function calc(v) {
        const R = resolveBirth(v, 'birth');
        if (R.err) { out.set(HT.el('div', { class: 'alert' }, R.err)); return; }
        if (!R.solar) { out.set(HT.el('div', { class: 'empty' }, '생년월일을 입력하세요.')); return; }
        const birth = R.solar, b = parse(birth);
        if (v.remember) save({ ...load(), name: v.name.trim(), birth, birthCal: v.birthCal, birthL: v.birthL, birthLeap: v.birthLeap }); else { const s = load(); ['name', 'birth', 'birthCal', 'birthL', 'birthLeap'].forEach(k => delete s[k]); save(s); }
        const today = new Date(); const date = new Date(today); if (v.when === 'tomorrow') date.setDate(date.getDate() + 1);
        const dateStr = ymd(date), isToday = v.when === 'today';
        const rank = zodiacRank(dateStr);
        const [by, bm, bd] = b; const myZ = zodiacOf(by, bm, bd);
        const F = fortune(birth, dateStr, rank.find(x => x.i === myZ).score);
        const name = v.name.trim() ? v.name.trim() + '님' : '당신';
        const streak = isToday ? streakUpdate(ymd(today)) : 0;
        const who = `${ZODIAC_E[F.z]} ${ZODIAC[F.z]}띠 · ${SIGN_E[F.sg]} ${SIGN[F.sg]} · ${pillarName(F.dp)}일`;

        const top = F.scores.indexOf(Math.max(...F.scores)), low = F.scores.indexOf(Math.min(...F.scores));
        const chart = HT.barChart(CATS.map((c, i) => ({ label: c, value: F.scores[i], color: i === top ? 'var(--brand-key)' : 'var(--g2)' })), { fmt: v => v + '점', padL: 96, cap: `가장 좋은 분야는 ${CATS[top]}, 조심할 분야는 ${CATS[low]}입니다.` });
        const luckyGrid = HT.el('div', { class: 'city-grid' }, [['행운의 숫자', F.lucky.num], ['행운의 색', F.lucky.color], ['행운의 방향', F.lucky.dir], ['행운의 시간', F.lucky.time], ['행운의 물건', F.lucky.item], ['행운의 음식', F.lucky.food]].map(([l, val]) => HT.el('div', { class: 'city' }, [HT.el('div', { class: 'n' }, l), HT.el('div', { class: 't', style: 'font-size:18px' }, val)])));

        const shareText = [`🔮 ${fmtDate(date)} ${name}의 ${isToday ? '오늘' : '내일'} 운세`, `총운 ${F.total}점 ${stars(F.total)} ${F.open}`, CATS.map((c, i) => `${c.replace('·학업', '').replace('운', '')} ${F.scores[i]}`).join(' · '), `행운의 숫자 ${F.lucky.num} / 색 ${F.lucky.color} / 방향 ${F.lucky.dir}`, `한마디: ${F.advice}`, location.href.split('#')[0] + '#/daily-fortune'].join('\n');
        const bCopy = HT.el('button', { class: 'btn', type: 'button' }, '결과 복사'), bShare = HT.el('button', { class: 'btn primary', type: 'button' }, '공유하기');
        const copyBox = HT.el('textarea', { class: 'out', readonly: '', style: 'display:none;min-height:150px;margin-top:8px' }); copyBox.value = shareText;
        const showBox = () => { copyBox.style.display = 'block'; copyBox.focus(); copyBox.select(); try { document.execCommand('copy'); } catch (e) {} bCopy.textContent = '아래 글을 길게 눌러 복사하세요'; };
        bCopy.addEventListener('click', () => { if (!navigator.clipboard || !navigator.clipboard.writeText) return showBox(); navigator.clipboard.writeText(shareText).then(() => { bCopy.textContent = '복사됨'; setTimeout(() => bCopy.textContent = '결과 복사', 1500); }).catch(showBox); });
        bShare.addEventListener('click', () => { if (navigator.share) navigator.share({ title: '오늘의 운세', text: shareText }).catch(() => {}); else bCopy.click(); });

        out.set(
          HT.el('div', { class: 'crumb' }, [`${fmtDate(date)} · ${name}의 ${isToday ? '오늘' : '내일'} 운세`, streak > 1 ? HT.el('span', { class: 'badge gray', style: 'margin-left:8px' }, `연속 ${streak}일째 확인`) : null]),
          HT.kpi('총운', `${F.total}점`, `<span style="color:var(--brand-deep);letter-spacing:.1em">${stars(F.total)}</span> ${HT.esc(F.open)}`),
          HT.el('p', { style: 'margin:0 0 6px;font-size:14px' }, who),
          HT.el('p', { style: 'margin:0 0 6px;font-size:13px;color:var(--ink-soft)' }, R.text),
          HT.el('p', { style: 'margin:0 0 12px;font-size:13px;color:var(--ink-soft)' }, F.rel.txt || '오늘 일진과 띠 사이에 특별한 합·충은 없습니다.'),
          chart,
          HT.rows(CATS.map((c, i) => [`${c} ${F.scores[i]}점`, stars(F.scores[i]), i === top ? 'strong' : '', F.texts[i]])),
          HT.el('h3', { style: 'margin-top:24px' }, '행운을 부르는 것'), luckyGrid,
          HT.el('h3', { style: 'margin-top:24px' }, `${ZODIAC[F.z]}띠 · ${SIGN[F.sg]}`),
          HT.rows([[`${ZODIAC_E[F.z]} ${ZODIAC[F.z]}띠`, '', '', ZODIAC_T[F.z]], [`${SIGN_E[F.sg]} ${SIGN[F.sg]}`, '', '', `${SIGN_T[F.sg]}. ${F.signAdv}`]]),
          HT.note(HT.esc(F.advice), `${isToday ? '오늘' : '내일'}의 한마디`),
          HT.el('div', { class: 'btns', style: 'margin-top:16px' }, [bShare, bCopy]), copyBox,
          HT.el('h3', { style: 'margin-top:24px' }, `${fmtDate(date)} 띠별 순위`),
          HT.table(['순위', '띠', '총운', '한 줄'], rank.map((x, k) => [k + 1, `${ZODIAC_E[x.i]} ${x.name}띠`, x.score + '점', x.txt]), { right: [2], scroll: false, hi: r => r[1].endsWith(ZODIAC[F.z] + '띠') }),
        );
      }
      calc(f.values());
    }
  });
})();
