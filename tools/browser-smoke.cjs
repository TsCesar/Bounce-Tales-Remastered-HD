'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.BOUNCE_TEST_URL || 'http://127.0.0.1:8765/';
const screenshots = path.resolve('artifacts/browser');
const scenarios = [
  { name: 'desktop', viewport: { width: 1366, height: 768 }, dpr: 1, mobile: false },
  { name: 'retina-desktop', viewport: { width: 1920, height: 1080 }, dpr: 2, mobile: false },
  { name: 'touch-mobile', viewport: { width: 390, height: 844 }, dpr: 2, mobile: true }
];

async function exposeFrameChecks(page) {
  await page.route(/\/game\.js\?v=\d+$/, async route => {
    const response = await route.fetch();
    const source = await response.text();
    const entry = /\nboot\(\);\n\}\)\(\);\s*$/;
    assert.match(source, entry);
    const testHooks = [
      '',
      'window.__bounceFrameTest = {',
      '  draw, loadLevel, drawImageMap,',
      '  loadImages: () => Promise.all(atlases.map((_, index) => imgFor(index).decode())),',
      '  pose(form, angle) { body.forme = form; body.rotation = angle; body.eyeFrame = 3; }',
      '};',
      'boot();',
      '})();',
      ''
    ].join('\n');
    await route.fulfill({ response, body: source.replace(entry, testHooks) });
  });
}

async function compareFrames(page, allChapters) {
  return page.evaluate(async full => {
    const test = window.__bounceFrameTest;
    const display = window.BounceRemaster;
    const imageMap = await fetch('src/image-map.json').then(response => response.json());
    await test.loadImages();
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    const captures = {};
    const qualities = ['classic', 'hd', 'ultra'];
    const trace = draw => {
      const placement = [];
      let enhanced = 0;
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...coords) {
        if (coords.length === 8 && image instanceof HTMLImageElement) {
          const { a, b, c, d, e, f } = this.getTransform();
          const sx = this.canvas.width / 240, sy = this.canvas.height / 320;
          const matrix = [a / sx, b / sy, c / sx, d / sy, e / sx, f / sy];
          placement.push([...coords.slice(4), ...matrix.map(value => Math.round(value * 1e5) / 1e5)]);
          if (image.src.includes('/remaster/assets/')) enhanced++;
        }
        return drawImage.call(this, image, ...coords);
      };
      try {
        draw();
      } finally {
        CanvasRenderingContext2D.prototype.drawImage = drawImage;
      }
      return { placement, enhanced };
    };
    const compare = (name, draw, keepImages = false) => {
      display.setQuality('classic');
      const original = trace(draw);
      if (!original.placement.length || original.enhanced)
        throw new Error(name + ' did not use the original images in Classic');
      const placements = JSON.stringify(original.placement);
      const canvas = document.getElementById('game');
      if (keepImages) captures.classic = canvas.toDataURL('image/png');
      for (const quality of qualities.slice(1)) {
        display.setQuality(quality);
        const actual = trace(draw);
        if (JSON.stringify(actual.placement) !== placements)
          throw new Error(name + ' changed sprite positions or draw order in ' + quality);
        if (actual.enhanced !== actual.placement.length)
          throw new Error(name + ' missed an original atlas sprite in ' + quality);
        if (keepImages) captures[quality] = canvas.toDataURL('image/png');
      }
    };

    const chapterCount = full ? 15 : 1;
    for (let chapter = 0; chapter < chapterCount; chapter++) {
      await test.loadLevel(chapter, { start: true });
      compare('Chapter ' + (chapter + 1), test.draw, chapter === 0);
    }

    await test.loadLevel(0, { start: true });
    for (const form of [0, 1, 2]) {
      for (const angle of [0, Math.PI / 5, Math.PI * 1.55]) {
        test.pose(form, angle);
        compare('Player form ' + form + ' at ' + angle, test.draw);
      }
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = 240;
    offscreen.height = 320;
    const ctx = offscreen.getContext('2d');
    let frameCount = 0;
    for (const [id, animation] of Object.entries(imageMap.maps)) {
      if (animation.type !== 'animated') continue;
      for (let frame = 0; frame < animation.frames.length; frame++) {
        compare('Animation ' + id + ' frame ' + frame,
          () => test.drawImageMap(Number(id), 120, 160, new Set(), frame, ctx));
        frameCount++;
      }
    }
    return { chapterCount, frameCount, captures };
  }, allChapters);
}

