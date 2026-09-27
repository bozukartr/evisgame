/* Uçan kuş · tap to flap through candy pillars. Wide gaps, gentle speed and gap heights that never jump too far.
   Positions are fractions of the play area, so the course survives rotation unchanged. */
ARCADE.flappy={
  hint:'Dokun: civciv kanat çırpsın',
  colors:g=>['#FFB020','#FFD979','#A4E0FF','#E3F6FF'],
  build(g){
    g.goal=Math.min(8+g.lvl*3,30);g.passed=0;g.gapH=Math.max(.27,.38-g.lvl*.012);g.speed=Math.min(.3+g.lvl*.018,.48);
    g.bird={y:.42,vy:0,rot:0,flap:0};g.pipes=[];g.stars=[];g.started=false;g.crashed=false;g.scroll=0;g.lastGap=.45;g.spawned=0;
  },
  layout(g){const b=g.box;g.br=Math.min(b.w,b.h)*.045;g.pw=.16;g.ground=.9;},
  progress:g=>g.passed/g.goal,
  down(g){flappyFlap(g);},
  tap(g){flappyFlap(g);},
  update(g,dt){
    const b=g.bird;b.flap=Math.max(0,b.flap-dt*4);
    if(g.state!=='play'){if(g.crashed){b.vy+=2.4*dt;b.y=Math.min(g.ground-.03,b.y+b.vy*dt);b.rot=Math.min(1.6,b.rot+dt*6);}return;}
    if(!g.started){b.y=.42+(REDUCED?0:Math.sin(g.stateT*3)*.02);g.scroll+=g.speed*dt*.5;return;}
    g.scroll+=g.speed*dt;b.vy+=2.2*dt;b.y+=b.vy*dt;b.rot=clamp(b.vy*1.3,-.5,1.2);
    if(b.y<.03){b.y=.03;b.vy=0;}
    const last=g.pipes[g.pipes.length-1];
    if(g.spawned<g.goal&&(!last||last.x<1.1-.58)){const y=clamp(g.lastGap+rnd(-.22,.22),.12+g.gapH/2,g.ground-.08-g.gapH/2);g.lastGap=y;g.pipes.push({x:1.15,y,passed:false,hue:(g.spawned*47)%360});g.spawned++;if(Math.random()<.5)g.stars.push({x:1.15+.29,y:clamp(y+rnd(-.1,.1),.1,g.ground-.1)});}
    for(const p of g.pipes)p.x-=g.speed*dt;for(const s of g.stars)s.x-=g.speed*dt;
    g.pipes=g.pipes.filter(p=>p.x>-.3);
    const bx=.28,box=g.box,px2=v=>v*box.w,py2=v=>v*box.h,r=g.br*.78;
    for(const p of g.pipes){
      if(!p.passed&&p.x+g.pw/2<bx){p.passed=true;g.passed++;arcadeScore(g,1);arcadeReward(g);note(PENTA[g.passed%6]*2,0,.28);if(g.passed>=g.goal){arcadeWin(g);return;}}
      const dx=Math.abs(px2(bx-p.x))-px2(g.pw/2);if(dx>r)continue;
      const top=py2(p.y-g.gapH/2),bot=py2(p.y+g.gapH/2),by=py2(b.y);
      if(dx<=0?(by-r<top||by+r>bot):(by<top?Math.hypot(dx,top-by)<r:by>bot?Math.hypot(dx,by-bot)<r:false)){flappyCrash(g);return;}
    }
    g.stars=g.stars.filter(s=>{if(Math.hypot(px2(s.x-bx),py2(s.y-b.y))<g.br*1.6){arcadeScore(g,2);arcadeBurst(g,box.x+px2(s.x),box.y+py2(s.y),'#FFD23F',8,{kind:'star',gravity:200});tone(1046,.08,'sine',.1);return false;}return s.x>-.1;});
    if(b.y>g.ground-.03){b.y=g.ground-.03;flappyCrash(g);}
  },
  draw(g,time){
    const B=g.box,X=v=>B.x+v*B.w,Y=v=>B.y+v*B.h;
    ctx.save();ctx.beginPath();roundRectPath(ctx,B.x,B.y,B.w,B.h,24);ctx.clip();
    const sky=ctx.createLinearGradient(0,B.y,0,B.y+B.h);sky.addColorStop(0,'#8ED4FF');sky.addColorStop(1,'#E8F8FF');ctx.fillStyle=sky;ctx.fillRect(B.x,B.y,B.w,B.h);
    orb(X(.82),Y(.14),B.w*.07,'#FFF0B0');
    for(let i=0;i<4;i++){const span=1.6,k=((i*.4-g.scroll*.12)%span+span)%span-.3;cloud(X(k),Y(.12+(i%3)*.1),.8+(i%2)*.3,.8);}
    for(const [f,col,hgt] of [[.25,'#BFE5C8',.2],[.5,'#8FD1A4',.13]]){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(B.x,Y(g.ground));for(let i=0;i<=40;i++){const u=i/40;ctx.lineTo(X(u),Y(g.ground-hgt*(.5+.5*Math.sin((u+g.scroll*f)*7+f*9))));}ctx.lineTo(B.x+B.w,Y(g.ground));ctx.fill();}
    for(const p of g.pipes){
      const x0=X(p.x-g.pw/2),w=g.pw*B.w,top=Y(p.y-g.gapH/2),bot=Y(p.y+g.gapH/2),c=`hsl(${p.hue},80%,68%)`;
      for(const [y0,h] of [[B.y-10,top-B.y+10],[bot,Y(g.ground)-bot]]){ctx.save();ctx.beginPath();roundRectPath(ctx,x0,y0,w,h,w*.25);ctx.clip();ctx.fillStyle='#FFFFFF';ctx.fillRect(x0,y0,w,h);
        ctx.fillStyle=c;for(let s=-4;s<h/w+4;s++){ctx.beginPath();ctx.moveTo(x0,y0+s*w*.6);ctx.lineTo(x0+w,y0+s*w*.6-w*.4);ctx.lineTo(x0+w,y0+s*w*.6-w*.1);ctx.lineTo(x0,y0+s*w*.6+w*.3);ctx.fill();}
        ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x0+w*.12,y0,w*.14,h);ctx.restore();}
      pill(x0-w*.12,top-w*.34,w*1.24,w*.36,c,w*.18);pill(x0-w*.12,bot,w*1.24,w*.36,c,w*.18);
    }
    for(const s of g.stars)toy('star',X(s.x),Y(s.y)+(REDUCED?0:Math.sin(time*4+s.x*9)*3),10,'#FFD23F');
    ctx.fillStyle='#7ED07F';ctx.fillRect(B.x,Y(g.ground),B.w,B.h);ctx.fillStyle='#E7C28B';ctx.fillRect(B.x,Y(g.ground)+10,B.w,B.h);
    ctx.fillStyle='rgba(255,255,255,.35)';const off=g.scroll%.09;for(let i=0;i<13;i++)ctx.fillRect(X(i*.09-off),Y(g.ground)+3,B.w*.04,4);
    const b=g.bird;flappyBird(X(.28),Y(b.y),g.br,b.rot,b.flap,time,g.crashed);
    if(!g.started&&g.state==='play'){const p=REDUCED?0:(time*1.4)%1;ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(X(.28),Y(b.y),g.br*(1.4+p*1.2),0,7);ctx.stroke();ctx.restore();}
    ctx.restore();
  },
  preview(x,y,s,t){
    const w=s*.12,gy=y+Math.sin(t)*s*.05;for(const [px,c] of [[x+s*.18,'#FF8FB8'],[x+s*.42,'#7FD6FF']]){pill(px-w/2,y-s*.5,w,gy-s*.14-(y-s*.5),c,w*.3);pill(px-w/2,gy+s*.14,w,s*.3,c,w*.3);}
    flappyBird(x-s*.2,y+Math.sin(t*3)*s*.1,s*.09,Math.cos(t*3)*.3,Math.abs(Math.sin(t*6)),t,false);
  }
};
function flappyFlap(g){if(g.state!=='play')return;g.started=true;g.bird.vy=-.72;g.bird.flap=1;tone(660,.07,'sine',.08,0,880);}
function flappyCrash(g){g.crashed=true;g.bird.vy=-.4;g.shake=REDUCED?0:.8;tone(160,.2,'triangle',.12,0,90);arcadeBurst(g,g.box.x+.28*g.box.w,g.box.y+g.bird.y*g.box.h,'#FFE27A',10,{kind:'star',gravity:300});arcadeRetry(g);}
function flappyBird(x,y,r,rot,flap,time,crashed){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);
  ctx.fillStyle='#FFB020';ctx.beginPath();ctx.moveTo(-r*.85,-r*.1);ctx.lineTo(-r*1.35,-r*.35);ctx.lineTo(-r*1.25,r*.15);ctx.fill();
  const gr=ctx.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);gr.addColorStop(0,'#FFF4B8');gr.addColorStop(1,'#FFCC2E');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.fillStyle='#FFE58A';ctx.save();ctx.translate(-r*.15,r*.15);ctx.rotate(-.6+flap*1.3);ctx.beginPath();ctx.ellipse(-r*.2,0,r*.5,r*.28,0,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle='#FF8A2E';ctx.beginPath();ctx.moveTo(r*.78,-r*.05);ctx.lineTo(r*1.3,r*.08);ctx.lineTo(r*.78,r*.25);ctx.fill();
  if(crashed){ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1.2,r*.1);ctx.beginPath();ctx.moveTo(r*.25,-r*.45);ctx.lineTo(r*.55,-r*.15);ctx.moveTo(r*.55,-r*.45);ctx.lineTo(r*.25,-r*.15);ctx.stroke();}
  else{orb(r*.4,-r*.3,r*.24,'#FFFFFF');orb(r*.48,-r*.28,r*.13,'#2A2233');orb(r*.52,-r*.34,r*.05,'#FFFFFF');}
  orb(r*.3,r*.25,r*.13,'rgba(255,120,120,.45)');orb(0,-r*.95,r*.12,'#FFCC2E');orb(r*.12,-r*1.05,r*.1,'#FFCC2E');
  ctx.restore();
}
