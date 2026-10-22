export function initPlaygroundPreview(){
 const section=document.querySelector('[data-name="Section / Playground"]');
 const grid=section?.querySelector('[data-name="Playground / Project Grid"]');
 if(!grid)return;
 const media={'919:1340':'./assets/playground-zippy.mp4','919:1349':'./assets/playground-emeya.mp4'};
 const preview=document.createElement('div');
 preview.id='playground-preview';preview.className='playground-preview';
 preview.innerHTML='<video class="playground-preview__media" muted loop playsinline autoplay preload="metadata"></video><div class="playground-preview__caption"><p class="playground-preview__title"></p><p class="playground-preview__meta"></p></div>';
 const video=preview.querySelector('video');video.muted=true;
 grid.prepend(preview);
 let selected=null,inView=false;
 const play=()=>{if(inView&&!document.hidden)video.play().catch(()=>{});};
 function select(item){
  if(selected===item)return;
  selected?.removeAttribute('data-preview-active');selected?.setAttribute('aria-pressed','false');
  selected=item;
  const src=media[item.dataset.nodeId];
  const lines=[...item.querySelectorAll('p')].map(p=>p.textContent.trim());
  video.pause();video.poster=src.replace('.mp4','.png');video.src=src;video.setAttribute('aria-label',lines[0]);
  preview.querySelector('.playground-preview__title').textContent=lines[0];
  preview.querySelector('.playground-preview__meta').textContent=lines.slice(1).join(' \u00b7 ');
  item.dataset.previewActive='true';item.setAttribute('aria-pressed','true');play();
 }
 for(const item of grid.querySelectorAll('[data-name^="Playground Item"]')){
  if(!media[item.dataset.nodeId]){item.hidden=true;continue;}
  item.tabIndex=0;item.setAttribute('role','button');item.setAttribute('aria-controls',preview.id);item.setAttribute('aria-pressed','false');
  item.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')select(item);});
  item.addEventListener('focus',()=>select(item));item.addEventListener('click',()=>select(item));
  item.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(item);}});
 }
 select(grid.querySelector('[data-node-id="919:1349"]'));
 const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)play();else video.pause();},{rootMargin:'100px'});observer.observe(preview);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else play();});
}
