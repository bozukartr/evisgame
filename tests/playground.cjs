// Real Canvas rendering plus deterministic state checks; no browser emulation claims.
// npm install --no-save @napi-rs/canvas, then node tests/playground.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,Image,GlobalFonts}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'):'@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','system-ui');
const root=path.join(__dirname,'..'),els=new Map(),saved=new Map();
const document={visibilityState:'visible',activeElement:null,addEventListener(){}};
function element(tag){const e=tag==='canvas'?createCanvas(390,844):{};return Object.assign(e,{style:{},children:[],hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(){},append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);},replaceChildren(...items){this.children=items;},focus(){document.activeElement=this;},setPointerCapture(){},releasePointerCapture(){}});}
document.createElement=element;document.getElementById=id=>{if(!els.has(id))els.set(id,element(id==='c'?'canvas':'div'));return els.get(id);};document.head=element('head');document.body=element('body');document.documentElement=element('html');
const sandbox={console,document,Image,Math,performance:{now:()=>0},navigator:{userAgent:'test',platform:'test'},matchMedia:q=>({matches:q.includes('reduced-motion')&&process.env.EVIS_REDUCED==='1'}),getComputedStyle:()=>({getPropertyValue:()=>0}),localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame(){}};
sandbox.window=sandbox;sandbox.innerWidth=390;sandbox.innerHeight=844;sandbox.devicePixelRatio=1;sandbox.addEventListener=()=>{};
const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
(async()=>{
run(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
for(const file of ['touch-art.js','playground.js','sensory.js','vendor/matter-0.20.0.min.js','studios.js','personality.js','tower.js','arcade.js','stack.js','slice.js','hole.js','merge.js','sort.js','ambience.js'])run(fs.readFileSync(path.join(root,file),'utf8'));
assert((await run('touchArtReady')).every(Boolean),'all SVG assets load');
run('resize(); started=true; adsDisabled=true;');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const asset of run('TOUCH_ART_NAMES'))assert(sw.includes('./assets/play/'+asset+'.svg'),'SVG is cached for offline play');
const render=name=>{if(process.env.EVIS_RENDER_DIR){fs.mkdirSync(process.env.EVIS_RENDER_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.EVIS_RENDER_DIR,name+'.png'),els.get('c').toBuffer('image/png'));}};
for(const [w,h] of [[390,844],[320,568],[844,390],[768,1024]]){
  sandbox.innerWidth=w;sandbox.innerHeight=h;run("resize(); openMenu(); for(let t=0;t<3;t+=.05)drawGameMenu(t);");
  assert.equal(run('menuLayer.children.length'),10,'8 cards and the 2 age tabs');
  assert(run('menuCards(MAIN_MENU).every(c=>c.h>=44&&c.x>=0&&c.y>=0&&c.x+c.w<=W&&c.y+c.h<=H-75)'));
  assert(run('menuCards(MAIN_MENU).every(c=>c.y>=ageTabs().y+ageTabs().h)'),'cards sit below the age tabs');
  render(`menu-${w}x${h}`);
  run("setMenuAge('big');for(let t=5;t<8;t+=.05)drawGameMenu(t);");assert.equal(run('menuLayer.children.length'),8,'6 quick games and the 2 age tabs');
  assert(run('menuCards(BIG_MENU).every(c=>c.h>=44&&c.x>=0&&c.y>=ageTabs().y+ageTabs().h&&c.x+c.w<=W&&c.y+c.h<=H-75)'));
  render(`menu-big-${w}x${h}`);run("setMenuAge('small');");
  for(const type of run('TYPES')){
    run(`beginMode('${type}');`);
    for(let i=1;i<=40;i++)run(`frame(last+50);`);
    assert.equal(run('phase'),'play',type);
    if(w===390)render(type);
    if(['paint','tumble'].includes(type)){
      assert(run('level.adventure.box.x>=0&&level.adventure.box.y>=0&&level.adventure.box.x+level.adventure.box.w<=W&&level.adventure.box.y+level.adventure.box.h<=H-70'));
      assert(run('level.adventure.controls.x>=0&&level.adventure.controls.x+level.adventure.controls.w<=W'),'toolbar stays in viewport');
      assert(run('level.adventure.controls.y+(level.type==="paint"?(W>H*1.25?192:96):44)<=H-safe.bottom-65'),'toolbar clears home controls');
    }
  }
}
sandbox.innerWidth=390;sandbox.innerHeight=844;run('resize();');
for(const type of run('FREE_PLAY').filter(t=>!['paint','tumble','tower','stack','slice','hole','merge','sort'].includes(t))){
  run(`beginMode('${type}');`);
  assert.equal(run('phase'),'play','no intro lock');
  const before=run('level.adventure.total');
  run('tapAdventure(level.adventure.items[0].x,level.adventure.items[0].y);');
  assert.equal(run('level.adventure.total'),before+1,'first tap responds immediately');
  assert(run('level.adventure.effects.length>0'));
  run('for(let i=0;i<40;i++){const p=level.adventure.items[i%level.adventure.items.length];tapAdventure(p.x,p.y);updateAdventure(.1);}');
  assert.equal(run('phase'),'play','free play does not interrupt for win or ad');
  assert.equal(run('level.adventure.total'),before+41);
  assert(run('demoAd.hidden'),'no interstitial');
  run('openMenu();');
  assert.equal(JSON.parse(saved.get('evisgame-progress-v1')).sensoryTotals[type],before+41);
  run(`beginMode('${type}');`);
  assert.equal(run('level.adventure.total'),before+41,'resume exploration count');
  run('for(let i=0;i<1000;i++)tapAdventure(170,300);');
  assert(run('level.adventure.effects.length<=96&&level.adventure.flights.length<=16'),'bounded effects during rapid touches');
  run('updateAdventure(4);');assert.equal(run('level.adventure.effects.length'),0,'expired effects removed');
}
run("beginMode('rhythm');");
run('startTouch({pointerId:11,clientX:90,clientY:300});startTouch({pointerId:12,clientX:240,clientY:450});');
assert.equal(run('touchPointers.size'),2);
run('time+=.1;moveTouch({pointerId:11,clientX:160,clientY:330,preventDefault(){}});');
assert(run('level.adventure.effects.length>0'),'drag produces feedback');
run('endTouch({pointerId:11});');assert.equal(run('touchPointers.size'),1);
run('cancelAllPointers();');assert.equal(run('touchPointers.size'),0,'cancellation clears gestures');
run('resetSheet.hidden=false;');const paused=run('level.adventure.total');run('tapAdventure(90,300);');assert.equal(run('level.adventure.total'),paused,'modal blocks interaction');run('resetSheet.hidden=true;');
run("beginMode('pattern');const seed=level.adventure.items[0];tapAdventure(seed.x,seed.y);tapAdventure(seed.x,seed.y);tapAdventure(seed.x,seed.y);");
run('ctx.drawImage(bgCanvas,0,0,W,H);drawTopBar();drawAdventure(0);');render('bloom-reaction');
assert.equal(run('level.adventure.items[0].stage'),3,'flower grows without correct choice');assert(run("level.adventure.effects.some(e=>e.kind==='butterfly')"));
run("beginMode('aquarium');tapAdventure(130,400);");assert(run('level.adventure.items.every(p=>p.travel===2)'),'all fish follow touch');
run("beginMode('fireworks');tapAdventure(195,400);updateAdventure(.18);ctx.drawImage(bgCanvas,0,0,W,H);drawTopBar();drawAdventure(0);");render('fireworks-reaction');
run("openMenu('learnMenu');");assert.equal(run('menuLayer.children.length'),3);
// Paint: immediate marks, separate fingers, undoable clear, bounded history and persisted raster.
run("beginMode('paint');");
run('const pb=level.adventure.box;startTouch({pointerId:101,clientX:pb.x+30,clientY:pb.y+40});moveTouch({pointerId:101,clientX:pb.x+pb.w-40,clientY:pb.y+pb.h-40,preventDefault(){}});endTouch({pointerId:101});');
assert(run('painting.canvas.getContext("2d").getImageData(500,500,1,1).data[3]>0'),'continuous stroke is drawn');
const painted=run('painting.canvas.toDataURL()');
run('painting.tool="eraser";tapStudio(pb.x+pb.w*500/1024,pb.y+pb.h*500/1024);');assert.equal(run('painting.canvas.getContext("2d").getImageData(500,500,1,1).data[3]'),0,'eraser removes paint');run('undoPaint();painting.tool="brush";');assert.equal(run('painting.canvas.toDataURL()'),painted);run('clearPaint();');assert.equal(run('painting.canvas.getContext("2d").getImageData(500,500,1,1).data[3]'),0);run('undoPaint();');assert.equal(run('painting.canvas.toDataURL()'),painted,'clear can be undone exactly');
run('painting.tool="rainbow";startTouch({pointerId:102,clientX:pb.x+30,clientY:pb.y+pb.h*.5});startTouch({pointerId:103,clientX:pb.x+pb.w*.65,clientY:pb.y+25});');
assert.equal(run('painting.active.size'),2);run('cancelAllPointers();');assert.equal(run('painting.active.size'),0);
run('painting.tool="stamp";tapStudio(pb.x+pb.w*.25,pb.y+pb.h*.25);painting.tool="brush";for(let i=0;i<70;i++)tapStudio(pb.x+20+i*2,pb.y+25);persistPaint();');
assert(run('painting.history.length<=48'),'bounded undo history');assert(saved.get('evisgame-paint-v1').startsWith('data:image/png'));
const retained=run('painting.canvas.toDataURL()');run('openMenu();beginMode("paint");');assert.equal(run('painting.canvas.toDataURL()'),retained,'menu return retains artwork');
run('ctx.drawImage(bgCanvas,0,0,W,H);drawTopBar();drawStudio(0);');render('paint-artwork');
// Tumble: stable contacts, rotated falling bodies, multi-touch constraints and bounded body count.
run("beginMode('tumble');for(let i=0;i<600;i++)updateStudio(1/120);");
assert(run('level.adventure.toys.every(p=>Number.isFinite(p.position.x+p.position.y+p.angle)&&p.bounds.max.y<=level.adventure.floor+5)'),'stack stays on floor');
const beforePush=run('level.adventure.toys.map(p=>({x:p.position.x,y:p.position.y}))');
run('pushToys(level.adventure);for(let i=0;i<300;i++)updateStudio(1/120);');
assert(run('level.adventure.toys.some(p=>Math.abs(p.angle)>.1)'),'toys actually rotate and topple');
assert(run('level.adventure.toys.some(p=>p.position.y>level.adventure.floor-level.adventure.size*1.5)'),'fallen toys settle');
run('ctx.drawImage(bgCanvas,0,0,W,H);drawTopBar();drawStudio(0);');render('tumble-toppled');
run('rebuildToys(level.adventure,false);const a=level.adventure.items[0],b=level.adventure.items[1];startTouch({pointerId:201,clientX:a.x,clientY:a.y});startTouch({pointerId:202,clientX:b.x,clientY:b.y});');
assert.equal(run('Matter.Composite.allConstraints(level.adventure.engine.world).length'),2);
run('moveTouch({pointerId:201,clientX:level.adventure.box.x+45,clientY:level.adventure.box.y+60,preventDefault(){}});for(let i=0;i<240;i++)updateStudio(1/120);');
assert(run('Math.hypot(touchPointers.get(201).body.position.x-(level.adventure.box.x+45),touchPointers.get(201).body.position.y-(level.adventure.box.y+60))<30'),'held block follows finger target');
run('cancelAllPointers();');assert.equal(run('Matter.Composite.allConstraints(level.adventure.engine.world).length'),0);
run('for(let i=0;i<100;i++)addToyBall(level.adventure);');assert.equal(run('level.adventure.toys.length'),24,'body cap');
for(let design=0;design<3;design++){
 run(`level.adventure.design=${design};rebuildToys(level.adventure,false);for(let i=0;i<180;i++)updateStudio(1/120);ctx.drawImage(bgCanvas,0,0,W,H);drawTopBar();drawStudio(0);`);render('tumble-layout-'+design);
 assert(run('level.adventure.toys.every(p=>Number.isFinite(p.position.x+p.position.y))'));
}
run('openMenu();');assert.equal(run('studioControls.hidden'),true,'studio controls leave with game');
// Tower: taps and holds smash soft rings, dark slices only bounce, the goal advances a saved level.
saved.delete('evisgame-tower-v1');
run("beginMode('tower');");
assert.equal(run('level.adventure.lvl'),1);assert.equal(run('phase'),'play');
run('const tg=level.adventure;for(let i=0;i<90;i++)updateAdventure(1/60);');
assert.equal(run('tg.next'),0,'the ball bounces on the top ring without input');
assert(run('tg.vy<0||tg.foot<0'),'first ring bounce sends the ball upward');
run('tg.rings[0].kinds.fill(0);tg.rings[1].kinds.fill(0);tapAdventure(0,0);for(let i=0;i<120;i++)updateAdventure(1/60);');
assert.equal(run('tg.next'),1,'a tap smashes exactly one ring');assert(run('tg.rings[0].broken&&tg.score===1'));
assert.equal(run('tg.total'),run('sensoryTotals.tower'));
run('tg.rings[1].kinds.fill(1);startTouch({pointerId:900,clientX:195,clientY:600});');
assert(run('towerHolding()'));
run('let flashed=false;for(let i=0;i<120;i++){updateAdventure(1/60);flashed=flashed||tg.rings[1].flash>0;}');
assert.equal(run('tg.next'),1,'dark slices never break without fire');assert(run('flashed'),'dark slice reacts');
assert.equal(run('tg.state'),'play','a dark slice is never a loss');assert.equal(run('phase'),'play');
run('tg.rings[1].kinds.fill(0);for(let i=0;i<60;i++)updateAdventure(1/60);');
assert(run('tg.next>2'),'holding keeps smashing');assert(run('tg.heat>0'),'holding charges the fire meter');
assert(run('REDUCED?tg.debris.length===0:tg.debris.length>0&&tg.debris.length<=48'),'shards are bounded (none with reduced motion)');
run('endTouch({pointerId:900});');assert.equal(run('towerHolding()'),false);
run("tg.rings.forEach(r=>r.kinds.fill(1));tg.fire=3;tg.heat=1;startTouch({pointerId:901,clientX:195,clientY:600});for(let i=0;i<40;i++)updateAdventure(1/60);");
assert(run('tg.rings.slice(0,tg.next).every(r=>r.broken)&&tg.next>4'),'fire mode smashes dark slices too');
run('cancelAllPointers();');assert.equal(run('towerHolding()'),false,'cancellation releases the hold');
run('tg.rings.forEach(r=>r.kinds.fill(0));startTouch({pointerId:902,clientX:195,clientY:600});for(let i=0;i<400&&tg.state==="play";i++)updateAdventure(1/60);cancelAllPointers();');
assert.equal(run('tg.state'),'win','reaching the goal celebrates');assert.equal(JSON.parse(saved.get('evisgame-tower-v1')).lvl,2);
run('for(let i=0;i<180;i++)updateAdventure(1/60);');
assert.equal(run('tg.lvl'),2);assert.equal(run('tg.state'),'play');assert.equal(run('tg.next'),0,'next tower is built');
assert(run('tg.rings.length===18&&tg.rings.every(r=>r.kinds.length===8&&!r.broken)'),'level 2 uses taller octagonal tower');
assert(run('tg.rings.every(r=>Array.from(r.kinds).some(k=>k===0))'),'every ring keeps a soft slice');
run('ctx.save();drawAdventure(1);ctx.restore();');render('tower-level-2');
run('tg.rings[0].kinds.fill(0);resetSheet.hidden=false;const blocked=tg.credit;tapAdventure(0,0);');assert.equal(run('tg.credit'),run('blocked'),'modal blocks tower input');run('resetSheet.hidden=true;');
for(const [w,h] of [[320,568],[844,390],[768,1024]]){
 sandbox.innerWidth=w;sandbox.innerHeight=h;run('resize();for(let i=0;i<30;i++)updateAdventure(1/60);drawAdventure(2);');
 assert(run('tg.origin-tg.R*(TW.bounce+TW.ball)>tg.hud-20&&tg.R>=56'),'ball apex clears the HUD');render(`tower-${w}x${h}`);
}
sandbox.innerWidth=390;sandbox.innerHeight=844;run('resize();');
run('openMenu();');assert.equal(JSON.parse(saved.get('evisgame-progress-v1')).sensoryTotals.tower,run('sensoryTotals.tower'));
run("beginMode('tower');");assert.equal(run('level.adventure.lvl'),2,'tower level persists');
// Arcade (4+): shared level flow plus each game's own rules.
saved.delete('evisgame-arcade-v1');run('arcadeSaves={};');
const step=(n,dt=1/60)=>run(`for(let i=0;i<${n};i++)updateAdventure(${dt});`);
// Blok kulesi: perfect drops snap, offset drops are cut, a full miss retries the same level.
run("beginMode('stack');var sg=level.adventure;");
const stackAlign=off=>run(`{let n=0;while(n++<600){updateAdventure(1/60);const m=sg.moving,a=m.axis,t=sg.blocks[sg.blocks.length-1];if(Math.abs((m[a+'0']+m[a+'1'])/2-(t[a+'0']+t[a+'1'])/2-(${off}))<.02)break;}}`);
stackAlign(0);run('stackPlace(sg);');assert.equal(run('sg.placed'),1);assert.equal(run('sg.combo'),1,'aligned drop is perfect');
stackAlign(.2);run('var wBefore=sg.moving[sg.moving.axis+"1"]-sg.moving[sg.moving.axis+"0"];stackPlace(sg);var stTop=sg.blocks[sg.blocks.length-1];');
assert(run('Math.abs((stTop.z1-stTop.z0)*(stTop.x1-stTop.x0)-(wBefore-.2))<.03'),'overhang is sliced off');assert(run('sg.falling.length>0'));
run('{const mv=sg.moving,ax=mv.axis;mv[ax+"0"]+=5;mv[ax+"1"]+=5;stackPlace(sg);}');assert.equal(run('sg.state'),'retry','full miss asks to try again');
step(100);assert.equal(run('sg.state'),'play');assert.equal(run('sg.placed'),0);assert.equal(run('sg.lvl'),1,'retry keeps the level');
run('sg.target=2;');stackAlign(0);run('stackPlace(sg);');stackAlign(0);run('stackPlace(sg);');assert.equal(run('sg.state'),'win');
assert.equal(JSON.parse(saved.get('evisgame-arcade-v1')).stack.lvl,2);step(150);assert.equal(run('sg.lvl'),2);assert.equal(run('sg.state'),'play');
run('ctx.save();drawAdventure(3);ctx.restore();');render('arcade-stack');
// Meyve ninja: swipes slice fruit, spiky balls cost hearts, three hearts retry.
run("beginMode('slice');var lg=level.adventure;");step(120);
assert(run('lg.fruits.length>0'),'fruit is thrown in');
run('lg.fruits.splice(1);lg.fruits[0].spiky=false;var f0=lg.fruits[0];startTouch({pointerId:31,clientX:f0.x-80,clientY:f0.y});moveTouch({pointerId:31,clientX:f0.x+80,clientY:f0.y,preventDefault(){}});');
assert.equal(run('lg.sliced'),1,'a swipe through the fruit slices it');assert.equal(run('lg.halves.length'),2);
run('endTouch({pointerId:31});');
run('for(let i=0;i<3;i++){lg.fruits.push({kind:0,spiky:true,x:100,y:300,vx:0,vy:0,rot:0,vr:0});sliceCut(lg,lg.fruits[lg.fruits.length-1],0,-1);}');
assert.equal(run('lg.state'),'retry');step(100);assert.equal(run('lg.hearts'),3);assert.equal(run('lg.sliced'),0);
run('for(let i=0;i<400;i++){sliceSpawn(lg);}');assert(run('lg.fruits.length<=12'),'bounded fruit');
run('lg.fruits.forEach(f=>f.spiky=false);for(let i=0;i<60&&lg.fruits.length;i++)sliceCut(lg,lg.fruits[0],0,-1);');assert(run('lg.halves.length<=24&&lg.splats.length<=10&&lg.fx.length<=160'),'bounded effects');
run('startTouch({pointerId:32,clientX:50,clientY:400});cancelAllPointers();');step(30);assert.equal(run('lg.trails.size'),0,'trails clear after cancel');
run('ctx.save();drawAdventure(3);ctx.restore();');render('arcade-slice');
// Obur delik: every level can be finished by eating smaller objects first.
for(const lvl of [1,4,7]){
  run(`arcadeSaves.hole={lvl:${lvl}};beginMode('hole');var hg=level.adventure;`);
  const r0=run('hg.hole.r');
  run(`for(let i=0;i<9000&&hg.state==='play';i++){if(i%20===0){const o=hg.objs.filter(o=>o.fall===-1&&o.r<=hg.hole.r*.92).sort((a,b)=>a.r-b.r)[0];if(o)tapAdventure(o.x,o.y);}updateAdventure(1/60);}`);
  assert.equal(run('hg.state'),'win',`hole level ${lvl} is always completable`);assert(run('hg.hole.r')>r0*2,'hole grows');
}
run("arcadeSaves.hole={lvl:1};beginMode('hole');hg=level.adventure;startTouch({pointerId:41,clientX:200,clientY:600});moveTouch({pointerId:41,clientX:120,clientY:520,preventDefault(){}});");
assert(run('hg.hole.tx<hg.field.x+hg.field.w/2'),'drag moves the hole');run('cancelAllPointers();');assert.equal(run('hg.drag'),null);
run('ctx.save();drawAdventure(3);ctx.restore();');render('arcade-hole');
// Meyve birleştir: equal fruit merge upward; drops respect cooldown; a cancelled drag never drops.
run("beginMode('merge');var mg=level.adventure;mg.target=9;mergeAdd(mg,2,150,400);mergeAdd(mg,2,150+mergeR(2)*2-2,400);");step(120);
assert(run('mg.fruits.some(f=>f.plugin.tier===3)&&!mg.fruits.some(f=>f.plugin.tier===2)'),'two grapes become a tangerine');assert.equal(run('mg.top'),3);
run('mg.cool=0;var mBefore=mg.fruits.length;tapAdventure(mg.jx+50,300);tapAdventure(mg.jx+50,300);');assert.equal(run('mg.fruits.length'),run('mBefore')+1,'cooldown between drops');
step(60);run('var b2=mg.fruits.length;startTouch({pointerId:51,clientX:200,clientY:300});cancelAllPointers();');assert.equal(run('mg.fruits.length'),run('b2'),'cancel does not drop');
run('startTouch({pointerId:52,clientX:120,clientY:300});endTouch({pointerId:52,clientX:120,clientY:300,type:"pointerup"});');assert.equal(run('mg.fruits.length'),run('b2')+1,'release drops');
assert.equal(run('mg.state'),'play');run('for(let i=0;i<40;i++)mergeAdd(mg,6,80+(i%3)*120,-120-i*60).plugin.merged=true;');run('for(let i=0;i<900&&mg.state==="play";i++)updateAdventure(1/60);');assert.equal(run('mg.state'),'retry','overflow retries');step(100);step(60);assert.equal(run('mg.fruits.length'),0);
run('mg.target=4;mergeAdd(mg,3,120,450);mergeAdd(mg,3,120+mergeR(3)*2-2,450);');step(90);assert.equal(run('mg.state'),'win','reaching the target fruit wins');
run('ctx.save();drawAdventure(3);ctx.restore();');render('arcade-merge');
// Renk sırala: generated puzzles are solvable; moves, completion, undo and win.
for(let n=3;n<=7;n++)for(let k=0;k<3;k++)assert(run(`sortSolvable(sortGenerate(${n}))`),`solvable sort puzzle with ${n} colours`);
run("beginMode('sort');var og=level.adventure;og.tubes=[[0,0,0],[1,1,1,0],[1],[]];og.done=[false,false,false,false];og.hidden=[0,0,0,0];og.nColors=2;layoutArcade();");
run('tapAdventure(og.items[1].x,og.items[1].y);');assert.equal(run('og.sel'),1);
run('tapAdventure(og.items[0].x,og.items[0].y);');assert(run('og.done[0]&&og.tubes[0].length===4'),'tube completes');
run('tapAdventure(og.undoBtn.x,og.undoBtn.y);');assert(run('!og.done[0]&&og.tubes[1].length===4'),'undo restores');
run('tapAdventure(og.items[2].x,og.items[2].y);tapAdventure(og.items[3].x,og.items[3].y);');assert.equal(run('og.tubes[3].length'),1,'move onto empty tube');
run('tapAdventure(og.items[1].x,og.items[1].y);tapAdventure(og.items[0].x,og.items[0].y);tapAdventure(og.items[1].x,og.items[1].y);tapAdventure(og.items[3].x,og.items[3].y);');
assert(run('sortSolved(og.tubes)'));step(60);assert.equal(run('og.state'),'win');
run('ctx.save();drawAdventure(3);ctx.restore();');render('arcade-sort');
run('openMenu();');for(const t of ['stack','slice','hole','merge','sort'])assert(JSON.parse(saved.get('evisgame-progress-v1')).sensoryTotals[t]>0,`${t} exploration saved`);
run("setMenuAge('big');");assert.equal(saved.get('evisgame-age'),'big');assert.equal(run("ageTabHit(ageTabs().x+5,ageTabs().y+5)"),'small');run("handleMenuTap(ageTabs().x+5,ageTabs().y+5);");assert.equal(run('menuAge'),'small','tab tap switches age');
// Scene transitions capture the old screen and finish without leaving state behind.
run('openMenu();');assert(run('sceneFx.t===0&&!!sceneFx.snap'),'transition starts from a snapshot');
run('for(let i=0;i<60;i++)frame(last+16);');assert.equal(run('sceneFx.t'),1,'transition completes');
for(const w of [0,1,2]){run(`world=${w};buildBackground();drawBackdrop(${w*3+1});`);render('backdrop-'+w);}
run('world=0;buildBackground();openMenu();');
for(const type of ['color','shape','size','count','animal']){
  run(`beginMode('${type}');phase='play';level.pieces.forEach(autoPlace);`);assert.equal(run('phase'),'win',type);
}
run("beginMode('memory');phase='play';");
run('for(let key=0;key<level.memory.pairs;key++){const pair=level.pieces.filter(p=>p.key===key);revealMemoryCard(pair[0]);revealMemoryCard(pair[1]);time+=2;updateMemory(2);}');assert.equal(run('phase'),'win','memory');
for(let w=0;w<3;w++){run(`world=${w};buildBackground();openMenu();drawGameMenu(1);`);render('world-'+w);}
run('drawStart(0);');render('start');
// Character animation: temporal states, local gaze, independent personalities and cancellation.
run("const actorTest=character(4);characterEvent(actorTest,'hold');updateCharacter(actorTest,1/60,{speed:8});");
assert.equal(run('actorTest.mode'),'held','held expression takes priority over velocity');
run("characterEvent(actorTest,'impact',1);");assert.equal(run('actorTest.event'),'hello','contacts do not interrupt a held toy');
run("characterEvent(actorTest,'cancel');updateCharacter(actorTest,1/60);");assert.equal(run('actorTest.held'),false);assert.equal(run('actorTest.event'),null);
run("characterEvent(actorTest,'impact',1);updateCharacter(actorTest,1/60);const firstImpact=actorTest.eventLife;characterEvent(actorTest,'impact',1);");
assert.equal(run('actorTest.eventLife'),run('firstImpact'),'contact cooldown prevents restart');assert.equal(run('actorTest.mode'),'impact');
run('for(let i=0;i<20;i++)updateCharacter(actorTest,1/60);');assert.equal(run('actorTest.mode'),'giggle','landing resolves into a happy recovery');
run('for(let i=0;i<90;i++)updateCharacter(actorTest,1/60);');assert.equal(run('actorTest.event'),null,'reaction expires');
run("const gazeTest=character(0);for(let i=0;i<60;i++)updateCharacter(gazeTest,1/60,{x:100,y:100,angle:Math.PI/2,target:{x:100,y:200}});");
assert(run('gazeTest.gazeX>.9&&Math.abs(gazeTest.gazeY)<.01'),'gaze uses rotated toy coordinates');
run('for(let i=0;i<60;i++)updateCharacter(gazeTest,1/60,{x:100,y:100,flip:-1,target:{x:200,y:100}});');assert(run('gazeTest.gazeX<-.9'),'mirrored fish look toward the finger');
run("const petTest=character(1);for(let i=0;i<3;i++){characterEvent(petTest,'pet');updateCharacter(petTest,.05);}");assert.equal(run('petTest.mode'),'giggle','rapid petting produces laughter');
run('const sleepTest=character(3);for(let i=0;i<720;i++)updateCharacter(sleepTest,1/60);');assert.equal(run('sleepTest.mode'),'sleepy');
run("characterEvent(sleepTest,'pet');updateCharacter(sleepTest,1/60);");assert.equal(run('sleepTest.mode'),'hello','touch wakes a sleepy toy immediately');
assert.equal(run('new Set(Array.from({length:6},(_,i)=>character(i).blinkAt)).size'),6,'blinks are staggered');
if(process.env.EVIS_REDUCED==='1')assert(run('actorTest.squash===0&&actorTest.stretch===0&&actorTest.bob===0&&actorTest.tilt===0'),'reduced motion disables secondary motion');
run("beginMode('tumble');const physicalToy=level.adventure.toys[0];const fixedArea=physicalToy.area;const fixedWidth=physicalToy.plugin.w;characterEvent(physicalToy.plugin.actor,'impact',1);for(let i=0;i<20;i++)updateToyCharacters(level.adventure,1/60);");
assert.equal(run('physicalToy.area'),run('fixedArea'));assert.equal(run('physicalToy.plugin.w'),run('fixedWidth'),'visual squash does not change collision geometry');
run('const heldItem=level.adventure.items[0];startTouch({pointerId:700,clientX:heldItem.x,clientY:heldItem.y});const heldActor=touchPointers.get(700).body.plugin.actor;endTouch({pointerId:700,type:"pointercancel"});');assert.equal(run('heldActor.held'),false);assert.equal(run('heldActor.event'),null,'pointer cancellation does not trigger release excitement');
// Render a contact sheet and an actual continuous timeline with persistent actor state.
if(process.env.EVIS_RENDER_DIR){
 run('cvs.width=900;cvs.height=720;ctx.fillStyle="#F5F0E8";ctx.fillRect(0,0,900,720);');
 const states=['idle','hold','impact','giggle','sleepy','watch'];
 for(let row=0;row<states.length;row++)for(let col=0;col<6;col++){
  const state=states[row];
  run(`{const a=character(${col});if('${state}'==='sleepy'){for(let i=0;i<720;i++)updateCharacter(a,1/60);}else if('${state}'==='watch'){for(let i=0;i<30;i++)updateCharacter(a,1/60,{target:{x:90,y:-40}});}else{if('${state}'!=='idle')characterEvent(a,'${state}');for(let i=0;i<10;i++)updateCharacter(a,1/60);}drawLivingBlock({position:{x:${col*150+75},y:${row*120+60}},angle:0,plugin:{actor:a,w:86,h:86,shape:'block',color:${col}}});}`);
 }
 render('personality-expressions');
 run('cvs.width=390;cvs.height=300;const timelineActor=character(4);');
 for(let i=0;i<90;i++){
  if(i===10)run("characterEvent(timelineActor,'hold');");
  if(i===28)run("characterEvent(timelineActor,'release');");
  if(i===40)run("characterEvent(timelineActor,'impact',.85);");
  run(`updateCharacter(timelineActor,1/30,{x:195,y:150,target:{x:260,y:90},speed:${i>=28&&i<40?4:0}});ctx.fillStyle='#F5F0E8';ctx.fillRect(0,0,390,300);drawLivingBlock({position:{x:195,y:150},angle:0,plugin:{actor:timelineActor,w:150,h:150,shape:'block',color:4}});`);
  render('animation-'+String(i).padStart(3,'0'));
 }
 run('resize();');
}

console.log('PASS: 21 modes × 4 viewports; 4+ arcade: stack cut/perfect/retry/win, slice swipe/hearts, hole always completable, merge physics/cooldown/overflow, sort solver/undo/win; age tabs; tower smash/bounce/fire/goal/level save/layout; scene transitions; 37 SVGs; character transitions/gaze/cooldowns/reduced motion; painting and rigid-body physics; 8 continuous touch games; rapid input bounds; multi-touch/drag/cancel; modal blocking; saved progress; growth/fish reactions; learning menu; legacy matching and memory.');
})().catch(e=>{console.error(e);process.exitCode=1;});
