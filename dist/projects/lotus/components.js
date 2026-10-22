// State variants from Figma component board 362:45, applied to matching page instances.
function componentStateTarget(el,className){
  if(!el)return;
  el.classList.add(className);
  if(!el.hasAttribute('tabindex'))el.tabIndex=0;
}

// btn1: retain a readable resting label; replay the chevron reveal on interaction.
['432:570','432:584','432:648'].forEach(id=>{
  const el=$(id);
  componentStateTarget(el,'figma-button');
  const reveal=()=>el.querySelectorAll('p').forEach(p=>prepareCopyReveal(p,performance.now()));
  el.addEventListener('pointerenter',reveal);
  el.addEventListener('focus',reveal);
});

// Metric component: white outline and yellow number in the highlighted variant.
['432:573','432:574','432:575','432:576'].forEach(id=>componentStateTarget($(id),'figma-metric'));

// Keep the original copy and each news image while translating both card variants.
const featured=$('450:455');
componentStateTarget(featured,'figma-feature');
featured.querySelector('.design-175').classList.add('figma-feature-media');
const featureContent=document.createElement('div');
featureContent.className='figma-feature-content';
[...featured.children].filter(el=>!el.classList.contains('figma-feature-media')).forEach(el=>featureContent.append(el));
featured.append(featureContent);

['432:644','432:645','432:646','432:647'].forEach(id=>{
  const card=$(id);
  componentStateTarget(card,'figma-news');
  const media=card.querySelector('.design-185');
  const button=card.querySelector('.design-186');
  const content=document.createElement('div');
  content.className='figma-news-content';
  [...card.children].filter(el=>el!==media).forEach(el=>content.append(el));
  card.append(content,button);
});

// FAQ selected variant uses the exact dark minus/circle assets supplied by Figma.
function syncFigmaFaq(row){
  const open=row.getAttribute('aria-expanded')==='true';
  row.querySelector('.design-198 img').src=`assets/${open?'5c40a':'91587'}.svg`;
  row.querySelector('.design-199 img').src=`assets/${open?'df7fb':'67bd2'}.svg`;
}
const figmaFaqObserver=new MutationObserver(entries=>entries.forEach(entry=>syncFigmaFaq(entry.target)));
faqRows.forEach(row=>{
  row.classList.add('figma-faq');
  syncFigmaFaq(row);
  figmaFaqObserver.observe(row,{attributes:true,attributeFilter:['aria-expanded']});
});

// Component 11: original design icons in the existing capability slots.
['432:586','432:587','432:588'].forEach((id,index)=>{
  const row=$(id);
  row.classList.add('figma-capability');
  row.querySelector('img').src=`assets/${['5244b','f2e0f','f5417'][index]}.svg`;
});

// Icons: use the authored white/yellow SVG variants, including keyboard focus.
[
  ['432:675','10727','d1d21'],
  ['432:678','093a0','2b7f5'],
  ['432:681','a6d37','4521b']
].forEach(([id,white,yellow])=>{
  const link=$(id);
  link.classList.add('figma-social');
  const icon=link.querySelector('img');
  icon.className='figma-social-icon';
  icon.src=`assets/${white}.svg`;
  icon.width=icon.height=25;
  const active=icon.cloneNode();
  active.src=`assets/${yellow}.svg`;
  active.classList.add('figma-social-active');
  icon.after(active);
});

// Text-link variants retain the page's real consultation/subscription labels.
['450:303','450:308','450:311','450:314','450:317'].forEach(id=>componentStateTarget($(id),'figma-text-link'));

