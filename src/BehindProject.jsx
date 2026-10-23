import React,{useEffect,useRef} from 'react';

const images=[
 {node:'1095:632',width:782,alt:'팀원들과 노트북을 보며 프로젝트 방향을 논의하는 모습'},
 {node:'1104:263',width:784,alt:'테이블에 둘러앉아 디자인과 구현을 함께 검토하는 모습'},
 {node:'1104:271',width:782,alt:'프로젝트의 화면 구성과 흐름을 정리한 협업 보드'},
 {node:'1104:282',width:782,alt:'사용자 여정과 단계별 경험을 정리한 유저 저니 맵'},
];

export default function BehindProject(){
 const sectionRef=useRef(null);
 useEffect(()=>{
  const section=sectionRef.current;
  const stage=section.querySelector('.behind-project__stage');
  const gallery=section.querySelector('.behind-project__gallery');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,lastTime=0;
  const measure=()=>{
   const scale=section.getBoundingClientRect().width/section.offsetWidth;
   section.style.setProperty('--behind-viewport',`${innerHeight/scale}px`);
   section.style.setProperty('--behind-travel',`${Math.max(0,gallery.scrollWidth-gallery.clientWidth)}px`);
   section.style.setProperty('--behind-stage-height',`${stage.offsetHeight}px`);
  };
  const update=now=>{
   frame=0;
   const rect=section.getBoundingClientRect();
   const scale=rect.width/section.offsetWidth;
   const distance=rect.height-stage.offsetHeight*scale;
   const progress=distance>0?Math.max(0,Math.min(1,-rect.top/distance)):0;
   const target=progress*(gallery.scrollWidth-gallery.clientWidth);
   const dt=Math.min(64,Math.max(1,now-lastTime));
   lastTime=now;
   const difference=target-gallery.scrollLeft;
   if(reduced.matches||rect.bottom<=0||rect.top>=innerHeight||Math.abs(difference)<2){
    gallery.scrollLeft=target;
    return;
   }
   gallery.scrollLeft+=difference*(1-Math.exp(-dt/110));
   frame=requestAnimationFrame(update);
  };
  const schedule=()=>{if(!frame){lastTime=performance.now();frame=requestAnimationFrame(update);}};
  const resize=()=>{measure();schedule();};
  // Keep vertical wheel input on the document even over the horizontal viewport.
  const wheel=event=>{
   if(event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented||!event.cancelable||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
   event.preventDefault();
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
   window.scrollBy({top:delta,behavior:'instant'});
  };
  const observer=new ResizeObserver(resize);
  observer.observe(stage);observer.observe(gallery);
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',resize);
  gallery.addEventListener('wheel',wheel,{passive:false});
  reduced.addEventListener('change',schedule);
  resize();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);gallery.removeEventListener('wheel',wheel);reduced.removeEventListener('change',schedule);};
 },[]);
 return <section ref={sectionRef} className="behind-project" data-name="Section / Behind The Project" data-node-id="1095:620" aria-labelledby="behind-project-title">
  <svg className="behind-project__filters" width="0" height="0" aria-hidden="true" focusable="false">
   <defs><filter id="behind-project-blue" colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" />
    <feComponentTransfer><feFuncR type="linear" slope=".812" intercept=".149" /><feFuncG type="linear" slope=".722" intercept=".239" /><feFuncB type="linear" slope=".035" intercept=".941" /></feComponentTransfer>
   </filter></defs>
  </svg>
  <div className="behind-project__stage">
  <div className="behind-project__gallery" role="region" aria-label="팀 협업 사진과 작업 자료. 아래로 스크롤하거나 옆으로 넘겨 네 장을 확인하세요." tabIndex={0}>
   {images.map((image,index)=><figure className="behind-project__figure" key={image.node}>
    <div className="behind-project__image project-gallery__image" tabIndex={0} aria-label={`Teamwork_${index+1}: 포커스하면 원본 이미지 표시`}>
    <img src={`./assets/teamwork-${index+1}.png`} width={image.width} height="480" alt={image.alt} data-node-id={image.node} loading="lazy" decoding="async" />
    </div>
    <figcaption>Teamwork_{index+1}</figcaption>
   </figure>)}
  </div>
  <div className="behind-project__content" data-node-id="1104:261">
   <p className="behind-project__label" data-node-id="1095:621">/ Behind The Project — 2026</p>
   <h2 id="behind-project-title" data-node-id="1095:623">Made Together.</h2>
   <p className="behind-project__date" data-node-id="1095:622">2026 .09.01 ~ 2026 .09.30</p>
   <p className="behind-project__description" data-node-id="1095:625">서로 다른 시선이 하나의 결과물이 되기까지.<br/>각자의 아이디어를 나누고, 고민하고, 조율하며 하나의 웹사이트를 완성했습니다.<br/>혼자였다면 발견하지 못했을 가능성을 함께 찾아간 시간이었습니다.</p>
  </div>
  </div>
 </section>;
}
