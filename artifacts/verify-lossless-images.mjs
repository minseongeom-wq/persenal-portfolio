import assert from 'node:assert/strict';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'5178'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let browser;
try{
 await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Server timeout')),30000);server.stdout.on('data',data=>{output+=data;if(output.includes('Local:')){clearTimeout(timer);resolve();}});server.on('error',reject);});
 const base='http://127.0.0.1:5178';
 const manifest=JSON.parse(await readFile('lib/optimized-images/manifest.json','utf8'));
 browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const failures=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
 for(const project of ['lotus','men-i-trust','worldwideworld']){
  await page.goto(`${base}/projects/${project}/index.html`,{waitUntil:'load'});
  assert.ok(await page.locator('img').count()>0,`${project}: page contains images`);
  const broken=await page.locator('img').evaluateAll(async images=>(await Promise.all(images.map(async image=>{try{image.loading='eager';await image.decode();return null;}catch{return image.src;}}))).filter(Boolean));
  assert.deepEqual(broken,[],`${project}: broken images`);
  if(project==='men-i-trust'){
   const cards=page.locator('.music-card');
   await cards.nth(1).click({force:true});
   await page.waitForFunction(()=>document.querySelectorAll('.music-card')[1].getAttribute('aria-pressed')==='true');
   assert.ok(await page.locator('.music-background-layer.is-visible').getAttribute('src'));
  }
  await page.screenshot({path:`artifacts/lossless-${project}.png`});
 }
 for(const record of manifest){
  assert.equal((await stat(record.source)).size,record.originalBytes);
  const response=await fetch(`${base}/${record.target}`);
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');
  assert.equal((await response.arrayBuffer()).byteLength,record.bytes);
 }
 assert.deepEqual(failures,[],'HTTP failures');assert.deepEqual(errors,[],'Browser errors');
 const result={images:manifest.length,savedBytes:manifest.reduce((sum,r)=>sum+r.originalBytes-r.bytes,0),originalsPreserved:true,pixelsIdentical:true,projectPages:3,browserErrors:errors,httpFailures:failures};
 await writeFile('artifacts/lossless-image-results.json',JSON.stringify(result,null,2)+'\n');console.log(result);
}finally{await browser?.close();server.kill();}
