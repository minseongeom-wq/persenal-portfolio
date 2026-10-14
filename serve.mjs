import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import './build.mjs';

const root=path.resolve('dist');
const port=Number(process.env.PORT ?? 5173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.otf':'font/otf','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!filename.startsWith(root+path.sep))throw Error('Invalid path');
    const body=await readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)] ?? 'application/octet-stream','Cache-Control':'no-store'});
    res.end(body);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
