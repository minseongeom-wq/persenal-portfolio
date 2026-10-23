import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.cwd(),directory='artifacts/lotus-model-optimization';
const html=`<!doctype html><style>body{margin:0;background:#eee}model-viewer{width:800px;height:500px}</style><script>self.ModelViewerElement={dracoDecoderLocation:'/artifacts/lotus-model-optimization/draco/',meshoptDecoderLocation:'/artifacts/lotus-model-optimization/meshopt_decoder.js'};</script><script type="module" src="/projects/lotus/vendor/model-viewer.min.js"></script><model-viewer camera-controls loading="eager" camera-orbit="35deg 75deg auto" field-of-view="30deg" shadow-intensity=".8" environment-image="neutral" exposure="1.1" interaction-prompt="none"></model-viewer>`;
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/benchmark'){res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep))throw Error('Invalid path');
  const bytes=await readFile(file);
  const type={'.js':'text/javascript','.wasm':'application/wasm','.glb':'model/gltf-binary','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type,'Content-Length':bytes.length,'Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
const report=[];
try{
 for(const name of ['emira','eletre','emeya'])for(const mode of ['original','draco','meshopt']){
  const context=await browser.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto(`${base}/benchmark`);await page.evaluate(()=>customElements.whenDefined('model-viewer'));
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  await session.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:4*1024*1024,uploadThroughput:1024*1024});
  const source=mode==='original'?`/projects/lotus/assets/models/${name}.glb`:`/${directory}/${name}-${mode}.glb`;
  const result=await page.evaluate(source=>new Promise((resolve,reject)=>{
   const viewer=document.querySelector('model-viewer'),started=performance.now();
   const timer=setTimeout(()=>reject(Error('Model load timeout')),60000);
   viewer.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Model failed: '+source));},{once:true});
   viewer.addEventListener('load',async()=>{
    await viewer.updateComplete;await viewer.updateFraming();viewer.jumpCameraToGoal();
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
    clearTimeout(timer);resolve({ms:Math.round(performance.now()-started),dimensions:viewer.getDimensions(),materials:viewer.model.materials.map(m=>m.name)});
   },{once:true});viewer.src=source;
  }),source);
  await page.waitForTimeout(350);
  await page.locator('model-viewer').screenshot({path:`${directory}/${name}-${mode}.png`});
  report.push({name,mode,...result});console.log(JSON.stringify({name,mode,ms:result.ms,materials:result.materials.length}));
  await context.close();
 }
 const page=await browser.newPage();await page.goto(`${base}/benchmark`);
 for(const name of ['emira','eletre','emeya']){
  const original=report.find(r=>r.name===name&&r.mode==='original');
  for(const entry of report.filter(r=>r.name===name&&r.mode!=='original')){
   assert.deepEqual(entry.materials,original.materials);
   for(const axis of ['x','y','z'])assert.ok(Math.abs(entry.dimensions[axis]/original.dimensions[axis]-1)<.001);
   entry.pixelDifference=await page.evaluate(async({name,mode})=>{
    const load=async suffix=>{const image=new Image();image.src='/artifacts/lotus-model-optimization/'+name+'-'+suffix+'.png';await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d');c.drawImage(image,0,0);return c.getImageData(0,0,canvas.width,canvas.height).data;};
    const a=await load('original'),b=await load(mode);let total=0,changed=0;
    for(let i=0;i<a.length;i+=4){const delta=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));total+=delta;if(delta>30)changed++;}
    return {meanChannelMaxDelta:+(total/(a.length/4)).toFixed(3),pixelsOver30Percent:+(100*changed/(a.length/4)).toFixed(3)};
   },{name,mode:entry.mode});
  }
 }
 await writeFile(`${directory}/benchmark.json`,JSON.stringify({conditions:{browser:'Microsoft Edge headless',viewport:'800x500',latencyMs:80,downloadMiBPerSecond:4,cache:'disabled; fresh browser context per model',timing:'source assignment through load, framing and two animation frames',runsPerCandidate:1},results:report},null,2)+'\n');
 console.log('Saved benchmark.json with timings, dimensions, materials and pixel comparison.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
