import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({reducedMotion:'reduce'});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 for(const width of [1920,1440,1024,390,320]){
  await page.setViewportSize({width,height:1000});
  await page.goto(process.env.AUDIT_BASE||'http://127.0.0.1:5173');
  await page.waitForFunction(()=>document.getElementById('behind-project'));
  const section=page.locator('#behind-project');
  await section.scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await page.locator('[data-name^="Section /"]').evaluateAll(nodes=>nodes.slice(3,7).map(node=>node.id)),['team','behind-project','contribution','development']);
  const gallery=section.locator('.behind-project__gallery');
  const stage=section.locator('.behind-project__stage');
  const captionGap=await section.evaluate(element=>{
   const scale=element.getBoundingClientRect().width/element.offsetWidth;
   return (element.querySelector('.behind-project__content').getBoundingClientRect().top-element.querySelector('figcaption').getBoundingClientRect().bottom)/scale;
  });
  assert.ok(Math.abs(captionGap-73)<.1,`Caption gap: ${captionGap}`);
  await gallery.locator('img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  const geometry=await gallery.evaluate(element=>({client:element.clientWidth,scroll:element.scrollWidth,images:[...element.querySelectorAll('img')].map(image=>({src:image.getAttribute('src'),width:image.offsetWidth,height:image.offsetHeight,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,fit:getComputedStyle(image).objectFit}))}));
  assert.ok(geometry.scroll>geometry.client);
  assert.equal(geometry.images.length,4);
  geometry.images.forEach((image,index)=>{
   assert.equal(image.src,`./assets/teamwork-${index+1}.png`);
   assert.ok(image.naturalWidth>0&&image.naturalHeight>0);
   assert.ok(Math.abs(image.width/image.height-(index===1?784:782)/480)<.02);
   assert.equal(image.fit,'cover');
  });
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await gallery.evaluate(element=>getComputedStyle(element).scrollbarWidth),'none');
  const range=await section.evaluate(element=>{
   const rect=element.getBoundingClientRect();
   const stage=element.querySelector('.behind-project__stage');
   return {start:scrollY+rect.top,distance:rect.height-stage.getBoundingClientRect().height};
  });
  assert.ok(range.distance>0);
  await page.evaluate(start=>scrollTo({top:start,behavior:'instant'}),range.start);
  await page.waitForTimeout(100);
  assert.ok(await gallery.evaluate(element=>element.scrollLeft<3));
  const photo=gallery.locator('.behind-project__image').first();
  await photo.hover();
  assert.equal(await photo.locator('img').evaluate(element=>getComputedStyle(element).filter),'none');
  await page.mouse.move(0,0);
  assert.ok((await photo.locator('img').evaluate(element=>getComputedStyle(element).filter)).includes('behind-project-blue'));
  assert.equal(await photo.evaluate(element=>getComputedStyle(element,'::after').backgroundImage),await page.locator('.team-project__image').evaluate(element=>getComputedStyle(element,'::after').backgroundImage));
  await photo.focus();
  assert.equal(await photo.locator('img').evaluate(element=>getComputedStyle(element).filter),'none');
  await photo.evaluate(element=>element.blur());
  await stage.screenshot({path:`artifacts/behind-project-${width}.png`});
  await page.mouse.move(width/2,300);
  await page.mouse.wheel(0,250);
  await page.waitForTimeout(300);
  assert.ok(await gallery.evaluate(element=>element.scrollLeft>20),'Vertical wheel should move photos horizontally');
  await page.evaluate(({start,distance})=>scrollTo({top:start+distance*.5,behavior:'instant'}),range);
  await page.waitForTimeout(100);
  const midpoint=await gallery.evaluate(element=>element.scrollLeft/(element.scrollWidth-element.clientWidth));
  assert.ok(Math.abs(midpoint-.5)<.01);
  assert.ok(Math.abs(await stage.evaluate(element=>element.getBoundingClientRect().top))<2,'Stage should stay pinned');
  await page.evaluate(({start,distance})=>scrollTo({top:start+distance,behavior:'instant'}),range);
  await page.waitForTimeout(100);
  assert.ok(await gallery.evaluate(element=>element.scrollLeft>=element.scrollWidth-element.clientWidth-3));
  await stage.screenshot({path:`artifacts/behind-project-${width}-end.png`});
  await page.evaluate(({start,distance})=>scrollTo({top:start+distance,behavior:'instant'}),range);
  await page.waitForTimeout(100);
  await page.mouse.wheel(0,250);
  await page.waitForTimeout(300);
  assert.ok(await stage.evaluate(element=>element.getBoundingClientRect().top < -20),'Scrolling should continue after the last photo: '+JSON.stringify(range)+' '+JSON.stringify(await stage.evaluate(element=>({top:element.getBoundingClientRect().top,bottom:element.getBoundingClientRect().bottom,y:scrollY}))))
  console.log(`Passed assets, layout, hidden scrollbar, vertical wheel, pinned progress and release: ${width}`);
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 const smoothRange=await page.locator('#behind-project').evaluate(element=>({start:scrollY+element.getBoundingClientRect().top,distance:element.getBoundingClientRect().height-element.querySelector('.behind-project__stage').getBoundingClientRect().height}));
 await page.evaluate(start=>scrollTo({top:start,behavior:'instant'}),smoothRange.start);
 await page.waitForTimeout(900);
 const motion=await page.evaluate(async({start,distance})=>{
  const gallery=document.querySelector('.behind-project__gallery');
  const target=(gallery.scrollWidth-gallery.clientWidth)*.5;
  scrollTo({top:start+distance*.5,behavior:'instant'});
  for(let i=0;i<3;i++)await new Promise(requestAnimationFrame);
  return {position:gallery.scrollLeft,target};
 },smoothRange);
 assert.ok(motion.position>0&&motion.position<motion.target*.9,'Photos should ease toward the scroll position');
 await page.waitForTimeout(900);
 const settled=await page.locator('.behind-project__gallery').evaluate(element=>element.scrollLeft);
 assert.ok(Math.abs(settled-motion.target)<3,'Photos should settle at the target');
 console.log('Passed 73px caption spacing, eased motion and reduced-motion support');
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