// Give every model's four photos their full scroll length before the next section.
const lineupPanels=[
  {section:$('805:1087'),panel:$('807:1564'),gallery:$('805:1088'),mirrored:false,photos:['807:1453','807:1499','807:1498','807:1565']},
  {section:document.querySelector('.design-104'),panel:$('811:1577'),gallery:$('811:1568'),mirrored:true,photos:['811:1573','811:1574','811:1569','811:1570']},
  {section:$('832:1130'),panel:$('832:1140'),gallery:$('832:1131'),mirrored:false,photos:['832:1136','832:1137','832:1132','832:1133']}
].map(({section,panel,gallery,mirrored,photos})=>{
  const pin=document.createElement('div');
  pin.className='lineup-info-pin';
  pin.style.marginLeft=getComputedStyle(panel).left;
  panel.before(pin);
  pin.append(panel);
  section.classList.add('lineup-scroll-section');
  const galleryEnd=Math.max(...photos.map(id=>{const photo=$(id);return photo.offsetTop+photo.offsetHeight;}));
  section.style.height=`${galleryEnd+84}px`;
  return {section,pin,panel,gallery,mirrored,firstPhoto:$(photos[0])};
});
function fitLineupPanels(){
  const scale=parseFloat(root.style.getPropertyValue('--scale'))||1;
  const mobile=innerWidth<=700;
  const top=mobile?12/scale:25;
  const bottom=mobile?64/scale:93;
  const available=Math.max(1,innerHeight/scale-top-bottom-24);
  const panelScale=Math.min(1,available/910);
  const inset=parseFloat(getComputedStyle($('432:578')).left)||123;
  lineupPanels.forEach(({section,pin,panel,gallery,mirrored,firstPhoto})=>{
    pin.style.top=`${top}px`;
    pin.style.height=`${910*panelScale}px`;
    pin.style.setProperty('--lineup-panel-scale',panelScale);
    pin.style.setProperty('--lineup-panel-shift','0px');
    gallery.style.left='0px';
    const sectionBounds=section.getBoundingClientRect();
    const table=panel.querySelector('.design-91, .design-121');
    const tableBounds=table.getBoundingClientRect();
    const photoBounds=firstPhoto.getBoundingClientRect();
    const direction=mirrored?-1:1;
    // Anchor both outer edges to the same inset as the preceding engineering section.
    const infoDelta=mirrored
      ?sectionBounds.left+inset*scale-tableBounds.left
      :sectionBounds.right-inset*scale-tableBounds.right;
    const photoDelta=mirrored
      ?sectionBounds.right-inset*scale-photoBounds.right
      :sectionBounds.left+inset*scale-photoBounds.left;
    pin.style.setProperty('--lineup-panel-shift',`${infoDelta/scale*direction}px`);
    gallery.style.left=`${photoDelta/scale*direction}px`;
  });
}
fitLineupPanels();
addEventListener('resize',fitLineupPanels);

// Soften the handoff between models and from the final gallery to the builder.
const lineupTransitions=[
  {section:$('811:1567'),content:[$('811:1573'),$('811:1575'),$('811:1577')]},
  {section:$('832:1130'),content:[$('832:1136'),$('832:1138'),$('832:1140')]},
  {section:$('432:603'),content:[$('432:604'),$('432:605')]}
];
const transitionAnimations=new Set();
const lineupTransitionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const item=lineupTransitions.find(item=>item.section===entry.target);
    item.section.classList.remove('lineup-transition-pending');
    if(!reducedMotion.matches){
      const animations=[item.section.animate([{opacity:0},{opacity:1}],{duration:850,easing:'cubic-bezier(.2,.7,.2,1)'})];
      item.content.filter(Boolean).forEach((el,index)=>animations.push(el.animate(
        [{translate:'0 36px'},{translate:'0 0'}],
        {duration:1000,delay:index*60,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}
      )));
      animations.forEach(animation=>{
        transitionAnimations.add(animation);
        animation.finished.then(()=>transitionAnimations.delete(animation),()=>transitionAnimations.delete(animation));
      });
    }
    lineupTransitionObserver.unobserve(item.section);
  });
},{threshold:.08,rootMargin:'0px 0px -80px 0px'});
if(!reducedMotion.matches)lineupTransitions.forEach(({section})=>{
  section.classList.add('lineup-transition-pending');
  lineupTransitionObserver.observe(section);
});
reducedMotion.addEventListener('change',()=>{
  if(!reducedMotion.matches)return;
  lineupTransitionObserver.disconnect();
  lineupTransitions.forEach(({section})=>section.classList.remove('lineup-transition-pending'));
  transitionAnimations.forEach(animation=>animation.cancel());
});

