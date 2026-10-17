// Replay on each page load; direct section links retain immediate access.
export const siteEntranceReady=new Promise(resolve=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||location.hash||document.hidden){resolve();return;}
 const curtain=document.createElement('div');
 curtain.className='site-entrance';curtain.setAttribute('aria-hidden','true');
 Object.assign(curtain.style,{
  position:'fixed',inset:'0 auto 0 0',width:'120vw',zIndex:'9999',
  background:'linear-gradient(to right, rgb(0 0 0 / .82) 0%, rgb(0 0 0 / .82) 83.333%, rgb(0 0 0 / .4) 92%, transparent 100%)',
  pointerEvents:'none',transform:'translateX(0)'
 });
 document.body.append(curtain);
 let animation,timer,failsafe;
 const finish=()=>{
  clearTimeout(timer);clearTimeout(failsafe);animation?.cancel();curtain.remove();resolve();
  reduced.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);
 };
 const motion=()=>{if(reduced.matches)finish();};
 const visibility=()=>{if(document.hidden)finish();};
 reduced.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
 failsafe=setTimeout(finish,1400);
 document.fonts.ready.then(()=>requestAnimationFrame(()=>{
  if(!curtain.isConnected)return;
  animation=curtain.animate([{transform:'translateX(0)'},{transform:'translateX(-100%)'}],{
   duration:450,easing:'cubic-bezier(.4,0,.3,1)',fill:'forwards'
  });
  timer=setTimeout(resolve,180);animation.onfinish=finish;
 }));
});
