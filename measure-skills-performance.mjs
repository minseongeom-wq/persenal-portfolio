import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.addInitScript(()=>{
  window.pathMetrics={calls:0,ms:0,hovers:[]};
  const original=SVGGeometryElement.prototype.getPointAtLength;
  SVGGeometryElement.prototype.getPointAtLength=function(...args){const start=performance.now();const point=original.apply(this,args);window.pathMetrics.calls++;window.pathMetrics.ms+=performance.now()-start;return point;};
 });
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.evaluate(()=>document.fonts.ready);
 const card=page.locator('[data-name="Skill Card / 03 Workflow"]');
 await card.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(800);
 await card.evaluate(e=>{
  e.addEventListener('pointerenter',()=>{window.hoverStart=performance.now();},true);
  e.addEventListener('pointerenter',()=>{window.pathMetrics.hovers.push(performance.now()-window.hoverStart);});
 });
 const rounds=[];
 for(let i=0;i<3;i++){
  const before=await page.evaluate(()=>({...window.pathMetrics}));
  await card.hover();await page.waitForTimeout(100);
  const after=await page.evaluate(()=>({...window.pathMetrics}));
  rounds.push({calls:after.calls-before.calls,pathMs:Math.round((after.ms-before.ms)*100)/100,hoverMs:Math.round(after.hovers.at(-1)*100)/100});
  await page.mouse.move(0,0);await page.waitForTimeout(500);
 }
 console.log(JSON.stringify({rounds}));
}finally{await browser.close();}
