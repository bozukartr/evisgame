/* Kule topu · a helix-tower smash game for small hands.
   Pseudo-3D rings are projected onto the 2D canvas. Every world distance is a multiple of the ring radius,
   so rotating the phone or resizing keeps the game state intact. Dark slices bounce the ball back: no losing. */
const TOWER_KEY='evisgame-tower-v1';
const TOWER_THEMES=[
 {sky:['#8AD6E2','#4FA4BF'],ring:['#FF4F93','#FF97C0'],pole:['#D9669E','#FFC6E0'],ball:'#FF3F86'},
 {sky:['#AFA2F8','#6049C4'],ring:['#FF9A3C','#FFD760'],pole:['#E59A45','#FFEAB5'],ball:'#FF6F1F'},
 {sky:['#FFC6A2','#F27886'],ring:['#1EBF97','#91EBCD'],pole:['#45C4A2','#D6F9EC'],ball:'#0FA37F'},
 {sky:['#8DCFFF','#3F7DE2'],ring:['#FF5F5F','#FFB468'],pole:['#EE8479','#FFDDCB'],ball:'#F04747'},
 {sky:['#C8EE98','#4FB27A'],ring:['#7A5CFF','#BCA8FF'],pole:['#9886F2','#E9E2FF'],ball:'#6543F2'}
];
const TW={k:.36,pole:.3,thick:.19,gap:.25,ball:.17,contact:.64,gravity:15,smash:3.6,bounce:.95,fire:3.2};
const TOWER_HARD=[46,49,72];
const hexRgb=h=>{const n=parseInt(h.slice(1,7),16);return [n>>16&255,n>>8&255,n&255];};
function rgbStr(c,f=1,a=1){const k=f<=1?c.map(v=>v*f):c.map(v=>v+(255-v)*Math.min(1,f-1));return `rgba(${k[0]|0},${k[1]|0},${k[2]|0},${a})`;}
const easeBack=t=>1+2.70158*(t-1)**3+1.70158*(t-1)**2;

function loadTowerLevel(){try{const v=JSON.parse(localStorage.getItem(TOWER_KEY)||'null');return clamp((v&&v.lvl)|0,1,999);}catch(e){return 1;}}
function saveTowerLevel(lvl){try{localStorage.setItem(TOWER_KEY,JSON.stringify({lvl}));}catch(e){}}
function buildTower(){
 const g={tower:true,free:true,total:sensoryTotals.tower||0,focus:0,effects:[],flights:[],reward:0,items:[{id:0,x:W/2,y:H/2,r:40}],
  lvl:loadTowerLevel(),rings:[],next:0,foot:-1.6,vy:0,credit:0,heat:0,fire:0,bonk:0,squash:0,rot:0,dir:1,cam:-.4,shake:0,flash:0,
  debris:[],trail:[],flames:[],waves:[],score:0,scorePop:0,combo:0,state:'play',winT:0,idle:0,blink:0,blinkAt:1.4,soundAt:-1,happy:0};
 level={type:'tower',adventure:g,pieces:[],targets:[],cheered:false};
 resetPhase();phase='play';makeTowerLevel(g);layoutTower();
 cvs.setAttribute('aria-label','Kule topu. Ekrana dokun ya da basılı tut; top renkli katları kırarak aşağı iner. Koyu katlar topu yalnızca zıplatır.');
}
function makeTowerLevel(g){
 const L=g.lvl,n=Math.min(14+L*2,36),sides=L%2?6:8,style=(L-1)%3;
 g.theme=TOWER_THEMES[(L-1)%TOWER_THEMES.length];
 const a=hexRgb(g.theme.ring[0]),b=hexRgb(g.theme.ring[1]),hard=L===1?.3:Math.min(.38+L*.05,.8),pair=Math.min(.12+L*.07,.6);
 g.rings=Array.from({length:n},(_,i)=>{
  const kinds=new Uint8Array(sides);
  // The first rings and the last ring stay soft so every tower opens and closes with a smash.
  if(i>1&&i<n-1&&Math.random()<hard){const start=(Math.random()*sides)|0,len=1+(Math.random()<pair?1:0)+(sides===8&&L>5&&Math.random()<.3?1:0);for(let m=0;m<len;m++)kinds[(start+m)%sides]=1;}
  const t=i/Math.max(1,n-1);
  return {kinds,rgb:a.map((v,j)=>v+(b[j]-v)*t),broken:false,born:-.12-i*.028,flash:0,splats:[],
   offset:style===0?i*.17:style===1?Math.sin(i*.42)*1.1:(Math.floor(i/3)%2)*.45+i*.04};
 });
 Object.assign(g,{next:0,foot:-1.9,vy:0,cam:-.3,dir:L%2?1:-1,credit:0,heat:0,fire:0,bonk:0,state:'play',winT:0,combo:0,goalBorn:-.12-n*.028});
 g.debris.length=0;g.trail.length=0;g.flames.length=0;g.waves.length=0;
 if(W&&g.R)buildTowerSky(g);
}
function layoutTower(){
 const g=level.adventure,uh=H-safe.top-safe.bottom;
 g.R=Math.max(56,Math.min(W*.33,uh*.25,210));g.cx=W/2;
 g.hud=safe.top+Math.min(112,uh*.2);g.origin=Math.max(safe.top+uh*.4,g.hud+g.R*1.3);
 Object.assign(g.items[0],{x:g.cx,y:g.origin,r:g.R});g.box={x:0,y:0,w:W,h:H};
 unit=Math.min(W,uh)*.08;buildTowerSky(g);
}
function buildTowerSky(g){
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(W*DPR));c.height=Math.max(1,Math.round(H*DPR));
 const q=c.getContext('2d');q.scale(DPR,DPR);
 const lg=q.createLinearGradient(0,0,0,H);lg.addColorStop(0,g.theme.sky[0]);lg.addColorStop(1,g.theme.sky[1]);q.fillStyle=lg;q.fillRect(0,0,W,H);
 const glow=q.createRadialGradient(W/2,H*.3,0,W/2,H*.3,Math.max(W,H)*.65);glow.addColorStop(0,'rgba(255,255,255,.30)');glow.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=glow;q.fillRect(0,0,W,H);
 q.fillStyle='rgba(255,255,255,.07)';
 for(let i=0;i<4;i++){const x=W*(i*.3-.15);q.beginPath();q.moveTo(x,0);q.lineTo(x+W*.12,0);q.lineTo(x+W*.42,H);q.lineTo(x+W*.26,H);q.closePath();q.fill();}
 const low=q.createLinearGradient(0,H*.6,0,H);low.addColorStop(0,'rgba(20,30,60,0)');low.addColorStop(1,'rgba(20,30,60,.16)');q.fillStyle=low;q.fillRect(0,H*.6,W,H*.4);
 g.sky=c;
}

