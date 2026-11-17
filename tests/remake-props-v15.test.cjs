'use strict';
// The four enemy classes and every animated prop must remain independent
// of physics/levels. Draw into a real Canvas-like API mock and check routing.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function mock(){
  const calls={paths:0,fill:[],stroke:[],rects:0,translate:0,rotate:[]};
  const c={save(){},restore(){},translate(){calls.translate++;},
    rotate(a){calls.rotate.push(a);},scale(){},beginPath(){calls.paths++;},
    moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},
    closePath(){},rect(){calls.rects++;},clip(){},fillRect(){calls.rects++;},
    ellipse(){},arc(){},fill(){calls.fill.push(c.fillStyle);},
    stroke(){calls.stroke.push(c.strokeStyle);},
    createLinearGradient(){return{addColorStop(){}};}
  };
  return {ctx:c,calls};
}
const sandbox={window:{BounceRemaster:{quality:'hd'}},Math,console};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('remaster/props.js','utf8'),sandbox);
const art=sandbox.window.BounceRemaster;
const pal=[];
for(const id of [490,497,509]){
  const m=mock();
  assert.equal(art.drawRemadeTrampoline(m.ctx,{x:80,y:110,imageId:id,frame:0,active:false}),true);
  assert.ok(m.calls.paths>=19,'source spring '+id+' should have boards and coils');
  pal.push(m.calls.fill.join('|'));
  const animated=mock();
  assert.equal(art.drawRemadeTrampoline(animated.ctx,
    {x:80,y:110,imageId:id,frame:2,active:true}),true);
  assert.ok(animated.calls.paths>=19,'source spring animation '+id);
}
assert.equal(new Set(pal).size,3,'all spring palettes must be different');
assert.equal(art.drawRemadeTrampoline(mock().ctx,{x:0,y:0,imageId:100,frame:0}),false);
for(const type of [0,1,2,3]){
  const c=mock();
  assert.equal(art.drawRemadeEnemy(c.ctx,
    {type,x:90,y:130,state:type===2?1:0,propelType:1,
      molePeekTimer:500,molePeekPeriod:800,time:2}),true);
  assert.ok(c.calls.paths>=6,'enemy '+type+' must be drawn');
}
const cannon=mock();
assert.equal(art.drawRemadeCannon(cannon.ctx,
  {x:80,y:130,angle:.8,active:true,animMs:600}),true);
assert.ok(cannon.calls.rotate.some(a=>a<0),'cannon must follow aim orientation');
assert.ok(cannon.calls.paths>=10,'cannon body, muzzle, base and effects');
assert.equal(art.drawRemadeFriend(mock().ctx,{x:50,y:70,time:2}),true);
assert.equal(art.drawRemadeEnemy(mock().ctx,{type:4,x:50,y:70}),false);
assert.equal(art.propArtVersion,15);
sandbox.window.BounceRemaster.quality='classic';
for(const fn of [()=>art.drawRemadeTrampoline(mock().ctx,{x:0,y:0,imageId:497}),
  ()=>art.drawRemadeEnemy(mock().ctx,{type:0,x:0,y:0}),
  ()=>art.drawRemadeCannon(mock().ctx,{x:0,y:0}),
  ()=>art.drawRemadeFriend(mock().ctx,{x:0,y:0})]){
  assert.equal(fn(),false,'Classic path must keep original art');
}
const game=fs.readFileSync('game.js','utf8');
const page=fs.readFileSync('index.html','utf8');
const book=fs.readFileSync('remaster/book.js','utf8');
const forms=fs.readFileSync('remaster/forms.js','utf8');
for(const method of ['drawRemadeCannon','drawRemadeTrampoline','drawRemadeFriend','drawRemadeEnemy']){
  assert.ok(game.includes('BounceRemaster?.'+method+'?.('),'unwired '+method);
}
assert.ok(page.includes('remaster/props.js?v=15'));
assert.match(book,/api.drawTitleBook=drawTitleBook/);
assert.match(forms,/art.drawRemadeForm=drawRemadeForm/);
console.log('V15 vector props: all 3 spring families, 4 enemy classes, aimed cannon, NPC, classic fallback OK.');
