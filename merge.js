/* Meyve birleştir · drop fruit into the jar; two equal fruits merge into the next bigger one.
   Physics runs in a fixed 400×520 jar world at a fixed timestep; the screen only scales it. */
const MERGE_FRUITS=[
  {name:'Kiraz',color:'#E0294F',dark:'#9E1236',r:.052},{name:'Çilek',color:'#FF4964',dark:'#C71F3D',r:.066},
  {name:'Üzüm',color:'#9A62E0',dark:'#6636AA',r:.082},{name:'Mandalina',color:'#FF9F2E',dark:'#DB6D00',r:.1},
  {name:'Elma',color:'#F2453D',dark:'#B31F1A',r:.12},{name:'Armut',color:'#C9DB4E',dark:'#8BA023',r:.14},
  {name:'Şeftali',color:'#FFA88A',dark:'#EA7458',r:.16},{name:'Ananas',color:'#FFCF3F',dark:'#D29C00',r:.185},
  {name:'Kavun',color:'#B7E27C',dark:'#78AE42',r:.215},{name:'Karpuz',color:'#46B35A',dark:'#2A7A3B',r:.25}
];
const MJ={w:400,h:520,drop:-58};
const mergeR=t=>MERGE_FRUITS[t].r*MJ.w;
ARCADE.merge={
  hint:'Sürükle, bırak: aynı meyveler birleşir',
  colors:g=>['#FF8A3D','#FFC58F','#FFF1D6','#FFCFAE'],
  build(g){
    g.target=Math.min(4+g.lvl,9);g.top=0;g.cur=mergePick();g.next=mergePick();g.aim=MJ.w/2;g.cool=0;g.danger=0;g.acc=0;g.pending=[];g.holding=null;
    g.engine=Matter.Engine.create({positionIterations:8,velocityIterations:8});g.engine.gravity.y=1.1;g.fruits=[];
    Matter.Composite.add(g.engine.world,[Matter.Bodies.rectangle(MJ.w/2,MJ.h+30,MJ.w+200,60,{isStatic:true,friction:.6}),
      Matter.Bodies.rectangle(-30,MJ.h/2-200,60,MJ.h*3,{isStatic:true,friction:.2}),Matter.Bodies.rectangle(MJ.w+30,MJ.h/2-200,60,MJ.h*3,{isStatic:true,friction:.2})]);
    const check=e=>{for(const p of e.pairs){const a=p.bodyA.plugin,b=p.bodyB.plugin;if(a&&b&&a.fruit&&b.fruit&&a.tier===b.tier&&!a.merged&&!b.merged){a.merged=b.merged=true;g.pending.push([p.bodyA,p.bodyB]);}}};
    Matter.Events.on(g.engine,'collisionStart',check);Matter.Events.on(g.engine,'collisionActive',check);
  },
  layout(g){
    const b=g.box;g.k=Math.min(b.w*.88/MJ.w,(b.h-96)/MJ.h);g.jx=W/2-MJ.w*g.k/2;g.jy=b.y+b.h-MJ.h*g.k-6;
  },
  progress:g=>g.top/g.target,
  down(g,x,y,id){if(g.holding===null){g.holding=id;mergeAimAt(g,x);}},
  move(g,x,y,id){if(g.holding===id)mergeAimAt(g,x);},
  up(g,x,y,id,cancelled){if(g.holding!==id)return;g.holding=null;if(!cancelled){mergeAimAt(g,x);mergeDrop(g);}},
  cancel(g){g.holding=null;},
  tap(g,x){mergeAimAt(g,x);mergeDrop(g);},
  update(g,dt){
    g.cool=Math.max(0,g.cool-dt);
    g.acc=Math.min(g.acc+dt,.1);
    while(g.acc>=1/120){Matter.Engine.update(g.engine,1000/120);g.acc-=1/120;mergeResolve(g);}
    let over=false;
    for(const f of g.fruits){const p=f.plugin;p.pop=Math.max(0,p.pop-dt*3);p.age+=dt;
      if(f.speed>18)Matter.Body.setVelocity(f,{x:f.velocity.x/f.speed*18,y:f.velocity.y/f.speed*18});
      if(p.age>1.4&&f.position.y-mergeR(p.tier)<0)over=true;}
    g.danger=over?g.danger+dt:Math.max(0,g.danger-dt*2);
    if(g.danger>2.6&&g.state==='play')arcadeRetry(g);
  },
  draw(g,time){
    const k=g.k,X=v=>g.jx+v*k,Y=v=>g.jy+v*k,jw=MJ.w*k,jh=MJ.h*k;
    ctx.save();ctx.shadowColor='rgba(120,70,30,.25)';ctx.shadowBlur=20;ctx.shadowOffsetY=8;pill(g.jx-8,g.jy-4,jw+16,jh+12,'rgba(255,255,255,.55)',26);ctx.restore();
    pill(g.jx,g.jy,jw,jh,'rgba(255,248,235,.75)',20);
    // Aim guide and the cute dropper cloud.
    const cr=mergeR(g.cur)*k,ax=X(g.aim);
    if(g.state==='play'){
      ctx.save();ctx.strokeStyle='rgba(255,138,61,.45)';ctx.lineWidth=3;ctx.setLineDash([4,9]);ctx.beginPath();ctx.moveTo(ax,Y(MJ.drop)+cr);ctx.lineTo(ax,g.jy+jh);ctx.stroke();ctx.restore();
    }
    ctx.save();ctx.beginPath();roundRectPath(ctx,g.jx,g.jy-jh,jw,jh*2,20);ctx.clip();
    for(const f of g.fruits){const p=f.plugin;mergeDrawFruit(p.tier,X(f.position.x),Y(f.position.y),mergeR(p.tier)*k,f.angle,p.pop,time+p.seed);}
    ctx.restore();
    if(g.danger>0||g.fruits.some(f=>f.plugin.age>1&&f.position.y-mergeR(f.plugin.tier)<60)){
      ctx.save();ctx.globalAlpha=g.danger>0?.5+.5*Math.sin(time*12):.35;ctx.strokeStyle='#FF4D5E';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(g.jx+6,g.jy);ctx.lineTo(g.jx+jw-6,g.jy);ctx.stroke();ctx.restore();
    }
    const gl=ctx.createLinearGradient(g.jx,0,g.jx+jw,0);gl.addColorStop(0,'rgba(255,255,255,.55)');gl.addColorStop(.12,'rgba(255,255,255,0)');gl.addColorStop(.9,'rgba(255,255,255,0)');gl.addColorStop(1,'rgba(255,255,255,.35)');
    ctx.fillStyle=gl;ctx.beginPath();roundRectPath(ctx,g.jx,g.jy,jw,jh,20);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=4;ctx.stroke();
    pill(g.jx-10,g.jy-7,jw+20,14,'#FFFFFF',7);
    if(g.state==='play'){
      const grow=g.cool>0?1-g.cool/.45:1,cy=Y(MJ.drop)-cr*1.25,bob=REDUCED?0:Math.sin(time*3)*3;
      for(const [dx,dy,rr] of [[-1,0,.55],[0,-.35,.7],[1,0,.55]])orb(ax+dx*cr*.9,cy+dy*cr+bob,Math.max(10,cr*rr+8),'#FFFFFF');
      orb(ax-6,cy+bob,2.2,'#6A5A7A');orb(ax+6,cy+bob,2.2,'#6A5A7A');
      if(grow>0)mergeDrawFruit(g.cur,ax,Y(MJ.drop)+bob,cr*easeBack(clamp(grow,0,1)),0,0,time);
    }
  },
  hud(g,time){
    const span=Math.min(W*.34,170),y=safe.top+86;
    for(const [x,t,name] of [[W/2-span,g.target,'Hedef'],[W/2+span,g.next,'Sonra']]){
      pill(x-26,y-24,52,50,'rgba(255,255,255,.88)',16);label(name,x,y-14,10,'#9A7A62');mergeDrawFruit(t,x,y+8,Math.min(13,mergeR(t)*g.k),0,0,time);}
  },
  preview(x,y,s,t){
    const w=s*.62,h=s*.5,jx=x-w/2,jy=y-h*.3;pill(jx,jy,w,h,'rgba(255,255,255,.7)',10);
    mergeDrawFruit(4,x-w*.22,jy+h-w*.17,w*.17,0,0,t);mergeDrawFruit(3,x+w*.2,jy+h-w*.14,w*.14,0,0,t);mergeDrawFruit(1,x+w*.02,jy+h-w*.34,w*.1,0,0,t);
    const k=(t*.8)%1;mergeDrawFruit(1,x+w*.05,jy-h*.35+k*h*.45,w*.1,0,0,t);
  }
};
function mergePick(){const r=Math.random();return r<.35?0:r<.65?1:r<.85?2:3;}
function mergeAimAt(g,x){const r=mergeR(g.cur);g.aim=clamp((x-g.jx)/g.k,r+2,MJ.w-r-2);}
function mergeAdd(g,tier,x,y,vx=0,vy=0){
  const r=mergeR(tier),body=Matter.Bodies.circle(x,y,r,{restitution:.12,friction:.1,frictionStatic:.4,frictionAir:.01,density:.0012,slop:.02});
  body.plugin={fruit:true,tier,merged:false,pop:1,age:0,seed:Math.random()*9};Matter.Body.setVelocity(body,{x:vx,y:vy});
  Matter.Composite.add(g.engine.world,body);g.fruits.push(body);return body;
}
function mergeDrop(g){
  if(g.state!=='play'||g.cool>0)return;
  mergeAdd(g,g.cur,g.aim,MJ.drop);g.cur=g.next;g.next=mergePick();g.cool=.45;g.aim=clamp(g.aim,mergeR(g.cur)+2,MJ.w-mergeR(g.cur)-2);
  tone(330,.08,'sine',.1,0,220);
}
function mergeResolve(g){
  if(!g.pending.length)return;
  const list=g.pending.splice(0);
  for(const [a,b] of list){
    if(!g.fruits.includes(a)||!g.fruits.includes(b))continue;
    const tier=a.plugin.tier,x=(a.position.x+b.position.x)/2,y=(a.position.y+b.position.y)/2;
    Matter.Composite.remove(g.engine.world,a);Matter.Composite.remove(g.engine.world,b);g.fruits=g.fruits.filter(f=>f!==a&&f!==b);
    const sx=g.jx+x*g.k,sy=g.jy+y*g.k,f=MERGE_FRUITS[Math.min(9,tier+1)];
    if(tier<9){mergeAdd(g,tier+1,x,y,(a.velocity.x+b.velocity.x)/2,Math.min(0,(a.velocity.y+b.velocity.y)/2)-1.5);g.top=Math.max(g.top,tier+1);}
    arcadeBurst(g,sx,sy,f.color,10+tier*2,{kind:tier>4?'star':'drop',gravity:350});arcadeRing(g,sx,sy,mergeR(Math.min(9,tier+1))*g.k,'#FFFFFF');
    arcadeScore(g,(tier+1)*2+(tier===9?40:0));arcadeReward(g);note(PENTA[tier%6]*(tier>5?2:1),0,.35);buzz(tier>4?18:8);
    if(tier>=3)arcadeText(g,tier===9?'Dev karpuz!':MERGE_FRUITS[tier+1].name+'!',sx,sy-40,MERGE_FRUITS[Math.min(9,tier+1)].dark,tier>6?28:22);
    if(g.top>=g.target)arcadeWin(g);
  }
}
function mergeDrawFruit(t,x,y,r,angle,pop,time){
  const f=MERGE_FRUITS[t],s=1+Math.sin(clamp(pop,0,1)*Math.PI)*.18;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  const gr=ctx.createRadialGradient(-r*.35,-r*.4,r*.08,0,0,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.28,f.color);gr.addColorStop(1,f.dark);
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.save();ctx.rotate(angle);ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.clip();
  if(t===1)for(let i=0;i<12;i++)orb(Math.cos(i*2.4)*r*.6,Math.sin(i*2.4)*r*.6+r*.1,r*.045,'#FFE58A');
  if(t===2)for(let i=0;i<7;i++)orb(Math.cos(i*.9)*r*.55,Math.sin(i*.9)*r*.55,r*.3,'rgba(255,255,255,.12)');
  if(t===3||t===5)for(let i=0;i<10;i++)orb(Math.cos(i*2.1)*r*.65,Math.sin(i*2.1)*r*.65,r*.035,'rgba(120,60,0,.2)');
  if(t===6){ctx.strokeStyle='rgba(200,80,60,.3)';ctx.lineWidth=r*.07;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.3,0,0,r);ctx.stroke();}
  if(t===7){ctx.strokeStyle='rgba(160,110,0,.35)';ctx.lineWidth=r*.05;for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(i*r*.3-r,-r);ctx.lineTo(i*r*.3+r,r);ctx.stroke();ctx.beginPath();ctx.moveTo(i*r*.3+r,-r);ctx.lineTo(i*r*.3-r,r);ctx.stroke();}}
  if(t===8){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=r*.04;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*r*.35,-r);ctx.quadraticCurveTo(i*r*.5,0,i*r*.35,r);ctx.stroke();}}
  if(t===9){ctx.strokeStyle=f.dark;ctx.lineWidth=r*.14;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.42,-r);ctx.quadraticCurveTo(i*r*.58,0,i*r*.42,r);ctx.stroke();}}
  ctx.restore();
  ctx.save();ctx.rotate(angle*.35);
  if(t===7){ctx.fillStyle='#3FA35A';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*r*.12,-r*.85);ctx.lineTo(i*r*.3,-r*1.35+Math.abs(i)*r*.12);ctx.lineTo(i*r*.12+r*.1,-r*.85);ctx.fill();}}
  else if(t===1){ctx.fillStyle='#3FA35A';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(i*r*.18,-r*.9,r*.16,r*.07,i*.5,0,7);ctx.fill();}}
  else if(t!==2&&t!==8&&t!==9){ctx.strokeStyle='#6B4424';ctx.lineWidth=Math.max(1.5,r*.09);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.85);ctx.quadraticCurveTo(r*.05,-r*1.1,r*(t===0?.25:.1),-r*1.25);ctx.stroke();
    ctx.fillStyle='#4CAF50';ctx.beginPath();ctx.ellipse(r*.3,-r*1.05,r*.26,r*.11,-.4,0,7);ctx.fill();}
  ctx.restore();
  orb(-r*.38,-r*.44,r*.17,'rgba(255,255,255,.6)');
  const blink=((time*.7)%3.2)<.12,ey=r*.02,ex=r*.3,es=Math.max(1.3,r*.1);
  if(blink){ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1,r*.06);for(const sgn of [-1,1]){ctx.beginPath();ctx.moveTo(sgn*ex-es,ey);ctx.lineTo(sgn*ex+es,ey);ctx.stroke();}}
  else for(const sgn of [-1,1]){orb(sgn*ex,ey,es,'#2A2233');orb(sgn*ex+es*.35,ey-es*.4,es*.35,'#FFFFFF');}
  ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1,r*.06);ctx.lineCap='round';ctx.beginPath();ctx.arc(0,r*.2,r*.14,.15*Math.PI,.85*Math.PI);ctx.stroke();
  orb(-r*.52,r*.22,r*.1,'rgba(255,120,140,.35)');orb(r*.52,r*.22,r*.1,'rgba(255,120,140,.35)');
  ctx.restore();
}
