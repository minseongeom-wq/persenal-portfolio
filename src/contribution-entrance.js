export function initContributionEntrance(){
 const cards=[...document.querySelectorAll('[data-name^="Contribution Card /"]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!cards.length||!window.IntersectionObserver)return()=>{};
 const animations=new Map();
 const observer=new IntersectionObserver(entries=>{
  // Nearby cards share a short stagger; later cards follow the reader's scroll.
  entries.filter(entry=>entry.isIntersecting)
   .sort((a,b)=>cards.indexOf(a.target)-cards.indexOf(b.target))
   .forEach((entry,index)=>{
    const animation=animations.get(entry.target);
    if(animation){animation.effect.updateTiming({delay:index*90});animation.play();}
    observer.unobserve(entry.target);
   });
 },{rootMargin:'0px 0px -7% 0px',threshold:0});
 for(const card of cards){
  const animation=card.animate([
   {opacity:0,translate:'0 28px'},
   {opacity:1,translate:'0 0'}
  ],{duration:720,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  animation.pause();
  animation.onfinish=()=>{animation.cancel();animations.delete(card);};
  animations.set(card,animation);observer.observe(card);
 }
 const show=card=>{animations.get(card)?.cancel();animations.delete(card);observer.unobserve(card);};
 const focus=event=>{const card=event.target.closest('[data-name^="Contribution Card /"]');if(card)show(card);};
 const finish=()=>{if(reduced.matches){cards.forEach(show);observer.disconnect();}};
 document.addEventListener('focusin',focus);reduced.addEventListener('change',finish);
 return()=>{
  cards.forEach(show);observer.disconnect();
  document.removeEventListener('focusin',focus);reduced.removeEventListener('change',finish);
 };
}
