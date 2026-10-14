import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 // Reproduce entering the page with the cursor already resting on the hero.
 await page.mouse.move(1000,300);
 await page.goto(process.env.ELASTIC_TEST_URL||pathToFileURL(process.cwd()+'/dist/index.html').href);
 const hero=page.locator('[data-node-id="919:872"] p');
 await hero.locator('canvas').waitFor();
 await page.waitForFunction(()=>{const t=document.querySelector('[data-node-id="919:872"] p');return t?.dataset.elasticPhase==='active';},{},{timeout:5000});
 await page.waitForTimeout(100);
 const intro=await hero.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM),pixels=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,pixels);let colored=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>20&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>40)colored++;return {phase:t.dataset.elasticPhase,pull:[...g.getUniform(p,g.getUniformLocation(p,'u_pull'))],colored};});
 if(intro.phase!=='active'||intro.pull[0]<1)throw Error('Intro did not play without input');
 if(intro.colored<30)throw Error('Intro played without visible RGB trails');
 if(await page.locator('.elastic-rendering').count()!==1)throw Error('Intro affected other titles');
 await page.waitForTimeout(600);await page.screenshot({path:'elastic-intro.png',clip:{x:760,y:160,width:1040,height:500}});
 await page.waitForTimeout(1000);await page.screenshot({path:'elastic-intro-trail.png',clip:{x:760,y:160,width:1040,height:500}});
 const trail=await hero.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),pixels=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,pixels);let colored=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>20&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>40)colored++;return colored;});
 if(trail<100)throw Error('Entrance trail faded into a flash');
 await page.waitForTimeout(1700);
 if(await hero.getAttribute('data-elastic-phase')!=='idle')throw Error('Intro did not restore');
 await page.setViewportSize({width:1800,height:1080});await page.waitForTimeout(800);
 if(await hero.getAttribute('data-elastic-phase')!=='idle')throw Error('Intro replayed after resize');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.elasticPhase==='active',{},{timeout:12000});
 const repeated=await hero.evaluate(t=>{const g=t.querySelector('canvas').getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);return g.getUniform(p,g.getUniformLocation(p,'u_intro'))===1;});
 if(!repeated)throw Error('Periodic entrance animation did not replay');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
 if(await hero.locator('canvas').count())throw Error('Reduced motion did not disable intro');
 console.log(JSON.stringify({intro,restored:true,repeatsEvery10Seconds:repeated,reducedMotionDisabled:true}));
}finally{await browser.close();}
