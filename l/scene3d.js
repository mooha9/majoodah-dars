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
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {MeshoptDecoder} from "three/addons/libs/meshopt_decoder.module.js";

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
const V=(a,b,c)=>a&&a.isVector3?a.clone():Array.isArray(a)?new THREE.Vector3(+a[0]||0,+a[1]||0,+a[2]||0):new THREE.Vector3(+a||0,+b||0,+c||0);
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
let FILL=null;function bodySky(){sky("#c9e7ff","#fff6ea");hemi.groundColor=col("#ffe6cc");hemi.intensity=1.6;sunL.intensity=2.2;R.toneMappingExposure=1.02;
 if(!FILL){FILL=new THREE.DirectionalLight(0xffffff,1.5);scene.add(FILL);scene.add(FILL.target);onFrame(()=>{FILL.position.copy(camera.position).add(V(1.5,2.5,0));FILL.target.position.copy(C.target)})}}
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
 const ST_TXT=["الفم: يُمضغ الغذاء ويختلط باللعاب","المريء: ينزل الغذاء إلى المعدة","المعدة: الحمض والإنزيم يحلّلان الغذاء","الأمعاء الدقيقة: تُمتص المواد الغذائية إلى الدم","الأمعاء الغليظة: يُمتص الماء","تُطرح الفضلات خارج الجسم"];
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

// الجهاز التنفسي — kit.lungs({parent,pos,shell,heart,ribs}) → {group,setRate(n),points}
// تشريح واقعي: رئتان مخروطيتان (قمة فوق الترقوة وقاعدة مقعّرة على قبة الحجاب الحاجز)، اليمنى ٣ فصوص واليسرى فصّان مع الثلمة القلبية،
// قصبة بحلقات غضروفية مفتوحة للخلف، وشجرة شعب متفرعة تنتهي بعناقيد حويصلات، والقلب بين الرئتين.
function lungs(o={}){const g=new THREE.Group();g.position.copy(V(o.pos||[0,0,0]));put(g,o.parent);
 let sd=7;const rn=()=>(sd=(sd*16807)%2147483647)/2147483647;
 const DY=2.36,dome=(x,z)=>DY+.28*clamp(1-Math.pow(z/.62,2),0,1)*clamp(1-Math.pow((Math.abs(x)-.46)/.62,2),0,1);
 // قبة الحجاب الحاجز (قبّتان، اليمنى أعلى قليلاً)
 const dg=new THREE.CircleGeometry(1,96,0,TAU);dg.rotateX(-Math.PI/2);{const p=dg.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k)*1.0,z=p.getZ(k)*.6;p.setXYZ(k,x,dome(x,z)-DY+(x<0?.025:0)*clamp(1-x*x-z*z*2.7,0,1),z)}dg.computeVertexNormals()}
 const dia=new THREE.Mesh(dg,new THREE.MeshPhysicalMaterial({color:col("#c9584f"),roughness:.55,clearcoat:.3,side:THREE.DoubleSide}));dia.position.set(0,DY,.06);g.add(dia);
 {const tc=new THREE.Mesh(new THREE.CircleGeometry(.3,40),new THREE.MeshStandardMaterial({color:col("#efe2d6"),roughness:.6,side:THREE.DoubleSide}));tc.rotation.x=-Math.PI/2;tc.scale.set(1.3,.7,1);tc.position.set(0,.22,.0);dia.add(tc)}
 // الرئة: كرة مُشكّلة
 const LC=[["#f8a9bb","#f191a7"],["#fbb6c5","#f39cb0"]];
 const lungMesh=(side)=>{const geo=new THREE.SphereGeometry(1,80,64),p=geo.attributes.position,cl=[],tc=new THREE.Color();const cx=side*.48,cy=3.2,cz=.04,top=4.06;
  for(let k=0;k<p.count;k++){const vx=p.getX(k),vy=p.getY(k),vz=p.getZ(k);const t=(vy+1)/2;const w=.46+.54*Math.pow(1-t,.62);
   const lat=vx*side>0;let X=cx+vx*(lat?.5:.3)*w,Y=cy+vy*.86,Z=cz+vz*(vz>0?.4:.46)*w;
   if(side>0&&!lat&&vz>-.1&&vy<.25){const k2=clamp((.25-vy)/.6,0,1)*clamp((vz+.1)/.6,0,1);X+=side*.2*k2*Math.min(1,-vx*1.6)}// الثلمة القلبية (الرئة اليسرى)
   Y=Math.min(Y,top);const d=dome(X,Z-.06)+.015;if(Y<d+.22&&vy<0)Y=Math.max(Y,d);
   p.setXYZ(k,X,Y,Z);
   // الشقوق بين الفصوص
   const yf=.42-1.3*((vz+1)/2);let f=Math.abs(vy-yf);if(side<0&&vy>yf)f=Math.min(f,Math.abs(vy-.08)+(vz<-.2?1:0));
   const lobe=side<0?(vy<yf?0:vy<.08?1:0):(vy<yf?0:1);const c=LC[lobe];tc.set(c[0]).lerp(col(c[1]),fbm(X*9+side*5,Y*9+Z*7));if(f<.03)tc.multiplyScalar(.55);cl.push(tc.r,tc.g,tc.b)}
  geo.setAttribute("color",new THREE.Float32BufferAttribute(cl,3));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.5,clearcoat:.5,clearcoatRoughness:.3,transparent:true,opacity:.66,depthWrite:false,sheen:.6,sheenColor:col("#ffd0dc")}));m.renderOrder=4;return m};
 const pivots=[-1,1].map(s=>{const pv=new THREE.Group();pv.position.set(s*.48,4.06,.04);g.add(pv);const m=lungMesh(s);m.position.set(-s*.48,-4.06,-.04);pv.add(m);return pv});
 // الأنف والبلعوم والحنجرة والقصبة
 const airC="#f6d9cf",brC="#c23f63";
 vtube([[0,5.1,.5],[0,5.16,.36],[0,5.14,.16],[0,4.98,.06],[0,4.7,.06],[0,4.5,.12]],{r:.05,color:"#f0b9ab",parent:g,seg:60});
 vtube([[0,4.93,.43],[0,4.92,.2],[0,4.86,.08]],{r:.035,color:"#f0b9ab",parent:g});
 const lx=new THREE.Group();lx.position.set(0,4.47,.15);g.add(lx);{const th=new THREE.Mesh(new THREE.CylinderGeometry(.1,.085,.2,24,1,true,-Math.PI*.55,Math.PI*1.1),mat("#f3dccf",{side:THREE.DoubleSide,roughness:.45}));th.rotation.y=Math.PI;lx.add(th);const ep=new THREE.Mesh(new THREE.SphereGeometry(.05,16,10,0,Math.PI),mat("#f0c4b5",{side:THREE.DoubleSide}));ep.position.set(0,.14,-.03);ep.rotation.x=-.5;lx.add(ep)}
 const CAR=[0,3.6,.1];vtube([[0,4.37,.14],[0,4.0,.12],CAR],{r:.068,color:airC,parent:g,seg:40});
 for(let k=0;k<11;k++){const rg=new THREE.Mesh(new THREE.TorusGeometry(.075,.017,8,28,Math.PI*1.55),mat("#fff3ec",{roughness:.4}));rg.rotation.set(Math.PI/2,0,Math.PI*.5+Math.PI*.225);rg.position.set(0,4.32-k*.064,.12-k*.0018);g.add(rg)}
 // شجرة الشعب الهوائية
 const inside=(p,side)=>{const q=V((p.x-side*.52)/.46,(p.y-3.2)/.8,(p.z-.04)/.42);const n=q.length();if(n>.84){q.multiplyScalar(.84/n);return V(side*.52+q.x*.46,3.2+q.y*.8,.04+q.z*.42)}return p};
 const tips=[],up=new THREE.Vector3();
 const seg=(a,b,r)=>vtube([a,a.clone().lerp(b,.5).add(V(0,.01,0)),b],{r:t=>r*(1-.25*t),color:brC,parent:g,seg:8,radial:7,rough:.45});
 const branch=(p,d,len,r,dep,side)=>{const e=inside(p.clone().addScaledVector(d,len),side);seg(p,e,r);if(dep<=0){tips.push(e);return}
  const ax=up.set(rn()-.5,rn()-.5,rn()-.5).cross(d).normalize();for(const sg of [-1,1]){const nd=d.clone().applyAxisAngle(ax,sg*(.42+rn()*.25)).applyAxisAngle(d,rn()*1.2);nd.y-=.12;nd.normalize();branch(e,nd,len*(.68+rn()*.12),r*.7,dep-1,side)}};
 const C0=V(CAR);const LOBES=[[-1,[-.31,3.43,.07],.05,[[-.52,3.78,.02],[-.6,3.12,.2],[-.52,2.84,-.12]]],[1,[.36,3.48,.05],.044,[[.55,3.74,.04],[.56,2.96,-.06]]]];
 LOBES.forEach(([s,h,r,lb])=>{const H=V(h);seg(C0,H,r);lb.forEach(q=>{const Q=V(q);seg(H,Q,r*.75);const d=Q.clone().sub(H).normalize();branch(Q,d,.24,r*.55,4,s)})});

 // القلب بين الرئتين، والأضلاع
 const Hh=o.heart!==false?heart({parent:g,pos:[.12,2.92,.18],scale:.36,rate:72}):null;if(Hh)Hh.group.rotation.z=-.35;
 if(o.ribs!==false){const rm=new THREE.MeshPhysicalMaterial({color:col("#fbf3e6"),transparent:true,opacity:.28,depthWrite:false,roughness:.5});for(let k=0;k<10;k++){const y=3.92-k*.15,rx=.62+.34*Math.sin(Math.min(1,(k+1)/5)*Math.PI/2);const rb=new THREE.Mesh(new THREE.TorusGeometry(1,.022,6,64),rm);rb.scale.set(rx,.56,1);rb.rotation.x=Math.PI/2-.32;rb.position.set(0,y,.02);g.add(rb)}
  const st=new THREE.Mesh(new THREE.BoxGeometry(.14,1.1,.04),rm);st.position.set(0,3.4,.56);g.add(st)}
 // الهواء: شهيق (أكسجين أزرق) وزفير (ثاني أكسيد الكربون رمادي)
 const nose=[[0,5.1,.5],[0,5.16,.36],[0,5.14,.16],[0,4.98,.06],[0,4.7,.06],[0,4.45,.13],[0,4.0,.12],CAR];
 const toL=s=>new THREE.CatmullRomCurve3([...nose,s<0?[-.31,3.43,.07]:[.36,3.48,.05],s<0?[-.52,2.9,-.08]:[.55,3.0,-.05]].map(p=>V(p)),false,"centripetal");
 const S={rate:14,ph:0};const mk=(c,colr)=>movers(c,{n:12,size:.034,speed:0,color:colr,emit:colr,ei:.7,parent:g});
 const o2=[mk(toL(-1),"#2fb5ff"),mk(toL(1),"#2fb5ff")],co2=[mk(toL(-1),"#8d96a3"),mk(toL(1),"#8d96a3")];
 onFrame((t,dt)=>{S.ph+=dt*TAU*S.rate/60;const b=Math.sin(S.ph),db=Math.cos(S.ph);pivots.forEach(pv=>pv.scale.set(1+.055*b,1+.075*b,1+.06*b));dia.position.y=DY-.11*b;dia.scale.y=1-.35*b;
  const inh=db>0;o2.forEach(m=>{m.speed=inh?.3*S.rate/14:0;m.visible=inh?12:0});co2.forEach(m=>{m.speed=inh?0:-.3*S.rate/14;m.visible=inh?0:12})});
 if(o.shell!==false)bodyShell({parent:g,opacity:.13});
 if(!o.parent){bodySky();sway();view(0,3.55,6.3,0,3.45,0)}
 return {group:g,setRate:n=>{S.rate=+n||14},get inhaling(){return Math.cos(S.ph)>0},points:{nose:WP(g,[0,5.12,.52]),larynx:WP(g,[0,4.5,.25]),trachea:WP(g,[0,4.1,.2]),bronchi:WP(g,[-.3,3.45,.15]),lungL:WP(g,[-.85,3.5,.25]),lungR:WP(g,[.85,3.5,.25]),diaphragm:WP(g,[.75,2.5,.4]),alveoli:WP(g,[-.55,2.95,.3]),heart:WP(g,[.2,2.85,.42])}}}

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
 // المريء (رفيع) ← الحويصلة (انتفاخ فاتح للتخزين) ← القانصة (عضلية داكنة تطحن) ← المعى
 const GR=t=>{const b=t<.25?.075+.15*Math.max(0,Math.sin(Math.PI*(t-.17)/.08)):t<.33?.075+.14*Math.max(0,Math.sin(Math.PI*(t-.25)/.08)):.12;return b*Math.pow(Math.sin(Math.PI*clamp(t,0,1)),.2)};
 const GC=t=>col(t<.17?"#d9846a":t<.25?"#f0b08a":t<.33?"#8f3320":"#c4673f");
 const gut=vtube(pts.map(p=>[p[0],p[1],p[2]]),{r:GR,colorFn:GC,parent:g,seg:360,radial:14});
 const gc=gut.userData.curve,gp=u=>{const v=gc.getPointAt(u);return WP(g,[v.x,v.y,v.z])};
 const fc=new THREE.Color(),food=movers(gc,{n:26,size:.075,speed:0,parent:g,jitter:.02,colorFn:u=>fc.set(u<.33?"#4f9e2f":"#5a3418")});food.visible=0;
 const S={on:false,t:0};onFrame((t,dt)=>{g.position.x=(o.pos?o.pos[0]:0)+Math.sin(t*.8)*.06;if(!S.on)return;S.t+=dt;food.visible=Math.min(26,Math.floor(S.t*5));food.speed=.09});
 return {group:g,feed:()=>{S.on=true;S.t=0;food.phase=0;snd("blub")},points:{mouth:WP(g,[-3.4,.6,0]),anus:WP(g,[3.4,.6,0]),gut:WP(g,[0,.95,.4]),clitellum:WP(g,[-1.2,.95,0]),esophagus:gp(.12),crop:gp(.21),gizzard:gp(.29),intestine:gp(.6)}}}

