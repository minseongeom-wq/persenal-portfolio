import {CURL_OPTIONS} from './project-curl-config.js';
import {curlVertexShader,curlFragmentShader} from './project-curl-shader.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function createRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false});
 if(!gl)return null;
 const shaders=[],program=gl.createProgram();
 let buffer,texture;
 function dispose(){
  if(texture)gl.deleteTexture(texture);if(buffer)gl.deleteBuffer(buffer);
  shaders.forEach(shader=>gl.deleteShader(shader));gl.deleteProgram(program);
 }
 try{
  for(const [type,source] of [[gl.VERTEX_SHADER,curlVertexShader],[gl.FRAGMENT_SHADER,curlFragmentShader]]){
   const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
   gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  const strength=gl.getUniformLocation(program,'uCurlStrength'),cover=gl.getUniformLocation(program,'uCover');
  return {
   upload(source){gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);},
   draw(value,crop){gl.useProgram(program);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(strength,value);gl.uniform2f(cover,...crop);gl.drawArrays(gl.TRIANGLES,0,6);},
   dispose,
  };
 }catch{dispose();return null;}
}

/** Native video -> GPU texture, equivalent to VideoTexture without adding Three.js.
 * Rendering is driven by the existing project-media RAF, never by a second loop.
 */
export function createProjectCurl(media,{requestFrame=()=>{},options={}}={}){
 const params={...CURL_OPTIONS,...options},reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.className='project-gallery__curl';canvas.setAttribute('aria-hidden','true');
 media.append(canvas);media.dataset.curlTest='true';
 let renderer=null,failed=false,disposed=false,visible=false,activity=0,lastTime=0,lastY=scrollY;
 let lastSource=null,lastVideoTime=-1,dirty=true,width=1,height=1;
 const cleanups=[];
 function reset(){activity=0;lastTime=0;lastY=scrollY;canvas.style.opacity='0';media.dataset.curlStrength='0';}
 function resize(){
  const rect=media.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,params.maxPixelRatio);
  width=Math.max(1,rect.width);height=Math.max(1,rect.height);
  const w=Math.min(params.maxCanvasWidth,Math.max(1,Math.round(width*ratio))),h=Math.max(1,Math.round(w*height/width));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}
  requestFrame();
 }
 function sourceFor(){
  const video=media.querySelector('video');if(video)return video;
  // Sample the existing hover transition after it has drawn in the shared RAF.
  const transition=media.querySelector('.project-gallery__noise');
  if(transition?.dataset.noiseActive==='true')return transition;
  const card=media.closest('[data-project-index]'),link=document.querySelector(`[data-project-link="${card?.dataset.projectIndex}"]`);
  const color=card?.matches(':hover,:focus-visible')||link?.matches(':hover,:focus-visible');
  return media.querySelector(color?'.project-gallery__color':'.project-gallery__base')||media.querySelector('img');
 }
 function frame(now){
  if(disposed||failed||!visible||document.hidden||reduced.matches){reset();return false;}
  const dt=clamp((now-(lastTime||now-1000/60))/1000,1/240,.1),y=scrollY;
  const target=clamp(Math.abs(y-lastY)/dt/params.velocityReference,0,1);lastY=y;lastTime=now;
  const tau=(target>activity?params.attackMs:params.releaseMs)/1000;
  activity+=(target-activity)*(1-Math.exp(-dt/tau));
  if(activity<params.settleThreshold&&target===0){reset();return false;}
  const source=sourceFor(),video=source instanceof HTMLVideoElement;
  const sw=video?source.videoWidth:source?.naturalWidth||source?.width,sh=video?source.videoHeight:source?.naturalHeight||source?.height;
  if(!source||!sw||!sh||(video&&source.readyState<2))return true;
  if(!renderer){renderer=createRenderer(canvas);if(!renderer){failed=true;reset();return false;}}
  try{
   if(dirty||source!==lastSource||(video&&source.currentTime!==lastVideoTime)||source instanceof HTMLCanvasElement){
    renderer.upload(source);lastSource=source;lastVideoTime=video?source.currentTime:-1;dirty=false;
   }
   const sourceAspect=sw/sh,aspect=width/height;
   const cover=sourceAspect>aspect?[aspect/sourceAspect,1]:[1,sourceAspect/aspect];
   const strength=params.maxStrength*activity;
   renderer.draw(strength,cover);canvas.style.opacity='1';media.dataset.curlStrength=String(strength);
   return true;
  }catch{failed=true;reset();return false;} // CORS/upload failures also retain the DOM original.
 }
 const wake=()=>{if(!lastTime)lastY=previousY;if(visible&&!reduced.matches&&!failed)requestFrame();previousY=scrollY;};
 let previousY=scrollY;
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;
  if(!visible)reset();else{lastY=previousY=scrollY;requestFrame();}
 },{threshold:0});observer.observe(media);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(media);resize();
 const visibility=()=>{reset();if(!document.hidden)requestFrame();};
 function listen(target,event,fn,options){target.addEventListener(event,fn,options);cleanups.push(()=>target.removeEventListener(event,fn,options));}
 listen(window,'scroll',wake,{passive:true});listen(window,'resize',resize);listen(document,'visibilitychange',visibility);
 listen(reduced,'change',visibility);
 listen(canvas,'webglcontextlost',event=>{event.preventDefault();failed=true;reset();});
 for(const element of media.querySelectorAll('img,video'))for(const event of ['load','loadeddata','play','seeked'])listen(element,event,()=>{dirty=true;requestFrame();});
 return {frame,dispose(){disposed=true;observer.disconnect();resizeObserver.disconnect();cleanups.forEach(cleanup=>cleanup());reset();renderer?.dispose();canvas.remove();delete media.dataset.curlTest;delete media.dataset.curlStrength;}};
}