async function checkScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport, deviceScaleFactor: scenario.dpr,
    isMobile: scenario.mobile, hasTouch: scenario.mobile, reducedMotion: 'reduce',
    locale: 'es-ES', serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(base))
      missing.push(response.status() + ' ' + response.url());
  });
  try {
    await exposeFrameChecks(page);
    const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 25000 });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.getElementById('statusline')?.textContent?.includes('ORIGINAL LEVEL DATA LOADED'));
    await page.waitForFunction(() => window.BounceRemaster?.textureStatus?.().state === 'ready');
    const dimensions = await page.evaluate(() => {
      const game = document.getElementById('game'), text = document.getElementById('game-text');
      const box = game.getBoundingClientRect();
      return { width: box.width, height: box.height, gamePixels: game.width * game.height,
        textPixels: text.width * text.height, textures: window.BounceRemaster.textureStatus() };
    });
    const budget = scenario.mobile ? 1300000 : 3200000;
    assert.ok(dimensions.gamePixels <= budget + 4000 && dimensions.textPixels <= budget + 4000);
    assert.ok(dimensions.width > 150 && dimensions.height > 180);
    assert.equal(dimensions.textures.spriteCount, 348);
    assert.equal(dimensions.textures.atlasScale, scenario.mobile ? 2 : 4);
    await page.screenshot({ path: path.join(screenshots, scenario.name + '-title.png') });

    const button = page.locator('[data-hd-quality]');
    for (const quality of scenario.mobile ? ['ULTRA', 'CLÁSICO', 'HD'] : ['CLÁSICO', 'HD', 'ULTRA']) {
      await button.click();
      assert.equal(await button.textContent(), quality);
    }
    const canvas = await page.locator('#game').boundingBox();
    assert.ok(canvas);
    await page.mouse.click(canvas.x + canvas.width * .5, canvas.y + canvas.height * 190 / 320);
    await page.waitForFunction(() => document.getElementById('pause-mini')?.hidden === false);
    await page.locator('#pause-mini').click();
    await page.waitForFunction(() => document.getElementById('pause-mini')?.hidden === true);
    await page.screenshot({ path: path.join(screenshots, scenario.name + '-pause.png') });

    const { chapterCount, frameCount, captures } = await compareFrames(page, scenario.name === 'desktop');
    for (const [quality, url] of Object.entries(captures)) {
      fs.writeFileSync(path.join(screenshots, scenario.name + '-' + quality + '.png'),
        Buffer.from(url.split(',')[1], 'base64'));
    }
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    assert.deepEqual(missing, [], 'Missing resources');
    console.log(scenario.name + ': ' + chapterCount + ' chapters, 3 rotating forms and ' +
      frameCount + ' original animation frames aligned in Classic, HD and Ultra.');
  } catch (error) {
    await page.screenshot({ path: path.join(screenshots, scenario.name + '-FAIL.png'), fullPage: true }).catch(() => {});
    throw new Error(scenario.name + ': ' + error.message + '\nJS errors: ' + errors.join(', ') + '\nMissing: ' + missing.join(', '));
  } finally {
    await context.close();
  }
}

(async () => {
  fs.mkdirSync(screenshots, { recursive: true });
  const browser = await chromium.launch({
    headless: true, executablePath: process.env.BOUNCE_CHROMIUM_PATH || undefined,
    args: ['--disable-dev-shm-usage']
  });
  try {
    for (const scenario of scenarios) await checkScenario(browser, scenario);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