// دوران مفتوح ودوران مغلق — kit.openClosed({}) → {points}
// منظر جانبي ثابت: جرادة (يسار) قلبها أنبوب على الظهر والدم يخرج ويغمر الأعضاء، وسمكة (يمين) دمها داخل أوعية دائماً
function openClosed(o={}){const g=new THREE.Group();put(g,o.parent);bodySky();C.autoRotate=false;SW.user=true;C.minAzimuthAngle=-.5;C.maxAzimuthAngle=.5;
 const panel=(x,c)=>{const p=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.6,.08),new THREE.MeshStandardMaterial({color:col(c),roughness:.9}));p.position.set(x,1.55,-1.1);g.add(p)};panel(-2.85,"#e6efd6");panel(2.85,"#dbe9f7");FILL&&(FILL.intensity=.7);hemi.intensity=1.25;
 // ---- الجرادة
 const A=new THREE.Group();A.position.set(-2.7,1.35,0);A.scale.setScalar(.88);g.add(A);
 const gp=[];for(let k=0;k<=20;k++){const t=k/20;gp.push([-2+t*4,.05*Math.sin(t*3),0])}
 const grad=t=>t<.16?.36:t<.2?.27:t<.42?.42:Math.max(.05,.4*(1-Math.pow((t-.42)/.58,1.4)));
 const gb=vtube(gp,{r:grad,colorFn:t=>col(t<.2?"#3f7a10":"#58951c").multiplyScalar(.85+.15*Math.sin(t*120)),parent:A,seg:220,radial:28,opacity:.7,rough:.7});gb.material=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.5,depthWrite:false,roughness:.8});gb.renderOrder=4;
 const ey=new THREE.Mesh(new THREE.SphereGeometry(.1,16,12),mat("#3b2a1a"));ey.position.set(-1.85,.2,.25);A.add(ey);
 [[-1.9,.25,.12],[-1.9,.25,-.12]].forEach(q=>vtube([q,[-2.3,.75,q[2]*2],[-2.5,1.15,q[2]*3]],{r:.018,color:"#6f8c2d",parent:A,seg:16,radial:6}));
 [[-1.1,0],[-.8,0]].forEach(([x])=>vtube([[x,-.3,.25],[x-.1,-.65,.4],[x-.25,-.9,.45]],{r:.03,color:"#7fa538",parent:A,seg:16,radial:8}));
 vtube([[-.2,-.25,.3],[.7,.6,.4],[1.6,-.3,.45],[1.75,-.9,.45]],{r:t=>.07-.04*t,color:"#7fa538",parent:A,seg:40,radial:10});
 const hv=[[1.75,.2,0],[1,.27,0],[.2,.27,0],[-.7,.2,0],[-1.35,.12,0]];const hT=vtube(hv,{r:.085,color:"#d91f2b",parent:A,seg:80,radial:12});
 for(let k=0;k<5;k++){const os=new THREE.Mesh(new THREE.TorusGeometry(.08,.02,8,20),mat("#ffffff"));os.position.set(1.5-k*.42,.27,0);os.rotation.y=Math.PI/2;A.add(os)}
 const hem=particles({kind:"dust",parent:A,pos:[-1.2,.05,0],area:.1,dir:[.3,-1,0],spread:.9,speed:[.15,.35],life:[2.6,3.4],size:[.22,.17],color:["#d4b000","#e6c800"],rate:20,drag:.6,additive:false,max:500});
 const back=[];for(let k=0;k<26;k++)back.push({u:Math.random(),y:-.1-Math.random()*.2,z:(Math.random()-.5)*.4});const bm=new THREE.InstancedMesh(new THREE.SphereGeometry(.065,10,8),new THREE.MeshStandardMaterial({color:col("#e0bd00"),emissive:col("#a38a00"),emissiveIntensity:.25}),back.length);A.add(bm);
 movers(hT.userData.curve,{n:10,size:.075,speed:.22,color:"#e0bd00",emit:"#a38a00",ei:.3,parent:A});
 // ---- السمكة
 const F=new THREE.Group();F.position.set(2.85,1.35,0);g.add(F);
 const fp=[];for(let k=0;k<=20;k++){const t=k/20;fp.push([-2+t*3.6,0,0])}
 const frad=t=>t<.12?.62*Math.sqrt(t/.12)*.9+.08:t<.6?.68-.25*Math.pow((t-.12)/.48,2)*.4:Math.max(.08,.6*(1-(t-.6)/.4)+.04);
 const fb=vtube(fp,{r:frad,colorFn:t=>col("#d9591a").lerp(col("#f08a3c"),.4+.3*Math.sin(t*40)),parent:F,seg:200,radial:30,opacity:.62,rough:.7});fb.material=new THREE.MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.45,depthWrite:false,roughness:.8});fb.scale.set(1,1,.42);fb.renderOrder=4;
 const tl=new THREE.Mesh(new THREE.ConeGeometry(.7,.9,3),new THREE.MeshPhysicalMaterial({color:col("#f07a2c"),transparent:true,opacity:.6,depthWrite:false}));tl.rotation.z=-Math.PI/2;tl.position.set(2.0,0,0);tl.scale.set(1,1,.15);F.add(tl);
 const fe=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),mat("#1d1d1d"));fe.position.set(-1.62,.18,.2);F.add(fe);
 const gil=[];for(let k=0;k<4;k++){const a=vtube([[-1.25+k*.1,.38,.12],[-1.35+k*.1,0,.16],[-1.25+k*.1,-.38,.12]],{r:.035,color:"#e8323a",parent:F,seg:20,radial:8});gil.push(a)}
 const Hf=heart({parent:F,pos:[-1.15,-.45,.05],scale:.2,rate:60});
 const loopP=[[-1.15,-.45,.05],[-1.45,-.25,.1],[-1.4,.1,.12],[-1.2,.42,.1],[-.6,.48,.05],[.4,.42,0],[1.3,.25,0],[1.6,0,0],[1.3,-.28,0],[.4,-.42,0],[-.5,-.48,.05]];
 const fc=u=>bloodCol(u<.12?0:u<.3?(u-.12)/.18:u<.75?1:1-(u-.75)/.25);
 const vs=vtube(loopP,{closed:true,r:.065,colorFn:fc,parent:F,seg:260,radial:12});
 movers(vs.userData.curve,{n:34,shape:"cell",size:.07,speed:.1,colorFn:fc,parent:F});
 // أسهم الاتجاه
 [[.5,.42],[1.45,.13],[.0,-.45]].forEach(([x,y],k)=>{const c=vs.userData.curve;const u=[.47,.66,.86][k];const p=c.getPointAt(u),t=c.getTangentAt(u);const ar=new THREE.Mesh(new THREE.ConeGeometry(.11,.26,16),mat("#ffffff"));ar.position.copy(p).add(V(0,0,.12));ar.quaternion.setFromUnitVectors(V(0,1,0),t);F.add(ar)});
 const M4=new THREE.Matrix4();
 onFrame((t,dt)=>{back.forEach((b,k)=>{b.u+=dt*.07;if(b.u>1)b.u-=1;const x=-1.3+b.u*2.9;M4.makeTranslation(x,b.y+.04*Math.sin(t*2+k),b.z);bm.setMatrixAt(k,M4)});bm.instanceMatrix.needsUpdate=true;hT.scale.y=1+.18*Math.max(0,Math.sin(t*5))});
 const t1=addLabel("دوران مفتوح — الجرادة",-2.85,3.6,0),t2=addLabel("دوران مغلق — السمكة",2.85,3.6,0);t1.element.style.fontSize=t2.element.style.fontSize="17px";t1.element.style.background="#6f9a1f";t2.element.style.background="#2f6fd1";
 view(0,1.7,8.3,0,1.5,0);
 return {points:{open:[-2.85,3.3,0],closed:[2.85,3.3,0],dorsal:[-2.85+.2,1.35+.6,0],sinus:[-2.85,1.35-.62,.4],heartB:[2.85-1.15,1.35-.95,.2],gills:[2.85-1.3,1.35+.7,.2],body:[2.85+.9,1.35-.75,0]}}}

// حرارة الجسم: متغيّر (سحلية) وثابت (طائر) — kit.thermo({}) → {set(temp),points}
// الكاميرا ثابتة من الأمام (لا دوران تلقائي) حتى لا يتبادل اليمين واليسار، وكل حيوان معه ميزانه وبطاقته
function thermo(o={}){const g=new THREE.Group();put(g,o.parent);C.autoRotate=false;SW.user=true;C.minAzimuthAngle=-.55;C.maxAzimuthAngle=.55;C.maxPolarAngle=1.45;
 ground({color:"#ead39a",color2:"#dcbf7c",size:18,flat:6});const sunO=sun({pos:[-5,6.8,-6],size:.8});
 // ---- السحلية على صخرة (يسار)
 const LX=-2.4;const rock=blob({r:1,scale:[1.5,.48,1.05],pos:[LX,.22,0],color:"#a99482",seed:9,amp:.14,parent:g});
 const Lz=new THREE.Group();Lz.position.set(LX+.1,.66,.05);Lz.scale.setScalar(1.45);g.add(Lz);
 const sp=[[-1.05,.1,0],[-.82,.08,0],[-.6,.06,0],[-.25,.05,0],[.15,.05,0],[.5,.04,.05],[.9,.02,.22],[1.25,0,.48],[1.5,-.01,.82],[1.6,-.02,1.1]];
 const rad=t=>t<.1?.1+.06*Math.sin(t/.1*Math.PI*.9):t<.17?.1:t<.5?.1+.07*Math.sin((t-.17)/.33*Math.PI):Math.max(.012,.1*(1-(t-.5)/.5));
 const lzc=t=>{const c=col("#5fae3e");if(t>.18&&t<.92&&Math.sin(t*90)>.55)c.lerp(col("#2f6f2a"),.7);if(t<.06)c.lerp(col("#7cc252"),.4);return c};
 const body=vtube(sp,{r:rad,colorFn:lzc,parent:Lz,seg:220,radial:22,rough:.55});body.scale.set(1,.72,1);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),mat("#1b1b1b",{roughness:.2}));e.position.set(-.86,.09,s*.085);Lz.add(e);const hl=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),glowMat("#ffffff",1));hl.position.set(-.89,.11,s*.11);Lz.add(hl)});
 const legs=[];[[-.42,1],[-.42,-1],[.38,1],[.38,-1]].forEach(([x,s])=>{const lg=new THREE.Group();lg.position.set(x,.02,s*.1);Lz.add(lg);
  vtube([[0,0,0],[x<0?-.06:.06,.1,s*.2],[x<0?-.1:.1,-.1,s*.32]],{r:.036,color:"#5fae3e",parent:lg,seg:16,radial:10});
  const ft=new THREE.Mesh(new THREE.SphereGeometry(.05,12,8),mat("#4f9a35"));ft.scale.set(1.4,.35,1);ft.position.set(x<0?-.1:.1,-.12,s*.33);lg.add(ft);legs.push(lg)});
 const tm=(x,z)=>{const tg=new THREE.Group();tg.position.set(x,0,z);g.add(tg);const gl=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,2.1,24),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.3,roughness:.05,depthWrite:false}));gl.position.y=1.27;tg.add(gl);
  const tick=new THREE.Mesh(new THREE.BoxGeometry(.02,2,.02),mat("#33415c"));tick.position.set(.13,1.25,0);tg.add(tick);for(let k=0;k<=9;k++){const tk=new THREE.Mesh(new THREE.BoxGeometry(k%2?.06:.12,.015,.02),mat("#33415c"));tk.position.set(.16,.3+k*.19,0);tg.add(tk)}
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,24,16),glowMat("#e8262b",.5));bulb.position.y=.18;tg.add(bulb);const cm=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1,14),glowMat("#e8262b",.5));cm.geometry.translate(0,.5,0);cm.position.y=.3;tg.add(cm);return cm};
 const tL=tm(LX+1.95,-.35);
 // ---- الطائر على غصن (يمين)
 const BX=2.5;const perch=new THREE.Group();perch.position.set(BX,0,0);g.add(perch);
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.1,12),mat("#7a5634"));post.position.y=.55;perch.add(post);const br=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.2,12),mat("#7a5634"));br.rotation.z=Math.PI/2;br.position.y=1.1;perch.add(br);
 const Bd=new THREE.Group();Bd.position.set(BX,1.15,0);g.add(Bd);const bc="#3f86d8";
 blob({r:.42,scale:[1.25,.95,.9],pos:[0,.42,0],color:bc,seed:5,amp:.03,parent:Bd});blob({r:.32,scale:[1,.8,.85],pos:[.05,.3,0],color:"#dceeff",seed:6,amp:.02,parent:Bd}).position.set(-.12,.3,0);
 const hd=blob({r:.27,pos:[-.45,.85,0],color:bc,seed:7,amp:.02,parent:Bd});
 const bk=new THREE.Mesh(new THREE.ConeGeometry(.08,.26,14),mat("#f2a33a"));bk.rotation.z=Math.PI/2;bk.position.set(-.8,.83,0);Bd.add(bk);
 [-1,1].forEach(s=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.045,12,10),mat("#111",{roughness:.2}));e.position.set(-.6,.93,s*.17);Bd.add(e);const w=blob({r:.32,scale:[1.35,.55,.25],pos:[.1,.48,s*.37],color:"#2f6fb8",seed:s+8,parent:Bd});w.rotation.x=s*.25;
  const lg=new THREE.Mesh(new THREE.CylinderGeometry(.022,.022,.22,8),mat("#f2a33a"));lg.position.set(0,0,s*.12);Bd.add(lg)});
 const tl=new THREE.Mesh(new THREE.ConeGeometry(.2,.6,4),mat("#2f6fb8"));tl.rotation.z=-Math.PI/2-.4;tl.position.set(.65,.3,0);tl.scale.z=.35;Bd.add(tl);
 const tB=tm(BX+1.2,-.35);
 const lbL=addLabel("",LX+.2,2.75,0),lbB=addLabel("",BX+.5,2.75,0);lbL.element.style.background="#2f9e5b";lbB.element.style.background="#2f6fd1";lbL.element.style.fontSize=lbB.element.style.fontSize="15px";
 const S={env:25};const set=v=>{S.env=+v;const lzT=clamp(S.env,0,45),bT=41;tL.scale.y=lzT/45*1.75+.02;tB.scale.y=bT/45*1.75;
  lbL.element.textContent="🦎 السحلية: متغيّرة الحرارة · "+Math.round(lzT)+"°";lbB.element.textContent="🐦 الطائر: ثابت الحرارة · "+bT+"°";
  sunO.children[1].intensity=8+S.env*.9;sunL.intensity=.8+S.env/28;const top=new THREE.Color("#8fb6d9").lerp(new THREE.Color("#ffb36b"),S.env/45);sky("#"+top.getHexString(),"#fff1dc");
  ui.result(S.env<15?"الجو بارد: حرارة السحلية انخفضت فصارت بطيئة، والطائر بقيت حرارته ٤١°":S.env>35?"الجو حار: حرارة السحلية ارتفعت فتختبئ في الظل، والطائر بقيت حرارته ٤١°":"حرارة السحلية تساوي حرارة الجو تقريباً، والطائر ثابت عند ٤١°")};
 onFrame((t,dt)=>{const act=clamp((S.env-6)/22,0,1)*(S.env>36?.4:1);body.rotation.y=Math.sin(t*2.4*act)*.06*act;Lz.position.y=.66+Math.max(0,Math.sin(t*3*act))*.04*act;legs.forEach((l,k)=>l.rotation.z=Math.sin(t*4*act+k*1.6)*.25*act);
  const shade=S.env>36?1:0;Lz.position.z+=((shade?1.05:.05)-Lz.position.z)*Math.min(1,dt*1.5);Bd.children[0].scale.y=1+.02*Math.sin(t*4)});
 view(0,2.9,7.2,0,1.2,0);set(25);
 return {set,points:{lizard:[LX,1.3,0],bird:[BX,2.3,0],rock:[LX,.15,.9]}}}

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
 const D=digestive({parent:g,shell:false}),Lu=lungs({parent:g,shell:false,heart:false,ribs:false});const H=heart({parent:g,pos:[.12,3.2,.3],scale:.28});
 const vs=new THREE.Group();g.add(vs);[[[.12,3.25,.32],[.35,3.9,.3],[.3,4.6,.2],[.2,5.1,.1]],[[.15,3.0,.3],[.5,2.0,.32],[.55,1.0,.3],[.45,.1,.2]]].forEach(p=>vtube(p,{r:.035,color:"#e2333b",parent:vs}));
 [[[-.05,3.1,.25],[-.35,3.9,.25],[-.3,4.6,.15],[-.2,5.1,.05]],[[-.05,2.95,.25],[-.5,2.0,.28],[-.55,1.0,.27],[-.45,.1,.2]]].forEach(p=>vtube(p,{r:.035,color:"#3d6df2",parent:vs}));
 const sys={digestive:D.group,lungs:Lu.group,circ:[H.group,vs]};const all=[D.group,Lu.group,H.group,vs];
 const show=n=>{all.forEach(x=>x.visible=n==="all");if(n==="digestive")D.group.visible=true;if(n==="lungs")Lu.group.visible=true;if(n==="circ"){H.group.visible=true;vs.visible=true}};
 sway();view(0,2.75,9.4,0,2.65,0);
 return {show,digestive:D,lungs:Lu,heart:H,points:{stomach:D.points.stomach,lungs:Lu.points.lungR,heart:[.45,3.3,.5],intestine:D.points.smallIntestine}}}


