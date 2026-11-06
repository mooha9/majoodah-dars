// مشغّل المجسمات ثلاثية الأبعاد داخل إطار معزول (sandbox). يُحقن نصّه في srcdoc.
// يوفّر للكود المولَّد: THREE, scene, camera, addLabel, onFrame, ui, kit
// kit = مكتبة مشاهد جاهزة عالية الجودة (بركان يثور، زلزال، طبقات الأرض، طقس، ماء، كواكب، جسيمات...)
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {CSS2DRenderer,CSS2DObject} from "three/addons/renderers/CSS2DRenderer.js";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {OutputPass} from "three/addons/postprocessing/OutputPass.js";

const PR=Math.min(2,devicePixelRatio||1);
const R=new THREE.WebGLRenderer({antialias:true});
R.setPixelRatio(PR);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(R.domElement);
const LR=new CSS2DRenderer();LR.domElement.style.cssText="position:absolute;top:0;left:0;pointer-events:none";document.body.appendChild(LR.domElement);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(45,1,0.1,300);camera.position.set(8,6.5,11);
const D2R=Math.PI/180,TAU=Math.PI*2;

function canvasTex(w,h,draw,srgb){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);if(srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function sky(top,bottom){scene.background=canvasTex(2,256,(g)=>{const gr=g.createLinearGradient(0,0,0,256);gr.addColorStop(0,top);gr.addColorStop(1,bottom);g.fillStyle=gr;g.fillRect(0,0,2,256)})}
sky("#7cc8ff","#e6f7ff");

const hemi=new THREE.HemisphereLight(0xffffff,0x9fb88a,1.1);scene.add(hemi);
const sunL=new THREE.DirectionalLight(0xfff2dc,2.2);sunL.position.set(7,12,6);sunL.castShadow=true;sunL.shadow.mapSize.set(1024,1024);
{const s=sunL.shadow.camera;s.left=-11;s.right=11;s.top=11;s.bottom=-11;s.near=1;s.far=45}sunL.shadow.bias=-0.0004;sunL.shadow.normalBias=0.03;scene.add(sunL);

const C=new OrbitControls(camera,R.domElement);C.enableDamping=true;C.autoRotate=true;C.autoRotateSpeed=0.7;C.target.set(0,1.5,0);C.minDistance=2.5;C.maxDistance=40;
const SW={on:false,user:false,base:0};R.domElement.addEventListener("pointerdown",()=>{C.autoRotate=false;SW.user=true});
// للمجسمات المقطوعة: تمايل هادئ يبقي المقطع الداخلي مواجهاً للطالب بدل الدوران الكامل
function sway(){if(SW.on)return;SW.on=true;C.autoRotate=false;const o=camera.position.clone().sub(C.target);SW.base=Math.atan2(o.x,o.z)}

const comp=new EffectComposer(R);comp.setPixelRatio(Math.min(1.5,PR));comp.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),0.45,0.4,1.0);comp.addPass(bloom);comp.addPass(new OutputPass());

const fr=[];const onFrame=f=>{if(typeof f==="function")fr.push(f)};
const V=(a,b,c)=>Array.isArray(a)?new THREE.Vector3(+a[0]||0,+a[1]||0,+a[2]||0):new THREE.Vector3(+a||0,+b||0,+c||0);
const LBC=["#ff7a2f","#7b4dff","#14a06f","#ff4f8b","#2f8cff","#e8a200"];let LBN=0;
const addLabel=(t,x,y,z)=>{const p=V(x,y,z);const e=document.createElement("div");e.className="lb";e.style.background=LBC[LBN++%LBC.length];e.textContent=String(t);const o=new CSS2DObject(e);o.position.copy(p);scene.add(o);return o};

const snd=(n,a,b)=>{try{parent.postMessage({snd:n,a:a,b:b},"*")}catch(e){}};
const U=document.getElementById("ui");let RS=null;
const ui={slider(l,mn,mx,v,st,u,cb){const w=document.createElement("label");w.className="sl";const n=document.createElement("span");n.textContent=l;const i=document.createElement("input");i.type="range";i.min=mn;i.max=mx;i.step=st||1;i.value=v;const b=document.createElement("b");const up=()=>{b.textContent=i.value+(u?" "+u:"");try{cb&&cb(+i.value)}catch(e){console.error(e)}};i.oninput=up;w.append(n,i,b);U.appendChild(w);up();return i},
 button(l,cb){const b=document.createElement("button");b.className="bt";b.textContent=l;b.onclick=()=>{C.autoRotate=false;snd("click");try{cb&&cb()}catch(e){console.error(e)}};U.appendChild(b);return b},
 result(t){if(!RS){RS=document.createElement("span");RS.className="rs";U.appendChild(RS)}RS.textContent=String(t)}};

// ---------- أدوات عامة ----------
function hash(x,y){const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function noise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y){let s=0,a=.5,f=1;for(let i=0;i<4;i++){s+=a*noise(x*f,y*f);f*=2.03;a*=.5}return s}
const rnd=(a)=>Array.isArray(a)?a[0]+Math.random()*(a[1]-a[0]):+a;
const pair=(a)=>Array.isArray(a)?[+a[0],+(a[1]??a[0])]:[+a,+a];
const col=(c)=>new THREE.Color(c==null?0xffffff:c);
function mat(color,o={}){return new THREE.MeshStandardMaterial(Object.assign({color:col(color),roughness:.8,metalness:0},o))}
function glowMat(color,intensity){return new THREE.MeshStandardMaterial({color:col(color),emissive:col(color),emissiveIntensity:intensity??2.5,roughness:.6})}
function shadowy(o){o.traverse(m=>{if(m.isMesh){const t=Array.isArray(m.material)?m.material.some(x=>x.transparent):m.material&&m.material.transparent;if(!t){m.castShadow=true;m.receiveShadow=true}}});return o}
function put(o,parent){(parent||scene).add(o);return o}
const lerp=(a,b,k)=>a+(b-a)*k,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;

// طبقات صخرية (نسيج جانبي) — colors من الأعلى للأسفل
function strataTex(colors,o={}){const W=512,H=256;return canvasTex(W,H,(g)=>{const img=g.createImageData(W,H),d=img.data,n=colors.length,cs=colors.map(c=>col(c).convertLinearToSRGB());
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=y/H+(fbm(x/70,y/90)-.5)*(o.wave??.12);let k=clamp(Math.floor(v*n),0,n-1);const c=cs[k];const s=.88+fbm(x/6,y/5)*.24;const i=(y*W+x)*4;d[i]=clamp(c.r*255*s,0,255);d[i+1]=clamp(c.g*255*s,0,255);d[i+2]=clamp(c.b*255*s,0,255);d[i+3]=255}
 g.putImageData(img,0,0)})}

// ---------- الجسيمات ----------
const TEX={};
function spriteTex(kind){if(TEX[kind])return TEX[kind];const s=64;TEX[kind]=canvasTex(s,s,(g)=>{
 if(kind==="smoke"||kind==="cloud"){for(let i=0;i<16;i++){const x=s/2+(Math.random()-.5)*s*.36,y=s/2+(Math.random()-.5)*s*.36,r=s*(.16+Math.random()*.16);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(255,255,255,.32)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,s,s)}}
 else if(kind==="drop"){const gr=g.createLinearGradient(0,0,0,s);gr.addColorStop(0,"rgba(255,255,255,0)");gr.addColorStop(1,"rgba(255,255,255,1)");g.fillStyle=gr;g.fillRect(s/2-2,4,4,s-8)}
 else if(kind==="bubble"){g.strokeStyle="rgba(255,255,255,.95)";g.lineWidth=4;g.beginPath();g.arc(s/2,s/2,s/2-6,0,TAU);g.stroke();g.fillStyle="rgba(255,255,255,.18)";g.fill()}
 else{const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);if(kind==="spark"){gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.2,"rgba(255,255,255,1)");gr.addColorStop(.45,"rgba(255,255,255,.25)")}else if(kind==="dust"){gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.5,"rgba(255,255,255,.7)")}else{gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.3,"rgba(255,255,255,.75)")}gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,s,s)}
},false);return TEX[kind]}
const PU={value:1};
const PV="attribute float aSize;attribute vec4 aCol;varying vec4 vC;uniform float uScale;void main(){vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*uScale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}";
const PF="uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb*t.rgb,vC.a*t.a);if(gl_FragColor.a<0.004)discard;}";
// kind: fire | smoke | spark | dust | drop | bubble | cloud
function particles(o={}){const N=o.max||800,kind=o.kind||"fire";
 const pos=new Float32Array(N*3),vel=new Float32Array(N*3),age=new Float32Array(N).fill(1e9),life=new Float32Array(N).fill(1),size=new Float32Array(N),cl=new Float32Array(N*4);
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(pos,3));geo.setAttribute("aSize",new THREE.BufferAttribute(size,1));geo.setAttribute("aCol",new THREE.BufferAttribute(cl,4));
 const add=o.additive!=null?!!o.additive:(kind==="fire"||kind==="spark");
 const m=new THREE.ShaderMaterial({uniforms:{map:{value:spriteTex(kind)},uScale:PU},vertexShader:PV,fragmentShader:PF,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending});
 const pts=new THREE.Points(geo,m);pts.frustumCulled=false;pts.renderOrder=add?3:2;put(pts,o.parent);
 const cc=Array.isArray(o.color)?o.color:[o.color??0xffffff,o.color??0xffffff];const c0=col(cc[0]),c1=col(cc[1]);
 const P={obj:pts,rate:o.rate??40,pos:V(o.pos||[0,0,0]),dir:V(o.dir||[0,1,0]).normalize(),spread:o.spread??.3,speed:o.speed??[1,2],life:o.life??[1,2],gravity:o.gravity??0,size:pair(o.size??[.3,.1]),opacity:pair(o.opacity??[1,0]),area:o.area||0,wind:V(o.wind||[0,0,0]),drag:o.drag||0,floor:o.floor,glow:o.glow??(add?2.2:1),on:o.on!==false};
 let acc=0,next=0;const tc=new THREE.Color(),dv=new THREE.Vector3();
 function spawn(){const i=next;next=(next+1)%N;age[i]=0;life[i]=Math.max(.05,rnd(P.life));let ax=0,az=0;
  if(Array.isArray(P.area)){ax=(Math.random()-.5)*P.area[0];az=(Math.random()-.5)*(P.area[1]??P.area[0])}else if(P.area){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*P.area;ax=Math.cos(a)*r;az=Math.sin(a)*r}
  pos[i*3]=P.pos.x+ax;pos[i*3+1]=P.pos.y;pos[i*3+2]=P.pos.z+az;
  dv.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(2*P.spread).add(P.dir).normalize().multiplyScalar(rnd(P.speed));vel[i*3]=dv.x;vel[i*3+1]=dv.y;vel[i*3+2]=dv.z}
 P.emit=n=>{for(let k=0;k<n;k++)spawn()};
 P.clear=()=>{age.fill(1e9)};
 onFrame((t,dt)=>{if(P.on&&P.rate>0){acc+=P.rate*dt;let g=0;while(acc>=1&&g++<400){spawn();acc--}}
  const f=P.drag?Math.max(0,1-P.drag*dt):1;
  for(let i=0;i<N;i++){if(age[i]>=life[i]){size[i]=0;cl[i*4+3]=0;continue}age[i]+=dt;const k=Math.min(1,age[i]/life[i]);
   vel[i*3+1]+=P.gravity*dt;if(f!==1){vel[i*3]*=f;vel[i*3+1]*=f;vel[i*3+2]*=f}
   pos[i*3]+=(vel[i*3]+P.wind.x)*dt;pos[i*3+1]+=(vel[i*3+1]+P.wind.y)*dt;pos[i*3+2]+=(vel[i*3+2]+P.wind.z)*dt;
   if(P.floor!=null&&pos[i*3+1]<P.floor){pos[i*3+1]=P.floor;vel[i*3]*=.3;vel[i*3+1]=0;vel[i*3+2]*=.3}
   size[i]=lerp(P.size[0],P.size[1],k);tc.copy(c0).lerp(c1,k);const gl=P.glow;cl[i*4]=tc.r*gl;cl[i*4+1]=tc.g*gl;cl[i*4+2]=tc.b*gl;cl[i*4+3]=lerp(P.opacity[0],P.opacity[1],k)*Math.min(1,k/.06)}
  geo.attributes.position.needsUpdate=true;geo.attributes.aSize.needsUpdate=true;geo.attributes.aCol.needsUpdate=true});
 return P}

