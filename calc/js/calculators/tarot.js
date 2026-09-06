/* 타로 한 장 — 메이저 아르카나 22장. 질문 + 오늘 날짜(+생년월일) 해시로 카드와 정/역방향을 결정 */
HT.register({
  id: 'tarot', cat: '유용한도구', order: 0.45, name: '타로 한 장 뽑기', keywords: '타로 카드 한 장 오늘의 타로 메이저 아르카나 질문 정방향 역방향',
  desc: '질문을 적고 카드를 뽑으면 메이저 아르카나 22장 중 한 장이 정방향 또는 역방향으로 나옵니다. 사랑·일·돈·조언 네 갈래로 풀이하고, 같은 질문은 하루 동안 같은 카드가 나옵니다.',
  note: '재미와 생각 정리를 돕는 도구입니다. 카드는 질문·날짜·생년월일을 섞은 해시로 정해지므로 "다시 뽑기"를 누르면 새 해시로 바뀝니다. 실제 결정은 숫자로 확인하세요.',
  render(root) {
    const S = window.HT.saju; const hash = S ? S.hash : (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
    const CARDS = [
      ['0', '바보', 'The Fool', '새 출발·모험·순수', '충동·무모함·준비 부족', '설레는 시작. 조건보다 마음을 따르라', '새 프로젝트·이직의 첫걸음', '계획 없는 지출 주의, 작은 실험은 좋음', '해 보지 않으면 모른다'],
      ['I', '마법사', 'The Magician', '능력·집중·실현', '속임수·산만·재능 낭비', '적극적으로 다가가면 통한다', '가진 도구로 충분하다, 실행하라', '수입원을 만들 능력이 있다', '지금 손에 쥔 것을 써라'],
      ['II', '여사제', 'The High Priestess', '직관·비밀·기다림', '무시한 직감·드러난 비밀', '서두르지 말고 상대의 속마음을 읽어라', '아직 드러나지 않은 정보가 있다', '숨은 비용을 살펴라', '답은 이미 알고 있다'],
      ['III', '여황제', 'The Empress', '풍요·양육·결실', '의존·과잉·정체', '따뜻한 관계, 결실', '팀을 돌보면 성과가 자란다', '풍요롭지만 씀씀이도 커진다', '키우는 데 시간을 써라'],
      ['IV', '황제', 'The Emperor', '구조·권위·안정', '경직·통제·고집', '책임감 있는 관계', '체계를 세우면 인정받는다', '예산과 규칙이 돈을 지킨다', '규칙을 정하고 지켜라'],
      ['V', '교황', 'The Hierophant', '전통·조언·배움', '형식주의·반항', '가족·전통이 관여하는 인연', '멘토와 절차를 따르라', '검증된 방법이 낫다', '배운 사람에게 물어라'],
      ['VI', '연인', 'The Lovers', '선택·결합·조화', '갈등·잘못된 선택', '중요한 관계의 선택', '협업이 열쇠', '두 가지 중 하나를 골라야 한다', '가치에 맞는 쪽을 골라라'],
      ['VII', '전차', 'The Chariot', '추진·승리·의지', '방향 상실·폭주', '적극적으로 움직여라', '경쟁에서 앞선다', '공격적 목표가 통한다', '핸들을 꽉 잡아라'],
      ['VIII', '힘', 'Strength', '인내·용기·부드러운 힘', '자신감 부족·억지', '부드러움이 이긴다', '끈기로 난관을 넘는다', '충동을 다스리면 쌓인다', '힘보다 인내'],
      ['IX', '은둔자', 'The Hermit', '성찰·고독·탐구', '고립·회피', '혼자만의 시간이 필요', '깊이 파고들 때', '지출을 멈추고 점검할 때', '안을 들여다보라'],
      ['X', '운명의 수레바퀴', 'Wheel of Fortune', '전환·행운·순환', '불운·저항', '흐름이 바뀐다', '기회가 돌아온다', '예상 못 한 수입 또는 지출', '흐름에 올라타라'],
      ['XI', '정의', 'Justice', '공정·균형·책임', '불공정·회피', '주고받음이 균형인가', '계약·서류를 정확히', '세금·정산을 정직하게', '원인과 결과를 보라'],
      ['XII', '매달린 사람', 'The Hanged Man', '유보·희생·관점 전환', '헛된 희생·정체', '기다림이 필요한 관계', '멈춰서 다르게 보라', '당장 손해가 나중의 이익', '거꾸로 보라'],
      ['XIII', '죽음', 'Death', '끝과 시작·변화', '변화 거부·질질 끔', '관계의 한 단계가 끝난다', '구조조정·전환', '오래된 지출을 끊어라', '끝내야 시작된다'],
      ['XIV', '절제', 'Temperance', '조화·중용·치유', '과잉·불균형', '천천히 맞춰가는 관계', '협업과 조율', '분산과 균형 있는 배분', '섞고 기다려라'],
      ['XV', '악마', 'The Devil', '집착·유혹·속박', '해방·자각', '집착을 경계', '나쁜 조건의 계약 주의', '빚·충동구매·도박 경고', '무엇에 묶였는지 보라'],
      ['XVI', '탑', 'The Tower', '급변·붕괴·각성', '피한 위기·지연된 붕괴', '갑작스러운 변화', '예상 못 한 사건, 기초를 점검', '비상금이 필요한 때', '무너진 자리에 새로 지어라'],
      ['XVII', '별', 'The Star', '희망·치유·영감', '실망·자신감 상실', '치유되는 관계', '장기 비전이 통한다', '천천히 회복된다', '멀리 보라'],
      ['XVIII', '달', 'The Moon', '불안·환상·직감', '혼란 해소·진실', '오해와 불안, 확인이 필요', '정보가 불확실, 결정을 미뤄라', '숨은 리스크', '밤이 지나야 보인다'],
      ['XIX', '태양', 'The Sun', '성공·기쁨·명료', '지연된 기쁨·과신', '밝고 솔직한 관계', '성과와 인정', '수입이 늘고 명확해진다', '있는 그대로 빛나라'],
      ['XX', '심판', 'Judgement', '부활·결단·평가', '자기비판·미련', '과거 인연의 재평가', '중요한 결정의 때', '지난 선택을 정산하라', '부름에 답하라'],
      ['XXI', '세계', 'The World', '완성·통합·성취', '미완·마무리 부족', '완성되는 관계', '프로젝트 완수, 다음 단계', '목표 달성, 다음 목표 설정', '한 바퀴를 마무리하라'],
    ];
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap);
    const q = HT.el('input', { type: 'text', placeholder: '질문을 적어 보세요 (예: 이직해도 될까?)', style: 'width:100%;padding:10px;border:1px solid var(--line);border-radius:4px' });
    const birth = HT.el('input', { type: 'date', style: 'padding:8px;border:1px solid var(--line);border-radius:4px' }); if (S && S.load) { try { const st = S.load(); if (st && st.birth) birth.value = st.birth; } catch (e) {} }
    const draw = HT.el('button', { class: 'btn primary', type: 'button' }, '카드 뽑기'), again = HT.el('button', { class: 'btn', type: 'button' }, '다시 뽑기'); let salt = 0;
    const result = HT.el('div'); wrap.append(HT.el('h3', {}, '질문'), q, HT.el('div', { class: 'btns', style: 'align-items:center' }, [HT.el('span', { class: 'help' }, '생년월일(선택)'), birth, draw, again]), result);
    const cardSvg = (c, rev) => `<svg viewBox="0 0 240 400" width="240" height="400" style="max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.15)${rev ? ';transform:rotate(180deg)' : ''}"><rect width="240" height="400" rx="14" fill="#0B2B3F"/><rect x="12" y="12" width="216" height="376" rx="10" fill="none" stroke="#D2EFFA" stroke-width="2"/><circle cx="120" cy="160" r="62" fill="none" stroke="#4BC0EB" stroke-width="3"/><circle cx="120" cy="160" r="40" fill="#0092C8" opacity=".85"/><polygon points="120,110 132,146 170,146 140,168 150,204 120,182 90,204 100,168 70,146 108,146" fill="#FFFFFF" opacity=".9"/><text x="120" y="52" text-anchor="middle" font-size="26" fill="#D2EFFA" font-family="Georgia,serif">${c[0]}</text><text x="120" y="290" text-anchor="middle" font-size="24" fill="#FFFFFF" font-family="sans-serif" font-weight="700">${HT.esc(c[1])}</text><text x="120" y="320" text-anchor="middle" font-size="13" fill="#8DD7F2" font-family="serif" font-style="italic">${HT.esc(c[2])}</text></svg>`;
    function pick() {
      const question = q.value.trim() || '오늘의 메시지'; const today = new Date().toISOString().slice(0, 10); const h = hash(`${question}|${today}|${birth.value}|${salt}`); const c = CARDS[h % 22]; const rev = ((h >>> 8) % 10) < 3;
      const share = `[타로] "${question}" → ${c[1]} (${c[2]}) ${rev ? '역방향' : '정방향'}: ${rev ? c[4] : c[3]} — 숫자맛집 타로 한 장`;
      result.innerHTML = ''; result.append(HT.el('div', { class: 'split', style: 'margin-top:16px' }, [HT.el('div', { html: cardSvg(c, rev) }), HT.el('div', {}, [HT.el('div', { class: 'kpi' }, [HT.el('div', { class: 'lbl' }, `"${question}"`), HT.el('div', { class: 'val' }, `${c[1]} ${rev ? '(역방향)' : ''}`), HT.el('div', { class: 'sub' }, `${c[2]} · 핵심어: ${rev ? c[4] : c[3]}`)]), HT.rows([['사랑·관계', c[5]], ['일·직장', c[6]], ['돈', c[7]], ['조언', c[8]], rev ? ['역방향 해석', `정방향의 뜻(${c[3]})이 막히거나 지나친 상태 — ${c[4]}`, 'sub'] : null]), HT.shareButtons(share, { title: `타로 · "${question}"`, big: `${c[1]} ${rev ? '역방향' : ''}`, lines: [c[2] + ' · ' + (rev ? c[4] : c[3]), '조언: ' + c[8]], file: 'tarot' })])]),
        HT.el('div', { class: 'note', html: `<a href="#/daily-fortune">오늘의 운세</a> · <a href="#/new-year-fortune">2027 신년운세</a> · <a href="#/love-match">궁합 보기</a>` }));
    }
    draw.addEventListener('click', pick); again.addEventListener('click', () => { salt++; pick(); }); q.addEventListener('keydown', e => { if (e.key === 'Enter') pick(); });
    pick();
  }
});