// ---------- نماذج تشريحية حقيقية (BodyParts3D © DBCLS، رخصة CC BY-SA 2.1 Japan) ----------
// models/{resp,dig,heart,skin,exc}.glb — إحداثيات الجسم: Y للأعلى (١ وحدة = ١٠ سم)، الأمام +Z، يسار المريض +X
const MB=(()=>{try{return new URL("../models/",document.baseURI).href}catch(e){return "https://dars.majoodah.com/models/"}})();
const GL=new GLTFLoader();GL.setMeshoptDecoder(MeshoptDecoder);const GLC={};
const glb=n=>GLC[n]||(GLC[n]=new Promise((ok,no)=>GL.load(MB+n+".glb",g=>ok(g.scene),undefined,no)));
const ORG={trachea:["#f1d2c4","القصبة الهوائية"],bronchi:["#fff0e8","الشعب الهوائية"],rul:["#f07592","الرئة اليمنى"],rml:["#f68aa3",""],rll:["#e9688a",""],lul:["#f07592","الرئة اليسرى"],lll:["#e9688a",""],diaphragm:["#c9584f","الحجاب الحاجز"],
 esophagus:["#ec8a7c","المريء"],stomach:["#ec6079","المعدة"],duodenum:["#f6a6a6",""],jejunum:["#f9b0ae","الأمعاء الدقيقة"],ileum:["#f5a0a2",""],colon:["#e6a064","الأمعاء الغليظة"],rectum:["#d98d5e","المستقيم"],liver:["#9a3a2c","الكبد"],gallbladder:["#4f9a3c","المرارة"],pancreas:["#f2c46b","البنكرياس"],
 heart:["#c8343f","القلب"],aorta:["#e2333b","الشريان الأبهر"],svc:["#3d6df2","الوريد الأجوف"],ivc:["#3d6df2",""],partery:["#3d6df2","الشريان الرئوي"],pvein:["#e2333b","الوريد الرئوي"],skin:["#ffd9c4",""],kidneyR:["#a8433a","الكلية اليمنى"],kidneyL:["#a8433a","الكلية اليسرى"],ureter:["#e8c56a","الحالب"],bladder:["#f0c95a","المثانة"]};
// الجلد: حواف شفافة فقط، ويُقصّ تحت أسفل البطن (٩٫٣ = ٩٣ سم) — شرح للأطفال
const SKIN_CUT=9.3;
function skinMat(op){return new THREE.ShaderMaterial({uniforms:{c:{value:col("#e9a07f")},k:{value:op},cut:{value:SKIN_CUT}},transparent:true,depthWrite:false,side:THREE.FrontSide,
 vertexShader:"varying vec3 vN;varying vec3 vV;varying float vY;void main(){vec4 w=modelMatrix*vec4(position,1.0);vY=w.y;vec4 mv=viewMatrix*w;vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}",
 fragmentShader:"uniform vec3 c;uniform float k;uniform float cut;varying vec3 vN;varying vec3 vV;varying float vY;void main(){if(vY<cut)discard;float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.2);float e=smoothstep(cut,cut+0.45,vY);gl_FragColor=vec4(c,clamp(f*k*4.5+0.025,0.0,0.75)*e);}"})}
function organMat(n,o){if(n==="skin")return skinMat(o&&o.opacity!=null?o.opacity:.14);const c=(ORG[n]||["#ddd"])[0];const tr=o&&o.opacity<1;return new THREE.MeshPhysicalMaterial({color:col(c).convertSRGBToLinear().convertLinearToSRGB(),roughness:n==="skin"?.6:.38,clearcoat:n==="skin"?0:.45,clearcoatRoughness:.35,sheen:.12,sheenColor:col("#ffe0e6"),transparent:!!tr,opacity:o&&o.opacity!=null?o.opacity:1,depthWrite:!tr,side:THREE.DoubleSide,emissive:col(c),emissiveIntensity:0})}
// anatomy({systems:['resp','heart','dig'],skin:true,opacity:{name:0.5},labels:true}) → {group,ready,mesh(name),center(name),glow(name,on)}
function anatomy(o={}){const g=new THREE.Group();put(g,o.parent);const sys=o.systems||["resp","heart","dig"];const M={},op=o.opacity||{};const LB={};
 const A={group:g,mesh:n=>M[n],center:n=>{const b=new THREE.Box3().setFromObject(M[n]);return b.getCenter(new THREE.Vector3())},box:n=>new THREE.Box3().setFromObject(M[n]),labels:LB};
 A.glow=(n,on)=>{const m=M[n];if(m)m.material.emissiveIntensity=on?.45:0};
 A.ready=Promise.all(sys.concat(o.skin===false?[]:["skin"]).map(glb)).then(scs=>{scs.forEach(sc=>{sc=sc.clone(true);sc.traverse(m=>{if(m.isMesh){if(!m.geometry.attributes.normal)m.geometry.computeVertexNormals();const n=m.name||m.parent.name;m.name=n;const oo=n==="skin"?{opacity:o.skinOpacity??.13}:{opacity:op[n]};m.material=organMat(n,oo);m.castShadow=m.receiveShadow=false;if(n==="skin")m.renderOrder=6;if(oo.opacity<1)m.renderOrder=4;M[n]=m}});g.add(sc)});
  g.updateMatrixWorld(true);
  if(o.labels!==false)Object.keys(M).forEach(n=>{const t=(ORG[n]||[])[1];if(!t||(o.hide&&o.hide.includes(n)))return;const b=A.box(n),c=b.getCenter(new THREE.Vector3());const side=c.x<0?-1:1;const off=o.labelOff&&o.labelOff[n]||[0,0,0];
   LB[n]=addLabel(t,(side<0?b.min.x-.25:b.max.x+.25)+off[0],c.y+off[1],c.z+.3+off[2])});
  if(o.onReady)try{o.onReady(A)}catch(e){console.error(e)}return A});
 A.ready.catch(e=>{console.error(e);const el=document.getElementById("e");if(el){el.textContent="تعذّر تحميل النموذج";el.style.display="flex"}});
 return A}
// الجهاز التنفسي الحقيقي يتنفس: kit.realLungs({}) → {setRate,ready}
function realLungs(o={}){bodySky();const A=anatomy(Object.assign({systems:["resp","heart"],opacity:{rul:.6,rml:.6,rll:.6,lul:.6,lll:.6},hide:["svc","ivc","partery","pvein","aorta","rml","rll","lll"],labelOff:{bronchi:[-.1,-.5,0],heart:[.25,-.75,0],lul:[0,.55,0],rul:[0,.35,0],trachea:[0,.3,0]}},o));
 const S={rate:14,ph:0,L:null,base:null};view(0,12.9,8.4,0,12.5,1);sway();A.ready.then(()=>["ivc","svc"].forEach(n=>{const m=A.mesh(n);if(m)m.visible=false}));
 const air=[];
 A.ready.then(()=>{const lobes=["rul","rml","rll","lul","lll","bronchi"].map(n=>A.mesh(n));const top=A.box("rul").max.y;const piv=new THREE.Group();piv.position.set(0,top,1.05);A.group.add(piv);lobes.forEach(m=>{const w=new THREE.Vector3();m.getWorldPosition(w);piv.attach(m)});S.L=piv;S.d=A.mesh("diaphragm");S.dy=S.d.position.y;
  const t=A.box("trachea");const path=[[0,14.6,1.6],[0,14.25,1.35],[0,t.max.y,t.getCenter(new THREE.Vector3()).z],[0,(t.max.y+t.min.y)/2,1.0],[0,t.min.y,1.0]];
  [-1,1].forEach(s=>{const c=new THREE.CatmullRomCurve3(path.concat([[s*.35,t.min.y-.35,1.0],[s*.65,t.min.y-1.0,1.05]]).map(p=>V(p)));air.push(movers(c,{n:12,size:.06,speed:0,color:"#2fb5ff",emit:"#2fb5ff",ei:.8,parent:A.group}),movers(c,{n:12,size:.06,speed:0,color:"#8d96a3",emit:"#8d96a3",ei:.3,parent:A.group}))})});
 onFrame((t,dt)=>{S.ph+=dt*TAU*S.rate/60;const b=Math.sin(S.ph),inh=Math.cos(S.ph)>0;if(S.L){S.L.scale.set(1+.05*b,1+.06*b,1+.05*b);S.d.position.y=S.dy-.14*b}
  air.forEach((m,k)=>{const o2=k%2===0;m.speed=(o2?inh:!inh)?(o2?.3:-.3)*S.rate/14:0;m.visible=(o2?inh:!inh)?12:0})});
 return {ready:A.ready,anatomy:A,setRate:n=>{S.rate=+n||14}}}
// الجهاز الهضمي الحقيقي + رحلة الغذاء: كرة غذاء مضيئة واضحة (تظهر حتى داخل الأعضاء) تمر بالأعضاء بالترتيب
function realDigestive(o={}){bodySky();const A=anatomy(Object.assign({systems:["dig"],opacity:{liver:.82,stomach:.8,jejunum:.8,ileum:.8,duodenum:.8,colon:.85},hide:["ileum","duodenum"],labelOff:{jejunum:[.1,.2,0],colon:[0,-.3,0],gallbladder:[0,-.25,0],pancreas:[0,-.15,0]}},o));view(0,10.9,8.6,0,10.5,1.1);sway();
 // الغذاء
 const BG=new THREE.Group();BG.visible=false;BG.renderOrder=30;scene.add(BG);
 const bm=new THREE.MeshStandardMaterial({color:col("#ff8c00"),emissive:col("#ff6a00"),emissiveIntensity:.5,roughness:.35,depthTest:false,transparent:true,toneMapped:false});
 const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(.2,3),bm);ball.renderOrder=31;BG.add(ball);
 {const p=ball.geometry.attributes.position,v=new THREE.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k);v.multiplyScalar(1+(fbm(v.x*9+3,v.y*9+v.z*5)-.5)*.35);p.setXYZ(k,v.x,v.y,v.z)}ball.geometry.computeVertexNormals()}
 const halo=new THREE.Mesh(new THREE.RingGeometry(.27,.33,48),new THREE.MeshBasicMaterial({color:col("#ffffff"),transparent:true,opacity:1,depthTest:false,side:THREE.DoubleSide,toneMapped:false}));halo.renderOrder=32;BG.add(halo);
 const halo2=new THREE.Mesh(new THREE.RingGeometry(.33,.42,48),new THREE.MeshBasicMaterial({color:col("#ff6a00"),transparent:true,opacity:1,depthTest:false,side:THREE.DoubleSide,toneMapped:false}));halo2.renderOrder=32;BG.add(halo2);
 const tag=addLabel("🍎 رحلة الغذاء عند الهضم",0,0,0);tag.element.style.background="#ff6a00";tag.element.style.fontSize="15px";tag.visible=false;
 const STEPS=[["mouth","الفم: تقطع الأسنان الغذاء وتطحنه، ويختلط باللعاب","#ff8c00"],["esophagus","المريء: ينزل الغذاء من الفم إلى المعدة","#ff8c00"],["stomach","المعدة: الحمض والإنزيم يحلّلان الغذاء فيصير سائلاً كثيفاً","#ffa600"],["liver","الكبد والبنكرياس يرسلان عصارات تكمل الهضم","#ffa600"],["jejunum","الأمعاء الدقيقة: تُمتص المواد الغذائية إلى الدم","#f29a00"],["colon","الأمعاء الغليظة: يُمتص الماء من الفضلات","#a0561c"],["rectum","تُطرح الفضلات خارج الجسم","#7a3f14"]];
 const PATH=[];const S={k:-1,t:0},DUR=[3.2,2.6,3.4,2.4,4.2,4.4,2.2];
 const nut=particles({kind:"spark",rate:0,color:["#ff4a4a","#ff9a9a"],size:[.28,.06],life:[.8,1.2],speed:[.4,.8],spread:1,max:300});nut.obj.material.depthTest=false;nut.obj.renderOrder=33;
 const wat=particles({kind:"dust",rate:0,color:["#3fb0ff","#9fd8ff"],size:[.24,.06],life:[.8,1.2],speed:[.3,.6],spread:1,max:200,additive:true});wat.obj.material.depthTest=false;wat.obj.renderOrder=33;
 A.ready.then(()=>{const b=n=>A.box(n),c=n=>A.center(n),P=(x,y,z)=>V(x,y,z);
  const e=b("esophagus"),ec=c("esophagus"),st=b("stomach"),sc=c("stomach"),du=c("duodenum"),je=c("jejunum"),il=c("ileum"),co=b("colon"),cc=c("colon"),re=b("rectum"),rc=c("rectum");
  const z=sc.z+.25,cz=cc.z+.2;const eTop=P(ec.x,e.max.y-.1,ec.z),eBot=P(ec.x+.05,e.min.y+.15,ec.z);
  const pyl=P(st.min.x+.25,sc.y-.25,z),cecum=P(co.min.x+.35,co.min.y+.55,cz),ascT=P(co.min.x+.35,co.max.y-.35,cz),trL=P(co.max.x-.35,co.max.y-.35,cz),dsB=P(co.max.x-.35,co.min.y+.6,cz);
  const mo=P(0,14.12,1.25);const segs=[[P(0,14.3,2.9),P(0,14.2,1.9),mo],[mo,P(ec.x*.5,(mo.y+e.max.y)/2,(mo.z+ec.z)/2),eTop,P(ec.x,(e.max.y+e.min.y)/2,ec.z),eBot],[eBot,P(sc.x+.15,sc.y+.2,z),P(sc.x,sc.y-.05,z),pyl],[pyl,P(du.x,du.y,du.z+.25)],[P(du.x,du.y,du.z+.25),P(je.x+.3,je.y+.1,je.z+.25),P(je.x-.3,je.y-.2,je.z+.25),P(il.x,il.y,il.z+.25),cecum],[cecum,ascT,trL,dsB],[dsB,P(rc.x,re.max.y-.1,rc.z+.1),P(rc.x,re.min.y+.1,rc.z+.1)]];
  segs.forEach(pts=>PATH.push(new THREE.CatmullRomCurve3(pts.length>1?pts:[pts[0],pts[0]],false,"centripetal")))});
 const start=()=>{A.ready.then(()=>{S.k=0;S.t=0;BG.visible=true;tag.visible=true;ball.scale.setScalar(1);snd("whoosh")})};
 const tmp=new THREE.Vector3();
 onFrame((t,dt)=>{halo.quaternion.copy(camera.quaternion);halo2.quaternion.copy(camera.quaternion);if(S.k<0)return;const k=S.k;
  if(S.t===0){Object.keys(ORG).forEach(n=>A.glow(n,false));const n=STEPS[k][0];A.glow(n,true);if(n==="liver"){A.glow("pancreas",true);A.glow("gallbladder",true)}if(n==="jejunum"){A.glow("ileum",true);A.glow("duodenum",true)}
   ui.result(STEPS[k][1]);if(n==="mouth")focus(0,13.6,1.2,5.2);else{const cc=A.center(n==="liver"?"duodenum":n);focus(cc.x,cc.y,cc.z,n==="esophagus"?6.4:5.4)}}
  S.t+=dt;const u=clamp(S.t/DUR[k],0,1);const cv=PATH[k];if(cv){cv.getPointAt(ease(u),tmp);BG.position.copy(tmp);tag.position.copy(tmp).add(V(0,.42,0))}
  const sc=[1.25-.15*u,1.1,1.1-.25*u,.85,.85,.8,.8][k];ball.scale.setScalar(sc*(1+(k===0&&u>.6?.18:.06)*Math.sin(t*(k===0?14:8))));if(k===2||k===0&&u>.6)ball.rotation.y+=dt*6;
  bm.color.set(STEPS[k][2]);bm.emissive.set(STEPS[k][2]).multiplyScalar(.45);halo2.material.color.set(STEPS[k][2]);tag.element.style.background=STEPS[k][2];
  if(k===4&&Math.random()<.6){nut.pos.copy(tmp);nut.emit(2)}if(k===5&&Math.random()<.5){wat.pos.copy(tmp);wat.emit(1)}
  const m=A.mesh(STEPS[k][0]);if(m)m.material.emissiveIntensity=.25+.2*Math.sin(t*6);
  if(S.t>DUR[k]+.5){S.k++;S.t=0;snd("pop");if(S.k>=STEPS.length){S.k=-1;BG.visible=false;tag.visible=false;Object.keys(ORG).forEach(n=>A.glow(n,false));ui.result("انتهت الرحلة! 🎉 اضغط مرة ثانية لتعيدها");snd("ding");focus(0,10.5,1.1,8.6)}}});
 return {ready:A.ready,anatomy:A,start}}
