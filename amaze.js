/* Yol boya · swipe (or tap beside the ball); it slides until it meets a wall and paints the path.
   Mazes are carved by simulated slides whose stop cells stay walls, so replaying the carve always paints every tile. */
const AMAZE_THEMES=[{wall:'#7C5CFF',paint:'#FF7AB6',floor:'#F3EEFF'},{wall:'#22B07D',paint:'#FFB020',floor:'#E8FAF2'},{wall:'#FF7A4D',paint:'#3D9BF5',floor:'#FFF2EB'},{wall:'#3D9BF5',paint:'#FF5A6E',floor:'#EBF4FF'}];
const AMAZE_DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
ARCADE.amaze={
  hint:'Kaydır: top duvara kadar gidip boyar',
  colors:g=>{const t=AMAZE_THEMES[(g.lvl-1)%4];return [t.wall,t.paint,'#FFF7FB','#EDE6FF'];},
  build(g){
    const L=g.lvl;g.C=L<3?7:L<6?9:11;g.R=g.C+2;g.theme=AMAZE_THEMES[(L-1)%4];
    const m=amazeGenerate(g.C,g.R,Math.min(5+L*2,26));g.grid=m.grid;g.solution=m.moves;g.paint=new Float32Array(g.C*g.R).fill(-1);g.need=m.grid.reduce((a,v)=>a+v,0);g.done=0;
    g.ball={c:m.start.c,r:m.start.r,x:m.start.c,y:m.start.r,move:null,sq:0,dir:[0,1],wob:0};g.queue=null;g.swipe=null;amazePaint(g,m.start.c,m.start.r);
  },
  layout(g){const b=g.box;g.cs=Math.min(b.w/g.C,(b.h-24)/g.R);g.ox=W/2-g.cs*g.C/2;g.oy=b.y+(b.h-g.cs*g.R)/2;},
  progress:g=>g.done/g.need,
  down(g,x,y,id){g.swipe={id,x,y,fired:false};},
  move(g,x,y,id){const s=g.swipe;if(!s||s.id!==id||s.fired)return;const dx=x-s.x,dy=y-s.y;if(Math.hypot(dx,dy)>24){s.fired=true;amazeGo(g,Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]);}},
  up(g,x,y,id,cancelled){const s=g.swipe;if(!s||s.id!==id)return;g.swipe=null;if(!s.fired&&!cancelled)ARCADE.amaze.tap(g,x,y);},
  cancel(g){g.swipe=null;},
  tap(g,x,y){const b=g.ball,dx=x-(g.ox+(b.x+.5)*g.cs),dy=y-(g.oy+(b.y+.5)*g.cs);if(Math.max(Math.abs(dx),Math.abs(dy))<g.cs*.4)return;amazeGo(g,Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]);},
  update(g,dt){
    const b=g.ball;b.sq=Math.max(0,b.sq-dt*4);b.wob=Math.max(0,b.wob-dt*3);
    for(let i=0;i<g.paint.length;i++)if(g.paint[i]>=0&&g.paint[i]<1)g.paint[i]=Math.min(1,g.paint[i]+dt*5);
    const m=b.move;if(!m)return;
    m.t=Math.min(1,m.t+dt*14/m.len);const e=1-(1-m.t)**2,k=e*m.len;
    b.x=m.c0+m.d[0]*k;b.y=m.r0+m.d[1]*k;
    for(let i=m.painted+1;i<=Math.floor(k+.5)&&i<=m.len;i++){m.painted=i;amazePaint(g,m.c0+m.d[0]*i,m.r0+m.d[1]*i);}
    if(m.t>=1){b.c=m.c0+m.d[0]*m.len;b.r=m.r0+m.d[1]*m.len;b.x=b.c;b.y=b.r;b.move=null;b.sq=1;
      arcadeBurst(g,g.ox+(b.x+.5+m.d[0]*.4)*g.cs,g.oy+(b.y+.5+m.d[1]*.4)*g.cs,g.theme.paint,8,{kind:'drop',gravity:300,min:40,max:140});tone(200,.06,'sine',.1);
      if(g.done>=g.need){arcadeWin(g);return;}
      if(g.queue){const q=g.queue;g.queue=null;amazeGo(g,q);}}
  },
  draw(g,time){
    const cs=g.cs,t=g.theme;
    ctx.save();ctx.shadowColor='rgba(60,40,120,.25)';ctx.shadowBlur=18;ctx.shadowOffsetY=8;pill(g.ox-6,g.oy-6,cs*g.C+12,cs*g.R+12,t.wall,cs*.4);ctx.restore();
    for(let r=0;r<g.R;r++)for(let c=0;c<g.C;c++){
      const x=g.ox+c*cs,y=g.oy+r*cs,i=r*g.C+c;
      if(g.grid[i]){pill(x+.5,y+.5,cs-1,cs-1,t.floor,cs*.12);const p=g.paint[i];if(p>=0){const s=.35+.65*easeBack(p);pill(x+cs*(1-s)/2,y+cs*(1-s)/2,cs*s,cs*s,t.paint,cs*.22);pill(x+cs*.2,y+cs*.18,cs*.3*s,cs*.12*s,'rgba(255,255,255,.35)',cs*.06);}}
      else{pill(x+1,y+cs*.12,cs-2,cs-2,shadeHex(t.wall,.7),cs*.2);pill(x+1,y+1,cs-2,cs-cs*.14,shadeHex(t.wall,1.18),cs*.2);pill(x+cs*.2,y+cs*.14,cs*.35,cs*.1,'rgba(255,255,255,.3)',cs*.05);}
    }
    const b=g.ball,bx=g.ox+(b.x+.5)*cs+(REDUCED?0:Math.sin(b.wob*30)*b.wob*5),by=g.oy+(b.y+.5)*cs,r=cs*.36,sq=Math.sin(b.sq*Math.PI)*.22,moving=!!b.move;
    ctx.save();ctx.translate(bx,by);const horiz=b.dir[0]!==0;ctx.scale(horiz?1-sq+(moving?.12:0):1+sq,horiz?1+sq:1-sq+(moving?.12:0));
    const gr=ctx.createRadialGradient(-r*.35,-r*.4,r*.08,0,0,r);gr.addColorStop(0,'#FFFFFF');gr.addColorStop(.35,t.paint);gr.addColorStop(1,shadeHex(t.paint,.65));
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();orb(-r*.35,-r*.42,r*.18,'rgba(255,255,255,.75)');
    const lx=b.dir[0]*r*.12,ly=b.dir[1]*r*.12;for(const s of [-1,1]){orb(s*r*.3+lx,ly,r*.14,'#FFFFFF');orb(s*r*.3+lx*1.6,ly*1.6,r*.08,'#2A2233');}
    ctx.strokeStyle='#2A2233';ctx.lineWidth=Math.max(1,r*.08);ctx.lineCap='round';ctx.beginPath();ctx.arc(lx,r*.3+ly,r*.15,.15*Math.PI,.85*Math.PI);ctx.stroke();
    ctx.restore();
  },
  preview(x,y,s,t){
    const cs=s*.11,ox=x-cs*2.5,oy=y-cs*2.5,k=REDUCED?1:Math.min(1,((t*.5)%1)*1.8);
    ['11111','10001','10101','10001','11111'].forEach((row,r)=>[...row].forEach((v,c)=>pill(ox+c*cs,oy+r*cs,cs-1,cs-1,v==='1'?'#7C5CFF':'#F3EEFF',cs*.18)));
    pill(ox+cs*1.1,oy+cs*1.1,cs*.8,cs*(.8+k*2),'#FF7AB6',cs*.25);orb(ox+cs*1.5,oy+cs*(1.5+k*2),cs*.34,'#FF4F93');orb(ox+cs*1.38,oy+cs*(1.45+k*2),cs*.07,'#FFFFFF');orb(ox+cs*1.62,oy+cs*(1.45+k*2),cs*.07,'#FFFFFF');
  }
};
function amazeGenerate(C,R,steps){
  const inside=(c,r)=>c>0&&r>0&&c<C-1&&r<R-1;let best=null;
  for(let attempt=0;attempt<80;attempt++){
    const grid=new Uint8Array(C*R),blocked=new Uint8Array(C*R);let c=1+((Math.random()*(C-2))|0),r=1+((Math.random()*(R-2))|0);const start={c,r},moves=[];grid[r*C+c]=1;let made=0;
    for(let t=0;t<steps*10&&made<steps;t++){
      const [dx,dy]=AMAZE_DIRS[(Math.random()*4)|0],L=2+((Math.random()*5)|0);let ok=true;
      for(let k=1;k<=L&&ok;k++){const nc=c+dx*k,nr=r+dy*k;if(!inside(nc,nr)||blocked[nr*C+nc])ok=false;}
      const sc=c+dx*(L+1),sr=r+dy*(L+1);if(ok&&inside(sc,sr)&&grid[sr*C+sc])ok=false;
      if(!ok)continue;
      for(let k=1;k<=L;k++)grid[(r+dy*k)*C+c+dx*k]=1;if(inside(sc,sr))blocked[sr*C+sc]=1;c+=dx*L;r+=dy*L;made++;moves.push([dx,dy]);
    }
    const count=grid.reduce((a,v)=>a+v,0);if(!best||count>best.count)best={grid,start,count,moves};
    if(count>=C*R*.3&&made>=steps*.8)return best;
  }
  return best;
}
function amazePaint(g,c,r){const i=r*g.C+c;if(g.paint[i]>=0)return;g.paint[i]=REDUCED?1:0;g.done++;arcadeScore(g,1);if(g.done%4===0)arcadeReward(g);tone(PENTA[g.done%6]*1.5,.05,'sine',.06);}
function amazeGo(g,d){
  if(g.state!=='play')return;const b=g.ball;if(b.move){g.queue=d;return;}
  let len=0;while(g.grid[(b.r+d[1]*(len+1))*g.C+b.c+d[0]*(len+1)])len++; // the border is always wall
  b.dir=d;if(!len){b.wob=1;sndSoft();return;}
  b.move={c0:b.c,r0:b.r,d,len,t:0,painted:0};tone(300,.06,'sine',.08,0,420);
}
