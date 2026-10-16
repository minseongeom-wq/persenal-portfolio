import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
  await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.heroEntryPhase==='entering');
  if(await page.locator('[data-node-id="919:872"] .hero-entry-canvas').count())throw Error('Name should use its original elastic effect');
  let colored=0;
  if(!mobile){
  await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.elasticPhase==='active');
  await page.waitForTimeout(200);
  colored=await page.locator('[data-node-id="919:872"] .elastic-canvas').evaluate(c=>{
   const gl=c.getContext('webgl'),pixels=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let count=0;
   for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>10&&Math.max(...pixels.slice(i,i+3))-Math.min(...pixels.slice(i,i+3))>30)count++;
   return count;
  });
  if(colored<30)throw Error('Missing visible name trails: '+colored);
  }
  await page.waitForFunction(()=>!document.querySelector('.hero-entry-pending,.hero-entry-rendering,.hero-entry-canvas'));
  if(await page.locator('[data-node-id="919:872"] p').evaluate(t=>getComputedStyle(t).opacity!=='1'))throw Error('Name did not restore');
  if(errors.length)throw Error(errors.join('\n'));
  if(!mobile){
   await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.elasticPhase==='idle');
   const hero=page.locator('[data-node-id="919:872"] p'),box=await hero.boundingBox();
   await page.mouse.move(box.x+50,box.y+50);await page.mouse.move(box.x+250,box.y+80,{steps:8});
   if(await hero.getAttribute('data-elastic-phase')!=='active')throw Error('Original mouse effect did not resume');
  }
  console.log(JSON.stringify({mobile,colored,restored:true}));await page.close();
 }
 const reduced=await browser.newPage({reducedMotion:'reduce'});
 await reduced.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await reduced.evaluate(()=>document.fonts.ready);
 if(await reduced.locator('.hero-entry-canvas,.hero-entry-pending').count())throw Error('Reduced motion fallback failed');
 console.log('Reduced motion passed');
}finally{await browser.close();}