// نظرة عامة: الأجهزة الثلاثة الحقيقية في الجسم
function realBody(o={}){bodySky();const A=anatomy(Object.assign({systems:["resp","heart","dig"],opacity:{rul:.75,rml:.75,rll:.75,lul:.75,lll:.75},labels:false,skinOpacity:.14},o));view(0,11.6,8.6,0,11.3,1);sway();
 const SY={resp:["trachea","bronchi","rul","rml","rll","lul","lll","diaphragm"],dig:["esophagus","stomach","duodenum","jejunum","ileum","colon","rectum","liver","gallbladder","pancreas"],circ:["heart","aorta","svc","ivc","partery","pvein"]};
 const show=k=>A.ready.then(()=>{Object.entries(SY).forEach(([s,ns])=>ns.forEach(n=>{const m=A.mesh(n);if(m)m.visible=k==="all"||k===s}))});
 const HB={on:true};onFrame(t=>{const h=A.mesh&&A.mesh("heart");if(h){const f=(t*1.2)%1;h.scale.setScalar(h.userData.s0||(h.userData.s0=h.scale.x));h.scale.multiplyScalar(1+.05*Math.exp(-Math.pow((f-.1)/.06,2)))}});
 return {ready:A.ready,anatomy:A,show}}

// ---------- الهضم في اللافقاريات ----------
// الإسفنج: يدخل الماء من ثقوب كثيرة، تلتقط خلاياه الغذاء العالق، ويخرج الماء من الفتحة العليا — kit.sponge({}) → {flow(on),points}
function sponge(o={}){const g=new THREE.Group();put(g,o.parent);sky("#5cc4f2","#d9f4ff");hemi.intensity=1.5;sunL.intensity=2.2;
 const sand=new THREE.Mesh(new THREE.CircleGeometry(9,48),mat("#f1dfb0",{roughness:1}));sand.rotation.x=-Math.PI/2;g.add(sand);
 const RO=y=>1.0+.14*Math.sin(y*1.4)+.1*Math.max(0,1-y),T=.3,H=4;
 const prof=[];for(let i=0;i<=20;i++){const y=i/20*H;prof.push(new THREE.Vector2(RO(y),y))}prof.push(new THREE.Vector2(RO(H)-T,H));for(let i=20;i>=2;i--){const y=i/20*H;prof.push(new THREE.Vector2(RO(y)-T,y))}prof.push(new THREE.Vector2(0,.4));
 const SM=new THREE.MeshStandardMaterial({color:col("#f4b52c"),roughness:.95,side:THREE.DoubleSide});const IM=new THREE.MeshStandardMaterial({color:col("#e89a1c"),roughness:1,side:THREE.DoubleSide});
 const tube=(x,z,s,cut)=>{const t=new THREE.Group();t.position.set(x,0,z);t.scale.setScalar(s);g.add(t);const ps=cut?Math.PI/4:0,pl=cut?Math.PI*1.5:TAU;
  const m=new THREE.Mesh(new THREE.LatheGeometry(prof,72,ps,pl),SM);t.add(m);const bd=new THREE.Mesh(new THREE.CircleGeometry(RO(0),48,ps-Math.PI/2,pl),SM);bd.rotation.x=-Math.PI/2;bd.position.y=.01;t.add(bd);
  if(cut)[ps,ps+pl].forEach(ph=>{const sh=new THREE.Shape(prof.map(p=>new THREE.Vector2(p.x,p.y)));const c=new THREE.Mesh(new THREE.ShapeGeometry(sh),IM);c.rotation.y=ph-Math.PI/2;t.add(c)});
  // الثقوب
  const n=cut?170:90,pm=new THREE.InstancedMesh(new THREE.CircleGeometry(.065,14),new THREE.MeshBasicMaterial({color:col("#8a4a06")}),n),M=new THREE.Matrix4(),Q=new THREE.Quaternion(),P=new THREE.Vector3(),N=new THREE.Vector3(),Z=new THREE.Vector3(0,0,1);
  for(let k=0;k<n;k++){const a=ps+.08+Math.random()*(pl-.16),y=.3+Math.random()*(H-.6),r=RO(y)+.004;P.set(r*Math.sin(a),y,r*Math.cos(a));N.set(Math.sin(a),0,Math.cos(a));Q.setFromUnitVectors(Z,N);const sc=.7+Math.random()*.7;M.compose(P,Q,new THREE.Vector3(sc,sc,sc));pm.setMatrixAt(k,M)}t.add(pm);return t};
 tube(0,0,1,true);tube(-2.3,-1.6,.62,false);tube(2.2,-1.9,.7,false);
 // تيار الماء: يدخل من الثقوب ← التجويف ← يصعد ويخرج من الأعلى، والغذاء الأخضر تلتقطه الخلايا
 const NW=70,NF=24,curves=[],fcur=[];const pick=()=>Math.PI/4+.25+Math.random()*(Math.PI*1.5-.5);
 for(let k=0;k<NW;k++){const a=pick(),y=.6+Math.random()*2.8,r=RO(y),sx=Math.sin(a),cz=Math.cos(a);
  curves.push(new THREE.CatmullRomCurve3([V(sx*(r+1.8),y+(Math.random()-.5)*.6,cz*(r+1.8)),V(sx*(r+.05),y,cz*(r+.05)),V(sx*(r-T-.15),y,cz*(r-T-.15)),V(sx*.25,Math.min(H-.2,y+1.1),cz*.25),V(sx*.15,H+.3,cz*.15),V(sx*.6,H+2.2,cz*.6)]))}
 for(let k=0;k<NF;k++){const a=pick(),y=.7+Math.random()*2.6,r=RO(y),sx=Math.sin(a),cz=Math.cos(a);fcur.push(new THREE.CatmullRomCurve3([V(sx*(r+1.8),y,cz*(r+1.8)),V(sx*(r+.05),y,cz*(r+.05)),V(sx*(r-T-.02),y,cz*(r-T-.02))]))}
 const wm=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshStandardMaterial({color:col("#2f9bff"),emissive:col("#2f9bff"),emissiveIntensity:.5,transparent:true,opacity:.85}),NW);
 const fm=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.085,0),new THREE.MeshStandardMaterial({color:col("#4fb336"),emissive:col("#2f8a1c"),emissiveIntensity:.5}),NF);[wm,fm].forEach(m=>{m.frustumCulled=false;g.add(m)});
 const off=curves.map(()=>Math.random()),foff=fcur.map(()=>Math.random()),S={on:true,sp:.09},M=new THREE.Matrix4(),P=new THREE.Vector3(),Qi=new THREE.Quaternion(),SC=new THREE.Vector3();
 onFrame((t,dt)=>{for(let k=0;k<NW;k++){if(S.on)off[k]=(off[k]+dt*S.sp)%1;curves[k].getPointAt(off[k],P);SC.setScalar(S.on||off[k]>.02?1:0);M.compose(P,Qi,SC);wm.setMatrixAt(k,M)}
  for(let k=0;k<NF;k++){if(S.on)foff[k]=(foff[k]+dt*S.sp*.8)%1;const u=foff[k];const v=Math.min(1,u/.6);fcur[k].getPointAt(v,P);SC.setScalar(u<.6?1:Math.max(0,1-(u-.6)/.3));M.compose(P,Qi,SC);fm.setMatrixAt(k,M)}
  wm.instanceMatrix.needsUpdate=true;fm.instanceMatrix.needsUpdate=true});
 view(.8,5.6,8.4,0,2.3,0);sway();
 const a0=Math.PI*.62,r1=RO(1.6);return {group:g,flow:on=>{S.on=on!==false;snd("blub")},fast:()=>{S.sp=.22;setTimeout(()=>S.sp=.09,3000)},
  points:{pore:[Math.sin(a0)*(r1+.15),1.6,Math.cos(a0)*(r1+.15)],cavity:[0,3.0,.3],top:[0,H+.45,0],wall:[Math.sin(Math.PI*1.75)*(RO(1.1)-T),1.1,Math.cos(Math.PI*1.75)*(RO(1.1)-T)],out:[.5,H+1.8,0]}}}

// فتحة واحدة للابتلاع والإخراج — kit.oneOpening({}) → {show('hydra'|'planaria'),feed()}
// كل حيوان في إطار كامل: الهيدرا مقطوعة كالكيس (تجويف + فم واحد)، والبلاناريا يخرج بلعومها من بطنها إلى الغذاء
function fatArrow(from,to,color,parent){const a=V(from),b=V(to),d=b.clone().sub(a),L=d.length(),g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:col(color),emissive:col(color),emissiveIntensity:.45,roughness:.5,depthTest:false,transparent:true});
 const sh=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,L*.68,14),m);sh.position.y=L*.34;const hd=new THREE.Mesh(new THREE.ConeGeometry(.2,L*.32,18),m);hd.position.y=L*.84;g.add(sh,hd);g.position.copy(a);g.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());g.renderOrder=40;sh.renderOrder=hd.renderOrder=40;put(g,parent);return g}
