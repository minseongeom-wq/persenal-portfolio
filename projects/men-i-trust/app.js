const root=document.documentElement;
const node=id=>document.querySelector(`[data-node-id="${id}"]`);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
function fit(){const scale=root.clientWidth/1920;const sectionHeight=innerHeight/(root.clientWidth<=700?1:scale);root.style.setProperty('--scale',scale);root.style.setProperty('--banner-scale',(root.clientWidth-40)/1860);root.style.setProperty('--music-height',`${sectionHeight}px`);}
fit();addEventListener('resize',fit,{passive:true});
const sectionIds={'518:252':'home','531:220':'lives','677:441':'music','617:2181':'merch','596:1305':'bio','564:1122':'contact'};
for(const [id,name] of Object.entries(sectionIds)){const el=node(id);el.id=name;el.setAttribute('role','region');el.setAttribute('aria-label',name==='home'?'Men I Trust':name);}
const tourScene=document.createElement('div');tourScene.className='tour-scene';
const tourSection=document.getElementById('lives');
tourScene.append(...tourSection.childNodes);tourSection.append(node('564:1134'),tourScene);
const pageSections=['home','lives','music','merch'].map(id=>document.getElementById(id));
let sectionTransition=false;
let sectionWheelTotal=0;
let sectionWheelTime=0;
let sectionWheelLast=0;
function moveToSection(target){
  sectionTransition=true;
  root.classList.add('section-transition');
  const from=scrollY,to=scrollY+target.getBoundingClientRect().top;
  const started=performance.now(),duration=reducedMotion.matches?0:800;
  function step(time){
    const progress=duration?Math.min(1,(time-started)/duration):1;
    const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
    scrollTo({top:from+(to-from)*eased,behavior:'instant'});
    if(progress<1){requestAnimationFrame(step);return;}
    root.classList.remove('section-transition');
    const release=()=>{if(performance.now()-sectionWheelLast<180){setTimeout(release,180);return;}sectionTransition=false;sectionWheelTotal=0;};
    setTimeout(release,180);
  }
  requestAnimationFrame(step);
}
addEventListener('wheel',event=>{
  if(event.defaultPrevented||event.ctrlKey||document.querySelector('dialog[open]')||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
  const now=performance.now();
  if(sectionTransition){event.preventDefault();sectionWheelLast=now;return;}
  const index=pageSections.findIndex((section,i)=>i<3&&Math.abs(section.getBoundingClientRect().top)<innerHeight*.45);
  if(index<0||!event.deltaY||(index===0&&event.deltaY<0))return;
  event.preventDefault();
  if(now-sectionWheelTime>180||Math.sign(sectionWheelTotal)!==Math.sign(event.deltaY))sectionWheelTotal=0;
  sectionWheelTime=now;sectionWheelLast=now;
  sectionWheelTotal+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  if(Math.abs(sectionWheelTotal)<35)return;
  moveToSection(pageSections[index+(sectionWheelTotal>0?1:-1)]);
},{passive:false});
function addClass(id,name){const el=node(id);el.classList.add(name);return el;}
function buttonize(el,label,action){
  if(el.tagName!=='BUTTON'){el.setAttribute('role','button');el.tabIndex=0;el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();action();}});}
  el.setAttribute('aria-label',label);el.addEventListener('click',action);
}
document.body.insertAdjacentHTML('beforeend',`<dialog class="menu-dialog" aria-labelledby="menu-title"><button class="close-dialog" aria-label="Close menu">×</button><h2 id="menu-title">Men I Trust</h2><nav>${['Lives','Merch','Music','Contact','Bio'].map(name=>`<a href="#${name.toLowerCase()}">${name}</a>`).join('')}</nav></dialog><dialog class="detail-dialog" aria-labelledby="detail-title"><button class="close-dialog" aria-label="Close details">×</button><div class="detail-content"></div></dialog>`);
const menu=document.querySelector('.menu-dialog');
const detail=document.querySelector('.detail-dialog');
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.close-dialog').innerHTML='<img src="assets/9684e.svg" alt="" width="24" height="24">';
  dialog.querySelector('.close-dialog').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)dialog.close();});
});
function show(title,content){const slot=detail.querySelector('.detail-content');slot.replaceChildren();const heading=document.createElement('h2');heading.id='detail-title';heading.textContent=title;slot.append(heading,content);detail.showModal();}
function link(href,text){const el=document.createElement('a');el.href=href;el.textContent=text;el.target='_blank';el.rel='noopener noreferrer';el.className='dialog-link';return el;}
const nav=addClass('604:1346','main-nav');
nav.setAttribute('role','navigation');nav.setAttribute('aria-label','Main navigation');
Array.from(nav.children).forEach(el=>{const name=el.textContent.trim();buttonize(el,`Explore ${name}`,()=>document.getElementById(name.toLowerCase()).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'}));});
const navigationItems=[...nav.children,...menu.querySelectorAll('nav a')];
function setActiveNavigation(name){navigationItems.forEach(el=>{const active=el.textContent.trim().toLowerCase()===name;el.classList.toggle('is-active',active);if(active)el.setAttribute('aria-current','location');else el.removeAttribute('aria-current');});}
let navigationFrame;
addEventListener('scroll',()=>{cancelAnimationFrame(navigationFrame);navigationFrame=requestAnimationFrame(()=>{
  const section=Object.values(sectionIds).find(name=>{const rect=document.getElementById(name).getBoundingClientRect();return rect.top<=innerHeight*.45&&rect.bottom>innerHeight*.45;});setActiveNavigation(section);
});},{passive:true});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
buttonize(addClass('531:216','header-menu'),'Open menu',()=>menu.showModal());
const logo=addClass('531:226','header-logo');logo.querySelector('img').alt='Men I Trust';logo.querySelector('img').loading='eager';
// Keep the header outside the zoomed design canvas so fixed positioning follows the viewport.
const fixedHeader=document.createElement('header');fixedHeader.className='fixed-header';
fixedHeader.append(logo,node('531:216'));document.body.append(fixedHeader);
buttonize(logo,'Men I Trust — home',()=>document.getElementById('home').scrollIntoView());
buttonize(addClass('848:1410','down-link'),'Explore live shows',()=>document.getElementById('lives').scrollIntoView());
addClass('564:1134','tour-background');
const tourVideo=addClass('573:1135','tour-video');
tourVideo.innerHTML='<img class="media-fill" src="assets/tour-video-1.png" alt="Men I Trust live performance" loading="lazy" decoding="async">';
// Replace these preview images with original video files when supplied.
const mediaSlots={hero:document.getElementById('home'),tour:tourVideo,tourBackground:node('564:1134')};
window.setMenITrustVideo=(slot,src)=>{
  if(!mediaSlots[slot]||typeof src!=='string')return;
  const previous=mediaSlots[slot].querySelector('video');
  if(previous){videoObserver.unobserve(previous);visibleVideos.delete(previous);previous.pause();previous.removeAttribute('src');previous.load();previous.remove();}
  const video=document.createElement('video');video.dataset.src=src;video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.className='slot-video';video.setAttribute('aria-hidden','true');
  video.addEventListener('playing',()=>video.parentElement.classList.add('has-playing-video'));
  video.addEventListener('error',()=>video.parentElement?.classList.remove('has-playing-video'));
  mediaSlots[slot].prepend(video);videoObserver.observe(video);
};
const visibleVideos=new Set();
function playVisibleVideo(video){
  if(document.hidden||reducedMotion.matches||document.querySelector('dialog[open]')){video.pause();return;}
  if(!video.hasAttribute('src'))video.src=video.dataset.src;
  video.play().catch(()=>{});
}
const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){visibleVideos.add(target);playVisibleVideo(target);}else{visibleVideos.delete(target);target.pause();}}),{threshold:.1});
function syncVideoPlayback(){visibleVideos.forEach(playVisibleVideo);}
document.addEventListener('visibilitychange',syncVideoPlayback);reducedMotion.addEventListener('change',syncVideoPlayback);
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('toggle',syncVideoPlayback));
detail.addEventListener('close',()=>{detail.querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.load();});});
addClass('579:1289','tour-poster').querySelector('img').alt='Men I Trust — Asia tour poster';
addClass('848:1413','tour-info');addClass('583:1290','tour-caption');
const tourList=addClass('573:1256','tour-list');
function showTour(name){const content=document.createElement('div');const text=document.createElement('p');text.textContent=`${name} — tour information and tickets are available through the band's official site.`;content.append(text,link('https://menitrust.com/','Explore official live shows ↗'));show(name,content);}
let selectedTour='China / Indonesia';
const tours=[
  {label:'China/Indonesia',name:'Asia Tour',region:'China / Indonesia',date:'Dec 05–12'},
  {label:'Euro Tour',name:'Euro Tour',region:'Europe',date:'Dec 05–12'},
  {label:'Miami',name:'Miami Tour',region:'Miami',date:'Dec 05–12'},
  {label:'Honolulu',name:'Honolulu Tour',region:'Honolulu',date:'Dec 05–12'},
  {label:'Melbourne',name:'Melbourne Tour',region:'Melbourne',date:'Dec 05–12'}
];
const tourNames=tours.map(tour=>tour.label);
node('848:1413').setAttribute('aria-live','polite');
function updateTourInfo(index){
  const tour=tours[index];
  node('848:1417').textContent=tour.region;
  node('848:1418').textContent=tour.name;
  node('848:1423').textContent=tour.date;
  node('848:1427').textContent=tour.region;
}
const tourButtons=tourNames.map((name,index)=>{
  const button=document.createElement('button');button.type='button';button.className='tour-choice';button.setAttribute('aria-pressed',String(index===0));button.setAttribute('aria-label',`Select ${name} tour`);
  const label=document.createElement('span');label.textContent=name;
  const date=document.createElement('span');date.className='tour-choice-date';date.textContent=tours[index].date;
  const arrow=document.createElement('img');arrow.src='assets/a1944.svg';arrow.alt='';arrow.width=24;arrow.height=24;
  button.append(label,date,arrow);button.onclick=()=>{selectedTour=index===0?'China / Indonesia':name;updateTourInfo(index);tourButtons.forEach(el=>el.setAttribute('aria-pressed',String(el===button)));const explore=node('573:1150');explore.querySelector('p').textContent=`Explore ${selectedTour}`;explore.setAttribute('aria-label',`Explore ${selectedTour} tour`);};return button;
});
tourList.replaceChildren(...tourButtons);
buttonize(addClass('573:1150','tour-explore'),'Explore China / Indonesia tour',()=>showTour(selectedTour));
const track=addClass('I677:441;677:389','music-track');track.tabIndex=0;track.setAttribute('aria-label','Music gallery — scroll horizontally');
const trackScale=()=>track.getBoundingClientRect().width/track.offsetWidth||1;
let trackDrag=null;
let suppressTrackClick=false;
track.addEventListener('pointerdown',event=>{
  suppressTrackClick=false;
  if(event.pointerType!=='mouse'||event.button!==0)return;
  trackDrag={id:event.pointerId,x:event.clientX,scroll:track.scrollLeft,moved:false};
});
track.addEventListener('pointermove',event=>{
  if(!trackDrag||event.pointerId!==trackDrag.id)return;
  const distance=event.clientX-trackDrag.x;
  if(!trackDrag.moved&&Math.abs(distance)<6)return;
  if(!trackDrag.moved){trackDrag.moved=true;track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');}
  event.preventDefault();
  track.scrollLeft=trackDrag.scroll-distance/trackScale();
});
function endTrackDrag(event){
  if(!trackDrag||event.pointerId!==trackDrag.id)return;
  suppressTrackClick=trackDrag.moved;
  trackDrag=null;track.classList.remove('is-dragging');
  if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
}
track.addEventListener('pointerup',endTrackDrag);
track.addEventListener('pointercancel',endTrackDrag);
track.addEventListener('lostpointercapture',endTrackDrag);
track.addEventListener('pointerleave',event=>{if(trackDrag&&!trackDrag.moved)endTrackDrag(event);});
track.addEventListener('dragstart',event=>event.preventDefault());
track.addEventListener('click',event=>{if(suppressTrackClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
track.addEventListener('wheel',event=>{
  if(event.ctrlKey)return;
  const delta=Math.abs(event.deltaX)>Math.abs(event.deltaY)?event.deltaX:event.deltaY;
  const unit=event.deltaMode===1?16:event.deltaMode===2?track.clientWidth:1;
  const max=track.scrollWidth-track.clientWidth;
  if(!delta||(delta<0&&track.scrollLeft<=0)||(delta>0&&track.scrollLeft>=max-1))return;
  event.preventDefault();track.scrollLeft+=delta*unit/trackScale();
},{passive:false});
addClass('I677:441;677:388','music-background');
addClass('I677:441;677:397','music-caption');
const cards=Array.from(track.children).sort((a,b)=>parseFloat(getComputedStyle(a).left)-parseFloat(getComputedStyle(b).left));
mediaSlots.music=cards[0];
const musicBackground=document.querySelector('.music-background');
const initialBackground=musicBackground.querySelector('img');
initialBackground.classList.add('music-background-layer','is-visible');
const backgroundLayers=new Map([[initialBackground.getAttribute('src'),initialBackground]]);
let backgroundRequest=0;
async function selectMusic(card,index){
  const request=++backgroundRequest;
  const source=index===0?'assets/478c7.png':card.querySelector('img[src$=".png"]')?.getAttribute('src');
  if(!source)return;
  let layer=backgroundLayers.get(source);
  if(!layer){layer=initialBackground.cloneNode();layer.classList.remove('is-visible');layer.src=source;layer.alt='';musicBackground.append(layer);backgroundLayers.set(source,layer);}
  try{await layer.decode();}catch{return;}
  if(request!==backgroundRequest)return;
  backgroundLayers.forEach(image=>image.classList.toggle('is-visible',image===layer));
  cards.forEach(el=>el.setAttribute('aria-pressed',String(el===card)));
}
cards.forEach((card,index)=>{
  track.append(card);card.classList.add('music-card');card.querySelectorAll('img[src$=".png"]').forEach(img=>img.alt='Men I Trust music video still');
  const title=card.querySelector('.music-card__title').textContent.trim();
  buttonize(card,`Select Men I Trust — ${title}`,()=>selectMusic(card,index));
  card.setAttribute('aria-pressed',String(index===0));
});

new MutationObserver(()=>{
  const video=detail.querySelector('video');if(!video||detail.querySelector('.playback-toggle'))return;
  const toggle=document.createElement('button');toggle.type='button';toggle.className='playback-toggle';
  const icon=document.createElement('img');icon.width=24;icon.height=24;icon.alt='';toggle.append(icon);
  const sync=()=>{toggle.setAttribute('aria-label',video.paused?'Play video':'Pause video');icon.src=video.paused?'assets/677d9.svg':'assets/ad05f.svg';};
  toggle.onclick=()=>video.paused?video.play().catch(()=>{}):video.pause();video.addEventListener('play',sync);video.addEventListener('pause',sync);sync();video.after(toggle);
}).observe(detail.querySelector('.detail-content'),{childList:true,subtree:true});
addClass('728:445','merch-banner');addClass('646:306','merch-title');addClass('717:398','merch-subtitle');addClass('661:355','merch-sort');
const pagination=addClass('671:356','merch-pagination');
const products=addClass('728:446','products');
const productList=Array.from(products.children).sort((a,b)=>{const aa=getComputedStyle(a),bb=getComputedStyle(b);return parseFloat(aa.top)-parseFloat(bb.top)||parseFloat(aa.left)-parseFloat(bb.left);});
const productTemplate=productList[0].cloneNode(true);
for(const [pageIndex,items] of (window.MEN_I_TRUST_DESIGN?.pages||[]).entries()){
  for(const item of items){
    const product=productTemplate.cloneNode(true);
    product.removeAttribute('data-node-id');
    product.querySelectorAll('[data-node-id]').forEach(el=>el.removeAttribute('data-node-id'));
    product.dataset.nodeId=item.nodeId;product.dataset.page=pageIndex+2;
    product.querySelector('img').src=item.image;
    const text=product.querySelectorAll('p');text[0].textContent=item.title;text[1].textContent=item.price;
    productList.push(product);
  }
}
productList.forEach((product,index)=>{
  product.classList.add('product');product.dataset.order=index;product.dataset.page||='1';
  const text=product.querySelectorAll('p');const title=text[0].textContent.trim();const price=text[1].textContent.trim();product.dataset.title=title;product.dataset.price=price.replace(/\D/g,'');
  product.querySelector('img').alt=title;products.append(product);
  buttonize(product,`View ${title}`,()=>{const content=document.createElement('div');const image=product.querySelector('img').cloneNode();image.className='detail-product-image';image.removeAttribute('style');const amount=document.createElement('p');amount.textContent=price;content.append(image,amount,link('https://menitrustmerch.com/collections/all-products','Explore the official shop ↗'));show(title,content);});
});
const shopLink=link('https://menitrustmerch.com/collections/all-products','View all products ↗');shopLink.className='shop-link';document.getElementById('merch').append(shopLink);
// Keep reading order aligned with the design when the desktop layout reflows.
const merch=document.getElementById('merch');
['728:445','646:306','717:398','661:355','728:446','671:356'].forEach(id=>merch.append(node(id)));
merch.append(shopLink);
function selectControl(id,label,values){const el=node(id);el.querySelector('p').remove();const select=document.createElement('select');select.className='sort-select';select.setAttribute('aria-label',label);values.forEach(([value,title])=>{const option=document.createElement('option');option.value=value;option.textContent=title;select.append(option);});el.append(select);return select;}
const type=selectControl('656:328','Filter merchandise by type',[['all','Type'],['shirt','T-Shirts'],['vinyl','Vinyl'],['cassette','Cassettes'],['cd','CDs'],['hoodie','Hoodies']]);
const sort=selectControl('656:329','Sort merchandise',[['featured','Featured'],['low','Price ↑'],['high','Price ↓'],['name','A–Z']]);
let currentPage=1;
function updateProducts(){
  const sorted=productList.filter(product=>type.value==='all'||product.dataset.title.toLowerCase().includes(type.value)).sort((a,b)=>sort.value==='low'?+a.dataset.price-+b.dataset.price:sort.value==='high'?+b.dataset.price-+a.dataset.price:sort.value==='name'?a.dataset.title.localeCompare(b.dataset.title):+a.dataset.order-+b.dataset.order);
  const total=Math.max(1,Math.ceil(sorted.length/10));currentPage=Math.min(currentPage,total);
  productList.forEach(product=>product.hidden=true);
  sorted.forEach((product,index)=>{product.hidden=index<(currentPage-1)*10||index>=currentPage*10;products.append(product);});
  pagination.replaceChildren();pagination.setAttribute('role','navigation');pagination.setAttribute('aria-label','Merchandise pages');
  for(let page=1;page<=total;page++){
    const button=document.createElement('button');button.type='button';button.textContent=page;button.setAttribute('aria-label',`Merchandise page ${page}`);
    if(page===currentPage)button.setAttribute('aria-current','page');
    button.onclick=()=>{currentPage=page;updateProducts();};pagination.append(button);
  }
  const next=document.createElement('button');next.type='button';next.textContent='>';next.setAttribute('aria-label','Next merchandise page');next.disabled=currentPage===total;
  next.onclick=()=>{currentPage++;updateProducts();};pagination.append(next);
}
type.onchange=sort.onchange=()=>{currentPage=1;updateProducts();};updateProducts();
addClass('769:1050','bio-photo').querySelector('img').alt='Men I Trust — Emma, Jessy and Dragos';addClass('688:751','bio-text');addClass('866:393','bio-mask');addClass('864:391','bio-art');
const bioPhoto=node('769:1050').querySelector('img');
const photoSelectors=['1050:1215','1050:1216','1050:1217','1050:1218'].map(id=>addClass(id,'bio-photo-selector'));
let bioPhotoIndex=0;
let bioElapsed=0;
let bioPreviousTime=null;
let bioFrame=null;
let bioVisible=false;
const bioDuration=5000;
const bioGauges=photoSelectors.map(selector=>{const fill=document.createElement('span');fill.className='bio-gauge-fill';fill.setAttribute('aria-hidden','true');selector.append(fill);return fill;});
function paintBioGauges(){bioGauges.forEach((fill,index)=>fill.style.transform=`scaleX(${index<bioPhotoIndex?1:index===bioPhotoIndex?bioElapsed/bioDuration:0})`);}
function selectBioPhoto(index){
  bioPhotoIndex=index;bioElapsed=0;bioPreviousTime=null;
  bioPhoto.src=window.MEN_I_TRUST_DESIGN.photos[index];
  photoSelectors.forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
  paintBioGauges();
}
function advanceBio(time){
  if(!bioVisible||document.hidden){bioFrame=null;bioPreviousTime=null;return;}
  if(bioPreviousTime!==null)bioElapsed+=time-bioPreviousTime;
  bioPreviousTime=time;
  if(bioElapsed>=bioDuration)selectBioPhoto((bioPhotoIndex+1)%photoSelectors.length);
  paintBioGauges();bioFrame=requestAnimationFrame(advanceBio);
}
function syncBioPlayback(){
  if(bioFrame!==null)cancelAnimationFrame(bioFrame);
  bioFrame=null;bioPreviousTime=null;
  if(bioVisible&&!document.hidden)bioFrame=requestAnimationFrame(advanceBio);
}
new IntersectionObserver(entries=>{bioVisible=entries[0].isIntersecting;syncBioPlayback();},{threshold:.1}).observe(node('769:1050'));
document.addEventListener('visibilitychange',syncBioPlayback);
photoSelectors.forEach((selector,index)=>{
  selector.setAttribute('aria-pressed',String(index===0));
  buttonize(selector,`Band photo ${index+1}`,()=>selectBioPhoto(index));
});
paintBioGauges();
addClass('677:357','contact-photo').querySelector('img').alt='Men I Trust band portrait';
const contactPanel=addClass('677:359','contact-panel');addClass('677:358','contact-heading');addClass('704:252','contact-warning');addClass('677:360','contact-addresses');addClass('725:432','copyright');
const form=document.createElement('form');form.className='contact-form';form.setAttribute('aria-label','Contact Men I Trust');
for(const [labelId,inputId,name,title,inputType,auto] of [['677:361','677:362','name','Your name','text','name'],['677:363','677:364','email','Your email','email','email']]){
  const originalLabel=node(labelId);const label=document.createElement('label');label.className=originalLabel.className+` ${name}-label`;label.htmlFor=`contact-${name}`;label.textContent=originalLabel.textContent.trim();originalLabel.replaceWith(label);
  const original=node(inputId);const input=document.createElement('input');input.className=original.className+` contact-input ${name}-input`;input.id=`contact-${name}`;input.name=name;input.type=inputType;input.placeholder=title;input.autocomplete=auto;input.required=true;original.replaceWith(input);form.append(label,input);
}
const oldSend=node('730:448');const send=document.createElement('button');send.type='submit';send.className=oldSend.className+' send-button';send.innerHTML=oldSend.innerHTML;oldSend.replaceWith(send);form.append(send);
const status=document.createElement('p');status.className='form-status';status.setAttribute('role','status');form.append(status);form.onsubmit=event=>{event.preventDefault();status.textContent='This contact form is a preview. Your details have not been sent.';};contactPanel.append(form);
addClass('677:377','contact-line');addClass('677:378','contact-line').classList.add('second');
contactPanel.querySelectorAll('[data-name="Iconsmail"]').forEach((el,index)=>{el.classList.add('mail-icon');el.style.setProperty('--mail-order',index);});
const socials=[['Iconsant-design:spotify-outlined','https://open.spotify.com/search/Men%20I%20Trust','Spotify'],['Iconsant-design:youtube-outlined','https://www.youtube.com/@menitrust','YouTube'],['Iconsbasil:twitter-outline','https://x.com/menitrust','X'],['IconsFrame','https://www.instagram.com/menitrust/','Instagram']];
socials.forEach(([name,url,label],index)=>{const el=contactPanel.querySelector(`[data-name="${name}"]`);el.classList.add('social-link');el.style.setProperty('--social-order',index);buttonize(el,label,()=>window.open(url,'_blank','noopener,noreferrer'));});
Object.entries(window.MEN_I_TRUST_MEDIA||{}).forEach(([slot,src])=>{if(src)window.setMenITrustVideo(slot,src);});