// ---------- اهتزاز الكاميرا وتوجيهها ----------
const SH={a:0,t:0};
function shake(a,sec){SH.a=Math.max(SH.a*(SH.t>0?1:0),+a||.1);SH.t=Math.max(SH.t,+sec||1)}
const FOC={k:1};
function focus(x,y,z,dist){const tg=V(x,y,z),from=camera.position.clone(),t0=C.target.clone();const dir=from.clone().sub(t0).normalize();const to=tg.clone().add(dir.multiplyScalar(dist||camera.position.distanceTo(C.target)));FOC.k=0;FOC.f=(k)=>{const e=ease(k);C.target.lerpVectors(t0,tg,e);camera.position.lerpVectors(from,to,e)};C.autoRotate=false}
onFrame((t,dt)=>{if(SW.on&&!SW.user&&FOC.k>=1){const o=camera.position.clone().sub(C.target),r=Math.hypot(o.x,o.z),th=SW.base+.42*Math.sin(t*.35);camera.position.set(C.target.x+r*Math.sin(th),camera.position.y,C.target.z+r*Math.cos(th))}});
onFrame((t,dt)=>{if(FOC.k<1){FOC.k=Math.min(1,FOC.k+dt/1.2);FOC.f(FOC.k)}});

// ---------- أرض ----------
const GR=[],HOLES=[];
function ground(o={}){const S=o.size||18,h=o.height??.12,flat=o.flat??3.5;const g=new THREE.PlaneGeometry(S,S,96,96);g.rotateX(-Math.PI/2);
 const p=g.attributes.position,c=[],c0=col(o.color||"#8cc85e"),c1=col(o.color2||"#6fae48"),tc=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),w=clamp((r-flat)/2,0,1),n=fbm(x*.35+11,z*.35+3);p.setY(i,(n-.45)*h*2*w*(o.hills?3:1));tc.copy(c0).lerp(c1,fbm(x*.6,z*.6));c.push(tc.r,tc.g,tc.b)}
 g.setAttribute("color",new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));m.receiveShadow=true;m.position.copy(V(o.pos||[0,0,0]));GR.push(m);if(HOLES.length)m.visible=false;return put(m,o.parent)}

// كتلة طبقات صخرية: layers=[{color,h,name}] من الأعلى للأسفل
function strata(o={}){const w=o.w||6,d=o.d||4,L=o.layers||[{color:"#c9a46c",h:.6},{color:"#a87d4f",h:.8},{color:"#7d6450",h:1}];const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));let y=0;const pts=[];
 L.forEach((l,i)=>{const h=+l.h||.7;const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(l.color,{roughness:.95,map:strataTex([l.color,l.color],{wave:.05})}));m.position.y=y-h/2;g.add(m);pts.push([g.position.x+w/2+.2,g.position.y+y-h/2,g.position.z+d/2]);y-=h});
 put(shadowy(g),o.parent);return {group:g,points:{layers:pts}}}

// ---------- عناصر صغيرة ----------
function tree(x,z,s,parent){s=s||1;const g=new THREE.Group();const tr=new THREE.Mesh(new THREE.CylinderGeometry(.06*s,.09*s,.6*s,8),mat("#6b4a2f"));tr.position.y=.3*s;g.add(tr);
 const cc=["#3f7d3a","#4e8f42","#36703a"];for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry((.34-.07*i)*s,1),mat(cc[i],{flatShading:true}));b.position.set((Math.random()-.5)*.12*s,(.7+i*.24)*s,(Math.random()-.5)*.12*s);g.add(b)}
 g.position.set(+x||0,0,+z||0);return put(shadowy(g),parent)}
function palm(x,z,s,parent){s=s||1;const g=new THREE.Group();for(let i=0;i<6;i++){const k=new THREE.Mesh(new THREE.CylinderGeometry(.07*s,.09*s,.3*s,7),mat("#8a6a45"));k.position.set(i*.03*s,(.15+i*.28)*s,0);k.rotation.z=-.06*i;g.add(k)}
 for(let i=0;i<7;i++){const l=new THREE.Mesh(new THREE.ConeGeometry(.12*s,1.1*s,4),mat("#3d7a34",{flatShading:true}));l.position.set(.18*s,1.75*s,0);l.rotation.set(0,i/7*TAU,1.9);const p=new THREE.Group();p.add(l);p.rotation.y=i/7*TAU;p.position.set(.0,0,0);g.add(p)}
 g.position.set(+x||0,0,+z||0);return put(shadowy(g),parent)}
function house(x,z,s,color,parent){s=s||1;const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.9*s,.7*s,.8*s),mat(color||"#e8dcc4"));b.position.y=.35*s;g.add(b);
 const r=new THREE.Mesh(new THREE.ConeGeometry(.72*s,.45*s,4),mat("#a4553a",{flatShading:true}));r.rotation.y=Math.PI/4;r.position.y=.92*s;g.add(r);
 const dr=new THREE.Mesh(new THREE.BoxGeometry(.2*s,.34*s,.02),mat("#6b4a2f"));dr.position.set(0,.17*s,.41*s);g.add(dr);g.position.set(+x||0,0,+z||0);return put(shadowy(g),parent)}
const winTex=()=>TEX.win||(TEX.win=canvasTex(64,128,(g)=>{g.fillStyle="#d9d4c8";g.fillRect(0,0,64,128);g.fillStyle="#5d7f93";for(let y=8;y<124;y+=16)for(let x=8;x<60;x+=16)g.fillRect(x,y,9,10)}));
function tower(x,z,s,floors,parent){s=s||1;const f=floors||5;const g=new THREE.Group();const t=winTex().clone();t.needsUpdate=true;t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,f/8);
 const b=new THREE.Mesh(new THREE.BoxGeometry(.8*s,.32*f*s,.8*s),mat("#ffffff",{map:t}));b.position.y=.16*f*s;g.add(b);g.position.set(+x||0,0,+z||0);return put(shadowy(g),parent)}
function cloud(x,y,z,s,parent){s=s||1;const g=new THREE.Group();const m=mat("#ffffff",{roughness:1});for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.SphereGeometry((.45+Math.random()*.35)*s,16,12),m);b.position.set((i-3)*.42*s,Math.sin(i)*.15*s+(i%2)*.18*s,(Math.random()-.5)*.4*s);g.add(b)}g.position.set(+x||0,+y||0,+z||0);return put(g,parent)}
function rain(o={}){snd("rain",1);return particles(Object.assign({kind:"drop",pos:o.pos||[0,4,0],area:o.area||[3,2],dir:[0,-1,0],spread:.02,speed:[6,7.5],gravity:-3,life:[.55,.7],size:.16,color:o.color||"#8fc1ff",opacity:[.85,.85],rate:o.rate??120,max:700,additive:false},o))}
function sun(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[-5,6,-4]));const r=o.size||.9;g.add(new THREE.Mesh(new THREE.SphereGeometry(r,32,24),glowMat(o.color||"#ffcf40",3)));
 const L=new THREE.PointLight(0xffe2a0,o.light??30,30,1.6);g.add(L);put(g,o.parent);onFrame(t=>{g.children[0].rotation.y=t*.2});return g}
function water(o={}){const S=o.size||10;const geo=new THREE.PlaneGeometry(S,o.depth||S,64,64);geo.rotateX(-Math.PI/2);const base=geo.attributes.position.array.slice();
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col(o.color||"#2f86c4"),roughness:.15,metalness:.1,transparent:true,opacity:o.opacity??.88}));m.position.copy(V(o.pos||[0,0,0]));put(m,o.parent);const a=o.waves??.08;
 onFrame(t=>{const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=base[i*3],z=base[i*3+2];p.setY(i,Math.sin(x*1.3+t*1.6)*a+Math.cos(z*1.1+t*1.2)*a*.7)}p.needsUpdate=true;geo.computeVertexNormals()});return m}
// أسهم متحركة على مسار (دورة الماء، تيارات الحمل، الدورة الدموية...)
function flow(points,o={}){const curve=new THREE.CatmullRomCurve3(points.map(p=>V(p)),!!o.closed);const color=o.color||"#ff7a1a";const g=new THREE.Group();put(g,o.parent);
 g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,90,o.width??.035,8,!!o.closed),new THREE.MeshStandardMaterial({color:col(color),transparent:true,opacity:.35,emissive:col(color),emissiveIntensity:.4})));
 const n=o.count||6,ar=[];for(let i=0;i<n;i++){const a=new THREE.Mesh(new THREE.ConeGeometry((o.width??.035)*3.2,(o.width??.035)*8,12),glowMat(color,o.glow??1.4));g.add(a);ar.push(a)}
 const up=new THREE.Vector3(0,1,0),tg=new THREE.Vector3();const F={group:g,speed:o.speed??.12,on:true};
 onFrame(t=>{ar.forEach((a,i)=>{let u=((F.on?t*F.speed:0)+i/n)%1;a.position.copy(curve.getPointAt(u));tg.copy(curve.getTangentAt(u));a.quaternion.setFromUnitVectors(up,tg)})});return F}
