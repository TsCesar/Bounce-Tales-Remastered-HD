/* Bounce Tales UHD texture system v3.
 * Replaces all 326 static sprite textures with independently enhanced 6x
 * atlas sprites when available. Unsupported/failed assets fall back safely.
 */
(function () {
  'use strict';
  const remaster = window.BounceRemaster;
  if (!remaster) {
    console.warn('HD textures: remaster render pipeline unavailable');
    return;
  }
  let manifest = null;
  let pages = [];
  let loadedPages = 0;
  let state = 'loading';

  remaster.textureStatus = () => ({
    state, loadedPages, totalPages: pages.length,
    spriteCount: manifest?.spriteCount || 0,
    atlasScale: manifest?.scale || 0
  });

  remaster.drawSprite = function (spriteId, x, y, ctx) {
    if (remaster.quality === 'classic' || !manifest || !ctx ||
        !Number.isInteger(spriteId) || spriteId < 0 || spriteId > 325) return false;
    const sprite = manifest.sprites[String(spriteId)];
    if (!sprite) return false;
    const image = pages[sprite.page];
    if (!image || !image.complete || !image.naturalWidth) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, sprite.x, sprite.y, sprite.w, sprite.h,
      Math.round(x - sprite.originX), Math.round(y - sprite.originY),
      sprite.logicalW, sprite.logicalH);
    ctx.restore();
    return true;
  };

  async function loadAtlas() {
    try {
      const response = await fetch('remaster/assets/hd/manifest.json?v=3', { cache: 'no-store' });
      if (!response.ok) throw Error('HD manifest HTTP ' + response.status);
      const loaded = await response.json();
      if (loaded.version !== 3 || loaded.spriteCount !== 326 ||
          !Array.isArray(loaded.pages) || !loaded.pages.length ||
          Object.keys(loaded.sprites || {}).length !== 326 ||
          loaded.scale !== 6) throw Error('Incompatible HD texture atlas manifest');
      manifest = loaded;
      pages = loaded.pages.map((file, index) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          loadedPages++;
          if (loadedPages === pages.length) state = 'ready';
        };
        image.onerror = () => console.warn('HD atlas page failed; native sprite fallback:', file);
        image.src = 'remaster/assets/hd/' + encodeURIComponent(file) + '?v=3';
        return image;
      });
    } catch (error) {
      state = 'fallback';
      console.warn('HD texture atlas not available; original sprites retained:', error);
    }
  }

  // Asynchronous, non-blocking: gameplay is playable immediately in the original
  // crisp mode while the larger textures are requested.
  loadAtlas();
})();
