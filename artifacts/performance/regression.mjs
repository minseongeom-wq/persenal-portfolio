import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {curlDisplacement} from '../../src/scroll-curl-map.js';
import {CURL_OPTIONS} from '../../src/project-curl-config.js';
const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
const profile=y=>1-Math.sqrt(Math.max(0,1-(2*y-1)**2));
function original(x,y,w,h,media,guard){
 if(x<=0||x>=w||y<=0||y>=h)return 0;
 let d=(w*.5-x)*profile(y/h);
 for(const r of media){const ex=Math.min(x-r.x,r.x+r.width-x),ey=Math.min(y-r.y,r.y+r.height-y);
  if(ex>=0&&ey>=0)d=(r.width*.5-(x-r.x))*profile((y-r.y)/r.height)*smooth((ex-guard)/(r.width*.15));
  else d*=smooth((Math.hypot(Math.max(0,-ex),Math.max(0,-ey))-guard)/(w*CURL_OPTIONS.maxStrength+guard));
 }return d;
}
const media=[{x:90,y:100,width:500,height:300},{x:90,y:500,width:500,height:300},{x:700,y:100,width:900,height:1200}];
let seed=17;
for(let i=0;i<100000;i++){
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed/2**32*1900-100;
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;const y=seed/2**32*2200-100;
 const expected=original(x,y,1690,2000,media,8),profiles=[profile(y/2000),...media.map(r=>profile((y-r.y)/r.height))];
 assert(Math.abs(curlDisplacement(x,y,1690,2000,media,8,profiles)-expected)<1e-10);
}
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.mapBuilds=0;const encode=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(...args){if(this.width===512)mapBuilds++;return encode.apply(this,args);};});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2000);
 const before=await page.evaluate(()=>mapBuilds);
 await page.evaluate(()=>{const image=document.querySelector('.project-gallery__base');for(let i=0;i<50;i++)image.dispatchEvent(new Event('load'));});await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>mapBuilds),before,'Unchanged load bursts must reuse cached maps');
 const work=page.locator('#work');await work.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await page.waitForTimeout(200);
 const nav=page.locator('.portfolio-navigation');
 await page.evaluate(()=>{const label=document.querySelector('.portfolio-navigation__default'),p=document.querySelector('[data-node-id="919:892"] p');window.restoreRect=p.getBoundingClientRect;p.getBoundingClientRect=()=>label.getBoundingClientRect();window.dispatchEvent(new Event('scroll'));});
 await page.waitForFunction(()=>document.querySelector('.portfolio-navigation').dataset.overlapping==='true');
 await page.evaluate(()=>{document.querySelector('[data-node-id="919:892"] p').getBoundingClientRect=window.restoreRect;window.dispatchEvent(new Event('scroll'));});
 await nav.locator('button').click();assert.equal(await nav.getAttribute('data-open'),'true');await page.keyboard.press('Escape');assert.equal(await nav.getAttribute('data-open'),'false');
 const enter=()=>page.locator('[data-node-id="919:979"]').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));
 const state=s=>page.waitForFunction(s=>document.querySelector('#contact').dataset.contactEntrance===s,s,{timeout:10000});
 await enter();await state('typing');await state('complete');await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await state('pending');await enter();await state('typing');
 await page.emulateMedia({reducedMotion:'reduce'});await state('complete');await page.waitForTimeout(100);
 assert(await page.locator('[data-name^="Section /"]').evaluateAll(nodes=>nodes.every(n=>!n.style.filter)));
 assert.deepEqual(errors,[]);
 console.log('PASS: 100,000 unchanged curl samples; cached map load bursts; nav overlap, open and Escape; Contact replay; reduced motion; no runtime errors.');
}finally{await browser?.close();server.kill();}
