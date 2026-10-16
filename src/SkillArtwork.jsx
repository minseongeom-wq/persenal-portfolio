import React,{useEffect,useRef} from 'react';

// Native Figma SVGs in the visible card coordinates (the export reflects its parent).
const artwork={
 design:[['1a67b',361,380],['947d9',235,407],['c81dc',428,308],['9c9aa',455,227],['aaff1',443,144],['40c2f',409,79],['0c996',367,40],['d9887',334,17]],
 workflow:[['d4117',31,67.29],['54d7a',64,65],['6e70d',387,161],['89e4d',456,316]],
 frontend:[['a9094',324,0,90],['b4b7c',207,181],['5b307',471,0,90]],
 ai:[['52752',399,20],['ab0f7',317,-11],['46b0a',250,-85],['111bc',419,137],['8ab84',382,328],['f6d75',382,249],['20088',456,271],['8d706',335,200]],
};
const dotOrder=['d9887','0c996','40c2f','aaff1','9c9aa','c81dc','1a67b','947d9'];
// The three exported orbit circles have slightly different centers. Preserve each one.
const orbits={
 '8ab84':[466,131,23,1],
 f6d75:[459,131,10,-1],
 '20088':[459,131,16,1],
 '8d706':[459,131,6,-1],
};
const workflowPath='M0.0334707 1.70742C149.354 -3.29324 429.854 11.0071 429.854 288.207';
const motionRate=variant=>['design','workflow'].includes(variant)?1.15:1;
let workflowFrames=null;
function getWorkflowFrames(){
 if(workflowFrames)return workflowFrames;
 // Sample the exact exported cubic in JS once. DOM path queries flatten the
 // curve on every call and previously blocked every pointer entry for ~310ms.
 const points=[];let length=0;
 for(let i=0;i<=512;i++){
  const t=i/512,u=1-t;
  const x=u*u*u*.0334707+3*u*u*t*149.354+3*u*t*t*429.854+t*t*t*429.854;
  const y=u*u*u*1.70742-3*u*u*t*3.29324+3*u*t*t*11.0071+t*t*t*288.207;
  if(i)length+=Math.hypot(x-points[i-1].x,y-points[i-1].y);
  points.push({x,y,length});
 }
 function pointAt(distance){
  let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].length<distance)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],t=(distance-a.length)/(b.length-a.length);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
 }
 workflowFrames=artwork.workflow.slice(1).map(([asset,x,y])=>{
  const radius=asset==='6e70d'?6.5:3.5;
  let end=points[0],distance=Infinity;
  for(const point of points){const d=(point.x+31-x-radius)**2+(point.y+67.29-y-radius)**2;if(d<distance){distance=d;end=point;}}
  return Array.from({length:81},(_,i)=>{
   const progress=i/80,point=pointAt(end.length*progress);
   return {transform:`translate(${point.x+31-x-radius+(x+radius-end.x-31)*progress}px,${point.y+67.29-y-radius+(y+radius-end.y-67.29)*progress}px)`,opacity:Math.min(1,progress*8)};
  });
 });
 return workflowFrames;
}

function useSkillMotion(ref,variant){
 useEffect(()=>{
  const root=ref.current,card=root.closest('[data-name^="Skill Card /"]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),touch=matchMedia('(hover: none), (pointer: coarse)');
  let active=false,resetTimer=0,animations=[];
  const cancel=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
  function workflow(){
   const cachedFrames=getWorkflowFrames();
   root.querySelectorAll('[data-workflow-dot]').forEach((dot,index)=>{
    // Reference: the line leads, the black marker follows, then the tail settles.
    const {delay,duration}=[
     {delay:60,duration:260},
     {delay:200,duration:1050},
     {delay:360,duration:1400},
    ][index];
    animations.push(dot.animate(cachedFrames[index],{delay:delay/motionRate(variant),duration:duration/motionRate(variant),easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'}));
   });
  }
  function update(){
   const staticMode=reduced.matches||touch.matches;
   root.dataset.static=String(staticMode);
   const next=!staticMode&&card.matches(':hover,:focus-visible');
   if(staticMode){clearTimeout(resetTimer);cancel();active=false;root.dataset.motion='idle';delete card.dataset.skillActive;return;}
   if(next===active)return;
   active=next;clearTimeout(resetTimer);
   if(active){
    cancel();root.dataset.motion='idle';void root.offsetWidth;
    root.dataset.motion='active';card.dataset.skillActive='true';
    if(variant==='workflow')workflow();
   }else{
    delete card.dataset.skillActive;root.dataset.motion='leaving';
    animations.forEach(animation=>animation.pause());
    resetTimer=setTimeout(()=>{cancel();root.dataset.motion='idle';},450);
   }
  }
  for(const event of ['pointerenter','pointerleave','focusin','focusout'])card.addEventListener(event,update);
  reduced.addEventListener('change',update);touch.addEventListener('change',update);update();
  return()=>{clearTimeout(resetTimer);cancel();delete card.dataset.skillActive;for(const event of ['pointerenter','pointerleave','focusin','focusout'])card.removeEventListener(event,update);reduced.removeEventListener('change',update);touch.removeEventListener('change',update);};
 },[ref,variant]);
}
export default function SkillArtwork({variant}){
 const ref=useRef(null);useSkillMotion(ref,variant);
 return <div ref={ref} className={`skill-artwork skill-artwork--${variant}`} style={{'--motion-rate':motionRate(variant)}} aria-hidden="true">
  {variant==='frontend'&&<><span className="skill-artwork__panel"/><span className="skill-artwork__outline"/><span className="skill-artwork__anchor"/></>}
  {variant==='workflow'&&<svg className="skill-artwork__path" viewBox="0 0 500 500" aria-hidden="true"><g style={{transform:'translate(31px,67.29px)'}}><path d={workflowPath} pathLength="1" fill="none" stroke="#CDCDCD" strokeWidth="2"/></g></svg>}
  {artwork[variant].filter(([asset])=>asset!=='d4117').map(([asset,x,y,rotation=0])=>{
   const rank=dotOrder.indexOf(asset),orbit=orbits[asset],workflowDot=variant==='workflow';
   const size=workflowDot?(asset==='6e70d'?13:7):0;
   const img=<img key={asset} className={rank>=0?'skill-artwork__dot':undefined} src={`./assets/skill-${asset}.svg`} alt="" data-workflow-dot={workflowDot?'':undefined} data-x={x} data-y={y} data-radius={size/2} style={{left:orbit?x-orbit[0]:x,top:orbit?y-orbit[1]:y,...(rank>=0?{'--reveal-delay':`${rank*75/motionRate(variant)}ms`,'--wave-delay':`${(1100+(7-rank)*145)/motionRate(variant)}ms`}:{}),...(rotation?{transform:`rotate(${rotation}deg)`}: {})}}/>;
   return orbit?<span key={asset} className="skill-artwork__orbit" style={{left:orbit[0],top:orbit[1],'--orbit-duration':`${orbit[2]}s`,'--orbit-direction':orbit[3]>0?'normal':'reverse'}}>{img}</span>:img;
  })}
 </div>;
}
