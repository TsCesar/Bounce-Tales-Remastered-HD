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
      return bright<100?['#718490','#617584']:['#9DADB5','#81959F'];
    }
    if(g>r*1.05&&g>b*.96){
      return bright<104?['#5B9A66','#448253']:['#79B979','#5A9B68'];
    }
    if(r>g*1.07&&r>b*1.22){
      return bright<104?['#A07958','#866044']:['#CB9F74','#A57E5D'];
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
