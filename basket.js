/* Basket at · pull back and release to shoot; a dotted arc previews the throw.
   The rim is two small circles and the board a segment, so bank shots and rim rolls behave like the real thing. */
ARCADE.basket={
  hint:'Geri çek, bırak: potaya at',
  colors:g=>['#FF7A1A','#FFB36B','#FFE9D2','#F3C49D'],
  build(g){g.goal=Math.min(4+g.lvl,14);g.made=0;g.hearts=3;g.streak=0;g.side=Math.random()<.5?-1:1;g.phase=0;g.ball=null;g.aim=null;g.net=0;g.startU=.5;},
  layout(g){
    const b=g.box;g.r=clamp(Math.min(b.w,b.h)*.06,15,28);g.grav=b.h*2.1;g.floor=b.y+b.h-10;
    g.rw=g.r*(g.lvl<3?3.6:g.lvl<6?3.1:2.8);g.hy=b.y+b.h*.3;basketPlace(g);if(!g.ball||!g.ball.live)basketReset(g);
  },
  decor(q,g){
    const f=g.floor,b=g.box;const wood=q.createLinearGradient(0,f,0,H);wood.addColorStop(0,'#E8B27A');wood.addColorStop(1,'#C98B55');q.fillStyle=wood;q.fillRect(0,f,W,H-f);
    q.strokeStyle='rgba(120,70,30,.25)';q.lineWidth=2;for(let x=0;x<W;x+=46){q.beginPath();q.moveTo(x,f);q.lineTo(x-20,H);q.stroke();}
    q.strokeStyle='rgba(255,255,255,.55)';q.lineWidth=3;q.beginPath();q.ellipse(W/2,f+30,b.w*.32,26,0,Math.PI,0);q.stroke();
  },
  progress:g=>g.made/g.goal,
  hud(g){drawArcadeHearts(g.hearts);},
  down(g,x,y,id){if(g.ball&&!g.ball.live&&!g.aim)g.aim={id,x0:x,y0:y,x,y};},
  move(g,x,y,id){if(g.aim&&g.aim.id===id){g.aim.x=x;g.aim.y=y;}},
  up(g,x,y,id,cancelled){const a=g.aim;if(!a||a.id!==id)return;g.aim=null;if(cancelled)return;const v=basketAimVelocity(g,a);if(v)basketLaunch(g,v.x,v.y);},
  cancel(g){g.aim=null;},
  tap(g){ // keyboard/assist: a clean arc that drops through the rim
    // Aim where the (possibly moving) hoop will be when the ball arrives.
    const b=g.ball;if(!b||b.live)return;const dy=g.hy-g.r*.2-b.y,T=Math.sqrt(-2*dy/g.grav)*2;basketLaunch(g,(basketHoopX(g,g.phase+T)-b.x)/T,dy/T-.5*g.grav*T);
  },
  update(g,dt){
    g.phase+=dt;g.net=Math.max(0,g.net-dt*2.5);basketPlace(g);
    const b=g.ball;if(!b)return;b.pop=Math.max(0,b.pop-dt*4);
    if(!b.live)return;
    const n=4,h=dt/n;
    for(let s=0;s<n;s++){
      const py=b.y;b.vy+=g.grav*h;
      // Kid-friendly assist: a ball dropping toward the hoop is gently drawn to its centre.
      if(b.vy>0&&b.y<g.hy&&b.y>g.hy-g.r*5&&Math.abs(b.x-g.hx)<g.rw*.9)b.vx+=(g.hx-b.x)*9*h;
      b.x+=b.vx*h;b.y+=b.vy*h;b.rot+=b.vx*h/g.r;
      for(const px of [g.hx-g.rw/2,g.hx+g.rw/2]){const dx=b.x-px,dy=b.y-g.hy,d=Math.hypot(dx,dy),rr=g.r*.16;
        if(d<g.r+rr&&d>0){const nx=dx/d,ny=dy/d,dot=b.vx*nx+b.vy*ny;b.x=px+nx*(g.r+rr);b.y=g.hy+ny*(g.r+rr);if(dot<0){b.vx-=1.55*dot*nx;b.vy-=1.55*dot*ny;}if(!b.touched||Math.abs(dot)>80)tone(210,.07,'triangle',.08);b.touched=true;}}
      const bx=g.hx+g.side*(g.rw/2+g.r*.55);
      if(b.y>g.hy-g.r*3.6&&b.y<g.hy+g.r*.8&&Math.abs(b.x-bx)<g.r&&(b.x-bx)*g.side<0){b.x=bx-g.side*g.r;b.vx=-Math.abs(b.vx)*.6*g.side;b.touched=true;tone(160,.08,'sine',.1);}
      if(!b.scored&&py<g.hy&&b.y>=g.hy&&b.vy>0&&b.x>g.hx-g.rw/2+g.r*.2&&b.x<g.hx+g.rw/2-g.r*.2)basketScore(g,b);
      if(b.x<g.box.x+g.r){b.x=g.box.x+g.r;b.vx=Math.abs(b.vx)*.6;}if(b.x>g.box.x+g.box.w-g.r){b.x=g.box.x+g.box.w-g.r;b.vx=-Math.abs(b.vx)*.6;}
      if(b.y+g.r>g.floor){b.y=g.floor-g.r;if(b.vy>120)tone(120,.06,'sine',.08);b.vy=-b.vy*.55;b.vx*=.82;b.bounces++;}
    }
    b.t+=dt;
    if((b.scored&&b.t-b.scoredAt>.9)||(!b.scored&&(b.t>3.2||(b.bounces>0&&Math.abs(b.vy)<90&&b.y+g.r>=g.floor-2)))){
      if(!b.scored){g.hearts--;g.streak=0;arcadeText(g,'Iska',b.x,b.y-40,'#FF6B6B',22);sndSoft();if(g.hearts<=0){b.live=false;arcadeRetry(g);return;}}
      basketReset(g);
    }
  },
  draw(g,time){
    const hx=g.hx,hy=g.hy,rw=g.rw,r=g.r,bx=hx+g.side*(rw/2+r*.55),b=g.ball;
    ctx.fillStyle='#7B8794';ctx.fillRect(bx+g.side*r*.9-4,hy-r*2,8,g.floor-hy+r*2);
    ctx.save();ctx.shadowColor='rgba(60,40,20,.25)';ctx.shadowBlur=10;const bw=r*.5,bh=r*4.6;pill(bx-bw/2,hy-r*3.7,bw,bh,'#FFFFFF',6);ctx.restore();
    ctx.strokeStyle='#FF5A4E';ctx.lineWidth=3;ctx.strokeRect(bx-bw/2+3,hy-r*2.1,bw-6,r*1.6);
    if(b){const k=clamp((g.floor-b.y)/(g.box.h*.8),0,1);ctx.save();ctx.globalAlpha=.25*(1-k*.7);ctx.fillStyle='#5A3A20';ctx.beginPath();ctx.ellipse(b.x,g.floor+2,r*(1-k*.5),r*.3*(1-k*.5),0,0,7);ctx.fill();ctx.restore();}
    ctx.strokeStyle='#D9480F';ctx.lineWidth=r*.28;ctx.beginPath();ctx.ellipse(hx,hy,rw/2,r*.34,0,Math.PI,0);ctx.stroke();
    if(g.aim&&b&&!b.live){const v=basketAimVelocity(g,g.aim);if(v){for(let i=1;i<=18;i++){const t=i*.05,px=b.x+v.x*t,py=b.y+v.y*t+.5*g.grav*t*t;ctx.globalAlpha=1-i/20;orb(px,py,Math.max(2,r*.16*(1-i/24)),'#FFFFFF');}ctx.globalAlpha=1;}
      ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=3;ctx.setLineDash([5,6]);ctx.beginPath();ctx.moveTo(g.aim.x0,g.aim.y0);ctx.lineTo(g.aim.x,g.aim.y);ctx.stroke();ctx.setLineDash([]);}
    if(b)basketBall(b.x,b.y,r*(1+Math.sin(b.pop*Math.PI)*.1),b.rot,time);
    // Front rim and net are drawn over the ball so it visibly drops through the hoop.
    const stretch=1+Math.sin(g.net*Math.PI)*.35;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.6;
    for(let i=0;i<=6;i++){const t=i/6,x0=hx-rw/2+rw*t,x1=hx-rw*.3+rw*.6*t;ctx.beginPath();ctx.moveTo(x0,hy);ctx.lineTo(x1,hy+r*1.9*stretch);ctx.stroke();}
    for(let j=1;j<=3;j++){const t=j/3.3,yy=hy+r*1.9*stretch*t,w2=rw/2-(rw*.2)*t;ctx.beginPath();ctx.moveTo(hx-w2,yy);ctx.lineTo(hx+w2,yy);ctx.stroke();}
    ctx.strokeStyle='#FF6A1F';ctx.lineWidth=r*.28;ctx.beginPath();ctx.ellipse(hx,hy,rw/2,r*.34,0,0,Math.PI);ctx.stroke();
    if(b&&!b.live&&!g.aim&&g.state==='play'){const p=REDUCED?0:(time*1.2)%1;ctx.save();ctx.globalAlpha=(1-p)*.8;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y,r*(1.2+p*.8),0,7);ctx.stroke();ctx.restore();}
  },
  preview(x,y,s,t){
    const r=s*.07,hx=x+s*.18,hy=y-s*.16,k=(t*.6)%1,bx=x-s*.3+k*(hx-x+s*.3),by=y+s*.2-(Math.sin(k*Math.PI)*s*.5)+k*(hy-y-s*.2)*.2;
    pill(hx+r*2.1,hy-r*3.6,r*.6,r*4.2,'#FFFFFF',4);ctx.strokeStyle='#D9480F';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(hx,hy,r*1.7,r*.35,0,0,7);ctx.stroke();
    ctx.strokeStyle='#FFFFFF';ctx.lineWidth=1.3;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(hx-r*1.7+i*r*.85,hy);ctx.lineTo(hx-r+i*r*.5,hy+r*1.8);ctx.stroke();}
    basketBall(bx,by,r,t*4,t);
  }
};
function basketHoopX(g,phase){const b=g.box,swing=g.lvl>=3?Math.sin(phase*(.5+g.lvl*.05))*b.w*Math.min(.06+g.lvl*.012,.14):0;return clamp(W/2+g.side*b.w*.2+swing,b.x+g.rw,b.x+b.w-g.rw*1.3);}
function basketPlace(g){g.hx=basketHoopX(g,g.phase);}
// The ball always starts across the court from the hoop: a shot from right underneath would clip the rim from below.
function basketReset(g){
  const b=g.box;if(g.made&&g.lvl>=2&&Math.random()<.35)g.side=-g.side;
  g.startU=g.lvl>=2?.5-g.side*rnd(.18,.3):.5-g.side*.18;
  g.ball={x:b.x+b.w*g.startU,y:g.floor-g.r*3,vx:0,vy:0,rot:0,live:false,touched:false,scored:false,t:0,bounces:0,pop:1};
}
// A short, comfortable pull reaches full power: about a quarter of the play height, whatever the screen size.
function basketAimVelocity(g,a){
  const dx=a.x0-a.x,dy=a.y0-a.y,len=Math.hypot(dx,dy);if(len<18)return null;
  const power=clamp(len/(g.box.h*.25),.15,1)*Math.sqrt(2*g.grav*g.box.h*.95),ux=dx/len,uy=Math.min(dy/len,-.25);
  const n=Math.hypot(ux,uy);return {x:ux/n*power,y:uy/n*power};
}
function basketLaunch(g,vx,vy){const b=g.ball;Object.assign(b,{vx,vy,live:true,t:0});tone(300,.08,'sine',.1,0,520);}
function basketScore(g,b){
  b.scored=true;b.scoredAt=b.t;g.made++;g.net=1;g.streak++;const clean=!b.touched,pts=(clean?2:1)+(g.streak>2?1:0);
  arcadeScore(g,pts);arcadeReward(g);arcadeBurst(g,g.hx,g.hy,'#FFB02E',14,{kind:'star',gravity:250});
  arcadeText(g,clean?'Şahane!':'Basket!',g.hx,g.hy-g.r*2.5,clean?'#FF6A1F':'#5B4FC7',clean?28:24);
  note(PENTA[g.made%6]*2,0,.35);if(clean)note(PENTA[(g.made+2)%6]*2,.08,.3);buzz(12);
  if(g.made>=g.goal)arcadeWin(g);
}
function basketBall(x,y,r,rot,time){
  ctx.save();ctx.translate(x,y);
  const gr=ctx.createRadialGradient(-r*.35,-r*.4,r*.08,0,0,r);gr.addColorStop(0,'#FFC38A');gr.addColorStop(.45,'#FF7F1F');gr.addColorStop(1,'#C4520A');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.save();ctx.rotate(rot);ctx.strokeStyle='rgba(70,30,10,.75)';ctx.lineWidth=Math.max(1.2,r*.07);ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();
  ctx.beginPath();ctx.arc(-r*1.35,0,r*.95,-.8,.8);ctx.stroke();ctx.beginPath();ctx.arc(r*1.35,0,r*.95,Math.PI-.8,Math.PI+.8);ctx.stroke();ctx.restore();
  orb(-r*.35,-r*.42,r*.16,'rgba(255,255,255,.55)');
  ctx.restore();
}
