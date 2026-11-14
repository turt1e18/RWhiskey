// Builds the pixel bar scene into PNG layers under public/pixel-bar/ and the bartender keyframes CSS.
// Every pixel is placed by the shapes below (no image generation); sharp only encodes the raw RGBA buffer.
// Act timings come from src/lib/recommendations/bartenderActs.json, shared with the runtime director.
// Run: node scripts/pixel-bar/build.mjs
import sharp from 'sharp';
import {mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','..');
const OUT=join(root,'public','pixel-bar');
mkdirSync(OUT,{recursive:true});
for(const f of readdirSync(OUT))if(f.endsWith('.png'))rmSync(join(OUT,f)); // drop layers from older layouts
const ACTS=JSON.parse(readFileSync(join(root,'src','lib','recommendations','bartenderActs.json'),'utf8'));

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
  px(x,y){const i=(y*this.w+x)*4;return this.d[i+3]?['#'+[0,1,2].map(k=>this.d[i+k].toString(16).padStart(2,'0')).join(''),this.d[i+3]]:null;}
  draw(src,ox,oy,alpha=1){for(let y=0;y<src.h;y++)for(let x=0;x<src.w;x++){const p=src.px(x,y);if(p)this.set(ox+x,oy+y,p[0],p[1]*alpha);}}
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
  whisky:['#7a4512','#b06a1e','#e0a24a'],
};

// ---------- scene layout (source pixels of the 288x56 scene) ----------
export const LAYOUT={window:[46,4],sky:[51,7],clock:[99,7],bartender:[124,0],placed:[146,33],guest:[163,33],props:[0,30]};

// ---------- doorway on the left wall: the bartender walks out through it ----------
const DOOR={x:8,y:6,w:16,h:34}; // opening; jambs are 2px either side
function doorway(img){
  for(let y=DOOR.y;y<DOOR.y+DOOR.h;y++)for(let x=DOOR.x;x<DOOR.x+DOOR.w;x++)img.set(x,y,(y-DOOR.y)/DOOR.h>BAYER[y%4][x%4]?'#140d09':'#0c0806');
  // half-open door leaf swung inward, seen edge-on at the hinge side, with a brass knob
  const leaf=new Mask().rect(DOOR.x+DOOR.w-5,DOOR.y+1,4,DOOR.h-1);shade(img,leaf,[P.wood[0],P.wood[1],P.wood[2],P.wood[3]],1,-1);
  img.set(DOOR.x+DOOR.w-5,DOOR.y+18,P.brass[2]);
  const frame=new Mask().rect(DOOR.x-2,DOOR.y-2,DOOR.w+4,2).rect(DOOR.x-2,DOOR.y,2,DOOR.h).rect(DOOR.x+DOOR.w,DOOR.y,2,DOOR.h);
  shade(img,frame,[P.wood[1],P.wood[2],P.wood[3],P.wood[4]],1,-1);
}
/** The wall and jamb left of the opening, drawn again over the bartender so he disappears through the doorway. */
function doorFront(back){const img=new Img(DOOR.x,40);for(let y=0;y<40;y++)for(let x=0;x<DOOR.x;x++){const p=back.px(x,y);if(p)img.set(x,y,p[0],p[1]);}return img;}

