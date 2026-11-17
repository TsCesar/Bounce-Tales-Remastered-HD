'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const maps=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
const root={window:{BounceRemaster:{quality:'ultra'}},Math,console};
vm.createContext(root);
vm.runInContext(fs.readFileSync('remaster/residual.js','utf8'),root);
const art=root.window.BounceRemaster;
function mock(){
  const count={fills:0,strokes:0,paths:0,shifts:[],scales:[]};
  const ctx={
    save(){},restore(){},translate(x,y){count.shifts.push([x,y]);},
    rotate(){},scale(x,y){count.scales.push([x,y]);},clip(){},
    beginPath(){count.paths++;},moveTo(){},lineTo(){},closePath(){},
    bezierCurveTo(){},quadraticCurveTo(){},arc(){},ellipse(){},
    fill(){count.fills++;},stroke(){count.strokes++;},
    createLinearGradient(){return{addColorStop(){}}}
  };
  return {ctx,count};
}
assert.equal(art.residualSpriteIds.length,13);
for(const id of art.residualSpriteIds){
  const m=maps[String(id)];assert.ok(m,'source descriptor '+id);
  const {ctx,count}=mock();
  assert.equal(art.drawRemadeResidualSprite(ctx,id,100,150,m),true);
  assert.ok(count.paths>=1,'missing illustration '+id);
  assert.ok(count.fills>=1||count.strokes>=1,'invisible art '+id);
  if(id===343||id===344)assert.deepEqual(count.shifts[0],[100,150]);
  else assert.deepEqual(count.shifts[0],[100-m.originX,150-m.originY]);
}
for(const id of [208,334,342,354,357,358,381]){
  assert.equal(art.drawRemadeResidualSprite(mock().ctx,id,100,150,maps[String(id)]),false);
}
root.window.BounceRemaster.quality='classic';
for(const id of art.residualSpriteIds)
  assert.equal(art.drawRemadeResidualSprite(mock().ctx,id,100,150,maps[String(id)]),false);
console.log('V21 13 original residual sprites: accurate source offsets, visible drawings and exact Classic fallback.');
