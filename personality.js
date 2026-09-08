/* Stateful character animation. Pose is visual only; physics bodies are never scaled. */
const TOY_PERSONAS=[
 {name:'Meraklı',blink:3.3,energy:1.0,pitch:690,eye:1.05,brow:.12},
 {name:'Neşeli',blink:3.8,energy:1.15,pitch:790,eye:1,brow:0},
 {name:'Çekingen',blink:4.4,energy:.65,pitch:620,eye:.88,brow:.18},
 {name:'Uykucu',blink:5.0,energy:.5,pitch:510,eye:.86,brow:-.08},
 {name:'Şakacı',blink:3.1,energy:1.1,pitch:850,eye:.96,brow:.06},
 {name:'Sevecen',blink:4,energy:.8,pitch:740,eye:1.08,brow:.08}
];
let toyAttention={x:0,y:0,age:99},toyVoiceClock=0,toyVoiceNext=0;
function attendToys(x,y){toyAttention={x,y,age:0};}
cvs.addEventListener('pointermove',e=>attendToys(e.clientX,e.clientY));
cvs.addEventListener('pointerdown',e=>attendToys(e.clientX,e.clientY));
function character(id){
 const persona=TOY_PERSONAS[id%6];
 return {id,persona,clock:0,seed:(id+1)*7349,mode:'idle',modeAge:0,held:false,event:null,eventLife:0,impactCooldown:0,
 blinkAt:.8+(id*.73)%3,blink:0,gazeX:0,gazeY:0,lookX:0,lookY:0,lookAt:0,quiet:0,
 smile:.3,open:0,squint:0,brow:0,tilt:0,squash:0,springV:0,bob:0,accent:0,taps:0,tapAt:-10,voiceAt:0,stretch:0};
}
function actorRandom(a){a.seed=(Math.imul(a.seed,1664525)+1013904223)>>>0;return a.seed/4294967296;}
function characterEvent(a,event,strength=1){
 if(!a)return;
 if(event==='hold'||event==='pet'){if(event==='hold')a.held=true;a.quiet=0;a.taps=a.clock-a.tapAt<.7?a.taps+1:1;a.tapAt=a.clock;a.event=a.taps>=3?'giggle':'hello';a.eventLife=.9;}
 else if(event==='release'){a.held=false;a.event=a.taps>=3?'giggle':'release';a.eventLife=.85;}
 else if(event==='cancel'){a.held=false;a.event=null;a.eventLife=0;a.taps=0;}
 else if(event==='impact'){
  if(a.held||a.impactCooldown>0||strength<.15)return;
  a.impactCooldown=.42;a.event='impact';a.eventLife=.8;a.springV=-Math.min(2.4,strength*2);a.accent=Math.min(1,strength);a.quiet=0;
 }else{a.event=event;a.eventLife=event==='giggle'?1.1:.7;a.quiet=0;a.accent=.65;}
}
function characterVoice(a,event){
 if(a.clock<a.voiceAt||toyVoiceClock<toyVoiceNext||!AC)return;
 a.voiceAt=a.clock+1.2;toyVoiceNext=toyVoiceClock+.32;
 const f=a.persona.pitch;
 if(event==='giggle'){tone(f,.09,'sine',.055,0,f*1.1);tone(f*1.15,.09,'sine',.045,.11,f*.95);}
 else if(event==='impact')tone(f*.65,.10,'sine',.04,0,f*.9);
 else tone(f,.10,'sine',.045,0,f*1.12);
}
function updateCharactersClock(dt){toyVoiceClock+=dt;toyAttention.age+=dt;}
function updateCharacter(a,dt,input={}){
 dt=clamp(dt,0,.05);a.clock+=dt;a.modeAge+=dt;a.impactCooldown=Math.max(0,a.impactCooldown-dt);a.eventLife=Math.max(0,a.eventLife-dt);a.accent=Math.max(0,a.accent-dt*1.5);
 if(a.eventLife===0)a.event=null;
 const speed=input.speed||0;a.quiet=speed<.25&&!a.held&&!a.event?a.quiet+dt:0;
 let mode=a.held?'held':a.event==='impact'?(a.eventLife>.56?'impact':'giggle'):speed>2?'airborne':a.event==='giggle'?'giggle':a.event==='release'?'settle':a.event==='hello'?'hello':a.quiet>(a.persona.name==='Uykucu'?4:9+a.id%5)?'sleepy':toyAttention.age<2.5?'watch':'idle';
 if(a.mode!==mode){a.mode=mode;a.modeAge=0;if(['giggle','impact','held'].includes(mode))characterVoice(a,mode);}
 // Look at the actual held finger, otherwise the nearest finger, then subtle idle glances.
 let target=input.target;
 if(!target&&toyAttention.age<2.5)target=toyAttention;
 if(target){const dx=target.x-(input.x||0),dy=target.y-(input.y||0),r=input.angle||0,scale=Math.max(45,input.size||70);
  a.lookX=clamp((Math.cos(r)*dx+Math.sin(r)*dy)*(input.flip||1)/scale,-1,1);a.lookY=clamp((-Math.sin(r)*dx+Math.cos(r)*dy)/scale,-1,1);
 }else if(a.clock>a.lookAt){a.lookAt=a.clock+2+actorRandom(a)*3;a.lookX=(actorRandom(a)-.5)*.9;a.lookY=(actorRandom(a)-.5)*.35;}
 a.gazeX=ease(a.gazeX,a.lookX,9,dt);a.gazeY=ease(a.gazeY,a.lookY,9,dt);
 if(a.clock>=a.blinkAt){a.blinkAt=a.clock+a.persona.blink+actorRandom(a)*2;a.blink=.16;}
 a.blink=Math.max(0,a.blink-dt);
 const excited=['giggle','hello'].includes(mode),surprise=['held','airborne'].includes(mode);
 const shy=a.persona.name==='Çekingen',drowsy=a.persona.name==='Uykucu',curious=a.persona.name==='Meraklı';
 const response=shy?8:drowsy?7:13;
 a.smile=ease(a.smile,excited?(shy?.7:1):mode==='sleepy'?.2:.42,response,dt);
 a.open=ease(a.open,surprise?(shy?.35:drowsy?.5:.75):mode==='giggle'?.5:mode==='sleepy'?.12:0,14,dt);
 a.squint=ease(a.squint,mode==='impact'?1:mode==='giggle'?.72:mode==='sleepy'?.78:drowsy&&!surprise?.25:shy&&mode==='held'?.22:0,16,dt);
 a.brow=ease(a.brow,surprise?1:excited?.45:curious&&mode==='watch'?.5:0,12,dt);
 a.tilt=ease(a.tilt,REDUCED?0:(a.gazeX*.035+(excited?Math.sin(a.modeAge*12)*.035:0))*a.persona.energy,12,dt);
 // Damped deformation: maximum 9%; keep collision shapes and hit targets unchanged.
 if(REDUCED){a.squash=0;a.springV=0;a.bob=0;a.stretch=0;}
 else{
  a.springV+=(-170*a.squash-15*a.springV)*dt;a.squash=clamp(a.squash+a.springV*dt,-.09,.09);
  a.stretch=ease(a.stretch,mode==='airborne'?.035:mode==='held'?.022:0,12,dt);
  a.bob=(excited?Math.sin(a.modeAge*11)*.015:Math.sin(a.clock*1.6+a.id)*.004)*a.persona.energy;
 }
}
function characterPose(a){return {sx:1-a.squash-a.stretch,sy:1+a.squash+a.stretch,tilt:a.tilt,bob:a.bob};}
function drawCharacterFace(c,a,size){
 const s=size,ex=s*.24,ey=-s*.10,ew=s*.155*a.persona.eye,eh=s*.19;
 const blink=a.blink>0?Math.sin(a.blink/.16*Math.PI):0,openness=REDUCED?1:Math.max(.08,1-blink);
 c.save();c.lineCap='round';c.lineJoin='round';
 // Warm cheek glaze, brow volume and inset whites remain legible on small toys.
 for(const sign of [-1,1]){
  c.fillStyle=a.persona.name==='Çekingen'&&['hello','held','giggle'].includes(a.mode)?'#EC799A8A':'#EF819956';c.beginPath();c.ellipse(sign*s*.39,s*.12,s*.13,s*.075,sign*.12,0,7);c.fill();
  c.strokeStyle='#6A536B';c.lineWidth=Math.max(.8,s*.024);c.beginPath();const by=ey-eh*(1.36+a.brow*.35);
  c.moveTo(sign*ex-ew*.7,by+a.persona.brow*s*.1);c.quadraticCurveTo(sign*ex,by-s*.045,sign*ex+ew*.7,by);c.stroke();
  const wink=a.persona.name==='Şakacı'&&sign===-1&&a.mode==='giggle';
  const lid=Math.max(.08,openness*(1-a.squint*.8)*(wink?.08:1));
  c.save();c.translate(sign*ex,ey);c.scale(1,lid);
  c.fillStyle='#556A8420';c.beginPath();c.ellipse(0,s*.018,ew*1.07,eh*1.07,0,0,7);c.fill();
  c.fillStyle='#FFFEF8';c.beginPath();c.ellipse(0,0,ew,eh,0,0,7);c.fill();
  c.save();c.beginPath();c.ellipse(0,0,ew,eh,0,0,7);c.clip();
  const px=a.gazeX*ew*.30,py=a.gazeY*eh*.23;
  c.fillStyle='#546881';c.beginPath();c.ellipse(px,py,ew*.65,eh*.72,0,0,7);c.fill();
  c.fillStyle='#25394E';c.beginPath();c.ellipse(px,py+eh*.09,ew*.44,eh*.53,0,0,7);c.fill();
  c.fillStyle='#FFFFFF';c.beginPath();c.ellipse(px-ew*.23,py-eh*.3,ew*.24,eh*.23,0,0,7);c.fill();c.beginPath();c.arc(px+ew*.23,py+eh*.24,ew*.10,0,7);c.fill();
  c.restore();c.restore();
  if(wink){c.strokeStyle='#425366';c.lineWidth=s*.04;c.beginPath();c.moveTo(-ex-ew*.6,ey);c.quadraticCurveTo(-ex,ey-s*.06,-ex+ew*.6,ey);c.stroke();}
 }
 const my=s*.22,surprised=['held','airborne'].includes(a.mode),mw=s*(surprised?.095:.13+.07*a.smile),mh=s*(.014+.16*a.open);
 c.fillStyle='#774C63';c.beginPath();c.moveTo(-mw,my);c.quadraticCurveTo(0,my+s*.035,mw,my);c.bezierCurveTo(mw,my+mh+s*.12*a.smile,-mw,my+mh+s*.12*a.smile,-mw,my);c.fill();
 if(a.open>.2||a.smile>.7){c.fillStyle='#F1A2B7';c.beginPath();c.ellipse(0,my+mh*.7+s*.03,mw*.48,Math.max(.5,mh*.22),0,0,7);c.fill();}
 c.strokeStyle='#ffffff66';c.lineWidth=s*.015;c.beginPath();c.moveTo(-mw*.6,my+s*.014);c.quadraticCurveTo(0,my+s*.028,mw*.6,my+s*.014);c.stroke();
 if(a.accent>0&&!REDUCED){
  c.save();c.globalAlpha=a.accent*.75;c.fillStyle=a.persona.name==='Sevecen'?'#F190B3':'#FFE9A1';
  for(const side of [-1,1]){c.save();c.translate(side*s*.66,-s*(.27+(1-a.accent)*.22));c.rotate(side*.2);shapePath(c,a.persona.name==='Sevecen'?'heart':'star',s*.075);c.fill();c.restore();}c.restore();
 }
 c.restore();
}
function characterTarget(x,y){let best=null,dist=Infinity;for(const d of touchPointers.values()){const n=Math.hypot(d.x-x,d.y-y);if(n<dist){dist=n;best=d;}}return best;}
function collideCharacters(g,event){
 for(const pair of event.pairs){const a=pair.bodyA,b=pair.bodyB,strength=clamp(Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y)/7,0,1);
  if(strength<.18)continue;
  for(const body of [a,b])if(body.plugin.actor)characterEvent(body.plugin.actor,'impact',strength);
 }
}
function updateToyCharacters(g,dt){
 updateCharactersClock(dt);
 const held=new Map([...touchPointers.values()].filter(d=>d.body).map(d=>[d.body,d]));
 for(const p of g.toys){const a=p.plugin.actor;updateCharacter(a,dt,{x:p.position.x,y:p.position.y,angle:p.angle,size:Math.max(p.plugin.w,p.plugin.h),speed:p.speed,target:held.get(p)||characterTarget(p.position.x,p.position.y)});}
}
function drawLivingBlock(body){
 const p=body.plugin,a=p.actor,w=p.w,h=p.h,pose=characterPose(a);
 ctx.save();ctx.translate(body.position.x,body.position.y);ctx.rotate(body.angle);
 ctx.save();ctx.translate(0,h*.025);ctx.scale(pose.sx,pose.sy);ctx.rotate(pose.tilt);
 const img=touchArt[`plush-${p.shape==='ball'?'ball':'block'}-${a.id%6}`];
 ctx.shadowColor='#39547024';ctx.shadowBlur=5;ctx.shadowOffsetY=3;
 if(img?.complete&&img.naturalWidth)ctx.drawImage(img,-w/2,-h/2,w,h);else pill(-w/2,-h/2,w,h,PALETTE[p.color],5);
 ctx.shadowColor='transparent';
 // Face orientation stays attached to its toy; narrow dominoes get a compact portrait face.
 const s=Math.min(w*.78,h*.9);ctx.translate(0,-h*.045+pose.bob*h);drawCharacterFace(ctx,a,s);
 ctx.restore();ctx.restore();
}
const FACE_ANCHORS={apple:[128,136,81],orange:[128,137,81],pear:[128,139,76],flower:[128,108,49],bubble:[128,135,84],fish:[184,122,49],turtle:[128,54,43],bell:[128,133,73],drum:[128,166,67],xylophone:[128,135,56],rocket:[128,111,37]};
function drawLivingArt(name,p,size,rotation=0,flip=1){
 const a=p.actor,pose=characterPose(a),anchor=FACE_ANCHORS[name];
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(flip,1);ctx.rotate(rotation+pose.tilt);ctx.scale(pose.sx,pose.sy);
 if(!drawTouchArt('live-'+name,0,pose.bob*size,size))artOrToy(name,0,0,size);
 else{ctx.translate((anchor[0]-128)/256*size,(anchor[1]-128)/256*size+pose.bob*size);drawCharacterFace(ctx,a,anchor[2]/256*size);}
 ctx.restore();
}
