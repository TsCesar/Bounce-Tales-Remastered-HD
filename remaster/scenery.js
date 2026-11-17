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

  const FALLBACKS={
    forest:['#75BBE2','#B2E4DD','#7DBDA0'],
    lagoon:['#66BDD5','#C6EFE2','#6AB8A9'],
    twilight:['#5D639B','#A79CCB','#737DAD'],
    sunset:['#A674B3','#F5B8AB','#B586A4']
  };
  function drawLoadingBackdrop(ctx,biome){
    const colors=FALLBACKS[biome];
    ctx.save();
    const sky=ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,colors[0]);sky.addColorStop(.65,colors[1]);
    sky.addColorStop(1,colors[2]);
    ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    // Continuous hand-drawn hills, not the old repeated parallax sprites.
    ctx.beginPath();ctx.moveTo(0,H*.68);
    ctx.bezierCurveTo(W*.27,H*.61,W*.41,H*.75,W*.64,H*.66);
    ctx.bezierCurveTo(W*.80,H*.58,W*.92,H*.67,W,H*.62);
    ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();
    ctx.fillStyle=colors[2];ctx.fill();
    ctx.restore();
  }
  function drawScenery(ctx,level,time,cameraX,cameraY){
    if(remaster.quality==='classic')return false;
    const biome=biomeFor(level);
    const image=getBackdrop(biome);
    if(!image.complete||!image.naturalWidth){
      drawLoadingBackdrop(ctx,biome);
      return true;
    }
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

    const rows=4;
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
