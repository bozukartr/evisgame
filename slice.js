/* Meyve ninja · swipe through flying fruit. Spiky balls cost a heart; three hearts lost only restarts the level. */
const SLICE_FRUITS=[
  {name:'karpuz',skin:'#3FA34D',dark:'#2B7A37',rind:'#E6F4C4',flesh:'#FF5468',seed:'#2B2233'},
  {name:'portakal',skin:'#FF9F1C',dark:'#E27C00',rind:'#FFE2A6',flesh:'#FFC04D',seed:null},
  {name:'elma',skin:'#E63946',dark:'#B71F31',rind:'#FFF7E2',flesh:'#FFF0C9',seed:'#6B4424'},
  {name:'kivi',skin:'#9A7550',dark:'#6F5236',rind:'#C9E28A',flesh:'#7CC242',seed:'#1E1E1E'},
  {name:'limon',skin:'#FFDD3C',dark:'#E8BC00',rind:'#FFF8C8',flesh:'#FFEF7A',seed:null},
  {name:'şeftali',skin:'#FFA27A',dark:'#F07A57',rind:'#FFE0BF',flesh:'#FFCB8E',seed:'#A5552F'}
];
ARCADE.slice={
  hint:'Parmağını meyvelerin üstünden kaydır',
  colors:g=>['#FF5468','#FF9AA6','#FFE7C9','#F7A99B'],
  build(g){
    g.goal=Math.min(12+g.lvl*4,50);g.sliced=0;g.hearts=3;g.fruits=[];g.halves=[];g.splats=[];g.trails=new Map();g.spawnT=.6;g.swipe=new Map();g.hurt=0;
  },
  layout(g){g.fr=Math.max(26,Math.min(g.box.w*.1,46));g.grav=Math.max(520,g.box.h*1.05);},
  progress:g=>g.sliced/g.goal,
  decor(q,g){q.fillStyle='rgba(160,105,70,.10)';for(let i=0;i<7;i++){q.fillRect(0,g.box.y+g.box.h*i/7,W,2);}},
  update(g,dt){
    g.hurt=Math.max(0,g.hurt-dt);
    if(g.state==='play'){g.spawnT-=dt;if(g.spawnT<=0){sliceSpawn(g);g.spawnT=Math.max(.55,1.25-g.lvl*.06)*rnd(.8,1.2);}}
    const floor=g.box.y+g.box.h+g.fr*3;
    g.fruits=g.fruits.filter(f=>{f.vy+=g.grav*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.rot+=f.vr*dt;return !(f.vy>0&&f.y>floor);});
    g.halves=g.halves.filter(h=>{h.vy+=g.grav*dt;h.x+=h.vx*dt;h.y+=h.vy*dt;h.rot+=h.vr*dt;h.life+=dt;return h.y<floor+g.fr*2&&h.life<2.5;});
    g.splats=g.splats.filter(s=>(s.life+=dt)<3);
    for(const [id,t] of g.trails){for(const p of t)p.a+=dt;while(t.length&&t[0].a>.16)t.shift();if(!t.length&&!touchPointers.has(id))g.trails.delete(id);}
  },
  down(g,x,y,id){g.trails.set(id,[{x,y,a:0}]);g.swipe.set(id,0);},
  move(g,x,y,id){
    const t=g.trails.get(id);if(!t)return;const last=t[t.length-1]||{x,y};
    if(Math.hypot(x-last.x,y-last.y)>3){for(const f of g.fruits.slice()){if(sliceHit(last,{x,y},f,g.fr))sliceCut(g,f,Math.atan2(y-last.y,x-last.x),id);}}
    t.push({x,y,a:0});if(t.length>24)t.shift();
  },
  up(g,x,y,id){g.swipe.delete(id);},
  cancel(g){g.swipe.clear();},
  tap(g){const f=g.fruits.find(q=>!q.spiky)||g.fruits[0];if(f)sliceCut(g,f,.4,-1);},
  hud(g){const y=safe.top+76;for(let i=0;i<3;i++){const x=W/2-Math.min(W*.34,170)+i*24-4;ctx.save();ctx.globalAlpha=i<g.hearts?1:.35;ctx.translate(x,y);shapePath(ctx,'heart',8);ctx.fillStyle=i<g.hearts?'#FF4F6D':'#FFFFFF';ctx.fill();ctx.restore();}},
  draw(g,time){
    for(const s of g.splats){ctx.save();ctx.globalAlpha=.45*(1-s.life/3);ctx.fillStyle=s.color;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r,s.r*.8,s.rot,0,7);ctx.fill();
      for(let i=0;i<6;i++){const a=s.rot+i*1.05;orb(s.x+Math.cos(a)*s.r*1.35,s.y+Math.sin(a)*s.r*1.1,s.r*(.14+(i%3)*.06),s.color);}ctx.restore();}
    for(const h of g.halves)sliceDrawHalf(h,g.fr);
    for(const f of g.fruits)f.spiky?sliceDrawSpiky(f.x,f.y,g.fr*.9,f.rot,time):sliceDrawFruit(f.kind,f.x,f.y,g.fr,f.rot);
    for(const t of g.trails.values()){
      if(t.length<2)continue;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
      for(let i=1;i<t.length;i++){const k=i/t.length;ctx.strokeStyle=`rgba(140,220,255,${.35*k})`;ctx.lineWidth=16*k;ctx.beginPath();ctx.moveTo(t[i-1].x,t[i-1].y);ctx.lineTo(t[i].x,t[i].y);ctx.stroke();}
      for(let i=1;i<t.length;i++){const k=i/t.length;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=6*k;ctx.beginPath();ctx.moveTo(t[i-1].x,t[i-1].y);ctx.lineTo(t[i].x,t[i].y);ctx.stroke();}
      ctx.restore();
    }
    if(g.hurt>0){ctx.fillStyle=`rgba(255,80,90,${g.hurt*.3})`;ctx.fillRect(0,0,W,H);}
  },
  preview(x,y,s,t){
    const r=s*.17,sway=Math.sin(t*2)*s*.03;
    sliceDrawHalf({kind:0,x:x-r*.9,y:y+sway,rot:-.5-Math.sin(t*2)*.1,side:1,angle:0},r);sliceDrawHalf({kind:0,x:x+r*.9,y:y-sway,rot:.5+Math.sin(t*2)*.1,side:-1,angle:0},r);
    sliceDrawFruit(1,x+s*.3,y-s*.18,r*.6,t);
    ctx.save();ctx.strokeStyle='#FFFFFF';ctx.lineCap='round';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-s*.38,y+s*.22);ctx.lineTo(x+s*.3,y-s*.24);ctx.stroke();ctx.restore();
  }
};
function sliceSpawn(g){
  const b=g.box,n=1+(Math.random()<Math.min(.15+g.lvl*.07,.6)?1:0)+(g.lvl>3&&Math.random()<.25?1:0);
  for(let i=0;i<n;i++){
    const x=b.x+b.w*rnd(.15,.85),h=b.h*rnd(.5,.82),vy=-Math.sqrt(2*g.grav*h),flight=2*-vy/g.grav;
    const spiky=g.lvl>1&&Math.random()<Math.min(.06+g.lvl*.03,.22);
    g.fruits.push({kind:(Math.random()*SLICE_FRUITS.length)|0,spiky,x,y:b.y+b.h+g.fr,vx:(W/2-x)/flight*rnd(.3,.9)+rnd(-30,30),vy,rot:rnd(0,7),vr:rnd(-3,3)});
  }
  if(g.fruits.length>12)g.fruits.splice(0,g.fruits.length-12);
  tone(260,.08,'sine',.06,0,420);
}
function sliceHit(a,b,f,r){
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=clamp(((f.x-a.x)*dx+(f.y-a.y)*dy)/l,0,1);
  return Math.hypot(a.x+dx*t-f.x,a.y+dy*t-f.y)<r*1.05;
}
function sliceCut(g,f,angle,id){
  g.fruits.splice(g.fruits.indexOf(f),1);
  if(f.spiky){
    g.hearts--;g.hurt=1;g.shake=REDUCED?0:1;tone(150,.25,'sawtooth',.08,0,90);tone(110,.3,'sine',.2);buzz([30,40,30]);
    arcadeBurst(g,f.x,f.y,'#6B4E8C',14,{gravity:300});arcadeText(g,'Ay!',f.x,f.y-30,'#FF6B6B',30);
    if(g.hearts<=0)arcadeRetry(g);return;
  }
  const fr=SLICE_FRUITS[f.kind],nx=-Math.sin(angle),ny=Math.cos(angle);
  for(const side of [1,-1])g.halves.push({kind:f.kind,x:f.x+nx*side*4,y:f.y+ny*side*4,vx:f.vx*.4+nx*side*rnd(70,120),vy:Math.min(f.vy,0)*.3-rnd(40,120)+ny*side*60,rot:angle,vr:side*rnd(2,5),side,life:0});
  if(g.halves.length>24)g.halves.splice(0,g.halves.length-24);
  g.splats.push({x:f.x,y:f.y,r:g.fr*rnd(.7,1),rot:rnd(0,3),color:fr.flesh,life:0});if(g.splats.length>10)g.splats.shift();
  arcadeBurst(g,f.x,f.y,fr.flesh,14,{kind:'drop',min:60,max:240,gravity:600});arcadeRing(g,f.x,f.y,g.fr*.7,'#FFFFFF');
  g.sliced++;arcadeScore(g,1);arcadeReward(g);
  const combo=id>=0?(g.swipe.get(id)||0)+1:1;if(id>=0)g.swipe.set(id,combo);
  if(combo>=3){arcadeScore(g,combo);arcadeText(g,`Kombo x${combo}!`,f.x,f.y-40,'#FFD93B',26);}
  tone(PENTA[(g.sliced+combo)%6]*1.5,.09,'triangle',.14,0,PENTA[(g.sliced+combo)%6]*2.2);tone(1800,.04,'sine',.03);buzz(6);
  if(g.sliced>=g.goal)arcadeWin(g);
}
function sliceDrawFruit(kind,x,y,r,rot){
  const f=SLICE_FRUITS[kind],lemon=kind===4;
  ctx.save();ctx.translate(x,y);ctx.rotate(rot*.25);
  ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#402030';ctx.beginPath();ctx.ellipse(r*.12,r*.2,r*(lemon?1.15:1),r*.95,0,0,7);ctx.fill();ctx.restore();
  const gr=ctx.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.05);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.25,f.skin);gr.addColorStop(1,f.dark);
  ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,0,r*(lemon?1.15:1),r*(kind===2?.95:1),0,0,7);ctx.fill();
  if(kind===0){ctx.save();ctx.clip();ctx.strokeStyle=f.dark;ctx.lineWidth=r*.16;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.42,-r);ctx.quadraticCurveTo(i*r*.55,0,i*r*.42,r);ctx.stroke();}ctx.restore();}
  if(kind===1)for(let i=0;i<9;i++)orb(Math.cos(i*2.4)*r*.55,Math.sin(i*2.4)*r*.55,r*.04,'rgba(180,90,0,.25)');
  if(kind===3)for(let i=0;i<14;i++)orb(Math.cos(i*1.7)*r*.7,Math.sin(i*1.7)*r*.7,r*.035,'rgba(60,40,20,.35)');
  if(kind===5){ctx.strokeStyle='rgba(200,80,60,.35)';ctx.lineWidth=r*.06;ctx.beginPath();ctx.moveTo(0,-r*.9);ctx.quadraticCurveTo(r*.25,0,0,r*.9);ctx.stroke();}
  if(kind===2||kind===5){ctx.strokeStyle='#6B4424';ctx.lineWidth=r*.1;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.lineTo(r*.08,-r*1.15);ctx.stroke();ctx.fillStyle='#4CAF50';ctx.beginPath();ctx.ellipse(r*.32,-r*1.02,r*.3,r*.13,-.4,0,7);ctx.fill();}
  orb(-r*.38,-r*.42,r*.18,'rgba(255,255,255,.55)');
  // Cute face keeps the fruit friendly for small players.
  orb(-r*.3,r*.02,r*.1,'#2A2233');orb(r*.3,r*.02,r*.1,'#2A2233');orb(-r*.27,-r*.02,r*.035,'#FFFFFF');orb(r*.33,-r*.02,r*.035,'#FFFFFF');
  ctx.strokeStyle='#2A2233';ctx.lineWidth=r*.07;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,r*.18,r*.16,.15*Math.PI,.85*Math.PI);ctx.stroke();
  orb(-r*.52,r*.24,r*.1,'rgba(255,120,140,.35)');orb(r*.52,r*.24,r*.1,'rgba(255,120,140,.35)');
  ctx.restore();
}
function sliceDrawHalf(h,r){
  const f=SLICE_FRUITS[h.kind];
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.rot);if(h.side<0)ctx.scale(1,-1);
  ctx.fillStyle=f.skin;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI);ctx.closePath();ctx.fill();
  ctx.fillStyle=f.rind;ctx.beginPath();ctx.arc(0,0,r*.9,0,Math.PI);ctx.closePath();ctx.fill();
  ctx.fillStyle=f.flesh;ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI);ctx.closePath();ctx.fill();
  if(h.kind===1||h.kind===4){ctx.strokeStyle=f.rind;ctx.lineWidth=r*.06;for(let i=1;i<6;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r*.78,Math.sin(a)*r*.78);ctx.stroke();}}
  if(h.kind===3){orb(0,r*.08,r*.2,'#F2F7C9');for(let i=0;i<8;i++){const a=.2+i*.36;orb(Math.cos(a)*r*.42,Math.sin(a)*r*.42,r*.045,f.seed);}}
  else if(f.seed)for(let i=0;i<5;i++){const a=.35+i*.6;ctx.save();ctx.translate(Math.cos(a)*r*.48,Math.sin(a)*r*.48);ctx.rotate(a);ctx.fillStyle=f.seed;ctx.beginPath();ctx.ellipse(0,0,r*.07,r*.04,0,0,7);ctx.fill();ctx.restore();}
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-r*.78,-r*.03,r*1.56,r*.06);
  ctx.restore();
}
function sliceDrawSpiky(x,y,r,rot,time){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle='#5B3F7A';ctx.beginPath();
  for(let i=0;i<24;i++){const a=i*Math.PI/12,rr=i%2?r*.78:r*1.12;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();
  const gr=ctx.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r*.8);gr.addColorStop(0,'#A57FD1');gr.addColorStop(1,'#5B3F7A');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r*.76,0,7);ctx.fill();
  ctx.rotate(-rot);ctx.strokeStyle='#FFFFFF';ctx.lineWidth=r*.1;ctx.lineCap='round';
  for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*r*.42,-r*.2);ctx.lineTo(s*r*.16,-r*.05);ctx.stroke();}
  ctx.beginPath();ctx.arc(0,r*.32,r*.18,1.15*Math.PI,1.85*Math.PI);ctx.stroke();
  ctx.restore();
}
