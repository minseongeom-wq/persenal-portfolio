import React,{useEffect,useRef} from 'react';

export default function LoopVideo({src,poster,label,variant}){
 const ref=useRef(null);
 useEffect(()=>{
  const video=ref.current;
  let visible=false,disposed=false,loaded=false;
  const load=()=>{if(!loaded){loaded=true;video.src=src;video.preload='metadata';}};
  const update=()=>{
   if(visible&&!document.hidden){load();if(video.paused)video.play().catch(error=>{if(!disposed&&visible&&error.name!=='AbortError')video.controls=true;});}
   else if(!video.paused)video.pause();
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;update();},{threshold:[0,.15]});
  const preloader=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){load();preloader.disconnect();}},{rootMargin:'200px 0px'});
  preloader.observe(video);
  observer.observe(video);
  video.addEventListener('loadeddata',update);
  document.addEventListener('visibilitychange',update);
  return()=>{disposed=true;observer.disconnect();preloader.disconnect();video.removeEventListener('loadeddata',update);document.removeEventListener('visibilitychange',update);video.pause();};
 },[src]);
 return <video ref={ref} className={`portfolio-video portfolio-video--${variant}`} data-src={src} poster={poster} aria-label={label} muted loop playsInline preload="none" />;
}
