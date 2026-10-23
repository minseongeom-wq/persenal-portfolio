import { useLayoutEffect, useRef, useState } from 'react';
import { generatePath, Link } from 'react-router-dom';
import { routePaths } from '../../../routes/routePaths.js';

const asset = name => `${import.meta.env.BASE_URL}images/common/${name}`;
function CharacterIcon({ slug }) {
  return <span className={`dropdown__icon dropdown__icon--${slug}`} aria-hidden="true">
    <span className="dropdown__silhouette">
      {slug === 'mario' && <><img src={asset('4124c.svg')} alt="" /><img src={asset('6daa2.svg')} alt="" /><img src={asset('c04f0.svg')} alt="" /><img src={asset('25b35.svg')} alt="" /></>}
      {slug === 'zelda' && <><img src={asset('c975d.svg')} alt="" /><img src={asset('7fdbf.svg')} alt="" /><img src={asset('8fcef.svg')} alt="" /></>}
      {slug === 'splatoon' && <><span className="dropdown__squid" /><img src={asset('6133e.svg')} alt="" /></>}
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
