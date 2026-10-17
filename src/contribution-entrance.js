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
    const group=animations.get(entry.target);
    if(group)for(const animation of group){
     animation.effect.updateTiming({delay:animation.effect.getTiming().delay+index*160});animation.play();
    }
    observer.unobserve(entry.target);
   });
 },{rootMargin:'0px 0px -14% 0px',threshold:0});
 const visible=new Set();
 const leaveObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting){visible.add(entry.target);continue;}
   if(!visible.delete(entry.target)||reduced.matches)continue;
   // Rearm after the entire card leaves the viewport, avoiding boundary flicker.
   if(entry.target.contains(document.activeElement))continue;
   show(entry.target);prepare(entry.target);observer.observe(entry.target);
  }
 },{threshold:0});
 function prepare(card){
  const group=[];
  const preview=card.querySelector('[data-name="Contribution / Preview Image"]');
  if(preview){
   // Reveal smoothly in the same direction as the text, keeping the image still.
   const scan=preview.animate([
    {clipPath:'inset(0 0 0 100%)'},
    {clipPath:'inset(0 0 0 0%)'}
   ],{duration:1200,delay:220,easing:'cubic-bezier(.25,.65,.35,1)',fill:'both'});
   scan.pause();group.push(scan);
  }
  for(const [index,paragraph] of [...card.querySelectorAll('[data-name="Contribution / Text Block"] p')].entries()){
   const count=Array.from(paragraph.textContent.trim()).length;
   if(!count)continue;
   // Reveal existing text from its right edge without changing wrapping or reading order.
   const typing=paragraph.animate([
    {clipPath:'inset(0 0 0 100%)'},
    {clipPath:'inset(0 0 0 0%)'}
   ],{duration:Math.min(1600,Math.max(650,count*32)),delay:220+index*160,
    easing:`steps(${count}, end)`,fill:'both'});
   typing.pause();group.push(typing);
  }
  for(const item of group)item.onfinish=()=>{
   item.cancel();
   if(group.every(animation=>animation.playState==='idle'))animations.delete(card);
  };
  animations.set(card,group);
 }
 const show=card=>{animations.get(card)?.forEach(animation=>animation.cancel());animations.delete(card);observer.unobserve(card);};
 const focus=event=>{const card=event.target.closest('[data-name^="Contribution Card /"]');if(card)show(card);};
 const finish=()=>{if(reduced.matches){cards.forEach(show);observer.disconnect();leaveObserver.disconnect();}};
 for(const card of cards){prepare(card);observer.observe(card);leaveObserver.observe(card);}
 document.addEventListener('focusin',focus);reduced.addEventListener('change',finish);
 return()=>{
  cards.forEach(show);observer.disconnect();leaveObserver.disconnect();
  document.removeEventListener('focusin',focus);reduced.removeEventListener('change',finish);
 };
}
