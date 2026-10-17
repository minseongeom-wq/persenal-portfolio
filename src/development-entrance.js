export function initDevelopmentEntrance(){
 const section=document.querySelector('[data-name="Section / FRONT-END DEVELOPMENT"]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!section||reduced.matches||!window.IntersectionObserver)return()=>{};
 const entries=[...section.querySelectorAll('p')].map(element=>({element,type:'text',delay:120}));
 for(const [id,delay] of [['948:2442',160],['948:2744',520]]){
  const element=section.querySelector(`[data-node-id="${id}"]`);
  if(element)entries.push({element,type:'image',delay});
 }
 const arrow=section.querySelector('[data-name="Icon / Arrow Down Right"]');
 if(arrow)entries.push({element:arrow,type:'arrow',delay:340});
 const byElement=new Map(entries.map(entry=>[entry.element,entry]));
 function prepare(entry){
  entry.animation?.cancel();
  const {element,type,delay}=entry;
  const count=Math.max(1,Array.from(element.textContent.trim()).length);
  const frames=type==='arrow'?[{opacity:0,translate:'-12px -12px'},{opacity:1,translate:'0 0'}]:[
   {clipPath:'inset(0 0 0 100%)'},{clipPath:'inset(0 0 0 0%)'}
  ];
  const animation=element.animate(frames,{
   duration:type==='text'?Math.min(1600,Math.max(650,count*32)):type==='image'?1200:850,
   delay,easing:type==='text'?`steps(${count}, end)`:'cubic-bezier(.25,.65,.35,1)',fill:'both'
  });
  animation.pause();entry.animation=animation;element.dataset.developmentEntrance='pending';
  animation.onfinish=()=>{animation.cancel();entry.animation=null;element.dataset.developmentEntrance='complete';};
 }
 const enter=new IntersectionObserver(changes=>{
  for(const change of changes){
   if(!change.isIntersecting)continue;
   const entry=byElement.get(change.target);
   entry.animation?.play();change.target.dataset.developmentEntrance='entering';enter.unobserve(change.target);
  }
 },{rootMargin:'0px 0px -12% 0px'});
 const visible=new Set();
 const leave=new IntersectionObserver(changes=>{
  for(const change of changes){
   if(change.isIntersecting){visible.add(change.target);continue;}
   if(!visible.delete(change.target)||reduced.matches||change.target.contains(document.activeElement))continue;
   prepare(byElement.get(change.target));enter.observe(change.target);
  }
 });
 function show(entry){entry.animation?.cancel();entry.animation=null;entry.element.dataset.developmentEntrance='complete';enter.unobserve(entry.element);}
 const focus=event=>{for(const entry of entries)if(entry.element.contains(event.target))show(entry);};
 const finish=()=>{if(reduced.matches){entries.forEach(show);enter.disconnect();leave.disconnect();}};
 for(const entry of entries){prepare(entry);enter.observe(entry.element);leave.observe(entry.element);}
 section.addEventListener('focusin',focus);reduced.addEventListener('change',finish);
 return()=>{
  entries.forEach(entry=>{show(entry);delete entry.element.dataset.developmentEntrance;});
  enter.disconnect();leave.disconnect();section.removeEventListener('focusin',focus);reduced.removeEventListener('change',finish);
 };
}
