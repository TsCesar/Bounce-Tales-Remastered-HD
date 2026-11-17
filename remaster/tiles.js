/* Seam-free retro ground tiles redrawn from original sprite outlines.
 * No pixel upscaling. Profiles are simplified silhouette control points from
 * original artwork; HD/Ultra draw antialiased paths with fresh materials.
 * The original image IDs, sprite anchors, layer order, collision and scripts
 * are NOT altered. Classic delegates to original PNG crops.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const OUTLINES={
253:[[0,2,12],[3,3,14],[6,2,15],[9,2,15],[12,0,12],[15,3,12],[17,3,12]],
254:[[0,3,14],[3,3,17],[6,3,15],[9,3,15],[12,3,15],[15,0,17],[18,4,14],[21,4,15],[24,3,16],[27,3,18],[30,4,20],[33,3,20],[36,3,19],[39,3,17],[42,2,17],[45,4,15]],
255:[[0,2,13],[3,1,13],[6,2,13],[9,2,13],[12,1,13],[15,2,17],[18,2,14],[21,2,17],[24,2,18],[27,1,17],[30,1,19],[33,2,21],[36,2,21],[39,2,20],[42,2,17],[45,2,13]],
256:[[0,1,10],[3,1,10]],
257:[[0,3,14],[3,3,16],[6,2,16],[9,2,15],[12,0,14],[15,0,12],[17,1,10]],
258:[[0,4,15],[3,3,17],[6,4,16],[9,1,14],[11,2,12]],
259:[[0,2,12],[3,1,11],[6,0,10],[7,1,9]],
260:[[0,2,10],[3,2,12],[6,3,13],[7,4,13]],
261:[[0,1,10],[3,1,13],[6,1,15],[9,1,14],[11,3,13]],
262:[[0,2,10],[3,1,13],[6,2,14],[9,2,15],[12,1,16],[15,2,15],[17,2,14]],
263:[[0,2,10],[3,0,11],[6,1,12],[9,1,13],[12,2,14],[15,2,15],[18,2,16],[21,0,16],[24,2,15],[26,4,14]],
264:[[0,2,14],[3,3,16],[6,3,16],[9,3,16],[12,2,15],[15,2,13],[18,0,13],[21,1,12],[24,1,10],[26,2,10]],
265:[[0,1,6],[3,0,8]],
266:[[0,1,9],[3,2,7]],
162:[[0,1,11],[3,2,12],[6,0,14],[9,1,14],[12,2,13],[15,1,11],[17,0,11]],
163:[[0,3,11],[3,2,11],[6,2,12],[9,1,13],[12,2,12],[15,2,11],[18,2,11],[21,1,12],[24,3,13],[27,1,14],[30,2,15],[33,1,15],[36,2,12],[39,2,11],[42,2,11],[45,0,11]],
164:[[0,0,11],[3,1,14],[6,2,16],[9,2,16],[12,1,16],[15,0,14],[18,1,12],[21,1,12],[24,3,13],[27,2,14],[30,2,15],[33,3,15],[36,1,13],[39,1,12],[42,2,11],[45,2,11]],
165:[[0,1,10],[3,1,10]],
166:[[0,3,12],[3,2,13],[6,1,14],[9,1,12],[12,1,11],[15,1,10],[17,0,10]],
167:[[0,4,13],[3,3,14],[6,1,13],[9,0,11],[11,1,10]],
168:[[0,4,13],[3,2,12],[6,1,10],[7,1,10]],
169:[[0,1,10],[3,2,11],[6,2,13],[7,4,13]],
170:[[0,1,10],[3,1,12],[6,3,14],[9,4,14],[11,4,13]],
171:[[0,0,10],[3,0,11],[6,2,11],[9,2,13],[12,2,14],[15,3,13],[17,3,12]],
172:[[0,2,11],[3,0,13],[6,2,14],[9,1,14],[12,2,13],[15,1,12],[18,2,14],[21,2,15],[24,4,13],[26,3,13]],
173:[[0,3,13],[3,3,13],[6,4,15],[9,3,13],[12,2,12],[15,3,13],[18,2,14],[21,1,14],[24,1,12],[26,2,11]],
174:[[0,1,7],[3,0,9]],
175:[[0,0,9],[3,1,7]]
  };
  const THEMES={
    forest:{bright:'#A4E96D',surface:'#71CD4F',body:'#55A85D',shadow:'#2A774D'},
    lagoon:{bright:'#F2EC78',surface:'#D3DD56',body:'#68A961',shadow:'#387C62'},
    cave:{bright:'#FFF2DC',surface:'#EEAB98',body:'#BE6D75',shadow:'#354C61'}
  };
  const owned=id=>id>=253&&id<=266?'forest':id>=162&&id<=175?'lagoon':
    id>=120&&id<=126?'cave':null;
  function smoothContour(ctx,points,key,reverse=false,shift=0){
    const ordered=reverse?points.slice().reverse():points;
    const first=ordered[0];
    ctx.moveTo(first[0],first[key]+shift);
    for(let i=1;i<ordered.length;i++){
      const prev=ordered[i-1],at=ordered[i];
      const middle=(prev[0]+at[0])/2;
      const middleY=(prev[key]+at[key])/2+shift;
      ctx.quadraticCurveTo(prev[0],prev[key]+shift,middle,middleY);
    }
    const last=ordered[ordered.length-1];
    ctx.lineTo(last[0]+(reverse?-1:1),last[key]+shift);
  }
  function mask(ctx,p){
    ctx.beginPath();
    smoothContour(ctx,p,1);
    const last=p[p.length-1],first=p[0];
    ctx.lineTo(last[0]+1,last[2]);
    for(let i=p.length-2;i>=0;i--){
      const a=p[i],b=p[i+1];
      ctx.quadraticCurveTo(b[0],b[2],(a[0]+b[0])/2,(a[2]+b[2])/2);
    }
    ctx.lineTo(first[0],first[2]);ctx.closePath();
  }
  function upperSurface(ctx,p,depth){
    ctx.beginPath();
    smoothContour(ctx,p,1);
    const last=p[p.length-1],first=p[0];
    ctx.lineTo(last[0]+1,Math.min(last[2],last[1]+depth));
    for(let i=p.length-2;i>=0;i--){
      const a=p[i],b=p[i+1];
      const yA=Math.min(a[2],a[1]+depth),yB=Math.min(b[2],b[1]+depth);
      ctx.quadraticCurveTo(b[0],yB,(a[0]+b[0])/2,(yA+yB)/2);
    }
    ctx.lineTo(first[0],Math.min(first[2],first[1]+depth));ctx.closePath();
  }
  function drawRemadeGroundTile(ctx,id,x,y,map){
    const themeName=owned(id);
    if(art.quality==='classic'||!ctx||!themeName||!map||
       !Number.isFinite(x)||!Number.isFinite(y)||
       !Number.isFinite(map.width)||!Number.isFinite(map.height)||
       !Number.isFinite(map.originX)||!Number.isFinite(map.originY))return false;
    const theme=THEMES[themeName];
    ctx.save();
    ctx.translate(x-map.originX,y-map.originY);
    if(themeName==='cave'){
      // The third region uses baked red-gold strips and tiny end caps,
      // not grassy silhouettes. Rebuild its 7 known source parts.
      const w=map.width,h=map.height;
      const gradient=ctx.createLinearGradient(0,0,0,h);
      gradient.addColorStop(0,theme.bright);
      gradient.addColorStop(.29,theme.surface);
      gradient.addColorStop(.76,theme.body);
      gradient.addColorStop(1,theme.shadow);
      ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
      ctx.fillStyle='rgba(255,251,224,.35)';ctx.fillRect(0,0,w,Math.min(1.8,h));
      ctx.restore();return true;
    }
    const p=OUTLINES[id];
    if(!p){ctx.restore();return false;}
    const surfaceDepth=themeName==='forest'?4.8:4.0;
    mask(ctx,p);
    ctx.fillStyle=theme.shadow;ctx.fill();
    ctx.save();mask(ctx,p);ctx.clip();
    const h=map.height;
    const g=ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0,theme.body);
    g.addColorStop(.28,theme.body);
    g.addColorStop(.67,theme.body);
    g.addColorStop(1,theme.shadow);
    ctx.fillStyle=g;ctx.fillRect(0,0,map.width+1,h+1);
    ctx.restore();
    upperSurface(ctx,p,surfaceDepth);
    ctx.fillStyle=theme.surface;ctx.fill();
    // A narrow top line gives grass continuity without pixel-sized spikes.
    ctx.beginPath();smoothContour(ctx,p,1);
    ctx.strokeStyle=theme.bright;ctx.lineWidth=.85;ctx.stroke();
    ctx.restore();
    return true;
  }
  art.drawRemadeGroundTile=drawRemadeGroundTile;
  art.groundTileIds=Object.freeze(Object.keys(OUTLINES).map(Number).concat([120,121,122,123,124,125,126]));
})();
