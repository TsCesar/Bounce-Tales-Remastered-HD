'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert.match(html, /style\.css\?v=62/);
assert.match(html, /src\/[^"']+\?v=62/);
for (const resource of ['game.js?v=66', 'sw.js?v=66', 'remaster/remaster.css?v=13']) {
  assert.ok(html.includes(resource));
  assert.ok(sw.includes(resource), resource + ' must match the offline shell');
}
assert.doesNotMatch(html, /\?v=32\b/, 'index.html must not retain old versioned assets');
assert.match(sw, /CACHE_NAME\s*=\s*'bounce-tales-v62'/);
assert.doesNotMatch(sw, /\?v=32\b/, 'service worker shell must not retain old versioned assets');
assert.match(html, /class="header-btn heart-link"/, 'red heart header link is preserved');

(async () => {
  const vm = require('node:vm');
  const url = 'https://bounce.test/';
  const cache = new Map([[url, 'older page'], [url + 'game.js?v=66', 'current script']]);
  const fresh = { ok: true, type: 'basic', clone() { return this; } };
  let handleFetch, online = true, networkCalls = 0;
  vm.runInNewContext(sw, {
    self: {
      location: { origin: new URL(url).origin },
      addEventListener(type, handle) { if (type === 'fetch') handleFetch = handle; }
    },
    URL,
    caches: { open: async () => ({
      match: async request => cache.get(request.url),
      put: async (request, response) => cache.set(request.url, response)
    }) },
    fetch: async (request, options) => {
      networkCalls++;
      assert.equal(options.cache, 'no-cache');
      if (!online) throw new Error('offline');
      return fresh;
    }
  });
  function fetchThroughWorker(target, mode) {
    return new Promise(resolve => handleFetch({
      request: { method: 'GET', url: target, mode },
      respondWith: resolve
    }));
  }
  assert.equal(await fetchThroughWorker(url, 'navigate'), fresh);
  online = false;
  assert.equal(await fetchThroughWorker(url, 'navigate'), fresh);
  assert.equal(await fetchThroughWorker(url + 'game.js?v=66', 'same-origin'), 'current script');
  assert.equal(networkCalls, 2);
  console.log('Cache test: navigations update online, work offline and preserve the versioned asset cache.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
