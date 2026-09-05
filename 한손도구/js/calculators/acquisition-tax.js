HT.register({
  id: 'acquisition-tax', cat: '부동산', order: 5, name: '취득세 계산기', keywords: '취득세 지방교육세 농어촌특별세 다주택 중과',
  desc: '취득 유형·주택 수·조정대상지역 여부에 따라 취득세와 지방교육세·농어촌특별세를 계산합니다.',
  note: '주택 유상취득 6억~9억원 구간은 세율이 1%에서 3%까지 비례해 오릅니다. 85㎡ 이하 주택은 농어촌특별세가 비과세입니다. 생애최초 감면(취득가 12억원 이하, 200만원 한도·소형주택 등 300만원), 출산·양육 감면(500만원), 일시적 2주택 등 감면·예외는 반영하지 않았습니다. 생애최초 감면은 내 집 마련 시뮬레이터에서 적용합니다. 2026년 지방세제 개편안은 생애최초 감면을 2028년까지 연장하고 40세 미만 청년에게 300만원 한도를 주는 내용입니다.',
  render(root) {
    const out = HT.output(root);
    const f = HT.form(root, [
      { id: 'how', label: '취득 유형', type: 'seg', options: [['sale', '매매'], ['inherit', '상속'], ['gift', '증여'], ['orig', '원시취득(신축)']], value: 'sale' },
      { id: 'what', label: '부동산 유형', type: 'seg', options: [['house', '주택'], ['land', '토지·건물'], ['farm', '농지']], value: 'house' },
      { id: 'cnt', label: '취득 후 주택 수', type: 'select', options: [['1', '1주택'], ['2', '2주택'], ['3', '3주택 이상'], ['corp', '법인']], value: '1', show: v => v.what === 'house' && v.how === 'sale' },
      { id: 'adj', label: '조정대상지역', type: 'check', value: false, show: v => v.what === 'house' },
      { id: 'big', label: '전용면적 85㎡ 초과', type: 'check', value: false, show: v => v.what === 'house' },
      { id: 'self', label: '2년 이상 자경 농지', type: 'check', value: false, show: v => v.what === 'farm' && v.how === 'sale' },
      { id: 'price', label: '취득가액', type: 'money', unit: '원', value: 700000000 },
    ], calc);
    function calc(v) {
      const p = v.price; let r, edu, rural, desc;
      if (v.how === 'sale') {
        if (v.what === 'house') {
          if (v.cnt === 'corp' || (v.cnt === '3' && v.adj)) { r = .12; edu = .004; rural = v.big ? .01 : 0; desc = v.cnt === 'corp' ? '법인 12%' : '조정대상지역 3주택 이상 12%'; }
          else if ((v.cnt === '2' && v.adj) || (v.cnt === '3' && !v.adj)) { r = .08; edu = .004; rural = v.big ? .006 : 0; desc = v.cnt === '2' ? '조정대상지역 2주택 8%' : '비조정지역 3주택 이상 8%'; }
          else { if (p <= 6e8) r = .01; else if (p <= 9e8) r = Math.round((p * 2 / 3e8 - 3) * 10000) / 1000000; else r = .03; edu = r / 10; rural = v.big ? .002 : 0; desc = p <= 6e8 ? '6억원 이하 1%' : p <= 9e8 ? '6억~9억원 비례세율 (취득가액 × 2/3억 − 3)%' : '9억원 초과 3%'; }
        } else if (v.what === 'land') { r = .04; edu = .004; rural = .002; desc = '토지·건물 4%'; }
        else if (v.self) { r = .015; edu = .001; rural = 0; desc = '2년 이상 자경 농지 1.5%'; } else { r = .03; edu = .002; rural = .002; desc = '농지 3%'; }
      } else if (v.how === 'inherit') { if (v.what === 'farm') { r = .023; edu = .0006; rural = .002; desc = '농지 상속 2.3%'; } else { r = .028; edu = .0016; rural = .002; desc = '상속 2.8%'; } }
      else if (v.how === 'gift') { if (v.what === 'house' && v.adj && p >= 3e8) { r = .12; edu = .004; rural = .01; desc = '조정대상지역 3억원 이상 주택 증여 12%'; } else { r = .035; edu = .003; rural = .002; desc = '증여 3.5%'; } }
      else { r = .028; edu = .0016; rural = .002; desc = '원시취득 2.8%'; }
      if (v.what === 'house' && v.how !== 'sale' && !v.big && r < .12) rural = 0;
      const t1 = p * r, t2 = p * edu, t3 = p * rural, total = t1 + t2 + t3;
      out.set(HT.kpi('총 납부세액', HT.won(total), `실효세율 ${HT.pct(p ? total / p * 100 : 0, 2)}`),
        HT.rows([['취득세', HT.won(t1), '', `${desc} · 세율 ${HT.pct(r * 100, 2)}`], ['지방교육세', HT.won(t2), 'sub', HT.pct(edu * 100, 2)], ['농어촌특별세', HT.won(t3), 'sub', rural ? HT.pct(rural * 100, 2) : '비과세 (85㎡ 이하 주택)'], ['합계', HT.won(total), 'strong']]));
    }
    calc(f.values());
  }
});