function arrow(from,to,color,parent){const a=V(from),b=V(to),dir=b.clone().sub(a),len=dir.length();const h=new THREE.ArrowHelper(dir.normalize(),a,len,col(color||"#e1a23a").getHex(),Math.min(.5,len*.25),Math.min(.28,len*.14));return put(h,parent)}
function planet(o={}){const r=o.radius||1;const c1=o.color||"#d9a066",c2=o.color2||"#a8693a";const tex=canvasTex(256,128,(g,w,h)=>{for(let y=0;y<h;y++){const k=fbm(y/9,3.3)+(o.bands===false?0:Math.sin(y/h*Math.PI*9)*.15);g.fillStyle=k>.55?c1:c2;g.fillRect(0,y,w,1)}g.globalAlpha=.25;for(let i=0;i<300;i++){g.fillStyle=Math.random()<.5?c1:c2;g.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*30,2)}});
 const m=new THREE.Mesh(new THREE.SphereGeometry(r,48,32),mat("#ffffff",{map:tex,roughness:.9}));m.position.copy(V(o.pos||[0,1.5,0]));put(m,o.parent);
 if(o.ring){const rg=new THREE.Mesh(new THREE.RingGeometry(r*1.35,r*2.1,64),mat(o.ringColor||"#d8c69a",{side:THREE.DoubleSide,transparent:true,opacity:.8}));rg.rotation.x=-Math.PI/2+.35;m.add(rg)}
 onFrame((t,dt)=>{m.rotation.y+=dt*(o.spin??.3)});return m}

// ---------- البركان ----------
// kit.volcano({pos,height,radius,cutaway,underground}) → {erupt(power), calm(), group, points:{crater,vent,chamber,lava,ash,smoke,layers,crust}}
function volcano(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);
 const H=o.height||3.2,Rb=o.radius||3.4,cr=.55,cut=o.cutaway!==false,under=o.underground!==false,S=o.groundSize||7,DP=2.8;
 const surf=r=>r<=cr?H-.38*(1-(r/cr)**2):H*Math.pow(Math.max(0,1-(r-cr)/(Rb-cr)),1.55);
 const prof=[];const NP=48;for(let i=0;i<=NP;i++){const r=.001+Rb*i/NP;prof.push(new THREE.Vector2(r,surf(r)))}
 const SEG=120,lat=new THREE.LatheGeometry(prof,SEG,cut?Math.PI/2:0,cut?Math.PI*1.5:TAU);
 {const p=lat.attributes.position,cs=[],tc=new THREE.Color(),cB=col("#6e5b4c"),cM=col("#4f443d"),cT=col("#2f2826"),cR=col("#6e3324");
  for(let i=0;i<p.count;i++){const j=Math.floor(i/(NP+1)),u=j/SEG,w=cut?Math.min(1,Math.min(u,1-u)*14):1;const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,z);
   if(r>.05&&y>.02){const a=u*TAU*3,nn=(fbm(a+5,y*1.8)-.5)*.3*Math.min(1,r/1.2)*w;p.setX(i,x*(1+nn/r));p.setZ(i,z*(1+nn/r))}
   const k=y/H;tc.copy(cB).lerp(cM,clamp(k*1.4,0,1));if(k>.7)tc.lerp(cT,(k-.7)/.3);if(r<cr*1.05)tc.lerp(cR,.7);tc.multiplyScalar(.85+fbm(u*40,y*4)*.3);cs.push(tc.r,tc.g,tc.b)}
  lat.setAttribute("color",new THREE.Float32BufferAttribute(cs,3));lat.computeVertexNormals()}
 const cone=new THREE.Mesh(lat,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide}));cone.castShadow=cone.receiveShadow=true;g.add(cone);
 // المقطع الداخلي: طبقات حمم ورماد موازية للسفح + القناة
 if(cut){const sh=new THREE.Shape();sh.moveTo(0,0);prof.forEach(v=>sh.lineTo(v.x,v.y));sh.lineTo(0,0);const sg=new THREE.ShapeGeometry(sh,1);
  const uv=sg.attributes.uv,pp=sg.attributes.position;for(let i=0;i<pp.count;i++)uv.setXY(i,pp.getX(i)/Rb,pp.getY(i)/H);
  const tex=canvasTex(256,256,(gx,W,Hh)=>{const img=gx.createImageData(W,Hh),d=img.data,ash=[150,140,128],lav=[92,58,46],lt=[176,140,118];
   for(let py=0;py<Hh;py++)for(let px=0;px<W;px++){const r=px/W*Rb,y=(1-py/Hh)*H,dd=surf(r)-y;let c;const cw=.17+.03*Math.sin(y*7);
    if(r<cw){const k=1-r/cw;c=[255,120+100*k,30+40*k]}else{const b=Math.floor(dd*5.5+(fbm(px/40,py/40)-.5)*1.2);c=b%3===0?lav:b%3===1?ash:lt}
    const s=.86+fbm(px/5,py/5)*.28,i=(py*W+px)*4;d[i]=clamp(c[0]*s,0,255);d[i+1]=clamp(c[1]*s,0,255);d[i+2]=clamp(c[2]*s,0,255);d[i+3]=255}gx.putImageData(img,0,0)});
  const cm=new THREE.MeshStandardMaterial({map:tex,roughness:.95,side:THREE.DoubleSide});const c1=new THREE.Mesh(sg,cm),c2=new THREE.Mesh(sg,cm);c2.rotation.y=-Math.PI/2;c1.receiveShadow=c2.receiveShadow=true;g.add(c1,c2)}
 // الأرض تحت البركان مع مقطع
 const chY=-1.75;let chamber=null,conduit=null;
 if(under){const sideT=strataTex(["#b39a74","#8e7458","#7a6450","#5f5048","#4d4140"]);const topM=mat("#86c45a",{roughness:.95});const sm=mat("#ffffff",{map:sideT,roughness:.95});const ms=[sm,sm,topM,sm,sm,sm];
  const box=(w,dd,x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,DP,dd),ms);m.position.set(x,-DP/2-.001,z);m.receiveShadow=true;g.add(m)};
  if(cut){box(2*S,S,0,-S/2);box(S,S,-S/2,S/2);HOLES.push(1);C.target.set(g.position.x,g.position.y+.6,g.position.z);camera.position.set(g.position.x+9,g.position.y+6.5,g.position.z+11.5);sway();GR.forEach(m=>m.visible=false);const fl=new THREE.Mesh(new THREE.CircleGeometry(S*2.2,64),mat("#bfe6a0",{roughness:1}));fl.rotation.x=-Math.PI/2;fl.position.y=-DP-.02;fl.receiveShadow=true;g.add(fl)}else box(2*S,2*S,0,0);
  chamber=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),glowMat("#ff4a10",1.2));chamber.scale.set(1.5,.62,1.5);chamber.position.y=chY;g.add(chamber);
  const cl=H-.38-chY;conduit=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,cl,20),glowMat("#ff5a14",1.3));conduit.position.y=chY+cl/2;g.add(conduit);
  const pl=new THREE.PointLight(0xff6a2a,cut?6:0,7,1.5);pl.position.set(1,-1.1,1);g.add(pl)}
 // بحيرة الحمم في الفوهة
 const pool=new THREE.Mesh(new THREE.CircleGeometry(cr*.82,40,0,cut?Math.PI*1.5:TAU),glowMat("#ff4a10",1.2));pool.rotation.x=-Math.PI/2;pool.position.y=H-.33;g.add(pool);
 const cl=new THREE.PointLight(0xff5522,1.5,9,1.6);cl.position.set(0,H+.4,0);g.add(cl);
 // تدفقات الحمم على السفح
 const flows=[];[2.25,3.35,4.45,5.5].forEach((ph,k)=>{const pts=[];for(let i=0;i<=30;i++){const r=cr*.95+(Rb+.9-cr*.95)*i/30,y=(r<Rb?surf(r):0)+.1,f=ph+.16*Math.sin(r*1.7+k*2);pts.push(new THREE.Vector3(r*Math.sin(f),y,r*Math.cos(f)))}
  const cv=new THREE.CatmullRomCurve3(pts),tg=new THREE.TubeGeometry(cv,90,.085+.02*(k%2),7),mm=new THREE.MeshStandardMaterial({color:col("#2a1610"),emissive:col("#ff3a00"),emissiveIntensity:1.5,roughness:.7});
  const m=new THREE.Mesh(tg,mm);tg.setDrawRange(0,0);g.add(m);flows.push({m,tg,p:0,tot:tg.index.count,heat:1,delay:k*.5})});
 // الجسيمات
 const top=[0,H-.2,0];
 const lava=particles({parent:g,kind:"fire",pos:top,spread:.26,speed:[3.5,7.5],gravity:-7,life:[1,1.9],size:[.3,.09],color:["#ffc24a","#ff2200"],opacity:[1,.15],rate:0,max:1100,glow:1.5});
 const bombs=particles({parent:g,kind:"spark",pos:top,spread:.45,speed:[5,9],gravity:-8,life:[1.4,2.3],size:.16,color:["#ffb347","#a51800"],opacity:[1,.6],rate:0,max:200,glow:1.6,floor:0});
 const smoke=particles({parent:g,kind:"smoke",pos:[0,H+.2,0],spread:.12,speed:[.8,1.5],gravity:.12,drag:.25,life:[5,8],size:[.9,4.4],color:["#4e4844","#bdb6ad"],opacity:[.8,0],wind:[.28,0,.05],rate:2.5,max:320,additive:false});
 const ash=particles({parent:g,kind:"dust",pos:[1.2,H+3.6,0],area:2.2,dir:[0,-1,0],spread:.6,speed:[.2,.5],gravity:-.35,life:[4,6],size:.07,color:"#3a3330",opacity:[.9,0],rate:0,max:500,additive:false});
 const st={p:0,on:false,t:0};
 function erupt(pw){const p=clamp(pw==null?1:+pw,0.05,1);st.p=p;st.on=true;st.t=0;lava.rate=260*p;bombs.rate=16*p;smoke.rate=10+26*p;ash.rate=50*p;lava.speed=[3.5+2*p,6+3*p];lava.emit(Math.round(60*p));shake(.05+.08*p,1.4);snd("explosion",p);flows.forEach(f=>f.heat=1)}
 function calm(){snd("stop");st.on=false;lava.rate=0;bombs.rate=0;ash.rate=0;smoke.rate=2.5}
 onFrame((t,dt)=>{const p=st.on?st.p:0;cl.intensity=(1.5+p*9)*(.8+.4*noise(t*6,1));pool.material.emissiveIntensity=1.1+p*.8+.25*Math.sin(t*4);
  if(chamber)chamber.material.emissiveIntensity=1.1+p*.9+.25*Math.sin(t*2.5);if(conduit)conduit.material.emissiveIntensity=1.2+p*1.2*(.7+.3*Math.sin(t*9));
  if(st.on){st.t+=dt;flows.forEach(f=>{if(st.t>f.delay)f.p=Math.min(1,f.p+dt*.07*(.4+p))})}
  flows.forEach(f=>{const n=Math.floor(f.tot*f.p/42)*42;f.tg.setDrawRange(0,n);f.heat=st.on?Math.min(1,f.heat+dt):Math.max(.12,f.heat-dt*.05);f.m.material.emissiveIntensity=1.6*f.heat})});
 const P=(x,y,z)=>[g.position.x+x,g.position.y+y,g.position.z+z];
 return {group:g,erupt,calm,lava,smoke,ash,bombs,height:H,
  points:{crater:P(0,H+.15,0),vent:P(.25,H*.55,.25),conduit:P(.25,H*.55,.25),chamber:P(1,chY,1),magma:P(1,chY,1),lava:P(Rb*.6*Math.sin(5.5),surf(Rb*.6)+.3,Rb*.6*Math.cos(5.5)),smoke:P(1.2,H+3,.2),ash:P(1.6,H+2.6,.2),layers:P(1.8,surf(1.8)*.45,.02),crust:P(-S*.6,-.9,S*.02+.01),cone:P(-Rb*.45,surf(Rb*.45),-Rb*.45)}}}

