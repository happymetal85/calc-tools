HT.register({
  id: 'apt-trade', cat: '부동산', order: 3, name: '아파트 실거래가 조회', keywords: '실거래가 아파트 국토교통부',
  desc: '국토교통부 실거래가 공개 API로 지역·월별 아파트 매매 실거래를 조회합니다. 공공데이터포털 인증키와 프록시 서버가 필요합니다.',
  note: '국토교통부 API는 브라우저 직접 호출(CORS)을 허용하지 않습니다. <code>tools/proxy.js</code>를 Node로 실행한 뒤(기본 http://localhost:8787) 인증키를 넣어 조회하세요. <b>이 계산기만 공개 주소(https)에서는 동작하지 않습니다</b> — 브라우저가 https 페이지에서 http 프록시를 부르는 것을 막기 때문이며, 내려받아 <code>localhost</code>로 열면 됩니다. 해제된 거래(해제 여부 O)는 완료되지 않은 거래이므로 시세 판단에서 빼는 것이 좋습니다.',
  render(root) {
    const REGIONS = [['11680', '서울 강남구'], ['11650', '서울 서초구'], ['11710', '서울 송파구'], ['11740', '서울 강동구'], ['11440', '서울 마포구'], ['11170', '서울 용산구'], ['11200', '서울 성동구'], ['11215', '서울 광진구'], ['11560', '서울 영등포구'], ['11590', '서울 동작구'], ['11470', '서울 양천구'], ['11500', '서울 강서구'], ['11350', '서울 노원구'], ['11110', '서울 종로구'], ['11140', '서울 중구'], ['11410', '서울 서대문구'], ['11380', '서울 은평구'], ['11290', '서울 성북구'], ['11230', '서울 동대문구'], ['11260', '서울 중랑구'], ['11305', '서울 강북구'], ['11320', '서울 도봉구'], ['11530', '서울 구로구'], ['11545', '서울 금천구'], ['11620', '서울 관악구'], ['41135', '경기 성남 분당구'], ['41117', '경기 수원 영통구'], ['41285', '경기 고양 일산동구'], ['28185', '인천 연수구'], ['26350', '부산 해운대구'], ['27260', '대구 수성구'], ['30200', '대전 유성구'], ['36110', '세종시']];
    const ym = new Date(); ym.setMonth(ym.getMonth() - 1);
    const out = HT.output(root, '조회 결과');
    const btn = HT.el('button', { class: 'btn primary', type: 'button' }, '조회');
    const f = HT.form(root, [
      { id: 'key', label: '공공데이터포털 인증키 (Decoding)', type: 'text', placeholder: '인증키를 붙여넣으세요', help: '브라우저에만 저장(localStorage)되며 프록시로만 전달됩니다.' },
      { id: 'proxy', label: '프록시 주소', type: 'text', value: 'http://localhost:8787' },
      { id: 'region', label: '시/군/구', type: 'select', options: REGIONS },
      { id: 'code', label: '법정동 코드 직접 입력 (5자리, 선택)', type: 'text', placeholder: '예: 11680' },
      { id: 'ym', label: '거래 년월', type: 'text', value: ym.toISOString().slice(0, 7).replace('-', ''), help: 'YYYYMM' },
      { id: 'apt', label: '아파트명 (선택)', type: 'text', placeholder: '단지명 일부' },
    ], null, { extra: btn });
    try { const k = localStorage.getItem('ht_datago_key'); if (k) f.set('key', k); } catch (e) {}
    out.set(HT.el('div', { class: 'empty' }, '인증키와 지역·년월을 입력하고 조회를 누르세요.'));
    btn.addEventListener('click', async () => {
      const v = f.values(); if (!v.key) { out.set(HT.el('div', { class: 'alert' }, '인증키를 입력하세요. data.go.kr에서 "국토교통부_아파트 매매 실거래가 자료" 활용신청 후 발급됩니다.')); return; }
      try { localStorage.setItem('ht_datago_key', v.key); } catch (e) {}
      const code = (v.code || v.region).trim(); btn.disabled = true; out.set(HT.el('div', { class: 'empty' }, '조회 중…'));
      try {
        const url = `${v.proxy.replace(/\/$/, '')}/apt?LAWD_CD=${code}&DEAL_YMD=${v.ym}&serviceKey=${encodeURIComponent(v.key)}`;
        const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json(); let items = data?.response?.body?.items?.item || []; if (!Array.isArray(items)) items = [items];
        if (v.apt) items = items.filter(i => String(i.aptNm || i['아파트'] || '').includes(v.apt));
        if (!items.length) { out.set(HT.el('div', { class: 'empty' }, '조회 결과가 없습니다. ' + (data?.response?.header?.resultMsg || ''))); return; }
        const g = (i, ...ks) => { for (const k of ks) if (i[k] != null) return String(i[k]).trim(); return ''; };
        const rows = items.map(i => [g(i, 'aptNm', '아파트'), g(i, 'umdNm', '법정동'), g(i, 'excluUseAr', '전용면적'), g(i, 'floor', '층'), HT.fmt(HT.num(g(i, 'dealAmount', '거래금액'))) + '만', g(i, 'buildYear', '건축년도'), `${g(i, 'dealYear', '년')}-${g(i, 'dealMonth', '월')}-${g(i, 'dealDay', '일')}`, g(i, 'cdealType', '해제여부') || '-']);
        out.set(HT.el('p', { class: 'page-desc' }, `${items.length}건`), HT.table(['아파트', '법정동', '전용(㎡)', '층', '거래금액', '건축년도', '거래일', '해제'], rows, { right: [2, 3, 4] }));
      } catch (e) { out.set(HT.el('div', { class: 'alert' }, '조회 실패: ' + e.message + ' — 프록시 서버가 실행 중인지, 인증키가 맞는지 확인하세요.')); }
      finally { btn.disabled = false; }
    });
  }
});
