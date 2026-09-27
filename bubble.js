/* Balon atıcı · aim, shoot, and pop groups of three or more; bubbles cut loose from the top fall away.
   The board is a hex grid; a parity flag lets new rows slide in from the top without moving old bubbles. */
const BUBBLE_COLORS=['#FF5A6E','#FFB020','#34C77B','#3D9BF5','#A66CFF','#FF7AC6'];
const BUBBLE_COLS=9;
ARCADE.bubble={
  hint:'Nişan al, bırak: 3 aynı renk patlar',
  colors:g=>['#3D9BF5','#9CCBFF','#E4F1FF','#BFD9F7'],
  build(g){
    const L=g.lvl;g.ncol=Math.min(3+Math.floor((L-1)/2),6);g.grid=new Map();g.shift=0;g.shots=0;g.every=L>=3?Math.max(5,9-L):0;
    const rows=Math.min(4+Math.floor(L/2),8);
    for(let r=0;r<rows;r++)for(let c=0;c<BUBBLE_COLS;c++)g.grid.set(r+','+c,{color:(Math.random()*g.ncol)|0,pop:0});
    g.shot=null;g.aimA=-Math.PI/2;g.aiming=false;g.falling=[];g.popping=[];g.cur=bubblePick(g);g.next=bubblePick(g);g.swap=0;g.start=g.grid.size;
  },
  layout(g){
    const b=g.box;g.r=Math.min(b.w/(BUBBLE_COLS*2+1),b.h/34);g.left=W/2-g.r*(BUBBLE_COLS*2+1)/2;g.top=b.y+6;g.rowH=g.r*1.74;
    g.sx=W/2;g.sy=b.y+b.h-g.r*2.4;g.dead=g.sy-g.r*3.2;
  },
  progress:g=>1-g.grid.size/g.start,
  down(g,x,y,id){g.aiming=id;bubbleAim(g,x,y);},
  move(g,x,y,id){if(g.aiming===id)bubbleAim(g,x,y);},
  up(g,x,y,id,cancelled){if(g.aiming!==id)return;g.aiming=false;if(!cancelled){bubbleAim(g,x,y);bubbleShoot(g);}},
  cancel(g){g.aiming=false;},
  tap(g,x,y){bubbleAim(g,x,y);bubbleShoot(g);},
  update(g,dt){
    g.swap=Math.max(0,g.swap-dt*4);
    for(const v of g.grid.values())v.pop=Math.max(0,v.pop-dt*4);
    g.popping=g.popping.filter(p=>(p.t+=dt)<.3);
    g.falling=g.falling.filter(f=>{f.vy+=1400*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;return f.y<H+40;});
    const s=g.shot;if(!s||g.state!=='play')return;
    const speed=g.box.h*2,steps=Math.ceil(speed*dt/(g.r*.4));
    for(let i=0;i<steps;i++){
      s.x+=s.vx*dt/steps;s.y+=s.vy*dt/steps;
      if(s.x<g.left+g.r){s.x=g.left+g.r;s.vx=Math.abs(s.vx);}if(s.x>g.left+g.r*BUBBLE_COLS*2){s.x=g.left+g.r*BUBBLE_COLS*2;s.vx=-Math.abs(s.vx);}
      let hit=s.y<=g.top+g.r;
      if(!hit)for(const k of g.grid.keys()){const [r,c]=k.split(',').map(Number),p=bubblePos(g,r,c);if((p.x-s.x)**2+(p.y-s.y)**2<(g.r*1.75)**2){hit=true;break;}}
      if(hit){bubbleSettle(g,s);return;}
    }
  },
  draw(g,time){
    ctx.save();ctx.globalAlpha=.55;pill(g.left-6,g.top-6,g.r*(BUBBLE_COLS*2+1)+12,g.dead-g.top+12,'rgba(255,255,255,.55)',20);ctx.restore();
    const close=[...g.grid.keys()].some(k=>bubblePos(g,+k.split(',')[0],0).y+g.r>g.dead-g.rowH*1.2);
    ctx.save();ctx.globalAlpha=close?.5+.5*Math.sin(time*10):.35;ctx.strokeStyle=close?'#FF4D5E':'#FFFFFF';ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(g.left,g.dead);ctx.lineTo(g.left+g.r*BUBBLE_COLS*2+g.r,g.dead);ctx.stroke();ctx.restore();
    for(const [k,v] of g.grid){const [r,c]=k.split(',').map(Number),p=bubblePos(g,r,c);bubbleDraw(p.x,p.y,g.r*(1+Math.sin(v.pop*Math.PI)*.12),v.color,time+r*.3+c);}
    for(const p of g.popping){const q=p.t/.3;ctx.save();ctx.globalAlpha=1-q;ctx.strokeStyle=BUBBLE_COLORS[p.color];ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,g.r*(1+q*.8),0,7);ctx.stroke();ctx.restore();}
    for(const f of g.falling)bubbleDraw(f.x,f.y,g.r,f.color,time);
    if(!g.shot&&g.state==='play'){
      // Aim guide: follows wall bounces until it would touch the bubbles.
      let x=g.sx,y=g.sy,vx=Math.cos(g.aimA),vy=Math.sin(g.aimA);ctx.fillStyle='rgba(255,255,255,.85)';
      for(let i=0;i<60;i++){x+=vx*g.r*.9;y+=vy*g.r*.9;if(x<g.left+g.r){x=g.left+g.r;vx=-vx;}if(x>g.left+g.r*BUBBLE_COLS*2){x=g.left+g.r*BUBBLE_COLS*2;vx=-vx;}
        if(y<g.top+g.r||[...g.grid.keys()].some(k=>{const [r,c]=k.split(',').map(Number),p=bubblePos(g,r,c);return (p.x-x)**2+(p.y-y)**2<(g.r*1.7)**2;}))break;
        if(i%2===0){ctx.globalAlpha=1-i/70;ctx.beginPath();ctx.arc(x,y,Math.max(2,g.r*.18),0,7);ctx.fill();}}
      ctx.globalAlpha=1;
    }
    ctx.save();ctx.translate(g.sx,g.sy);ctx.rotate(g.aimA+Math.PI/2);pill(-g.r*.55,-g.r*2.2,g.r*1.1,g.r*1.8,'#6C7BA8',g.r*.4);ctx.restore();
    orb(g.sx,g.sy+g.r*.4,g.r*1.45,'#8494C4');orb(g.sx,g.sy+g.r*.4,g.r*1.2,'#A3B1DB');
    if(g.shot)bubbleDraw(g.shot.x,g.shot.y,g.r,g.shot.color,time);else bubbleDraw(g.sx,g.sy-g.swap*g.r,g.r,g.cur,time);
    const nx=g.sx+g.r*3.4;pill(nx-g.r*1.1,g.sy-g.r*1.1,g.r*2.2,g.r*2.2,'rgba(255,255,255,.7)',g.r);bubbleDraw(nx,g.sy,g.r*.72,g.next,time);
  },
  preview(x,y,s,t){
    const r=s*.07;for(let row=0;row<3;row++)for(let c=0;c<5-row%2;c++){if(row===2&&c===2&&Math.sin(t*2)>0)continue;bubbleDraw(x-r*4+c*r*2+(row%2)*r,y-s*.3+row*r*1.74,r,(row+c)%4,t);}
    const k=(t*.8)%1;bubbleDraw(x+Math.sin(k*9)*r*.8,y+s*.24-k*s*.25,r,2,t);
  }
};
function bubbleDraw(x,y,r,color,t){
  const c=BUBBLE_COLORS[color];const gr=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.3,c);gr.addColorStop(1,shadeHex(c,.62));
  ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();orb(x-r*.35,y-r*.42,r*.2,'rgba(255,255,255,.75)');
  const blink=(t*.5%3.7)<.1,es=Math.max(1,r*.11);
  if(blink){ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1,r*.08);for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(x+s*r*.3-es,y+r*.05);ctx.lineTo(x+s*r*.3+es,y+r*.05);ctx.stroke();}}
  else for(const s of [-1,1]){orb(x+s*r*.3,y+r*.05,es,'#2A2233');orb(x+s*r*.3+es*.3,y+r*.05-es*.35,es*.35,'#FFFFFF');}
}
const bubbleOdd=(g,r)=>((r+g.shift)&1)===1;
function bubblePos(g,r,c){return {x:g.left+g.r+c*g.r*2+(bubbleOdd(g,r)?g.r:0),y:g.top+g.r+r*g.rowH};}
function bubbleNeighbors(g,r,c){const o=bubbleOdd(g,r)?1:0;return [[r,c-1],[r,c+1],[r-1,c-1+o],[r-1,c+o],[r+1,c-1+o],[r+1,c+o]].filter(([a,b])=>a>=0&&b>=0&&b<BUBBLE_COLS);}
function bubblePick(g){const present=[...new Set([...g.grid.values()].map(v=>v.color))];return present.length?present[(Math.random()*present.length)|0]:(Math.random()*g.ncol)|0;}
function bubbleAim(g,x,y){g.aimA=clamp(Math.atan2(y-g.sy,x-g.sx),-Math.PI+.2,-.2);}
function bubbleShoot(g){if(g.shot||g.state!=='play')return;g.shot={x:g.sx,y:g.sy,vx:Math.cos(g.aimA)*g.box.h*2,vy:Math.sin(g.aimA)*g.box.h*2,color:g.cur};g.cur=g.next;g.next=bubblePick(g);g.swap=1;tone(380,.08,'sine',.1,0,600);}
function bubbleSettle(g,s){
  let best=null,bd=Infinity;const r0=Math.max(0,Math.round((s.y-g.top-g.r)/g.rowH));
  for(let r=Math.max(0,r0-1);r<=r0+1;r++)for(let c=0;c<BUBBLE_COLS;c++){if(g.grid.has(r+','+c))continue;const p=bubblePos(g,r,c),d=(p.x-s.x)**2+(p.y-s.y)**2;if(d<bd){bd=d;best=[r,c];}}
  g.shot=null;if(!best)return;
  const key=best.join(',');g.grid.set(key,{color:s.color,pop:1});g.shots++;tone(260,.06,'sine',.1);
  // Flood-fill the same colour; three or more pop.
  const group=[key],seen=new Set(group);
  for(let i=0;i<group.length;i++){const [r,c]=group[i].split(',').map(Number);for(const [a,b] of bubbleNeighbors(g,r,c)){const k=a+','+b,v=g.grid.get(k);if(v&&!seen.has(k)&&v.color===s.color){seen.add(k);group.push(k);}}}
  let popped=0,dropped=0;
  if(group.length>=3){
    for(const k of group){const [r,c]=k.split(',').map(Number),p=bubblePos(g,r,c),v=g.grid.get(k);g.popping.push({x:p.x,y:p.y,color:v.color,t:0});arcadeBurst(g,p.x,p.y,BUBBLE_COLORS[v.color],5,{kind:'drop',gravity:600});g.grid.delete(k);popped++;}
    const anchored=new Set(),queue=[...g.grid.keys()].filter(k=>k.startsWith('0,'));queue.forEach(k=>anchored.add(k));
    for(let i=0;i<queue.length;i++){const [r,c]=queue[i].split(',').map(Number);for(const [a,b] of bubbleNeighbors(g,r,c)){const k=a+','+b;if(g.grid.has(k)&&!anchored.has(k)){anchored.add(k);queue.push(k);}}}
    for(const [k,v] of [...g.grid]){if(anchored.has(k))continue;const [r,c]=k.split(',').map(Number),p=bubblePos(g,r,c);g.falling.push({x:p.x,y:p.y,vx:rnd(-60,60),vy:rnd(-120,0),color:v.color});g.grid.delete(k);dropped++;}
    arcadeScore(g,popped+dropped*2);arcadeReward(g,1+(dropped>2?1:0));note(PENTA[popped%6]*2,0,.3);buzz(10);
    if(popped+dropped>=6)arcadeText(g,dropped>2?'Şelale!':'Harika!',s.x,s.y+40,'#3D9BF5',26);
    if(!g.grid.size){arcadeWin(g);return;}
  }
  if(g.every&&g.shots%g.every===0&&!popped)bubbleAddRow(g);
  if([...g.grid.keys()].some(k=>bubblePos(g,+k.split(',')[0],0).y+g.r>g.dead))arcadeRetry(g);
}
function bubbleAddRow(g){
  const next=new Map();for(const [k,v] of g.grid){const [r,c]=k.split(',').map(Number);next.set((r+1)+','+c,v);}
  g.shift^=1;for(let c=0;c<BUBBLE_COLS;c++)next.set('0,'+c,{color:(Math.random()*g.ncol)|0,pop:1});g.grid=next;tone(180,.12,'sine',.12);
}
