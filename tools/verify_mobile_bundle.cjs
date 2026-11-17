'use strict';
/* Verify actual native web bundle AFTER asset generation, before Capacitor. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public');
const exists=relative=>fs.existsSync(path.join(out,relative));
for(const item of ['index.html','game.js','style.css','sw.js',
  'src/rlef-reader.js','src/rock-break.js','src/image-map.json',
  'src/sprite-atlas.json','assets/original/bf','assets/original/bu',
  'remaster/book.js','remaster/remaster.js','remaster/texture-hd.js',
  'remaster/scenery.js','remaster/materials.js','mobile-bundle.json']){
  assert.ok(exists(item),'Missing native game asset: '+item);
}
const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
for(const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)){
  const link=match[1].split(/[?#]/)[0];
  if(!link||/^(https?:|data:|\/\/)/.test(link))continue;
  assert.ok(exists(link),'Native HTML reference missing: '+link);
}
const meta=JSON.parse(fs.readFileSync(path.join(out,'mobile-bundle.json'),'utf8'));
assert.equal(meta.offline,true);
assert.equal(meta.assetBase,'relative');
const textureProfiles=[['hd',4],['mobile',2]];
for(const [folder,scale] of textureProfiles){
  const assetRoot='remaster/assets/'+folder+'/';
  const manifest=JSON.parse(fs.readFileSync(path.join(out,assetRoot,'manifest.json'),'utf8'));
  assert.equal(manifest.version,4);
  assert.equal(manifest.scale,scale);
  assert.equal(manifest.spriteCount,326);
  assert.equal(Object.keys(manifest.sprites).length,326);
  assert.ok(manifest.pages.length>0);
  for(const page of manifest.pages)assert.ok(exists(assetRoot+page),'Missing atlas '+page);
}
const scenery=JSON.parse(fs.readFileSync(path.join(out,'remaster/assets/scenery/manifest.json'),'utf8'));
assert.equal(Object.keys(scenery.biomes).length,4);
for(const file of Object.values(scenery.biomes))
  assert.ok(exists('remaster/assets/scenery/'+file),'Missing scenic image '+file);
const sprites=JSON.parse(fs.readFileSync(path.join(out,'src/sprite-atlas.json'),'utf8'));
const imageMap=JSON.parse(fs.readFileSync(path.join(out,'src/image-map.json'),'utf8'));
assert.equal(sprites.static_sprite_count,326);
for(const item of sprites.png_images)
  assert.ok(exists('assets/original/'+item.png),'Missing J2ME sprite image: '+item.png);
for(const name of imageMap.atlases)
  assert.ok(exists('assets/original/'+name),'Missing original atlas: '+name);
for(const name of ['bf','bg','bh','bi','bj','bk','bl','bm','bn','bo','bp','bq','br','bs','bt'])
  assert.ok(exists('assets/original/'+name),'Missing one of 15 chapters: '+name);
const audioDir=path.join(out,'assets/audio');
assert.ok(fs.readdirSync(audioDir).length>0,'No offline soundtrack resources found');
console.log('Native offline bundle validated: 15 chapters, 326 sprites, 4x+2x atlases, 4 scenery files, audio, JS/CSS and icons.');