// ---------- الزلزال ----------
// kit.earthquake({pos,width,depth}) → {quake(magnitude 1..9), reset(), points:{focus,epicenter,fault,waves,crust}}
function earthquake(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);const W=o.width||5,D=o.depth||7,T=2.6;
 const sideT=strataTex(["#c4a06a","#a67c50","#8b6a4b","#6c594a","#54463f"]),sm=mat("#ffffff",{map:sideT,roughness:.95}),tm=mat(o.color||"#8fcf62",{roughness:.95}),ms=[sm,sm,tm,sm,sm,sm];
 const mk=(sx)=>{const b=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(W,T,D),ms);m.position.set(sx*W/2,-T/2,0);m.castShadow=m.receiveShadow=true;b.add(m);
  const rd=new THREE.Mesh(new THREE.BoxGeometry(W,.02,.7),mat("#3d3d40",{roughness:.7}));rd.position.set(sx*W/2,.012,.4);b.add(rd);
  for(let i=0;i<5;i++){const ln=new THREE.Mesh(new THREE.BoxGeometry(.35,.025,.06),mat("#f2d36b"));ln.position.set(sx*(.35+i*.95),.02,.4);b.add(ln)}g.add(b);return b};
 const A=mk(-1),B=mk(1);C.target.set(g.position.x,g.position.y-.9,g.position.z);camera.position.set(g.position.x+8.5,g.position.y+6,g.position.z+10.5);{const fl=new THREE.Mesh(new THREE.CircleGeometry(W*2.6,64),mat("#bfe6a0",{roughness:1}));fl.rotation.x=-Math.PI/2;fl.position.y=-T-.03;fl.receiveShadow=true;g.add(fl)}const gap=new THREE.Mesh(new THREE.BoxGeometry(1,T*.98,D*.98),mat("#1e1814"));gap.position.y=-T/2-.05;gap.scale.x=.001;g.add(gap);
 const blds=[];const addB=(blk,obj,x,z,w)=>{const pv=new THREE.Group();pv.position.set(x,0,z);obj.position.set(0,0,0);pv.add(obj);blk.add(pv);blds.push({pv,obj,w,fall:0,dir:Math.random()<.5?1:-1,tilt:0})};
 addB(A,tower(0,0,1,7,new THREE.Group()),-3.4,-1.8,.8);addB(A,house(0,0,1.1,"#efe3c8",new THREE.Group()),-1.5,-1.9,.9);addB(A,house(0,0,1,"#e6d2b0",new THREE.Group()),-3.2,1.9,.9);addB(A,tree(0,0,1,new THREE.Group()),-1.3,2,.5);
 addB(B,tower(0,0,1,5,new THREE.Group()),1.6,-2,.8);addB(B,house(0,0,1.1,"#f0e6d0",new THREE.Group()),3.3,-1.6,.9);addB(B,tower(0,0,.9,9,new THREE.Group()),3.4,2,.8);addB(B,tree(0,0,1.1,new THREE.Group()),1.5,2.2,.5);
 // البؤرة والمركز السطحي
 const fy=-T*.62,fz=D/2+.02;const foc=new THREE.Mesh(new THREE.SphereGeometry(.16,24,16),glowMat("#ff3b1f",3));foc.position.set(0,fy,fz);g.add(foc);
 const epi=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.03,24),glowMat("#ff3b1f",2));epi.position.set(0,.03,D/2-.25);g.add(epi);
 const rings=[];const ring=(face)=>{const geo=face?new THREE.RingGeometry(.9,1,64):new THREE.RingGeometry(.92,1,64,1,0,Math.PI);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:face?0xffb347:0xff7043,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));
  if(face)m.position.set(0,fy,fz+.01);else{m.rotation.x=-Math.PI/2;m.position.set(0,.05,D/2-.25)}m.scale.setScalar(.1);g.add(m);rings.push({m,k:0})};
 const dust=particles({parent:g,kind:"smoke",pos:[0,.1,0],area:[.4,D*.9],spread:.5,speed:[.3,.8],gravity:.1,drag:.4,life:[2,3.5],size:[.4,1.6],color:["#b49c7c","#d8cbb6"],opacity:[.7,0],rate:0,max:300,additive:false});
 const q={on:false,t:0,dur:0,amp:0,m:0,off:0,offT:0,ringT:0};
 function quake(mag){const m=clamp(+mag||5,1,9);Object.assign(q,{on:true,t:0,m,dur:2.2+m*.45,amp:Math.min(.3,.006*Math.pow(1.75,m-1)),offT:m>=6?Math.min(.9,.16*(m-5)):0,ringT:0});
  blds.forEach(b=>{b.fall=m>=7&&Math.random()<(m-6)/3.2?1:0});shake(Math.min(.35,q.amp*1.4),q.dur*.8);snd("quake",m,q.dur);if(m>=6)setTimeout(()=>snd("crack"),500);q.fellSnd=false;foc.scale.setScalar(1)}
 function reset(){snd("stop");q.on=false;q.off=0;A.position.set(0,0,0);B.position.set(0,0,0);gap.scale.x=.001;blds.forEach(b=>{b.tilt=0;b.fall=0;b.pv.rotation.set(0,0,0)});dust.clear()}
 onFrame((t,dt)=>{foc.material.emissiveIntensity=2.2+Math.sin(t*5)*.8;
  rings.forEach(r=>{r.k+=dt*.45;r.m.scale.setScalar(.1+r.k*4.5);r.m.material.opacity=Math.max(0,.9*(1-r.k));if(r.k>=1){g.remove(r.m);r.m.geometry.dispose()}});for(let i=rings.length-1;i>=0;i--)if(rings[i].k>=1)rings.splice(i,1);
  if(!q.on)return;q.t+=dt;const k=q.t/q.dur,env=k<.15?k/.15:Math.max(0,1-(k-.15)/.85);
  q.ringT-=dt;if(k<.6&&q.ringT<=0){ring(true);ring(false);q.ringT=.45}
  q.off=lerp(q.off,q.offT,Math.min(1,dt*1.6));const a=q.amp*env;
  A.position.set(Math.sin(t*41)*a,Math.sin(t*33)*a*.4,Math.cos(t*37)*a*.6);B.position.set(Math.sin(t*39+1)*a+q.off*.45,Math.sin(t*29)*a*.4-q.off,Math.cos(t*43)*a*.6);gap.scale.x=Math.max(.001,q.off*.45);
  if(q.offT>0&&env>.3)dust.rate=40*env;else dust.rate=0;
  blds.forEach((b,i)=>{if(b.fall&&q.t>.6&&!q.fellSnd){q.fellSnd=true;snd("collapse")}if(b.fall){b.tilt=Math.min(1.45,b.tilt+dt*(.25+b.tilt*2.2)*(q.t>.6?1:0))}const wob=Math.sin(t*22+i)*a*1.4;b.pv.rotation.z=b.dir*(b.tilt+wob)});
  if(k>=1){q.on=false;dust.rate=0}});
 const P=(x,y,z)=>[g.position.x+x,g.position.y+y,g.position.z+z];
 return {group:g,quake,reset,points:{focus:P(0,fy,fz),epicenter:P(0,.15,D/2-.25),fault:P(0,.1,-D/2+.4),waves:P(1.4,fy+.9,fz),crust:P(-W*.8,-T*.3,D/2),plates:P(W*.75,-.4,D/2)}}}

// ---------- طبقات الأرض ----------
// kit.earthLayers({pos,radius}) → {group, points:{crust,mantle,outerCore,innerCore}}
function earthLayers(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,2,0]));put(g,o.parent);const Rr=o.radius||2.4;
 const tex=canvasTex(512,256,(gx,w,h)=>{const img=gx.createImageData(w,h),d=img.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=fbm(x/48+(x>w-48?0:0),y/40);const land=n>.52,lat=Math.abs(y/h-.5)*2;let c=land?(lat>.82?[240,244,246]:n>.62?[150,128,88]:[86,138,72]):[34,96,168];if(!land&&lat>.88)c=[230,238,242];const i=(y*w+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}gx.putImageData(img,0,0)});
 sway();const outer=new THREE.Mesh(new THREE.SphereGeometry(Rr,64,48,Math.PI,Math.PI*1.5),mat("#ffffff",{map:tex,roughness:.8,side:THREE.DoubleSide}));g.add(outer);
 const L=[{r:1,c:"#8b6b4a",e:0},{r:.9,c:"#e0652a",e:.5},{r:.55,c:"#f7a531",e:.6},{r:.22,c:"#ffd54a",e:1.1}];
 L.forEach((l,i)=>{const rin=(L[i+1]?L[i+1].r:0)*Rr,rout=l.r*Rr;const m=new THREE.MeshStandardMaterial({color:col(l.c),emissive:col(l.c),emissiveIntensity:l.e,roughness:.85,side:THREE.DoubleSide});
  const geo=new THREE.RingGeometry(Math.max(.001,rin),rout,96,1,-Math.PI/2,Math.PI);const a=new THREE.Mesh(geo,m),b=new THREE.Mesh(geo,m);b.rotation.y=-Math.PI/2;g.add(a,b)});
 onFrame(t=>{});const P=(r,ang)=>{const a=ang*D2R;return [g.position.x+Math.cos(a)*r*Rr*.72,g.position.y+Math.sin(a)*r*Rr,g.position.z+Math.cos(a)*r*Rr*.72]};
 return {group:g,points:{crust:P(.96,62),mantle:P(.74,36),outerCore:P(.4,8),innerCore:P(.14,-62)}}}

