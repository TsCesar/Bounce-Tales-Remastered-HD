/* Cinematic backgrounds + water caustics for the original 15 stages.
 * Visual-only: these passes do not modify simulation geometry or game state.
 */
(function () {
  'use strict';
  const remaster = window.BounceRemaster;
  if (!remaster) return;
  const W = 240, H = 320;
  // Keeping every 1200x1600 background decoded could occupy 30+ MB in a
  // mobile WebView, even on levels that never use those backgrounds.
  const cache = new Map();
  const smallDevice = typeof matchMedia==='function' && matchMedia('(pointer: coarse)').matches;
  const MAX_CACHED_BACKDROPS = smallDevice ? 1 : 2;

  function biomeFor(level) {
    return level === 4 || level === 9 || level === 14 ? 'sunset' :
      level < 5 ? 'forest' : level < 10 ? 'lagoon' : 'twilight';
  }
  function getBackdrop(biome) {
    if (cache.has(biome)) {
      const existing=cache.get(biome);
      // The Map is maintained in least-recently-used order.
      cache.delete(biome);cache.set(biome,existing);
      return existing;
    }
    const image = new Image();
    image.decoding = 'async';
    image.onerror = () => console.warn('Backdrop fallback to V62 gradient:', biome);
    cache.set(biome, image);
    while(cache.size>MAX_CACHED_BACKDROPS){
      // Release JavaScript references to old decoded backgrounds.
      cache.delete(cache.keys().next().value);
    }
    image.src = 'remaster/assets/scenery/' + biome + '.webp?v=8';
    return image;
  }
  // Lazy-load the CURRENT level's background only; no four-image prefetch.
  remaster.sceneryStatus=()=>({cachedBackdrops:cache.size,
    limit:MAX_CACHED_BACKDROPS,biomes:[...cache.keys()]});

  function drawScenery(ctx, level, time, cameraX, cameraY) {
    if (remaster.quality === 'classic') return;
    const name = biomeFor(level);
    const art = getBackdrop(name);
    if (art.complete && art.naturalWidth) {
      ctx.save();
      // High resolution source (1200 x 1600), behind original game parallax.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = .93;
      ctx.drawImage(art, 0, 0, W, H);
      ctx.restore();
    }
    if (remaster.quality === 'ultra') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const count = name === 'twilight' ? 10 : 14;
      for (let i = 0; i < count; i++) {
        const seed = i * 113.719 + level * 26.87;
        const x = ((seed * 1.618 - (cameraX || 0) * .008 +
                    Math.sin(time * .19 + i) * 2.4) % (W + 24) + W + 24) % (W + 24) - 12;
        const y = ((i * 47.37 + level * 13.4 + Math.cos(time * .11 + i)*7) %
                   (H*.73) + H*.73) % (H*.73);
        const alpha = .10 + .12*(.5+.5*Math.sin(time*.9+i*1.7));
        ctx.fillStyle = 'rgba('+(name==='twilight'?'248,209,255,':'255,251,208,')+alpha+')';
        ctx.beginPath();
        ctx.arc(x,y,i%4===0?.6:.3,0,Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Called while the original water polygon is still the current canvas path.
  function drawWaterSurface(ctx, opts) {
    if (remaster.quality === 'classic' || opts.airTunnel) return;
    const x = Math.min(opts.left.x,opts.right.x,opts.bottomLeft.x,opts.bottomRight.x);
    const maxX = Math.max(opts.left.x,opts.right.x,opts.bottomLeft.x,opts.bottomRight.x);
    const y = Math.min(opts.left.y,opts.right.y);
    const maxY = Math.max(opts.bottomLeft.y,opts.bottomRight.y);
    if (maxX < 0 || x > W || maxY < 0 || y > H) return;
    ctx.save();
    ctx.clip();
    const tint = ctx.createLinearGradient(x,y,x,maxY);
    tint.addColorStop(0,'rgba(189,248,255,.36)');
    tint.addColorStop(.19,'rgba(56,184,215,.15)');
    tint.addColorStop(.70,'rgba(9,85,158,.21)');
    tint.addColorStop(1,'rgba(3,27,74,.27)');
    ctx.fillStyle = tint;
    ctx.fillRect(x,y,maxX-x,maxY-y);
    const width=Math.max(1,maxX-x);
    const height=Math.max(1,maxY-y);
    const rows=remaster.quality==='ultra'?7:4;
    for(let row=0;row<rows;row++){
      const ry=y+height*(.16+.11*row);
      ctx.strokeStyle='rgba(198,249,255,'+(.12+row*.017)+')';
      ctx.lineWidth=.18+(row%3)*.15;
      ctx.beginPath();
      for(let s=0;s<=24;s++){
        const px=x+(s/24)*width;
        const py=ry+Math.sin(px*.105+opts.time*1.7+row*1.4)*(1.0+row*.17);
        if(s===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    if(remaster.quality==='ultra'){
      for(let i=0;i<11;i++){
        const wx=x+((i*47.291+opts.time*7.5)%(width+10));
        const wy=y+(i*.091*height+opts.time*.8)%Math.max(1,height);
        ctx.fillStyle='rgba(216,248,255,.21)';
        ctx.beginPath();ctx.ellipse(wx,wy,.6,.25,-.4,0,Math.PI*2);ctx.fill();
      }
    }
    ctx.restore();
  }

  remaster.drawScenery = drawScenery;
  remaster.drawWaterSurface = drawWaterSurface;
})();