export function initContributionPin(){
 const section=document.querySelector('[data-name="Section / My Contribution"]');
 if(!section)return;
 const pairs=[...section.querySelectorAll('[data-contribution-pair]')];
 const desktop=matchMedia('(min-width:601px)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,active=0,forwardUntil=0,touchY=0,previousY=scrollY;
 const revealing=(index=active)=>!reduced.matches&&pairs[index]?.getAnimations({subtree:true}).some(animation=>
  ['running','paused'].includes(animation.playState)&&animation.effect?.target?.matches('[data-name="Contribution / Preview Image"], [data-name="Contribution / Text Block"] p'));
 const noteDirection=delta=>{forwardUntil=delta>0?performance.now()+700:0;};
 const wheel=event=>{if(!event.ctrlKey&&!event.metaKey&&Math.abs(event.deltaY)>=Math.abs(event.deltaX))noteDirection(event.deltaY);};
 const touchStart=event=>{touchY=event.touches[0]?.clientY??0;forwardUntil=0;};
 const touchMove=event=>{const y=event.touches[0]?.clientY??touchY;noteDirection(touchY-y);touchY=y;};
 const key=event=>{
  if(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(['ArrowDown','PageDown','End',' '].includes(event.key))noteDirection(event.shiftKey?-1:1);
  else if(['ArrowUp','PageUp','Home'].includes(event.key))forwardUntil=0;
 };
 function update(){
  frame=0;
  let rect=section.getBoundingClientRect();
  const scale=rect.width/section.offsetWidth;
  section.style.setProperty('--contribution-viewport',`${innerHeight/scale}px`);
  const travel=rect.height-innerHeight;
  const start=scrollY+rect.top;
  const wasPinned=previousY>=start-2&&previousY<=start+travel+2;
  // Hold each pair until its image and final line have finished revealing.
  // Only constrain forward user input; links, direct fragments and reverse scroll stay free.
  if(desktop.matches&&travel>0&&wasPinned&&rect.top<=0&&performance.now()<forwardUntil){
   const boundary=revealing()?start+travel*(active===0?.5:1)-2:
    active===0&&revealing(1)?start+travel*.5+2:Infinity;
   if(scrollY>boundary){
    window.scrollTo({top:boundary,behavior:'instant'});
    rect=section.getBoundingClientRect();
   }
  }
  active=desktop.matches&&travel>0&&-rect.top/travel>=.5?1:0;
  pairs.forEach((pair,index)=>{
   const hidden=desktop.matches&&index!==active;
   pair.hidden=hidden;pair.inert=hidden;
  });
  section.dataset.contributionPage=String(active+1);
  previousY=scrollY;
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 update();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
 desktop.addEventListener('change',schedule);
 window.addEventListener('wheel',wheel,{passive:true,capture:true});
 window.addEventListener('touchstart',touchStart,{passive:true});
 window.addEventListener('touchmove',touchMove,{passive:true});
 window.addEventListener('keydown',key,{capture:true});
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);desktop.removeEventListener('change',schedule);window.removeEventListener('wheel',wheel,true);window.removeEventListener('touchstart',touchStart);window.removeEventListener('touchmove',touchMove);window.removeEventListener('keydown',key,true);pairs.forEach(pair=>{pair.hidden=false;pair.inert=false;});};
}
