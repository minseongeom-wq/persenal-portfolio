import { useLayoutEffect, useRef, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { routePaths } from '../../../routes/routePaths.js';

const asset = name => `${import.meta.env.BASE_URL}images/common/${name}`;
function MarioFace() {
  return <svg preserveAspectRatio="none" className="dropdown__mario-face" width="32.3324" height="24.3872" viewBox="0 0 32.3324 24.3872" fill="none" overflow="visible" focusable="false">
    <path d="M1.14414 11.0762C2.34414 13.4762 5.64414 14.0762 7.14414 14.0762C6.74383 17.2755 8.64427 19.4098 9.64453 20.0771C9.64453 21.5771 15.6445 22.5771 20.1445 21.5771C23.7445 20.7771 25.3112 16.2432 25.6445 14.0762C27.6445 14.0762 30.4779 12.0762 31.6445 11.0762C33.6445 16.276 30.8112 18.5763 29.1445 19.0765C28.3445 22.6765 24.8112 22.5765 23.1445 22.0765C21.5445 25.2765 17.8112 24.4098 16.1445 23.5765H15.6445C12.0445 25.5765 9.8112 23.4098 9.14453 22.0765C5.94453 23.6765 3.47761 20.4096 2.64414 18.5762C-0.855857 19.0762 -0.355857 8.07621 1.14414 11.0762Z" fill="white"/>
    <g className="dropdown__gaze">
      <path d="M4.14453 9.57647C4.14453 11.9765 6.47786 12.5765 7.64453 12.5765C8.44453 9.37599 11.3112 8.24294 12.6445 8.07647C12.8112 4.90981 12.3555 -0.501973 8.5 0.0374748C3.33021 0.76082 4.14453 6.57647 4.14453 9.57647Z" fill="white"/>
      <path d="M25.5 0.538017C20.1445 -0.202552 19.6445 5.24334 20.1445 8.07647C22.1445 7.67599 24.3112 10.91 25.1445 12.5771C25.4779 12.9104 26.3445 13.1771 27.1445 11.5771C28.1445 9.57708 28.1445 9.07708 28.1445 5.07708C28.1445 1.87708 26.3333 0.704684 25.5 0.538017Z" fill="white"/>
    </g>
  </svg>;
}

function CharacterIcon({ slug }) {
  return <span className={`dropdown__icon dropdown__icon--${slug}`} aria-hidden="true">
    <span className="dropdown__silhouette">
      {slug === 'mario' && <><img src={asset('4124c.svg')} alt="" /><MarioFace /><img src={asset('c04f0.svg')} alt="" /><img src={asset('25b35.svg')} alt="" /></>}
      {slug === 'zelda' && <><img src={asset('c975d.svg')} alt="" /><img className="dropdown__gaze" src={asset('7fdbf.svg')} alt="" /><img className="dropdown__gaze" src={asset('8fcef.svg')} alt="" /></>}
      {slug === 'splatoon' && <><span className="dropdown__squid" /><img className="dropdown__gaze" src={asset('6133e.svg')} alt="" /></>}
    </span>
    <img className="dropdown__portrait" src={asset({ mario: '61c06.png', zelda: '9bb38.png', splatoon: 'fbfae.png' }[slug])} alt="" />
  </span>;
}

export default function DropdownMenu({ onNavigate, isClosing = false }) {
  const container = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const update = () => setScale(container.current.clientWidth / (window.innerWidth < 1024 ? 334 : 1762));
    const observer = new ResizeObserver(update);
    observer.observe(container.current);
    update();
    return () => observer.disconnect();
  }, []);
  return <nav id="main-menu" aria-label="주 메뉴" className="dropdown" ref={container} inert={isClosing} onClick={event => { if (event.target.closest('a')) onNavigate(); }}>
    <div className="dropdown__grid" style={{ zoom: scale }}>
      <section className="dropdown__panel dropdown__characters" aria-label="IP">
        <div className="dropdown__character-white" />
        <div className="dropdown__ip-links">
          {['mario', 'zelda', 'splatoon'].map(slug => <Link key={slug} to={generatePath(routePaths.ipDetail, { slug })}>
            {slug[0].toUpperCase() + slug.slice(1)}<CharacterIcon slug={slug} />
          </Link>)}
        </div>
        <div className="dropdown__decoration" aria-hidden="true"><img src={asset('9feba.svg')} alt="" /><img src={asset('2eec7.svg')} alt="" /><img src={asset('8a581.svg')} alt="" /></div>
        <Link className="dropdown__quote" to={routePaths.history} aria-label="There's no play like it. — History"><span className="dropdown__quote-desktop">There's no<br />play like it.</span><span className="dropdown__quote-mobile">There's<br />no play<br />like it.</span></Link>
        <img className="dropdown__pixel-mario" src={asset('f73ad.png')} width="58" height="62" alt="" />
        <img className="dropdown__line-desktop" src={asset('98bc2.svg')} alt="" />
        <img className="dropdown__line-mobile-left" src={asset('bb1e7.svg')} alt="" />
        <img className="dropdown__line-mobile-right" src={asset('d121d.svg')} alt="" />
        <Link className="dropdown__history" to={routePaths.history} aria-label="브랜드 / 역사">닌텐도의 역사 <picture><source media="(max-width: 1023px)" srcSet={asset('ae937.svg')} /><img src={asset('fbdb4.svg')} alt="" /></picture></Link>
      </section>
      <Link to={routePaths.community} className="dropdown__panel dropdown__community" aria-label="Community">
        <span className="dropdown__label">Community</span>
        <picture><source media="(max-width: 1023px)" srcSet={asset('be010.svg')} /><img className="dropdown__question" src={asset('46991.svg')} alt="" /></picture>
        <span className="dropdown__community-title">오늘은 어떤게임을<br />플레이 해볼까요?</span>
      </Link>
      <Link to={routePaths.store} className="dropdown__panel dropdown__store" aria-label="E-shop">
        <span className="dropdown__label">Nintendo Store</span>
        <img className="dropdown__bag" src={asset('ae2bb.png')} alt="" />
        <span className="dropdown__store-title">Store</span>
        <span className="dropdown__buy">게임 구매하기 <picture><source media="(max-width: 1023px)" srcSet={asset('9abb5.svg')} /><img src={asset('fbdb4.svg')} alt="" /></picture></span>
      </Link>
      <section className="dropdown__panel dropdown__nintendo" aria-label="Nintendo">
        <span className="dropdown__label">Nintendo</span>
        <picture><source media="(max-width: 1023px)" srcSet={asset('c2237.svg')} /><img className="dropdown__switch" src={asset('33392.svg')} alt="" /></picture>
        <div className="dropdown__nintendo-links">
          <Link to={`${routePaths.productList}?category=${encodeURIComponent('Switch Online')}`} aria-label="Nintendo Switch">Switch 2</Link>
          <Link to={routePaths.login} aria-label="마이페이지">My Page</Link>
          <Link to={routePaths.support} aria-label="고객지원">Support</Link>
        </div>
      </section>
    </div>
  </nav>;
}
