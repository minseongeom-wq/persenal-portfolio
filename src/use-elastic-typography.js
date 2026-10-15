import {useLayoutEffect} from 'react';
import {createElasticTypography} from './elastic-typography.js';
import {initHeroEntrance} from './hero-entrance.js';
const TITLES='[data-node-id="919:872"] p,[data-node-id="919:892"] p,[data-node-id="919:1338"] p,[data-node-id="919:966"] p,[data-node-id="924:2269"] p,[data-node-id="924:2236"] p';
/** Reusable contour effect attached to native text without replacing its markup. */
export function useElasticTypography(selector=TITLES){
 useLayoutEffect(()=>{const stopEntrance=initHeroEntrance();const titles=[...document.querySelectorAll(selector)];titles.forEach(t=>t.classList.add('ghost-title'));const controllers=titles.map(createElasticTypography);return()=>{stopEntrance();controllers.forEach(c=>c.dispose());};},[selector]);
}
