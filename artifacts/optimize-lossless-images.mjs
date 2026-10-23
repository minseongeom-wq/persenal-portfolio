import {readdir,readFile,writeFile,mkdir,stat,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const directory='lib/optimized-images';
await mkdir(directory,{recursive:true});
const ffmpeg=path.resolve('.video-tools/package/ffmpeg.exe');
function run(args){return new Promise((resolve,reject)=>{
 const child=spawn(ffmpeg,['-hide_banner','-loglevel','error',...args],{windowsHide:true});
 const chunks=[];let errors='';child.stdout.on('data',data=>chunks.push(data));child.stderr.on('data',data=>errors+=data);
 child.on('error',reject);child.on('exit',code=>code===0?resolve(Buffer.concat(chunks)):reject(Error(errors)));
});}
async function* files(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(entry.isDirectory())yield* files(file);else yield file;}}
const records=[];
for await(const source of files('projects')){
 if(!source.endsWith('.png')||(await stat(source)).size<256*1024)continue;
 const original=await readFile(source),sha256=createHash('sha256').update(original).digest('hex');
 let customColor=false;
 for(let offset=8;offset<original.length;){
  const length=original.readUInt32BE(offset),type=original.toString('ascii',offset+4,offset+8);
  if(type==='iCCP'||type==='cHRM'||(type==='gAMA'&&original.readUInt32BE(offset+8)!==45455))customColor=true;
  offset+=length+12;
 }
 if(customColor){console.log(`Keep PNG color profile: ${source}`);continue;}
 const asset=`${sha256}.webp`,output=`${directory}/${asset}`;
 await run(['-y','-i',source,'-frames:v','1','-c:v','libwebp','-lossless','1','-compression_level','6',output]);
 const bytes=(await stat(output)).size;
 // Compare decoded RGBA bytes, including alpha and RGB beneath transparent pixels.
 const before=await run(['-i',source,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1']);
 const after=await run(['-i',output,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1']);
 if(bytes>=original.length*0.95||!before.equals(after)){await rm(output);console.log(`Keep PNG: ${source}`);continue;}
 records.push({source,target:source.replace(/\.png$/,'.webp'),asset,sha256,originalBytes:original.length,bytes,pixelsIdentical:true});
 console.log(`${source}: ${Math.round(original.length/1024)} -> ${Math.round(bytes/1024)} KiB`);
}
await writeFile(`${directory}/manifest.json`,JSON.stringify(records,null,2)+'\n');
console.log(JSON.stringify({images:records.length,savedBytes:records.reduce((sum,r)=>sum+r.originalBytes-r.bytes,0)}));
