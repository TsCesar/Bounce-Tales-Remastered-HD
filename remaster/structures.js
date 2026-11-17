/* Bounce Tales V19: source-identified structural tiles and wooden signs.
 * Visual-only. Existing RLEF collision meshes, transforms, flags and events
 * remain authoritative; Classic always falls back to original J2ME pixels.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const STRUCTURES=new Set([130,131,132,176,177,178]);
  const SIGNS=new Set([152,153,154,243,244,245,246,247,248,249,250]);
  const TAU=Math.PI*2;
  function valid(id,x,y,m){
    return art.quality!=='classic'&&Number.isFinite(x)&&Number.isFinite(y)&&
      m?.type==='simple'&&Number.isFinite(m.width)&&m.width>0&&
      Number.isFinite(m.height)&&m.height>0&&
      Number.isFinite(m.originX)&&Number.isFinite(m.originY);
  }
  function rounded(ctx,x,y,w,h,r){
    const a=Math.min(r,w*.5,h*.5);
    ctx.beginPath();ctx.moveTo(x+a,y);ctx.lineTo(x+w-a,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+a);
    ctx.lineTo(x+w,y+h-a);ctx.quadraticCurveTo(x+w,y+h,x+w-a,y+h);
    ctx.lineTo(x+a,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-a);
    ctx.lineTo(x,y+a);ctx.quadraticCurveTo(x,y,x+a,y);ctx.closePath();
  }
  function structure(ctx,id,w,h){
    // Keep colour constant for each region. Per-sprite radial highlights,
    // individual gradients and dark outlines caused the 'pasted blocks'.
    const cave=id<=132;
    const base=cave?'#245E62':'#103B3E';
    ctx.fillStyle=base;
    // One physical pixel of overlap in the original 240x320 coordinate
    // system closes sampling cracks between adjacent source tiles.
    ctx.fillRect(-.28,-.28,w+.56,h+.56);
    if(cave){
      ctx.fillStyle='#2D6E71';
      ctx.fillRect(0,0,w,Math.min(1.3,h*.09));
      if(id===131&&art.quality==='remastered'){
        // A very quiet brush-drawn swirl, not the square pixel spiral.
        ctx.save();ctx.beginPath();ctx.rect(.3,.2,w-.6,h-.4);ctx.clip();
        ctx.strokeStyle='rgba(137,206,174,.16)';ctx.lineWidth=.75;
        ctx.beginPath();
        const mx=w*.51,my=h*.51;
        for(let k=0;k<19;k++){
          const t=k/18*Math.PI*2.6,rad=Math.max(.55,5.8-k*.25);
          const px=mx+Math.cos(t)*rad,py=my+Math.sin(t)*rad*.85;
          if(!k)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.stroke();ctx.restore();
      }
    }else{
      // The source trunks are 7–15px strips stacked vertically.
      // No horizontal caps: adjacent strips continue seamlessly.
      ctx.fillStyle='#174B4E';
      ctx.fillRect(w*.12,0,Math.max(.7,w*.18),h);
      ctx.fillStyle='rgba(116,169,153,.15)';
      ctx.fillRect(w*.80,0,Math.max(.5,w*.08),h);
    }
  }
  function drawRemadeStructure(ctx,id,x,y,m){
    if(!STRUCTURES.has(id)||!ctx||!valid(id,x,y,m))return false;
    ctx.save();ctx.translate(x-m.originX,y-m.originY);
    structure(ctx,id,m.width,m.height);
    ctx.restore();return true;
  }
  function woodSign(ctx,w,h){
    const boardHeight=Math.min(h*.75,45);
    const centre=w*.5;
    ctx.fillStyle='#836347';ctx.strokeStyle='#52392F';ctx.lineWidth=1.2;
    rounded(ctx,centre-3,boardHeight-2,6,Math.max(2,h-boardHeight),2);
    ctx.fill();ctx.stroke();
    ctx.fillStyle='#CB9166';ctx.strokeStyle='#80503B';ctx.lineWidth=1.3;
    rounded(ctx,1,1,w-2,boardHeight-1,3);ctx.fill();ctx.stroke();
    const highlight=ctx.createLinearGradient(0,1,0,boardHeight);
    highlight.addColorStop(0,'rgba(255,231,179,.29)');
    highlight.addColorStop(1,'rgba(75,40,31,.11)');
    ctx.fillStyle=highlight;
    rounded(ctx,2,2,w-4,boardHeight-3,2);ctx.fill();
    ctx.strokeStyle='rgba(119,68,49,.32)';ctx.lineWidth=.9;
    for(const col of [.32,.66]){
      ctx.beginPath();ctx.moveTo(w*col,4);ctx.lineTo(w*col-.6,boardHeight-4);ctx.stroke();
    }
    for(const side of [7,w-7]){
      ctx.beginPath();ctx.arc(side,7,1.2,0,TAU);ctx.fillStyle='#754934';ctx.fill();
      ctx.beginPath();ctx.arc(side,boardHeight-7,1.2,0,TAU);ctx.fill();
    }
  }
  const directions=new Map([
    [153,0],[244,Math.PI/2],[245,Math.PI],[246,0],
    [247,-Math.PI/2],[248,-3*Math.PI/4],[249,-Math.PI/4]
  ]);
  function arrow(ctx,w,h,angle){
    ctx.save();ctx.translate(w/2,h/2);ctx.rotate(angle);
    const bound=(Math.abs(Math.sin(angle))>0.25&&Math.abs(Math.cos(angle))>0.25)?.73:.91;
    ctx.scale(w*bound,h*bound);
    ctx.beginPath();ctx.moveTo(-.48,-.16);
    ctx.lineTo(.01,-.16);ctx.lineTo(.01,-.37);
    ctx.lineTo(.49,0);ctx.lineTo(.01,.37);
    ctx.lineTo(.01,.16);ctx.lineTo(-.48,.16);ctx.closePath();
    ctx.fillStyle='#FFC92C';ctx.fill();
    ctx.strokeStyle='#AC713F';ctx.lineWidth=.085;ctx.lineJoin='round';ctx.stroke();
    ctx.strokeStyle='rgba(255,245,164,.74)';ctx.lineWidth=.034;
    ctx.beginPath();ctx.moveTo(-.39,-.085);ctx.lineTo(.085,-.085);
    ctx.lineTo(.085,-.26);ctx.lineTo(.35,0);ctx.stroke();
    ctx.restore();
  }
  function warning(ctx,w,h){
    ctx.save();ctx.translate(w/2,h/2);ctx.scale(w*.92,h*.92);
    ctx.beginPath();ctx.moveTo(0,-.46);ctx.lineTo(.48,.44);
    ctx.lineTo(-.48,.44);ctx.closePath();
    ctx.fillStyle='#FFD64B';ctx.fill();
    ctx.lineWidth=.09;ctx.strokeStyle='#E2512E';ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-.14);ctx.lineTo(0,.15);
    ctx.strokeStyle='#28536A';ctx.lineWidth=.10;ctx.stroke();
    ctx.beginPath();ctx.arc(0,.30,.045,0,TAU);ctx.fillStyle='#28536A';ctx.fill();
    ctx.restore();
  }
  function drawRemadeSign(ctx,id,x,y,m){
    if(!SIGNS.has(id)||!ctx||!valid(id,x,y,m))return false;
    ctx.save();ctx.translate(x-m.originX,y-m.originY);
    if(id===152||id===243)woodSign(ctx,m.width,m.height);
    else if(id===154||id===250)warning(ctx,m.width,m.height);
    else arrow(ctx,m.width,m.height,directions.get(id));
    ctx.restore();
    return true;
  }
  art.drawRemadeStructure=drawRemadeStructure;
  art.drawRemadeSign=drawRemadeSign;
  art.structuralIds=Object.freeze([...STRUCTURES].sort((a,b)=>a-b));
  art.signIds=Object.freeze([...SIGNS].sort((a,b)=>a-b));
})();
