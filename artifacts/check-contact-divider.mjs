import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',chunk=>{const match=String(chunk).match(/Local: (http:\/\/127\.0\.0\.1:\d+)/);if(match)resolve(match[1]);});server.on('error',reject);});
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(base);
 await page.waitForSelector('#contact');
 const divider=page.locator('[data-name="Divider / Footer"]');
 assert.equal(await divider.evaluate(el=>el.style.clipPath),'inset(-2px 100% -2px 0px)');
 await page.locator('#contact').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#contact').dataset.contactEntrance==='complete');
 await page.waitForTimeout(900);
 const state=await divider.evaluate(el=>({clip:getComputedStyle(el).clipPath,image:el.querySelector('img').getBoundingClientRect().toJSON()}));
 assert.equal(state.clip,'inset(-2px 0% -2px 0px)');
 assert.ok(state.image.width>0&&state.image.height>0);
 await page.screenshot({path:'artifacts/contact-divider-fixed.png'});
 console.log(JSON.stringify(state));
}finally{await browser?.close();server.kill();}