function oneOpening(o={}){const g=new THREE.Group();put(g,o.parent);sky("#6ccaf3","#e6f8ff");hemi.intensity=1.55;sunL.intensity=2.1;C.autoRotate=false;SW.user=true;
 const sand=new THREE.Mesh(new THREE.PlaneGeometry(40,16),mat("#e9dcae",{roughness:1}));sand.rotation.x=-Math.PI/2;g.add(sand);
 const LBs={hydra:[],planaria:[]};const lab=(k,t,p,c)=>{const l=addLabel(t,p[0],p[1],p[2]);if(c)l.element.style.background=c;LBs[k].push(l);return l};
 const ph=t=>{const e=document.createElement("div");return e};
 // ================= الهيدرا (x=0) =================
 const H=new THREE.Group();g.add(H);const rock=blob({r:.9,scale:[1.5,.55,1.2],color:"#9a8f80",parent:H,seed:4});rock.position.y=.1;
 const B=new THREE.Group();B.position.y=.35;H.add(B);
 const pr=[[.32,0],[.5,.25],[.6,1.2],[.62,2.3],[.56,2.9],[.4,3.25],[.2,3.45],[.13,3.5],[.1,3.42],[.22,3.25],[.34,3.0],[.42,2.4],[.42,1.2],[.32,.4],[0,.3]].map(q=>new THREE.Vector2(q[0],q[1]));
 const ps=Math.PI/4,pl=Math.PI*1.5,outM=new THREE.MeshStandardMaterial({color:col("#7fcf6e"),roughness:.6,side:THREE.DoubleSide});
 B.add(new THREE.Mesh(new THREE.LatheGeometry(pr,64,ps,pl),outM));
 const inner=pr.slice(8).map(q=>new THREE.Vector2(Math.max(0,q.x-.012),q.y));const inM=new THREE.MeshStandardMaterial({color:col("#ffe0a8"),roughness:.7,side:THREE.DoubleSide,emissive:col("#ffb347"),emissiveIntensity:0});B.add(new THREE.Mesh(new THREE.LatheGeometry(inner,64,ps,pl),inM));
 [ps,ps+pl].forEach(a=>{const c=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pr)),new THREE.MeshStandardMaterial({color:col("#b9e8a8"),roughness:.8,side:THREE.DoubleSide}));c.rotation.y=a-Math.PI/2;B.add(c)});
 const TP=[];for(let k=0;k<6;k++){const a=k/6*TAU+.5,pv=new THREE.Group();pv.position.set(Math.cos(a)*.3,3.3,Math.sin(a)*.3);pv.rotation.y=-a;B.add(pv);const pts=[];for(let i=0;i<=10;i++){const u=i/10;pts.push([u*1.7,u*1.25-u*u*.35,0])}
  vtube(pts,{r:t=>.075*(1-t*.65),color:"#6cc25a",parent:pv,radial:10});TP.push(pv)}
 const mouthW=V(0,.35+3.5,0),cavW=V(0,.35+1.6,0);
 const food=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),new THREE.MeshStandardMaterial({color:col("#ff7a1a"),emissive:col("#ff6a00"),emissiveIntensity:.5,depthTest:false,transparent:true}));food.renderOrder=41;H.add(food);food.visible=false;
 const hIn=new THREE.CatmullRomCurve3([V(2.8,4.9,.6),V(2.1,4.75,.3),V(1.55,4.55,.15),V(.9,4.35,.1),V(.35,4.05,.05),mouthW.clone().add(V(0,.1,0)),V(0,3.2,.05),cavW]);
 const hOut=new THREE.CatmullRomCurve3([cavW,V(0,3.1,.05),mouthW.clone().add(V(0,.15,0)),V(-.2,4.6,.1),V(-.6,5.6,.2),V(-1.1,6.6,.3)]);
 const hw=new THREE.InstancedMesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:col("#7a4a1c"),depthTest:false,transparent:true}),18);hw.renderOrder=41;hw.frustumCulled=false;H.add(hw);hw.count=0;
 const nu=particles({kind:"dust",rate:0,color:["#ffd04a","#fff2b0"],size:[.16,.04],life:[.9,1.4],speed:[.2,.45],spread:1,max:200,parent:H});nu.obj.material.depthTest=false;nu.obj.renderOrder=42;
 const aIn=fatArrow([.95,5.0,.3],[.25,4.05,.1],"#2fbf3a",H),aOut=fatArrow([-.25,4.0,.1],[-.85,5.1,.3],"#8a4b17",H);aIn.visible=aOut.visible=false;
 lab("hydra","الهيدرا (من اللاسعات)",[-1.6,5.6,0],"#7b4dff");lab("hydra","الفم: الفتحة الوحيدة",[1.25,3.75,.2],"#ff7a2f");lab("hydra","التجويف الهضمي",[-1.45,1.9,.3],"#14a06f");lab("hydra","اللوامس تمسك الغذاء",[2.15,5.25,.2],"#2f8cff");
 const hStep=[lab("hydra","١ يدخل الغذاء من الفم",[1.9,4.4,.4],"#2fbf3a"),lab("hydra","٢ يُهضم داخل التجويف",[1.45,1.6,.4],"#e8a200"),lab("hydra","٣ تخرج الفضلات من الفم نفسه",[-1.9,5.0,.4],"#8a4b17")];
 // ================= البلاناريا (x=9) =================
 const P=new THREE.Group();P.position.set(9,0,0);g.add(P);
 const W=new THREE.Group();W.position.y=.62;W.scale.setScalar(1.55);P.add(W);
 const sh=new THREE.Shape();sh.moveTo(0,1.9);sh.bezierCurveTo(.35,1.95,.55,1.75,.62,1.5);sh.bezierCurveTo(.7,1.35,.5,1.2,.55,1.0);sh.bezierCurveTo(.7,.3,.6,-.9,.08,-1.9);sh.lineTo(-.08,-1.9);sh.bezierCurveTo(-.6,-.9,-.7,.3,-.55,1.0);sh.bezierCurveTo(-.5,1.2,-.7,1.35,-.62,1.5);sh.bezierCurveTo(-.55,1.75,-.35,1.95,0,1.9);
 const bg=new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:true,bevelThickness:.05,bevelSize:.06,bevelSegments:3,curveSegments:28});bg.rotateX(-Math.PI/2);bg.translate(0,-.03,0);
 const body=new THREE.Mesh(bg,new THREE.MeshPhysicalMaterial({color:col("#8c6346"),transparent:true,opacity:.6,roughness:.45,depthWrite:false,clearcoat:.4}));body.renderOrder=5;W.add(body);
 [-1,1].forEach(q=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),mat("#ffffff"));e.position.set(q*.2,.07,-1.45);e.scale.y=.5;W.add(e);const pp=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),mat("#111"));pp.position.set(q*.2,.1,-1.47);W.add(pp)});
 const GM=new THREE.MeshStandardMaterial({color:col("#ff8a2a"),emissive:col("#ff6a00"),emissiveIntensity:.15,roughness:.5});
 const trunks=[[[0,.02,.05],[0,.02,-.6],[0,.02,-1.25]],[[0,.02,.05],[.24,.02,.6],[.3,.02,1.55]],[[0,.02,.05],[-.24,.02,.6],[-.3,.02,1.55]]].map(q=>new THREE.CatmullRomCurve3(q.map(v=>V(v))));
 const tube=(c,r)=>{const m=new THREE.Mesh(new THREE.TubeGeometry(c,24,r,10),GM);W.add(m);return m};trunks.forEach(c=>tube(c,.05));
 const twigs=[];trunks.forEach((c,ti)=>{for(let i=1;i<8;i++){const q=c.getPointAt(i/8);[-1,1].forEach(sd=>{if(ti===1&&sd<0||ti===2&&sd>0)return;const t=new THREE.CatmullRomCurve3([q.clone(),q.clone().add(V(sd*.14,0,.03)),q.clone().add(V(sd*.26,0,.09))]);tube(t,.028);twigs.push(t)})}});
 const phC=new THREE.CatmullRomCurve3([V(0,0,.1),V(0,-.15,.12),V(0,-.3,.14),V(0,-.39,.15)]);const phM=new THREE.Mesh(new THREE.TubeGeometry(phC,16,.11,14),new THREE.MeshStandardMaterial({color:col("#ff7fa6"),emissive:col("#ff4f8b"),emissiveIntensity:.25,roughness:.5}));W.add(phM);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.095,.025,8,20),mat("#d9667f"));ring.rotation.x=Math.PI/2;W.add(ring);
 const leaf=blob({r:.42,scale:[1.3,.35,1.1],color:"#3fbf2a",parent:P,seed:2,emissive:"#1f8a10",ei:.25});leaf.position.set(0,.05,.23);
 const wl=v=>{W.updateMatrixWorld(true);return W.localToWorld(v.clone())};
 const pf=new THREE.InstancedMesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:col("#4fd13a"),emissive:col("#2f9a1c"),emissiveIntensity:.5,depthTest:false,transparent:true}),60);pf.renderOrder=41;pf.frustumCulled=false;g.add(pf);pf.count=0;
 const pw=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshStandardMaterial({color:col("#7a4a1c"),depthTest:false,transparent:true}),30);pw.renderOrder=41;pw.frustumCulled=false;g.add(pw);pw.count=0;
 const P_A=fatArrow([9.75,.05,1.35],[9.1,.25,.5],"#2fbf3a",P),P_B=fatArrow([8.9,.2,.5],[8.0,.05,1.4],"#8a4b17",P);P_A.position.x-=9;P_B.position.x-=9;P_A.visible=P_B.visible=false;
 lab("planaria","البلاناريا (دودة مفلطحة)",[9,1.6,-2.2],"#7b4dff");lab("planaria","البلعوم يخرج من البطن: الفتحة الوحيدة",[10.5,.15,1.1],"#ff4f8b");lab("planaria","تجويف هضمي متفرّع",[7.6,1.15,-.9],"#14a06f");lab("planaria","الغذاء",[8.35,-.15,.75],"#3fbf2a");
 const pStep=[lab("planaria","١ يدخل الغذاء من البلعوم",[10.3,-.05,1.8],"#2fbf3a"),lab("planaria","٢ يُهضم في التجويف المتفرّع",[9,1.5,1.2],"#e8a200"),lab("planaria","٣ تخرج الفضلات من البلعوم نفسه",[7.8,-.05,1.9],"#8a4b17")];
 // ================= الحركة =================
 const S={who:"hydra",t:-1},M=new THREE.Matrix4(),Qi=new THREE.Quaternion(),SC=new THREE.Vector3(),T=new THREE.Vector3(),U=new THREE.Vector3();
 const steps=(arr,k)=>arr.forEach((l,i)=>l.visible=S.who&&i===k);
 const show=w=>{S.who=w;S.t=-1;H.visible=w==="hydra";P.visible=w==="planaria";[hStep,pStep].forEach(a=>a.forEach(l=>l.visible=false));Object.entries(LBs).forEach(([k,ls])=>ls.forEach(l=>{if(!hStep.includes(l)&&!pStep.includes(l))l.visible=k===w}));
  food.visible=false;hw.count=0;pf.count=0;pw.count=0;aIn.visible=aOut.visible=P_A.visible=P_B.visible=false;phM.scale.set(1,1,1);inM.emissiveIntensity=0;GM.emissiveIntensity=.15;
  if(w==="hydra"){C.minAzimuthAngle=-.7;C.maxAzimuthAngle=.7;focusTo([0,3.2,0],[1.3,4.3,7.4])}else{C.minAzimuthAngle=-Infinity;C.maxAzimuthAngle=Infinity;focusTo([9,.4,.1],[12.4,2.2,4.4])}};
 const focusTo=(t,p)=>{const k0=camera.position.clone(),t0=C.target.clone(),k1=V(p),t1=V(t);let u=0;const f=(tt,dt)=>{if(u>=1)return;u=Math.min(1,u+dt/.9);const e=ease(u);camera.position.lerpVectors(k0,k1,e);C.target.lerpVectors(t0,t1,e);camera.lookAt(C.target)};onFrame(f)};
 onFrame((t,dt)=>{TP.forEach((pv,k)=>pv.rotation.z=Math.sin(t*1.2+k*1.3)*.08);
  if(S.t<0)return;S.t+=dt;const u=S.t;
  if(S.who==="hydra"){
   // ١) ٠–٤ث: الغذاء تمسكه اللوامس ويدخل من الفم إلى التجويف
   if(u<4.2){food.visible=true;hIn.getPointAt(ease(Math.min(1,u/4)),T);food.position.copy(T);aIn.visible=true;steps(hStep,0);if(u>1.2&&u<2.6)TP[0].rotation.z=.25*Math.sin((u-1.2)/1.4*Math.PI)}
   // ٢) ٤–٧ث: يتحلل داخل التجويف، وتمتص الجدران المواد المفيدة
   else if(u<7.2){aIn.visible=false;steps(hStep,1);const k=(u-4.2)/3;food.position.copy(cavW);food.scale.setScalar(Math.max(.05,1-k));inM.emissiveIntensity=.35+.25*Math.sin(u*6);if(Math.random()<.8){nu.pos.copy(cavW).sub(H.position);nu.emit(1)}}
   // ٣) ٧–١١ث: الفضلات تصعد وتخرج من الفم نفسه
   else if(u<11.2){food.visible=false;inM.emissiveIntensity=0;aOut.visible=true;steps(hStep,2);hw.count=18;for(let k=0;k<18;k++){const v=clamp((u-7.2)/3.2-k*.035,0,1);hOut.getPointAt(v,T);T.x+=Math.sin(k*5.1)*.06;T.z+=Math.cos(k*2.7)*.06;SC.setScalar(v>0&&v<1?1:0);M.compose(T,Qi,SC);hw.setMatrixAt(k,M)}hw.instanceMatrix.needsUpdate=true}
   else{S.t=-1;hw.count=0;aOut.visible=false;steps(hStep,-1);ui.result("الهيدرا: فتحة واحدة يدخل منها الغذاء وتخرج منها الفضلات 👌")}
   if(u>4.2&&u-dt<=4.2)ui.result("٢ يُهضم الغذاء داخل التجويف، وتمتص الخلايا المواد المفيدة");if(u>7.2&&u-dt<=7.2){ui.result("٣ تخرج الفضلات من الفم نفسه!");snd("pop")}}
  else{
   const base=wl(V(0,0,.1)),tip=wl(V(0,-.39,.15));
   // ١) ٠–٤ث: البلعوم يمتد إلى الغذاء، والغذاء الأخضر يصعد فيه ثم ينتشر في الفروع
   if(u<4.5){steps(pStep,0);P_A.visible=true;phM.scale.y=1;pf.count=60;for(let k=0;k<60;k++){const v=clamp((u-.4)/3.6-k*.012,0,1);const br=k<36?trunks[k%3]:twigs[k%twigs.length];
     if(v<.4){U.lerpVectors(tip,base,v/.4);T.copy(U)}else{br.getPointAt((v-.4)/.6,U);T.copy(wl(U)).add(V(0,.03,0))}SC.setScalar(v>0?1:0);M.compose(T,Qi,SC);pf.setMatrixAt(k,M)}pf.instanceMatrix.needsUpdate=true;leaf.scale.setScalar(Math.max(.5,1-u/9))}
   // ٢) ٤–٧ث: الهضم في التجويف المتفرّع (يتوهّج والغذاء يتلاشى)
   else if(u<7.5){P_A.visible=false;steps(pStep,1);GM.emissiveIntensity=.4+.3*Math.sin(u*6);const k=1-(u-4.5)/3;for(let j=0;j<60;j++){pf.getMatrixAt(j,M);T.setFromMatrixPosition(M);SC.setScalar(Math.max(0,k));M.compose(T,Qi,SC);pf.setMatrixAt(j,M)}pf.instanceMatrix.needsUpdate=true}
   // ٣) ٧–١١ث: الفضلات تعود إلى الوسط وتخرج من البلعوم نفسه
   else if(u<11.5){pf.count=0;GM.emissiveIntensity=.15;P_B.visible=true;steps(pStep,2);pw.count=30;for(let k=0;k<30;k++){const v=clamp((u-7.5)/3.4-k*.02,0,1),br=trunks[k%3];
     if(v<.5)br.getPointAt(1-v/.5*.95,U),T.copy(wl(U)).add(V(0,.03,0));else if(v<.8)T.lerpVectors(base,tip,(v-.5)/.3);else T.lerpVectors(tip,tip.clone().add(V(-.9,0,1.0)),(v-.8)/.2);
     SC.setScalar(v>0&&v<1?1:0);M.compose(T,Qi,SC);pw.setMatrixAt(k,M)}pw.instanceMatrix.needsUpdate=true}
   else{S.t=-1;pw.count=0;P_B.visible=false;steps(pStep,-1);ui.result("البلاناريا: البلعوم فتحة واحدة للابتلاع وللإخراج 👌")}
   if(u>4.5&&u-dt<=4.5)ui.result("٢ يُهضم الغذاء في التجويف المتفرّع ويصل إلى كل الجسم");if(u>7.5&&u-dt<=7.5){ui.result("٣ تخرج الفضلات من البلعوم نفسه!");snd("pop")}}});
 view(1.3,4.3,7.4,0,3.2,0);show("hydra");
 return {group:g,show,feed:()=>{S.t=0;leaf.scale.setScalar(1);snd("whoosh");ui.result(S.who==="hydra"?"١ تمسك اللوامس الغذاء وتدخله من الفم":"١ يمدّ البلعوم من بطنه إلى الغذاء ويمتصه")}}}

