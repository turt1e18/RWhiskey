// Builds the pixel bar scene into PNG layers under public/pixel-bar/.
// Every pixel is placed by the shapes below (no image generation); sharp only encodes the raw RGBA buffer.
// Run: node scripts/pixel-bar/build.mjs
import sharp from 'sharp';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const OUT=join(root,'public','pixel-bar');
mkdirSync(OUT,{recursive:true});

// ---------- raster helpers ----------
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*t).toString(16).padStart(2,'0')).join('');
class Img {
  constructor(w,h){this.w=w;this.h=h;this.d=new Uint8ClampedArray(w*h*4);}
  set(x,y,c,a=255){
    x=Math.round(x);y=Math.round(y);
    if(!c||x<0||y<0||x>=this.w||y>=this.h)return;
    const i=(y*this.w+x)*4,[r,g,b]=rgb(c),A=a/255,B=this.d[i+3]/255,o=A+B*(1-A);
    if(o===0)return;
    this.d[i]=(r*A+this.d[i]*B*(1-A))/o;this.d[i+1]=(g*A+this.d[i+1]*B*(1-A))/o;this.d[i+2]=(b*A+this.d[i+2]*B*(1-A))/o;this.d[i+3]=o*255;
  }
  rect(x,y,w,h,c,a){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c,a);}
  draw(src,ox,oy){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const i=(y*src.w+x)*4;if(src.d[i+3])this.set(ox+x,oy+y,'#'+[0,1,2].map(k=>src.d[i+k].toString(16).padStart(2,'0')).join(''),src.d[i+3]);}}
  save(name){return sharp(Buffer.from(this.d),{raw:{width:this.w,height:this.h,channels:4}}).png({compressionLevel:9}).toFile(join(OUT,name));}
}
class Mask {
  constructor(){this.s=new Set();}
  add(x,y){this.s.add(`${Math.round(x)},${Math.round(y)}`);return this;}
  has(x,y){return this.s.has(`${x},${y}`);}
  del(x,y){this.s.delete(`${x},${y}`);}
  each(f){for(const k of this.s){const [x,y]=k.split(',').map(Number);f(x,y);}}
  minus(o){o.each((x,y)=>this.del(x,y));return this;}
  rect(x,y,w,h){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.add(x+i,y+j);return this;}
  ellipse(cx,cy,rx,ry){for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++)
    if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)this.add(x,y);return this;}
  poly(pts){const ys=pts.map(p=>p[1]);for(let y=Math.min(...ys);y<=Math.max(...ys);y++){const xs=[];
    for(let i=0;i<pts.length;i++){const [x1,y1]=pts[i],[x2,y2]=pts[(i+1)%pts.length];if((y1<=y&&y2>y)||(y2<=y&&y1>y))xs.push(x1+(y-y1)*(x2-x1)/(y2-y1));}
    xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<=Math.floor(xs[i+1]);x++)this.add(x,y);}return this;}
  line(x1,y1,x2,y2,r){const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)*2));
    for(let i=0;i<=n;i++){const x=x1+(x2-x1)*i/n,y=y1+(y2-y1)*i/n;
      for(let dy=-Math.ceil(r);dy<=Math.ceil(r);dy++)for(let dx=-Math.ceil(r);dx<=Math.ceil(r);dx++)if(dx*dx+dy*dy<=r*r+0.25)this.add(x+dx,y+dy);}return this;}
}
/** Fill a mask with a 3-4 step ramp, lit from (lx,ly): edges facing the light get the light step, the far edges the dark step. */
function shade(img,mask,ramp,lx=1,ly=-1){
  mask.each((x,y)=>{
    const lit=(lx&&!mask.has(x+lx,y))||(ly&&!mask.has(x,y+ly)),dark=(lx&&!mask.has(x-lx,y))||(ly&&!mask.has(x,y-ly));
    let c=ramp[1];
    if(dark)c=ramp[0];
    if(lit)c=ramp[2];
    if(lit&&ramp[3]&&(lx&&!mask.has(x+lx,y))&&(ly&&!mask.has(x,y+ly)))c=ramp[3];
    img.set(x,y,c);
  });
}
const BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>(v+0.5)/16));
let seed=7;const rand=()=>((seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff);

// ---------- palette (ramps dark → light; based on the app tokens #1a120d #2d2017 #4a3728 #efe2c9 #ffb247) ----------
const P={
  wall:['#130c07','#1c120b','#25180f','#302014','#3d2919'],
  wood:['#1f140c','#2d2017','#4a3728','#6b4a33','#8a6243','#b08458'],
  brass:['#5a4220','#8a6a3a','#c9a46a','#ead2a0'],
  skin:['#6e4630','#9a6646','#c4885f','#dca57a'],
  hair:['#140d09','#2d2017','#4a3424'],
  shirt:['#8f8676','#c9bfab','#ece3d0','#faf4e6'],
  vest:['#1e1611','#33251b','#4a3727','#614a36'],
  apron:['#171310','#25201c','#36302a'],
  tie:['#3e1510','#6e2a1f','#93412f'],
  glass:['#5f6b69','#a8b5b1','#dbe6e1','#f7fbf8'],
  cloth:['#9d917b','#cfc3a8','#efe5cf','#fbf6ea'],
};

// ---------- back wall, rack, lamp, shelves (static) ----------
function back(){
  const img=new Img(288,40);
  for(let y=0;y<40;y++)for(let x=0;x<288;x++){
    let c=P.wall[2];
    if(y>=28)c=P.wall[1];               // lower panelling is a step darker
    if(y<28&&x%12===0)c=P.wall[0];      // plank seams
    if(y<28&&x%12===1)c=P.wall[3];      // seam catches light on its right edge
    img.set(x,y,c);
  }
  for(let i=0;i<260;i++){const x=Math.floor(rand()*288),y=Math.floor(rand()*26);if(x%12>1)img.rect(x,y,1,1+Math.floor(rand()*3),rand()<0.5?P.wall[1]:P.wall[3]);}
  img.rect(0,26,288,1,P.wood[3]);img.rect(0,27,288,1,P.wood[1]);            // chair rail
  for(let x=4;x<288;x+=24){img.rect(x,30,20,8,P.wall[0]);img.rect(x+1,31,18,6,P.wall[2]);img.rect(x+1,31,18,1,P.wall[3]);img.rect(x+18,31,1,6,P.wall[3]);}
  // glass rack with upside-down stemmed glasses (light comes from the lamp on the right)
  img.rect(104,4,24,1,P.brass[2]);img.rect(104,5,24,1,P.brass[0]);
  for(const gx of [106,112,118,124]){
    img.rect(gx-1,6,3,1,P.glass[1]);img.rect(gx,7,1,2,P.glass[1]);
    const m=new Mask().rect(gx-2,9,5,4).add(gx-1,13).add(gx,13).add(gx+1,13);shade(img,m,P.glass);
  }
  // pendant lamp
  img.rect(172,0,1,9,P.hair[0]);
  [[5,9],[7,10],[9,11],[11,12]].forEach(([w,y],i)=>{const m=new Mask().rect(172-(w>>1),y,w,1);shade(img,m,[P.wood[0],P.wood[1],P.wood[2]],1,0);if(i===0)img.rect(172-(w>>1),y,w,1,P.wood[2]);});
  img.rect(169,13,7,1,'#e9b867');img.rect(170,13,5,1,'#ffe2a3');img.rect(171,13,3,1,'#fff4d6');
  // shelf unit
  img.rect(182,2,94,38,P.wall[0]);img.rect(184,4,90,34,P.wall[1]);
  img.rect(182,2,94,2,P.wood[3]);img.rect(182,2,94,1,P.wood[4]);
  for(const x of [182,274]){img.rect(x,4,2,36,P.wood[2]);img.rect(x,4,1,36,P.wood[3]);}
  for(const y of [15,30]){img.rect(184,y,90,1,P.wood[4]);img.rect(184,y+1,90,1,P.wood[3]);img.rect(184,y+2,90,1,P.wall[0]);}
  img.rect(184,33,90,7,P.wood[1]);
  for(let x=186;x<272;x+=22){img.rect(x,34,20,5,P.wood[0]);img.rect(x+1,34,18,4,P.wood[1]);img.rect(x+18,36,1,1,P.brass[2]);}
  bottles(img,186,14);bottles(img,186,29);
  return img;
}
// Bottle silhouettes as row widths from the base up; c = cap rows.
const SHAPES={
  tall:{rows:[5,5,5,5,5,5,3,1,1,1],cap:1},
  squat:{rows:[6,6,6,6,6,4,2],cap:2},
  decanter:{rows:[5,7,7,7,5,3,1,1],cap:3},
  slim:{rows:[4,4,4,4,4,4,4,2,2],cap:2},
};
const LIQUID={amber:['#3e220b','#6e4114','#a5671f','#d29a45'],gold:['#5a3a10','#8f6420','#c39a3c','#e6c46e'],dark:['#2a1408','#4a240e','#703916','#9a5626']};
const BOTTLE_GLASS={clear:['#3b3a33','#6d6a5d','#a7a291','#d9d4c2'],green:['#132018','#22382a','#3a5c44','#6a8f70'],brown:['#24150b','#3d2614','#5e3d22','#8a6040']};
function bottles(img,x0,base){
  const kinds=['tall','squat','slim','decanter','tall','tall','squat','slim','tall','decanter','squat','tall','slim'];
  let x=x0;
  for(let i=0;x<270;i++){
    const shape=SHAPES[kinds[(i+(base>20?5:0))%kinds.length]],w=Math.max(...shape.rows);
    if(x+w>271)break;
    const glassKey=['clear','clear','green','brown','clear'][Math.floor(rand()*5)],g=BOTTLE_GLASS[glassKey];
    const liquid=glassKey==='green'?null:LIQUID[['amber','gold','dark','amber'][Math.floor(rand()*4)]];
    const body=shape.rows.filter(r=>r===w).length,level=Math.max(1,body-Math.floor(rand()*3));
    shape.rows.forEach((rw,j)=>{
      const y=base-j,left=x+((w-rw)>>1);
      for(let k=0;k<rw;k++){
        const edgeL=k===0,edgeR=k===rw-1,inLiquid=liquid&&rw===w&&j<level;
        const ramp=inLiquid?liquid:g;
        img.set(left+k,y,edgeL&&rw>1?ramp[3]:edgeR&&rw>1?ramp[0]:ramp[k===1?2:1]); // lamp is to the left of the shelf
      }
    });
    // label across the middle of the body, then the cap
    if(body>=4){const ly=base-Math.floor(body/2);img.rect(x+1,ly-1,w-2,2,'#d8ccb0');img.rect(x+1,ly,w-2,1,'#a89a7c');if(w>4)img.set(x+2,ly-1,'#7a2e22');}
    const top=base-shape.rows.length;const cw=Math.min(shape.rows[shape.rows.length-1]+ (shape.cap>1?1:0),3);
    img.rect(x+((w-cw)>>1),top,cw,1,shape.cap===3?P.glass[2]:P.brass[1]);
    x+=w+1+Math.floor(rand()*2);
  }
}

// ---------- counter (static, placed at y=40) ----------
function counter(){
  const img=new Img(288,16);
  img.rect(0,0,288,1,P.wood[3]);img.rect(0,1,288,2,P.wood[4]);
  for(let x=0;x<288;x++)for(const y of [1,2]){const d=Math.abs(x-172)/60;if(d<1&&BAYER[y%4][x%4]>d)img.set(x,y,P.wood[5]);} // lamp reflection on the top
  for(let i=0;i<70;i++)img.rect(Math.floor(rand()*286),1+Math.floor(rand()*2),2+Math.floor(rand()*4),1,P.wood[3]);
  img.rect(0,3,288,1,P.wood[5]);img.rect(0,4,288,1,P.wood[0]);
  img.rect(0,5,288,11,P.wood[1]);
  for(let i=0;i<120;i++)img.rect(Math.floor(rand()*286),5+Math.floor(rand()*10),3+Math.floor(rand()*8),1,rand()<0.6?P.wood[2]:P.wood[0]);
  for(let x=16;x<288;x+=32){img.rect(x,5,1,11,P.wood[0]);img.rect(x+1,5,1,11,P.wood[2]);}
  img.rect(0,10,288,1,P.brass[2]);img.rect(0,11,288,1,P.brass[1]);img.rect(0,12,288,1,P.brass[0]);
  for(let x=24;x<288;x+=48){img.rect(x,13,2,2,P.brass[0]);img.set(x,13,P.brass[1]);}
  return img;
}

// ---------- window (52x36 frame, sky area 42x26 at (5,3)) ----------
const SKY_W=42,SKY_H=26;
const SKIES={
  morning:{bands:['#5f87ad','#86a6c2','#b9c8cf','#ecd0ab','#f7dfb8'],city:'#55607a',dim:0.08},
  day:{bands:['#5b8db8','#79a5c8','#9bbdd6','#bcd2df','#d6e3e8'],city:'#6a7c8a',dim:0.12},
  evening:{bands:['#2e2142','#5a2c4a','#9a3f45','#d0683c','#eb9a4c'],city:'#3a2232',dim:0.1},
  night:{bands:['#0b1020','#101a30','#16233f','#1c2c4c','#22365a'],city:'#0a0d16',dim:0},
};
const CITY=[[0,17,6],[6,20,5],[11,15,4],[15,19,6],[21,14,5],[26,18,4],[30,16,6],[36,19,6]];
function sky(name){
  const s=SKIES[name],img=new Img(SKY_W,SKY_H),dim=c=>mix(c,'#1a120d',s.dim);
  for(let y=0;y<SKY_H;y++)for(let x=0;x<SKY_W;x++){
    const f=y/(SKY_H-1)*(s.bands.length-1),b=Math.min(Math.floor(f),s.bands.length-2),t=Math.min(1,Math.max(0,(f-b-0.35)/0.3)); // solid bands, short dithered seams
    img.set(x,y,dim(t>BAYER[y%4][x%4]?s.bands[b+1]:s.bands[b]));
  }
  const sun=(cx,cy,r,core,rim)=>{const m=new Mask().ellipse(cx,cy,r,r);m.each((x,y)=>img.set(x,y,dim(Math.hypot(x-cx,y-cy)>r-1?rim:core)));};
  if(name==='morning')sun(31,15,3,'#ffecc0','#f3c98a');
  if(name==='day')sun(33,5,2.4,'#fff4d2','#f6e2a8');
  if(name==='evening')sun(27,17,4,'#ffc66a','#f29a48');
  if(name==='night'){sun(32,6,2.5,'#efe4c8','#cfc3a3');img.set(31,6,'#cfc3a3');img.set(33,7,'#cfc3a3');}
  for(const [x,top,w] of CITY){img.rect(x,top,w,SKY_H-top,dim(s.city));
    for(let yy=top+2;yy<SKY_H-1;yy+=3)for(let xx=x+1;xx<x+w-1;xx+=2){
      const lit=name==='evening'?rand()<0.12:false;img.set(xx,yy,lit?'#ffb247':dim(mix(s.city,'#000000',0.25)));
    }}
  return img;
}
function nightLights(){const img=new Img(SKY_W,SKY_H);
  for(const [x,top,w] of CITY)for(let yy=top+2;yy<SKY_H-1;yy+=3)for(let xx=x+1;xx<x+w-1;xx+=2)if(rand()<0.3)img.set(xx,yy,'#ffb247',220);return img;}
function stars(pts){const img=new Img(SKY_W,SKY_H);pts.forEach(([x,y])=>img.set(x,y,'#efe4c8'));return img;}
function clouds(){const img=new Img(84,8);
  for(const [cx,cy,w] of [[14,4,10],[56,3,14]]){const m=new Mask().ellipse(cx,cy,w/2,2).ellipse(cx-w/4,cy+1,w/3,1.6).ellipse(cx+w/4,cy+1,w/3,1.6);
    m.each((x,y)=>img.set(x,y,m.has(x,y+1)?'#ece6d8':'#c9c2b2',225));}return img;}
function neutralGlass(){const img=new Img(SKY_W,SKY_H);
  for(let y=0;y<SKY_H;y++)for(let x=0;x<SKY_W;x++)img.set(x,y,(y/SKY_H)>BAYER[y%4][x%4]?'#151b24':'#10141b');return img;}
function windowFrame(){
  const img=new Img(52,36);
  const frame=new Mask().rect(2,0,48,32).minus(new Mask().rect(5,3,42,26));
  frame.rect(25,3,2,26).rect(5,15,42,2);
  shade(img,frame,[P.hair[0],P.wood[0],P.wood[1]],1,-1);
  img.rect(4,2,44,1,P.hair[0]);img.rect(4,2,1,28,P.hair[0]);                 // recess shadow inside the frame
  for(const [y,c] of [[32,P.wood[4]],[33,P.wood[3]],[34,P.wood[2]],[35,P.wall[0]]])img.rect(0,y,52,1,c);
  // reflection of the bar light on the glass: two short diagonal streaks
  for(let i=0;i<5;i++){img.set(32+i,26-i,'#ffffff',34);img.set(9+i,13-i,'#ffffff',26);}
  return img;
}
// Coloured light from the window falling on the nearby wall (stepped, dithered).
function spill(color,max){
  const img=new Img(288,40);
  for(let y=0;y<40;y++)for(let x=0;x<288;x++){
    const dx=x<46?46-x:x>97?x-97:0,dy=y>39?y-39:0,d=Math.hypot(dx,dy*2);
    if(x>=46&&x<=97&&y<=39)continue;
    const t=1-d/26;if(t<=0)continue;
    const steps=Math.floor(t*4)/4;img.set(x,y,color,Math.round(max*(t>steps+BAYER[y%4][x%4]/4?steps+0.25:steps)));
  }
  return img;
}
// Warm pool of light from the pendant over the whole scene (wall, bartender, counter top).
function lampLight(max){
  const img=new Img(288,56);
  for(let y=0;y<56;y++)for(let x=0;x<288;x++){
    const d=Math.hypot((x-172)/1.5,(y-14));const t=1-d/44;if(t<=0)continue;
    const q=Math.floor(t*5)/5,a=t>q+BAYER[y%4][x%4]/5?q+0.2:q;img.set(x,y,'#ffb247',Math.round(max*a));
  }
  return img;
}

// ---------- bartender (40x44 cells, 13 frames) ----------
// Arms: shoulder → elbow → hand. g = glass hand (screen right), c = cloth hand (screen left).
// tilt shifts the glass rim by a pixel; head offset is the look direction; cloth: drape | wipe | inside | out | trail.
const POSES={
  P01:{g:{e:[32,31],h:[27,36]},glass:[22,30,0],c:{e:[7,31],h:[13,35]},cloth:'drape',head:[0,0]},
  P02:{g:{e:[33,29],h:[28,32]},glass:[23,26,0],c:{e:[7,30],h:[14,31]},cloth:'drape',head:[0,0]},
  P03:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[8,28],h:[20,23]},cloth:'wipe',head:[0,1]},
  P04:{g:{e:[33,29],h:[27,29]},glass:[22,23,-1],c:{e:[8,28],h:[22,25]},cloth:'inside',head:[0,1]},
  P05:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[7,30],h:[23,27]},cloth:'inside',head:[0,1]},
  P06:{g:{e:[33,29],h:[27,29]},glass:[22,23,1],c:{e:[9,28],h:[25,25]},cloth:'inside',head:[0,1]},
  P07:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[9,26],h:[23,22]},cloth:'wipe',head:[0,1]},
  P08:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[6,30],h:[19,28]},cloth:'out',head:[0,1]},
  P09:{g:{e:[34,25],h:[31,20]},glass:[26,13,1],c:{e:[7,31],h:[14,32]},cloth:'drape',head:[1,-1]},
  P10:{g:{e:[34,25],h:[31,20]},glass:[26,13,1],c:{e:[7,31],h:[14,32]},cloth:'drape',head:[1,-1],shine:true},
  P11:{g:{e:[33,28],h:[28,30]},glass:[23,24,0],c:{e:[7,31],h:[12,33]},cloth:'trail',head:[0,0]},
  P12:{g:{e:[32,30],h:[27,34]},glass:[22,28,0],c:{e:[7,31],h:[13,35]},cloth:'drape',head:[0,0]},
};
const FRAMES=['P01','P02','P03','P04','P05','P06','P07','P08','P09','P10','P11','P12','B01'];