/* ---------- simulation ---------- */
const towerAngle=(g,ring)=>g.rot+ring.offset*g.dir;
function towerSliceAt(g,ring){const n=ring.kinds.length;let a=(Math.PI/2-towerAngle(g,ring))%(Math.PI*2);if(a<0)a+=Math.PI*2;return Math.floor(a/(Math.PI*2/n))%n;}
function towerHolding(){for(const d of touchPointers.values())if(d.tower)return true;return false;}
function towerPress(e){
 touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,at:time,tower:true});
 towerTap();try{cvs.setPointerCapture(e.pointerId);}catch(err){}
}
// A quick tap always smashes at least one ring; holding keeps the ball smashing.
function towerTap(){const g=level.adventure;g.idle=0;g.credit=Math.min(3,g.credit+1);g.happy=.4;}
function towerReward(g){g.total++;sensoryTotals.tower=g.total;if(g.total%12===0){g.reward=1.4;stars++;levelIndex++;modeRounds.tower=(modeRounds.tower||0)+1;saveProgress();}}
function towerSound(kind,combo=0){
 const g=level.adventure;if(!started||time-g.soundAt<.045)return;g.soundAt=time;
 if(kind==='smash'){const f=PENTA[combo%6]*(combo>=6?2:1);tone(f,.1,'triangle',.13,0,f*1.3);tone(f*.5,.07,'sine',.08);}
 else if(kind==='bounce')tone(300,.07,'sine',.07,0,390);
 else if(kind==='hard'){tone(170,.2,'sine',.24,0,105);tone(340,.08,'triangle',.05);}
 else if(kind==='fire'){[0,2,4,5].forEach((n,i)=>tone(PENTA[n]*2,.12,'triangle',.1,i*.05));}
}
function smashRing(g,ring,holding){
 ring.broken=true;g.next++;g.credit=Math.max(0,g.credit-1);g.combo++;g.score++;g.scorePop=1;
 if(holding&&g.fire<=0){g.heat=Math.min(1,g.heat+.085);if(g.heat>=1){g.fire=TW.fire;towerSound('fire');buzz([10,30,10]);}}
 const plane=(g.next-1)*TW.gap,n=ring.kinds.length,step=Math.PI*2/n,angle=towerAngle(g,ring),k=TW.k,P=TW.pole;
 if(!REDUCED)for(let j=0;j<n;j++){
  const a0=angle+j*step,a1=a0+step,m=a0+step/2;
  const raw=[Math.cos(a0),Math.sin(a0)*k,Math.cos(a1),Math.sin(a1)*k,Math.cos(a1)*P,Math.sin(a1)*k*P,Math.cos(a0)*P,Math.sin(a0)*k*P];
  const mx=(raw[0]+raw[2]+raw[4]+raw[6])/4,my=(raw[1]+raw[3]+raw[5]+raw[7])/4;
  g.debris.push({x:mx,y:plane+my,pts:raw.map((v,i)=>v-(i%2?my:mx)),rgb:ring.kinds[j]?TOWER_HARD:ring.rgb,
   vx:Math.cos(m)*rnd(1.4,2.4),vy:-rnd(.8,1.6)+Math.sin(m)*.5,rot:0,spin:rnd(-7,7),life:0,max:rnd(.5,.75)});
 }
 if(g.debris.length>48)g.debris.splice(0,g.debris.length-48);
 g.waves.push({y:plane,life:0});if(g.waves.length>6)g.waves.shift();
 towerSound('smash',g.combo);if(g.combo%3===1)buzz(6);towerReward(g);
}
function addSplat(g,ring){
 ring.splats.push({a:Math.PI/2-towerAngle(g,ring)+rnd(-.06,.06),s:rnd(.85,1.15),seed:rnd(0,6)});
 if(ring.splats.length>3)ring.splats.shift();
}
function winTower(g){
 g.state='win';g.winT=0;g.happy=2.5;g.credit=0;g.fire=0;g.heat=0;saveTowerLevel(g.lvl+1);
 sndWin();buzz([20,40,20]);if(!REDUCED){confetti(90);burst(g.cx,towerScreenY(g,g.rings.length*TW.gap),'#FFD65C',24);}
}
function updateTower(dt){
 const g=level.adventure,holding=towerHolding();
 updateCharactersClock(dt);
 g.reward=Math.max(0,g.reward-dt);g.scorePop=Math.max(0,g.scorePop-dt*3.5);g.squash=Math.max(0,g.squash-dt*5.5);
 g.shake=Math.max(0,g.shake-dt*3);g.flash=Math.max(0,g.flash-dt*2.2);g.bonk=Math.max(0,g.bonk-dt);g.happy=Math.max(0,g.happy-dt);
 g.idle=holding?0:g.idle+dt;g.rot+=dt*(REDUCED?.5:1.05)*g.dir;
 g.blink=Math.max(0,g.blink-dt);g.blinkAt-=dt;if(g.blinkAt<=0){g.blink=.14;g.blinkAt=rnd(2,4.5);}
 for(const r of g.rings){r.born=Math.min(1,r.born+dt*(REDUCED?9:3.2));r.flash=Math.max(0,r.flash-dt*2.4);}
 g.goalBorn=Math.min(1,g.goalBorn+dt*(REDUCED?9:3.2));
 if(g.fire>0){g.fire=Math.max(0,g.fire-dt);g.heat=g.fire/TW.fire;}else if(!holding)g.heat=Math.max(0,g.heat-dt*.45);
 const smashing=g.state==='play'&&g.bonk<=0&&(holding||g.credit>0);
 if(smashing)g.vy=Math.max(g.vy,TW.smash);else g.vy+=TW.gravity*dt;
 g.foot+=g.vy*dt;
 for(let guard=0;guard<3;guard++){
  const ring=g.rings[g.next],plane=g.next*TW.gap;
  if(g.foot<plane)break;
  if(!ring){
   g.foot=plane;g.vy=-Math.sqrt(2*TW.gravity*TW.bounce)*(g.state==='win'?.75:.9);g.squash=1;
   if(g.state==='play')winTower(g);else towerSound('bounce');break;
  }
  if(smashing&&(g.fire>0||!ring.kinds[towerSliceAt(g,ring)])){smashRing(g,ring,holding);continue;}
  g.foot=plane;g.squash=1;
  if(smashing){
   ring.flash=1;g.bonk=.38;g.credit=0;g.combo=0;g.heat=Math.max(0,g.heat-.25);g.shake=REDUCED?0:.7;
   g.vy=-Math.sqrt(2*TW.gravity*TW.bounce)*.8;towerSound('hard');buzz(16);
  }else{g.vy=-Math.sqrt(2*TW.gravity*TW.bounce);g.combo=0;addSplat(g,ring);towerSound('bounce');}
  break;
 }
 g.cam=ease(g.cam,Math.max(g.cam,Math.min(g.next,g.rings.length)*TW.gap),REDUCED?30:9,dt);
 if(smashing&&!REDUCED){g.trail.unshift(g.foot);if(g.trail.length>7)g.trail.pop();}else if(g.trail.length)g.trail.pop();
 if(g.fire>0&&!REDUCED){g.flames.push({x:rnd(-.08,.08),y:g.foot-TW.ball*.6,life:0,max:rnd(.25,.45),r:rnd(.05,.09)});if(g.flames.length>28)g.flames.shift();}
 g.flames=g.flames.filter(f=>{f.life+=dt;f.y-=dt*.9;return f.life<f.max;});
 g.debris=g.debris.filter(p=>{p.life+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=7*dt;p.rot+=p.spin*dt;return p.life<p.max;});
 g.waves=g.waves.filter(w=>(w.life+=dt)<.4);
 if(g.state==='win'){g.winT+=dt;if(g.winT>2.3){g.lvl++;makeTowerLevel(g);g.flash=1;g.happy=1;}}
 Object.assign(g.items[0],{x:g.cx,y:towerScreenY(g,g.foot)});
}

