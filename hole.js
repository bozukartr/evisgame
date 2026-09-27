/* Obur delik · drag the hole around; anything smaller than it tips in and the hole grows.
   Growth is area based, so eating every small and medium object always makes the biggest one fit. */
const HOLE_THEMES=[
  {name:'Park',ground:['#9ED889','#86C873'],line:'rgba(255,255,255,.14)',accent:'#FF7AB6',tiers:[['flower','pebble'],['ball','cone'],['bush','bench'],['tree','car']]},
  {name:'Plaj',ground:['#F8E1AE','#EFCB86'],line:'rgba(255,255,255,.3)',accent:'#29B6F6',tiers:[['shell','starfish'],['ball','bucket'],['castle','duck'],['umbrella','boat']]},
  {name:'Oyuncak odası',ground:['#EFCFA6','#DDB080'],line:'rgba(150,95,50,.14)',accent:'#8E6CFF',tiers:[['block','pebble'],['ball','duck'],['drum','teddy'],['car','castle']]}
];
const HOLE_SIZE=[[.55,.75],[1,1.3],[1.6,2],[2.5,2.9]];
ARCADE.hole={
  hint:'Parmağını kaydır, deliği gezdir',
  colors:g=>{const t=HOLE_THEMES[(g.lvl-1)%3];return [t.accent,'#FFD1E8','#BFE8FF','#E6F5FF'];},
  build(g){
    g.theme=HOLE_THEMES[(g.lvl-1)%3];const L=g.lvl;
    g.plan=[Math.min(12+L*2,24),Math.min(7+L,14),Math.min(3+(L>>1),7),Math.min(1+Math.floor(L/3),3)];
    g.objs=null;g.eaten=0;g.drag=null;g.warnAt=-9;g.hole=null;
  },
  layout(g){
    const b=g.box;g.U=Math.min(b.w,b.h)/20;g.field={x:b.x+4,y:b.y+8,w:b.w-8,h:b.h-12};
    if(!g.objs)holePopulate(g);
    else for(const o of g.objs){o.x=g.field.x+o.u*g.field.w;o.y=g.field.y+o.v*g.field.h;o.r=o.size*g.U;}
    const h=g.hole;h.x=g.field.x+h.u*g.field.w;h.y=g.field.y+h.v*g.field.h;h.tx=h.x;h.ty=h.y;holeGrow(g,true);
  },
  decor(q,g){
    const f=g.field,t=g.theme;q.save();q.shadowColor='rgba(40,60,80,.25)';q.shadowBlur=18;q.shadowOffsetY=6;
    const gr=q.createLinearGradient(0,f.y,0,f.y+f.h);gr.addColorStop(0,t.ground[0]);gr.addColorStop(1,t.ground[1]);q.fillStyle=gr;q.beginPath();roundRectPath(q,f.x,f.y,f.w,f.h,26);q.fill();q.restore();
    q.save();q.beginPath();roundRectPath(q,f.x,f.y,f.w,f.h,26);q.clip();q.strokeStyle=t.line;q.lineWidth=2;
    if(t.name==='Oyuncak odası')for(let i=1;i<9;i++){q.beginPath();q.moveTo(f.x,f.y+f.h*i/9);q.lineTo(f.x+f.w,f.y+f.h*i/9);q.stroke();}
    else if(t.name==='Plaj')for(let i=0;i<7;i++){q.beginPath();for(let x=0;x<=f.w;x+=10)q.lineTo(f.x+x,f.y+f.h*(i+.5)/7+Math.sin(x*.05+i)*4);q.stroke();}
    else for(let i=0;i<60;i++){const x=f.x+(i*.618%1)*f.w,y=f.y+(i*.377%1)*f.h;q.beginPath();q.moveTo(x,y);q.lineTo(x-3,y-7);q.moveTo(x,y);q.lineTo(x+3,y-7);q.stroke();}
    q.restore();q.strokeStyle='rgba(255,255,255,.7)';q.lineWidth=3;q.beginPath();roundRectPath(q,f.x+1.5,f.y+1.5,f.w-3,f.h-3,25);q.stroke();
  },
  progress:g=>g.objs?g.eaten/g.objs.length:0,
  down(g,x,y,id){if(!g.drag)g.drag={id,x,y,hx:g.hole.tx,hy:g.hole.ty};},
  move(g,x,y,id){const d=g.drag;if(!d||d.id!==id)return;holeAim(g,d.hx+(x-d.x)*1.15,d.hy+(y-d.y)*1.15);},
  up(g,x,y,id){if(g.drag&&g.drag.id===id)g.drag=null;},
  cancel(g){g.drag=null;},
  tap(g,x,y){holeAim(g,x,y);},
  update(g,dt){
    const h=g.hole;if(!h)return;
    h.x=ease(h.x,h.tx,REDUCED?30:11,dt);h.y=ease(h.y,h.ty,REDUCED?30:11,dt);h.vr=ease(h.vr,h.r,8,dt);h.gulp=Math.max(0,h.gulp-dt*3);
    h.u=(h.x-g.field.x)/g.field.w;h.v=(h.y-g.field.y)/g.field.h;
    for(const o of g.objs){
      o.wob=Math.max(0,o.wob-dt*2);
      if(o.fall>=0){o.fall+=dt/.5;if(o.fall>=1){o.fall=-2;holeEat(g,o);}continue;}
      if(o.fall<-1||g.state!=='play')continue;
      const d=Math.hypot(o.x-h.x,(o.y-h.y)/.75);
      if(o.r<=h.r*.92){if(d<h.r-o.r*.25){o.fall=0;o.sx=o.x;o.sy=o.y;o.spin=o.x<h.x?1:-1;tone(520-o.size*60,.12,'sine',.1,0,300-o.size*40);}}
      else if(d<h.r*.8&&o.wob<=0){o.wob=1;if(time-g.warnAt>2.5){g.warnAt=time;arcadeText(g,'Önce büyü!',o.x,o.y-o.r*2.4,'#6A56D8',20);}}
    }
  },
  draw(g,time){
    const h=g.hole;if(!h)return;const r=h.vr*(1+Math.sin(h.gulp*Math.PI)*.08),t=g.theme;
    ctx.save();ctx.translate(h.x,h.y);ctx.scale(1,.75);
    const glow=ctx.createRadialGradient(0,0,r*.9,0,0,r*1.35);glow.addColorStop(0,t.accent+'AA');glow.addColorStop(1,t.accent+'00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r*1.35,0,7);ctx.fill();
    const pit=ctx.createRadialGradient(0,r*.2,r*.1,0,0,r);pit.addColorStop(0,'#0E0822');pit.addColorStop(.75,'#231A45');pit.addColorStop(1,'#3E2F6E');ctx.fillStyle=pit;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
    if(!REDUCED){ctx.strokeStyle='rgba(180,160,255,.18)';ctx.lineWidth=Math.max(2,r*.05);for(let i=0;i<3;i++){const a=time*1.6+i*2.1;ctx.beginPath();ctx.arc(0,0,r*(.35+i*.18),a,a+1.4);ctx.stroke();}}
    ctx.lineWidth=Math.max(3,r*.08);ctx.strokeStyle=t.accent;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.stroke();
    ctx.lineWidth=1.5;ctx.strokeStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(0,0,r*.93,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    ctx.restore();
    // Falling objects are clipped to the pit so they visibly tip over the rim and sink.
    ctx.save();ctx.beginPath();ctx.ellipse(h.x,h.y,r*.98,r*.735,0,0,7);ctx.clip();
    for(const o of g.objs)if(o.fall>=0){const k=o.fall*o.fall;ctx.save();ctx.translate(o.sx+(h.x-o.sx)*k,o.sy+(h.y-o.sy)*k+o.fall*o.r*2.4);ctx.rotate(o.spin*o.fall*1.3);ctx.scale(1-o.fall*.4,1-o.fall*.4);holeDrawObj(o,0,0,time);ctx.restore();}
    const shade=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,r);shade.addColorStop(0,'rgba(10,6,30,.55)');shade.addColorStop(1,'rgba(10,6,30,0)');ctx.fillStyle=shade;ctx.fillRect(h.x-r,h.y-r,r*2,r*2);
    ctx.restore();
    const left=g.objs.filter(o=>o.fall===-1);
    for(const o of left.sort((a,b)=>a.y-b.y)){
      ctx.save();ctx.globalAlpha=.16;ctx.fillStyle='#233';ctx.beginPath();ctx.ellipse(o.x+o.r*.12,o.y+o.r*.1,o.r*1.05,o.r*.45,0,0,7);ctx.fill();ctx.restore();
      ctx.save();ctx.translate(o.x,o.y);if(o.wob>0&&!REDUCED)ctx.rotate(Math.sin(o.wob*30)*o.wob*.12);holeDrawObj(o,0,0,time);ctx.restore();
    }
    if(left.length&&left.length<=3&&g.idle>1.5)for(const o of left){ctx.save();ctx.globalAlpha=.5+.4*Math.sin(time*6);ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3;ctx.setLineDash([6,6]);ctx.beginPath();ctx.ellipse(o.x,o.y-o.r*.6,o.r*1.7,o.r*1.4,0,0,7);ctx.stroke();ctx.restore();}
  },
  preview(x,y,s,t){
    const r=s*.2;ctx.save();ctx.translate(x,y+s*.12);ctx.scale(1,.75);const pit=ctx.createRadialGradient(0,0,r*.1,0,0,r);pit.addColorStop(0,'#0E0822');pit.addColorStop(1,'#3E2F6E');
    ctx.fillStyle=pit;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.strokeStyle='#FF7AB6';ctx.lineWidth=4;ctx.stroke();ctx.restore();
    const k=(t*.7)%1;ctx.save();ctx.beginPath();ctx.ellipse(x,y+s*.12,r,r*.75,0,0,7);ctx.rect(x-s,y-s,s*2,s*.12+s-r*.75);ctx.clip();
    holeDrawObj({kind:'ball',r:s*.08,color:'#FF6B6B'},x-r*.2+k*r*.2,y+s*.1-r*.3+k*k*s*.3,t);ctx.restore();
    holeDrawObj({kind:'tree',r:s*.1,color:'#5CB85C'},x+s*.3,y+s*.14,t);holeDrawObj({kind:'cone',r:s*.06,color:'#FF9A3C'},x-s*.32,y+s*.18,t);
  }
};
function holePopulate(g){
  const f=g.field,objs=[],hole={u:.5,v:.85,r:1.6,vr:0,gulp:0,x:0,y:0,tx:0,ty:0};
  const colors=['#FF6B6B','#FFB347','#FFD93B','#4DC98F','#4FA8F0','#A77BF3','#FF7AC6'];
  for(let tier=3;tier>=0;tier--)for(let n=0;n<g.plan[tier];n++){
    const size=rnd(...HOLE_SIZE[tier]),kinds=g.theme.tiers[tier];let best=null;
    for(let k=0;k<40;k++){
      const u=rnd(.08,.92),v=rnd(.1,.93),x=u*f.w,y=v*f.h;
      const clear=Math.hypot(x-hole.u*f.w,(y-hole.v*f.h)/.75)>(hole.r+size+1.2)*g.U&&objs.every(o=>Math.hypot(x-o.u*f.w,y-o.v*f.h)>(o.size+size)*g.U*.95);
      if(clear){best={u,v};break;}if(!best)best={u,v};
    }
    objs.push({kind:kinds[(Math.random()*kinds.length)|0],tier,size,u:best.u,v:best.v,color:colors[(Math.random()*colors.length)|0],fall:-1,wob:0,x:0,y:0,r:0});
  }
  g.objs=objs;g.hole=hole;
  for(const o of objs){o.x=f.x+o.u*f.w;o.y=f.y+o.v*f.h;o.r=o.size*g.U;}
}
function holeGrow(g,instant){
  const h=g.hole,area=g.objs.reduce((s,o)=>s+(o.fall===-2?o.size*o.size:0),0);
  h.size=Math.sqrt(1.6*1.6+.5*area);h.r=h.size*g.U;if(instant||!h.vr)h.vr=h.r;
  holeAim(g,h.tx,h.ty);
}
function holeAim(g,x,y){const h=g.hole,f=g.field,m=Math.min(h.r*.7,f.w*.3);h.tx=clamp(x,f.x+m,f.x+f.w-m);h.ty=clamp(y,f.y+m*.75,f.y+f.h-m*.75);}
function holeEat(g,o){
  const h=g.hole;g.eaten++;h.gulp=1;arcadeScore(g,o.tier+1);arcadeReward(g);holeGrow(g,false);
  arcadeBurst(g,h.x,h.y-h.r*.3,o.color,6+o.tier*3,{kind:'star',gravity:300,lift:120});
  if(o.tier>=2){arcadeText(g,o.tier===3?'Dev lokma!':'Nefis!',h.x,h.y-h.r-20,g.theme.accent,22);buzz(12);}
  note(PENTA[(g.eaten+o.tier)%6]*(o.tier>1?.5:1),0,.25);
  if(g.eaten>=g.objs.length)arcadeWin(g);
}
function holeDrawObj(o,x,y,time){
  const r=o.r,c=o.color;ctx.save();ctx.translate(x,y);ctx.lineCap='round';ctx.lineJoin='round';
  const shine=(px,py,pr)=>orb(px,py,pr,'rgba(255,255,255,.5)');
  switch(o.kind){
    case 'flower':ctx.strokeStyle='#3E9B4F';ctx.lineWidth=r*.18;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*1.3);ctx.stroke();for(let i=0;i<5;i++){const a=i*1.26;orb(Math.cos(a)*r*.45,-r*1.5+Math.sin(a)*r*.45,r*.36,c);}orb(0,-r*1.5,r*.3,'#FFE066');break;
    case 'pebble':ctx.fillStyle=o.tier?c:'#B8C0CC';ctx.beginPath();ctx.ellipse(0,-r*.35,r,r*.62,0,0,7);ctx.fill();shine(-r*.35,-r*.6,r*.2);break;
    case 'ball':{const gr=ctx.createRadialGradient(-r*.35,-r*1.35,r*.1,0,-r,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.3,c);gr.addColorStop(1,'rgba(0,0,0,.25)');orb(0,-r,r,c);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,-r,r,0,7);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=r*.16;ctx.beginPath();ctx.arc(0,-r,r*.95,-.4,.8);ctx.stroke();break;}
    case 'cone':ctx.fillStyle='#E0E0E0';ctx.fillRect(-r*.85,-r*.25,r*1.7,r*.3);ctx.fillStyle='#FF8A3D';ctx.beginPath();ctx.moveTo(-r*.6,-r*.2);ctx.lineTo(0,-r*2.2);ctx.lineTo(r*.6,-r*.2);ctx.closePath();ctx.fill();
      ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.moveTo(-r*.42,-r*.8);ctx.lineTo(r*.42,-r*.8);ctx.lineTo(r*.3,-r*1.2);ctx.lineTo(-r*.3,-r*1.2);ctx.closePath();ctx.fill();break;
    case 'bush':for(const [dx,dy,rr] of [[-.5,-.6,.6],[.5,-.6,.6],[0,-1,.75]])orb(dx*r,dy*r,rr*r,'#4CAF6A');for(const [dx,dy,rr] of [[-.3,-1.2,.25],[.35,-.8,.22]])orb(dx*r,dy*r,rr*r,'#6CCB87');orb(-r*.2,-r*.9,r*.1,'#FF7AB6');orb(r*.4,-r*.5,r*.1,'#FFE066');break;
    case 'bench':ctx.fillStyle='#8B5A3C';ctx.fillRect(-r*1.1,-r*.9,r*.16,r*.9);ctx.fillRect(r*.94,-r*.9,r*.16,r*.9);ctx.fillStyle='#C98B5A';pill(-r*1.25,-r*1,r*2.5,r*.3,'#C98B5A',r*.1);pill(-r*1.2,-r*1.7,r*2.4,r*.28,'#D99D6A',r*.1);pill(-r*1.2,-r*1.3,r*2.4,r*.22,'#D99D6A',r*.1);break;
    case 'tree':ctx.fillStyle='#8B5A3C';ctx.fillRect(-r*.18,-r*1.5,r*.36,r*1.5);orb(0,-r*2.3,r*1.05,'#3FA35A');orb(-r*.6,-r*1.9,r*.65,'#48B866');orb(r*.6,-r*1.95,r*.62,'#48B866');orb(-r*.25,-r*2.75,r*.5,'#5FCB7B');
      for(let i=0;i<4;i++)orb(Math.cos(i*1.7)*r*.6,-r*2.2+Math.sin(i*1.7)*r*.5,r*.12,'#FF6B6B');break;
    case 'car':pill(-r*1.2,-r*1.1,r*2.4,r*.8,c,r*.3);pill(-r*.7,-r*1.6,r*1.3,r*.6,c,r*.25);pill(-r*.55,-r*1.5,r*.5,r*.38,'#CFEFFF',r*.1);pill(r*.05,-r*1.5,r*.45,r*.38,'#CFEFFF',r*.1);
      for(const s of [-1,1]){orb(s*r*.68,-r*.3,r*.32,'#333');orb(s*r*.68,-r*.3,r*.13,'#DDD');}orb(r*1.05,-r*.8,r*.1,'#FFF3A0');break;
    case 'shell':ctx.fillStyle='#FFB3C7';ctx.beginPath();ctx.moveTo(0,-r*.1);ctx.arc(0,-r*.1,r,Math.PI*1.05,Math.PI*1.95);ctx.closePath();ctx.fill();ctx.strokeStyle='#F2849E';ctx.lineWidth=r*.08;for(let i=1;i<5;i++){const a=Math.PI*(1.05+i*.18);ctx.beginPath();ctx.moveTo(0,-r*.1);ctx.lineTo(Math.cos(a)*r,-r*.1+Math.sin(a)*r);ctx.stroke();}break;
    case 'starfish':ctx.save();ctx.translate(0,-r*.3);ctx.scale(1,.7);ctx.fillStyle='#FF9A5C';starPath(ctx,r*1.1);ctx.fill();orb(0,0,r*.12,'#FFD1B0');ctx.restore();break;
    case 'bucket':ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-r*.8,-r*1.6);ctx.lineTo(r*.8,-r*1.6);ctx.lineTo(r*.6,0);ctx.lineTo(-r*.6,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#666';ctx.lineWidth=r*.08;ctx.beginPath();ctx.arc(0,-r*1.6,r*.8,Math.PI,0);ctx.stroke();shine(-r*.4,-r*1.2,r*.12);break;
    case 'castle':ctx.fillStyle='#E8C27E';ctx.fillRect(-r*1.1,-r*1.4,r*2.2,r*1.4);for(const dx of [-1.1,-.2,.7]){ctx.fillRect(dx*r,-r*2.2,r*.4,r*.8);ctx.fillRect(dx*r-r*.05,-r*2.35,r*.18,r*.2);ctx.fillRect(dx*r+r*.27,-r*2.35,r*.18,r*.2);}
      ctx.fillStyle='#B98A4A';pill(-r*.25,-r*.7,r*.5,r*.7,'#B98A4A',r*.25);ctx.fillStyle='#FF6B6B';ctx.beginPath();ctx.moveTo(0,-r*2.2);ctx.lineTo(0,-r*2.9);ctx.lineTo(r*.45,-r*2.75);ctx.lineTo(0,-r*2.6);ctx.fill();break;
    case 'umbrella':ctx.strokeStyle='#777';ctx.lineWidth=r*.1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-r*2.4);ctx.stroke();
      for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#FFFFFF':c;ctx.beginPath();ctx.moveTo(0,-r*2.6);ctx.lineTo(-r*1.4+i*r*.47,-r*2);ctx.lineTo(-r*1.4+(i+1)*r*.47,-r*2);ctx.closePath();ctx.fill();}break;
    case 'boat':ctx.fillStyle='#A0522D';ctx.beginPath();ctx.moveTo(-r*1.3,-r*.8);ctx.lineTo(r*1.3,-r*.8);ctx.lineTo(r*.9,0);ctx.lineTo(-r*.9,0);ctx.closePath();ctx.fill();ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.moveTo(0,-r*.9);ctx.lineTo(0,-r*2.6);ctx.lineTo(r*1,-r*1);ctx.closePath();ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-r*.1,-r*.9);ctx.lineTo(-r*.1,-r*2.2);ctx.lineTo(-r*.8,-r*1);ctx.closePath();ctx.fill();break;
    case 'block':pill(-r*.8,-r*1.5,r*1.6,r*1.5,c,r*.2);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(-r*.8,-r*1.5,r*1.6,r*.3);label('ABCD'[Math.floor(r*7)%4],0,-r*.7,r*.9,'#FFFFFF');break;
    case 'duck':orb(0,-r*.6,r*.75,'#FFD93B');orb(r*.45,-r*1.35,r*.45,'#FFD93B');ctx.fillStyle='#FF8A3D';ctx.beginPath();ctx.ellipse(r*.95,-r*1.3,r*.25,r*.12,0,0,7);ctx.fill();orb(r*.55,-r*1.45,r*.08,'#222');orb(-r*.2,-r*.7,r*.35,'#FFE680');break;
    case 'drum':ctx.fillStyle='#E84A5F';ctx.fillRect(-r,-r*1.4,r*2,r*1.2);ctx.fillStyle='#F4F1EA';ctx.beginPath();ctx.ellipse(0,-r*1.4,r,r*.35,0,0,7);ctx.fill();ctx.strokeStyle='#FFD93B';ctx.lineWidth=r*.1;ctx.beginPath();for(let i=0;i<=6;i++)ctx.lineTo(-r+i*r/3,-r*(i%2?.4:1.1));ctx.stroke();break;
    case 'teddy':toy('bear',0,-r*1.05,r*1.05,'#C98B5A');break;
  }
  ctx.restore();
}
