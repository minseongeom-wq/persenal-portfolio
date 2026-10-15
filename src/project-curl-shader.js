export const curlVertexShader=`
attribute vec2 aPosition;
varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`;

// Semicircular UV compression from HAOQI's scroll curl technique.
// No geometry deformation, channel splitting, noise or color adjustment.
export const curlFragmentShader=`
precision highp float;
varying vec2 vUv;
uniform sampler2D uMedia;
uniform float uCurlStrength;
uniform vec2 uCover;
void main(){
 vec2 fittedUv=(vUv-.5)*uCover+.5;
 if(any(lessThan(fittedUv,vec2(0.)))||any(greaterThan(fittedUv,vec2(1.)))){
  gl_FragColor=vec4(0.);return;
 }
 float centered=2.*fittedUv.y-1.;
 float profile=1.-sqrt(max(0.,1.-centered*centered));
 float edgeFalloff=smoothstep(0.,.15,min(fittedUv.x,1.-fittedUv.x));
 vec2 uv=vec2(fittedUv.x+(.5-fittedUv.x)*profile*uCurlStrength*edgeFalloff,fittedUv.y);
 gl_FragColor=texture2D(uMedia,clamp(uv,vec2(0.),vec2(1.)));
}
`;