// ---------- back wall, clock rim, rack, lamp, back bar (static) ----------
function back(){
  const img=new Img(288,40);
  for(let y=0;y<40;y++)for(let x=0;x<288;x++){
    let c=P.wall[2];
    if(y>=28)c=P.wall[1];
    if(y<28&&x%12===0)c=P.wall[0];
    if(y<28&&x%12===1)c=P.wall[3];
    img.set(x,y,c);
  }
  for(let i=0;i<260;i++){const x=Math.floor(rand()*288),y=3+Math.floor(rand()*23);if(x%12>1)img.rect(x,y,1,1+Math.floor(rand()*3),rand()<0.5?P.wall[1]:P.wall[3]);}
  img.rect(0,0,288,2,P.wood[1]);img.rect(0,2,288,1,P.wood[0]);                                    // ceiling beam
  img.rect(0,26,288,1,P.wood[3]);img.rect(0,27,288,1,P.wood[1]);
  for(let x=4;x<288;x+=24){img.rect(x,30,20,8,P.wall[0]);img.rect(x+1,31,18,6,P.wall[2]);img.rect(x+1,31,18,1,P.wall[3]);img.rect(x+18,31,1,6,P.wall[3]);}
  // chalk menu board (no readable text, just chalk strokes)
  img.rect(28,8,16,14,P.wood[2]);img.rect(29,9,14,12,'#1d221f');
  for(const [y,w] of [[11,9],[13,11],[15,7],[17,10]])for(let x=30;x<30+w;x+=1)if(rand()<0.7)img.set(x,y,'#9aa39b',rand()<0.3?120:200);
  img.rect(30,11,4,1,'#c9cfc6');
  doorway(img);
  // glass rack with upside-down stemmed glasses
  img.rect(113,5,24,1,P.brass[2]);img.rect(113,6,24,1,P.brass[0]);
  for(const gx of [116,122,128,134]){
    img.rect(gx-1,7,3,1,P.glass[1]);img.rect(gx,8,1,2,P.glass[1]);
    const m=new Mask().rect(gx-2,10,5,3).add(gx-1,13).add(gx,13).add(gx+1,13);shade(img,m,P.glass);
  }
  // pendant lamp
  img.rect(174,3,1,7,P.hair[0]);
  [[5,10],[7,11],[9,12],[11,13]].forEach(([w,y],i)=>{const m=new Mask().rect(174-(w>>1),y,w,1);shade(img,m,[P.wood[0],P.wood[1],P.wood[2]],1,0);if(i===0)img.rect(174-(w>>1),y,w,1,P.wood[2]);});
  img.rect(171,14,7,1,'#e9b867');img.rect(172,14,5,1,'#ffe2a3');img.rect(173,14,3,1,'#fff4d6');
  backbar(img);
  return img;
}
// Bottle silhouettes as row widths from the base up.
const SHAPES={
  tall:{rows:[5,5,5,5,5,5,3,1,1],cap:'cap'},
  squat:{rows:[6,6,6,6,5,3,2],cap:'cap'},
  square:{rows:[5,5,5,5,5,5,2,2],cap:'cap'},
  decanter:{rows:[5,7,7,6,4,2,1,3],cap:'glass'},
  slim:{rows:[4,4,4,4,4,4,4,2,2],cap:'cap'},
  gin:{rows:[4,4,4,4,4,2,1,1,1],cap:'cap'},
  flask:{rows:[6,6,6,6,2,2],cap:'cap'},
  bitters:{rows:[3,3,3,3,1,1],cap:'cork'},
};
const LIQUID={amber:['#3e220b','#6e4114','#a5671f','#d29a45'],gold:['#5a3a10','#8f6420','#c39a3c','#e6c46e'],dark:['#2a1408','#4a240e','#703916','#9a5626']};
const BOTTLE_GLASS={clear:['#3b3a33','#6d6a5d','#a7a291','#d9d4c2'],green:['#132018','#22382a','#3a5c44','#6a8f70'],brown:['#24150b','#3d2614','#5e3d22','#8a6040']};
function bottle(img,x,base,shapeName,glassKey,liquidKey,fill,alpha=255){
  const shape=SHAPES[shapeName],w=Math.max(...shape.rows),g=BOTTLE_GLASS[glassKey],liquid=liquidKey?LIQUID[liquidKey]:null;
  const body=shape.rows.filter(r=>r===w).length,level=Math.max(1,Math.round(body*fill));
  shape.rows.forEach((rw,j)=>{
    const y=base-j,left=x+((w-rw)>>1);
    for(let k=0;k<rw;k++){
      const ramp=liquid&&rw===w&&j<level?liquid:g;
      img.set(left+k,y,k===0&&rw>1?ramp[3]:k===rw-1&&rw>1?ramp[0]:ramp[k===1?2:1],alpha); // lamp sits left of the back bar
    }
  });
  if(alpha===255&&body>=4){const ly=base-Math.floor(body/2);img.rect(x+1,ly-1,w-2,2,'#d8ccb0');img.rect(x+1,ly,w-2,1,'#a89a7c');if(w>4)img.set(x+2,ly-1,'#7a2e22');}
  const top=base-shape.rows.length,cw=Math.min(shape.rows.at(-1)+1,3);
  if(alpha===255)img.rect(x+((w-cw)>>1),top,cw,1,shape.cap==='glass'?P.glass[2]:shape.cap==='cork'?'#9a7a52':P.brass[1]);
  return w;
}
// Bottles grouped by kind like a real back bar: scotch left, bourbon/Japanese middle, gin and clear spirits right.
const TIERS=[
  {base:12,groups:[['decanter','clear','amber',0.8],['squat','brown','dark',0.6],['squat','brown','dark',0.4],['bitters','brown',null,1],['bitters','brown',null,1],['flask','clear','gold',0.7],['decanter','clear','gold',0.5]]},
  {base:23,groups:[['tall','clear','amber',0.9],['tall','clear','amber',0.5],['tall','brown','dark',0.7],['slim','clear','gold',0.8],['square','clear','amber',0.9],['square','clear','amber',0.3],['squat','clear','dark',0.8],['squat','clear','dark',0.6],['tall','green',null,1],['gin','clear',null,1],['gin','clear',null,1],['slim','green',null,1],['tall','clear','gold',0.4]]},
  {base:34,groups:[['squat','clear','amber',0.7],['tall','clear','amber',1],['tall','clear','amber',0.6],['tall','clear','gold',0.8],['flask','brown','dark',0.5],['square','clear','gold',0.7],['square','clear','gold',0.9],['tall','brown','dark',0.4],['slim','clear','amber',0.6],['gin','green',null,1],['gin','green',null,1],['squat','clear',null,1],['slim','clear','gold',0.9]]},
];
function backbar(img){
  img.rect(178,3,108,37,P.wall[0]);
  // dark mirror behind the bottles with faint vertical sheen
  for(let y=5;y<36;y++)for(let x=180;x<284;x++)img.set(x,y,(x%17===3||x%17===4)?'#221c18':'#191512');
  img.rect(178,3,108,2,P.wood[3]);img.rect(178,3,108,1,P.wood[4]);
  for(const x of [178,284]){img.rect(x,5,2,35,P.wood[2]);img.rect(x,5,1,35,P.wood[3]);}
  // top tier keepsakes: two whisky boxes and a small cask
  for(const [x,w,h] of [[181,8,7],[192,7,6]]){const m=new Mask().rect(x,12-h+1,w,h);shade(img,m,[P.wood[1],P.wood[2],P.wood[3],P.wood[4]],-1,-1);img.rect(x+1,12-h+3,w-2,1,P.brass[1]);}
  const cask=new Mask().ellipse(276,9,4.5,3.4);shade(img,cask,[P.wood[1],P.wood[2],P.wood[3],P.wood[4]],-1,-1);
  for(const x of [273,279])img.rect(x,6,1,7,P.hair[0]);img.set(276,9,P.wood[0]);
  TIERS.forEach((tier,ti)=>{
    // warm strip light along the back edge of each shelf, glowing up behind the bottles
    for(let k=1;k<=3;k++)img.rect(180,tier.base-k+1,104,1,'#ffb247',[0,46,26,12][k]);
    let x=ti===0?201:183;const end=ti===0?266:283;
    const placed=[];
    // Repeat the tier's groups until the shelf is full (a stocked bar has no gaps); fill levels vary on each pass.
    for(let i=0;;i++){const [shape,glass,liquid,fill]=tier.groups[i%tier.groups.length],w=Math.max(...SHAPES[shape].rows);
      if(x+w>end)break;placed.push([x,shape,glass,liquid,i<tier.groups.length?fill:Math.max(0.2,(fill+0.37*i)%1)]);x+=w+1;}
    for(const [bx,shape,glass,liquid,fill] of placed)bottle(img,bx+1,tier.base,shape,glass,liquid,fill,55);  // reflection in the mirror
    for(const [bx,shape,glass,liquid,fill] of placed)bottle(img,bx,tier.base,shape,glass,liquid,fill);
    img.rect(180,tier.base+1,104,1,P.wood[4]);img.rect(180,tier.base+2,104,1,P.wood[3]);img.rect(180,tier.base+3,104,1,P.wall[0]);
  });
  img.rect(178,37,108,3,P.wood[2]);img.rect(178,37,108,1,P.wood[3]);
}

