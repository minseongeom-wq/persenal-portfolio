export function initDevelopmentScroll(){
 const section=document.querySelector('[data-name="Section / FRONT-END DEVELOPMENT"]');
 const stage=section?.querySelector('.development-stage');
 if(!stage)return()=>{};
 const layers=[...section.querySelectorAll('[data-development-pair]')];
 const lastPair=Math.max(...layers.map(layer=>Number(layer.dataset.developmentPair)));
 section.style.setProperty('--development-transitions',String(lastPair));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,previousTime=0,blend=0;
 const measure=()=>{
  const scale=section.getBoundingClientRect().width/section.offsetWidth;
  section.style.setProperty('--development-viewport',`${innerHeight/scale}px`);
  const top=stage.getBoundingClientRect().top;
  const contentBottom=Math.max(...[...stage.children].map(child=>child.getBoundingClientRect().bottom-top))/scale;
  section.style.setProperty('--development-content-height',`${Math.ceil(contentBottom+64)}px`);
  section.style.setProperty('--development-stage-height',`${stage.offsetHeight}px`);
 };
 const update=now=>{
  frame=0;
  const bounds=section.getBoundingClientRect();
  const scale=bounds.width/section.offsetWidth;
  const distance=bounds.height-stage.offsetHeight*scale;
  const progress=distance>0?Math.max(0,Math.min(1,-bounds.top/distance)):0;
  const position=progress*lastPair;
  const segment=Math.floor(position);
  const linear=Math.max(0,Math.min(1,(position-segment-.25)/.5));
  const target=reduced.matches?Math.round(position):segment+linear*linear*(3-2*linear);
  const dt=Math.min(64,Math.max(1,now-previousTime));previousTime=now;
  blend=reduced.matches||Math.abs(target-blend)<.002?target:blend+(target-blend)*(1-Math.exp(-dt/100));
  layers.forEach(layer=>{
   const index=Number(layer.dataset.developmentPair);
   const opacity=Math.max(0,1-Math.abs(blend-index));
   const hidden=opacity<.001;
   if(layer.hidden!==hidden)layer.hidden=hidden;
   layer.style.opacity=String(opacity);
   const inert=index!==Math.round(blend);
   if(layer.inert!==inert)layer.inert=inert;
   layer.setAttribute('aria-hidden',String(layer.inert));
  });
  section.dataset.developmentPair=String(Math.round(blend));
  if(blend!==target)frame=requestAnimationFrame(update);
 };
 const schedule=()=>{if(!frame){previousTime=performance.now();frame=requestAnimationFrame(update);}};
 const resize=()=>{measure();schedule();};
 const observer=new ResizeObserver(resize);observer.observe(stage);
 for(const child of stage.children)observer.observe(child);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',resize);reduced.addEventListener('change',schedule);
 resize();
 return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);reduced.removeEventListener('change',schedule);};
}
