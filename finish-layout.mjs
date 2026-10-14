import {readFileSync,writeFileSync} from 'node:fs';
let source=readFileSync('src/Portfolio.jsx','utf8');
for(const [card,file] of [['924:2264','924-2264-0.png'],['946:2406','924-2264-0.png'],['924:2265','924-2265-0.png'],['946:2407','924-2265-0.png']]){
 const marker='data-node-id="I'+card+';848:1502" data-name="Contribution / Preview Image">';
 source=source.replace(marker+'\n                    <div className="d13 d63 d145" />',marker+'\n                    <img alt="" className="d13 d63 d64 d101 d102 d8" src="./assets/'+file+'" />');
}
writeFileSync('src/Portfolio.jsx',source);
let css=readFileSync('dist/style.css','utf8');
css+='\n@media(max-width:600px){#root [data-name^="Section /"] *{--rot:0deg;--sy:1}#root [data-name="Contribution / Content Row"]{flex-direction:column-reverse;gap:24px}#root [data-name="Contribution / Preview Image"]{width:100%;aspect-ratio:536/305;overflow:hidden;height:auto}#root [data-name="Contribution / Preview Image"] img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}#root [data-name="Contribution / Text Block"]{align-items:flex-start;gap:12px}#root [data-name^="Contribution Card"]{margin-bottom:48px}#root [data-name="Contribution / Heading Lockup"] p{font-size:38px;line-height:1}#root [data-node-id="924:2236"] p{font-size:38px}#root [data-node-id="919:966"]{margin:40px 0}#root [data-name="Playground / Heading Lockup"] p{font-size:40px}#root [data-name="Section / Playground"]>img{position:absolute;inset:0;z-index:-1;height:100%;width:100%;object-fit:cover}#root [data-name^="Section /"]{scroll-margin-top:20px}}\n';
writeFileSync('dist/style.css',css);