// Smooth desktop wheel input across the page while preserving embedded controls.
let galleryScrollFrame=0;
let galleryScrollTarget=0;
let galleryScrollTime=0;
function stopGalleryScroll(){
  cancelAnimationFrame(galleryScrollFrame);
  galleryScrollFrame=0;
  galleryScrollTarget=scrollY;
}
function advanceGalleryScroll(now){
  const elapsed=Math.min(48,Math.max(1,now-galleryScrollTime));
  galleryScrollTime=now;
  const remaining=galleryScrollTarget-scrollY;
  if(Math.abs(remaining)<.8){
    window.scrollTo({top:galleryScrollTarget,behavior:'instant'});
    galleryScrollFrame=0;
    return;
  }
  const step=Math.sign(remaining)*Math.min(Math.abs(remaining),Math.max(1,Math.abs(remaining)*(1-Math.exp(-elapsed/95))));
  const previous=scrollY;
  window.scrollTo({top:scrollY+step,behavior:'instant'});
  if(scrollY===previous){stopGalleryScroll();return;}
  galleryScrollFrame=requestAnimationFrame(advanceGalleryScroll);
}
addEventListener('wheel',event=>{
  if(event.defaultPrevented||!event.cancelable||event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||!event.deltaY)return;
  if(reducedMotion.matches||!matchMedia('(hover: hover) and (pointer: fine)').matches||document.querySelector('dialog[open]')){
    stopGalleryScroll();
    return;
  }
  const usesOwnScroll=event.composedPath().some(element=>{
    if(!(element instanceof Element)||element===document.body||element===document.documentElement)return false;
    if(element.matches('model-viewer, iframe, textarea, select, [contenteditable="true"]'))return true;
    return element.scrollHeight>element.clientHeight&&/^(auto|scroll)$/.test(getComputedStyle(element).overflowY);
  });
  if(usesOwnScroll){stopGalleryScroll();return;}
  const unit=event.deltaMode===1?16:event.deltaMode===2?innerHeight:1;
  const maximum=Math.max(0,document.documentElement.scrollHeight-innerHeight);
  if(!galleryScrollFrame)galleryScrollTarget=scrollY;
  if(Math.sign(event.deltaY)!==Math.sign(galleryScrollTarget-scrollY))galleryScrollTarget=scrollY;
  galleryScrollTarget=Math.max(0,Math.min(maximum,galleryScrollTarget+event.deltaY*unit));
  event.preventDefault();
  if(!galleryScrollFrame){
    galleryScrollTime=performance.now();
    galleryScrollFrame=requestAnimationFrame(advanceGalleryScroll);
  }
},{passive:false});
addEventListener('pointerdown',stopGalleryScroll,{passive:true});
addEventListener('touchstart',stopGalleryScroll,{passive:true});
addEventListener('keydown',event=>{
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape','Tab'].includes(event.key))stopGalleryScroll();
});
addEventListener('resize',stopGalleryScroll);
reducedMotion.addEventListener('change',stopGalleryScroll);

