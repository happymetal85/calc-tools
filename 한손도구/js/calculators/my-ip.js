HT.register({
  id: 'my-ip', cat: '유용한도구', order: 4, name: '내 IP 주소 조회', keywords: 'IP 주소 공인IP ISP 위치 브라우저',
  desc: '공인 IP 주소와 대략적인 위치·통신사 정보, 브라우저 정보를 보여줍니다. 인터넷 연결이 필요합니다.',
  note: '위치 정보는 지역 인터넷 등록기관(APNIC 등)에 등록된 ISP 네트워크 정보를 기준으로 하므로 실제 위치와 다를 수 있습니다(국가 99%, 도시 50~80% 정확도). VPN·프록시를 쓰면 그 서버의 위치가 표시됩니다. 조회에는 ipwho.is 공개 API를 사용하며 IP 외의 개인정보는 보내지 않습니다.',
  render(root) {
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap); const body = HT.el('div', { class: 'empty' }, '조회 중…'); wrap.append(body);
    const btn = HT.el('button', { class: 'btn', type: 'button' }, '다시 조회'); btn.addEventListener('click', load); wrap.append(HT.el('div', { class: 'btns' }, btn));
    const ua = navigator.userAgent; const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '알 수 없음'; const os = /Windows NT 10/.test(ua) ? 'Windows 10/11' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '알 수 없음';
    const local = () => HT.rows([['브라우저', browser], ['운영체제', os], ['언어', navigator.language], ['화면', `${screen.width} × ${screen.height} (배율 ${window.devicePixelRatio})`], ['시간대', Intl.DateTimeFormat().resolvedOptions().timeZone], ['User-Agent', HT.el('span', { style: 'white-space:normal;font-size:12px' }, ua)]]);
    async function load() {
      body.className = 'empty'; body.textContent = '조회 중…'; btn.disabled = true;
      try {
        const r = await fetch('https://ipwho.is/'); const d = await r.json(); if (!d.success) throw new Error(d.message || '조회 실패');
        const copy = HT.el('button', { class: 'btn sm', type: 'button' }, '복사'); copy.addEventListener('click', () => { navigator.clipboard?.writeText(d.ip); copy.textContent = '복사됨'; setTimeout(() => copy.textContent = '복사', 1500); });
        body.className = ''; body.innerHTML = '';
        body.append(HT.kpi('공인 IP 주소 (' + (d.type || 'IPv4') + ')', d.ip, ''), HT.el('div', { style: 'margin:-8px 0 12px' }, copy),
          HT.el('div', { class: 'row2' }, [HT.el('div', {}, [HT.el('h3', {}, '위치 정보'), HT.rows([['국가', `${d.country} (${d.country_code})`], ['지역', d.region || '-'], ['도시', d.city || '-'], ['우편번호', d.postal || '-'], ['시간대', d.timezone?.id || '-'], ['좌표 (대략)', d.latitude != null ? `${d.latitude}, ${d.longitude}` : '-']])]), HT.el('div', {}, [HT.el('h3', {}, '네트워크 정보'), HT.rows([['ISP', d.connection?.isp || '-'], ['소속 기관', d.connection?.org || '-'], ['AS 번호', d.connection?.asn ? 'AS' + d.connection.asn : '-'], ['도메인', d.connection?.domain || '-']])])]),
          HT.el('h3', { style: 'margin-top:16px' }, '브라우저 정보'), local());
      } catch (e) { body.className = ''; body.innerHTML = ''; body.append(HT.el('div', { class: 'alert' }, 'IP 정보를 가져오지 못했습니다: ' + e.message + ' (인터넷 연결 또는 광고 차단기를 확인하세요)'), HT.el('h3', { style: 'margin-top:16px' }, '브라우저 정보'), local()); }
      finally { btn.disabled = false; }
    }
    load();
  }
});
