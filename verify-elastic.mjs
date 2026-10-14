import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.locator('.elastic-canvas').first().waitFor();await page.waitForTimeout(3800);
 const hero=page.locator('[data-node-id="919:872"] p');
 const baseline=JSON.parse(readFileSync('typography-baseline.json','utf8'));
 const geometry=await page.locator('.ghost-title').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {text:[...n.childNodes].filter(c=>c.nodeType===3||c.nodeName==='BR').map(c=>c.nodeName==='BR'?'\n':c.textContent).join('').trim(),font:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,box:{x:r.x,y:r.y,width:r.width,height:r.height}}}));
 if(JSON.stringify(geometry)!==JSON.stringify(baseline))throw Error('Native typography geometry changed');
 const clip={x:760,y:160,width:1040,height:500};await page.screenshot({path:'elastic-idle.png',clip});
 // Record the exact unwarped black mask for pixel comparison with a moving stroke.
 await hero.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);g.uniform1f(g.getUniformLocation(p,'u_active'),1);g.drawArrays(g.TRIANGLES,0,6);const flat=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,flat);window.__elasticFlat=flat;t.classList.add('elastic-rendering');});
 await page.screenshot({path:'elastic-flat.png',clip});
 await hero.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);g.uniform1f(g.getUniformLocation(p,'u_active'),0);g.drawArrays(g.TRIANGLES,0,6);t.classList.remove('elastic-rendering');});
 const box=await hero.boundingBox();const y=box.y+110;
 await page.mouse.move(box.x+175,y);await page.waitForTimeout(30);
 // Sustained, fast motion across the first line only.
 for(let i=0;i<16;i++){await page.mouse.move(box.x+175+i*12,y);await page.waitForTimeout(12);}
 const phase=await hero.getAttribute('data-elastic-phase');if(phase!=='active')throw Error('Black contour renderer did not activate: '+phase);
 const pixels=await hero.evaluate(t=>{const c=t.querySelector('canvas'),g=c.getContext('webgl'),data=new Uint8Array(c.width*c.height*4);g.readPixels(0,0,c.width,c.height,g.RGBA,g.UNSIGNED_BYTE,data);const flat=window.__elasticFlat;let changedBlack=0,colored=0,remoteChanged=0;for(let i=0;i<data.length;i+=4){const a=data[i+3]>180&&data[i]<35&&data[i+1]<35&&data[i+2]<35,b=flat[i+3]>180&&flat[i]<35&&flat[i+1]<35&&flat[i+2]<35;if(a!==b){changedBlack++;const row=Math.floor(i/4/c.width);if(row<c.height*.38)remoteChanged++;}if(data[i+3]>20&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])>40)colored++;}return {changedBlack,colored,remoteChanged};});
 if(pixels.changedBlack<40)throw Error('Black silhouette did not deform');if(pixels.colored<10)throw Error('No chromatic edge');if(pixels.remoteChanged>10)throw Error('Distant line deformed');
 await page.screenshot({path:'elastic-moving.png',clip});
 await page.mouse.move(30,30);const leaving=await hero.getAttribute('data-elastic-phase');if(leaving!=='recovering')throw Error('Exit snapped instead of spring recovery');
 await page.waitForTimeout(180);await page.screenshot({path:'elastic-recovering.png',clip});
 await page.waitForTimeout(620);if(await hero.getAttribute('data-elastic-phase')==='idle')throw Error('Recovery ended before .8 seconds');await page.screenshot({path:'elastic-lingering.png',clip});
 await page.waitForTimeout(2400);const recovered=await hero.getAttribute('data-elastic-phase');if(recovered!=='idle')throw Error('Not restored within 3.2 seconds: '+recovered);
 await page.screenshot({path:'elastic-restored.png',clip});
 const readPull=()=>hero.evaluate(t=>{const g=t.querySelector('canvas').getContext('webgl'),p=g.getParameter(g.CURRENT_PROGRAM);return {black:[...g.getUniform(p,g.getUniformLocation(p,'u_pull'))],red:[...g.getUniform(p,g.getUniformLocation(p,'u_redPull'))],cyan:[...g.getUniform(p,g.getUniformLocation(p,'u_cyanPull'))]};});
 const gesture=async(direction,delay,steps=12)=>{await page.mouse.move(30,30);await page.waitForTimeout(3200);await page.mouse.move(box.x+(direction>0?190:330),y);await page.waitForTimeout(20);for(let i=1;i<=steps;i++){await page.mouse.move(box.x+(direction>0?190:330)+direction*i*8,y);await page.waitForTimeout(delay);}await page.waitForTimeout(15);return readPull();};
 const slow=await gesture(1,36),fast=await gesture(1,8),reverse=await gesture(-1,8),onset=await gesture(1,8,4);
 if(!(fast.black[0]>slow.black[0]*1.3&&reverse.black[0]<0))throw Error('Velocity/direction response failed');
 if(!(Math.abs(onset.red[0])<Math.abs(onset.black[0])&&Math.abs(onset.cyan[0])<Math.abs(onset.black[0])))throw Error('Chromatic onset did not lag the black body');
 await page.mouse.move(30,30);await page.waitForTimeout(3200);
 if(await page.locator('.ghost-layer').count())throw Error('Old RGB duplicate layers remain');
 if(await page.locator('.elastic-canvas:not([aria-hidden="true"])').count())throw Error('Decorative canvas exposed to screen readers');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);if(await page.locator('.elastic-canvas').count())throw Error('Reduced motion still renders displacement');
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await touch.locator('.ghost-title').first().waitFor();if(await touch.locator('.elastic-canvas').count())throw Error('Touch canvas should be disabled');
 const mobile=await touch.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));if(mobile.width!==mobile.scrollWidth)throw Error('Mobile overflow');
 const fallback=await browser.newPage({viewport:{width:1920,height:1080}});await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args)};});await fallback.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await fallback.locator('.ghost-title').first().waitFor();await fallback.evaluate(()=>document.fonts.ready);await fallback.waitForTimeout(100);if(await fallback.locator('.elastic-canvas,.elastic-rendering').count())throw Error('No-WebGL fallback failed');
 if(await page.locator('feTurbulence').count())throw Error('Noise filter remains');
 await page.emulateMedia({reducedMotion:'no-preference'});await hero.locator('canvas').waitFor();await hero.evaluate(t=>t.querySelector('canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());await page.waitForTimeout(100);if(await hero.locator('canvas').count()||await hero.evaluate(t=>t.classList.contains('elastic-rendering')))throw Error('Lost-context fallback failed');
 console.log(JSON.stringify({titleLines:geometry.length,layoutPreserved:true,pixels,phase,leaving,recovered,slow,fast,reverse,onset,mobile,reducedMotionDisabled:true,noWebGLFallback:true,lostContextFallback:true,errors},null,2));if(errors.length)throw Error('Browser errors');
}finally{await browser.close();}
