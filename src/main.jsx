import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import Portfolio from './Portfolio.jsx';
import {useElasticTypography} from './use-elastic-typography.js';
import {initScrollTitles} from './scroll-titles.js';
import {initComponentDesigns} from './component-designs.js';
import {initSmoothScroll} from './smooth-scroll.js';
import {initScrollCurl} from './scroll-curl.js';
import {initContactEntrance} from './contact-entrance.js';
function App(){useElasticTypography();return <Portfolio/>;}
flushSync(()=>createRoot(document.getElementById('root')).render(<App/>));

function activate(element, action, label){if(!element)return;element.tabIndex=0;element.setAttribute('role','button');if(label)element.setAttribute('aria-label',label);element.addEventListener('click',action);element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action()}})}
requestAnimationFrame(()=>{
 initSmoothScroll();
 initScrollCurl();
 initContactEntrance();
 initScrollTitles();
 initComponentDesigns();
 const sections=[...document.querySelectorAll('[data-name^="Section /"]')];
 const names=['home','about','work','contribution','development','skills','playground','philosophy','contact'];
 sections.forEach((s,i)=>s.id=names[i]);
 const go=id=>document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 // Section IDs are assigned after React mounts, so restore direct fragment links now.
 const restoreFragment=()=>{
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  if(names.includes(id))document.getElementById(id)?.scrollIntoView({behavior:'instant'});
 };
 if(location.hash)document.fonts.ready.then(()=>requestAnimationFrame(restoreFragment));
 document.querySelectorAll('[data-name*="Navigation Link"],[data-name="Footer Link / Work"]').forEach(e=>activate(e,()=>go('work')));
 document.querySelectorAll('[data-name="Footer Link / About"]').forEach(e=>activate(e,()=>go('about')));
 activate(document.querySelector('[data-node-id="919:875"]'),()=>go('about'));
 document.querySelectorAll('[data-name*="Email"]').forEach(e=>activate(e,()=>location.href='mailto:minseongeom@gmail.com'));
 activate(document.querySelector('[data-node-id="919:971"]'),()=>location.href='mailto:minseongeom@gmail.com');
 const notice=document.getElementById('notice');let timer;
 function notify(text){notice.textContent=text;notice.hidden=false;clearTimeout(timer);timer=setTimeout(()=>notice.hidden=true,3500)}
 document.querySelectorAll('[data-name^="Social Link"]').forEach(e=>activate(e,()=>notify('소셜 프로필 주소를 아직 등록하지 않았습니다.')));
 const links=[...document.querySelectorAll('[data-name^="Project Link /"]')].filter(e=>/Project Link \/ \d/.test(e.dataset.name));
 links.forEach((link,index)=>{
  link.dataset.projectLink=String(index);
  link.setAttribute('aria-pressed',String(index===0));
  activate(link,()=>{
   links.forEach(item=>{item.classList.remove('selected');item.setAttribute('aria-pressed','false');});
   link.classList.add('selected');link.setAttribute('aria-pressed','true');
   const counter=document.querySelector('[data-node-id="919:893"]');
   if(counter)counter.textContent=String(index+1).padStart(2,'0');
   const preview=document.querySelector(`[data-project-index="${index}"]`);
   if(preview)preview.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
   else notify('프로젝트 미리보기를 준비 중입니다.');
  });
 });
 document.querySelectorAll('[data-name^="Playground Item"]').forEach(e=>activate(e,()=>{document.getElementById('detail-title').textContent=e.querySelector('p').textContent;document.getElementById('detail').showModal()}));
});