// ---------- clock face (13x13); hands are drawn at runtime from the Seoul time ----------
function clockFace(){
  const img=new Img(13,13);
  const rim=new Mask().ellipse(6,6,6.4,6.4),face=new Mask().ellipse(6,6,4.6,4.6);
  shade(img,new Mask().ellipse(6,6,6.4,6.4).minus(face),[P.wood[1],P.wood[2],P.wood[3],P.wood[4]]);
  shade(img,face,['#bfb197','#e3d7bd','#efe6d2'],-1,1);
  for(const [x,y] of [[6,2],[10,6],[6,10],[2,6]])img.set(x,y,P.wood[1]);
  img.set(6,6,P.brass[2]);
  void rim;return img;
}

// ---------- counter + counter props ----------
function counter(){
  const img=new Img(288,16);
  img.rect(0,0,288,1,P.wood[3]);img.rect(0,1,288,2,P.wood[4]);
  for(let x=0;x<288;x++)for(const y of [1,2]){const d=Math.abs(x-174)/60;if(d<1&&BAYER[y%4][x%4]>d)img.set(x,y,P.wood[5]);}
  for(let i=0;i<70;i++)img.rect(Math.floor(rand()*286),1+Math.floor(rand()*2),2+Math.floor(rand()*4),1,P.wood[3]);
  img.rect(0,3,288,1,P.wood[5]);img.rect(0,4,288,1,P.wood[0]);
  img.rect(0,5,288,11,P.wood[1]);
  for(let i=0;i<120;i++)img.rect(Math.floor(rand()*286),5+Math.floor(rand()*10),3+Math.floor(rand()*8),1,rand()<0.6?P.wood[2]:P.wood[0]);
  for(let x=16;x<288;x+=32){img.rect(x,5,1,11,P.wood[0]);img.rect(x+1,5,1,11,P.wood[2]);}
  img.rect(0,10,288,1,P.brass[2]);img.rect(0,11,288,1,P.brass[1]);img.rect(0,12,288,1,P.brass[0]);
  for(let x=24;x<288;x+=48){img.rect(x,13,2,2,P.brass[0]);img.set(x,13,P.brass[1]);}
  return img;
}
/** Static things standing on the counter top (layer placed at y=30; local y 11 = scene y 41). */
function counterProps(){
  const img=new Img(288,12);
  // water jug
  const jug=new Mask().rect(100,4,6,7).rect(101,3,4,1).add(100,2).add(101,2);
  shade(img,jug,P.glass,1,-1);img.rect(101,6,4,4,'#9fb9c4',140);img.rect(106,5,1,3,P.glass[1]);
  // rubber bar mat with a jigger and a bar spoon
  for(let x=178;x<196;x++)img.set(x,11,x%2?'#1a1714':'#2a2520');
  const jig=new Mask().rect(181,7,3,2).add(182,9).rect(181,10,3,1);shade(img,jig,P.brass,1,-1);
  for(let i=0;i<7;i++)img.set(186+i,10-Math.floor(i/2),P.glass[i%2?1:2]);
  // banker's lamp with a green shade: a second warm light on the right
  img.rect(228,10,9,1,P.brass[0]);img.rect(229,9,7,1,P.brass[1]);img.rect(232,5,1,4,P.brass[2]);
  const shadeMask=new Mask().rect(228,2,9,3).rect(229,1,7,1);shade(img,shadeMask,['#173322','#24513a','#3d7a57','#6aa684'],1,-1);
  img.rect(229,5,7,1,'#ffe2a3',200);
  return img;
}
function glassAt(img,x,y,tilt=0,shine=false,liquid=0){
  for(let r=0;r<8;r++){
    const off=r<4?tilt:0;
    for(let c=0;c<7;c++){
      const px=x+c+off,py=y+r;
      if(r===0){img.set(px,py,c===0||c===6?P.glass[1]:P.glass[2]);continue;}
      if(r>=6){img.set(px,py,c===0?P.glass[0]:c>=5?P.glass[3]:P.glass[1]);continue;}
      if(c===0)img.set(px,py,P.glass[0]);
      else if(c===6)img.set(px,py,P.glass[2]);
      else{
        const depth=5-r; // 0 = bottom row of the bowl
        if(liquid&&depth<Math.ceil(liquid*2/3+0.01)){img.set(px,py,depth===Math.ceil(liquid*2/3+0.01)-1?P.whisky[2]:P.whisky[1]);}
        else img.set(px,py,P.glass[1],95);
      }
    }
    if(r>=1&&r<=4)img.set(x+(shine?2:5)+(r<4?tilt:0),y+r,P.glass[3]);
  }
}
/** Small steel ice bucket (5x6) with ice on top. */
function bucketAt(img,x,y){const m=new Mask().rect(x,y+1,5,5);shade(img,m,['#40484d','#6f7a80','#aab4b9','#dfe6e9'],1,-1);
  img.rect(x,y,5,1,'#cfd8dc');for(const [dx,c] of [[1,'#f4fbfd'],[2,'#cfe6ee'],[3,'#f4fbfd']])img.set(x+dx,y,c);img.rect(x,y+3,5,1,'#5a646a');}
