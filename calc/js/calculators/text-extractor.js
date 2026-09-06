HT.register({
  id: 'text-extractor', cat: '유용한도구', order: 5, name: '텍스트 추출기', keywords: 'OCR 텍스트 추출 PDF 이미지 워드 엑셀',
  desc: '이미지(OCR)·PDF·DOCX·XLSX·CSV·TXT 파일에서 텍스트를 뽑아 TXT 또는 마크다운으로 저장합니다. 파일은 브라우저 안에서만 처리되고 서버로 보내지 않습니다.',
  note: '이미지 OCR은 Tesseract.js(한국어+영어)를 처음 실행할 때 언어 데이터(약 15MB)를 내려받습니다. PDF는 텍스트 레이어를 읽으며, 스캔 PDF는 페이지를 이미지로 그려 OCR합니다(느릴 수 있음). HWP·HWPX는 브라우저에서 해석할 수 없어 지원하지 않습니다.',
  render(root) {
    const wrap = HT.el('div', { class: 'panel wide' }); root.append(wrap);
    const drop = HT.el('div', { class: 'drop' }, '여기에 파일을 끌어다 놓거나 클릭해서 선택 (PNG·JPG·GIF·BMP·WEBP·PDF·DOCX·XLSX·CSV·TXT, 10MB 이하)');
    const file = HT.el('input', { type: 'file', style: 'display:none', accept: '.png,.jpg,.jpeg,.gif,.bmp,.webp,.tif,.tiff,.pdf,.docx,.xlsx,.xls,.csv,.txt,.md' });
    const status = HT.el('div', { class: 'help', style: 'margin:8px 0' }); const out = HT.el('textarea', { class: 'out', placeholder: '추출된 텍스트가 여기에 표시됩니다.' });
    const fmt = HT.el('div', { class: 'seg' }); let format = 'txt'; [['txt', '텍스트 (TXT)'], ['md', '마크다운 (MD)']].forEach(([k, l]) => { const b = HT.el('button', { type: 'button', class: k === format ? 'active' : '' }, l); b.addEventListener('click', () => { format = k; [...fmt.children].forEach(c => c.classList.toggle('active', c === b)); if (last) render(); }); fmt.append(b); });
    const copy = HT.el('button', { class: 'btn', type: 'button' }, '복사'), dl = HT.el('button', { class: 'btn', type: 'button' }, '다운로드');
    wrap.append(drop, file, status, HT.el('div', { class: 'btns' }, [fmt, copy, dl]), out);
    drop.addEventListener('click', () => file.click()); file.addEventListener('change', () => file.files[0] && handle(file.files[0]));
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); }); drop.addEventListener('dragleave', () => drop.classList.remove('over')); drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); e.dataTransfer.files[0] && handle(e.dataTransfer.files[0]); });
    copy.addEventListener('click', () => { navigator.clipboard?.writeText(out.value); copy.textContent = '복사됨'; setTimeout(() => copy.textContent = '복사', 1500); });
    dl.addEventListener('click', () => { const a = HT.el('a', { href: URL.createObjectURL(new Blob([out.value], { type: 'text/plain;charset=utf-8' })), download: (lastName || 'text') + '.' + format }); a.click(); });
    let last = null, lastName = '';
    const loadScript = (src) => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('라이브러리 로드 실패 (인터넷 연결 확인): ' + src)); document.head.append(s); });
    const CDN = { tess: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', pdf: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', pdfw: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', zip: 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js' };
    const tableToText = (rows, md) => md ? rows.map((r, i) => '| ' + r.join(' | ') + ' |' + (i === 0 ? '\n| ' + r.map(() => '---').join(' | ') + ' |' : '')).join('\n') : rows.map(r => r.join('\t')).join('\n');
    function render() { const md = format === 'md'; out.value = last.blocks.map(b => b.type === 'table' ? tableToText(b.rows, md) : b.type === 'heading' && md ? '## ' + b.text : b.text).join('\n\n'); }
    async function ocrImage(src, onProgress) { await loadScript(CDN.tess); const worker = await Tesseract.createWorker('kor+eng', 1, { logger: m => { if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100)); } }); const { data } = await worker.recognize(src); await worker.terminate(); return data.text; }
    async function handle(fl) {
      if (fl.size > 10 * 1024 * 1024) { status.textContent = '10MB 이하 파일만 지원합니다.'; return; }
      lastName = fl.name.replace(/\.[^.]+$/, ''); const ext = fl.name.split('.').pop().toLowerCase(); status.textContent = `${fl.name} 처리 중…`; out.value = ''; last = { blocks: [] };
      try {
        if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tif', 'tiff'].includes(ext)) { const url = URL.createObjectURL(fl); const text = await ocrImage(url, p => status.textContent = `OCR 진행 중… ${p}%`); last.blocks.push({ type: 'p', text: text.trim() }); }
        else if (ext === 'pdf') { await loadScript(CDN.pdf); pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfw; const pdf = await pdfjsLib.getDocument({ data: await fl.arrayBuffer() }).promise;
          for (let i = 1; i <= pdf.numPages; i++) { status.textContent = `PDF ${i}/${pdf.numPages} 페이지…`; const page = await pdf.getPage(i); const tc = await page.getTextContent(); let text = tc.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join('').trim();
            if (!text) { const vp = page.getViewport({ scale: 2 }); const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; text = (await ocrImage(cv, p => status.textContent = `PDF ${i}페이지 OCR… ${p}%`)).trim(); }
            last.blocks.push({ type: 'heading', text: `${i}페이지` }, { type: 'p', text }); } }
        else if (ext === 'docx') { await loadScript(CDN.zip); const zip = await JSZip.loadAsync(fl); const xml = await zip.file('word/document.xml').async('string'); const doc = new DOMParser().parseFromString(xml, 'application/xml');
          const body = doc.getElementsByTagNameNS('*', 'body')[0]; [...body.children].forEach(node => { const tag = node.localName; if (tag === 'p') { const t = [...node.getElementsByTagNameNS('*', 't')].map(x => x.textContent).join(''); if (t.trim()) last.blocks.push({ type: /Heading|제목/.test(node.innerHTML) ? 'heading' : 'p', text: t }); } else if (tag === 'tbl') { const rows = [...node.getElementsByTagNameNS('*', 'tr')].map(tr => [...tr.getElementsByTagNameNS('*', 'tc')].map(tc => [...tc.getElementsByTagNameNS('*', 't')].map(x => x.textContent).join('').trim())); last.blocks.push({ type: 'table', rows }); } }); }
        else if (['xlsx', 'xls', 'csv'].includes(ext)) { await loadScript(CDN.xlsx); const buf = await fl.arrayBuffer(); let wb; if (ext === 'csv') { const bytes = new Uint8Array(buf); let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { text = new TextDecoder('euc-kr').decode(bytes); } wb = XLSX.read(text, { type: 'string' }); } else wb = XLSX.read(buf, { type: 'array' });
          wb.SheetNames.forEach(n => { const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, blankrows: false }).map(r => r.map(c => c == null ? '' : String(c))); if (rows.length) last.blocks.push({ type: 'heading', text: n }, { type: 'table', rows }); }); }
        else if (['txt', 'md'].includes(ext)) { const bytes = new Uint8Array(await fl.arrayBuffer()); let text; try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { text = new TextDecoder('euc-kr').decode(bytes); } last.blocks.push({ type: 'p', text }); }
        else if (['hwp', 'hwpx'].includes(ext)) throw new Error('HWP/HWPX는 브라우저에서 지원하지 않습니다. 한글에서 PDF나 DOCX로 저장한 뒤 올려 주세요.');
        else throw new Error('지원하지 않는 형식입니다: ' + ext);
        render(); status.textContent = `${fl.name} — 완료 (${HT.fmt(out.value.length)}자)`;
      } catch (e) { status.textContent = '오류: ' + e.message; console.error(e); }
    }
  }
});
