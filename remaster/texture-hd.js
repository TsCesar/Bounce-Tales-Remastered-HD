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
  const preferredScale=smallDevice?2:4;
  let active=null,state='loading';

  remaster.textureStatus=()=>({
    state,loadedPages:active?.loaded||0,totalPages:active?.pages.length||0,
    spriteCount:active?.manifest.spriteCount||0,atlasScale:active?.manifest.scale||0,smallDevice
  });

  remaster.drawSprite=(spriteId,x,y,ctx)=>{
    if(remaster.quality==='classic'||!active||!ctx||
       !Number.isInteger(spriteId)||spriteId<0||spriteId>325)return false;
    const sprite=active.manifest.sprites[String(spriteId)];
    const image=active.pages[sprite.page];
    if(!image)return false;
    const smooth=sprite.sampling==='smooth'||
      (sprite.logicalW>=14&&sprite.logicalH>=14);
    ctx.save();
    ctx.imageSmoothingEnabled=smooth;
    if(smooth)ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,sprite.x,sprite.y,sprite.w,sprite.h,
      Math.round(x-sprite.originX),Math.round(y-sprite.originY),
      sprite.logicalW,sprite.logicalH);
    ctx.restore();
    return true;
  };

  function loadPage(url,sprites){
    return new Promise(resolve=>{
      const image=new Image();
      image.decoding='async';
      image.onload=()=>{
        // An HTTP success can still return the wrong image, such as a stale
        // page. Crops must fit within the decoded texture before drawing.
        const valid=image.naturalWidth>0&&image.naturalHeight>0&&sprites.every(sprite=>
          sprite.x+sprite.w<=image.naturalWidth&&sprite.y+sprite.h<=image.naturalHeight);
        resolve(valid?image:null);
      };
      image.onerror=()=>resolve(null);
      image.src=url;
    });
  }

  async function loadProfile(expectedScale,preferred){
    const root=expectedScale===2?'remaster/assets/mobile/':'remaster/assets/hd/';
    const response=await fetch(root+'manifest.json?v=8');
    if(!response.ok)throw Error('Manifest HTTP '+response.status);
    const next=await response.json();
    if(next.version!==VERSION||next.spriteCount!==326||next.scale!==expectedScale||
       !Array.isArray(next.pages)||!next.pages.length||
       next.pages.some(name=>typeof name!=='string'||!/^hd-[0-9]+\.png$/.test(name))||
       Object.keys(next.sprites||{}).length!==326)throw Error('Invalid HD sprite manifest');
    const groups=next.pages.map(()=>[]);
    for(let id=0;id<326;id++){
      const sprite=next.sprites[String(id)];
      if(!sprite||!['pixel','smooth'].includes(sprite.sampling)||!groups[sprite.page]||
         !Number.isInteger(sprite.page)||
         ![sprite.x,sprite.y,sprite.w,sprite.h,sprite.logicalW,sprite.logicalH,
           sprite.originX,sprite.originY].every(Number.isInteger)||
         sprite.x<0||sprite.y<0||sprite.logicalW<=0||sprite.logicalH<=0||
         sprite.w!==sprite.logicalW*expectedScale||sprite.h!==sprite.logicalH*expectedScale)
        throw Error('Invalid HD sprite crop');
      groups[sprite.page].push(sprite);
    }
    const profile={manifest:next,pages:new Array(next.pages.length).fill(null),loaded:0};
    if(preferred)active=profile;
    await Promise.all(next.pages.map(async(filename,index)=>{
      const image=await loadPage(root+filename+'?v=8',groups[index]);
      if(image){
        profile.pages[index]=image;
        profile.loaded++;
      }
    }));
    return profile;
  }

  async function load(){
    for(const scale of [preferredScale,preferredScale===2?4:2]){
      try{
        const profile=await loadProfile(scale,scale===preferredScale);
        if(profile.loaded===profile.pages.length){
          active=profile;
          state='ready';
          return;
        }
        if(!active||profile.loaded>active.loaded)active=profile;
      }catch(error){
        console.warn('HD atlas profile unavailable:',scale,error);
      }
    }
    state=active?.loaded?'partial':'fallback';
    console.warn('Using original sprites where HD textures are unavailable.');
  }

  load();
})();
