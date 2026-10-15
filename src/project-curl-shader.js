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
 float centered=2.*vUv.y-1.;
 float profile=1.-sqrt(max(0.,1.-centered*centered));
 vec2 uv=vec2((vUv.x-.5)*(1.-profile*uCurlStrength)+.5,vUv.y);
 uv=(uv-.5)*uCover+.5;
 gl_FragColor=texture2D(uMedia,uv);
}
`;
