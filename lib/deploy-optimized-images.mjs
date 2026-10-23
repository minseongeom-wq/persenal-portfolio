import {readFile,writeFile,readdir,copyFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Originals remain in projects/. Only verified deployment copies are replaced.
export async function deployOptimizedImages(root,output){
 const records=JSON.parse(await readFile(path.join(root,'lib/optimized-images/manifest.json'),'utf8'));
 const replacements=new Map();
 for(const record of records){
  const original=await readFile(path.join(root,record.source));
  if(createHash('sha256').update(original).digest('hex')!==record.sha256){
   throw Error(`Optimized image is outdated: ${record.source}. Regenerate the lossless images.`);
  }
  const name=path.basename(record.source),replacement=path.basename(record.target);
  if(replacements.has(name)&&replacements.get(name)!==replacement)throw Error(`Ambiguous image name: ${name}`);
  replacements.set(name,replacement);
  await copyFile(path.join(root,'lib/optimized-images',record.asset),path.join(output,record.target));
  await rm(path.join(output,record.source),{force:true});
 }
 async function rewrite(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   const file=path.join(dir,entry.name);
   if(entry.isDirectory()){await rewrite(file);continue;}
   if(!/\.(html|css|js|json|svg)$/.test(entry.name))continue;
   const before=await readFile(file,'utf8');let after=before;
   for(const [name,replacement] of replacements)after=after.replaceAll(name,replacement);
   if(after!==before)await writeFile(file,after);
  }
 }
 await rewrite(output);
 console.log(`Lossless images: ${records.length} deployed, ${(records.reduce((sum,r)=>sum+r.originalBytes-r.bytes,0)/1048576).toFixed(2)} MiB saved`);
}
