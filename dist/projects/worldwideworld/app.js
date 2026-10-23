// Match within each collection by product ID: thumbnails read a, b, c, d.
document.querySelectorAll('.collection').forEach(collection=>{
  const thumbnails=new Map([...collection.querySelectorAll('.thumbnails a')].map(link=>[link.hash.slice(1),link]));
  const guide=collection.querySelector('.product-guide');
  const product=document.createElement('p');
  product.className='selected-product';
  product.setAttribute('aria-live','polite');
  guide.querySelector('.thumbnails').after(product);
  function select(thumbnail){
    thumbnails.forEach(link=>{
      const selected=link===thumbnail;
      link.classList.toggle('is-selected',selected);
      if(selected)link.setAttribute('aria-current','true');
      else link.removeAttribute('aria-current');
    });
    product.textContent=thumbnail.querySelector('img').alt;
  }
  thumbnails.forEach(thumbnail=>{
    thumbnail.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='touch')select(thumbnail);
    });
    thumbnail.addEventListener('focus',()=>select(thumbnail));
    thumbnail.addEventListener('click',()=>select(thumbnail));
  });
  if(thumbnails.size)select(thumbnails.values().next().value);
  collection.querySelectorAll('.gallery figure[id]').forEach(figure=>{
    const thumbnail=thumbnails.get(figure.id);
    const photo=figure.querySelector('.photo');
    if(!thumbnail||!photo)return;
    photo.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch')return;
      select(thumbnail);
    });
  });
});

// Keep the original text artwork as the fallback while fonts and motion load.
import('./world-motion.js').then(({initializeWorldMotion})=>initializeWorldMotion());

// Replay after the whole section leaves the viewport, preserving mobile reading.
function initializePhilosophyReveal(){
  const section=document.querySelector('.philosophy');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section||!('IntersectionObserver' in window)||preference.matches)return;
  const title=section.querySelector('h1');
  const copy=section.querySelector('.philosophy-copy');
  const photo=section.querySelector('.philosophy-photo');
  if(!title||!copy||!photo)return;
  let titleAt=null;
  let copyTimer=null;
  [title,copy,photo].forEach(element=>element.classList.add('philosophy-reveal'));
  function revealTitle(){
    if(titleAt!==null)return;
    titleAt=performance.now();
    title.classList.add('is-revealed');
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting)return;
      if(target===title)revealTitle();
      else if(target===copy){
        revealTitle();
        // Let all three large lines settle before the small paragraphs enter.
        clearTimeout(copyTimer);
        copyTimer=setTimeout(()=>copy.classList.add('is-revealed'),Math.max(0,1050-(performance.now()-titleAt)));
      }else target.classList.add('is-revealed');
    });
  },{threshold:0.08,rootMargin:'0px 0px -6% 0px'});
  const sectionObserver=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting)return;
    clearTimeout(copyTimer);
    titleAt=null;
    [title,copy,photo].forEach(element=>element.classList.remove('is-revealed'));
  });
  sectionObserver.observe(section);
  [title,copy,photo].forEach(element=>observer.observe(element));
  preference.addEventListener('change',()=>{
    if(!preference.matches)return;
    clearTimeout(copyTimer);
    observer.disconnect();
    sectionObserver.disconnect();
    [title,copy,photo].forEach(element=>element.classList.add('is-revealed'));
  });
}
initializePhilosophyReveal();

function initializeBestReveal(){
  const section=document.querySelector('.best');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section||!('IntersectionObserver' in window)||preference.matches)return;
  const groups=[section.querySelector('.brand-titles'),...section.querySelectorAll('.brand-intro,.product-guide,.gallery figure')].filter(Boolean);
  groups.forEach(group=>group.classList.add('best-reveal'));
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting)target.classList.add('is-revealed');
    });
  },{threshold:0,rootMargin:'0px 0px -5% 0px'});
  const exitObserver=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting)target.classList.remove('is-revealed');
    });
  });
  groups.forEach(group=>{observer.observe(group);exitObserver.observe(group);});
  preference.addEventListener('change',()=>{
    if(!preference.matches)return;
    observer.disconnect();
    exitObserver.disconnect();
    groups.forEach(group=>group.classList.add('is-revealed'));
  });
}
initializeBestReveal();

