import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 for(const name of ['sequence-03','sequence-04','video-1']){
  const source=pathToFileURL(process.cwd()+`/dist/assets/${name}.mp4`).href;
  const info=await page.evaluate(async source=>{
   document.body.replaceChildren();const video=document.createElement('video');video.muted=true;video.src=source;video.style.cssText='width:1280px;height:720px;object-fit:contain;transform:none';document.body.append(video);
   await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(Error(video.error?.message));});
   video.currentTime=Math.min(2,video.duration/3);
   await new Promise(resolve=>video.onseeked=resolve);
   return {duration:video.duration,width:video.videoWidth,height:video.videoHeight};
  },source);
  await page.screenshot({path:`video-preview-${name}.png`});
  console.log(JSON.stringify({name,...info}));
 }
}finally{await browser.close();}
