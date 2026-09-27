/* Arcade (4+): quick hypercasual games that share one HUD, level flow, particles and a gentle retry.
   Each game registers {hint,colors,build,layout,update,draw,progress,down,move,up,tap,cancel,preview}. */
const ARCADE={};
const ARCADE_KEY='evisgame-arcade-v1';
let arcadeSaves={};
try{arcadeSaves=JSON.parse(localStorage.getItem(ARCADE_KEY)||'{}')||{};}catch(e){arcadeSaves={};}
const arcadeLevel=type=>clamp((arcadeSaves[type]&&arcadeSaves[type].lvl)|0,1,999);
function arcadeStore(type,lvl,score){
  const old=arcadeSaves[type]||{};arcadeSaves[type]={lvl,best:Math.max(old.best|0,score|0)};
  try{localStorage.setItem(ARCADE_KEY,JSON.stringify(arcadeSaves));}catch(e){}
}
function buildArcade(type){
  const def=ARCADE[type];
  const g={arcade:def,free:true,total:sensoryTotals[type]||0,focus:0,effects:[],flights:[],reward:0,items:[{id:0,x:W/2,y:H/2,r:40}],
    lvl:arcadeLevel(type),score:0,scoreStart:0,scorePop:0,state:'play',stateT:0,flash:0,shake:0,idle:0,fx:[],texts:[],box:{x:0,y:0,w:W,h:H}};
  level={type,adventure:g,pieces:[],targets:[],cheered:false};resetPhase();phase='play';
  def.build(g);layoutArcade();
  cvs.setAttribute('aria-label',`${GAME_LABELS[type]}. ${def.hint}. Seviye ${g.lvl}.`);
}
function layoutArcade(){
  const g=level.adventure,uh=H-safe.top-safe.bottom;
  g.hud=safe.top+Math.min(108,Math.max(84,uh*.17));
  g.box={x:safe.left+12,y:g.hud,w:W-safe.left-safe.right-24,h:Math.max(120,H-safe.bottom-70-g.hud)};
  unit=Math.min(W,uh)*.08;g.arcade.layout(g);buildArcadeSky(g);
}
function buildArcadeSky(g){
  const [,,top,bottom]=g.arcade.colors(g),c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(W*DPR));c.height=Math.max(1,Math.round(H*DPR));const q=c.getContext('2d');q.scale(DPR,DPR);
  const lg=q.createLinearGradient(0,0,0,H);lg.addColorStop(0,top);lg.addColorStop(1,bottom);q.fillStyle=lg;q.fillRect(0,0,W,H);
  const glow=q.createRadialGradient(W/2,H*.25,0,W/2,H*.25,Math.max(W,H)*.7);glow.addColorStop(0,'rgba(255,255,255,.3)');glow.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=glow;q.fillRect(0,0,W,H);
  q.fillStyle='rgba(255,255,255,.08)';
  for(let i=0;i<26;i++){const x=(i*.618%1)*W,y=(i*.377%1)*H,r=6+(i%5)*9;q.beginPath();q.arc(x,y,r,0,7);q.fill();}
  if(g.arcade.decor)g.arcade.decor(q,g);
  g.sky=c;
}
function arcadeRestart(g,next){
  if(next)g.lvl++;else g.score=g.scoreStart;
  g.state='play';g.stateT=0;g.scoreStart=g.score;g.fx.length=0;g.texts.length=0;g.flash=next?1:.6;
  g.arcade.build(g);g.arcade.layout(g);buildArcadeSky(g);
  cvs.setAttribute('aria-label',`${GAME_LABELS[level.type]}. ${g.arcade.hint}. Seviye ${g.lvl}.`);
}
function arcadeWin(g){
  if(g.state!=='play')return;g.state='win';g.stateT=0;arcadeStore(level.type,g.lvl+1,g.score);
  sndWin();buzz([20,40,20]);if(!REDUCED)confetti(90);
}
// Losing is never a dead end: a friendly "again" and the same level rebuilds in a moment.
function arcadeRetry(g){
  if(g.state!=='play')return;g.state='retry';g.stateT=0;arcadeStore(level.type,g.lvl,g.score);
  tone(392,.16,'sine',.16);tone(330,.22,'sine',.14,.14);buzz(18);
}
function arcadeReward(g,n=1){
  for(let i=0;i<n;i++){g.total++;if(g.total%12===0){g.reward=1.4;stars++;levelIndex++;modeRounds[level.type]=(modeRounds[level.type]||0)+1;saveProgress();}}
  sensoryTotals[level.type]=g.total;
}
function arcadeScore(g,n){g.score+=n;g.scorePop=1;}
/* ---------- shared particles and floating words ---------- */
function arcadeBurst(g,x,y,color,n=12,opts={}){
  const count=REDUCED?Math.min(3,n):n;
  for(let i=0;i<count;i++){const a=rnd(0,Math.PI*2),sp=rnd(opts.min||80,opts.max||260);
    g.fx.push({kind:opts.kind||'dot',x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(opts.lift||60),g:opts.gravity??520,r:rnd(opts.r0||3,opts.r1||7),color,life:0,max:rnd(.45,.85),rot:rnd(0,7),vr:rnd(-8,8)});}
  if(g.fx.length>160)g.fx.splice(0,g.fx.length-160);
}
function arcadeRing(g,x,y,r,color='#FFFFFF'){g.fx.push({kind:'ring',x,y,vx:0,vy:0,g:0,r,color,life:0,max:.45});if(g.fx.length>160)g.fx.shift();}
function arcadeText(g,text,x,y,color='#5B4FC7',size=26){g.texts.push({text,x,y,color,size,life:0,max:1.1});if(g.texts.length>6)g.texts.shift();}
function updateArcadeFx(g,dt){
  g.fx=g.fx.filter(p=>{p.life+=dt;if(!REDUCED){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=(p.vr||0)*dt;}return p.life<p.max;});
  g.texts=g.texts.filter(t=>(t.life+=dt)<t.max);
}
function drawArcadeFx(g){
  for(const p of g.fx){
    const q=p.life/p.max;ctx.save();ctx.globalAlpha=1-q*q;
    if(p.kind==='ring'){ctx.strokeStyle=p.color;ctx.lineWidth=4*(1-q)+1;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+q*.9),0,7);ctx.stroke();}
    else if(p.kind==='star'){ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.color;starPath(ctx,p.r*(1-q*.4));ctx.fill();}
    else if(p.kind==='drop'){orb(p.x,p.y,p.r*(1-q*.5),p.color);orb(p.x-p.r*.3,p.y-p.r*.3,p.r*.3,'rgba(255,255,255,.6)');}
    else orb(p.x,p.y,p.r*(1-q*.5),p.color);
    ctx.restore();
  }
  for(const t of g.texts){
    const q=t.life/t.max,s=REDUCED?1:Math.min(1,easeBack(clamp(q*4,0,1)));
    ctx.save();ctx.globalAlpha=q>.7?(1-q)/.3:1;ctx.translate(t.x,t.y-q*40);ctx.scale(s,s);outlinedText(t.text,0,0,t.size,t.color);ctx.restore();
  }
}
function outlinedText(text,x,y,size,color,stroke='#FFFFFF'){
  ctx.font=`900 ${size}px ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
  ctx.fillStyle='rgba(40,30,80,.28)';ctx.fillText(text,x,y+size*.09);ctx.lineWidth=size*.2;ctx.strokeStyle=stroke;ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);
}
/* ---------- loop ---------- */
function updateArcade(dt){
  const g=level.adventure;
  g.reward=Math.max(0,g.reward-dt);g.scorePop=Math.max(0,g.scorePop-dt*3.5);g.flash=Math.max(0,g.flash-dt*2.2);g.shake=Math.max(0,g.shake-dt*3);
  g.idle=touchPointers.size?0:g.idle+dt;g.stateT+=dt;
  g.arcade.update(g,dt);updateArcadeFx(g,dt);
  if(g.state==='win'&&g.stateT>2.3)arcadeRestart(g,true);
  else if(g.state==='retry'&&g.stateT>1.5)arcadeRestart(g,false);
}
function drawArcadeHud(g,time){
  const [main,light]=g.arcade.colors(g),y=safe.top+32,span=Math.min(W*.34,170),r=20,x0=W/2-span,x1=W/2+span,prog=clamp(g.arcade.progress(g),0,1);
  pill(x0,y-7,x1-x0,14,'rgba(255,255,255,.5)',7);if(prog>0)pill(x0,y-7,Math.max(14,(x1-x0)*prog),14,light,7);
  for(const [x,n,on] of [[x0,g.lvl,true],[x1,g.lvl+1,prog>=1]]){
    orb(x,y+2,r+4,'rgba(20,30,60,.16)');orb(x,y,r+4,'#FFFFFF');orb(x,y,r,on?main:'#FFFFFF');label(String(n),x,y+1,n>99?13:17,on?'#FFFFFF':main);
  }
  const pop=1+(REDUCED?0:g.scorePop*.25),size=Math.min(40,W*.1);
  ctx.save();ctx.translate(W/2,y+44);ctx.scale(pop,pop);outlinedText(String(g.score),0,0,size,'#FFD93B');ctx.restore();
  if(g.reward>0){const a=clamp(g.reward,0,1);ctx.save();ctx.globalAlpha=a;toy('star',W/2+size*1.3,y+44,13+(1-a)*8,'#FFD77A');ctx.restore();}
  if(g.arcade.hud)g.arcade.hud(g,time);
}
function drawArcadeOverlay(g,time){
  if(g.state==='play'&&g.idle>2.6){
    const a=clamp((g.idle-2.6)*2,0,1)*(REDUCED?1:.75+.25*Math.sin(time*4)),y=H-safe.bottom-40,w=Math.min(W-130,250),[main]=g.arcade.colors(g);
    ctx.save();ctx.globalAlpha=a;pill(W/2-w/2,y-19,w,38,'rgba(255,255,255,.9)',19);orb(W/2-w/2+20,y,6,main);
    label(g.arcade.hint,W/2+8,y+1,Math.min(14,(w-40)/g.arcade.hint.length*1.9),'#3C4468');ctx.restore();
  }
  if(g.state==='win'||g.state==='retry'){
    const win=g.state==='win',t=clamp(g.stateT/.4,0,1),s=REDUCED?1:easeBack(t),out=clamp(((win?2.3:1.5)-g.stateT)*3,0,1);
    ctx.save();ctx.globalAlpha=out*.25;ctx.fillStyle=win?'#FFFFFF':'#2A2F55';ctx.fillRect(0,0,W,H);ctx.restore();
    ctx.save();ctx.globalAlpha=out;ctx.translate(W/2,H*.42);ctx.scale(s,s);ctx.rotate(REDUCED?0:Math.sin(time*5)*.04);
    const size=Math.min(54,W*.13),[main]=g.arcade.colors(g);
    outlinedText(win?'Süper!':'Tekrar!',0,0,size,win?main:'#FF8A5B');
    if(win)for(let i=0;i<5;i++){const a=time*1.6+i*Math.PI*2/5;toy('star',Math.cos(a)*size*2.2,Math.sin(a)*size*.9,size*.22,PALETTE[i]);}
    else{label('Hadi bir daha deneyelim',0,size*.95,15,'#FFFFFF');}
    ctx.restore();
  }
  if(g.flash>0){ctx.fillStyle=`rgba(255,255,255,${g.flash*.8})`;ctx.fillRect(0,0,W,H);}
}
function drawArcade(time){
  const g=level.adventure;
  ctx.drawImage(g.sky,0,0,W,H);
  ctx.save();if(g.shake>0&&!REDUCED)ctx.translate(Math.sin(time*83)*g.shake*7,Math.cos(time*71)*g.shake*4);
  g.arcade.draw(g,time);drawArcadeFx(g);ctx.restore();
  drawArcadeHud(g,time);drawArcadeOverlay(g,time);
}
/* ---------- input glue (called from the shared touch handlers) ---------- */
function arcadeDown(e){
  const g=level.adventure;touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,at:time,arcade:true});g.idle=0;
  try{cvs.setPointerCapture(e.pointerId);}catch(err){}
  if(g.state==='play'&&g.arcade.down)g.arcade.down(g,e.clientX,e.clientY,e.pointerId);
}
function arcadeMove(e,d){
  const g=level.adventure;if(e.preventDefault)e.preventDefault();d.x=e.clientX;d.y=e.clientY;g.idle=0;
  if(g.state==='play'&&g.arcade.move)g.arcade.move(g,e.clientX,e.clientY,e.pointerId);
}
function arcadeUp(e){
  const g=level.adventure,cancelled=!!e.cancelled||e.type==='pointercancel'||e.type==='lostpointercapture';
  if(g.arcade.up)g.arcade.up(g,e.clientX,e.clientY,e.pointerId,cancelled||g.state!=='play');
}
function cancelArcadeTouches(){const g=level&&level.adventure;if(g&&g.arcade&&g.arcade.cancel)g.arcade.cancel(g);}
function arcadeTap(x,y){const g=level.adventure;g.idle=0;if(g.state==='play'&&g.arcade.tap)g.arcade.tap(g,x,y);}
function drawArcadePreview(kind,x,y,s,t){ARCADE[kind].preview(x,y,s,REDUCED?0:t);}