// ---------- الجهاز الإخراجي الحقيقي: الكليتان والحالبان والمثانة، الكبد، الرئتان، الأمعاء الغليظة، الجلد ----------
// kit.realExcretion({}) → {show('all'|'skin'|'kidney'|'lungs'|'colon'|'liver'),ready}
function realExcretion(o={}){bodySky();const A=anatomy(Object.assign({systems:["resp","dig","exc"],labels:false,skinOpacity:.2,opacity:{rul:.55,rml:.55,rll:.55,lul:.55,lll:.55,stomach:.35,jejunum:.3,ileum:.3,duodenum:.3,esophagus:.4,pancreas:.4,gallbladder:.5,colon:.8}},o));
 view(0,11.4,9.4,0,11.1,1);sway();const LB={},FX={},MODES={};
 const sampleCurve=(n,side,bins)=>{const m=A.mesh(n);m.updateMatrixWorld(true);const p=m.geometry.attributes.position,v=new THREE.Vector3(),pts=[];for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);if(side*v.x>0)pts.push(v.clone())}
  pts.sort((a,b)=>b.y-a.y);const out=[];for(let b=0;b<bins;b++){const s=pts.slice(Math.floor(b/bins*pts.length),Math.floor((b+1)/bins*pts.length));if(!s.length)continue;const c=new THREE.Vector3();s.forEach(q=>c.add(q));out.push(c.divideScalar(s.length))}return out};
 const pool=[];const fx=(f)=>{pool.push(f);return f};
 A.ready.then(()=>{const c=n=>A.center(n),b=n=>A.box(n);
  const L=(t,n,dx,dy)=>{const bb=b(n),cc=bb.getCenter(new THREE.Vector3());const s=cc.x<0?-1:1;const l=addLabel(t,(s<0?bb.min.x-.3:bb.max.x+.3)+(dx||0),cc.y+(dy||0),cc.z+.4);LB[n]=l;return l};
  L("الرئتان: CO₂ وبخار الماء","rul",0,.4);L("الكبد: مصفاة","liver",-.1,.1);L("الكليتان: البول","kidneyL",.1,0);L("الأمعاء الغليظة: الفضلات الصلبة","colon",.2,-.5);
  const sk=b("skin");LB.skin=addLabel("الجلد: العرق",sk.max.x-.6,12.2,1.2);
  // البول: من كل كلية عبر الحالب إلى المثانة
  const bl=c("bladder");const uc=[-1,1].map(s=>{const kc=c(s<0?"kidneyR":"kidneyL");const u=sampleCurve("ureter",s,10);return new THREE.CatmullRomCurve3([kc].concat(u).concat([bl]))});
  const uf=new THREE.Color();FX.kidney=uc.map(cv=>fx(movers(cv,{n:16,size:.075,speed:.12,color:"#ffd400",emit:"#ffb000",ei:.7,parent:A.group})));
  // الرئتان: ثاني أكسيد الكربون وبخار الماء يخرجان مع الزفير
  const tr=b("trachea");FX.lungs=[-1,1].map((s,i)=>fx(movers([c(s<0?"rul":"lul"),V(s*.5,tr.min.y-.4,1),V(0,tr.min.y,1),V(0,tr.max.y,1.05),V(0,14.2,1.4),V(0,14.3,2.4),V(s*.3,14.6,3.4)],{n:18,size:.07,speed:.1,color:i?"#9aa3ad":"#cfeeff",emit:i?"#000":"#9fdcff",ei:i?0:.5,parent:A.group})));
  // الكبد: يصفّي الدم ويجهّز الفضلات (بنفسجي ← أصفر) فتذهب إلى الكلية
  const lv=b("liver"),lc=c("liver"),kr=c("kidneyR");const lcol=new THREE.Color();FX.liver=[fx(movers([V(lv.max.x+.2,lc.y+.2,lc.z+.3),V(lc.x+.3,lc.y,lc.z+.35),V(lc.x-.4,lc.y-.05,lc.z+.35),V(lv.min.x+.3,lc.y-.4,lc.z),V(kr.x,kr.y+.2,kr.z+.2)],{n:22,size:.07,speed:.08,parent:A.group,colorFn:u=>lcol.set(u<.45?"#8e3fb0":"#ffd400")}))];
  // الأمعاء الغليظة: الفضلات الصلبة تتحرك إلى المستقيم
  const co=b("colon"),cz=c("colon").z+.2,re=b("rectum"),rc=c("rectum");const cm=A.mesh("colon");cm.updateMatrixWorld(true);const cp=cm.geometry.attributes.position,cv=[];for(let i=0;i<cp.count;i++)cv.push(new THREE.Vector3().fromBufferAttribute(cp,i).applyMatrix4(cm.matrixWorld));
  const ccx=c("colon").x,bins=(f,key,n)=>{const q=cv.filter(f).sort((x,y)=>key(x)-key(y)),o=[];for(let k=0;k<n;k++){const sl=q.slice(Math.floor(k/n*q.length),Math.floor((k+1)/n*q.length));if(!sl.length)continue;const m=new THREE.Vector3();sl.forEach(v=>m.add(v));o.push(m.divideScalar(sl.length).add(V(0,0,.15)))}return o};
  const W=co.max.x-co.min.x,top=co.max.y;
  const cpath=bins(v=>v.x<co.min.x+W*.2,v=>v.y,6).concat(bins(v=>v.y>top-.7&&v.x>co.min.x+W*.25&&v.x<co.max.x-W*.25,v=>v.x,5)).concat(bins(v=>v.x>co.max.x-W*.2,v=>-v.y,6)).concat([V(rc.x,re.max.y-.1,rc.z+.1),V(rc.x,re.min.y,rc.z+.1)]);
  FX.colon=[fx(movers(cpath,{n:24,size:.11,speed:.07,color:"#6b3e18",parent:A.group}))];
  pool.forEach(f=>{f.mesh.material.depthTest=false;f.mesh.material.transparent=true;f.mesh.renderOrder=20;f.mesh.visible=false});
  // العرق: قطرات على سطح الجلد
  const sm=A.mesh("skin");sm.updateMatrixWorld(true);const sp=sm.geometry.attributes.position,sn=sm.geometry.attributes.normal,pv=new THREE.Vector3(),SKV=[];
  for(let i=0;i<sp.count;i+=3){pv.fromBufferAttribute(sp,i).applyMatrix4(sm.matrixWorld);if(pv.y>9.6&&pv.y<14.6)SKV.push([pv.clone(),V(sn.getX(i),sn.getY(i),sn.getZ(i)).transformDirection(sm.matrixWorld)])}
  FX.skinV=SKV;show("all")});
 const sweat=particles({kind:"dust",rate:0,color:["#2fa8ff","#bfe6ff"],size:[.16,.1],life:[1.4,2],speed:[.05,.15],gravity:-.9,spread:.2,max:400});sweat.obj.renderOrder=21;
 const S={m:"all"};
 const DX=["jejunum","ileum","duodenum","stomach","pancreas","esophagus","gallbladder","diaphragm"],HID={all:DX,kidney:DX.concat(["liver","colon","rectum"]),skin:DX,lungs:DX,liver:DX.concat(["colon","rectum"]),colon:DX.concat(["liver"])};
 const show=k=>A.ready.then(()=>{S.m=k;pool.forEach(f=>f.mesh.visible=false);Object.keys(ORG).forEach(n=>{const m=A.mesh(n);if(m&&n!=="skin")m.visible=!(HID[k]||[]).includes(n)});["svc","ivc","partery","pvein","aorta","heart"].forEach(n=>{const m=A.mesh(n);if(m)m.visible=false});Object.keys(ORG).forEach(n=>A.glow(n,false));const sm=A.mesh("skin");sm.material.uniforms.k.value=k==="skin"?.55:.2;
  Object.entries(LB).forEach(([n,l])=>{l.visible=k==="all"||{skin:"skin",kidney:"kidneyL",lungs:"rul",liver:"liver",colon:"colon"}[k]===n});
  const G={kidney:["kidneyR","kidneyL","ureter","bladder"],lungs:["rul","rml","rll","lul","lll","trachea","bronchi"],liver:["liver"],colon:["colon","rectum"]}[k]||[];G.forEach(n=>A.glow(n,true));
  (k==="all"?[]:FX[k]||[]).forEach(f=>f.mesh.visible=true);
  const F={all:[0,11.1,1,9.4],skin:[0,12,1,8.4],kidney:[0,9.9,.2,6.6],lungs:[0,12.9,1,6.6],liver:[-.5,11.2,1,5.4],colon:[0,9.9,1.2,5.8]}[k];if(F)focus(F[0],F[1],F[2],F[3])});
 onFrame(()=>{if(S.m==="skin"&&FX.skinV&&FX.skinV.length)for(let q=0;q<3;q++){const s=FX.skinV[(Math.random()*FX.skinV.length)|0];sweat.pos.copy(s[0]).addScaledVector(s[1],.03);sweat.dir.copy(s[1]);sweat.emit(1)}});
 return {ready:A.ready,anatomy:A,show}}

// @@bloodCycle

// ---------- الدورة الدموية مثل رسمة الكتاب (منظر أمامي): وريد أزرق، شريان أحمر، شعيرات الرئتين، القلب بأربع حجرات ----------
// kit.bloodCycle({}) → {step(n), follow(), setRate(bpm), points}
function bloodCycle(o={}){const g=new THREE.Group();put(g,o.parent);sky("#f3f8ff","#ffffff");hemi.intensity=1.7;sunL.intensity=1.6;C.autoRotate=false;SW.user=true;C.minAzimuthAngle=-.45;C.maxAzimuthAngle=.45;C.minPolarAngle=1.2;C.maxPolarAngle=1.9;
 const BL=col("#2f62e6"),RD=col("#e0242f"),tc=new THREE.Color();const grad=t=>tc.copy(BL).lerp(RD,clamp(t,0,1)).clone();
 const CV={};const mk=(k,pts,r,colorFn)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>V(p)),false,"centripetal");const m=vtube(c,{r,colorFn,parent:g,seg:Math.max(60,pts.length*24),radial:14,rough:.35});m.material.emissive=col("#ffffff");m.material.emissiveIntensity=0;CV[k]={c,m,r};return c};
 const blue=()=>BL,red=()=>RD,NB=col("#5b8bff"),NR=col("#ff4757");
 // القلب: الجانب الأيمن (يسار الشاشة) أزرق، والأيسر أحمر
 const H=new THREE.Group();H.position.set(0,0,0);g.add(H);
 const ch=(p,s,c)=>blob({r:.5,scale:s,color:c,parent:H,pos:p,amp:.05,seed:p[0]*7+p[1]*3});
 const RA=ch([-.5,.38,0],[.85,.8,.75],"#3f6fe8"),RV=ch([-.32,-.38,.05],[.9,1.05,.8],"#2f5bd6"),LA=ch([.5,.4,-.05],[.8,.75,.7],"#e8414a"),LV=ch([.3,-.42,0],[.95,1.15,.85],"#d6202c");
 const sep=new THREE.Mesh(new THREE.BoxGeometry(.06,1.5,.7),mat("#f4d6c8"));sep.position.set(0,-.05,.05);H.add(sep);
 // الأوعية
 const z1=.12,z2=-.12;
 mk("ivc",[[-1.9,-2.4,z2],[-1.6,-1.3,z2],[-1.0,-.2,z2],[-.62,.3,0]],.17,blue);                 // وريد أجوف سفلي (١)
 mk("svc",[[-.75,4.2,z2],[-.75,2.6,z2],[-.72,1.3,z2],[-.6,.62,0]],.17,blue);                   // وريد أجوف علوي (وريد)
 mk("trunk",[[-.25,-.1,.2],[-.15,.9,.25],[0,1.75,.2],[.1,2.15,.1]],.16,blue);                   // الشريان الرئوي (٢)
 mk("pl",[[.1,2.15,.1],[-.9,2.3,.05],[-2.0,2.3,0],[-2.75,2.0,0]],.13,blue);
 mk("pr",[[.1,2.15,.1],[1.0,2.3,.05],[2.0,2.3,0],[2.75,2.0,0]],.13,blue);
 mk("aorta",[[.25,-.1,.3],[.45,1.0,.35],[.55,2.4,.3],[.6,3.2,.25],[.6,4.2,.25]],.18,red);        // الشريان الأبهر (شريان)
 mk("vl",[[-2.75,.6,0],[-2.0,.55,-.05],[-1.0,.95,-.1],[.25,.65,-.15]],.12,red);                 // الأوردة الرئوية (٤)
 mk("vr",[[2.75,.6,0],[2.0,.55,-.05],[1.2,.75,-.1],[.5,.62,-.15]],.12,red);
 // شعيرات الرئتين: من الأزرق (الداخل) إلى الأحمر (الخارج)
 const NETS={l:[],r:[]};[-1,1].forEach(s=>{const cx=s*3.75,k=s<0?"l":"r";const lobe=blob({r:1,scale:[1.15,1.5,.3],color:"#ffe3e7",opacity:.5,parent:g,pos:[cx,1.3,-.3],seed:s+3});
  const top=[[s*2.75,2.0,0],[cx-s*.6,2.45,.02],[cx,2.62,.02],[cx+s*.6,2.4,.02]],bot=[[s*2.75,.6,0],[cx-s*.6,.15,.02],[cx,-.02,.02],[cx+s*.6,.2,.02]];
  for(let i=0;i<10;i++){const u=i/9,x=cx+s*(-.95+u*1.9)*.92,yt=2.55-Math.pow(u-.5,2)*1.2,yb=.1+Math.pow(u-.5,2)*1.1,pts=[[s*2.75,2.0,0],[x,yt,.03]];for(let k=1;k<6;k++){const y=yt+(yb-yt)*k/6;pts.push([x+Math.sin(k*1.7+i)*.12,y,.03+(k%2)*.04])}pts.push([x,yb,.03],[s*2.75,.6,0]);
   const c=new THREE.CatmullRomCurve3(pts.map(p=>V(p)),false,"centripetal");const nm=vtube(c,{r:.042,colorFn:t=>tc.copy(NB).lerp(NR,clamp((t-.12)/.76,0,1)).clone(),parent:g,seg:120,radial:8});nm.material.emissive=col("#ffffff");nm.material.emissiveIntensity=.18;NETS[k].push(c)}
  for(let j=1;j<5;j++){const y=2.3-j*.42,pts=[];for(let i=0;i<=10;i++){const u=i/10;pts.push([cx+s*(-.9+u*1.8)*.9,y+Math.sin(u*9+j)*.06,.06])}vtube(pts,{r:.025,color:"#"+grad((2.4-y)/2.2).getHexString(),parent:g,seg:60,radial:6})}
  });
 // شعيرات الجسم (أعلى): من الأحمر إلى الأزرق
 const BODY=[];for(let i=0;i<7;i++){const x=.6-i*.22;const pts=[[.6,4.2,.25],[.45-i*.05,4.6+i*.05,.2],[x-.2,5.15+Math.sin(i)*.15,.15],[-.6-i*.03,4.6+i*.04,0],[-.75,4.2,z2]];const c=new THREE.CatmullRomCurve3(pts.map(p=>V(p)),false,"centripetal");vtube(c,{r:.04,colorFn:t=>grad(1-(t-.3)/.4),parent:g,seg:70,radial:8});BODY.push(c)}
 const bodyBox=blob({r:1,scale:[1.25,.55,.3],color:"#ffe9c9",opacity:.45,parent:g,pos:[-.05,4.95,-.1],seed:9});
 // خلايا الدم تتحرك
 const cellC=new THREE.Color();const flow=(c,n,fn,sp)=>movers(c,{n,size:.075,shape:"cell",speed:sp||.12,parent:g,colorFn:fn||((u)=>cellC.copy(BL))});
 const F=[flow(CV.ivc.c,9),flow(CV.svc.c,9),flow(CV.trunk.c,6),flow(CV.pl.c,8),flow(CV.pr.c,8),flow(CV.aorta.c,10,()=>cellC.copy(RD)),flow(CV.vl.c,8,()=>cellC.copy(RD)),flow(CV.vr.c,8,()=>cellC.copy(RD))];
 NETS.l.concat(NETS.r).forEach((c,i)=>{if(i%2===0)F.push(flow(c,6,u=>cellC.copy(grad((u-.3)/.4)),.1))});BODY.forEach((c,i)=>{if(i%2===0)F.push(flow(c,5,u=>cellC.copy(grad(1-(u-.3)/.4)),.1))});
 // الأسهم الخضراء والأرقام كما في الكتاب
 const AR=[];const arrowsOn=(curves)=>{AR.forEach(a=>{a.m.visible=false});let j=0;curves.forEach(c=>{for(let k=0;k<5;k++){let a=AR[j];if(!a){a={m:new THREE.Mesh(new THREE.ConeGeometry(.13,.3,14),new THREE.MeshStandardMaterial({color:col("#3fc23a"),emissive:col("#2fa02a"),emissiveIntensity:.6,depthTest:false,transparent:true}))};a.m.renderOrder=30;g.add(a.m);AR.push(a)}a.c=c;a.o=k/5;a.m.visible=true;j++}});};
 const up=V(0,1,0),T=new THREE.Vector3();let arT=0;
 onFrame((t,dt)=>{arT+=dt*.18;AR.forEach(a=>{if(!a.m.visible)return;const u=(a.o+arT)%1;a.c.getPointAt(u,a.m.position);a.m.position.z+=.25;a.c.getTangentAt(u,T);a.m.quaternion.setFromUnitVectors(up,T)})});
 const badge=(n,p,cl)=>{const l=addLabel(n,p[0],p[1],p[2]);l.element.style.cssText+=";background:#ffd400;color:#2b2a26;border:3px solid #3fc23a;width:30px;height:30px;padding:0;display:flex;align-items:center;justify-content:center;font-size:17px;border-radius:50%";return l};
 const B=[badge("١",[-1.5,-1.0,.4]),badge("٢",[-.15,1.55,.6]),badge("٣",[-3.75,1.3,.5]),badge("٣",[3.75,1.3,.5]),badge("٤",[1.45,.7,.4])];
 const LBL=(t,p,c)=>{const l=addLabel(t,p[0],p[1],p[2]);if(c)l.element.style.background=c;return l};
 LBL("وريد",[-1.25,3.55,0],"#2f62e6");LBL("شريان",[1.15,3.55,0],"#e0242f");LBL("شعيرات دموية",[3.75,-.55,0],"#7b4dff");LBL("الرئة",[-3.75,3.05,0],"#ff7a9a");LBL("الرئة",[3.75,3.05,0],"#ff7a9a");LBL("القلب",[1.35,-.75,.5],"#c8343f");LBL("خلايا الجسم",[-.05,5.75,0],"#e8a200");
 const STEPS=[null,
  {keys:["ivc","svc"],txt:"١ يتدفق الدم غير المؤكسج (غير المحمل بالأكسجين) إلى القلب.",f:[-.6,1.4,0,8]},
  {keys:["trunk","pl","pr"],txt:"٢ يُضخ الدم غير المؤكسج إلى الرئتين.",f:[0,1.6,0,8.4]},
  {keys:["nl","nr"],txt:"٣ يتخلص الدم في الرئتين من ثاني أكسيد الكربون ويُحمل بالأكسجين.",f:[0,1.4,0,10.2]},
  {keys:["vl","vr","aorta"],txt:"٤ يتدفق الدم المؤكسج (المحمل بالأكسجين) إلى القلب، ثم يُضخ إلى سائر أجزاء الجسم.",f:[0,2.0,0,9.6]}];
 const curvesOf=k=>k==="nl"?NETS.l:k==="nr"?NETS.r:[CV[k].c];
 const dim=(m,on)=>{m.material.transparent=true;m.material.opacity=on?1:.35;m.material.depthWrite=on;m.material.needsUpdate=true};
 const step=n=>{Object.values(CV).forEach(v=>dim(v.m,!n));B.forEach((b,i)=>b.element.style.transform=(i===n-1||(n===3&&i===3))?"scale(1.35)":"");
  if(!n){arrowsOn([]);return}const S=STEPS[n];S.keys.forEach(k=>{if(CV[k])dim(CV[k].m,true)});arrowsOn([].concat(...S.keys.map(curvesOf)).filter((c,i,a)=>a.length<10||i%2===0));ui.result(S.txt);focus(S.f[0],S.f[1],S.f[2],S.f[3]);snd("pop")};
 // نبض القلب
 const HR={bpm:72,ph:0};onFrame((t,dt)=>{HR.ph+=dt*HR.bpm/60;const f=HR.ph%1,b=1+.07*Math.exp(-Math.pow((f-.12)/.06,2))+.04*Math.exp(-Math.pow((f-.32)/.07,2));H.scale.setScalar(b);F.forEach(m=>m.rate=HR.bpm/72)});
 // تتبّع خلية دم واحدة في الدورة كاملة
 const path=[[CV.svc.c,0],[CV.trunk.c,0],[CV.pl.c,0],[NETS.l[4],0],[CV.vl.c,0],[CV.aorta.c,0],[BODY[3],0]];const segStep=[1,2,2,3,4,4,0];
 const big=new THREE.Mesh(new THREE.SphereGeometry(.17,20,14).scale(1,.5,1),new THREE.MeshStandardMaterial({color:col("#2f62e6"),emissive:col("#ffffff"),emissiveIntensity:.25,depthTest:false,transparent:true}));big.renderOrder=31;big.visible=false;g.add(big);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.24,.3,32),new THREE.MeshBasicMaterial({color:col("#ffd400"),depthTest:false,transparent:true,side:THREE.DoubleSide}));ring.renderOrder=31;big.add(ring);
 const FO={on:false,i:0,u:0};
 onFrame((t,dt)=>{if(!FO.on)return;const [c]=path[FO.i];FO.u+=dt*(FO.i===3||FO.i===6?.35:.45)*HR.bpm/72;if(FO.u>=1){FO.u=0;FO.i++;if(FO.i>=path.length){FO.on=false;big.visible=false;ui.result("أكملت الخلية دورة كاملة! 🎉 القلب ← الرئتان ← القلب ← الجسم ← القلب");step(0);return}const s=segStep[FO.i];if(s)step(s);else ui.result("في خلايا الجسم: يعطي الدم الأكسجين والغذاء، ويأخذ ثاني أكسيد الكربون والفضلات، فيصير غير مؤكسج")}
  path[FO.i][0].getPointAt(FO.u,big.position);big.position.z+=.3;ring.quaternion.copy(camera.quaternion);
  const ox=FO.i===3?FO.u:FO.i===6?1-FO.u:(FO.i>3&&FO.i<6?1:0);big.material.color.copy(grad(FO.i===3?(FO.u-.3)/.4:FO.i===6?1-(FO.u-.3)/.4:ox))});
 view(0,1.9,11.2,0,1.75,0);sway();
 return {group:g,step,setRate:n=>{HR.bpm=+n||72},follow:()=>{FO.on=true;FO.i=0;FO.u=0;big.visible=true;step(1);snd("whoosh")},points:{heart:[0,0,0]}}}

