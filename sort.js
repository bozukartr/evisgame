/* Renk sırala · ball-sort puzzle. Tap a tube to lift its top ball, tap another to drop it onto the same colour.
   Every generated puzzle is verified by a bounded solver, so a level can always be finished. */
const SORT_COLORS=['#FF5A5F','#FFB400','#35C27A','#3D9BF5','#A66CFF','#FF7AC6','#1FC2C2'];
const SORT_CAP=4;
ARCADE.sort={
  hint:'Tüpe dokun, topu aynı renge taşı',
  colors:g=>['#7C5CFF','#B9A6FF','#EAE4FF','#C6D6FF'],
  build(g){
    g.nColors=Math.min(3+Math.floor((g.lvl-1)/2),7);g.tubes=sortGenerate(g.nColors);g.sel=-1;g.anims=[];g.undo=[];g.moves=0;g.winAt=0;
    g.done=g.tubes.map(()=>false);g.wob=g.tubes.map(()=>0);g.cap=g.tubes.map(()=>0);g.hidden=g.tubes.map(()=>0);
  },
  layout(g){
    const b=g.box,T=g.tubes.length,rows=T<=6?1:2,per=Math.ceil(T/rows);
    g.tw=Math.min(b.w/(per*1.38),66,(b.h-90)/(rows*(SORT_CAP*.95+1.2)));g.br=g.tw*.42;g.th=SORT_CAP*g.br*2.08+g.br*.9;
    const rowGap=g.th+g.br*3.2,top=b.y+(b.h-60-rows*rowGap)/2+g.br*2.6;
    g.pos=g.tubes.map((_,i)=>{const row=Math.floor(i/per),inRow=Math.min(per,T-row*per),col=i-row*per;return {x:W/2+(col-(inRow-1)/2)*g.tw*1.5,top:top+row*rowGap,bottom:top+row*rowGap+g.th};});
    g.items=g.pos.map((p,i)=>({id:i,x:p.x,y:(p.top+p.bottom)/2,r:g.tw}));g.focus=Math.min(g.focus,g.items.length-1);
    g.undoBtn={x:W/2,y:b.y+b.h-22,r:24};
  },
  progress:g=>g.done.filter(Boolean).length/g.nColors,
  down(g,x,y){sortTap(g,x,y);},
  tap(g,x,y){sortTap(g,x,y);},
  update(g,dt){
    for(let i=0;i<g.tubes.length;i++){g.wob[i]=Math.max(0,g.wob[i]-dt*2.5);g.cap[i]=Math.min(1,g.cap[i]+(g.done[i]?dt*3:0));}
    for(const a of g.anims){a.t+=dt/.42;if(a.t>=1&&!a.landed){a.landed=true;g.hidden[a.to]=Math.max(0,g.hidden[a.to]-1);tone(PENTA[(a.slot+2)%6],.08,'sine',.12);}}
    g.anims=g.anims.filter(a=>a.t<1.25);
    if(g.winAt>0){g.winAt-=dt;if(g.winAt<=0&&g.state==='play'){g.winAt=0;arcadeWin(g);}}
  },
  draw(g,time){
    const hint=g.state==='play'&&g.idle>4&&!g.anims.length?sortHint(g):null;
    g.tubes.forEach((tube,i)=>{
      const p=g.pos[i],w=g.tw,wob=REDUCED?0:Math.sin(g.wob[i]*25)*g.wob[i]*6,glow=hint&&(hint[0]===i||hint[1]===i);
      ctx.save();ctx.translate(wob,0);
      if(glow){ctx.save();ctx.globalAlpha=.45+.35*Math.sin(time*6);ctx.strokeStyle='#FFFFFF';ctx.lineWidth=8;sortTubePath(p.x,p.top,p.bottom,w*1.1);ctx.stroke();ctx.restore();}
      ctx.fillStyle='rgba(255,255,255,.38)';sortTubePath(p.x,p.top,p.bottom,w);ctx.fill();
      const visible=tube.length-g.hidden[i]-(g.sel===i?1:0);
      for(let k=0;k<visible;k++)sortBall(p.x,sortSlotY(g,i,k),g.br,SORT_COLORS[tube[k]],g.done[i],time+i+k);
      ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=3.5;sortTubePath(p.x,p.top,p.bottom,w);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x-w*.3,p.top+8);ctx.lineTo(p.x-w*.3,p.bottom-w*.5);ctx.stroke();
      pill(p.x-w*.62,p.top-5,w*1.24,10,'#FFFFFF',5);
      if(g.done[i]){const c=SORT_COLORS[tube[0]],s=REDUCED?1:easeBack(g.cap[i]);ctx.save();ctx.translate(p.x,p.top-6);ctx.scale(s,s);pill(-w*.62,-12,w*1.24,16,c,8);toy('star',0,-20,9,'#FFD93B');ctx.restore();}
      if(keyboardMode&&document.activeElement===cvs&&g.focus===i){ctx.strokeStyle='#3D5AFE';ctx.lineWidth=3;ctx.setLineDash([6,5]);sortTubePath(p.x,p.top-8,p.bottom+8,w*1.35);ctx.stroke();ctx.setLineDash([]);}
      ctx.restore();
    });
    if(g.sel>=0){const p=g.pos[g.sel],t=g.tubes[g.sel];sortBall(p.x,p.top-g.br*1.7+(REDUCED?0:Math.sin(time*5)*3),g.br,SORT_COLORS[t[t.length-1]],false,time);}
    for(const a of g.anims){
      const q=clamp(a.t,0,1),p0=g.pos[a.from],p1=g.pos[a.to],lift0=p0.top-g.br*1.7,lift1=p1.top-g.br*1.7,slotY=sortSlotY(g,a.to,a.slot);let x,y;
      if(q<.65){const k=q/.65,e=k*k*(3-2*k);x=p0.x+(p1.x-p0.x)*e;y=lift0+(lift1-lift0)*e-Math.sin(k*Math.PI)*g.br*2.2;}
      else{const k=(q-.65)/.35;x=p1.x;y=lift1+(slotY-lift1)*k*k;}
      if(a.t<1)sortBall(x,y,g.br,SORT_COLORS[a.color],false,time);
    }
    if(hint){const a=g.pos[hint[0]],b=g.pos[hint[1]],k=(time*.8)%1;ctx.save();ctx.globalAlpha=.8*(1-k);toy('star',a.x+(b.x-a.x)*k,Math.min(a.top,b.top)-g.br*3-Math.sin(k*Math.PI)*20,8,'#FFD93B');ctx.restore();}
    const u=g.undoBtn,can=g.undo.length>0&&g.state==='play';
    ctx.save();ctx.globalAlpha=can?1:.4;ctx.shadowColor='rgba(60,50,120,.2)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;orb(u.x,u.y,u.r,'#FFFFFF');ctx.restore();
    ctx.save();ctx.globalAlpha=can?1:.4;ctx.strokeStyle='#6A56D8';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.arc(u.x+2,u.y+2,u.r*.42,-Math.PI*.9,Math.PI*.55);ctx.stroke();
    ctx.beginPath();ctx.moveTo(u.x-u.r*.55,u.y-u.r*.35);ctx.lineTo(u.x-u.r*.36,u.y+u.r*.02);ctx.lineTo(u.x-u.r*.02,u.y-u.r*.2);ctx.stroke();ctx.restore();
  },
  preview(x,y,s,t){
    const w=s*.17,r=w*.42,top=y-s*.2,bottom=y+s*.26,cols=[[0,1,0],[1,0,1],[2,2]];
    cols.forEach((c,i)=>{const px=x+(i-1)*w*1.6;ctx.fillStyle='rgba(255,255,255,.45)';sortTubePath(px,top,bottom,w);ctx.fill();
      c.forEach((ci,k)=>sortBall(px,bottom-r*1.2-k*r*2.1,r,SORT_COLORS[ci],false,t+k));ctx.strokeStyle='#FFFFFF';ctx.lineWidth=2.5;sortTubePath(px,top,bottom,w);ctx.stroke();});
    const k=(t*.6)%1;sortBall(x+w*1.6*(k-.5)*2,top-r*1.4-Math.sin(k*Math.PI)*r*1.5,r,SORT_COLORS[3],false,t);
  }
};
function sortTubePath(x,top,bottom,w){ctx.beginPath();ctx.moveTo(x-w/2,top);ctx.lineTo(x-w/2,bottom-w/2);ctx.arc(x,bottom-w/2,w/2,Math.PI,0,true);ctx.lineTo(x+w/2,top);}
const sortSlotY=(g,i,k)=>g.pos[i].bottom-g.br*1.12-k*g.br*2.08;
function sortBall(x,y,r,color,happy,t){
  const gr=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.3,color);gr.addColorStop(1,'rgba(40,20,60,.9)');
  orb(x,y,r,color);ctx.fillStyle=gr;ctx.globalAlpha*=.55;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.globalAlpha/=.55;
  orb(x-r*.35,y-r*.42,r*.2,'rgba(255,255,255,.75)');
  const blink=!happy&&(t*.6%3.3)<.1,es=Math.max(1.2,r*.12);
  if(happy||blink){ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1,r*.1);ctx.lineCap='round';for(const s of [-1,1]){ctx.beginPath();if(happy)ctx.arc(x+s*r*.3,y+r*.02,es,Math.PI*1.1,Math.PI*1.9);else{ctx.moveTo(x+s*r*.3-es,y);ctx.lineTo(x+s*r*.3+es,y);}ctx.stroke();}}
  else for(const s of [-1,1]){orb(x+s*r*.3,y,es,'#2A2233');orb(x+s*r*.3+es*.3,y-es*.35,es*.35,'#FFFFFF');}
  if(happy){ctx.beginPath();ctx.arc(x,y+r*.22,r*.18,.1*Math.PI,.9*Math.PI);ctx.stroke();}
}
function sortCanMove(t,i,j){const a=t[i],b=t[j];return i!==j&&a.length>0&&b.length<SORT_CAP&&(b.length===0||b[b.length-1]===a[a.length-1])&&!(a.length===SORT_CAP&&a.every(c=>c===a[0]));}
function sortApply(t,i,j){let n=0;const c=t[i][t[i].length-1];while(t[i].length&&t[i][t[i].length-1]===c&&t[j].length<SORT_CAP){t[j].push(t[i].pop());n++;}return n;}
const sortSolved=t=>t.every(x=>x.length===0||(x.length===SORT_CAP&&x.every(c=>c===x[0])));
function sortSolvable(start,limit=30000){
  const seen=new Set(),stack=[start.map(x=>x.slice())];let nodes=0;
  while(stack.length){
    const t=stack.pop();if(sortSolved(t))return true;
    const key=t.map(x=>x.join('')).sort().join('|');if(seen.has(key))continue;seen.add(key);if(++nodes>limit)return false;
    for(let i=0;i<t.length;i++)for(let j=0;j<t.length;j++){
      if(!sortCanMove(t,i,j))continue;if(!t[j].length&&t[i].every(c=>c===t[i][0]))continue;
      const n=t.map(x=>x.slice());sortApply(n,i,j);stack.push(n);
    }
  }
  return false;
}
function sortGenerate(n){
  for(let attempt=0;attempt<40;attempt++){
    const balls=shuffle(Array.from({length:n*SORT_CAP},(_,i)=>i%n)),tubes=Array.from({length:n},(_,i)=>balls.slice(i*SORT_CAP,(i+1)*SORT_CAP));
    tubes.push([],[]);
    if(tubes.some(x=>x.length===SORT_CAP&&x.every(c=>c===x[0])))continue;
    if(sortSolvable(tubes))return tubes;
  }
  // Fallback: scramble a solved state with reversible moves only.
  const t=Array.from({length:n},(_,i)=>Array(SORT_CAP).fill(i));t.push([],[]);
  for(let k=0;k<200;k++){const i=(Math.random()*t.length)|0,j=(Math.random()*t.length)|0;if(i===j||!t[i].length||t[j].length>=SORT_CAP)continue;
    const c=t[i][t[i].length-1],below=t[i][t[i].length-2];if(t[i].length>1&&below!==c)continue;t[j].push(t[i].pop());}
  return t;
}
function sortHint(g){
  let empty=null;
  for(let i=0;i<g.tubes.length;i++)for(let j=0;j<g.tubes.length;j++){if(!sortCanMove(g.tubes,i,j))continue;if(g.tubes[j].length)return [i,j];if(!empty&&!g.tubes[i].every(c=>c===g.tubes[i][0]))empty=[i,j];}
  return empty;
}
function sortTap(g,x,y){
  const u=g.undoBtn;
  if(u&&Math.hypot(x-u.x,y-u.y)<u.r*1.2){sortUndo(g);return;}
  const i=g.pos.findIndex(p=>Math.abs(x-p.x)<g.tw*.75&&y>p.top-g.br*3&&y<p.bottom+14);if(i<0)return;g.focus=i;
  const t=g.tubes;
  if(g.sel<0){if(t[i].length&&!g.done[i]){g.sel=i;tone(660,.07,'sine',.12,0,780);}else{g.wob[i]=1;sndSoft();}return;}
  if(g.sel===i){g.sel=-1;sndSoft();return;}
  if(sortCanMove(t,g.sel,i)){
    g.undo.push({tubes:t.map(x=>x.slice()),done:g.done.slice()});if(g.undo.length>30)g.undo.shift();
    const from=g.sel,start=t[i].length,color=t[from][t[from].length-1],n=sortApply(t,from,i);g.sel=-1;g.moves++;
    for(let k=0;k<n;k++)g.anims.push({from,to:i,color,slot:start+k,t:-k*.12,landed:false});g.hidden[i]+=n;
    if(t[i].length===SORT_CAP&&t[i].every(c=>c===t[i][0])&&!g.done[i]){
      g.done[i]=true;g.cap[i]=0;const p=g.pos[i];arcadeBurst(g,p.x,p.top,SORT_COLORS[t[i][0]],16,{kind:'star',gravity:300,lift:160});
      arcadeScore(g,5);arcadeReward(g);[0,2,4].forEach((m,k)=>note(PENTA[m]*2,k*.07,.3));buzz([10,30,10]);
    }else{arcadeScore(g,1);}
    if(sortSolved(t))g.winAt=.6;
    return;
  }
  if(t[i].length&&!g.done[i]){g.sel=i;tone(660,.07,'sine',.12,0,780);}else{g.wob[i]=1;sndSoft();}
}
function sortUndo(g){
  const s=g.undo.pop();if(!s||g.state!=='play'){sndSoft();return;}
  g.tubes=s.tubes;g.done=s.done;g.sel=-1;g.anims.length=0;g.hidden=g.tubes.map(()=>0);g.winAt=0;tone(520,.08,'sine',.1,0,390);
}
