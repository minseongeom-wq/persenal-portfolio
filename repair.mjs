import {readFileSync,writeFileSync} from 'node:fs';
let source=readFileSync('src/main.jsx','utf8');
source=source.replace(/notify\('[^']*'\)/g,(match,offset)=>source.slice(0,offset).includes('if(i!==0)')?"notify('이 프로젝트의 미리보기는 원본 디자인에 등록되어 있지 않습니다.')":"notify('소셜 프로필 주소를 아직 등록하지 않았습니다.')");
writeFileSync('src/main.jsx',source);
let css=readFileSync('dist/style.css','utf8');
css+='\ndialog button{position:relative;z-index:2}dialog form{min-height:40px}\n';
writeFileSync('dist/style.css',css);
