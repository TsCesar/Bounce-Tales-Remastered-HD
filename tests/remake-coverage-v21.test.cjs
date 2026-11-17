'use strict';
/* Enforce HD/Ultra artwork coverage for EVERY sprite ID referenced directly
 * by the fifteen source RLEF chapter files. This is distinct from testing
 * all possible dynamic animations, menus or device-specific rendering.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const RLEF=require('../src/rlef-reader.js');
const atlas=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
const sandbox={window:{BounceRemaster:{quality:'remastered'}},Math,console};
vm.createContext(sandbox);
for(const file of ['remaster/tiles.js','remaster/decor.js',
  'remaster/structures.js','remaster/finishing.js',
  'remaster/specials.js','remaster/residual.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const art=sandbox.window.BounceRemaster;
const painted=new Set([
  ...art.groundTileIds,...art.decorSpriteIds,...art.structuralIds,
  ...art.signIds,...art.specialSpriteIds,...art.residualSpriteIds,
  357,358
]);
function covered(id,depth=0){
  if(painted.has(id))return true;
  if(depth>20)return false;
  const map=atlas[String(id)];
  if(!map)return false;
  if(map.type==='compound')return map.parts.every(part=>covered(part[2],depth+1));
  if(map.type==='animated')return map.frames.every(child=>covered(child,depth+1));
  return false;
}
const used=new Map();
const files='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
for(const name of files){
  const level=RLEF.parse(fs.readFileSync(path.join('assets/original',name)));
  for(const object of level.objects){
    if(object.type!=='sprite')continue;
    for(const [x,y,id] of object.sprites)
      used.set(id,(used.get(id)||0)+1);
  }
}
assert.equal(files.length,15);
const remaining=[...used.keys()].filter(id=>!covered(id)).sort((a,b)=>a-b);
assert.deepEqual(remaining,[],'Unremade original in-level sprites');
assert.equal(used.size,89,'Source sprite audit baseline changed, re-audit all levels');
assert.equal([...used.values()].reduce((a,b)=>a+b,0),4531,
  'RLEF sprite-placement baseline changed, re-audit all levels');
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
assert.match(game,/BounceRemaster\?\.drawRemadeResidualSprite\?\.\(ctx,id,x,y,imageMaps.maps\[String\(id\)\]\)/);
assert.match(html,/remaster\/residual\.js\?v=21/);
assert.match(sw,/remaster\/residual\.js\?v=21/);
assert.match(fs.readFileSync('remaster/book.js','utf8'),/api.drawTitleBook=drawTitleBook/);
assert.match(fs.readFileSync('remaster/forms.js','utf8'),/art.drawRemadeForm=drawRemadeForm/);
console.log('V21: all '+used.size+' direct RLEF sprite IDs across 15 levels / 4,531 placements have a remake rendering path.');
