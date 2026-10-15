/** Use the Figma on/off arrow assets while retaining the existing link actions. */
export function initComponentDesigns(){
 for(const link of document.querySelectorAll('[data-name^="Project Link /"]')){
  const icon=link.querySelector('[data-name="Icon / Project Arrow"]');
  if(!icon||icon.querySelector('.project-arrow-on'))continue;
  const off=icon.querySelector('img');
  off.src='./assets/46f35.svg';off.classList.add('project-arrow-off');
  const on=off.cloneNode();on.src='./assets/selected-project-arrow-active.svg';on.classList.remove('project-arrow-off');on.classList.add('project-arrow-on');
  icon.append(on);
 }
}