function glassAt(img,x,y,tilt,shine){
  for(let r=0;r<8;r++){
    const off=r<4?tilt:0;
    for(let c=0;c<7;c++){
      const px=x+c+off,py=y+r;
      if(r===0){img.set(px,py,c===0||c===6?P.glass[1]:P.glass[2]);continue;}
      if(r>=6){img.set(px,py,c===0?P.glass[0]:c>=5?P.glass[3]:P.glass[1]);continue;}
      if(c===0)img.set(px,py,P.glass[0]);
      else if(c===6)img.set(px,py,P.glass[2]);
      else img.set(px,py,P.glass[1],95);              // see-through bowl
    }
    if(r>=1&&r<=4)img.set(x+(shine?2:5)+(r<4?tilt:0),y+r,P.glass[3]);
  }
}
function clothAt(img,[hx,hy],kind){
  const m=new Mask();
  if(kind==='drape'){m.rect(hx-1,hy,3,2).rect(hx-1,hy+2,2,4).add(hx,hy+6);}
  else if(kind==='trail'){m.rect(hx-1,hy,3,2).rect(hx-2,hy+2,2,3);}
  else if(kind==='inside'){m.rect(hx-2,hy-1,4,3);}
  else if(kind==='out'){m.rect(hx-1,hy-2,3,4).add(hx-2,hy+1);}
  else {m.rect(hx-2,hy-1,5,2).rect(hx-1,hy+1,3,1);}
  shade(img,m,P.cloth);
  if(kind!=='inside')img.set(hx,hy+1,P.cloth[0]); // fold
}
function arm(img,sx,sy,{e,h},lx){
  const sleeve=new Mask().line(sx,sy,e[0],e[1],1.6),cuff=new Mask().line(e[0],e[1],e[0]+(h[0]-e[0])*0.35,e[1]+(h[1]-e[1])*0.35,1.3);
  const fore=new Mask().line(e[0]+(h[0]-e[0])*0.35,e[1]+(h[1]-e[1])*0.35,h[0],h[1],1.0);
  shade(img,sleeve,P.shirt,lx,-1);shade(img,cuff,[P.shirt[0],P.shirt[1],P.shirt[2]],lx,-1);shade(img,fore,P.skin,lx,-1);
  shade(img,new Mask().ellipse(h[0],h[1],1.6,1.4),P.skin,1,-1);
}
function bartender(name){
  const pose=POSES[name==='B01'?'P01':name],img=new Img(40,44),[hx,hy]=pose.head;
  // torso: vest with a shirt V, apron from the waist
  const torso=new Mask().poly([[12,19],[27,19],[31,23],[31,43],[8,43],[8,23]]);
  const vee=new Mask().poly([[17,19],[22,19],[20,29],[19,29]]),apron=new Mask().rect(8,35,24,9);
  const vest=new Mask();torso.each((x,y)=>{if(!vee.has(x,y)&&!apron.has(x,y))vest.add(x,y);});
  shade(img,vest,P.vest);shade(img,vee,P.shirt.slice(0,3));shade(img,apron,P.apron,1,0);
  img.rect(9,35,22,1,P.apron[2]);img.set(19,31,P.brass[2]);img.set(19,33,P.brass[2]);
  // neck, collar, bow tie
  shade(img,new Mask().rect(18,15,4,4),P.skin,1,0);
  img.set(17,19,P.shirt[3]);img.set(22,19,P.shirt[2]);img.set(16,20,P.shirt[2]);img.set(23,20,P.shirt[1]);
  img.rect(17,19,2,2,P.tie[1]);img.rect(21,19,2,2,P.tie[1]);img.set(17,19,P.tie[2]);img.rect(19,19,2,2,P.tie[0]);
  // head
  const face=new Mask().ellipse(20+hx,11+hy,4.4,5.4);shade(img,face,P.skin);
  img.set(15+hx,11+hy,P.skin[1]);img.set(25+hx,11+hy,P.skin[2]);img.set(25+hx,12+hy,P.skin[1]);       // ears
  const hair=new Mask().ellipse(20+hx,6.5+hy,5.2,3.2);hair.each((x,y)=>{if(y>7+hy)hair.del(x,y);});
  hair.rect(15+hx,8+hy,1,3).rect(24+hx,8+hy,1,2);shade(img,hair,P.hair);
  const blink=name==='B01';
  for(const ex of [18,22]){if(blink)img.set(ex+hx,11+hy,P.skin[0]);else{img.set(ex+hx,11+hy,P.hair[0]);img.set(ex+hx,10+hy,P.skin[1]);}}
  img.rect(17+hx,9+hy,2,1,P.hair[1]);img.rect(22+hx,9+hy,2,1,P.hair[1]);
  img.set(20+hx,12+hy,P.skin[3]);img.set(19+hx,13+hy,P.skin[1]);                                        // nose light / shadow
  img.rect(18+hx,14+hy,5,1,P.hair[1]);img.set(17+hx,14+hy,P.hair[0]);img.set(23+hx,14+hy,P.hair[0]);     // moustache
  img.rect(19+hx,15+hy,3,1,P.skin[1]);
  // glass arm, glass, fingers over the glass, cloth arm, cloth
  arm(img,29,21,pose.g,1);
  const [gx,gy,tilt]=pose.glass;glassAt(img,gx,gy,tilt,pose.shine);
  shade(img,new Mask().rect(gx+5,gy+3,2,3),P.skin,1,-1);
  arm(img,10,21,pose.c,1);
  clothAt(img,pose.c.h,pose.cloth);
  return img;
}

