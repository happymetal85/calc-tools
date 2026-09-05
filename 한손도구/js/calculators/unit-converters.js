/* 단위변환기 7종 — 공통 팩토리 */
(function () {
  function makeConverter(def) {
    HT.register({
      id: def.id, cat: '단위변환기', order: def.order, name: def.name, keywords: def.keywords, desc: def.desc, note: def.note,
      render(root) {
        const units = def.units; const out = HT.output(root, '변환 결과');
        const toBase = (v, u) => def.toBase ? def.toBase(v, u) : v * units.find(x => x[0] === u)[2];
        const fromBase = (b, u) => def.fromBase ? def.fromBase(b, u) : b / units.find(x => x[0] === u)[2];
        const opts = units.map(u => [u[0], u[1]]);
        const swap = HT.el('button', { class: 'btn swap', type: 'button' }, '↔');
        const quick = HT.el('div', { class: 'btns' });
        (def.pairs || []).forEach(([a, b, label]) => { const btn = HT.el('button', { class: 'btn sm', type: 'button' }, label || `${a} ↔ ${b}`); btn.addEventListener('click', () => { f.el('from').value = a; f.el('to').value = b; f.fire(); }); quick.append(btn); });
        const f = HT.form(root, [
          { id: 'val', label: '값', type: 'number', value: def.value ?? 1, step: 'any' },
          { id: 'from', label: '변환 전 단위', type: 'select', options: opts, value: def.pairs?.[0]?.[0] || units[0][0] },
          { id: 'to', label: '변환 후 단위', type: 'select', options: opts, value: def.pairs?.[0]?.[1] || units[1][0] },
        ], calc, { extra: HT.el('div', {}, [swap, def.pairs ? HT.el('div', { class: 'help', style: 'margin-top:10px' }, '자주 쓰는 변환') : null, quick]) });
        swap.addEventListener('click', () => { const v = f.values(); f.el('from').value = v.to; f.el('to').value = v.from; f.fire(); });
        const fmtV = (x) => { if (!isFinite(x)) return '-'; const a = Math.abs(x); if (a !== 0 && (a < 1e-4 || a >= 1e15)) return x.toExponential(4); return HT.fmt(x, a >= 1000 ? 2 : a >= 1 ? 4 : 6).replace(/\.?0+$/, ''); };
        function calc(v) {
          const b = toBase(v.val, v.from); const r = fromBase(b, v.to); const lf = units.find(u => u[0] === v.from)[1], lt = units.find(u => u[0] === v.to)[1];
          const one = fromBase(toBase(1, v.from), v.to);
          out.set(HT.kpi(`${fmtV(v.val)} ${lf} =`, `${fmtV(r)} ${lt}`, `1 ${lf} = ${fmtV(one)} ${lt}`),
            HT.table(['단위', '값'], units.map(u => [u[1], fmtV(fromBase(b, u[0]))]), { right: [1], scroll: false, hi: row => row[0] === lt }),
            def.ref ? HT.el('div', { class: 'note', html: def.ref }) : null);
        }
        calc(f.values());
      }
    });
  }
  makeConverter({ id: 'length-converter', order: 1, name: '길이 변환기', keywords: '길이 km 마일 cm 인치 피트 야드', value: 10,
    desc: '킬로미터·마일, 센티미터·인치, 미터·피트·야드 등 길이 단위를 서로 변환합니다.',
    note: '국제 협약 기준(1인치 = 2.54cm, 1마일 = 1,609.344m)을 사용합니다.',
    units: [['mm', '밀리미터 (mm)', 0.001], ['cm', '센티미터 (cm)', 0.01], ['m', '미터 (m)', 1], ['km', '킬로미터 (km)', 1000], ['in', '인치 (in)', 0.0254], ['ft', '피트 (ft)', 0.3048], ['yd', '야드 (yd)', 0.9144], ['mi', '마일 (mi)', 1609.344], ['nmi', '해리 (nmi)', 1852], ['ja', '자 (尺)', 0.30303], ['ri', '리 (里)', 392.727]],
    pairs: [['km', 'mi'], ['cm', 'in'], ['m', 'ft'], ['m', 'yd']] });
  makeConverter({ id: 'weight-converter', order: 2, name: '무게 변환기', keywords: '무게 kg 파운드 g 온스 근 돈', value: 1,
    desc: '킬로그램·파운드, 그램·온스, 근·킬로그램 등 무게 단위를 서로 변환합니다.',
    note: '1근은 600g, 1돈은 3.75g(귀금속), 1파운드는 453.59237g입니다. 영국 스톤·미국 톤(short ton)·영국 톤(long ton)도 포함했습니다.',
    units: [['mg', '밀리그램 (mg)', 1e-6], ['g', '그램 (g)', 0.001], ['kg', '킬로그램 (kg)', 1], ['t', '톤 (t)', 1000], ['oz', '온스 (oz)', 0.028349523125], ['lb', '파운드 (lb)', 0.45359237], ['st', '스톤 (st)', 6.35029318], ['ston', '미국 톤 (short ton)', 907.18474], ['lton', '영국 톤 (long ton)', 1016.0469088], ['geun', '근 (斤)', 0.6], ['don', '돈', 0.00375]],
    pairs: [['kg', 'lb'], ['g', 'oz'], ['geun', 'kg', '근 ↔ kg']] });
  makeConverter({ id: 'temperature-converter', order: 3, name: '온도 변환기', keywords: '온도 섭씨 화씨 켈빈', value: 25,
    desc: '섭씨·화씨·켈빈 온도를 서로 변환합니다.',
    note: '화씨 = 섭씨 × 9/5 + 32, 켈빈 = 섭씨 + 273.15입니다. 암산은 "섭씨 × 2 + 30"이 화씨의 근사값입니다. 음수 값도 넣을 수 있습니다.',
    units: [['c', '섭씨 (°C)'], ['f', '화씨 (°F)'], ['k', '켈빈 (K)']],
    toBase: (v, u) => u === 'c' ? v : u === 'f' ? (v - 32) * 5 / 9 : v - 273.15,
    fromBase: (c, u) => u === 'c' ? c : u === 'f' ? c * 9 / 5 + 32 : c + 273.15,
    pairs: [['c', 'f', '°C ↔ °F'], ['c', 'k', '°C ↔ K']],
    ref: '<b>빠른 참조</b> 체온 36.5°C = 97.7°F · 물 끓는점 100°C = 212°F · 오븐 180°C = 356°F · 절대영도 0K = −273.15°C' });
  makeConverter({ id: 'area-converter', order: 4, name: '넓이 변환기', keywords: '넓이 면적 평 제곱미터 에이커 헥타르', value: 34,
    desc: '평·제곱미터·에이커·헥타르·제곱피트 등 넓이 단위를 서로 변환합니다.',
    note: '1평은 3.3058㎡(400/121㎡)이며 아파트 34평은 약 112.4㎡입니다. 아파트 분양 면적은 전용면적(실제 거주 공간)과 공급면적(전용 + 주거공용)이 다르므로 어느 면적인지 확인하세요.',
    units: [['m2', '제곱미터 (㎡)', 1], ['pyeong', '평 (坪)', 400 / 121], ['ha', '헥타르 (ha)', 10000], ['km2', '제곱킬로미터 (㎢)', 1e6], ['ac', '에이커 (ac)', 4046.8564224], ['ft2', '제곱피트 (sq ft)', 0.09290304], ['yd2', '제곱야드 (sq yd)', 0.83612736], ['mi2', '제곱마일 (sq mi)', 2589988.110336], ['dan', '단 (段)', 991.7355], ['jeong', '정 (町)', 9917.355]],
    pairs: [['pyeong', 'm2', '평 ↔ ㎡'], ['ac', 'm2', '에이커 ↔ ㎡'], ['pyeong', 'ac', '평 ↔ 에이커']],
    ref: '<b>아파트 평형 참고</b> 18평 59.5㎡ · 25평 82.6㎡ · 34평 112.4㎡ · 42평 138.8㎡ (공급면적 기준)' });
  makeConverter({ id: 'volume-converter', order: 5, name: '부피 변환기', keywords: '부피 리터 갤런 밀리리터 온스 컵', value: 1,
    desc: '리터·미국 갤런, 밀리리터·액량온스, 컵·파인트·쿼트 등 부피 단위를 서로 변환합니다.',
    note: '미국 갤런(3.785L)과 영국 임페리얼 갤런(4.546L)은 다릅니다. 한국 레시피의 1컵은 200mL, 미국 레시피의 1 cup은 약 237mL이므로 요리할 때 주의하세요.',
    units: [['ml', '밀리리터 (mL)', 0.001], ['l', '리터 (L)', 1], ['m3', '세제곱미터 (㎥)', 1000], ['floz', '미국 액량온스 (fl oz)', 0.0295735295625], ['cup', '미국 컵 (cup)', 0.2365882365], ['kcup', '한국 계량컵 (200mL)', 0.2], ['pt', '미국 파인트 (pt)', 0.473176473], ['qt', '미국 쿼트 (qt)', 0.946352946], ['gal', '미국 갤런 (gal)', 3.785411784], ['igal', '영국 갤런 (imp gal)', 4.54609], ['tsp', '티스푼 (tsp)', 0.00492892159375], ['tbsp', '테이블스푼 (tbsp)', 0.01478676478125], ['doe', '되', 1.8039], ['mal', '말', 18.039]],
    pairs: [['l', 'gal', 'L ↔ 갤런'], ['ml', 'floz', 'mL ↔ fl oz'], ['cup', 'ml', 'cup ↔ mL']] });
  makeConverter({ id: 'speed-converter', order: 6, name: '속도 변환기', keywords: '속도 km/h mph m/s 노트 마하', value: 100,
    desc: 'km/h·mph·m/s·노트·마하 등 속도 단위를 서로 변환합니다.',
    note: '해외 운전 시 mph 표지판은 km/h의 약 0.62배입니다(60mph ≈ 97km/h). 한국 제한속도는 어린이보호구역 30km/h, 도시부 일반도로 50km/h, 고속도로 100~120km/h입니다. 마하는 해면 15°C 음속(340.29m/s) 기준입니다.',
    units: [['ms', '미터/초 (m/s)', 1], ['kmh', '킬로미터/시 (km/h)', 1 / 3.6], ['mph', '마일/시 (mph)', 0.44704], ['kn', '노트 (kn)', 1852 / 3600], ['fts', '피트/초 (ft/s)', 0.3048], ['mach', '마하 (Mach)', 340.29]],
    pairs: [['kmh', 'mph'], ['ms', 'kmh'], ['ms', 'mph']] });
  makeConverter({ id: 'data-converter', order: 7, name: '데이터 변환기', keywords: '데이터 용량 바이트 KB MB GB TB 비트', value: 1,
    desc: '바이트·KB·MB·GB·TB 등 데이터 용량을 이진법(1024) 기준으로 변환하고 십진법(1000) 값도 함께 보여줍니다.',
    note: '운영체제는 1KB = 1,024B(이진법)로 표시하고, 하드디스크 제조사와 통신 속도는 1KB = 1,000B(십진법)를 씁니다. 그래서 1TB 하드디스크는 윈도우에서 약 931GB로 보입니다. 참고 용량: 사진 1장 3~5MB, 노래 1곡 4~10MB, FHD 영화 1편 2~4GB.',
    units: [['bit', '비트 (bit)', 1 / 8], ['b', '바이트 (B)', 1], ['kb', '킬로바이트 (KB, 1024)', 1024], ['mb', '메가바이트 (MB)', 1024 ** 2], ['gb', '기가바이트 (GB)', 1024 ** 3], ['tb', '테라바이트 (TB)', 1024 ** 4], ['pb', '페타바이트 (PB)', 1024 ** 5], ['kb10', '킬로바이트 (kB, 1000)', 1000], ['mb10', '메가바이트 (MB, 1000²)', 1e6], ['gb10', '기가바이트 (GB, 1000³)', 1e9], ['tb10', '테라바이트 (TB, 1000⁴)', 1e12]],
    pairs: [['gb', 'mb'], ['tb', 'gb'], ['tb10', 'gb', 'TB(제조사) → GB(OS)']] });
})();