function iceBucket(){const img=new Img(5,7);bucketAt(img,0,0);img.rect(0,6,5,1,'#2a2520');return img;}
/** A short glint that crosses the poured whisky now and then. */
function glint(){const img=new Img(9,9);img.set(3,6,'#fff6dc',230);img.set(4,5,'#fff6dc',170);return img;}
function placedGlass(){const img=new Img(7,8);glassAt(img,0,0);return img;}
/** Guest glass on a coaster with 4 fill states side by side (0, ~10, ~20, ~30%). */
function guestGlass(){
  const img=new Img(9*4,9);
  for(let i=0;i<4;i++){img.rect(i*9,8,9,1,'#7a2e22');img.rect(i*9+1,8,7,1,'#93412f');glassAt(img,i*9+1,0,0,false,i);}
  return img;
}

// ---------- window: 6 sky phases, sun/moon sprites, city per phase, lights ----------
const SKY_W=42,SKY_H=26;
const SKIES={
  predawn:{bands:['#141a33','#24264a','#3e3358','#6b4a63','#a5677a'],city:'#1c1b2c',dim:0},
  morning:{bands:['#5f87ad','#86a6c2','#b9c8cf','#ecd0ab','#f7dfb8'],city:'#55607a',dim:0.08},
  day:{bands:['#5b8db8','#79a5c8','#9bbdd6','#bcd2df','#d6e3e8'],city:'#6a7c8a',dim:0.12},
  golden:{bands:['#5a7ea0','#8aa2b2','#c9b48a','#e8b670','#f0c27a'],city:'#4c4652',dim:0.06},
  sunset:{bands:['#2e2142','#5a2c4a','#9a3f45','#d0683c','#eb9a4c'],city:'#3a2232',dim:0},
  night:{bands:['#0b1020','#101a30','#16233f','#1c2c4c','#22365a'],city:'#0a0d16',dim:0},
};
const CITY=[[0,17,6],[6,20,5],[11,15,4],[15,19,6],[21,14,5],[26,18,4],[30,16,6],[36,19,6]];
function sky(name){
  const s=SKIES[name],img=new Img(SKY_W,SKY_H),dim=c=>mix(c,'#1a120d',s.dim);
  for(let y=0;y<SKY_H;y++)for(let x=0;x<SKY_W;x++){
    // Clean band edges: dithered seams read as dotted lines at this size.
    const f=y/(SKY_H-1)*(s.bands.length-1),b=Math.min(Math.round(f),s.bands.length-1);
    img.set(x,y,dim(s.bands[b]));
  }
  return img;
}
function city(name){
  const s=SKIES[name],img=new Img(SKY_W,SKY_H),dim=c=>mix(c,'#1a120d',s.dim);
  for(const [x,top,w] of CITY){img.rect(x,top,w,SKY_H-top,dim(s.city));
    for(let yy=top+2;yy<SKY_H-1;yy+=3)for(let xx=x+1;xx<x+w-1;xx+=2)img.set(xx,yy,dim(mix(s.city,'#000000',0.25)));}
  return img;
}
function cityLights(chance){const img=new Img(SKY_W,SKY_H);
  for(const [x,top,w] of CITY)for(let yy=top+2;yy<SKY_H-1;yy+=3)for(let xx=x+1;xx<x+w-1;xx+=2)if(rand()<chance)img.set(xx,yy,'#ffb247',220);return img;}
function disc(core,rim,crater){const img=new Img(5,5);const m=new Mask().ellipse(2,2,2.5,2.5);m.each((x,y)=>img.set(x,y,Math.hypot(x-2,y-2)>1.6?rim:core));if(crater){img.set(1,2,rim);img.set(3,3,rim);}return img;}
/** Seasonal tiles for the window, two sky-heights tall so a vertical loop is seamless. */
function snow(){const img=new Img(SKY_W,SKY_H*2);for(let i=0;i<16;i++){const x=Math.floor(rand()*SKY_W),y=Math.floor(rand()*SKY_H);for(const yy of [y,y+SKY_H])img.set(x,yy,'#f2f6f8',rand()<0.5?255:190);}return img;}
function petals(){const img=new Img(SKY_W,SKY_H*2);for(let i=0;i<7;i++){const x=Math.floor(rand()*SKY_W),y=Math.floor(rand()*SKY_H);for(const yy of [y,y+SKY_H]){img.set(x,yy,'#f2b8c6');if(i%2)img.set(x+1,yy,'#e59aae');}}return img;}
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
  img.rect(4,2,44,1,P.hair[0]);img.rect(4,2,1,28,P.hair[0]);
  for(const [y,c] of [[32,P.wood[4]],[33,P.wood[3]],[34,P.wood[2]],[35,P.wall[0]]])img.rect(0,y,52,1,c);
  for(let i=0;i<5;i++){img.set(32+i,26-i,'#ffffff',34);img.set(9+i,13-i,'#ffffff',26);}
  return img;
}
function spill(color,max){
  const img=new Img(288,40);
  for(let y=0;y<40;y++)for(let x=0;x<288;x++){
    if(x>=46&&x<=97)continue;
    const d=x<46?46-x:x-97,t=1-d/26;if(t<=0)continue;
    const steps=Math.floor(t*4)/4;img.set(x,y,color,Math.round(max*(t>steps+BAYER[y%4][x%4]/4?steps+0.25:steps)));
  }
  return img;
}
function lampLight(max){
  const img=new Img(288,56);
  for(let y=0;y<56;y++)for(let x=0;x<288;x++){
    const main=1-Math.hypot((x-174)/1.5,(y-15))/44,desk=0.7*(1-Math.hypot((x-232)/1.3,(y-36))/22);
    const t=Math.max(main,desk);if(t<=0)continue;
    const q=Math.floor(t*5)/5,a=t>q+BAYER[y%4][x%4]/5?q+0.2:q;img.set(x,y,'#ffb247',Math.round(max*a));
  }
  return img;
}

