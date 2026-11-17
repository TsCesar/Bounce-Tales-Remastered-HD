'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {RockBreak,MIN_SPEED,segmentTouches}=require('../src/rock-break.js');
const RLEF=require('../src/rlef-reader.js');
const root=path.resolve(__dirname,'..');
const atlas=JSON.parse(fs.readFileSync(path.join(root,'src/image-map.json'),'utf8'));
const campaign='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
let rockStages=0;
for(const resource of campaign){
  const stage=RLEF.parse(fs.readFileSync(path.join(root,'assets/original',resource)));
  const logic=new RockBreak(stage.objects,{imageMaps:atlas});
  if(logic.objects.length)rockStages++;
  const world=RLEF.buildWorld(stage.objects);
  const available=logic.objects.find(o=>!((o.flags||0)&0x80));
  if(!available)continue;
  const box=logic.bounds(available,world);
  assert.ok(box&&box.left<box.right&&box.bottom<box.top,'rock bounding box must be valid');
  const y=(box.bottom+box.top)/2;
  const current={x:box.left+1,y,forme:0,vx:MIN_SPEED+35,vy:0,radius:20};
  const previous={x:box.left-36,y};
  let breaks=0;
  const onBreak=({ids})=>{breaks++;assert.ok(ids.includes(available.id));};
  assert.equal(logic.update({body:current,previous,world,onBreak}),0,'normal Bounce must not break rock');
  assert.equal(breaks,0);
  current.forme=1;
  current.vx=MIN_SPEED-5;
  assert.equal(logic.update({body:current,previous:{x:current.x,y},world,onBreak}),0,
    'Bumpy must strike with meaningful velocity');
  current.vx=MIN_SPEED+35;
  assert.equal(logic.update({body:current,previous,world,onBreak}),1,
    'Bumpy should shatter the touched formation');
  assert.equal(breaks,1);
  assert.ok(logic.isBroken(available.id));
  assert.equal(logic.update({body:current,previous,world,onBreak}),0,
    'same formation must not break twice');
  logic.reset();
  assert.equal(logic.isBroken(available.id),false,'restart restores broken rock');
}
assert.ok(rockStages>=4,'campaign should contain original breakable rock-pile sprites');
assert.equal(segmentTouches({x:-50,y:0},{x:50,y:0},
  {left:0,right:10,bottom:-5,top:5}),true,'swept contact catches high-speed rock impacts');
assert.equal(segmentTouches({x:-50,y:30},{x:50,y:30},
  {left:0,right:10,bottom:-5,top:5}),false,'other objects remain unaffected');
console.log('Bumpy rock-wall interaction validated: campaign rock sprites, impact gate, fragments, once-only effect and chapter reset');
