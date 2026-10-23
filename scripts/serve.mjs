import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 4173);
const mime = {'.html':'text/html; charset=utf-8', '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {res.writeHead(204);return res.end();}
  if (req.method !== 'GET' && req.method !== 'HEAD') {res.writeHead(405);return res.end();}
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    const pathname = decodeURIComponent(url.pathname);
    const target = path.resolve(root, `.${pathname}`, pathname.endsWith('/')?'index.html':'');
    if (target !== root && !target.startsWith(root + path.sep)) throw new Error('Access denied');
    const bytes = await readFile(target);
    res.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
    res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
  } catch {res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');}
}).listen(port, '127.0.0.1', ()=>console.log(`Local preview: http://localhost:${port}`));
