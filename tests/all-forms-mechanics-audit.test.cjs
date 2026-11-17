'use strict';
// Full form-mechanics audit against src_decompiled/c.java's verified constants
// and the campaign's authored save/interaction rules.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {BounceBody,parameters:P}=require('../src/bounce-physics.js');
const Progress=require('../src/original-progression.js');
const Water=require('../src/original-water.js');
const Enemy=require('../src/original-enemies.js');
const RLEF=require('../src/rlef-reader.js');
const {RockBreak}=require('../src/rock-break.js');
const root=path.resolve(__dirname,'..');

const expected={
  radius:[20,20,20],gravity:[1,1.4,.5],friction:[.6,.3,.6],
  ricochet:[.1,.1,.1],movementAcceleration:[500,350,312.5],
  maximumMovementSpeed:[280,350,150],midairSuppression:[1.5,2.5,1.2],
  jumpAcceleration:[288,255,162.5],
};
for(const [name,values] of Object.entries(expected))assert.deepEqual(P[name],values,name);
assert.ok(Math.abs(P.maxJumpSlope-Math.cos(55*Math.PI/180))<1e-7);
const relativeJumps=[];
for(let form=0;form<3;form++){
  const ball=new BounceBody(0,100,2);
  ball.forme=form;ball.grounded=true;ball.slopeCosAbs=1;
  ball.jump();
  assert.equal(ball.pushY,expected.jumpAcceleration[form],'form '+form+' normal impulse');
  assert.equal(ball.grounded,false);
  ball.update(.016,43266/65536,16);
  relativeJumps.push(ball.vy);
  assert.equal(ball.radius,20);

  const short=new BounceBody(0,100,2);
  short.forme=form;short.grounded=true;short.slopeCosAbs=1;
  short.jump(true);
  assert.equal(short.pushY,expected.jumpAcceleration[form]/2);

  const wall=new BounceBody(0,100,2);
  wall.forme=form;wall.grounded=true;wall.slopeCosAbs=P.maxJumpSlope*.8;
  wall.jump(false);assert.equal(wall.pushY,0,'no jumping from steep walls');
  const air=new BounceBody(0,100,2);
  air.forme=form;air.grounded=false;air.jump();
  assert.equal(air.pushY,0,'no jumping while airborne');

  const grounded=new BounceBody(0,100,2);
  grounded.forme=form;grounded.grounded=true;grounded.moveRight();
  assert.equal(grounded.gravityX,expected.movementAcceleration[form]);
  const midair=new BounceBody(0,100,2);
  midair.forme=form;midair.grounded=false;midair.moveRight();
  assert.ok(Math.abs(midair.gravityX-
    expected.movementAcceleration[form]/expected.midairSuppression[form])<1e-8);

  const speedLimit=new BounceBody(0,100,2);
  speedLimit.forme=form;speedLimit.grounded=true;
  speedLimit.vx=P.maximumMovementSpeed[form]+1;
  speedLimit.moveRight();assert.equal(speedLimit.gravityX,0,'top speed gate');
  speedLimit.moveLeft();assert.ok(speedLimit.gravityX<0,'can brake from speed cap');
}
assert.ok(relativeJumps[2]>relativeJumps[0]&&relativeJumps[0]>relativeJumps[1],
  'Wolly jumps highest, Bounce middle and Bumpy lowest at launch');

// Hidden reward: boost is red-only; the other forms have identical movement.
for(let form=0;form<3;form++){
  const regular=new BounceBody(0,0,2),superBall=new BounceBody(0,0,2);
  regular.forme=form;superBall.forme=form;
  regular.grounded=superBall.grounded=true;
  regular.moveRight(false);superBall.moveRight(true);
  assert.equal(superBall.gravityX-regular.gravityX,form===0?50:0);
}

