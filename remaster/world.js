/* Seam-free, vector-colour remake of existing RLEF terrain and rock piles.
 * No changes to the underlying meshes, depth flags or collision system.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  function rgb(n){return[(n>>>16)&255,(n>>>8)&255,n&255];}
  function classify(n){
    const [r,g,b]=rgb(n),bright=(r+g+b)/3;
    const range=Math.max(r,g,b)-Math.min(r,g,b);
    if(range<38&&bright>42){
      if(bright<84)return ['#536771','#455B65'];
      if(bright<132)return ['#8598A2','#728994'];
      return ['#BCC8CD','#9AAEB5'];
    }
    if(g>r*1.05&&g>b*.96){
      // Retain dark-green trunks / underground zones. The previous remap
      // painted EVERY green face light sage, flattening full-height walls.
      if(bright<70)return ['#285D40','#214C37'];
      if(bright<110)return ['#437955','#366747'];
      if(bright<156)return ['#68A173','#559266'];
      return ['#8BC58A','#75B87C'];
    }
    if(r>g*1.07&&r>b*1.22){
      if(bright<82)return ['#79573E','#68472E'];
      if(bright<135)return ['#AC7D57','#926A49'];
      return ['#D0AA7F','#B38B62'];
    }
    // Mechanism colours, danger, etc. remain source palette colours.
    const asHex='#'+(n>>>0).toString(16).padStart(6,'0').slice(-6);
    return [asHex,asHex];
  }
  function meshPath(ctx,verts,faces,screenPoint){
    let valid=0;
    ctx.beginPath();
    for(let i=0;i+2<faces.length;i+=3){
      const a=verts[faces[i]],b=verts[faces[i+1]],c=verts[faces[i+2]];
      if(!a||!b||!c)continue;
      const s=[screenPoint(a),screenPoint(b),screenPoint(c)];
      if(s.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))continue;
      // A common fill across the whole mesh avoids per-triangle seams.
      ctx.moveTo(s[0].x,s[0].y);
      ctx.lineTo(s[1].x,s[1].y);ctx.lineTo(s[2].x,s[2].y);
      ctx.closePath();valid++;
    }
    return valid>0;
  }
  function drawRemadeTerrain(ctx,poly,screenPoint){
    if(art.quality==='classic'||!poly?.vertices||!poly?.faces)return false;
    if(!meshPath(ctx,poly.vertices,poly.faces,screenPoint))return false;
    const [flat,shade]=classify(poly.color>>>0);
    ctx.save();
    ctx.fillStyle=flat;
    ctx.fill();
    if(flat!==shade){
      // This gradient is anchored to the CAMERA, not to every tile or
      // polygon bounding box, so adjacent pieces share identical lighting.
      ctx.clip();
      const gradient=ctx.createLinearGradient(0,0,0,320);
      gradient.addColorStop(0,'rgba(255,252,222,.065)');
      gradient.addColorStop(.66,'rgba(255,255,255,0)');
      gradient.addColorStop(1,'rgba(19,42,53,.105)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,240,320);
      // Large green vertical meshes are authored tree trunks / shafts.
      // Add three broad flat bark bands instead of a featureless rectangle.
      // Everything is clipped to the ORIGINAL mesh path; no collider changes.
      const [red,green,blue]=rgb(poly.color>>>0);
      if(green>red*1.15&&green>blue*1.08){
        const projected=poly.vertices.map(screenPoint).filter(p=>
          Number.isFinite(p.x)&&Number.isFinite(p.y));
        if(projected.length){
          const xs=projected.map(p=>p.x),ys=projected.map(p=>p.y);
          const x0=Math.min(...xs),x1=Math.max(...xs);
          const y0=Math.min(...ys),y1=Math.max(...ys);
          const pw=x1-x0,ph=y1-y0;
          if(pw>15&&ph>125&&ph>pw*2.4){
            for(const fraction of [.20,.49,.77]){
              const sx=x0+pw*fraction;
              ctx.beginPath();ctx.moveTo(sx,y0);
              ctx.bezierCurveTo(sx-pw*.08,y0+ph*.32,
                sx+pw*.08,y0+ph*.68,sx,y1);
              ctx.strokeStyle=fraction===.49?
                'rgba(194,229,167,.16)':'rgba(19,63,45,.16)';
              ctx.lineWidth=Math.min(9,Math.max(2.5,pw*.11));
              ctx.stroke();
            }
          }
        }
      }
    }
    ctx.restore();
    return true;
  }
  function stone(ctx,x,y,w,h,tint){
    ctx.save();ctx.translate(x,y);
    ctx.beginPath();
    ctx.moveTo(-w*.52,h*.06);ctx.lineTo(-w*.46,-h*.33);
    ctx.lineTo(-w*.19,-h*.56);ctx.lineTo(w*.28,-h*.48);
    ctx.lineTo(w*.51,-h*.16);ctx.lineTo(w*.53,h*.24);
    ctx.lineTo(w*.25,h*.50);ctx.lineTo(-w*.27,h*.49);
    ctx.closePath();ctx.fillStyle=tint;ctx.fill();
    ctx.lineWidth=1;ctx.strokeStyle='#526874';ctx.stroke();
    ctx.fillStyle='rgba(234,244,243,.27)';
    ctx.beginPath();ctx.moveTo(-w*.41,-h*.29);
    ctx.lineTo(-w*.16,-h*.49);ctx.lineTo(w*.20,-h*.39);
    ctx.lineTo(w*.05,-h*.11);ctx.lineTo(-w*.31,-h*.08);
    ctx.closePath();ctx.fill();
    ctx.restore();
  }
  function drawRemadeProp(ctx,id,x,y){
    if(art.quality==='classic'||!ctx||!Number.isFinite(x)||!Number.isFinite(y)||
       (id!==357&&id!==358))return false;
    // Original compound rock formations are approximately 130x85 with
    // origin (81,85). Draw as one cohesive mound, not 13 pasted tile crops.
    ctx.save();ctx.translate(x-81,y-85);
    const variations=id===357
      ?['#91A4AF','#798F9D','#A7B5B9','#7D99A2','#8E9EA9']
      :['#A2B0B9','#85959F','#98A6B0','#7C909F','#899DA8'];
    stone(ctx,20,62,45,47,variations[1]);
    stone(ctx,58,44,48,55,variations[0]);
    stone(ctx,102,61,50,48,variations[2]);
    stone(ctx,36,76,54,35,variations[3]);
    stone(ctx,83,77,69,39,variations[4]);
    stone(ctx,119,79,26,26,variations[1]);
    ctx.restore();
    return true;
  }
  art.drawRemadeTerrain=drawRemadeTerrain;
  art.drawRemadeProp=drawRemadeProp;
})();
