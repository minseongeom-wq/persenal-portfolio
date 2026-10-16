import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const assert=(value,message)=>{if(!value)throw Error(message);};
try{
 const page=await browser.newPage({viewport:{width:1920,height:1200}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>document.fonts.ready);
 const cards=page.locator('[data-name^="Skill Card /"]');
 const seek=async(card,time)=>card.evaluate((e,time)=>{
  const root=e.querySelector('.skill-artwork');
  const rate=Number(getComputedStyle(root).getPropertyValue('--motion-rate'))||1;
  root.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=time/rate;});
 },time);
 const enter=async name=>{
  const card=page.locator(`[data-name="Skill Card / ${name}"]`);
  await card.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(500);
  const before=await card.locator('p').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [r.x,r.y,r.width,r.height,s.fontSize,s.color]}));
  await card.hover();await page.waitForTimeout(30);
  assert(await card.getAttribute('data-skill-active')==='true',name+' did not start');
  const after=await card.locator('p').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return [r.x,r.y,r.width,r.height,s.fontSize,s.color]}));
  assert(JSON.stringify(before)===JSON.stringify(after),name+' changed text geometry');
  return card;
 };
 const design=await enter('01 Design');
 await seek(design,180);
 const dots=await design.locator('.skill-artwork__dot').evaluateAll(es=>es.map(e=>({src:e.src,opacity:Number(getComputedStyle(e).opacity)})));
 assert(dots.find(d=>d.src.includes('d9887')).opacity>0&&dots.find(d=>d.src.includes('947d9')).opacity===0,'Dot order');
 await seek(design,1500);
 const filters=await design.locator('.skill-artwork__dot').evaluateAll(es=>es.map(e=>({src:e.src,filter:getComputedStyle(e).filter})));
 assert(filters.find(d=>d.src.includes('947d9')).filter==='brightness(0)'&&filters.find(d=>d.src.includes('d9887')).filter==='brightness(1)','Reverse dark wave must be staggered');
 await seek(design,3000);
 assert(await design.locator('.skill-artwork__dot').evaluateAll(es=>es.every(e=>getComputedStyle(e).filter==='brightness(1)')),'Dot shades did not restore');
 assert(await design.locator('.skill-artwork').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a instanceof CSSAnimation).every(a=>a.effect.getTiming().iterations===1)),'Design repeated');
 const frontend=await enter('02 Frontend');await seek(frontend,1100);
 assert(await frontend.locator('.skill-artwork__anchor').evaluate(e=>Math.abs(new DOMMatrix(getComputedStyle(e).transform).m41-156)<1),'Square range');
 assert(await frontend.locator('.skill-artwork img').evaluateAll(es=>es.every(e=>e.getAnimations().length===0)),'Wireframe moved');
 const workflow=await enter('03 Workflow');await seek(workflow,850);
 assert(await workflow.locator('path').evaluate(e=>parseFloat(getComputedStyle(e).strokeDashoffset)===0),'Reference curve should lead the moving markers');
 const moving=await workflow.locator('[data-workflow-dot]').evaluateAll(es=>es.some(e=>Math.abs(new DOMMatrix(getComputedStyle(e).transform).m41)>10));
 assert(moving,'Workflow markers must move');
 await seek(workflow,1800);
 assert(await workflow.locator('[data-workflow-dot]').evaluateAll(es=>es.every(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.abs(m.m41)<.01&&Math.abs(m.m42)<.01&&getComputedStyle(e).opacity==='1'})),'Markers did not settle at original slots');
 await workflow.screenshot({path:'artifacts/skills-workflow-motion-complete.png'});
 const ai=await enter('04 AI Tools');await seek(ai,1000);
 assert(await ai.locator('.skill-artwork__orbit').evaluateAll(es=>es.length===4&&es.every(e=>getComputedStyle(e).transform!=='matrix(1, 0, 0, 1, 0, 0)')),'Orbit markers did not move');
 assert(await ai.locator('img[src$="skill-111bc.svg"]').evaluate(e=>e.getAnimations().length===0),'Center moved');
 for(let i=0;i<3;i++){
  await page.mouse.move(0,0);await page.waitForTimeout(500);await ai.hover();await page.waitForTimeout(30);
  assert(await ai.locator('.skill-artwork__orbit').evaluateAll(es=>es.every(e=>e.getAnimations().length===1&&e.getAnimations()[0].currentTime<200)),'Orbit animation accumulated or did not restart');
 }
 await page.mouse.move(0,0);await page.waitForTimeout(500);await workflow.focus();await page.waitForTimeout(30);
 assert(await workflow.getAttribute('data-skill-active')==='true','Keyboard focus');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>[...document.querySelectorAll('.skill-artwork')].every(e=>e.dataset.static==='true'));
 assert(await cards.locator('.skill-artwork').evaluateAll(es=>es.every(e=>e.dataset.static==='true'&&e.getAnimations({subtree:true}).length===0&&getComputedStyle(e).opacity==='1')),'Reduced motion must show static completed graphics');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await mobile.evaluate(()=>document.fonts.ready);
 await mobile.waitForFunction(()=>[...document.querySelectorAll('.skill-artwork')].every(e=>e.dataset.static==='true'));
 assert(await mobile.locator('.skill-artwork').evaluateAll(es=>es.every(e=>e.dataset.static==='true'&&e.getAnimations({subtree:true}).length===0)),'Touch fallback');
 assert(errors.length===0,errors.join('\n'));
 console.log('PASS: dot reveal and reverse wave; square bounds; path draw and marker travel; four orbits; repeated entry; unchanged text; keyboard; touch; reduced motion.');
}finally{await browser.close();}