// @@end bloodCycle

// @@openClosed2

// ---------- دوران مفتوح (الجرادة) ودوران مغلق (السمكة): كل حيوان في إطار كامل بخطوات مرقّمة ----------
// kit.openClosed2({}) → {show('open'|'closed')}
function openClosed2(o={}){const g=new THREE.Group();put(g,o.parent);sky("#eef6ff","#ffffff");hemi.intensity=1.7;sunL.intensity=1.7;C.autoRotate=false;SW.user=true;C.minAzimuthAngle=-.5;C.maxAzimuthAngle=.5;C.minPolarAngle=1.15;C.maxPolarAngle=1.95;
 const RED=col("#e0242f"),BLU=col("#2f62e6"),tc=new THREE.Color();
 const LB={open:[],closed:[]};const lab=(k,t,p,c)=>{const l=addLabel(t,p[0]+(k==="closed"?14:0),p[1],p[2]);if(c)l.element.style.background=c;LB[k].push(l);return l};
 const badge=(k,n,p)=>{const l=lab(k,n,p);l.element.style.cssText+=";background:#ffd400;color:#2b2a26;border:3px solid #3fc23a;width:30px;height:30px;padding:0;display:flex;align-items:center;justify-content:center;font-size:17px;border-radius:50%";return l};
 const shell=(p,s,c,op,parent)=>{const m=blob({r:1,scale:s,color:c,opacity:op,parent,pos:p,amp:.03,seed:p[0]*3+1});m.renderOrder=5;return m};
 // ================= الجرادة: دوران مفتوح =================
 const A=new THREE.Group();g.add(A);
 shell([-2.55,.15,0],[.62,.7,.55],"#8cc63f",.55,A);shell([-1.35,.05,-.3],[.85,.72,.3],"#a6d65a",.5,A);shell([1.05,-.1,-.3],[2.15,.68,.3],"#a6d65a",.45,A);
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),mat("#2a1a0a"));eye.position.set(-2.75,.35,.45);A.add(eye);
 vtube([[-2.9,.6,.2],[-3.4,1.6,.3],[-3.9,2.3,.3]],{r:.03,color:"#6a9a2a",parent:A});vtube([[-2.85,.6,-.1],[-3.2,1.7,-.2],[-3.5,2.4,-.2]],{r:.03,color:"#6a9a2a",parent:A});
 [[-1.6,-1],[-1.1,-1],[-.4,-1]].forEach(([x],i)=>vtube([[x,-.55,.35],[x-.25+i*.1,-1.25,.5],[x-.5+i*.2,-1.9,.55]],{r:.05,color:"#7aa83a",parent:A}));
 vtube([[-.3,-.45,-.45],[.9,.35,-.6],[1.9,-.9,-.6],[2.2,-1.9,-.6]],{r:.06,color:"#7aa83a",parent:A});
 // الجيوب: الدم يملأ تجويف الجسم ويغمر الأعضاء
 const sinus=[shell([-1.35,-.05,-.2],[.72,.55,.12],"#ffb3b9",.55,A),shell([1.05,-.2,-.2],[2.0,.5,.12],"#ffb3b9",.55,A)];
 vtube([[-2.6,0,0],[-1.4,-.15,0],[0,-.25,0],[1.5,-.3,0],[3.05,-.25,0]],{r:.17,color:"#c98b3a",parent:A});   // القناة الهضمية
 shell([.3,-.45,.15],[.45,.25,.25],"#e0c060",.9,A);shell([1.7,-.5,-.1],[.5,.22,.25],"#e0c060",.9,A);
 // القلب الأنبوبي على الظهر + فتحاته (ostia)
 const heartC=new THREE.CatmullRomCurve3([[3.0,.42,0],[2.0,.5,0],[1.0,.52,0],[0,.48,0],[-1.2,.5,0],[-2.25,.42,0]].map(p=>V(p)));
 const heartM=vtube(heartC,{r:t=>t<.55?.12:.085,color:"#d42a35",parent:A,seg:160});const ostia=[];[2.4,1.7,1.0,.3].forEach(x=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.07,.025,8,16),mat("#5a0a10"));r.position.set(x,.52,.11);A.add(r);ostia.push(x)});
 // الدم: داخل القلب ← يخرج من الطرف المفتوح ← يغمر الأعضاء ← يعود من الفتحات
 const AP=[];for(let k=0;k<26;k++){const ox=ostia[k%4],y=-.05-Math.random()*.55,z=(Math.random()-.5)*.7;
  AP.push(new THREE.CatmullRomCurve3([V(ox,.5,0),V(Math.min(ox,1.0),.52,0),V(-1.2,.5,0),V(-2.25,.42,0),V(-2.6,.15,z*.5),V(-2.2,y+.05,z),V(-1.2,y,z),V(0,y-.05,z),V((ox+.4),y+.05,z),V(ox+.15,.3,z*.3),V(ox,.5,0)],false,"centripetal"))}
 const pc=new THREE.Color();const AF=AP.map((c,i)=>movers(c,{n:3,size:.075,speed:.07+Math.random()*.03,parent:A,colorFn:()=>pc.copy(RED),even:false}));
 const aSteps=[{n:"١",p:[-1.1,.98,.3],t:"١ القلب أنبوب على الظهر يضخ الدم إلى الأمام"},{n:"٢",p:[-2.4,-.75,.6],t:"٢ يخرج الدم من نهاية الأنبوب مباشرة إلى الأنسجة"},{n:"٣",p:[1.0,-1.05,.6],t:"٣ يتجمع الدم في الجيوب ويغمر الأعضاء مباشرة"},{n:"٤",p:[1.9,.98,.3],t:"٤ يعود الدم إلى القلب من فتحات صغيرة"}];
 aSteps.forEach(s=>badge("open",s.n,s.p));
 lab("open","دوران مفتوح — الجرادة",[0,2.35,0],"#5a9a1a");lab("open","القلب الأنبوبي",[.4,1.45,.3],"#d42a35");lab("open","الجيوب: الدم خارج الأوعية",[-.6,-1.5,.6],"#ff6b81");lab("open","فتحات يعود منها الدم",[3.4,.95,.3],"#7b4dff");
 // ================= السمكة: دوران مغلق (x=14) =================
 const B=new THREE.Group();B.position.x=14;g.add(B);
 const fb=shell([0,0,-.3],[2.6,1.15,.22],"#ffc58f",.6,B);
 const tail=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(2.4,0),new THREE.Vector2(3.6,1.1),new THREE.Vector2(3.35,0),new THREE.Vector2(3.6,-1.1)])),new THREE.MeshStandardMaterial({color:col("#ff9a3c"),transparent:true,opacity:.45,side:THREE.DoubleSide}));B.add(tail);
 const fin=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-.6,1.0),new THREE.Vector2(.4,1.7),new THREE.Vector2(1.1,1.0)])),tail.material);B.add(fin);
 const feye=new THREE.Mesh(new THREE.SphereGeometry(.15,16,12),mat("#111"));feye.position.set(-2.05,.35,.45);B.add(feye);
 const heartB=blob({r:.28,scale:[1.2,.9,.8],color:"#c8343f",parent:B,pos:[-1.25,-.62,0]});
 // الخياشيم
 const GL=[];for(let i=0;i<4;i++){const x=-1.75+i*.17;GL.push(vtube([[x,-.7,.15],[x-.18,-.1,.2],[x-.12,.45,.2],[x+.02,.75,.15]],{r:.06,colorFn:t=>tc.copy(BLU).lerp(RED,t).clone(),parent:B,radial:10}));for(let k=0;k<6;k++){const y=-.55+k*.22;vtube([[x-.1,y,.22],[x-.32,y+.04,.24]],{r:.025,color:"#ff5a6a",parent:B,radial:6})}}
 const vc=(pts,colorFn,r)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>V(p)),false,"centripetal");vtube(c,{r:r||.08,colorFn,parent:B,radial:12,seg:120});return c};
 const fc=new THREE.Color();
 const c1=vc([[-1.05,-.62,.05],[-1.35,-.82,.1],[-1.65,-.8,.15],[-1.75,-.7,.15]],()=>BLU);                   // القلب ← الخياشيم
 const c2=vc([[-1.3,.78,.15],[-.6,.85,.1],[.6,.82,.1],[1.7,.6,.1],[2.1,.3,.1]],()=>RED);                    // الخياشيم ← الجسم (شريان)
 const nets=[];for(let i=0;i<6;i++){const y=.3-i*.13;nets.push(vc([[2.1,.3,.1],[2.25+(i%2)*.1,y+.1,.12],[2.5,y,.14],[2.3,y-.12,.12],[2.1,-.45,.1]],()=>fc.copy(RED).lerp(BLU,.5),.035))}
 const c3=vc([[2.1,-.45,.1],[1.2,-.72,.08],[0,-.8,.05],[-.85,-.65,.05],[-1.05,-.62,.05]],()=>BLU);          // الجسم ← القلب (وريد)
 const gillC=new THREE.CatmullRomCurve3([V(-1.75,-.7,.15),V(-1.9,-.1,.2),V(-1.6,.6,.2),V(-1.3,.78,.15)]);
 const flowB=(c,n,fn,sp)=>movers(c,{n,size:.075,shape:"cell",speed:sp||.12,parent:B,colorFn:fn});
 flowB(c1,5,()=>fc.copy(BLU));flowB(gillC,5,u=>fc.copy(BLU).lerp(RED,u),.1);flowB(c2,12,()=>fc.copy(RED),.08);nets.forEach((c,i)=>{if(i%2===0)flowB(c,3,u=>fc.copy(RED).lerp(BLU,u),.12)});flowB(c3,12,()=>fc.copy(BLU),.08);
 [[-1.3,-1.25,.4,"١"],[-2.35,.2,.5,"٢"],[2.3,.85,.4,"٣"],[.2,-1.25,.4,"٤"]].forEach(b=>badge("closed",b[3],[b[0],b[1],b[2]]));
 lab("closed","دوران مغلق — السمكة",[0,2.2,0],"#2f62e6");lab("closed","القلب",[-.95,-1.55,.4],"#c8343f");lab("closed","الخياشيم: يأخذ الدم الأكسجين",[-2.6,1.3,.3],"#ff5a6a");lab("closed","خلايا الجسم",[2.6,-1.1,.3],"#e8a200");lab("closed","الدم داخل الأوعية دائماً",[.4,1.45,.3],"#14a06f");
 const bSteps=["١ يضخ القلب الدم إلى الخياشيم","٢ في الخياشيم يأخذ الدم الأكسجين","٣ يذهب الدم داخل الأوعية إلى خلايا الجسم","٤ يعود الدم إلى القلب داخل الأوعية"];
 // نبض
 onFrame(t=>{const b=1+.08*Math.exp(-Math.pow(((t*1.1)%1-.1)/.07,2));heartB.scale.set(1.2*b,.9*b,.8*b);heartM.scale.set(1,1+.12*Math.exp(-Math.pow(((t*1.1)%1-.1)/.07,2)),1)});
 const show=w=>{A.visible=w==="open";B.visible=w==="closed";Object.entries(LB).forEach(([k,ls])=>ls.forEach(l=>l.visible=k===w));
  const T=w==="open"?[.1,.1,0]:[14.1,.05,0];const P=w==="open"?[.5,.8,7.9]:[14.5,.6,7.3];const k0=camera.position.clone(),t0=C.target.clone();let u=0;const f=(tt,dt)=>{if(u>=1)return;u=Math.min(1,u+dt/.8);const e=ease(u);camera.position.lerpVectors(k0,V(P),e);C.target.lerpVectors(t0,V(T),e);camera.lookAt(C.target)};onFrame(f);
  ui.result(w==="open"?"المفتوح: الدم يخرج من الأنبوب ويغمر الأعضاء مباشرة ثم يعود إلى القلب":"المغلق: الدم يتحرك داخل الأوعية دائماً: القلب ← الخياشيم ← الجسم ← القلب")};
 let si=-1;const next=()=>{const w=A.visible?"open":"closed";si=(si+1)%4;ui.result(w==="open"?aSteps[si].t:bSteps[si]);LB[w].forEach(l=>{const t=l.element.textContent;if(/^[١٢٣٤]$/.test(t))l.element.style.transform=t===["١","٢","٣","٤"][si]?"scale(1.45)":""});snd("pop")};
 view(.5,.8,7.9,.1,.1,0);show("open");
 return {group:g,show,next}}