// ---------- أجهزة الجسم (هضم، تنفس، دوران) ----------
// أدوات: أنبوب بنصف قطر متغيّر ولون متدرّج، كتلة عضوية، خلايا تتحرك على مسار، تأطير الكاميرا
const WP=(g,p)=>{g.updateMatrixWorld(true);const v=g.localToWorld(V(p));return [v.x,v.y,v.z]};
function view(px,py,pz,tx,ty,tz){camera.position.set(px,py,pz);C.target.set(tx,ty,tz);camera.lookAt(tx,ty,tz);C.minDistance=1.2}
function bodySky(){sky("#bfe3ff","#fff4e3");hemi.groundColor=col("#ffe6cc");hemi.intensity=1.5;sunL.intensity=2.6}
// vtube(points,{r:number|fn(t), color|colorFn(t), seg, radial, opacity, closed, parent})
function vtube(points,o={}){const curve=points.getPointAt?points:new THREE.CatmullRomCurve3(points.map(p=>V(p)),!!o.closed,"centripetal");const S=o.seg||140,Rd=o.radial||16;
 const fr=curve.computeFrenetFrames(S,!!o.closed),pos=[],nor=[],uv=[],cl=[],idx=[],P=new THREE.Vector3(),N=new THREE.Vector3(),tc=new THREE.Color();
 const rf=typeof o.r==="function"?o.r:()=>(o.r??.1),cf=typeof o.colorFn==="function"?o.colorFn:null;
 for(let i=0;i<=S;i++){const t=i/S;curve.getPointAt(Math.min(t,1),P);const r=rf(t);if(cf)tc.copy(cf(t));
  for(let j=0;j<=Rd;j++){const a=j/Rd*TAU,c=Math.cos(a),s=Math.sin(a);N.set(0,0,0).addScaledVector(fr.normals[i],c).addScaledVector(fr.binormals[i],s).normalize();
   pos.push(P.x+N.x*r,P.y+N.y*r,P.z+N.z*r);nor.push(N.x,N.y,N.z);uv.push(t,j/Rd);if(cf)cl.push(tc.r,tc.g,tc.b)}}
 for(let i=0;i<S;i++)for(let j=0;j<Rd;j++){const a=i*(Rd+1)+j,b=a+Rd+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));if(cf)g.setAttribute("color",new THREE.Float32BufferAttribute(cl,3));g.setIndex(idx);
 const m=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:cf?0xffffff:col(o.color||"#e98a8a"),vertexColors:!!cf,roughness:o.rough??.45,clearcoat:.35,clearcoatRoughness:.4,transparent:(o.opacity??1)<1,opacity:o.opacity??1,depthWrite:(o.opacity??1)>=1,emissive:col(o.emissive||0),emissiveIntensity:o.ei??0}));
 m.userData.curve=curve;put(m,o.parent);return m}
// كتلة عضوية ناعمة (كبد، رئة، خلية...)
function blob(o={}){const g=new THREE.SphereGeometry(o.r||1,56,40),p=g.attributes.position,v=new THREE.Vector3(),sd=o.seed||1,amp=o.amp??.08;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=fbm(v.x*1.6+sd*3.1+v.z*.7,v.y*1.6+sd*1.7-v.z*.9);v.multiplyScalar(1+(n-.5)*amp*2);p.setXYZ(i,v.x,v.y,v.z)}
 g.computeVertexNormals();const s=o.scale||[1,1,1];g.scale(s[0],s[1],s[2]);
 const m=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({color:col(o.color||"#e07b7b"),roughness:o.rough??.5,clearcoat:.4,clearcoatRoughness:.35,transparent:(o.opacity??1)<1,opacity:o.opacity??1,depthWrite:(o.opacity??1)>=1,side:o.side||THREE.FrontSide,emissive:col(o.emissive||0),emissiveIntensity:o.ei??0}));
 m.position.copy(V(o.pos||[0,0,0]));if(o.rot)m.rotation.set(o.rot[0]||0,o.rot[1]||0,o.rot[2]||0);put(m,o.parent);return m}
// خلايا/جزيئات تتحرك على مسار: movers(curve,{n,speed,size,colorFn(u)|color,shape:'cell'|'ball',closed})
function movers(curve,o={}){if(!curve.getPointAt)curve=new THREE.CatmullRomCurve3(curve.map(p=>V(p)),!!o.closed,"centripetal");const n=o.n||30,sz=o.size||.07;
 const geo=o.shape==="cell"?new THREE.SphereGeometry(sz,16,10).scale(1,.42,1):new THREE.SphereGeometry(sz,14,10);
 const m=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35,emissive:col(o.emit||0),emissiveIntensity:o.ei??0}),n);m.frustumCulled=false;put(m,o.parent);
 const off=[],rot=[],M=new THREE.Matrix4(),Q=new THREE.Quaternion(),E=new THREE.Euler(),P=new THREE.Vector3(),SC=new THREE.Vector3(1,1,1),tc=new THREE.Color();
 for(let i=0;i<n;i++){off.push(o.even===false?Math.random():i/n);E.set(Math.random()*3,Math.random()*3,Math.random()*3);rot.push(new THREE.Quaternion().setFromEuler(E))}
 const F={mesh:m,curve,rate:1,speed:o.speed??.06,phase:0,on:true,visible:n,jitter:o.jitter??0,colorFn:o.colorFn||(()=>tc.set(o.color||"#e23b3b")),hide:o.hide};
 onFrame((t,dt)=>{if(F.on)F.phase+=dt*F.speed*F.rate;for(let i=0;i<n;i++){let u=off[i]+F.phase;u=u-Math.floor(u);
   if(i>=F.visible||(F.hide&&F.hide(u))){M.makeScale(0,0,0);m.setMatrixAt(i,M);continue}
   curve.getPointAt(u,P);if(F.jitter){P.x+=Math.sin(i*12.9+t*2)*F.jitter;P.y+=Math.cos(i*7.3+t*1.7)*F.jitter;P.z+=Math.sin(i*3.1+t*2.3)*F.jitter}
   Q.copy(rot[i]);M.compose(P,Q,SC);m.setMatrixAt(i,M);m.setColorAt(i,F.colorFn(u,i))}
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});return F}
const BLUE=col("#3d6df2"),RED=col("#e2333b");
function bloodCol(k,out){return (out||new THREE.Color()).copy(BLUE).lerp(RED,clamp(k,0,1))}

// غلاف جسم الإنسان الشفاف — kit.bodyShell({parent,opacity})
function bodyShell(o={}){const g=new THREE.Group();put(g,o.parent);const pr=[[0,0],[.5,.04],[.86,.35],[.95,1.1],[.88,1.9],[.92,2.8],[1.12,3.75],[1.05,4.12],[.55,4.36],[.27,4.45],[.25,4.72],[0,4.74]].map(p=>new THREE.Vector2(p[0],p[1]));
 const m=new THREE.MeshPhysicalMaterial({color:col(o.color||"#ffc9a8"),transparent:true,opacity:o.opacity??.2,roughness:.35,depthWrite:false,side:THREE.DoubleSide,clearcoat:.6});
 const tor=new THREE.Mesh(new THREE.LatheGeometry(pr,64),m);tor.scale.set(1,1,.58);g.add(tor);
 const hd=new THREE.Mesh(new THREE.SphereGeometry(.5,40,30),m);hd.scale.set(.86,1.05,.95);hd.position.set(0,5.18,.05);g.add(hd);
 [-1,1].forEach(s=>{const a=vtube([[s*1.02,3.85,0],[s*1.3,3.2,0],[s*1.42,2.3,.1],[s*1.45,1.5,.25]],{r:t=>.24-.08*t,color:o.color||"#ffc9a8",opacity:o.opacity??.2,parent:g});a.material.side=THREE.DoubleSide;a.material.depthWrite=false});
 g.renderOrder=5;return g}

// جهاز الهضم — kit.digestive({parent,pos,shell}) → {group,start(),points}
function digestive(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);
 const eso=[[0,4.72,.36],[0,4.45,.14],[.02,3.9,.06],[.06,3.1,.1],[.22,2.74,.16]];
 const sto=[[.22,2.74,.16],[.46,2.7,.2],[.62,2.46,.22],[.58,2.14,.22],[.32,2.01,.22],[.06,2.1,.2],[-.08,2.2,.18]];
 const si=[[-.08,2.2,.18],[-.22,2.04,.16],[-.5,1.82,.24]];for(let r=0;r<7;r++){const y=1.78-r*.12,L=r%2?[.48,-.5]:[-.5,.48];si.push([L[0]*.82,y,.16+(r%3)*.07],[0,y-.03,.3-(r%2)*.1],[L[1]*.82,y-.06,.18+(r%2)*.08])}si.push([-.42,.86,.22],[-.66,.84,.22]);
 const li=[[-.66,.84,.22],[-.76,.98,.2],[-.78,1.5,.2],[-.74,1.94,.2],[-.3,2.0,.24],[.3,2.0,.24],[.76,1.92,.2],[.8,1.4,.2],[.78,.86,.2],[.5,.62,.18],[.12,.5,.12],[0,.32,.06],[0,.1,.04]];
 const pink="#ffa7a7";
 const E=vtube(eso,{r:.06,color:"#ff8f7f",parent:g});
 const ST=vtube(sto,{r:t=>.07+.21*Math.sin(Math.PI*Math.min(1,t*1.15)),color:"#ff6f86",parent:g,seg:90});
 const SI=vtube(si,{r:.058,color:pink,parent:g,seg:420,radial:12});
 const LI=vtube(li,{r:t=>.11+.018*Math.sin(t*95),color:"#f0a057",parent:g,seg:260});
 const LV=blob({r:.5,scale:[1.25,.62,.62],pos:[-.36,2.62,.22],rot:[0,0,-.18],color:"#b5473a",seed:3,parent:g});
 blob({r:.09,scale:[1,1.4,1],pos:[-.18,2.38,.42],color:"#4f9a3c",seed:5,parent:g});
 vtube([[.5,2.1,-.02],[.2,2.04,0],[-.08,2.01,.02]],{r:t=>.07-.03*t,color:"#f2c46b",parent:g});
 const curves=[E,ST,SI,LI].map(x=>x.userData.curve);
 const bolus=new THREE.Mesh(new THREE.SphereGeometry(.075,20,14),glowMat("#ffb347",.9));bolus.visible=false;g.add(bolus);
 const nut=particles({kind:"spark",parent:g,rate:0,color:["#ff5252","#ff9a9a"],size:[.16,.04],life:[.8,1.3],speed:[.3,.6],spread:1,max:300});
 const wat=particles({kind:"dust",parent:g,rate:0,color:["#4fb3ff","#9fd8ff"],size:[.14,.04],life:[.7,1.1],speed:[.25,.45],spread:1,max:200,additive:true});
 const ST_TXT=["الفم: تُمضغ اللقمة وتختلط باللعاب","المريء: تنزل اللقمة إلى المعدة","المعدة: الحمض والإنزيم يحلّلان الغذاء","الأمعاء الدقيقة: تُمتص المواد الغذائية إلى الدم","الأمعاء الغليظة: يُمتص الماء","تُطرح الفضلات خارج الجسم"];
 const DUR=[1.6,3.2,5.5,3.6],S={k:-1,t:0};
 const start=()=>{S.k=0;S.t=0;S.m1=0;bolus.visible=true;bolus.scale.setScalar(1.25);ui.result(ST_TXT[0]);snd("whoosh");};
 onFrame((t,dt)=>{ST.scale.setScalar(1);if(S.k<0)return;S.t+=dt;
  if(S.k===0&&S.t<.9){bolus.position.copy(V(eso[0]));return}
  if(S.k===0&&!S.m1){S.m1=1;ui.result(ST_TXT[1])}
  const k=S.k,c=curves[k],d=DUR[k],u=clamp((S.t-(k===0?.9:0))/d,0,1);const p=c.getPointAt(k===1?ease(u):u);bolus.position.copy(p);
  if(k===1){const w=1+.06*Math.sin(t*14);ST.scale.set(w,1,w);ST.position.set(-(w-1)*.4,0,0);bolus.scale.setScalar(1.25-.45*u);bolus.material.color.set("#ffb347").lerp(col("#e2c26a"),u)}
  if(k===2){nut.pos.copy(p);nut.emit(2);bolus.scale.setScalar(.8-.25*u)}
  if(k===3){wat.pos.copy(p);if(Math.random()<.5)wat.emit(1);bolus.material.color.set("#9a6b3c")}
  if(u>=1){S.k++;S.t=0;if(S.k<4){ui.result(ST_TXT[S.k+1]);snd("pop")}else{ui.result(ST_TXT[5]);bolus.visible=false;S.k=-1;snd("ding")}}
 });
 if(o.shell!==false)bodyShell({parent:g});
 if(!o.parent){bodySky();sway();view(0,2.6,7.2,0,2.45,0)}
 return {group:g,start,points:{mouth:WP(g,[0,4.72,.4]),esophagus:WP(g,[0,3.8,.1]),stomach:WP(g,[.66,2.4,.32]),liver:WP(g,[-.62,2.72,.42]),pancreas:WP(g,[.42,2.0,.05]),smallIntestine:WP(g,[0,1.3,.38]),largeIntestine:WP(g,[-.82,1.4,.3]),gallbladder:WP(g,[-.18,2.32,.5])}}}

