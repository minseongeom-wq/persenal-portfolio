import React, {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

const sectionLabels=['Intro','About','Work','Contribution','Development','Skill','Playground','Philosophy','Contact'];
const sectionTargets=['home','about','work','contribution','development','skills','playground','philosophy','contact'];

export default function Navigation(){
  const [open,setOpen]=useState(false);
  const [section,setSection]=useState(0);
  const [labelVisible,setLabelVisible]=useState(false);
  const [overlapping,setOverlapping]=useState(false);
  const labelRef=useRef(null);
  useEffect(()=>{
    const sections=[...document.querySelectorAll('#root [data-name^="Section /"]')];
    const content=[...document.querySelectorAll('#root p,#root img,#root svg,#root h1,#root h2,#root h3,#root h4,#root h5,#root h6')];
    let current=-1,frame=0,timer=0;
    const update=()=>{
      frame=0;
      const label=labelRef.current?.getBoundingClientRect();
      if(label)setOverlapping(content.some(element=>{
        const rect=element.getBoundingClientRect();
        if(!rect.width||!rect.height||rect.right<=label.left||rect.left>=label.right||rect.bottom<=label.top||rect.top>=label.bottom)return false;
        const style=getComputedStyle(element);
        return style.visibility==='visible'&&style.display!=='none'&&Number(style.opacity)>0;
      }));
      let next=0;
      sections.forEach((element,index)=>{if(element.getBoundingClientRect().top<=innerHeight*.45)next=index;});
      if(window.scrollY>0&&window.scrollY+innerHeight>=document.documentElement.scrollHeight-2)next=sections.length-1;
      if(next===current)return;
      current=next;setSection(next);setLabelVisible(true);
      clearTimeout(timer);
      timer=setTimeout(()=>setLabelVisible(false),1600);
      // Recheck overlap with the newly rendered section name's width.
      frame=requestAnimationFrame(update);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    schedule();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    return()=>{cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[]);
  return createPortal(
    <nav className="portfolio-navigation" data-node-id="933:2369" data-name="Navigation / Main" aria-label="주요 메뉴" data-open={open} data-label-visible={labelVisible} data-section={sectionTargets[section]} data-overlapping={overlapping}
      onPointerEnter={event=>{if(event.pointerType!=='touch')setOpen(true);}}
      onPointerMove={event=>{if(!open&&event.pointerType!=='touch')setOpen(true);}}
      onPointerLeave={event=>{if(!event.currentTarget.contains(document.activeElement))setOpen(false);}}
      onFocus={()=>setOpen(true)}
      onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}
      onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);event.target.blur();}}}>
      <button className="portfolio-navigation__logo" type="button" aria-label="메뉴 펼치기" aria-expanded={open} aria-controls="portfolio-navigation-items" onClick={()=>setOpen(true)}>
        <span className="portfolio-navigation__logo-rotation">
          <span className="portfolio-navigation__logo-crop">
            <img src="./assets/e51b5.png" alt="MS" width="32" height="18" />
          </span>
        </span>
      </button>
      <a ref={labelRef} className="portfolio-navigation__primary portfolio-navigation__default" href={`#${sectionTargets[section]}`} tabIndex={!open&&labelVisible?0:-1} aria-hidden={open||!labelVisible}>{sectionLabels[section]}</a>
      <div id="portfolio-navigation-items" className="portfolio-navigation__items">
        {sectionTargets.map((target,index)=>{
          const offset=((index-section+13)%9)-4;
          const nearby=Math.abs(offset)<=2;
          return <div key={target} className="portfolio-navigation__track" style={{'--menu-angle':`${offset*26}deg`}} data-nearby={nearby} data-selected={index===section}>
            <a className="portfolio-navigation__item" href={`#${target}`} tabIndex={open&&nearby?0:-1} aria-hidden={!open||!nearby} aria-current={index===section?'location':undefined}>{sectionLabels[index]}</a>
          </div>;
        })}
      </div>
    </nav>,document.body
  );
}
