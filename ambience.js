/* Scene transitions: the next screen opens in a growing bubble from the finger that chose it. */
const sceneFx={snap:null,t:1,x:0,y:0};
let lastTouchPoint=null;
window.addEventListener('pointerdown',e=>{lastTouchPoint={x:e.clientX,y:e.clientY};},true);
function beginSceneTransition(){
  if(!started||!W||!H)return;
  try{
    const c=sceneFx.snap||(sceneFx.snap=document.createElement('canvas'));
    if(c.width!==cvs.width||c.height!==cvs.height){c.width=cvs.width;c.height=cvs.height;}
    const q=c.getContext('2d');q.setTransform(1,0,0,1,0,0);q.drawImage(cvs,0,0);
  }catch(e){sceneFx.t=1;return;}
  const p=lastTouchPoint||{x:W/2,y:H/2};sceneFx.x=clamp(p.x,0,W);sceneFx.y=clamp(p.y,0,H);sceneFx.t=0;lastTouchPoint=null;
}
function drawSceneTransition(dt){
  if(sceneFx.t>=1||!sceneFx.snap)return;
  sceneFx.t=Math.min(1,sceneFx.t+dt/(REDUCED?.22:.62));
  const t=sceneFx.t,e=t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  ctx.save();
  if(REDUCED){ctx.globalAlpha=1-t;ctx.drawImage(sceneFx.snap,0,0,W,H);ctx.restore();return;}
  const {x,y}=sceneFx,r=Math.max(.1,e*Math.hypot(Math.max(x,W-x),Math.max(y,H-y))*1.04);
  ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(x,y,r,0,Math.PI*2);ctx.clip('evenodd');ctx.drawImage(sceneFx.snap,0,0,W,H);ctx.restore();
  ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle='#FFFFFF';ctx.lineWidth=3+10*(1-e);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+t*2;orb(x+Math.cos(a)*r,y+Math.sin(a)*r,(3+(i%3)*2.5)*(1-t)+1,PALETTE[i%PALETTE.length]);}
  ctx.restore();
}
const baseOpenMenu=openMenu;
openMenu=function(page){beginSceneTransition();return baseOpenMenu.apply(this,arguments);};
const baseBeginMode=beginMode;
beginMode=function(type){beginSceneTransition();return baseBeginMode.apply(this,arguments);};
const baseFrame=frame;
frame=function(now){const before=time;baseFrame(now);drawSceneTransition(Math.max(0,time-before));};