function initializeProjectsReveal(){
  const section=document.querySelector('.features');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  if(!section||!('IntersectionObserver' in window)||preference.matches)return;
  const groups=[...section.querySelectorAll('.feature-left h2,.feature-photo,.interviews article')];
  section.classList.add('projects-motion');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting){
        target.classList.add('project-visible');
        section.classList.add('projects-entered');
      }
    });
  },{threshold:0,rootMargin:'0px 0px -8% 0px'});
  groups.forEach(group=>observer.observe(group));
  const exitObserver=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting)return;
    groups.forEach(group=>group.classList.remove('project-visible'));
    section.classList.remove('projects-entered');
  });
  exitObserver.observe(section);
  preference.addEventListener('change',()=>{
    if(!preference.matches)return;
    observer.disconnect();exitObserver.disconnect();
    section.classList.remove('projects-motion');
  });
}

function initializeProjectPhotos(){
  const section=document.querySelector('.features');
  const photo=section?.querySelector('.feature-photo');
  if(!photo)return;
  const original={src:photo.getAttribute('src'),alt:photo.alt};
  const photos=[original,
    {src:'assets/project-yoo-hyunsun.webp',alt:'유현선 R TRUNK 프로젝트 사진'},
    {src:'assets/project-lee-jangwon.webp',alt:'이장원 R TRUNK 프로젝트 사진'}
  ];
  const frame=document.createElement('span');
  frame.className='feature-photo project-photo-frame';
  photo.before(frame);
  photo.classList.remove('feature-photo');
  frame.append(photo);
  const layers=photos.map((item,index)=>{
    const layer=index===0?photo:new Image();
    layer.src=item.src;
    layer.classList.add('project-photo-layer');
    layer.classList.toggle('is-active',index===0);
    if(index>0){layer.alt='';layer.setAttribute('aria-hidden','true');frame.append(layer);}
    return layer;
  });
  const articles=[...section.querySelectorAll('.interviews article')];
  let requested=0;
  async function show(item){
    const index=photos.indexOf(item);
    const request=++requested;
    try{await layers[index].decode();}catch{return;}
    if(request!==requested)return;
    layers.forEach((layer,i)=>layer.classList.toggle('is-active',i===index));
    photo.alt=item.alt;
  }
  function restore(){
    const focused=articles.findIndex(article=>article.contains(document.activeElement));
    show(photos[focused]||original);
  }
  articles.forEach((article,index)=>{
    article.tabIndex=0;
    article.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='touch')show(photos[index]||original);
    });
    article.addEventListener('pointerleave',restore);
    article.addEventListener('focusin',()=>show(photos[index]||original));
    article.addEventListener('focusout',()=>{
      const hovered=articles.findIndex(item=>item.matches(':hover'));
      show(photos[hovered]||original);
    });
  });
}
initializeProjectPhotos();
initializeProjectsReveal();

