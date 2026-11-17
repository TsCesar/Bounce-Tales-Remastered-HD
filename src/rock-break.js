/* Bounce Tales — Bumpy rock-pile impact.
 * Uses the original V62 image-map rock family (357 / 358) and original
 * source fragment animations. Level geometry, physics and RLEF are unchanged.
 *
 * Standalone, testable collision interaction. The original scripted visibility
 * events remain functional; broken rock visuals are skipped until chapter reset.
 */
(function(root,factory) {
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceRockBreak=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ROCK_IMAGES=new Set([357,358]);
  const DEFAULT_SCALE=43266/65536;
  const MIN_SPEED=60;
  function point(matrix,x,y){
    return {x:(matrix[0]*x+matrix[1]*y+matrix[2])/65536,
            y:(matrix[3]*x+matrix[4]*y+matrix[5])/65536};
  }
  function within(p,b){
    return p.x>=b.left&&p.x<=b.right&&p.y>=b.bottom&&p.y<=b.top;
  }
  // Swept contact prevents missing the pile at 60Hz on faster impacts.
  function segmentTouches(a,b,r){
    let enter=0,exit=1;
    const dx=b.x-a.x,dy=b.y-a.y;
    const pairs=[[-dx,a.x-r.left],[dx,r.right-a.x],[-dy,a.y-r.bottom],[dy,r.top-a.y]];
    for(const [p,q] of pairs){
      if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
      const t=q/p;
      if(p<0){if(t>exit)return false;if(t>enter)enter=t;}
      else{if(t<enter)return false;if(t<exit)exit=t;}
    }
    return true;
  }
  class RockBreak {
    constructor(objects, options={}){
      this.objects=(objects||[]).filter(o=>o?.type==='sprite'&&o.sprites?.some(
        s=>ROCK_IMAGES.has(s[2])));
      this.byId=new Map(this.objects.map(o=>[o.id,o]));
      this.images=options.imageMaps?.maps||options.imageMaps||{};
      this.scale=options.scale||DEFAULT_SCALE;
      this.broken=new Set();
    }
    reset(){this.broken.clear();}
    isBroken(id){return this.broken.has(id);}
    bounds(object,world){
      const slot=object?.sprites?.find(s=>ROCK_IMAGES.has(s[2]));
      if(!slot)return null;
      const img=this.images[String(slot[2])];
      if(!img||!img.width||!img.height)return null;
      const matrix=world?.get?.(object.id)||object.matrix;
      if(!matrix)return null;
      const anchor=point(matrix,slot[0],slot[1]);
      const inv=1/this.scale;
      return {
        left:anchor.x-(img.originX||0)*inv,
        right:anchor.x+(img.width-(img.originX||0))*inv,
        bottom:anchor.y+(img.originY-img.height)*inv,
        top:anchor.y+img.originY*inv,
        anchor
      };
    }
    update({body,previous,world,dt=1/60,onBreak}={}){
      if(!body||body.forme!==1||!this.objects.length)return 0;
      const prev=previous||{x:body.x,y:body.y};
      const now={x:body.x,y:body.y};
      const distance=Math.hypot(now.x-prev.x,now.y-prev.y);
      const speed=Math.max(Math.hypot(body.vx||0,body.vy||0),
        dt>0?distance/dt:0);
      if(speed<MIN_SPEED)return 0;
      const radius=Math.max(0,Number(body.radius)||20);
      let destroyed=0;
      for(const object of this.objects){
        if(this.broken.has(object.id))continue;
        const flags=object.runtimeFlags??object.flags??0;
        if(flags&0x80)continue; // Original story has hidden this variant.
        const b=this.bounds(object,world);
        if(!b)continue;
        const expanded={
          left:b.left-radius*.6,right:b.right+radius*.6,
          bottom:b.bottom-radius*.6,top:b.top+radius*.6
        };
        if(!segmentTouches(prev,now,expanded))continue;
        // A pile can be authored as both 357 (intact) and 358 (broken
        // appearance), sharing a transform parent and local vicinity.
        // Hide the whole paired formation, not an unrelated pile elsewhere.
        const ids=[];
        for(const other of this.objects){
          if(this.broken.has(other.id))continue;
          const ob=this.bounds(other,world);
          if(!ob)continue;
          const proximity=Math.hypot(ob.anchor.x-b.anchor.x,ob.anchor.y-b.anchor.y);
          if(other.id===object.id||
            (other.parent===object.parent&&proximity<290)){
            this.broken.add(other.id);
            ids.push(other.id);
          }
        }
        if(!ids.length)continue;
        destroyed++;
        if(typeof onBreak==='function')onBreak({
          ids,objectId:object.id,position:{x:b.anchor.x,y:b.anchor.y},
          impactSpeed:speed
        });
      }
      return destroyed;
    }
  }
  return {RockBreak,ROCK_IMAGES,MIN_SPEED,segmentTouches};
});
