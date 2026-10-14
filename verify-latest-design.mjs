import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);await page.locator('.ghost-title').first().waitFor();await page.evaluate(()=>document.fonts.ready);
 if(await page.locator('[data-name="Section / My Contribution"]').count()!==1)throw Error('Duplicate contribution section');
 const development=page.locator('[data-name="Section / FRONT-END DEVELOPMENT"]');if(await development.count()!==1)throw Error('Missing development section');
 if(!await development.getByText('디자인을 코드로 연결하다.',{exact:true}).isVisible())throw Error('Missing development title');
 const image=page.locator('[data-node-id="919:895"] img');if(await image.getAttribute('src')!=='./assets/4e748.png')throw Error('Project asset not updated');
 const layout=await development.locator('img').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),loaded:n.complete&&n.naturalWidth>0,box:{x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}})));
 if(layout.some(i=>!i.loaded||i.box.width===0||i.box.height===0))throw Error('Development asset failed');
 await development.screenshot({path:'latest-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.fonts.ready);await development.screenshot({path:'latest-mobile.png'});
 const mobile=await development.locator('img').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
 if(mobile.some(i=>i.width===0||i.height===0))throw Error('Mobile asset collapsed');
 console.log(JSON.stringify({contributionSections:1,developmentSections:1,layout,mobile},null,2));
}finally{await browser.close();}
