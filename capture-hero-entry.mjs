import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:'.preview-recording',size:{width:960,height:540}}});
const page=await context.newPage();
const video=page.video();
await page.goto(pathToFileURL(process.cwd()+'/dist/index.html').href);
await page.waitForTimeout(5200);
await context.close();await video.saveAs('hero-entry-preview.webm');await browser.close();
