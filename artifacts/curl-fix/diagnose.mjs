import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {CURL_OPTIONS} from '../../src/project-curl-config.js';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 await page.addStyleTag({content:'.project-gallery__noise,.project-gallery__image::after,.portfolio-navigation{visibility:hidden!important}'});
 const media=page.locator('.project-gallery__base,[data-name="Contribution / Preview Image"]>img,[data-node-id="948:2442"] img,.portfolio-video');
 const report=[];
 for(let i=0;i<await media.count();i++){
  const target=media.nth(i);await target.evaluate(el=>el.scrollIntoView({behavior:'instant',block:'center'}));await page.waitForTimeout(1600);
  const info=await target.evaluate(el=>{
   document.querySelectorAll('video').forEach(v=>{v.pause();v.play=()=>Promise.resolve();});
   const section=el.closest('[data-name^="Section /"]'),index=[...document.querySelectorAll('#root [data-name^="Section /"]')].indexOf(section);
   const container=el.closest('.project-gallery__image,[data-name="Contribution / Preview Image"]')||el.parentElement;
   const r=el.getBoundingClientRect(),c=container.getBoundingClientRect(),style=getComputedStyle(el),w=el.naturalWidth||el.videoWidth,h=el.naturalHeight||el.videoHeight;
   const scale=(style.objectFit==='contain'?Math.min:Math.max)(el.clientWidth/w,el.clientHeight/h);
   return {i:index,src:el.getAttribute('src'),tag:el.tagName,rect:r.toJSON(),container:c.toJSON(),intrinsic:[w,h],objectFit:style.objectFit,transform:style.transform,zeroStrengthHorizontalCrop:Math.max(0,1-(c.width/r.width)*(el.clientWidth/(scale*w)))};
  });
  await page.waitForTimeout(250); // Let any already submitted video frame finish compositing.
  await page.locator(`[id="section-scroll-curl-${info.i}"] feDisplacementMap`).evaluate(el=>el.setAttribute('scale','0'));
  await target.evaluate(el=>el.closest('[data-name^="Section /"]').style.removeProperty('filter'));
  const rest=await page.screenshot();
  await target.evaluate((el,index)=>el.closest('[data-name^="Section /"]').style.filter=`url(#section-scroll-curl-${index})`,info.i);
  const zero=await page.screenshot();
  const difference=await page.evaluate(async({rest,zero,rect})=>{
   const decode=async base=>{const im=new Image();im.src='data:image/png;base64,'+base;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
   const [a,b]=await Promise.all([decode(rest),decode(zero)]);let changed=0,total=0;
   for(let y=Math.max(0,Math.ceil(rect.top));y<Math.min(innerHeight,Math.floor(rect.bottom));y++)for(let x=Math.max(0,Math.ceil(rect.left));x<Math.min(innerWidth,Math.floor(rect.right));x++){const j=(y*innerWidth+x)*4;total++;if(Math.max(...[0,1,2].map(k=>Math.abs(a[j+k]-b[j+k])))>3)changed++;}
   return {changed,total,ratio:changed/total};
  },{rest:rest.toString('base64'),zero:zero.toString('base64'),rect:info.container});
  report.push({...info,zeroFilterDifference:difference});
  assert(info.zeroStrengthHorizontalCrop<.0001,`${info.src}: baseline horizontal crop`);
  assert.equal(difference.changed,0,`${info.src}: zero strength changed source pixels`);
  console.log(JSON.stringify(report.at(-1)));
  if(i===0||info.src?.includes('sequence-04')){await writeFile(`artifacts/curl-fix/diagnostic-${i}-none.png`,rest);await writeFile(`artifacts/curl-fix/diagnostic-${i}-zero.png`,zero);}
  const fitted=await target.evaluate(async(el)=>{
   const w=el.naturalWidth||el.videoWidth,h=el.naturalHeight||el.videoHeight,style=getComputedStyle(el),r=el.getBoundingClientRect(),fit=Math.min(r.width/w,r.height/h);
   const overlay=document.createElement('img');overlay.dataset.curlBorderProbe='true';
   for(const key of ['position','left','top','right','bottom','width','height','maxWidth','maxHeight','objectFit','objectPosition','transform','transformOrigin','clipPath'])overlay.style[key]=style[key];
   overlay.style.zIndex='20';overlay.style.pointerEvents='none';
   overlay.src='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="cyan"/><rect width="3%" height="100%" fill="red"/><rect x="97%" width="3%" height="100%" fill="blue"/></svg>`);
   el.parentElement.append(overlay);await overlay.decode();
   return {x:r.left+(r.width-w*fit)/2,y:r.top+(r.height-h*fit)/2,width:w*fit,height:h*fit};
  });
  await target.evaluate((el,{index,strength})=>{
   const s=el.closest('[data-name^="Section /"]');document.querySelector(`#section-scroll-curl-${index} feDisplacementMap`).setAttribute('scale',s.offsetWidth*strength);s.style.filter=`url(#section-scroll-curl-${index})`;
  },{index:info.i,strength:CURL_OPTIONS.maxStrength});
  const active=await page.screenshot();
  const edges=await page.evaluate(async({png,rect})=>{
   const image=new Image();image.src='data:image/png;base64,'+png;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
   return [.35,.6,.85].map(f=>{
    const y=Math.round(rect.y+rect.height*f),x1=Math.round(rect.x+rect.width*.007),x2=Math.round(rect.x+rect.width*.993);
    return [[...ctx.getImageData(x1,y,1,1).data],[...ctx.getImageData(x2,y,1,1).data]];
   });
  },{png:active.toString('base64'),rect:fitted});
  for(const [left,right] of edges){
   const color=p=>p[0]>230&&p[1]<20&&p[2]<20?'red':p[2]>230&&p[0]<20&&p[1]<20?'blue':'missing';
   assert.notEqual(color(left),'missing',`${info.src}: fitted left source border missing`);
   assert.notEqual(color(right),'missing',`${info.src}: fitted right source border missing`);
   assert.notEqual(color(left),color(right),'Both original source edges must be represented');
  }
  report.at(-1).activeSourceEdges='preserved';
  await page.locator('[data-curl-border-probe]').evaluate(el=>el.remove());
  await target.evaluate(el=>el.closest('[data-name^="Section /"]').style.removeProperty('filter'));
 }
 await writeFile('artifacts/curl-fix/diagnosis.json',JSON.stringify(report,null,2));
 console.log(`PASS: ${report.length} media; zero-strength pixel identity, no baseline horizontal crop, and original source borders at strength ${CURL_OPTIONS.maxStrength}.`);
}finally{await browser?.close();server.kill();}
