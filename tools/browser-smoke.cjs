'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.BOUNCE_TEST_URL || 'http://127.0.0.1:8765/';
const screenshots = path.resolve('artifacts/browser');
const qualityKey = 'tscesar-bounce-remaster-quality-v1';
const scenarios = [
  { name: 'desktop', viewport: { width: 1366, height: 768 }, dpr: 1, mobile: false },
  { name: 'retina-desktop', viewport: { width: 1920, height: 1080 }, dpr: 2, mobile: false },
  { name: 'touch-mobile', viewport: { width: 390, height: 844 }, dpr: 2, mobile: true },
  { name: 'touch-landscape', viewport: { width: 844, height: 390 }, dpr: 2, mobile: true }
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
    const trace = draw => {
      const placement = [];
      let smoothed = 0;
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...coords) {
        if (coords.length === 8 && image instanceof HTMLImageElement) {
          const { a, b, c, d, e, f } = this.getTransform();
          const sx = this.canvas.width / 240, sy = this.canvas.height / 320;
          const matrix = [a / sx, b / sy, c / sx, d / sy, e / sx, f / sy];
          const source = new URL(image.src).pathname;
          if (!source.includes('/assets/original/')) throw new Error('Unexpected sprite source ' + source);
          placement.push([source, ...coords, ...matrix.map(value => Math.round(value * 1e5) / 1e5)]);
          if (this.imageSmoothingEnabled) smoothed++;
        }
        return drawImage.call(this, image, ...coords);
      };
      try {
        draw();
      } finally {
        CanvasRenderingContext2D.prototype.drawImage = drawImage;
      }
      return { placement, smoothed };
    };
    const compare = (name, draw, keepImages = false) => {
      display.setQuality('classic');
      const original = trace(draw);
      if (!original.placement.length || original.smoothed)
        throw new Error(name + ' must keep the original image sharp in Classic');
      const placements = JSON.stringify(original.placement);
      const canvas = document.getElementById('game');
      if (keepImages) captures.classic = canvas.toDataURL('image/png');
      display.setQuality('hd');
      const hd = trace(draw);
      if (JSON.stringify(hd.placement) !== placements)
        throw new Error(name + ' changed sprite sources, crops or positions in HD');
      if (keepImages) captures.hd = canvas.toDataURL('image/png');
      return hd.smoothed;
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
    ctx.imageSmoothingEnabled = false;
    let spriteCount = 0;
    const smoothedIds = [];
    let frameCount = 0;
    for (const [id, animation] of Object.entries(imageMap.maps)) {
      if (animation.type === 'simple') {
        if (compare('Original sprite ' + id, () => test.drawImageMap(Number(id), 120, 160, new Set(), 0, ctx)))
          smoothedIds.push(Number(id));
        spriteCount++;
      }
      if (animation.type !== 'animated') continue;
      for (let frame = 0; frame < animation.frames.length; frame++) {
        compare('Animation ' + id + ' frame ' + frame,
          () => test.drawImageMap(Number(id), 120, 160, new Set(), frame, ctx));
        frameCount++;
      }
    }
    return { chapterCount, frameCount, spriteCount, smoothedIds, captures };
  }, allChapters);
}

async function expectDisplayMode(page, quality) {
  await page.waitForFunction(mode => {
    const canvas = document.getElementById('game');
    return document.documentElement.dataset.bounceRemaster === mode &&
      (mode === 'classic' ? canvas.width === 240 && canvas.height === 320 : canvas.width > 240);
  }, quality);
}

async function checkGraphicsSettings(page, scenario) {
  const gear = page.getByRole('button', { name: 'Settings', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Options' });
  const select = dialog.getByRole('combobox', { name: 'Gráficos' });
  const close = dialog.getByRole('button', { name: 'Close options' });
  assert.equal(await dialog.isVisible(), false);
  assert.equal(await page.locator('[data-hd-quality]').count(), 0);
  if (scenario.mobile) await gear.tap();
  else {
    await gear.focus();
    await page.keyboard.press('Space');
  }
  await select.waitFor();
  assert.equal(await page.locator('#app').getAttribute('data-mode'), 'title');
  assert.deepEqual(await select.locator('option').allTextContents(), ['Clásico', 'HD']);
  assert.equal(await select.inputValue(), 'hd');
  if (scenario.name === 'retina-desktop')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), qualityKey), 'hd');
  await page.screenshot({ path: path.join(screenshots, scenario.name + '-settings.png') });
  if (scenario.mobile) await select.selectOption('classic');
  else {
    await select.focus();
    await page.keyboard.press('Home');
  }
  await expectDisplayMode(page, 'classic');
  if (scenario.name === 'touch-landscape') {
    const editor = dialog.getByRole('button', { name: /Customize touch controls/ });
    await editor.scrollIntoViewIfNeeded();
    assert.ok(await editor.evaluate(button => {
      const rect = button.getBoundingClientRect();
      const pane = button.closest('[role="tabpanel"]').getBoundingClientRect();
      return rect.top >= pane.top - 1 && rect.bottom <= pane.bottom + 1;
    }), 'Lower game settings remain reachable on a short screen');
  }
  await close.click();
  await page.keyboard.press('h');
  await expectDisplayMode(page, 'classic');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('statusline').textContent.includes('ORIGINAL LEVEL DATA LOADED'));
  await expectDisplayMode(page, 'classic');
  await gear.click();
  assert.equal(await select.inputValue(), 'classic');
  await select.selectOption('hd');
  await expectDisplayMode(page, 'hd');
  await close.click();
  await page.keyboard.press('h');
  await expectDisplayMode(page, 'hd');
}

