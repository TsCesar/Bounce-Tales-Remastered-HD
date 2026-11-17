'use strict';
// Source-grounded V19 regression checks. Verify real RLEF level usage, exact
// source sprite anchors and fallbacks without any physics or book mutations.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const RLEF=require('../src/rlef-reader.js');
const maps=JSON.parse(fs.readFileSync('src/image-map.json','utf8')).maps;
const snap=JSON.stringify(maps);
function fakeCanvas(){
  const calls={fills:0,rects:0,paths:0,texts:[],translations:[],rotations:[],gradients:0};
  const c={
    save(){},restore(){},translate(x,y){calls.translations.push([x,y]);},
    rotate(n){calls.rotations.push(n);},scale(){},
    beginPath(){calls.paths++;},moveTo(){},lineTo(){},
    bezierCurveTo(){},quadraticCurveTo(){},closePath(){},
    ellipse(){},arc(){},rect(){},clip(){},
    fill(){calls.fills++;},stroke(){},
    fillRect(){calls.rects++;},fillText(t){calls.texts.push(t);},
    createLinearGradient(){calls.gradients++;return{addColorStop(){}}}
  };
  return {ctx:c,calls};
}
const sandbox={window:{BounceRemaster:{quality:'remastered'}},console,Math};
vm.createContext(sandbox);
for(const file of ['remaster/structures.js','remaster/finishing.js']){
  vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
}
const art=sandbox.window.BounceRemaster;
assert.equal(art.structuralIds.length,6);
assert.equal(art.signIds.length,11);
assert.equal(art.fragmentIds.length,3);
for(const id of art.structuralIds){
  const m=maps[String(id)],{ctx,calls}=fakeCanvas();
  assert.ok(m&&m.type==='simple','missing original structure descriptor '+id);
  assert.equal(art.drawRemadeStructure(ctx,id,80,100,m),true);
  assert.equal(calls.translations[0][0],80-m.originX);
  assert.equal(calls.translations[0][1],100-m.originY);
  assert.ok(calls.rects>=1,'surface not filled '+id);
}
for(const id of art.signIds){
  const m=maps[String(id)],{ctx,calls}=fakeCanvas();
  assert.ok(m&&m.type==='simple','missing original sign descriptor '+id);
  assert.equal(art.drawRemadeSign(ctx,id,180,220,m),true);
  assert.equal(calls.translations[0][0],180-m.originX);
  assert.equal(calls.translations[0][1],220-m.originY);
  assert.ok(calls.paths>0,'unpainted sign '+id);
}
assert.equal(JSON.stringify(maps),snap,'sprite metadata must be unchanged');
const clock=fakeCanvas();
assert.equal(art.drawRemadeHud(clock.ctx,{collected:5,total:12,seconds:93}),true);
assert.ok(clock.calls.texts.includes('5 / 12'));
assert.ok(clock.calls.texts.includes('1:33'));
assert.equal(art.drawRemadeHud(fakeCanvas().ctx,{collected:0,total:0,seconds:NaN}),false);
for(const id of art.fragmentIds){
  const c=fakeCanvas();
  assert.equal(art.drawRemadeFragment(c.ctx,id,20,40,2),true);
  assert.ok(c.calls.paths>=2,'missing fragment art '+id);
}
assert.equal(art.drawRemadeFragment(fakeCanvas().ctx,208,20,40,0),false);
assert.equal(art.drawRemadeStructure(fakeCanvas().ctx,357,20,40,maps['357']),false);
assert.equal(art.drawRemadeSign(fakeCanvas().ctx,130,20,40,maps['130']),false);
const originalUsage=new Map();
for(const name of 'bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ')){
  const level=RLEF.parse(fs.readFileSync(path.join('assets/original',name)));
  for(const object of level.objects){
    if(object.type!=='sprite')continue;
    for(const sprite of object.sprites)originalUsage.set(sprite[2],
      (originalUsage.get(sprite[2])||0)+1);
  }
}
for(const id of art.structuralIds)
  assert.ok((originalUsage.get(id)||0)>0,'structure must be in a REAL chapter '+id);
assert.ok(art.structuralIds.reduce((sum,id)=>sum+(originalUsage.get(id)||0),0)>=800,
  'The six chosen structure IDs should replace hundreds of repeated sprites');
sandbox.window.BounceRemaster.quality='classic';
for(const id of art.structuralIds)
  assert.equal(art.drawRemadeStructure(fakeCanvas().ctx,id,20,40,maps[String(id)]),false);
for(const id of art.signIds)
  assert.equal(art.drawRemadeSign(fakeCanvas().ctx,id,20,40,maps[String(id)]),false);
assert.equal(art.drawRemadeHud(fakeCanvas().ctx,{collected:1,total:1,seconds:1}),false);
assert.equal(art.drawRemadeFragment(fakeCanvas().ctx,390,20,40,0),false);
const game=fs.readFileSync('game.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const book=fs.readFileSync('remaster/book.js','utf8');
for(const name of ['structures','finishing']){
  const version=name==='structures'?22:19;
  assert.ok(html.includes('remaster/'+name+'.js?v='+version));
  assert.ok(sw.includes('remaster/'+name+'.js?v='+version));
}
for(const name of ['drawRemadeStructure','drawRemadeSign','drawRemadeHud','drawRemadeFragment'])
  assert.ok(game.includes('BounceRemaster?.'+name+'?.('),'not wired '+name);
assert.match(book,/api.drawTitleBook=drawTitleBook/);
console.log('V19 remaster: 6 structural sprite families (800+ uses), 11 source signs, HD HUD, 3 debris sprites and exact Classic fallback OK.');
