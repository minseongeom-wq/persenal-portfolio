import {rasterize} from './elastic-typography.js';
const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
/** A single shared entrance clock; idle/pointer/scroll effects take over afterwards. */
export function initHeroEntrance(){
 const hero=document.querySelector('[data-name="Section / Hero"]');
 if(!hero)return()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const main=hero.querySelector('[data-node-id="919:872"] p');
 const groups=['919:873','919:874','919:875','919:877','919:880','919:883'];
 const entries=[{title:main,delay:0,duration:1500,main:true},...groups.flatMap((id,index)=>[...hero.querySelectorAll(`[data-node-id="${id}"] p`)].map(title=>({title,delay:index===0?600:900,duration:index===0?600:1100,main:false,trail:index>0})))].filter(entry=>entry.title);
 for(const entry of entries)entry.arrow=entry.title.closest('[data-name^="Social Link /"],[data-name^="Contact Link /"]')?.querySelector('[data-name="Icon / Link Arrow"]');
 let frame=0,disposed=false,finished=false,start=0,smallStart=null;
 const beginSmall=()=>{if(smallStart===null&&!finished)smallStart=performance.now();};
 function finish(){
  finished=true;cancelAnimationFrame(frame);frame=0;
  for(const entry of entries){entry.canvas?.remove();entry.arrow?.style.removeProperty('opacity');if(entry.main)entry.title.style.removeProperty('opacity');entry.title.classList.remove('hero-entry-pending','hero-entry-rendering');entry.title.dataset.heroEntering='false';if(entry.title.dataset.heroEntryPhase!=='complete')entry.title.dataset.heroEntryPhase='complete';}
 }
 if(reduced.matches)return()=>{};
 for(const {title} of entries){title.classList.add('hero-entry-pending');title.dataset.heroEntering='true';title.dataset.heroEntryPhase='pending';}
 for(const entry of entries)if(entry.arrow)entry.arrow.style.opacity='0';
 function draw(entry,progress){
  const {ctx,image,canvas,padding,fontSize,main}=entry;
  const ratio=entry.ratio,w=canvas.width/ratio,h=canvas.height/ratio;
  const decay=Math.pow(1-progress,entry.trail?1.8:2.8),strength=entry.trail?.18:.055;
  ctx.clearRect(0,0,w,h);
  ctx.globalAlpha=1;
  canvas.style.opacity=String(.06+.94*ease(progress/.8));
  if(entry.arrow)entry.arrow.style.opacity=canvas.style.opacity;
  // Continuous bands with a local horizontal warp preserve the letter silhouettes.
  // Gray metadata restores stretched strokes with lingering warm/cool edges, once on entry.
  const bandPixels=Math.max(1,Math.round(fontSize*.008*ratio)),columns=main?12:8;
  for(let pixelY=0;pixelY<canvas.height;pixelY+=bandPixels){
   const y=pixelY/ratio,bh=Math.min(bandPixels,canvas.height-pixelY)/ratio,lineY=(y-padding)/fontSize;
   const wave=Math.sin(lineY*8+.65)+.2*Math.sin(lineY*14-1.1);
   const shift=fontSize*strength*decay*wave;
   for(let column=0;column<columns;column++){
    const x=Math.round(canvas.width*column/columns)/ratio,right=Math.round(canvas.width*(column+1)/columns)/ratio;
    const warp=point=>point+shift*Math.sin(Math.PI*point/w)+fontSize*strength*.45*decay*Math.sin(point/w*7+lineY*6);
    const left=warp(x),width=warp(right)-left;
    const lineFraction=((lineY%1)+1)%1;
    if(entry.trail&&lineFraction>.2&&lineFraction<.78){
     const tail=Math.pow(1-progress,1.15),offset=fontSize*.48*tail;
     ctx.globalAlpha=.42*tail;
     ctx.drawImage(entry.warm,x*ratio,pixelY,(right-x)*ratio,bh*ratio,left+offset,y,width+.15,bh);
     ctx.globalAlpha=.34*tail;
     ctx.drawImage(entry.cool,x*ratio,pixelY,(right-x)*ratio,bh*ratio,left-offset*.65,y,width+.15,bh);
     ctx.globalAlpha=1;
    }
    ctx.drawImage(image,x*ratio,pixelY,(right-x)*ratio,bh*ratio,left,y,width+.15,bh);
   }
  }
 }
 function animate(now){
  frame=0;if(disposed||finished)return;
  // Other first-frame setup (including WebGL compilation) can make RAF's timestamp stale.
  if(!start)start=performance.now();
  now=Math.max(start,now);
  for(const entry of entries){
   if(entry.done)continue;
   // WEB lines enter halfway through the title distortion; gray metadata follows 300ms later.
   if(!entry.main&&smallStart===null){
    if(!main?.querySelector('.elastic-canvas')||now-start>=1500)beginSmall();
    else continue;
   }
   const elapsed=now-(entry.main?start:smallStart)-entry.delay;
   if(elapsed<0)continue;
   if(entry.main){
    entry.title.classList.remove('hero-entry-pending');
    entry.title.style.opacity=String(ease(elapsed/entry.duration));
    entry.title.dataset.heroEntryPhase='entering';
    if(elapsed>=entry.duration){entry.done=true;entry.title.style.removeProperty('opacity');entry.title.dataset.heroEntering='false';entry.title.dataset.heroEntryPhase='complete';}
    continue;
   }
   if(elapsed>=entry.duration){
    entry.done=true;entry.canvas.remove();entry.arrow?.style.removeProperty('opacity');entry.title.classList.remove('hero-entry-pending','hero-entry-rendering');entry.title.dataset.heroEntering='false';entry.title.dataset.heroEntryPhase='complete';continue;
   }
   if(entry.title.dataset.heroEntryPhase!=='entering'){entry.title.classList.remove('hero-entry-pending');entry.title.classList.add('hero-entry-rendering');entry.title.dataset.heroEntryPhase='entering';}
   draw(entry,elapsed/entry.duration);
  }
  if(entries.every(entry=>entry.done)){finish();return;}
  frame=requestAnimationFrame(animate);
 }
 async function initialize(){
  await document.fonts.ready;
  if(disposed||finished)return;
  try{
   for(const entry of entries){
    if(entry.main)continue;
    const fontSize=parseFloat(getComputedStyle(entry.title).fontSize),padding=Math.ceil(fontSize*.35+8),ratio=Math.min(devicePixelRatio||1,1.5);
    const {image}=rasterize(entry.title,padding,ratio),canvas=document.createElement('canvas');
    if(entry.trail){
     const tint=color=>{const copy=document.createElement('canvas');copy.width=image.width;copy.height=image.height;const context=copy.getContext('2d');context.drawImage(image,0,0);context.globalCompositeOperation='source-in';context.fillStyle=color;context.fillRect(0,0,copy.width,copy.height);return copy;};
     entry.warm=tint('#eb565f');entry.cool=tint('#319cce');
     const ink=image.getContext('2d');ink.globalCompositeOperation='source-in';ink.fillStyle=getComputedStyle(entry.title).color;ink.fillRect(0,0,image.width,image.height);ink.globalCompositeOperation='source-over';
    }
    canvas.width=image.width;canvas.height=image.height;canvas.className='hero-entry-canvas';canvas.setAttribute('aria-hidden','true');canvas.style.setProperty('--entry-padding',`${padding}px`);
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');ctx.scale(ratio,ratio);
    Object.assign(entry,{canvas,ctx,image,padding,fontSize,ratio});entry.title.append(canvas);
   }
   frame=requestAnimationFrame(animate);
  }catch{finish();}
 }
 const hide=()=>{if(document.hidden)finish();};
 const change=()=>{if(reduced.matches)finish();};
 const resize=()=>{if(start)finish();};
 main?.addEventListener('hero-title-start',beginSmall);
 document.addEventListener('visibilitychange',hide);reduced.addEventListener('change',change);window.addEventListener('resize',resize);
 initialize();
 return()=>{disposed=true;finish();main?.removeEventListener('hero-title-start',beginSmall);document.removeEventListener('visibilitychange',hide);reduced.removeEventListener('change',change);window.removeEventListener('resize',resize);};
}
