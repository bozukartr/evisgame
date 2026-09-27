/* EvisGame playground: resolution-independent illustrations and gentle mini games. */
const WORLD_NAMES=['Bahçe','Deniz','Uzay'];
let world=0;
try { world=clamp(Number(localStorage.getItem('evisgame-world'))||0,0,2)|0; } catch(e) {}
const GAME_LABELS={tower:'Kule topu',paint:'Boya dünyası',tumble:'Oyuncakları devir',more:'Diğer oyunlar',match:'Eşleştir',memory:'Hafıza',pop:'Balonlar',numberdraw:'Sayı çiz',orchard:'Meyve bahçesi',rhythm:'Neşeli müzik',pattern:'Sihirli bahçe',aquarium:'Akvaryum',fireworks:'Işık şöleni',learn:'Birlikte öğrenelim',color:'Renkler',shape:'Şekiller',size:'Boyutlar',count:'Sayalım',animal:'Hayvanlar'};
const CARD_COLORS={tower:'#9FDCE6',paint:'#F8C9DB',tumble:'#F6D491',more:'#B7E0E9',match:'#FFD77A',memory:'#C8B5FF',pop:'#91D9FF',numberdraw:'#8BE1BD',orchard:'#FFB591',rhythm:'#FFB2D1',pattern:'#C3E6B0',aquarium:'#93DAD9',fireworks:'#CCBEED',learn:'#F4DDB2',color:'#FFBFA1',shape:'#B9D9FF',size:'#B6E4C3',count:'#FFE395',animal:'#EDC4ED'};
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
// Cached scenes keep expensive drawing outside the animation loop.
function buildBackground(){
  bgCanvas=document.createElement('canvas');bgCanvas.width=W*DPR;bgCanvas.height=H*DPR;
  const c=bgCanvas.getContext('2d');c.scale(DPR,DPR);
  const palettes=[['#DFF6FF','#F5FDF3','#A3DDB4'],['#DBF8FF','#EAFBFF','#A2DDDD'],['#E6E3FF','#F5F2FF','#CABFEB']][world];
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,palettes[0]);g.addColorStop(.72,palettes[1]);g.addColorStop(1,palettes[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
  if(world===0){
    ellipse(W*.12,H*1.04,W*.8,H*.15,'#AADCC1');ellipse(W*.92,H*1.06,W*.8,H*.16,'#83CBA8');
    for(let i=0;i<16;i++){const x=(i*.173%1)*W,y=H*(.945+(i%3)*.019);c.strokeStyle='#5AAD82';c.lineWidth=2;c.beginPath();c.moveTo(x,y+9);c.lineTo(x+3,y-5);c.stroke();ellipse(x+3,y-6,4,4,i%2?'#FFF4CA':'#F8BCD2');}
  }else if(world===1){
    ellipse(W*.2,H*1.03,W*.8,H*.12,'#EADBB6');ellipse(W*.9,H*1.05,W*.75,H*.14,'#F7E8C8');
    for(let i=0;i<8;i++){const x=W*(i/7);c.strokeStyle=i%2?'#7DC4B1':'#87CBCD';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(x,H);c.bezierCurveTo(x+20,H-30,x-18,H-35,x+5,H-65);c.stroke();}
  }else{
    for(let i=0;i<44;i++){if(i%4===0)continue;const x=(i*.618%1)*W,y=(i*.317%1)*H;c.fillStyle='#FFFFFFCC';c.beginPath();roundPolyPath(c,starPts(4,3+i%3,1).map(p=>[p[0]+x,p[1]+y]),.3);c.fill();}
    ellipse(W*.87,H*.19,33,33,'#CFBDF3');ellipse(W*.87-8,H*.19-7,8,8,'#BFABE4');ellipse(W*.12,H*.82,22,22,'#AFCDF2');ellipse(W*.6,H*1.12,W*.8,H*.2,'#B9ACDB');
  }
};
// Living sky over the cached scene: drifting clouds and a breathing sun, rising bubbles, or twinkling stars.
function cloud(x,y,z,a){ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.ellipse(x,y,48*z,14*z,0,0,7);ctx.ellipse(x-15*z,y-9*z,19*z,19*z,0,0,7);ctx.ellipse(x+12*z,y-12*z,24*z,22*z,0,0,7);ctx.fill();ctx.restore();}
function drawBackdrop(time){
  ctx.drawImage(bgCanvas,0,0,W,H);const t=REDUCED?0:time;
  if(world===0){
    const sx=W*.85,sy=H*.105,pulse=1+Math.sin(t*1.3)*.04;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(t*.18);ctx.fillStyle='#FFE9B455';
    for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(-5,34);ctx.lineTo(5,34);ctx.lineTo(0,52+(i%2)*8);ctx.closePath();ctx.fill();}
    ctx.restore();orb(sx,sy,38*pulse,'#FFF1C455');orb(sx,sy,30,'#FFE3A0');
    orb(sx-9,sy+2,2.4,'#C98E4E');orb(sx+9,sy+2,2.4,'#C98E4E');ctx.strokeStyle='#C98E4E';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.arc(sx,sy+6,6,.15*Math.PI,.85*Math.PI);ctx.stroke();
    for(const [x,y,z,sp] of [[.08,.14,1,7],[.88,.26,.8,5],[.14,.52,.55,3.5],[.55,.07,.6,4.5]]){const span=W+160;cloud(((W*x+t*sp)%span+span)%span-80,H*y,z,.66);}
    for(let i=0;i<7;i++){const x=(i*.31+.07)%1*W+Math.sin(t*.7+i*2)*14,y=H*(.3+(i*.13)%.5)+Math.cos(t*.5+i)*10;orb(x,y,1.6+(i%3)*.6,'#FFF6D4B0');}
  }else if(world===1){
    ctx.save();ctx.strokeStyle='#FFFFFFA0';ctx.lineWidth=2;
    for(let i=0;i<16;i++){const sp=10+i%5*6,y=H-((t*sp+i*H*.29)%(H*1.1)),x=(i*.217%1)*W+Math.sin(t*1.2+i)*6;ctx.beginPath();ctx.arc(x,y,4+i%4*3,0,7);ctx.stroke();}
    ctx.restore();
  }else{
    for(let i=0;i<11;i++){const x=(i*4*.618%1)*W,y=(i*4*.317%1)*H,a=REDUCED?.8:.45+.45*Math.sin(t*2+i*1.7);ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(t*.4+i);ctx.fillStyle='#FFFFFF';ctx.beginPath();roundPolyPath(ctx,starPts(4,5+i%3,1.4),.3);ctx.fill();ctx.restore();}
    const k=(t%9)/1.2;if(!REDUCED&&k<1){const x=W*(.9-k*.6),y=H*(.08+k*.18);ctx.save();ctx.globalAlpha=1-k;const lg=ctx.createLinearGradient(x,y,x+70,y-24);lg.addColorStop(0,'#FFFFFF');lg.addColorStop(1,'#FFFFFF00');ctx.strokeStyle=lg;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+70,y-24);ctx.stroke();orb(x,y,3,'#FFFFFF');ctx.restore();}
  }
}
// Title letters ride a gentle wave in the palette colours.
function waveTitle(text,x,y,size,time){
  ctx.save();ctx.font=`900 ${size}px ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif`;ctx.textBaseline='middle';ctx.textAlign='left';ctx.lineJoin='round';
  const chars=[...text],widths=chars.map(ch=>ctx.measureText(ch).width),total=widths.reduce((a,b)=>a+b,0);let cx=x-total/2;
  const colors=['#F2789C','#F6A04D','#E9B730','#4DB88E','#4FA3E0','#9A7BE0'];
  chars.forEach((ch,i)=>{const dy=REDUCED?0:Math.sin(time*2.6-i*.45)*size*.07;
    if(ch!==' '){ctx.lineWidth=size*.2;ctx.strokeStyle='#FFFFFF';ctx.strokeText(ch,cx,y+dy);ctx.fillStyle='#2F426633';ctx.fillText(ch,cx,y+dy+size*.07);ctx.fillStyle=colors[i%colors.length];ctx.fillText(ch,cx,y+dy);}
    cx+=widths[i];});
  ctx.restore();
}
let menuShownAt=0,menuSeenAt=-9,menuSeenView='';
function menuCards(kinds){
  const uh=H-safe.top-safe.bottom,wide=W>H*1.25,cols=wide?4:2,rows=Math.ceil(kinds.length/cols);
  const gap=wide?12:12,areaW=Math.min(W-safe.left-safe.right-32,wide?850:460),w=(areaW-gap*(cols-1))/cols;
  const top=safe.top+Math.max(92,uh*.22),bottom=safe.top+uh-80;
  const h=Math.min(w*.87,(bottom-top-gap*(rows-1))/rows);
  return kinds.map((kind,i)=>({kind,x:(W-areaW)/2+(i%cols)*(w+gap),y:top+Math.floor(i/cols)*(h+gap),w:!wide&&i===kinds.length-1&&kinds.length%2?areaW:w,h}));
};
function drawMenuCard(card,time,index=0){
  const {x,y,w,h,kind}=card,s=Math.min(w,h),cx=x+w*.5,cy=y+h*.42;
  const appear=REDUCED?1:clamp((time-menuShownAt)*3.4-index*.32,0,1);if(appear<=0)return;
  ctx.save();ctx.globalAlpha=Math.min(1,appear*1.6);const pop=REDUCED?1:1+2.70158*(appear-1)**3+1.70158*(appear-1)**2;
  ctx.translate(cx,y+h/2);ctx.scale(.6+.4*pop,.6+.4*pop);ctx.translate(-cx,-(y+h/2));
  ctx.shadowColor='#3C658124';ctx.shadowBlur=16;ctx.shadowOffsetY=5;pill(x,y,w,h,'#FFFFFF',22);ctx.shadowColor='transparent';
  ctx.save();ctx.beginPath();roundRectPath(ctx,x,y,w,h,22);ctx.clip();pill(x+4,y+4,w-8,h*.72,CARD_COLORS[kind],18);orb(x+w*.95,y+h*.08,s*.45,'#FFFFFF28');orb(x+w*.06,y+h*.65,s*.23,'#FFFFFF24');
  const bob=REDUCED?0:Math.sin(time*1.8+kind.length)*2;
  ctx.translate(0,bob);
  if(['tower','pop','rhythm','pattern','orchard','aquarium','fireworks','learn','paint','tumble','more'].includes(kind)){drawSensoryPreview(kind,cx,cy,s,time);}
  else if(kind==='memory'){for(const i of [-1,1]){ctx.save();ctx.translate(cx+i*s*.2,cy);ctx.rotate(i*.12);pill(-s*.17,-s*.23,s*.34,s*.46,i<0?'#9A7ADB':'#FFFFFF',s*.065);toy(i<0?'star':'heart',0,0,s*.095,i<0?'#FCE19B':'#F48BB0');ctx.restore();}}
  else if(kind==='numberdraw'){label('3',cx,cy,s*.6,'#329A79');toy('star',cx+s*.3,cy-s*.16,s*.085,'#FFEDB4');}
  else if(kind==='animal'){toy('cat',cx-s*.18,cy,s*.18,'#FFB884');toy('frog',cx+s*.2,cy+s*.04,s*.17,'#83D0A4');}
  else if(kind==='count'){for(let i=0;i<3;i++)fruit(i,cx+(i-1)*s*.27,cy,s*.14);}
  else {toy(kind==='color'?'circle':'star',cx-s*.19,cy+s*.02,s*(kind==='size'?.12:.2),'#FA9977');toy(kind==='shape'?'triangle':'circle',cx+s*.2,cy-s*.03,s*.2,'#72B8F4');}
  ctx.restore();
  // A soft glossy sweep travels across each card in turn.
  const sweep=REDUCED?-1:((time*.22+index*.11)%1.6)/1.1;
  if(sweep>=0&&sweep<=1){ctx.save();ctx.beginPath();roundRectPath(ctx,x,y,w,h,22);ctx.clip();const sx=x-w*.4+sweep*w*1.8,lg=ctx.createLinearGradient(sx-w*.25,y,sx+w*.25,y+h);
    lg.addColorStop(0,'#FFFFFF00');lg.addColorStop(.5,'#FFFFFF55');lg.addColorStop(1,'#FFFFFF00');ctx.fillStyle=lg;ctx.fillRect(x,y,w,h);ctx.restore();}
  label(GAME_LABELS[kind],cx,y+h*.87,Math.min(15,h*.135));
  if(kind==='tower'){ctx.save();ctx.translate(x+12,y+13);ctx.rotate(-.12+(REDUCED?0:Math.sin(time*3)*.05));pill(-4,-10,48,20,'#FF5C8A',10);label('YENİ',20,.5,10,'#FFFFFF');ctx.restore();}
  const completed=modeRounds[kind]||0;if(completed){orb(x+w-14,y+14,8,'#FFFFFF');label('✓',x+w-14,y+14,11,'#359D77');}
  ctx.restore();
};
function drawGameMenu(time){
  if(menuSeenView!==appView||time-menuSeenAt>.25||time<menuSeenAt){menuShownAt=time;menuSeenView=appView;}menuSeenAt=time;
  drawBackdrop(time);const uh=H-safe.top-safe.bottom,wide=W>H*1.25;
  waveTitle(appView==='matchMenu'?'Eşleştirme adası':appView==='learnMenu'?'Birlikte öğrenelim':appView==='moreMenu'?'Keşfetmeye devam':'Dokun ve keşfet',W/2,safe.top+uh*.075,Math.min(wide?26:30,W*.075),time);
  label(appView==='matchMenu'?'Birlikte keşfedelim':'Her dokunuşta yeni bir sürpriz',W/2,safe.top+uh*.122,12,'#637F95');
  if(!wide){pill(W/2-66,safe.top+uh*.158,132,25,'#FFFFFFBA',14);label(`${levelIndex} keşif  ·  ${stars} yıldız`,W/2,safe.top+uh*.158+13,11,'#60817F');}
  menuCards(menuKinds()).forEach((card,i)=>drawMenuCard(card,time,i));drawParts();
};
function drawTopBar(){
  const g=level.adventure;
  if(g){drawSensoryHud();return;}
  const n=level.type==='memory'?level.memory.pairs:level.type==='pop'?level.popGame.goal:level.type==='numberdraw'?1:level.targets.length;
  const done=level.type==='memory'?level.memory.matched:level.type==='pop'?level.popGame.done:level.type==='numberdraw'?(phase==='win'?1:0):level.targets.filter(t=>t.filled).length;
  const w=Math.min(W-safe.left-safe.right-32,440),x=(W-w)/2,y=safe.top+12,h=48,mid=y+h/2;
  ctx.save();ctx.shadowColor='#3C658126';ctx.shadowBlur=14;ctx.shadowOffsetY=4;pill(x,y,w,h,'#FFFFFFEE',24);ctx.restore();
  orb(x+25,mid,19,CARD_COLORS[level.type]||'#E6F0F4');
  if(level.type==='numberdraw')label(String(level.drawGame.digit),x+25,mid+1,20,'#329A79');
  else toy({color:'circle',shape:'triangle',size:'square',count:'hexagon',animal:'cat',memory:'heart',pop:'star'}[level.type]||'star',x+25,mid,11,PALETTE[(levelIndex+1)%6]);
  ctx.save();ctx.font='800 15px ui-rounded,system-ui,sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=INK;ctx.fillText(GAME_LABELS[level.type],x+52,mid+1);ctx.restore();
  // One star per goal: filled stars pop in as the child succeeds, no numbers needed.
  for(let i=0;i<n;i++){const sx=x+w-22-(n-1-i)*22,on=i<done,grow=on&&i===done-1&&!REDUCED?1+Math.max(0,Math.sin(time*6))*.12:1;
    if(on)toy('star',sx,mid,8.5*grow,'#FFCB47');else{ctx.save();ctx.translate(sx,mid);starPath(ctx,9);ctx.strokeStyle='#D5E1E6';ctx.lineWidth=2;ctx.stroke();ctx.restore();}}
  const text=phase==='win'?'Harikasın!':`Keşif ${(modeRounds[level.type]||0)+1}`;ctx.save();ctx.font='800 14px ui-rounded,system-ui,sans-serif';const tw=ctx.measureText(text).width+28;ctx.restore();
  pill(W/2-tw/2,H-safe.bottom-48,tw,30,'#FFFFFFB8',15);label(text,W/2,H-safe.bottom-33,14,INK);
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
  const visible=['menu','matchMenu','learnMenu','moreMenu'].includes(appView);menuLayer.replaceChildren();worldBar.hidden=!visible;
  [...worldBar.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(world===i)));
  if(!visible)return;
  menuCards(menuKinds()).forEach(card=>{const b=document.createElement('button');b.type='button';b.className='menu-hit';b.setAttribute('aria-label',GAME_LABELS[card.kind]);Object.assign(b.style,{left:card.x+'px',top:card.y+'px',width:card.w+'px',height:card.h+'px'});b.onclick=()=>{audioInit();handleMenuTap(card.x+card.w/2,card.y+card.h/2);};menuLayer.append(b);});
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
  drawBackdrop(time);const uh=H-safe.top-safe.bottom,r=Math.min(W*.22,uh*.16,120),y=safe.top+uh*.36,t=REDUCED?0:time;
  const halo=ctx.createRadialGradient(W/2,y,r*.4,W/2,y,r*1.9);halo.addColorStop(0,'#FFFFFFB0');halo.addColorStop(1,'#FFFFFF00');ctx.fillStyle=halo;ctx.fillRect(W/2-r*2,y-r*2,r*4,r*4);
  const hop=Math.abs(Math.sin(t*2.2)),float=-hop*r*.14,squash=1+(1-hop)**6*.08;
  ctx.save();ctx.globalAlpha=.16*(1-hop*.5);ctx.fillStyle='#35544B';ctx.beginPath();ctx.ellipse(W/2,y+r*1.12,r*.8*(1-hop*.2),r*.14,0,0,7);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(W/2,y+r);ctx.scale(squash,1/squash);ctx.translate(-W/2,-y-r);toy('bear',W/2,y+float,r,'#FFC486');ctx.restore();
  for(const [shape,a,d,sz,col] of [['star',0,1.45,.32,'#FFD65B'],['flower',2.1,1.4,.35,'#EE9DC1'],['heart',4.2,1.5,.28,'#8FC8F2']]){const ang=a+t*.5;toy(shape,W/2+Math.cos(ang)*r*d,y+Math.sin(ang)*r*d*.45-r*.1,r*sz,col);}
  waveTitle('EvisGame',W/2,safe.top+uh*.60,Math.min(46,W*.115),time);label('Oyna · Keşfet · Gülümse',W/2,safe.top+uh*.665,14,'#70918E');
  const bw=Math.min(220,W-70),by=safe.top+uh*.75,beat=REDUCED?1:1+Math.max(0,Math.sin(t*3.2))**8*.05;
  ctx.save();ctx.translate(W/2,by+28);ctx.scale(beat,beat);ctx.translate(-W/2,-by-28);pill((W-bw)/2,by+5,bw,56,'#409B85',23);pill((W-bw)/2,by,bw,56,'#67C6A4',23);pill((W-bw)/2+8,by+5,bw-16,18,'#FFFFFF30',10);label('Hadi oynayalım  ▶',W/2,by+27,17,'#FFFFFF');ctx.restore();
};

let keyboardMode=false;
window.addEventListener('keydown',()=>{keyboardMode=true;});
window.addEventListener('pointerdown',()=>{keyboardMode=false;});
const fullMascot=drawMascot;
drawMascot=function(time){if(H-safe.top-safe.bottom>=500)fullMascot(time);};
