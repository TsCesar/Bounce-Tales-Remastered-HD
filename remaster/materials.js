/* Bounce Tales Remaster — restrained terrain restoration.
 * The original filled triangle mesh supplies the true base colours. We only
 * overlay subtle directional light and avoid screen-space noise/TV static.
 */
(function () {
  'use strict';
  const remaster = window.BounceRemaster;
  if (!remaster) return;
  const W=240, H=320;
  function drawTerrain(ctx,poly,screenPoint) {
    if(remaster.quality === 'classic'||!poly?.vertices||!poly?.faces)return;
    const points=[];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(let i=0;i+2<poly.faces.length;i+=3){
      const a=screenPoint(poly.vertices[poly.faces[i]]);
      const b=screenPoint(poly.vertices[poly.faces[i+1]]);
      const c=screenPoint(poly.vertices[poly.faces[i+2]]);
      if(!a||!b||!c)continue;
      points.push([a,b,c]);
      for(const p of [a,b,c]){
        minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
        maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
      }
    }
    if(!points.length||maxX<0||minX>W||maxY<0||minY>H)return;
    const color=poly.color>>>0, red=(color>>>16)&255,green=(color>>>8)&255,blue=color&255;
    const vegetation=green>red*.98&&green>blue*.98;
    ctx.save();
    ctx.beginPath();
    for(const [a,b,c] of points){
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
    }
    ctx.clip();
    // Low-contrast lighting, not a replacement for the game's art palette.
    const gradient=ctx.createLinearGradient(minX,minY,minX,maxY);
    gradient.addColorStop(0,'rgba(255,246,204,.12)');
    gradient.addColorStop(.22,'rgba(255,246,204,.035)');
    gradient.addColorStop(.72,'rgba(6,24,29,.02)');
    gradient.addColorStop(1,'rgba(3,12,21,.14)');
    ctx.fillStyle=gradient;
    ctx.fillRect(minX,minY,Math.max(1,maxX-minX),Math.max(1,maxY-minY));
    ctx.restore();
    // One narrow highlight along shallow existing polygon edges. Avoid seam
    // painting across interior triangulation edges and limit the effect.
    if(remaster.quality==='ultra'&&vegetation){
      let remaining=16;
      ctx.save();
      ctx.lineWidth=.32;
      ctx.strokeStyle='rgba(206,249,178,.22)';
      for(const tri of points){
        if(remaining<=0)break;
        for(let i=0;i<3;i++){
          if(remaining<=0)break;
          const a=tri[i], b=tri[(i+1)%3];
          const dx=b.x-a.x,dy=b.y-a.y;
          if(Math.abs(dx)<8||Math.abs(dy)>Math.abs(dx)*.12)continue;
          if((a.y<0&&b.y<0)||(a.y>H&&b.y>H))continue;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          remaining--;
        }
      }
      ctx.restore();
    }
  }
  remaster.drawTerrain = drawTerrain;
})();