// الجهاز التنفسي — kit.lungs({parent,pos,shell}) → {group,rate,setRate(n),points}
function lungs(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);
 const tr=vtube([[0,4.62,.16],[0,4.2,.13],[0,3.72,.12]],{r:.075,color:"#e9b4a8",parent:g});
 for(let i=0;i<9;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.08,.016,8,24),mat("#f6ddd2"));ring.rotation.x=Math.PI/2;ring.position.set(0,4.55-i*.095,.13);g.add(ring)}
 const L=[];const br=(a,b,r,d,parent)=>{vtube([a,[(a[0]+b[0])/2,(a[1]+b[1])/2+.03,(a[2]+b[2])/2],b],{r:t=>r*(1-.3*t),color:"#ffe0d6",parent,seg:20,radial:8});if(d<=0)return;
  const dx=b[0]-a[0],dy=b[1]-a[1];[[-.55,.0],[.45,.12],[.05,-.1]].forEach((q,i)=>{if(d<2&&i===2)return;const ang=Math.atan2(dy,dx)+q[0];const len=Math.hypot(dx,dy)*.68;const c=[b[0]+Math.cos(ang)*len,b[1]+Math.sin(ang)*len,b[2]+q[1]];br(b,c,r*.62,d-1,parent)})};
 [-1,1].forEach(s=>{const lg=new THREE.Group();lg.position.set(s*.5,3.45,.12);g.add(lg);
  const lb=blob({r:.5,scale:[.86,1.35,.74],pos:[0,0,0],color:"#ff8fab",opacity:.62,seed:s+4,amp:.05,parent:lg});lb.renderOrder=4;
  br([-s*.5,.32,0],[0,.12,0],.05,3,lg);L.push(lg)});
 const dia=new THREE.Mesh(new THREE.SphereGeometry(1,48,16,0,TAU,0,1.05),mat("#c4544f",{side:THREE.DoubleSide,roughness:.6}));dia.scale.set(.98,.34,.62);dia.position.set(0,2.62,.12);g.add(dia);
 const path=[[0,5.12,.52],[0,4.95,.4],[0,4.6,.16],[0,3.8,.12]];const pl=[[0,3.72,.12],[-.32,3.68,.12],[-.5,3.4,.15],[-.48,3.05,.12]],pr=pl.map(p=>[-p[0],p[1],p[2]]);
 const inL=new THREE.CatmullRomCurve3([...path,...pl.slice(1)].map(p=>V(p))),inR=new THREE.CatmullRomCurve3([...path,...pr.slice(1)].map(p=>V(p)));
 const S={rate:14,ph:0};const breath=()=>Math.sin(S.ph);
 const mk=(c,colr)=>movers(c,{n:14,size:.035,speed:0,color:colr,emit:colr,ei:.6,parent:g});
 const o2=[mk(inL,"#2fb5ff"),mk(inR,"#2fb5ff")],co2=[mk(inL,"#8d96a3"),mk(inR,"#8d96a3")];
 onFrame((t,dt)=>{const w=TAU*S.rate/60;S.ph+=dt*w;const b=breath(),db=Math.cos(S.ph);L.forEach(l=>l.scale.set(1+.07*b,1+.05*b,1+.07*b));dia.position.y=2.62-.13*b;dia.scale.y=.34-.06*b;
  const inh=db>0;o2.forEach(m=>{m.speed=inh?.35*S.rate/14:0;m.visible=inh?14:0});co2.forEach(m=>{m.speed=inh?0:-.35*S.rate/14;m.visible=inh?0:14});});
 if(o.shell!==false)bodyShell({parent:g});
 if(!o.parent){bodySky();sway();view(0,3.5,6.8,0,3.45,0)}
 return {group:g,setRate:n=>{S.rate=+n||14},get inhaling(){return Math.cos(S.ph)>0},points:{nose:WP(g,[0,5.12,.52]),trachea:WP(g,[0,4.2,.22]),bronchi:WP(g,[-.3,3.6,.2]),lungL:WP(g,[-.85,3.6,.25]),lungR:WP(g,[.85,3.6,.25]),diaphragm:WP(g,[.7,2.66,.42]),alveoli:WP(g,[.6,3.1,.3])}}}

// قلب مبسّط — kit.heart({parent,pos,scale}) → {group,setRate,beat}
function heart(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));g.scale.setScalar(o.scale||1);put(g,o.parent);
 const R=blob({r:.5,scale:[.95,1.05,.9],pos:[-.27,.12,0],color:"#4a63d6",seed:7,amp:.04,parent:g}),Lf=blob({r:.52,scale:[.95,1.08,.9],pos:[.25,.1,0],color:"#d8333d",seed:8,amp:.04,parent:g});
 const tip=new THREE.Mesh(new THREE.ConeGeometry(.62,1.05,40),mat("#c6303c",{roughness:.45}));tip.rotation.z=Math.PI+.12;tip.position.set(.06,-.55,0);g.add(tip);
 const tipB=new THREE.Mesh(new THREE.ConeGeometry(.42,.8,40,1,false,Math.PI/2,Math.PI),mat("#4a63d6",{roughness:.45}));tipB.rotation.z=Math.PI+.12;tipB.position.set(-.08,-.45,.02);g.add(tipB);
 const S={rate:o.rate||72,ph:0,beat:0};onFrame((t,dt)=>{S.ph+=dt*S.rate/60;const f=S.ph%1;const b=Math.exp(-Math.pow((f-.08)/.05,2))+.55*Math.exp(-Math.pow((f-.28)/.06,2));S.beat=b;g.scale.setScalar((o.scale||1)*(1+.075*b))});
 return {group:g,setRate:n=>{S.rate=+n||72},get beat(){return S.beat}}}

