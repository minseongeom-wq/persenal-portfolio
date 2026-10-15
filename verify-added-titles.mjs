import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 for(const id of ['924:2269','924:2236']) {
  const titles=page.locator(`[data-node-id="${id}"] p`);
  await titles.first().locator('canvas').waitFor();
  await titles.first().evaluate(t=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,window.scrollY+t.getBoundingClientRect().top-350);});
  await page.waitForTimeout(3500);
  for(let i=0;i<10;i++){await page.evaluate(()=>window.scrollBy(0,12));await page.waitForTimeout(20);}
  for(const title of await titles.all()) {
   const state=await title.evaluate(t=>{const gl=t.querySelector('canvas').getContext('webgl'),p=gl.getParameter(gl.CURRENT_PROGRAM);return {text:t.textContent,phase:t.dataset.elasticPhase,pull:[...gl.getUniform(p,gl.getUniformLocation(p,'u_pull'))]};});
   if(state.phase!=='active'||Math.abs(state.pull[1])<.1)throw Error(JSON.stringify(state));
   console.log(JSON.stringify(state));
  }
 }
} finally {await browser.close();}
