'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function canvas(){
  const s={fills:[],strokes:[],paths:0,vertices:[]};
  const c={
    save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){s.paths++;},
    ellipse(){},fill(){s.fills.push(c.fillStyle);},stroke(){s.strokes.push(c.strokeStyle);},
    closePath(){},clip(){},arc(){},moveTo(x,y){s.vertices.push([x,y]);},lineTo(x,y){s.vertices.push([x,y]);},fillRect(){},
    createLinearGradient(){return{addColorStop(){}};},
    get data(){return s;}
  };
  return c;
}
const sandbox={window:{BounceRemaster:{quality:'remastered'}},Math,console};
sandbox.globalThis=sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('remaster/forms.js','utf8'),sandbox);
vm.runInContext(fs.readFileSync('remaster/world.js','utf8'),sandbox);
const api=sandbox.window.BounceRemaster;
const fills=[];
for(let form=0;form<3;form++){
  const ctx=canvas();
  assert.equal(api.drawRemadeForm(ctx,{
    form,x:50,y:75,r:16,rotation:.2,eyeFrame:0,vx:100,vy:-60,grounded:false
  }),true);
  assert.ok(ctx.data.paths>=6,'Each form must contain body and eyes');
  fills.push(ctx.data.fills.join('|'));
}
assert.notEqual(fills[0],fills[1],'Bumpy must be independently redrawn');
assert.notEqual(fills[1],fills[2],'Wolly must be independently redrawn');
assert.notEqual(fills[0],fills[2]);
assert.equal(api.drawRemadeForm(canvas(),{form:3,x:0,y:0,r:15}),false);
assert.equal(api.drawRemadeProp(canvas(),357,100,180),true);
assert.equal(api.drawRemadeProp(canvas(),358,100,180),true);
assert.equal(api.drawRemadeProp(canvas(),0,100,180),false);
const polygon={color:0x70ad54,vertices:[{x:10,y:25},{x:35,y:25},{x:40,y:48}],
  faces:[0,1,2,0,2,1]};
const ctx=canvas();
assert.equal(api.drawRemadeTerrain(ctx,polygon,v=>v),true);
assert.ok(ctx.data.paths>=1);
assert.deepEqual(ctx.data.vertices.slice(0,3),ctx.data.vertices.slice(3,6),
  "Opposite source windings must fill identically in HD");
sandbox.window.BounceRemaster.quality='classic';
assert.equal(api.drawRemadeForm(canvas(),{form:0,x:10,y:20,r:16}),false);
assert.equal(api.drawRemadeProp(canvas(),357,100,180),false);
assert.equal(api.drawRemadeTerrain(canvas(),polygon,v=>v),false);
const game=fs.readFileSync('game.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const book=fs.readFileSync('remaster/book.js','utf8');
assert.match(game,/BounceRemaster\?\.drawRemadeForm\?\.\(ctx/);
assert.match(game,/BounceRemaster\?\.drawRemadeProp\?\.\(ctx,id,x,y\)/);
assert.match(game,/BounceRemaster\?\.drawRemadeTerrain\?\.\(ctx,poly,screenPoint\)/);
assert.match(game,/if\(window.BounceRemaster\?\.drawScenery\?\.\(/);
assert.match(index,/remaster\/forms\.js\?v=14/);
assert.match(index,/remaster\/world\.js\?v=23/);
assert.match(book,/api.drawTitleBook=drawTitleBook/);
console.log('Remake vector forms: 3 distinct forms, two rock mound variants, seam-free terrain and exact Classic fallback verified.');