// ---------- bartender (48x44 cells) ----------
// Arms: shoulder → elbow → hand. g = right hand (screen right), c = left hand with the cloth.
// glass: [x,y,tilt] held glass or null; bottle: tilt degrees of the poured bottle; stream: pour stream phase; dy: breathing lift.
const REST_L={e:[7,31],h:[13,37]};
const POSES={
  P01:{g:{e:[32,31],h:[27,36]},glass:[22,30,0],c:{e:[7,31],h:[13,35]},head:[0,0]},
  P02:{g:{e:[33,29],h:[28,32]},glass:[23,26,0],c:{e:[7,30],h:[14,31]},head:[0,0]},
  P03:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[8,28],h:[20,23]},cloth:'wipe',head:[0,1]},
  P04:{g:{e:[33,29],h:[27,29]},glass:[22,23,-1],c:{e:[8,28],h:[22,25]},cloth:'inside',head:[0,1]},
  P05:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[7,30],h:[23,27]},cloth:'inside',head:[0,1]},
  P06:{g:{e:[33,29],h:[27,29]},glass:[22,23,1],c:{e:[9,28],h:[25,25]},cloth:'inside',head:[0,1]},
  P07:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[9,26],h:[23,22]},cloth:'wipe',head:[0,1]},
  P08:{g:{e:[33,29],h:[27,29]},glass:[22,23,0],c:{e:[6,30],h:[19,28]},cloth:'out',head:[0,1]},
  P09:{g:{e:[34,25],h:[31,20]},glass:[26,13,1],c:{e:[7,31],h:[14,32]},head:[1,-1]},
  P10:{g:{e:[34,25],h:[31,20]},glass:[26,13,1],c:{e:[7,31],h:[14,32]},head:[1,-1],shine:true},
  P11:{g:{e:[33,28],h:[28,30]},glass:[23,24,0],c:{e:[7,31],h:[12,33]},cloth:'trail',head:[0,0]},
  P12:{g:{e:[32,30],h:[27,34]},glass:[22,28,0],c:{e:[7,31],h:[13,35]},head:[0,0]},
  E01:{g:{e:[32,31],h:[30,38]},c:REST_L,head:[0,0]},
  E02:{g:{e:[32,31],h:[30,38]},c:REST_L,head:[0,0],dy:-1},
  E03:{g:{e:[32,31],h:[30,38]},c:REST_L,head:[1,0]},
  D01:{g:{e:[32,32],h:[27,38]},glass:[22,32,0],c:{e:[7,31],h:[13,35]},head:[0,1]},
  D02:{g:{e:[32,33],h:[27,39]},glass:[22,33,0],c:{e:[7,31],h:[13,35]},head:[0,1]},
  D03:{g:{e:[32,31],h:[28,37]},c:{e:[7,31],h:[13,36]},head:[0,1]},
  D04:{g:{e:[32,31],h:[30,37]},c:REST_L,head:[0,0]},
  R01:{g:{e:[34,31],h:[37,39]},c:REST_L,head:[1,1]},
  R02:{g:{e:[35,28],h:[37,31]},c:REST_L,head:[1,0],bottle:0},
  R03:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:0},
  R04:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:45},
  R05:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:105,stream:0},
  R06:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:105,stream:1},
  R07:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:105,stream:2},
  R08:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,1],bottle:45},
  R09:{g:{e:[35,26],h:[36,25]},c:REST_L,head:[1,0],bottle:0},
  R10:{g:{e:[35,29],h:[37,33]},c:REST_L,head:[1,0],bottle:0},
  S01:{g:{e:[34,31],h:[39,36]},c:REST_L,head:[1,0]},
  S02:{g:{e:[35,31],h:[40,35]},c:REST_L,head:[1,0]},
  S03:{g:{e:[33,31],h:[34,37]},c:REST_L,head:[1,0]},
  // 3/4 turn toward screen right, between facing front and walking (QL is its mirror)
  Q1:{g:{e:[31,31],h:[29,38]},c:{e:[9,31],h:[14,37]},head:[2,0],quarter:true},
};
// Poured bottle, upright, as palette rows (top → bottom); gripped at row 7.
const BOTTLE_ROWS=['.bb.','.gg.','.gg.','gGGg','gGGg','gLLg','gllg','gGGg','gGGg','gGGg','gGGg'];
const BOTTLE_COLORS={b:P.brass[1],g:'#3d2614',G:'#6e4114',L:'#d8ccb0',l:'#a89a7c'};
function drawBottle(img,hx,hy,deg){
  const rad=deg*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),gx=1.5,gy=7;
  for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++){
    // inverse-rotate the destination pixel into the upright bottle (nearest neighbour keeps the pixel grid)
    const sx=Math.round(cos*x+sin*y+gx),sy=Math.round(-sin*x+cos*y+gy);
    const ch=BOTTLE_ROWS[sy]?.[sx];
    if(ch&&ch!=='.')img.set(hx+x,hy+y,BOTTLE_COLORS[ch]);
  }
  // mouth position, for the pour stream
  const mx=0-gx+1.5,my=0-gy;return [Math.round(hx+cos*mx-sin*my),Math.round(hy+sin*mx+cos*my)];
}
function clothAt(img,[hx,hy],kind){
  const m=new Mask();
  if(kind==='drape'){m.rect(hx-1,hy,3,2).rect(hx-1,hy+2,2,4).add(hx,hy+6);}
  else if(kind==='trail'){m.rect(hx-1,hy,3,2).rect(hx-2,hy+2,2,3);}
  else if(kind==='inside'){m.rect(hx-2,hy-1,4,3);}
  else if(kind==='out'){m.rect(hx-1,hy-2,3,4).add(hx-2,hy+1);}
  else {m.rect(hx-2,hy-1,5,2).rect(hx-1,hy+1,3,1);}
  shade(img,m,P.cloth);
  if(kind!=='inside')img.set(hx,hy+1,P.cloth[0]);
}
function arm(img,sx,sy,{e,h},lx){
  const sleeve=new Mask().line(sx,sy,e[0],e[1],1.6),cuff=new Mask().line(e[0],e[1],e[0]+(h[0]-e[0])*0.35,e[1]+(h[1]-e[1])*0.35,1.3);
  const fore=new Mask().line(e[0]+(h[0]-e[0])*0.35,e[1]+(h[1]-e[1])*0.35,h[0],h[1],1.0);
  shade(img,sleeve,P.shirt,lx,-1);shade(img,cuff,[P.shirt[0],P.shirt[1],P.shirt[2]],lx,-1);shade(img,fore,P.skin,lx,-1);
  shade(img,new Mask().ellipse(h[0],h[1],1.6,1.4),P.skin,1,-1);
}
// ---- back view (turning to the back bar) and side view (walking), 2nd stage ----
const REST_BACK_L={e:[8,31],h:[12,37]},REST_BACK_R={e:[31,31],h:[28,37]};
const BACK_POSES={
  T01:{turn:true,l:REST_BACK_L,r:REST_BACK_R},
  T02:{l:REST_BACK_L,r:REST_BACK_R},
  K01:{l:REST_BACK_L,r:{e:[32,23],h:[28,15]}},
  K02:{l:REST_BACK_L,r:{e:[32,24],h:[29,18]},bottle:'front'},
  K03:{l:{e:[8,26],h:[19,21]},r:{e:[31,25],h:[25,21]},bottle:'back',head:[0,1]},
  K04:{l:REST_BACK_L,r:{e:[32,23],h:[28,15]}},
};
const BOTTLE_BACK_ROWS=BOTTLE_ROWS.map(r=>r.replace(/[Ll]/g,'G'));
function bartenderBack(name){
  const pose=BACK_POSES[name],img=new Img(48,44),[hx,hy]=pose.head??[0,0];
  // 2px narrower than the front torso so turning around does not read as the body widening
  const torso=new Mask().poly([[13,19],[26,19],[30,23],[30,43],[9,43],[9,23]]);
  const trousers=new Mask().rect(10,36,20,8),vest=new Mask();torso.each((x,y)=>{if(!trousers.has(x,y))vest.add(x,y);});
  shade(img,vest,P.vest);shade(img,trousers,[P.apron[0],P.apron[1],P.apron[1]],1,0);
  img.rect(19,22,1,13,P.vest[0]);img.rect(13,31,14,1,P.vest[0]);img.set(19,31,P.brass[2]);       // back seam and cinch strap
  img.rect(15,34,10,2,P.apron[2]);img.rect(17,33,2,1,P.apron[2]);img.rect(21,33,2,1,P.apron[2]);  // apron bow
  img.rect(17,18,6,2,P.shirt[2]);img.set(17,18,P.shirt[3]);                                      // collar
  img.rect(11,21,3,1,P.vest[3]);img.rect(26,21,3,1,P.vest[3]);                                    // shoulder blades catch the light
  // Arms after the body: hanging arms sit beside the torso, raised arms above the shoulder.
  arm(img,29,21,pose.r,1);arm(img,10,21,pose.l,1);
  shade(img,new Mask().rect(18,14+hy,4,4),P.skin,1,0);
  const head=new Mask().ellipse(20+hx,10+hy,4.6,5.4);head.each((x,y)=>{if(y>13+hy)head.del(x,y);});
  shade(img,head,P.hair);
  img.set(15+hx,11+hy,P.skin[1]);img.set(25+hx,11+hy,P.skin[2]);
  if(pose.turn){img.rect(24+hx,10+hy,2,4,P.skin[2]);img.set(25+hx,12+hy,P.skin[3]);img.set(24+hx,14+hy,P.hair[1]);} // cheek and moustache tip at 3/4
  if(pose.bottle){
    const rows=pose.bottle==='back'?BOTTLE_BACK_ROWS:BOTTLE_ROWS,[bx,by]=pose.r.h;
    rows.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch!=='.')img.set(bx-1+x,by-7+y,BOTTLE_COLORS[ch]);}));
    shade(img,new Mask().ellipse(bx,by,1.6,1.4),P.skin,1,-1);
    if(pose.bottle==='back')shade(img,new Mask().ellipse(pose.l.h[0],pose.l.h[1],1.6,1.4),P.skin,1,-1);
  }
  return img;
}
// Side view facing right; walking left is the same frames mirrored. near/far = hand positions of the two arms.
const WALK=[
  {near:{e:[22,28],h:[25,33]},far:{e:[16,28],h:[13,33]}},
  {near:{e:[21,28],h:[23,34]},far:{e:[17,28],h:[15,34]},dy:-1},
  {near:{e:[19,28],h:[19,35]},far:{e:[19,28],h:[19,35]}},
  {near:{e:[17,28],h:[15,34]},far:{e:[21,28],h:[23,34]}},
  {near:{e:[16,28],h:[13,33]},far:{e:[22,28],h:[25,33]},dy:-1},
  {near:{e:[18,28],h:[17,35]},far:{e:[20,28],h:[21,35]}},
];
function bartenderSide(name){
  const pose=WALK[Number(name.slice(1))-1],img=new Img(48,44),dy=pose.dy??0;
  // far arm sits behind the body and is a step darker
  const farSleeve=new Mask().line(19,21+dy,pose.far.e[0],pose.far.e[1]+dy,1.4),farHand=new Mask().line(pose.far.e[0],pose.far.e[1]+dy,pose.far.h[0],pose.far.h[1]+dy,1);
  shade(img,farSleeve,[P.shirt[0],P.shirt[0],P.shirt[1]],1,-1);shade(img,farHand,[P.skin[0],P.skin[0],P.skin[1]],1,-1);
  const torso=new Mask().poly([[15,19+dy],[24,19+dy],[26,23+dy],[26,43],[13,43],[13,23+dy]]);
  const front=new Mask().rect(24,19+dy,2,11),apron=new Mask().rect(22,34,5,10);
  const vest=new Mask();torso.each((x,y)=>{if(!front.has(x,y)&&!apron.has(x,y))vest.add(x,y);});
  shade(img,vest,P.vest);shade(img,front,P.shirt.slice(0,3),1,0);shade(img,apron,P.apron,1,0);img.rect(13,34,10,1,P.apron[2]);
  shade(img,new Mask().rect(19,15+dy,4,4),P.skin,1,0);
  img.rect(24,19+dy,2,2,P.tie[1]);img.set(23,19+dy,P.shirt[2]);
  const face=new Mask().ellipse(21,11+dy,4,5.4);shade(img,face,P.skin);
  const hair=new Mask().ellipse(19.5,8+dy,5,3.8);hair.each((x,y)=>{if(y>=8+dy&&x>21)hair.del(x,y);});hair.rect(16,8+dy,3,5);shade(img,hair,P.hair);
  img.set(25,12+dy,P.skin[2]);img.set(25,13+dy,P.skin[1]);                                       // nose
  img.set(23,11+dy,P.hair[0]);img.set(23,10+dy,P.skin[1]);img.rect(22,9+dy,2,1,P.hair[1]);
  img.rect(22,14+dy,3,1,P.hair[1]);img.set(19,11+dy,P.skin[1]);img.set(19,12+dy,P.skin[0]);         // moustache, ear
  arm(img,19,21+dy,{e:[pose.near.e[0],pose.near.e[1]+dy],h:[pose.near.h[0],pose.near.h[1]+dy]},1);
  return img;
}

