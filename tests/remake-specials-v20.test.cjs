'use strict';
/* V20 special art regression: six remaining source-identified sprites with
 * no transformations to physics, source maps, scene flags or the book.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const RLEF=require('../src/rlef-reader.js');
const maps=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
function canvas(){
  const calls={paths:0,fills:0,strokes:0,shifts:[],gradients:0};
  const ctx={save(){},restore(){},translate(x,y){calls.shifts.push([x,y]);},
    beginPath(){calls.paths++;},moveTo(){},lineTo(){},closePath(){},
    bezierCurveTo(){},quadraticCurveTo(){},ellipse(){},arc(){},
    fill(){calls.fills++;},stroke(){calls.strokes++;},fillRect(){},
    createLinearGradient(){calls.gradients++;return{addColorStop(){}}}};
  return {ctx,calls};
}
const sandbox={window:{BounceRemaster:{quality:'ultra'}},Math,console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('remaster/specials.js','utf8'),sandbox);
const art=sandbox.window.BounceRemaster;
const ids=[334,342,345,350,351,354];
assert.equal(art.specialSpriteIds.length,ids.length);
const usage=new Map();
for(const name of 'bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ')){
  const level=RLEF.parse(fs.readFileSync(path.join('assets/original',name)));
  for(const o of level.objects){
    if(o.type!=='sprite')continue;
    for(const sprite of o.sprites)
      usage.set(sprite[2],(usage.get(sprite[2])||0)+1);
  }
}
for(const id of ids){
  const meta=maps[String(id)];
  assert.ok(meta,'source descriptor for '+id);
  assert.ok((usage.get(id)||0)>0,'original level must contain '+id);
  const {ctx,calls}=canvas();
  assert.equal(art.drawRemadeSpecial(ctx,id,120,180,meta),true,'special '+id);
  assert.ok(calls.paths>=1||id===354,'no new illustration for '+id);
  assert.ok(calls.fills>=1||calls.strokes>=1||id===354,'no visible artwork for '+id);
  assert.deepEqual(calls.shifts[0],[120,180],
    'dynamic compound must use unchanged world position '+id);
}
for(const id of [337,357,358,381,390])
  assert.equal(art.drawRemadeSpecial(canvas().ctx,id,100,130,maps[String(id)]),false);
sandbox.window.BounceRemaster.quality='classic';
for(const id of ids)
  assert.equal(art.drawRemadeSpecial(canvas().ctx,id,100,130,maps[String(id)]),false);
console.log('V20 special remakes: source-backed stone tower, lightning, orange shaft, portal, mushroom house and gradient strip OK.');
