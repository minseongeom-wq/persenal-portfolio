import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 const base=await new Promise((resolve,reject)=>{let output='';server.stdout.on('data',d=>{output+=d;const m=output.match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.on('error',reject);});
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(base+'/#team');
 const title=page.locator('#team-project-title');
 await title.locator('canvas').waitFor();
 await title.scrollIntoViewIfNeeded();
 await page.waitForTimeout(500);
 const box=await title.boundingBox();
 await page.mouse.move(box.x+40,box.y+60);
 await page.mouse.move(box.x+240,box.y+60,{steps:8});
 assert.equal(await title.getAttribute('data-elastic-phase'),'active');
 await page.mouse.move(1400,900);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(100);
 assert.equal(await title.locator('canvas').count(),0);
 assert.equal(await title.innerText(),'Team\nProject');
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('Passed: Team Project canvas, pointer reaction, reduced-motion fallback, mobile overflow');
}finally{await browser?.close();server.kill();}
