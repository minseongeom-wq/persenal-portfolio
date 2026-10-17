import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const url=pathToFileURL(process.cwd()+'/dist/index.html').href;
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.waitForTimeout(600);
  const section=page.locator('[data-name="Section / FRONT-END DEVELOPMENT"]');
  const elements=section.locator('[data-development-entrance]');
  if(await elements.count()!==9)throw Error('Expected six text elements, two previews and arrow');
  for(const element of await elements.all()){
   await element.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-development-entrance]')].some(e=>e.dataset.developmentEntrance==='entering'||e.dataset.developmentEntrance==='complete'));
   await page.waitForTimeout(1900);
   if(await element.getAttribute('data-development-entrance')!=='complete')throw Error('Element not revealed');
   if(await element.evaluate(e=>e.getAnimations().length))throw Error('Animation not released');
  }
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
  const first=elements.first();
  if(await first.getAttribute('data-development-entrance')!=='pending')throw Error('Reentry not armed');
  await first.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await page.waitForTimeout(250);
  if(await first.getAttribute('data-development-entrance')!=='entering')throw Error('Reentry did not play');
  await page.waitForTimeout(1900);
  if(await first.getAttribute('data-development-entrance')!=='complete')throw Error('Reentry not completed');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`${width}px: text, previews, arrow and reentry passed`);await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});await page.goto(url);await page.waitForTimeout(600);
 if(await page.locator('[data-development-entrance]').count())throw Error('Reduced motion should skip entrance');
 console.log('Reduced motion passed');
}finally{await browser.close();}
