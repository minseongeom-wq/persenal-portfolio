import {readFileSync,writeFileSync} from 'node:fs';
import {withProjectGallery} from './project-gallery-layout.mjs';
const old=readFileSync('design-source.jsx','utf8');
const latest=readFileSync('latest-design.jsx','utf8');
const tokens=text=>[...text.matchAll(/className="([^"]+)"/g)].flatMap(m=>m[1].split(' '));
// Keep existing token IDs stable: font and responsive overrides reference them.
const classes=[...new Set([...JSON.parse(readFileSync('design-classes.json','utf8')),...tokens(latest),'relative','size-[16px]'])];
const fixed={absolute:'position:absolute',relative:'position:relative',flex:'display:flex',block:'display:block',contents:'display:contents','flex-col':'flex-direction:column','items-start':'align-items:flex-start','items-center':'align-items:center','items-end':'align-items:flex-end','justify-center':'justify-content:center','content-stretch':'align-content:stretch','shrink-0':'flex-shrink:0','flex-none':'flex:none','w-full':'width:100%','size-full':'width:100%;height:100%','min-w-full':'min-width:100%','max-w-none':'max-width:none','overflow-clip':'overflow:clip','overflow-hidden':'overflow:hidden','object-cover':'object-fit:cover','object-contain':'object-fit:contain','pointer-events-none':'pointer-events:none','not-italic':'font-style:normal','whitespace-nowrap':'white-space:nowrap','whitespace-pre':'white-space:pre','text-black':'color:#000','text-white':'color:#fff','text-right':'text-align:right','text-center':'text-align:center','leading-none':'line-height:1','mb-0':'margin-bottom:0','font-extrabold':'font-weight:800','font-bold':'font-weight:700','font-light':'font-weight:300','font-semibold':'font-weight:600','font-normal':'font-weight:400',underline:'text-decoration:underline','decoration-solid':'text-decoration-style:solid','decoration-from-font':'text-decoration-thickness:from-font','bg-top-left':'background-position:top left','h-0':'height:0','inset-0':'inset:0','top-0':'top:0','left-0':'left:0','left-1/2':'left:50%','opacity-64':'opacity:.64','opacity-74':'opacity:.74','-translate-x-1/2':'--tx:-50%','-translate-x-full':'--tx:-100%','-translate-y-1/2':'--ty:-50%','-rotate-90':'--rot:-90deg','rotate-180':'--rot:180deg','-scale-y-100':'--sy:-1'};
const props={h:'height',w:'width',size:'width',left:'left',right:'right',top:'top',leading:'line-height',tracking:'letter-spacing',gap:'gap',bg:'background-color',inset:'inset',px:'padding-inline'};
const weights={Book:400,Medium:500,Bold:700,Light:300,Extra_Bold:800,Semi_Bold:600};
const css=classes.map((c,i)=>{let style=fixed[c];if(!style){const m=c.match(/^(.+?)-\[(.*)\]$/);if(m){let [,k,v]=m;v=v.replaceAll('_',' ');if(v.startsWith('calc('))v=v.replace(/([%0-9])([+-])/g,'$1 $2 ');if(k==='font'){const font=c.match(/^font-\['([^:]+):([^']+)'\]$/);style=`font-family:'${font[1].replaceAll('_',' ')}','Pretendard',sans-serif;font-weight:${weights[font[2]]}`;}else if(k==='text')style=/^\d/.test(v)?`font-size:${v}`:`color:${v}`;else if(k==='bg-size')style=`background-size:${v}`;else if(props[k])style=`${props[k]}:${v}${k==='size'?`;height:${v}`:''}`;}else if(c.startsWith('[')&&c.endsWith(']'))style=c.slice(1,-1);}if(!style)throw Error('Unsupported design style '+c);return `.d${i}{${style}}`;}).join('\n');
const mapped=cls=>cls.split(' ').map(c=>'d'+classes.indexOf(c)).join(' ');
let code=latest.replace(/^import \{ ShaderEffect \}[^\n]+\n/m,'').replaceAll('"./lib/','"../lib/').replace(/const assetPathPrefix = "[^"]+";/,'const assetPathPrefix = "./assets";').replace('({ className }: { className?: string })','({ className })');
code=code.replace(/className="([^"]+)"/g,(_,cls)=>`className="${mapped(cls)}"`).replace('className || "relative size-[16px]"',`className || "${mapped('relative size-[16px]')}"`);
for(const [card,file] of [['924:2264','924-2264-0.png'],['924:2265','924-2265-0.png']]){
 const marker=`data-node-id="I${card};848:1502" data-name="Contribution / Preview Image">`;
 code=code.replace(marker+`\n                    <div className="${mapped('absolute inset-0 overflow-hidden')}" />`,marker+`\n                    <img alt="" className="${mapped('absolute inset-0 max-w-none object-cover pointer-events-none size-full')}" src="./assets/${file}" />`);
}
const start=code.indexOf('data-node-id="948:2744"'),end=code.indexOf('data-node-id="948:2443"',start);
const before=code.slice(start,end).replace(`<div className="${mapped('absolute inset-0 overflow-hidden')}" />`,`<img alt="" className="${mapped('absolute inset-0 max-w-none object-cover pointer-events-none size-full')}" src="./assets/frontend-before.png" />`);
code=code.slice(0,start)+before+code.slice(end);
// Keep uploaded videos when refreshing the static Figma layout.
for(const [poster,src,label,variant] of [
 ['924-2264-0.png','video-1.mp4','디자인 시스템 작업 영상','systemizing'],
 ['924-2265-0.png','sequence-04.mp4','닌텐도 인터랙션 영상','visual'],
 ['frontend-before.png','sequence-03.mp4','프론트엔드 개발 비교 영상','development'],
]){
 const image=new RegExp('<img[^>]*src="\\./assets/'+poster.replaceAll('.','\\.')+'"[^>]*/>');
 code=code.replace(image,'<LoopVideo src="./assets/'+src+'" poster="./assets/'+poster+'" label="'+label+'" variant="'+variant+'" />');
}
// Preserve the interactive navigation and the previously removed duplicate heading.
const navigationStart=code.lastIndexOf('      <div ',code.indexOf('data-node-id="933:2369"'));
const navigationEnd=code.indexOf('\n    </div>\n  );',navigationStart);
if(navigationStart<0||navigationEnd<0)throw Error('Navigation boundaries missing');
code=code.slice(0,navigationStart)+'      <Navigation />'+code.slice(navigationEnd);
const duplicateId=code.indexOf('data-node-id="924:2268"');
const duplicateStart=code.lastIndexOf('              <div ',duplicateId);
const foregroundId=code.indexOf('data-node-id="924:2269"',duplicateId);
const duplicateEnd=code.lastIndexOf('              <div ',foregroundId);
if(duplicateStart<0||duplicateEnd<duplicateStart)throw Error('Contribution heading boundaries missing');
code=code.slice(0,duplicateStart)+code.slice(duplicateEnd);
writeFileSync('src/Portfolio.jsx',"import React from 'react';\nimport Navigation from './Navigation.jsx';\nimport LoopVideo from './LoopVideo.jsx';\nimport ProjectGallery from './ProjectGallery.jsx';\nfunction ShaderEffect({shaders,children,...props}){return <div {...props} data-shader-unavailable=\"true\">{children}</div>}\n"+withProjectGallery(code));
writeFileSync('dist/design.css',css+'\n');
writeFileSync('design-source.jsx',latest);
writeFileSync('design-classes.json',JSON.stringify(classes,null,2)+'\n');
console.log('Synchronized latest Figma layout, assets, and '+classes.length+' style tokens.');
