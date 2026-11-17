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
    // Render the three new forms and the two destructible rock formations
    // using the SAME actual canvas renderer as gameplay (not mock drawings).
    if(!c.mobile){
      const preview=await page.evaluate(()=>{
        const api=window.BounceRemaster;
        if(!api.drawRemadeForm||!api.drawRemadeProp||!api.drawRemadeTerrain)
          throw Error('Missing V14 vector remake modules');
        const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=660;
        const context=canvas.getContext('2d');context.scale(3,3);
        context.fillStyle='#E6F1E9';context.fillRect(0,0,360,220);
        const labels=['BOUNCE','BUMPY','WOLLY'];
        const samples=[];
        for(let form=0;form<3;form++){
          const x=65+form*115,y=70;
          if(!api.drawRemadeForm(context,{form,x,y,r:29,rotation:form*.4,
             vx:80,vy:12,grounded:false,eyeFrame:0}))
            throw Error('Failed to render form '+form);
          context.fillStyle='#203D4A';context.font='bold 8px sans-serif';
          context.textAlign='center';context.fillText(labels[form],x,112);
          const image=context.getImageData(x*3,y*3,1,1).data;
          samples.push([...image]);
        }
        if(!api.drawRemadeProp(context,357,121,202)||
           !api.drawRemadeProp(context,358,288,202))
           throw Error('Remade rock piles missing');
        return {image:canvas.toDataURL('image/png'),samples};
      });
      assert.ok(preview.samples.every(row=>row[3]===255),'Form centres must be visible');
      assert.notDeepEqual(preview.samples[0],preview.samples[1],
        'Bounce and Bumpy must have distinct artwork');
      assert.notDeepEqual(preview.samples[1],preview.samples[2],
        'Bumpy and Wolly must have distinct artwork');
      fs.writeFileSync(path.join(screenshots,c.name+'-three-forms-and-rocks.png'),
        Buffer.from(preview.image.split(',')[1],'base64'));
    }
    // Record the ACTUAL art routines in Chromium for human visual review.
    // This is not a synthetic image generator or a mock sprite preview.
    if(!c.mobile){
      const preview=await page.evaluate(()=>{
        const art=window.BounceRemaster;
        for(const name of ['drawRemadeTrampoline','drawRemadeCannon','drawRemadeEnemy','drawRemadeFriend']){
          if(typeof art[name]!=='function')throw Error('Missing V15: '+name);
        }
        const c=document.createElement('canvas');c.width=1500;c.height=720;
        const ctx=c.getContext('2d');ctx.scale(3,3);
        ctx.fillStyle='#E9F2EC';ctx.fillRect(0,0,500,240);
        const labels=[
          ['FOREST SPRING',80,95],['LAGOON SPRING',245,95],
          ['TWILIGHT SPRING',410,95],['CANNON',65,205],
          ['CANDLE',160,205],['BUMPER',250,205],
          ['MOLE',340,205],['STALKER',445,205]
        ];
        for(const [label,x,y] of labels){
          ctx.fillStyle='#294959';ctx.font='bold 6px system-ui';
          ctx.textAlign='center';ctx.fillText(label,x,y+9);
        }
        for(const [imageId,x] of [[497,80],[509,245],[490,410]]){
          if(!art.drawRemadeTrampoline(ctx,{x,y:77,imageId,frame:2,active:true}))
            throw Error('Unrenderable spring: '+imageId);
        }
        if(!art.drawRemadeCannon(ctx,{x:65,y:190,angle:.4,active:true,animMs:610}))
          throw Error('Cannon illustration missing');
        for(const [type,x] of [[0,160],[1,250],[2,340],[3,445]]){
          if(!art.drawRemadeEnemy(ctx,{type,x,y:185,time:1.5,state:1,
             propelType:1,molePeekTimer:800,molePeekPeriod:800}))
            throw Error('Enemy illustration missing: '+type);
        }
        return c.toDataURL('image/png');
      });
      fs.writeFileSync(path.join(screenshots,c.name+'-v15-props-and-enemies.png'),
        Buffer.from(preview.split(',')[1],'base64'));
    }
    if(!c.mobile){
      // Catalogue of actual, newly drawn source-sized ground pieces.
      const sheet=await page.evaluate(async()=>{
        const art=window.BounceRemaster;
        if(typeof art.drawRemadeGroundTile!=='function')
          throw Error('V17 tile renderer unavailable');
        const maps=(await(await fetch('src/image-map.json')).json()).maps;
        const canvas=document.createElement('canvas');
        canvas.width=1350;canvas.height=600;
        const ctx=canvas.getContext('2d');ctx.scale(3,3);
        ctx.fillStyle='#EAF1E9';ctx.fillRect(0,0,450,200);
        const groups=[
          {ids:[253,254,255,256,257,258,259,260,261,262,263,264,265,266],label:'FOREST'},
          {ids:[162,163,164,165,166,167,168,169,170,171,172,173,174,175],label:'LAGOON'},
          {ids:[120,121,122,123,124,125,126],label:'CAVE'}
        ];
        let rendered=0;
        groups.forEach((group,row)=>{
          ctx.fillStyle='#284655';ctx.font='bold 11px system-ui';
          ctx.fillText(group.label,10,22+row*65);
          let x=75;
          for(const id of group.ids){
            const meta=maps[String(id)];if(!meta)throw Error('Missing source tile '+id);
            const px=x+meta.originX;
            const py=15+row*65+meta.originY;
            if(!art.drawRemadeGroundTile(ctx,id,px,py,meta))
              throw Error('Unrenderable tile '+id);
            rendered++;
            ctx.font='6px system-ui';ctx.fillStyle='#334B55';
            ctx.fillText(String(id),x,51+row*65);
            x+=Math.max(16,meta.width+5);
          }
        });
        if(rendered!==35)throw Error('Wrong V17 tile count '+rendered);
        return canvas.toDataURL('image/png');
      });
      fs.writeFileSync(path.join(screenshots,c.name+'-v17-ground-tiles.png'),
        Buffer.from(sheet.split(',')[1],'base64'));
    }
    if(!c.mobile){
      // A genuine Chromium canvas contact sheet for the remaining V19 art.
      // It calls the exact functions used by gameplay, not separate mocks.
      const sheet=await page.evaluate(async()=>{
        const art=window.BounceRemaster;
        const maps=(await (await fetch('src/image-map.json')).json()).maps;
        const canvas=document.createElement('canvas');
        canvas.width=1650;canvas.height=850;
        const ctx=canvas.getContext('2d');ctx.scale(3,3);
        ctx.fillStyle='#EAF0E9';ctx.fillRect(0,0,550,283);
        ctx.fillStyle='#294A54';ctx.font='bold 12px system-ui';
        ctx.fillText('V19 · ESTRUCTURAS Y SEÑALES',15,19);
        const ids=[130,131,132,176,177,178];
        for(let i=0;i<ids.length;i++){
          const id=ids[i],m=maps[String(id)],x=45+i*86,y=69;
          if(!art.drawRemadeStructure(ctx,id,x,y,m))
            throw Error('Missing structural vector '+id);
          ctx.fillStyle='#284A55';ctx.font='9px system-ui';
          ctx.fillText('ID '+id,x-12,87);
        }
        const signs=[152,153,154,243,244,245,246,247,248,249,250];
        for(let i=0;i<signs.length;i++){
          const id=signs[i],m=maps[String(id)];
          const x=53+(i%6)*86,y=i<6?157:234;
          if(!art.drawRemadeSign(ctx,id,x,y,m))
            throw Error('Missing sign vector '+id);
          ctx.fillStyle='#284A55';ctx.font='9px system-ui';
          ctx.fillText('ID '+id,x-16,y+14);
        }
        ctx.save();ctx.translate(305,0);
        if(!art.drawRemadeHud(ctx,{collected:14,total:28,seconds:153}))
          throw Error('Missing HD HUD');
        ctx.restore();
        for(let i=0;i<3;i++){
          if(!art.drawRemadeFragment(ctx,[390,396,414][i],230+i*13,259,1))
            throw Error('Missing rock fragment '+i);
        }
        return canvas.toDataURL('image/png');
      });
      fs.writeFileSync(path.join(screenshots,c.name+'-v19-remaining-art.png'),
        Buffer.from(sheet.split(',')[1],'base64'));
    }
    if(!c.mobile){
      const special=await page.evaluate(async()=>{
        const art=window.BounceRemaster;
        const maps=(await(await fetch('src/image-map.json')).json()).maps;
        if(typeof art.drawRemadeSpecial!=='function')
          throw Error('V20 special remakes missing');
        const canvas=document.createElement('canvas');
        canvas.width=1650;canvas.height=900;
        const ctx=canvas.getContext('2d');ctx.scale(3,3);
        ctx.fillStyle='#EEF2EC';ctx.fillRect(0,0,550,300);
        ctx.fillStyle='#2B4C53';ctx.font='bold 12px sans-serif';
        ctx.fillText('V20 · FIGURAS ESPECIALES REMASTERIZADAS',12,20);
        const rows=[
          [334,68,151,'TORRE ROCA',174],
          [342,185,181,'DESCARGA',244],
          [345,278,179,'COLUMNA',194],
          [350,377,183,'PORTAL',200],
          [351,454,243,'CASA-SETA',261],
          [354,70,259,'FRANJA',281]
        ];
        for(const [id,x,y,label,captionY] of rows){
          if(!art.drawRemadeSpecial(ctx,id,x,y,maps[String(id)]))
            throw Error('Missing special sprite '+id);
          ctx.fillStyle='#37545D';ctx.font='9px sans-serif';
          ctx.fillText(label+' · '+id,x-(id===351?38:25),captionY);
        }
        return canvas.toDataURL('image/png');
      });
      fs.writeFileSync(path.join(screenshots,c.name+'-v20-specials.png'),
        Buffer.from(special.split(',')[1],'base64'));
    }
    if(!c.mobile){
      const image=await page.evaluate(async()=>{
        const art=window.BounceRemaster;
        if(typeof art.drawRemadeResidualSprite!=='function')
          throw Error('Missing last 13 V21 sprites');
        const maps=(await(await fetch('src/image-map.json')).json()).maps;
        const board=document.createElement('canvas');
        board.width=1650;board.height=900;
        const ctx=board.getContext('2d');
        ctx.scale(3,3);ctx.fillStyle='#F0F1EA';ctx.fillRect(0,0,550,300);
        ctx.fillStyle='#2E4D56';ctx.font='bold 12px system-ui';
        ctx.fillText('V21 · REMAKE DE LOS ÚLTIMOS 13 SPRITES RLEF',13,21);
        const ids=[53,54,81,111,112,116,133,134,135,136,137,343,344];
        for(let i=0;i<ids.length;i++){
          const id=ids[i],m=maps[String(id)];
          const first=i<6,slot=first?i:i-6;
          const x=first?[45,125,207,295,385,490][slot]:
            [45,105,165,225,285,382,475][slot];
          const y=first?134:248;
          if(!art.drawRemadeResidualSprite(ctx,id,x,y,m))
            throw Error('Missing art for residual sprite '+id);
          ctx.fillStyle='#284957';ctx.font='bold 9px system-ui';
          ctx.fillText('ID '+id,x-13,first?184:282);
        }
        return board.toDataURL('image/png');
      });
      fs.writeFileSync(path.join(screenshots,c.name+'-v21-final-sprite-gallery.png'),
        Buffer.from(image.split(',')[1],'base64'));
    }
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
    // Clock panel ends at logical x=202; the Pause overlay must be outside it.
    const hudClear=await page.evaluate(()=>{
      const stage=document.getElementById('game').getBoundingClientRect();
      const pause=document.getElementById('pause-mini').getBoundingClientRect();
      return stage.left+stage.width*202/240<=pause.left+1;
    });
    assert.ok(hudClear,c.name+' Pause overlay covers the remade clock');
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