/** Left-facing walk: the right-facing frame mirrored around the character's centre (x=20), not the cell centre, so he turns in place. */
/** Mirror any frame around the character's centre (x=20). */
function mirror(src){const img=new Img(48,44);for(let y=0;y<44;y++)for(let x=0;x<48;x++){const p=src.px(x,y),mx=40-x;if(p&&mx>=0&&mx<48)img.set(mx,y,p[0],p[1]);}return img;}
/** Walking right with the ice bucket hanging from the near hand. */
function carryWalk(name){const n=Number(name.slice(1)),img=bartenderSide('W'+n),{h}=WALK[n-1].near,dy=WALK[n-1].dy??0;
  bucketAt(img,h[0]-2,h[1]+dy+1);shade(img,new Mask().ellipse(h[0],h[1]+dy,1.6,1.4),P.skin,1,-1);return img;}
function mirrorWalk(name){const src=bartenderSide('W'+name.slice(1)),img=new Img(48,44);
  for(let y=0;y<44;y++)for(let x=0;x<48;x++){const p=src.px(x,y),mx=40-x;if(p&&mx>=0&&mx<48)img.set(mx,y,p[0],p[1]);}return img;}
function bartender(name){
  if(BACK_POSES[name])return bartenderBack(name);
  if(/^W\d$/.test(name))return bartenderSide(name);
  if(/^L\d$/.test(name))return mirrorWalk(name);
  if(/^C\d$/.test(name))return carryWalk(name);
  if(name==='QL')return mirror(bartender('Q1'));
  const base=name==='B01'?'P01':name==='B02'?'E01':name,pose=POSES[base],img=new Img(48,44),[hx,hy0]=pose.head,dy=pose.dy??0,hy=hy0+dy;
  // 3/4 view: a narrower torso with the shirt front and tie shifted toward the facing side
  const q=pose.quarter?2:0;
  const torso=pose.quarter?new Mask().poly([[13,19+dy],[27,19+dy],[30,23+dy],[30,43],[10,43],[10,23+dy]]):new Mask().poly([[12,19+dy],[27,19+dy],[31,23+dy],[31,43],[8,43],[8,23+dy]]);
  const vee=new Mask().poly([[17+q,19+dy],[22+q,19+dy],[20+q,29+dy],[19+q,29+dy]]),apron=new Mask().rect(8+q,35,24-q,9);
  const vest=new Mask();torso.each((x,y)=>{if(!vee.has(x,y)&&!apron.has(x,y))vest.add(x,y);});
  shade(img,vest,P.vest);shade(img,vee,P.shirt.slice(0,3));shade(img,apron,P.apron,1,0);
  img.rect(9,35,22,1,P.apron[2]);img.set(19,31+dy,P.brass[2]);img.set(19,33+dy,P.brass[2]);
  shade(img,new Mask().rect(18,15+dy,4,4),P.skin,1,0);
  img.set(17,19+dy,P.shirt[3]);img.set(22,19+dy,P.shirt[2]);img.set(16,20+dy,P.shirt[2]);img.set(23,20+dy,P.shirt[1]);
  img.rect(17+q,19+dy,2,2,P.tie[1]);img.rect(21+q,19+dy,2,2,P.tie[1]);img.set(17+q,19+dy,P.tie[2]);img.rect(19+q,19+dy,2,2,P.tie[0]);
  const face=new Mask().ellipse(20+hx,11+hy,4.4,5.4);shade(img,face,P.skin);
  img.set(15+hx,11+hy,P.skin[1]);img.set(25+hx,11+hy,P.skin[2]);img.set(25+hx,12+hy,P.skin[1]);
  const hair=new Mask().ellipse(20+hx,6.5+hy,5.2,3.2);hair.each((x,y)=>{if(y>7+hy)hair.del(x,y);});
  hair.rect(15+hx,8+hy,1,3).rect(24+hx,8+hy,1,2);shade(img,hair,P.hair);
  const blink=name==='B01'||name==='B02';
  for(const ex of [18,22]){if(blink)img.set(ex+hx,11+hy,P.skin[0]);else{img.set(ex+hx,11+hy,P.hair[0]);img.set(ex+hx,10+hy,P.skin[1]);}}
  img.rect(17+hx,9+hy,2,1,P.hair[1]);img.rect(22+hx,9+hy,2,1,P.hair[1]);
  img.set(20+hx,12+hy,P.skin[3]);img.set(19+hx,13+hy,P.skin[1]);
  img.rect(18+hx,14+hy,5,1,P.hair[1]);img.set(17+hx,14+hy,P.hair[0]);img.set(23+hx,14+hy,P.hair[0]);
  img.rect(19+hx,15+hy,3,1,P.skin[1]);
  // right arm (+ held glass or bottle), then the left arm with the cloth on top
  if(pose.bottle!==undefined){
    arm(img,29,21+dy,pose.g,1);
    const [mx,my]=drawBottle(img,pose.g.h[0],pose.g.h[1],pose.bottle);
    shade(img,new Mask().ellipse(pose.g.h[0],pose.g.h[1],1.6,1.4),P.skin,1,-1);
    if(pose.stream!==undefined)for(let y=my+1;y<33;y++)img.set(mx,y,(y+pose.stream)%3===0?P.whisky[2]:P.whisky[1]);
  } else {
    arm(img,29,21+dy,pose.g,1);
    if(pose.glass){const [gx,gy,tilt]=pose.glass;glassAt(img,gx,gy,tilt,pose.shine);shade(img,new Mask().rect(gx+5,gy+3,2,3),P.skin,1,-1);}
  }
  arm(img,10,21+dy,pose.c,1);
  clothAt(img,pose.c.h,pose.cloth??'drape');
  return img;
}