// Model selection beneath the vehicle configurator preview.
const customPreview=$('432:606');
const customImage=customPreview.querySelector('img');
const customModels=[
  {name:'EMIRA',src:'assets/51fc0.png',model:'assets/models/emira.glb'},
  {name:'ELETRE',src:'assets/f5571.png',model:'assets/models/eletre.glb'},
  {name:'EMEYA',src:'assets/b632f.png',model:'assets/models/emeya.glb'}
];
const customModelViewer=document.createElement('model-viewer');
customModelViewer.className='custom-model-viewer';
customModelViewer.setAttribute('camera-controls','');
customModelViewer.setAttribute('touch-action','pan-y');
customModelViewer.setAttribute('disable-pan','');
customModelViewer.setAttribute('camera-orbit','35deg 75deg auto');
customModelViewer.setAttribute('field-of-view','30deg');
customModelViewer.setAttribute('shadow-intensity','.8');
customModelViewer.setAttribute('environment-image','neutral');
customModelViewer.setAttribute('exposure','1.1');
customModelViewer.setAttribute('interaction-prompt','none');
const customModelStatus=document.createElement('span');
customModelStatus.className='custom-model-status';
customModelStatus.setAttribute('role','status');
customPreview.append(customModelViewer,customModelStatus);
customModelViewer.addEventListener('load',()=>prepareLoadedCustomModel());
customModelViewer.addEventListener('error',()=>{
  if(!customModels[selectedCustomModel].model)return;
  customPreview.classList.remove('is-model-loading');
  customPreview.setAttribute('aria-busy','false');
  customModelStatus.hidden=false;
  customPreview.classList.remove('has-3d-model');
  customImage.parentElement.removeAttribute('aria-hidden');
  customModelViewer.hidden=true;
  customModelStatus.textContent='3D 모델을 불러오지 못해 차량 사진을 표시합니다.';
});
const customTabs=document.createElement('div');
customTabs.className='custom-model-tabs';
customTabs.setAttribute('role','tablist');
customTabs.setAttribute('aria-label','커스텀 차량 모델 선택');
customPreview.id='custom-model-preview';
customPreview.setAttribute('role','tabpanel');
customPreview.tabIndex=0;
let selectedCustomModel=2;
let customImageAnimation;
let customCameraReady=false;
let customModelVersion=0;
function selectCustomModel(index){
  const model=customModels[index];
  customModelVersion++;
  selectedCustomModel=index;
  customPreview.dataset.model=model.name;
  customPreview.setAttribute('aria-labelledby',`custom-tab-${model.name.toLowerCase()}`);
  customTabs.querySelectorAll('button').forEach((button,i)=>{
    button.setAttribute('aria-selected',String(i===index));
    button.tabIndex=i===index?0:-1;
  });
  customImage.src=model.src;
  customImage.alt=`${model.name} 차량 미리보기`;
  customImage.classList.toggle('custom-model-photo',model.name!=='EMEYA');
  const alreadyLoaded=!!model.model&&customModelViewer.getAttribute('src')===model.model&&customModelViewer.loaded&&customCameraReady;
  const isLoading=!!model.model&&!alreadyLoaded;
  customPreview.classList.toggle('is-model-loading',isLoading);
  customPreview.setAttribute('aria-busy',String(isLoading));
  customPreview.classList.toggle('has-3d-model',alreadyLoaded);
  customImage.parentElement.setAttribute('aria-hidden',String(alreadyLoaded));
  customModelViewer.hidden=!model.model;
  customModelViewer.setAttribute('alt',`${model.name} 3D 차량. 드래그하여 회전하고 휠로 확대할 수 있습니다.`);
  customModelStatus.hidden=!isLoading;
  customModelStatus.textContent='3D 차량을 불러오는 중…';
  customPreview.dispatchEvent(new Event('custom-model-change'));
  if(model.model&&!alreadyLoaded){
    customCameraReady=false;
    customModelViewer.cameraTarget='auto auto auto';
    customModelViewer.cameraOrbit='35deg 75deg auto';
    customModelViewer.minCameraOrbit='auto auto 0m';
    customModelViewer.maxCameraOrbit='auto auto auto';
    if(customModelViewer.getAttribute('src')===model.model&&customModelViewer.loaded)prepareLoadedCustomModel();
    else customModelViewer.setAttribute('src',model.model);
  }else if(alreadyLoaded){
    setCustomCamera(null,false);
  }
  if(customImageAnimation)customImageAnimation.cancel();
  if(!reducedMotion.matches)customImageAnimation=customImage.animate([{opacity:.3},{opacity:1}],{duration:350,easing:'ease-out'});
}
customModels.forEach((model,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.id=`custom-tab-${model.name.toLowerCase()}`;
  button.textContent=model.name;
  button.setAttribute('role','tab');
  button.setAttribute('aria-controls','custom-model-preview');
  button.addEventListener('click',()=>selectCustomModel(index));
  button.addEventListener('keydown',event=>{
    let next=selectedCustomModel;
    if(event.key==='ArrowRight')next=(index+1)%customModels.length;
    else if(event.key==='ArrowLeft')next=(index+customModels.length-1)%customModels.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=customModels.length-1;
    else return;
    event.preventDefault();
    selectCustomModel(next);
    customTabs.children[next].focus();
  });
  customTabs.append(button);
});
$('432:605').append(customTabs);
selectCustomModel(selectedCustomModel);

