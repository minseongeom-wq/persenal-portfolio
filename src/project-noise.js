/** Reference-style tiled media transitions, with a static CRT overlay at rest. */
export function initProjectNoise(gallery){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const items=[...gallery.querySelectorAll('.project-gallery__card')].map(card=>({
  card,canvas:card.querySelector('.project-gallery__noise'),buffer:document.createElement('canvas'),
  previous:document.createElement('canvas'),visible:false,source:null,start:-Infinity,until:0,
  scroll:0,lastScroll:-Infinity,tiles:Array.from({length:40},()=>Math.random()),
 }));
 let frame=0,lastFrame=0,previousY=scrollY,disposed=false;
 const cleanups=[];
 function clear(item){item.canvas.style.opacity='0';item.canvas.dataset.noiseActive='false';item.until=0;}
 function sourceFor(item){
  const link=document.querySelector(`[data-project-link="${item.card.dataset.projectIndex}"]`);
  const color=item.card.matches(':hover,:focus-visible')||link?.matches(':hover,:focus-visible');
  return item.card.querySelector(color?'.project-gallery__color':'.project-gallery__base');
 }
 function drawCover(context,image,w,h){
  const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight),iw=image.naturalWidth*ratio,ih=image.naturalHeight*ratio;
  context.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);
 }
 function rasterize(item){
  const image=sourceFor(item);
  if(!image.complete||!image.naturalWidth)return false;
  const bounds=item.canvas.parentElement.getBoundingClientRect();
  const w=Math.min(640,Math.max(1,Math.round(bounds.width))),h=Math.max(1,Math.round(w*bounds.height/bounds.width));
  if(item.source===image&&item.buffer.width===w&&item.buffer.height===h)return true;
  // Keep the currently displayed pixels when a hover reverses mid-transition.
  const previous=item.previous.getContext('2d',{alpha:false});
  item.previous.width=w;item.previous.height=h;
  if(item.canvas.dataset.noiseActive==='true'&&item.canvas.width)previous.drawImage(item.canvas,0,0,w,h);
  else if(item.source?.complete)drawCover(previous,item.source,w,h);
  else drawCover(previous,item.card.querySelector('.project-gallery__base'),w,h);
  item.source=image;item.canvas.width=item.buffer.width=w;item.canvas.height=item.buffer.height=h;
  drawCover(item.buffer.getContext('2d',{alpha:false}),image,w,h);
  return true;
 }
 function wake(){if(!frame&&!reduced.matches&&!document.hidden&&!disposed)frame=requestAnimationFrame(render);}
 function burst(item){
  if(!item.visible||reduced.matches||document.hidden)return;
  const now=performance.now();item.start=now;item.until=now+560;
  item.tiles=Array.from({length:40},()=>Math.random());wake();
 }
 function render(now){
  frame=0;
  if(disposed||reduced.matches||document.hidden)return;
  if(now-lastFrame<1000/24){wake();return;}lastFrame=now;
  let running=false;
  for(const item of items){
   if(!item.visible||now>=item.until){clear(item);continue;}
   running=true;
   if(!rasterize(item))continue;
   const progress=Math.min(1,Math.max(0,(now-item.start)/560));
   const motion=item.scroll*Math.max(0,1-(now-item.lastScroll)/220);
   const ctx=item.canvas.getContext('2d'),w=item.canvas.width,h=item.canvas.height;
   ctx.globalAlpha=1;ctx.drawImage(item.buffer,0,0);
   // Fixed 8 x 5 tile grid: staggered changes instead of random horizontal tearing.
   for(let row=0;row<5;row++)for(let col=0;col<8;col++){
    const index=row*8+col,seed=item.tiles[index],x=Math.floor(col*w/8),y=Math.floor(row*h/5);
    const tw=Math.ceil((col+1)*w/8)-x,th=Math.ceil((row+1)*h/5)-y;
    const local=Math.max(0,Math.min(1,(progress-seed*.58)/.42));
    if(local<1){
     ctx.globalAlpha=1-local;
     ctx.drawImage(item.previous,x,y,tw,th,x,y,tw,th);
     // Brief tinted blocks echo the source's checkerboard reveal.
     ctx.globalAlpha=Math.sin(local*Math.PI)*.2;
     ctx.fillStyle=index%3===0?'#1a48ff':'#071325';ctx.fillRect(x,y,tw,th);
    }
    if(motion>.05&&seed>.76){
     const shift=Math.round(Math.sin(now/90+index)*motion*w*.012);
     ctx.globalAlpha=motion*.42;
     ctx.drawImage(item.buffer,x,y,tw,th,x+shift,y,tw,th);
    }
   }
   ctx.globalAlpha=1;item.canvas.style.opacity='1';item.canvas.dataset.noiseActive='true';
  }
  if(running)wake();
 }
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){const item=items.find(item=>item.card===entry.target);item.visible=entry.isIntersecting&&entry.intersectionRatio>=.12;if(item.visible)burst(item);else clear(item);}
 },{threshold:[0,.12]});
 function listen(element,event,callback){element.addEventListener(event,callback);cleanups.push(()=>element.removeEventListener(event,callback));}
 for(const item of items){
  observer.observe(item.card);
  item.card.querySelectorAll('img').forEach(image=>listen(image,'load',()=>burst(item)));
  const link=document.querySelector(`[data-name^="Project Link / 0${Number(item.card.dataset.projectIndex)+1}"]`);
  for(const element of [item.card,link].filter(Boolean))for(const event of ['pointerenter','pointerleave','focusin','focusout'])listen(element,event,()=>burst(item));
 }
 const scroll=()=>{
  const delta=Math.abs(scrollY-previousY);previousY=scrollY;
  if(delta<1||reduced.matches||document.hidden)return;
  const now=performance.now();
  let active=false;
  for(const item of items)if(item.visible){active=true;item.scroll=Math.min(1,delta/55);item.lastScroll=now;item.until=Math.max(item.until,now+220);}
  if(active)wake();
 };
 window.addEventListener('scroll',scroll,{passive:true});
 const stop=()=>{cancelAnimationFrame(frame);frame=0;items.forEach(clear);};
 const visibility=()=>{if(document.hidden)stop();};
 reduced.addEventListener('change',stop);document.addEventListener('visibilitychange',visibility);
 return()=>{disposed=true;stop();observer.disconnect();cleanups.forEach(cleanup=>cleanup());window.removeEventListener('scroll',scroll);reduced.removeEventListener('change',stop);document.removeEventListener('visibilitychange',visibility);};
}
