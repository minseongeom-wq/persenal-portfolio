import React,{useEffect,useLayoutEffect,useRef} from 'react';

const projects=[
 {name:'Nintendo - Team',caption:'001_Nintendo-Team',base:'4e748.png',hover:'4bc4d.png',node:'919:1423'},
 {name:'WorldwideWorld',caption:'002_WorldWideWorld',base:'fa561.png',hover:'a20c5.png',node:'919:1710'},
 {name:'Lotus Korea',caption:'003_Lotus Korea',base:'b46bb.png',hover:'c2c45.png',node:'943:2390'},
 {name:'Men I Trust',caption:'004_Men I Trust',base:'e9082.png',hover:'c3f3e.png',node:'943:2397'},
];
export default function ProjectGallery(){
 const ref=useRef(null);
 useLayoutEffect(()=>{
  const section=ref.current.closest('[data-name="Section / Selected Projects"]');
  const resize=()=>{
   const scale=section.getBoundingClientRect().width/section.offsetWidth;
   section.style.setProperty('--project-viewport-height',`${innerHeight/scale}px`);
  };
  resize();window.addEventListener('resize',resize);
  const observer=new ResizeObserver(resize);observer.observe(section);
  return()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[]);
 useEffect(()=>{
  const visible=new Map();
  const observer=new IntersectionObserver(entries=>{
   // Observer callbacks contain changed cards only, not every visible card.
   for(const entry of entries){if(entry.isIntersecting)visible.set(entry.target,entry);else visible.delete(entry.target);}
   const active=[...visible.values()].sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
   const beforeGallery=ref.current.getBoundingClientRect().top>innerHeight*.6&&ref.current.closest('section,[data-name="Section / Selected Projects"]').getBoundingClientRect().top<innerHeight;
   if(!active&&!beforeGallery)return;
   const index=active?Number(active.target.dataset.projectIndex):0;
   const counter=document.querySelector('[data-node-id="919:893"]');
   if(counter)counter.textContent=String(index+1).padStart(2,'0');
   document.querySelectorAll('[data-project-link]').forEach(link=>{
    const selected=Number(link.dataset.projectLink)===index;
    link.setAttribute('aria-pressed',String(selected));link.classList.toggle('selected',selected);
   });
  },{rootMargin:'-40% 0px -40% 0px',threshold:0});
  ref.current.querySelectorAll('[data-project-index]').forEach(card=>observer.observe(card));
  return()=>observer.disconnect();
 },[]);
 return <div ref={ref} className="project-gallery" data-node-id="919:895" data-name="Project Preview / Primary">
  {projects.map((project,index)=><figure key={project.node} className="project-gallery__card" data-project-index={index} tabIndex={0} aria-label={`${project.name} 미리보기`}>
   <div className="project-gallery__image" data-node-id={project.node}>
    <img className="project-gallery__base" src={`./assets/${project.base}`} alt={`${project.name} 프로젝트`} loading={index?'lazy':'eager'} decoding="async" />
    <img className="project-gallery__color" src={`./assets/${project.hover}`} alt="" aria-hidden="true" loading={index?'lazy':'eager'} decoding="async" />
   </div>
   <figcaption>{project.caption}</figcaption>
  </figure>)}
 </div>;
}
