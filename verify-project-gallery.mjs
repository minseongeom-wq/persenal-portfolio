import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {stat} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';return document.fonts.ready;});
 const section=page.locator('#work'),cards=page.locator('.project-gallery__card');
 if(await cards.count()!==4)throw Error('Missing project cards');
 const expected=[['4e748.png','4bc4d.png',360],['fa561.png','a20c5.png',952],['b46bb.png','c2c45.png',1544],['e9082.png','c3f3e.png',2135]];
 const sectionBox=await section.boundingBox();
 for(let i=0;i<4;i++){
  const card=cards.nth(i),image=card.locator('.project-gallery__image');
  await card.scrollIntoViewIfNeeded();
  await image.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(img=>img.decode())));
  const rect=await image.boundingBox(),parent=await section.boundingBox();
  if(Math.abs(rect.x-parent.x-767)>1||Math.abs(rect.y-parent.y-expected[i][2])>1||rect.width!==995||rect.height!==(i===2?541:542))throw Error('Project geometry mismatch: '+i+' '+JSON.stringify({rect,parent}));
  const sources=await image.locator('img').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')));
  for(let n=0;n<2;n++)if(sources[n]!=='./assets/'+expected[i][n]||!(await stat('dist/assets/'+expected[i][n])).size)throw Error('Wrong project asset');
  await page.mouse.move(1900,100);await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(260);
  if(await card.locator('.project-gallery__color').evaluate(e=>getComputedStyle(e).opacity)!=='0')throw Error('Preview should start blue');
  await card.hover();await page.waitForTimeout(260);
  if(await card.locator('.project-gallery__color').evaluate(e=>getComputedStyle(e).opacity)!=='1')throw Error('Preview did not reveal color');
  await page.screenshot({path:`project-gallery-hover-${i+1}.png`});
 }
 await page.locator('[data-project-link="1"]').scrollIntoViewIfNeeded();
 if(!await page.locator('[data-node-id="919:892"] canvas').count())throw Error('Title effect removed');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-project-link="1"]').click();
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:893"]').textContent==='02');
 const second=await cards.nth(1).boundingBox();if(Math.abs(second.y+second.height/2-540)>2)throw Error('Project link did not scroll to matching card');
 await section.evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
 await page.mouse.move(1900,100);await page.evaluate(()=>document.activeElement?.blur());
 await page.waitForTimeout(100);
 await page.screenshot({path:'project-gallery-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await section.evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
 for(const card of await cards.all()){
  const box=await card.locator('.project-gallery__image').boundingBox();
  if(box.width>342.5||Math.abs(box.width/box.height-995/542)>.01)throw Error('Mobile preview ratio mismatch');
 }
 await page.screenshot({path:'project-gallery-mobile.png'});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal scrolling introduced');
 if(await page.locator('video').count()!==3)throw Error('Existing media removed');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Four project previews, all eight assets, hover colors, Figma geometry, section navigation and mobile layout verified.');
}finally{await browser.close();}
