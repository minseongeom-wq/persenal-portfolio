import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.locator('.scroll-title').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 const height=await page.evaluate(()=>document.documentElement.scrollHeight);
 const pulse=delta=>page.evaluate(async delta=>{for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);window.scrollTo({top:scrollY+delta,behavior:'instant'});}await new Promise(requestAnimationFrame);return Number.parseFloat(document.querySelector('.scroll-title').style.getPropertyValue('--scroll-title-y'));},delta);
 const slow=await pulse(2);await page.waitForTimeout(1000);const fast=await pulse(30);if(!(fast>slow&&slow>0&&fast<=18))throw Error('Speed response failed: '+JSON.stringify({slow,fast}));
 await page.waitForTimeout(1100);const rest=await page.locator('.scroll-title').evaluateAll(nodes=>nodes.map(n=>n.style.getPropertyValue('--scroll-title-y')));if(rest.some(v=>v!=='0.000px'))throw Error('Titles did not return to origin');
 const reverse=await pulse(-20);if(reverse>=0||reverse< -18)throw Error('Reverse direction failed');await page.waitForTimeout(1100);
 if(await page.evaluate(()=>document.documentElement.scrollHeight)!==height)throw Error('Motion changed layout height');
 await page.emulateMedia({reducedMotion:'reduce'});await pulse(10);const reduced=await page.locator('.scroll-title').first().evaluate(e=>getComputedStyle(e).translate);if(reduced!=='none')throw Error('Reduced motion failed');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await pulse(10);const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));await page.waitForTimeout(1100);if(mobile.width!==mobile.scrollWidth)throw Error('Mobile overflow');
 console.log(JSON.stringify({titles:await page.locator('.scroll-title').count(),slow,fast,reverse,returnedToOrigin:rest.every(v=>v==='0.000px'),layoutHeightPreserved:true,reducedMotion:reduced,mobile,errors},null,2));if(errors.length)throw Error('Browser errors');
}finally{await browser.close();}
