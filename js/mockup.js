// LOGO MOCKUP TOOL
// Composites an uploaded logo onto product photos (images/mockups/) or
// canvas-drawn products. Every product defines a print area; the logo is
// fitted inside it (aspect ratio preserved), clipped to it, wrapped around
// cylinders (mugs, flasks, bottles) and shaded by the product's own lighting
// so it reads as printed rather than pasted on.
//
// Adding a product: add an entry to PRODUCTS. Photo products give `photo` and
// an `area` as fractions [x,y,w,h] of the photo; drawn products give `colors`,
// a `draw` function (see PRODUCT_DRAWERS) and an `area` in canvas px (600x480).
// Optional: `cyl` [x0,x1] cylinder bounds (same units as area) for wrap,
// `shape:'circle'`, `rot` base logo rotation in degrees, `style` default print
// style, `presets` [[label, fx, fy, scale%]] placements inside the area.
(function(){
const cv=document.getElementById('mkpCanvas');
if(!cv)return;
const W=600,H=480,S=2;
cv.width=W*S;cv.height=H*S;
const ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);

const PRODUCTS=[
  {name:'Mug',emoji:'☕',cat:'drinkware',photo:'images/mockups/mug.jpg',area:[.40,.28,.24,.44],cyl:[.37,.67],curveY:.06,presets:[['Centre',.5,.5,85],['Large',.5,.5,120],['Small',.5,.45,50]]},
  {name:'Flask',emoji:'🧴',cat:'drinkware',photo:'images/mockups/flask.jpg',area:[.462,.40,.05,.36],cyl:[.455,.52],style:'engrave',presets:[['Centre',.5,.5,90],['Upper',.5,.25,70],['Vertical',.5,.5,140,-90]]},
  {name:'Sports Bottle',emoji:'🍶',cat:'drinkware',colors:['#ffffff','#1f2937','#6B2D8B','#2563eb','#dc2626','#16a34a'],area:[252,195,96,160],cyl:[240,360],curveY:.05,presets:[['Centre',.5,.45,85],['Vertical',.5,.5,150,-90]]},
  {name:'T-Shirt',emoji:'👕',cat:'apparel',photo:'images/mockups/tshirt.jpg',area:[.41,.50,.21,.24],presets:[['Centre chest',.5,.28,70],['Left chest',.76,.14,28],['Full front',.5,.45,100]]},
  {name:'Hoodie',emoji:'🧥',cat:'apparel',colors:['#1f2937','#ffffff','#9ca3af','#6B2D8B','#1e3a8a','#7f1d1d'],area:[222,215,116,100],presets:[['Centre chest',.5,.45,80],['Left chest',.8,.2,30],['Full front',.5,.5,105]]},
  {name:'Cap',emoji:'🧢',cat:'apparel',photo:'images/mockups/cap.jpg',area:[.33,.34,.25,.14],presets:[['Front',.5,.5,85],['Small front',.5,.55,50]]},
  {name:'Tote',emoji:'👜',cat:'bags',photo:'images/mockups/tote.jpg',area:[.36,.42,.28,.36],presets:[['Centre',.5,.45,80],['Full',.5,.5,105],['Corner',.82,.88,25]]},
  {name:'Backpack',emoji:'🎒',cat:'bags',colors:['#1f2937','#6B2D8B','#1e3a8a','#7f1d1d','#374151'],area:[232,262,136,104],presets:[['Pocket',.5,.5,80],['Small patch',.5,.4,40]]},
  {name:'Paper Bag',emoji:'🛍️',cat:'packaging',colors:['#c8a46e','#ffffff','#1a1a2e','#6B2D8B','#D4006A'],area:[205,215,190,165],presets:[['Centre',.5,.45,80],['Full',.5,.5,105],['Bottom',.5,.85,35]]},
  {name:'Gift Box',emoji:'🎁',cat:'packaging',colors:['#1a1a2e','#ffffff','#6B2D8B','#D4006A','#c8a46e','#0f766e'],area:[188,250,224,124],style:'foil',presets:[['Centre',.5,.5,75],['Corner',.85,.8,30]]},
  {name:'Notebook',emoji:'📓',cat:'stationery',photo:'images/mockups/notebook.jpg',area:[.36,.28,.34,.32],style:'black',presets:[['Centre',.5,.5,70],['Corner',.85,.82,28]]},
  {name:'Diary',emoji:'📔',cat:'stationery',colors:['#1f2937','#6B2D8B','#7f1d1d','#1e3a8a','#c8a46e','#0f766e'],area:[222,140,140,200],style:'foil',presets:[['Centre',.5,.45,75],['Bottom corner',.82,.9,28],['Top',.5,.18,50]]},
  {name:'Pen',emoji:'🖊️',cat:'stationery',photo:'images/mockups/pen.jpg',area:[.488,.28,.03,.28],rot:-90,presets:[['Barrel',.5,.5,90],['Small',.5,.35,55]]},
  {name:'Power Bank',emoji:'🔋',cat:'tech',colors:['#1a1a2e','#ffffff','#374151','#6B2D8B','#2563eb','#dc2626'],area:[245,165,150,170],presets:[['Centre',.5,.5,75],['Small',.5,.5,45]]},
  {name:'Mouse Pad',emoji:'🖱️',cat:'tech',colors:['#1f2937','#ffffff','#6B2D8B','#2563eb','#0f766e'],area:[140,170,320,180],presets:[['Centre',.5,.5,60],['Corner',.86,.82,22],['Full',.5,.5,100]]},
  {name:'ID Card & Lanyard',emoji:'🪪',cat:'accessories',colors:['#6B2D8B','#D4006A','#1f2937','#2563eb','#16a34a'],area:[232,272,136,110],presets:[['Card',.5,.45,75],['Header',.5,.15,40]]},
  {name:'Keychain',emoji:'🔑',cat:'accessories',colors:['#c0c0c0','#d4af37','#222222','#b76e79','#6B2D8B'],area:[233,222,134,165],style:'engrave',presets:[['Centre',.5,.5,80],['Small',.5,.55,50]]},
  {name:'Coaster',emoji:'🟤',cat:'accessories',colors:['#c8a46e','#5c3a1e','#ffffff','#1f2937','#6B2D8B'],area:[170,105,260,260],shape:'circle',style:'engrave',presets:[['Centre',.5,.5,62],['Full',.5,.5,90]]},
  {name:'Button Badge',emoji:'📍',cat:'accessories',colors:['#ffffff','#6B2D8B','#D4006A','#1f2937','#f59e0b'],area:[165,105,270,270],shape:'circle',presets:[['Centre',.5,.5,68],['Full',.5,.5,95]]},
];
const CATS=[['all','All'],['drinkware','Drinkware'],['apparel','Apparel'],['bags','Bags'],['stationery','Stationery'],['tech','Tech'],['packaging','Packaging'],['accessories','Accessories']];
const STYLES=[['full','Full colour'],['white','White ink'],['black','Black ink'],['foil','Gold foil'],['engrave','Engraved']];

// ---------- colour + drawing helpers ----------
function rgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function lx(h,p){try{const f=p/100;return'#'+rgb(h).map(v=>Math.min(255,Math.round(v+(255-v)*f)).toString(16).padStart(2,'0')).join('');}catch(e){return h;}}
function dk(h,p){try{const f=p/100;return'#'+rgb(h).map(v=>Math.max(0,Math.round(v*(1-f))).toString(16).padStart(2,'0')).join('');}catch(e){return h;}}
function lum(h){const[r,g,b]=rgb(h);return(.299*r+.587*g+.114*b)/255;}
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function lin(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,col])=>g.addColorStop(o,col));return g;}
function groundShadow(c,cx,by,rx,ry){c.save();const g=c.createRadialGradient(cx,by,0,cx,by,rx);g.addColorStop(0,'rgba(20,10,30,.32)');g.addColorStop(.7,'rgba(20,10,30,.14)');g.addColorStop(1,'rgba(20,10,30,0)');c.fillStyle=g;c.beginPath();c.ellipse(cx,by,rx,ry,0,0,Math.PI*2);c.fill();c.restore();}
function gloss(c,px,py,pw,ph,r){c.save();c.fillStyle=lin(c,px,py,px+pw*.6,py+ph,[[0,'rgba(255,255,255,.28)'],[.4,'rgba(255,255,255,.05)'],[.7,'rgba(255,255,255,0)']]);rr(c,px,py,pw,ph,r||10);c.fill();c.restore();}
// Deterministic speckle for cork/kraft textures, so redraws don't flicker.
function speckle(c,x,y,w,h,n,col,seed){let s=seed||7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;c.fillStyle=col;for(let i=0;i<n;i++){c.globalAlpha=.08+rnd()*.18;c.beginPath();c.arc(x+rnd()*w,y+rnd()*h,.6+rnd()*1.6,0,Math.PI*2);c.fill();}c.globalAlpha=1;}

