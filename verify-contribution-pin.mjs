import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.waitForTimeout(600);
 for(const width of [1920,1440,1024]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(200);
  const section=page.locator('#contribution');
  const setup=await section.evaluate(e=>({start:scrollY+e.getBoundingClientRect().top,travel:e.getBoundingClientRect().height-innerHeight}));
  for(const progress of [.1,.7,.2]){
   await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),setup.start+setup.travel*progress);await page.waitForTimeout(1800);
   const state=await section.evaluate(e=>({stage:e.querySelector('.contribution-stage').getBoundingClientRect().top,page:e.dataset.contributionPage,cards:[...e.querySelectorAll('[data-name^="Contribution Card /"]')].filter(c=>!c.closest('[hidden]')).map(c=>({top:c.getBoundingClientRect().top,bottom:c.getBoundingClientRect().bottom}))}));
   if(Math.abs(state.stage)>2||state.page!==(progress>=.5?'2':'1')||state.cards.length!==2||state.cards.some(c=>c.top<0||c.bottom>900))throw Error(JSON.stringify({width,progress,state}));
  }
  await page.screenshot({path:`artifacts/contribution-pinned-${width}.png`});
  await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),setup.start+setup.travel+200);await page.waitForTimeout(100);
  if(Math.abs(await page.locator('.contribution-stage').evaluate(e=>e.getBoundingClientRect().top)+200)>2)throw Error('Pin did not release');
  console.log(`${width}px: two cards, forward/reverse switch, pin and release passed`);
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 if(await page.locator('.contribution-stage').evaluate(e=>getComputedStyle(e).display)!=='contents'||await page.locator('.contribution-pair[hidden]').count())throw Error('Mobile cards not restored');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Mobile natural scroll passed');
}finally{await browser.close();}
