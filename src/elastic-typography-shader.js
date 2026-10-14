export const vertexShader=`attribute vec2 a_position; varying vec2 v_uv;
void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
// Smooth, compact deformation of the actual silhouette; no turbulence/noise.
export const fragmentShader=`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_letters;
uniform vec2 u_size,u_center,u_colorCenter,u_pull,u_redPull,u_cyanPull,u_radius;
uniform float u_active,u_strength,u_intro;
float ink(vec2 p){vec2 uv=vec2(p.x/u_size.x,1.-p.y/u_size.y);if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return 0.;return texture2D(u_letters,uv).a;}
float localInfluence(vec2 p,vec2 center){vec2 q=(p-center)/u_radius;float f=max(0.,1.-dot(q,q));return f*f*(.82+.18*cos(q.y*4.1+q.x*1.6));}
// The two-line hero shares the entrance sweep; interactive effects stay local.
float influence(vec2 p,vec2 center){float first=localInfluence(p,center);float second=localInfluence(p,center+vec2(0.,u_radius.y/.48));return max(first,second*u_intro);}
vec2 displaced(vec2 p,vec2 center,vec2 pull){float weight=influence(p,center);if(weight<.0001||length(pull)<.0001)return p;float dx=ink(p+vec2(1.,0.))-ink(p-vec2(1.,0.));float dy=ink(p+vec2(0.,1.))-ink(p-vec2(0.,1.));float terminal=.76+.24*abs(dx)/(abs(dx)+abs(dy)+.08);return p-pull*weight*terminal;}
float blackInk(vec2 p){return ink(displaced(p,u_center,u_pull));}
void main(){
 vec2 p=vec2(v_uv.x,1.-v_uv.y)*u_size;
 float black=blackInk(p),local=influence(p,u_center);
 // Keep color in a thin band around the deformed black edge, never a full RGB duplicate.
 float band=1.40+min(5.,length(u_pull)*.1125);
 float right=blackInk(p+vec2(band,0.)),left=blackInk(p-vec2(band,0.));
 float edge=max(max(right,left),max(blackInk(p+vec2(0.,band)),blackInk(p-vec2(0.,band))));
 vec2 r=displaced(p,u_colorCenter,u_redPull),c=displaced(p,u_colorCenter,u_cyanPull);
 vec4 masks=vec4(ink(r-vec2(.625,-.15)),ink(r-vec2(1.15+local*u_strength*.94,.15)),ink(c+vec2(.60,-.20)),ink(c+vec2(.975,.275)));
 // Distinct warm/cool ink edges instead of blending all channels into a dull halo.
 float warm=clamp(.5+(left-right)*.5,0.,1.);
 masks*=vec4(warm,warm,1.-warm,1.-warm);
 masks.g=max(0.,masks.g-masks.r*.85);masks.a=max(0.,masks.a-masks.b*.85);
 // Entrance only: expose the stretched RGB strokes beyond the narrow edge band.
 float trail=influence(p,u_colorCenter)*u_intro*u_strength;
 masks*=max(edge,trail)*(1.-black)*mix(.17,.94,min(1.,max(local,trail)*u_strength*2.4));
 vec3 rgb=masks.r*vec3(1.,.025,.055)+masks.g*vec3(1.,.78,.015)+masks.b*vec3(.015,.78,1.)+masks.a*vec3(.025,.11,.95);
 float ca=max(max(masks.r,masks.g),max(masks.b,masks.a)),ba=black*u_active;
 float alpha=ba+ca*(1.-ba);
 vec3 color=rgb/max(.001,dot(masks,vec4(1.)));
 gl_FragColor=vec4(color*ca*(1.-ba)/max(alpha,.001),alpha);
}`;
