'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert.match(html, /style\.css\?v=62/);
assert.match(html, /src\/[^"']+\?v=62/);
for (const name of ['game.js', 'sw.js']) {
  assert.ok(html.includes(name + '?v=63'));
  assert.ok(sw.includes(name + '?v=63'), name + ' must match the offline shell');
}
assert.doesNotMatch(html, /\?v=32\b/, 'index.html must not retain old versioned assets');
assert.match(sw, /CACHE_NAME\s*=\s*'bounce-tales-v62'/);
assert.doesNotMatch(sw, /\?v=32\b/, 'service worker shell must not retain old versioned assets');
assert.match(html, /class="header-btn heart-link"/, 'red heart header link is preserved');
console.log('Cache test: HTML and the offline shell reference the current game.js and service worker.');
