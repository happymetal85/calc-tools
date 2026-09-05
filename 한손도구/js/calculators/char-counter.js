/* 글자수 세기 — 공백 포함/제외, 바이트(UTF-8·EUC-KR 2바이트), 단어·문장·줄, 원고지, 자소서 한도 */
HT.register({
  id: 'char-counter', cat: '유용한도구', order: 0.05, original: false, name: '글자수 세기', keywords: '글자수 세기 자소서 공백 제외 바이트 원고지 단어 수',
  desc: '자기소개서·SNS·과제용 글자수를 셉니다. 공백 포함/제외, 바이트(UTF-8과 한글 2바이트 기준), 단어·문장·줄 수, 원고지 매수를 실시간으로 보여주고 글자 한도를 넘으면 표시합니다.',
  note: '바이트는 두 가지로 보여줍니다. 대부분의 채용 사이트는 한글 1자를 2바이트(영문·숫자·공백 1바이트)로 세고, 웹 표준 UTF-8은 한글 1자가 3바이트입니다. 원고지는 200자 기준입니다. 입력한 글은 브라우저를 벗어나지 않으며, 새로고침해도 남도록 이 브라우저에 저장됩니다.',
  render(root) {
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap);
    const ta = HT.el('textarea', { class: 'out', placeholder: '여기에 글을 붙여 넣으세요', style: 'min-height:260px;font-family:inherit;font-size:15px' });
    try { ta.value = localStorage.getItem('ht_charcount') || ''; } catch (e) {}
    const limitIn = HT.el('input', { type: 'number', value: 500, min: 0, style: 'width:100px;padding:6px 8px;border:1px solid var(--line);border-radius:4px' });
    const limitMode = HT.el('select', { style: 'padding:6px 8px;border:1px solid var(--line);border-radius:4px' }); [['incl', '공백 포함'], ['excl', '공백 제외'], ['byte2', '바이트 (한글 2)']].forEach(([v, l]) => limitMode.append(HT.el('option', { value: v }, l)));
    const stats = HT.el('div', { class: 'kpis' }); const badge = HT.el('div', { style: 'margin:8px 0' }); const detail = HT.el('div');
    const clear = HT.el('button', { class: 'btn sm', type: 'button' }, '지우기'); clear.addEventListener('click', () => { ta.value = ''; update(); ta.focus(); });
    const copy = HT.el('button', { class: 'btn sm', type: 'button' }, '공백 정리해서 복사'); copy.addEventListener('click', () => { navigator.clipboard?.writeText(ta.value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()); copy.textContent = '복사됨'; setTimeout(() => copy.textContent = '공백 정리해서 복사', 1500); });
    wrap.append(HT.el('h3', {}, '글자수 세기'), ta, HT.el('div', { class: 'btns', style: 'align-items:center' }, [HT.el('span', { class: 'help' }, '한도'), limitIn, limitMode, clear, copy]), badge, stats, detail);
    function bytes2(s) { let b = 0; for (const ch of s) b += ch.charCodeAt(0) > 127 ? 2 : 1; return b; }
    function update() {
      const s = ta.value; try { localStorage.setItem('ht_charcount', s); } catch (e) {}
      const incl = [...s].length, excl = [...s.replace(/\s/g, '')].length, noNl = [...s.replace(/\n/g, '')].length; const b2 = bytes2(s), b3 = new TextEncoder().encode(s).length;
      const words = s.trim() ? s.trim().split(/\s+/).length : 0; const lines = s ? s.split('\n').length : 0; const sents = (s.match(/[.!?。？！]+(\s|$)/g) || []).length; const paras = s.trim() ? s.trim().split(/\n\s*\n/).length : 0;
      const limit = HT.num(limitIn.value); const cur = limitMode.value === 'incl' ? incl : limitMode.value === 'excl' ? excl : b2; const over = limit > 0 && cur > limit;
      stats.innerHTML = ''; stats.append(HT.kpi('공백 포함', HT.fmt(incl) + '자', `줄바꿈 제외 ${HT.fmt(noNl)}자`), HT.kpi('공백 제외', HT.fmt(excl) + '자'), HT.kpi('바이트 (한글 2)', HT.fmt(b2) + 'B', `UTF-8 ${HT.fmt(b3)}B`), HT.kpi('단어 · 문장 · 줄', `${HT.fmt(words)} · ${HT.fmt(sents)} · ${HT.fmt(lines)}`, `문단 ${paras} · 원고지 ${HT.fmt(Math.ceil(incl / 200))}매`));
      badge.innerHTML = ''; if (limit > 0) badge.append(HT.badge(over ? `한도 ${HT.fmt(limit)} 초과 — ${HT.fmt(cur - limit)} 줄여야 함` : `한도 ${HT.fmt(limit)} 중 ${HT.fmt(cur)} (${HT.fmt(limit - cur)} 남음)`, over ? 'danger' : cur > limit * .9 ? 'warn' : 'ok'));
      const freq = {}; for (const ch of s.replace(/\s/g, '')) freq[ch] = (freq[ch] || 0) + 1; const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
      detail.innerHTML = ''; if (top.length) detail.append(HT.el('div', { class: 'help', style: 'margin-top:8px' }, '자주 쓴 글자: ' + top.map(([c, n]) => `${c} ${n}`).join(' · ')));
    }
    ta.addEventListener('input', update); limitIn.addEventListener('input', update); limitMode.addEventListener('change', update); update();
  }
});
