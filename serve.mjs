import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import './build.mjs';

const root=path.resolve('dist');
const port=Number(process.env.PORT ?? 5173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.otf':'font/otf','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm'};
types['.webp']='image/webp';
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!filename.startsWith(root+path.sep))throw Error('Invalid path');
    if(['.mp4','.webm'].includes(path.extname(filename))){
      const {size}=await stat(filename);
      const headers={'Content-Type':types[path.extname(filename)],'Accept-Ranges':'bytes','Cache-Control':'no-store'};
      let start=0,end=size-1,status=200;
      if(req.headers.range){
        const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if(!range||(!range[1]&&!range[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
        start=range[1]?Number(range[1]):Math.max(0,size-Number(range[2]));
        end=range[1]&&range[2]?Math.min(size-1,Number(range[2])):size-1;
        if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
        headers['Content-Range']=`bytes ${start}-${end}/${size}`;status=206;
      }
      res.writeHead(status,{...headers,'Content-Length':end-start+1});
      if(req.method==='HEAD'){res.end();return;}
      const stream=createReadStream(filename,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return;
    }
    const body=await readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)] ?? 'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Not found');}
});
const ipv6Server=createServer(server.listeners('request')[0]);
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${server.address().port}`));
ipv6Server.on('error',error=>{
 if(error.code==='EAFNOSUPPORT'||error.code==='EADDRNOTAVAIL'){console.log('IPv6 loopback unavailable; use the IPv4 Local URL.');return;}
 console.error(error);process.exitCode=1;
});
ipv6Server.listen(port,'::1',()=>console.log(`Local: http://localhost:${ipv6Server.address().port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{ipv6Server.close();server.close(()=>process.exit(0));});