async function checkScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport, deviceScaleFactor: scenario.dpr,
    isMobile: scenario.mobile, hasTouch: scenario.mobile, reducedMotion: 'reduce',
    locale: 'es-ES', serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const errors = [], missing = [], generatedArt = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => {
    if (request.url().includes('/remaster/assets/')) generatedArt.push(request.url());
  });
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(base))
      missing.push(response.status() + ' ' + response.url());
  });
  try {
    if (scenario.name === 'retina-desktop') {
      await page.addInitScript(key => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, 'ultra');
      }, qualityKey);
    }
    await exposeFrameChecks(page);
    const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 25000 });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.getElementById('statusline')?.textContent?.includes('ORIGINAL LEVEL DATA LOADED'));
    await page.waitForFunction(() => document.getElementById('game')?.width > 240);
    const dimensions = await page.evaluate(() => {
      const game = document.getElementById('game'), text = document.getElementById('game-text');
      const box = game.getBoundingClientRect();
      return { width: box.width, height: box.height, gamePixels: game.width * game.height,
        scaleX: game.width / 240, scaleY: game.height / 320, textPixels: text.width * text.height };
    });
    const budget = scenario.mobile ? 1300000 : 3200000;
    assert.ok(dimensions.gamePixels <= budget + 4000 && dimensions.textPixels <= budget + 4000);
    assert.ok(dimensions.width > 150 && dimensions.height > 180);
    assert.ok(Number.isInteger(dimensions.scaleX) && dimensions.scaleX > 1);
    assert.equal(dimensions.scaleY, dimensions.scaleX);
    await page.screenshot({ path: path.join(screenshots, scenario.name + '-title.png') });

    await checkGraphicsSettings(page, scenario);
    const canvas = await page.locator('#game').boundingBox();
    assert.ok(canvas);
    const chooseAt = logicalY => {
      const x = canvas.x + canvas.width * .5, y = canvas.y + canvas.height * logicalY / 320;
      return scenario.mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
    };
    await chooseAt(190);
    await page.waitForFunction(() => ['select', 'play'].includes(document.getElementById('app')?.dataset.mode));
    if (await page.locator('#app').getAttribute('data-mode') === 'select') await chooseAt(277);
    await page.waitForFunction(() => document.getElementById('pause-mini')?.hidden === false);
    await page.locator('#open-settings').click();
    await page.locator('#graphics-quality').selectOption('classic');
    await expectDisplayMode(page, 'classic');
    await page.locator('#close-settings').click();
    assert.equal(await page.locator('#app').getAttribute('data-mode'), 'play');
    const pause = page.locator('#pause-mini');
    const pauseBox = await pause.boundingBox();
    assert.ok(pauseBox && pauseBox.x >= 0 && pauseBox.y >= 0,
      'Pause must be fully visible');
    assert.ok(pauseBox.x + pauseBox.width <= scenario.viewport.width &&
      pauseBox.y + pauseBox.height <= scenario.viewport.height, 'Pause must fit in the viewport');
    assert.ok(pauseBox.x >= canvas.x + canvas.width ||
      pauseBox.y + pauseBox.height <= canvas.y, 'Pause must sit outside the original HUD');
    await pause.click();
    await page.waitForFunction(() => document.getElementById('pause-mini')?.hidden === true);
    await page.screenshot({ path: path.join(screenshots, scenario.name + '-pause.png') });

    const { chapterCount, frameCount, spriteCount, smoothedIds, captures } = await compareFrames(page, scenario.name === 'desktop');
    assert.equal(spriteCount, 348);
    assert.deepEqual(smoothedIds.sort((a, b) => a - b), [1, 48, 84, 138, 144, 345, 350, 351]);
    for (const [quality, url] of Object.entries(captures)) {
      fs.writeFileSync(path.join(screenshots, scenario.name + '-' + quality + '.png'),
        Buffer.from(url.split(',')[1], 'base64'));
    }
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    assert.deepEqual(missing, [], 'Missing resources');
    assert.deepEqual(generatedArt, [], 'The game loads its original PNGs directly');
    console.log(scenario.name + ': ' + chapterCount + ' chapters, 3 rotating forms and ' +
      frameCount + ' original animation frames share the same texture crops in Classic and HD. ' +
      smoothedIds.length + ' of ' + spriteCount + ' source sprites are smoothed in HD. Settings selection and persistence passed.');
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
