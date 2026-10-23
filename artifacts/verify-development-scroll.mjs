import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [1440,1024,390,320]){
  await page.setViewportSize({width,height:1000});
  await page.goto(process.env.AUDIT_BASE||'http://127.0.0.1:5184');
  await page.waitForFunction(()=>document.getElementById('development'));
  await page.evaluate(()=>document.fonts.ready);
  const section=page.locator('#development');
  assert.equal(await section.locator('[data-development-pair]').count(),6);
  const range=await section.evaluate(e=>({start:scrollY+e.getBoundingClientRect().top,distance:e.getBoundingClientRect().height-e.querySelector('.development-stage').getBoundingClientRect().height}));
  for(const progress of [.1,.25,.5,.75,.9,.1]){
   await page.evaluate(({range,progress})=>scrollTo({top:range.start+range.distance*progress,behavior:'instant'}),{range,progress});
   await page.waitForTimeout(900);
   const pair=progress<.25?0:progress<.75?1:2;
   const values=await section.locator(`[data-development-pair="${pair}"]`).evaluateAll(es=>es.map(e=>({opacity:Number(getComputedStyle(e).opacity),hidden:e.hidden})));
   for(const value of values){if(progress===.25||progress===.75)assert.ok(value.opacity>.4&&value.opacity<.6);else assert.ok(!value.hidden&&value.opacity>.99);}
   assert.ok(Math.abs(await section.locator('.development-stage').evaluate(e=>e.getBoundingClientRect().top))<2);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(progress===.5||progress===.9){
    const prefix=progress===.5?'game-discovery':'splatoon';
    await section.locator(`img[src$="${prefix}-design.png"]`).evaluate(e=>e.decode());
    const video=section.locator(`video[data-src$="${prefix}-development.mp4"]`);
    await page.waitForFunction(prefix=>{const v=document.querySelector(`video[data-src$="${prefix}-development.mp4"]`);return v.readyState>=2&&!v.paused&&v.currentTime>0;},prefix);
    assert.ok((await video.getAttribute('src')).endsWith(`${prefix}-development.mp4`));
    const dimensions=await section.locator(`[data-development-pair="${pair}"]`).evaluateAll(es=>es.map(e=>({width:e.offsetWidth,height:e.offsetHeight,fit:getComputedStyle(e.querySelector('img,video')).objectFit})));
    assert.equal(dimensions[0].width,dimensions[1].width);assert.equal(dimensions[0].height,dimensions[1].height);
    dimensions.forEach(dimension=>assert.equal(dimension.fit,'cover'));
    await page.waitForTimeout(1400);
    await section.locator('.development-stage').screenshot({path:`artifacts/development-pair-${pair}-${width}.png`});
   }
  }
  await page.evaluate(({start,distance})=>scrollTo({top:start+distance+300,behavior:'instant'}),range);
  await page.waitForTimeout(300);
  assert.ok(await section.locator('.development-stage').evaluate(e=>e.getBoundingClientRect().top < -200));
  console.log(`${width}px: six equal-size cards, both crossfades, two new videos, reverse scroll and release passed`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#development').evaluate(e=>{const r=e.getBoundingClientRect();scrollTo({top:scrollY+r.top+(r.height-e.querySelector('.development-stage').getBoundingClientRect().height)*.9,behavior:'instant'});});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#development').getAttribute('data-development-pair'),'2');
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
