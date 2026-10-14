import {useLayoutEffect} from 'react';
import {createElasticTypography} from './elastic-typography.js';
const TITLES='[data-node-id="919:872"] p,[data-node-id="919:892"] p,[data-node-id="919:1338"] p,[data-node-id="919:966"] p';
/** Reusable contour effect attached to native text without replacing its markup. */
export function useElasticTypography(selector=TITLES){
 useLayoutEffect(()=>{const titles=[...document.querySelectorAll(selector)];titles.forEach(t=>t.classList.add('ghost-title'));const controllers=titles.map(createElasticTypography);return()=>controllers.forEach(c=>c.dispose());},[selector]);
}
