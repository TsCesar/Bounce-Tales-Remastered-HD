/* Bounce Tales V21 — final 13 sprite IDs used directly by the 15 RLEF
 * levels. Repaint only in HD/Ultra. Source anchors, dimensions, scripts and
 * Classic mode remain untouched; these are not interactive replacements.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;if(!art)return;
  const IDS=new Set([53,54,81,111,112,116,133,134,135,136,137,343,344]);
  const TAU=Math.PI*2;
  function polygon(ctx,points,fill,stroke,width=.018){
    ctx.beginPath();
    points.forEach(([x,y],i)=>{if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
    ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function ellipse(ctx,x,y,rx,ry,fill,stroke,width=.018){
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function beachBall(ctx){
    ellipse(ctx,.5,.5,.48,.48,'#FAFCF7','#284956',.024);
    ctx.save();ctx.beginPath();ctx.arc(.5,.5,.45,0,TAU);ctx.clip();
    const sections=['#E95645','#FFFDF0','#63C2E2','#FFFDF0','#E6D740','#FFFDF0'];
    for(let i=0;i<6;i++){
      const from=-Math.PI/2+i*TAU/6,to=from+TAU/6;
      ctx.beginPath();ctx.moveTo(.5,.5);ctx.arc(.5,.5,.46,from,to);
      ctx.closePath();ctx.fillStyle=sections[i];ctx.fill();
    }
    ellipse(ctx,.28,.24,.12,.08,'rgba(255,255,255,.65)');
    ctx.restore();
    ellipse(ctx,.5,.5,.48,.48,null,'#31505B',.025);
  }
  function stoneBall(ctx){
    ellipse(ctx,.5,.5,.48,.47,'#83939A','#40545F',.028);
    polygon(ctx,[[.14,.32],[.34,.13],[.60,.21],[.53,.46],
      [.28,.56],[.13,.45]],'#B4C2C4');
    polygon(ctx,[[.56,.48],[.86,.29],[.95,.57],[.73,.84],
      [.50,.77]],'#607A85');
    polygon(ctx,[[.20,.65],[.44,.54],[.58,.84],[.34,.91]],'#9BAFB7');
    ctx.strokeStyle='rgba(58,84,95,.65)';ctx.lineWidth=.018;
    ctx.beginPath();ctx.moveTo(.36,.17);ctx.lineTo(.50,.37);
    ctx.lineTo(.39,.52);ctx.lineTo(.63,.65);ctx.stroke();
  }
  function diagonalSpike(ctx){
    polygon(ctx,[[.08,.68],[.97,.03],[.81,.79],[.39,.97]],
      '#BADCE2','#41616F',.040);
    polygon(ctx,[[.17,.68],[.81,.14],[.58,.70]],'#F1FAF3');
    polygon(ctx,[[.58,.70],[.81,.14],[.80,.76],[.39,.90]],'#77A7B6');
  }
  function angryCrate(ctx,id){
    polygon(ctx,[[.05,.15],[.79,.08],[.97,.25],[.91,.94],[.11,.94]],
      '#EF792C','#824226',.030);
    polygon(ctx,[[.78,.08],[.97,.25],[.91,.94],[.77,.84]],'#BF5425');
    polygon(ctx,[[.05,.15],[.79,.08],[.65,.30],[.14,.34]],'#F9A245');
    ctx.strokeStyle='#6B3827';ctx.lineWidth=.045;
    ctx.beginPath();ctx.moveTo(.22,.27);ctx.lineTo(.43,.39);
    ctx.moveTo(.74,.24);ctx.lineTo(.54,.40);ctx.stroke();
    if(id===112){
      for(const ex of [.34,.64]){
        ellipse(ctx,ex,.50,.12,.13,'#FFF8DE','#613626',.022);
        ellipse(ctx,ex+.04,.54,.035,.065,'#37454A');
      }
    }else{
      ctx.strokeStyle='#642D26';ctx.lineWidth=.046;
      ctx.beginPath();ctx.moveTo(.20,.48);ctx.lineTo(.43,.49);
      ctx.moveTo(.58,.49);ctx.lineTo(.80,.47);ctx.stroke();
    }
    polygon(ctx,id===112?
      [[.25,.76],[.45,.62],[.55,.78],[.72,.63],[.79,.84],[.19,.85]]:
      [[.24,.78],[.46,.65],[.62,.69],[.78,.79],[.70,.88],[.28,.86]],
      '#5E3029','#492A27',.018);
    if(id===112){
      polygon(ctx,[[.30,.75],[.41,.66],[.47,.76]],'#FEF4DB');
      polygon(ctx,[[.58,.76],[.69,.66],[.72,.80]],'#FEF4DB');
    }
  }
  function brownShell(ctx){
    ellipse(ctx,.51,.53,.48,.46,'#98652F','#583D2D',.035);
    ellipse(ctx,.46,.51,.38,.40,'#B47B38');
    polygon(ctx,[[.23,.25],[.45,.12],[.69,.18],[.81,.30],
      [.65,.38],[.48,.26],[.31,.44]],'#6E492A');
    polygon(ctx,[[.67,.32],[.85,.40],[.83,.68],[.68,.83],
      [.55,.63]],'#77482F');
    ellipse(ctx,.72,.49,.12,.23,'#E84D79','#743A43',.030);
    ellipse(ctx,.74,.47,.048,.14,'#F49AAA');
    ellipse(ctx,.18,.22,.12,.055,'rgba(255,233,168,.28)');
  }
  function debris(ctx,id){
    if(id===133){
      polygon(ctx,[[.04,.96],[.20,.59],[.63,.11],[.93,.24],
        [.81,.77],[.46,.94]],'#3C3B37','#2C3437',.03);
      polygon(ctx,[[.21,.77],[.63,.13],[.79,.26],[.48,.61]],'#875133');
    }else if(id===134){
      polygon(ctx,[[.08,.89],[.25,.35],[.48,.58],[.60,.10],
        [.85,.07],[.75,.68],[.94,.83],[.53,.89]],
        '#BB5E2D','#803F2C',.04);
      ctx.strokeStyle='#E6A04F';ctx.lineWidth=.08;
      ctx.beginPath();ctx.moveTo(.32,.67);ctx.lineTo(.63,.30);ctx.stroke();
    }else if(id===135){
      polygon(ctx,[[.16,.02],[.73,.02],[.82,.90],[.56,.97],
        [.14,.83]],'#B58B5B','#734E37',.05);
      ctx.strokeStyle='#E8BE74';ctx.lineWidth=.055;
      ctx.beginPath();ctx.moveTo(.33,.08);ctx.lineTo(.39,.86);ctx.stroke();
      ctx.strokeStyle='#765133';ctx.beginPath();
      ctx.moveTo(.68,.13);ctx.lineTo(.63,.77);ctx.stroke();
    }else{
      ctx.strokeStyle='#3E4140';ctx.lineWidth=.18;
      ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(.18,.14);ctx.lineTo(.80,.86);
      ctx.moveTo(.83,.15);ctx.lineTo(.18,.84);ctx.stroke();
      ctx.strokeStyle='#A5AAA5';ctx.lineWidth=.045;
      ctx.beginPath();ctx.moveTo(.25,.14);ctx.lineTo(.83,.80);ctx.stroke();
    }
  }
  function switchLever(ctx,id){
    // Original compounds 343/344 are 64x41, rooted at the lever pivot.
    // Draw with the same reference origin (0,0), no sprite-piece mosaics.
    ctx.save();
    const box=ctx.createLinearGradient(-9,-33,24,2);
    box.addColorStop(0,'#F6A641');box.addColorStop(.8,'#D46D2D');
    box.addColorStop(1,'#A64A22');
    polygon(ctx,[[-8,-33],[18,-33],[25,-27],[24,-3],[-8,-2]],
      box,'#7D4129',1.4);
    polygon(ctx,[[18,-33],[25,-27],[24,-3],[17,0]],'#AF5529');
    ellipse(ctx,8,-22,4.2,4.2,id===343?'#E35340':'#4CBE64',
      '#6C4930',.75);
    const raised=id===343;
    ctx.strokeStyle='#3E6174';ctx.lineWidth=7;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-6,-13);ctx.lineTo(-27,raised?-28:-3);ctx.stroke();
    ellipse(ctx,-29,raised?-28:-3,9.6,9.6,'#E94836','#822A2C',1.0);
    ellipse(ctx,-32,raised?-32:-7,3.0,2.0,'rgba(255,236,214,.75)');
    ctx.restore();
  }
  function drawRemadeResidualSprite(ctx,id,x,y,meta){
    if(art.quality==='classic'||!ctx||!IDS.has(id)||!meta||
       !Number.isFinite(x)||!Number.isFinite(y))return false;
    ctx.save();
    if(id===343||id===344){
      ctx.translate(x,y);switchLever(ctx,id);
    }else{
      if(meta.type!=='simple'||!(meta.width>0&&meta.height>0)||
         !Number.isFinite(meta.originX)||!Number.isFinite(meta.originY)){
        ctx.restore();return false;
      }
      ctx.translate(x-meta.originX,y-meta.originY);
      ctx.scale(meta.width,meta.height);
      if(id===53)beachBall(ctx);
      else if(id===54)stoneBall(ctx);
      else if(id===81)diagonalSpike(ctx);
      else if(id===111||id===112)angryCrate(ctx,id);
      else if(id===116)brownShell(ctx);
      else debris(ctx,id);
    }
    ctx.restore();return true;
  }
  art.drawRemadeResidualSprite=drawRemadeResidualSprite;
  art.residualSpriteIds=Object.freeze([...IDS].sort((a,b)=>a-b));
})();
