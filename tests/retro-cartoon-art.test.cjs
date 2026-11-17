'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(file)=>fs.readFileSync(file,'utf8');
const painter=read('tools/build_hd_scenery.py');
const scenery=read('remaster/scenery.js');
const terrain=read('remaster/materials.js');
const game=read('game.js');
const ball=read('remaster/remaster.js');
const book=read('remaster/book.js');
const html=read('index.html');
const sw=read('sw.js');
const pages=read('.github/workflows/pages.yml');
assert.match(painter,/"style":"cartoon-retro-hd"/);
assert.match(painter,/ImageDraw/);
assert.match(painter,/draw_cloud/);
assert.match(painter,/forest_tree/);
assert.match(painter,/crystal/);
assert.doesNotMatch(painter,/import numpy|ImageFilter|soft_noise|np\.random|np\.gradient/);
assert.match(scenery,/remaster.drawScenery = drawScenery/);
assert.match(scenery,/return true;/);
assert.match(game,/if\(window.BounceRemaster\?\.drawScenery\?\.\(/);
assert.match(fs.readFileSync('remaster/forms.js','utf8'),/art.drawRemadeForm=drawRemadeForm/);
assert.match(fs.readFileSync('remaster/world.js','utf8'),/art.drawRemadeTerrain=drawRemadeTerrain/);
assert.match(scenery,/remaster.drawWaterSurface = drawWaterSurface/);
assert.match(scenery,/MAX_CACHED_BACKDROPS/);
assert.match(scenery,/style:'cartoon-retro-hd'/);
assert.doesNotMatch(scenery,/globalCompositeOperation = 'screen'|caustic|particle/i);
assert.match(terrain,/remaster.drawTerrain = drawTerrain/);
assert.doesNotMatch(terrain,/fractal\(|createPattern\(|fillRect\(i\+\.5,j\+\.6|Math\.random\(|getImageData\(/);
assert.match(ball,/function drawBounce\(ctx,p\)/);
assert.match(ball,/p\.form\s*!==\s*0/);
assert.match(ball,/function drawEgg\(ctx,x,y,seconds\)/);
assert.doesNotMatch(ball,/const vignette\s*=|const bounceShine\s*=|metal\.addColorStop/);
assert.match(book,/function drawTitleBook\(ctx\)/);
assert.match(game,/rockBreakRuntime\?\.update\(\{/);
for(const [name,version] of [
  ['remaster/remaster.js','22-hd'],
  ['remaster/book.js',13],
  ['remaster/materials.js',22],
  ['remaster/scenery.js','22-hd'],
  ['remaster/forms.js',14]
]){
  assert.ok(html.includes(name+'?v='+version),name+' HTML version');
  assert.ok(sw.includes(name+'?v='+version),name+' PWA version');
}
assert.ok(html.includes('remaster/world.js?v=23'));
assert.ok(sw.includes('remaster/world.js?v=23'));
assert.ok(html.includes('remaster/decor.js?v=18'));
assert.ok(sw.includes('remaster/decor.js?v=18'));
assert.match(pages,/m\['version'\]==2 and m\['style'\]=='cartoon-retro-hd'/);
console.log('Retro cartoon V13: four biomes, cel-shaded ground, simple water, matte eggs, ball and book; all gameplay hooks preserved.');
