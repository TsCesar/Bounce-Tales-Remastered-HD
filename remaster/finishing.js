/* Bounce Tales V19 — clean HD HUD and source-matched rock fragments.
 * Pure presentation. The original game owns counters, timers and particles.
 */
(function(){
  'use strict';
  const art=window.BounceRemaster;if(!art)return;
  const TAU=Math.PI*2;
  const fragmentIds=new Set([390,396,414]);
  function rounded(ctx,x,y,w,h,r){
    const a=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+a,y);ctx.lineTo(x+w-a,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+a);
    ctx.lineTo(x+w,y+h-a);ctx.quadraticCurveTo(x+w,y+h,x+w-a,y+h);
    ctx.lineTo(x+a,y+h);ctx.quadraticCurveTo(x,y+h,x+a,y);
    ctx.lineTo(x,y+a);ctx.quadraticCurveTo(x,y,x+a,y);ctx.closePath();
  }
  function pill(ctx,x,y,w,h){
    rounded(ctx,x,y,w,h,6);
    ctx.fillStyle='rgba(24,57,62,.86)';ctx.fill();
    ctx.lineWidth=.9;ctx.strokeStyle='rgba(200,239,201,.65)';ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+7,y+2);ctx.lineTo(x+w-7,y+2);
    ctx.lineWidth=.7;ctx.strokeStyle='rgba(255,255,255,.20)';ctx.stroke();
  }
  function egg(ctx,x,y){
    ctx.save();ctx.translate(x,y);
    ctx.beginPath();ctx.moveTo(0,-8);
    ctx.bezierCurveTo(4.6,-8,6.5,-1.3,6.5,2.1);
    ctx.bezierCurveTo(6.5,7,3.4,9,0,9);
    ctx.bezierCurveTo(-3.4,9,-6.5,7,-6.5,2.1);
    ctx.bezierCurveTo(-6.5,-1.3,-4.6,-8,0,-8);
    ctx.closePath();ctx.fillStyle='#F5C962';ctx.fill();
    ctx.lineWidth=.75;ctx.strokeStyle='#9D7538';ctx.stroke();
    ctx.beginPath();ctx.ellipse(-2,-2.7,1.4,3.1,-.3,0,TAU);
    ctx.fillStyle='rgba(255,255,234,.76)';ctx.fill();ctx.restore();
  }
  function clock(ctx,x,y){
    ctx.beginPath();ctx.arc(x,y,7.1,0,TAU);
    ctx.fillStyle='#E2F7E6';ctx.fill();
    ctx.lineWidth=1.1;ctx.strokeStyle='#4B8292';ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y-4.2);ctx.lineTo(x,y);
    ctx.lineTo(x+3.4,y+2.1);
    ctx.lineWidth=1.2;ctx.strokeStyle='#315D72';ctx.stroke();
  }
  function drawRemadeHud(ctx,data){
    if(art.quality==='classic'||!ctx||!data)return false;
    const collected=Number(data.collected),total=Number(data.total);
    const seconds=Number(data.seconds);
    if(![collected,total,seconds].every(Number.isFinite))return false;
    const taken=Math.max(0,Math.floor(collected));
    const available=Math.max(0,Math.floor(total));
    const clockSeconds=Math.max(0,Math.floor(seconds));
    const time=Math.floor(clockSeconds/60)+':'+
      String(clockSeconds%60).padStart(2,'0');
    ctx.save();ctx.globalAlpha=1;
    pill(ctx,3,3,111,23);
    // Keep the clock clear of the native/browser Pause control in the top-right.
    pill(ctx,119,3,83,23);
    egg(ctx,17,14);
    clock(ctx,132,14);
    ctx.fillStyle='#FFF9E4';ctx.font='700 10px system-ui,sans-serif';
    ctx.textBaseline='middle';ctx.textAlign='left';
    ctx.fillText(String(taken)+' / '+String(available),31,15);
    ctx.textAlign='right';ctx.fillText(time,196,15);
    ctx.restore();
    return true;
  }
  function drawRemadeFragment(ctx,id,x,y,frame){
    if(art.quality==='classic'||!fragmentIds.has(id)||!ctx||
       !Number.isFinite(x)||!Number.isFinite(y))return false;
    const state=Math.max(0,Math.min(4,frame|0));
    const radius=Math.max(1.7,5.2-state*.64);
    ctx.save();ctx.translate(x,y);
    // Preserve original animation families: 390 star/fire spark -> pale puff;
    // 396 green/teal spiral -> faded spiral; 414 grey-white dust cloud.
    // Particle velocity, lifetime and image-frame selection stay unchanged.
    if(id===390){
      if(state<=1){
        const palette=['#FFD844','#F5A32A'];
        ctx.rotate(state*.22);
        ctx.beginPath();
        for(let i=0;i<16;i++){
          const angle=i*TAU/16-Math.PI/2;
          const r=radius*(i%2===0?1.35:.55);
          const px=Math.cos(angle)*r,py=Math.sin(angle)*r;
          if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
        }
        ctx.closePath();ctx.fillStyle=palette[state];ctx.fill();
        ctx.lineWidth=.6;ctx.strokeStyle='#A67A29';ctx.stroke();
      }else{
        ctx.fillStyle=state===2?'#F7DEAF':'#E8EAE6';
        for(const [dx,dy,r] of [[-2,-1,.59],[1.4,-2,.64],[-.9,2,.76],[2,1.4,.61]]){
          ctx.beginPath();ctx.arc(dx,dy,radius*r,0,TAU);ctx.fill();
        }
      }
    }else if(id===396){
      const palette=['#6BDA85','#67D5BA','#89E4DE','#CDEFE5','#E4EBDA'];
      ctx.beginPath();ctx.arc(0,0,radius,0,TAU);
      ctx.fillStyle=palette[state];ctx.fill();
      ctx.strokeStyle=state<=1?'#257B63':'#79B6AB';
      ctx.lineWidth=.9;ctx.stroke();
      ctx.beginPath();
      for(let i=0;i<=23;i++){
        const a=i/23*Math.PI*3.8,dist=radius*(.8-i/29);
        const px=Math.cos(a)*dist,py=Math.sin(a)*dist;
        if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
      }
      ctx.lineWidth=1.15;ctx.strokeStyle='rgba(35,104,88,.72)';ctx.stroke();
    }else{
      const shade=['#F6F6EE','#E8EAE5','#D9DED9','#DDE0DB','#EFF0E8'][state];
      ctx.fillStyle=shade;
      for(const [dx,dy,scale] of [[-2,-1,.70],[1.6,-1.5,.70],[-.4,1.7,.90],[2.8,1.1,.51]]){
        ctx.beginPath();ctx.arc(dx,dy,radius*scale,0,TAU);ctx.fill();
      }
      ctx.strokeStyle='rgba(104,118,119,.31)';ctx.lineWidth=.55;
      ctx.beginPath();ctx.arc(.1,.1,radius*.78,0,TAU);ctx.stroke();
    }
    ctx.restore();return true;
  }
  art.drawRemadeHud=drawRemadeHud;
  art.drawRemadeFragment=drawRemadeFragment;
  art.fragmentIds=Object.freeze([...fragmentIds].sort((a,b)=>a-b));
})();
