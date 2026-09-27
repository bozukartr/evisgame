/* Creative studios. Painting is raster-cached; physics runs at a fixed timestep. */
const PAINT_COLORS=['#F1799B','#F9A465','#F5CE64','#65C5A0','#69B4E7','#A28ADD'];
const PAINT_KEY='evisgame-paint-v1';
let painting=null,paintSaveTimer=0;
const studioControls=document.createElement('div');studioControls.className='studio-controls';studioControls.setAttribute('aria-label','Oyun araçları');document.body.append(studioControls);
const studioCSS=document.createElement('style');studioCSS.textContent=`
.studio-controls{position:fixed;z-index:4;display:flex;flex-direction:column;gap:8px;touch-action:none}
.studio-controls[hidden]{display:none}.studio-row{display:flex;justify-content:center;gap:4px;flex-wrap:wrap}
.studio-tool{width:44px;height:44px;flex-shrink:0;border:2px solid white;border-radius:15px;background:#fff9;box-shadow:0 3px 0 #79969822;display:grid;place-items:center;cursor:pointer;touch-action:manipulation;color:#52717E;padding:7px}
.studio-tool svg{width:26px;height:26px;pointer-events:none}.studio-tool[aria-pressed=true]{outline:3px solid #4D8297;outline-offset:0;background:white}.studio-tool:focus-visible{outline:3px solid #425EBA}.studio-tool:disabled{opacity:.35}.studio-tool:active{transform:translateY(2px)}
.studio-color{width:25px;height:25px;border-radius:50%;box-shadow:inset 0 2px 3px #fff8;pointer-events:none}
`;document.head.append(studioCSS);studioControls.hidden=true;
const TOOL_ICONS={
 brush:'<path d="m7 17 11-12 4 4-12 11z" fill="#EAAF70"/><path d="M8 16c-7 0-1 8-6 8 9 1 12-2 9-7" fill="#ED91B3"/>',
 rainbow:'<path d="M3 21a10 10 0 0 1 20 0" stroke="#ED96B2"/><path d="M6 21a7 7 0 0 1 14 0" stroke="#F7CA73"/><path d="M9 21a4 4 0 0 1 8 0" stroke="#75BECB"/>',
 stamp:'<path d="m13 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#F3C869" stroke="none"/>',
 eraser:'<path d="m3 17 11-13 9 8-10 11H9z" fill="#B6ADD9"/><path d="m3 17 6-7 10 8-6 5H9z" fill="#F8BAC8" stroke="none"/>',
 undo:'<path d="M5 8h10a7 7 0 0 1 0 14M5 8l5-5M5 8l5 5"/>',
 clear:'<path d="M6 8h14l-1 15H7zM3 7h20M9 7V3h8v4M10 11v8m6-8v8"/>',
 rebuild:'<path d="M5 9a9 9 0 1 1-1 9M5 3v6h6"/>',
 layout:'<rect x="3" y="14" width="8" height="9" rx="2"/><rect x="14" y="14" width="9" height="9" rx="2"/><rect x="9" y="3" width="9" height="9" rx="2"/>',
 ball:'<circle cx="13" cy="13" r="10" fill="#9AC8EC"/><path d="M3 13h20M13 3c-7 4-7 16 0 20 7-4 7-16 0-20"/>',
 push:'<path d="M3 10h11M3 16h11m-2-11 9 8-9 8"/>',
 size:'<circle cx="8" cy="13" r="3" fill="currentColor"/><circle cx="19" cy="13" r="6" fill="currentColor"/>'
};
function toolButton(id,name,action,pressed=false){
 const b=document.createElement('button');b.type='button';b.className='studio-tool';b.setAttribute('aria-label',name);b.setAttribute('title',name);b.dataset&&(b.dataset.tool=id);
 b.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TOOL_ICONS[id]||''}</svg>`;
 if(pressed!==null)b.setAttribute('aria-pressed',String(pressed));
 b.onclick=()=>{if(!touchAllowed())return;cancelAllPointers();action();syncStudioControls();};return b;
}
function syncStudioControls(){
 studioControls.replaceChildren();const g=level?.adventure;if(!g?.studio||appView!=='game'){studioControls.hidden=true;return;}
 studioControls.hidden=false;Object.assign(studioControls.style,{left:g.controls.x+'px',top:g.controls.y+'px',width:g.controls.w+'px'});
 if(level.type==='paint'){
  const row=document.createElement('div');row.className='studio-row';
  PAINT_COLORS.forEach((c,i)=>{const b=toolButton('color', ['Pembe','Turuncu','Sarı','Yeşil','Mavi','Mor'][i],()=>{painting.color=i;if(painting.tool==='eraser')painting.tool='brush';},painting.color===i);b.innerHTML=`<span class="studio-color" style="background:${c}"></span>`;row.append(b);});studioControls.append(row);
  const toolsRow=document.createElement('div');toolsRow.className='studio-row';
  for(const [id,title] of [['brush','Boya fırçası'],['rainbow','Gökkuşağı fırçası'],['stamp','Yıldız ve kalp damgaları'],['eraser','Silgi']])toolsRow.append(toolButton(id,title,()=>{painting.tool=id;},painting.tool===id));
  toolsRow.append(toolButton('undo','Son çizgiyi geri al',undoPaint,null));toolsRow.append(toolButton('clear','Tuvali temizle; geri alınabilir',clearPaint,null));studioControls.append(toolsRow);
 }else{
  const row=document.createElement('div');row.className='studio-row';
  row.append(toolButton('rebuild','Oyuncakları yeniden kur',()=>rebuildToys(g,false),null));
  row.append(toolButton('layout','Başka bir yapı kur',()=>rebuildToys(g,true),null));
  row.append(toolButton('ball','Top ekle',()=>addToyBall(g),null));
  row.append(toolButton('push','Oyuncakları devir',()=>pushToys(g),null));studioControls.append(row);
 }
}
function freshPainting(){
 const canvas=document.createElement('canvas'),base=document.createElement('canvas');canvas.width=base.width=1024;canvas.height=base.height=1024;
 const p={canvas,base,history:[],active:new Map(),color:0,tool:'brush',hue:0,revision:0,dirty:false};
 try{const src=localStorage.getItem(PAINT_KEY);if(src&&src.startsWith('data:image/png;base64,')){const img=new Image();img.onload=()=>{if(p.revision===0){p.base.getContext('2d').drawImage(img,0,0,1024,1024);p.canvas.getContext('2d').drawImage(img,0,0,1024,1024);}};img.src=src;}}catch(e){}
 return p;
}
function buildStudio(type){
 if(level?.adventure?.studio)leaveStudio();
 const g={studio:true,free:true,total:sensoryTotals[type]||0,focus:0,effects:[],flights:[],reward:0,items:[],design:0,accumulator:0,hitSound:0};
 level={type,adventure:g,pieces:[],targets:[]};if(type==='paint'&&!painting)painting=freshPainting();
 resetPhase();phase='play';layoutStudio();cvs.setAttribute('aria-label',type==='paint'?'Boya dünyası. Tuvale parmağınla çiz; renk, fırça, damga ve silgi araçlarını seç.':'Oyuncakları devir. Bloklara dokun, sürükle ve bırak. Yeniden kur düğmesiyle tekrar oyna.');
}
function layoutStudio(){
 const g=level.adventure,wide=W>H*1.25,uh=H-safe.top-safe.bottom,available=W-safe.left-safe.right;
 if(level.type==='paint'){
  const size=Math.min(760,wide?uh-160:uh-262,wide?available-192:available-28);
  const s=Math.max(100,size),groupW=wide?s+164:s,groupH=wide?s:s+112;
  const x=(W-groupW)/2,y=safe.top+80+Math.max(0,(uh-158-groupH)/2);
  g.box={x,y,w:s,h:s};g.controls=wide?{x:x+s+16,y:y+Math.max(0,(s-200)/2),w:144}:{x,y:y+s+14,w:s};
  g.items=[{id:0,x:x+s/2,y:y+s/2,r:40}];
 }else{
  const w=Math.min(800,available-28),y=safe.top+Math.max(92,uh*.20),h=uh-(y-safe.top)-140;
  g.box={x:(W-w)/2,y,w,h:Math.max(110,h)};g.controls={x:(W-204)/2,y:y+g.box.h+12,w:204};
  rebuildToys(g,false);
 }
 unit=Math.min(W,uh)*.08;syncStudioControls();
}
function studioReward(g){g.total++;sensoryTotals[level.type]=g.total;if(g.total%12===0){g.reward=1.4;stars++;levelIndex++;modeRounds[level.type]=(modeRounds[level.type]||0)+1;saveProgress();}}
function paintPoint(x,y){const b=level.adventure.box;return {x:clamp((x-b.x)/b.w,0,1)*1024,y:clamp((y-b.y)/b.h,0,1)*1024};}
function insideBoard(x,y){const b=level.adventure.box;return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;}
function drawPaintSegment(c,stroke,a,b,index){
 c.save();c.globalCompositeOperation=stroke.tool==='eraser'?'destination-out':'source-over';c.lineCap='round';c.lineJoin='round';c.lineWidth=stroke.tool==='eraser'?90:40;
 c.strokeStyle=c.fillStyle=stroke.tool==='rainbow'?`hsl(${(stroke.hue+index*3)%360},78%,65%)`:PAINT_COLORS[stroke.color];
 if(stroke.tool==='stamp'){
  c.translate(b.x,b.y);c.rotate((index%5-2)*.1);shapePath(c,index%2?'heart':'star',29);c.fill();
 }else {c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.beginPath();c.arc(b.x,b.y,c.lineWidth/2,0,7);c.fill();}
 c.restore();
}
function drawPaintCommand(c,cmd){
 if(cmd.clear){c.clearRect(0,0,1024,1024);return;}
 for(let i=0;i<cmd.points.length;i++)drawPaintSegment(c,cmd,cmd.points[Math.max(0,i-1)],cmd.points[i],i);
}
function paintBegin(id,x,y){
 const p=painting,point=paintPoint(x,y);p.revision++;p.dirty=true;
 const stroke={tool:p.tool,color:p.color,hue:p.hue,points:[point]};p.hue=(p.hue+31)%360;p.active.set(id,stroke);
 drawPaintSegment(p.canvas.getContext('2d'),stroke,point,point,0);
}
function paintMove(id,x,y){
 const p=painting,s=p.active.get(id);if(!s)return;
 const pt=paintPoint(x,y),last=s.points[s.points.length-1],distance=Math.hypot(pt.x-last.x,pt.y-last.y),spacing=s.tool==='stamp'?65:3;
 if(distance<spacing)return;
 const steps=s.tool==='stamp'?Math.floor(distance/spacing):Math.max(1,Math.ceil(distance/8));
 for(let i=1;i<=steps;i++){const at=s.tool==='stamp'?i*spacing/distance:i/steps,q={x:last.x+(pt.x-last.x)*at,y:last.y+(pt.y-last.y)*at};drawPaintSegment(p.canvas.getContext('2d'),s,s.points[s.points.length-1],q,s.points.length);s.points.push(q);}
 // Long continuous gestures are simplified for bounded history; the live raster stays untouched.
 if(s.points.length>4096)s.points=s.points.filter((_,i)=>i%2===0||i===s.points.length-1);
 p.revision++;p.dirty=true;
}
function commitPaint(id){const p=painting,s=p?.active.get(id);if(!s)return;p.active.delete(id);p.history.push(s);compactPaintHistory();schedulePaintSave();}
function compactPaintHistory(){while(painting.history.length>48)drawPaintCommand(painting.base.getContext('2d'),painting.history.shift());}
function rebuildPaint(){const p=painting,c=p.canvas.getContext('2d');c.clearRect(0,0,1024,1024);c.drawImage(p.base,0,0);for(const s of p.history)drawPaintCommand(c,s);p.revision++;p.dirty=true;schedulePaintSave();}
function undoPaint(){if(painting.history.length){painting.history.pop();rebuildPaint();}}
function clearPaint(){painting.history.push({clear:true});compactPaintHistory();rebuildPaint();}
function schedulePaintSave(){clearTimeout(paintSaveTimer);paintSaveTimer=setTimeout(persistPaint,900);}
function persistPaint(){if(!painting?.dirty)return;try{localStorage.setItem(PAINT_KEY,painting.canvas.toDataURL('image/png'));painting.dirty=false;}catch(e){/* Keep the drawing in memory when device storage is unavailable. */}}
function startStudioTouch(e){
 if(!insideBoard(e.clientX,e.clientY))return;const g=level.adventure;
 if(level.type==='paint')paintBegin(e.pointerId,e.clientX,e.clientY);
 const d={x:e.clientX,y:e.clientY,at:time,studio:true};touchPointers.set(e.pointerId,d);
 if(level.type==='tumble')grabToy(g,d,e.clientX,e.clientY);
 studioReward(g);effect(g,{kind:'ring',x:d.x,y:d.y,life:0,max:.35,color:'#9DC5D3',r:12});
 try{cvs.setPointerCapture(e.pointerId);}catch(err){}
}
function moveStudioTouch(e){
 e.preventDefault();const d=touchPointers.get(e.pointerId);if(!d)return;
 if(level.type==='paint'){paintMove(e.pointerId,e.clientX,e.clientY);}
 else if(d.constraint){const b=level.adventure.box;d.constraint.pointA={x:clamp(e.clientX,b.x+12,b.x+b.w-12),y:clamp(e.clientY,b.y+12,b.y+b.h-12)};Matter.Sleeping.set(d.body,false);}
 d.x=e.clientX;d.y=e.clientY;
}
function endStudioTouch(e){const d=touchPointers.get(e.pointerId);if(level.type==='paint')commitPaint(e.pointerId);else if(d?.constraint){Matter.Composite.remove(level.adventure.engine.world,d.constraint);characterEvent(d.body.plugin.actor,e.cancelled||e.type==='pointercancel'||e.type==='lostpointercapture'?'cancel':'release');}}
function cancelStudioTouches(){if(!level?.adventure?.studio)return;for(const id of touchPointers.keys())endStudioTouch({pointerId:id,cancelled:true});}
function leaveStudio(){if(!level?.adventure?.studio)return;cancelStudioTouches();persistPaint();if(level.adventure.engine){Matter.Composite.clear(level.adventure.engine.world,false);Matter.Engine.clear(level.adventure.engine);}studioControls.hidden=true;}
function tapStudio(x,y){if(!insideBoard(x,y))return;const e={pointerId:-999,clientX:x,clientY:y};startStudioTouch(e);endTouch(e);}
function toyBody(g,x,y,w,h,shape,index){
 const options={restitution:shape==='ball'?.55:.12,friction:.6,frictionStatic:.9,frictionAir:.015,density:.002,sleepThreshold:55};
 const body=shape==='ball'?Matter.Bodies.circle(x,y,w/2,options):Matter.Bodies.rectangle(x,y,w,h,{...options,chamfer:{radius:Math.min(4,w*.08)}});
 body.plugin={toy:true,w,h,shape,color:index%PALETTE.length,face:index%3,actor:character(index)};Matter.Composite.add(g.engine.world,body);g.toys.push(body);return body;
}
function rebuildToys(g,next){
 cancelStudioTouches();touchPointers.clear();
 if(g.engine){Matter.Composite.clear(g.engine.world,false);Matter.Engine.clear(g.engine);}
 if(next)g.design=(g.design+1)%3;
 g.engine=Matter.Engine.create({enableSleeping:true,positionIterations:8,velocityIterations:8});g.engine.gravity.y=1;g.toys=[];g.accumulator=0;
 const b=g.box,s=Math.min(74,b.h*.20,b.w*.20),floor=b.y+b.h-14,cx=b.x+b.w/2;g.floor=floor;g.size=s;
 Matter.Composite.add(g.engine.world,[Matter.Bodies.rectangle(cx,floor+30,b.w+120,60,{isStatic:true,friction:.8}),Matter.Bodies.rectangle(b.x-30,b.y+b.h/2,60,b.h*4,{isStatic:true}),Matter.Bodies.rectangle(b.x+b.w+30,b.y+b.h/2,60,b.h*4,{isStatic:true}),Matter.Bodies.rectangle(cx,b.y-50,b.w+120,60,{isStatic:true})]);
 let n=0;
 if(g.design===0){
  for(let row=0;row<4;row++){const count=4-row;for(let col=0;col<count;col++)toyBody(g,cx+(col-(count-1)/2)*(s+2),floor-s/2-row*(s+1),s,s,'block',n++);}
 }else if(g.design===1){
  for(const sign of [-1,1])for(let row=0;row<3;row++)toyBody(g,cx+sign*s*1.1,floor-s/2-row*(s+1),s,s,'block',n++);
  toyBody(g,cx,floor-s*3.25-4,s*3.3,s*.48,'beam',n++);toyBody(g,cx,floor-s*4-6,s*.8,s*.8,'ball',n++);
 }else{
  for(let i=0;i<7;i++)toyBody(g,cx+(i-3)*s*.68,floor-s*.75,s*.33,s*1.5,'beam',n++);
  toyBody(g,cx-s*2.65,floor-s*.5,s,s,'ball',n++);
 }
 // Bodies begin at rest; no Runner or independent timers survive navigation.
 Matter.Events.on(g.engine,'collisionStart',event=>{collideCharacters(g,event);
  // Dust puffs mark real, hard landings.
  const thud=event.pairs.find(p=>Math.max(p.bodyA.speed,p.bodyB.speed)>3.5&&p.collision?.supports?.[0]);
  if(thud&&!REDUCED){const s=thud.collision.supports[0];for(let i=0;i<4;i++)effect(g,{kind:'puff',x:s.x,y:s.y,vx:rnd(-45,45),vy:rnd(-50,-12),life:0,max:rnd(.35,.55),color:'#FFFFFF',r:rnd(5,9)});}if(time-g.hitSound<.09)return;const pair=event.pairs.find(p=>(p.bodyA.plugin.toy||p.bodyB.plugin.toy)&&Math.max(p.bodyA.speed,p.bodyB.speed)>1.2);if(pair){g.hitSound=time;tone(170+Math.min(160,pair.bodyA.speed*20),.08,'sine',.09);}});
 syncToyItems(g);
}
function syncToyItems(g){g.items=g.toys.map((p,i)=>({id:i,x:p.position.x,y:p.position.y,r:Math.max(22,Math.min(p.plugin.w,p.plugin.h)/2),body:p}));g.focus=Math.min(g.focus,g.items.length-1);}
function addToyBall(g){
 if(g.toys.length>=24){const held=new Set([...touchPointers.values()].map(d=>d.body));const i=g.toys.findIndex(p=>!held.has(p));if(i<0)return;Matter.Composite.remove(g.engine.world,g.toys.splice(i,1)[0]);}
 const b=g.box;toyBody(g,b.x+b.w*.22,b.y+g.size*.6,g.size*.86,g.size*.86,'ball',g.toys.length);syncToyItems(g);
}
function pushToys(g){for(const [i,p] of g.toys.entries()){Matter.Sleeping.set(p,false);Matter.Body.setVelocity(p,{x:(i%2?1:-1)*(REDUCED?2:5),y:REDUCED?-1:-3});Matter.Body.setAngularVelocity(p,(i%2?1:-1)*.045);}studioReward(g);}
function grabToy(g,d,x,y){
 const occupied=new Set([...touchPointers.values()].filter(q=>q!==d).map(q=>q.body));
 let body=Matter.Query.point(g.toys,{x,y}).filter(p=>!occupied.has(p)).pop();
 if(!body){const candidates=g.toys.filter(p=>!occupied.has(p)&&Math.hypot(p.position.x-x,p.position.y-y)<Math.max(34,p.plugin.w*.7));body=candidates.sort((a,b)=>Math.hypot(a.position.x-x,a.position.y-y)-Math.hypot(b.position.x-x,b.position.y-y))[0];}
 if(!body){const near=g.toys.slice().sort((a,b)=>Math.hypot(a.position.x-x,a.position.y-y)-Math.hypot(b.position.x-x,b.position.y-y))[0];if(near){Matter.Sleeping.set(near,false);Matter.Body.setVelocity(near,{x:x<near.position.x?4:-4,y:-3});}return;}
 Matter.Sleeping.set(body,false);Matter.Body.setVelocity(body,{x:(x<body.position.x?1:-1)*(REDUCED?1.8:3.6),y:-1.5});Matter.Body.setAngularVelocity(body,(x<body.position.x?1:-1)*.06);
 d.body=body;characterEvent(body.plugin.actor,'hold');
 d.constraint=Matter.Constraint.create({pointA:{x,y},bodyB:body,pointB:{x:0,y:0},length:0,stiffness:.12,damping:.18});Matter.Composite.add(g.engine.world,d.constraint);
}
function updateStudio(dt){
 const g=level.adventure;g.reward=Math.max(0,g.reward-dt);g.effects=g.effects.filter(e=>{e.life+=dt;if(!REDUCED){e.x+=e.vx*dt||0;e.y+=e.vy*dt||0;}return e.life<e.max;});
 if(level.type!=='tumble')return;
 g.accumulator=Math.min(g.accumulator+dt,.1);
 while(g.accumulator>=1/120){Matter.Engine.update(g.engine,1000/120);g.accumulator-=1/120;}
 for(const p of g.toys){
  if(p.speed>14)Matter.Body.setVelocity(p,{x:p.velocity.x/p.speed*14,y:p.velocity.y/p.speed*14});
  if(!Number.isFinite(p.position.x+p.position.y)||p.position.y>g.floor+80||p.position.x<g.box.x-80||p.position.x>g.box.x+g.box.w+80){Matter.Body.setPosition(p,{x:g.box.x+g.box.w/2,y:g.box.y+g.size});Matter.Body.setVelocity(p,{x:0,y:0});}
 }
 updateToyCharacters(g,dt);syncToyItems(g);
}
function drawBlock(body){drawLivingBlock(body);}
function drawStudio(time){
 const g=level.adventure,b=g.box;
 if(level.type==='paint'){
  ctx.save();ctx.shadowColor='#7395A529';ctx.shadowBlur=18;ctx.shadowOffsetY=7;pill(b.x-5,b.y-5,b.w+10,b.h+10,'#E4D6C4',24);ctx.shadowColor='transparent';pill(b.x,b.y,b.w,b.h,'#FFFEF8',20);
  ctx.beginPath();roundRectPath(ctx,b.x,b.y,b.w,b.h,20);ctx.clip();
  ctx.globalAlpha=.32;for(let i=0;i<18;i++)for(let j=0;j<18;j++)orb(b.x+(i+.5)*b.w/18,b.y+(j+.5)*b.h/18,.7,'#C4C7C5');ctx.globalAlpha=1;
  ctx.drawImage(painting.canvas,b.x,b.y,b.w,b.h);ctx.restore();
 }else{
  const grad=ctx.createLinearGradient(0,b.y,0,b.y+b.h);grad.addColorStop(0,'#F9EBD8');grad.addColorStop(1,'#E6D7C3');pill(b.x,b.y,b.w,b.h,grad,28);
  ctx.save();ctx.beginPath();roundRectPath(ctx,b.x,b.y,b.w,b.h,28);ctx.clip();
  for(let i=0;i<6;i++){ctx.strokeStyle='#D7C4A840';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y+b.h*(i+1)/7);ctx.lineTo(b.x+b.w,b.y+b.h*(i+1)/7);ctx.stroke();}
  pill(b.x,g.floor,b.w,14,'#CDAF88',0);g.toys.forEach(drawBlock);ctx.restore();
 }
 drawAdventureEffects(g,time);
 if(b.y>safe.top+130)label(SENSORY_HINTS[level.type],W/2,b.y-23,13,'#6E8990');
}
window.addEventListener('pagehide',persistPaint);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistPaint();});
