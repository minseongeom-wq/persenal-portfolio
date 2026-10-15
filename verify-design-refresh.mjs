import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const effects=JSON.parse(await readFile('design-effects-baseline.json','utf8'));
for(const [file,hash] of Object.entries(effects))if(createHash('sha256').update(await readFile(file)).digest('hex')!==hash)throw Error('Interaction implementation changed: '+file);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('.elastic-title canvas').first().waitFor();
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
 const root=page.locator('[data-node-id="919:867"]');
 const rootStyle=await root.evaluate(e=>{const s=getComputedStyle(e);return {padding:s.paddingLeft,background:s.backgroundImage,size:s.backgroundSize};});
 if(rootStyle.padding!=='115px'||!rootStyle.background.includes('e9016.png')||rootStyle.size!=='1920px 1075px')throw Error('Root design mismatch: '+JSON.stringify(rootStyle));
 if((await page.locator('[data-node-id="919:872"] p').textContent()).replace(/\s/g,'')!=='EomMinseong')throw Error('Hero title not updated');
 if(await page.locator('[data-node-id="924:2268"]').count())throw Error('Duplicate contribution title restored');
 const expected={'919:886':{x:115,width:800},'919:895':{x:722,width:1083,height:564},'924:2237':{x:637,width:500,height:500},'924:2249':{x:1159,width:500,height:500}};
 for(const [id,values] of Object.entries(expected)){
  const box=await page.locator(`[data-node-id="${id}"]`).boundingBox();
  for(const [key,value] of Object.entries(values))if(Math.abs(box[key]-value)>1)throw Error('Geometry mismatch: '+id+' '+key+' '+box[key]);
 }
 if(await page.locator('[data-name^="Project Link /"][aria-pressed=true] p').evaluate(e=>getComputedStyle(e).color)!=='rgb(255, 255, 255)')throw Error('Active project text should be white');
 const images=await page.locator('#root img,.portfolio-navigation img').evaluateAll(nodes=>nodes.map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0,visible:getComputedStyle(e).visibility==='visible',width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
 for(const image of images){if(!image.loaded||!image.src.startsWith('./assets/')||!(await stat('dist/'+image.src.slice(2))).size)throw Error('Asset missing: '+image.src);if(image.visible&&(!image.width||!image.height))throw Error('Visible asset collapsed: '+image.src);}
 for(const id of ['home','about','work','contribution','development','skills','playground','philosophy','contact']){
  await page.locator('#'+id).evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
  await page.waitForTimeout(100);
  await page.screenshot({path:`design-refresh-${id}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 for(const id of ['home','work','contribution','development','skills']){
  await page.locator('#'+id).evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
  await page.screenshot({path:`design-refresh-mobile-${id}.png`});
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({rootStyle,assets:images.length,effectSourcesUnchanged:true,geometry:true,desktopAndMobileScreenshots:true}));
}finally{await browser.close();}
