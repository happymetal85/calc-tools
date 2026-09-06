HT.register({
  id: 'exchange-rate', cat: '금융·투자', order: 4, name: '환율 계산기', keywords: '환율 환전 달러 엔 유로 TTS TTB',
  desc: '20개 통화를 서로 환산합니다. 온라인이면 공개 환율 API에서 매매기준율을 받아오고, 아니면 직접 입력한 환율로 계산합니다.',
  note: '기본 환율은 2026년 9월 5일 고시값이므로 "온라인 환율 불러오기"로 갱신하거나 은행 고시 환율을 직접 입력하세요. 살 때(TTS)·팔 때(TTB) 환율은 매매기준율에 스프레드를 더하고 뺀 값이며, 실제 은행·환전소 우대율에 따라 다릅니다. 한국수출입은행 고시 환율은 별도 인증키가 필요해 이 계산기는 open.er-api.com을 사용합니다.',
  render(root) {
    // 기본값: open.er-api.com 2026-09-05 00:02 UTC 고시 (KRW 기준 역산)
    const CUR = [['KRW', '대한민국 원', 1], ['USD', '미국 달러', 1347.71], ['EUR', '유로', 1567.40], ['JPY', '일본 엔 (100엔)', 864.30], ['CNY', '중국 위안', 202.06], ['GBP', '영국 파운드', 1824.82], ['HKD', '홍콩 달러', 172.12], ['TWD', '대만 달러', 42.62], ['SGD', '싱가포르 달러', 1064.96], ['AUD', '호주 달러', 971.82], ['CAD', '캐나다 달러', 976.56], ['CHF', '스위스 프랑', 1666.67], ['THB', '태국 바트', 40.99], ['VND', '베트남 동 (100동)', 5.19], ['PHP', '필리핀 페소', 21.51], ['IDR', '인도네시아 루피아 (100루피아)', 7.64], ['MYR', '말레이시아 링깃', 333.78], ['INR', '인도 루피', 14.27], ['NZD', '뉴질랜드 달러', 793.02], ['SEK', '스웨덴 크로나', 141.22], ['AED', '아랍에미리트 디르함', 367.38]];
    const per100 = { JPY: 100, VND: 100, IDR: 100 };
    const rates = Object.fromEntries(CUR.map(c => [c[0], c[2]])); let source = '2026-09-05 기준 고시 (open.er-api.com) — 갱신하려면 온라인 환율 불러오기';
    const out = HT.output(root);
    const fetchBtn = HT.el('button', { class: 'btn', type: 'button' }, '온라인 환율 불러오기');
    const swapBtn = HT.el('button', { class: 'btn', type: 'button' }, '↔ 통화 바꾸기');
    const f = HT.form(root, [
      { id: 'from', label: '보유 통화', type: 'select', options: CUR.map(c => [c[0], `${c[0]} · ${c[1]}`]), value: 'USD' },
      { id: 'amt', label: '환전 금액', type: 'number', value: 1000, step: 'any' },
      { id: 'to', label: '환전 통화', type: 'select', options: CUR.map(c => [c[0], `${c[0]} · ${c[1]}`]), value: 'KRW' },
      { id: 'rate', label: '매매기준율 (보유 통화 1단위 = 원)', type: 'number', step: 'any', help: '통화를 고르면 자동 입력됩니다. 직접 고쳐도 됩니다.' },
      { id: 'spread', label: '현찰 스프레드', type: 'number', unit: '%', value: 1.75, step: 0.05 },
    ], calc, { extra: HT.el('div', { class: 'btns' }, [fetchBtn, swapBtn]) });
    let lastFrom = null;
    function unitRate(c) { return rates[c] / (per100[c] || 1); } // 1단위당 원
    function calc(v) {
      if (v.from !== lastFrom) { lastFrom = v.from; f.el('rate').value = HT.fmt(unitRate(v.from), 4).replace(/,/g, ''); v.rate = unitRate(v.from); }
      const fromKrw = v.rate || unitRate(v.from); const toKrw = unitRate(v.to); const result = v.amt * fromKrw / toKrw;
      const tts = fromKrw * (1 + v.spread / 100), ttb = fromKrw * (1 - v.spread / 100);
      const d = v.to === 'KRW' ? 0 : 2;
      out.set(HT.kpi(`${HT.fmt(v.amt, 2)} ${v.from} =`, `${HT.fmt(result, d)} ${v.to}`, `1 ${v.from} = ${HT.fmt(fromKrw / toKrw, 4)} ${v.to}`),
        HT.rows([['매매기준율 (TTM)', `${HT.fmt(fromKrw, 2)}원 / 1 ${v.from}`], ['살 때 (TTS, 현찰 사실 때)', `${HT.fmt(tts, 2)}원`, 'sub', `원화로 ${v.from} 살 때 · ${HT.won(v.amt * tts)} 필요`], ['팔 때 (TTB, 현찰 파실 때)', `${HT.fmt(ttb, 2)}원`, 'sub', `${v.from} 팔면 ${HT.won(v.amt * ttb)} 수령`], ['환율 출처', source]]),
        HT.table(['통화', '매매기준율 (원)'], CUR.filter(c => c[0] !== 'KRW').map(c => [`${c[0]} · ${c[1]}`, HT.fmt(rates[c[0]], 2)]), { right: [1] }));
    }
    swapBtn.addEventListener('click', () => { const v = f.values(); f.el('from').value = v.to; f.el('to').value = v.from; lastFrom = null; f.fire(); });
    fetchBtn.addEventListener('click', async () => {
      fetchBtn.disabled = true; fetchBtn.textContent = '불러오는 중…';
      try { const res = await fetch('https://open.er-api.com/v6/latest/KRW'); const d = await res.json(); if (!d.rates) throw new Error('응답 형식 오류');
        CUR.forEach(c => { if (d.rates[c[0]]) rates[c[0]] = (per100[c[0]] || 1) / d.rates[c[0]]; }); rates.KRW = 1; source = `open.er-api.com · ${new Date(d.time_last_update_utc).toLocaleString('ko-KR')} 기준`; lastFrom = null; f.fire(); fetchBtn.textContent = '환율 갱신 완료'; }
      catch (e) { fetchBtn.textContent = '불러오기 실패 (오프라인?)'; }
      finally { fetchBtn.disabled = false; setTimeout(() => { fetchBtn.textContent = '온라인 환율 불러오기'; }, 3000); }
    });
    calc(f.values());
  }
});