const GROUND_SHADOWS={
  'Sports Bottle':[300,438,90,14],
  'Hoodie':[280,410,150,16],
  'Backpack':[300,425,140,16],
  'Paper Bag':[310,418,150,16],
  'Gift Box':[320,400,190,20],
  'Diary':[310,404,125,14],
  'Power Bank':[300,362,150,18],
  'Mouse Pad':[300,385,230,16],
  'Coaster':[300,402,160,16],
  'Button Badge':[300,392,140,14],
};
const PRODUCT_DRAWERS={
  'Sports Bottle':(c,k)=>{
    k.fillStyle=lin(k,240,0,360,0,[[0,dk(c,18)],[.3,lx(c,22)],[.55,c],[1,dk(c,28)]]);rr(k,240,130,120,300,30);k.fill();
    k.fillStyle='#2b2b38';rr(k,250,88,100,50,12);k.fill();
    k.strokeStyle='#2b2b38';k.lineWidth=9;k.beginPath();k.arc(300,82,26,Math.PI,0);k.stroke();
    k.fillStyle='rgba(0,0,0,.08)';[372,386,400].forEach(y=>{k.fillRect(240,y,120,4);});
    gloss(k,252,140,30,280,14);
  },
  'Hoodie':(c,k)=>{
    k.fillStyle=dk(c,18);k.beginPath();k.moveTo(212,156);k.bezierCurveTo(200,84,360,84,348,156);k.quadraticCurveTo(280,190,212,156);k.fill();
    k.fillStyle=lin(k,150,150,440,400,[[0,lx(c,10)],[.5,c],[1,dk(c,14)]]);
    k.beginPath();k.moveTo(208,150);k.lineTo(150,182);k.lineTo(116,330);k.lineTo(150,342);k.lineTo(186,238);k.lineTo(190,400);k.lineTo(370,400);k.lineTo(374,238);k.lineTo(410,342);k.lineTo(444,330);k.lineTo(410,182);k.lineTo(352,150);k.quadraticCurveTo(280,178,208,150);k.closePath();k.fill();
    k.fillStyle=dk(c,32);k.beginPath();k.moveTo(244,160);k.quadraticCurveTo(280,214,316,160);k.quadraticCurveTo(280,176,244,160);k.fill();
    k.strokeStyle=lx(c,55);k.lineWidth=3;k.lineCap='round';k.beginPath();k.moveTo(266,186);k.lineTo(263,236);k.moveTo(294,186);k.lineTo(297,236);k.stroke();
    k.strokeStyle=dk(c,20);k.lineWidth=2;k.fillStyle=dk(c,5);k.beginPath();k.moveTo(222,326);k.lineTo(338,326);k.lineTo(354,382);k.lineTo(206,382);k.closePath();k.fill();k.stroke();
    k.fillStyle=dk(c,14);k.fillRect(190,388,180,12);k.save();k.translate(116,330);k.rotate(.23);k.fillRect(0,0,35,11);k.restore();k.save();k.translate(410,342);k.rotate(-.23);k.fillRect(0,-11,35,11);k.restore();
  },
  'Backpack':(c,k)=>{
    k.strokeStyle=dk(c,30);k.lineWidth=10;k.beginPath();k.arc(300,115,30,Math.PI,0);k.stroke();
    k.fillStyle=dk(c,25);rr(k,176,150,24,230,12);k.fill();rr(k,400,150,24,230,12);k.fill();
    k.fillStyle=lin(k,190,110,410,410,[[0,lx(c,14)],[.5,c],[1,dk(c,18)]]);rr(k,190,110,220,305,64);k.fill();
    k.fillStyle=dk(c,10);rr(k,215,248,170,138,30);k.fill();
    k.strokeStyle=dk(c,40);k.lineWidth=3;k.beginPath();k.moveTo(228,256);k.quadraticCurveTo(300,244,372,256);k.stroke();
    k.fillStyle='#bfbfbf';rr(k,360,250,8,18,3);k.fill();
    gloss(k,205,125,70,110,40);
  },
  'Paper Bag':(c,k)=>{
    k.strokeStyle=c==='#ffffff'?'#d6d0c4':dk(c,35);k.lineWidth=6;k.beginPath();k.moveTo(240,174);k.bezierCurveTo(240,82,360,82,360,174);k.stroke();
    k.fillStyle=dk(c,22);k.beginPath();k.moveTo(415,170);k.lineTo(452,186);k.lineTo(452,398);k.lineTo(415,410);k.closePath();k.fill();
    k.fillStyle=lin(k,185,170,415,410,[[0,lx(c,8)],[1,dk(c,8)]]);k.fillRect(185,170,230,240);
    if(c==='#c8a46e')speckle(k,185,170,230,240,260,'#5c3a1e',11);
    k.fillStyle='rgba(0,0,0,.07)';k.fillRect(185,170,230,26);
    k.fillStyle=dk(c,40);k.beginPath();k.arc(240,184,4,0,Math.PI*2);k.arc(360,184,4,0,Math.PI*2);k.fill();
  },
  'Gift Box':(c,k)=>{
    const rib=lum(c)<.5?'#e8b800':'#D4006A';
    k.fillStyle=lin(k,170,230,430,400,[[0,lx(c,6)],[1,dk(c,10)]]);k.fillRect(172,232,258,158);
    k.fillStyle=dk(c,28);k.beginPath();k.moveTo(430,232);k.lineTo(480,196);k.lineTo(480,350);k.lineTo(430,390);k.closePath();k.fill();
    k.fillStyle=lx(c,12);k.beginPath();k.moveTo(165,192);k.lineTo(222,150);k.lineTo(492,150);k.lineTo(436,192);k.closePath();k.fill();
    k.fillStyle=c;k.fillRect(165,192,271,44);k.fillStyle=dk(c,34);k.beginPath();k.moveTo(436,192);k.lineTo(492,150);k.lineTo(492,192);k.lineTo(436,236);k.closePath();k.fill();
    k.fillStyle='rgba(0,0,0,.12)';k.fillRect(172,236,258,6);
    k.fillStyle=rib;k.beginPath();k.moveTo(452,180);k.lineTo(468,168);k.lineTo(468,350);k.lineTo(452,362);k.closePath();k.fill();
    k.beginPath();k.moveTo(300,150);k.lineTo(318,150);k.lineTo(470,168);k.lineTo(452,180);k.closePath();k.globalAlpha=.9;k.fill();k.globalAlpha=1;
    gloss(k,170,194,120,40,2);
  },
  'Diary':(c,k)=>{
    k.fillStyle='#f3ecdc';rr(k,206,104,210,292,6);k.fill();k.fillStyle='rgba(0,0,0,.08)';for(let y=110;y<392;y+=5)k.fillRect(408,y,8,1);
    k.fillStyle=lin(k,195,95,410,395,[[0,lx(c,12)],[1,dk(c,14)]]);rr(k,195,96,215,298,8);k.fill();
    k.fillStyle=dk(c,28);k.fillRect(195,96,18,298);
    k.fillStyle=dk(c,45);k.fillRect(376,96,9,298);
    gloss(k,215,100,120,160,8);
  },
  'Power Bank':(c,k)=>{
    k.fillStyle=lin(k,155,140,445,360,[[0,lx(c,25)],[.5,c],[1,dk(c,25)]]);rr(k,155,145,290,210,18);k.fill();
    k.fillStyle=dk(c,40);rr(k,168,228,30,13,3);k.fill();rr(k,206,228,24,13,3);k.fill();
    [410,425,440].forEach((x,i)=>{k.fillStyle=i===0?'#00ee77':'rgba(255,255,255,.15)';k.beginPath();k.arc(x-6,254,5,0,Math.PI*2);k.fill();});
    gloss(k,175,155,110,110,14);
  },
  'Mouse Pad':(c,k)=>{
    const quad=(dy,col)=>{k.fillStyle=col;k.beginPath();k.moveTo(128,150+dy);k.lineTo(472,150+dy);k.quadraticCurveTo(486,150+dy,488,164+dy);k.lineTo(512,360+dy);k.quadraticCurveTo(514,374+dy,498,374+dy);k.lineTo(102,374+dy);k.quadraticCurveTo(86,374+dy,88,360+dy);k.lineTo(112,164+dy);k.quadraticCurveTo(114,150+dy,128,150+dy);k.closePath();k.fill();};
    quad(9,dk(c,45));quad(0,lin(k,100,150,500,374,[[0,lx(c,10)],[1,dk(c,10)]]));
    k.strokeStyle=lum(c)>.5?'rgba(0,0,0,.18)':'rgba(255,255,255,.22)';k.setLineDash([5,4]);k.lineWidth=1.5;k.beginPath();k.moveTo(132,158);k.lineTo(468,158);k.lineTo(500,366);k.lineTo(100,366);k.closePath();k.stroke();k.setLineDash([]);
  },
  'ID Card & Lanyard':(c,k)=>{
    k.strokeStyle=c;k.lineWidth=26;k.lineCap='butt';k.beginPath();k.moveTo(195,-10);k.lineTo(293,212);k.moveTo(405,-10);k.lineTo(307,212);k.stroke();
    k.strokeStyle='rgba(255,255,255,.18)';k.lineWidth=3;k.beginPath();k.moveTo(190,-10);k.lineTo(286,210);k.moveTo(410,-10);k.lineTo(314,210);k.stroke();
    k.fillStyle=lin(k,284,200,316,240,[[0,'#e5e5e5'],[1,'#8a8a8a']]);rr(k,286,204,28,30,5);k.fill();
    k.fillStyle=lin(k,215,240,385,460,[[0,'#ffffff'],[1,'#eceaf2']]);rr(k,215,240,170,222,12);k.fill();
    k.fillStyle='#c9c4d4';rr(k,275,252,50,9,4.5);k.fill();
    k.fillStyle=c;k.fillRect(215,400,170,10);k.fillStyle='#d9d4e3';rr(k,240,420,120,8,4);k.fill();rr(k,260,436,80,7,3.5);k.fill();
  },
  'Keychain':(c,k)=>{
    const metal=lin(k,215,175,385,405,[[0,lx(c,45)],[.35,c],[.6,lx(c,25)],[1,dk(c,30)]]);
    k.strokeStyle=lin(k,262,82,338,158,[[0,'#f2f2f2'],[.5,'#9a9a9a'],[1,'#dedede']]);k.lineWidth=7;k.beginPath();k.arc(300,120,38,0,Math.PI*2);k.stroke();
    k.strokeStyle='#a8a8a8';k.lineWidth=5;k.beginPath();k.ellipse(300,170,8,14,0,0,Math.PI*2);k.stroke();
    k.fillStyle=metal;rr(k,215,178,170,228,28);k.fill();
    k.strokeStyle='rgba(255,255,255,.35)';k.lineWidth=2;rr(k,221,184,158,216,23);k.stroke();
    k.fillStyle='#ece6f6';k.beginPath();k.arc(300,200,9,0,Math.PI*2);k.fill();
    gloss(k,222,186,80,120,22);
  },
  'Coaster':(c,k)=>{
    k.fillStyle=dk(c,30);k.beginPath();k.arc(300,250,150,0,Math.PI*2);k.fill();
    k.fillStyle=lin(k,150,90,450,390,[[0,lx(c,12)],[1,dk(c,10)]]);k.beginPath();k.arc(300,240,150,0,Math.PI*2);k.fill();
    if(c==='#c8a46e'||c==='#5c3a1e'){k.save();k.beginPath();k.arc(300,240,148,0,Math.PI*2);k.clip();speckle(k,150,90,300,300,700,c==='#c8a46e'?'#5c3a1e':'#000000',5);k.restore();}
  },
  'Button Badge':(c,k)=>{
    k.fillStyle=dk(c,30);k.beginPath();k.arc(300,246,142,0,Math.PI*2);k.fill();
    k.fillStyle=c;k.beginPath();k.arc(300,240,140,0,Math.PI*2);k.fill();
    k.save();k.beginPath();k.arc(300,240,140,0,Math.PI*2);k.clip();const g=k.createRadialGradient(250,180,10,300,240,150);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(.6,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.12)');k.fillStyle=g;k.fillRect(150,90,300,300);k.restore();
  },
};

