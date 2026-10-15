import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';return document.fonts.ready;});
 for(const width of [2560,1920,1440,1024,768,600,390]){
  await page.setViewportSize({width,height:900});
  for(const id of ['home','work','contribution','development','skills','philosophy','contact']){
   await page.locator('#'+id).evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
   await page.mouse.move(Math.min(width-5,1700),400);
   await page.mouse.move(width-15,420);
   await page.waitForTimeout(60);
   const state=await page.evaluate(()=>{window.scrollBy(80,0);return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,x:scrollX,y:scrollY};});
   if(state.scrollWidth>state.width||state.x!==0)throw Error('Horizontal overflow: '+id+' '+JSON.stringify(state));
   if(id==='contact'&&state.y===0)throw Error('Vertical scrolling was blocked');
  }
  if(width>600){
   await page.locator('.portfolio-navigation__logo').hover();
   await page.waitForTimeout(450);
   if(await page.locator('.portfolio-navigation').getAttribute('data-open')!=='true')throw Error('Navigation hover broken');
  }
 }
 console.log('No horizontal scrolling across 7 viewport widths and 7 sections; vertical scrolling and navigation hover preserved.');
}finally{await browser.close();}
