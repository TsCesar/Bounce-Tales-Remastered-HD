/* Retro-HD cartoon scenery and gently animated water. Visual only.
 * All 15 original level files, collision polygons and water physics stay intact.
 */
(function () {
  'use strict';
  const remaster=window.BounceRemaster;
  if(!remaster)return;
  const W=240,H=320;
  const cache=new Map();
  const smallDevice=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
  const MAX_CACHED_BACKDROPS=smallDevice?1:2;

  function biomeFor(level){
    return level===4||level===9||level===14?'sunset':
      level<5?'forest':level<10?'lagoon':'twilight';
  }
  function getBackdrop(name){
    if(cache.has(name)){
      const image=cache.get(name);
      cache.delete(name);cache.set(name,image);
      return image;
    }
    const image=new Image();
    image.decoding='async';
    image.onerror=()=>console.warn('Cartoon background unavailable; use native gradient:',name);
    cache.set(name,image);
    while(cache.size>MAX_CACHED_BACKDROPS)cache.delete(cache.keys().next().value);
    image.src='remaster/assets/scenery/'+name+'.webp?v=13';
    return image;
  }
  remaster.sceneryStatus=()=>({
    cachedBackdrops:cache.size,limit:MAX_CACHED_BACKDROPS,
    biomes:[...cache.keys()],style:'cartoon-retro-hd'
  });

  function drawScenery(ctx,level,time,cameraX,cameraY){
    if(remaster.quality==='classic')return;
    const image=getBackdrop(biomeFor(level));
    if(!image.complete||!image.naturalWidth)return false;
    ctx.save();
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    // Tiny camera-following motion within an overscanned artwork.
    // No repeating strips, no old atlas tiles, no blank viewport edges.
    const parallaxX=Math.sin((cameraX||0)*.00028)*5;
    const parallaxY=Math.sin((cameraY||0)*.00018)*3;
    ctx.drawImage(image,-7+parallaxX,-4+parallaxY,W+14,H+8);
    ctx.restore();
    return true;
  }

  function drawWaterSurface(ctx,opts){
    if(remaster.quality==='classic'||opts.airTunnel)return;
    const xs=[opts.left.x,opts.right.x,opts.bottomLeft.x,opts.bottomRight.x];
    const ys=[opts.left.y,opts.right.y,opts.bottomLeft.y,opts.bottomRight.y];
    const left=Math.min(...xs),right=Math.max(...xs);
    const top=Math.min(...ys),bottom=Math.max(...ys);
    if(right<0||left>W||bottom<0||top>H||right<=left||bottom<=top)return;
    ctx.save();
    // The surrounding original water path remains unchanged and clips all
    // decoration, including the top wave. No extra collision surfaces.
    ctx.clip();
    const color=ctx.createLinearGradient(left,top,left,bottom);
    color.addColorStop(0,'rgba(130,234,244,.55)');
    color.addColorStop(.47,'rgba(65,195,218,.31)');
    color.addColorStop(1,'rgba(37,123,199,.27)');
    ctx.fillStyle=color;
    ctx.fillRect(left,top,right-left,bottom-top);

    const rows=remaster.quality==='ultra'?4:3;
    const width=Math.max(1,right-left),height=Math.max(1,bottom-top);
    const startX=Math.max(-6,left),endX=Math.min(W+6,right);
    for(let i=0;i<rows;i++){
      const y=top+height*(.19+i*.19);
      const move=(opts.time||0)*.9+i*.85;
      ctx.beginPath();
      for(let x=startX,j=0;x<=endX+8;x+=8,j++){
        const py=y+Math.sin(x*.052+move)*.65;
        if(!j)ctx.moveTo(x,py);else ctx.lineTo(x,py);
      }
      ctx.lineWidth=.65;
      ctx.strokeStyle=i%2===0?'rgba(227,255,249,.45)':'rgba(9,119,170,.20)';
      ctx.stroke();
    }
    ctx.restore();
  }
  remaster.drawScenery = drawScenery;
  remaster.drawWaterSurface = drawWaterSurface;
})();
