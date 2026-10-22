// 24fps reference timing, interpolated at the display refresh rate.
// A full column travels one repeat per cycle, so the loop never rewinds.
export const cycleSeconds=211/24;
const pitch=1058;
const base={top:-210,upper:[501,749,357,674,449],lower:[517,269,661,344,569]};
const stretched={top:-210,upper:[684,295,546,191,629],lower:[332,736,469,826,387]};
const compressed={top:-210,upper:[518,705,376,628,467],lower:[497,325,641,390,554]};
const alternate={top:-1268,upper:[447,618,357,715,502],lower:[571,400,661,303,516]};
const beats=[
  [0,{...base,top:-641}], [28,base],
  [52,stretched], [68,stretched], [92,compressed], [108,base],
  [132,{...base,top:-641}], [156,alternate], [180,alternate],
  [211,{...base,top:-641-pitch}]
].map(([frame,pattern])=>[frame/211,pattern]);
const mix=(a,b,t)=>a+(b-a)*t;
// Temporal Bezier (.65, 0, .35, 1): short, deliberate acceleration and a soft stop.
function ease(t){
  let lo=0,hi=1,u=t;
  for(let i=0;i<14;i++){
    u=(lo+hi)/2;
    const x=3*(1-u)*(1-u)*u*.65+3*(1-u)*u*u*.35+u*u*u;
    if(x<t)lo=u;else hi=u;
  }
  return 3*(1-u)*u*u+u*u*u;
}
export function samplePattern(seconds){
  const phase=((seconds%cycleSeconds)+cycleSeconds)%cycleSeconds/cycleSeconds;
  const next=beats.findIndex(([at])=>at>phase);
  const [start,a]=beats[next-1], [end,b]=beats[next];
  const t=(phase-start)/(end-start);
  const eased=t===0?0:ease(t);
  const upper=a.upper.map((h,i)=>mix(h,b.upper[i],eased));
  // Conserve the column pitch during deformation; gaps never breathe or drift.
  return {top:mix(a.top,b.top,eased),upper,lower:upper.map(h=>pitch-40-h)};
}

export async function initializeWorldMotion(){
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const roots=[...document.querySelectorAll('.world')];
  const worlds=roots.map(root=>{
    const canvas=document.createElement('canvas');canvas.className='world-pattern';canvas.setAttribute('aria-hidden','true');
    const context=canvas.getContext('2d');if(!context)return null;
    const letters=[...root.children].map(c=>c.firstElementChild.textContent);
    root.append(canvas);
    return {root,canvas,context,letters,visible:false,elapsed:0,last:null,width:0,height:0,scale:1,ink:[]};
  }).filter(Boolean);
  await document.fonts.load('700 420px "Roboto Mono"');
  worlds.forEach(world=>{
    world.context.font='700 420px "Roboto Mono"';
    world.ink=world.letters.map(letter=>world.context.measureText(letter));
  });
  let request=null;

  function resize(world){
    const {root,canvas,context}=world;
    world.width=root.clientWidth;world.height=root.clientHeight;
    world.scale=document.querySelector('main').getBoundingClientRect().width/1880*(parseFloat(getComputedStyle(root).getPropertyValue('--art-scale'))||1);
    const ratio=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(world.width*ratio));canvas.height=Math.max(1,Math.round(world.height*ratio));
    context.setTransform(ratio,0,0,ratio,0,0);
    paint(world);
  }

  function paint(world){
    const {context:ctx,width,height,scale,letters,root,ink}=world;
    const pattern=samplePattern(world.elapsed);
    const columnWidth=width/scale/letters.length;
    ctx.clearRect(0,0,width,height);ctx.font='700 420px "Roboto Mono"';ctx.fillStyle=getComputedStyle(root).color;
    letters.forEach((letter,index)=>{
      const metrics=ink[index],inkHeight=metrics.actualBoundingBoxAscent+metrics.actualBoundingBoxDescent;
      const inkWidth=metrics.actualBoundingBoxLeft+metrics.actualBoundingBoxRight;
      if(!inkHeight||!inkWidth)return;
      // Fit the visible glyph to its column, including the font's side bearings.
      const left=index*columnWidth;
      const upper=pattern.upper[index%5],lower=pattern.lower[index%5],gap=20;
      const first=Math.floor((-pattern.top-upper-lower-gap)/pitch);
      const last=Math.ceil((height/scale-pattern.top)/pitch);
      for(let repeat=first;repeat<=last;repeat++){
        const y=pattern.top+repeat*pitch;
        for(const [top,h] of [[y,upper],[y+upper+gap,lower]]){
          if((top+h)*scale<0||top*scale>height)continue;
          ctx.save();ctx.translate(left*scale,top*scale);
          ctx.scale(scale*columnWidth/inkWidth,scale*h/inkHeight);
          ctx.fillText(letter,metrics.actualBoundingBoxLeft,metrics.actualBoundingBoxAscent);ctx.restore();
        }
      }
    });
  }

  function frame(now){
    request=null;
    let active=false;
    worlds.forEach(world=>{
      if(world.root.dataset.motion!=='running'){world.last=null;return;}
      if(world.last!==null)world.elapsed+=(now-world.last)/1000;
      world.last=now;paint(world);active=true;
    });
    if(active)request=requestAnimationFrame(frame);
  }

  function update(){
    worlds.forEach(world=>{
      const running=world.visible&&!document.hidden&&!preference.matches;
      world.root.dataset.motion=running?'running':'paused';
      world.root.classList.toggle('pattern-ready',!preference.matches);
      if(!running)world.last=null;
    });
    if(worlds.some(world=>world.root.dataset.motion==='running')&&request===null)request=requestAnimationFrame(frame);
  }

  if('ResizeObserver' in window){
    const resizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>resize(worlds.find(w=>w.root===entry.target))));
    worlds.forEach(world=>resizeObserver.observe(world.root));
  }else window.addEventListener('resize',()=>worlds.forEach(resize));
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{worlds.find(w=>w.root===entry.target).visible=entry.isIntersecting;});update();
    });worlds.forEach(world=>observer.observe(world.root));
  }else worlds.forEach(world=>{world.visible=true;});
  worlds.forEach(resize);preference.addEventListener('change',update);document.addEventListener('visibilitychange',update);update();
}
