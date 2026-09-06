// Real Canvas rendering plus deterministic state checks; no browser emulation claims.
// npm install --no-save @napi-rs/canvas, then node tests/playground.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {createCanvas,Image}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'):'@napi-rs/canvas');
const root=path.join(__dirname,'..'),els=new Map(),saved=new Map();
const document={visibilityState:'visible',activeElement:null,addEventListener(){}};
function element(tag){const e=tag==='canvas'?createCanvas(390,844):{};return Object.assign(e,{style:{},children:[],hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},addEventListener(){},append(...items){this.children.push(...items);},appendChild(item){this.children.push(item);},replaceChildren(...items){this.children=items;},focus(){document.activeElement=this;},setPointerCapture(){},releasePointerCapture(){}});}
document.createElement=element;document.getElementById=id=>{if(!els.has(id))els.set(id,element(id==='c'?'canvas':'div'));return els.get(id);};document.head=element('head');document.body=element('body');document.documentElement=element('html');
const sandbox={console,document,Image,Math,performance:{now:()=>0},navigator:{userAgent:'test',platform:'test'},matchMedia:()=>({matches:false}),getComputedStyle:()=>({getPropertyValue:()=>0}),localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},setTimeout:()=>0,setInterval:()=>0,clearTimeout(){},clearInterval(){},requestAnimationFrame(){}};
sandbox.window=sandbox;sandbox.innerWidth=390;sandbox.innerHeight=844;sandbox.devicePixelRatio=1;sandbox.addEventListener=()=>{};
const context=vm.createContext(sandbox),run=code=>vm.runInContext(code,context);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
run(html.match(/<script>([\s\S]*?)<\/script>/)[1]);run(fs.readFileSync(path.join(root,'playground.js'),'utf8'));run('resize(); started=true; adsDisabled=true;');
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
for(const type of ['orchard','pattern','rhythm']){
  for(let round=0;round<8;round++){
    run(`modeRounds.${type}=${round};beginMode('${type}');phase='play';`);
    if(type==='rhythm'){
      run('tapAdventure(level.adventure.items[0].x,level.adventure.items[0].y);');
      assert.equal(run('level.adventure.done'),0,'input locked during demo');
      for(let i=0;i<110;i++)run('updateAdventure(.05);');
      assert.equal(run('level.adventure.playback'),false);
    }
    run(`{const g=level.adventure;const wrong=g.items.find(p=>p.kind!==('${type}'==='orchard'?g.target:'${type}'==='pattern'?g.answer:g.sequence[g.step]));tapAdventure(wrong.x,wrong.y);}`);
    assert.equal(run('level.adventure.done'),0,'wrong answer does not progress');
    const goal=run('level.adventure.goal');
    for(let i=0;i<goal;i++)run(`{const g=level.adventure;const p=g.items.find(p=>!p.collected&&p.kind===('${type}'==='orchard'?g.target:'${type}'==='pattern'?g.answer:g.sequence[g.step]));if(!p)throw Error('no reachable answer');tapAdventure(p.x,p.y);}`);
    assert.equal(run('phase'),'win',`${type} ${round} completable`);
    run('finishCompletedLevel();');assert.equal(run(`modeRounds.${type}`),round+1);
    assert.equal(JSON.parse(saved.get('evisgame-progress-v1')).modeRounds[type],round+1);
  }
}
for(const type of ['color','shape','size','count','animal']){
  run(`beginMode('${type}');phase='play';level.pieces.forEach(autoPlace);`);assert.equal(run('phase'),'win',type);
}
run("beginMode('memory');phase='play';");
run('for(let key=0;key<level.memory.pairs;key++){const pair=level.pieces.filter(p=>p.key===key);revealMemoryCard(pair[0]);revealMemoryCard(pair[1]);time+=2;updateMemory(2);}');assert.equal(run('phase'),'win','memory');
run("beginMode('pop');phase='play';for(let i=0;i<level.popGame.goal;i++){const p=level.pieces.find(p=>p.shape===level.popGame.target);hitPopPiece(p);}");assert.equal(run('phase'),'win','pop');
for(let w=0;w<3;w++){run(`world=${w};buildBackground();openMenu();drawGameMenu(1);`);render('world-'+w);}
run('drawStart(0);');render('start');
console.log('PASS: 11 modes render at 4 viewport sizes; menu touch bounds; 24 new-game rounds; wrong answers; rhythm playback lock; saved progression; legacy matching/memory/pop completion; 3 worlds.');
