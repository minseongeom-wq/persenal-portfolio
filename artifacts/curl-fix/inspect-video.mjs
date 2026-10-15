import {createServer} from 'node:http';
import {createReadStream,statSync} from 'node:fs';
import {chromium} from 'playwright';
const file='C:/Users/mbc/Videos/Captures/Eom minseong — Portfolio 2026 - Chrome 2026-10-15 16-55-24.mp4';
const size=statSync(file).size;
const server=createServer((req,res)=>{
 const match=req.headers.range?.match(/bytes=(\d+)-(\d*)/),start=match?Number(match[1]):0,end=match&&match[2]?Number(match[2]):size-1;
 res.writeHead(match?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(match?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});
 createReadStream(file,{start,end}).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.setContent(`<video src="http://127.0.0.1:${server.address().port}" style="width:100%;height:760px;object-fit:contain" muted></video>`);
 await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
 const duration=await page.locator('video').evaluate(video=>video.duration);console.log({duration});
 for(const fraction of [.2,.5,.8]){
  await page.locator('video').evaluate((video,time)=>new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=time;}),duration*fraction);
  await page.screenshot({path:`artifacts/curl-fix/reference-${fraction}.png`});
 }
}finally{await browser.close();server.close();}
