/* Static integration checks for the independent presentation layer. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const files = ['index.html','game.js','remaster/remaster.js','remaster/remaster.css','sw.js','.github/workflows/pages.yml'];
for (const name of files) assert.ok(fs.existsSync(name),'Missing '+name);
const page = fs.readFileSync('index.html','utf8');
const game = fs.readFileSync('game.js','utf8');
const renderer = fs.readFileSync('remaster/remaster.js','utf8');
const stylesheet = fs.readFileSync('remaster/remaster.css','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const workflow = fs.readFileSync('.github/workflows/pages.yml','utf8');
assert.match(page,/canvas id="game" width="240" height="320"/,'Logical canvas must remain 240x320');
assert.match(page,/remaster\/remaster\.js\?v=1/);
assert.match(page,/remaster\/remaster\.css\?v=1/);
for(const method of ['beginFrame','drawBounce','drawEgg','drawTerrain','finishScene']){
  assert.ok(game.includes('BounceRemaster?.'+method+'?.('),'Missing '+method+' hook');
  assert.ok(renderer.includes('api.'+method+' = '),'Missing implementation for '+method);
}
assert.match(renderer,/const WORLD_W = 240, WORLD_H = 320/);
assert.match(stylesheet,/pointer:coarse/);
assert.match(stylesheet,/game-controls \{display:none !important;/);
assert.match(sw,/bounce-tales-v62/);
assert.match(sw,/remaster\/remaster\.js\?v=1/);
assert.match(workflow,/cp -a src assets remaster public\//);
assert.equal((page.match(/remaster\/remaster\.js/g)||[]).length,1);
console.log('Remaster integration: 240x320 simulation, 5 visual hooks, static assets and Pages deployment OK');
