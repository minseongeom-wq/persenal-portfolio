import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 const title=page.locator('[data-node-id="919:872"] p');
 await title.locator('canvas').waitFor();await page.mouse.move(30,30);
 const gesture=async(delta)=>{
  await page.evaluate(()=>window.scrollTo(0,150));await page.waitForTimeout(3300);
  for(let i=0;i<10;i++){await page.evaluate(d=>window.scrollBy(0,d),delta);await page.waitForTimeout(20);}
  return title.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);return {pull:[...g.getUniform(p,g.getUniformLocation(p,'u_pull'))],phase:t.dataset.elasticPhase};});
 };
 const slow=await gesture(1),fast=await gesture(12),reverse=await gesture(-12);
 if(!(Math.abs(fast.pull[1])>Math.abs(slow.pull[1])*2))throw Error('Scroll speed did not increase deformation');
 if(!(fast.pull[1]<0&&reverse.pull[1]>0))throw Error('Scroll direction did not reverse deformation');
 if(fast.phase!=='active')throw Error('Scroll did not activate the effect');
 await page.waitForTimeout(800);
 if(await title.getAttribute('data-elastic-phase')!=='recovering')throw Error('Scroll trail vanished too soon');
 await page.waitForTimeout(2500);
 if(await title.getAttribute('data-elastic-phase')!=='idle')throw Error('Scroll deformation did not restore');
 console.log(JSON.stringify({slow,fast,reverse,lingersAfterScroll:true,restored:true},null,2));
}finally{await browser.close();}