// @@end openClosed2

// @@paperTest2

// ---------- تجربة امتصاص الورق للماء (أوضح): مخابير مدرّجة بأرقام، أشرطة بنقوش واضحة، بلل يصعد، قراءة قبل/بعد وترتيب ----------
// kit.paperTest2({}) → {dip(),reset()}
function paperTest2(o={}){const g=new THREE.Group();put(g,o.parent);sky("#cfe3f5","#f4f8ff");hemi.intensity=1.6;sunL.intensity=2;C.autoRotate=false;SW.user=true;C.minAzimuthAngle=-.5;C.maxAzimuthAngle=.5;
 const AN=n=>String(n).replace(/\d/g,d=>"٠١٢٣٤٥٦٧٨٩"[d]);
 const tb=new THREE.Mesh(new THREE.BoxGeometry(10,.3,3.4),mat("#c99a5c",{roughness:.8}));tb.position.y=-.15;g.add(tb);
 const H=3.0,R=.52,ML=v=>.1+v/100*H;   // ١٠٠ مل = ارتفاع المخبار
 const tex=(draw)=>canvasTex(128,512,(c,w,h)=>{draw(c,w,h)});
 const PAT={
  fiber:tex((c,w,h)=>{c.fillStyle="#ffffff";c.fillRect(0,0,w,h);c.strokeStyle="#9fc3e6";c.lineWidth=3;for(let i=-h;i<h;i+=26){c.beginPath();c.moveTo(0,i);c.lineTo(w,i+w);c.stroke();c.beginPath();c.moveTo(w,i);c.lineTo(0,i+w);c.stroke()}c.fillStyle="#cfe2f6";for(let y=8;y<h;y+=26)for(let x=6;x<w;x+=26){c.beginPath();c.arc(x+13,y+5,4,0,7);c.fill()}}),
  towel:tex((c,w,h)=>{c.fillStyle="#fbfaf5";c.fillRect(0,0,w,h);c.fillStyle="#d9d4c4";for(let y=6;y<h;y+=14)for(let x=(y/14%2)*7+4;x<w;x+=14){c.beginPath();c.arc(x,y,2.4,0,7);c.fill()}}),
  wrap:tex((c,w,h)=>{c.fillStyle="#e2343f";c.fillRect(0,0,w,h);c.fillStyle="#ffd84a";for(let y=20;y<h;y+=46)for(let x=(y/46%2)*30+18;x<w;x+=60){c.save();c.translate(x,y);c.beginPath();for(let k=0;k<10;k++){const r=k%2?6:14,a=k*Math.PI/5-Math.PI/2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.fill();c.restore()}}),
  print:tex((c,w,h)=>{c.fillStyle="#ffffff";c.fillRect(0,0,w,h);c.strokeStyle="#b9cbe8";c.lineWidth=2;for(let y=24;y<h;y+=22){c.beginPath();c.moveTo(8,y);c.lineTo(w-8,y);c.stroke()}c.strokeStyle="#f0a0a0";c.beginPath();c.moveTo(w-22,0);c.lineTo(w-22,h);c.stroke()})};
 const scaleTex=canvasTex(96,512,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle="rgba(255,255,255,.85)";c.fillRect(0,0,w,h);c.strokeStyle="#1d2b44";c.fillStyle="#1d2b44";c.font="bold 30px Tahoma";c.textAlign="right";
  for(let v=0;v<=100;v+=5){const y=h-(v/100)*(h-24)-12;c.lineWidth=v%10?2:4;c.beginPath();c.moveTo(0,y);c.lineTo(v%10?22:38,y);c.stroke();if(v%20===0)c.fillText(AN(v),w-4,y+10)}});
 const P=[{n:"مناشف من الألياف",k:"fiber",a:22,rise:1.0},{n:"مناشف عادية",k:"towel",a:14,rise:.7},{n:"ورق طباعة",k:"print",a:6,rise:.35},{n:"ورق تجليد",k:"wrap",a:1,rise:.05}];
 const items=P.map((p,i)=>{const x=3.45-i*2.3;const it={p,x,lvl:50};
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(R,R,H+.2,40,1,true),new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.18,roughness:.05,side:THREE.DoubleSide,depthWrite:false}));glass.position.set(x,.1+(H+.2)/2,0);glass.renderOrder=9;g.add(glass);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,.03,8,40),mat("#9fb3c8"));rim.rotation.x=Math.PI/2;rim.position.set(x,H+.3,0);g.add(rim);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(R+.25,R+.3,.1,40),mat("#5b6b80"));base.position.set(x,.05,0);g.add(base);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(.42,H+.05),new THREE.MeshBasicMaterial({map:scaleTex,transparent:true}));sc.position.set(x-R-.24,.1+H/2,.05);g.add(sc);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(R-.03,R-.03,1,40),new THREE.MeshPhysicalMaterial({color:col("#1f74e0"),transparent:true,opacity:.88,roughness:.15}));w.geometry.translate(0,.5,0);w.position.set(x,.1,0);g.add(w);it.w=w;
  const top=new THREE.Mesh(new THREE.CircleGeometry(R-.03,40),new THREE.MeshBasicMaterial({color:col("#8cc8ff"),transparent:true,opacity:.9}));top.rotation.x=-Math.PI/2;g.add(top);it.top=top;
  const S=new THREE.Group();g.add(S);it.S=S;const sw=.5,sh=2.6;
  const st=new THREE.Mesh(new THREE.BoxGeometry(sw,sh,.04),[mat("#ddd"),mat("#ddd"),mat("#ddd"),mat("#ddd"),new THREE.MeshStandardMaterial({map:PAT[p.k],roughness:.9}),new THREE.MeshStandardMaterial({map:PAT[p.k],roughness:.9})]);st.position.y=sh/2;S.add(st);
  const ed=new THREE.LineSegments(new THREE.EdgesGeometry(st.geometry),new THREE.LineBasicMaterial({color:0x33415a}));ed.position.copy(st.position);S.add(ed);
  const wet=new THREE.Mesh(new THREE.PlaneGeometry(sw,1),new THREE.MeshBasicMaterial({color:col("#1f6fd6"),transparent:true,opacity:.45}));wet.geometry.translate(0,.5,0);wet.position.z=.025;wet.scale.y=.001;S.add(wet);it.wet=wet;
  const clip=new THREE.Mesh(new THREE.BoxGeometry(.6,.14,.12),mat("#2f3b52"));clip.position.y=sh+.02;S.add(clip);
  const nm=addLabel(p.n,x,-.55,.9);it.nm=nm;const rd=addLabel("",x,H+.55,.6);rd.element.style.background="#1d2b44";it.rd=rd;const res=addLabel("",x,-1.0,.9);res.visible=false;it.res=res;
  return it});
 const S={t:-1};const UP=H+1.25,DOWN=.35;
 const setLvl=it=>{const y=ML(it.lvl);it.w.scale.y=y-.1;it.top.position.set(it.x,y,0);it.rd.element.textContent=AN(Math.round(it.lvl))+" مل"};
 const reset=()=>{S.t=-1;items.forEach(it=>{it.lvl=50;setLvl(it);it.S.position.set(it.x,UP,0);it.wet.scale.y=.001;it.res.visible=false});ui.result("الماء في كل مخبار ٥٠ مل. توقّع: أي ورقة تمتص أكثر؟ ثم اضغط «اغمس الأشرطة»")};
 const dip=()=>{if(S.t>=0&&S.t<9)return;reset();S.t=0;snd("blub");ui.result("نغمس الأشرطة في الماء دقيقة كاملة…")};
 onFrame((t,dt)=>{if(S.t<0||S.t>50)return;S.t+=dt;const T=S.t;
  items.forEach(it=>{const down=ease(clamp(T/1.3,0,1)),soak=ease(clamp((T-1.3)/3.6,0,1)),up=ease(clamp((T-5.3)/1.3,0,1));
   it.S.position.y=UP-(UP-DOWN)*down+(UP-DOWN)*up;it.lvl=50-it.p.a*soak;setLvl(it);
   const sub=Math.max(0,ML(50)-DOWN);it.wet.scale.y=Math.max(.001,(sub+it.p.rise)*clamp((T-1.0)/3.8,0,1))});
  if(T>2.2&&T-dt<=2.2)ui.result("راقب: الماء يصعد في الشريط (الجزء الأزرق) ومستوى الماء في المخبار ينزل");
  if(T>6.8){S.t=99;const rank=items.slice().sort((a,b)=>b.p.a-a.p.a);items.forEach(it=>{const r=rank.indexOf(it)+1;it.res.element.textContent=(r===1?"🏆 ":"")+"امتص "+AN(it.p.a)+" مل";it.res.element.style.background=r===1?"#16a34a":r===2?"#2f8cff":r===3?"#e8a200":"#9aa3ad";it.res.visible=true});
   snd("ding");ui.result("مناشف الألياف امتصت أكبر كمية (٥٠ ← ٢٨ مل) — مثل الأمعاء الغليظة التي تمتص الماء من الفضلات")}});
 view(0,2.8,11.2,0,2.5,0);reset();
 return {dip,reset}}

// @@end paperTest2

const kit={sound:(n,a,b)=>snd(n,a,b),THREE,particles,ground,strata,tree,palm,house,tower,cloud,rain,sun,water,flow,arrow,planet,volcano,earthquake,earthLayers,anatomy,realLungs,realDigestive,realBody,realExcretion,sponge,oneOpening,paperTest2,openClosed2,bloodCycle,fatArrow,glb,bodyShell,digestive,lungs,heart,circulation,alveoli,worm,openClosed,thermo,paperTest,bodySystems,vtube,blob,movers,view,shake,focus,sky,mat,glowMat,canvasTex,strataTex,noise,fbm,label:(t,p)=>addLabel(t,p),shadowy,controls:C,lights:{hemi,sun:sunL}};

function rs(){const w=innerWidth,h=innerHeight;R.setSize(w,h);comp.setSize(w,h);LR.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();PU.value=h*PR/(2*Math.tan(camera.fov*D2R/2))}
addEventListener("resize",rs);rs();
addEventListener("message",e=>{const d=e.data||{};if(d.play){C.autoRotate=false;const b=U.querySelector(".bt");if(b)b.click()}});
try{new Function("THREE","scene","camera","addLabel","onFrame","ui","kit",JSON.parse(document.getElementById("c").textContent))(THREE,scene,camera,addLabel,onFrame,ui,kit);shadowy(scene)}catch(err){document.getElementById("e").style.display="flex";console.error(err)}
const ck=new THREE.Clock();let t=0;const so=new THREE.Vector3();
R.setAnimationLoop(()=>{const dt=Math.min(.05,ck.getDelta());t+=dt;for(let i=0;i<fr.length;i++){try{fr[i](t,dt)}catch(e){}}C.update();
 so.set(0,0,0);if(SH.t>0){SH.t-=dt;const a=SH.a*Math.min(1,SH.t/.5);so.set((Math.random()-.5)*a,(Math.random()-.5)*a,(Math.random()-.5)*a);camera.position.add(so)}
 comp.render();LR.render(scene,camera);camera.position.sub(so)});
