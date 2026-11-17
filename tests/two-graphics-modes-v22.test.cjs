'use strict';
/* Exactly two selectable modes, migration of saved preferences and adaptive
 * image resolution without involuntary fallback into pixelated Classic. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('remaster/remaster.js','utf8');
function load({legacy=null,current=null,mobile=false}={}){
  const data={'tscesar-bounce-remaster-quality-v1':legacy,
              'tscesar-bounce-remaster-quality-v2':current};
  const nodes=[],keys={},attrs={};
  let now=1000;
  function element(tag){
    const n={tagName:tag.toUpperCase(),dataset:{},attributes:{},children:[],
      textContent:'',style:{},
      setAttribute(k,v){this.attributes[k]=v;},
      addEventListener(type,cb){(this.handlers??={})[type]=cb;},
      append(...ch){this.children.push(...ch);},
      querySelector(selector){
        if(selector==='[data-remaster-mode]')
          return this.children.find(x=>x.dataset.remasterMode);
        return null;
      }};
    nodes.push(n);return n;
  }
  const doc={
    readyState:'interactive',
    body:{appendChild(el){this.toolbar=el;}},
    documentElement:{dataset:{}},
    createElement:element,
    addEventListener(type,cb){keys['doc:'+type]=cb;}
  };
  const ctx={
    imageSmoothingEnabled:false,setTransform(){},
    save(){},restore(){},fillRect(){},
    createLinearGradient(){return{addColorStop(){}};}
  };
  const canvas={width:240,height:320,
    getBoundingClientRect:()=>({width:mobile?390:660,
      height:mobile?520:880})};
  const window={
    devicePixelRatio:mobile?2:2,
    addEventListener(type,cb){keys[type]=cb;},
    setTimeout(){},
  };
  const sandbox={document:doc,window,Math,console,
    matchMedia:()=>({matches:mobile}),
    localStorage:{getItem:k=>data[k],setItem:(k,v)=>{data[k]=v;}},
    performance:{now:()=>now}};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'remaster/remaster.js'});
  const toolbar=doc.body.toolbar;
  const button=toolbar.querySelector('[data-remaster-mode]');
  return {api:window.BounceRemaster,button,doc,ctx,canvas,data,keys,
    advance:ms=>{now+=ms;}};
}
for(const saved of [null,'hd','ultra','remastered']){
  const f=load({legacy:saved});
  assert.equal(f.api.quality,'remastered','migrate previous enhanced preset');
  assert.deepEqual([...f.api.qualityOptions],['classic','remastered']);
  assert.equal(f.button.textContent,'REMASTERIZADO');
  assert.equal(f.button.dataset.shortLabel,'REMASTER');
  assert.equal(f.button.attributes['aria-pressed'],'true');
  assert.equal(f.doc.documentElement.dataset.bounceRemaster,'remastered');
  f.button.handlers.click();
  assert.equal(f.api.quality,'classic');
  assert.equal(f.button.textContent,'CLÁSICO');
  assert.equal(f.button.attributes['aria-pressed'],'false');
  f.button.handlers.click();
  assert.equal(f.api.quality,'remastered');
  assert.equal(f.api.setQuality('hd'),false);
  assert.equal(f.api.setQuality('ultra'),false);
  assert.equal(f.api.quality,'remastered');
  assert.equal(f.data['tscesar-bounce-remaster-quality-v2'],'remastered');
}
const storedClassic=load({legacy:'classic'});
assert.equal(storedClassic.api.quality,'classic');
const storedNew=load({legacy:'classic',current:'remastered'});
assert.equal(storedNew.api.quality,'remastered','new preference wins');
for(const mobile of [false,true]){
  const f=load({mobile});
  const api=f.api;
  api.beginFrame(f.ctx,f.canvas);
  assert.equal(f.ctx.imageSmoothingEnabled,true);
  const budget=mobile?1300000:3200000;
  assert.ok(f.canvas.width*f.canvas.height<=budget+4000);
  for(let i=0;i<125;i++){
    f.advance(49);
    api.beginFrame(f.ctx,f.canvas);
  }
  assert.equal(api.quality,'remastered','frame drops must not change visual mode');
  assert.ok(api.renderResolutionFactor>=.84&&api.renderResolutionFactor<1,
    'sustained low FPS should reduce resolution only');
  for(let i=0;i<450;i++){
    f.advance(16);
    api.beginFrame(f.ctx,f.canvas);
  }
  assert.ok(api.renderResolutionFactor>.84,'recovered FPS restores pixel density');
  const key=f.keys.keydown;
  let prevented=0;
  key({code:'KeyH',repeat:false,ctrlKey:false,altKey:false,metaKey:false,
    target:{tagName:'DIV'},preventDefault(){prevented++;}});
  assert.equal(api.quality,'classic');
  api.beginFrame(f.ctx,f.canvas);
  assert.equal(f.canvas.width,240);assert.equal(f.canvas.height,320);
  assert.equal(f.ctx.imageSmoothingEnabled,false);
  key({code:'KeyH',repeat:false,ctrlKey:false,altKey:false,metaKey:false,
    target:{tagName:'DIV'},preventDefault(){prevented++;}});
  assert.equal(api.quality,'remastered');
  assert.equal(prevented,2);
}
console.log('V22 quality: exactly Classic / Remasterizado, old settings migrated, 2-way UI, DPR capped and no automatic style fallback.');
