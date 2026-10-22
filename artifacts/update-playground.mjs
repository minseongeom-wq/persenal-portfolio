import {readFile,writeFile} from 'node:fs/promises';
const file='src/Portfolio.jsx';let text=await readFile(file,'utf8');
const updates={'919:1340':['Zippy','Concept Soda Promo · 30s','Art Direction, Design','Oct. 2026'],'919:1349':['Lotus Emeya — Beyond the Quiet','Concept Commercial · 35s','Art Direction, AI Video, Editing','Oct. 2026']};
for(const [id,values] of Object.entries(updates)){for(let i=0;i<4;i++){const re=new RegExp('(data-node-id="I'+id+';919:'+(1086+i)+'">\\s*)[^<]+?(\\s*</p>)');if(!re.test(text))throw Error(id);text=text.replace(re,(_,a,b)=>a+values[i]+b);}}
await writeFile(file,text);
