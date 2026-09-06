/* EvisGame playground: resolution-independent illustrations and gentle mini games. */
const WORLD_NAMES=['Bahçe','Deniz','Uzay'];
let world=0;
try { world=clamp(Number(localStorage.getItem('evisgame-world'))||0,0,2)|0; } catch(e) {}
const GAME_LABELS={match:'Eşleştir',memory:'Hafıza',pop:'Balonlar',numberdraw:'Sayı çiz',orchard:'Meyve bahçesi',rhythm:'Müzik atölyesi',pattern:'Sırada ne var?',color:'Renkler',shape:'Şekiller',size:'Boyutlar',count:'Sayalım',animal:'Hayvanlar'};
const CARD_COLORS={match:'#FFD77A',memory:'#C8B5FF',pop:'#91D9FF',numberdraw:'#8BE1BD',orchard:'#FFB591',rhythm:'#FFB2D1',pattern:'#B5DDF8',color:'#FFBFA1',shape:'#B9D9FF',size:'#B6E4C3',count:'#FFE395',animal:'#EDC4ED'};
function pill(x,y,w,h,color,r=20){ctx.beginPath();roundRectPath(ctx,x,y,w,h,Math.min(r,h/2));ctx.fillStyle=color;ctx.fill();}
function label(text,x,y,size=16,color=INK){ctx.fillStyle=color;ctx.font=`800 ${size}px ui-rounded,system-ui,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,x,y);}
function orb(x,y,r,color){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function toy(shape,x,y,r,color){
  ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(47,63,92,.18)';ctx.shadowBlur=r*.15;ctx.shadowOffsetY=r*.12;
  shapePath(ctx,shape,r);ctx.fillStyle=color;ctx.fill();ctx.shadowColor='transparent';
  ctx.save();shapePath(ctx,shape,r);ctx.clip();const g=ctx.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#FFFFFF70');g.addColorStop(.55,'#FFFFFF00');g.addColorStop(1,'#25395A22');ctx.fillStyle=g;ctx.fillRect(-r*1.5,-r*1.5,r*3,r*3);ctx.restore();
  if(isAnimal(shape)) animalFace(ctx,shape,r,0);
  else if(shape==='star'||shape==='flower'){orb(-r*.22,0,r*.065,INK);orb(r*.22,0,r*.065,INK);ctx.beginPath();ctx.arc(0,r*.1,r*.15,0,Math.PI);ctx.strokeStyle=INK;ctx.lineWidth=r*.045;ctx.stroke();}
  ctx.restore();
}
function fruit(kind,x,y,r){
  ctx.save();ctx.translate(x,y);ctx.shadowColor='#653D4426';ctx.shadowBlur=r*.15;ctx.shadowOffsetY=r*.15;
  if(kind===2){for(let row=0;row<3;row++)for(let i=0;i<3-row;i++)orb((i-(2-row)/2)*r*.49,(row-1)*r*.48,r*.37,['#A67BEC','#9163D5','#B18CF1'][row]);}
  else {const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,kind===0?'#FF998C':'#FFD877');g.addColorStop(1,kind===0?'#E95170':'#FF9A43');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,r*.12,r*.8,r*.83,0,0,7);ctx.fill();}
  ctx.shadowColor='transparent';ctx.strokeStyle='#766043';ctx.lineWidth=r*.10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-r*.65);ctx.lineTo(r*.08,-r*.96);ctx.stroke();
  ctx.fillStyle='#48AD79';ctx.beginPath();ctx.ellipse(r*.30,-r*.79,r*.30,r*.13,-.5,0,7);ctx.fill();
  orb(-r*.28,-r*.2,r*.13,'#FFFFFF66');orb(-r*.2,r*.17,r*.055,INK);orb(r*.2,r*.17,r*.055,INK);
  ctx.beginPath();ctx.arc(0,r*.23,r*.12,0,Math.PI);ctx.strokeStyle=INK;ctx.lineWidth=r*.04;ctx.stroke();ctx.restore();
}
function basket(x,y,r){
  ctx.save();ctx.translate(x,y);ctx.strokeStyle='#B97848';ctx.lineWidth=r*.13;ctx.beginPath();ctx.arc(0,-r*.2,r*.58,Math.PI,Math.PI*2);ctx.stroke();
  pill(-r,-r*.3,r*2,r*.95,'#D99B62',r*.23);ctx.save();ctx.beginPath();roundRectPath(ctx,-r,-r*.3,r*2,r*.95,r*.23);ctx.clip();ctx.strokeStyle='#BB7C482E';ctx.lineWidth=3;
  for(let i=-3;i<4;i++){ctx.beginPath();ctx.moveTo(i*r*.3,-r*.3);ctx.lineTo(i*r*.3,r);ctx.stroke();}ctx.restore();pill(-r*1.05,-r*.36,r*2.1,r*.18,'#F3C586',r*.08);ctx.restore();
}
function musicPad(x,y,r,i,lit){
  ctx.save();ctx.shadowColor='#47496933';ctx.shadowOffsetY=6;ctx.shadowBlur=10;pill(x-r,y-r,r*2,r*2,lit?'#FFFFFF':PALETTE[[0,3,4][i]],r*.38);ctx.shadowColor='transparent';
  ctx.strokeStyle=lit?PALETTE[[0,3,4][i]]:'#FFFFFF';ctx.lineWidth=r*.11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x+r*.15,y+r*.17);ctx.lineTo(x+r*.15,y-r*.34);ctx.lineTo(x+r*.43,y-r*.23);ctx.stroke();orb(x,y+r*.22,r*.2,lit?PALETTE[[0,3,4][i]]:'#FFFFFF');ctx.restore();
}
// Cached scenes keep expensive drawing outside the animation loop.
function buildBackground(){
  bgCanvas=document.createElement('canvas');bgCanvas.width=W*DPR;bgCanvas.height=H*DPR;
  const c=bgCanvas.getContext('2d');c.scale(DPR,DPR);
  const palettes=[['#DFF6FF','#F5FDF3','#A3DDB4'],['#DBF8FF','#EAFBFF','#A2DDDD'],['#E6E3FF','#F5F2FF','#CABFEB']][world];
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,palettes[0]);g.addColorStop(.72,palettes[1]);g.addColorStop(1,palettes[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
  if(world===0){
    ellipse(W*.85,H*.105,30,30,'#FFE3A0');
    for(const [x,y,z] of [[.08,.14,1],[.88,.26,.8],[.14,.52,.55]]){ellipse(W*x,H*y,48*z,14*z,'#FFFFFFA0');ellipse(W*x-15*z,H*y-9*z,19*z,19*z,'#FFFFFFA0');ellipse(W*x+12*z,H*y-12*z,24*z,22*z,'#FFFFFFA0');}
    ellipse(W*.12,H*1.04,W*.8,H*.15,'#AADCC1');ellipse(W*.92,H*1.06,W*.8,H*.16,'#83CBA8');
    for(let i=0;i<16;i++){const x=(i*.173%1)*W,y=H*(.945+(i%3)*.019);c.strokeStyle='#5AAD82';c.lineWidth=2;c.beginPath();c.moveTo(x,y+9);c.lineTo(x+3,y-5);c.stroke();ellipse(x+3,y-6,4,4,i%2?'#FFF4CA':'#F8BCD2');}
  }else if(world===1){
    for(let i=0;i<16;i++){c.strokeStyle='#FFFFFFA0';c.lineWidth=2;c.beginPath();c.arc((i*.217%1)*W,H*(.12+(i*.137% .75)),4+i%4*3,0,7);c.stroke();}
    ellipse(W*.2,H*1.03,W*.8,H*.12,'#EADBB6');ellipse(W*.9,H*1.05,W*.75,H*.14,'#F7E8C8');
    for(let i=0;i<8;i++){const x=W*(i/7);c.strokeStyle=i%2?'#7DC4B1':'#87CBCD';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(x,H);c.bezierCurveTo(x+20,H-30,x-18,H-35,x+5,H-65);c.stroke();}
  }else{
    for(let i=0;i<44;i++){const x=(i*.618%1)*W,y=(i*.317%1)*H;c.fillStyle='#FFFFFFCC';c.beginPath();roundPolyPath(c,starPts(4,3+i%3,1).map(p=>[p[0]+x,p[1]+y]),.3);c.fill();}
    ellipse(W*.87,H*.19,33,33,'#CFBDF3');ellipse(W*.87-8,H*.19-7,8,8,'#BFABE4');ellipse(W*.12,H*.82,22,22,'#AFCDF2');ellipse(W*.6,H*1.12,W*.8,H*.2,'#B9ACDB');
  }
};
function menuCards(kinds){
  const uh=H-safe.top-safe.bottom,wide=W>H*1.25,cols=wide?4:2,rows=Math.ceil(kinds.length/cols);
  const gap=wide?12:12,areaW=Math.min(W-safe.left-safe.right-32,wide?850:460),w=(areaW-gap*(cols-1))/cols;
  const top=safe.top+Math.max(92,uh*.22),bottom=safe.top+uh-80;
  const h=Math.min(w*.87,(bottom-top-gap*(rows-1))/rows);
  return kinds.map((kind,i)=>({kind,x:(W-areaW)/2+(i%cols)*(w+gap),y:top+Math.floor(i/cols)*(h+gap),w:!wide&&i===kinds.length-1&&kinds.length%2?areaW:w,h}));
};
function drawMenuCard(card,time){
  const {x,y,w,h,kind}=card,s=Math.min(w,h),cx=x+w*.5,cy=y+h*.42;
  ctx.save();ctx.shadowColor='#3C658124';ctx.shadowBlur=16;ctx.shadowOffsetY=5;pill(x,y,w,h,'#FFFFFF',22);ctx.shadowColor='transparent';
  ctx.save();ctx.beginPath();roundRectPath(ctx,x,y,w,h,22);ctx.clip();pill(x+4,y+4,w-8,h*.72,CARD_COLORS[kind],18);orb(x+w*.95,y+h*.08,s*.45,'#FFFFFF28');orb(x+w*.06,y+h*.65,s*.23,'#FFFFFF24');
  const bob=REDUCED?0:Math.sin(time*1.8+kind.length)*2;
  ctx.translate(0,bob);
  if(kind==='orchard'){basket(cx,cy+s*.1,s*.26);fruit(0,cx-s*.19,cy-s*.12,s*.20);fruit(1,cx+s*.18,cy-s*.13,s*.17);}
  else if(kind==='rhythm'){for(let i=0;i<3;i++)musicPad(cx+(i-1)*s*.28,cy+(i===1?-s*.08:s*.04),s*.13,i,Math.floor(time*1.2)%3===i);}
  else if(kind==='pattern'){for(let i=0;i<3;i++)toy(i%2?'circle':'star',cx+(i-1)*s*.3,cy,s*.13,PALETTE[i%2?3:0]);}
  else if(kind==='memory'){for(const i of [-1,1]){ctx.save();ctx.translate(cx+i*s*.2,cy);ctx.rotate(i*.12);pill(-s*.17,-s*.23,s*.34,s*.46,i<0?'#9A7ADB':'#FFFFFF',s*.065);toy(i<0?'star':'heart',0,0,s*.095,i<0?'#FCE19B':'#F48BB0');ctx.restore();}}
  else if(kind==='pop'){for(let i=0;i<3;i++){const bx=cx+(i-1)*s*.28,by=cy+(i%2?s*-.1:s*.06);ctx.strokeStyle='#FFFFFFAA';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx-7,by+s*.28,bx+3,by+s*.32);ctx.stroke();toy('circle',bx,by,s*.17,PALETTE[i+3]);orb(bx-s*.05,by-s*.065,s*.035,'#FFFFFFBB');}}
  else if(kind==='numberdraw'){label('3',cx,cy,s*.6,'#329A79');toy('star',cx+s*.3,cy-s*.16,s*.085,'#FFEDB4');}
  else if(kind==='animal'){toy('cat',cx-s*.18,cy,s*.18,'#FFB884');toy('frog',cx+s*.2,cy+s*.04,s*.17,'#83D0A4');}
  else if(kind==='count'){for(let i=0;i<3;i++)fruit(i,cx+(i-1)*s*.27,cy,s*.14);}
  else {toy(kind==='color'?'circle':'star',cx-s*.19,cy+s*.02,s*(kind==='size'?.12:.2),'#FA9977');toy(kind==='shape'?'triangle':'circle',cx+s*.2,cy-s*.03,s*.2,'#72B8F4');}
  ctx.restore();label(GAME_LABELS[kind],cx,y+h*.87,Math.min(15,h*.135));
  const completed=modeRounds[kind]||0;if(completed){orb(x+w-14,y+14,8,'#FFFFFF');label('✓',x+w-14,y+14,11,'#359D77');}
  ctx.restore();
};
function drawGameMenu(time){
  ctx.drawImage(bgCanvas,0,0,W,H);const uh=H-safe.top-safe.bottom,wide=W>H*1.25;
  label(appView==='matchMenu'?'Eşleştirme adası':'Oyun bahçem',W/2,safe.top+uh*.075,wide?24:28);
  label(appView==='matchMenu'?'Birlikte keşfedelim':'Küçük dokunuşlar, büyük keşifler',W/2,safe.top+uh*.122,12,'#637F95');
  if(!wide){pill(W/2-66,safe.top+uh*.158,132,25,'#FFFFFFBA',14);label(`${levelIndex} keşif  ·  ${stars} yıldız`,W/2,safe.top+uh*.158+13,11,'#60817F');}
  menuCards(appView==='matchMenu'?MATCH_MENU:MAIN_MENU).forEach(card=>drawMenuCard(card,time));drawParts();
};
function drawTopBar(){
  const g=level.adventure;
  const n=g?g.goal:level.type==='memory'?level.memory.pairs:level.type==='pop'?level.popGame.goal:level.type==='numberdraw'?1:level.targets.length;
  const done=g?g.done:level.type==='memory'?level.memory.matched:level.type==='pop'?level.popGame.done:level.type==='numberdraw'?(phase==='win'?1:0):level.targets.filter(t=>t.filled).length;
  const w=Math.min(W-safe.left-safe.right-32,440),x=(W-w)/2,y=safe.top+14;
  pill(x,y,w,44,'#FFFFFFCF',19);label(GAME_LABELS[level.type],x+w*.29,y+18,13);
  pill(x+14,y+33,w-28,4,'#DCE8ED',2);if(done)pill(x+14,y+33,(w-28)*done/n,4,'#69C99F',2);
  label(`${done} / ${n}`,x+w-37,y+18,12,'#66857F');
  label(phase==='win'?'Harikasın!':`Keşif ${(modeRounds[level.type]||0)+1}`,W/2,H-safe.bottom-33,14,INK);
};
// Use real buttons over illustrated cards for keyboard and assistive technology.
const menuLayer=document.createElement('nav');menuLayer.setAttribute('aria-label','Oyunlar');document.body.append(menuLayer);
const worldBar=document.createElement('div');worldBar.className='world-bar';worldBar.setAttribute('role','group');worldBar.setAttribute('aria-label','Oyun dünyası');document.body.append(worldBar);
const style=document.createElement('style');style.textContent=`
.menu-hit{position:fixed;z-index:3;border:0;background:transparent;border-radius:22px;cursor:pointer;touch-action:manipulation;color:transparent}
.menu-hit:focus-visible{outline:4px solid #518FCC;outline-offset:3px;background:#FFFFFF20}.menu-hit:active{background:#FFFFFF35}
.world-bar{position:fixed;z-index:4;bottom:calc(var(--safe-bottom) + 17px);left:50%;transform:translateX(-50%);display:flex;gap:4px;background:#FFFFFFBA;border:2px solid #FFFFFF;border-radius:24px;padding:4px;box-shadow:0 6px 18px #46698112}
.world-bar[hidden]{display:none}.world-bar button{min-width:68px;min-height:40px;padding:0 12px;border:0;border-radius:18px;background:transparent;color:#668295;font:750 12px system-ui;cursor:pointer;touch-action:manipulation}.world-bar button[aria-pressed=true]{background:#548E91;color:white}.world-bar button:focus-visible{outline:3px solid #508DCF}
.reset-button,.home-button{background:#FFFFFFE8;border:2px solid white;color:#477C88;box-shadow:0 5px 0 #BAD3D580,0 8px 20px #46758415}
`;document.head.append(style);
WORLD_NAMES.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>{world=i;try{localStorage.setItem('evisgame-world',world);}catch(e){}buildBackground();syncMenuButtons();sndSel();};worldBar.append(b);});
function syncMenuButtons(){
  const visible=appView==='menu'||appView==='matchMenu';menuLayer.replaceChildren();worldBar.hidden=!visible;
  [...worldBar.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(world===i)));
  if(!visible)return;
  menuCards(appView==='matchMenu'?MATCH_MENU:MAIN_MENU).forEach(card=>{const b=document.createElement('button');b.type='button';b.className='menu-hit';b.setAttribute('aria-label',GAME_LABELS[card.kind]);Object.assign(b.style,{left:card.x+'px',top:card.y+'px',width:card.w+'px',height:card.h+'px'});b.onclick=()=>{audioInit();handleMenuTap(card.x+card.w/2,card.y+card.h/2);};menuLayer.append(b);});
}
function buildAdventure(type,round){
  const g={done:0,goal:type==='orchard'?6:type==='pattern'?4:Math.min(5,3+Math.floor(round/3)),round,items:[],focus:0,clock:0,playback:true,heard:-1,step:0,flash:-1,flashT:0};
  if(type==='orchard'){g.target=round%3;g.items=shuffle(Array.from({length:9},(_,i)=>({kind:i%3,collected:false})));}
  if(type==='rhythm'){g.sequence=Array.from({length:g.goal},()=>Math.floor(rnd(0,3)));g.items=[0,1,2].map(kind=>({kind}));}
  if(type==='pattern'){g.items=[0,1,2].map(kind=>({kind}));nextPattern(g);}
  level={type,adventure:g,pieces:[],targets:[],cheered:false};layout();resetPhase();
  cvs.setAttribute('aria-label',GAME_LABELS[type]+'. '+({orchard:'Sepetteki meyveleri ağaçtan topla.',rhythm:'Işıkları izle, sonra aynı sırayla müzik tuşlarına dokun.',pattern:'Dizideki eksik şekli seç.'}[type]));
}
function nextPattern(g){const a=(g.round+g.done)%3,b=(a+1)%3;g.series=g.round<3?[a,b,a,b,a]:[a,a,b,a,a];g.answer=b;g.items=shuffle(g.items);}
function layoutAdventure(){
  const g=level.adventure,uh=H-safe.top-safe.bottom;unit=Math.min(W,uh)*.085;
  const aw=Math.min(W-safe.left-safe.right-32,640),left=(W-aw)/2;
  g.items.forEach((p,i)=>{p.r=Math.min(aw/(level.type==='orchard'?9:8),uh*.09,56);p.x=left+aw*((i%3)+.5)/3;p.y=safe.top+uh*(level.type==='orchard'?.40+Math.floor(i/3)*.145:.68);});
}
function tapAdventure(x,y){
  if(phase!=='play')return;const g=level.adventure;
  if(level.type==='rhythm'&&Math.hypot(x-W/2,y-(safe.top+(H-safe.top-safe.bottom)*.38))<32){g.playback=true;g.clock=0;g.heard=-1;g.step=0;g.done=0;return;}
  const p=g.items.find(p=>!p.collected&&Math.hypot(x-p.x,y-p.y)<=p.r*1.3);if(!p)return;
  const correct=level.type==='orchard'?p.kind===g.target:level.type==='pattern'?p.kind===g.answer:!g.playback&&p.kind===g.sequence[g.step];
  if(level.type==='rhythm'&&g.playback)return;
  g.flash=p.kind;g.flashT=.35;note(PENTA[p.kind],0,.4);
  if(!correct){g.hint=1;return;}
  burst(p.x,p.y,PALETTE[p.kind],REDUCED?4:14);mascotCheer();g.done++;
  if(level.type==='orchard'){p.collected=true;g.target=(g.target+1)%3;}
  if(level.type==='rhythm')g.step++;
  if(g.done>=g.goal){phase='win';phaseT=0;return;}
  if(level.type==='pattern')nextPattern(g);
}
function updateAdventure(dt){
  const g=level.adventure;g.flashT=Math.max(0,g.flashT-dt);g.hint=Math.max(0,(g.hint||0)-dt);
  if(phase==='play'&&level.type==='rhythm'&&g.playback){g.clock+=dt;const i=Math.floor((g.clock-.5)/.8);if(i>=g.sequence.length){g.playback=false;g.flash=-1;}else if(i>=0&&i!==g.heard){g.heard=i;g.flash=g.sequence[i];g.flashT=.5;note(PENTA[g.flash],0,.45);}}
}
function drawAdventure(time){
  const g=level.adventure,uh=H-safe.top-safe.bottom,cx=W/2;
  const title=phase==='win'?'Çok güzel!':level.type==='orchard'?'Sepetteki meyveyi bul':level.type==='pattern'?'Sırada hangisi var?':g.playback?'Önce dinle ve izle':'Şimdi sıra sende';
  label(title,cx,safe.top+uh*.245,Math.min(19,W*.048));
  if(level.type==='orchard'){
    g.items.forEach((p,i)=>{if(p.collected)return;ctx.save();ctx.globalAlpha=.30;orb(p.x,p.y,p.r*1.45,'#86CFA5');orb(p.x-p.r*.65,p.y-p.r*.5,p.r*.8,'#9BD8AC');ctx.restore();fruit(p.kind,p.x,p.y+(REDUCED?0:Math.sin(time*1.5+i)*2),p.r);});
    basket(cx,safe.top+uh*.84,Math.min(uh*.065,46));fruit(g.target,cx,safe.top+uh*.81,Math.min(uh*.036,25));
  }else if(level.type==='pattern'){
    const aw=Math.min(W-28,560),cell=aw/6;
    for(let i=0;i<6;i++){const x=(W-aw)/2+cell*(i+.5),y=safe.top+uh*.43;pill(x-cell*.44,y-cell*.5,cell*.88,cell,'#FFFFFFBB',14);if(i<5)toy(['star','circle','heart'][g.series[i]],x,y,cell*.27,PALETTE[g.series[i]]);else label('?',x,y,cell*.5,'#7299B4');}
    g.items.forEach(p=>{pill(p.x-p.r*1.3,p.y-p.r*1.3,p.r*2.6,p.r*2.6,'#FFFFFFD9',20);toy(['star','circle','heart'][p.kind],p.x,p.y,p.r*.8,PALETTE[p.kind]);});
  }else{
    const y=safe.top+uh*.38;orb(cx,y,27,'#FFFFFFD9');ctx.strokeStyle='#6D8EA8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,y,11,-.4,Math.PI*1.6);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+5,y-15);ctx.lineTo(cx+5,y-7);ctx.lineTo(cx-3,y-10);ctx.fillStyle='#6D8EA8';ctx.fill();
    for(let i=0;i<g.goal;i++)orb(cx+(i-(g.goal-1)/2)*24,safe.top+uh*.49,7,i<g.done?'#62BE9D':g.playback&&i===g.heard?'#B297EB':'#CFDCE7');
    g.items.forEach(p=>musicPad(p.x,p.y,p.r,p.kind,g.flashT>0&&g.flash===p.kind));
  }
  if(g.hint)label('Bir daha deneyelim',cx,safe.top+uh*.31,13,'#6C879B');
  if(keyboardMode&&document.activeElement===cvs&&g.items[g.focus]&&!g.items[g.focus].collected){const p=g.items[g.focus];ctx.strokeStyle='#518FCC';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.4,0,7);ctx.stroke();}
}
// Character details apply to matching, memory and menu illustrations alike.
const basicAnimalFace=animalFace;
animalFace=function(c,kind,s,blink){
  c.save();c.fillStyle='#FFE0D275';
  for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*s*.48,s*.24,s*.14,s*.09,0,0,7);c.fill();}
  if(kind==='cat'||kind==='rabbit'||kind==='mouse'){c.fillStyle='#F6B7BB88';for(const sign of [-1,1]){c.beginPath();c.ellipse(sign*s*(kind==='rabbit'?.34:.57),-s*(kind==='rabbit'?.86:.57),s*.11,s*(kind==='rabbit'?.28:.12),sign*.18,0,7);c.fill();}}
  if(kind==='cat'){c.strokeStyle='#74555B66';c.lineWidth=Math.max(1,s*.025);for(const sign of [-1,1])for(const offset of [-1,1]){c.beginPath();c.moveTo(sign*s*.38,s*.15);c.lineTo(sign*s*.72,s*(.15+offset*.09));c.stroke();}}
  basicAnimalFace(c,kind,s,blink);c.restore();
};
function drawStart(time){
  ctx.drawImage(bgCanvas,0,0,W,H);const uh=H-safe.top-safe.bottom,r=Math.min(W*.22,uh*.16,120),y=safe.top+uh*.36;
  orb(W/2,y,r*1.5,'#FFFFFF75');
  const float=REDUCED?0:Math.sin(time*1.5)*5;
  toy('bear',W/2,y+float,r,'#FFC486');toy('star',W/2-r*1.35,y-r*.65,r*.32,'#FFD65B');toy('flower',W/2+r*1.3,y+r*.35,r*.35,'#EE9DC1');
  label('EvisGame',W/2,safe.top+uh*.60,Math.min(40,W*.10));label('Oyna · Keşfet · Gülümse',W/2,safe.top+uh*.66,14,'#70918E');
  const bw=Math.min(220,W-70),by=safe.top+uh*.75;pill((W-bw)/2,by+5,bw,56,'#409B85',23);pill((W-bw)/2,by,bw,56,'#67C6A4',23);label('Hadi oynayalım  ▶',W/2,by+27,17,'#FFFFFF');
};

let keyboardMode=false;
window.addEventListener('keydown',()=>{keyboardMode=true;});
window.addEventListener('pointerdown',()=>{keyboardMode=false;});
const fullMascot=drawMascot;
drawMascot=function(time){if(H-safe.top-safe.bottom>=500)fullMascot(time);};
