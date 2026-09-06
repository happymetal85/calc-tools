/* 만세력 — 절기·음력·간지·시간 보정
   기준: 한국표준시(KST, UTC+9). 절기는 태양 황경(ASTRO.sunLongitude), 음력은 삭·중기 규칙으로 계산.
   음력 규칙: 동지가 든 달을 11월로 하고, 두 동지 사이에 달이 13개면 중기가 없는 첫 달을 윤달로 한다.
*/
(function (root) {
  'use strict';
  var A = root.ASTRO;

  var STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  // 24절기: 황경 · 이름. 절(節)은 월의 경계, 중(中)은 음력 윤달 판정에 쓴다
  var TERMS = [
    { lon: 315, name: '입춘', hanja: '立春', jie: true }, { lon: 330, name: '우수', hanja: '雨水', jie: false },
    { lon: 345, name: '경칩', hanja: '驚蟄', jie: true }, { lon: 0, name: '춘분', hanja: '春分', jie: false },
    { lon: 15, name: '청명', hanja: '淸明', jie: true }, { lon: 30, name: '곡우', hanja: '穀雨', jie: false },
    { lon: 45, name: '입하', hanja: '立夏', jie: true }, { lon: 60, name: '소만', hanja: '小滿', jie: false },
    { lon: 75, name: '망종', hanja: '芒種', jie: true }, { lon: 90, name: '하지', hanja: '夏至', jie: false },
    { lon: 105, name: '소서', hanja: '小暑', jie: true }, { lon: 120, name: '대서', hanja: '大暑', jie: false },
    { lon: 135, name: '입추', hanja: '立秋', jie: true }, { lon: 150, name: '처서', hanja: '處暑', jie: false },
    { lon: 165, name: '백로', hanja: '白露', jie: true }, { lon: 180, name: '추분', hanja: '秋分', jie: false },
    { lon: 195, name: '한로', hanja: '寒露', jie: true }, { lon: 210, name: '상강', hanja: '霜降', jie: false },
    { lon: 225, name: '입동', hanja: '立冬', jie: true }, { lon: 240, name: '소설', hanja: '小雪', jie: false },
    { lon: 255, name: '대설', hanja: '大雪', jie: true }, { lon: 270, name: '동지', hanja: '冬至', jie: false },
    { lon: 285, name: '소한', hanja: '小寒', jie: true }, { lon: 300, name: '대한', hanja: '大寒', jie: false }
  ];

  var KST = 9 / 24;
  // 역표시(TT) JDE → KST JD
  function jdeToKst(jde) {
    var y = A.dateFromJd(jde).y;
    return jde - A.deltaT(y) / 86400 + KST;
  }

  /* ---------- 절기 (연도별 캐시) ---------- */
  var termCache = {};
  // 해당 양력 연도에 드는 24절기를 KST 시각으로. 소한(1월)부터 동지(12월)까지 순서대로
  function solarTerms(year) {
    if (termCache[year]) return termCache[year];
    var out = [];
    for (var i = 0; i < 24; i++) {
      // 소한(285)·대한(300)은 1월, 입춘(315)부터 12월 동지(270)까지
      var t = TERMS[(i + 22) % 24];
      var jde = A.solarTermJDE(year, t.lon);
      var jd = jdeToKst(jde);
      var dt = A.dateFromJd(jd);
      // 연도가 어긋나면(연말·연초 경계) 한 해 보정
      if (dt.y !== year) { jde = A.solveSunLongitude(t.lon, jde + (dt.y < year ? 365.2422 : -365.2422)); jd = jdeToKst(jde); dt = A.dateFromJd(jd); }
      out.push({ name: t.name, hanja: t.hanja, lon: t.lon, jie: t.jie, jd: jd, date: dt });
    }
    termCache[year] = out;
    return out;
  }
  // 특정 KST 시각(jd) 직전·직후의 절(節)
  function jieAround(jd) {
    var y = A.dateFromJd(jd).y;
    var list = solarTerms(y - 1).concat(solarTerms(y), solarTerms(y + 1)).filter(function (t) { return t.jie; });
    var prev = null, next = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].jd <= jd) prev = list[i]; else { next = list[i]; break; }
    }
    return { prev: prev, next: next };
  }

  /* ---------- 간지 ---------- */
  function ganji(idx) { idx = ((idx % 60) + 60) % 60; return { idx: idx, stem: idx % 10, branch: idx % 12, hanja: STEMS[idx % 10] + BRANCHES[idx % 12], ko: STEMS_KO[idx % 10] + BRANCHES_KO[idx % 12] }; }
  function ganjiOf(stem, branch) { for (var i = 0; i < 60; i++) if (i % 10 === stem && i % 12 === branch) return ganji(i); return null; }

  // 일진: JDN(정오 기준 정수) → 60갑자. 1900-01-01 = 甲戌, 2000-01-01 = 戊午 로 검증
  function dayGanji(jdKst) {
    var jdn = Math.floor(jdKst + 0.5);
    return ganji((jdn + 49) % 60);
  }

  /* ---------- 음력 ---------- */
  var lunarCache = {};
  function civilDay(jdKst) { return Math.floor(jdKst + 0.5); } // KST 자정 기준 날짜 번호(JDN)
  function newMoonDay(k) { return civilDay(jdeToKst(A.newMoonJDE(k))); }
  function zhongqiDays(fromJd, toJd) { // 구간 안의 중기 날짜 번호들
    var y0 = A.dateFromJd(fromJd).y, y1 = A.dateFromJd(toJd).y, arr = [];
    for (var y = y0; y <= y1; y++) solarTerms(y).forEach(function (t) { if (!t.jie && t.jd >= fromJd - 1 && t.jd <= toJd + 1) arr.push(civilDay(t.jd)); });
    return arr;
  }
  // 음력 year년의 달 목록(정월부터 다음 해 정월 직전까지). 각 달: {m, leap, start(JDN), days}
  function lunarYear(year) {
    if (lunarCache[year]) return lunarCache[year];
    // 전년 동지 ~ 당년 동지 사이의 달을 세운 뒤, 정월(1월)부터 다음 정월 전까지를 자른다
    function monthsBetweenSolstices(y) {
      var ws0 = solarTerms(y - 1)[23].jd, ws1 = solarTerms(y)[23].jd; // 동지
      var d0 = civilDay(ws0), d1 = civilDay(ws1);
      // 전년 동지를 품는 달의 삭
      var k = A.newMoonKNear(ws0) - 2;
      while (newMoonDay(k + 1) <= d0) k++;
      var starts = [];
      for (var i = 0; ; i++) { var s = newMoonDay(k + i); starts.push(s); if (s > d1) break; }
      // starts[0] = 11월(전년) 시작, 마지막 = 당년 11월 시작 이후 첫 달(포함 안 함)
      // 당년 11월 = 동지 d1을 품는 달
      var idx11 = 0; for (var j = 0; j < starts.length - 1; j++) if (starts[j] <= d1 && d1 < starts[j + 1]) idx11 = j;
      var months = [];
      var leapDone = false, hasLeap = (idx11 === 13);
      var num = 11;
      for (var m = 0; m < idx11; m++) {
        var s0 = starts[m], s1 = starts[m + 1];
        var leap = false;
        if (hasLeap && !leapDone && m > 0) {
          var zq = zhongqiDays(s0 - 0.5, s1 - 0.5).filter(function (d) { return d >= s0 && d < s1; });
          if (zq.length === 0) { leap = true; leapDone = true; }
        }
        if (!leap) num = (m === 0) ? 11 : (num % 12) + 1;
        months.push({ m: num, leap: leap, start: s0, days: s1 - s0 });
      }
      return months;
    }
    var prev = monthsBetweenSolstices(year), next = monthsBetweenSolstices(year + 1);
    var all = prev.concat(next), out = [], take = false;
    for (var i = 0; i < all.length; i++) {
      var mo = all[i];
      if (!take && mo.m === 1 && !mo.leap && i < prev.length + 2 && A.dateFromJd(mo.start).y === year) take = true;
      if (take) {
        if (out.length && mo.m === 1 && !mo.leap) break;
        out.push(mo);
      }
    }
    lunarCache[year] = out;
    return out;
  }
  function solarToLunar(y, m, d) {
    var jdn = civilDay(A.jdFromDate(y, m, d + 0.5));
    var ly = y, months = lunarYear(ly);
    if (jdn < months[0].start) { ly = y - 1; months = lunarYear(ly); }
    for (var i = 0; i < months.length; i++) {
      var mo = months[i];
      if (jdn >= mo.start && jdn < mo.start + mo.days) return { y: ly, m: mo.m, leap: mo.leap, d: jdn - mo.start + 1, days: mo.days };
    }
    return null;
  }
  function lunarToSolar(ly, lm, leap, ld) {
    var months = lunarYear(ly);
    for (var i = 0; i < months.length; i++) {
      var mo = months[i];
      if (mo.m === lm && !!mo.leap === !!leap) {
        if (ld > mo.days) return { error: '그 달은 ' + mo.days + '일까지 있습니다.' };
        var dt = A.dateFromJd(mo.start + ld - 1);
        return { y: dt.y, m: dt.m, d: dt.d };
      }
    }
    return { error: leap ? '음력 ' + ly + '년에는 윤' + lm + '월이 없습니다.' : '달을 찾지 못했습니다.' };
  }

  /* ---------- 시간 보정 ---------- */
  // 한국 표준시 이력(현지 표준시 → UTC 오프셋, 시간 단위)
  function stdOffset(jdKst) {
    var d = A.dateFromJd(jdKst);
    var ymd = d.y * 10000 + d.m * 100 + d.d;
    if (ymd < 19080401) return 8.5;            // 1908-04-01 대한제국 표준시(127.5°E) 이전은 편의상 동일 취급
    if (ymd < 19120101) return 8.5;            // 1908-04-01 ~ 1911-12-31 UTC+8:30
    if (ymd < 19540321) return 9;              // 1912-01-01 ~ 1954-03-20 UTC+9
    if (ymd < 19610810) return 8.5;            // 1954-03-21 ~ 1961-08-09 UTC+8:30
    return 9;                                   // 1961-08-10 ~ UTC+9
  }
  // 서머타임(일광절약시간) 시행 기간 — 시작·종료 (KST 기준 날짜, 포함)
  var DST = [
    [19480601, 19480912], [19490403, 19490910], [19500401, 19500909], [19510506, 19510908],
    [19550505, 19550908], [19560520, 19560929], [19570505, 19570921], [19580504, 19580920],
    [19590503, 19590919], [19600501, 19600917], [19870510, 19871011], [19880508, 19881009]
  ];
  function isDst(y, m, d) { var v = y * 10000 + m * 100 + d; for (var i = 0; i < DST.length; i++) if (v >= DST[i][0] && v <= DST[i][1]) return true; return false; }

  // 균시차(분) — Meeus 28장 근사
  function equationOfTime(jd) {
    var T = (jd - 2451545) / 36525;
    var L0 = A.norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
    var M = A.norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
    var e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;
    var eps = (23.439291 - 0.0130042 * T) * Math.PI / 180;
    var y = Math.tan(eps / 2); y = y * y;
    var L = L0 * Math.PI / 180;
    var E = y * Math.sin(2 * L) - 2 * e * Math.sin(M) + 4 * e * y * Math.sin(M) * Math.cos(2 * L) - 0.5 * y * y * Math.sin(4 * L) - 1.25 * e * e * Math.sin(2 * M);
    return E * 180 / Math.PI * 4; // 분
  }

  /* ---------- 사주 기둥 ---------- */
  // opts: {y,m,d,h,mi, lon(경도, null이면 보정 없음), eot(균시차 적용), dst(서머타임 자동 반영), unknownHour, lateZi('next'|'same')}
  function pillars(o) {
    var y = o.y, m = o.m, d = o.d, h = o.h, mi = o.mi;
    var clockJd = A.jdFromDate(y, m, d + (h + mi / 60) / 24); // 시계 시각(현지 표준시)
    var corr = 0, notes = [];
    if (!o.unknownHour) {
      if (o.dst !== false && isDst(y, m, d)) { corr -= 60; notes.push('서머타임 시행 기간이라 1시간을 뺐습니다.'); }
      if (o.lon != null) {
        var off = stdOffset(clockJd);
        var lonCorr = o.lon * 4 - off * 60; // 분: 경도×4 − 표준자오선
        corr += lonCorr;
        notes.push('출생지 경도 ' + o.lon.toFixed(2) + '°E, 당시 표준시 UTC+' + off + ' → ' + (lonCorr >= 0 ? '+' : '') + Math.round(lonCorr) + '분');
        if (o.eot) { var e = equationOfTime(clockJd); corr += e; notes.push('균시차 ' + (e >= 0 ? '+' : '') + e.toFixed(1) + '분'); }
      }
    }
    var trueJd = clockJd + corr / 1440; // 보정된 시각 — 시주·일진 판정용(그 자리의 태양시)
    // 절기 판정은 UTC+9 눈금으로 통일한다(서머타임을 되돌리고, 당시 표준시가 UTC+8:30이면 30분을 더한다)
    var kstJd = clockJd + ((o.dst !== false && !o.unknownHour && isDst(y, m, d)) ? -60 : 0) / 1440 + (9 - stdOffset(clockJd)) / 24;
    if (o.unknownHour) { kstJd = A.jdFromDate(y, m, d + 0.5); trueJd = kstJd; }

    // 연주: 입춘 기준
    var terms = solarTerms(y), ipchun = terms[2].jd;
    var sajuYear = kstJd >= ipchun ? y : y - 1;
    var yearGj = ganji((sajuYear - 4) % 60);

    // 월주: 직전 절(節)
    var ja = jieAround(kstJd);
    var monthIdx = (TERMS.map(function (t) { return t.lon; }).indexOf(ja.prev.lon)) / 2; // 0=입춘(寅)
    var mBranch = (monthIdx + 2) % 12;
    var mStem = ((yearGj.stem % 5) * 2 + 2 + monthIdx) % 10;
    var monthGj = ganjiOf(mStem, mBranch);

    // 시주 · 일주(자시 처리)
    var t = A.dateFromJd(trueJd);
    var hourVal = t.h + t.mi / 60;
    var dayJd = kstJd; // 일진 판정용
    var hourBranch = 0, hourLabelNote = '';
    if (!o.unknownHour) {
      // 진태양시 보정으로 날짜가 바뀌면 일진도 그 날짜를 따른다
      dayJd = trueJd;
      hourBranch = Math.floor(((hourVal + 1) % 24) / 2);
      if (hourVal >= 23) {
        if (o.lateZi === 'same') { hourLabelNote = '야자시(夜子時): 23시 이후를 당일 일주로 봄'; }
        else { dayJd = trueJd + 1; hourLabelNote = '23시 이후 출생은 다음 날 일주로 봄(자시 기준)'; }
      }
    }
    var dayGj = dayGanji(dayJd);
    var hourGj = null;
    if (!o.unknownHour) {
      var hStem = ((dayGj.stem % 5) * 2 + hourBranch) % 10;
      hourGj = ganjiOf(hStem, hourBranch);
    }
    var lunar = solarToLunar(y, m, d);
    return {
      year: yearGj, month: monthGj, day: dayGj, hour: hourGj,
      sajuYear: sajuYear, monthIdx: monthIdx, hourBranch: hourBranch,
      kstJd: kstJd, trueJd: trueJd, corrMinutes: corr, notes: notes, ziNote: hourLabelNote,
      prevJie: ja.prev, nextJie: ja.next, lunar: lunar, unknownHour: !!o.unknownHour,
      trueTime: o.unknownHour ? null : t
    };
  }

  root.MANSE = {
    STEMS: STEMS, STEMS_KO: STEMS_KO, BRANCHES: BRANCHES, BRANCHES_KO: BRANCHES_KO, ANIMALS: ANIMALS, TERMS: TERMS,
    solarTerms: solarTerms, jieAround: jieAround, ganji: ganji, ganjiOf: ganjiOf, dayGanji: dayGanji,
    lunarYear: lunarYear, solarToLunar: solarToLunar, lunarToSolar: lunarToSolar,
    stdOffset: stdOffset, isDst: isDst, equationOfTime: equationOfTime, pillars: pillars, jdeToKst: jdeToKst
  };
})(typeof window !== 'undefined' ? window : this);
