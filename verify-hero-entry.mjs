import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const url=pathToFileURL(process.cwd()+'/dist/index.html').href;
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.entryEvents=[];window.entryConflicts=[];document.addEventListener('hero-title-start',()=>{window.titleStartedAt=performance.now();},{capture:true});
  new MutationObserver(records=>{
   for(const {target,attributeName} of records){
    if(attributeName==='data-hero-entry-phase')window.entryEvents.push({id:target.parentElement.dataset.nodeId,text:target.textContent.trim(),phase:target.dataset.heroEntryPhase,time:performance.now()});
    if(target.parentElement.dataset.nodeId!=='919:872'&&target.dataset.heroEntering==='true'&&target.classList.contains('elastic-rendering'))window.entryConflicts.push(performance.now());
   }
  }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-hero-entry-phase','class']});
 });
 await page.mouse.move(30,30);await page.goto(url);
 const main=page.locator('[data-node-id="919:872"] p');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p').dataset.heroEntryPhase==='entering');
 await page.waitForTimeout(100);
 const opacity=await main.evaluate(t=>parseFloat(getComputedStyle(t).opacity));
 if(await main.locator('.hero-entry-canvas').count())throw Error('Main title still uses the replacement warp');
 await page.screenshot({path:'hero-entry-start.png'});
 await page.waitForTimeout(200);
 const next=await main.evaluate(t=>parseFloat(getComputedStyle(t).opacity));
 if(!(next>opacity))throw Error('Main title did not fade in');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p').dataset.elasticPhase==='active');
 const initial=await main.locator('.elastic-canvas').evaluate(c=>{const g=c.getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);return g.getUniform(p,g.getUniformLocation(p,'u_intro'));});
 if(initial!==1)throw Error('Original entrance distortion not restored');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:874"] p').dataset.heroEntryPhase==='entering');
 await page.waitForTimeout(90);
 const colored=await page.locator('[data-node-id="919:874"] .hero-entry-canvas').evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]>4&&Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>25)n++;return n;});
 if(colored<5)throw Error('Gray metadata has no visible chromatic trail');
 await page.screenshot({path:'hero-gray-entry-trail.png'});
 const social=page.locator('[data-node-id="919:876"]');
 if(await social.locator('p').getAttribute('data-hero-entry-phase')==='pending'&&await social.locator('[data-name="Icon / Link Arrow"]').evaluate(e=>parseFloat(getComputedStyle(e).opacity))!==0)throw Error('Arrow visible before text');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:877"] p').dataset.heroEntryPhase==='entering');
 const paired=await social.evaluate(e=>{const arrow=e.querySelector('[data-name="Icon / Link Arrow"]'),canvas=e.querySelector('.hero-entry-canvas');return Math.abs(parseFloat(getComputedStyle(arrow).opacity)-parseFloat(getComputedStyle(canvas).opacity))<.001;});
 if(!paired)throw Error('Arrow and text entrance are not synchronized');
 await page.waitForFunction(()=>!document.querySelector('.hero-entry-pending,.hero-entry-rendering,.hero-entry-canvas'),null,{timeout:9000});
 if(await page.locator('.hero-entry-pending,.hero-entry-rendering,.hero-entry-canvas').count())throw Error('Entry did not restore native text');
 const events=await page.evaluate(()=>window.entryEvents);
 const first=events.find(e=>e.id==='919:872'&&e.phase==='entering');
 const end=events.find(e=>e.id==='919:872'&&e.phase==='complete');
 if(!first||!end||end.time-first.time<850||end.time-first.time>1300)throw Error('Main entry timing: '+JSON.stringify({first,end}));
 const small=events.filter(e=>e.id!=='919:872'&&e.phase==='entering');
 if(small.length!==7)throw Error('Missing small Hero text: '+JSON.stringify(small));
 const titleStart=await page.evaluate(()=>window.titleStartedAt);
 const web=small.filter(e=>e.id==='919:873'),gray=small.filter(e=>e.id!=='919:873');
 if(!titleStart||gray.some(e=>Math.abs(e.time-titleStart-900)>100))throw Error('Gray text did not follow WEB lines by 300ms');
 if(web.length!==2||web.some(e=>Math.abs(e.time-titleStart-600)>100))throw Error('WEB lines did not enter halfway through title distortion');
 await page.screenshot({path:'hero-entry-complete.png'});
 // Wait for the first distortion to settle before testing the next 10-second cycle.
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p').dataset.elasticPhase==='idle',null,{timeout:6000});
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p').dataset.elasticPhase==='active',null,{timeout:12000});
 const repeat=await main.locator('.elastic-canvas').evaluate(c=>{const gl=c.getContext('webgl'),program=gl.getParameter(gl.CURRENT_PROGRAM);return gl.getUniform(program,gl.getUniformLocation(program,'u_intro'));});
 if(repeat!==1)throw Error('10-second distortion did not repeat');
 if(await page.locator('.hero-entry-canvas').count())throw Error('Small text replayed on 10-second timer');
 if((await page.evaluate(()=>window.entryEvents)).filter(e=>e.phase==='entering').length!==8)throw Error('Entrance replayed');
 if((await page.evaluate(()=>window.entryConflicts)).length)throw Error('Entrance overlapped elastic effect');
 await page.waitForTimeout(4000);
 const box=await main.boundingBox();await page.mouse.move(box.x+130,box.y+90);await page.mouse.move(box.x+330,box.y+90,{steps:10});
 if(await main.getAttribute('data-elastic-phase')!=='active')throw Error('Pointer effect not restored');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto(url);await mobile.waitForFunction(()=>document.querySelector('.hero-entry-rendering'));
 await mobile.waitForFunction(()=>!document.querySelector('.hero-entry-pending,.hero-entry-rendering,.hero-entry-canvas'),null,{timeout:9000});
 if(await mobile.locator('.hero-entry-canvas').count())throw Error('Mobile entry did not finish');
 if(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);await reduced.evaluate(()=>document.fonts.ready);
 if(await reduced.locator('.hero-entry-pending,.hero-entry-canvas,.elastic-canvas').count())throw Error('Reduced motion fallback failed');
 const noCanvas=await browser.newPage();await noCanvas.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});await noCanvas.goto(url);await noCanvas.evaluate(()=>document.fonts.ready);await noCanvas.waitForTimeout(100);
 if(await noCanvas.locator('.hero-entry-pending,.hero-entry-rendering').count())throw Error('Canvas fallback left text hidden');
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({mainDuration:Math.round(end.time-first.time),smallTextCount:small.length,grayAfterTitleStart:Math.round(gray[0].time-titleStart),webAfterTitleStart:Math.round(web[0].time-titleStart),repeatEvery10Seconds:true,noOverlap:true,mobile:true,reducedMotion:true,canvasFallback:true}));
}finally{await browser.close();}
