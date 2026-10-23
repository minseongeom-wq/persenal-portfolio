import {CURL_OPTIONS as options} from './project-curl-config.js';
import {createCurlMap} from './scroll-curl-map.js';

// The same semicircular sampling profile as the project shader, applied to live DOM.
// SVG displacement keeps text, links, videos, and sticky content interactive.
export function initScrollCurl(){
 const ns='http://www.w3.org/2000/svg',reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const create=(name,attributes={})=>{const node=document.createElementNS(ns,name);node.style.transform='none';for(const [key,value] of Object.entries(attributes))node.setAttribute(key,String(value));return node;};
 const svg=create('svg',{'aria-hidden':'true',width:0,height:0});
 svg.style.cssText='position:absolute;pointer-events:none;overflow:hidden;transform:none';
 const defs=create('defs');svg.append(defs);document.body.append(svg);
 const entries=[...document.querySelectorAll('#root [data-name^="Section /"]')].map((element,index)=>{
  const id=`section-scroll-curl-${index}`,filter=create('filter',{id,filterUnits:'userSpaceOnUse',primitiveUnits:'userSpaceOnUse','color-interpolation-filters':'sRGB'});
  const image=create('feImage',{preserveAspectRatio:'none',result:'curve'});
  const neutral=create('feComponentTransfer',{in:'curve',result:'sampling-map'});
  neutral.append(create('feFuncR',{type:'linear',slope:1,intercept:-.5/255}),create('feFuncB',{type:'linear',slope:0,intercept:.5}));
  const displacement=create('feDisplacementMap',{in:'SourceGraphic',in2:'sampling-map',scale:0,xChannelSelector:'R',yChannelSelector:'B'});
  filter.append(image,neutral,displacement);defs.append(filter);
  return {element,filter,image,neutral,displacement,id,visible:false,width:0,key:null,ready:false,pending:null};
 });
 const byElement=new Map(entries.map(entry=>[entry.element,entry]));
 const playingVideos=new Set();
 const playbackChanged=event=>{
  if(!(event.target instanceof HTMLVideoElement))return;
  const video=event.target;
  if(video.paused||video.ended)playingVideos.delete(video);else playingVideos.add(video);
  const entry=byElement.get(video.closest('[data-name^="Section /"]'));
  if(entry&&playingVideos.has(video))entry.element.style.removeProperty('filter');
 };
 document.addEventListener('play',playbackChanged,true);document.addEventListener('pause',playbackChanged,true);document.addEventListener('ended',playbackChanged,true);
 const dirty=new Set(),buildQueue=new Set();
 let frame=0,lastTime=0,lastY=scrollY,activity=0,layoutFrame=0,buildTimer=0,disposed=false;
 function clear(){cancelAnimationFrame(frame);frame=0;activity=0;lastTime=0;lastY=scrollY;entries.forEach(({element})=>element.style.removeProperty('filter'));}
 function measure(entry){
   const {element}=entry,width=element.offsetWidth,height=element.offsetHeight;
   if(!width||!height)return null;
   const bounds=element.getBoundingClientRect(),zoom=bounds.width/width;
   // Figma's exported wrappers include scaleX(-1). Viewport rectangles must
   // be mapped back into the section's LOCAL axes before building its filter.
   let axes=new DOMMatrix();
   for(let ancestor=element;ancestor;ancestor=ancestor.parentElement){
    const transform=getComputedStyle(ancestor).transform;
    if(transform!=='none')axes=new DOMMatrix(transform).multiply(axes);
   }
   const seen=new Set(),media=[];
   for(const source of element.querySelectorAll('img,video')){
    const container=source.closest('.project-gallery__image,[data-name="Contribution / Preview Image"]')||source;
    if(seen.has(container))continue;seen.add(container);
    const rect=source.getBoundingClientRect();
    const sourceWidth=source.naturalWidth||source.videoWidth,sourceHeight=source.naturalHeight||source.videoHeight;
    // Pin the actual fitted content edges, not the larger letterboxed element.
    if(sourceWidth&&sourceHeight&&getComputedStyle(source).objectFit==='contain'){
     const fit=Math.min(rect.width/sourceWidth,rect.height/sourceHeight),w=sourceWidth*fit,h=sourceHeight*fit;
     rect.x=rect.left+(rect.width-w)/2;rect.y=rect.top+(rect.height-h)/2;rect.width=w;rect.height=h;
    }
    if(rect.width/zoom<100||rect.height/zoom<80)continue;
    media.push({x:(axes.a<0?bounds.right-rect.right:rect.left-bounds.left)/zoom,y:(axes.d<0?bounds.bottom-rect.bottom:rect.top-bounds.top)/zoom,width:rect.width/zoom,height:rect.height/zoom});
   }
   // Backgrounds first, so a foreground media rectangle owns its sampling field.
   media.sort((a,b)=>b.width*b.height-a.width*a.height);
   // Local coordinates are stable across scroll positions; ignore subpixel noise.
   const key=JSON.stringify([width,height,media.map(rect=>Object.values(rect).map(value=>Math.round(value*64)/64))]);
   return {width,height,media,key};
 }
 function buildNext(){
  buildTimer=0;if(disposed)return;
  const entry=[...buildQueue].find(entry=>entry.visible)||buildQueue.values().next().value;
  if(!entry)return;
  buildQueue.delete(entry);
  const pending=entry.pending;
  if(pending){
   const {width,height,media,key}=pending,{href,pad}=createCurlMap(width,height,media);
   entry.image.setAttribute('href',href);
   for(const node of [entry.filter,entry.image,entry.neutral,entry.displacement])for(const [name,value] of Object.entries({x:-pad,y:-pad,width:width+2*pad,height:height+2*pad}))node.setAttribute(name,String(value));
   entry.width=width;entry.key=key;entry.ready=true;entry.pending=null;
  }
  // Build one map per task so a burst of image loads cannot block an entire frame.
  if(buildQueue.size)buildTimer=setTimeout(buildNext,0);
 }
 function flushLayout(){
  layoutFrame=0;if(disposed)return;
  // Finish geometry reads before changing any filter attributes or styles.
  const measured=[...dirty].map(entry=>[entry,measure(entry)]);dirty.clear();
  for(const [entry,pending] of measured){
   if(!pending||pending.key===(entry.pending?.key||entry.key))continue;
   entry.pending=pending;entry.ready=false;entry.element.style.removeProperty('filter');buildQueue.add(entry);
  }
  if(buildQueue.size&&!buildTimer)buildTimer=setTimeout(buildNext,0);
 }
 function invalidate(entry){
  if(disposed||!entry)return;
  dirty.add(entry);if(!layoutFrame)layoutFrame=requestAnimationFrame(flushLayout);
 }
 const resize=()=>entries.forEach(invalidate);
 function animate(now){
  frame=0;if(reduced.matches||document.hidden){clear();return;}
  const dt=Math.max(1/240,Math.min(.1,(now-(lastTime||now-1000/60))/1000));
  const target=Math.min(1,Math.abs(scrollY-lastY)/dt/options.velocityReference);lastY=scrollY;lastTime=now;
  const tau=(target>activity?options.attackMs:options.releaseMs)/1000;
  activity+=(target-activity)*(1-Math.exp(-dt/tau));
  if(activity<options.settleThreshold&&target===0){clear();return;}
  const playingSections=new Set([...playingVideos].map(video=>video.closest('[data-name^="Section /"]')));
  for(const entry of entries){
   // Avoid re-filtering a live video frame through a section-sized displacement surface.
   if(playingSections.has(entry.element)){entry.element.style.removeProperty('filter');continue;}
   if(!entry.visible||!entry.ready){if(entry.element.style.filter)entry.element.style.removeProperty('filter');continue;}
   entry.displacement.setAttribute('scale',String(entry.width*options.maxStrength*activity));
   if(!entry.element.style.filter)entry.element.style.filter=`url(#${entry.id})`;
  }
  frame=requestAnimationFrame(animate);
 }
 const wake=()=>{if(!frame&&!reduced.matches&&!document.hidden){lastTime=performance.now()-1000/60;frame=requestAnimationFrame(animate);}};
 const observer=new IntersectionObserver(changes=>{for(const change of changes){const entry=entries.find(entry=>entry.element===change.target);entry.visible=change.isIntersecting;if(!entry.visible)entry.element.style.removeProperty('filter');}},{rootMargin:'100px'});
 entries.forEach(({element})=>observer.observe(element));
 const sizes=new ResizeObserver(changes=>changes.forEach(change=>invalidate(byElement.get(change.target))));entries.forEach(({element})=>sizes.observe(element));resize();
 // Lazy videos may acquire their intrinsic aspect ratio after section sizing.
 const sources=[...document.querySelectorAll('#root img,#root video')];
 const sourceReady=event=>invalidate(byElement.get(event.target.closest('[data-name^="Section /"]')));
 sources.forEach(source=>{source.addEventListener('load',sourceReady);source.addEventListener('loadedmetadata',sourceReady);});
 window.addEventListener('scroll',wake,{passive:true});window.addEventListener('resize',resize);
 document.addEventListener('visibilitychange',clear);reduced.addEventListener('change',clear);
 return()=>{disposed=true;clear();cancelAnimationFrame(layoutFrame);clearTimeout(buildTimer);dirty.clear();buildQueue.clear();observer.disconnect();sizes.disconnect();svg.remove();sources.forEach(source=>{source.removeEventListener('load',sourceReady);source.removeEventListener('loadedmetadata',sourceReady);});window.removeEventListener('scroll',wake);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',clear);reduced.removeEventListener('change',clear);document.removeEventListener('play',playbackChanged,true);document.removeEventListener('pause',playbackChanged,true);document.removeEventListener('ended',playbackChanged,true);playingVideos.clear();};
}
