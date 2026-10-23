const root=document.documentElement;
function fit(){
  const viewportWidth=root.clientWidth;
  const scale=viewportWidth/1920;
  const mobile=viewportWidth<=700;
  const height=innerHeight/scale-(mobile?14:0);
  const footer=mobile?64/scale:93;
  root.style.setProperty('--scale',scale);
  root.style.setProperty('--hero-height',`${height}px`);
  root.style.setProperty('--hero-bottom',`${footer}px`);
  root.style.setProperty('--hero-fit',Math.min(1,Math.max(.1,(height-footer)/995)));
}fit();addEventListener('resize',fit);
const $=id=>document.querySelector(`[data-node-id="${id}"]`);
const scanGraphic=$('432:686');
scanGraphic.classList.add('lotus-scan');
scanGraphic.setAttribute('role','img');
scanGraphic.setAttribute('aria-label','LOTUS 로고와 회전하는 궤도 및 기술 정보');
const scanOrbit=document.createElement('div');scanOrbit.className='lotus-scan-orbit';
const scanLogo=document.createElement('div');scanLogo.className='lotus-scan-logo';
for(const [container,files] of [
  [scanOrbit,['01_layer-outer-orbit.svg','02_layer-coordinate-markers.svg','07_accents-orbit.svg']],
  [scanLogo,['04_layer-inner-badge.svg','05_layer-lotus-emblem.svg','06_layer-lotus-wordmark.svg','07_accents-logo.svg']]
]){
  container.setAttribute('aria-hidden','true');
  for(const file of files){const image=document.createElement('img');image.src=`assets/lotus-scan/${file}`;image.alt='';image.width=548;image.height=548;image.decoding='async';image.draggable=false;container.append(image);}
}
scanGraphic.replaceChildren(scanOrbit,scanLogo);
// Attach label centers to the same radial directions as their orbit markers.
fetch('assets/lotus-scan/03_layer-editable-annotations.svg').then(response=>{
  if(!response.ok)throw Error('Unable to load LOTUS annotations');
  return response.text();
}).then(source=>{
  const svg=new DOMParser().parseFromString(source,'image/svg+xml').documentElement;
  svg.classList.add('lotus-scan-annotations');svg.setAttribute('aria-hidden','true');
  const namespace='http://www.w3.org/2000/svg';
  const labels=[...svg.querySelectorAll('text')];
  const chassis=labels.find(text=>text.id==='label-chassis');
  const markerPositions={'label-hethel':[127.7,145.1],'label-type':[397.1,119.8],'label-lotus-code':[142.8,410.9],'label-chassis':[399.7,416.9]};
  scanOrbit.append(svg);
  for(const label of labels){
    if(label.id==='label-verified')continue;
    const [markerX,markerY]=markerPositions[label.id];
    const direction=Math.atan2(markerY-270,markerX-274);
    const radius=252;
    const x=274+Math.cos(direction)*radius,y=270+Math.sin(direction)*radius;
    const anchor=document.createElementNS(namespace,'g');anchor.setAttribute('transform',`translate(${x} ${y})`);
    anchor.classList.add('lotus-scan-label-anchor');
    const upright=document.createElementNS(namespace,'g');upright.classList.add('lotus-scan-upright');
    const centered=document.createElementNS(namespace,'g');
    label.before(anchor);anchor.append(upright);upright.append(centered);centered.append(label);
    if(label===chassis)centered.append(labels.find(text=>text.id==='label-verified'));
    const bounds=centered.getBBox();
    centered.setAttribute('transform',`translate(${-bounds.x-bounds.width/2} ${-bounds.y-bounds.height/2})`);
  }
}).catch(error=>console.error(error));
const scanObserver=new IntersectionObserver(entries=>scanGraphic.classList.toggle('is-visible',entries[0].isIntersecting));
scanObserver.observe(scanGraphic);
document.addEventListener('visibilitychange',()=>scanGraphic.classList.toggle('is-page-hidden',document.hidden));
const stage=$('432:537');
const heroVideo=document.createElement('video');
heroVideo.autoplay=true;
heroVideo.muted=true;
heroVideo.loop=true;
heroVideo.playsInline=true;
heroVideo.preload='auto';
heroVideo.poster='assets/hero-poster.png';
heroVideo.src='assets/LOTUS-EMIRA-Studio-Hero.mp4';
heroVideo.setAttribute('aria-hidden','true');
heroVideo.style.cssText='display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit;pointer-events:none';
$('432:539').append(heroVideo);
const sectionVideos=[
  ['432:590','assets/ELETRE-Sequence.mp4','assets/teaser-poster.png'],
  ['432:656','assets/Introducing-Lotus-Theory-1.mp4','assets/theory-poster.png']
].map(([id,src,poster])=>{
  const container=$(id);
  const video=document.createElement('video');
  video.className='section-background-video';
  video.muted=true;
  video.loop=true;
  video.playsInline=true;
  video.preload='none';
  video.poster=poster;
  video.dataset.src=src;
  video.setAttribute('aria-hidden','true');
  container.prepend(video);
  return video;
});
const visibleVideos=new Set();
const sectionVideoObserver=new IntersectionObserver(entries=>{
  entries.forEach(({target:video,isIntersecting})=>{
    if(isIntersecting){
      visibleVideos.add(video);
      if(!video.getAttribute('src'))video.src=video.dataset.src;
      if(!document.hidden)video.play().catch(()=>{});
    }else {visibleVideos.delete(video);video.pause();}
  });
},{threshold:0});
sectionVideos.forEach(video=>sectionVideoObserver.observe(video));
sectionVideoObserver.observe(heroVideo);
document.addEventListener('visibilitychange',()=>{
  visibleVideos.forEach(video=>{if(document.hidden)video.pause();else video.play().catch(()=>{});});
});
// Keep motion separate from the original layout transforms.
const hero=$('432:538');
const heroComposition=document.createElement('div');
heroComposition.className='hero-composition';
[...hero.children].filter(el=>el!==$('432:539')).forEach(el=>heroComposition.append(el));
hero.append(heroComposition);
const heroLayers=['432:540','466:477','466:499','466:500','466:478'].map($);
heroLayers.forEach((el,i)=>{
  el.classList.add('hero-motion');
  el.style.setProperty('--enter-delay',`${180+i*130}ms`);
  el.style.setProperty('--depth',String(i===0?.55:1+i*.12));
  [...el.children].forEach(child=>child.classList.add('hero-reveal'));
});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
let heroFrame=0;
let heroVisible=true;
new IntersectionObserver(entries=>{
  heroVisible=entries[0].isIntersecting;
  if(heroVisible)scheduleHeroMotion();
}).observe(hero);
let pointerX=0,pointerY=0;
function updateHeroMotion(){
  heroFrame=0;
  const bounds=hero.getBoundingClientRect();
  const progress=Math.max(0,Math.min(1,-bounds.top/Math.max(1,bounds.height)));
  hero.style.setProperty('--hero-x',`${reducedMotion.matches?0:pointerX*12}px`);
  hero.style.setProperty('--hero-y',`${reducedMotion.matches?0:pointerY*9}px`);
  hero.style.setProperty('--hero-scroll',`${reducedMotion.matches?0:-progress*150}px`);
  hero.style.setProperty('--hero-opacity',String(reducedMotion.matches?1:Math.max(0,1-progress*1.65)));
}
function scheduleHeroMotion(){if(heroVisible&&!document.hidden&&!heroFrame)heroFrame=requestAnimationFrame(updateHeroMotion);}
hero.addEventListener('pointermove',event=>{
  if(!finePointer.matches||reducedMotion.matches)return;
  const bounds=hero.getBoundingClientRect();
  pointerX=(event.clientX-bounds.left)/bounds.width*2-1;
  pointerY=(event.clientY-bounds.top)/bounds.height*2-1;
  scheduleHeroMotion();
});
hero.addEventListener('pointerleave',()=>{pointerX=pointerY=0;scheduleHeroMotion();});
addEventListener('scroll',scheduleHeroMotion,{passive:true});
addEventListener('resize',scheduleHeroMotion);
reducedMotion.addEventListener('change',scheduleHeroMotion);
scheduleHeroMotion();
// The outer frame belongs to the viewport, so it is separate from scrolling content.
$('432:701').remove();
document.body.insertAdjacentHTML('beforeend',`<header class="hud"><div class="hud-border"></div><a class="brand-tab" href="#home" aria-label="LOTUS 처음으로"><span class="emblem"><img src="assets/167d4.png" alt=""></span><img src="assets/2618a.png" alt="LOTUS"></a><div class="dashboard"><span class="ready hud-copy">READY</span><span class="hud-copy">EMIRA</span><span class="go hud-copy">FOR THE DRIVERS</span><button class="menu-trigger" aria-haspopup="dialog" aria-controls="navigation">Menu <img src="assets/ac0e5.svg" alt=""></button><span class="track"><span id="progress" class="hud-copy">SCROLL 0%</span><span class="hud-copy">LOTUS CARS</span></span><button class="to-top" aria-label="맨 위로 이동"><img src="assets/70e18.svg" alt=""></button></div></header><dialog id="navigation"><button class="close" aria-label="메뉴 닫기">×</button><p class="eyebrow">FOR THE DRIVERS</p><h2>EXPLORE LOTUS</h2><nav><a href="#story">THE LOTUS STORY</a><a href="#engineering">ENGINEERING</a><a href="#lineup">THE LOTUS LINEUP</a><a href="#build">BUILD YOUR LOTUS</a><a href="#updates">LATEST UPDATES</a><a href="#faq">FAQ</a></nav></dialog><dialog id="detail"><button class="close" aria-label="창 닫기">×</button><div class="dialog-content"></div></dialog>`);
const sections={'432:538':'home','432:567':'story','432:577':'engineering','805:1087':'lineup','432:603':'build','432:634':'updates','432:649':'faq','432:657':'contact'};
for(const [node,id] of Object.entries(sections)){const el=$(node);el.id=id;el.setAttribute('aria-label',el.dataset.name);}
const nav=document.querySelector('#navigation'),detail=document.querySelector('#detail');
document.querySelector('.menu-trigger').onclick=()=>nav.showModal();
document.querySelector('.to-top').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}})});
nav.querySelectorAll('a').forEach(a=>a.onclick=()=>nav.close());
function interactive(el,label,fn){if(!el)return;el.classList.add('interactive');el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',label);el.addEventListener('click',fn);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();}})}
function show(title,body){detail.querySelector('.dialog-content').innerHTML=`<p class="eyebrow">LOTUS CARS</p><h2>${title}</h2>${body}`;detail.showModal();}
interactive($('432:570'),'Lotus 브랜드 스토리 자세히 보기',()=>show('THE LOTUS STORY','<p>70여년 간 Lotus는 업계를 선도하였습니다. Lotus는 남다른 과감한 운영 방식으로 혁신과 성취에 있어 새로운 표준을 설정했습니다.</p><p style="margin-top:20px">79 GRAND PRIX WINS · 7 CONSTRUCTORS’ TITLES · 6 WORLD DRIVERS’ CHAMPIONS</p><a class="action" href="https://www.lotuscars.com/" target="_blank" rel="noopener noreferrer">DISCOVER LOTUS ↗</a>'));
document.querySelectorAll('[data-name*="엔지니어링"][data-name*="버튼"]').forEach(el=>interactive(el,'Lotus Engineering 알아보기',()=>show('ENGINEERING BEYOND AUTOMOTIVE','<p>Lotus Engineering은 40년 이상 세계적인 자동차 제조사에 기술을 제공해왔습니다. 차량 동역학과 경량 설계에서 출발한 기술력은 전기차, 항공우주 그리고 올림픽 사이클까지 확장되고 있습니다.</p><a class="action" href="https://www.lotusengineering.com/" target="_blank" rel="noopener noreferrer">LOTUS ENGINEERING ↗</a>')));
const answers=['페이지 하단의 FIND A LOTUS CENTRE를 선택하면 Lotus 공식 사이트에서 전시장 안내를 확인하실 수 있습니다.','아래 전시장·시승 바로가기의 BOOK A TEST DRIVE를 통해 공식 사이트의 시승 안내를 확인하실 수 있습니다.','나만의 LOTUS 구성에서 차체 색상, 휠, 브레이크 캘리퍼, 외장 트림, 루프를 선택해 보세요. 상세 사양과 주문 가능 여부는 공식 전시장에 문의해 주세요.','보증 및 긴급출동 서비스의 정확한 적용 범위와 연락처는 Lotus 공식 사이트 또는 담당 전시장에서 확인하실 수 있습니다.'];
const faqRows=['432:651','432:652','432:653','432:654'].map($).filter(Boolean);let openFaq=-1;
faqRows.forEach((el,i)=>{const answer=document.createElement('p');answer.className='faq-answer';answer.id=`faq-answer-${i}`;answer.textContent=answers[i];answer.hidden=true;el.append(answer);el.setAttribute('aria-controls',answer.id);el.setAttribute('aria-expanded','false');interactive(el,el.querySelector('p').textContent,()=>{openFaq=openFaq===i?-1:i;faqRows.forEach((row,j)=>{const opened=j===openFaq;row.classList.toggle('faq-open',opened);row.style.height=opened?'156px':'74px';row.style.top=`${323+j*82+(openFaq>=0&&j>openFaq?82:0)}px`;row.setAttribute('aria-expanded',String(opened));row.querySelector('.faq-answer').hidden=!opened;});$('432:649').style.height=openFaq>=0?'864px':'782px';});});
const options=[['차체 색상',['Solar Yellow','Hethel Yellow','Shadow Grey','Seneca Blue']],['휠',['20인치 실버','20인치 블랙']],['브레이크 캘리퍼',['블랙','레드','옐로']],['외장 트림',['기본 트림','블랙 팩']],['루프',['차체 색상','블랙 루프']]];const selections={};
const note=document.createElement('p');note.className='selection-note';note.textContent='';$('432:603').append(note);
['432:608','432:613','432:618','432:623','432:628'].forEach((id,i)=>interactive($(id),`${options[i][0]} 선택`,()=>{const [label,choices]=options[i];if(!$(id).dispatchEvent(new CustomEvent('custom-part-select',{bubbles:true,cancelable:true,detail:{index:i,label,choices}})))return;show(label,`<p>원하는 ${label} 옵션을 선택하세요.</p><div class="choices">${choices.map(v=>`<button aria-pressed="${selections[label]===v}" data-choice="${v}">${v}</button>`).join('')}</div><p>구성 선택을 위한 미리보기입니다. 실제 주문 가능 사양은 전시장에서 확인해 주세요.</p>`);detail.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{selections[label]=btn.dataset.choice;detail.querySelectorAll('[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));$(id).classList.add('selected-option');note.textContent=Object.entries(selections).map(([k,v])=>`${k}: ${v}`).join(' · ');});}));
document.querySelectorAll('[data-name^="뉴스 카드"],[data-name^="대표 뉴스 카드"]').forEach(el=>interactive(el,'뉴스 자세히 보기',()=>{const title=[...el.querySelectorAll('p')].map(p=>p.textContent).filter(t=>/[가-힣]/.test(t)).join(' ');const img=el.querySelector('img:is([src$=".png"],[src$=".webp"])');show(title,`${img?`<img class="news-image" src="${img.getAttribute('src')}" alt="">`:''}<p>Lotus의 디자인, 기술, 모터스포츠에 관한 더 많은 이야기를 공식 사이트에서 만나보세요.</p><a class="action" href="https://www.lotuscars.com/" target="_blank" rel="noopener noreferrer">LOTUS 최신 소식 ↗</a>`)}));
document.querySelectorAll('[data-name^="링크 ·"],[data-name="전시장 찾기 링크"],[data-name="시승 예약 링크"]').forEach(el=>interactive(el,el.textContent.trim(),()=>show(el.textContent.trim(),'<p>Lotus 공식 사이트에서 가까운 전시장, 상담 및 시승 안내를 확인해 주세요.</p><a class="action" href="https://www.lotuscars.com/ko-KR" target="_blank" rel="noopener noreferrer">LOTUS KOREA ↗</a>')));
const social=[['432:675','Instagram','https://www.instagram.com/lotuscars/'],['432:678','YouTube','https://www.youtube.com/@lotuscars'],['432:681','LinkedIn','https://www.linkedin.com/company/lotus/']];social.forEach(([id,name,url])=>{const el=$(id);el.setAttribute('role','link');interactive(el,name,()=>window.open(url,'_blank','noopener,noreferrer'));});
interactive($('432:648'),'Lotus 최신 소식 더 보기',()=>show('LATEST UPDATES','<p>Lotus의 최신 소식과 브랜드 스토리를 공식 사이트에서 확인하세요.</p><a class="action" href="https://www.lotuscars.com/" target="_blank" rel="noopener noreferrer">DISCOVER MORE ↗</a>'));
interactive($('432:674'),'Cookies Policy',()=>show('Cookies Policy','<p>이 쇼케이스는 분석용 쿠키를 사용하지 않습니다. 외부 Lotus 사이트로 이동하면 해당 사이트의 쿠키 정책이 적용됩니다.</p>'));
document.querySelectorAll('#lotus img').forEach(img=>{if(!img.alt){const container=img.closest('[data-name]');const name=container?.dataset.name||'';if(/갤러리|썸네일|생산|엔지니어링 이미지|구성 차량/.test(name))img.alt=name;}img.decoding='async';});
const progressLabel=document.querySelector('#progress');
let lastProgress=-1;
let ticking=false;
addEventListener('scroll',()=>{
  if(ticking)return;
  ticking=true;
  requestAnimationFrame(()=>{
    const ratio=scrollY/Math.max(1,root.scrollHeight-innerHeight);
    const percent=Math.round(Math.max(0,Math.min(1,ratio))*100);
    if(percent!==lastProgress){
      const activeCopy=copyAnimations.get(progressLabel);
      if(activeCopy)finishCopy(progressLabel,activeCopy);
      progressLabel.textContent=`SCROLL ${percent}%`;
      lastProgress=percent;
    }
    ticking=false;
  });
},{passive:true});

// Reveal small copy with the reference's advancing chevrons, without changing layout.
const heritage=$('432:552');
const heritageLine=$('432:553');
const heritagePoints=[
  ['432:554','432:559','432:558'],
  ['432:555','432:560','432:563'],
  ['432:557','432:561','432:564'],
  ['432:556','432:562','432:565']
].map(([point,...labels])=>({point:$(point),labels:labels.map($)}));
const heritageDelays=new Map();
const heritageDuration=1600;
heritage.classList.add('heritage-motion');
heritagePoints.forEach(({point,labels})=>{
  // Reveal each point when the line advancing from the left reaches it.
  const lineLeft=(heritage.clientWidth-heritageLine.offsetWidth)/2;
  const distance=point.offsetLeft+point.offsetWidth/2-lineLeft;
  const delay=180+distance/heritageLine.offsetWidth*heritageDuration;
  point.classList.add('heritage-point');
  point.style.setProperty('--point-delay',`${delay}ms`);
  labels.forEach(label=>label.querySelectorAll('p').forEach(p=>heritageDelays.set(p,delay)));
});
let heritageStarted=false;
function revealHeritage(){
  if(heritageStarted)return;
  heritageStarted=true;
  heritage.classList.add('heritage-visible');
  const now=performance.now();
  heritageDelays.forEach((delay,el)=>{
    const state=copyAnimations.get(el);
    if(state)state.start=now+delay;
  });
  scheduleCopyFrame();
  heritageObserver.disconnect();
}
const heritageObserver=new IntersectionObserver(entries=>{
  if(entries.some(entry=>entry.isIntersecting))revealHeritage();
},{rootMargin:'0px 0px -100px 0px',threshold:.5});
const copyAnimations=new Map();
const copyObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const state=copyAnimations.get(entry.target);
    if(state&&state.start===null&&!heritageDelays.has(entry.target))state.start=performance.now()+180;
  });
  scheduleCopyFrame();
},{threshold:.15});
let copyFrame=0;
function scheduleCopyFrame(){if(!copyFrame)copyFrame=requestAnimationFrame(updateCopy);}
function finishCopy(el,state){
  el.textContent=state.text;
  el.classList.remove('copy-reveal');
  if(state.label===null)el.removeAttribute('aria-label');else el.setAttribute('aria-label',state.label);
  copyObserver.unobserve(el);
  copyAnimations.delete(el);
}
function updateCopy(now){
  copyFrame=0;
  let running=false;
  copyAnimations.forEach((state,el)=>{
    if(reducedMotion.matches){finishCopy(el,state);return;}
    if(state.start===null)return;
    running=true;
    if(now<state.start)return;
    const progress=Math.max(0,(now-state.start)/state.duration);
    if(progress>=1){finishCopy(el,state);return;}
    state.characters.forEach((span,index)=>{
      const position=index/Math.max(1,state.characters.length-1);
      const visible=progress>0&&position<progress*1.5;
      const settled=position<progress*1.5-.45;
      const opacity=visible?'1':'0';
      const glyph=settled?span.textContent:(/\s/u.test(span.textContent)?span.textContent:'>');
      if(span.style.opacity!==opacity)span.style.opacity=opacity;
      if(span.dataset.glyph!==glyph)span.dataset.glyph=glyph;
    });
  });
  if(running)scheduleCopyFrame();
}
function prepareCopyReveal(el,start=null){
    const active=copyAnimations.get(el);
    if(active)finishCopy(el,active);
    if(reducedMotion.matches)return;
    const text=el.textContent;
    const label=el.getAttribute('aria-label');
    el.setAttribute('aria-label',text);
    el.classList.add('copy-reveal');
    el.style.setProperty('--copy-color',getComputedStyle(el).color);
    const characters=Array.from(text,character=>{
      const span=document.createElement('span');
      span.className='copy-character';
      span.textContent=character;
      span.setAttribute('aria-hidden','true');
      span.dataset.glyph=character;
      return span;
    });
    el.replaceChildren(...characters);
    copyAnimations.set(el,{text,label,characters,start,duration:Math.min(1800,850+characters.length*12)});
    copyObserver.observe(el);
    if(start!==null)scheduleCopyFrame();
}
if(!reducedMotion.matches){
  const copyPreparationObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      prepareCopyReveal(entry.target);
      copyPreparationObserver.unobserve(entry.target);
    });
  },{rootMargin:'200px'});
  document.querySelectorAll('#lotus p, .dashboard .hud-copy').forEach(el=>{
    const size=parseFloat(getComputedStyle(el).fontSize);
    if(size>16||!el.textContent.trim()||el.hidden||el.closest('.hero-motion, .faq-answer, .selection-note, [data-node-id="432:583"]'))return;
    if(el===progressLabel)return;
    if(heritageDelays.has(el))prepareCopyReveal(el);
    else copyPreparationObserver.observe(el);
  });
}
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)scheduleCopyFrame();});
heritageObserver.observe($('432:555'));