// ---------- state ----------
const photoImgs={};
let cp=0,cc=PRODUCTS[0].colors?PRODUCTS[0].colors[0]:null,cat='all',style='full',preset=0,stylePicked=false;
let logo=null;            // {raw, clean} trimmed canvases of the uploaded logo
let isSample=true;
const st={x:300,y:240,scale:85,rot:0,op:90,clip:true,removeWhite:true,guide:false,snapX:false,snapY:false};
const base=document.createElement('canvas');base.width=W*S;base.height=H*S;const bctx=base.getContext('2d');
const layer=document.createElement('canvas');layer.width=W*S;layer.height=H*S;const lctx=layer.getContext('2d');
const shade=document.createElement('canvas');shade.width=W*S;shade.height=H*S;const sctx=shade.getContext('2d');
let baseDirty=true,shadeK=1;

PRODUCTS.forEach(p=>{if(!p.photo)return;const img=new Image();img.onload=()=>{if(PRODUCTS[cp]===p){baseDirty=true;applyPreset(preset);}};img.src=p.photo;photoImgs[p.name]=img;});

function photoRect(img){const pad=30,s=Math.min((W-pad*2)/img.naturalWidth,(H-pad*2)/img.naturalHeight);const dw=img.naturalWidth*s,dh=img.naturalHeight*s;return{dx:(W-dw)/2,dy:(H-dh)/2,dw,dh};}
// Print area of the current product in canvas px: {x,y,w,h,cyl:[x0,x1]|null}
function area(p){
  p=p||PRODUCTS[cp];
  if(p.photo){
    const img=photoImgs[p.name];if(!img||!img.naturalWidth)return null;
    const r=photoRect(img),[ax,ay,aw,ah]=p.area;
    return{x:r.dx+ax*r.dw,y:r.dy+ay*r.dh,w:aw*r.dw,h:ah*r.dh,cyl:p.cyl?[r.dx+p.cyl[0]*r.dw,r.dx+p.cyl[1]*r.dw]:null};
  }
  const[x,y,w,h]=p.area;return{x,y,w,h,cyl:p.cyl||null};
}
function areaPath(c,a,p){c.beginPath();if(p.shape==='circle')c.ellipse(a.x+a.w/2,a.y+a.h/2,a.w/2,a.h/2,0,0,Math.PI*2);else c.rect(a.x,a.y,a.w,a.h);}

