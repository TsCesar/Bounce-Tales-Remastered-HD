/* Clean per-sprite HD atlas rendering. Original sprites remain available
 * immediately and as a safe fallback; only verified IDs are substituted.
 */
(function () {
  'use strict';
  const remaster=window.BounceRemaster;
  if(!remaster)return;
  const VERSION=4;
  const smallDevice=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
  // Mobile WebViews get an independently baked 2x atlas. 4x remains on PC.
  // This reduces atlas surface area and decoded texture memory on phones.
  const expectedScale=smallDevice?2:4;
  const atlasRoot=smallDevice?'remaster/assets/mobile/':'remaster/assets/hd/';
  let manifest=null,pages=[],loaded=0,state='loading';

  remaster.textureStatus=()=>({
    state,loadedPages:loaded,totalPages:pages.length,
    spriteCount:manifest?.spriteCount||0,atlasScale:manifest?.scale||0,smallDevice
  });

  remaster.drawSprite=(spriteId,x,y,ctx)=>{
    if(remaster.quality==='classic'||!manifest||!ctx||
       !Number.isInteger(spriteId)||spriteId<0||spriteId>325)return false;
    const sprite=manifest.sprites[String(spriteId)];
    if(!sprite)return false;
    const image=pages[sprite.page];
    if(!image||!image.complete||!image.naturalWidth)return false;
    // Small UI/characters use nearest neighbour; large scenery uses carefully
    // alpha-aware precomputed interpolation. No global blur on the game canvas.
    ctx.save();
    // Remaining larger source sprites should blend at high-DPI. Preserve
    // nearest neighbour only for tiny bitmap details that must stay legible.
    const smooth=sprite.sampling==='smooth'||
      (sprite.logicalW>=14&&sprite.logicalH>=14);
    ctx.imageSmoothingEnabled=smooth;
    if(smooth)ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,sprite.x,sprite.y,sprite.w,sprite.h,
      Math.round(x-sprite.originX),Math.round(y-sprite.originY),
      sprite.logicalW,sprite.logicalH);
    ctx.restore();
    return true;
  };

  async function load(){
    try{
      const response=await fetch(atlasRoot+'manifest.json?v=8',{cache:'no-store'});
      if(!response.ok)throw new Error('Manifest HTTP '+response.status);
      const next=await response.json();
      if(next.version!==VERSION||next.spriteCount!==326||next.scale!==expectedScale||
         !Array.isArray(next.pages)||!next.pages.length||
         Object.keys(next.sprites||{}).length!==326)throw Error('Invalid HD sprite manifest');
      for(const value of Object.values(next.sprites))
        if(!['pixel','smooth'].includes(value.sampling)||
            !Number.isInteger(value.page)||value.page<0||value.page>=next.pages.length)
          throw Error('Invalid HD sprite sampling/page');
      manifest=next;
      pages=next.pages.map((filename)=>{
        const image=new Image();
        image.decoding='async';
        image.onload=()=>{
          loaded++;
          if(loaded===pages.length)state='ready';
        };
        image.onerror=()=>{state='partial';console.warn('Using original sprite for missing atlas:',filename);};
        image.src=atlasRoot+encodeURIComponent(filename)+'?v=8';
        return image;
      });
    }catch(error){
      state='fallback';
      console.warn('HD textures unavailable, original sprites will render:',error);
    }
  }
  load();
})();
