import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const label=process.argv[2]||'baseline';
const server=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe'],windowsHide:true});let browser;
try{
 const base=await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{const m=String(d).match(/Local: (http:\/\/localhost:\d+)/);if(m)resolve(m[1]);});server.once('error',reject);});
 browser=await chromium.launch({channel:'chrome',headless:true});const reports=[];
 for(const mode of ['normal','no-section-filter']){
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  await page.addInitScript(()=>{
   window.audit={maps:0,mapEncodeMs:0,geometryReads:0,longTasks:[]};
   const encode=HTMLCanvasElement.prototype.toDataURL;
   HTMLCanvasElement.prototype.toDataURL=function(...args){const t=performance.now(),result=encode.apply(this,args);if(this.width===512){audit.maps++;audit.mapEncodeMs+=performance.now()-t;}return result;};
   const bounds=Element.prototype.getBoundingClientRect;Element.prototype.getBoundingClientRect=function(...args){audit.geometryReads++;return bounds.apply(this,args);};
   new PerformanceObserver(list=>audit.longTasks.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  });
  const session=await page.context().newCDPSession(page);await session.send('Performance.enable');await session.send('Profiler.enable');await session.send('Profiler.start');
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  if(mode==='no-section-filter')await page.addStyleTag({content:'#root [data-name^="Section /"]{filter:none!important}'});
  const startup=await page.evaluate(()=>({...audit,time:performance.now()}));
  const metricsBefore=await session.send('Performance.getMetrics');
  const scroll=await page.evaluate(()=>new Promise(resolve=>{
   const frames=[];let start=null,previous=null;
   const animate=now=>{if(start===null)start=now;if(previous!==null)frames.push(now-previous);previous=now;
    const t=Math.min(1,(now-start)/6500),progress=t<.65?t/.65:1-(t-.65)/.35;
    window.scrollTo({top:Math.round((document.documentElement.scrollHeight-innerHeight)*progress),behavior:'instant'});
    if(t<1)requestAnimationFrame(animate);else{const sorted=[...frames].sort((a,b)=>a-b);resolve({frames:frames.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],over33:frames.filter(ms=>ms>33.4).length,over50:frames.filter(ms=>ms>50).length,max:Math.max(...frames)});}
   };requestAnimationFrame(animate);
  }));
  await page.waitForTimeout(1000);
  const metricsAfter=await session.send('Performance.getMetrics'),{profile}=await session.send('Profiler.stop');
  const counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);
  const top=profile.nodes.map(n=>({name:n.callFrame.functionName||'(anonymous)',url:n.callFrame.url,line:n.callFrame.lineNumber,samples:counts.get(n.id)||0})).filter(n=>n.samples).sort((a,b)=>b.samples-a.samples).slice(0,15);
  const delta={};for(const key of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])delta[key]=(metricsAfter.metrics.find(m=>m.name===key)?.value||0)-(metricsBefore.metrics.find(m=>m.name===key)?.value||0);
  const end=await page.evaluate(()=>audit);reports.push({mode,startup,end,scroll,delta,top});await page.close();
 }
 await writeFile(`artifacts/performance/${label}.json`,JSON.stringify(reports,null,2));console.log(JSON.stringify(reports.map(({mode,startup,end,scroll,delta,top})=>({mode,startupMaps:startup.maps,finalMaps:end.maps,geometryReads:end.geometryReads,longTasks:end.longTasks.length,longestTask:Math.max(...end.longTasks.map(t=>t.duration)),scroll,delta,top:top.slice(0,8)})),null,2));
}finally{await browser?.close();server.kill();}
