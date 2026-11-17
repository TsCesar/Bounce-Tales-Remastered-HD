'use strict';
/* All 19 hand-drawn decorative assets retain their J2ME anchor rectangles.
 * Interactive hazards keep original collision geometry/flags elsewhere.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const images=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
const sandbox={window:{BounceRemaster:{quality:'ultra'}},Math,console};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('remaster/decor.js','utf8'),sandbox);
const art=sandbox.window.BounceRemaster;
function mock(){
 const state={paths:0,fills:0,translations:[],rotations:0};
 const ctx={save(){},restore(){},translate(x,y){state.translations.push([x,y]);},
   scale(){},rotate(){state.rotations++;},beginPath(){state.paths++;},
   ellipse(){},fill(){state.fills++;},stroke(){},
   moveTo(){},lineTo(){},bezierCurveTo(){},quadraticCurveTo(){},closePath(){}};
 return {ctx,state};
}
assert.equal(art.decorSpriteIds.length,19);
for(const id of art.decorSpriteIds){
 const meta=images[String(id)];
 assert.ok(meta&&meta.type==='simple','source metadata needed for '+id);
 const m=mock();
 assert.equal(art.drawRemadeDecor(m.ctx,id,120,140,meta),true,'decor '+id);
 assert.deepEqual(m.state.translations[0],[120-meta.originX,140-meta.originY],
   'wrong object anchor for '+id);
 assert.ok(m.state.paths>=1,'missing art paths for '+id);
 assert.ok(m.state.fills>=1,'missing fill for '+id);
}
for(const id of [208,357,358,497,509,490])
  assert.equal(art.drawRemadeDecor(mock().ctx,id,0,0,images[String(id)]),false,
    'decorations must not intercept source gameplay families '+id);
sandbox.window.BounceRemaster.quality='classic';
for(const id of art.decorSpriteIds)
  assert.equal(art.drawRemadeDecor(mock().ctx,id,120,140,images[String(id)]),false);
console.log('V18 decorative remake: 19 known sprite families, exact source anchors, hazards, Classic fallback verified.');
