/* Zıpzıp · the frog bounces by itself; steer it left and right to climb from platform to platform.
   World x is 0..1 of the play width and y counts play heights upward, so resizing never moves the level.
   Platform gaps never exceed the jump height, so every tower is climbable. */
const JUMP={h:.3,grav:2.6};
ARCADE.jump={
  hint:'Parmağını sağa sola kaydır',
  colors:g=>['#34B86A','#9BE3B5','#BFE6FF','#EAF7FF'],
  build(g){
    g.target=5+g.lvl*1.5;g.p={x:.5,y:0,vy:0,face:1,sq:0};g.tx=.5;g.cam=-.12;g.plats=[{x:.5,y:0,w:.5,type:'n',dx:0}];g.top=0;g.stars=[];g.drag=null;g.finish=false;g.best=0;
    jumpFill(g);
  },
  layout(g){},
  progress:g=>g.best/g.target,
  down(g,x,y,id){if(g.drag===null){g.drag=id;jumpAim(g,x);}},
  move(g,x,y,id){if(g.drag===id)jumpAim(g,x);},
  up(g,x,y,id){if(g.drag===id)g.drag=null;},
  cancel(g){g.drag=null;},
  tap(g,x){jumpAim(g,x);},
  update(g,dt){
    const p=g.p,V=Math.sqrt(2*JUMP.grav*JUMP.h);p.sq=Math.max(0,p.sq-dt*4);
    for(const q of g.plats){if(q.type==='m'){q.x+=q.dx*dt;if(q.x<q.w/2+.02||q.x>1-q.w/2-.02)q.dx=-q.dx;}if(q.gone)q.fall=(q.fall||0)+dt;}
    if(g.state!=='play')return;
    const px=p.x;p.x=ease(p.x,g.tx,9,dt);if(Math.abs(p.x-px)>.0005)p.face=p.x>px?1:-1;
    const py=p.y;p.vy-=JUMP.grav*dt;p.y+=p.vy*dt;
    if(p.vy<0)for(const q of g.plats){
      if(q.gone||py<q.y||p.y>q.y||Math.abs(p.x-q.x)>q.w/2+.035)continue;
      p.y=q.y;p.vy=V*(q.type==='s'?1.7:1);p.sq=1;q.bounce=1;
      if(!q.visited){q.visited=true;arcadeScore(g,1);arcadeReward(g);}
      if(q.type==='s'){tone(330,.25,'sine',.14,0,990);arcadeText(g,'Yaay!',jumpX(g,q.x),jumpY(g,q.y)-40,'#34B86A',22);}else tone(PENTA[Math.floor(q.y*7)%6],.08,'sine',.12);
      if(q.type==='b'){q.gone=true;tone(140,.12,'triangle',.08);}
      if(q.type==='f'){arcadeWin(g);return;}
      break;
    }
    for(const q of g.plats)q.bounce=Math.max(0,(q.bounce||0)-dt*4);
    g.stars=g.stars.filter(s=>{if(Math.hypot((s.x-p.x)*g.box.w,(s.y-(p.y+.05))*g.box.h)<26){arcadeScore(g,2);arcadeBurst(g,jumpX(g,s.x),jumpY(g,s.y),'#FFD23F',8,{kind:'star',gravity:200});note(PENTA[4]*2,0,.25);return false;}return s.y>g.cam-.2;});
    g.best=Math.max(g.best,p.y);g.cam=Math.max(g.cam,p.y-.42);
    if(g.best>=g.target+.05){arcadeWin(g);return;}
    g.plats=g.plats.filter(q=>q.y>g.cam-.3);jumpFill(g);
    if(p.y<g.cam-.12){p.vy=0;arcadeRetry(g);}
  },
  draw(g,time){
    const b=g.box,h=clamp(g.cam/g.target,0,1);
    const sky=ctx.createLinearGradient(0,b.y,0,b.y+b.h);sky.addColorStop(0,mixHex('#9FD8FF','#3E3A8C',h));sky.addColorStop(1,mixHex('#E4F6FF','#F7A3B4',h));
    ctx.save();ctx.beginPath();roundRectPath(ctx,b.x,b.y,b.w,b.h,24);ctx.clip();ctx.fillStyle=sky;ctx.fillRect(b.x,b.y,b.w,b.h);
    if(h>.45)for(let i=0;i<24;i++){ctx.globalAlpha=(h-.45)*1.8*(.5+.5*Math.sin(time*2+i));orb(b.x+((i*.61)%1)*b.w,b.y+((i*.37+g.cam*.02)%1)*b.h,1.6,'#FFFFFF');}ctx.globalAlpha=1;
    // Clouds drift down at a quarter of the climb speed for parallax depth.
    for(let i=0;i<6;i++){const k=((i*.23+g.cam*.25)%1.2+1.2)%1.2;cloud(b.x+((i*.37+.1)%1)*b.w,b.y+(k-.1)*b.h,.7+(i%3)*.2,.5);}
    for(const q of g.plats)jumpPlat(g,q,time);
    for(const s of g.stars){const y=jumpY(g,s.y)+(REDUCED?0:Math.sin(time*3+s.x*9)*3);toy('star',jumpX(g,s.x),y,9,'#FFD23F');}
    const p=g.p;jumpFrog(jumpX(g,p.x),jumpY(g,p.y),Math.min(34,b.w*.075),p.face,p.sq,p.vy,time);
    ctx.restore();
  },
  preview(x,y,s,t){
    for(const [dx,dy] of [[-.25,.25],[.2,.05],[-.05,-.18]])pill(x+dx*s-s*.12,y+dy*s,s*.24,s*.05,'#5CCB7C',s*.025);
    const k=Math.abs(Math.sin(t*2.4));jumpFrog(x-s*.2+ (Math.sin(t*1.2)*.5+.5)*s*.4,y+s*.22-k*s*.35,s*.09,1,k<.1?1:0,1-k*2,t);
  }
};
const jumpX=(g,x)=>g.box.x+x*g.box.w,jumpY=(g,y)=>g.box.y+g.box.h-(y-g.cam)*g.box.h;
function jumpAim(g,x){g.tx=clamp((x-g.box.x)/g.box.w,.06,.94);}
function mixHex(a,b,t){const x=hexRgb(a),y=hexRgb(b);return `rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`;}
function jumpFill(g){
  const L=g.lvl;
  while(!g.finish&&g.top<g.cam+2.2){
    const y=g.top+rnd(.09,Math.min(.17+L*.006,.23));
    if(y>=g.target){g.plats.push({x:.5,y:g.target,w:.7,type:'f',dx:0});g.finish=true;g.top=g.target;break;}
    // No springs close to the finish: a spring could fling the frog past it and off the screen.
    const r=Math.random(),type=r<.08&&y<g.target-1.2?'s':L>=2&&r<.24?'m':L>=3&&r<.36?'b':'n',w=type==='b'?.2:L<3?.26:.21;
    const q={x:rnd(w/2+.03,1-w/2-.03),y,w,type,dx:type==='m'?rnd(.12,.2)*(Math.random()<.5?-1:1):0};g.plats.push(q);
    if(type==='b'){g.plats.push({x:clamp(q.x+rnd(-.3,.3),.15,.85),y:y+rnd(.03,.06),w:.24,type:'n',dx:0});}
    if(Math.random()<.22)g.stars.push({x:q.x,y:y+.12});
    g.top=y;
  }
}
function jumpPlat(g,q,time){
  const x=jumpX(g,q.x),y=jumpY(g,q.y)+(q.fall||0)**2*300,w=q.w*g.box.w,bo=Math.sin((q.bounce||0)*Math.PI)*4;
  if(y<g.box.y-30||y>g.box.y+g.box.h+40)return;
  ctx.save();if(q.gone){ctx.globalAlpha=clamp(1-(q.fall||0)*1.5,0,1);}ctx.translate(x,y+bo);
  if(q.type==='f'){pill(-w/2,-2,w,18,'#FFC93C',9);pill(-w/2,-2,w,7,'#FFE58A',4);ctx.fillStyle='#8B5A3C';ctx.fillRect(w*.3,-58,4,56);ctx.fillStyle='#FF5A6E';ctx.beginPath();ctx.moveTo(w*.3+4,-58);ctx.lineTo(w*.3+34+(REDUCED?0:Math.sin(time*5)*4),-48);ctx.lineTo(w*.3+4,-38);ctx.fill();label('Bitiş',0,8,11,'#8A5A00');}
  else{
    const top=q.type==='m'?'#6EC6FF':q.type==='b'?'#D9A066':'#6BD68A',base=q.type==='m'?'#3B8FD9':q.type==='b'?'#A86B35':'#8B5A3C';
    pill(-w/2,0,w,14,base,7);pill(-w/2,-2,w,8,top,4);
    if(q.type==='b'){ctx.strokeStyle='rgba(70,40,20,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-w*.1,-1);ctx.lineTo(0,6);ctx.lineTo(w*.08,12);ctx.stroke();}
    if(q.type==='n')for(let i=0;i<3;i++)orb(-w*.3+i*w*.3,-2,2,'#FFFFFF');
    if(q.type==='s'){const k=1+Math.sin((q.bounce||0)*Math.PI)*.8;ctx.strokeStyle='#8E99A8';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=6;i++)ctx.lineTo((i%2?5:-5),-2-i*2.2*k);ctx.stroke();pill(-9,-18*k,18,5,'#FF6B6B',2);}
  }
  ctx.restore();
}
function jumpFrog(x,y,s,face,sq,vy,time){
  const st=clamp(vy*.25,-.15,.2),sx=1+sq*.25-st*.4,sy=1-sq*.25+st;
  ctx.save();ctx.translate(x,y);ctx.scale(face*sx,sy);
  ctx.fillStyle='#2E9E57';for(const d of [-1,1]){ctx.beginPath();ctx.ellipse(d*s*.55,-s*.15+(vy>0?s*.1:0),s*.28,s*(vy>.5?.45:.2),d*.4,0,7);ctx.fill();}
  const gr=ctx.createRadialGradient(-s*.2,-s*.8,s*.1,0,-s*.55,s*.8);gr.addColorStop(0,'#9BEA8F');gr.addColorStop(1,'#34B86A');ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,-s*.55,s*.72,s*.58,0,0,7);ctx.fill();
  ctx.fillStyle='#D9F7C8';ctx.beginPath();ctx.ellipse(s*.05,-s*.4,s*.4,s*.3,0,0,7);ctx.fill();
  for(const d of [-1,1]){orb(d*s*.32,-s*1.05,s*.24,'#34B86A');orb(d*s*.32,-s*1.07,s*.17,'#FFFFFF');orb(d*s*.32+s*.05,-s*1.05,s*.09,'#1E2A33');orb(d*s*.32+s*.08,-s*1.1,s*.035,'#FFFFFF');}
  ctx.strokeStyle='#1E4A2E';ctx.lineWidth=Math.max(1.2,s*.06);ctx.lineCap='round';ctx.beginPath();ctx.arc(s*.08,-s*.72,s*.22,.15*Math.PI,.85*Math.PI);ctx.stroke();
  orb(-s*.3,-s*.62,s*.08,'rgba(255,120,150,.5)');orb(s*.45,-s*.62,s*.08,'rgba(255,120,150,.5)');
  ctx.restore();
}
