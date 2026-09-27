/* Touch-first play: every gesture produces feedback; there is no correct answer. */
const FREE_PLAY=['pop','rhythm','pattern','orchard','aquarium','fireworks','paint','tumble','tower','stack','slice','hole','merge','sort'];
const sensoryTotals={};
for(const kind of FREE_PLAY){const n=Number(savedProgress.sensoryTotals?.[kind]);sensoryTotals[kind]=Number.isSafeInteger(n)&&n>0?n:0;}
const touchPointers=new Map();
const SENSORY_HINTS={tower:'Dokun ya da basılı tut',paint:'Parmağın fırçan',tumble:'Dokun, devir, yeniden kur',pop:'Dokun, pıt pıt!',rhythm:'İstediğin gibi çal',pattern:'Dokun, çiçekler açsın',orchard:'Dokun, meyveler uçsun',aquarium:'Balıklarla oyna',fireworks:'Gökyüzünü renklendir'};
function artOrToy(name,x,y,size,rotation=0){
  if(!drawTouchArt(name,x,y,size,rotation))toy('star',x,y,size*.28,PALETTE[TOUCH_ART_NAMES.indexOf(name)%6]||PALETTE[1]);
}
function drawSensoryPreview(kind,x,y,s,t){
  if(kind==='tower'){drawTowerPreview(x,y,s,t);return;}
  if(ARCADE[kind]){drawArcadePreview(kind,x,y,s,t);return;}
  if(kind==='paint'||kind==='tumble'){artOrToy(kind==='paint'?'palette':'blocks',x,y,s*.88);return;}
  if(kind==='more'){artOrToy('fish',x-s*.17,y,s*.55);artOrToy('rocket',x+s*.19,y,s*.55);return;}
  const tilt=REDUCED?0:Math.sin(t*1.6)*.08;
  const names={pop:['bubble','bubble'],rhythm:['drum','xylophone'],pattern:['flower','butterfly'],orchard:['apple','pear'],aquarium:['fish','turtle'],fireworks:['rocket','rocket'],learn:['bell','flower']}[kind];
  artOrToy(names[0],x-s*.21,y,s*.61,tilt);artOrToy(names[1],x+s*.21,y-s*.045,s*.52,-tilt);
  if(kind==='fireworks')for(let i=0;i<3;i++)toy('star',x+(i-1)*s*.32,y-s*.23,s*.06,PALETTE[i]);
}
function buildAdventure(type,round){
  if(type==='tower'){buildTower();return;}
  if(ARCADE[type]){buildArcade(type);return;}
  if(type==='paint'||type==='tumble'){buildStudio(type);return;}
  const count={pop:8,rhythm:6,pattern:6,orchard:9,aquarium:5,fireworks:3}[type];
  const g={free:true,round,total:sensoryTotals[type]||0,focus:0,effects:[],flights:[],reward:0,soundAt:-1,soundCount:0,items:Array.from({length:count},(_,i)=>({kind:i%3,id:i,actor:character(i),pulse:0,stage:0,cooldown:0,dx:0,dy:0,travel:0,turn:1}))};
  level={type,adventure:g,pieces:[],targets:[],cheered:false};resetPhase();phase='play';layoutAdventure();
  cvs.setAttribute('aria-label',GAME_LABELS[type]+'. '+SENSORY_HINTS[type]+'. Her dokunuş serbest. Parmakla gezdirerek de oynayabilirsin.');
}
function layoutAdventure(){
  if(level.adventure.tower){layoutTower();return;}
  if(level.adventure.arcade){layoutArcade();return;}
  if(level.adventure.studio){layoutStudio();return;}
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
    c.fillStyle='#e6d9b9';c.beginPath();c.ellipse(w*.5,g.box.h+12,w*.8,45,0,0,7);c.fill();
    for(let i=0;i<40;i++){c.fillStyle=i%2?'#d7c79f':'#f3e8cc';c.beginPath();c.arc((i*.618%1)*w,g.box.h-6-(i*.37%1)*22,1.5+i%2,0,7);c.fill();}
    for(const [sx,sr] of [[.14,16],[.8,11],[.9,8]]){c.fillStyle='#b8a98a';c.beginPath();c.ellipse(w*sx,g.box.h-18,sr*1.4,sr,0,Math.PI,0);c.fill();c.fillStyle='#ffffff30';c.beginPath();c.ellipse(w*sx-sr*.4,g.box.h-18-sr*.55,sr*.45,sr*.22,0,0,7);c.fill();}
  }else if(level.type==='fireworks'){
    for(let i=0;i<35;i++){const sx=(i*.618%1)*w,sy=(i*.417%1)*g.box.h*.8;c.fillStyle='#ffffff77';c.beginPath();c.arc(sx,sy,i%3===0?2:1,0,7);c.fill();}
    const mx=w*.82,my=g.box.h*.14,mr=Math.min(24,w*.06),glow=c.createRadialGradient(mx,my,mr*.5,mx,my,mr*3);glow.addColorStop(0,'#FFF6D060');glow.addColorStop(1,'#FFF6D000');c.fillStyle=glow;c.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
    c.fillStyle='#FFF4C9';c.beginPath();c.arc(mx,my,mr,0,7);c.fill();c.fillStyle='#EADCA8';for(const [dx,dy,dr] of [[-.3,-.2,.22],[.25,.3,.16],[.35,-.35,.1]]){c.beginPath();c.arc(mx+dx*mr,my+dy*mr,dr*mr,0,7);c.fill();}
    c.fillStyle='#3E4274';c.beginPath();c.moveTo(0,g.box.h);for(let i=0;i<=12;i++){const hx=w*i/12;c.lineTo(hx,g.box.h-18-Math.abs(Math.sin(i*1.7))*26);}c.lineTo(w,g.box.h);c.fill();
  }else if(level.type==='orchard'){
    for(let i=0;i<3;i++){const tx=w*(i+.5)/3;c.strokeStyle='#b6bc86';c.lineWidth=13;c.beginPath();c.moveTo(tx,g.box.h*.82);c.lineTo(tx,g.box.h*.2);c.stroke();c.fillStyle=i%2?'#a7d2a1':'#b9dbaa';c.beginPath();c.ellipse(tx,g.box.h*.39,w*.19,g.box.h*.38,0,0,7);c.fill();}
  }else{
    for(let i=0;i<18;i++){c.fillStyle='#ffffff50';c.beginPath();c.arc((i*.618%1)*w,(i*.417%1)*g.box.h,3+i%3,0,7);c.fill();}
  }
  c.restore();
  const shine=c.createLinearGradient(0,0,0,g.box.h*.3);shine.addColorStop(0,'#FFFFFF50');shine.addColorStop(1,'#FFFFFF00');c.fillStyle=shine;c.beginPath();roundRectPath(c,0,0,w,g.box.h*.3,30);c.fill();
  c.strokeStyle='#FFFFFF90';c.lineWidth=3;c.beginPath();roundRectPath(c,1.5,1.5,w-3,g.box.h-3,29);c.stroke();
  g.scene=scene;
}
const HUD_ICONS={pop:'bubble',rhythm:'drum',pattern:'flower',orchard:'apple',aquarium:'fish',fireworks:'rocket',paint:'palette',tumble:'blocks'};
function drawSensoryHud(){
  const g=level.adventure,w=Math.min(W-safe.left-safe.right-32,440),x=(W-w)/2,y=safe.top+12,h=48,mid=y+h/2;
  ctx.save();ctx.shadowColor='#3C658126';ctx.shadowBlur=14;ctx.shadowOffsetY=4;pill(x,y,w,h,'#FFFFFFEE',24);ctx.restore();
  orb(x+25,mid,19,CARD_COLORS[level.type]||'#E6F0F4');artOrToy(HUD_ICONS[level.type]||'bubble',x+25,mid,32,REDUCED?0:Math.sin(time*2.2)*.1);
  label(GAME_LABELS[level.type],W/2,mid+1,15);
  const cx=x+w-25,prog=(g.total%12)/12,bounce=g.reward>0?Math.sin(clamp(g.reward/1.4,0,1)*Math.PI)*.4:0;
  ctx.save();ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='#E7EEF1';ctx.beginPath();ctx.arc(cx,mid,15,0,7);ctx.stroke();
  if(prog>0){ctx.strokeStyle='#FFC24A';ctx.beginPath();ctx.arc(cx,mid,15,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);ctx.stroke();}ctx.restore();
  toy('star',cx,mid,8*(1+bounce),'#FFD24D');
  if(g.reward>0){const a=clamp(g.reward,0,1);ctx.save();ctx.globalAlpha=a;toy('star',W/2,H-safe.bottom-34-(1-a)*20,16*(1+bounce),'#FFD77A');ctx.restore();}
}
function touchAllowed(){return appView==='game'&&!!level?.adventure&&phase==='play'&&resetSheet.hidden&&demoAd.hidden&&parentSheet.hidden&&document.visibilityState!=='hidden';}
function startTouch(e){
  if(!touchAllowed())return;
  if(level.adventure.tower){towerPress(e);return;}
  if(level.adventure.arcade){arcadeDown(e);return;}
  if(level.adventure.studio){startStudioTouch(e);return;}
  touchPointers.set(e.pointerId,{x:e.clientX,y:e.clientY,at:time,item:-1});
  tapAdventure(e.clientX,e.clientY);try{cvs.setPointerCapture(e.pointerId);}catch(err){}
}
function moveTouch(e){
  const d=touchPointers.get(e.pointerId);if(!d)return false;
  if(!touchAllowed()){endTouch(e);return true;}
  if(level.adventure.tower){e.preventDefault&&e.preventDefault();d.x=e.clientX;d.y=e.clientY;return true;}
  if(level.adventure.arcade){arcadeMove(e,d);return true;}
  if(level.adventure.studio){moveStudioTouch(e);return true;}
  e.preventDefault();
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<12||time-d.at<.075)return true;
  d.x=e.clientX;d.y=e.clientY;d.at=time;tapAdventure(d.x,d.y,true);return true;
}
function endTouch(e){if(!touchPointers.has(e.pointerId))return;
  if(level?.adventure?.studio)endStudioTouch(e);
  if(level?.adventure?.arcade)arcadeUp(e);
touchPointers.delete(e.pointerId);try{if(cvs.hasPointerCapture(e.pointerId))cvs.releasePointerCapture(e.pointerId);}catch(err){}}
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
  if(level.adventure.tower){towerTap();return;}
  if(level.adventure.arcade){arcadeTap(x,y);return;}
  if(level.adventure.studio){tapStudio(x,y);return;}
  const g=level.adventure,b=g.box;
  x=clamp(x,b.x+8,b.x+b.w-8);y=clamp(y,b.y+8,b.y+b.h-8);
  const p=g.items.find(p=>Math.hypot(x-p.x,y-p.y)<p.r*1.2),color=PALETTE[(p?.id??Math.floor(x/60))%6];
  effect(g,{kind:'ring',x,y,life:0,max:REDUCED?.25:.55,color,r:18});
  if(g.soundAt<0||time-g.soundAt>.065){g.soundAt=time;g.soundCount=0;}
  if(g.soundCount<4){playTouchSound(level.type,p,Math.floor(x/b.w*6)%6);g.soundCount++;}
  if(p){p.pulse=1;characterEvent(p.actor,'pet');}
  switch(level.type){
    case 'rhythm':{
      if(!p){sparkle(g,x,y,color,5,'note');break;}
      if(drag&&p.cooldown>0)break;p.cooldown=.1;
      sparkle(g,p.x,p.y-p.r*.5,color,6,'note');effect(g,{kind:'wave',x:p.x,y:p.y,r:p.r,life:0,max:.55,color});break;
    }
    case 'pattern':{
      const flower=p||g.items.reduce((a,q)=>Math.hypot(q.x-x,q.y-y)<Math.hypot(a.x-x,a.y-y)?q:a);
      if(!drag||flower.cooldown<=0){if(!p)characterEvent(flower.actor,'pet');flower.stage=Math.min(3,flower.stage+1);flower.pulse=1;flower.cooldown=.24;sparkle(g,flower.x,flower.y,color,10);if(flower.stage===3)effect(g,{kind:'butterfly',x:flower.x,y:flower.y-20,vx:rnd(-22,22),vy:-34,life:0,max:2.4,color,r:30});}
      break;
    }
    case 'orchard':{
      if(p&&p.cooldown<=0){p.cooldown=.65;g.flights.push({kind:p.kind,actor:p.actor,x:p.x,y:p.y,life:0,max:.6});if(g.flights.length>16)g.flights.shift();}
      else sparkle(g,x,y,color,5);break;
    }
    case 'pop':{
      if(p&&p.cooldown<=0){p.cooldown=.5;sparkle(g,p.x,p.y,color,8);effect(g,{kind:'popring',x:p.x,y:p.y,r:p.r,life:0,max:.35,color:'#FFFFFF'});
        for(let i=0;i<(REDUCED?3:10);i++){const a=i/10*Math.PI*2,sp=rnd(90,170);effect(g,{kind:'drop',x:p.x+Math.cos(a)*p.r*.7,y:p.y+Math.sin(a)*p.r*.7,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-40,life:0,max:rnd(.45,.7),color:'#BFE6FF',r:rnd(3,5.5)});}}
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
  if(level.adventure.tower){updateTower(dt);return;}
  if(level.adventure.arcade){updateArcade(dt);return;}
  if(level.adventure.studio){updateStudio(dt);return;}
  updateCharactersClock(dt);const g=level.adventure,b=g.box;g.reward=Math.max(0,g.reward-dt);
  for(const p of g.items){p.pulse=Math.max(0,p.pulse-dt*3);p.cooldown=Math.max(0,p.cooldown-dt);
    if(level.type==='aquarium'){
      p.travel-=dt;if(p.travel<=0){p.tx=rnd(b.x+p.r,b.x+b.w-p.r);p.ty=rnd(b.y+p.r,b.y+b.h-p.r);p.travel=rnd(2,4);}
      p.turn=p.tx<p.x?-1:1;p.x=ease(p.x,p.tx,REDUCED?5:.8,dt);p.y=ease(p.y,p.ty,REDUCED?5:.8,dt);
    }
    updateCharacter(p.actor,dt,{x:p.x,y:p.y,size:p.r*2,flip:level.type==='aquarium'?p.turn:1,target:characterTarget(p.x,p.y)});
  }
  g.basketPulse=Math.max(0,(g.basketPulse||0)-dt*3);
  g.flights=g.flights.filter(f=>{f.life+=dt;if(f.life<f.max)return true;
    // A landed fruit joins the little pile in the basket.
    (g.pile||(g.pile=[])).push(f.kind);if(g.pile.length>5)g.pile.shift();g.basketPulse=1;sparkle(g,W/2,b.y+b.h-40,'#FFE38A',6);return false;});
  g.effects=g.effects.filter(e=>{e.life+=dt;
    if(!REDUCED){
      if(e.kind==='firework'){e.vy+=60*dt;const drag=Math.pow(.5,dt);e.vx*=drag;e.vy*=drag;}
      else if(e.kind==='drop')e.vy+=380*dt;else if(e.kind==='note')e.vy-=70*dt;
      e.x+=e.vx*dt||0;e.y+=e.vy*dt||0;}
    return e.life<e.max;});
}
function drawAdventure(time){
  if(level.adventure.tower){drawTower(time);return;}
  if(level.adventure.arcade){drawArcade(time);return;}
  if(level.adventure.studio){drawStudio(time);return;}
  const g=level.adventure,b=g.box;
  ctx.drawImage(g.scene,b.x,b.y,b.w,b.h);
  drawSensoryScenery(g,time);
  if(H-safe.top-safe.bottom>=500)label(SENSORY_HINTS[level.type],W/2,b.y-22,14,'#688496');
  for(const p of g.items){
    const pulse=REDUCED?1:1+Math.sin(p.pulse*Math.PI)*.12,r=p.r*pulse;
    if(level.type==='rhythm'){
      pill(p.x-p.r*1.05,p.y-p.r*1.05,p.r*2.1,p.r*2.1,p.pulse>0?'#FFFFFF':'#ffffffa8',24);
      if(p.pulse>0){ctx.save();ctx.globalAlpha=p.pulse*.32;pill(p.x-p.r*1.05,p.y-p.r*1.05,p.r*2.1,p.r*2.1,PALETTE[p.id%6],24);ctx.restore();}
      drawLivingArt(['drum','xylophone','bell'][p.kind],p,r*2.05,REDUCED?0:Math.sin(p.pulse*8)*p.pulse*.12);
      for(let i=0;i<=p.id;i++)orb(p.x+(i-p.id/2)*7,p.y+p.r*.9,2.3,PALETTE[p.id]);
    }else if(level.type==='pattern'){
      ctx.strokeStyle='#75B190';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y+p.r*.7,p.r*.65,7,0,0,7);ctx.stroke();
      if(p.stage===0){orb(p.x,p.y,p.r*.72,'#ffffff80');drawLivingArt('flower',{...p,y:p.y+p.r*.15},p.r*1.05);}
      else drawLivingArt('flower',{...p,y:p.y+p.r*(.28-p.stage*.06)},r*(.85+p.stage*.38));
    }else if(level.type==='orchard'){
      if(p.cooldown>0)continue;drawLivingArt(['apple','orange','pear'][p.kind],p,r*2.05);
    }else if(level.type==='pop'){
      if(p.cooldown>.2)continue;
      // Popped bubbles are reborn with a springy grow; an iridescent sheen slides around every rim.
      const grow=p.cooldown>0?easeBack(1-p.cooldown/.2):1,q={...p,x:p.x+(REDUCED?0:Math.sin(time*.9+p.id*1.7)*3),y:p.y+(REDUCED?0:Math.sin(time*1.3+p.id)*4)};
      drawLivingArt('bubble',q,r*2.15*grow);
      if(!REDUCED){const hue=(time*50+p.id*55)%360,rr=p.r*.8*grow*pulse,a0=time*.7+p.id;ctx.save();ctx.globalAlpha=.5*grow;ctx.lineWidth=Math.max(2,p.r*.07);ctx.lineCap='round';
        ctx.strokeStyle=`hsl(${hue},90%,72%)`;ctx.beginPath();ctx.arc(q.x,q.y,rr,a0,a0+1.1);ctx.stroke();ctx.strokeStyle=`hsl(${(hue+140)%360},90%,74%)`;ctx.beginPath();ctx.arc(q.x,q.y,rr,a0+2.6,a0+3.4);ctx.stroke();ctx.restore();}
    }else if(level.type==='aquarium'){
      drawLivingArt(p.id===4?'turtle':'fish',p,r*2.2,REDUCED?0:Math.sin(time*2+p.id)*.07,p.turn);
    }else drawLivingArt('rocket',p,r*2,REDUCED?0:Math.sin(time+p.id)*.07);
    if(keyboardMode&&document.activeElement===cvs&&g.items[g.focus]===p){ctx.strokeStyle='#477CAA';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.1,0,7);ctx.stroke();}
  }
  if(level.type==='orchard'){
    const by=b.y+b.h-24,br=Math.min(40,b.h*.085),bp=REDUCED?0:Math.sin((g.basketPulse||0)*Math.PI)*(g.basketPulse||0);
    (g.pile||[]).forEach((kind,i)=>artOrToy(['apple','orange','pear'][kind],W/2+(i-2)*br*.42,by-br*.42-(i%2)*br*.12,br*.8,(i-2)*.18));
    ctx.save();ctx.translate(W/2,by+br*.6);ctx.scale(1+bp*.14,1-bp*.12);ctx.translate(-W/2,-by-br*.6);basket(W/2,by,br);ctx.restore();
    const path=(f,t)=>({x:f.x+(W/2-f.x)*t,y:f.y+(by-br*.3-f.y)*t-(REDUCED?0:Math.sin(t*Math.PI)*52)});
    for(const f of g.flights){const t=f.life/f.max,name=['apple','orange','pear'][f.kind];
      if(REDUCED){drawLivingArt(name,{...f,x:W/2,y:by},42);continue;}
      for(let k=3;k>=1;k--){const tt=t-k*.07;if(tt<=0)continue;const q=path(f,tt);ctx.save();ctx.globalAlpha=.16*(4-k)/3;artOrToy(name,q.x,q.y,42*(1-tt*.35),tt*7);ctx.restore();}
      const q=path(f,t);drawLivingArt(name,{...f,x:q.x,y:q.y},42*(1-t*.35),Math.sin(t*Math.PI)*.8);}
  }
  drawAdventureEffects(g,time);
}
function drawAdventureEffects(g,time){
  for(const e of g.effects){
    const a=1-e.life/e.max;ctx.save();ctx.globalAlpha=a;
    if(e.kind==='ring'){const rr=e.r+(REDUCED?0:e.life*65);ctx.globalAlpha=a*.18;orb(e.x,e.y,rr,e.color);ctx.globalAlpha=a;ctx.strokeStyle=e.color;ctx.lineWidth=REDUCED?3:3*a+1;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,7);ctx.stroke();
      if(!REDUCED){ctx.lineWidth=1.5;ctx.strokeStyle='#FFFFFF';ctx.beginPath();ctx.arc(e.x,e.y,rr*.62,0,7);ctx.stroke();}}
    else if(e.kind==='butterfly'){
      // Wings flap by squeezing the artwork; the flight path sways like a real butterfly.
      const flap=REDUCED?1:.3+.7*Math.abs(Math.sin(e.life*13));ctx.translate(e.x+(REDUCED?0:Math.sin(e.life*3+e.r)*18),e.y);ctx.rotate(REDUCED?0:Math.sin(e.life*5)*.2);ctx.scale(flap,1);artOrToy('butterfly',0,0,e.r*2);}
    else if(e.kind==='rocket'){if(!REDUCED)for(let k=0;k<5;k++)orb(e.x+Math.sin(time*40+k)*2,e.y+e.r*.85+k*7,(5-k)*1.3,`rgba(255,${210-k*28},90,${.85-k*.15})`);artOrToy('rocket',e.x,e.y,e.r*2);}
    else if(e.kind==='note'){const nx=e.x+(REDUCED?0:Math.sin(e.life*9+e.r)*6);ctx.fillStyle=ctx.strokeStyle=e.color;ctx.beginPath();ctx.ellipse(nx,e.y,e.r*1.15,e.r*.85,-.35,0,7);ctx.fill();
      ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(nx+e.r,e.y-e.r*.2);ctx.lineTo(nx+e.r,e.y-e.r*3.2);ctx.quadraticCurveTo(nx+e.r*2.6,e.y-e.r*2.6,nx+e.r*2.1,e.y-e.r*1.5);ctx.stroke();}
    else if(e.kind==='firework'){ctx.globalCompositeOperation='lighter';
      if(!REDUCED){ctx.globalAlpha=a*.3;orb(e.x,e.y,e.r*2.6,e.color);ctx.globalAlpha=a;ctx.strokeStyle=e.color;ctx.lineWidth=2.2*a;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(e.x-e.vx*.12,e.y-e.vy*.12);ctx.lineTo(e.x,e.y);ctx.stroke();}
      const tw=REDUCED?1:.75+.25*Math.sin(e.life*40+e.r*9);orb(e.x,e.y,e.r*tw,e.color);orb(e.x,e.y,e.r*.4,'#FFFBEA');}
    else if(e.kind==='drop'){orb(e.x,e.y,e.r,e.color);orb(e.x-e.r*.3,e.y-e.r*.3,e.r*.35,'#FFFFFF');}
    else if(e.kind==='popring'){const q=e.life/e.max;ctx.strokeStyle=e.color;ctx.lineWidth=3*(1-q)+1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.arc(e.x,e.y,e.r*(1+q*.55),0,7);ctx.stroke();ctx.setLineDash([]);}
    else if(e.kind==='wave'){const q=e.life/e.max,s=e.r*1.05*(1+q*.35);ctx.strokeStyle=e.color;ctx.lineWidth=4*(1-q)+1;ctx.beginPath();roundRectPath(ctx,e.x-s,e.y-s,s*2,s*2,24*(1+q*.35));ctx.stroke();}
    else if(e.kind==='puff'){const q=e.life/e.max;ctx.globalAlpha=a*.75;orb(e.x,e.y,e.r*(1+q*1.3),e.color);}
    else if(e.kind==='food')orb(e.x,e.y,e.r*.65,e.color);
    else toy('star',e.x,e.y,e.r,e.color);
    ctx.restore();
  }
}
// Stateless ambient motion: positions derive from time, so nothing accumulates between frames.
function drawSensoryScenery(g,time){
  const b=g.box,t=REDUCED?0:time,type=level.type;
  ctx.save();ctx.beginPath();roundRectPath(ctx,b.x,b.y,b.w,b.h,30);ctx.clip();
  if(type==='aquarium'){
    for(let i=0;i<5;i++){const sh=Math.sin(t*.35+i*1.3)*b.w*.04,x0=b.x+b.w*(i*.28-.1)+sh;ctx.fillStyle=`rgba(255,255,255,${.06+.04*Math.sin(t*.8+i*2)})`;ctx.beginPath();ctx.moveTo(x0,b.y);ctx.lineTo(x0+b.w*.14,b.y);ctx.lineTo(x0+b.w*.5+sh,b.y+b.h);ctx.lineTo(x0+b.w*.32+sh,b.y+b.h);ctx.fill();}
    ctx.lineCap='round';
    for(let i=0;i<8;i++){const x=b.x+b.w*i/7,base=b.y+b.h+5,sw=Math.sin(t*1.4+i*.9)*10,tall=55+(i%3)*14;ctx.strokeStyle=i%2?'#489a9d':'#73b8a5';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x,base);ctx.bezierCurveTo(x-20+sw*.3,base-20,x+15+sw*.7,base-tall*.55,x+sw,base-tall);ctx.stroke();}
    ctx.lineWidth=1.6;
    for(let i=0;i<12;i++){const sp=18+(i%4)*9,y=b.y+b.h-((t*sp+i*53)%(b.h+20)),x=b.x+((i*.37+.05)%1)*b.w+Math.sin(t*2+i)*5,r=2+(i%4)*1.5;ctx.strokeStyle='#FFFFFFAA';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();orb(x-r*.35,y-r*.35,r*.3,'#FFFFFFCC');}
  }else if(type==='fireworks'){
    for(let i=0;i<14;i++){const x=b.x+((i*.41+.13)%1)*b.w,y=b.y+((i*.29+.07)%.75)*b.h,a=.35+.55*Math.abs(Math.sin(t*1.7+i*2.3));ctx.globalAlpha=a;ctx.save();ctx.translate(x,y);ctx.rotate(t*.3+i);ctx.fillStyle='#FFFFFF';ctx.beginPath();roundPolyPath(ctx,starPts(4,4+(i%3),1.2),.3);ctx.fill();ctx.restore();}
    ctx.globalAlpha=1;
  }else if(type==='pattern'){
    for(let i=0;i<34;i++){const x=b.x+b.w*(i+.5)/34,base=b.y+b.h+2,h=16+(i*7%5)*5,sw=Math.sin(t*1.6+i*.7)*4;ctx.strokeStyle=i%3?'#8CC474':'#72B363';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+sw*.4,base-h*.5,x+sw,base-h);ctx.stroke();}
    for(let i=0;i<6;i++){const x=b.x+((i*.43+.1)%1)*b.w+Math.sin(t*.8+i*2)*16,y=b.y+b.h*(.15+(i*.31%.7))+Math.cos(t*.6+i)*12;ctx.globalAlpha=.5+.4*Math.sin(t*2+i);orb(x,y,2.2,'#FFF3A6');}ctx.globalAlpha=1;
  }else if(type==='pop'){
    ctx.lineWidth=1.3;for(let i=0;i<10;i++){const sp=14+(i%3)*8,y=b.y+b.h-((t*sp+i*71)%(b.h+10)),x=b.x+((i*.53+.2)%1)*b.w+Math.sin(t*1.5+i)*8;ctx.strokeStyle='#8FC6E6AA';ctx.beginPath();ctx.arc(x,y,2+(i%3),0,7);ctx.stroke();}
  }else if(type==='orchard'){
    for(let i=0;i<3;i++){const fall=(t*(22+i*6)+i*120)%(b.h+40),x=b.x+b.w*(.2+i*.3)+Math.sin(t*1.2+i*2)*24,y=b.y-20+fall;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+i)*.8);ctx.fillStyle=i%2?'#8BC78F':'#A9D27F';ctx.beginPath();ctx.ellipse(0,0,7,3.5,0,0,7);ctx.fill();ctx.restore();}
  }else if(type==='rhythm'){
    const beat=Math.max(0,...g.items.map(p=>p.pulse));if(beat>0){ctx.globalAlpha=beat*.12;ctx.fillStyle='#FFFFFF';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.globalAlpha=1;}
  }
  ctx.restore();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&level?.adventure){saveProgress();cancelAllPointers();}});
window.addEventListener('pagehide',()=>{if(level?.adventure)saveProgress();cancelAllPointers();});
