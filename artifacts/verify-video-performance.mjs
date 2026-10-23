import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
const rows=JSON.parse(await readFile('artifacts/video-performance/compression.json','utf8'));
const results=[];
for(const row of rows){
 const original=await readFile(row.backup),compressed=await readFile(row.file);
 assert.equal(createHash('sha256').update(original).digest('hex'),row.sha256);
 assert.equal(compressed.length,row.bytes);
 const boxes=[];
 for(let offset=0;offset+8<=compressed.length;){const size=compressed.readUInt32BE(offset),type=compressed.toString('ascii',offset+4,offset+8);boxes.push(type);if(size<8)break;offset+=size;}
 assert.ok(boxes.indexOf('moov')>=0&&boxes.indexOf('moov')<boxes.indexOf('mdat'),'Faststart metadata must precede video data');
 const probe=file=>{const result=spawnSync('.video-tools/package/ffmpeg.exe',['-hide_banner','-i',file],{encoding:'utf8',windowsHide:true});if(result.error)throw result.error;const match=result.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);return {seconds:Number(match[1])*3600+Number(match[2])*60+Number(match[3]),description:result.stderr.split('\n').find(line=>line.includes('Video:'))?.trim()};};
 const before=probe(row.backup),after=probe(row.file);
 assert.ok(Math.abs(before.seconds-after.seconds)<.1,'Full duration must be preserved');
 results.push({file:row.file,originalBackupHashVerified:true,faststart:true,before,after});
}
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:5184/projects/men-i-trust/index.html');
  await page.waitForFunction(()=>{const v=document.querySelector('#home video');return v?.readyState>=2&&!v.paused&&v.currentTime>0;});
  const video=await page.locator('#home video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,muted:v.muted,loop:v.loop}));
  assert.equal(video.width,1280);assert.equal(video.height,720);assert.ok(video.duration>198&&video.muted&&video.loop);
  console.log(`${width}px Men I Trust compressed hero autoplay passed`);
 }
 const after=JSON.parse(await readFile('artifacts/video-performance/after.json','utf8'));
 assert.equal(after.maxPlaying,1);assert.equal(after.videoSectionFilteredFrames,0);
 await writeFile('artifacts/video-performance/verification.json',JSON.stringify(results,null,2)+'\n');
 console.log('Backups, duration, faststart, hero playback, single active video and filter bypass verified');
}finally{await browser.close();}
