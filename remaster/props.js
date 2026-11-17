/* Remade interactive props and enemies — canvas-vector retro cartoon art.
 * Called only in HD/Ultra. Original Classic sprite renderer, object positions,
 * animation and all game mechanics remain unchanged.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const TAU=Math.PI*2;
  function ellipse(c,x,y,rx,ry,fill,stroke,width=1){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function rounded(c,x,y,w,h,r,fill,stroke,lw=1){
    if(!(w>0&&h>0))return;
    const radius=Math.min(r,w/2,h/2);
    c.beginPath();c.moveTo(x+radius,y);c.lineTo(x+w-radius,y);
    c.quadraticCurveTo(x+w,y,x+w,y+radius);
    c.lineTo(x+w,y+h-radius);c.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
    c.lineTo(x+radius,y+h);c.quadraticCurveTo(x,y+h,x,y+h-radius);
    c.lineTo(x,y+radius);c.quadraticCurveTo(x,y,x+radius,y);c.closePath();
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke();}
  }
  function line(c,points,stroke,width){
    if(points.length<2)return;
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.strokeStyle=stroke;c.lineWidth=width;c.stroke();
  }
  function eyes(c,x,y,spacing=7,scale=1,angry=false){
    for(const sign of [-1,1]){
      const ex=x+sign*spacing;
      ellipse(c,ex,y,3.2*scale,4.4*scale,'#FFF8EA','#294252',.85);
      ellipse(c,ex+sign*.65*scale,y+.9*scale,1.35*scale,2.35*scale,'#13252C');
      if(angry){
        line(c,[[ex-sign*2.7*scale,y-5.7*scale],
          [ex+sign*2.5*scale,y-3.3*scale]],'#35434A',1.5);
      }
    }
  }
  const springPalettes={
    497:{base:'#7B925D',trim:'#D9EBA9',board:'#B5D071',rim:'#486A55',coil:'#477D85'},
    509:{base:'#636E96',trim:'#BBC9ED',board:'#94A4D3',rim:'#49557E',coil:'#6987B8'},
    490:{base:'#A67D67',trim:'#FFE4B2',board:'#E2B780',rim:'#8C5956',coil:'#BB7459'}
  };
  function drawRemadeTrampoline(ctx,prop){
    if(art.quality==='classic'||!prop||!ctx||!springPalettes[prop.imageId]||
       !Number.isFinite(prop.x)||!Number.isFinite(prop.y))return false;
    const color=springPalettes[prop.imageId],raw=Number(prop.frame)||0;
    const frame=Math.max(0,Math.min(5,Math.trunc(raw)));
    // The source animated frames are squeezed symmetrically; keep contact
    // height dependent on the SAME game frame without adjusting colliders.
    const depression=prop.active?[0,10,16,10,0,-4][frame]:0;
    const x=prop.x,y=prop.y;
    ctx.save();ctx.translate(x,y);
    ellipse(ctx,0,-1,49,4,'rgba(27,56,63,.20)');
    rounded(ctx,-50,-11,100,11,4,color.base,color.rim,1.2);
    rounded(ctx,-44,-8,88,3,1,color.trim);
    for(const anchor of [-35,-18,0,18,35]){
      const bottom=-13,top=-43+depression;
      const steps=4,zig=[];
      for(let i=0;i<=steps;i++){
        zig.push([anchor+(i%2===0?-5:5),bottom+(top-bottom)*i/steps]);
      }
      line(ctx,zig,color.coil,2.4);
      ellipse(ctx,anchor,-14,2.6,2.6,color.trim);
    }
    const top=-48+depression;
    rounded(ctx,-55,top,110,12,4,color.rim,color.rim,1.3);
    rounded(ctx,-52,top+1,104,7,3,color.board,color.trim,1);
    line(ctx,[[-47,top+4],[47,top+4]],'rgba(255,255,232,.35)',1.3);
    ctx.restore();
    return true;
  }
  function drawRemadeCannon(ctx,prop){
    if(art.quality==='classic'||!prop||!ctx||!Number.isFinite(prop.x)||
      !Number.isFinite(prop.y))return false;
    const {x,y}=prop,angle=Number(prop.angle)||0;
    const active=!!prop.active,animMs=Number(prop.animMs)||0;
    ctx.save();ctx.translate(x,y);
    // A small fixed mounting stays below the rotating barrel.
    ellipse(ctx,0,16,23,8,'#607D76','#355E5A',1.2);
    rounded(ctx,-12,-1,24,21,5,'#8EB3A1','#365F62',1.5);
    ctx.save();ctx.rotate(-angle);
    rounded(ctx,-13,-16,65,32,11,'#3B7984','#204E5D',2);
    rounded(ctx,-8,-13,53,9,4,'#77B5BA');
    rounded(ctx,34,-18,19,36,6,'#214F64','#153A50',1.5);
    ellipse(ctx,53,0,7,13,'#344C63','#153A50',1.5);
    ellipse(ctx,54,0,3.6,9,'#122F43');
    if(active&&animMs>=500&&animMs<700){
      ctx.fillStyle='#F8D268';
      ctx.beginPath();ctx.moveTo(58,-12);ctx.lineTo(81,0);
      ctx.lineTo(58,12);ctx.lineTo(64,0);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    ellipse(ctx,0,1,9,9,'#E2BC6C','#8C7049',1.2);
    ellipse(ctx,0,1,3.5,3.5,'#6B8A91');
    ctx.restore();
    return true;
  }
  function drawRemadeFriend(ctx,prop){
    if(art.quality==='classic'||!prop||!ctx||!Number.isFinite(prop.x)||
       !Number.isFinite(prop.y))return false;
    ctx.save();ctx.translate(prop.x,prop.y);
    const bob=Math.sin((Number(prop.time)||0)*1.9)*.8;
    ctx.translate(0,bob);
    const fill=ctx.createLinearGradient(-15,-16,16,17);
    fill.addColorStop(0,'#FF9C91');fill.addColorStop(.4,'#F45452');
    fill.addColorStop(1,'#CC3545');
    ellipse(ctx,0,0,14,14,fill,'#9E3042',1.2);
    ellipse(ctx,-5,-6,5,2.4,'rgba(255,250,245,.32)');
    eyes(ctx,0,-1,5,0.65,false);
    line(ctx,[[-3.5,7],[0,8.5],[3.5,7]],'#792939',.9);
    ctx.restore();
    return true;
  }
  // Type-0 Candle, type-1 bumper, type-2 mole and type-3 stalker.
  // Dimensions are deliberately kept near each source collision envelope:
  // source widths [50,100,100,150] and heights [100,50,80,150].
  const enemySizes=[[32,65],[60,32],[62,51],[92,92]];
  function drawCandle(ctx,e){
    const pulse=Math.sin((Number(e.time)||0)*8)*2;
    ellipse(ctx,0,-2,11,3,'rgba(42,56,63,.20)');
    rounded(ctx,-10,-48,20,46,5,'#EAC678','#9D744C',1.3);
    rounded(ctx,-7,-44,5,32,2,'rgba(255,245,202,.50)');
    ellipse(ctx,0,-47,11,4,'#F4DCA4','#AE8C58',.9);
    line(ctx,[[0,-48],[0,-54]],'#70503E',1.4);
    ctx.fillStyle='#F47B35';ctx.beginPath();
    ctx.moveTo(0,-69-pulse);ctx.bezierCurveTo(16,-56,6,-53,0,-53);
    ctx.bezierCurveTo(-9,-55,-9,-60,0,-69-pulse);ctx.fill();
    ellipse(ctx,0,-57,3.1,5,'#FFE9A1');
    eyes(ctx,0,-28,5,.7,true);
  }
  function drawBumper(ctx,e){
    ellipse(ctx,0,-2,26,4,'rgba(40,61,76,.22)');
    rounded(ctx,-29,-31,58,29,12,'#487E89','#244B5C',1.7);
    rounded(ctx,-25,-29,50,8,4,'#92C4C1');
    for(const sign of [-1,1]){
      rounded(ctx,sign*23-5,-25,9,20,4,'#D9A55C','#8C6650',.9);
    }
    eyes(ctx,0,-17,9,.75,true);
    ellipse(ctx,0,-6,4,2,'#284F5A');
  }
  function drawMole(ctx,e){
    ellipse(ctx,0,-3,31,9,'#766653','#584A48',1.1);
    for(const sx of [-18,-2,14]){
      ellipse(ctx,sx,-9,14,8,sx===-2?'#947961':'#83715A');
    }
    const hidden=e.state===0&&e.propelType===0;
    const fraction=hidden?0:e.state===1?
      Math.min(1,Math.max(0,(e.molePeekTimer||0)/Math.max(1,e.molePeekPeriod||800))):
      e.state===2?Math.min(1,Math.max(0,(e.molePeekTimer||0)/Math.max(1,e.molePeekPeriod||800))):1;
    // Source mole animation is concealed below its mound between peeks.
    if(fraction<=0.015)return;
    ctx.save();ctx.beginPath();ctx.rect(-32,-56,64,48);ctx.clip();
    const rise=fraction*28;
    ellipse(ctx,0,-14-rise,22,21,'#BB947C','#795F63',1.3);
    ellipse(ctx,-6,-18-rise,12,10,'#D8BA99');
    eyes(ctx,0,-22-rise,8,.73,true);
    ellipse(ctx,0,-13-rise,5,3,'#A76B6C');
    ctx.restore();
  }
  function drawStalker(ctx,e){
    const time=Number(e.time)||0;
    ctx.save();ctx.translate(0,Math.sin(time*3)*1.5);
    ellipse(ctx,0,-3,36,5,'rgba(39,39,63,.21)');
    const spikes=[];
    for(let i=0;i<12;i++){
      const ang=i*TAU/12,rad=i%2===0?43:35;
      spikes.push([Math.cos(ang)*rad, -48+Math.sin(ang)*rad]);
    }
    ctx.beginPath();
    spikes.forEach(([x,y],i)=>{if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
    ctx.closePath();ctx.fillStyle='#604C91';ctx.fill();
    ctx.lineWidth=1.6;ctx.strokeStyle='#3D3868';ctx.stroke();
    ellipse(ctx,0,-48,32,35,'#735DA6');
    ellipse(ctx,-9,-55,17,12,'rgba(190,161,224,.28)');
    eyes(ctx,0,-49,14,1.18,true);
    rounded(ctx,-13,-31,26,7,4,'#4E3D70');
    ctx.restore();
  }
  function drawRemadeEnemy(ctx,prop){
    if(art.quality==='classic'||!prop||!ctx||!Number.isFinite(prop.x)||
       !Number.isFinite(prop.y))return false;
    const type=prop.type|0;
    if(type<0||type>3)return false;
    ctx.save();ctx.translate(prop.x,prop.y);
    // Do not enlarge graphics outside the authored physics dimensions.
    if(type===0)drawCandle(ctx,prop);
    else if(type===1)drawBumper(ctx,prop);
    else if(type===2)drawMole(ctx,prop);
    else drawStalker(ctx,prop);
    ctx.restore();
    return true;
  }
  art.drawRemadeTrampoline=drawRemadeTrampoline;
  art.drawRemadeCannon=drawRemadeCannon;
  art.drawRemadeFriend=drawRemadeFriend;
  art.drawRemadeEnemy=drawRemadeEnemy;
  art.propArtVersion=15;
})();