// Preserve image proportions and control sizes, reserving dashboard clearance below.
const customSection=$('432:603');
const customLayout=document.createElement('div');
customLayout.className='custom-build-layout';
customLayout.append(...customSection.children);
customSection.append(customLayout);
function fitCustomLayout(){
  const scale=parseFloat(root.style.getPropertyValue('--scale'))||1;
  const mobile=innerWidth<=700;
  const top=mobile?12/scale:25;
  const footer=mobile?64/scale:93;
  const gap=24/scale;
  const photoHeight=708;
  const tabsTop=140+photoHeight+32;
  const noteTop=tabsTop+88;
  const contentHeight=Math.max(848,noteTop+72);
  customSection.style.height=`${top+contentHeight+footer+gap}px`;
  customSection.style.setProperty('--custom-photo-height',`${photoHeight}px`);
  customSection.style.setProperty('--custom-tabs-top',`${tabsTop}px`);
  customSection.style.setProperty('--custom-note-top',`${noteTop}px`);
  customSection.style.setProperty('--custom-content-height',`${contentHeight}px`);
  customSection.style.setProperty('--custom-top',`${top}px`);
}
fitCustomLayout();
addEventListener('resize',fitCustomLayout);

// Part cameras are relative to each GLB's bounds, so models with different units work alike.
const customPartRows=['432:608','432:613','432:618','432:623','432:628'].map($);
const customPartOptions=document.createElement('div');
customPartOptions.className='custom-part-options';
customPartOptions.hidden=true;
customPartOptions.setAttribute('aria-label','선택한 부위 옵션');
customLayout.append(customPartOptions);
const customResetView=document.createElement('button');
customResetView.type='button';
customResetView.className='custom-reset-view';
customResetView.textContent='전체 보기';
customResetView.hidden=true;
customPreview.append(customResetView);
let focusedCustomPart=null;
let customCameraFrame=0;
function stopCustomCamera(){
  cancelAnimationFrame(customCameraFrame);
  customCameraFrame=0;
}
function setCustomCamera(part,animate=true){
  stopCustomCamera();
  if(!customCameraReady||!customModelViewer.loaded||!customModels[selectedCustomModel].model)return;
  const d=customModelViewer.getDimensions();
  const c=customModelViewer.getBoundingBoxCenter();
  const length=Math.max(d.x,d.z);
  customModelViewer.setAttribute('interpolation-decay','0');
  customModelViewer.setAttribute('min-camera-orbit',`auto auto ${length*.1}m`);
  let target={x:c.x,y:c.y,z:c.z};
  let orbit={theta:35*Math.PI/180,phi:75*Math.PI/180,radius:length*2.1};
  if(part===null){
    // Use the same full-vehicle framing when returning from any detail view.
  }else{
    const views=[
      {x:0,y:0,z:.03,theta:55,phi:72,radius:1.4},
      {x:.46,y:-.28,z:.29,theta:90,phi:85,radius:.43},
      {x:.43,y:-.22,z:.31,theta:85,phi:85,radius:.25},
      {x:.32,y:-.25,z:.42,theta:38,phi:82,radius:.52},
      {x:0,y:.4,z:0,theta:35,phi:15,radius:1.1}
    ];
    const view=views[part];
    target={x:c.x+d.x*view.x,y:c.y+d.y*view.y,z:c.z+d.z*view.z};
    orbit={theta:view.theta*Math.PI/180,phi:view.phi*Math.PI/180,radius:length*view.radius};
  }
  customModelViewer.setAttribute('field-of-view','30deg');
  const startTarget=customModelViewer.getCameraTarget();
  const startOrbit=customModelViewer.getCameraOrbit();
  const angleDelta=Math.atan2(Math.sin(orbit.theta-startOrbit.theta),Math.cos(orbit.theta-startOrbit.theta));
  const apply=(progress)=>{
    const mix=(from,to)=>from+(to-from)*progress;
    customModelViewer.cameraTarget=`${mix(startTarget.x,target.x)}m ${mix(startTarget.y,target.y)}m ${mix(startTarget.z,target.z)}m`;
    const radius=Math.exp(mix(Math.log(Math.max(startOrbit.radius,.000001)),Math.log(orbit.radius)));
    customModelViewer.cameraOrbit=`${startOrbit.theta+angleDelta*progress}rad ${mix(startOrbit.phi,orbit.phi)}rad ${radius}m`;
    customModelViewer.jumpCameraToGoal();
  };
  if(!animate){apply(1);return;}
  const started=performance.now();
  const move=(now)=>{
    const progress=Math.max(0,Math.min(1,(now-started)/1200));
    apply(progress*progress*(3-2*progress));
    customCameraFrame=progress<1?requestAnimationFrame(move):0;
  };
  customCameraFrame=requestAnimationFrame(move);
}
function resetCustomPart(resetCamera=true){
  focusedCustomPart=null;
  customPartOptions.hidden=true;
  customResetView.hidden=true;
  customPartRows.forEach(row=>{
    row.classList.remove('part-focused','selected-option');
    row.setAttribute('aria-expanded','false');
  });
  if(resetCamera)setCustomCamera(null);
}
customPartRows.forEach(row=>{
  row.setAttribute('aria-controls','custom-part-options');
  row.setAttribute('aria-expanded','false');
  row.addEventListener('custom-part-select',event=>{
    customPartRows.forEach(item=>{
      item.classList.remove('part-focused','selected-option');
      item.setAttribute('aria-expanded','false');
    });
    if(!customModels[selectedCustomModel].model){
      row.classList.add('selected-option');
      return;
    }
    event.preventDefault();
    const {index,label,choices}=event.detail;
    focusedCustomPart=index;
    customPartRows.forEach((item,i)=>{
      item.classList.toggle('part-focused',i===index);
      item.setAttribute('aria-expanded',String(i===index));
    });
    customPartOptions.replaceChildren();
    const heading=document.createElement('p');
    heading.textContent=label;
    customPartOptions.append(heading);
    const choiceList=document.createElement('div');
    choiceList.className='custom-part-choices';
    choices.forEach(choice=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=choice;
      button.setAttribute('aria-pressed',String(selections[label]===choice));
      button.addEventListener('click',()=>{
        selections[label]=choice;
        choiceList.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        note.textContent=Object.entries(selections).map(([key,value])=>`${key}: ${value}`).join(' · ');
      });
      choiceList.append(button);
    });
    customPartOptions.append(choiceList);
    customPartOptions.hidden=false;
    customResetView.hidden=false;
    setCustomCamera(index);
  });
});
customPartOptions.id='custom-part-options';
customResetView.addEventListener('click',resetCustomPart);
customPreview.addEventListener('custom-model-change',()=>{
  stopCustomCamera();
  resetCustomPart(false);
});
async function prepareLoadedCustomModel(){
  const version=customModelVersion;
  const source=customModels[selectedCustomModel].model;
  if(!source||!customModelViewer.loaded||customModelViewer.getAttribute('src')!==source)return;
  stopCustomCamera();
  customCameraReady=false;
  // Flush model-specific camera limits before applying distances in the new model's units.
  customModelViewer.minCameraOrbit='auto auto 0m';
  customModelViewer.maxCameraOrbit='auto auto auto';
  customModelViewer.cameraTarget='auto auto auto';
  customModelViewer.cameraOrbit='35deg 75deg auto';
  await customModelViewer.updateComplete;
  if(version!==customModelVersion)return;
  await customModelViewer.updateFraming();
  if(version!==customModelVersion)return;
  await customModelViewer.updateComplete;
  if(version!==customModelVersion)return;
  customCameraReady=true;
  setCustomCamera(focusedCustomPart,false);
  await customModelViewer.updateComplete;
  if(version!==customModelVersion)return;
  customModelViewer.jumpCameraToGoal();
  customPreview.classList.remove('is-model-loading');
  customPreview.setAttribute('aria-busy','false');
  customPreview.classList.add('has-3d-model');
  customImage.parentElement.setAttribute('aria-hidden','true');
  customModelStatus.hidden=true;
}
customModelViewer.addEventListener('pointerdown',stopCustomCamera,{passive:true});
customModelViewer.addEventListener('wheel',stopCustomCamera,{passive:true});
customModelViewer.addEventListener('keydown',stopCustomCamera);
// Pause camera motion while the builder is out of view.
let customPreviewVisible=false;
function syncCustomPreviewActivity(){
  if(!customPreviewVisible||document.hidden)stopCustomCamera();
}
new IntersectionObserver(entries=>{
  customPreviewVisible=entries[0].isIntersecting;
  syncCustomPreviewActivity();
},{rootMargin:'150px'}).observe(customPreview);
document.addEventListener('visibilitychange',syncCustomPreviewActivity);
