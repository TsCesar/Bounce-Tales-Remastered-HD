'use strict';
/* Exercised without Chromium: hard limits and image-loading decisions are
 * deterministic and should never depend on screenshots or frame timing.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function fixture(mobile){
  const requests=[],images=[],listeners=new Map();
  class FakeImage{
    constructor(){this.complete=false;this.naturalWidth=0;images.push(this);}
    set src(url){this._src=url;requests.push(url);}
    get src(){return this._src;}
  }
  const localStorage={getItem:()=>null,setItem:()=>{}};
  const doc={readyState:'loading',documentElement:{dataset:{}},
    addEventListener(n,fn){listeners.set(n,fn);}};
  const context={document:doc,localStorage,console,Image:FakeImage,
    matchMedia:()=>({matches:mobile}),devicePixelRatio:3,
    addEventListener(n,fn){listeners.set('window:'+n,fn);},
    fetch:async()=>{throw new Error('Fetch not configured');},
    performance:{now:()=>1000}};
  context.window=context;
  vm.createContext(context);
  return {context,requests,images,run(path){vm.runInContext(fs.readFileSync(path,'utf8'),context,{filename:path});}};
}
function fakeRect(width,height){
  return {width,height,left:0,top:0};
}
function ensureBounded(mobile){
  const box=fixture(mobile);
  box.run('remaster/remaster.js');
  const api=box.context.BounceRemaster;
  const width=mobile?430:1920,height=mobile?573:2560;
  const canvas={width:240,height:320,getBoundingClientRect:()=>fakeRect(width,height)};
  const ctx={imageSmoothingEnabled:false,setTransform(){}};
  assert.equal(api.setQuality('remastered'),true);
  assert.equal(api.setQuality('ultra'),false,'Removed third mode must be rejected');
  assert.equal(api.quality,'remastered');
  assert.deepEqual([...api.qualityOptions],['classic','remastered']);
  api.beginFrame(ctx,canvas);
  assert.equal(ctx.imageSmoothingEnabled,true,'remaster must use antialiasing');
  const budget=mobile?1300000:3200000;
  assert.ok(canvas.width*canvas.height<=budget+4000,
    'Large high-DPI screens must not create giant framebuffers');
  assert.ok(canvas.width<=2800&&canvas.height<=2800);
  assert.ok(canvas.width>=240&&canvas.height>=320);
  api.setQuality('classic');api.beginFrame(ctx,canvas);
  assert.equal(ctx.imageSmoothingEnabled,false,'classic must retain pixel edges');
  assert.equal(canvas.width,240);
  assert.equal(canvas.height,320);
  return box;
}
async function checkTextures(mobile){
  const box=fixture(mobile);
  box.context.BounceRemaster={quality:'remastered'};
  const expectedScale=mobile?2:4,folder=mobile?'mobile':'hd';
  const sprites=Object.fromEntries(Array.from({length:326},(_,id)=>[
    String(id),{page:0,x:0,y:0,w:expectedScale,h:expectedScale,
      logicalW:1,logicalH:1,originX:0,originY:0,sampling:'pixel'}
  ]));
  box.context.fetch=async (url)=>{
    assert.ok(url.includes('assets/'+folder+'/manifest.json?v=8'));
    return {ok:true,json:async()=>({version:4,scale:expectedScale,
      spriteCount:326,pages:['hd-00.png'],sprites})};
  };
  box.run('remaster/texture-hd.js');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(box.context.BounceRemaster.textureStatus().atlasScale,expectedScale);
  assert.ok(box.requests.some(url=>url.includes('assets/'+folder+'/hd-00.png?v=8')));
  assert.equal(box.images.length,1,'Only the appropriate atlas profile loads');
}
function checkScenery(mobile){
  const box=fixture(mobile);
  box.context.BounceRemaster={quality:'remastered'};
  box.run('remaster/scenery.js');
  const api=box.context.BounceRemaster;
  assert.equal(box.images.length,0,'No background should preload on menu');
  // While assets load, the canvas receives a simple illustrated fallback.
  const ctx={
    save(){},restore(){},createLinearGradient(){return {addColorStop(){}};},
    fillRect(){},beginPath(){},moveTo(){},bezierCurveTo(){},lineTo(){},
    closePath(){},fill(){}
  };
  api.drawScenery(ctx,0,0,0,0);
  assert.equal(box.images.length,1);
  api.drawScenery(ctx,5,0,0,0);
  api.drawScenery(ctx,10,0,0,0);
  assert.equal(api.sceneryStatus().cachedBackdrops,mobile?1:2);
  api.drawScenery(ctx,0,0,0,0);
  assert.ok(api.sceneryStatus().cachedBackdrops<= (mobile?1:2));
}
(async()=>{
  ensureBounded(false);
  ensureBounded(true);
  await checkTextures(false);
  await checkTextures(true);
  checkScenery(false);
  checkScenery(true);
  const game=fs.readFileSync('game.js','utf8');
  assert.match(game,/function syncMenuTextResolution/);
  assert.match(game,/const budget=coarse\?1300000:3200000/);
  assert.match(game,/function draw\(\)\{\s*window\.BounceRemaster\?\.beginFrame\?\.\(ctx,canvas\);\s*\/\/[^\n]+\s*syncMenuTextResolution\(\)/);
  console.log('Rendering/memory: capped game + text planes, 2x mobile/4x desktop, 1–2 lazy scenery images verified.');
})().catch(error=>{console.error(error);process.exitCode=1;});
