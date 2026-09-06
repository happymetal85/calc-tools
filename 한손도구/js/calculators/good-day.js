/* 택일 도우미 — 결혼·이사·여행 날짜 고르기. 규칙: 건제12신(직) · 황도일 · 당사자 띠와 일진의 충/합 · 손 없는 날(음력) · 윤달 · 이사/여행 방위(대장군·삼살).
   공통 자료는 daily-fortune.js 의 HT.saju, 음력은 lunar-table.js 의 HT.lunar */
(function () {
  'use strict';
  const JIK = ['건', '제', '만', '평', '정', '집', '파', '위', '성', '수', '개', '폐'], JIK_H = '建除滿平定執破危成收開閉';
  const JIK_DESC = { 건: '일을 세우는 날. 시작·착공에 좋고 혼인·이사는 피합니다.', 제: '묵은 것을 덜어내는 날. 청소·치료·정리에 좋습니다.', 만: '가득 차는 날. 이사·개업·계약에 좋습니다.', 평: '평탄한 날. 여행과 무난한 일에 좋습니다.', 정: '자리를 정하는 날. 혼인·이사·계약·입주에 가장 좋습니다.', 집: '붙잡는 날. 채용·계약·혼인에 괜찮습니다.', 파: '깨지는 날. 혼인·이사·계약을 피합니다.', 위: '위태로운 날. 큰일·여행·이사를 피합니다.', 성: '이루는 날. 혼인·이사·개업·여행 모두 좋습니다.', 수: '거두는 날. 수금·수확·정리에 좋고 시작은 보통입니다.', 개: '여는 날. 혼인·이사·여행·개업에 좋습니다.', 폐: '닫는 날. 새 일을 시작하지 않습니다.' };
  const P = {
    wedding: { name: '결혼', good: ['정', '성', '개'], ok: ['제', '만', '평', '집', '수'], leap: -10, son: 3, off: 6 },
    move: { name: '이사', good: ['정', '성', '개', '만'], ok: ['제', '평', '집', '수'], leap: 5, son: 15, off: 0 },
    travel: { name: '여행', good: ['개', '성', '평', '정'], ok: ['제', '만', '집', '수'], leap: 0, son: 3, off: 0 },
  };
  /* 황도일 — 절기 달의 지지(월지)별 황도 지지 6개 (청룡·명당·금궤·천덕·옥당·사명) */
  const HD = { 2: [0, 1, 4, 5, 7, 10], 3: [2, 3, 6, 7, 9, 0], 4: [4, 5, 8, 9, 11, 2], 5: [6, 7, 10, 11, 1, 4], 0: [8, 9, 0, 1, 3, 6], 1: [10, 11, 2, 3, 5, 8] };
  const DIRS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '동북쪽', '서남쪽', '서북쪽'];
  const DJG = (yb) => [11, 0, 1].includes(yb) ? '서' : [2, 3, 4].includes(yb) ? '북' : [5, 6, 7].includes(yb) ? '동' : '남';
  const SAMSAL = (yb) => [8, 0, 4].includes(yb) ? '남' : [11, 3, 7].includes(yb) ? '서' : [2, 6, 10].includes(yb) ? '북' : '동';
  const FIXED_HOL = { '01-01': '신정', '03-01': '삼일절', '05-05': '어린이날', '06-06': '현충일', '08-15': '광복절', '10-03': '개천절', '10-09': '한글날', '12-25': '성탄절' };
  const DOW = '일월화수목금토';
  const ymd = (d) => HT.saju.ymd(d);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmtD = (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`;
  const yearBranch = (d) => { const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate(); const yy = (m < 2 || (m === 2 && dd < 4)) ? y - 1 : y; return ((yy - 4) % 12 + 12) % 12; };
  const holiday = (d) => {
    const L = HT.lunar; const k = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if (FIXED_HOL[k]) return FIXED_HOL[k];
    const l = L.toLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    if (l && !l.leap) { if (l.lm === 1 && l.ld <= 2) return '설날'; if (l.lm === 8 && l.ld >= 14 && l.ld <= 16) return '추석'; if (l.lm === 4 && l.ld === 8) return '부처님오신날'; }
    const n = addDays(d, 1); const ln = L.toLunar(n.getFullYear(), n.getMonth() + 1, n.getDate()); if (ln && !ln.leap && ln.lm === 1 && ln.ld === 1) return '설날';
    return null;
  };
  const dirJudge = (dir, d) => { if (!dir) return null; const yb = yearBranch(d); const dj = DJG(yb), ss = SAMSAL(yb); const hits = []; if (dir.includes(dj)) hits.push(`대장군 방위(${dj}쪽)`); if (dir.includes(ss)) hits.push(`삼살 방위(${ss}쪽)`); return { ok: !hits.length, dj, ss, hits, txt: hits.length ? `${dir}은 올해(${HT.saju.BRANCH[yb]}년) ${hits.join('·')}에 걸립니다. 방향을 바꾸기 어려우면 그 방향으로 가기 전에 하루 다른 곳에 들렀다 가는 "방위 피하기"를 씁니다.` : `${dir}은 올해(${HT.saju.BRANCH[yb]}년) 대장군(${dj}쪽)·삼살(${ss}쪽) 방위를 피해 있어 무난합니다.` }; };

  function evalDay(d, purpose, people, opts) {
    const S = HT.saju, L = HT.lunar; const cfg = P[purpose];
    const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
    const p = S.dayPillar(y, m, dd), db = p % 12;
    const mb = L.monthBranch(y, m, dd); const mbb = mb === null ? m % 12 : mb;
    const jik = JIK[(db - mbb + 12) % 12]; const jh = JIK_H[JIK.indexOf(jik)];
    const hwang = HD[mbb % 6].includes(db);
    const lunar = L.toLunar(y, m, dd); const son = !!lunar && [9, 10, 19, 20, 29, 30].includes(lunar.ld);
    const dow = d.getDay(); const hol = holiday(d); const off = dow === 0 || dow === 6 || !!hol;
    let score = 50, ex = false; const why = [], tags = [];
    if (cfg.good.includes(jik)) { score += 20; why.push(`${jik}(${jh})일 — ${cfg.name}에 좋은 날`); tags.push([jik + '일', 'ok']); }
    else if (cfg.ok.includes(jik)) { why.push(`${jik}(${jh})일 — 무난`); tags.push([jik + '일', 'gray']); }
    else { ex = true; score -= 30; why.push(`${jik}(${jh})일 — ${cfg.name}에 피하는 날`); tags.push([jik + '일', 'warn']); }
    if (hwang) { score += 15; why.push('황도일'); tags.push(['황도', 'ok']); }
    people.forEach(pp => { const r = S.relation(pp.z, db); if (r.kind === 'chung') { ex = true; score -= 40; why.push(`${pp.name}(${S.ZODIAC[pp.z]}띠)와 충(沖)`); tags.push([pp.name + ' 충', 'danger']); } else if (r.kind === 'hap6') { score += 8; why.push(`${pp.name} 띠와 육합`); } else if (r.kind === 'hap3') { score += 6; why.push(`${pp.name} 띠와 삼합`); } else if (r.kind === 'same') { score += 2; } });
    if (son) { score += opts.sonFirst ? cfg.son : Math.min(cfg.son, 3); why.push('손 없는 날'); tags.push(['손 없는 날', 'ok']); }
    if (lunar && lunar.leap) { score += cfg.leap; if (cfg.leap) why.push(cfg.leap > 0 ? '윤달 — 이사에 좋다는 관습' : '윤달 — 혼인은 피한다는 관습'); tags.push(['윤달', cfg.leap >= 0 ? 'gray' : 'warn']); }
    if (off) { score += cfg.off; if (hol) tags.push([hol, 'gray']); }
    if (!lunar) why.push('음력 자료 범위 밖(손 없는 날 판정 불가)');
    return { d, s: ymd(d), score: HT.clamp(score, 0, 99), ex, off, jik, jh, hwang, lunar, son, hol, dow, why, tags, pillar: S.pillarName(p) };
  }
  const lunarShort = (e) => { if (!e.lunar) return ''; const l = e.lunar; return (l.ld === 1 ? `${l.leap ? '윤' : ''}${l.lm}/1` : String(l.ld)) + (e.son ? ' 손' : ''); };
  function calendar(y, m, evals, picks, opts) {
    const t = HT.el('table', { class: 'cal' }); t.append(HT.el('caption', {}, `${y}년 ${m}월`));
    const tr = HT.el('tr'); DOW.split('').forEach(w => tr.append(HT.el('th', {}, w))); t.append(HT.el('thead', {}, tr));
    const tb = HT.el('tbody'); const first = new Date(y, m - 1, 1).getDay(); const days = new Date(y, m, 0).getDate();
    let row = HT.el('tr'); for (let i = 0; i < first; i++) row.append(HT.el('td'));
    for (let d = 1; d <= days; d++) {
      const e = evals.get(ymd(new Date(y, m - 1, d))); let cls = '';
      if (e) { if (e.ex) cls = 'bad'; else if (e.score >= 75) cls = 'good'; if (picks.has(e.s)) cls += ' pick'; if (opts.weekendOnly && !e.off) cls += ' off'; }
      row.append(HT.el('td', { class: cls.trim(), title: e ? `${e.pillar}일 · ${HT.lunar.fmt(e.lunar) || '음력 자료 없음'} · ${e.score}점 · ${e.why.join(' / ')}` : '' }, [HT.el('div', { class: 'd' }, d), HT.el('div', { class: 'l' }, e ? lunarShort(e) : '')]));
      if ((first + d) % 7 === 0) { tb.append(row); row = HT.el('tr'); }
    }
    if (row.children.length) tb.append(row); t.append(tb); return t;
  }
  const legend = () => HT.el('div', { class: 'cap', style: 'font-size:12px;color:var(--ink-soft);margin:-8px 0 16px' }, '색칠한 칸 = 좋은 날(75점 이상), 굵은 테두리 = 추천 순위 안, 취소선 = 피하는 날(흉한 직 또는 띠와 충), 흐린 칸 = 조건(주말만)에서 제외. 칸 아래 작은 숫자는 음력 날짜, "손"은 손 없는 날.');
  const shareBtns = (title, text) => {
    const bCopy = HT.el('button', { class: 'btn', type: 'button' }, '결과 복사'), bShare = HT.el('button', { class: 'btn primary', type: 'button' }, '공유하기');
    const box = HT.el('textarea', { class: 'out', readonly: '', style: 'display:none;min-height:150px;margin-top:8px' }); box.value = text;
    const show = () => { box.style.display = 'block'; box.focus(); box.select(); try { document.execCommand('copy'); } catch (e) {} bCopy.textContent = '아래 글을 길게 눌러 복사하세요'; };
    bCopy.addEventListener('click', () => { if (!navigator.clipboard || !navigator.clipboard.writeText) return show(); navigator.clipboard.writeText(text).then(() => { bCopy.textContent = '복사됨'; setTimeout(() => bCopy.textContent = '결과 복사', 1500); }).catch(show); });
    bShare.addEventListener('click', () => { if (navigator.share) navigator.share({ title, text }).catch(() => {}); else bCopy.click(); });
    return [HT.el('div', { class: 'btns', style: 'margin-top:16px' }, [bShare, bCopy]), box];
  };
  const personOf = (birth, name) => { const b = HT.saju.parse(birth); return b && b[0] >= 1900 ? { name, z: HT.saju.zodiacOf(b[0], b[1], b[2]) } : null; };
  const zodiacOpts = () => [['', '고려 안 함'], ...HT.saju.ZODIAC.map((z, i) => [String(i), z + '띠'])];
  const monthVal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  /* 기간 안의 모든 날을 평가해 순위와 달력을 만든다 */
  function rankRange(out, purpose, people, fromMonth, months, opts, head) {
    const L = HT.lunar; const cfg = P[purpose];
    const mm = /^(\d{4})-(\d{2})$/.exec(fromMonth || ''); if (!mm) { out.set(HT.el('div', { class: 'empty' }, '시작 달을 고르세요.')); return; }
    const start = new Date(+mm[1], +mm[2] - 1, 1); const end = new Date(+mm[1], +mm[2] - 1 + months, 0);
    const evals = new Map(); const list = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) { const e = evalDay(d, purpose, people, opts); evals.set(e.s, e); list.push(e); }
    const cands = list.filter(e => !e.ex && (!opts.weekendOnly || e.off)).sort((a, b) => b.score - a.score || (a.d - b.d)).slice(0, 10);
    const picks = new Set(cands.map(e => e.s));
    const outOfRange = list.some(e => !L.termsExact(e.d.getFullYear(), e.d.getMonth() + 1, e.d.getDate()));
    const rows = cands.length ? HT.rows(cands.map((e, i) => [`${i + 1}. ${fmtD(e.d)}${e.hol ? ' · ' + e.hol : ''}`, HT.badge(e.score + '점', e.score >= 75 ? 'ok' : 'gray'), i === 0 ? 'strong' : '', `${e.pillar}일 · ${L.fmtShort(e.lunar) || '음력 자료 없음'} · ${e.why.join(' · ')}`])) : HT.el('div', { class: 'empty' }, '조건에 맞는 날이 없습니다. 기간을 늘리거나 "주말만"을 끄세요.');
    const cals = HT.el('div', { class: 'cal-grid' }); for (let i = 0; i < months; i++) { const dt = new Date(start.getFullYear(), start.getMonth() + i, 1); cals.append(calendar(dt.getFullYear(), dt.getMonth() + 1, evals, picks, opts)); }
    const rangeTxt = `${start.getFullYear()}년 ${start.getMonth() + 1}월 ~ ${end.getFullYear()}년 ${end.getMonth() + 1}월`;
    const share = [`📅 ${cfg.name} 택일 추천 (${rangeTxt})`, ...cands.slice(0, 5).map((e, i) => `${i + 1}. ${fmtD(e.d)} — ${e.why.slice(0, 3).join(', ')}`), location.href.split('#')[0] + '#/good-day'].join('\n');
    out.set(
      ...head,
      HT.el('p', { style: 'margin:0 0 12px;font-size:13px;color:var(--ink-soft)' }, `${rangeTxt} · 고려한 사람: ${people.length ? people.map(p => `${p.name}(${HT.saju.ZODIAC[p.z]}띠)`).join(', ') : '없음'}${opts.weekendOnly ? ' · 주말·공휴일만' : ''}`),
      HT.el('h3', {}, `추천 날짜 순위 (${cands.length}일)`), rows,
      outOfRange ? HT.el('div', { class: 'alert' }, `절기 입절일은 ${L.terms[0][0].slice(0, 4)}~${L.terms[L.terms.length - 1][0].slice(0, 4)}년만 정확한 표를 담고 있어, 그 밖의 날은 12직이 하루 어긋날 수 있습니다.`) : null,
      HT.el('h3', { style: 'margin-top:24px' }, '달력'), cals, legend(),
      ...shareBtns(`${cfg.name} 택일`, share),
    );
  }

  HT.register({
    id: 'good-day', cat: '유용한도구', order: 0.4, name: '택일 도우미 (결혼·이사·여행)', keywords: '택일 길일 결혼날짜 결혼식 이사날짜 손없는날 여행 출발일 황도일 12직 대장군 삼살 방위 음력',
    desc: '결혼식·이삿날·여행 출발일로 좋은 날을 고릅니다. 그날의 건제12신(직)과 황도일, 당사자 띠와 일진의 충·합, 손 없는 날(음력), 윤달, 이사·여행 방위(대장군·삼살)를 함께 따져 순위와 달력으로 보여 줍니다.',
    note: '택일 사이트와 달력에 흔히 쓰는 공개 규칙(건제12신·황도일·띠 충합·손 없는 날·대장군/삼살 방위)으로 고른 참고용입니다. 실제 택일은 사주 전체를 보는 영역이니 큰 행사는 전문가 확인을 권합니다. 음력은 한국천문연구원 기준 2025년 1월 29일 ~ 2030년 12월 표를 담았고, 12직의 절기 경계는 ±1일 오차가 있을 수 있습니다. 공휴일은 신정·삼일절·어린이날·현충일·광복절·개천절·한글날·성탄절과 설·추석·부처님오신날만 반영하며 대체공휴일은 뺐습니다. 입력한 정보는 어디에도 전송되지 않습니다.',
    render(root) {
      const S = HT.saju, L = HT.lunar; const saved = S.load();
      if (!L) { root.append(HT.el('div', { class: 'alert wide' }, '음력 표(lunar-table.js)를 불러오지 못했습니다.')); return; }
      const tabsWrap = HT.el('div', { class: 'wide' }); root.append(tabsWrap);
      const body = HT.el('div', { class: 'calc wide', style: 'display:grid;grid-template-columns:minmax(300px,420px) 1fr;gap:24px;align-items:start' }); root.append(body);
      const next = new Date(); next.setMonth(next.getMonth() + 1, 1);
      const minM = L.terms[0][0].slice(0, 7), maxM = L.terms[L.terms.length - 1][0].slice(0, 7);
      HT.tabs(tabsWrap, [['wedding', '결혼식 날짜'], ['move', '이삿날'], ['travel', '여행 출발일']], k => { body.innerHTML = ''; if (k === 'wedding') wedding(); else if (k === 'move') move(); else travel(); });
      if (window.matchMedia('(max-width: 900px)').matches) body.style.gridTemplateColumns = '1fr';

      function wedding() {
        const out = HT.output(body, '');
        const f = HT.form(body, [
          ...S.birthFields('groom', '신랑 생년월일', { value: '1996-05-20' }),
          ...S.birthFields('bride', '신부 생년월일', { value: '1997-09-10' }),
          { id: 'gf', label: '신랑 아버지 띠', type: 'select', options: zodiacOpts(), value: '' },
          { id: 'gm', label: '신랑 어머니 띠', type: 'select', options: zodiacOpts(), value: '' },
          { id: 'bf', label: '신부 아버지 띠', type: 'select', options: zodiacOpts(), value: '' },
          { id: 'bm', label: '신부 어머니 띠', type: 'select', options: zodiacOpts(), value: '' },
          { id: 'from', label: '시작 달', type: 'month', value: monthVal(next), min: minM, max: maxM },
          { id: 'months', label: '살펴볼 기간', type: 'select', options: [['1', '1개월'], ['2', '2개월'], ['3', '3개월'], ['6', '6개월'], ['12', '12개월']], value: '6' },
          { id: 'weekend', label: '주말·공휴일만 보기', type: 'check', value: true },
        ], calc, { title: '결혼식 날짜 고르기' });
        function calc(v) {
          const errs = [], pb = (id, name) => { const R = S.resolveBirth(v, id); if (R.err) errs.push(name + ': ' + R.err); return R.solar ? personOf(R.solar, name) : null; };
          const people = [pb('groom', '신랑'), pb('bride', '신부')].filter(Boolean);
          if (errs.length) { out.set(HT.el('div', { class: 'alert' }, errs.join(' / '))); return; }
          [['gf', '신랑 아버지'], ['gm', '신랑 어머니'], ['bf', '신부 아버지'], ['bm', '신부 어머니']].forEach(([k, n]) => { if (v[k] !== '') people.push({ name: n, z: +v[k] }); });
          if (people.length < 2) { out.set(HT.el('div', { class: 'empty' }, '신랑·신부 생년월일을 입력하세요.')); return; }
          rankRange(out, 'wedding', people, v.from, +v.months, { weekendOnly: v.weekend, sonFirst: false }, [HT.kpi('결혼식 택일', `${S.ZODIAC_E[people[0].z]} ${S.ZODIAC[people[0].z]}띠 · ${S.ZODIAC_E[people[1].z]} ${S.ZODIAC[people[1].z]}띠`, '정(定)·성(成)·개(開)일과 황도일을 우선하고, 두 사람과 양가 부모 띠에 충(沖)이 드는 날과 파(破)·위(危)·폐(閉)·건(建)일은 뺍니다. 윤달은 혼인을 피하는 관습이 있어 감점합니다.')]);
        }
        calc(f.values());
      }
      function move() {
        const out = HT.output(body, '');
        const f = HT.form(body, [
          ...S.birthFields('p1', '세대주 생년월일', { cal: saved.birthCal, value: saved.birth || '1990-03-01', lunar: saved.birthL, leap: saved.birthLeap }),
          ...S.birthFields('p2', '가족 2 생년월일 (선택)', {}),
          ...S.birthFields('p3', '가족 3 생년월일 (선택)', {}),
          { id: 'dir', label: '이사 방향 (지금 집에서 새 집 쪽)', type: 'select', options: [['', '모름 / 고려 안 함'], ...DIRS.map(d => [d, d])], value: '' },
          { id: 'from', label: '시작 달', type: 'month', value: monthVal(next), min: minM, max: maxM },
          { id: 'months', label: '살펴볼 기간', type: 'select', options: [['1', '1개월'], ['2', '2개월'], ['3', '3개월'], ['6', '6개월']], value: '3' },
          { id: 'son', label: '손 없는 날을 우선', type: 'check', value: true },
          { id: 'weekend', label: '주말·공휴일만 보기', type: 'check', value: false },
        ], calc, { title: '이삿날 고르기' });
        function calc(v) {
          const errs = [], pb = (id, name) => { const R = S.resolveBirth(v, id); if (R.err) errs.push(name + ': ' + R.err); return R.solar ? personOf(R.solar, name) : null; };
          const people = [pb('p1', '세대주'), pb('p2', '가족 2'), pb('p3', '가족 3')].filter(Boolean);
          if (errs.length) { out.set(HT.el('div', { class: 'alert' }, errs.join(' / '))); return; }
          if (!people.length) { out.set(HT.el('div', { class: 'empty' }, '세대주 생년월일을 입력하세요.')); return; }
          const mm = /^(\d{4})-(\d{2})$/.exec(v.from || ''); const dj = mm ? dirJudge(v.dir, new Date(+mm[1], +mm[2] - 1, 15)) : null;
          const head = [HT.kpi('이삿날 택일', `${S.ZODIAC_E[people[0].z]} ${S.ZODIAC[people[0].z]}띠 세대주`, '손 없는 날(음력 9·10·19·20·29·30일)과 정(定)·성(成)·개(開)·만(滿)일, 황도일을 우선하고, 가족 띠에 충이 드는 날과 파·위·폐·건일은 뺍니다. 윤달은 이사에 좋다는 관습이 있어 가점합니다.')];
          if (dj) head.push(HT.el('div', { class: dj.ok ? 'note' : 'alert', style: 'margin:0 0 12px' }, [HT.el('b', {}, dj.ok ? '방위 무난 ' : '방위 주의 '), dj.txt]));
          rankRange(out, 'move', people, v.from, +v.months, { weekendOnly: v.weekend, sonFirst: v.son }, head);
        }
        calc(f.values());
      }
      function travel() {
        const out = HT.output(body, '');
        const dep = addDays(new Date(), 14);
        const f = HT.form(body, [
          { id: 'dep', label: '출발일', type: 'date', value: ymd(dep), min: L.terms[0][0], max: L.terms[L.terms.length - 1][0] },
          { id: 'days', label: '여행 일수', type: 'number', value: 3, min: 1, max: 60, unit: '일' },
          ...S.birthFields('me', '내 생년월일', { cal: saved.birthCal, value: saved.birth || '1990-03-01', lunar: saved.birthL, leap: saved.birthLeap }),
          ...S.birthFields('c1', '동행 1 생년월일 (선택)', {}),
          ...S.birthFields('c2', '동행 2 생년월일 (선택)', {}),
          { id: 'dir', label: '여행 방향 (집에서 목적지 쪽)', type: 'select', options: [['', '모름 / 고려 안 함'], ...DIRS.map(d => [d, d])], value: '' },
        ], calc, { title: '여행 출발일 살피기' });
        function calc(v) {
          const errs = [], pb = (id, name) => { const R = S.resolveBirth(v, id); if (R.err) errs.push(name + ': ' + R.err); return R.solar ? personOf(R.solar, name) : null; };
          const people = [pb('me', '나'), pb('c1', '동행 1'), pb('c2', '동행 2')].filter(Boolean);
          if (errs.length) { out.set(HT.el('div', { class: 'alert' }, errs.join(' / '))); return; }
          const b = S.parse(v.dep); if (!b || !people.length) { out.set(HT.el('div', { class: 'empty' }, '출발일과 내 생년월일을 입력하세요.')); return; }
          const d0 = new Date(b[0], b[1] - 1, b[2]); const n = HT.clamp(Math.round(v.days) || 1, 1, 60);
          const opts = { weekendOnly: false, sonFirst: false };
          const e0 = evalDay(d0, 'travel', people, opts);
          const trip = []; for (let i = 0; i < n; i++) trip.push(evalDay(addDays(d0, i), 'travel', people, opts));
          const caution = trip.slice(1).filter(e => e.ex);
          const alts = []; for (let i = -7; i <= 10; i++) { if (i === 0) continue; const e = evalDay(addDays(d0, i), 'travel', people, opts); if (!e.ex && e.d >= addDays(new Date(), -1)) alts.push(e); }
          alts.sort((a, c) => c.score - a.score || Math.abs(a.d - d0) - Math.abs(c.d - d0)); const top = alts.slice(0, 3).sort((a, c) => a.d - c.d);
          const dj = dirJudge(v.dir, d0);
          const verdict = e0.ex ? ['피하는 편이 좋은 출발일', 'warn'] : e0.score >= 75 ? ['좋은 출발일', 'ok'] : ['무난한 출발일', 'gray'];
          const share = [`✈️ ${fmtD(d0)} 출발 ${n}일 여행 — ${verdict[0]} (${e0.score}점)`, `근거: ${e0.why.join(', ')}`, top.length ? `대안 출발일: ${top.map(e => `${e.d.getMonth() + 1}/${e.d.getDate()}(${e.score}점)`).join(', ')}` : '', dj ? dj.txt : '', location.href.split('#')[0] + '#/good-day'].filter(Boolean).join('\n');
          out.set(
            HT.kpi(`${fmtD(d0)} 출발 · ${n}일`, `${e0.score}점`, ''),
            HT.el('div', { style: 'margin:-8px 0 12px' }, HT.badge(verdict[0], verdict[1])),
            HT.rows([['출발일 판정', '', '', `${e0.pillar}일 · ${L.fmtShort(e0.lunar) || '음력 자료 없음'} · ${e0.why.join(' · ')}`], ['12직 풀이', '', '', `${e0.jik}(${e0.jh})일 — ${JIK_DESC[e0.jik]}`]]),
            dj ? HT.el('div', { class: dj.ok ? 'note' : 'alert', style: 'margin:12px 0' }, [HT.el('b', {}, dj.ok ? '방위 무난 ' : '방위 주의 '), dj.txt]) : null,
            HT.el('h3', { style: 'margin-top:24px' }, '여행 기간 중 조심할 날'),
            caution.length ? HT.rows(caution.map(e => [fmtD(e.d), HT.badge('주의', 'warn'), '', e.why.filter(w => /피하는|충/.test(w)).join(' · ') + ' — 이동·큰 결제·위험한 활동은 이날을 피하세요'])) : HT.el('p', { style: 'font-size:14px;color:var(--ink-soft)' }, '여행 기간 안에 특별히 피할 날은 없습니다.'),
            HT.el('h3', { style: 'margin-top:24px' }, '출발일을 바꿀 수 있다면 (앞뒤 7~10일 안)'),
            top.length ? HT.rows(top.map(e => [fmtD(e.d), HT.badge(e.score + '점', e.score >= 75 ? 'ok' : 'gray'), '', `${e.pillar}일 · ${L.fmtShort(e.lunar)} · ${e.why.join(' · ')}`])) : HT.el('p', { style: 'font-size:14px;color:var(--ink-soft)' }, '앞뒤로 더 나은 날이 없습니다.'),
            ...shareBtns('여행 출발일', share),
          );
        }
        calc(f.values());
      }
    }
  });
})();
