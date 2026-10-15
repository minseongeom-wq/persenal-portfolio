import {CURL_OPTIONS} from './project-curl-config.js';
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const profile=y=>1-Math.sqrt(Math.max(0,1-(2*y-1)**2));

// Return horizontal sampling displacement in local CSS pixels, before strength.
// Media use their own coordinate system, with fixed edges and no overscan.
export function curlDisplacement(x,y,width,height,media=[],guard=0,rowProfiles=null){
 if(x<=0||x>=width||y<=0||y>=height)return 0;
 let displacement=(width*.5-x)*(rowProfiles?.[0]??profile(y/height));
 for(let index=0;index<media.length;index++){
  const rect=media[index];
  const edgeX=Math.min(x-rect.x,rect.x+rect.width-x);
  const edgeY=Math.min(y-rect.y,rect.y+rect.height-y);
  if(edgeX>=0&&edgeY>=0){
   const falloff=smooth((edgeX-guard)/(rect.width*.15));
   displacement=(rect.width*.5-(x-rect.x))*(rowProfiles?.[index+1]??profile((y-rect.y)/rect.height))*falloff;
  }else{
   // Also neutralize the surrounding pixels: otherwise a section-level sample
   // can pull a second copy of a media edge into the transparent exterior.
   const dx=Math.max(0,-edgeX),dy=Math.max(0,-edgeY),halo=width*CURL_OPTIONS.maxStrength+guard;
   // Outside the falloff radius the multiplier is exactly 1; avoid a square root.
   if(dx>=guard+halo||dy>=guard+halo)continue;
   displacement*=smooth((Math.hypot(dx,dy)-guard)/halo);
  }
 }
 return displacement;
}

export function createCurlMap(width,height,media){
 const pad=Math.ceil(width*.08),map=document.createElement('canvas');
 map.width=512;map.height=Math.max(2,Math.min(4096,Math.ceil(512*(height+2*pad)/(width+2*pad))));
 const ctx=map.getContext('2d'),pixels=ctx.createImageData(map.width,map.height);
 const stepX=(width+2*pad)/map.width,stepY=(height+2*pad)/map.height,guard=2*Math.max(stepX,stepY);
 for(let row=0;row<map.height;row++){
  const y=(row+.5)*stepY-pad;
  // Curvature depends only on Y; share it across all 512 pixels in this row.
  const rowProfiles=[profile(y/height),...media.map(rect=>profile((y-rect.y)/rect.height))];
  for(let col=0;col<map.width;col++){
   const x=(col+.5)*stepX-pad,i=(row*map.width+col)*4;
   const displacement=curlDisplacement(x,y,width,height,media,guard,rowProfiles);
   // 128 is decoded to EXACT zero by the component transfer in scroll-curl.js.
   pixels.data[i]=Math.max(0,Math.min(255,Math.round(128+255*displacement/width)));
   pixels.data[i+1]=128;pixels.data[i+2]=128;pixels.data[i+3]=255;
  }
 }
 ctx.putImageData(pixels,0,0);
 return {href:map.toDataURL(),pad};
}
