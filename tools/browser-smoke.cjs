'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.BOUNCE_TEST_URL||'http://127.0.0.1:8765/';
const screenshots=path.resolve('artifacts/browser');
fs.mkdirSync(screenshots,{recursive:true});
const scenarios=[
  {name:'desktop',viewport:{width:1366,height:768},dpr:1,mobile:false},
  {name:'retina-desktop',viewport:{width:1920,height:1080},dpr:2,mobile:false},
  {name:'touch-mobile',viewport:{width:390,height:844},dpr:2,mobile:true}
];
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  for(const c of scenarios){
   const context=await browser.newContext({viewport:c.viewport,
      deviceScaleFactor:c.dpr,isMobile:c.mobile,hasTouch:c.mobile,
      reducedMotion:'reduce',locale:'es-ES'});
   const page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',error=>errors.push(String(error)));
   page.on('response',response=>{
     if(response.status()>=400&&response.url().startsWith(base))
       missing.push(response.status()+' '+response.url());
   });
   try{
    const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:25000});
    assert.equal(response.status(),200);
    await page.waitForFunction(()=>document.getElementById('statusline')?.textContent?.includes('ORIGINAL LEVEL DATA LOADED'),null,{timeout:30000});
    await page.waitForFunction(()=>window.BounceRemaster?.textureStatus?.().spriteCount===326,null,{timeout:30000});
    await page.waitForTimeout(150);
    const info=await page.evaluate(()=>{
      const game=document.getElementById('game'),text=document.getElementById('game-text');
      const box=game.getBoundingClientRect();
      return {gamePixels:game.width*game.height,textPixels:text.width*text.height,
        width:box.width,height:box.height,
        scenery:window.BounceRemaster.sceneryStatus().cachedBackdrops,
        atlasScale:window.BounceRemaster.textureStatus().atlasScale};
    });
    const budget=c.mobile?1300000:3200000;
    assert.ok(info.gamePixels<=budget+4000,'game canvas too large');
    assert.ok(info.textPixels<=budget+4000,'text canvas too large');
    assert.ok(info.width>150&&info.height>180,'game viewport invisible');
    assert.equal(info.atlasScale,c.mobile?2:4);
    assert.equal(info.scenery,0,'menu preloaded too many backgrounds');
    await page.screenshot({path:path.join(screenshots,c.name+'-title.png')});
    await page.evaluate(()=>window.BounceRemaster.setQuality('classic'));
    await page.waitForFunction(()=>document.getElementById('game').width===240);
    await page.evaluate(()=>window.BounceRemaster.setQuality('ultra'));
    await page.waitForTimeout(150);
    const high=await page.evaluate(()=>({
      game:document.getElementById('game').width*document.getElementById('game').height,
      text:document.getElementById('game-text').width*document.getElementById('game-text').height
    }));
    assert.ok(high.game<=budget+4000);
    assert.ok(high.text<=budget+4000);
    const canvas=await page.locator('#game').boundingBox();
    assert.ok(canvas);
    await page.mouse.click(canvas.x+canvas.width*.5,canvas.y+canvas.height*190/320);
    await page.waitForFunction(()=>document.getElementById('pause-mini')?.hidden===false,null,{timeout:20000});
    await page.waitForTimeout(170);
    await page.screenshot({path:path.join(screenshots,c.name+'-gameplay.png')});
    await page.locator('#pause-mini').click({timeout:10000});
    await page.waitForFunction(()=>document.getElementById('pause-mini')?.hidden===true,null,{timeout:10000});
    await page.screenshot({path:path.join(screenshots,c.name+'-pause.png')});
    assert.deepEqual(errors,[],c.name+' uncaught JS exceptions');
    assert.deepEqual(missing,[],c.name+' missing HTTP assets');
    console.log(c.name+': title, game, pause OK; atlas '+info.atlasScale+'x; memory budgets respected');
   }catch(error){
    try{await page.screenshot({path:path.join(screenshots,c.name+'-FAIL.png'),fullPage:true});}catch(_){}
    throw Error(c.name+': '+error.message+'\nJS errors: '+errors.join('; ')+'\nMissing files: '+missing.join('; '));
   }finally{await context.close();}
  }
 }finally{await browser.close();}
 console.log('Chromium desktop, HiDPI and mobile interaction test passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