function initializeAboutScroll(){
  const heading=document.querySelector('.about .manifesto');
  if(!heading)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  // Keep each line's text in one flex item so spaces and the square stay put.
  [...heading.children].forEach(line=>{
    const text=document.createElement('strong');text.className='about-line-text';
    [...line.childNodes].filter(node=>node.nodeName!=='IMG').forEach(node=>text.append(node));
    line.append(text);
  });
  const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);
  const textNodes=[];
  while(walker.nextNode())textNodes.push(walker.currentNode);
  const words=[];
  textNodes.forEach(node=>{
    if(!node.textContent.trim())return;
    const fragment=document.createDocumentFragment();
    node.textContent.split(/(\s+)/).filter(Boolean).forEach(part=>{
      if(/^\s+$/.test(part))fragment.append(document.createTextNode(part));
      else{
        const word=document.createElement('b');
        word.className='about-word';word.textContent=part;
        words.push(word);fragment.append(word);
      }
    });
    node.replaceWith(fragment);
  });
  heading.classList.add('about-scroll-ready');
  let request=null;
  const clamp=value=>Math.max(0,Math.min(1,value));
  function paint(){
    request=null;
    const rect=heading.getBoundingClientRect();
    const progress=preference.matches?1:clamp((innerHeight*.9-rect.top)/(rect.height+innerHeight*.52));
    words.forEach((word,index)=>{
      const fill=clamp(progress*words.length-index);
      const gray=Math.round(170*(1-fill));
      word.style.setProperty('--word-ink',`rgb(${gray},${gray},${gray})`);
    });
  }
  function schedule(){if(request===null)request=requestAnimationFrame(paint);}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  preference.addEventListener('change',schedule);
  if('ResizeObserver' in window)new ResizeObserver(schedule).observe(heading);
  document.fonts.ready.then(schedule);
  paint();
}
initializeAboutScroll();

function initializeServiceReveal(){
  const services=document.querySelector('.services');
  if(!services||!('IntersectionObserver' in window))return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const links=[...services.querySelectorAll('a')];
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(isIntersecting)target.classList.add('service-visible');
    });
  },{threshold:0,rootMargin:'0px 0px -6% 0px'});
  const exitObserver=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting)links.forEach(link=>link.classList.remove('service-visible'));
  });
  function configure(){
    observer.disconnect();exitObserver.disconnect();
    services.classList.toggle('services-motion',!preference.matches);
    links.forEach(link=>link.classList.remove('service-visible'));
    if(preference.matches)return;
    links.forEach(link=>observer.observe(link));
    exitObserver.observe(services);
  }
  links.forEach(link=>link.addEventListener('focus',()=>link.classList.add('service-visible')));
  preference.addEventListener('change',configure);
  configure();
}
initializeServiceReveal();

function initializeFooterReveal(){
  const footer=document.querySelector('footer');
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  if(!footer||!('IntersectionObserver' in window))return;
  const title=footer.querySelector('.next');
  if(!title)return;
  // Preserve the existing line breaks and layout while staggering each line.
  const lines=title.innerHTML.split(/<br\s*\/?\s*>/i);
  title.replaceChildren();
  lines.forEach((line,index)=>{
    if(index)title.append(document.createElement('br'));
    const span=document.createElement('span');
    span.className='footer-title-line';
    span.textContent=line;
    span.style.setProperty('--footer-delay',`${100+index*110}ms`);
    title.append(span);
  });
  const top=footer.querySelector('.footer-top');
  const copy=footer.querySelector('.footer-bottom p');
  const email=footer.querySelector('.footer-bottom > a');
  const copyright=footer.querySelector('.copyright');
  const groups=[top,copy,email,copyright].filter(Boolean);
  footer.querySelectorAll('.footer-top nav a').forEach((link,index)=>{
    link.style.setProperty('--footer-delay',`${150+index*85}ms`);
  });
  function reset(){
    footer.classList.remove('footer-entered');
    groups.forEach(group=>group.classList.remove('footer-visible'));
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting)return;
      target.classList.add('footer-visible');
      footer.classList.add('footer-entered');
    });
  },{threshold:0,rootMargin:'0px 0px -5% 0px'});
  const exitObserver=new IntersectionObserver(entries=>{
    if(!entries[0].isIntersecting)reset();
  });
  function configure(){
    observer.disconnect();exitObserver.disconnect();reset();
    footer.classList.toggle('footer-motion',!preference.matches);
    if(preference.matches)return;
    groups.forEach(group=>observer.observe(group));
    exitObserver.observe(footer);
  }
  preference.addEventListener('change',configure);
  configure();
}
initializeFooterReveal();
