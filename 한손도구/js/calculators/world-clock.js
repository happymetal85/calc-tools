HT.register({
  id: 'world-clock', cat: '유용한도구', order: 3, name: '시계 / 스톱워치 / 세계시간', keywords: '시계 스톱워치 세계시간 타이머 랩',
  desc: '현재 시각, 랩 기록이 가능한 스톱워치, 세계 15개 도시의 현지 시간을 보여줍니다. 서머타임은 자동 반영됩니다.',
  render(root) {
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap); const body = HT.el('div'); let timer = null;
    const CITIES = [['서울', 'Asia/Seoul'], ['도쿄', 'Asia/Tokyo'], ['베이징', 'Asia/Shanghai'], ['싱가포르', 'Asia/Singapore'], ['두바이', 'Asia/Dubai'], ['뭄바이', 'Asia/Kolkata'], ['런던', 'Europe/London'], ['파리', 'Europe/Paris'], ['베를린', 'Europe/Berlin'], ['모스크바', 'Europe/Moscow'], ['뉴욕', 'America/New_York'], ['시카고', 'America/Chicago'], ['로스앤젤레스', 'America/Los_Angeles'], ['상파울루', 'America/Sao_Paulo'], ['시드니', 'Australia/Sydney']];
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    // 스톱워치 상태는 탭을 바꿔도 유지
    const sw = { running: false, start: 0, acc: 0, laps: [] };
    HT.tabs(wrap, [['clock', '시계'], ['sw', '스톱워치'], ['world', '세계시간']], k => { stop(); body.innerHTML = ''; if (k === 'clock') clock(); else if (k === 'sw') stopwatch(); else world(); });
    wrap.append(body);
    function clock() {
      const t = HT.el('div', { class: 'clock' }), d = HT.el('div', { class: 'clock-date' }); body.append(t, d);
      const tick = () => { const n = new Date(); t.textContent = n.toLocaleTimeString('ko-KR', { hour12: false }); d.textContent = n.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) + ' · ' + Intl.DateTimeFormat().resolvedOptions().timeZone; };
      tick(); timer = setInterval(tick, 500);
    }
    function fmtMs(ms) { const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1000), c = Math.floor(ms % 1000 / 10); return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0'); }
    function stopwatch() {
      const disp = HT.el('div', { class: 'clock' }); const btns = HT.el('div', { class: 'btns', style: 'justify-content:center' }); const lapBox = HT.el('div'); body.append(disp, btns, lapBox);
      const bStart = HT.el('button', { class: 'btn primary', type: 'button' }), bLap = HT.el('button', { class: 'btn', type: 'button' }, '랩'), bReset = HT.el('button', { class: 'btn', type: 'button' }, '초기화'); btns.append(bStart, bLap, bReset);
      const now = () => sw.acc + (sw.running ? performance.now() - sw.start : 0);
      const draw = () => { disp.textContent = fmtMs(now()); bStart.textContent = sw.running ? '정지' : (sw.acc ? '계속' : '시작'); bLap.disabled = !sw.running; };
      const drawLaps = () => { lapBox.innerHTML = ''; if (!sw.laps.length) return; const best = Math.min(...sw.laps.map(l => l.split)); lapBox.append(HT.table(['랩', '구간 기록', '누적 시간'], sw.laps.map((l, i) => [i + 1, fmtMs(l.split), fmtMs(l.total)]).reverse(), { right: [1, 2], hi: r => sw.laps.length > 1 && fmtMs(best) === r[1] })); };
      bStart.addEventListener('click', () => { if (sw.running) { sw.acc = now(); sw.running = false; } else { sw.start = performance.now(); sw.running = true; } draw(); });
      bLap.addEventListener('click', () => { const t = now(); const prev = sw.laps.length ? sw.laps[sw.laps.length - 1].total : 0; sw.laps.push({ total: t, split: t - prev }); drawLaps(); });
      bReset.addEventListener('click', () => { sw.running = false; sw.acc = 0; sw.laps = []; draw(); drawLaps(); });
      draw(); drawLaps(); timer = setInterval(draw, 31);
    }
    function world() {
      const grid = HT.el('div', { class: 'city-grid' }); body.append(grid);
      const cells = CITIES.map(([n, tz]) => { const c = HT.el('div', { class: 'city' }, [HT.el('div', { class: 'n' }, n), HT.el('div', { class: 't' }), HT.el('div', { class: 'd' })]); grid.append(c); return [c, tz]; });
      const tick = () => { const now = new Date(); const seoulOff = tzOffset(now, 'Asia/Seoul'); cells.forEach(([c, tz]) => { c.children[1].textContent = now.toLocaleTimeString('ko-KR', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }); const off = tzOffset(now, tz); const diff = (off - seoulOff) / 60; c.children[2].textContent = now.toLocaleDateString('ko-KR', { timeZone: tz, month: 'short', day: 'numeric', weekday: 'short' }) + ` · 서울 ${diff === 0 ? '기준' : (diff > 0 ? '+' : '') + diff + '시간'}`; }); };
      tick(); timer = setInterval(tick, 1000);
    }
    function tzOffset(date, tz) { const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date); const g = t => parseInt(p.find(x => x.type === t).value, 10); const asUTC = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second')); return (asUTC - date.getTime()) / 6e4 + 0; }
    return stop;
  }
});
