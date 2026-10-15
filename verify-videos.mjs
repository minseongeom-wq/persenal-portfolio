import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const port=5186;
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe'],windowsHide:true});
const ready=new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve();});server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)));});
let browser;
try{
 await ready;
 const range=await fetch(`http://127.0.0.1:${port}/assets/video-1.mp4`,{headers:{Range:'bytes=0-1023'}});
 if(range.status!==206||range.headers.get('content-type')!=='video/mp4'||(await range.arrayBuffer()).byteLength!==1024)throw Error('Video range response failed');
 const invalid=await fetch(`http://127.0.0.1:${port}/assets/video-1.mp4`,{headers:{Range:'bytes=999999999-'}});
 if(invalid.status!==416)throw Error('Invalid range was accepted');
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const requests=[];page.on('request',request=>{if(request.url().endsWith('.mp4'))requests.push(request.url());});
 await page.goto(`http://127.0.0.1:${port}`);
 await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
 if(await page.locator('video').count()!==3)throw Error('Expected 3 videos');
 await page.waitForTimeout(400);
 if(requests.length)throw Error('Offscreen videos were fetched on initial load');
 const checkFit=async video=>{
  const fit=await video.evaluate(v=>{
   const style=getComputedStyle(v),matrix=new DOMMatrixReadOnly(style.transform);
   const frame=v.closest('[data-name="Contribution / Preview Image"],[data-node-id="948:2744"]');
   return {development:v.classList.contains('portfolio-video--development'),desktop:innerWidth>600,x:Math.abs(matrix.a),y:Math.abs(matrix.d),fit:style.objectFit,clip:style.clipPath,overflow:getComputedStyle(frame).overflow};
  });
  const expectedClip=fit.development&&fit.desktop?'inset(70px 0px 69px)':'none';
  if(Math.abs(fit.x-fit.y)>.001||fit.fit!=='cover'||fit.clip!==expectedClip||fit.overflow!=='hidden')throw Error('Video fit mismatch: '+JSON.stringify(fit));
  if(fit.development&&fit.x!==1)throw Error('Development video zoom was not restored');
 };
 const states=[];
 for(const variant of ['systemizing','visual','development']){
  const video=page.locator(`.portfolio-video--${variant}`);
  await video.evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-200));
  await page.waitForFunction(variant=>{const v=document.querySelector('.portfolio-video--'+variant);return v.readyState>=2&&!v.paused&&v.currentTime>.15;},variant);
  const start=await video.evaluate(v=>v.currentTime);
  await page.waitForTimeout(450);
  const state=await video.evaluate(v=>({time:v.currentTime,duration:v.duration,muted:v.muted,loop:v.loop,inline:v.playsInline,width:v.videoWidth,height:v.videoHeight,error:v.error?.message}));
  if(state.time<=start||!state.muted||!state.loop||!state.inline||state.error)throw Error('Video playback failed: '+variant+JSON.stringify(state));
  if(state.width!==1280||state.height!==720)throw Error('Unoptimized video was loaded');
  await checkFit(video);
  await page.screenshot({path:`video-live-${variant}.png`});states.push({variant,...state});
 }
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.waitForFunction(()=>[...document.querySelectorAll('video')].every(v=>v.paused));
 await page.setViewportSize({width:390,height:844});
 for(const variant of ['systemizing','visual','development']){
  const video=page.locator(`.portfolio-video--${variant}`);
  await video.evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-120));
  await page.waitForFunction(variant=>!document.querySelector('.portfolio-video--'+variant).paused,variant);
  const box=await video.boundingBox();if(!box.width||!box.height)throw Error('Mobile video collapsed');
  await checkFit(video);
  await page.screenshot({path:`video-mobile-${variant}.png`});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({rangeRequests:true,states,offscreenPaused:true,mobilePlayback:true}));
}finally{await browser?.close();server.kill();}
