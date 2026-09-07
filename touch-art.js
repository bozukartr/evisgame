/* Original local SVG artwork; no network assets, fonts or raster dependencies. */
const TOUCH_ART_NAMES=['drum','xylophone','bell','flower','butterfly','fish','turtle','rocket','bubble','apple','orange','pear'];
const touchArt={};
const touchArtReady=Promise.all(TOUCH_ART_NAMES.map(name=>new Promise(resolve=>{
  const img=new Image();touchArt[name]=img;
  img.onload=()=>resolve(true);img.onerror=()=>resolve(false);
  img.src=`assets/play/${name}.svg`;
})));
function drawTouchArt(name,x,y,size,rotation=0){
  const img=touchArt[name];if(!img||!img.complete||!img.naturalWidth)return false;
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();return true;
}
