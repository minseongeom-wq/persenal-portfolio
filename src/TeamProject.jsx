import React from 'react';

const proposal='https://www.figma.com/proto/e0m4kzzInBhdHR8Hrp5jPN/Nintendo-%EC%9B%B9%EC%82%AC%EC%9D%B4%ED%8A%B8-%EB%A6%AC%EB%89%B4%EC%96%BC-%ED%8C%80%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8?node-id=4116-5451&viewport=2448%2C448%2C0.11&t=yu5jlKKoWRY7ExbI-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=4116%3A5451&page-id=3538%3A15780';
function ProjectLink({href,children}){
 return <a href={href} target="_blank" rel="noopener noreferrer">{children}<img src="./assets/46f35.svg" width="16" height="16" alt="" /></a>;
}
export default function TeamProject(){
 return <section className="team-project" data-name="Section / Team Project" data-node-id="1093:1131" aria-labelledby="team-project-title">
  <h2 id="team-project-title" className="team-project__heading" data-node-id="1093:1144">Team<br/>Project</h2>
  <div className="team-project__body">
   <a className="team-project__image project-gallery__image" data-node-id="1093:1158" href="https://mbc-teamproject-red.vercel.app/" target="_blank" rel="noopener noreferrer" aria-label="Nintendo 팀프로젝트 사이트 새 탭에서 열기"><img className="project-gallery__base" src="./assets/4e748.png" alt="Nintendo 웹사이트 리뉴얼 프로젝트" loading="lazy" /><img className="project-gallery__color" src="./assets/4bc4d.png" alt="" aria-hidden="true" loading="lazy" decoding="async" /></a>
   <div className="team-project__content">
    <p className="team-project__label" data-node-id="1093:1135">/ Nintendo renewal / Team project</p>
    <h3 data-node-id="1093:1137">Nintendo - Web renewal</h3>
    <p className="team-project__date" data-node-id="1093:1136">2026 .09.01 ~ 2026 .09.30</p>
    <p className="team-project__description" data-node-id="1093:1146">Nintendo가 가진 다양한 IP와 세계관의 매력을 효과적으로 전달하기 위해 기획한 프로젝트입니다.<br/>캐릭터와 게임을 중심으로 한 비주얼 경험과 인터랙션을 통해 사용자가 자연스럽게 콘텐츠를 탐색할 수 있도록 웹사이트를 리뉴얼했습니다.</p>
    <h3 className="team-project__contribution" data-node-id="1093:1147">My contribution</h3>
    <ul className="team-project__roles">
     <li data-node-id="1093:1149">메인 페이지 디자인</li>
     <li data-node-id="1093:1152">공통 스타일과 간격 정리</li>
     <li data-node-id="1093:1150">담당페이지 디자인 및 구현</li>
     <li data-node-id="1093:1153">인터랙션 구현 · Git 브랜치 관리 · Merge 및 충돌 조율</li>
     <li data-node-id="1093:1151">팀원과 진행 상황 공유</li>
    </ul>
    <div className="team-project__links"><ProjectLink href="https://mbc-teamproject-red.vercel.app/">Website</ProjectLink><ProjectLink href={proposal}>Proposal</ProjectLink></div>
   </div>
  </div>
 </section>;
}
