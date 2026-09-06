// 아파트 실거래가 조회용 최소 프록시 — 국토교통부 API는 브라우저 직접 호출(CORS)을 막으므로 로컬에서 중계한다.
// 실행: node tools/proxy.js   (기본 포트 8787, 환경변수 PORT로 변경)
// 요청: GET /apt?LAWD_CD=11680&DEAL_YMD=202608&serviceKey=<인증키>
const http = require('http');
const https = require('https');
const { URL } = require('url');
const PORT = process.env.PORT || 8787;
const UPSTREAM = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname !== '/apt') { res.writeHead(404); return res.end('not found'); }
  const key = u.searchParams.get('serviceKey'), lawd = u.searchParams.get('LAWD_CD'), ymd = u.searchParams.get('DEAL_YMD');
  if (!key || !lawd || !ymd) { res.writeHead(400); return res.end('LAWD_CD, DEAL_YMD, serviceKey 필요'); }
  const target = `${UPSTREAM}?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawd}&DEAL_YMD=${ymd}&numOfRows=1000&pageNo=1&_type=json`;
  https.get(target, up => { let body = ''; up.on('data', c => body += c); up.on('end', () => { res.writeHead(up.statusCode, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(body); }); })
    .on('error', e => { res.writeHead(502); res.end(JSON.stringify({ error: e.message })); });
}).listen(PORT, () => console.log(`실거래가 프록시 실행 중: http://localhost:${PORT}/apt`));
