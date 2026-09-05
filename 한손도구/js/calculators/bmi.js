HT.register({
  id: 'bmi', cat: '유용한도구', order: 1, name: 'BMI 계산기', keywords: 'BMI 체질량지수 비만 정상체중',
  desc: '키와 몸무게로 체질량지수(BMI)를 계산하고 WHO 기준과 한국(아시아) 기준으로 판정합니다.',
  note: 'BMI = 체중(kg) ÷ 키(m)². 성인(18세 이상) 기준이며 어린이·청소년은 성별·연령별 백분위를 씁니다. 임산부·수유부, 근육량이 많은 운동선수에게는 맞지 않을 수 있고, 근육량·체지방 분포·골격은 반영하지 못합니다.',
  render(root) {
    const out = HT.output(root);
    const WHO = [[18.5, '저체중'], [25, '정상'], [30, '과체중'], [35, '비만 1단계'], [40, '비만 2단계'], [Infinity, '비만 3단계']];
    const KR = [[18.5, '저체중'], [23, '정상'], [25, '비만 전단계 (과체중)'], [30, '비만 1단계'], [35, '비만 2단계'], [Infinity, '비만 3단계']];
    const f = HT.form(root, [
      { id: 'h', label: '키', type: 'number', unit: 'cm', value: 170, step: 0.1 },
      { id: 'w', label: '몸무게', type: 'number', unit: 'kg', value: 65, step: 0.1 },
      { id: 'std', label: '판정 기준', type: 'seg', options: [['kr', '한국 (아시아)'], ['who', 'WHO']], value: 'kr' },
    ], calc);
    function calc(v) {
      const m = v.h / 100; if (!m || !v.w) { out.set(HT.el('div', { class: 'empty' }, '키와 몸무게를 입력하세요.')); return; }
      const bmi = v.w / (m * m); const table = v.std === 'kr' ? KR : WHO; const cls = table.find(t => bmi < t[0])[1];
      const lo = 18.5 * m * m, hi = (v.std === 'kr' ? 23 : 25) * m * m; const kind = cls === '정상' ? 'ok' : cls === '저체중' ? 'gray' : cls.includes('전단계') || cls === '과체중' ? 'warn' : 'danger';
      const pos = HT.clamp((bmi - 10) / 30 * 100, 0, 100);
      const scale = HT.el('div', { class: 'chart', html: `<svg viewBox="0 0 600 46"><rect x="0" y="14" width="${(18.5 - 10) / 30 * 600}" height="14" fill="var(--g3)"/><rect x="${(18.5 - 10) / 30 * 600}" y="14" width="${((v.std === 'kr' ? 23 : 25) - 18.5) / 30 * 600}" height="14" fill="var(--c2)"/><rect x="${((v.std === 'kr' ? 23 : 25) - 10) / 30 * 600}" y="14" width="${((v.std === 'kr' ? 25 : 30) - (v.std === 'kr' ? 23 : 25)) / 30 * 600}" height="14" fill="var(--g2)"/><rect x="${((v.std === 'kr' ? 25 : 30) - 10) / 30 * 600}" y="14" width="${(40 - (v.std === 'kr' ? 25 : 30)) / 30 * 600}" height="14" fill="var(--g1)"/><polygon points="${pos * 6 - 6},10 ${pos * 6 + 6},10 ${pos * 6},16" fill="var(--brand-deep)"/><text x="${(18.5 - 10) / 30 * 600}" y="42" font-size="11" text-anchor="middle" fill="var(--ink-soft)">18.5</text><text x="${((v.std === 'kr' ? 23 : 25) - 10) / 30 * 600}" y="42" font-size="11" text-anchor="middle" fill="var(--ink-soft)">${v.std === 'kr' ? 23 : 25}</text><text x="${((v.std === 'kr' ? 25 : 30) - 10) / 30 * 600}" y="42" font-size="11" text-anchor="middle" fill="var(--ink-soft)">${v.std === 'kr' ? 25 : 30}</text></svg>` });
      out.set(HT.kpi('BMI', HT.fmt(bmi, 1), ''), HT.el('div', { style: 'margin:-8px 0 12px' }, HT.badge(cls, kind)), scale,
        HT.rows([['정상 체중 범위', `${HT.fmt(lo, 1)} ~ ${HT.fmt(hi, 1)} kg`, '', `BMI 18.5 ~ ${v.std === 'kr' ? '22.9' : '24.9'}`], [bmi > (v.std === 'kr' ? 23 : 25) ? '정상까지 감량' : bmi < 18.5 ? '정상까지 증량' : '여유', bmi > (v.std === 'kr' ? 23 : 25) ? HT.fmt(v.w - hi, 1) + ' kg' : bmi < 18.5 ? HT.fmt(lo - v.w, 1) + ' kg' : `−${HT.fmt(v.w - lo, 1)} / +${HT.fmt(hi - v.w, 1)} kg`]]),
        HT.table(['구분', '한국 (아시아)', 'WHO'], [['저체중', '18.5 미만', '18.5 미만'], ['정상', '18.5 ~ 22.9', '18.5 ~ 24.9'], ['과체중 / 비만 전단계', '23 ~ 24.9', '25 ~ 29.9'], ['비만 1단계', '25 ~ 29.9', '30 ~ 34.9'], ['비만 2단계', '30 ~ 34.9', '35 ~ 39.9'], ['비만 3단계', '35 이상', '40 이상']], { scroll: false, hi: r => r[0].startsWith(cls.split(' ')[0]) }));
    }
    calc(f.values());
  }
});
