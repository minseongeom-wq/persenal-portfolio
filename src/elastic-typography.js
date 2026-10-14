import {vertexShader,fragmentShader} from './elastic-typography-shader.js';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const spring=(value=0)=>({value,velocity:0});
function step(s,target,dt,frequency,damping){const count=Math.ceil(dt/.008),h=dt/count;for(let i=0;i<count;i++){s.velocity+=((target-s.value)*frequency*frequency-2*damping*frequency*s.velocity)*h;s.value+=s.velocity*h;}}
function compile(gl,type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;}
function renderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)return null;
 const vertex=compile(gl,gl.VERTEX_SHADER,vertexShader),fragment=compile(gl,gl.FRAGMENT_SHADER,fragmentShader),program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
 const names=['size','center','colorCenter','pull','redPull','cyanPull','radius','active','strength'];const u=Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(program,'u_'+n)]));
 return{upload(image){gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.viewport(0,0,canvas.width,canvas.height);},draw(s){gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);for(const n of names.slice(0,7))gl.uniform2f(u[n],...s[n]);gl.uniform1f(u.active,s.active);gl.uniform1f(u.strength,s.strength);gl.drawArrays(gl.TRIANGLES,0,6);},dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
/** Draw each glyph at its DOM Range position: preserve native tracking/kerning/baselines. */
function rasterize(title,padding,ratio){
 const bounds=title.getBoundingClientRect(),width=title.offsetWidth+padding*2,height=title.offsetHeight+padding*2,zoom=bounds.width/title.offsetWidth;
 const image=document.createElement('canvas');image.width=Math.ceil(width*ratio);image.height=Math.ceil(height*ratio);const ctx=image.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle='#000';ctx.textBaseline='alphabetic';
 const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){if(node.parentElement.closest('[aria-hidden="true"]'))continue;const style=getComputedStyle(node.parentElement);ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.fontKerning='none';const metrics=ctx.measureText('M');
  for(let i=0;i<node.textContent.length;){const ch=String.fromCodePoint(node.textContent.codePointAt(i)),range=document.createRange();range.setStart(node,i);range.setEnd(node,i+ch.length);i+=ch.length;if(/\s/.test(ch))continue;const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;ctx.fillText(ch,(r.left-bounds.left)/zoom+padding,(r.top-bounds.top)/zoom+metrics.fontBoundingBoxAscent+padding);}
 }return{image,width,height};
}
export function createElasticTypography(title){
 const enabled=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
 let disposed=false,initializing=false,canvas=null,gpu=null,frame=0,resizeFrame=0,observer=null;
 let size=[1,1],padding=64,fontSize=200,hovered=false,lastPointer=null,lastInput=-Infinity,lastFrame=0;
 const target={x:0,y:0,cx:0,cy:0},black=[spring(),spring()],red=[spring(),spring()],cyan=[spring(),spring()],center=[spring(),spring()],colorCenter=[spring(),spring()];
 const all=[...black,...red,...cyan,...center,...colorCenter];
 function paint(active){gpu?.draw({size,center:center.map(s=>s.value),colorCenter:colorCenter.map(s=>s.value),pull:black.map(s=>s.value),redPull:red.map(s=>s.value),cyanPull:cyan.map(s=>s.value),radius:[fontSize*.70,fontSize*.48],active:active?1:0,strength:clamp(Math.hypot(...black.map(s=>s.value))/12,0,1)});}
 function neutral(){cancelAnimationFrame(frame);frame=0;black.concat(red,cyan).forEach(s=>{s.value=s.velocity=0;});target.x=target.y=0;lastInput=-Infinity;lastPointer=null;hovered=false;title.classList.remove('elastic-rendering');title.dataset.elasticPhase=gpu?'idle':'disabled';paint(false);}
 function resize(){if(!gpu||!title.offsetWidth||!title.offsetHeight)return;neutral();fontSize=Number.parseFloat(getComputedStyle(title).fontSize);padding=Math.ceil(Math.min(90,Math.max(48,fontSize*.30)));const ratio=Math.min(devicePixelRatio||1,2),raster=rasterize(title,padding,ratio);size=[raster.width,raster.height];canvas.width=raster.image.width;canvas.height=raster.image.height;canvas.style.setProperty('--elastic-padding',padding+'px');gpu.upload(raster.image);target.cx=size[0]/2;target.cy=size[1]/2;center[0].value=colorCenter[0].value=target.cx;center[1].value=colorCenter[1].value=target.cy;all.forEach(s=>s.velocity=0);paint(false);}
 function animate(now){if(!gpu)return;const dt=clamp((now-lastFrame)/1000,.001,.032);lastFrame=now;const moving=hovered&&now-lastInput<95,pull=[moving?target.x:0,moving?target.y:0];for(let i=0;i<2;i++){step(black[i],pull[i],dt,23,.78);step(red[i],black[i].value*1.07,dt,16,.78);step(cyan[i],black[i].value*.91,dt,18,.80);step(center[i],i?target.cy:target.cx,dt,34,1);step(colorCenter[i],center[i].value,dt,21,1);}const energy=[...black,...red,...cyan].reduce((n,s)=>n+Math.abs(s.value)+Math.abs(s.velocity)*.02,0);if(!moving&&energy<.025){neutral();return;}title.classList.add('elastic-rendering');title.dataset.elasticPhase=hovered?'active':'recovering';paint(true);frame=requestAnimationFrame(animate);}
 function pointer(event){if(!gpu||!enabled.matches||event.pointerType==='touch')return;const rect=title.getBoundingClientRect(),zoom=rect.width/title.offsetWidth,current={x:(event.clientX-rect.left)/zoom+padding,y:(event.clientY-rect.top)/zoom+padding,time:performance.now()};hovered=true;target.cx=current.x;target.cy=current.y;if(lastPointer){const dt=clamp(current.time-lastPointer.time,5,80),limit=Math.min(52,fontSize*.24);target.x=Math.tanh((current.x-lastPointer.x)/dt/1.15)*limit;target.y=Math.tanh((current.y-lastPointer.y)/dt/1.4)*limit*.26;lastInput=current.time;if(!frame){lastFrame=current.time;frame=requestAnimationFrame(animate);}}else{center[0].value=colorCenter[0].value=current.x;center[1].value=colorCenter[1].value=current.y;}lastPointer=current;}
 function leave(){hovered=false;lastPointer=null;lastInput=-Infinity;if(gpu&&frame)title.dataset.elasticPhase='recovering';}
 function teardown(){neutral();cancelAnimationFrame(resizeFrame);observer?.disconnect();observer=null;gpu?.dispose();gpu=null;canvas?.remove();canvas=null;title.classList.remove('elastic-title');title.dataset.elasticPhase='disabled';}
 async function initialize(){
  if(disposed||initializing||gpu||!enabled.matches)return;
  initializing=true;
  await document.fonts.ready;
  initializing=false;
  if(disposed||!enabled.matches||gpu)return;
  const candidate=document.createElement('canvas');
  candidate.className='elastic-canvas';
  candidate.setAttribute('aria-hidden','true');
  try{gpu=renderer(candidate);}catch{gpu=null;}
  if(!gpu){title.dataset.elasticPhase='disabled';return;}
  canvas=candidate;
  title.classList.add('elastic-title');
  title.append(canvas);
  canvas.addEventListener('webglcontextlost',()=>{
   // An old context may finish closing after a new media-query initialization.
   if(candidate!==canvas)return;
   title.classList.remove('elastic-rendering');
   title.dataset.elasticPhase='disabled';
   cancelAnimationFrame(frame);
   frame=0;
   observer?.disconnect();observer=null;
   gpu=null;canvas.remove();canvas=null;
  });
  resize();
  observer=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(resize);});
  observer.observe(title);
 }
 const mediaChange=()=>enabled.matches?initialize():teardown(),blur=()=>leave(),scroll=()=>{if(!title.matches(':hover'))leave();},visibility=()=>{if(document.hidden)neutral();};
 title.addEventListener('pointerenter',pointer);title.addEventListener('pointermove',pointer);title.addEventListener('pointerleave',leave);title.addEventListener('pointercancel',leave);window.addEventListener('blur',blur);window.addEventListener('scroll',scroll,{passive:true});document.addEventListener('visibilitychange',visibility);enabled.addEventListener('change',mediaChange);title.dataset.elasticPhase='disabled';initialize();
 return{dispose(){disposed=true;teardown();title.removeEventListener('pointerenter',pointer);title.removeEventListener('pointermove',pointer);title.removeEventListener('pointerleave',leave);title.removeEventListener('pointercancel',leave);window.removeEventListener('blur',blur);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);enabled.removeEventListener('change',mediaChange);delete title.dataset.elasticPhase;}};
}
