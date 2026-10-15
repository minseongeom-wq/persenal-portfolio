import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';return document.fonts.ready;});
 for(const width of [1920,1440,1024]){
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(100);
  const setup=await page.locator('#work').evaluate(e=>{
   const rect=e.getBoundingClientRect(),scale=rect.width/e.offsetWidth;
   const start=scrollY+rect.top;
   const travel=rect.height-Math.min(innerHeight,rect.height);
   return {start,travel,scale};
  });
  const frames=[];
  for(const progress of [0,.3,.65,1]){
   await page.evaluate(y=>window.scrollTo(0,y),setup.start+setup.travel*progress);
   await page.waitForTimeout(80);
   frames.push(await page.evaluate(()=>({title:document.querySelector('[data-node-id="919:892"]').getBoundingClientRect().top,list:document.querySelector('[data-project-link="0"]').getBoundingClientRect().top,image:document.querySelector('.project-gallery__image').getBoundingClientRect().top,stage:document.querySelector('.project-stage').getBoundingClientRect().top,next:document.getElementById('contribution').getBoundingClientRect().top})));
  }
  for(const frame of frames)if(Math.abs(frame.stage)>1||Math.abs(frame.title-frames[0].title)>1||Math.abs(frame.list-frames[0].list)>1)throw Error('Project heading or list did not stay pinned: '+JSON.stringify({width,frames}));
  if(Math.abs(frames[0].image-frames[3].image-setup.travel)>2)throw Error('Gallery did not scroll through pinned stage');
  if(Math.abs(frames[3].next-900)>2)throw Error('Next section arrived before gallery finished');
  await page.screenshot({path:`project-pinned-end-${width}.png`});
  await page.evaluate(y=>window.scrollTo(0,y),setup.start+setup.travel+250);
  const release=await page.evaluate(()=>({stage:document.querySelector('.project-stage').getBoundingClientRect().top,next:document.getElementById('contribution').getBoundingClientRect().top}));
  if(Math.abs(release.stage+250)>2||Math.abs(release.next-650)>2)throw Error('Pinned section did not release: '+JSON.stringify(release));
  await page.evaluate(y=>window.scrollTo(0,y),setup.start+setup.travel*.5);
  await page.waitForTimeout(100);
  if(Math.abs(await page.locator('.project-stage').evaluate(e=>e.getBoundingClientRect().top))>1)throw Error('Reverse scrolling did not restore pin');
  await page.screenshot({path:`project-pinned-middle-${width}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#work').evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
 if(await page.locator('.project-stage').evaluate(e=>getComputedStyle(e).display)!=='contents')throw Error('Mobile scroll became trapped');
 await page.locator('#contribution').evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top));
 if(Math.abs(await page.locator('#contribution').evaluate(e=>e.getBoundingClientRect().top))>1)throw Error('Mobile cannot reach next section');
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal scroll introduced');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Pinned heading and list, scrolling gallery, release to next section, reverse scroll, 3 desktop widths and mobile verified.');
}finally{await browser.close();}
