import {readFileSync} from 'node:fs';
const b=readFileSync(process.argv[2]);const tables={};
for(let i=0;i<b.readUInt16BE(4);i++){const p=12+i*16;tables[b.toString('ascii',p,p+4)]={offset:b.readUInt32BE(p+8),length:b.readUInt32BE(p+12)}}
const n=tables.name.offset,strings=n+b.readUInt16BE(n+4);const names=[];
for(let i=0;i<b.readUInt16BE(n+2);i++){const p=n+6+i*12,id=b.readUInt16BE(p+6);if(![1,2,4,6,16,17].includes(id))continue;const raw=Buffer.from(b.subarray(strings+b.readUInt16BE(p+10),strings+b.readUInt16BE(p+10)+b.readUInt16BE(p+8)));const value=b.readUInt16BE(p)===3||b.readUInt16BE(p)===0?raw.swap16().toString('utf16le'):raw.toString('latin1');names.push({id,value});}
console.log(JSON.stringify({names:[...new Map(names.map(x=>[x.id+':'+x.value,x])).values()],weight:tables['OS/2']?b.readUInt16BE(tables['OS/2'].offset+4):null,variable:!!tables.fvar},null,2));
