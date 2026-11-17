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
    pill(ctx,140,3,97,23);
    egg(ctx,17,14);
    clock(ctx,153,14);
    ctx.fillStyle='#FFF9E4';ctx.font='700 10px system-ui,sans-serif';
    ctx.textBaseline='middle';ctx.textAlign='left';
    ctx.fillText(String(taken)+' / '+String(available),31,15);
    ctx.textAlign='right';ctx.fillText(time,229,15);
    ctx.restore();
    return true;
  }
  function drawRemadeFragment(ctx,id,x,y,frame){
    if(art.quality==='classic'||!fragmentIds.has(id)||!ctx||
       !Number.isFinite(x)||!Number.isFinite(y))return false;
    const state=Math.max(0,Math.min(4,frame|0));
    const radius=Math.max(1.4,5.1-state*.70);
    ctx.save();ctx.translate(x,y);
    // Particle motion and time are still simulated by ParticleSystem.
    ctx.rotate((id%9)*.24+state*.27);
    const colors=id===390?['#A0B4BE','#677F8E']:
      id===414?['#B6C0C4','#7E929A']:['#869AA7','#5A7582'];
    ctx.beginPath();
    ctx.moveTo(-radius*.78,radius*.62);
    ctx.lineTo(-radius*.53,-radius*.65);
    ctx.lineTo(radius*.15,-radius*.98);
    ctx.lineTo(radius*.97,-radius*.15);
    ctx.lineTo(radius*.50,radius*.68);
    ctx.closePath();ctx.fillStyle=colors[0];ctx.fill();
    ctx.lineWidth=.75;ctx.strokeStyle='#3B5460';ctx.stroke();
    ctx.beginPath();ctx.moveTo(-radius*.50,-radius*.56);
    ctx.lineTo(radius*.13,-radius*.82);
    ctx.lineTo(radius*.25,-radius*.13);
    ctx.lineTo(-radius*.18,radius*.08);ctx.closePath();
    ctx.fillStyle='rgba(237,245,241,.46)';ctx.fill();
    ctx.restore();return true;
  }
  art.drawRemadeHud=drawRemadeHud;
  art.drawRemadeFragment=drawRemadeFragment;
  art.fragmentIds=Object.freeze([...fragmentIds].sort((a,b)=>a-b));
})();
