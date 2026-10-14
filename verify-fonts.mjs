import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.ttf':'font/ttf','.otf':'font/otf','.svg':'image/svg+xml','.png':'image/png'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!filename.startsWith(root+path.sep))throw Error('Invalid path');const bytes=await readFile(filename);res.writeHead(200,{'Content-Type':mime[path.extname(filename)]??'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('[data-node-id="919:872"] p').waitFor();
 const faces=await page.evaluate(async()=>{for(const f of document.fonts)await f.load();await document.fonts.ready;return [...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status}));});
 const samples=[['[data-node-id="919:872"] p','PP Neue Montreal','700'],['[data-node-id="919:874"]','PP Neue Montreal Mono','500'],['[data-node-id="932:2310"]','Pretendard','500'],['[data-node-id="919:979"] span','Inter','600']];
 const cdp=await page.context().newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root:doc}=await cdp.send('DOM.getDocument');const actual=[];
 for(const [selector,family,weight] of samples){const computed=await page.locator(selector).first().evaluate(e=>({family:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight}));if(!computed.family.startsWith('"'+family+'"')&&!computed.family.startsWith(family))throw Error('Wrong family for '+selector);if(computed.weight!==weight)throw Error('Wrong weight for '+selector);const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:doc.nodeId,selector});const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});actual.push({selector,...computed,renderedFonts:fonts.map(f=>({family:f.familyName,webfont:f.isCustomFont,glyphs:f.glyphCount}))});if(!fonts.some(f=>f.isCustomFont&&f.glyphCount>0))throw Error('Webfont was not rendered for '+selector);}
 await page.screenshot({path:'preview.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'mobile-preview.png',fullPage:true});const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 console.log(JSON.stringify({faces,actual,mobile,failures},null,2));if(failures.length||faces.some(f=>f.status!=='loaded')||mobile.scrollWidth>mobile.width)throw Error('Font verification failed');
}finally{await browser.close();server.close();}
