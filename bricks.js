/* Tuğla kır · drag the cloud paddle, bounce the ball and break every candy brick.
   Bricks live in grid coordinates; collisions run in small substeps so fast balls never tunnel. */
const BRICK_COLORS=['#FF6B8B','#FF9F43','#FFD23F','#3DD68C','#4DA8FF','#A97BFF'];
ARCADE.bricks={
  hint:'Parmağınla raketi kaydır',
  colors:g=>['#FF6B8B','#FFB0C1','#E3ECFF','#C9D4F5'],
  build(g){
    const L=g.lvl,rows=Math.min(4+Math.floor(L/2),8),cols=8,pat=(L-1)%4;g.cols=cols;g.rows=rows;g.bricks=[];
    const heart=['01100110','11111111','11111111','11111111','01111110','00111100','00011000','00000000'];
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const on=pat===0||(pat===1&&Math.abs(c-3.5)<=r*.6+.5)||(pat===2&&(r+c)%2===0)||(pat===3&&heart[r%8][c]==='1');
      if(on)g.bricks.push({c,r,hp:L>=3&&r<Math.floor(rows/3)?2:1,max:L>=3&&r<Math.floor(rows/3)?2:1,color:BRICK_COLORS[(r+(pat===2?c:0))%6],pop:0});
    }
    g.total0=g.bricks.length;g.lives=3;g.balls=[];g.items=[{id:0,x:W/2,y:H/2,r:40}];g.power=[];g.wide=0;g.serve=true;g.drag=null;g.paddleX=.5;g.hitSound=0;
  },
  layout(g){
    const b=g.box;g.bw=(b.w-16)/g.cols;g.bh=Math.min(g.bw*.46,b.h*.05);g.top=b.y+14;g.left=b.x+8;
    g.pw=b.w*(g.lvl<3?.3:.24);g.py=b.y+b.h-34;g.br=clamp(b.w*.022,7,12);g.speed=b.h*Math.min(.62+g.lvl*.04,.95);
    for(const k of g.bricks){k.x=g.left+k.c*g.bw+2;k.y=g.top+k.r*(g.bh+5);k.w=g.bw-4;k.h=g.bh;}
    if(g.serve||!g.balls.length){g.balls=[];g.serve=true;}
  },
  progress:g=>1-g.bricks.length/g.total0,
  hud(g){drawArcadeHearts(g.lives);},
  down(g,x,y,id){if(!g.drag){g.drag=id;bricksAim(g,x);}},
  move(g,x,y,id){if(g.drag===id)bricksAim(g,x);},
  up(g,x,y,id,cancelled){if(g.drag!==id)return;g.drag=null;if(!cancelled&&g.serve)bricksServe(g);},
  cancel(g){g.drag=null;},
  tap(g,x){if(g.serve)bricksServe(g);else bricksAim(g,x);},
  update(g,dt){
    g.wide=Math.max(0,g.wide-dt);const pw=g.pw*(g.wide>0?1.45:1),px=g.box.x+g.paddleX*g.box.w;g.pwNow=ease(g.pwNow||pw,pw,8,dt);
    for(const k of g.bricks)k.pop=Math.max(0,k.pop-dt*4);
    if(g.state!=='play')return;
    for(const ball of g.balls){
      ball.trail.unshift({x:ball.x,y:ball.y});if(ball.trail.length>6)ball.trail.pop();
      const steps=Math.ceil(g.speed*dt/(g.br*.5));
      for(let s=0;s<steps;s++){
        ball.x+=ball.vx*dt/steps;ball.y+=ball.vy*dt/steps;
        if(ball.x<g.box.x+g.br){ball.x=g.box.x+g.br;ball.vx=Math.abs(ball.vx);}
        if(ball.x>g.box.x+g.box.w-g.br){ball.x=g.box.x+g.box.w-g.br;ball.vx=-Math.abs(ball.vx);}
        if(ball.y<g.box.y+g.br){ball.y=g.box.y+g.br;ball.vy=Math.abs(ball.vy);}
        const half=g.pwNow/2;
        if(ball.vy>0&&ball.y+g.br>=g.py&&ball.y<g.py+12&&Math.abs(ball.x-px)<half+g.br){
          const off=clamp((ball.x-px)/half,-1,1),ang=-Math.PI/2+off*1.05;ball.vx=Math.cos(ang)*g.speed;ball.vy=Math.sin(ang)*g.speed;ball.y=g.py-g.br;g.squish=1;tone(420+off*80,.06,'sine',.1);
        }
        for(let i=0;i<g.bricks.length;i++){const k=g.bricks[i],cx=clamp(ball.x,k.x,k.x+k.w),cy=clamp(ball.y,k.y,k.y+k.h),dx=ball.x-cx,dy=ball.y-cy;
          if(dx*dx+dy*dy>g.br*g.br)continue;
          if(Math.abs(dx)>Math.abs(dy)){ball.vx=Math.sign(dx||-ball.vx)*Math.abs(ball.vx);}else{ball.vy=Math.sign(dy||-ball.vy)*Math.abs(ball.vy);}
          bricksHit(g,k,i);break;}
      }
    }
    g.balls=g.balls.filter(b=>b.y<g.box.y+g.box.h+g.br*4);
    if(!g.serve&&!g.balls.length){g.lives--;g.wide=0;sndSoft();buzz(20);arcadeText(g,'Hoppala!',W/2,g.py-60,'#FF6B6B',24);if(g.lives<=0){arcadeRetry(g);return;}g.serve=true;}
    g.power=g.power.filter(p=>{p.y+=g.box.h*.35*dt;p.rot+=dt*3;
      if(p.y>g.py-10&&p.y<g.py+16&&Math.abs(p.x-px)<g.pwNow/2+12){bricksPower(g,p);return false;}return p.y<g.box.y+g.box.h+20;});
    g.squish=Math.max(0,(g.squish||0)-dt*4);
    if(!g.bricks.length)arcadeWin(g);
  },
  draw(g,time){
    const px=g.box.x+g.paddleX*g.box.w,pw=g.pwNow||g.pw;
    for(const k of g.bricks){
      const s=1+Math.sin(k.pop*Math.PI)*.08;ctx.save();ctx.translate(k.x+k.w/2,k.y+k.h/2);ctx.scale(s,s);
      const gr=ctx.createLinearGradient(0,-k.h/2,0,k.h/2);gr.addColorStop(0,k.hp>1?shadeHex(k.color,.72):k.color);gr.addColorStop(1,shadeHex(k.color,k.hp>1?.55:.82));
      ctx.fillStyle=gr;ctx.beginPath();roundRectPath(ctx,-k.w/2,-k.h/2,k.w,k.h,k.h*.35);ctx.fill();
      pill(-k.w/2+4,-k.h/2+2,k.w-8,k.h*.3,'rgba(255,255,255,.4)',k.h*.15);
      if(k.max>1&&k.hp<k.max){ctx.strokeStyle='rgba(60,30,40,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-k.w*.2,-k.h/2);ctx.lineTo(-k.w*.05,0);ctx.lineTo(-k.w*.18,k.h/2);ctx.moveTo(-k.w*.05,0);ctx.lineTo(k.w*.12,-k.h*.1);ctx.stroke();}
      if(k.max>1&&k.hp===k.max){orb(-k.w*.18,0,k.h*.1,'#2A2233');orb(k.w*.18,0,k.h*.1,'#2A2233');}
      ctx.restore();
    }
    for(const p of g.power){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.rot)*.2);pill(-18,-11,36,22,p.kind==='multi'?'#4DA8FF':'#3DD68C',11);label(p.kind==='multi'?'+2':'↔',0,.5,13,'#FFFFFF');ctx.restore();}
    for(const b of g.balls){b.trail.forEach((t,i)=>{ctx.globalAlpha=.25*(1-i/6);orb(t.x,t.y,g.br*(1-i/8),'#FFFFFF');});ctx.globalAlpha=1;
      const gr=ctx.createRadialGradient(b.x-g.br*.3,b.y-g.br*.35,1,b.x,b.y,g.br);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(1,'#FFB0C1');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(b.x,b.y,g.br,0,7);ctx.fill();}
    // The paddle is a smiling cloud that squishes on every hit.
    const sq=Math.sin((g.squish||0)*Math.PI)*.18;ctx.save();ctx.translate(px,g.py+8);ctx.scale(1+sq*.4,1-sq);
    ctx.shadowColor='rgba(60,70,120,.25)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;pill(-pw/2,-10,pw,22,g.wide>0?'#DFFFEF':'#FFFFFF',11);ctx.shadowColor='transparent';
    for(const dx of [-.28,0,.28])orb(dx*pw,-10,pw*.13,g.wide>0?'#DFFFEF':'#FFFFFF');
    orb(-7,-2,2.5,'#2A2233');orb(7,-2,2.5,'#2A2233');ctx.strokeStyle='#2A2233';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,1,5,.15*Math.PI,.85*Math.PI);ctx.stroke();
    orb(-16,2,3,'rgba(255,130,150,.45)');orb(16,2,3,'rgba(255,130,150,.45)');ctx.restore();
    if(g.serve&&g.state==='play'){const bob=REDUCED?0:Math.sin(time*5)*3;orb(px,g.py-g.br-4+bob,g.br,'#FFFFFF');ctx.strokeStyle='rgba(255,255,255,.7)';ctx.setLineDash([4,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,g.py-g.br*2-4);ctx.lineTo(px,g.py-g.br*2-60);ctx.stroke();ctx.setLineDash([]);}
  },
  preview(x,y,s,t){
    const w=s*.14,h=w*.45;for(let r=0;r<3;r++)for(let c=0;c<5;c++){if(r===1&&c===2&&Math.sin(t*2)>0)continue;pill(x-w*2.6+c*w*1.05,y-s*.3+r*h*1.4,w,h,BRICK_COLORS[(r+c)%6],h*.35);}
    const bx=x+Math.sin(t*1.7)*s*.25,by=y+s*.05-Math.abs(Math.cos(t*2.2))*s*.2;orb(bx,by,s*.03,'#FFFFFF');pill(x-s*.18+Math.sin(t*1.7)*s*.2,y+s*.18,s*.36,s*.06,'#FFFFFF',s*.03);
  }
};
function shadeHex(hex,f){const c=hexRgb(hex);return rgbStr(c,f);}
function bricksAim(g,x){g.paddleX=clamp((x-g.box.x)/g.box.w,(g.pwNow||g.pw)/2/g.box.w,1-(g.pwNow||g.pw)/2/g.box.w);}
function bricksServe(g){
  if(!g.serve||g.state!=='play')return;g.serve=false;const px=g.box.x+g.paddleX*g.box.w,a=-Math.PI/2+rnd(-.5,.5);
  g.balls.push({x:px,y:g.py-g.br-4,vx:Math.cos(a)*g.speed,vy:Math.sin(a)*g.speed,trail:[]});tone(520,.08,'sine',.1,0,700);
}
function bricksHit(g,k,i){
  k.hp--;k.pop=1;
  if(time-g.hitSound>.03){g.hitSound=time;tone(PENTA[(k.r+k.c)%6]*(k.hp>0?.5:1),.08,'triangle',.12);}
  if(k.hp>0)return;
  g.bricks.splice(i,1);arcadeBurst(g,k.x+k.w/2,k.y+k.h/2,k.color,10,{gravity:500});arcadeScore(g,k.max);arcadeReward(g);buzz(5);
  if(Math.random()<.12&&g.power.length<3)g.power.push({x:k.x+k.w/2,y:k.y+k.h/2,kind:Math.random()<.5?'multi':'wide',rot:0});
}
function bricksPower(g,p){
  if(p.kind==='wide'){g.wide=8;arcadeText(g,'Kocaman!',p.x,p.y-30,'#3DD68C',22);}
  else{const src=g.balls[0];if(src)for(const s of [-1,1]){const a=Math.atan2(src.vy,src.vx)+s*.4;g.balls.push({x:src.x,y:src.y,vx:Math.cos(a)*g.speed,vy:Math.sin(a)*g.speed,trail:[]});}
    if(g.balls.length>6)g.balls.length=6;arcadeText(g,'+2 top',p.x,p.y-30,'#4DA8FF',22);}
  [0,2,4].forEach((m,k)=>tone(PENTA[m]*2,.1,'triangle',.1,k*.05));
}
