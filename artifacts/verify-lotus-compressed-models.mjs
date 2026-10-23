import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const sizes=JSON.parse(await readFile('artifacts/lotus-model-optimization/sizes.json','utf8'));
for(const row of sizes.filter(row=>row.mode==='draco')){
 const original=await readFile(`projects/lotus/assets/models/${row.name}.glb`);
 assert.equal(createHash('sha256').update(original).digest('hex'),row.originalSha256);
 const deployed=await readFile(`dist/projects/lotus/assets/models/${row.name}-draco.glb`);
 assert.equal(deployed.length,row.bytes);
}
const browser=await chromium.launch({channel:'msedge',headless:true});
const results=[];
try{
 const page=await browser.newPage({reducedMotion:'reduce'});
 const errors=[],decoderRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',request=>{if(/draco.*\.(js|wasm)/.test(request.url()))decoderRequests.push(request.url());});
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  await page.goto((process.env.AUDIT_BASE||'http://127.0.0.1:5184')+'/projects/lotus/index.html');
  await page.locator('#build').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
  await page.evaluate(()=>customElements.whenDefined('model-viewer'));
  for(const name of ['EMEYA','EMIRA','ELETRE']){
   await page.getByRole('tab',{name,exact:true}).click();
   await page.waitForFunction(name=>{
    const viewer=document.querySelector('.custom-model-viewer');
    return viewer.loaded&&viewer.getAttribute('src')===`assets/models/${name.toLowerCase()}-draco.glb`&&document.querySelector('#custom-model-preview').getAttribute('aria-busy')==='false';
   },name,{timeout:60000});
   const viewer=page.locator('.custom-model-viewer');
   assert.ok(await viewer.evaluate(e=>e.getDimensions().x>0&&e.model.materials.length>0));
   await page.locator('[data-node-id="432:608"]').click();
   assert.equal(await page.locator('.custom-part-options').isVisible(),true);
   await page.locator('.custom-part-choices button').first().click();
   assert.equal(await page.locator('.custom-part-choices button').first().getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'전체 보기',exact:true}).click();
   await viewer.screenshot({path:`artifacts/lotus-model-optimization/live-${name.toLowerCase()}-${width}.png`});
   results.push({width,name,loaded:true,partCameraAndOption:true});
   console.log(`${width}px ${name}: compressed model, material loading, part view, option and reset passed`);
  }
 }
 assert.ok(decoderRequests.some(url=>url.endsWith('draco_decoder.wasm')));
 assert.ok(decoderRequests.every(url=>new URL(url).hostname==='127.0.0.1'),'Decoder must load locally');
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/lotus-model-optimization/integration.json',JSON.stringify({originalHashesVerified:true,decoderRequests,results},null,2)+'\n');
}finally{await browser.close();}
