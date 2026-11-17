/* Remake V18: decorative plant, hazard and level prop art. No game logic.
 * All sizes and anchors come from the source RLEF sprite descriptor.
 * Classic stays in original J2ME pixels, HD/Ultra use clean vector artwork.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const TAU=Math.PI*2;
  const IDS=new Set([52,61,62,76,78,80,83,84,117,118,119,143,157,158,161,267,268,269,313]);
  function oval(c,x,y,rx,ry,fill,stroke,strokeWidth=.009){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
    if(fill){c.fillStyle=fill;c.fill();}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=strokeWidth;c.stroke();}
  }
  function stroke(c,points,color,width=.016){
    c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
    c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
  function leaf(c,x,y,angle,scale,color){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);
    c.beginPath();c.moveTo(0,0);
    c.bezierCurveTo(-.10,-.055,-.17,-.22,0,-.32);
    c.bezierCurveTo(.17,-.22,.10,-.055,0,0);
    c.fillStyle=color;c.fill();
    c.strokeStyle='#328353';c.lineWidth=.012;c.stroke();
    c.restore();
  }
  function petals(c,x,y,n,colors,small=false){
    const length=small?.12:.19,width=small?.065:.115;
    c.save();c.translate(x,y);
    for(let i=0;i<n;i++){
      c.save();c.rotate(i*TAU/n);
      oval(c,0,-length*.66,width,length,colors[i%colors.length],
        'rgba(75,46,76,.30)',.006);
      c.restore();
    }
    oval(c,0,0,small?.075:.11,'#E7BB32','#9E7A21',.012);
    oval(c,-.02,-.02,small?.022:.035,small?.014:.027,'#FFF3AF');
    c.restore();
  }
  function flowers(c,id){
    const white=id===62;
    const anchor=white?.26:.48;
    const head=white?.72:.48;
    stroke(c,[[anchor,.97],[anchor+.01,.70],[head,.36]],'#348B56',.048);
    leaf(c,anchor,.78,-.85,.62,'#5EBB62');
    leaf(c,anchor+.08,.68,1.18,.69,'#6DD36C');
    petals(c,head,white?.34:.29,white?5:6,
      white?['#FCFFF1','#EBF5E8']:['#E93C71','#F4517B','#CE285E']);
  }
  function bush(c){
    // A single joined crown, not overlapping square sprite cells.
    oval(c,.49,.76,.48,.24,'#367F54','#235E46',.016);
    for(const [x,y,r] of [[.15,.72,.15],[.32,.57,.21],[.53,.52,.24],
      [.74,.62,.22],[.88,.75,.12]]){
      oval(c,x,y,r,r*.95,'#52A95A');
    }
    oval(c,.38,.50,.22,.11,'rgba(174,238,119,.43)');
  }
  function mushroom(c,id){
    const pink=id===157;
    const cap=pink?'#D42A8D':'#F1C04D';
    const light=pink?'#F36DBB':'#FFE591';
    stroke(c,[[.49,.96],[.52,.57],[.5,.42]],pink?'#8B5F52':'#429767',.12);
    oval(c,.48,.53,.18,.20,pink?'#BB875F':'#60B780');
    oval(c,.49,.41,.45,.18,cap,'#784C63',.018);
    oval(c,.39,.31,.26,.09,light);
    oval(c,.48,.42,.36,.052,'#FFF0BB');
    if(!pink){
      leaf(c,.51,.75,-.65,.48,'#55B78C');
      leaf(c,.54,.85,1.15,.43,'#7DD39E');
    }else{
      for(const [x,y] of [[.22,.35],[.35,.28],[.65,.32],[.76,.38]])
        oval(c,x,y,.035,.03,'#AB2677');
    }
  }
  function purpleFlower(c,id){
    const flat=id===118||id===119;
    if(id===143){
      stroke(c,[[.49,.95],[.52,.68],[.48,.51]],'#AA397B',.08);
      oval(c,.5,.31,.37,.29,'#F65CA6','#8C2B74',.019);
      c.beginPath();
      for(let i=0;i<=36;i++){
        const t=i/36*3.4*Math.PI,r=.28*(1-i/38);
        const x=.50+Math.cos(t)*r,y=.29+Math.sin(t)*r*.73;
        if(i)c.lineTo(x,y);else c.moveTo(x,y);
      }
      c.lineWidth=.024;c.strokeStyle='#FFFFFF';c.stroke();return;
    }
    const center=flat?[.5,.54]:[.5,.47],extent=flat?.26:.38;
    for(let i=0;i<(flat?6:7);i++){
      c.save();c.translate(...center);c.rotate(i*TAU/(flat?6:7));
      oval(c,0,-extent*.52,.085,extent,'#7550B0','#49337B',.016);
      c.restore();
    }
    oval(c,...center,.13,.09,'#F8D751','#916E23',.013);
  }
  function crystal(c){
    c.beginPath();
    const points=[[.16,.98],[.06,.54],[.35,.25],[.53,.02],[.70,.26],[.95,.52],[.78,.96]];
    points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();c.fillStyle='#D24EA0';c.fill();
    c.strokeStyle='#8E326E';c.lineWidth=.018;c.stroke();
    c.fillStyle='#F49BD2';c.beginPath();
    c.moveTo(.53,.02);c.lineTo(.70,.26);c.lineTo(.47,.65);
    c.lineTo(.35,.25);c.closePath();c.fill();
    c.fillStyle='#AC3E96';c.beginPath();c.moveTo(.47,.65);
    c.lineTo(.78,.96);c.lineTo(.16,.98);c.closePath();c.fill();
  }
  function thorn(c,id){
    let points;
    if(id===76)points=[[.04,.98],[.47,.02],[.96,.98]];
    else if(id===78)points=[[.06,.02],[.94,.02],[.52,.98]];
    else if(id===80)points=[[.02,.07],[.97,.5],[.02,.94]];
    else points=[[.98,.04],[.04,.5],[.98,.96]];
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
    c.closePath();c.fillStyle='#B9D8DD';c.fill();
    c.strokeStyle='#385766';c.lineWidth=.047;c.stroke();
    c.beginPath();c.moveTo(...points[0]);c.lineTo(.47,.51);c.lineTo(...points[1]);
    c.closePath();c.fillStyle='#EEF7EE';c.fill();
    c.beginPath();c.moveTo(.47,.51);c.lineTo(...points[2]);c.lineTo(...points[0]);
    c.closePath();c.fillStyle='#6E9BA9';c.fill();
  }
  function pumpkin(c){
    stroke(c,[[.5,.29],[.55,.11],[.67,.09]],'#568B55',.045);
    oval(c,.5,.57,.46,.38,'#E99342','#91502D',.017);
    for(const x of [.30,.50,.70]){
      oval(c,x,.58,.13,.34,x===.5?'#F6B252':'#D88038');
    }
    oval(c,.42,.40,.19,.08,'rgba(255,232,151,.45)');
    leaf(c,.58,.25,-.9,.28,'#67B16C');
  }
  function bareTree(c){
    stroke(c,[[.49,1],[.48,.55],[.43,.30],[.52,.07]],'#3D868A',.10);
    stroke(c,[[.43,.37],[.20,.23],[.13,.10]],'#499FA0',.057);
    stroke(c,[[.50,.47],[.77,.31],[.79,.14]],'#499FA0',.055);
    stroke(c,[[.48,.64],[.20,.58],[.15,.44]],'#478E92',.05);
    oval(c,.49,.15,.11,.05,'#70C2BD');
  }
  function knot(c,id){
    const dim=id===268?.38:.44;
    oval(c,.50,.50,dim,dim,'rgba(20,68,46,.78)');
    oval(c,.47,.47,dim*.72,dim*.72,'rgba(28,96,61,.55)');
    oval(c,.39,.32,dim*.2,dim*.13,'rgba(124,190,103,.19)');
  }
  function drawRemadeDecor(ctx,id,x,y,meta){
    if(art.quality==='classic'||!IDS.has(id)||!ctx||!meta||
       !Number.isFinite(x)||!Number.isFinite(y)||
       !(meta.width>0&&meta.height>0)||
       !Number.isFinite(meta.originX)||!Number.isFinite(meta.originY))return false;
    ctx.save();
    ctx.translate(x-meta.originX,y-meta.originY);
    ctx.scale(meta.width,meta.height);
    if(id===61||id===62)flowers(ctx,id);
    else if(id===313)bush(ctx);
    else if(id===157||id===158)mushroom(ctx,id);
    else if(id===117||id===118||id===119||id===143)purpleFlower(ctx,id);
    else if(id===52)crystal(ctx);
    else if([76,78,80,83].includes(id))thorn(ctx,id);
    else if(id===84)pumpkin(ctx);
    else if(id===161)bareTree(ctx);
    else if(id>=267&&id<=269)knot(ctx,id);
    ctx.restore();
    return true;
  }
  art.drawRemadeDecor=drawRemadeDecor;
  art.decorSpriteIds=Object.freeze([...IDS].sort((a,b)=>a-b));
})();
