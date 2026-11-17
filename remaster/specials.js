/* Bounce Tales V20 — original-source special props that still used large
 * pixelated J2ME composites. Repaint them in 2D at their verified RLEF
 * bounding boxes; never edit transforms, hitboxes, events or the book.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;
  if(!art)return;
  const IDS=new Set([334,342,345,350,351,354]);
  const TAU=Math.PI*2;
  function poly(c,points,fill,stroke,width=1){
    c.beginPath();
    points.forEach(([x,y],i)=>{if(i)c.lineTo(x,y);else c.moveTo(x,y);});
    c.closePath();c.fillStyle=fill;c.fill();
    if(stroke){c.lineWidth=width;c.strokeStyle=stroke;c.stroke();}
  }
  function oval(c,x,y,rx,ry,fill,stroke,width=1){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);
    c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function towerStone(c,x,y,r,variation){
    const tones=['#8DA0A6','#A0AEB0','#718892','#92A9AD','#80929C'];
    poly(c,[
      [x-r*.85,y-r*.51],[x-r*.45,y-r*.91],
      [x+r*.31,y-r*.87],[x+r*.88,y-r*.41],
      [x+r*.92,y+r*.43],[x+r*.38,y+r*.86],
      [x-r*.47,y+r*.81],[x-r*.93,y+r*.23]
    ],tones[variation%tones.length],'#526A70',1);
    poly(c,[
      [x-r*.80,y-r*.46],[x-r*.40,y-r*.80],
      [x+r*.27,y-r*.71],[x+r*.03,y-r*.24],
      [x-r*.53,y-r*.14]
    ],'rgba(239,247,232,.30)');
  }
  function rockTower(c){
    // The 17 source parts (id 334) span x[-33,33], y[-97,2].
    // The tower is one continuous column with legible, non-square stones.
    const rocks=[
      [-19,-10,14,3],[5,-12,14,1],[20,-9,12,4],
      [-6,-28,13,2],[8,-40,12,0],[-10,-51,14,3],
      [6,-64,13,4],[-9,-76,12,1],[5,-89,11,2]
    ];
    for(const [x,y,r,v] of rocks)towerStone(c,x,y,r,v);
  }
  function electricColumn(c){
    // Dynamic composite 342: two source branches, approximately 21x172.
    for(const side of [-1,1]){
      c.beginPath();
      for(let i=0;i<=24;i++){
        const y=-125+i*7;
        const x=side*(2+Math.sin(i*.84)*4)+Math.cos(i*1.9)*1.5;
        if(!i)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.lineWidth=side<0?3:2.1;
      c.strokeStyle=side<0?'rgba(114,219,241,.55)':'rgba(255,242,155,.82)';
      c.stroke();
    }
    c.beginPath();c.moveTo(0,-124);
    c.bezierCurveTo(-4,-70,5,-10,0,44);
    c.lineWidth=1.1;c.strokeStyle='#F8FEDE';c.stroke();
  }
  function orangeShaft(c){
    const g=c.createLinearGradient(-17,0,17,0);
    g.addColorStop(0,'#8F341D');
    g.addColorStop(.18,'#CB5031');
    g.addColorStop(.5,'#EE743B');
    g.addColorStop(.84,'#C04B2A');
    g.addColorStop(1,'#873C2B');
    poly(c,[[-17,-132],[-10,-135],[12,-135],[17,-131],
      [17,-1],[12,1],[-12,1],[-17,-2]],g,'#7A3727',1.3);
    c.fillStyle='rgba(255,205,143,.28)';c.fillRect(-10,-132,5,129);
    c.fillStyle='rgba(117,39,31,.22)';c.fillRect(12,-132,3,129);
  }
  function portal(c){
    // Source id350: centered 94x132, origin at bottom centre.
    poly(c,[[-47,0],[-43,-102],[-31,-121],[-13,-131],
      [27,-125],[43,-107],[47,0]],'#80543A','#3E3B36',2);
    poly(c,[[-36,-1],[-34,-100],[-22,-113],
      [19,-115],[34,-101],[35,-1]],'#B58B66','#62412F',1.2);
    const aqua=c.createLinearGradient(0,-104,0,-5);
    aqua.addColorStop(0,'#A8F1EA');
    aqua.addColorStop(.55,'#45BEC5');
    aqua.addColorStop(1,'#18849C');
    poly(c,[[-25,-1],[-25,-95],[-15,-102],
      [17,-104],[26,-93],[26,-1]],aqua,'#3C6672',1.2);
    c.strokeStyle='rgba(239,255,239,.75)';c.lineWidth=3;
    c.beginPath();
    for(let i=0;i<=40;i++){
      const t=i/40*4.3*Math.PI,r=28*(1-i/45);
      const x=Math.cos(t)*r*.65,y=-55+Math.sin(t)*r;
      if(i)c.lineTo(x,y);else c.moveTo(x,y);
    }
    c.stroke();
    for(const x of [-30,31]){
      c.beginPath();c.arc(x,-20,2.2,0,TAU);
      c.fillStyle='#E3B17B';c.fill();
    }
    poly(c,[[-39,-123],[-25,-137],[-7,-133],[12,-135],
      [33,-123],[30,-111],[-37,-110]],'#6C4C39','#3B3A36',1.2);
  }
  function mushroomHome(c){
    // Source id351: centered 185x194 (base y=0).
    const stalk=c.createLinearGradient(-45,0,58,0);
    stalk.addColorStop(0,'#C0AD90');stalk.addColorStop(.45,'#E9D5B6');
    stalk.addColorStop(1,'#9D857A');
    poly(c,[[-43,-6],[-55,-101],[-36,-139],
      [37,-139],[56,-102],[48,0]],stalk,'#59485A',2.2);
    oval(c,0,-137,92,53,'#8550B7','#3E3268',2);
    oval(c,-8,-152,71,28,'#A56AD1');
    oval(c,-32,-167,18,9,'rgba(239,201,253,.5)');
    oval(c,42,-148,13,8,'#65438D');
    oval(c,-3,-38,25,33,'#644737','#3E332F',1.6);
    oval(c,-3,-37,16,25,'#302C3F');
    c.strokeStyle='rgba(255,239,212,.35)';c.lineWidth=1.4;
    c.beginPath();c.moveTo(-29,-95);c.quadraticCurveTo(-19,-84,-23,-67);c.stroke();
    c.beginPath();c.moveTo(26,-99);c.quadraticCurveTo(16,-80,25,-63);c.stroke();
    oval(c,24,-46,2,3,'#F4D5A3');
  }
  function glowingStrip(c,w,h){
    // Source 354 is a separate 46x9 light strip, not a grass tile.
    // Three broad colour bands avoid the old enlarged 1px blocks.
    const g=c.createLinearGradient(0,0,0,h);
    g.addColorStop(0,'#E9F7E0');
    g.addColorStop(.2,'#9DCABA');
    g.addColorStop(.52,'#D5AF80');
    g.addColorStop(.79,'#D77D67');
    g.addColorStop(1,'#5A596C');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    c.fillStyle='rgba(255,255,228,.66)';
    c.fillRect(0,0,w,Math.min(1.2,h*.14));
  }
  function drawRemadeSpecial(ctx,id,x,y,meta){
    if(art.quality==='classic'||!ctx||!IDS.has(id)||
       !Number.isFinite(x)||!Number.isFinite(y)||!meta)return false;
    ctx.save();ctx.translate(x,y);
    if(id===334)rockTower(ctx);
    else if(id===342)electricColumn(ctx);
    else if(id===345)orangeShaft(ctx);
    else if(id===350)portal(ctx);
    else if(id===351)mushroomHome(ctx);
    else if(id===354){
      if(meta.type!=='simple'||!(meta.width>0&&meta.height>0)){
        ctx.restore();return false;
      }
      ctx.translate(-meta.originX,-meta.originY);
      glowingStrip(ctx,meta.width,meta.height);
    }
    ctx.restore();return true;
  }
  art.drawRemadeSpecial=drawRemadeSpecial;
  art.specialSpriteIds=Object.freeze([...IDS].sort((a,b)=>a-b));
})();
