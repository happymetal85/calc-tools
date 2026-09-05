/* 사주 분석 — 십신·지장간·12운성·신살·합충·오행 강약·격국·용신·대운·세운
   틀은 자평(子平) 명리의 통설을 따른다. 출전은 text.js 해설에 적었다.
*/
(function (root) {
  'use strict';
  var M = root.MANSE;

  var ELEM = ['목', '화', '토', '금', '수'];
  var ELEM_HANJA = ['木', '火', '土', '金', '水'];
  var STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var STEM_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  var BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var BRANCH_YANG = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
  // 지장간(정기·중기·여기 순)
  var HIDDEN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
  var HIDDEN_W = { 1: [1], 2: [0.7, 0.3], 3: [0.6, 0.3, 0.1] };

  var TEN = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  var TEN_HANJA = ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '正印'];
  var TEN_GROUP = ['비겁', '비겁', '식상', '식상', '재성', '재성', '관성', '관성', '인성', '인성'];
  var GROUPS = ['비겁', '식상', '재성', '관성', '인성'];

  function tenGod(dayStem, other) {
    var ed = STEM_ELEM[dayStem], eo = STEM_ELEM[other], same = STEM_YANG[dayStem] === STEM_YANG[other];
    var rel = (eo - ed + 5) % 5; // 0 같음, 1 내가 생함, 2 내가 극함, 3 나를 극함, 4 나를 생함
    var base = [0, 2, 4, 6, 8][rel];
    return base + (same ? 0 : 1);
  }
  function tenGodBranch(dayStem, branch) { return tenGod(dayStem, HIDDEN[branch][0]); }

  /* 12운성 */
  var STAGE = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
  var STAGE_HANJA = ['長生', '沐浴', '冠帶', '建祿', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'];
  var STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
  function stage12(stem, branch) {
    var s = STAGE_START[stem];
    var d = STEM_YANG[stem] ? (branch - s + 12) % 12 : (s - branch + 12) % 12;
    return d;
  }

  /* 신살 */
  var SAMHAP = { // 삼합 국 기준(년지·일지) → 도화·역마·화개
    0: [9, 2, 4], 4: [9, 2, 4], 8: [9, 2, 4],   // 申子辰 → 酉 寅 辰
    2: [3, 8, 10], 6: [3, 8, 10], 10: [3, 8, 10], // 寅午戌 → 卯 申 戌
    5: [6, 11, 1], 9: [6, 11, 1], 1: [6, 11, 1],  // 巳酉丑 → 午 亥 丑
    11: [0, 5, 7], 3: [0, 5, 7], 7: [0, 5, 7]     // 亥卯未 → 子 巳 未
  };
  var CHEONEUL = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
  var MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
  var YANGIN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
  var GOEGANG = ['庚辰', '庚戌', '壬辰', '壬戌', '戊戌'];
  var BAEKHO = ['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑'];
  var HONGYEOM = [6, 6, 2, 7, 4, 4, 10, 9, 0, 8]; // 홍염살(일간 기준 지지)
  var GUIMUN = { 0: 9, 1: 6, 2: 7, 3: 8, 4: 11, 5: 10, 6: 1, 7: 2, 8: 3, 9: 0, 10: 5, 11: 4 }; // 귀문관살 짝

  function gongmang(gj) { var b = gj.branch, s = gj.stem; return [(b - s + 10) % 12, (b - s + 11) % 12]; }

  /* 합충형파해 */
  var STEM_HAP = [[0, 5, 2], [1, 6, 3], [2, 7, 4], [3, 8, 0], [4, 9, 1]]; // [a,b,화한 오행]
  var STEM_CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9]];
  var YUKHAP = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
  var SAMHAP_SET = [[8, 0, 4, 4], [2, 6, 10, 1], [5, 9, 1, 3], [11, 3, 7, 0]]; // 세 지지 + 국 오행
  var BANGHAP = [[2, 3, 4, 0], [5, 6, 7, 1], [8, 9, 10, 3], [11, 0, 1, 4]];
  var CHUNG = [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]];
  var HYEONG = [[2, 5, '무은지형'], [5, 8, '무은지형'], [2, 8, '무은지형'], [1, 10, '지세지형'], [10, 7, '지세지형'], [1, 7, '지세지형'], [0, 3, '무례지형']];
  var JAHYEONG = [4, 6, 9, 11];
  var PA = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [10, 7]];
  var HAE = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];

  var POS = ['년', '월', '일', '시'];

  function analyze(p, o) {
    var pillars = [p.year, p.month, p.day, p.hour].filter(Boolean);
    var posNames = p.hour ? POS : POS.slice(0, 3);
    var ds = p.day.stem;
    var res = { dayStem: ds, dayElem: STEM_ELEM[ds], dayYang: STEM_YANG[ds], pillars: [] };

    // 기둥별 정보
    pillars.forEach(function (gj, i) {
      var hid = HIDDEN[gj.branch];
      res.pillars.push({
        pos: posNames[i], gj: gj,
        stemTen: i === 2 ? null : tenGod(ds, gj.stem),
        branchTen: tenGodBranch(ds, gj.branch),
        hidden: hid.map(function (s) { return { stem: s, ten: tenGod(ds, s) }; }),
        stage: stage12(ds, gj.branch),
        selfStage: stage12(gj.stem, gj.branch) // 기둥 자체(자좌)
      });
    });

    // 오행 점수: 천간 1.0(월간 1.2), 지지는 지장간 비율 × 자리 가중(년1 월2 일1.5 시1)
    var score = [0, 0, 0, 0, 0], tenScore = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var stemW = [1.0, 1.2, 1.0, 1.0], branchW = [1.0, 2.0, 1.5, 1.0];
    pillars.forEach(function (gj, i) {
      score[STEM_ELEM[gj.stem]] += stemW[i];
      if (i !== 2) tenScore[tenGod(ds, gj.stem)] += stemW[i];
      var hid = HIDDEN[gj.branch], w = HIDDEN_W[hid.length];
      hid.forEach(function (s, k) { score[STEM_ELEM[s]] += branchW[i] * w[k]; tenScore[tenGod(ds, s)] += branchW[i] * w[k]; });
    });
    var total = score.reduce(function (a, b) { return a + b; }, 0);
    res.elemScore = score.map(function (v) { return v / total; });
    res.elemCount = [0, 0, 0, 0, 0];
    pillars.forEach(function (gj) { res.elemCount[STEM_ELEM[gj.stem]]++; res.elemCount[BRANCH_ELEM[gj.branch]]++; });
    var tenTotal = tenScore.reduce(function (a, b) { return a + b; }, 0);
    res.tenScore = tenScore.map(function (v) { return v / tenTotal; });
    res.groupScore = GROUPS.map(function (g, gi) { return res.tenScore[gi * 2] + res.tenScore[gi * 2 + 1]; });
    // 십신 개수(천간 + 지지 정기)
    res.tenCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    res.pillars.forEach(function (pl) { if (pl.stemTen != null) res.tenCount[pl.stemTen]++; res.tenCount[pl.branchTen]++; });

    // 신강·신약 — 득령·득지·득세
    var monthMain = HIDDEN[p.month.branch][0];
    var helps = function (s) { var t = tenGod(ds, s); return t <= 1 || t >= 8; };
    res.deukryeong = helps(monthMain);
    res.deukji = helps(HIDDEN[p.day.branch][0]);
    var selfPower = res.groupScore[0] + res.groupScore[4];
    res.deukse = selfPower >= 0.5;
    res.selfPower = selfPower;
    var strengthScore = selfPower + (res.deukryeong ? 0.12 : -0.12) + (res.deukji ? 0.05 : -0.05);
    // 통근: 지지 지장간에 일간과 같은 오행이 있으면 뿌리로 본다 (월지 0.08 · 일지 0.06 · 년시 0.03)
    var rootW = [0.03, 0.08, 0.06, 0.03], roots = [];
    pillars.forEach(function (gj, i) { if (HIDDEN[gj.branch].some(function (s) { return STEM_ELEM[s] === STEM_ELEM[ds]; })) { strengthScore += rootW[i]; roots.push(POS[i]); } });
    res.roots = roots;
    // 방합·삼합이 일간 오행의 국을 이루면 크게 힘을 얻는다
    var brs = pillars.map(function (gj) { return gj.branch; });
    var selfHap = null;
    SAMHAP_SET.concat(BANGHAP).forEach(function (s) { if (s[3] === STEM_ELEM[ds] && brs.indexOf(s[0]) >= 0 && brs.indexOf(s[1]) >= 0 && brs.indexOf(s[2]) >= 0) selfHap = s; });
    if (selfHap) strengthScore += 0.12;
    res.selfHap = selfHap;
    res.strengthScore = strengthScore;
    res.strength = strengthScore >= 0.72 ? '태강' : strengthScore >= 0.55 ? '신강' : strengthScore >= 0.45 ? '중화' : strengthScore >= 0.3 ? '신약' : '태약';
    res.isStrong = strengthScore >= 0.5;

    // 격국 — 월지 정기 십신(월간에 투출한 지장간 우선)
    var monthHidden = HIDDEN[p.month.branch];
    var transparent = null;
    monthHidden.forEach(function (s) { if (transparent == null && pillars.some(function (gj, i) { return i !== 2 && gj.stem === s; })) transparent = s; });
    var gyeokStem = transparent != null ? transparent : monthHidden[0];
    var gyeokTen = tenGod(ds, gyeokStem);
    var gyeokName;
    if (gyeokTen === 0) gyeokName = '건록격';
    else if (gyeokTen === 1) gyeokName = STEM_YANG[ds] ? '양인격' : '월겁격';
    else gyeokName = TEN[gyeokTen] + '격';
    res.gyeok = { name: gyeokName, ten: gyeokTen, stem: gyeokStem, transparent: transparent != null };

    // 용신(억부) — 신강이면 설기·극제, 신약이면 생조
    var g = res.groupScore;
    var yong;
    if (res.isStrong) {
      // 인성 과다면 재성, 비겁 과다면 관성·식상 중 약한 쪽을 채움
      if (g[4] > g[0]) yong = { group: '재성', why: '인성이 많아 일간을 살찌우니 재성으로 인성을 누른다' };
      else if (g[1] >= g[3] && g[1] >= g[2] && g[2] >= 0.05) yong = { group: '재성', why: '일간이 튼튼한데 식상이 이미 왕하니, 식상이 낳는 재성으로 기운을 흘려보낸다(식상생재)' };
      else if (g[3] >= g[1] && g[3] >= g[2]) yong = { group: '관성', why: '비겁이 많으니 관성으로 다스린다' };
      else if (g[2] >= g[1]) yong = { group: '재성', why: '비겁이 많으니 재성을 써서 힘을 쓸 곳을 준다' };
      else yong = { group: '식상', why: '비겁이 많으니 식상으로 기운을 흘려보낸다' };
      // 후보가 원국에 없으면 대체
      var gi = GROUPS.indexOf(yong.group);
      if (g[gi] < 0.05) { var alt = [1, 3, 2].filter(function (x) { return x !== gi; }).sort(function (a, b) { return g[b] - g[a]; })[0]; yong = { group: GROUPS[alt], why: yong.why + '. 다만 원국에 그 기운이 없어 있는 것 가운데 ' + GROUPS[alt] + '을 쓴다' }; }
      res.huisin = ['식상', '재성', '관성'].filter(function (x) { return x !== yong.group; });
      res.gisin = ['비겁', '인성'];
    } else {
      if (g[3] > g[1] && g[3] > g[2]) yong = { group: '인성', why: '관살이 강해 일간을 누르니 인성으로 통관해 살을 인성으로 바꾼다' };
      else if (g[1] > g[2]) yong = { group: '인성', why: '식상이 많아 기운이 새니 인성으로 식상을 막고 일간을 돕는다' };
      else yong = { group: '비겁', why: '재성이 많아 일간이 지치니 비겁으로 재를 나눠 든다' };
      res.huisin = ['비겁', '인성'].filter(function (x) { return x !== yong.group; });
      res.gisin = ['식상', '재성', '관성'];
    }
    // 용신 오행
    var groupElem = { '비겁': STEM_ELEM[ds], '식상': (STEM_ELEM[ds] + 1) % 5, '재성': (STEM_ELEM[ds] + 2) % 5, '관성': (STEM_ELEM[ds] + 3) % 5, '인성': (STEM_ELEM[ds] + 4) % 5 };
    yong.elem = groupElem[yong.group];
    res.yong = yong;
    res.huisinElem = res.huisin.map(function (x) { return groupElem[x]; });
    res.gisinElem = res.gisin.map(function (x) { return groupElem[x]; });
    res.groupElem = groupElem;

    // 신살
    var shinsal = [];
    var yb = p.year.branch, db = p.day.branch;
    function eachBranch(fn) { res.pillars.forEach(function (pl, i) { fn(pl.gj.branch, pl.pos, i); }); }
    var ch = CHEONEUL[ds];
    eachBranch(function (b, pos) { if (ch.indexOf(b) >= 0) shinsal.push({ name: '천을귀인', pos: pos, branch: b }); });
    eachBranch(function (b, pos) { if (MUNCHANG[ds] === b) shinsal.push({ name: '문창귀인', pos: pos, branch: b }); });
    [[yb, '년지'], [db, '일지']].forEach(function (base) {
      var t = SAMHAP[base[0]];
      eachBranch(function (b, pos, i) {
        if (base[1] === '일지' && i === 2) return;
        if (b === t[0] && !shinsal.some(function (s) { return s.name === '도화' && s.pos === pos; })) shinsal.push({ name: '도화', pos: pos, branch: b, base: base[1] });
        if (b === t[1] && !shinsal.some(function (s) { return s.name === '역마' && s.pos === pos; })) shinsal.push({ name: '역마', pos: pos, branch: b, base: base[1] });
        if (b === t[2] && !shinsal.some(function (s) { return s.name === '화개' && s.pos === pos; })) shinsal.push({ name: '화개', pos: pos, branch: b, base: base[1] });
      });
    });
    if (YANGIN[ds] != null) eachBranch(function (b, pos) { if (b === YANGIN[ds]) shinsal.push({ name: '양인', pos: pos, branch: b }); });
    if (GOEGANG.indexOf(p.day.hanja) >= 0) shinsal.push({ name: '괴강', pos: '일', branch: db });
    if (BAEKHO.indexOf(p.day.hanja) >= 0) shinsal.push({ name: '백호', pos: '일', branch: db });
    res.pillars.forEach(function (pl) { if (pl.pos !== '일' && BAEKHO.indexOf(pl.gj.hanja) >= 0) shinsal.push({ name: '백호', pos: pl.pos, branch: pl.gj.branch }); });
    eachBranch(function (b, pos, i) { if (i !== 2 && b === HONGYEOM[ds]) shinsal.push({ name: '홍염', pos: pos, branch: b }); });
    if (GUIMUN[db] != null) eachBranch(function (b, pos, i) { if (i !== 2 && b === GUIMUN[db]) shinsal.push({ name: '귀문관', pos: pos, branch: b }); });
    var gm = gongmang(p.day);
    res.gongmang = gm;
    eachBranch(function (b, pos, i) { if (i !== 2 && gm.indexOf(b) >= 0) shinsal.push({ name: '공망', pos: pos, branch: b }); });
    res.shinsal = shinsal;

    // 합충형파해
    var rel = [];
    var stems = pillars.map(function (gj) { return gj.stem; }), branches = pillars.map(function (gj) { return gj.branch; });
    function pairs(arr, fn) { for (var i = 0; i < arr.length; i++) for (var j = i + 1; j < arr.length; j++) fn(arr[i], arr[j], i, j); }
    pairs(stems, function (a, b, i, j) {
      STEM_HAP.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '천간합', a: posNames[i], b: posNames[j], text: M.STEMS[a] + M.STEMS[b] + '합 ' + ELEM_HANJA[h[2]], adjacent: j === i + 1 }); });
      STEM_CHUNG.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '천간충', a: posNames[i], b: posNames[j], text: M.STEMS[a] + M.STEMS[b] + '충', adjacent: j === i + 1 }); });
    });
    pairs(branches, function (a, b, i, j) {
      var adj = j === i + 1;
      YUKHAP.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '육합', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + '합', adjacent: adj }); });
      CHUNG.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '충', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + '충', adjacent: adj }); });
      HYEONG.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '형', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + '형(' + h[2] + ')', adjacent: adj }); });
      if (a === b && JAHYEONG.indexOf(a) >= 0) rel.push({ kind: '형', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + ' 자형', adjacent: adj });
      PA.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '파', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + '파', adjacent: adj }); });
      HAE.forEach(function (h) { if ((a === h[0] && b === h[1]) || (a === h[1] && b === h[0])) rel.push({ kind: '해', a: posNames[i], b: posNames[j], text: M.BRANCHES[a] + M.BRANCHES[b] + '해', adjacent: adj }); });
    });
    // 삼합·방합(반합 포함)
    [[SAMHAP_SET, '삼합'], [BANGHAP, '방합']].forEach(function (set) {
      set[0].forEach(function (s) {
        var have = [0, 1, 2].filter(function (k) { return branches.indexOf(s[k]) >= 0; });
        if (have.length === 3) rel.push({ kind: set[1], text: M.BRANCHES[s[0]] + M.BRANCHES[s[1]] + M.BRANCHES[s[2]] + ' ' + set[1] + ' ' + ELEM_HANJA[s[3]] + '국', full: true, elem: s[3] });
        else if (have.length === 2 && set[1] === '삼합' && have.indexOf(1) >= 0) rel.push({ kind: '반합', text: M.BRANCHES[s[have[0]]] + M.BRANCHES[s[have[1]]] + ' 반합 ' + ELEM_HANJA[s[3]], elem: s[3] });
      });
    });
    res.relations = rel;

    // 대운
    var forward = (STEM_YANG[p.year.stem] === 1) === (o.gender === 'M');
    var days = forward ? (p.nextJie.jd - p.kstJd) : (p.kstJd - p.prevJie.jd);
    var yearsExact = days / 3;
    var daeunNum = Math.max(1, Math.round(yearsExact));
    var daeun = [];
    for (var i = 1; i <= 10; i++) {
      var gj = M.ganji(p.month.idx + (forward ? i : -i));
      var startAge = daeunNum + 10 * (i - 1);
      daeun.push({ n: i, gj: gj, startAge: startAge, endAge: startAge + 9, startYear: o.y + startAge, stemTen: tenGod(ds, gj.stem), branchTen: tenGodBranch(ds, gj.branch), stage: stage12(ds, gj.branch) });
    }
    res.daeun = { forward: forward, days: days, num: daeunNum, yearsExact: yearsExact, months: Math.round((yearsExact - Math.floor(yearsExact)) * 12), list: daeun, refJie: forward ? p.nextJie : p.prevJie };

    // 세운 — 올해 앞뒤
    var now = new Date(), thisYear = now.getFullYear();
    var age = thisYear - o.y; // 만 나이(생일 지났다고 가정하지 않음, 연 단위)
    res.age = age;
    res.currentDaeun = daeun.filter(function (d) { return age >= d.startAge && age <= d.endAge; })[0] || null;
    res.seun = [];
    for (var yy = thisYear - 1; yy <= thisYear + 8; yy++) {
      var g2 = M.ganji((yy - 4) % 60);
      res.seun.push({ year: yy, gj: g2, age: yy - o.y, stemTen: tenGod(ds, g2.stem), branchTen: tenGodBranch(ds, g2.branch), stage: stage12(ds, g2.branch), current: yy === thisYear });
    }
    return res;
  }

  root.SAJU = {
    ELEM: ELEM, ELEM_HANJA: ELEM_HANJA, STEM_ELEM: STEM_ELEM, STEM_YANG: STEM_YANG, BRANCH_ELEM: BRANCH_ELEM, BRANCH_YANG: BRANCH_YANG,
    HIDDEN: HIDDEN, TEN: TEN, TEN_HANJA: TEN_HANJA, TEN_GROUP: TEN_GROUP, GROUPS: GROUPS, STAGE: STAGE, STAGE_HANJA: STAGE_HANJA,
    tenGod: tenGod, tenGodBranch: tenGodBranch, stage12: stage12, gongmang: gongmang, analyze: analyze
  };
})(typeof window !== 'undefined' ? window : this);
