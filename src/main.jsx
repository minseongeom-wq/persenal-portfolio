import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import Portfolio from './Portfolio.jsx';
flushSync(()=>createRoot(document.getElementById('root')).render(<Portfolio/>));

function activate(element, action, label){element.tabIndex=0;element.setAttribute('role','button');if(label)element.setAttribute('aria-label',label);element.addEventListener('click',action);element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action()}})}
requestAnimationFrame(()=>{
 const sections=[...document.querySelectorAll('[data-name^="Section /"]')];
 const names=['home','about','work','contribution','contribution-more','skills','playground','philosophy','contact'];
 sections.forEach((s,i)=>s.id=names[i]);
 const go=id=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
 document.querySelectorAll('[data-name*="Navigation Link"],[data-name="Footer Link / Work"]').forEach(e=>activate(e,()=>go('work')));
 document.querySelectorAll('[data-name="Footer Link / About"]').forEach(e=>activate(e,()=>go('about')));
 activate(document.querySelector('[data-node-id="919:875"]'),()=>go('about'));
 document.querySelectorAll('[data-name*="Email"]').forEach(e=>activate(e,()=>location.href='mailto:minseongeom@gmail.com'));
 activate(document.querySelector('[data-node-id="919:971"]'),()=>location.href='mailto:minseongeom@gmail.com');
 const notice=document.getElementById('notice');let timer;
 function notify(text){notice.textContent=text;notice.hidden=false;clearTimeout(timer);timer=setTimeout(()=>notice.hidden=true,3500)}
 document.querySelectorAll('[data-name^="Social Link"]').forEach(e=>activate(e,()=>notify('소셜 프로필 주소를 아직 등록하지 않았습니다.')));
 const links=[...document.querySelectorAll('[data-name^="Project Link /"]')].filter(e=>/Project Link \/ \d/.test(e.dataset.name));
 links.forEach((e,i)=>{e.setAttribute('aria-pressed',String(i===0));activate(e,()=>{links.forEach(l=>{l.classList.remove('selected');l.setAttribute('aria-pressed','false')});e.classList.add('selected');e.setAttribute('aria-pressed','true');document.querySelector('[data-node-id="919:893"] p')?.replaceChildren(String(i+1).padStart(2,'0'));const counter=document.querySelector('[data-node-id="919:893"]');if(counter)counter.textContent=String(i+1).padStart(2,'0');const preview=document.querySelector('[data-node-id="919:895"]');preview.style.visibility=i===0?'visible':'hidden';document.querySelector('[data-node-id="919:896"]').classList.toggle('project-placeholder',i!==0);if(i!==0)notify('이 프로젝트의 미리보기는 원본 디자인에 등록되어 있지 않습니다.');})});
 document.querySelectorAll('[data-name^="Playground Item"]').forEach(e=>activate(e,()=>{document.getElementById('detail-title').textContent=e.querySelector('p').textContent;document.getElementById('detail').showModal()}));
});

