HT.register({
  id: 'housing-subscription', cat: '부동산', order: 1, name: '청약 가점 계산기', keywords: '청약 가점 무주택 부양가족 통장',
  desc: '무주택 기간·부양가족 수·청약통장 가입 기간으로 청약 가점(84점 만점)을 계산합니다.',
  note: '세대 전원이 무주택이어야 하며, 분양권·입주권도 주택으로 봅니다. 무주택 기간은 만 30세부터(30세 전에 혼인했으면 혼인신고일부터) 계산합니다. 부양가족은 같은 주민등록표에 올라 있어야 하고, 직계존속은 3년 이상 동거해야 합니다. 통장을 해지하면 가입 기간이 처음부터 다시 시작됩니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'own', label: '주택 소유 여부', type: 'seg', options: [['no', '무주택'], ['yes', '유주택']], value: 'no' },
      { id: 'hy', label: '무주택 기간', type: 'number', unit: '년', value: 5, min: 0, help: '만 30세(또는 혼인신고일) 이후 무주택으로 지낸 기간', show: v => v.own === 'no' },
      { id: 'fam', label: '부양가족 수 (본인 제외)', type: 'number', unit: '명', value: 2, min: 0 },
      { id: 'sy', label: '청약통장 가입 기간', type: 'number', unit: '년', value: 5, min: 0 },
      { id: 'sm', label: '가입 기간 (추가 개월)', type: 'number', unit: '개월', value: 0, min: 0, max: 11 },
    ], calc);
    function calc(v) {
      const s1 = v.own === 'yes' ? 0 : Math.min(32, 2 + 2 * Math.floor(v.hy));
      const s2 = 5 + 5 * Math.min(6, Math.floor(v.fam));
      const months = v.sy * 12 + v.sm; const s3 = months < 6 ? 1 : months < 12 ? 2 : Math.min(17, 2 + Math.floor(months / 12));
      const total = s1 + s2 + s3;
      out.set(HT.kpi('총 가점', total + '점', '84점 만점'),
        HT.rows([['무주택 기간 점수', s1 + '점 / 32점', '', v.own === 'yes' ? '유주택자는 0점' : '1년 미만 2점, 1년마다 2점 가산'], ['부양가족 점수', s2 + '점 / 35점', '', '0명 5점, 1명마다 5점 가산'], ['청약통장 점수', s3 + '점 / 17점', '', '6개월 미만 1점, 1년 미만 2점, 이후 1년마다 1점']]),
        HT.barChart([{ label: '무주택 기간', value: s1, color: 'var(--c1)' }, { label: '부양가족', value: s2, color: 'var(--c2)' }, { label: '청약통장', value: s3, color: 'var(--c3)' }], { fmt: v => v + '점', cap: '항목별 점수 (최대 32 / 35 / 17점)' }));
    }
    calc(f.values());
  }
});
