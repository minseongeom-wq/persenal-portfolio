import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.locator('.ghost-title').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 const titles=page.locator('.ghost-title');const count=await titles.count();if(count!==6)throw Error('Expected six title lines');
 const before=await page.locator('.ghost-layer').evaluateAll(l=>l.map(e=>getComputedStyle(e).opacity));if(before.some(v=>v!=='0'))throw Error('Residual effect visible at rest');
 const hero=page.locator('[data-node-id="919:872"] .ghost-title');const rect=await hero.boundingBox();
 await page.screenshot({path:'hover-before.png',clip:{x:760,y:160,width:1040,height:500}});
 await hero.hover({position:{x:350,y:180}});await page.waitForTimeout(300);
 const during=await hero.locator('.ghost-layer').evaluateAll(l=>l.map(e=>({opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform})));
 if(during.some(v=>Number(v.opacity)===0))throw Error('Hover effect did not appear');
 const afterRect=await hero.boundingBox();if(JSON.stringify(rect)!==JSON.stringify(afterRect))throw Error('Hover changed title layout');
 await page.screenshot({path:'hover-after.png',clip:{x:760,y:160,width:1040,height:500}});
 await page.mouse.move(10,10);await page.waitForTimeout(300);
 if(await hero.locator('.ghost-layer').evaluateAll(l=>l.some(e=>Number(getComputedStyle(e).opacity)>0)))throw Error('Effect did not reset');
 if(await page.locator('.ghost-layer:not([aria-hidden="true"])').count())throw Error('Decorative text exposed to screen readers');
 for(let i=1;i<count;i++){const t=titles.nth(i);await t.scrollIntoViewIfNeeded();await page.waitForTimeout(120);await t.hover();await page.waitForTimeout(300);if(!await t.evaluate(e=>e.classList.contains('is-ghost-hover')))throw Error('Missing hover on line '+i);await page.mouse.move(10,10);}
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await touch.locator('.ghost-title').first().waitFor();await touch.locator('[data-node-id="919:872"] .ghost-title').tap();if(await touch.locator('.is-ghost-hover').count())throw Error('Sticky effect on touch');
 const mobile=await touch.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));if(mobile.width!==mobile.scrollWidth)throw Error('Mobile overflow');
 await page.emulateMedia({reducedMotion:'reduce'});const transition=await hero.locator('.ghost-layer').first().evaluate(e=>getComputedStyle(e).transitionDuration);if(transition!=='0s')throw Error('Reduced motion not respected');
 console.log(JSON.stringify({titleLines:count,atRest:before,during,reset:true,touchHover:false,mobile,reducedMotionTransition:transition,errors},null,2));if(errors.length)throw Error('Browser error');
}finally{await browser.close();}
