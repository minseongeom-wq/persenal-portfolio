export function initContactEntrance(){
 const section=document.querySelector('[data-name="Section / Contact & Footer"]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!section||reduced.matches)return()=>{};
 const paragraphs=[...section.querySelectorAll('p')];
 const entries=paragraphs.map((paragraph,index)=>({paragraph,index,size:parseFloat(getComputedStyle(paragraph).fontSize),characters:[],original:paragraph.innerHTML,label:paragraph.getAttribute('aria-label')}))
  .sort((a,b)=>b.size-a.size||a.index-b.index);
 for(const entry of entries){
  const walker=document.createTreeWalker(entry.paragraph,NodeFilter.SHOW_TEXT),nodes=[];let node;
  while((node=walker.nextNode()))if(node.textContent.trim())nodes.push(node);
  entry.paragraph.setAttribute('aria-label',entry.paragraph.textContent.replace(/\s+/g,' ').trim());
  for(const text of nodes){
   const fragment=document.createDocumentFragment();
   for(const character of Array.from(text.textContent)){
    const span=document.createElement('span');span.textContent=character;span.setAttribute('aria-hidden','true');
    span.style.visibility='hidden';fragment.append(span);entry.characters.push(span);
   }
   text.replaceWith(fragment);
  }
 }
 const arrows=[...section.querySelectorAll('[data-name="Icon / Link Arrow"]')];
 arrows.forEach(arrow=>arrow.style.visibility='hidden');
 const divider=section.querySelector('[data-name="Divider / Footer"]');
 const dividerOriginal=divider?.getAttribute('style');
 function hideDivider(){
  if(!divider)return;
  divider.style.transition='none';
  divider.style.clipPath='inset(-2px 100% -2px 0)';
 }
 function revealDivider(){
  if(!divider)return;
  divider.style.transition=reduced.matches?'none':'clip-path 1600ms cubic-bezier(0.45, 0, 0.2, 1)';
  divider.style.clipPath='inset(-2px 0% -2px 0)';
 }
 hideDivider();
 let frame=0,start=null,finished=false,sectionVisible=false,headingVisible=false;
 const schedule=[];let time=0;
 const large=entries.filter(entry=>entry.paragraph.closest('[data-node-id="919:979"]'));
 const small=entries.filter(entry=>!large.includes(entry));
 const addCharacters=(entry,begin)=>{
  let next=begin;
  for(const span of entry.characters){schedule.push({span,time:next});next+=/\s/.test(span.textContent)?0:32;}
  return next;
 };
 let dividerTime=0;
 for(const entry of large){
  const begin=time;
  time=addCharacters(entry,time)+140;
  dividerTime=begin+(time-140-begin)*0.85;
 }
 for(const entry of small)addCharacters(entry,time);
 schedule.sort((a,b)=>a.time-b.time);
 let cursor=0;
 function reset(){
  if(reduced.matches){finish();return;}
  cancelAnimationFrame(frame);frame=0;start=null;cursor=0;finished=false;
  schedule.forEach(({span})=>span.style.visibility='hidden');
  arrows.forEach(arrow=>arrow.style.visibility='hidden');
  hideDivider();
  section.dataset.contactEntrance='pending';
 }
 function finish(){
  if(finished)return;finished=true;cancelAnimationFrame(frame);frame=0;
  schedule.forEach(({span})=>span.style.removeProperty('visibility'));
  arrows.forEach(arrow=>arrow.style.removeProperty('visibility'));
  revealDivider();
  section.dataset.contactEntrance='complete';
 }
 function animate(now){
  if(start===null)start=now;
  if(now-start>=dividerTime)revealDivider();
  while(cursor<schedule.length&&now-start>=schedule[cursor].time)schedule[cursor++].span.style.removeProperty('visibility');
  for(const arrow of arrows){const paragraph=arrow.closest('[data-name^="Footer Link /"]')?.querySelector('p');if(paragraph&&[...paragraph.querySelectorAll('span')].every(span=>span.style.visibility!=='hidden'))arrow.style.removeProperty('visibility');}
  if(cursor===schedule.length){finish();return;}
  frame=requestAnimationFrame(animate);
 }
 const heading=section.querySelector('[data-node-id="919:979"]')||section;
 const observer=new IntersectionObserver(changes=>{
  for(const change of changes){
   if(change.target===section)sectionVisible=change.isIntersecting;
   if(change.target===heading)headingVisible=change.isIntersecting;
  }
  // Rearm only after leaving the section, not when its heading scrolls away.
  if(!sectionVisible){reset();return;}
  if(headingVisible&&!reduced.matches&&!finished&&!frame){section.dataset.contactEntrance='typing';frame=requestAnimationFrame(animate);}
 },{rootMargin:'0px 0px -12% 0px',threshold:0});
 section.dataset.contactEntrance='pending';
 observer.observe(section);
 if(heading!==section)observer.observe(heading);
 const motionChange=()=>{if(reduced.matches)finish();};
 reduced.addEventListener('change',motionChange);section.addEventListener('focusin',finish);
 return()=>{
  finish();observer.disconnect();reduced.removeEventListener('change',motionChange);section.removeEventListener('focusin',finish);
  for(const entry of entries){entry.paragraph.innerHTML=entry.original;if(entry.label===null)entry.paragraph.removeAttribute('aria-label');else entry.paragraph.setAttribute('aria-label',entry.label);}
  delete section.dataset.contactEntrance;
  if(divider){if(dividerOriginal===null)divider.removeAttribute('style');else divider.setAttribute('style',dividerOriginal);}
 };
}
