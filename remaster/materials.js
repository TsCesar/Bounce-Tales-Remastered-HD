/* Bounce Tales cartoon terrain: soft two-tone cel shading, no procedural
 * noise, no fake rock realism, no photo textures. Collider meshes unchanged.
 */
(function(){
  'use strict';
  const remaster=window.BounceRemaster;
  if(!remaster)return;
  const W=240,H=320;
  function drawTerrain(ctx,poly,screenPoint){
    if(remaster.quality==='classic'||!poly?.faces||!poly?.vertices)return;
    const verts=poly.vertices,faces=poly.faces;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    const triangles=[];
    for(let i=0;i+2<faces.length;i+=3){
      const a=verts[faces[i]],b=verts[faces[i+1]],c=verts[faces[i+2]];
      if(!a||!b||!c)continue;
      const one=screenPoint(a),two=screenPoint(b),three=screenPoint(c);
      if(![one,two,three].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))continue;
      triangles.push([one,two,three]);
      for(const p of [one,two,three]){
        minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);
        maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);
      }
    }
    if(!triangles.length||maxX<0||minX>W||maxY<0||minY>H)return;
    const color=poly.color>>>0,r=(color>>>16)&255,g=(color>>>8)&255,b=color&255;
    const grass=g>r*1.03&&g>b*.96;
    const earthy=r>b*1.26&&r>g*.97;
    const stone=Math.max(r,g,b)-Math.min(r,g,b)<34;
    const top=grass?'rgba(229,255,178,.22)':
      earthy?'rgba(255,232,178,.14)':stone?'rgba(248,249,244,.14)':
      'rgba(243,240,255,.12)';
    const bottom=grass?'rgba(31,107,53,.11)':
      earthy?'rgba(107,61,32,.11)':stone?'rgba(53,63,84,.12)':
      'rgba(43,54,92,.09)';

    ctx.save();ctx.beginPath();
    for(const [a,b,c] of triangles){
      ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
    }
    ctx.clip();
    const y0=Math.max(-24,minY),y1=Math.min(H+24,Math.max(y0+1,maxY));
    const x0=Math.max(-24,minX),x1=Math.min(W+24,Math.max(x0+1,maxX));
    const height=Math.max(1,y1-y0),width=Math.max(1,x1-x0);
    // Large, smooth cel-shaded bands only: original colour remains visible.
    const shade=ctx.createLinearGradient(x0,y0,x0,y1);
    shade.addColorStop(0,top);
    shade.addColorStop(.31,'rgba(255,255,255,.035)');
    shade.addColorStop(1,bottom);
    ctx.fillStyle=shade;
    ctx.fillRect(x0,y0,width,height);

    if(remaster.quality==='remastered'&&width>34&&height>17){
      // Two broad facets per visible region. Stable relative to the object's
      // own bounds and never a repeated pixel/noise pattern.
      ctx.fillStyle=grass?'rgba(225,255,171,.085)':
        earthy?'rgba(255,226,167,.075)':
        stone?'rgba(247,249,255,.075)':'rgba(221,226,255,.06)';
      for(let i=0;i<2;i++){
        const x=x0+width*(i*.46+.12),y=y0+height*(.29+i*.31);
        ctx.beginPath();
        ctx.moveTo(x,y);ctx.lineTo(x+width*.26,y-height*.11);
        ctx.lineTo(x+width*.41,y+height*.05);
        ctx.lineTo(x+width*.07,y+height*.13);
        ctx.closePath();ctx.fill();
      }
    }
    ctx.restore();
  }
  remaster.drawTerrain = drawTerrain;
})();
