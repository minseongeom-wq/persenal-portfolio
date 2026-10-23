import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [1440,1024]){
  await page.setViewportSize({width,height:900});
  await page.goto(process.env.AUDIT_BASE||'http://127.0.0.1:5184');
  await page.waitForFunction(()=>document.getElementById('contribution'));
  await page.evaluate(()=>document.fonts.ready);
  const section=page.locator('#contribution');
  const range=await section.evaluate(element=>({start:scrollY+element.getBoundingClientRect().top,travel:element.getBoundingClientRect().height-innerHeight}));
  const revealing=()=>section.locator('.contribution-pair:not([hidden])').evaluate(element=>element.getAnimations({subtree:true}).some(animation=>animation.playState==='running'||animation.playState==='paused'));
  await page.evaluate(start=>scrollTo({top:start+1,behavior:'instant'}),range.start);
  await page.waitForTimeout(100);
  assert.ok(await revealing());
  await page.mouse.move(width-10,450);
  await page.mouse.wheel(0,4000);
  await page.waitForTimeout(250);
  assert.equal(await section.getAttribute('data-contribution-page'),'1','First pair must finish before switching');
  assert.ok(Math.abs(await page.locator('.contribution-stage').evaluate(element=>element.getBoundingClientRect().top))<2);
  await page.waitForFunction(()=>!document.querySelector('.contribution-pair:not([hidden])').getAnimations({subtree:true}).some(a=>a.playState==='running'||a.playState==='paused'));
  await page.mouse.wheel(0,4000);
  await page.waitForTimeout(150);
  assert.equal(await section.getAttribute('data-contribution-page'),'2');
  assert.ok(await revealing());
  await page.mouse.wheel(0,4000);
  await page.waitForTimeout(250);
  assert.equal(await section.getAttribute('data-contribution-page'),'2');
  assert.ok(Math.abs(await page.locator('.contribution-stage').evaluate(element=>element.getBoundingClientRect().top))<2,'Last pair must stay pinned until its reveal ends');
  await page.waitForFunction(()=>!document.querySelector('.contribution-pair:not([hidden])').getAnimations({subtree:true}).some(a=>a.playState==='running'||a.playState==='paused'));
  await page.mouse.wheel(0,400);
  await page.waitForTimeout(500);
  assert.ok(await page.locator('.contribution-stage').evaluate(element=>element.getBoundingClientRect().top < -50),'Scroll must release after completion');
  // Rearmed offscreen animations must never pull the reader back into this section.
  await page.waitForTimeout(200);
  const afterRelease=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,300);
  await page.waitForTimeout(500);
  assert.ok(await page.evaluate(before=>scrollY>before,afterRelease),'Forward scroll after release must keep moving down');
  await page.locator('#skills').evaluate(element=>element.scrollIntoView({behavior:'instant'}));
  await page.waitForTimeout(200);
  const skillsY=await page.evaluate(()=>scrollY);
  await page.mouse.wheel(0,300);
  await page.waitForTimeout(500);
  assert.ok(await page.evaluate(before=>scrollY>before,skillsY),'Scrolling in a later section must not jump back');
  console.log(`${width}px: first pair and last pair held until completion; next section released`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
