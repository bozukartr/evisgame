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
for(const file of ['touch-art.js','playground.js','sensory.js'])run(fs.readFileSync(path.join(root,file),'utf8'));
assert((await run('touchArtReady')).every(Boolean),'all 12 SVG assets load');
run('resize(); started=true; adsDisabled=true;');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
for(const asset of run('TOUCH_ART_NAMES'))assert(sw.includes('./assets/play/'+asset+'.svg'),'SVG is cached for offline play');
const render=name=>{if(process.env.EVIS_RENDER_DIR){fs.mkdirSync(process.env.EVIS_RENDER_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.EVIS_RENDER_DIR,name+'.png'),els.get('c').toBuffer('image/png'));}};
for(const [w,h] of [[390,844],[320,568],[844,390],[768,1024]]){
  sandbox.innerWidth=w;sandbox.innerHeight=h;run("resize(); openMenu(); drawGameMenu(0);");
  assert.equal(run('menuLayer.children.length'),7);
  assert(run('menuCards(MAIN_MENU).every(c=>c.h>=44&&c.x>=0&&c.y>=0&&c.x+c.w<=W&&c.y+c.h<=H-75)'));
  render(`menu-${w}x${h}`);
  for(const type of run('TYPES')){
    run(`beginMode('${type}');`);
    for(let i=1;i<=40;i++)run(`frame(last+50);`);
    assert.equal(run('phase'),'play',type);
    if(w===390)render(type);
  }
}
sandbox.innerWidth=390;sandbox.innerHeight=844;run('resize();');
for(const type of run('FREE_PLAY')){
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
for(const type of ['color','shape','size','count','animal']){
  run(`beginMode('${type}');phase='play';level.pieces.forEach(autoPlace);`);assert.equal(run('phase'),'win',type);
}
run("beginMode('memory');phase='play';");
run('for(let key=0;key<level.memory.pairs;key++){const pair=level.pieces.filter(p=>p.key===key);revealMemoryCard(pair[0]);revealMemoryCard(pair[1]);time+=2;updateMemory(2);}');assert.equal(run('phase'),'win','memory');
for(let w=0;w<3;w++){run(`world=${w};buildBackground();openMenu();drawGameMenu(1);`);render('world-'+w);}
run('drawStart(0);');render('start');
console.log('PASS: 13 modes × 4 viewports; 12 SVGs; 6 continuous touch games; rapid input bounds; multi-touch/drag/cancel; modal blocking; saved progress; growth/fish reactions; learning menu; legacy matching and memory.');
})().catch(e=>{console.error(e);process.exitCode=1;});
