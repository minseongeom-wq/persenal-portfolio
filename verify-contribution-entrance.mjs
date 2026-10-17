import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
  await page.waitForTimeout(600);
  const cards=page.locator('[data-name^="Contribution Card /"]');
  if(await cards.count()!==4)throw Error('Expected four cards');
  if(await cards.first().evaluate(e=>getComputedStyle(e).opacity)!=='0')throw Error('Missing pending state');
  for(const card of await cards.all()){
   await card.scrollIntoViewIfNeeded();
   await page.waitForTimeout(1100);
   if(await card.evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Card did not finish entering');
   if(await card.evaluate(e=>e.getAnimations().length))throw Error('Entrance animation not released');
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`${width}px: all four cards revealed`);await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.waitForTimeout(600);
 if(await page.locator('[data-name^="Contribution Card /"]').evaluateAll(cards=>cards.some(e=>getComputedStyle(e).opacity!=='1'||e.getAnimations().length)))throw Error('Reduced motion failed');
 console.log('Reduced motion: cards immediately visible');
}finally{await browser.close();}
