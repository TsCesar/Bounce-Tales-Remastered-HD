/* Bounce Tales remake - vector character art for all THREE original forms.
 * Classic mode delegates to original J2ME sprites. No new physics/state.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const TAU=Math.PI*2;
  function ellipse(ctx,x,y,rx,ry,fill,stroke,width=1){
    ctx.beginPath();ctx.ellipse(x,y,Math.max(.3,rx),Math.max(.3,ry),0,0,TAU);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.lineWidth=width;ctx.strokeStyle=stroke;ctx.stroke();}
  }
  function face(ctx,form,eyeFrame,r){
    const blink=eyeFrame===1||eyeFrame===2||eyeFrame===3;
    const sleepy=eyeFrame===1,closed=eyeFrame===2||eyeFrame===3;
    const sclera=form===1?'#F6F1DA':'#FFFFFF';
    const top=-r*.20,eyeW=r*.31,eyeH=r*(closed?.085:sleepy?.25:.38);
    for(const side of [-1,1]){
      const cx=side*r*.30;
      ellipse(ctx,cx,top,eyeW,eyeH,sclera,'#25333D',.85);
      if(!blink){
        const shift=eyeFrame===4?-r*.07:eyeFrame===5?r*.08:0;
        ellipse(ctx,cx+side*r*.035+shift,top+r*.05,r*.115,r*.19,'#17262D');
        ellipse(ctx,cx+side*r*.015+shift,top-r*.02,r*.045,r*.06,'#FFFFFF');
      }
    }
    if(eyeFrame>=6){
      ctx.strokeStyle='#26313B';ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(-r*.20,r*.39);ctx.quadraticCurveTo(0,r*.49,r*.2,r*.36);ctx.stroke();
    }
  }
  function drawRed(ctx,r,p){
    const speed=Math.min(1,Math.hypot(p.vx||0,p.vy||0)/650);
    const squeeze=(p.grounded?-.015:.012)+speed*.022;
    ctx.save();ctx.scale(1+squeeze,1-squeeze);
    const fill=ctx.createLinearGradient(-r,-r,r,r);
    fill.addColorStop(0,'#FF7772');
    fill.addColorStop(.28,'#EF353E');
    fill.addColorStop(.82,'#DE1E30');
    fill.addColorStop(1,'#B71932');
    ellipse(ctx,0,0,r*.98,r*.98,fill,'#84253A',1.15);
    ellipse(ctx,-r*.31,-r*.48,r*.33,r*.16,'rgba(255,255,255,.25)');
    ctx.restore();
  }
  function drawStone(ctx,r,p){
    const ang=(p.rotation||0);
    ctx.save();ctx.rotate(ang);
    const n=12,points=[];
    for(let i=0;i<n;i++){
      const t=i*TAU/n,shape=1+[.01,-.05,.035,-.015,.05,-.02,.04,-.025,.03,.015,-.04,.025][i];
      const radius=r*.95*shape;
      points.push([Math.cos(t)*radius,Math.sin(t)*radius]);
    }
    ctx.beginPath();
    points.forEach(([x,y],i)=>{if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});
    ctx.closePath();
    ctx.fillStyle='#879AA1';ctx.fill();
    ctx.lineWidth=1.15;ctx.strokeStyle='#405C6A';ctx.stroke();
    ctx.save();ctx.clip();
    ctx.fillStyle='#ABBAC0';
    ctx.beginPath();ctx.moveTo(-r*.75,-r*.50);
    ctx.lineTo(-r*.08,-r*.85);ctx.lineTo(r*.25,-r*.42);
    ctx.lineTo(-r*.21,-r*.12);ctx.lineTo(-r*.77,r*.20);ctx.closePath();ctx.fill();
    ctx.fillStyle='#607C88';
    ctx.beginPath();ctx.moveTo(-r*.11,r*.13);
    ctx.lineTo(r*.73,-r*.08);ctx.lineTo(r*.90,r*.70);
    ctx.lineTo(r*.28,r*.94);ctx.closePath();ctx.fill();
    ctx.fillStyle='#9BADB5';
    ctx.beginPath();ctx.moveTo(-r*.65,r*.37);
    ctx.lineTo(-r*.25,r*.23);ctx.lineTo(r*.12,r*.85);
    ctx.lineTo(-r*.43,r*.90);ctx.closePath();ctx.fill();
    // Three purposeful crack strokes, no random tiles or photographic relief.
    ctx.strokeStyle='#567480';ctx.lineWidth=.8;
    ctx.beginPath();ctx.moveTo(-r*.73,-r*.26);
    ctx.lineTo(-r*.36,-r*.06);ctx.lineTo(-r*.14,-r*.28);ctx.stroke();
    ctx.beginPath();ctx.moveTo(r*.52,-r*.68);
    ctx.lineTo(r*.35,-r*.40);ctx.lineTo(r*.58,-r*.20);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.04,r*.42);
    ctx.lineTo(r*.17,r*.65);ctx.lineTo(r*.37,r*.51);ctx.stroke();
    ctx.restore();ctx.restore();
  }
  function drawWolly(ctx,r,p){
    const colors=['#FFF9E7','#1F78CB','#FFF9E7','#EA503D','#FFF9E7','#F6D334'];
    const phase=-(p.rotation||0)-Math.PI/2;
    ctx.save();
    ellipse(ctx,0,0,r,r,'#263D59','#29384A',1);
    ctx.beginPath();ctx.arc(0,0,r*.96,0,TAU);ctx.clip();
    for(let i=0;i<6;i++){
      const from=phase+i*TAU/6,to=from+TAU/6;
      ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r*.97,from,to);
      ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();
    }
    ctx.lineWidth=.6;ctx.strokeStyle='rgba(27,57,81,.26)';
    for(let i=0;i<6;i++){
      const t=phase+i*TAU/6;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(t)*r,Math.sin(t)*r);ctx.stroke();
    }
    ellipse(ctx,-r*.30,-r*.49,r*.31,r*.12,'rgba(255,255,255,.40)');
    ellipse(ctx,0,0,r*.18,r*.18,'#F2F5E9','#5A7192',.65);
    ctx.restore();
    ellipse(ctx,0,0,r*.98,r*.98,null,'#263D59',1.1);
  }
  function drawRemadeForm(ctx,p){
    if(art.quality==='classic'||!p||!ctx||!Number.isFinite(p.x)||!Number.isFinite(p.y)||
       !Number.isFinite(p.r)||p.r<=0||![0,1,2].includes(p.form))return false;
    ctx.save();ctx.translate(p.x,p.y);
    const r=Math.max(3,p.r-1);
    if(p.form===0)drawRed(ctx,r,p);
    else if(p.form===1)drawStone(ctx,r,p);
    else drawWolly(ctx,r,p);
    // Eyes are newly drawn in all enhanced modes. They are attached to
    // the actor, not to the rotating shell, so expressions remain readable.
    face(ctx,p.form,p.eyeFrame||0,r);
    ctx.restore();
    return true;
  }
  art.drawRemadeForm=drawRemadeForm;
})();
