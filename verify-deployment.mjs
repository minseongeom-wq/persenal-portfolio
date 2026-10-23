import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

// Exercise the built site over HTTP, including lazy assets and fragment navigation.
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let browser;
try{
 const base=await new Promise((resolve,reject)=>{
  let output='';
  const timer=setTimeout(()=>reject(Error('Local server did not start')),30000);
  server.stdout.on('data',data=>{output+=data;const match=output.match(/Local: (http:\/\/localhost:\d+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  server.stderr.on('data',data=>{output+=data;});
  server.once('error',error=>{clearTimeout(timer);reject(error);});
  server.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited (${code}): ${output}`));});
 });
 const config=JSON.parse(await readFile('vercel.json','utf8'));
 assert.equal(config.outputDirectory,'dist');
 // Request every deployed file to catch missing assets and Linux case mismatches.
 async function checkFiles(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const file=`${dir}/${entry.name}`;
   if(entry.isDirectory()){await checkFiles(file);continue;}
   const response=await fetch(`${base}/${file.slice(5)}`,{method:'HEAD'});
   assert.equal(response.status,200,file);
  }
 }
 await checkFiles('dist');
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:process.platform==='win32'?{channel:'msedge'}:{})});
 const errors=[],failed=[];
 const page=await browser.newPage({reducedMotion:'reduce'});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)failed.push(`${response.status()} ${response.url()}`);});
 page.on('requestfailed',request=>{if(request.failure()?.errorText!=='net::ERR_ABORTED')failed.push(request.url());});
 for(const width of [1920,1440,1024,768,600,390,320]){
  await page.setViewportSize({width,height:900});
  await page.goto(base);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>document.getElementById('contact'));
  for(const id of ['home','about','work','team','behind-project','contribution','development','skills','playground','philosophy','contact']){
   await page.locator(`#${id}`).evaluate(element=>element.scrollIntoView({behavior:'instant'}));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow: ${width}/${id}`);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.goto(`${base}/#about`);
 await page.waitForFunction(()=>Math.abs(document.getElementById('about')?.getBoundingClientRect().top)<2);
 await page.reload();
 await page.waitForFunction(()=>Math.abs(document.getElementById('about')?.getBoundingClientRect().top)<2);
 // Follow actual keyboard actions instead of invoking click handlers directly.
 const project=page.locator('[data-project-link="2"]');
 await project.focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:893"]').textContent==='03');
 const previewItem=page.locator('[data-node-id="919:1340"]');
 await previewItem.focus();
 assert.equal(await page.locator('#playground-preview').isVisible(),true);
 assert.equal(await previewItem.getAttribute('aria-pressed'),'true');
 await page.locator('[data-node-id="919:1349"]').focus();
 assert.equal(await previewItem.getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#playground-preview').isVisible(),true);
 await page.locator('.portfolio-navigation__logo').focus();
 await page.waitForFunction(()=>document.querySelector('.portfolio-navigation').dataset.open==='true');
 await page.keyboard.press('Escape');
 await page.waitForFunction(()=>document.querySelector('.portfolio-navigation').dataset.open==='false');
 // Offscreen loading="lazy" images may correctly remain unloaded; explicitly decode them.
 const broken=await page.locator('img').evaluateAll(async images=>{
  const results=await Promise.all(images.map(async image=>{image.loading='eager';try{await image.decode();return null;}catch{return image.src;}}));
  return results.filter(Boolean);
 });
 assert.deepEqual(broken,[],'Broken images');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto(base);
 await page.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.heroEntryPhase==='complete');
 const hero=page.locator('[data-node-id="919:872"] p');
 assert.equal(await hero.evaluate(element=>getComputedStyle(element).opacity),'1');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>!document.querySelector('.elastic-canvas'));
 const fallback=await browser.newPage({viewport:{width:1440,height:900}});
 fallback.on('pageerror',error=>errors.push(error.message));
 await fallback.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};
 });
 await fallback.goto(base);
 await fallback.waitForFunction(()=>document.querySelector('[data-node-id="919:872"] p')?.dataset.heroEntryPhase==='complete');
 assert.equal(await fallback.locator('.elastic-canvas,.elastic-rendering').count(),0,'WebGL fallback');
 await fallback.close();
 assert.deepEqual(errors,[],'Browser errors');
 assert.deepEqual(failed,[],'Failed HTTP requests');
 console.log('Deployment checks passed: all static files, 7 viewport widths, 11 sections, direct fragment/reload, keyboard project selection, dialog, navigation, entrance, reduced motion, WebGL fallback, browser errors.');
}finally{
 await browser?.close();
 if(server.exitCode===null){const closed=once(server,'exit');server.kill();await closed;}
}
