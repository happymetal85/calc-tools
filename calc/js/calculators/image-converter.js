HT.register({
  id: 'image-converter', cat: '유용한도구', order: 6, name: '이미지 변환기', keywords: '이미지 변환 JPG PNG WebP HEIC 압축 리사이즈',
  desc: 'JPG·PNG·WebP·BMP·GIF·AVIF·HEIC 이미지를 JPG·PNG·WebP로 바꾸고, 품질과 크기를 조절해 용량을 줄입니다. 모두 브라우저 안에서 처리합니다.',
  note: 'HEIC(아이폰 사진)는 브라우저가 직접 열지 못해 heic2any 라이브러리를 온라인에서 내려받아 변환합니다. 품질 80% 전후가 화질과 용량의 균형점이며 원본 대비 60~80% 정도 줄어듭니다. 비율 유지를 켜면 가로 또는 세로 한쪽만 입력해도 나머지가 자동 계산됩니다. 최대 20MB.',
  render(root) {
    const out = HT.output(root, '미리보기'); let img = null, srcFile = null, natural = [0, 0];
    const drop = HT.el('div', { class: 'drop' }, '이미지를 끌어다 놓거나 클릭해서 선택 (최대 20MB)');
    const file = HT.el('input', { type: 'file', style: 'display:none', accept: 'image/*,.heic,.heif,.avif' });
    const dl = HT.el('button', { class: 'btn primary', type: 'button' }, '변환해서 저장'); dl.disabled = true;
    const f = HT.form(root, [
      { id: 'fmt', label: '출력 형식', type: 'seg', options: [['image/jpeg', 'JPG'], ['image/png', 'PNG'], ['image/webp', 'WebP']], value: 'image/jpeg' },
      { id: 'q', label: '품질', type: 'range', min: 10, max: 100, step: 5, value: 80, unit: '%', showValue: true, show: v => v.fmt !== 'image/png' },
      { id: 'w', label: '가로', type: 'number', unit: 'px', placeholder: '원본' },
      { id: 'h', label: '세로', type: 'number', unit: 'px', placeholder: '원본' },
      { id: 'keep', label: '비율 유지', type: 'check', value: true },
      { id: 'bg', label: 'JPG 변환 시 투명 배경을 흰색으로', type: 'check', value: true },
    ], update, { extra: HT.el('div', {}, [drop, file, HT.el('div', { class: 'btns' }, dl)]) });
    drop.addEventListener('click', () => file.click()); file.addEventListener('change', () => file.files[0] && load(file.files[0]));
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); }); drop.addEventListener('dragleave', () => drop.classList.remove('over')); drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); e.dataTransfer.files[0] && load(e.dataTransfer.files[0]); });
    let lock = false;
    f.el('w').addEventListener('input', () => { if (lock || !f.values().keep || !natural[0]) return; lock = true; const w = HT.num(f.el('w').value); f.el('h').value = w ? Math.round(w * natural[1] / natural[0]) : ''; lock = false; update(f.values()); });
    f.el('h').addEventListener('input', () => { if (lock || !f.values().keep || !natural[1]) return; lock = true; const h = HT.num(f.el('h').value); f.el('w').value = h ? Math.round(h * natural[0] / natural[1]) : ''; lock = false; update(f.values()); });
    out.set(HT.el('div', { class: 'empty' }, '이미지를 올리면 미리보기와 예상 용량이 표시됩니다.'));
    async function load(fl) {
      if (fl.size > 20 * 1024 * 1024) { out.set(HT.el('div', { class: 'alert' }, '20MB 이하 이미지만 지원합니다.')); return; }
      srcFile = fl; out.set(HT.el('div', { class: 'empty' }, '불러오는 중…')); let blob = fl;
      try {
        if (/\.(heic|heif)$/i.test(fl.name) || /heic|heif/.test(fl.type)) { if (!window.heic2any) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js'; s.onload = res; s.onerror = () => rej(new Error('heic2any 로드 실패 (인터넷 연결 확인)')); document.head.append(s); }); blob = await heic2any({ blob: fl, toType: 'image/png' }); if (Array.isArray(blob)) blob = blob[0]; }
        img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('이미지를 열 수 없습니다 (형식 미지원)')); i.src = URL.createObjectURL(blob); });
        natural = [img.naturalWidth, img.naturalHeight]; f.el('w').value = ''; f.el('h').value = ''; dl.disabled = false; update(f.values());
      } catch (e) { out.set(HT.el('div', { class: 'alert' }, e.message)); }
    }
    function draw(v) { let w = v.w || natural[0], h = v.h || natural[1]; if (v.keep && (v.w || v.h)) { if (v.w && !v.h) h = Math.round(v.w * natural[1] / natural[0]); if (v.h && !v.w) w = Math.round(v.h * natural[0] / natural[1]); } const cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = Math.max(1, h); const ctx = cv.getContext('2d'); if (v.fmt === 'image/jpeg' && v.bg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); } ctx.drawImage(img, 0, 0, cv.width, cv.height); return cv; }
    let pending = null;
    function update(v) { if (!img) return; clearTimeout(pending); pending = setTimeout(async () => { const cv = draw(v); const blob = await new Promise(r => cv.toBlob(r, v.fmt, v.q / 100)); const url = URL.createObjectURL(blob); const ratio = srcFile.size ? (1 - blob.size / srcFile.size) * 100 : 0;
      out.set(HT.kpis([['원본', fmtSize(srcFile.size), `${natural[0]} × ${natural[1]}`], ['변환 후', fmtSize(blob.size), `${cv.width} × ${cv.height}`], ['용량 변화', (ratio >= 0 ? '−' : '+') + HT.pct(Math.abs(ratio), 0), v.fmt.split('/')[1].toUpperCase() + (v.fmt !== 'image/png' ? ` 품질 ${v.q}%` : '')]]), HT.el('div', { class: 'preview' }, HT.el('img', { src: url, alt: '변환 미리보기' })));
      dl.onclick = () => { const ext = v.fmt === 'image/jpeg' ? 'jpg' : v.fmt === 'image/png' ? 'png' : 'webp'; const a = HT.el('a', { href: url, download: srcFile.name.replace(/\.[^.]+$/, '') + '.' + ext }); a.click(); }; }, 150); }
    function fmtSize(b) { return b >= 1048576 ? HT.fmt(b / 1048576, 2) + ' MB' : HT.fmt(b / 1024, 1) + ' KB'; }
  }
});