// ---------- act timelines → CSS keyframes ----------
function css(){
  const frames=ACTS.frames,n=frames.length,pos=f=>`translateX(${(-frames.indexOf(f)*100/n).toFixed(4)}%)`;
  let out=`/* Generated by scripts/pixel-bar/build.mjs from bartenderActs.json — do not edit. ${n} frames. */\n`;
  out+=`.pxbar-bartender { transform: ${pos('E01')}; }\n`;
  for(const [name,act] of Object.entries(ACTS.acts)){
    if(name==='rest')continue;
    const total=act.frames.reduce((s,[,ms])=>s+ms,0);let t=0;const lines=[];
    for(const [f,ms] of act.frames){lines.push(`  ${(t/total*100).toFixed(3)}% { transform: ${pos(f)}; }`);t+=ms;}
    lines.push(`  100% { transform: ${pos(act.frames.at(-1)[0])}; }`);
    out+=`@keyframes pxbar-${name} {\n${lines.join('\n')}\n}\n`;
    out+=`.pxbar-bartender[data-act="${name}"] { animation: pxbar-${name} ${total}ms step-end ${act.loop?'infinite':'1 forwards'}; }\n`;
  }
  return out;
}

// ---------- write ----------
const sheet=new Img(48*ACTS.frames.length,44);ACTS.frames.forEach((f,i)=>sheet.draw(bartender(f),i*48,0));
await Promise.all([
  (()=>{const b=back();return Promise.all([b.save('back.png'),doorFront(b).save('door-front.png')]);})(),counter().save('counter.png'),counterProps().save('counter-props.png'),
  windowFrame().save('window-frame.png'),neutralGlass().save('window-glass.png'),clockFace().save('clock-face.png'),
  placedGlass().save('glass-placed.png'),guestGlass().save('glass-guest.png'),iceBucket().save('ice-bucket.png'),glint().save('glint.png'),
  snow().save('snow.png'),petals().save('petals.png'),
  ...Object.keys(SKIES).flatMap(k=>[sky(k).save(`sky-${k}.png`),city(k).save(`city-${k}.png`)]),
  cityLights(0.18).save('lights-early.png'),cityLights(0.3).save('lights-late.png'),
  disc('#fff4d2','#f6e2a8').save('sun.png'),disc('#ffc66a','#f29a48').save('sun-low.png'),disc('#efe4c8','#cfc3a3',true).save('moon.png'),
  stars([[4,3],[11,7],[19,2],[38,9],[15,11]]).save('stars-a.png'),stars([[8,5],[23,4],[29,9],[36,3]]).save('stars-b.png'),clouds().save('clouds.png'),
  spill('#a9c4e0',46).save('spill-morning.png'),spill('#e6e0cc',40).save('spill-day.png'),spill('#f0b060',50).save('spill-golden.png'),spill('#f08a4a',52).save('spill-sunset.png'),
  lampLight(38).save('lamp-light.png'),sheet.save('bartender.png'),
]);
writeFileSync(join(root,'src','components','recommendations','pixelBarFrames.css'),css());
console.log(`pixel-bar: ${readdirSync(OUT).length} layers, bartender ${ACTS.frames.length} frames`);
