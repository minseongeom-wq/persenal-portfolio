import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const url=pathToFileURL(process.cwd()+'/dist/index.html').href;
async function instrument(page){
 await page.addInitScript(()=>{
  window.curtainRuns=[];const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
   if(this.classList.contains('site-entrance'))window.curtainRuns.push({frames,options,background:getComputedStyle(this).backgroundImage,width:this.getBoundingClientRect().width,viewport:innerWidth});
   return animate.call(this,frames,options);
  };
 });
}
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await instrument(page);
  await page.goto(url);await page.waitForTimeout(1800);
  const runs=await page.evaluate(()=>window.curtainRuns);
  if(runs.length!==1||runs[0].options.duration!==450||runs[0].frames[1].transform!=='translateX(-100%)')throw Error('Curtain timing/direction failed');
  if(!runs[0].background.includes('linear-gradient')||!runs[0].background.includes('0.82')||Math.abs(runs[0].width/runs[0].viewport-1.2)>.01)throw Error('Soft gradient edge missing');
  if(await page.locator('.site-entrance').count())throw Error('Curtain was not removed');
  await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.heroEntryPhase==='complete');
  await page.reload();await page.waitForTimeout(1800);
  if(await page.evaluate(()=>window.curtainRuns.length)!==1)throw Error('Curtain did not replay on reload');
  if(await page.locator('.site-entrance').count())throw Error('Reload curtain was not removed');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`${width}px: first entry, hero and reload passed`);await context.close();
 }
 for(const options of [{reducedMotion:'reduce'},{hash:'#contribution'}]){
  const page=await browser.newPage(options.hash?{}:options);await instrument(page);
  await page.goto(url+(options.hash||''));await page.waitForTimeout(800);
  if(await page.evaluate(()=>window.curtainRuns.length)||await page.locator('.site-entrance').count())throw Error('Skip condition failed');
  await page.close();
 }
 console.log('Reduced motion and direct section links passed');
}finally{await browser.close();}
