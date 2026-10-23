import {readFile} from 'node:fs/promises';
const records=JSON.parse(await readFile('lib/optimized-images/manifest.json','utf8'));
for(const record of records){
 const buffer=await readFile(record.source),chunks=[];
 for(let offset=8;offset<buffer.length;){
  const length=buffer.readUInt32BE(offset),type=buffer.toString('ascii',offset+4,offset+8);
  if(['iCCP','sRGB','gAMA','cHRM'].includes(type))chunks.push({type,value:buffer.subarray(offset+8,offset+8+length).toString('hex').slice(0,80)});
  offset+=length+12;
 }
 if(chunks.length)console.log(record.source,JSON.stringify(chunks));
}
