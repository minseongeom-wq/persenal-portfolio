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
  if(await cards.first().locator('[data-name="Contribution / Preview Image"]').evaluate(e=>getComputedStyle(e).clipPath)!=='inset(0px 0px 0px 100%)')throw Error('Missing preview pending state');
  for(const card of await cards.all()){
   const pending=await card.locator('[data-name="Contribution / Preview Image"]').evaluate(e=>e.getAnimations().some(a=>a.playState==='paused'));
   await card.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));
   await page.waitForTimeout(550);
   const scan=await card.locator('[data-name="Contribution / Preview Image"]').evaluate(e=>({clip:getComputedStyle(e).clipPath,timing:e.getAnimations()[0]?.effect.getTiming()}));
   if(pending&&(!scan.timing||!scan.timing.easing.startsWith('cubic-bezier(')||scan.clip==='none'))throw Error('Missing smooth image reveal: '+JSON.stringify(scan));
   await page.waitForTimeout(3000);
   if(await card.evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Card did not finish entering');
   if(await card.evaluate(e=>e.getAnimations().length))throw Error('Entrance animation not released');
   if(await card.locator('[data-name="Contribution / Preview Image"]').evaluate(e=>getComputedStyle(e).clipPath)!=='none')throw Error('Preview reveal not released');
   if(await card.locator('[data-name="Contribution / Text Block"] p').evaluateAll(items=>items.some(e=>e.getAnimations().length||getComputedStyle(e).clipPath!=='none')))throw Error('Text reveal not released');
  }
  await cards.first().evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));
  await page.waitForTimeout(150);
  if(!await cards.first().evaluate(e=>e.getAnimations({subtree:true}).some(a=>a.playState==='running')))throw Error('Card did not replay on reentry');
  await page.waitForTimeout(3000);
  if(await cards.first().evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Reentry did not finish');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(`${width}px: all four cards revealed`);await page.close();
 }
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.waitForTimeout(600);
 if(await page.locator('[data-name^="Contribution Card /"]').evaluateAll(cards=>cards.some(e=>getComputedStyle(e).opacity!=='1'||e.getAnimations({subtree:true}).some(a=>a.effect.target.matches('[data-name="Contribution / Preview Image"], [data-name="Contribution / Text Block"] p')))))throw Error('Reduced motion failed');
 console.log('Reduced motion: cards immediately visible');
}finally{await browser.close();}
