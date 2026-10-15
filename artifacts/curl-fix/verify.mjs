import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {curlDisplacement} from '../../src/scroll-curl-map.js';
import {CURL_OPTIONS} from '../../src/project-curl-config.js';
const rect={x:90,y:120,width:630,height:345};let maximumDisplacement=0;
for(let row=0;row<=100;row++)for(let col=0;col<=200;col++){
 const x=rect.x+rect.width*col/200,y=rect.y+rect.height*row/100;
 const d=curlDisplacement(x,y,1000,800,[rect],4)*CURL_OPTIONS.maxStrength;
 maximumDisplacement=Math.max(maximumDisplacement,Math.abs(d));
 assert(x+d>=rect.x-1e-8&&x+d<=rect.x+rect.width+1e-8,'Sampling must stay inside media');
 if(col===0||col===200)assert(Math.abs(d)<1e-8,'Media edges must stay pinned');
}
assert(maximumDisplacement>.5,'Interior curl must remain visible');
for(const x of [-80,-1,1001,1080])assert.equal(curlDisplacement(x,500,1000,800,[rect]),0);
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1920,1440,390]){
  await page.setViewportSize({width,height:900});await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
  await page.locator('.portfolio-navigation').evaluate(el=>el.style.visibility='hidden');
  await page.addStyleTag({content:'.project-gallery__image::after{display:none!important}'});
  for(const [name,selector] of [['projects','.project-gallery__image'],['video','.portfolio-video--visual']]){
   const media=page.locator(selector).first();await media.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));await page.waitForTimeout(1100);
   const before=await media.boundingBox();
   await page.screenshot({path:`artifacts/curl-fix/${name}-${width}-rest.png`});
   await media.evaluate((el,strength)=>{
    const section=el.closest('[data-name^="Section /"]'),index=[...document.querySelectorAll('#root [data-name^="Section /"]')].indexOf(section);
    document.querySelector(`#section-scroll-curl-${index} feDisplacementMap`).setAttribute('scale',section.offsetWidth*strength);
    section.style.filter=`url(#section-scroll-curl-${index})`;
   },CURL_OPTIONS.maxStrength);
   await page.screenshot({path:`artifacts/curl-fix/${name}-${width}-curl.png`});
   assert.deepEqual(await media.boundingBox(),before,'DOM geometry must not change');
   const box=await media.evaluate(el=>{
    const c=el.matches('.project-gallery__image')?el:el.parentElement;c.style.background='#00ffff';
    for(const child of c.children)child.style.visibility='hidden';return c.getBoundingClientRect().toJSON();
   });
   const png=await page.screenshot();
   await page.screenshot({path:`artifacts/curl-fix/${name}-${width}-boundary.png`});
   const rows=await page.evaluate(async({png,box})=>{
    const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    return [.35,.6,.85].map(f=>{
     const y=Math.round(box.y+box.height*f),pixels=ctx.getImageData(0,y,canvas.width,1).data;let left=-1,right=-1;
     for(let x=0;x<canvas.width;x++)if(pixels[x*4]<20&&pixels[x*4+1]>180&&pixels[x*4+2]>180){if(left<0)left=x;right=x;}
     return {left,right};
    });
   },{png:png.toString('base64'),box});
   for(const row of rows){
    assert(Math.abs(row.left-Math.ceil(box.left))<=1,`${name} ${width}: left edge moved (${row.left} vs ${box.left})`);
    assert(Math.abs(row.right-(Math.floor(box.right)-1))<=1,`${name} ${width}: right edge moved`);
   }
  }
  await page.mouse.wheel(0,400);await page.waitForTimeout(100);
  assert(await page.locator('[data-name^="Section /"]').evaluateAll(nodes=>nodes.some(n=>n.style.filter)));
  await page.waitForTimeout(2500);
  assert(await page.locator('[data-name^="Section /"]').evaluateAll(nodes=>nodes.every(n=>!n.style.filter)));
  console.log(`PASS ${width}px: image/video pixel edges, unchanged layout, scroll recovery`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.wheel(0,-500);await page.waitForTimeout(120);
 assert(await page.locator('[data-name^="Section /"]').evaluateAll(nodes=>nodes.every(n=>!n.style.filter)));
 assert.deepEqual(errors,[]);
 console.log('PASS: 20,301 sampling positions, pinned edges, neutral padding, interior curl, reduced motion, no runtime errors.');
}finally{await browser?.close();server.kill();}