/* ---------- rendering ---------- */
const towerScreenY=(g,y)=>g.origin+(y-g.cam)*g.R;
function towerPoleGradient(v){
 const rp=v.R*TW.pole,lg=ctx.createLinearGradient(v.cx-rp,0,v.cx+rp,0),[a,b]=v.theme.pole;
 lg.addColorStop(0,a);lg.addColorStop(.55,b);lg.addColorStop(.8,'#FFFFFF');lg.addColorStop(1,b);return lg;
}
function towerPoly(p){ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i],p[i+1]);ctx.closePath();}
function drawPoleColumn(v,top,y){
 const rp=v.R*TW.pole;ctx.fillStyle=v.poleFill;ctx.beginPath();ctx.moveTo(v.cx-rp,top);ctx.lineTo(v.cx+rp,top);ctx.lineTo(v.cx+rp,y);
 ctx.ellipse(v.cx,y,rp,rp*TW.k,0,0,Math.PI);ctx.closePath();ctx.fill();
}
function drawSplats(v,ring,y,angle,scale,front){
 const R=v.R*scale;
 for(const s of ring.splats){
  const a=angle+s.a,sn=Math.sin(a);if(front!==(sn>=0))continue;
  const x=v.cx+Math.cos(a)*R*TW.contact,sy=y+sn*R*TW.contact*TW.k,r=R*.085*s.s;
  ctx.fillStyle=rgbStr(ring.rgb,.74,.9);ctx.beginPath();ctx.ellipse(x,sy,r*1.25,r*.5,0,0,7);ctx.fill();
  for(let i=0;i<7;i++){const d=s.seed+i*.9,dist=r*(1.35+(i%3)*.35);ctx.beginPath();ctx.ellipse(x+Math.cos(d)*dist*1.3,sy+Math.sin(d)*dist*.45,r*(.2+(i%2)*.1),r*(.1+(i%2)*.05),0,0,7);ctx.fill();}
 }
}
function drawTowerRing(v,ring,y,angle,scale,alpha,poleTop){
 const n=ring.kinds.length,step=Math.PI*2/n,R=v.R*scale,rp=v.R*TW.pole,k=TW.k,t=v.R*TW.thick,cx=v.cx,ox=[],oy=[],ix=[],iy=[];
 for(let j=0;j<=n;j++){const a=angle+j*step,c=Math.cos(a),s=Math.sin(a);ox.push(cx+c*R);oy.push(y+s*R*k);ix.push(cx+c*rp);iy.push(y+s*rp*k);}
 const flash=REDUCED?ring.flash*.5:ring.flash*(.6+.4*Math.sin(ring.flash*18));
 const color=(j,f)=>ring.kinds[j]?rgbStr(TOWER_HARD,f+flash*.9):rgbStr(ring.rgb,f);
 const top=j=>{const m=angle+(j+.5)*step;ctx.fillStyle=color(j,1+.05*Math.cos(m-.8));towerPoly([ox[j],oy[j],ox[j+1],oy[j+1],ix[j+1],iy[j+1],ix[j],iy[j]]);ctx.fill();};
 ctx.save();ctx.globalAlpha=alpha;
 for(let j=0;j<n;j++)if(Math.sin(angle+(j+.5)*step)<0)top(j);
 drawSplats(v,ring,y,angle,scale,false);
 ctx.restore();
 drawPoleColumn(v,poleTop,y);
 ctx.save();ctx.globalAlpha=alpha;
 for(let j=0;j<n;j++){
  const m=angle+(j+.5)*step;if(Math.sin(m)<=0)continue;
  ctx.fillStyle=color(j,.55+.36*(1+Math.cos(m-.6))/2);towerPoly([ox[j],oy[j],ox[j+1],oy[j+1],ox[j+1],oy[j+1]+t,ox[j],oy[j]+t]);ctx.fill();
  ctx.fillStyle='rgba(30,20,60,.13)';towerPoly([ox[j],oy[j]+t*.68,ox[j+1],oy[j+1]+t*.68,ox[j+1],oy[j+1]+t,ox[j],oy[j]+t]);ctx.fill();
 }
 for(let j=0;j<n;j++)if(Math.sin(angle+(j+.5)*step)>=0)top(j);
 drawSplats(v,ring,y,angle,scale,true);
 // Crisp highlight on the front rim sells the plastic toy material.
 ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=Math.max(1,v.R*.012);ctx.beginPath();
 for(let j=0;j<n;j++)if(Math.sin(angle+(j+.5)*step)>=0){ctx.moveTo(ox[j],oy[j]);ctx.lineTo(ox[j+1],oy[j+1]);}
 ctx.stroke();ctx.restore();
}
function drawTowerGoal(v,y,angle,scale,poleTop){
 const R=v.R*1.06*scale,k=TW.k,t=v.R*TW.thick*1.5,cx=v.cx;
 const side=ctx.createLinearGradient(cx-R,0,cx+R,0);side.addColorStop(0,'#D98A16');side.addColorStop(.6,'#FFC53D');side.addColorStop(1,'#E9A21F');
 ctx.fillStyle=side;ctx.beginPath();ctx.ellipse(cx,y,R,R*k,0,0,Math.PI);ctx.lineTo(cx-R,y+t);ctx.ellipse(cx,y+t,R,R*k,0,Math.PI,0,true);ctx.closePath();ctx.fill();
 const topG=ctx.createRadialGradient(cx,y,0,cx,y,R);topG.addColorStop(0,'#FFF3B0');topG.addColorStop(1,'#FFD24A');
 ctx.fillStyle=topG;ctx.beginPath();ctx.ellipse(cx,y,R,R*k,0,0,7);ctx.fill();
 ctx.strokeStyle='#FFFFFF88';ctx.lineWidth=Math.max(1.5,v.R*.02);ctx.beginPath();ctx.ellipse(cx,y,R*.9,R*.9*k,0,0,7);ctx.stroke();
 const star=(front)=>{for(let i=0;i<6;i++){const a=angle+i*Math.PI/3,s=Math.sin(a);if(front!==(s>=0))continue;ctx.save();ctx.translate(cx+Math.cos(a)*R*.66,y+s*R*.66*k);ctx.scale(1,.55);ctx.fillStyle='#FFFFFF';starPath(ctx,v.R*.075);ctx.fill();ctx.restore();}};
 star(false);drawPoleColumn(v,poleTop,y);star(true);
}
function drawTowerStack(v,time){
 v.poleFill=towerPoleGradient(v);
 const planeY=i=>v.screenY(i*TW.gap),n=v.rings.length;
 const above=i=>i-1>=v.next?planeY(i-1):-v.R;
 const goalY=planeY(n);
 if(v.goal!==false&&goalY-v.R<H&&v.goalBorn>0)drawTowerGoal(v,goalY+(1-clamp(v.goalBorn,0,1))*v.R*.5,v.rot,easeBack(clamp(v.goalBorn,0,1)),above(n));
 for(let i=n-1;i>=v.next;i--){
  const ring=v.rings[i],y=planeY(i);if(ring.broken||ring.born<=0)continue;
  if(y-v.R*TW.k>H||y+v.R*(TW.k+TW.thick)<-v.R)continue;
  const b=clamp(ring.born,0,1);
  drawTowerRing(v,ring,y-(1-b)*v.R*.9,v.rot+ring.offset*v.dir,.55+.45*easeBack(b),clamp(b*2.2,0,1),above(i));
 }
}
function towerBallColor(g){return g.fire>0?'#FF8A1F':g.theme.ball;}
function drawTowerBall(g,time){
 const R=g.R,br=TW.ball*R,cx=g.cx,off=TW.contact*TW.k*R,y=towerScreenY(g,g.foot)+off-br;
 const nextPlane=Math.min(g.next,g.rings.length)*TW.gap,gap=Math.max(0,nextPlane-g.foot),sh=clamp(1-gap*.7,.25,1);
 ctx.save();ctx.globalAlpha=.22*sh;ctx.fillStyle='#1B2140';ctx.beginPath();ctx.ellipse(cx,towerScreenY(g,nextPlane)+off,br*sh*1.15,br*sh*.42,0,0,7);ctx.fill();ctx.restore();
 const base=towerBallColor(g),rgb=hexRgb(base);
 for(let i=g.trail.length-1;i>=1;i--){const ty=towerScreenY(g,g.trail[i])+off-br,f=1-i/8;orb(cx,ty,br*f,rgbStr(rgb,1.25,.28*f));}
 if(g.fire>0){
  for(const f of g.flames){const q=f.life/f.max;orb(cx+f.x*R,towerScreenY(g,f.y)+off-br,f.r*R*(1-q*.5),`rgba(255,${(200-q*140)|0},60,${.75*(1-q)})`);}
  const glow=ctx.createRadialGradient(cx,y,br*.4,cx,y,br*2.6);glow.addColorStop(0,'rgba(255,200,80,.55)');glow.addColorStop(1,'rgba(255,140,40,0)');ctx.fillStyle=glow;ctx.fillRect(cx-br*3,y-br*3,br*6,br*6);
 }
 const smashing=g.state==='play'&&g.bonk<=0&&(g.credit>0||towerHolding());
 const sq=REDUCED?0:Math.sin(clamp(g.squash,0,1)*Math.PI*.5)*g.squash,st=REDUCED?0:(smashing?.14:clamp(Math.abs(g.vy)*.02,0,.08));
 const sx=1+sq*.3-st*.5,sy=1-sq*.3+st;
 ctx.save();ctx.translate(cx,y+br);ctx.scale(sx,sy);ctx.translate(0,-br);
 const sg=ctx.createRadialGradient(-br*.35,-br*.4,br*.08,0,0,br);sg.addColorStop(0,rgbStr(rgb,1.55));sg.addColorStop(.45,base);sg.addColorStop(1,rgbStr(rgb,.72));
 ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,br,0,7);ctx.fill();
 orb(-br*.38,-br*.44,br*.17,'rgba(255,255,255,.75)');
 // Face: curious while bouncing, determined while smashing, dizzy after a dark slice, joyful at the goal.
 const ex=br*.34,ey=-br*.02,ew=br*.2,eh=br*.25;ctx.lineCap='round';ctx.strokeStyle='#2A2440';ctx.lineWidth=Math.max(1.4,br*.09);
 if(g.bonk>0){for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*ex-ew*.8,ey-eh*.6);ctx.lineTo(s*ex+ew*.3*s,ey);ctx.lineTo(s*ex-ew*.8,ey+eh*.6);ctx.stroke();}}
 else if(g.happy>.6||g.state==='win'){for(const s of [-1,1]){ctx.beginPath();ctx.arc(s*ex,ey+eh*.3,ew*.9,Math.PI*1.1,Math.PI*1.9);ctx.stroke();}}
 else{
  const lid=g.blink>0?.12:smashing?.7:1,look=smashing?.35:.18;
  for(const s of [-1,1]){ctx.save();ctx.translate(s*ex,ey);ctx.scale(1,lid);ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.ellipse(0,0,ew,eh,0,0,7);ctx.fill();
   ctx.fillStyle='#2A2440';ctx.beginPath();ctx.ellipse(0,eh*look,ew*.58,eh*.6,0,0,7);ctx.fill();ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(-ew*.22,eh*(look-.25),ew*.22,0,7);ctx.fill();ctx.restore();}
 }
 ctx.fillStyle='#2A2440';ctx.beginPath();
 if(smashing||g.bonk>0)ctx.ellipse(0,br*.42,br*.1,br*.12,0,0,7);else ctx.arc(0,br*.34,br*(g.happy>0?.2:.13),0,Math.PI);
 ctx.fill();orb(-br*.62,br*.26,br*.12,'rgba(255,255,255,.22)');orb(br*.62,br*.26,br*.12,'rgba(255,255,255,.22)');
 ctx.restore();
 if(g.heat>.02){
  ctx.save();ctx.lineCap='round';ctx.lineWidth=Math.max(3,br*.2);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.arc(cx,y,br*1.7,0,7);ctx.stroke();
  ctx.strokeStyle=g.fire>0?`rgba(255,${(170+Math.sin(time*20)*50)|0},60,.95)`:'#FFFFFF';ctx.beginPath();ctx.arc(cx,y,br*1.7,-Math.PI/2,-Math.PI/2+g.heat*Math.PI*2);ctx.stroke();ctx.restore();
 }
}
function drawTowerDebris(g){
 const t=g.R*TW.thick;
 for(const p of g.debris){
  const q=p.life/p.max,s=g.R*(1-q*.6);
  ctx.save();ctx.globalAlpha=1-q*q;ctx.translate(g.cx+p.x*g.R,towerScreenY(g,p.y));ctx.rotate(p.rot);
  const pts=p.pts.map(v=>v*s);
  ctx.fillStyle=rgbStr(p.rgb,.62);towerPoly(pts.map((v,i)=>i%2?v+t*(1-q*.6):v));ctx.fill();
  ctx.fillStyle=rgbStr(p.rgb,1.02);towerPoly(pts);ctx.fill();ctx.restore();
 }
 for(const w of g.waves){
  const q=w.life/.4,y=towerScreenY(g,w.y),r=g.R*(.45+q*.9);
  ctx.save();ctx.globalAlpha=(1-q)*.5;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=Math.max(1.5,g.R*.04*(1-q));ctx.beginPath();ctx.ellipse(g.cx,y+TW.contact*TW.k*g.R*.4,r,r*TW.k,0,0,7);ctx.stroke();ctx.restore();
 }
}
function drawTowerBokeh(g,time){
 ctx.save();
 for(let i=0;i<9;i++){
  const sp=REDUCED?0:12+i*3,x=((i*.618+.1)%1)*W+Math.sin(time*.3+i)*18,y=H-((time*sp+i*H*.37)%(H+120))+60,r=18+(i%4)*14;
  ctx.globalAlpha=.07+(i%3)*.025;orb(x,y,r,'#FFFFFF');
 }
 ctx.restore();
}
function drawTowerHud(g,time){
 const y=safe.top+34,span=Math.min(W*.34,170),r=21,x0=W/2-span,x1=W/2+span,prog=clamp(g.next/g.rings.length,0,1),main=g.theme.ring[0];
 pill(x0,y-7,x1-x0,14,'rgba(255,255,255,.45)',7);if(prog>0)pill(x0,y-7,Math.max(14,(x1-x0)*prog),14,g.theme.ring[1],7);
 for(const [x,n,on] of [[x0,g.lvl,true],[x1,g.lvl+1,prog>=1]]){
  orb(x,y+2,r+4,'rgba(20,30,60,.16)');orb(x,y,r+4,'#FFFFFF');orb(x,y,r,on?main:'#FFFFFF');label(String(n),x,y+1,n>99?13:17,on?'#FFFFFF':main);
 }
 const pop=1+(REDUCED?0:g.scorePop*.28),size=Math.min(46,W*.12);
 ctx.save();ctx.translate(W/2,y+50+size*.2);ctx.scale(pop,pop);ctx.font=`900 ${size}px ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='rgba(40,30,80,.35)';ctx.fillText(String(g.score),0,4);ctx.lineWidth=5;ctx.strokeStyle='#FFFFFF';ctx.lineJoin='round';ctx.strokeText(String(g.score),0,0);ctx.fillStyle='#FFD93B';ctx.fillText(String(g.score),0,0);ctx.restore();
 if(g.reward>0){const a=clamp(g.reward,0,1);ctx.save();ctx.globalAlpha=a;toy('star',W/2+size*1.2,y+50,14+(1-a)*8,'#FFD77A');ctx.restore();}
}
function drawTowerHint(g,time){
 if(g.state!=='play'||g.idle<2.2)return;
 const a=clamp((g.idle-2.2)*2,0,1)*(REDUCED?1:.75+.25*Math.sin(time*4)),y=H-safe.bottom-40;
 ctx.save();ctx.globalAlpha=a;const w=Math.min(W-130,236);pill(W/2-w/2,y-19,w,38,'rgba(255,255,255,.88)',19);
 const px=W/2-w/2+22,pr=REDUCED?0:(time*1.4)%1;orb(px,y,6,g.theme.ring[0]);ctx.strokeStyle=g.theme.ring[0];ctx.globalAlpha=a*(1-pr);ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,y,6+pr*10,0,7);ctx.stroke();ctx.globalAlpha=a;
 label('Dokun ya da basılı tut',W/2+10,y+1,Math.min(15,w*.065),'#3C4468');ctx.restore();
}
function drawTowerWin(g,time){
 if(g.state!=='win')return;
 const t=clamp(g.winT/.45,0,1),s=REDUCED?1:easeBack(t),y=g.origin-g.R*1.15;
 ctx.save();ctx.globalAlpha=clamp((2.3-g.winT)*3,0,1);ctx.translate(W/2,y);ctx.scale(s,s);ctx.rotate(REDUCED?0:Math.sin(time*5)*.04);
 const size=Math.min(52,W*.13);ctx.font=`900 ${size}px ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='rgba(40,30,80,.3)';ctx.fillText('Süper!',0,5);ctx.lineWidth=7;ctx.strokeStyle='#FFFFFF';ctx.lineJoin='round';ctx.strokeText('Süper!',0,0);ctx.fillStyle=g.theme.ring[0];ctx.fillText('Süper!',0,0);
 for(let i=0;i<5;i++){const a=time*1.6+i*Math.PI*2/5;toy('star',Math.cos(a)*size*2.3,Math.sin(a)*size*.9,size*.22,PALETTE[i]);}
 ctx.restore();
}
function drawTower(time){
 const g=level.adventure;
 ctx.drawImage(g.sky,0,0,W,H);drawTowerBokeh(g,time);
 ctx.save();
 if(g.shake>0)ctx.translate(Math.sin(time*83)*g.shake*6,Math.cos(time*71)*g.shake*3);
 drawTowerStack({cx:g.cx,R:g.R,rings:g.rings,next:g.next,rot:g.rot,dir:g.dir,theme:g.theme,goalBorn:g.goalBorn,screenY:y=>towerScreenY(g,y)},time);
 drawTowerDebris(g);drawTowerBall(g,time);
 ctx.restore();
 if(g.fire>0&&!REDUCED){const a=Math.min(1,g.fire)*.22,vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(255,120,40,0)');vg.addColorStop(1,`rgba(255,120,40,${a})`);ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);}
 drawTowerHud(g,time);drawTowerHint(g,time);drawTowerWin(g,time);
 if(keyboardMode&&document.activeElement===cvs){ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(g.cx,g.items[0].y,g.R*TW.ball*2.4,0,7);ctx.stroke();ctx.setLineDash([]);}
 if(g.flash>0){ctx.fillStyle=`rgba(255,255,255,${g.flash*.85})`;ctx.fillRect(0,0,W,H);}
}
// Menu card preview: the same renderer with a tiny, always-rotating tower and a bouncing ball.
const towerPreviewRings=Array.from({length:5},(_,i)=>{const kinds=new Uint8Array(6);if(i===2){kinds[1]=1;kinds[2]=1;}if(i===4)kinds[4]=1;
 const a=hexRgb(TOWER_THEMES[0].ring[0]),b=hexRgb(TOWER_THEMES[0].ring[1]);return {kinds,rgb:a.map((v,j)=>v+(b[j]-v)*i/4),broken:false,born:1,flash:0,splats:[],offset:i*.2};});
function drawTowerPreview(x,y,s,t){
 const R=s*.3,top=y-s*.02,rot=REDUCED?.4:t*.9;
 ctx.save();ctx.beginPath();ctx.rect(x-s,y-s*.5,s*2,s*.9);ctx.clip();
 drawTowerStack({cx:x,R,rings:towerPreviewRings,next:0,rot,dir:1,theme:TOWER_THEMES[0],goal:false,goalBorn:1,screenY:w=>top+w*R},t);
 const bounce=REDUCED?.4:Math.abs(Math.sin(t*3.2)),br=TW.ball*R*1.25,by=top+TW.contact*TW.k*R-br-bounce*R*.6;
 const sg=ctx.createRadialGradient(x-br*.35,by-br*.4,br*.08,x,by,br);sg.addColorStop(0,'#FFB3D0');sg.addColorStop(.5,TOWER_THEMES[0].ball);sg.addColorStop(1,'#C8245F');
 ctx.fillStyle=sg;ctx.beginPath();ctx.arc(x,by,br,0,7);ctx.fill();orb(x-br*.32,by,br*.14,'#FFFFFF');orb(x+br*.32,by,br*.14,'#FFFFFF');orb(x-br*.32,by+br*.04,br*.08,'#2A2440');orb(x+br*.32,by+br*.04,br*.08,'#2A2440');
 ctx.restore();
}
