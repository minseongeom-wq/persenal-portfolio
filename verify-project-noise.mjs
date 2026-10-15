import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'5187'},stdio:['ignore','pipe','pipe'],windowsHide:true});
const ready=new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(String(data).includes('Local:'))resolve();});server.once('error',reject);server.once('exit',code=>reject(Error('Server exited '+code)));});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 await ready;
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:5187');
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';return document.fonts.ready;});
 for(let i=0;i<4;i++){
  const card=page.locator(`[data-project-index="${i}"]`),canvas=card.locator('canvas');
  await card.scrollIntoViewIfNeeded();await card.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  await page.mouse.move(1900,100);await page.waitForTimeout(800);
  await card.hover();
  await page.waitForFunction(index=>document.querySelector(`[data-project-index="${index}"] canvas`).dataset.noiseActive==='true',i);
  const before=await canvas.evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;return {width:c.width,ink:pixels.some(value=>value>0),sample:pixels.filter((_,index)=>index%997===0).join(',')};});
  if(before.width>640||!before.ink)throw Error('Noise was not rendered efficiently');
  await page.waitForTimeout(100);
  const after=await canvas.evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.filter((_,index)=>index%997===0).join(','));
  if(before.sample===after)throw Error('Noise did not animate');
  await page.screenshot({path:`project-tv-noise-${i+1}.png`});
  await page.waitForTimeout(700);
  if(await canvas.getAttribute('data-noise-active')!=='false')throw Error('Noise did not stop at rest');
 }
 const card=page.locator('[data-project-index="1"]');
 await card.scrollIntoViewIfNeeded();await page.waitForTimeout(800);
 await page.evaluate(()=>window.scrollBy(0,30));
 await page.waitForFunction(()=>document.querySelector('[data-project-index="1"] canvas').dataset.noiseActive==='true');
 await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(100);
 if(await page.locator('[data-noise-active="true"]').count())throw Error('Offscreen noise still active');
 await page.emulateMedia({reducedMotion:'reduce'});
 await card.scrollIntoViewIfNeeded();await card.hover();await page.waitForTimeout(100);
 if(await card.locator('canvas').evaluate(e=>getComputedStyle(e).display)!=='none')throw Error('Reduced motion not respected');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:390,height:844});await card.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('[data-project-index="1"] canvas').dataset.noiseActive==='true');
 await page.waitForTimeout(700);
 if(await card.locator('canvas').getAttribute('data-noise-active')!=='false')throw Error('Mobile noise did not settle');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('All 4 images animate TV noise on hover/entry/scroll, settle at rest, stop offscreen and respect reduced motion; desktop and mobile verified.');
}finally{await browser.close();server.kill();}
