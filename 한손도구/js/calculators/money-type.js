/* 돈 성향 16유형 — 4축(모으기 S/쓰기 C · 안정 A/도전 R · 계획 P/즉흥 I · 미래 F/현재 N) × 12문항 */
HT.register({
  id: 'money-type', cat: '내 재무', order: 4, original: false, name: '돈 성향 16유형 테스트', keywords: '돈 성향 테스트 재무 MBTI 16유형 소비 저축 투자 성향 유형 카드',
  desc: '12문항으로 모으기/쓰기, 안정/도전, 계획/즉흥, 미래/현재 네 축을 재서 16가지 돈 성향 유형을 알려주고, 유형별 강점·함정과 지금 써 보면 좋은 계산기를 추천합니다.',
  note: '심리검사가 아니라 재미로 보는 자가진단입니다. 문항마다 더 가까운 쪽을 고르면 되고, 결과는 이 브라우저에만 저장됩니다. 같은 유형이라도 소득·나이·상황에 따라 맞는 전략이 다르니 추천 계산기로 숫자를 직접 확인하세요.',
  render(root) {
    const Q = [
      ['월급이 들어오면', 'S', '저축·투자부터 떼어 놓는다', 'C', '이번 달 쓸 것부터 정리한다'],
      ['갑자기 100만원이 생기면', 'S', '대부분 통장에 넣는다', 'C', '미뤄 둔 것을 사거나 경험에 쓴다'],
      ['친구가 "이거 요즘 다 산다"고 하면', 'S', '나는 필요 없으면 안 산다', 'C', '궁금해서 한 번은 사 본다'],
      ['같은 돈이라면', 'A', '예금 3%가 마음 편하다', 'R', '주식·ETF 기대 7%가 끌린다'],
      ['투자한 자산이 20% 떨어지면', 'A', '잠이 안 와서 정리하고 싶다', 'R', '싸졌으니 더 살 기회로 본다'],
      ['대출은', 'A', '가능하면 안 받고 싶다', 'R', '이자보다 수익이 크면 활용한다'],
      ['이번 달 지출은', 'P', '예산표·가계부로 관리한다', 'I', '대충 감으로 안다'],
      ['큰 물건을 살 때', 'P', '비교하고 며칠 고민한다', 'I', '마음에 들면 바로 결정한다'],
      ['목표 금액과 기한이', 'P', '있다 (예: 3년 안에 5천만)', 'I', '딱히 없다, 되는 대로'],
      ['10년 뒤 나를 위해', 'F', '지금 좀 참을 수 있다', 'N', '지금이 더 중요하다'],
      ['연금저축·IRP 같은 55세 이후 상품은', 'F', '세액공제 받으며 이미 넣고 있다/넣을 것', 'N', '너무 먼 얘기라 관심이 적다'],
      ['여행 갈 돈이 생기면', 'F', '집·노후 자금에 보태는 쪽을 먼저 생각한다', 'N', '지금 떠난다, 추억은 지금 사는 것'],
    ];
    const TYPES = {
      SAPF: ['성실한 개미', '모으고, 지키고, 계획하고, 내일을 산다. 안전자산 위주로 꾸준히 쌓아 목표에 가장 확실하게 도달하는 유형. 함정은 인플레이션에 뒤처지는 것과 삶의 재미를 미루는 것.', ['first-100m', 'savings-tax-compare', 'retirement-fire']],
      SAPN: ['알뜰한 살림꾼', '계획적으로 아끼지만 돈은 오늘의 안정을 위해 쓴다. 비상금이 두둑하고 빚을 싫어함. 함정은 큰 그림(집·노후) 계획이 늦어지는 것.', ['finance-dashboard', 'rent-compare', 'savings-tax-compare']],
      SAIF: ['묵묵한 저축왕', '가계부는 없지만 안 쓰는 게 습관이라 돈이 남고, 그걸 미래에 둔다. 함정은 목표 없이 예금에만 두어 기회비용을 놓치는 것.', ['first-100m', 'what-if-invested', 'compound-interest']],
      SAIN: ['조용한 절약가', '안전하게, 즉흥적으로, 오늘에 충실. 큰 지출은 없지만 목표도 없다. 함정은 "언젠가"가 안 오는 것.', ['finance-dashboard', 'peer-percentile', 'first-100m']],
      SRPF: ['전략 투자자', '모으는 힘과 계획, 위험 감수까지 갖춘 자산 형성형. 장기 투자로 복리를 누린다. 함정은 과신과 레버리지.', ['what-if-invested', 'buy-vs-rent', 'retirement-fire']],
      SRPN: ['계산된 승부사', '기회를 보면 계획적으로 베팅하되 성과는 지금 누린다. 함정은 노후 자산의 비중이 낮은 것.', ['loan-refinance', 'investment-simulator', 'savings-tax-compare']],
      SRIF: ['직감형 장기투자자', '저축은 잘하고 위험도 즐기지만 즉흥적. 장기 목표는 뚜렷하다. 함정은 몰빵과 잦은 매매.', ['what-if-invested', 'stock-return', 'first-100m']],
      SRIN: ['모험가 저축러', '돈은 모으지만 쓰는 방식은 즉흥적이고 도전적. 함정은 목돈이 생기면 큰 베팅을 하는 것.', ['loan-prepayment', 'peer-percentile', 'investment-simulator']],
      CAPF: ['균형 잡힌 계획가', '쓸 땐 쓰지만 계획 안에서, 안전하게, 미래를 보며. 함정은 저축률이 낮아 목표 도달이 늦는 것.', ['first-100m', 'home-purchase-simulator', 'lifetime-tax']],
      CAPN: ['현재를 즐기는 관리자', '예산은 지키지만 대부분 오늘의 만족에 쓴다. 안전 지향. 함정은 노후 준비의 공백.', ['retirement-fire', 'nps-breakeven', 'savings-tax-compare']],
      CAIF: ['마음 편한 낙관가', '즉흥적으로 쓰되 위험은 피하고, 미래는 잘 되리라 믿는다. 함정은 믿음만 있고 숫자가 없는 것.', ['finance-dashboard', 'first-100m', 'retirement-fire']],
      CAIN: ['오늘형 소비자', '지금 행복이 우선, 위험은 싫고, 계획은 나중에. 함정은 비상금 없이 카드값에 쫓기는 것.', ['finance-dashboard', 'labor-price-tag', 'first-100m']],
      CRPF: ['공격적 설계자', '쓰는 것도 투자하는 것도 크고 계획적이며 미래를 본다. 레버리지에 능함. 함정은 현금흐름이 막힐 때의 충격.', ['home-purchase-simulator', 'buy-vs-rent', 'loan-refinance']],
      CRPN: ['화려한 승부사', '지금을 위해 크게 쓰고 크게 건다. 함정은 소득이 끊길 때의 취약함.', ['quit-button', 'finance-dashboard', 'loan-prepayment']],
      CRIF: ['꿈 좇는 도전자', '즉흥적이고 도전적이지만 방향은 미래. 사업·이직 같은 큰 변화를 겁내지 않는다. 함정은 준비 없는 점프.', ['job-offer-compare', 'quit-button', 'what-if-invested']],
      CRIN: ['자유로운 영혼', '쓰고, 걸고, 즉흥적으로, 오늘을 산다. 가장 즐겁게 살지만 가장 위험한 유형. 함정은 30대 후반의 후회.', ['finance-dashboard', 'peer-percentile', 'first-100m']],
    };
    const AX = { S: '모으기', C: '쓰기', A: '안정', R: '도전', P: '계획', I: '즉흥', F: '미래', N: '현재' };
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap); const body = HT.el('div'); wrap.append(body);
    let answers = {}; try { answers = JSON.parse(localStorage.getItem('ht_money_type') || '{}'); } catch (e) {}
    function draw() {
      body.innerHTML = ''; const list = HT.el('div');
      Q.forEach((q, i) => { const row = HT.el('div', { class: 'field' }); row.append(HT.el('label', {}, `${i + 1}. ${q[0]}`)); const seg = HT.el('div', { class: 'seg' });
        [[q[1], q[2]], [q[3], q[4]]].forEach(([k, t]) => { const b = HT.el('button', { type: 'button', class: answers[i] === k ? 'active' : '' }, t); b.addEventListener('click', () => { answers[i] = k; try { localStorage.setItem('ht_money_type', JSON.stringify(answers)); } catch (e) {} draw(); }); seg.append(b); }); row.append(seg); list.append(row); });
      body.append(HT.el('h3', {}, `12문항 중 ${Object.keys(answers).length}개 답함`), list);
      const done = Object.keys(answers).length === Q.length; const reset = HT.el('button', { class: 'btn sm', type: 'button' }, '다시 하기'); reset.addEventListener('click', () => { answers = {}; try { localStorage.removeItem('ht_money_type'); } catch (e) {} draw(); }); body.append(HT.el('div', { class: 'btns' }, reset));
      if (!done) return;
      const score = { S: 0, C: 0, A: 0, R: 0, P: 0, I: 0, F: 0, N: 0 }; Object.values(answers).forEach(k => score[k]++);
      const code = (score.S >= score.C ? 'S' : 'C') + (score.A >= score.R ? 'A' : 'R') + (score.P >= score.I ? 'P' : 'I') + (score.F >= score.N ? 'F' : 'N'); const T = TYPES[code];
      const share = `내 돈 성향은 [${code}] ${T[0]} — ${AX[code[0]]}·${AX[code[1]]}·${AX[code[2]]}·${AX[code[3]]}. 한손도구 돈 성향 16유형`;
      const btns = HT.shareButtons(share, { title: '내 돈 성향 16유형', big: `${code} ${T[0]}`, lines: [`${AX[code[0]]} · ${AX[code[1]]} · ${AX[code[2]]} · ${AX[code[3]]}`, T[1]], file: 'money-type' });
      const axes = [['S', 'C'], ['A', 'R'], ['P', 'I'], ['F', 'N']].map(([a, b]) => ({ label: `${AX[a]} ${score[a]} : ${score[b]} ${AX[b]}`, value: score[a] - score[b] }));
      body.append(HT.el('div', { class: 'kpi', style: 'margin-top:16px' }, [HT.el('div', { class: 'lbl' }, `내 유형 ${code}`), HT.el('div', { class: 'val' }, T[0]), HT.el('div', { class: 'sub' }, T[1])]),
        HT.el('div', { class: 'chart', html: `<svg viewBox="0 0 600 120">${axes.map((ax, i) => { const y = 14 + i * 28; const x = 300 + ax.value * 80; return `<line x1="60" y1="${y}" x2="540" y2="${y}" stroke="var(--line)"/><line x1="300" y1="${y - 8}" x2="300" y2="${y + 8}" stroke="var(--ink-soft)"/><circle cx="${x}" cy="${y}" r="7" fill="var(--brand-key)"/><text x="0" y="${y + 4}" font-size="11" fill="var(--ink-soft)">${HT.esc(ax.label.split(' ')[0])}</text><text x="600" y="${y + 4}" font-size="11" text-anchor="end" fill="var(--ink-soft)">${HT.esc(ax.label.split(' ').pop())}</text>`; }).join('')}</svg>` }),
        HT.el('h3', {}, '이 유형이 지금 써 보면 좋은 계산기'), HT.el('div', { class: 'note', html: T[2].map(id => { const c = HT.byId(id); return c ? `<a href="#/${id}">${c.name}</a>` : ''; }).filter(Boolean).join(' · ') }),
        HT.el('div', { class: 'alert', style: 'margin-top:12px' }, share), btns,
        HT.el('h3', { style: 'margin-top:16px' }, '16유형 한눈에'), HT.table(['코드', '이름', '축'], Object.entries(TYPES).map(([k, t]) => [k, t[0], k.split('').map(c => AX[c]).join('·')]), { hi: r => r[0] === code }));
    }
    draw();
  }
});
