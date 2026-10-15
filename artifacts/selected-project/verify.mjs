import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {stat,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

for(const asset of ['4e748.png','fa561.png','b46bb.png','e9082.png','46f35.svg','307af.svg']){
 const local=asset==='307af.svg'?'selected-project-arrow-active.svg':asset;
 assert((await stat(`dist/assets/${local}`)).size>0);
 const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
 assert.equal(hash(await readFile(`dist/assets/${local}`)),hash(await readFile(`artifacts/selected-project/assets-reference/${asset}`)),`${asset}: differs from latest Figma asset`);
}
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 await page.locator('#work').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await page.mouse.move(1900,1000);await page.waitForTimeout(1500);
 const slots=await page.locator('#work').evaluate(section=>{
  const s=section.getBoundingClientRect(),box=el=>{const r=el.getBoundingClientRect();return {x:r.x-s.x,y:r.y-s.y,width:r.width,height:r.height};};
  return {section:box(section),heading:box(section.querySelector('[data-node-id="919:892"]')),counter:box(section.querySelector('[data-node-id="919:893"]')),total:box(section.querySelector('[data-node-id="919:894"]')),links:[...section.querySelectorAll('[data-project-link]')].map(box),images:[...section.querySelectorAll('.project-gallery__image')].map(box),captions:[...section.querySelectorAll('figcaption')].map(box)};
 });
 const near=(a,b,label)=>assert(Math.abs(a-b)<1,`${label}: ${a} vs ${b}`);
 near(slots.section.width,1690,'section width');near(slots.heading.x,5,'heading x');near(slots.heading.y,72,'heading y');near(slots.heading.width,723,'heading width');near(slots.heading.height,144,'heading height');near(slots.counter.x,855,'counter x');near(slots.counter.width,113,'counter width');near(slots.counter.height,144,'counter height');near(slots.total.x,1510,'total x');near(slots.total.width,180,'total width');
 for(let i=0;i<slots.links.length;i++){near(slots.links[i].x,0,'link x');near(slots.links[i].y,360+i*66,'link y');near(slots.links[i].width,583,'link width');near(slots.links[i].height,51,'link height');}
 for(let i=0;i<slots.images.length;i++){near(slots.images[i].x,760,'image x');near(slots.images[i].y,[360,952,1544,2135][i],'image y');near(slots.images[i].width,966,'image width');near(slots.images[i].height,i===2?541:542,'image height');near(slots.captions[i].y,[912,1504,2095,2687][i],'caption y');}
 await page.screenshot({path:'artifacts/selected-project/desktop.png'});
 const assets=await page.locator('#work img').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>({src:n.getAttribute('src'),loaded:n.complete&&n.naturalWidth>0,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
 // Lazy previews are checked in their actual design slots as they enter view.
 for(let i=0;i<4;i++){
  const card=page.locator(`[data-project-index="${i}"]`);await card.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));await page.waitForTimeout(1000);
  assert(await card.locator('img').evaluateAll(nodes=>nodes.every(n=>n.complete&&n.naturalWidth>0)));
  const fit=await card.locator('.project-gallery__base').evaluate(el=>getComputedStyle(el).objectFit);assert.equal(fit,'contain','Keep the requested no-crop media fit');
 }
 await page.locator('[data-project-link="1"]').click();await page.waitForTimeout(1400);
 assert.equal(await page.locator('[data-project-link="1"]').getAttribute('aria-pressed'),'true');assert.equal((await page.locator('[data-node-id="919:893"]').innerText()).trim(),'02');
 await page.locator('[data-project-link="1"]').hover();await page.waitForTimeout(650);assert.equal(await page.locator('[data-project-index="1"] .project-gallery__color').evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.setViewportSize({width:390,height:844});await page.locator('#work').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));await page.mouse.move(389,843);await page.waitForTimeout(1300);
 await page.screenshot({path:'artifacts/selected-project/mobile.png'});
 const mobile=await page.locator('#work').evaluate(section=>{const s=section.getBoundingClientRect();return [...section.querySelectorAll('[data-project-link],.project-gallery__image')].map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,sectionLeft:s.left,sectionRight:s.right};});});
 assert(mobile.every(r=>r.width>0&&r.left>=r.sectionLeft-1&&r.right<=r.sectionRight+1),'Mobile content overflow');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({slots,assets,mobile,checks:'Latest Figma assets, desktop geometry, four previews, menu click, hover, mobile layout and existing no-crop fit passed.'},null,2));
}finally{await browser?.close();server.kill();}
