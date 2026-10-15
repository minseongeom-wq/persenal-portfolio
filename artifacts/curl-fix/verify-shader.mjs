import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {curlVertexShader,curlFragmentShader} from '../../src/project-curl-shader.js';
import {CURL_OPTIONS} from '../../src/project-curl-config.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 const result=await page.evaluate(({vertex,fragment,strength})=>{
  const output=document.createElement('canvas');output.width=640;output.height=400;
  const gl=output.getContext('webgl',{preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
  const program=gl.createProgram();
  for(const [type,code] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
   const shader=gl.createShader(type);gl.shaderSource(shader,code);gl.compileShader(shader);
   if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());for(const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for(const mode of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,mode,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);const results=[];
  for(const [w,h] of [[640,320],[224,320],[512,320]]){
   const source=document.createElement('canvas');source.width=w;source.height=h;const ctx=source.getContext('2d');
   for(let x=0;x<w;x++){ctx.fillStyle=x<w*.03?'#ff0000':x>w*.97?'#0000ff':(Math.floor(x/8)%2?'#00ff00':'#ffff00');ctx.fillRect(x,0,1,h);}
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
   const aspect=640/400,sourceAspect=w/h,fit=sourceAspect>aspect?[1,sourceAspect/aspect]:[aspect/sourceAspect,1];
   gl.uniform2f(gl.getUniformLocation(program,'uCover'),...fit);
   let baseline;
   for(const curl of [0,strength,.06]){
    gl.uniform1f(gl.getUniformLocation(program,'uCurlStrength'),curl);gl.drawArrays(gl.TRIANGLES,0,6);
    const pixels=new Uint8Array(640*400*4);gl.readPixels(0,0,640,400,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    const sample=(u,v)=>{const x=Math.floor(((u-.5)/fit[0]+.5)*640),y=Math.floor(((v-.5)/fit[1]+.5)*400),i=(y*640+x)*4;return [...pixels.slice(i,i+4)];};
    for(const v of [.1,.5,.9]){
     const left=sample(.01,v),right=sample(.99,v);
     if(left[0]<240||left[1]>15||left[2]>15||left[3]!==255)throw Error('Left source border lost');
     if(right[2]<240||right[0]>15||right[1]>15||right[3]!==255)throw Error('Right source border lost');
    }
    if(curl===0)baseline=pixels;
    else{let changed=0;for(let i=0;i<pixels.length;i++)if(Math.abs(pixels[i]-baseline[i])>2)changed++;if(!changed)throw Error('Curl interior did not deform');}
    if(fit[0]>1&&pixels[3]!==0)throw Error('Portrait letterbox should remain transparent');
    if(fit[1]>1&&pixels[3]!==0)throw Error('Landscape letterbox should remain transparent');
    results.push({source:[w,h],strength:curl,edges:'preserved'});
   }
  }
  return {results,error:gl.getError()};
 },{vertex:curlVertexShader,fragment:curlFragmentShader,strength:CURL_OPTIONS.maxStrength});
 assert.equal(result.error,0);console.log(JSON.stringify(result));
}finally{await browser.close();}