// ---------- base (background + product), cached ----------
function drawBase(){
  const p=PRODUCTS[cp];
  bctx.setTransform(S,0,0,S,0,0);bctx.clearRect(0,0,W,H);
  bctx.fillStyle=lin(bctx,0,0,0,H,[[0,'#f8f5ff'],[1,'#efe8fb']]);bctx.fillRect(0,0,W,H);
  if(p.photo){
    const img=photoImgs[p.name];
    if(img&&img.complete&&img.naturalWidth){const r=photoRect(img);bctx.drawImage(img,r.dx,r.dy,r.dw,r.dh);}
  }else{
    const gs=GROUND_SHADOWS[p.name];if(gs)groundShadow(bctx,...gs);
    bctx.save();bctx.shadowColor='rgba(107,45,139,.2)';bctx.shadowBlur=36;bctx.shadowOffsetY=10;
    PRODUCT_DRAWERS[p.name]?.(cc,bctx);
    bctx.restore();
  }
  // Average luminance of the print area: the shading pass brightens the
  // product by 1/avg so only its relative light and shadow tint the logo.
  shadeK=1;const a=area();
  if(a){try{const d=bctx.getImageData(Math.round(a.x*S),Math.round(a.y*S),Math.max(1,Math.round(a.w*S)),Math.max(1,Math.round(a.h*S))).data;let sum=0,n=0;for(let i=0;i<d.length;i+=16){sum+=.299*d[i]+.587*d[i+1]+.114*d[i+2];n++;}const avg=sum/n/255;shadeK=Math.min(6,.97/Math.max(avg,.05));}catch(e){}}
  baseDirty=false;
}

