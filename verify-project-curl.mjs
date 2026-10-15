import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'5191'},stdio:['ignore','pipe','pipe'],windowsHide:true});
const ready=new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve();});server.once('error',reject);});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 await ready;
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const original=WebGLRenderingContext.prototype.drawArrays;
  WebGLRenderingContext.prototype.drawArrays=function(...args){if(this.canvas.classList.contains('project-gallery__curl'))this.canvas.dataset.draws=String(Number(this.canvas.dataset.draws||0)+1);return original.apply(this,args);};
 });
 await page.goto('http://127.0.0.1:5191/curl-test.html');
 const image=page.locator('[data-test-media="image"] .project-gallery__image');
 const strength=media=>media.evaluate(e=>Number(e.dataset.curlStrength||0));
 const prepare=async media=>{
  await media.evaluate(e=>window.scrollTo({top:scrollY+e.getBoundingClientRect().top-300,behavior:'instant'}));
  await page.waitForTimeout(1600);
 };
 const gesture=async(media,delta)=>{
  for(let i=0;i<12;i++){await page.evaluate(d=>window.scrollBy({top:d,behavior:'instant'}),delta);await page.waitForTimeout(17);}
  return strength(media);
 };
 await prepare(image);const initialBox=await image.boundingBox();
 await page.screenshot({path:'curl-test-flat.png'});
 const slow=await gesture(image,1);await prepare(image);const fast=await gesture(image,18);
 if(!(slow>0&&fast>slow*2&&fast<=.060001))throw Error('Velocity mapping failed '+JSON.stringify({slow,fast}));
 const reverse=await gesture(image,-18);
 if(!(reverse>0&&reverse<=.060001))throw Error('Direction reversal snapped or flipped curl');
 const during=await image.boundingBox();
 if(Math.abs(during.width-initialBox.width)>.1||Math.abs(during.height-initialBox.height)>.1)throw Error('Media layout changed');
 // Prove UV deformation on actual GPU pixels: center remains unchanged; edges move.
 const profile=await image.locator('.project-gallery__curl').evaluate(canvas=>{
  const gl=canvas.getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM),u=gl.getUniformLocation(program,'uCurlStrength');
  const sample=value=>{gl.uniform1f(u,value);gl.drawArrays(gl.TRIANGLES,0,6);const data=new Uint8Array(canvas.width*canvas.height*4);gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
  const flat=sample(0),curl=sample(.06);let center=0,edge=0,centerCount=0,edgeCount=0;
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
   const index=(y*canvas.width+x)*4,diff=Math.abs(flat[index]-curl[index])+Math.abs(flat[index+1]-curl[index+1])+Math.abs(flat[index+2]-curl[index+2]);
   if(Math.abs(y/canvas.height-.5)<.01){center+=diff;centerCount++;}
   if(y/canvas.height<.1||y/canvas.height>.9){edge+=diff;edgeCount++;}
  }
  return {center:center/centerCount,edge:edge/edgeCount};
 });
 if(!(profile.edge>profile.center*5&&profile.edge>1))throw Error('Shader did not isolate curl to edges '+JSON.stringify(profile));
 await page.screenshot({path:'curl-test-moving.png'});
 await page.waitForTimeout(250);const returning=await strength(image);
 if(!(returning>0&&returning<reverse))throw Error('No smooth release');
 await page.waitForTimeout(1500);
 if(await strength(image)!==0||await image.locator('.project-gallery__curl').evaluate(c=>getComputedStyle(c).opacity)!=='0')throw Error('Not flat at rest');
 const draws=await image.locator('.project-gallery__curl').getAttribute('data-draws');await page.waitForTimeout(200);
 if(draws!==await image.locator('.project-gallery__curl').getAttribute('data-draws'))throw Error('Idle GPU keeps rendering');
 const video=page.locator('[data-test-media="video"] .project-gallery__image');await prepare(video);
 await page.waitForFunction(()=>document.querySelector('video').currentTime>.1);
 const videoStrength=await gesture(video,18);if(videoStrength<=0)throw Error('Video curl missing');
 const before=await video.locator('video').evaluate(v=>({time:v.currentTime,paused:v.paused,ratio:v.videoWidth/v.videoHeight}));
 await gesture(video,-12);const after=await video.locator('video').evaluate(v=>v.currentTime);
 if(before.paused||after===before.time)throw Error('Video playback interrupted');
 await page.screenshot({path:'curl-test-video.png'});
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
 if(await strength(video)!==0||!await video.locator('video').evaluate(v=>v.paused))throw Error('Offscreen work continued');
 const videoDraws=await video.locator('.project-gallery__curl').getAttribute('data-draws');await page.waitForTimeout(200);
 if(videoDraws!==await video.locator('.project-gallery__curl').getAttribute('data-draws'))throw Error('Offscreen GPU keeps rendering');
 await page.emulateMedia({reducedMotion:'reduce'});await prepare(image);await gesture(image,18);
 if(await strength(image)!==0)throw Error('Reduced motion not respected');
 const fallback=await browser.newPage();await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:get.call(this,type,...args);};});
 await fallback.goto('http://127.0.0.1:5191/curl-test.html');await fallback.locator('[data-test-media="image"]').scrollIntoViewIfNeeded();await fallback.evaluate(()=>scrollBy(0,30));await fallback.waitForTimeout(100);
 if(await fallback.locator('.project-gallery__curl').first().evaluate(c=>getComputedStyle(c).opacity)!=='0')throw Error('No-WebGL fallback failed');
 // All project cards share the effect; existing markup and other-section videos remain.
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('http://127.0.0.1:5191');
 if(await page.locator('[data-curl-test]').count()!==4)throw Error('Curl missing on project cards');
 if(await page.locator('[data-project-index="0"] [data-curl-test]').count()!==1)throw Error('Wrong test card');
 if(await page.locator('.project-gallery__card').count()!==4||await page.locator('video').count()!==3)throw Error('Original media changed');
 const first=page.locator('[data-project-index="0"] .project-gallery__image');await prepare(first);await gesture(first,18);
 if(await strength(first)<=0)throw Error('Main gallery integration inactive');
 if(await first.evaluate(e=>getComputedStyle(e,'::after').backgroundImage)==='none')throw Error('Raster removed');
 await page.locator('[data-project-index="0"]').hover();await page.waitForTimeout(100);
 if(await page.locator('[data-project-index="0"] .project-gallery__color').evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Hover color broken');
 for(let index=1;index<4;index++){
  const media=page.locator(`[data-project-index="${index}"] .project-gallery__image`);
  await prepare(media);await gesture(media,18);
  if(await strength(media)<=0)throw Error('Curl inactive on card '+index);
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({slow,fast,reverse,returning,profile,videoStrength,videoPlayback:true,idleStops:true,offscreenStops:true,reducedMotion:true,noWebGLFallback:true,rollout:'all 4 project cards',rasterAndHover:true}));
}finally{await browser.close();server.kill();}