// Water's form-specific drag is taken from the original 1/gravity scaling.
const drags=[];
for(let form=0;form<3;form++){
  const obj={areaMinX:-300,areaMaxX:300,areaMinY:40,areaMaxY:-150,
    color:0x4466FF,gravityXLeft:0,gravityXRight:0,gravityYTop:0,gravityYBottom:0};
  const zone=Water.createZone(obj,[65536,0,0,0,65536,0]);
  const b={x:0,y:0,vx:100,vy:0,radius:20,forme:form,
    gravityX:0,gravityY:0,torqueX:0,torqueY:0};
  assert.equal(Water.updateZone(zone,b,{x:0,y:0},.1),true);
  drags.push(b.vx);
}
assert.ok(drags[2]<drags[0]&&drags[0]<drags[1],
  'Wolly responds to water drag differently from heavier Bumpy');

// The original enemy-type-1 bumper can be destroyed by Bumpy, whereas the
// two other ball forms are hit. Test it without modifying enemy logic.
for(let form=0;form<3;form++){
  const enemy={enemyType:1,id:123,x:0,y:0,dead:false};
  const b={forme:form,x:0,y:10,vx:0,vy:0};
  const hit=Enemy.collision(enemy,b,{x:0,y:10});
  assert.equal(hit?.type,form===1?'stomp':'player-hit','bumper versus form '+form);
  assert.equal(enemy.dead,form===1);
}

// Unlock order: Bumpy after chapter 4, Wolly after chapter 9.
const progress=Progress.create();
assert.equal(Progress.unlockedForme(progress),0);
assert.equal(Progress.superBounceUnlocked(progress),false);
for(let i=0;i<15;i++){
  const goldMs=([4,9,14].includes(i)?60000:Progress.TIMER_TROPHY_REQUIREMENTS[i*3]*1000);
  Progress.complete(progress,i,30,goldMs);
  if(i===3)assert.equal(progress.unlockedForme,1);
  if(i===8)assert.equal(progress.unlockedForme,2);
}
assert.equal(progress.unlockedForme,2);
assert.equal(Progress.superBounceUnlocked(progress),true,'secret gold-medal reward');
const state=JSON.parse(JSON.stringify(progress));
state.records[0].clearTime=Progress.TIMER_TROPHY_REQUIREMENTS[0]+1;
assert.equal(Progress.superBounceUnlocked(state),false,'missing time gold blocks secret');
state.records[0].clearTime=Progress.TIMER_TROPHY_REQUIREMENTS[0];
state.records[0].eggs=29;
assert.equal(Progress.superBounceUnlocked(state),false,'missing egg gold blocks secret');
state.records[0].eggs=30;
assert.equal(Progress.superBounceUnlocked(state),true);
const storage={v:'',getItem(){return this.v;},setItem(k,v){this.v=v;}};
Progress.save(storage,progress);
assert.equal(Progress.superBounceUnlocked(Progress.load(storage)),true,'secret survives save reload');

// All 15 stage files and authored rocks are inspected without touching RLEF.
const names='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
const images=JSON.parse(fs.readFileSync(path.join(root,'src/image-map.json'),'utf8'));
let rockLevels=0;
for(const name of names){
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  const rocks=new RockBreak(parsed.objects,{imageMaps:images});
  if(rocks.objects.length)rockLevels++;
  const world=RLEF.buildWorld(parsed.objects);
  const rock=rocks.objects.find(o=>!((o.flags??0)&0x80));
  if(!rock)continue;
  const bounds=rocks.bounds(rock,world);
  if(!bounds)continue;
  const b={x:bounds.left+1,y:(bounds.top+bounds.bottom)/2,
    forme:2,vx:200,vy:0,radius:20};
  assert.equal(rocks.update({body:b,previous:{x:b.x-30,y:b.y},world}),0,
    'Wolly does not break Bumpy-only rock');
  b.forme=0;
  assert.equal(rocks.update({body:b,previous:{x:b.x-30,y:b.y},world}),0,
    'red Bounce does not break Bumpy-only rock');
}
assert.ok(rockLevels>=4,'original stage catalogue must contain special rock formations');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const visuals=fs.readFileSync(path.join(root,'remaster/remaster.js'),'utf8');
assert.match(game,/body\\.moveRight\\(superBounce\\)/);
assert.match(game,/body\\.moveLeft\\(superBounce\\)/);
assert.match(visuals,/p\\.form !== 0/);
console.log('All forms audited: constants, jumps, midair control, slope gate, water, bumper enemies, Bumpy rocks, unlocks, Super Bounce reward, save and distinct visuals.');