// الدورة الدموية الكاملة (مخطط ثلاثي الأبعاد) — kit.circulation({pos}) → {heart,setRate,follow(),points}
function circulation(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);bodySky();
 const H=heart({parent:g,pos:[0,1.6,0],scale:.9});
 const lungBed=s=>{const lg=new THREE.Group();lg.position.set(s*2.35,3.7,0);g.add(lg);blob({r:.62,scale:[1,1.35,.7],color:"#ff9fb6",opacity:.5,seed:s+2,parent:lg});return lg};
 lungBed(-1);lungBed(1);
 const bodyB=new THREE.Group();bodyB.position.set(0,-1.15,0);g.add(bodyB);
 for(let i=0;i<26;i++){const c=blob({r:.17,scale:[1,.8,1],pos:[(i%9-4)*.36+(Math.random()-.5)*.1,Math.floor(i/9)*-.3+(Math.random()-.5)*.08,(Math.random()-.5)*.6],color:"#ffd8a8",seed:i,amp:.1,parent:bodyB});c.material.roughness=.7}
 // حلقتان (لكل رئة): جسم → قلب (يمين) → رئة → قلب (يسار) → جسم
 const loop=s=>[[s*.25,-1.0,.25],[s*-.15-.55*(s<0?1:0)*0+(-.55),.1,.25],[-.42,1.25,.2],[-.45,2.25,.15],[s*1.2,3.0,.1],[s*2.0,3.25,.05],[s*2.35,3.75,0],[s*2.15,4.25,-.05],[s*1.4,3.9,-.1],[.42,2.5,-.15],[.35,1.95,-.12],[.75,1.0,-.15],[s*.8+.2,-.4,-.15],[s*.9,-1.15,0]];
 const tcol=(u)=>{const a=.36,b=.52,c=.86;let k;if(u<a)k=0;else if(u<b)k=(u-a)/(b-a);else if(u<c)k=1;else k=1-(u-c)/(1-c);return bloodCol(k)};
 const tubes=[-1,1].map(s=>{const m=vtube(loop(s),{closed:true,r:t=>{const lungZone=t>.38&&t<.55,bodyZone=t>.9||t<.05;return lungZone||bodyZone?.055:.1},colorFn:tcol,parent:g,seg:360,opacity:.6});m.renderOrder=3;return m});
 const cells=tubes.map(m=>movers(m.userData.curve,{n:46,shape:"cell",size:.085,speed:.05,colorFn:(u)=>tcol(u),parent:g}));
 const lab=s=>[[s*2.35,4.6,0]];
 const S={rate:72};const setRate=n=>{S.rate=+n||72;H.setRate(S.rate);cells.forEach(c=>c.rate=S.rate/72)};
 // تتبّع خلية دم واحدة
 const tr=new THREE.Mesh(new THREE.SphereGeometry(.14,24,16),glowMat("#ffffff",.4));g.add(tr);tr.visible=false;const ring=new THREE.Mesh(new THREE.TorusGeometry(.24,.025,10,40),glowMat("#ffe14d",2));g.add(ring);ring.visible=false;
 const F={on:false,u:0};const TXT=[[0,"في خلايا الجسم: تترك الأكسجين والغذاء وتأخذ الفضلات"],[.06,"يعود الدم غير المؤكسج في الأوردة إلى القلب"],[.2,"يضخّ القلب الدم غير المؤكسج إلى الرئتين"],[.38,"في الرئتين: يتخلّص من ثاني أكسيد الكربون ويحمل الأكسجين"],[.55,"يعود الدم المؤكسج إلى القلب"],[.66,"يضخّه القلب في الشرايين إلى كل أجزاء الجسم"],[.88,"يصل إلى الشعيرات الدموية في الجسم"]];let last=-1;
 onFrame((t,dt)=>{if(!F.on)return;F.u=(F.u+dt*.05*S.rate/72)%1;const c=tubes[0].userData.curve,p=c.getPointAt(F.u);tr.position.copy(p);ring.position.copy(p);ring.lookAt(camera.position);tr.material.color.copy(tcol(F.u));tr.material.emissive.copy(tcol(F.u));
  let k=0;TXT.forEach((x,i)=>{if(F.u>=x[0])k=i});if(k!==last){last=k;ui.result(TXT[k][1]);snd("pop")}});
 return {group:g,heart:H,setRate,follow:()=>{F.on=true;tr.visible=ring.visible=true;F.u=0;last=-1},points:{heart:WP(g,[0,2.45,.4]),lungL:WP(g,[-2.35,4.6,0]),lungR:WP(g,[2.35,4.6,0]),body:WP(g,[0,-1.75,.3]),artery:WP(g,[1.05,.6,-.1]),vein:WP(g,[-.9,.5,.25]),capLung:WP(g,[-2.1,3.15,.2]),capBody:WP(g,[1.6,-1.1,0])}}}

// الحويصلات الهوائية وتبادل الغازات — kit.alveoli({pos}) → {breathe(),points}
function alveoli(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);bodySky();
 vtube([[0,5,0],[0,4.1,0],[.05,3.2,0],[0,2.75,0]],{r:t=>.32-.1*t,color:"#f2b8ad",parent:g,opacity:.85});
 const sacs=[];const SP=[[0,2.1,0],[-.75,1.85,.2],[.75,1.85,.15],[-.5,1.2,.35],[.5,1.2,.3],[0,1.0,-.2],[-.85,1.1,-.35],[.85,1.15,-.35],[0,1.55,.6],[0,2.0,-.6]];
 SP.forEach((p,i)=>{const b=blob({r:.52,pos:p,color:"#ff9fb6",opacity:.55,seed:i+1,amp:.06,parent:g});b.renderOrder=4;sacs.push(b)});
 const cap=[];const mkCap=(z,ph)=>{const pts=[];for(let i=0;i<=40;i++){const a=i/40;const x=-2.6+a*5.2,y=.9+Math.sin(a*Math.PI)*1.2+.25*Math.sin(a*TAU*2+ph),zz=z+.55*Math.cos(a*TAU*1.5+ph);pts.push([x,y,zz])}return pts};
 const capCol=u=>bloodCol((u-.25)/.5);
 [[.75,0],[-.75,1.4],[.1,2.6]].forEach(q=>{const m=vtube(mkCap(q[0],q[1]),{r:.075,colorFn:capCol,parent:g,seg:200,radial:10});cap.push(m);movers(m.userData.curve,{n:22,shape:"cell",size:.07,speed:.07,colorFn:capCol,parent:g})});
 const O2=particles({kind:"dust",parent:g,pos:[0,1.6,0],area:.55,dir:[0,-1,0],spread:1.2,speed:[.35,.7],life:[1.2,1.8],size:[.2,.12],color:["#2fb5ff","#7fd3ff"],rate:26,additive:true,max:300});
 const CO=particles({kind:"dust",parent:g,pos:[0,1.0,0],area:1.2,dir:[0,1,0],spread:.35,speed:[.6,1],life:[1.6,2.4],size:[.18,.1],color:["#9aa3ad","#c9ced4"],rate:18,additive:false,max:300});
 const S={b:1};onFrame((t,dt)=>{const k=1+.05*Math.sin(t*2.2)*S.b;sacs.forEach(s=>s.scale.setScalar(k))});
 view(0,2.4,7.6,0,1.9,0);
 return {group:g,o2:O2,co2:CO,points:{bronchiole:WP(g,[.38,3.9,0]),alveolus:WP(g,[.6,2.3,.5]),capillary:WP(g,[2.2,1.3,.7]),o2:WP(g,[-.4,.6,.6]),co2:WP(g,[.3,2.6,.5])}}}

// دودة الأرض (جهاز هضمي أنبوبي بفتحتين) — kit.worm({pos}) → {feed(),points}
function worm(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);
 const pts=[];for(let i=0;i<=24;i++){const a=i/24;pts.push([-3.4+a*6.8,.42+.08*Math.sin(a*9),.55*Math.sin(a*TAU*1.1)])}
 const skin=vtube(pts,{r:t=>.42*Math.pow(Math.sin(Math.PI*clamp(t*1.02,0,1)),.35)*(t>.28&&t<.36?1.12:1)*(1+.06*Math.sin(t*170)),colorFn:t=>col(t>.28&&t<.36?"#ff8f80":"#ffb3a8").multiplyScalar(.92+.08*Math.sin(t*170)),parent:g,seg:420,radial:20,opacity:.78});skin.renderOrder=4;
 const gut=vtube(pts.map(p=>[p[0],p[1],p[2]]),{r:t=>.12*Math.pow(Math.sin(Math.PI*clamp(t,0,1)),.2),color:"#c4673f",parent:g,seg:300,radial:10});
 const food=movers(gut.userData.curve,{n:26,size:.07,speed:0,color:"#4b2e1a",parent:g,jitter:.02});food.visible=0;
 const S={on:false,t:0};onFrame((t,dt)=>{g.position.x=(o.pos?o.pos[0]:0)+Math.sin(t*.8)*.06;if(!S.on)return;S.t+=dt;food.visible=Math.min(26,Math.floor(S.t*5));food.speed=.09});
 return {group:g,feed:()=>{S.on=true;S.t=0;food.phase=0;snd("blub")},points:{mouth:WP(g,[-3.4,.6,0]),anus:WP(g,[3.4,.6,0]),gut:WP(g,[0,.95,.4]),clitellum:WP(g,[-1.2,.95,0])}}}

// دوران مفتوح ودوران مغلق — kit.openClosed({}) → {points}
function openClosed(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);bodySky();
 const A=new THREE.Group();A.position.set(-2.4,1.4,0);g.add(A);const B=new THREE.Group();B.position.set(2.4,1.4,0);g.add(B);
 blob({r:1,scale:[1.6,.75,.75],color:"#c9e27a",opacity:.45,seed:3,parent:A}).renderOrder=4;blob({r:.38,pos:[-1.75,.12,0],color:"#9cbf4a",opacity:.6,seed:4,parent:A});
 const dt=vtube([[1.3,.45,0],[.4,.55,0],[-.6,.5,0],[-1.25,.32,0]],{r:.075,color:"#7fa82e",parent:A});
 const hem=particles({kind:"dust",parent:A,pos:[-1.2,.3,0],area:.15,dir:[1,-.4,0],spread:1.2,speed:[.4,.9],life:[2.2,3.2],size:[.17,.12],color:["#c7e000","#a3c400"],rate:22,drag:.7,additive:false,max:400});
 movers(dt.userData.curve,{n:10,size:.05,speed:-.2,color:"#d7f000",parent:A});
 blob({r:1,scale:[1.5,.8,.6],color:"#ffb27a",opacity:.42,seed:6,parent:B}).renderOrder=4;const tail=new THREE.Mesh(new THREE.ConeGeometry(.55,.8,4),mat("#ffb27a",{transparent:true,opacity:.35,depthWrite:false}));tail.rotation.z=Math.PI/2;tail.position.set(1.8,0,0);tail.scale.set(1,1,.3);B.add(tail);
 const hb=heart({parent:B,pos:[-.75,-.35,0],scale:.28});
 const loopB=[[-.75,-.32,0],[-1.05,.05,.12],[-1.0,.45,.1],[-.6,.55,0],[.3,.5,0],[1.1,.3,0],[1.05,-.1,0],[.3,-.4,0],[-.4,-.45,0]];
 const cl=vtube(loopB,{closed:true,r:.05,colorFn:u=>bloodCol(u<.25?u/.25:u<.7?1:1-(u-.7)/.3),parent:B,seg:220,radial:10});
 movers(cl.userData.curve,{n:30,shape:"cell",size:.05,speed:.12,colorFn:u=>bloodCol(u<.25?u/.25:u<.7?1:1-(u-.7)/.3),parent:B});
 view(0,2.6,8.4,0,1.3,0);
 return {points:{open:WP(A,[0,1.1,0]),closed:WP(B,[0,1.15,0]),dorsal:WP(A,[.2,.75,.2]),sinus:WP(A,[.3,-.45,.5]),heartB:WP(B,[-.75,-.75,.2]),gills:WP(B,[-1.05,.45,.4])}}}