// ---------- logo prep: trim transparent edges, optional white removal ----------
function prepLogo(img){
  const max=1000,s=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const w=Math.max(1,Math.round((img.naturalWidth||img.width)*s)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*s));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);
  const id=x.getImageData(0,0,w,h);
  const clean=new ImageData(new Uint8ClampedArray(id.data),w,h),d=clean.data;
  for(let i=0;i<d.length;i+=4){const m=Math.min(d[i],d[i+1],d[i+2]);if(m>205){d[i+3]=Math.round(d[i+3]*Math.max(0,Math.min(1,(245-m)/40)));}}
  return{raw:trim(id),clean:trim(clean)};
}
function trim(id){
  const{width:w,height:h,data:d}=id;let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(d[(y*w+x)*4+3]>12){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
  if(x1<0){x0=0;y0=0;x1=w-1;y1=h-1;}
  const c=document.createElement('canvas');c.width=x1-x0+1;c.height=y1-y0+1;
  const t=document.createElement('canvas');t.width=w;t.height=h;t.getContext('2d').putImageData(id,0,0);
  c.getContext('2d').drawImage(t,-x0,-y0);return c;
}
function logoSrc(){return logo?(st.removeWhite?logo.clean:logo.raw):null;}
// Logo draw size in canvas px for the current area and scale.
function logoSize(){
  const src=logoSrc(),a=area();if(!src||!a)return{w:0,h:0};
  const p=PRODUCTS[cp],r=((p.rot||0)+st.rot)*Math.PI/180;
  // Fit the rotated bounding box inside the area.
  const cw=Math.abs(src.width*Math.cos(r))+Math.abs(src.height*Math.sin(r)),ch=Math.abs(src.width*Math.sin(r))+Math.abs(src.height*Math.cos(r));
  const f=Math.min(a.w/cw,a.h/ch)*st.scale/100;
  return{w:src.width*f,h:src.height*f};
}

function tintFill(c){
  const p=PRODUCTS[cp],pc=cc||'#cccccc';
  switch(style){
    case'white':return'#ffffff';
    case'black':return'#1a1a1a';
    case'foil':return lin(c,0,0,W,H,[[0,'#f9e08b'],[.35,'#c9a227'],[.55,'#fff1b8'],[.8,'#b8901f'],[1,'#e8c860']]);
    case'engrave':{if(p.photo)return p.name==='Flask'?'#45474b':'#3a3a3a';return lum(pc)>.45?dk(pc,52):lx(pc,48);}
  }
  return null;
}

// ---------- render ----------
function draw(){
  if(baseDirty)drawBase();
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(base,0,0);
  ctx.setTransform(S,0,0,S,0,0);
  const p=PRODUCTS[cp],a=area(),src=logoSrc();
  if(src&&a){
    const{w,h}=logoSize(),r=((p.rot||0)+st.rot)*Math.PI/180;
    // 1. flat logo, positioned and rotated
    lctx.setTransform(1,0,0,1,0,0);lctx.clearRect(0,0,layer.width,layer.height);lctx.setTransform(S,0,0,S,0,0);
    lctx.save();lctx.translate(st.x,st.y);lctx.rotate(r);lctx.drawImage(src,-w/2,-h/2,w,h);lctx.restore();
    // 2. cylinder wrap: flat x offset s from the axis maps to R*sin(s/R)
    if(a.cyl){
      sctx.setTransform(1,0,0,1,0,0);sctx.clearRect(0,0,shade.width,shade.height);sctx.drawImage(layer,0,0);
      lctx.setTransform(1,0,0,1,0,0);lctx.clearRect(0,0,layer.width,layer.height);
      const cx=(a.cyl[0]+a.cyl[1])/2*S,R=(a.cyl[1]-a.cyl[0])/2*S,cy=p.curveY||0;
      for(let sx=Math.floor(a.cyl[0]*S);sx<Math.ceil(a.cyl[1]*S);sx+=2){
        const s=sx-cx,th=s/R;if(Math.abs(th)>=Math.PI/2)continue;
        const dx=cx+R*Math.sin(th),dw=Math.max(.5,2*Math.cos(th)),dy=cy*R*(1-Math.cos(th));
        lctx.globalAlpha=.55+.45*Math.cos(th);
        lctx.drawImage(shade,sx,0,2,shade.height,dx,dy,dw+.6,shade.height);
      }
      lctx.globalAlpha=1;
    }
    // 3. clip to the print area
    lctx.setTransform(S,0,0,S,0,0);
    if(st.clip){lctx.globalCompositeOperation='destination-in';lctx.fillStyle='#000';areaPath(lctx,a,p);lctx.fill();}
    // 4. single-colour print styles
    const tf=tintFill(lctx);if(tf){lctx.globalCompositeOperation='source-in';lctx.fillStyle=tf;lctx.fillRect(0,0,W,H);}
    lctx.globalCompositeOperation='source-over';
    // 5. shade with the product's own light: multiply by normalised greyscale base, mask back to logo
    sctx.setTransform(1,0,0,1,0,0);sctx.clearRect(0,0,shade.width,shade.height);
    sctx.drawImage(layer,0,0);sctx.globalCompositeOperation='multiply';
    sctx.filter=`grayscale(1) brightness(${shadeK.toFixed(2)})`;sctx.drawImage(base,0,0);sctx.filter='none';
    sctx.globalCompositeOperation='destination-in';sctx.drawImage(layer,0,0);sctx.globalCompositeOperation='source-over';
    ctx.save();ctx.setTransform(1,0,0,1,0,0);
    ctx.globalAlpha=st.op/100*(style==='engrave'?.85:1);
    if(style==='engrave')ctx.globalCompositeOperation=lum(cc||'#c0c0c0')>.45||p.photo?'multiply':'screen';
    ctx.drawImage(shade,0,0);ctx.restore();
  }
  // guides
  if(a&&(st.guide||drag.on)){
    ctx.save();ctx.strokeStyle='rgba(212,0,106,.75)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);areaPath(ctx,a,p);ctx.stroke();ctx.setLineDash([]);
    if(drag.on&&st.snapX){ctx.beginPath();ctx.moveTo(a.x+a.w/2,a.y-10);ctx.lineTo(a.x+a.w/2,a.y+a.h+10);ctx.stroke();}
    if(drag.on&&st.snapY){ctx.beginPath();ctx.moveTo(a.x-10,a.y+a.h/2);ctx.lineTo(a.x+a.w+10,a.y+a.h/2);ctx.stroke();}
    ctx.restore();
  }
  ctx.fillStyle='rgba(107,45,139,.35)';ctx.font='11px Segoe UI, system-ui, sans-serif';ctx.textAlign='right';ctx.fillText('reverbmerch.com',594,472);ctx.textAlign='left';
  updateWa();
}

function applyPreset(i){
  const p=PRODUCTS[cp],a=area();preset=i;
  const pr=(p.presets&&p.presets[i])||['Centre',.5,.5,80];
  st.rot=pr[4]||0;st.scale=pr[3];
  if(a){st.x=a.x+a.w*pr[1];st.y=a.y+a.h*pr[2];}
  syncControls();clampToArea();draw();
}
function clampToArea(){
  const a=area();if(!a||!logo)return;const{w,h}=logoSize(),hw=Math.min(w,a.w)/2,hh=Math.min(h,a.h)/2;
  if(!st.clip)return;
  st.x=Math.max(a.x+Math.min(hw,a.w/2),Math.min(a.x+a.w-Math.min(hw,a.w/2),st.x));
  st.y=Math.max(a.y+Math.min(hh,a.h/2),Math.min(a.y+a.h-Math.min(hh,a.h/2),st.y));
}

// ---------- UI ----------
const pp=$('prodPick'),catEl=$('mkpCats'),presetEl=$('mkpPresets'),styleEl=$('mkpStyles');
function buildCats(){
  if(!catEl)return;catEl.innerHTML='';
  CATS.forEach(([k,l])=>{const b=document.createElement('button');b.type='button';b.className='mkp-chip'+(k===cat?' active':'');b.textContent=l;b.onclick=()=>{cat=k;buildCats();buildProducts();};catEl.appendChild(b);});
}
function buildProducts(){
  pp.innerHTML='';
  PRODUCTS.forEach((p,i)=>{
    if(cat!=='all'&&p.cat!==cat)return;
    const b=document.createElement('button');b.type='button';b.className='prod-btn'+(i===cp?' active':'');
    b.innerHTML='<span class="pe">'+p.emoji+'</span>'+p.name;b.title=p.name;
    b.onclick=()=>selectProduct(i);pp.appendChild(b);
  });
}
function selectProduct(i){
  cp=i;const p=PRODUCTS[i];cc=p.colors?p.colors[0]:null;stylePicked=false;style=autoStyle();baseDirty=true;
  buildProducts();buildSwatches();buildPresets();buildStyles();applyPreset(0);
}
function buildSwatches(){
  const p=PRODUCTS[cp],lbl=$('colorLbl'),sw=$('swatches');
  const has=!!p.colors;lbl.style.display=has?'block':'none';sw.style.display=has?'flex':'none';sw.innerHTML='';
  (p.colors||[]).forEach((c,ci)=>{const s=document.createElement('button');s.type='button';s.className='sw'+(c===cc?' active':'');s.setAttribute('aria-label','Colour '+c);s.style.cssText='background:'+c+';border-color:'+(lum(c)>.9?'#ddd':c);s.onclick=()=>{cc=c;baseDirty=true;if(!stylePicked){style=autoStyle();buildStyles();}buildSwatches();draw();};sw.appendChild(s);});
}
function buildPresets(){
  if(!presetEl)return;presetEl.innerHTML='';
  (PRODUCTS[cp].presets||[]).forEach((pr,i)=>{const b=document.createElement('button');b.type='button';b.className='mkp-chip'+(i===preset||(i===0&&preset>=PRODUCTS[cp].presets.length)?' active':'');b.textContent=pr[0];b.onclick=()=>{applyPreset(i);buildPresets();};presetEl.appendChild(b);});
}
// Default print style: the product's own, or white ink on dark colours so a
// typical dark logo stays readable until the visitor picks a style.
function autoStyle(){const p=PRODUCTS[cp];if(p.style)return p.style;return cc&&lum(cc)<.35?'white':'full';}
function buildStyles(){
  if(!styleEl)return;styleEl.innerHTML='';
  STYLES.forEach(([k,l])=>{const b=document.createElement('button');b.type='button';b.className='mkp-chip'+(k===style?' active':'');b.textContent=l;b.onclick=()=>{style=k;stylePicked=true;buildStyles();draw();};styleEl.appendChild(b);});
}
function syncControls(){
  if($('slSize'))$('slSize').value=st.scale;
  if($('slRot'))$('slRot').value=st.rot;
  if($('slOp'))$('slOp').value=st.op;
}
function updateWa(){
  const a=$('mkpWa');if(!a)return;
  const p=PRODUCTS[cp],sl=(STYLES.find(s=>s[0]===style)||[,''])[1];
  const t=`Hi! I tried your logo mockup tool and I'd like a quote for: ${p.name}${cc?' (colour '+cc+')':''}, ${sl} print. Placement: ${(p.presets&&p.presets[preset]||['Custom'])[0]}.`;
  a.href='https://wa.me/923183241305?text='+encodeURIComponent(t);
}

$('slSize').addEventListener('input',e=>{st.scale=+e.target.value;clampToArea();draw();});
$('slOp').addEventListener('input',e=>{st.op=+e.target.value;draw();});
$('slRot')?.addEventListener('input',e=>{st.rot=+e.target.value;draw();});
$('mkpClip')?.addEventListener('change',e=>{st.clip=e.target.checked;draw();});
$('mkpWhite')?.addEventListener('change',e=>{st.removeWhite=e.target.checked;draw();});
$('mkpGuide')?.addEventListener('change',e=>{st.guide=e.target.checked;draw();});
$('mkpReset')?.addEventListener('click',()=>{applyPreset(0);buildPresets();});
$('mkpDownload')?.addEventListener('click',()=>{
  const g=st.guide;st.guide=false;draw();
  cv.toBlob(b=>{if(!b)return;const u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='reverb-mockup-'+PRODUCTS[cp].name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.png';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);st.guide=g;draw();},'image/png');
  if(window.gtag)gtag('event','mockup_download',{product:PRODUCTS[cp].name});
});
function loadLogoFromUrl(url,sample){const i=new Image();i.onload=()=>{logo=prepLogo(i);isSample=sample;const h=$('mkpHint');if(h){h.textContent=sample?'Sample logo shown — upload yours to try it':'Drag to move · scroll or use sliders to resize';h.style.display='block';}applyPreset(preset);};i.src=url;}
$('logoUpz').addEventListener('click',e=>{if(e.target.id!=='logoUp')$('logoUp').click();});
$('logoUp').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{loadLogoFromUrl(ev.target.result,false);if(window.gtag)gtag('event','mockup_upload');};r.readAsDataURL(f);});
// Drop a file straight onto the upload zone or the canvas.
['logoUpz','mkpCanvas'].forEach(id=>{const el=$(id);if(!el)return;el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drag');});el.addEventListener('dragleave',()=>el.classList.remove('drag'));el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('drag');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/')){const r=new FileReader();r.onload=ev=>loadLogoFromUrl(ev.target.result,false);r.readAsDataURL(f);}});});

