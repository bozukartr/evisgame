/* Blok kulesi · isometric timing stack. Tap to drop the sliding slab; the overhang is sliced off and tumbles away.
   World units: the first slab is 1×1, a layer is SK.h tall; the camera rises with the tower. */
const SK={h:.2,range:1.45,tol:.07};
ARCADE.stack={
  hint:'Blok tam üstüne gelince dokun',
  colors:g=>{const h=g.hue0||200;return [`hsl(${h},72%,58%)`,`hsl(${h},80%,72%)`,`hsl(${h+30},70%,86%)`,`hsl(${h},55%,66%)`];},
  build(g){
    g.hue0=[200,330,150,20,265][(g.lvl-1)%5];g.target=Math.min(8+g.lvl*2,30);g.speed=Math.min(1.05+g.lvl*.08,2.3);
    g.blocks=[{x0:-.5,x1:.5,z0:-.5,z1:.5,layer:0,pop:0}];g.falling=[];g.combo=0;g.placed=0;g.cam=0;g.waves=[];
    stackSpawn(g);
  },
  layout(g){const b=g.box;g.s=Math.min(b.w*.26,b.h*.17,130);g.cx=W/2;g.base=b.y+b.h*.6;},
  progress:g=>g.placed/g.target,
  update(g,dt){
    const m=g.moving;
    if(m&&g.state==='play'){const a=m.axis,top=g.blocks[g.blocks.length-1],c0=(top[a+'0']+top[a+'1'])/2;
      let c=(m[a+'0']+m[a+'1'])/2+m.dir*g.speed*dt;if(c>c0+SK.range){m.dir=-1;c=c0+SK.range;}if(c<c0-SK.range){m.dir=1;c=c0-SK.range;}
      const half=(m[a+'1']-m[a+'0'])/2;m[a+'0']=c-half;m[a+'1']=c+half;}
    g.cam=ease(g.cam,Math.max(0,(g.blocks.length-4)*SK.h),6,dt);
    for(const b of g.blocks)b.pop=Math.max(0,b.pop-dt*3);
    g.falling=g.falling.filter(f=>{f.vy-=9*dt;f.y+=f.vy*dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.life+=dt;return f.life<1.6;});
    g.waves=g.waves.filter(w=>(w.life+=dt)<.6);
  },
  down(g){stackPlace(g);},
  tap(g){stackPlace(g);},
  draw(g,time){
    const top=g.blocks.length;
    const [sx,sy]=stackPt(g,0,0,-.7);ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#1E2A4A';ctx.beginPath();ctx.ellipse(sx,sy+g.s*.55,g.s*1.25,g.s*.5,0,0,7);ctx.fill();ctx.restore();
    stackBox(g,{x0:-.66,x1:.66,z0:-.66,z1:.66},-.7,-.02,[g.hue0,.3,.82],1);
    for(let i=Math.max(0,top-26);i<top;i++){const b=g.blocks[i];stackBox(g,b,i*SK.h,(i+1)*SK.h-.012,stackColor(g,i),1+b.pop*.04);}
    for(const w of g.waves){const q=w.life/.6,b=w.b,grow=.08+q*.35;ctx.save();ctx.globalAlpha=(1-q)*.9;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3*(1-q)+1;
      stackPath(g,[[b.x0-grow,b.z0-grow],[b.x1+grow,b.z0-grow],[b.x1+grow,b.z1+grow],[b.x0-grow,b.z1+grow]],w.y);ctx.stroke();ctx.restore();}
    if(g.moving&&g.state==='play'){const m=g.moving;stackBox(g,m,top*SK.h,(top+1)*SK.h-.012,stackColor(g,top),1);}
    for(const f of g.falling){ctx.save();ctx.globalAlpha=clamp(1.6-f.life,0,1);stackBox(g,{x0:f.x-f.w/2,x1:f.x+f.w/2,z0:f.z-f.d/2,z1:f.z+f.d/2},f.y,f.y+SK.h-.012,f.color,1);ctx.restore();}
  },
  preview(x,y,s,t){
    const v={s:s*.2,cx:x,base:y+s*.24,cam:0};
    for(let i=0;i<4;i++)stackBox(v,{x0:-.5,x1:.5,z0:-.5,z1:.5},i*SK.h,(i+1)*SK.h-.012,[200+i*14,.72,.6],1);
    const c=Math.sin(t*1.8)*.9;stackBox(v,{x0:c-.5,x1:c+.5,z0:-.5,z1:.5},4*SK.h,5*SK.h-.012,[256,.72,.6],1);
  }
};
function stackColor(g,i){return [(g.hue0+i*7)%360,.72,.6];}
const stackPt=(g,x,z,y)=>[g.cx+(x-z)*g.s*.866,g.base+(x+z)*g.s*.5-(y-g.cam)*g.s];
function stackPath(g,pts,y){ctx.beginPath();pts.forEach(([x,z],i)=>{const p=stackPt(g,x,z,y);if(i)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);});ctx.closePath();}
function stackBox(g,b,y0,y1,[h,s,l],scale){
  const P=(x,z,y)=>stackPt(g,x,z,y),hsl=f=>`hsl(${h},${s*100}%,${Math.min(96,l*100*f)}%)`;
  const [a,b1,c,d]=[P(b.x0,b.z1,y1),P(b.x1,b.z1,y1),P(b.x1,b.z0,y1),P(b.x0,b.z0,y1)];
  if(d[1]>H+40||b1[1]+(y1-y0)*g.s<-40)return;
  const lo=(p)=>[p[0],p[1]+(y1-y0)*g.s];
  // Left (+z) and right (+x) walls face the viewer; the top is brightest.
  ctx.fillStyle=hsl(.78);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b1);ctx.lineTo(...lo(b1));ctx.lineTo(...lo(a));ctx.closePath();ctx.fill();
  ctx.fillStyle=hsl(.64);ctx.beginPath();ctx.moveTo(...b1);ctx.lineTo(...c);ctx.lineTo(...lo(c));ctx.lineTo(...lo(b1));ctx.closePath();ctx.fill();
  ctx.fillStyle=hsl(1.12);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b1);ctx.lineTo(...c);ctx.lineTo(...d);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b1);ctx.lineTo(...c);ctx.stroke();
}
function stackSpawn(g){
  const top=g.blocks[g.blocks.length-1],axis=g.blocks.length%2?'x':'z',m={x0:top.x0,x1:top.x1,z0:top.z0,z1:top.z1,axis,dir:1};
  const c=(top[axis+'0']+top[axis+'1'])/2-SK.range,half=(top[axis+'1']-top[axis+'0'])/2;m[axis+'0']=c-half;m[axis+'1']=c+half;g.moving=m;
}
function stackPlace(g){
  const m=g.moving;if(!m||g.state!=='play')return;
  const a=m.axis,top=g.blocks[g.blocks.length-1],layer=g.blocks.length,off=(m[a+'0']+m[a+'1'])/2-(top[a+'0']+top[a+'1'])/2;
  const [ex,ey]=stackPt(g,(m.x0+m.x1)/2,(m.z0+m.z1)/2,(layer+1)*SK.h);
  const color=stackColor(g,layer);
  if(Math.abs(off)<SK.tol){
    m[a+'0']=top[a+'0'];m[a+'1']=top[a+'1'];g.combo++;
    if(g.combo>=3){for(const k of ['x','z']){const c=(m[k+'0']+m[k+'1'])/2,half=Math.min(.5,(m[k+'1']-m[k+'0'])/2+.03);m[k+'0']=c-half;m[k+'1']=c+half;}}
    g.waves.push({b:{...m},y:(layer+1)*SK.h-.012,life:0});arcadeText(g,g.combo>1?`Mükemmel x${g.combo}`:'Mükemmel!',ex,ey-30,`hsl(${g.hue0},75%,50%)`,22);
    arcadeBurst(g,ex,ey,'#FFFFFF',10,{kind:'star',gravity:200});note(PENTA[g.combo%6]*2,0,.3);
  }else{
    const lo=Math.max(m[a+'0'],top[a+'0']),hi=Math.min(m[a+'1'],top[a+'1']);
    if(hi<=lo){
      g.falling.push({x:(m.x0+m.x1)/2,z:(m.z0+m.z1)/2,w:m.x1-m.x0,d:m.z1-m.z0,y:layer*SK.h,vy:0,vx:a==='x'?Math.sign(off)*.6:0,vz:a==='z'?Math.sign(off)*.6:0,color,life:0});
      g.moving=null;arcadeRetry(g);return;
    }
    // The overhang falls away as its own slab.
    const cut=m[a+'0']<lo?[m[a+'0'],lo]:[hi,m[a+'1']],piece={x0:m.x0,x1:m.x1,z0:m.z0,z1:m.z1};piece[a+'0']=cut[0];piece[a+'1']=cut[1];
    g.falling.push({x:(piece.x0+piece.x1)/2,z:(piece.z0+piece.z1)/2,w:piece.x1-piece.x0,d:piece.z1-piece.z0,y:layer*SK.h,vy:0,vx:a==='x'?Math.sign(off)*.5:0,vz:a==='z'?Math.sign(off)*.5:0,color,life:0});
    m[a+'0']=lo;m[a+'1']=hi;g.combo=0;tone(200,.1,'triangle',.12,0,150);
  }
  g.blocks.push({x0:m.x0,x1:m.x1,z0:m.z0,z1:m.z1,layer,pop:1});g.placed++;arcadeScore(g,1+(g.combo>1?1:0));arcadeReward(g);
  tone(PENTA[g.placed%6],.12,'sine',.16);buzz(8);
  if(g.placed>=g.target){g.moving=null;arcadeWin(g);return;}
  stackSpawn(g);
}
