import {mkdir,copyFile,readFile,writeFile,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const directory='artifacts/video-performance';await mkdir(directory,{recursive:true});
const jobs=[
 {file:'dist/assets/game-discovery-development.mp4',width:1280,crf:23},
 {file:'dist/assets/splatoon-development.mp4',width:1280,crf:23},
 {file:'projects/men-i-trust/assets/videos/hero-edited.mp4',width:1280,crf:25},
];
const report=[];
for(const job of jobs){
 const original=await readFile(job.file),sha256=createHash('sha256').update(original).digest('hex');
 const backup=`.video-tools/performance-originals/${sha256}/${path.basename(job.file)}`;
 await mkdir(path.dirname(backup),{recursive:true});
 try{await copyFile(job.file,backup,1);}catch(error){if(error.code!=='EEXIST')throw error;}
 const output=`${directory}/${path.basename(job.file)}`;
 const started=Date.now();
 await new Promise((resolve,reject)=>{
  const child=spawn(path.resolve('.video-tools/package/ffmpeg.exe'),['-hide_banner','-loglevel','error','-y','-i',job.file,'-map','0:v:0','-map','0:a?','-vf',`scale='min(${job.width},iw)':-2`,'-c:v','libx264','-preset','medium','-crf',String(job.crf),'-threads','2','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',output],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  let errors='';child.stderr.on('data',d=>errors+=d);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(errors)));
 });
 const after=(await stat(output)).size;
 if(after>=original.length)throw Error('Candidate not smaller: '+job.file);
 const result={...job,originalBytes:original.length,bytes:after,savedPercent:+((1-after/original.length)*100).toFixed(1),sha256,backup,output,encodeSeconds:Math.round((Date.now()-started)/1000)};
 report.push(result);console.log(JSON.stringify(result));
 await writeFile(`${directory}/compression.json`,JSON.stringify(report,null,2)+'\n');
}
