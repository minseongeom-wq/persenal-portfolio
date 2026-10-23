import React,{useEffect,useRef} from 'react';

export default function LoopVideo({src,poster,label,variant}){
 const ref=useRef(null);
 useEffect(()=>{
  const video=ref.current;
  let visible=false,disposed=false,loaded=false,playPending=false;
  const layer=video.closest('[data-development-pair]');
  const canPlay=()=>visible&&!document.hidden&&(!layer||(!layer.hidden&&!layer.inert));
  const load=()=>{if(!loaded){loaded=true;video.src=src;video.preload='metadata';}};
  const update=()=>{
   if(canPlay()){
    load();
    if(video.paused&&!playPending){playPending=true;video.play().catch(error=>{if(!disposed&&canPlay()&&error.name!=='AbortError')video.controls=true;}).finally(()=>{playPending=false;if(disposed||!canPlay())video.pause();});}
   }
   else if(!video.paused)video.pause();
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;update();},{threshold:[0,.15]});
  const preloader=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){load();preloader.disconnect();}},{rootMargin:'200px 0px'});
  preloader.observe(video);
  observer.observe(video);
  const stateObserver=new MutationObserver(update);
  if(layer)stateObserver.observe(layer,{attributes:true,attributeFilter:['hidden','inert']});
  video.addEventListener('loadeddata',update);
  document.addEventListener('visibilitychange',update);
  return()=>{disposed=true;observer.disconnect();preloader.disconnect();stateObserver.disconnect();video.removeEventListener('loadeddata',update);document.removeEventListener('visibilitychange',update);video.pause();};
 },[src]);
 return <video ref={ref} className={`portfolio-video portfolio-video--${variant}`} data-src={src} poster={poster} aria-label={label} muted loop playsInline preload="none" />;
}