// ---------- timeline (ms per frame) → CSS keyframes ----------
const TIMELINE=[['P01',800],['B01',120],['P01',480],['P02',140],['P03',160],
  ...[140,110,110].flatMap(ms=>['P04','P05','P06','P07'].map(f=>[f,ms])),
  ['P04',160],['P05',160],['P06',160],['P08',220],['P09',180],['P10',1200],['P11',160],['P12',160]];
function keyframes(){
  const total=TIMELINE.reduce((s,[,ms])=>s+ms,0);let t=0;const lines=[];
  for(const [f,ms] of TIMELINE){const i=FRAMES.indexOf(f);lines.push(`  ${(t/total*100).toFixed(3)}% { transform: translateX(${(-i*100/FRAMES.length).toFixed(4)}%); }`);t+=ms;}
  lines.push(`  100% { transform: translateX(0%); }`);
  return {total,css:`/* Generated by scripts/pixel-bar/build.mjs — edit TIMELINE there. Frame order: ${FRAMES.join(' ')} */\n@keyframes pxbar-bartender {\n${lines.join('\n')}\n}\n.pxbar-bartender { animation: pxbar-bartender ${total}ms step-end infinite; }\n`};
}

// ---------- write ----------
const sheet=new Img(40*FRAMES.length,44);FRAMES.forEach((f,i)=>sheet.draw(bartender(f),i*40,0));
await Promise.all([
  back().save('back.png'),counter().save('counter.png'),windowFrame().save('window-frame.png'),
  neutralGlass().save('window-glass.png'),...Object.keys(SKIES).map(k=>sky(k).save(`sky-${k}.png`)),
  nightLights().save('sky-night-lights.png'),stars([[4,3],[11,7],[19,2],[38,9],[15,11]]).save('stars-a.png'),
  stars([[8,5],[23,4],[29,9],[36,3]]).save('stars-b.png'),clouds().save('clouds.png'),
  spill('#a9c4e0',46).save('spill-morning.png'),spill('#e6e0cc',40).save('spill-day.png'),spill('#f08a4a',52).save('spill-evening.png'),
  lampLight(38).save('lamp-light.png'),sheet.save('bartender.png'),
]);
const kf=keyframes();
writeFileSync(join(root,'src','components','recommendations','pixelBarFrames.css'),kf.css);
console.log(`pixel-bar: wrote layers to public/pixel-bar, bartender loop ${kf.total}ms, ${FRAMES.length} frames`);
