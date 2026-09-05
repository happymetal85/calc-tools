/* 나이 · D-day 계산기 — 만 나이/연 나이/세는 나이, 살아온 날, 10,000일, 다음 생일, 띠·별자리·요일 / D-day·기념일·전역일·출산예정일 */
HT.register({
  id: 'age-dday', cat: '유용한도구', order: 0.06, original: false, name: '나이 · D-day 계산기', keywords: '만나이 연나이 세는나이 디데이 D-day 100일 1000일 전역일 출산예정일 살아온 날 생일 요일',
  desc: '생년월일로 만 나이·연 나이·세는 나이, 살아온 날 수, 10,000일째 되는 날, 다음 생일까지 D-day, 띠·별자리·태어난 요일을 계산합니다. 두 번째 탭은 D-day·100일·1000일·전역일·출산 예정일을 계산합니다.',
  note: '2023년 6월 28일부터 법령·계약·공문서의 나이는 만 나이가 기준입니다. 연 나이(올해 − 출생연도)는 병역·청소년보호법 등 일부에서, 세는 나이는 관습에서 씁니다. 전역일은 육군·해병 18개월, 해군 20개월, 공군 21개월, 사회복무요원 21개월 기준이며 입대일이 속한 달의 전날 계산 방식은 부대마다 차이가 있어 하루 정도 다를 수 있습니다. 출산 예정일은 마지막 생리 시작일 + 280일(네겔레 법칙)입니다.',
  render(root) {
    const ZOD = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지']; const SIGNS = [['염소자리', 1, 20], ['물병자리', 2, 19], ['물고기자리', 3, 21], ['양자리', 4, 20], ['황소자리', 5, 21], ['쌍둥이자리', 6, 22], ['게자리', 7, 23], ['사자자리', 8, 23], ['처녀자리', 9, 23], ['천칭자리', 10, 23], ['전갈자리', 11, 23], ['사수자리', 12, 22]];
    const DOW = ['일', '월', '화', '수', '목', '금', '토']; const today = new Date(); today.setHours(0, 0, 0, 0);
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${DOW[d.getDay()]})`;
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const ld = (s) => new Date(s + 'T00:00:00'); // 날짜 문자열을 현지 자정으로 (그냥 new Date('YYYY-MM-DD')는 UTC 자정)
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // 현지 날짜 (toISOString은 UTC라 한국에서 하루 밀린다)
    const wrap = HT.el('div', { class: 'wide' }); root.append(wrap); const body = HT.el('div');
    HT.tabs(wrap, [['age', '나이 계산'], ['dday', 'D-day · 기념일']], k => { body.innerHTML = ''; (k === 'age' ? ageTab : ddayTab)(body); }); wrap.append(body);
    function ageTab(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, '나이');
      const f = HT.form(inner, [{ id: 'birth', label: '생년월일 (양력)', type: 'date', value: '1994-05-15' }, { id: 'ref', label: '기준일', type: 'date', value: iso(today) }], calc);
      function calc(v) {
        const b = ld(v.birth), r = ld(v.ref); if (isNaN(b) || isNaN(r) || b > r) { out.set(HT.el('div', { class: 'empty' }, '생년월일과 기준일을 확인하세요.')); return; }
        let man = r.getFullYear() - b.getFullYear(); if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) man--;
        const yeon = r.getFullYear() - b.getFullYear(), se = yeon + 1; const days = Math.floor((r - b) / 864e5);
        let next = new Date(r.getFullYear(), b.getMonth(), b.getDate()); if (next < r) next = new Date(r.getFullYear() + 1, b.getMonth(), b.getDate()); const toBirthday = Math.round((next - r) / 864e5);
        const zy = (b.getMonth() + 1 < 2 || (b.getMonth() + 1 === 2 && b.getDate() < 4)) ? b.getFullYear() - 1 : b.getFullYear(); const zodiac = ZOD[((zy - 4) % 12 + 12) % 12];
        let sign = SIGNS[0][0]; SIGNS.forEach(([n, m, d]) => { if (b.getMonth() + 1 > m || (b.getMonth() + 1 === m && b.getDate() >= d)) sign = n; });
        const k10 = addDays(b, 10000), k20 = addDays(b, 20000), k30 = addDays(b, 30000);
        out.set(HT.kpi('만 나이', `${man}세`, `연 나이 ${yeon}세 · 세는 나이 ${se}세`),
          HT.kpis([['살아온 날', HT.fmt(days) + '일', `${HT.fmt(Math.floor(days / 7))}주 · ${HT.fmt(days * 24)}시간`], ['다음 생일까지', toBirthday === 0 ? '오늘!' : `D-${toBirthday}`, fmt(next)], ['태어난 요일', DOW[b.getDay()] + '요일', `${zodiac}띠 · ${sign}`]]),
          HT.rows([['10,000일째 되는 날', fmt(k10), k10 < r ? 'sub' : '', k10 < r ? '지남' : `D-${Math.round((k10 - r) / 864e5)}`], ['20,000일째', fmt(k20), k20 < r ? 'sub' : '', k20 < r ? '지남' : `D-${Math.round((k20 - r) / 864e5)}`], ['30,000일째 (약 82세)', fmt(k30)], ['만 19세 (성년)', fmt(new Date(b.getFullYear() + 19, b.getMonth(), b.getDate()))], ['만 60세 (환갑)', fmt(new Date(b.getFullYear() + 60, b.getMonth(), b.getDate()))], ['국민연금 수급 개시 (65세, 1969년생 이후)', fmt(new Date(b.getFullYear() + 65, b.getMonth(), b.getDate()))]]),
          HT.el('div', { class: 'note', html: `<b>기준</b> 만 나이는 생일이 지났으면 올해 − 출생연도, 안 지났으면 1을 뺀 값입니다. 띠는 입춘(2월 4일) 기준이라 1~2월 초 출생은 전년도 띠입니다. 운세가 궁금하면 <a href="#/daily-fortune">오늘의 운세</a>로.` }));
      }
      calc(f.values());
    }
    function ddayTab(box) {
      const inner = HT.el('div', { class: 'calc' }); box.append(inner); const out = HT.output(inner, 'D-day');
      const f = HT.form(inner, [
        { id: 'mode', label: '계산 종류', type: 'seg', options: [['dday', 'D-day'], ['anniv', '100일·1000일'], ['army', '전역일'], ['baby', '출산 예정일']], value: 'dday' },
        { id: 'target', label: '목표 날짜', type: 'date', value: `${today.getFullYear() + 1}-01-01`, show: v => v.mode === 'dday' },
        { id: 'start', label: '시작일 (사귄 날·결혼일·입대일·마지막 생리 시작일)', type: 'date', value: iso(today), show: v => v.mode !== 'dday' },
        { id: 'branch', label: '복무 구분', type: 'select', options: [['18', '육군·해병대 (18개월)'], ['20', '해군 (20개월)'], ['21', '공군 (21개월)'], ['21s', '사회복무요원 (21개월)']], value: '18', show: v => v.mode === 'army' },
        { id: 'inclusive', label: '시작일을 1일로 셈 (사귄 날 = 1일)', type: 'check', value: true, show: v => v.mode === 'anniv' },
      ], calc);
      function calc(v) {
        if (v.mode === 'dday') { const t = ld(v.target); if (isNaN(t)) return; const d = Math.round((t - today) / 864e5); out.set(HT.kpi(d === 0 ? 'D-day' : d > 0 ? `D-${d}` : `D+${-d}`, fmt(t), d > 0 ? `${Math.floor(d / 7)}주 ${d % 7}일 남음` : d < 0 ? `${-d}일 지남` : '오늘입니다'), HT.rows([['오늘', fmt(today)], ['남은 주말 (토·일)', d > 0 ? countWeekends(today, t) + '일' : '-'], ['남은 평일', d > 0 ? (d - countWeekends(today, t)) + '일' : '-']])); return; }
        const s = ld(v.start); if (isNaN(s)) return;
        if (v.mode === 'anniv') { const off = v.inclusive ? -1 : 0; const rows = [1, 50, 100, 200, 300, 365, 500, 730, 1000, 1095, 1460, 1825, 2000, 3650].map(n => { const d = addDays(s, n + off); const diff = Math.round((d - today) / 864e5); return [n === 365 ? '1주년' : n === 730 ? '2주년' : n === 1095 ? '3주년' : n === 1460 ? '4주년' : n === 1825 ? '5주년' : n === 3650 ? '10주년' : n + '일', fmt(d), diff === 0 ? '오늘!' : diff > 0 ? `D-${diff}` : `${-diff}일 전`]; }); const dayNow = Math.floor((today - s) / 864e5) - off;
          out.set(HT.kpi('오늘은', `${HT.fmt(dayNow)}일째`, fmt(s) + '부터'), HT.table(['기념일', '날짜', 'D-day'], rows, { right: [2], scroll: false, hi: r => r[2].startsWith('D-') && rows.find(x => x[2].startsWith('D-')) === r })); return; }
        if (v.mode === 'army') { const months = parseInt(v.branch, 10); const d = new Date(s); d.setMonth(d.getMonth() + months); d.setDate(d.getDate() - 1); const total = Math.round((d - s) / 864e5), done = HT.clamp(Math.round((today - s) / 864e5), 0, total); const left = Math.round((d - today) / 864e5);
          out.set(HT.kpi('전역일', fmt(d), left > 0 ? `D-${left} · ${HT.pct(done / total * 100, 1)} 복무 완료` : '전역 축하합니다'), HT.el('div', { class: 'chart', html: `<svg viewBox="0 0 600 30"><rect x="0" y="8" width="600" height="14" rx="7" fill="var(--g4)"/><rect x="0" y="8" width="${done / total * 600}" height="14" rx="7" fill="var(--c1)"/></svg>` }), HT.rows([['입대일', fmt(s)], ['복무 일수', `${total + 1}일`], ['복무한 날 / 남은 날', `${done}일 / ${Math.max(0, left)}일`], ['일병 진급 (2개월)', fmt(addMonths(s, 2))], ['상병 진급 (8개월)', fmt(addMonths(s, 8))], ['병장 진급 (14개월)', fmt(addMonths(s, 14))]])); return; }
        if (v.mode === 'baby') { const due = addDays(s, 280); const days = Math.floor((today - s) / 864e5); const wk = Math.floor(days / 7), wd = days % 7; const left = Math.round((due - today) / 864e5);
          out.set(HT.kpi('출산 예정일', fmt(due), left > 0 ? `D-${left} · 현재 임신 ${wk}주 ${wd}일` : '예정일이 지났습니다'), HT.rows([['마지막 생리 시작일', fmt(s)], ['임신 확인 가능 (4~5주)', fmt(addDays(s, 28))], ['1차 기형아 검사 (11~13주)', fmt(addDays(s, 77))], ['안정기 진입 (14주)', fmt(addDays(s, 98))], ['정밀 초음파 (20~22주)', fmt(addDays(s, 140))], ['임당 검사 (24~28주)', fmt(addDays(s, 168))], ['출산휴가 시작 가능 (예정일 44일 전)', fmt(addDays(due, -44))], ['만삭 (37주)', fmt(addDays(s, 259))]])); }
      }
      function countWeekends(a, b) { let n = 0; for (let d = new Date(a); d < b; d.setDate(d.getDate() + 1)) if (d.getDay() === 0 || d.getDay() === 6) n++; return n; }
      function addMonths(d, m) { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; }
      calc(f.values());
    }
  }
});
