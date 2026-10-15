import React,{useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import LoopVideo from './LoopVideo.jsx';
import {createProjectCurl} from './project-curl.js';

// Isolated image/video fixture: existing portfolio videos are never replaced.
function CurlTest(){
 const root=useRef(null);
 useEffect(()=>{
  let raf=0,disposed=false;
  const wake=()=>{if(!raf&&!disposed)raf=requestAnimationFrame(render);};
  const controllers=[...root.current.querySelectorAll('.project-gallery__image')].map(media=>createProjectCurl(media,{requestFrame:wake}));
  function render(now){raf=0;let active=false;for(const controller of controllers)active=controller.frame(now)||active;if(active)wake();}
  return()=>{disposed=true;cancelAnimationFrame(raf);controllers.forEach(controller=>controller.dispose());};
 },[]);
 return <div ref={root}>
  <h1>Scroll Curl — image / video test</h1>
  <p>스크롤 속도를 바꾸고 방향을 전환해 보세요. 멈추면 원본으로 돌아옵니다.</p>
  <div className="test-spacer" />
  <figure data-test-media="image"><div className="project-gallery__image">
   <img className="project-gallery__base" src="./assets/4e748.png" alt="Nintendo 프로젝트" />
  </div><figcaption>Image — Nintendo / 원본 Raster 유지</figcaption></figure>
  <div className="test-spacer" />
  <figure data-test-media="video"><div className="project-gallery__image">
   <LoopVideo src="./assets/video-1.mp4" label="기존 영상 Curl 테스트" variant="curl-test" />
  </div><figcaption>Video — 기존 영상 파일 / 화면 안에서만 재생</figcaption></figure>
  <div className="test-spacer" />
 </div>;
}
createRoot(document.getElementById('root')).render(<CurlTest/>);
