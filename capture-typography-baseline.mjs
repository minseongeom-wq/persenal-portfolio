import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.locator('.ghost-title').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 const baseline=await page.locator('.ghost-title').evaluateAll(nodes=>nodes.map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {text:[...n.childNodes].filter(c=>c.nodeType===3||c.nodeName==='BR').map(c=>c.nodeName==='BR'?'\n':c.textContent).join('').trim(),font:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,box:{x:r.x,y:r.y,width:r.width,height:r.height}}}));
 writeFileSync('typography-baseline.json',JSON.stringify(baseline,null,2));await page.screenshot({path:'elastic-native.png',clip:{x:760,y:160,width:1040,height:500}});
 console.log(await page.locator('.ghost-title').first().evaluate(n=>{const s=getComputedStyle(n),c=document.createElement('canvas').getContext('2d');c.font=`${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;const t=[...n.childNodes].find(c=>c.nodeType===3&&c.textContent.trim());const range=document.createRange();const start=t.textContent.indexOf('E');range.setStart(t,start);range.setEnd(t,start+1);const r=range.getBoundingClientRect(),m=c.measureText('E');return {font:c.font,range:{x:r.x,y:r.y,width:r.width,height:r.height},ascent:m.fontBoundingBoxAscent,descent:m.fontBoundingBoxDescent};}));
}finally{await browser.close();}
