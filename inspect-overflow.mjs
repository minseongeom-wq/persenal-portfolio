import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>document.fonts.ready);
 for(const width of [1920,1440,1024,768,600,390]){
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(100);
  console.log(JSON.stringify(await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,overflow:[...document.querySelectorAll('body *')].map(e=>({node:e.dataset.nodeId||e.dataset.name||e.className,rect:e.getBoundingClientRect(),visible:getComputedStyle(e).visibility})).filter(e=>e.visible==='visible'&&(e.rect.right>innerWidth+1||e.rect.left< -1)).slice(0,12).map(e=>({node:e.node,left:e.rect.left,right:e.rect.right}))}))));
 }
}finally{await browser.close();}
