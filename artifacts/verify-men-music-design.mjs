import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {chromium} from 'playwright';
const titles=['Numb','Lauren','Tree Among Shrubs','I hope to be around','You Deserve This','Days Go By','Sugar'];
const years=['2019','2017','2022','2017','2017','2020','2022'];
const images=['171ef.png','bd81b.png','6d6b5.png','758ed.png','1fde3.png','59c83.png'];
for(const asset of ['478c7.png','c3633.svg',...images])assert.ok((await stat(`projects/men-i-trust/assets/${asset}`)).size>0);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 for(const width of [1920,1440,390,320]){
  await page.setViewportSize({width,height:width===1920?1080:900});
  await page.goto((process.env.AUDIT_BASE||'http://127.0.0.1:5184')+'/projects/men-i-trust/index.html');
  const section=page.locator('#music');
  await section.evaluate(element=>element.scrollIntoView({behavior:'instant'}));
  await page.evaluate(()=>document.fonts.ready);
  const cards=section.locator('.music-card');
  assert.deepEqual(await cards.locator('.music-card__title').allTextContents(),titles);
  assert.deepEqual(await cards.evaluateAll(cards=>cards.map(card=>card.querySelector('p').textContent)),years);
  await section.locator('img').evaluateAll(images=>Promise.all(images.map(image=>{image.loading='eager';return image.decode();})));
  const geometry=await section.evaluate(element=>{
   const bounds=element.getBoundingClientRect(),scale=bounds.width/element.offsetWidth;
   const relative=node=>{const r=node.getBoundingClientRect();return {x:(r.left-bounds.left)/scale,y:(r.top-bounds.top)/scale,width:r.width/scale,height:r.height/scale};};
   return {track:relative(element.querySelector('.music-track')),caption:relative(element.querySelector('.music-caption')),cards:[...element.querySelectorAll('.music-card')].map(relative),icons:[...element.querySelectorAll('.music-card [data-name="Component 2"] img')].map(relative),radius:getComputedStyle(element).borderBottomLeftRadius};
  });
  assert.equal(geometry.radius,'40px');
  geometry.cards.forEach(card=>assert.ok(Math.abs(card.width-card.height)<1));
  geometry.icons.forEach(icon=>assert.ok(Math.abs(icon.width-24)<1&&Math.abs(icon.height-24)<1));
  assert.deepEqual(await section.locator('.music-card img[src$=".png"]').evaluateAll(images=>images.map(image=>image.getAttribute('src').split('/').pop())),images);
  if(width===1920){assert.ok(Math.abs(geometry.track.y-340)<1);assert.ok(Math.abs(geometry.caption.y-871)<1);assert.equal(geometry.cards[0].width,400);}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await section.screenshot({path:`artifacts/men-music-latest-${width}.png`});
  await cards.nth(1).focus();await cards.nth(1).press('Enter');
  await page.waitForFunction(()=>document.querySelector('.music-background-layer.is-visible')?.getAttribute('src')==='assets/171ef.png');
  assert.equal(await cards.nth(1).getAttribute('aria-pressed'),'true');
  await section.locator('.music-track').evaluate(track=>track.scrollTo({left:track.scrollWidth,behavior:'instant'}));
  assert.ok(await section.locator('.music-track').evaluate(track=>track.scrollLeft>0));
  await section.screenshot({path:`artifacts/men-music-latest-${width}-end.png`});
  console.log(`${width}px: design geometry, seven titles/years, exact assets, keyboard selection and gallery scroll passed`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
