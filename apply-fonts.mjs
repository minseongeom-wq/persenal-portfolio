import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('design-source.jsx','utf8');
const classes=[...new Set([...source.matchAll(/className="([^"]+)"/g)].flatMap(m=>m[1].split(' ')))];
const faces=[
 ['PP Neue Montreal','ppneuemontreal-book.otf','opentype','400'],
 ['PP Neue Montreal','ppneuemontreal-medium.otf','opentype','500'],
 ['PP Neue Montreal','ppneuemontreal-bold.otf','opentype','700'],
 ['PP Neue Montreal Mono','pp-neue-montreal-mono-3.ttf','truetype','500'],
 ['Pretendard','PretendardVariable.ttf','truetype','100 900'],
 ['Inter','InterVariable.ttf','truetype','100 900'],
];
let css=faces.map(([family,file,format,weight])=>`@font-face{font-family:'${family}';src:url('./fonts/${file}') format('${format}');font-weight:${weight};font-style:normal;font-display:swap}`).join('\n')+'\n';
const weights={Book:400,Medium:500,Bold:700,Light:300,Extra_Bold:800,Semi_Bold:600};
classes.forEach((token,i)=>{
 const m=token.match(/^font-\['([^:]+):([^']+)'\]$/);if(!m)return;
 const family=m[1].replaceAll('_',' '),weight=weights[m[2]];
 if(!weight)throw Error('Unknown font weight: '+token);
 css+=`.d${i}{font-family:'${family}',${family.includes('Mono')?'monospace':"'Pretendard',sans-serif"};font-weight:${weight}}\n`;
});
writeFileSync('dist/fonts.css',css);
const htmlPath='dist/index.html';let html=readFileSync(htmlPath,'utf8');
if(!html.includes('./fonts.css'))html=html.replace('<link rel="stylesheet" href="./style.css">','<link rel="stylesheet" href="./fonts.css"><link rel="stylesheet" href="./style.css">');
writeFileSync(htmlPath,html);
const stylePath='dist/style.css';let style=readFileSync(stylePath,'utf8');
style=style.replace("font-family:Arial,'Malgun Gothic',sans-serif","font-family:'PP Neue Montreal','Pretendard',sans-serif");
writeFileSync(stylePath,style);
console.log('Applied '+faces.length+' font faces using Figma font classes.');
