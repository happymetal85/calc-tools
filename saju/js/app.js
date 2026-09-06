/* 사주 풀이 — 화면 */
(function () {
  'use strict';
  var M = window.MANSE, S = window.SAJU, T = window.TEXT, A = window.ASTRO;
  var $ = function (id) { return document.getElementById(id); };

  var CITIES = [
    ['서울', 126.98], ['부산', 129.08], ['대구', 128.60], ['인천', 126.71], ['광주', 126.85], ['대전', 127.38], ['울산', 129.31], ['세종', 127.29],
    ['수원', 127.03], ['성남', 127.14], ['고양', 126.83], ['용인', 127.18], ['창원', 128.68], ['청주', 127.49], ['전주', 127.15], ['천안', 127.11],
    ['춘천', 127.73], ['원주', 127.92], ['강릉', 128.88], ['포항', 129.36], ['제주', 126.53], ['목포', 126.39], ['여수', 127.66], ['안동', 128.73],
    ['평양', 125.75], ['함흥', 127.54], ['도쿄', 139.69], ['베이징', 116.40], ['상하이', 121.47]
  ];
  var sel = $('city');
  CITIES.forEach(function (c) { var o = document.createElement('option'); o.value = c[1]; o.textContent = c[0]; sel.appendChild(o); });
  var oc = document.createElement('option'); oc.value = 'custom'; oc.textContent = '직접 입력(경도)'; sel.appendChild(oc);
  sel.addEventListener('change', function () {
    if (sel.value === 'custom') { var v = prompt('출생지 경도(동경, 예: 127.0)', '127.0'); var n = parseFloat(v); if (isNaN(n)) { sel.value = CITIES[0][1]; } else { var o = document.createElement('option'); o.value = n; o.textContent = '경도 ' + n + '°E'; sel.insertBefore(o, oc); sel.value = n; } }
  });

  function segVal(id) { return $(id).querySelector('.active').getAttribute('data-v'); }
  function segSet(id, v) { $(id).querySelectorAll('button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-v') === v); }); }
  document.querySelectorAll('.seg').forEach(function (seg) { seg.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) segSet(seg.id, b.getAttribute('data-v')); }); });
  $('unk').addEventListener('change', function () { $('h').disabled = $('mi').disabled = this.checked; });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function gzHtml(gj, cls) { return '<span class="e' + S.STEM_ELEM[gj.stem] + '">' + M.STEMS[gj.stem] + '</span><span class="e' + S.BRANCH_ELEM[gj.branch] + '">' + M.BRANCHES[gj.branch] + '</span>'; }
  function tenName(i) { return S.TEN[i]; }
  // 받침 유무에 따른 조사: josa('겁재','이','가') → 겁재가
  function josa(w, a, b) { var c = w.charCodeAt(w.length - 1); if (c < 0xAC00 || c > 0xD7A3) return w + a; return w + (((c - 0xAC00) % 28) ? a : b); }

  /* ---------- 입력 읽기 ---------- */
  function readInput() {
    var y = +$('y').value, m = +$('m').value, d = +$('d').value;
    if (!y || !m || !d) throw new Error('생년월일을 모두 넣어 주세요.');
    if (y < 1900 || y > 2100) throw new Error('1900년부터 2100년까지만 계산합니다.');
    var cal = segVal('cal');
    var solar = { y: y, m: m, d: d }, lunarIn = null;
    if (cal !== 'solar') {
      var r = M.lunarToSolar(y, m, cal === 'leap', d);
      if (r.error) throw new Error(r.error);
      lunarIn = { y: y, m: m, leap: cal === 'leap', d: d };
      solar = r;
    } else {
      var jd = A.jdFromDate(y, m, d + 0.5), back = A.dateFromJd(jd);
      if (back.m !== m || back.d !== d) throw new Error('없는 날짜입니다.');
    }
    var unk = $('unk').checked;
    var h = +$('h').value, mi = +$('mi').value || 0;
    if (!unk && ($('h').value === '' || h < 0 || h > 23 || mi < 0 || mi > 59)) throw new Error('태어난 시각을 넣거나 "모름"을 선택해 주세요.');
    var corr = $('corr').value;
    var lon = corr === 'none' ? null : parseFloat($('city').value);
    return { gender: segVal('gender'), cal: cal, y: solar.y, m: solar.m, d: solar.d, h: unk ? 12 : h, mi: unk ? 0 : mi, unknownHour: unk, lon: lon, eot: corr === 'eot', dst: $('dst').checked, lateZi: $('zi').value, lunarIn: lunarIn, inY: y, inM: m, inD: d, cityName: $('city').options[$('city').selectedIndex].textContent };
  }

  /* ---------- 렌더 ---------- */
  function render(o) {
    var p = M.pillars(o);
    var r = S.analyze(p, o);
    var ds = r.dayStem, dsT = T.dayStem[ds];
    var h = [];

    // 출생 정보
    var trueT = p.trueTime;
    h.push('<div class="birth">' + (o.gender === 'M' ? '남자' : '여자') + ' · 양력 <b>' + o.y + '년 ' + o.m + '월 ' + o.d + '일' + (o.unknownHour ? '</b> (시각 모름)' : ' ' + pad(o.h) + ':' + pad(o.mi) + '</b>')
      + (p.lunar ? ' · 음력 ' + p.lunar.y + '년 ' + (p.lunar.leap ? '윤' : '') + p.lunar.m + '월 ' + p.lunar.d + '일' : '')
      + (o.lon != null && !o.unknownHour ? ' · ' + esc(o.cityName) + ' 기준 보정 시각 <b>' + pad(trueT.h) + ':' + pad(trueT.mi) + '</b>' : '')
      + '<br>' + M.ANIMALS[p.year.branch] + '띠(' + p.year.hanja + '년) · 절기: ' + p.prevJie.name + '(' + fmtD(p.prevJie.date) + ') ~ ' + p.nextJie.name + '(' + fmtD(p.nextJie.date) + ')'
      + (p.notes.length ? '<br>' + p.notes.map(esc).join(' · ') : '') + (p.ziNote ? '<br>' + esc(p.ziNote) : '') + '</div>');

    // 원국 표 (시 일 월 년 — 오른쪽이 년)
    var cols = r.pillars.slice().reverse();
    var tr = function (label, fn, cls) { return '<tr>' + cols.map(function (pl) { return '<td class="' + (cls || '') + '">' + fn(pl) + '</td>'; }).join('') + '</tr>'; };
    h.push('<h2>사주 원국</h2><div class="won-wrap"><table class="won"><tr>' + cols.map(function (pl) { return '<th>' + pl.pos + '주</th>'; }).join('') + '</tr>');
    h.push(tr('', function (pl) { return pl.stemTen == null ? '<b>일간</b>' : tenName(pl.stemTen); }, 'ten'));
    h.push(tr('', function (pl) { return '<div class="e' + S.STEM_ELEM[pl.gj.stem] + '"><div class="h">' + M.STEMS[pl.gj.stem] + '</div><div class="k">' + M.STEMS_KO[pl.gj.stem] + S.ELEM[S.STEM_ELEM[pl.gj.stem]] + (S.STEM_YANG[pl.gj.stem] ? '(+)' : '(−)') + '</div></div>'; }, 'gz'));
    h.push(tr('', function (pl) { return '<div class="e' + S.BRANCH_ELEM[pl.gj.branch] + '"><div class="h">' + M.BRANCHES[pl.gj.branch] + '</div><div class="k">' + M.BRANCHES_KO[pl.gj.branch] + S.ELEM[S.BRANCH_ELEM[pl.gj.branch]] + (S.BRANCH_YANG[pl.gj.branch] ? '(+)' : '(−)') + '</div></div>'; }, 'gz'));
    h.push(tr('', function (pl) { return tenName(pl.branchTen); }, 'ten'));
    h.push(tr('', function (pl) { return pl.hidden.map(function (x) { return '<span>' + M.STEMS[x.stem] + '<small>' + tenName(x.ten) + '</small></span>'; }).join(' '); }, 'hid'));
    h.push(tr('', function (pl) { return S.STAGE[pl.stage]; }));
    h.push(tr('', function (pl) { var s = r.shinsal.filter(function (x) { return x.pos === pl.pos; }).map(function (x) { return x.name; }); return s.length ? s.join('·') : '–'; }));
    h.push('</table></div><div class="note" style="margin-top:4px">위에서부터 십신(천간) · 천간 · 지지 · 십신(지지 정기) · 지장간 · 12운성(일간 기준) · 신살. 오른쪽이 년주입니다.</div>');

    // 요약
    h.push('<div class="sum">'
      + card('일간', dsT.name + ' ' + dsT.hanja, dsT.img)
      + card('격국', r.gyeok.name, '월지 ' + M.BRANCHES[p.month.branch] + (r.gyeok.transparent ? ' 투출 ' : ' 정기 ') + M.STEMS[r.gyeok.stem])
      + card('신강·신약', r.strength, (r.deukryeong ? '득령 ' : '실령 ') + (r.deukji ? '득지 ' : '실지 ') + (r.deukse ? '득세' : '실세'))
      + card('용신(억부)', r.yong.group + ' · ' + S.ELEM[r.yong.elem] + S.ELEM_HANJA[r.yong.elem], '희신 ' + r.huisin.join('·') + ' / 기신 ' + r.gisin.join('·'))
      + '</div>');

    // 오행 분포
    h.push('<h2>오행 분포</h2><div class="bars">');
    var maxE = Math.max.apply(null, r.elemScore);
    r.elemScore.forEach(function (v, i) {
      h.push('<div class="r' + (i === r.dayElem ? ' me' : '') + '"><span class="n">' + S.ELEM[i] + ' ' + S.ELEM_HANJA[i] + '</span><div class="t"><div class="bar e' + i + '" style="width:' + (v / maxE * 100).toFixed(1) + '%"></div></div><span class="v">' + (v * 100).toFixed(0) + '% · ' + r.elemCount[i] + '자</span></div>');
    });
    h.push('</div><p class="birth">비율은 천간과 지지(지장간 비율 반영)에 자리 가중치(월지 2, 일지 1.5)를 준 값이고, 글자 수는 천간·지지에 드러난 글자를 센 것입니다.</p>');
    var order = r.elemScore.map(function (v, i) { return [v, i]; }).sort(function (a, b) { return b[0] - a[0]; });
    var strongE = order[0][1], weakE = order[4][1];
    h.push('<p><b>가장 강한 기운은 ' + S.ELEM[strongE] + '(' + S.ELEM_HANJA[strongE] + ')</b>입니다. ' + T.elem[strongE].many + '</p>');
    if (r.elemScore[weakE] < 0.08) h.push('<p><b>' + S.ELEM[weakE] + '(' + S.ELEM_HANJA[weakE] + ')이 부족합니다.</b> ' + T.elem[weakE].few + '</p>');
    h.push('<dl class="kv">' + S.ELEM.map(function (e, i) { return '<dt>' + e + ' ' + S.ELEM_HANJA[i] + '</dt><dd>' + T.elem[i].trait + ' · 몸: ' + T.elem[i].organ + '</dd>'; }).join('') + '</dl>');

    // 일간
    h.push('<h2>일간 — ' + dsT.name + ' ' + dsT.hanja + ', ' + dsT.img + '</h2>');
    h.push('<div class="quote"><div class="zh">' + dsT.cheon + '</div><div class="ko">' + dsT.cheonKo + '</div><div class="src">적천수(滴天髓) 통신론</div></div>');
    h.push('<p>' + dsT.body + '</p><h4>맞는 일</h4><p>' + dsT.work + '</p><h4>사람 관계</h4><p>' + dsT.rel + '</p>');
    var seasonIdx = Math.floor(p.monthIdx / 3), seasonName = ['봄', '여름', '가을', '겨울'][seasonIdx];
    h.push('<h4>' + seasonName + '에 태어난 ' + dsT.name + '</h4><p>' + dsT.season[seasonIdx] + '</p>');

    // 일주
    h.push('<h2>일주 — ' + p.day.hanja + ' ' + p.day.ko + '</h2><p>' + T.dayPillar[p.day.hanja] + '</p>');
    h.push('<p>일지 ' + M.BRANCHES[p.day.branch] + '는 일간 기준 <b>' + S.STAGE[r.pillars[2].stage] + '</b>(' + S.STAGE_HANJA[r.pillars[2].stage] + ')이고 지장간은 ' + r.pillars[2].hidden.map(function (x) { return M.STEMS[x.stem] + '(' + tenName(x.ten) + ')'; }).join(', ') + '입니다. 배우자 자리에 ' + josa(tenName(r.pillars[2].branchTen), '이', '가') + ' 있습니다.</p>');

    // 십신
    h.push('<h2>십신 구성</h2>');
    h.push('<div class="tags">' + S.GROUPS.map(function (g, i) { return '<span class="tag' + (r.groupScore[i] >= 0.3 ? ' hi' : '') + '">' + g + ' ' + (r.groupScore[i] * 100).toFixed(0) + '%</span>'; }).join('') + '</div>');
    h.push('<dl class="kv">' + S.TEN.map(function (t, i) { return '<dt>' + t + ' ' + S.TEN_HANJA[i] + '</dt><dd>' + r.tenCount[i] + '개 · ' + T.ten[i].mean + '</dd>'; }).join('') + '</dl>');
    var manyTen = S.TEN.map(function (t, i) { return i; }).filter(function (i) { return r.tenCount[i] >= 2 || r.tenScore[i] >= 0.25; });
    manyTen.forEach(function (i) { h.push('<h4>' + josa(S.TEN[i], '이', '가') + ' 많습니다 (' + r.tenCount[i] + '개, ' + (r.tenScore[i] * 100).toFixed(0) + '%)</h4><p>' + T.ten[i].many + '</p>'); });
    S.GROUPS.forEach(function (g, gi) { if (r.groupScore[gi] < 0.04) { h.push('<h4>' + g + '이 없습니다</h4><p>' + T.ten[gi * 2 + 1].none + ' ' + T.ten[gi * 2].none + '</p>'); } });

    // 격국
    var gk = T.gyeok[r.gyeok.name];
    h.push('<h2>격국 — ' + r.gyeok.name + '</h2><p>' + T.gyeokIntro + '</p>');
    h.push('<div class="quote"><div class="zh">' + gk.quote + '</div><div class="src">' + gk.src + '</div></div><p>' + gk.text + '</p>');

    // 신강약·용신
    h.push('<h2>신강·신약과 용신</h2>');
    h.push('<ul class="list"><li>' + (r.deukryeong ? '<b>득령</b>' : '<b>실령</b>') + ' — 월지 ' + M.BRANCHES[p.month.branch] + '의 정기 ' + M.STEMS[S.HIDDEN[p.month.branch][0]] + '은 일간에게 ' + tenName(S.tenGod(ds, S.HIDDEN[p.month.branch][0])) + '입니다.</li>'
      + '<li>' + (r.deukji ? '<b>득지</b>' : '<b>실지</b>') + ' — 일지 ' + M.BRANCHES[p.day.branch] + '의 정기는 ' + tenName(r.pillars[2].branchTen) + '입니다.</li>'
      + '<li>' + (r.deukse ? '<b>득세</b>' : '<b>실세</b>') + ' — 일간 편(비겁+인성)이 ' + (r.selfPower * 100).toFixed(0) + '%입니다.</li>'
      + '<li><b>통근</b> — ' + (r.roots.length ? r.roots.join('·') + '지에 일간과 같은 오행이 숨어 있어 뿌리가 됩니다.' : '지지에 일간의 뿌리가 없습니다.') + (r.selfHap ? ' 지지가 ' + r.selfHap.slice(0, 3).map(function (b) { return M.BRANCHES[b]; }).join('') + ' 국을 이루어 일간 오행이 크게 힘을 얻습니다.' : '') + '</li></ul>');
    h.push('<p><b>' + r.strength + '</b>: ' + T.strength[r.strength] + '</p>');
    h.push('<h4>억부 용신 — ' + r.yong.group + ' (' + S.ELEM[r.yong.elem] + S.ELEM_HANJA[r.yong.elem] + ')</h4><p>' + r.yong.why + '. 희신은 ' + r.huisin.map(function (g) { return g + '(' + S.ELEM_HANJA[r.groupElem[g]] + ')'; }).join('·') + ', 기신은 ' + r.gisin.map(function (g) { return g + '(' + S.ELEM_HANJA[r.groupElem[g]] + ')'; }).join('·') + '입니다.</p>');
    h.push('<p>' + T.yongHelp[r.yong.elem] + '</p>');
    var johu = T.johu[ds][p.month.branch];
    h.push('<h4>조후 용신 — 궁통보감 취용: ' + johu.split('').join(' · ') + '</h4><p>' + dsT.season[seasonIdx] + ' ' + T.johuNote + '</p>');

    // 12운성
    h.push('<h2>12운성</h2><dl class="kv">' + r.pillars.map(function (pl) { return '<dt>' + pl.pos + '지 ' + M.BRANCHES[pl.gj.branch] + '</dt><dd><b>' + S.STAGE[pl.stage] + '</b> — ' + T.stage[pl.stage].split(': ')[1] + '</dd>'; }).join('') + '</dl>');
    h.push('<p>일간 ' + M.STEMS[ds] + '이 각 지지에서 어떤 생애 단계에 있는지를 봅니다. 년지는 초년·조상, 월지는 청년·부모·사회, 일지는 중년·배우자·자신, 시지는 말년·자녀를 뜻합니다.</p>');

    // 신살
    h.push('<h2>신살</h2>');
    if (r.shinsal.length) {
      var seen = {};
      h.push('<div class="tags">' + r.shinsal.map(function (s) { return '<span class="tag">' + s.name + ' <small>' + s.pos + '지 ' + M.BRANCHES[s.branch] + '</small></span>'; }).join('') + '</div><ul class="list">');
      r.shinsal.forEach(function (s) { if (seen[s.name]) return; seen[s.name] = 1; h.push('<li><b>' + s.name + '</b> — ' + T.shinsal[s.name] + '</li>'); });
      h.push('</ul>');
    } else h.push('<p>두드러진 신살이 없습니다.</p>');
    h.push('<p>공망(일주 기준): ' + r.gongmang.map(function (b) { return M.BRANCHES[b]; }).join('·') + '</p>');

    // 합충
    h.push('<h2>합·충·형·파·해</h2>');
    if (r.relations.length) {
      var seenK = {};
      h.push('<div class="tags">' + r.relations.map(function (x) { return '<span class="tag gz">' + x.text + (x.a ? ' <small>' + x.a + '–' + x.b + (x.adjacent ? '' : ' (떨어짐)') + '</small>' : '') + '</span>'; }).join('') + '</div><ul class="list">');
      r.relations.forEach(function (x) { if (seenK[x.kind]) return; seenK[x.kind] = 1; h.push('<li><b>' + x.kind + '</b> — ' + T.relation[x.kind] + '</li>'); });
      h.push('</ul><p>붙어 있는 글자끼리의 합·충이 떨어진 것보다 힘이 큽니다. 일주와 얽힌 것은 자신과 배우자에게 직접 작용합니다.</p>');
    } else h.push('<p>원국 안에 두드러진 합·충이 없습니다. 안정된 구조입니다.</p>');

    // 대운
    var du = r.daeun;
    h.push('<h2>대운 — ' + (du.forward ? '순행' : '역행') + ', 대운수 ' + du.num + '</h2><p>' + T.daeunIntro + '</p>');
    h.push('<p>' + (o.gender === 'M' ? '남자' : '여자') + '에 년간 ' + M.STEMS[p.year.stem] + '(' + (S.STEM_YANG[p.year.stem] ? '양' : '음') + ')이라 ' + (du.forward ? '순행' : '역행') + '합니다. 생일에서 ' + du.refJie.name + '(' + fmtD(du.refJie.date) + ')까지 ' + du.days.toFixed(1) + '일 → ' + Math.floor(du.yearsExact) + '년 ' + du.months + '개월 → 대운수 <b>' + du.num + '</b>. 만 ' + du.num + '세(' + (o.y + du.num) + '년)부터 첫 대운이 시작됩니다.</p>');
    h.push('<div class="scroll-x"><table class="grid"><tr><th>대운</th><th>나이(만)</th><th>기간</th><th>간지</th><th>천간</th><th>지지</th><th>12운성</th><th>흐름</th></tr>');
    du.list.forEach(function (d) {
      h.push('<tr' + (r.currentDaeun && r.currentDaeun.n === d.n ? ' class="now"' : '') + '><td>' + d.n + '</td><td>' + d.startAge + '~' + d.endAge + '</td><td>' + d.startYear + '~' + (d.startYear + 9) + '</td><td class="gz">' + gzHtml(d.gj) + '</td><td>' + tenName(d.stemTen) + '</td><td>' + tenName(d.branchTen) + '</td><td>' + S.STAGE[d.stage] + '</td><td>' + luckMark(r, d.gj) + '</td></tr>');
    });
    h.push('</table></div><p class="birth">흐름: ● 용신·희신 운, ▲ 기신 운, ○ 엇갈림. 천간·지지의 오행을 억부 용신과 견준 것입니다.</p>');
    if (r.currentDaeun) {
      var cd = r.currentDaeun;
      h.push('<h4>지금 대운 — ' + cd.gj.hanja + ' (만 ' + cd.startAge + '~' + cd.endAge + '세)</h4>');
      h.push('<p>' + T.daeunStrong[luckKind(r, cd.gj)] + '</p><p>천간 ' + M.STEMS[cd.gj.stem] + '(' + tenName(cd.stemTen) + '): ' + T.ten[cd.stemTen].luck + '</p><p>지지 ' + M.BRANCHES[cd.gj.branch] + '(' + tenName(cd.branchTen) + ', ' + S.STAGE[cd.stage] + '): ' + T.ten[cd.branchTen].luck + '</p>');
    } else if (r.age < du.num) h.push('<p>아직 첫 대운 전입니다. 이 시기는 월주(' + p.month.hanja + ')의 기운으로 봅니다.</p>');

    // 세운
    h.push('<h2>세운 — 해마다의 흐름</h2><div class="scroll-x"><table class="grid"><tr><th>연도</th><th>나이(만)</th><th>간지</th><th>천간</th><th>지지</th><th>12운성</th><th>흐름</th></tr>');
    r.seun.forEach(function (s) {
      h.push('<tr' + (s.current ? ' class="now"' : '') + '><td>' + s.year + '</td><td>' + s.age + '</td><td class="gz">' + gzHtml(s.gj) + '</td><td>' + tenName(s.stemTen) + '</td><td>' + tenName(s.branchTen) + '</td><td>' + S.STAGE[s.stage] + '</td><td>' + luckMark(r, s.gj) + '</td></tr>');
    });
    h.push('</table></div>');
    var cur = r.seun.filter(function (s) { return s.current; })[0];
    if (cur) {
      h.push('<h4>올해 ' + cur.year + '년 ' + cur.gj.hanja + '년</h4><p>' + T.daeunStrong[luckKind(r, cur.gj)].replace('이 대운은', '올해는') + '</p><p>' + T.ten[cur.stemTen].luck + ' ' + T.ten[cur.branchTen].luck + '</p>');
      var clash = [];
      r.pillars.forEach(function (pl) { if ((pl.gj.branch + 6) % 12 === cur.gj.branch) clash.push(pl.pos + '지 ' + M.BRANCHES[pl.gj.branch]); });
      if (clash.length) h.push('<p>올해 지지 ' + M.BRANCHES[cur.gj.branch] + '가 원국의 ' + clash.join(', ') + '와 충합니다. 그 자리의 변동(이동·이별·건강)을 살피세요.</p>');
    }

    // 출처·유의
    h.push('<h2>출처와 유의할 점</h2><ul class="list">' + T.sources.map(function (s) { return '<li><b>' + s.name + '</b> — ' + s.note + '</li>'; }).join('') + '</ul>');
    h.push('<div class="note"><ul>' + T.caveat.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul></div>');

    $('out').innerHTML = h.join('');
    sectionize();
  }

  /* 부드럽게 스크롤하되, 브라우저가 무시하면 그냥 이동한다 */
  function scrollToEl(el) {
    var y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - 8), from = window.scrollY;
    try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, y); }
    setTimeout(function () { if (Math.abs(window.scrollY - from) < 4) window.scrollTo(0, y); }, 400);
  }

  /* h2 단위로 접었다 펴는 섹션과 목차를 만든다 — 좁은 화면에서 첫 섹션만 펼쳐 둔다 */
  function sectionize() {
    var out = $('out');
    var heads = out.querySelectorAll(':scope > h2');
    if (!heads.length) return;
    var lead = document.createElement('div'), secs = [], cur = null;
    Array.prototype.slice.call(out.childNodes).forEach(function (n) {
      if (n.nodeType === 1 && n.tagName === 'H2') { cur = { h: n, body: document.createElement('div') }; secs.push(cur); }
      else if (cur) cur.body.appendChild(n);
      else lead.appendChild(n);
    });
    var narrow = window.matchMedia('(max-width: 900px)').matches;
    var toc = document.createElement('nav');
    toc.className = 'toc';
    toc.setAttribute('aria-label', '풀이 목차');
    out.innerHTML = '';
    out.appendChild(lead);
    out.appendChild(toc);
    secs.forEach(function (s, i) {
      var sec = document.createElement('section');
      sec.className = 'sec' + (!narrow || i === 0 ? ' open' : '');
      sec.id = 'sec' + i;
      s.h.className = 'sec-h';
      s.h.setAttribute('role', 'button');
      s.h.setAttribute('tabindex', '0');
      s.h.setAttribute('aria-expanded', sec.className.indexOf('open') >= 0 ? 'true' : 'false');
      s.body.className = 'sec-body';
      sec.appendChild(s.h); sec.appendChild(s.body);
      out.appendChild(sec);
      var a = document.createElement('a');
      a.className = 'toc-a'; a.href = '#sec' + i;
      a.textContent = s.h.textContent.split('—')[0].trim();
      toc.appendChild(a);
    });
    function toggle(sec, force) {
      var open = force === undefined ? !sec.classList.contains('open') : force;
      sec.classList.toggle('open', open);
      sec.querySelector('.sec-h').setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    out.querySelectorAll('.sec-h').forEach(function (hh) {
      hh.addEventListener('click', function () { toggle(hh.parentNode); });
      hh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(hh.parentNode); } });
    });
    toc.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      var sec = out.querySelector(a.getAttribute('href'));
      if (!sec) return;
      toggle(sec, true);
      scrollToEl(sec);
    });
    window.addEventListener('beforeprint', function () { out.querySelectorAll('.sec').forEach(function (x) { toggle(x, true); }); });
  }
  function card(l, v, s) { return '<div class="k"><div class="l">' + l + '</div><div class="v">' + v + '</div><div class="s">' + s + '</div></div>'; }
  function fmtD(d) { return d.m + '/' + d.d + ' ' + pad(d.h) + ':' + pad(d.mi); }
  function luckKind(r, gj) {
    var good = [r.yong.elem].concat(r.huisinElem), bad = r.gisinElem;
    var es = S.STEM_ELEM[gj.stem], eb = S.BRANCH_ELEM[gj.branch];
    var gs = good.indexOf(es) >= 0, gb = good.indexOf(eb) >= 0, bs = bad.indexOf(es) >= 0, bb = bad.indexOf(eb) >= 0;
    if (gs && gb) return 'good'; if (bs && bb) return 'bad'; return 'mixed';
  }
  function luckMark(r, gj) { var k = luckKind(r, gj); return k === 'good' ? '● 길' : k === 'bad' ? '▲ 주의' : '○ 엇갈림'; }

  /* ---------- 실행·공유 ---------- */
  function run() {
    $('err').hidden = true;
    try {
      var o = readInput();
      render(o);
      var q = new URLSearchParams({ g: o.gender, cal: o.cal, y: o.inY, m: o.inM, d: o.inD, h: o.unknownHour ? '' : o.h, mi: o.unknownHour ? '' : o.mi, unk: o.unknownHour ? 1 : 0, city: $('city').value, corr: $('corr').value, zi: $('zi').value, dst: $('dst').checked ? 1 : 0 });
      history.replaceState(null, '', '?' + q.toString());
      if (window.innerWidth < 900) scrollToEl($('out'));
    } catch (e) { $('err').textContent = e.message; $('err').hidden = false; }
  }
  $('go').addEventListener('click', run);
  ['y', 'm', 'd', 'h', 'mi'].forEach(function (id) { $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); }); });
  $('print').addEventListener('click', function () { window.print(); });
  $('share').addEventListener('click', function () {
    var url = location.href;
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { $('share').textContent = '복사했습니다'; setTimeout(function () { $('share').textContent = '링크 복사'; }, 1500); });
    else prompt('주소를 복사하세요', url);
  });

  // URL 복원
  var q = new URLSearchParams(location.search);
  if (q.get('y')) {
    segSet('gender', q.get('g') || 'M'); segSet('cal', q.get('cal') || 'solar');
    $('y').value = q.get('y'); $('m').value = q.get('m'); $('d').value = q.get('d');
    $('h').value = q.get('h') || ''; $('mi').value = q.get('mi') || '';
    $('unk').checked = q.get('unk') === '1'; $('h').disabled = $('mi').disabled = $('unk').checked;
    if (q.get('city')) { var cv = q.get('city'); if (!Array.prototype.some.call(sel.options, function (op) { return op.value === cv; })) { var o2 = document.createElement('option'); o2.value = cv; o2.textContent = '경도 ' + cv + '°E'; sel.insertBefore(o2, oc); } sel.value = cv; }
    if (q.get('corr')) $('corr').value = q.get('corr');
    if (q.get('zi')) $('zi').value = q.get('zi');
    $('dst').checked = q.get('dst') !== '0';
    run();
  }
})();
