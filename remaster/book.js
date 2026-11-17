/* Vector book artwork for title, chapter selection, options and scores.
 * All game logic and menu hitboxes remain in the original game.js.
 * Canvas path geometry is deliberately defined at logical 240x320 and the
 * existing HD canvas transform makes the edges resolution independent.
 */
(function(){
  'use strict';
  const api=window.BounceRemaster;
  if(!api)return;
  const PI=Math.PI;
  function round(ctx,x,y,w,h,r){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
  function line(ctx,x,y,xx,yy,color,width){
    ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
    ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();
  }
  function corners(ctx,x,y,w,h,color){
    ctx.strokeStyle=color;ctx.lineWidth=1.35;
    for(const [sx,sy,dx,dy] of [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){
      ctx.beginPath();ctx.moveTo(sx,sy+dy*22);
      ctx.lineTo(sx,sy+dy*4);ctx.quadraticCurveTo(sx,sy,sx+dx*4,sy);
      ctx.lineTo(sx+dx*22,sy);ctx.stroke();
      ctx.beginPath();ctx.arc(sx+dx*9,sy+dy*9,2.25,0,PI*2);ctx.fillStyle=color;ctx.fill();
    }
  }
  function drawTitleBook(ctx){
    if(api.quality==='classic')return false;
    ctx.save();
    // Single smooth leather material in place of the low-resolution dynamic
    // book sprite. Decorative drawing is vector, NOT scaled old bitmaps.
    ctx.shadowColor='rgba(0,0,0,.53)';ctx.shadowBlur=13;ctx.shadowOffsetX=3;ctx.shadowOffsetY=4;
    round(ctx,4,4,208,299,7);ctx.fillStyle='#1d1011';ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    const leather=ctx.createLinearGradient(4,5,212,303);
    leather.addColorStop(0,'#986a3f');leather.addColorStop(.16,'#6f4027');
    leather.addColorStop(.47,'#563020');leather.addColorStop(.76,'#4a261c');
    leather.addColorStop(1,'#301712');
    round(ctx,6,5,205,297,5);ctx.fillStyle=leather;ctx.fill();
    // Gold-stamped binding / subtle spine, kept out of text hitboxes.
    const spine=ctx.createLinearGradient(7,0,26,0);
    spine.addColorStop(0,'#221712');spine.addColorStop(.38,'#895936');
    spine.addColorStop(.67,'#553121');spine.addColorStop(1,'rgba(22,11,9,.18)');
    ctx.fillStyle=spine;ctx.fillRect(7,6,18,294);
    line(ctx,26,8,26,299,'rgba(245,202,123,.23)',.8);
    ctx.strokeStyle='#d3a864';ctx.lineWidth=1.15;
    round(ctx,13,13,190,281,3);ctx.stroke();
    ctx.strokeStyle='rgba(255,230,160,.30)';ctx.lineWidth=.5;
    round(ctx,17,17,182,273,3);ctx.stroke();
    corners(ctx,15,16,186,276,'#c6a169');
    const banner=ctx.createLinearGradient(40,58,184,118);
    banner.addColorStop(0,'#e5c184');banner.addColorStop(.48,'#ffe6ae');
    banner.addColorStop(1,'#ac824d');
    ctx.fillStyle=banner;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='bold 23px Georgia, serif';
    ctx.shadowColor='rgba(16,5,5,.75)';ctx.shadowBlur=2;
    ctx.fillText('BOUNCE',117,92,154);
    ctx.font='bold 17px Georgia, serif';ctx.fillText('TALES',117,117,138);
    ctx.shadowBlur=0;
    line(ctx,57,130,177,130,'rgba(243,211,137,.78)',1.1);
    line(ctx,67,136,167,136,'rgba(243,211,137,.44)',.5);
    // Metal binding ornaments drawn in the same crisp vector pass.
    for(const y of [85,232]){
      ctx.fillStyle='#42281e';round(ctx,5,y-12,31,24,5);ctx.fill();
      const brass=ctx.createLinearGradient(5,y-10,35,y+10);
      brass.addColorStop(0,'#f9dca1');brass.addColorStop(.45,'#a7793d');
      brass.addColorStop(1,'#d2aa6e');
      ctx.fillStyle=brass;round(ctx,8,y-8,24,16,4);ctx.fill();
      ctx.fillStyle='#513323';ctx.beginPath();ctx.arc(18,y,3.5,0,PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,248,204,.7)';ctx.beginPath();
      ctx.arc(17,y-1,1.3,0,PI*2);ctx.fill();
    }
    ctx.restore();
    return true;
  }
  function drawChapterBook(ctx){
    if(api.quality==='classic')return false;
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.46)';ctx.shadowBlur=9;ctx.shadowOffsetX=2;ctx.shadowOffsetY=4;
    round(ctx,4,6,232,305,5);ctx.fillStyle='#3f2217';ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
    // Both pages are original coordinate size and get real vector edges.
    const left=ctx.createLinearGradient(6,0,116,0);
    left.addColorStop(0,'#e5cba0');left.addColorStop(.14,'#f7e9c8');
    left.addColorStop(.80,'#fff8e7');left.addColorStop(1,'#dfcaa8');
    const right=ctx.createLinearGradient(123,0,234,0);
    right.addColorStop(0,'#d8c3a1');right.addColorStop(.20,'#fff8e6');
    right.addColorStop(.86,'#f8eacb');right.addColorStop(1,'#d7bb8a');
    ctx.fillStyle=left;round(ctx,7,9,111,299,2);ctx.fill();
    ctx.fillStyle=right;round(ctx,122,9,110,299,2);ctx.fill();
    const seam=ctx.createLinearGradient(114,0,127,0);
    seam.addColorStop(0,'rgba(91,57,32,0)');
    seam.addColorStop(.40,'rgba(91,57,32,.36)');
    seam.addColorStop(.60,'rgba(91,57,32,.30)');
    seam.addColorStop(1,'rgba(91,57,32,0)');
    ctx.fillStyle=seam;ctx.fillRect(114,9,13,299);
    ctx.strokeStyle='rgba(109,65,25,.36)';ctx.lineWidth=.7;
    ctx.strokeRect(8.5,10.5,222,296);
    corners(ctx,11,14,216,288,'rgba(164,115,58,.35)');
    ctx.restore();
    return true;
  }
  api.drawTitleBook=drawTitleBook;
  api.drawChapterBook=drawChapterBook;
})();