// ---------- drag / resize on canvas ----------
const drag={on:false,ox:0,oy:0};
function gcp(e){const rect=cv.getBoundingClientRect();return{x:(e.clientX-rect.left)*(W/rect.width),y:(e.clientY-rect.top)*(H/rect.height)};}
function hit(pt){if(!logo)return false;const{w,h}=logoSize(),m=Math.max(w,h)/2+18;return Math.abs(pt.x-st.x)<m&&Math.abs(pt.y-st.y)<m;}
cv.addEventListener('pointerdown',e=>{const pt=gcp(e);if(!hit(pt))return;drag.on=true;drag.ox=pt.x-st.x;drag.oy=pt.y-st.y;cv.setPointerCapture(e.pointerId);cv.classList.add('grabbing');draw();});
cv.addEventListener('pointermove',e=>{
  const pt=gcp(e);
  if(!drag.on){cv.style.cursor=hit(pt)?'grab':'default';return;}
  let x=pt.x-drag.ox,y=pt.y-drag.oy;const a=area();
  st.snapX=st.snapY=false;
  if(a){const cx=a.x+a.w/2,cy=a.y+a.h/2;if(Math.abs(x-cx)<6){x=cx;st.snapX=true;}if(Math.abs(y-cy)<6){y=cy;st.snapY=true;}}
  st.x=x;st.y=y;clampToArea();draw();
});
function endDrag(){if(!drag.on)return;drag.on=false;cv.classList.remove('grabbing');draw();}
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
cv.style.touchAction='none';
cv.addEventListener('wheel',e=>{if(!logo||!hit(gcp(e)))return;e.preventDefault();st.scale=Math.max(10,Math.min(150,st.scale-Math.sign(e.deltaY)*4));syncControls();clampToArea();draw();},{passive:false});
cv.tabIndex=0;
cv.addEventListener('keydown',e=>{const m={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!m)return;e.preventDefault();const k=e.shiftKey?10:2;st.x+=m[0]*k;st.y+=m[1]*k;clampToArea();draw();});

buildCats();buildProducts();buildSwatches();buildPresets();buildStyles();
draw();
loadLogoFromUrl('images/logo.png',true);
})();
