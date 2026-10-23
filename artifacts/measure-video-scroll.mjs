import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const label=process.argv[2]||'before';
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.goto('http://127.0.0.1:5184');await page.waitForFunction(()=>document.getElementById('development'));
 const section=page.locator('#development');
 const range=await section.evaluate(e=>({start:scrollY+e.getBoundingClientRect().top,distance:e.getBoundingClientRect().height-e.querySelector('.development-stage').getBoundingClientRect().height}));
 await page.evaluate(start=>scrollTo({top:start,behavior:'instant'}),range.start);await page.waitForTimeout(2200);
 const session=await page.context().newCDPSession(page);await session.send('Performance.enable');await session.send('Emulation.setCPUThrottlingRate',{rate:4});
 const before=(await session.send('Performance.getMetrics')).metrics;
 const result=await page.evaluate(async range=>{
  const frames=[],counts=[],filtered=[];let last=performance.now();const started=last;
  while(performance.now()-started<6000){
   const now=await new Promise(requestAnimationFrame);frames.push(now-last);last=now;
   const progress=Math.min(.95,(now-started)/6000);
   scrollTo({top:range.start+range.distance*progress,behavior:'instant'});
   counts.push([...document.querySelectorAll('video')].filter(v=>!v.paused&&!v.ended).length);
   filtered.push(document.getElementById('development').style.filter!=='');
  }
  frames.sort((a,b)=>a-b);
  return {frames:frames.length,p95FrameMs:+frames[Math.floor(frames.length*.95)].toFixed(1),framesOver50ms:frames.filter(n=>n>50).length,maxPlaying:Math.max(...counts),meanPlaying:+(counts.reduce((a,b)=>a+b,0)/counts.length).toFixed(2),videoSectionFilteredFrames:filtered.filter(Boolean).length};
 },range);
 const after=(await session.send('Performance.getMetrics')).metrics;
 const metric=(list,name)=>list.find(m=>m.name===name)?.value||0;
 result.taskMs=Math.round((metric(after,'TaskDuration')-metric(before,'TaskDuration'))*1000);
 result.conditions='Edge headless, 1440x900, 4x CPU throttling, 6-second programmatic scroll; one run, local HTTP';
 await mkdir('artifacts/video-performance',{recursive:true});await writeFile(`artifacts/video-performance/${label}.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await browser.close();}
