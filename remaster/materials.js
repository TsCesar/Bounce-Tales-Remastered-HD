/* Canvas2D material library for original RLEF terrain meshes.
 * Textures are generated once per colour and clipped to unchanged triangles.
 * No changes to collision polygons or game coordinates.
 */
(function () {
  'use strict';
  const remaster = window.BounceRemaster;
  if (!remaster) return;
  const TILE = 256;
  const patterns = new Map();

  function hash(x,y,seed){
    let n=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,1442695041))|0;
    n=Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967295;
  }
  function mix(a,b,t){return a+(b-a)*t;}
  function fractal(x,y,seed,block) {
    const px=x/block, py=y/block, ix=Math.floor(px),iy=Math.floor(py);
    const u=(px-ix);const v=(py-iy);
    const fx=u*u*(3-2*u),fy=v*v*(3-2*v);
    const a=hash(ix,iy,seed),b=hash(ix+1,iy,seed);
    const c=hash(ix,iy+1,seed),d=hash(ix+1,iy+1,seed);
    return mix(mix(a,b,fx),mix(c,d,fx),fy)*2-1;
  }
  function classify(rgb) {
    const [r,g,b]=rgb;
    if(b>r*1.2 && b>g*.96) return 'crystal';
    if(r>g*1.3 && r>b*1.23) return 'earth';
    if(g>r*.96 && g>b*.98) return 'moss';
    if(Math.max(r,g,b)-Math.min(r,g,b)<24) return 'stone';
    return 'mineral';
  }
  function materialPattern(ctx,color) {
    const key = color>>>0;
    if (patterns.has(key)) return patterns.get(key);
    const rgb=[(key>>>16)&255,(key>>>8)&255,key&255];
    const kind=classify(rgb);
    const tile=document.createElement('canvas');
    tile.width=TILE;tile.height=TILE;
    const tctx=tile.getContext('2d',{willReadFrequently:false});
    if(!tctx)return null;
    const pix=tctx.createImageData(TILE,TILE);
    const arr=pix.data;
    for(let y=0;y<TILE;y++){
      for(let x=0;x<TILE;x++){
        const grain=fractal(x,y,key,6)*.60 + fractal(x,y,key+43,22)*.25 +
                    fractal(x,y,key+67,48)*.15;
        const fleck=hash(x,y,key+109);
        const vein=Math.sin(y*.105+fractal(x,y,key+7,35)*3.4)*.5+
                    Math.sin(x*.037+y*.016)*.5;
        let bump=grain*23;
        if(kind==='earth')bump += vein*10+(fleck>.985?18:0);
        else if(kind==='moss') bump+=grain*10+(fleck>.976?24:0);
        else if(kind==='stone') bump+=vein*16+(fleck>.993?24:0);
        else if(kind==='crystal') bump+=vein*18+(fleck>.993?34:0);
        else bump+=vein*9;
        const idx=(y*TILE+x)*4;
        const light=1+bump/255;
        arr[idx]=Math.max(0,Math.min(255,rgb[0]*light+bump*.38));
        arr[idx+1]=Math.max(0,Math.min(255,rgb[1]*light+bump*.42));
        arr[idx+2]=Math.max(0,Math.min(255,rgb[2]*light+bump*.44));
        arr[idx+3]=255;
      }
    }
    tctx.putImageData(pix,0,0);
    const pattern=ctx.createPattern(tile,'repeat');
    if(pattern && pattern.setTransform && typeof DOMMatrix!=='undefined') {
      pattern.setTransform(new DOMMatrix([.25,0,0,.25,0,0]));
    }
    if(patterns.size>=60)patterns.clear();
    patterns.set(key,pattern);
    return pattern;
  }
  function drawTerrain(ctx,poly,screenPoint) {
    if(remaster.quality==='classic'||!poly||!poly.faces||!poly.vertices)return;
    const vertices=poly.vertices,faces=poly.faces;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    const all=[];
    for(let i=0;i+2<faces.length;i+=3){
      const a=screenPoint(vertices[faces[i]]);
      const b=screenPoint(vertices[faces[i+1]]);
      const c=screenPoint(vertices[faces[i+2]]);
      if(!a||!b||!c)continue;
      all.push([a,b,c]);
      for(const p of [a,b,c]){
        minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
        maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
      }
    }
    if(!all.length||maxX<0||minX>240||maxY<0||minY>320)return;
    ctx.save();
    ctx.beginPath();
    for(const [a,b,c] of all){
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
    }
    ctx.clip();
    const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
    const pattern=materialPattern(ctx,poly.color);
    if(pattern){
      ctx.fillStyle=pattern;
      ctx.fillRect(minX,minY,width,height);
    }
    // Diffuse directional light and subdued contact shadow under original top edge.
    const light=ctx.createLinearGradient(minX,minY,minX+width*.1,maxY);
    light.addColorStop(0,'rgba(255,250,213,.27)');
    light.addColorStop(.17,'rgba(255,244,183,.095)');
    light.addColorStop(.70,'rgba(0,13,18,.055)');
    light.addColorStop(1,'rgba(0,6,12,.37)');
    ctx.fillStyle=light;ctx.fillRect(minX,minY,width,height);
    ctx.restore();
    if(remaster.quality!=='ultra')return;
    // Surface highlights follow the original triangle edges; never alter their
    // positions and avoid painting outside the camera.
    const c=poly.color>>>0,r=(c>>>16)&255,g=(c>>>8)&255,b=c&255;
    const grass=g>r*.98&&g>b*.98;
    let budget=35;
    ctx.save();
    for(const tri of all){
      for(let i=0;i<3;i++){
        if(--budget<0)break;
        const a=tri[i],b=tri[(i+1)%3];
        if(a.x<-.5&&b.x<-.5||a.x>240.5&&b.x>240.5||a.y>320&&b.y>320)continue;
        if(Math.abs(b.y-a.y) > Math.abs(b.x-a.x)*.19)continue;
        ctx.strokeStyle=grass?'rgba(187,245,132,.63)':'rgba(243,232,199,.25)';
        ctx.lineWidth=grass?.42:.3;
        ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        if(grass && Math.abs(b.x-a.x)>8) {
          const num=Math.min(14,Math.floor(Math.abs(b.x-a.x)/5));
          ctx.lineWidth=.31;
          ctx.strokeStyle='rgba(179,227,127,.45)';
          for(let j=1;j<num;j++){
            const t=j/num,px=mix(a.x,b.x,t),py=mix(a.y,b.y,t);
            ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+((j%3)-1)*.35,py-.9-j%2*.45);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }
  remaster.drawTerrain = drawTerrain;
})();