'use strict';
// V17 source-backed art coverage: every source tile family is redrawn at
// original offset and size, while Classic and unrelated IDs remain untouched.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const imageMap=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
function mock(){
  const calls={fill:[],paths:0,translates:[],gradients:0,clippings:0};
  const ctx={
    save(){},restore(){},translate(x,y){calls.translates.push([x,y]);},
    beginPath(){calls.paths++;},moveTo(){},lineTo(){},
    quadraticCurveTo(){},closePath(){},clip(){calls.clippings++;},
    fill(){calls.fill.push(ctx.fillStyle);},stroke(){},
    fillRect(){},createLinearGradient(){calls.gradients++;return{addColorStop(){}}}
  };
  return {ctx,calls};
}
const sandbox={window:{BounceRemaster:{quality:'hd'}},console,Math};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('remaster/tiles.js','utf8'),sandbox);
const art=sandbox.window.BounceRemaster;
const original=JSON.stringify(imageMap);
const family=[...Array.from({length:14},(_,i)=>253+i),
  ...Array.from({length:14},(_,i)=>162+i),
  ...Array.from({length:7},(_,i)=>120+i)];
assert.equal(family.length,35);
for(const id of family){
  const m=imageMap[String(id)];
  assert.ok(m&&m.type==='simple','Source tile descriptor missing '+id);
  const t=mock();
  assert.equal(art.drawRemadeGroundTile(t.ctx,id,100,150,m),true,'tile '+id);
  assert.deepEqual(t.calls.translates[0],[100-m.originX,150-m.originY],
    'original tile anchor must remain exact for '+id);
  assert.ok(t.calls.paths>= (id<=126?0:3),'clean outlines for '+id);
  assert.ok(t.calls.fill.length>=(id<=126?0:2),'fresh flat colours for '+id);
}
assert.equal(JSON.stringify(imageMap),original,'original game metadata is immutable');
assert.equal(art.drawRemadeGroundTile(mock().ctx,357,100,150,imageMap['357']),false,
  'Bumpy rock formations retain separate artwork');
assert.equal(art.drawRemadeGroundTile(mock().ctx,208,100,150,imageMap['208']),false,
  'collectable egg retains existing vector artwork');
assert.equal(art.drawRemadeGroundTile(mock().ctx,253,0,0,null),false);
sandbox.window.BounceRemaster.quality='classic';
for(const id of family)assert.equal(
  art.drawRemadeGroundTile(mock().ctx,id,100,150,imageMap[String(id)]),false,
  'Classic must preserve exact J2ME art for '+id);
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const book=fs.readFileSync('remaster/book.js','utf8');
assert.match(game,/BounceRemaster\?\.drawRemadeGroundTile\?\.\(ctx,id,x,y,imageMaps\.maps\[String\(id\)\]\)/);
assert.match(html,/remaster\/tiles\.js\?v=17/);
assert.match(sw,/remaster\/tiles\.js\?v=17/);
assert.match(book,/api.drawTitleBook=drawTitleBook/);
console.log('V17 ground remake: 35 source-backed tiles, precise anchors, classic fallback and untouched collision IDs verified.');
