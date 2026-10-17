export function initContributionPin(){
 const section=document.querySelector('[data-name="Section / My Contribution"]');
 if(!section)return;
 const pairs=[...section.querySelectorAll('[data-contribution-pair]')];
 const desktop=matchMedia('(min-width:601px)');
 let frame=0;
 function update(){
  frame=0;
  const rect=section.getBoundingClientRect();
  const scale=rect.width/section.offsetWidth;
  section.style.setProperty('--contribution-viewport',`${innerHeight/scale}px`);
  const travel=rect.height-innerHeight;
  const active=desktop.matches&&travel>0&&-rect.top/travel>=.5?1:0;
  pairs.forEach((pair,index)=>{
   const hidden=desktop.matches&&index!==active;
   pair.hidden=hidden;pair.inert=hidden;
  });
  section.dataset.contributionPage=String(active+1);
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 desktop.addEventListener('change',schedule);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);desktop.removeEventListener('change',schedule);pairs.forEach(pair=>{pair.hidden=false;pair.inert=false;});};
}
