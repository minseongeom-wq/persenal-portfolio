// Keep native document scrolling so sticky elements and scroll effects stay in sync.
export function initSmoothScroll(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,target=window.scrollY,lastTime=0,position=window.scrollY;
 const stop=()=>{cancelAnimationFrame(frame);frame=0;target=position=window.scrollY;};
 const maximum=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const clamp=value=>Math.max(0,Math.min(maximum(),value));
 function animate(now){
  if(Math.abs(window.scrollY-position)>2){stop();return;}
  target=clamp(target);
  const dt=Math.min(64,Math.max(1,now-lastTime));lastTime=now;
  position=window.scrollY+(target-window.scrollY)*(1-Math.exp(-dt/110));
  const finished=Math.abs(target-position)<.75;
  window.scrollTo({top:finished?target:position,behavior:'instant'});
  position=window.scrollY;
  if(finished){frame=0;return;}
  frame=requestAnimationFrame(animate);
 }
 function wheel(event){
  if(reduced.matches||event.defaultPrevented||!event.cancelable||event.ctrlKey||event.metaKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
  // Let dialogs, form fields, and nested scroll containers keep their native input.
  for(const node of event.composedPath()){
   if(!(node instanceof Element))continue;
   if(node===document.body||node===document.documentElement)break;
   if(node.matches('dialog,input,textarea,select,[contenteditable]:not([contenteditable="false"])')){stop();return;}
   if(node.scrollHeight>node.clientHeight+1&&/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)){stop();return;}
  }
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  const next=clamp((frame?target:window.scrollY)+delta);
  if(!frame&&next===window.scrollY)return;
  event.preventDefault();target=next;
  if(!frame){position=window.scrollY;lastTime=performance.now();frame=requestAnimationFrame(animate);}
 }
 const key=event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))stop();};
 window.addEventListener('wheel',wheel,{passive:false});
 window.addEventListener('pointerdown',stop,{passive:true});
 window.addEventListener('touchstart',stop,{passive:true});
 window.addEventListener('keydown',key);
 window.addEventListener('resize',stop);
 window.addEventListener('blur',stop);
 reduced.addEventListener('change',stop);
 return()=>{
  stop();window.removeEventListener('wheel',wheel);window.removeEventListener('pointerdown',stop);
  window.removeEventListener('touchstart',stop);window.removeEventListener('keydown',key);
  window.removeEventListener('resize',stop);window.removeEventListener('blur',stop);reduced.removeEventListener('change',stop);
 };
}
