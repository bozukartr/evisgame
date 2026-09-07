/* Touch-first play: every gesture produces feedback; there is no correct answer. */
const FREE_PLAY=['pop','rhythm','pattern','orchard','aquarium','fireworks'];
const sensoryTotals={};
for(const kind of FREE_PLAY){const n=Number(savedProgress.sensoryTotals?.[kind]);sensoryTotals[kind]=Number.isSafeInteger(n)&&n>0?n:0;}
const touchPointers=new Map();
const SENSORY_HINTS={pop:'Dokun, pıt pıt!',rhythm:'İstediğin gibi çal',pattern:'Dokun, çiçekler açsın',orchard:'Dokun, meyveler uçsun',aquarium:'Balıklarla oyna',fireworks:'Gökyüzünü renklendir'};
function artOrToy(name,x,y,size,rotation=0){
  if(!drawTouchArt(name,x,y,size,rotation))toy('star',x,y,size*.28,PALETTE[TOUCH_ART_NAMES.indexOf(name)%6]||PALETTE[1]);
}
function drawSensoryPreview(kind,x,y,s,t){
  const tilt=REDUCED?0:Math.sin(t*1.6)*.08;
  const names={pop:['bubble','bubble'],rhythm:['drum','xylophone'],pattern:['flower','butterfly'],orchard:['apple','pear'],aquarium:['fish','turtle'],fireworks:['rocket','rocket'],learn:['bell','flower']}[kind];
  artOrToy(names[0],x-s*.21,y,s*.61,tilt);artOrToy(names[1],x+s*.21,y-s*.045,s*.52,-tilt);
  if(kind==='fireworks')for(let i=0;i<3;i++)toy('star',x+(i-1)*s*.32,y-s*.23,s*.06,PALETTE[i]);
}
function buildAdventure(type,round){
  const count={pop:8,rhythm:6,pattern:6,orchard:9,aquarium:5,fireworks:3}[type];
  const g={free:true,round,total:sensoryTotals[type]||0,focus:0,effects:[],flights:[],reward:0,soundAt:-1,soundCount:0,items:Array.from({length:count},(_,i)=>({kind:i%3,id:i,pulse:0,stage:0,cooldown:0,dx:0,dy:0,travel:0,turn:1}))};
  level={type,adventure:g,pieces:[],targets:[],cheered:false};resetPhase();phase='play';layoutAdventure();
  cvs.setAttribute('aria-label',GAME_LABELS[type]+'. '+SENSORY_HINTS[type]+'. Her dokunuş serbest. Parmakla gezdirerek de oynayabilirsin.');
}
function layoutAdventure(){
  const g=level.adventure,uh=H-safe.top-safe.bottom,wide=W>H*1.25;
  const w=Math.min(W-safe.left-safe.right-24,800),x=(W-w)/2,top=safe.top+Math.max(92,uh*.23),bottom=H-safe.bottom-78;
  g.box={x,y:top,w,h:Math.max(90,bottom-top)};
  const cols=level.type==='rhythm'||level.type==='pattern'?(wide?3:2):3,rows=Math.ceil(g.items.length/cols);
  g.items.forEach((p,i)=>{
    const cellW=w/cols,cellH=g.box.h/(level.type==='orchard'?rows+.65:rows);
    p.r=Math.max(22,Math.min(cellW*.39,cellH*.40,78));
    p.x=x+cellW*(i%cols+.5);p.y=top+cellH*(Math.floor(i/cols)+.5);
    if(level.type==='aquarium'){p.r=Math.min(w*.14,g.box.h*.17,80);p.x=x+w*(.18+(i%3)*.30);p.y=top+g.box.h*(.22+Math.floor(i/3)*.39);}
    if(level.type==='fireworks'){p.r=Math.min(42,g.box.h*.18);p.y=top+g.box.h-p.r*.9;}
    p.tx=p.x;p.ty=p.y;
  });
  unit=Math.min(W,uh)*.08;g.flights.length=0;g.effects.length=0;
  const scene=document.createElement('canvas');scene.width=Math.ceil(w*DPR);scene.height=Math.ceil(g.box.h*DPR);const c=scene.getContext('2d');c.scale(DPR,DPR);
  const palettes={pop:['#e8f8ff','#d2eaf9'],rhythm:['#fff2e1','#ffe0da'],pattern:['#edf9db','#cce8b4'],orchard:['#e5f5d4','#d6eab4'],aquarium:['#aee7eb','#59b7ce'],fireworks:['#7371ac','#494f81']};
  const grad=c.createLinearGradient(0,0,0,g.box.h);grad.addColorStop(0,palettes[level.type][0]);grad.addColorStop(1,palettes[level.type][1]);c.fillStyle=grad;c.beginPath();roundRectPath(c,0,0,w,g.box.h,30);c.fill();
  c.save();c.clip();
  if(level.type==='aquarium'){
    for(let i=0;i<5;i++){c.fillStyle='#ffffff14';c.beginPath();c.moveTo(w*(i*.28-.1),0);c.lineTo(w*(i*.28+.14),0);c.lineTo(w*(i*.28+.5),g.box.h);c.lineTo(w*(i*.28+.32),g.box.h);c.fill();}
    c.fillStyle='#e6d9b9';c.beginPath();c.ellipse(w*.5,g.box.h+12,w*.8,45,0,0,7);c.fill();
    for(let i=0;i<8;i++){c.strokeStyle=i%2?'#489a9d':'#73b8a5';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(w*i/7,g.box.h+5);c.bezierCurveTo(w*i/7-20,g.box.h-20,w*i/7+15,g.box.h-35,w*i/7,g.box.h-65);c.stroke();}
  }else if(level.type==='fireworks'){
    for(let i=0;i<35;i++){const sx=(i*.618%1)*w,sy=(i*.417%1)*g.box.h;c.fillStyle='#ffffff77';c.beginPath();c.arc(sx,sy,i%3===0?2:1,0,7);c.fill();}
  }else if(level.type==='orchard'){
    for(let i=0;i<3;i++){const tx=w*(i+.5)/3;c.strokeStyle='#b6bc86';c.lineWidth=13;c.beginPath();c.moveTo(tx,g.box.h*.82);c.lineTo(tx,g.box.h*.2);c.stroke();c.fillStyle=i%2?'#a7d2a1':'#b9dbaa';c.beginPath();c.ellipse(tx,g.box.h*.39,w*.19,g.box.h*.38,0,0,7);c.fill();}
  }else{
    for(let i=0;i<18;i++){c.fillStyle='#ffffff50';c.beginPath();c.arc((i*.618%1)*w,(i*.417%1)*g.box.h,3+i%3,0,7);c.fill();}
  }
  c.restore();g.scene=scene;
}
function drawSensoryHud(){
  const g=level.adventure,w=Math.min(W-safe.left-safe.right-32,440),x=(W-w)/2,y=safe.top+14;
  pill(x,y,w,44,'#FFFFFFDD',20);label(GAME_LABELS[level.type],W/2,y+22,15);
  if(g.reward>0)toy('star',W/2,H-safe.bottom-34,16,'#FFD77A');
}
function touchAllowed(){return appView==='game'&&!!level?.adventure&&phase==='play'&&resetSheet.hidden&&demoAd.hidden&&parentSheet.hidden&&document.visibilityState!=='hidden';}
function startTouch(e){
  if(!touchAllowed())return;
  touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,at:time,item:-1});
  tapAdventure(e.clientX,e.clientY);try{cvs.setPointerCapture(e.pointerId);}catch(err){}
}
function moveTouch(e){
  const d=touchPointers.get(e.pointerId);if(!d)return false;
  if(!touchAllowed()){endTouch(e);return true;}
  e.preventDefault();
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<12||time-d.at<.075)return true;
  d.x=e.clientX;d.y=e.clientY;d.at=time;tapAdventure(d.x,d.y,true);return true;
}
function endTouch(e){if(!touchPointers.has(e.pointerId))return;touchPointers.delete(e.pointerId);try{if(cvs.hasPointerCapture(e.pointerId))cvs.releasePointerCapture(e.pointerId);}catch(err){}}
function effect(g,e){g.effects.push(e);if(g.effects.length>96)g.effects.splice(0,g.effects.length-96);}
function sparkle(g,x,y,color,n=8,kind='spark'){
  for(let i=0;i<(REDUCED?Math.min(n,3):n);i++){const a=i/n*Math.PI*2+rnd(-.2,.2),speed=rnd(25,95);effect(g,{kind,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:0,max:rnd(.55,1.05),color,r:rnd(3,7)});}
}
function playTouchSound(type,p,fallback){
  const freq=PENTA[(p?.id??fallback)%6];
  if(type==='rhythm'&&p?.kind===0){tone(p.id<3?135:190,.18,'sine',.28,0,45);return;}
  if(type==='rhythm'&&p?.kind===2){tone(freq,.5,'sine',.22);tone(freq*2.76,.3,'sine',.055);return;}
  if(type==='pop'){tone(420,.1,'sine',.17,0,920);return;}
  note(freq,0,type==='fireworks'?.14:.24);
}
function tapAdventure(x,y,drag=false){
  if(!touchAllowed())return;
  const g=level.adventure,b=g.box;
  x=clamp(x,b.x+8,b.x+b.w-8);y=clamp(y,b.y+8,b.y+b.h-8);
  const p=g.items.find(p=>Math.hypot(x-p.x,y-p.y)<p.r*1.2),color=PALETTE[(p?.id??Math.floor(x/60))%6];
  effect(g,{kind:'ring',x,y,life:0,max:REDUCED?.25:.55,color,r:18});
  if(g.soundAt<0||time-g.soundAt>.065){g.soundAt=time;g.soundCount=0;}
  if(g.soundCount<4){playTouchSound(level.type,p,Math.floor(x/b.w*6)%6);g.soundCount++;}
  if(p)p.pulse=1;
  switch(level.type){
    case 'rhythm':{
      if(!p){sparkle(g,x,y,color,5,'note');break;}
      if(drag&&p.cooldown>0)break;p.cooldown=.1;
      sparkle(g,p.x,p.y-p.r*.5,color,6,'note');break;
    }
    case 'pattern':{
      const flower=p||g.items.reduce((a,q)=>Math.hypot(q.x-x,q.y-y)<Math.hypot(a.x-x,a.y-y)?q:a);
      if(!drag||flower.cooldown<=0){flower.stage=Math.min(3,flower.stage+1);flower.pulse=1;flower.cooldown=.24;sparkle(g,flower.x,flower.y,color,10);if(flower.stage===3)effect(g,{kind:'butterfly',x:flower.x,y:flower.y-20,vx:rnd(-22,22),vy:-34,life:0,max:2.4,color,r:30});}
      break;
    }
    case 'orchard':{
      if(p&&p.cooldown<=0){p.cooldown=.65;g.flights.push({kind:p.kind,x:p.x,y:p.y,life:0,max:.6});if(g.flights.length>16)g.flights.shift();}
      else sparkle(g,x,y,color,5);break;
    }
    case 'pop':{
      if(p&&p.cooldown<=0){p.cooldown=.5;sparkle(g,p.x,p.y,color,14);}
      else sparkle(g,x,y,color,7);break;
    }
    case 'aquarium':{
      for(const q of g.items){q.tx=clamp(x+(q.id-2)*20,b.x+q.r,b.x+b.w-q.r);q.ty=clamp(y+(q.id%2?22:-22),b.y+q.r,b.y+b.h-q.r);q.travel=2;}
      sparkle(g,x,y,'#FFF1BB',8,'food');break;
    }
    case 'fireworks':{
      const fy=p?b.y+b.h*.28:y;
      for(let i=0;i<(REDUCED?4:36);i++){const angle=i/36*Math.PI*2,speed=rnd(90,210);effect(g,{kind:'firework',x:x+Math.cos(angle)*9,y:fy+Math.sin(angle)*9,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:0,max:rnd(1,1.6),color:PALETTE[(i+(p?.id||0))%6],r:rnd(3,6)});}
      if(!REDUCED)effect(g,{kind:'rocket',x,y:b.y+b.h-30,vx:0,vy:(fy-b.y-b.h+30)/.45,life:0,max:.45,color,r:25});
      break;
    }
  }
  // Small, non-blocking rewards. Free play never enters win/ad/demo phases.
  if(!drag){g.total++;sensoryTotals[level.type]=g.total;
    if(g.total%12===0){g.reward=1.4;stars++;levelIndex++;modeRounds[level.type]=(modeRounds[level.type]||0)+1;saveProgress();}
  }
  if(parts.length>120)parts.splice(0,parts.length-120);
}
function updateAdventure(dt){
  const g=level.adventure,b=g.box;g.reward=Math.max(0,g.reward-dt);
  for(const p of g.items){p.pulse=Math.max(0,p.pulse-dt*3);p.cooldown=Math.max(0,p.cooldown-dt);
    if(level.type==='aquarium'){
      p.travel-=dt;if(p.travel<=0){p.tx=rnd(b.x+p.r,b.x+b.w-p.r);p.ty=rnd(b.y+p.r,b.y+b.h-p.r);p.travel=rnd(2,4);}
      p.turn=p.tx<p.x?-1:1;p.x=ease(p.x,p.tx,REDUCED?5:.8,dt);p.y=ease(p.y,p.ty,REDUCED?5:.8,dt);
    }
  }
  g.flights=g.flights.filter(f=>{f.life+=dt;return f.life<f.max;});
  g.effects=g.effects.filter(e=>{e.life+=dt;if(!REDUCED){e.x+=e.vx*dt||0;e.y+=e.vy*dt||0;}return e.life<e.max;});
}
function drawAdventure(time){
  const g=level.adventure,b=g.box;
  ctx.drawImage(g.scene,b.x,b.y,b.w,b.h);
  if(H-safe.top-safe.bottom>=500)label(SENSORY_HINTS[level.type],W/2,b.y-22,14,'#688496');
  for(const p of g.items){
    const pulse=REDUCED?1:1+Math.sin(p.pulse*Math.PI)*.12,r=p.r*pulse;
    if(level.type==='rhythm'){
      pill(p.x-p.r*1.05,p.y-p.r*1.05,p.r*2.1,p.r*2.1,p.pulse>0?'#FFFFFF':'#ffffffa8',24);
      artOrToy(['drum','xylophone','bell'][p.kind],p.x,p.y,r*2.05,REDUCED?0:Math.sin(p.pulse*8)*p.pulse*.12);
      for(let i=0;i<=p.id;i++)orb(p.x+(i-p.id/2)*7,p.y+p.r*.9,2.3,PALETTE[p.id]);
    }else if(level.type==='pattern'){
      ctx.strokeStyle='#75B190';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+p.r*.7,p.r*.65,7,0,0,7);ctx.stroke();
      if(p.stage===0){orb(p.x,p.y,p.r*.72,'#ffffff80');artOrToy('flower',p.x,p.y+p.r*.15,p.r*1.05);}
      else artOrToy('flower',p.x,p.y+p.r*(.28-p.stage*.06),r*(.85+p.stage*.38));
    }else if(level.type==='orchard'){
      if(p.cooldown>0)continue;artOrToy(['apple','orange','pear'][p.kind],p.x,p.y,r*2.05);
    }else if(level.type==='pop'){
      if(p.cooldown>0)continue;const bob=REDUCED?0:Math.sin(time*1.3+p.id)*4;artOrToy('bubble',p.x,p.y+bob,r*2.15);toy(['heart','star','flower'][p.kind],p.x,p.y+bob,r*.22,PALETTE[p.id%6]);
    }else if(level.type==='aquarium'){
      ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.turn,1);artOrToy(p.id===4?'turtle':'fish',0,0,r*2.2,REDUCED?0:Math.sin(time*2+p.id)*.07);ctx.restore();
    }else artOrToy('rocket',p.x,p.y,r*2,REDUCED?0:Math.sin(time+p.id)*.07);
    if(keyboardMode&&document.activeElement===cvs&&g.items[g.focus]===p){ctx.strokeStyle='#477CAA';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.1,0,7);ctx.stroke();}
  }
  if(level.type==='orchard'){
    const by=b.y+b.h-24;basket(W/2,by,Math.min(40,b.h*.085));
    for(const f of g.flights){const t=f.life/f.max,tx=f.x+(W/2-f.x)*t,ty=f.y+(by-f.y)*t-(REDUCED?0:Math.sin(t*Math.PI)*42);artOrToy(['apple','orange','pear'][f.kind],REDUCED?W/2:tx,REDUCED?by:ty,42*(1-t*.35));}
  }
  for(const e of g.effects){
    const a=1-e.life/e.max;ctx.save();ctx.globalAlpha=a;
    if(e.kind==='ring'){ctx.strokeStyle=e.color;ctx.lineWidth=REDUCED?3:3*a;ctx.beginPath();ctx.arc(e.x,e.y,e.r+(REDUCED?0:e.life*65),0,7);ctx.stroke();}
    else if(e.kind==='butterfly')artOrToy('butterfly',e.x,e.y,e.r*2,REDUCED?0:Math.sin(e.life*8)*.2);
    else if(e.kind==='rocket')artOrToy('rocket',e.x,e.y,e.r*2);
    else if(e.kind==='note'){orb(e.x,e.y,e.r,e.color);ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(e.x+e.r,e.y);ctx.lineTo(e.x+e.r,e.y-e.r*3);ctx.stroke();}
    else if(e.kind==='firework'){if(!REDUCED){ctx.strokeStyle=e.color;ctx.lineWidth=2*a;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.x-e.vx*.09,e.y-e.vy*.09);ctx.lineTo(e.x,e.y);ctx.stroke();}orb(e.x,e.y,e.r,e.color);orb(e.x,e.y,e.r*.35,'#FFFBEA');}
    else if(e.kind==='food')orb(e.x,e.y,e.r*.65,e.color);
    else toy('star',e.x,e.y,e.r,e.color);
    ctx.restore();
  }
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&level?.adventure){saveProgress();cancelAllPointers();}});
window.addEventListener('pagehide',()=>{if(level?.adventure)saveProgress();cancelAllPointers();});