// حرارة الجسم: متغيّر (سحلية) وثابت (طائر) — kit.thermo({}) → {set(temp),points}
function thermo(o={}){const g=new THREE.Group();put(g,o.parent);ground({color:"#e8c98a",color2:"#d9b46e",size:16,flat:5});const sunO=sun({pos:[-4,6.5,-5],size:.75});
 const rock=blob({r:.9,scale:[1.4,.5,1],pos:[-2.3,.2,0],color:"#a08c7a",seed:9,amp:.15,parent:g});
 const Lz=new THREE.Group();Lz.position.set(-2.3,.62,0);g.add(Lz);const lc="#6aa84f";
 const lb=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.75,8,16),mat(lc,{roughness:.6}));lb.rotation.z=Math.PI/2;Lz.add(lb);
 const lh=blob({r:.18,scale:[1.4,.8,1],pos:[-.62,.04,0],color:lc,seed:2,parent:Lz});const lt=vtube([[.45,0,0],[.9,-.03,.1],[1.35,-.06,.3],[1.6,-.08,.55]],{r:t=>.13*(1-t)+.01,color:lc,parent:Lz});
 [[-.3,1],[.3,1],[-.3,-1],[.3,-1]].forEach(q=>{const l=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.2,4,8),mat(lc));l.position.set(q[0],-.12,q[1]*.22);l.rotation.x=q[1]*.9;Lz.add(l)});
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),mat("#111"));e.position.set(-.72,.1,s*.1);Lz.add(e)});
 const Bd=new THREE.Group();Bd.position.set(2.2,0,0);g.add(Bd);const bc="#4e8fd8";
 const bb=blob({r:.42,scale:[1.25,.95,.9],pos:[0,.75,0],color:bc,seed:5,amp:.04,parent:Bd});blob({r:.25,pos:[-.45,1.15,0],color:bc,seed:6,amp:.03,parent:Bd});
 const bk=new THREE.Mesh(new THREE.ConeGeometry(.07,.22,12),mat("#f2a33a"));bk.rotation.z=Math.PI/2;bk.position.set(-.75,1.13,0);Bd.add(bk);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),mat("#111"));e.position.set(-.6,1.22,s*.12);Bd.add(e);const w=blob({r:.3,scale:[1.3,.5,.25],pos:[.05,.8,s*.36],color:"#3b78c2",seed:s+8,parent:Bd});w.rotation.x=s*.2;
  const lg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.42,8),mat("#f2a33a"));lg.position.set(0,.2,s*.12);Bd.add(lg)});
 const tm=(x)=>{const tg=new THREE.Group();tg.position.set(x,0,1.1);g.add(tg);const gl=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,1.9,20),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.25,roughness:.05,depthWrite:false}));gl.position.y=1.15;tg.add(gl);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,20,14),glowMat("#e8262b",.5));bulb.position.y=.18;tg.add(bulb);const colm=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,1,12),glowMat("#e8262b",.5));colm.geometry.translate(0,.5,0);colm.position.y=.25;tg.add(colm);return colm};
 const tL=tm(-1.1),tB=tm(3.3);const lbL=addLabel("",-1.1,2.35,1.1),lbB=addLabel("",3.3,2.35,1.1);
 const S={env:25};const set=v=>{S.env=+v;const lzT=clamp(S.env,0,45),bT=41;tL.scale.y=lzT/45*1.7+.02;tB.scale.y=bT/45*1.7;lbL.element.textContent=Math.round(lzT)+"° سحلية";lbB.element.textContent=bT+"° طائر";
  sunO.children[1].intensity=8+S.env*.9;sunL.intensity=.8+S.env/30;scene.background=canvasTex(2,256,(gx)=>{const gr=gx.createLinearGradient(0,0,0,256);const top=new THREE.Color("#8fb6d9").lerp(new THREE.Color("#ffb36b"),S.env/45);gr.addColorStop(0,"#"+top.getHexString());gr.addColorStop(1,"#fff1dc");gx.fillStyle=gr;gx.fillRect(0,0,2,256)});
  ui.result(S.env<15?"الجو بارد: حرارة السحلية انخفضت فصارت بطيئة، والطائر حرارته ثابتة":S.env>35?"الجو حار: حرارة السحلية ارتفعت فتختبئ تحت الصخور، والطائر يتخلص من الحرارة":"حرارة السحلية تساوي حرارة الجو، والطائر ثابت عند ٤١°")};
 onFrame((t,dt)=>{const act=clamp((S.env-8)/25,0,1);lt.rotation.y=Math.sin(t*3)*.25*act;Lz.position.x=-2.3+Math.sin(t*1.5)*.15*act;Bd.children[0].scale.y=1+.02*Math.sin(t*4)});
 view(0,3.2,8.6,.4,1,0);set(25);
 return {set,points:{lizard:[-2.3,1.2,0],bird:[2.2,1.75,0],rock:[-2.3,.15,.9]}}}

// تجربة امتصاص الورق للماء — kit.paperTest({}) → {dip(),reset(),points}
function paperTest(o={}){const g=new THREE.Group();put(g,o.parent);bodySky();
 const tb=new THREE.Mesh(new THREE.BoxGeometry(9,.25,3.2),mat("#f2d36b",{roughness:.7}));tb.position.y=-.13;g.add(tb);
 const P=[{n:"مناشف من الألياف",c:"#ffffff",a:9},{n:"مناشف عادية",c:"#f4f1e6",a:6},{n:"ورق تجليد",c:"#e05b4b",a:1},{n:"ورق طباعة",c:"#f7f7ff",a:3}];
 const tick=canvasTex(64,512,(gx,w,h)=>{gx.clearRect(0,0,w,h);gx.strokeStyle="rgba(30,40,60,.85)";gx.lineWidth=3;for(let i=0;i<=20;i++){const y=h-20-i*(h-40)/20;gx.beginPath();gx.moveTo(0,y);gx.lineTo(i%5?18:34,y);gx.stroke()}});
 const items=P.map((p,i)=>{const x=-3.3+i*2.2;const cy=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,3,32,1,true),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.22,roughness:.05,side:THREE.DoubleSide,depthWrite:false,map:tick}));cy.position.set(x,1.5,0);g.add(cy);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.08,32),mat("#e8eef5"));base.position.set(x,.04,0);g.add(base);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,1,32),new THREE.MeshPhysicalMaterial({color:col("#4aa8ff"),transparent:true,opacity:.6,roughness:.1,depthWrite:false}));w.geometry.translate(0,.5,0);w.position.set(x,.08,0);w.scale.y=2;g.add(w);
  const st=new THREE.Mesh(new THREE.BoxGeometry(.32,2.1,.02),mat(p.c,{roughness:.9,side:THREE.DoubleSide}));st.position.set(x,4.2,0);g.add(st);
  addLabel(p.n,x,3.35,.7);return {x,w,st,p,lvl:2}});
 const S={t:-1};const dip=()=>{if(S.t>=0)return;S.t=0;snd("blub");ui.result("نغمس الأشرطة دقيقة كاملة… راقب مستوى الماء")};
 const reset=()=>{S.t=-1;items.forEach(it=>{it.w.scale.y=2;it.st.position.y=4.2;it.st.material.color.set(it.p.c)});ui.result("اضغط «اغمس الأشرطة» لتبدأ التجربة")};
 onFrame((t,dt)=>{if(S.t<0)return;S.t+=dt;const T=S.t;items.forEach(it=>{const down=clamp(T/1.2,0,1),up=clamp((T-5.2)/1.2,0,1),soak=clamp((T-1.2)/3.5,0,1);
   it.st.position.y=4.2-1.95*ease(down)+1.95*ease(up);it.w.scale.y=2-it.p.a/10*ease(soak)*.95;it.st.material.color.set(it.p.c).lerp(col("#7fb8e6"),.55*soak*it.p.a/9)});
  if(T>6.5&&S.t<1e8){S.t=1e9;snd("ding");ui.result("امتصّت مناشف الألياف أكثر كمية — مثل الأمعاء الغليظة تمتص الماء من الفضلات")}});
 view(0,3.4,9.2,0,1.6,0);reset();
 return {dip,reset,points:{}}}

// نظرة عامة: جسم فيه الأجهزة الثلاثة — kit.bodySystems({}) → {show(name),points}
function bodySystems(o={}){const g=new THREE.Group();put(g,o.parent);bodySky();bodyShell({parent:g,opacity:.18});
 const D=digestive({parent:g,shell:false}),Lu=lungs({parent:g,shell:false});const H=heart({parent:g,pos:[.12,3.2,.3],scale:.28});
 const vs=new THREE.Group();g.add(vs);[[[.12,3.25,.32],[.35,3.9,.3],[.3,4.6,.2],[.2,5.1,.1]],[[.15,3.0,.3],[.5,2.0,.32],[.55,1.0,.3],[.45,.1,.2]]].forEach(p=>vtube(p,{r:.035,color:"#e2333b",parent:vs}));
 [[[-.05,3.1,.25],[-.35,3.9,.25],[-.3,4.6,.15],[-.2,5.1,.05]],[[-.05,2.95,.25],[-.5,2.0,.28],[-.55,1.0,.27],[-.45,.1,.2]]].forEach(p=>vtube(p,{r:.035,color:"#3d6df2",parent:vs}));
 const sys={digestive:D.group,lungs:Lu.group,circ:[H.group,vs]};const all=[D.group,Lu.group,H.group,vs];
 const show=n=>{all.forEach(x=>x.visible=n==="all");if(n==="digestive")D.group.visible=true;if(n==="lungs")Lu.group.visible=true;if(n==="circ"){H.group.visible=true;vs.visible=true}};
 sway();view(0,2.75,9.4,0,2.65,0);
 return {show,digestive:D,lungs:Lu,heart:H,points:{stomach:D.points.stomach,lungs:Lu.points.lungR,heart:[.45,3.3,.5],intestine:D.points.smallIntestine}}}

const kit={sound:(n,a,b)=>snd(n,a,b),THREE,particles,ground,strata,tree,palm,house,tower,cloud,rain,sun,water,flow,arrow,planet,volcano,earthquake,earthLayers,bodyShell,digestive,lungs,heart,circulation,alveoli,worm,openClosed,thermo,paperTest,bodySystems,vtube,blob,movers,view,shake,focus,sky,mat,glowMat,canvasTex,strataTex,noise,fbm,label:(t,p)=>addLabel(t,p),shadowy,controls:C,lights:{hemi,sun:sunL}};

function rs(){const w=innerWidth,h=innerHeight;R.setSize(w,h);comp.setSize(w,h);LR.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();PU.value=h*PR/(2*Math.tan(camera.fov*D2R/2))}
addEventListener("resize",rs);rs();
addEventListener("message",e=>{const d=e.data||{};if(d.play){C.autoRotate=false;const b=U.querySelector(".bt");if(b)b.click()}});
try{new Function("THREE","scene","camera","addLabel","onFrame","ui","kit",JSON.parse(document.getElementById("c").textContent))(THREE,scene,camera,addLabel,onFrame,ui,kit);shadowy(scene)}catch(err){document.getElementById("e").style.display="flex";console.error(err)}
const ck=new THREE.Clock();let t=0;const so=new THREE.Vector3();
R.setAnimationLoop(()=>{const dt=Math.min(.05,ck.getDelta());t+=dt;for(let i=0;i<fr.length;i++){try{fr[i](t,dt)}catch(e){}}C.update();
 so.set(0,0,0);if(SH.t>0){SH.t-=dt;const a=SH.a*Math.min(1,SH.t/.5);so.set((Math.random()-.5)*a,(Math.random()-.5)*a,(Math.random()-.5)*a);camera.position.add(so)}
 comp.render();LR.render(scene,camera);camera.position.sub(so)});
