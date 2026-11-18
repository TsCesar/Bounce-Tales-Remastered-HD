/* Classic and HD share the original game renderer and camera. */
(function () {
  'use strict';
  const WORLD_W = 240, WORLD_H = 320;
  const QUALITY = ['classic', 'hd'];
  const KEY = 'tscesar-bounce-remaster-quality-v1';
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let quality = 'hd';
  try {
    const stored = localStorage.getItem(KEY);
    if (QUALITY.includes(stored)) quality = stored;
    else if (stored !== null) localStorage.setItem(KEY, quality);
  } catch (_) { /* Private browsing may block storage. */ }
  document.documentElement.dataset.bounceRemaster = quality;
  const api = { version: '1.0.0', get quality() { return quality; } };
  const MAX_PIXELS = 2800;
  function renderingScale(cssW,cssH){
    // Use whole logical pixels on the backing canvas within the device budget.
    const budget=coarse?1300000:3200000;
    const requested=Math.max(1,Math.min(window.devicePixelRatio||1,1.5));
    const displayScale=Math.max(cssW/WORLD_W,cssH/WORLD_H);
    const limit=Math.floor(Math.min(MAX_PIXELS/Math.max(WORLD_W,WORLD_H),
      Math.sqrt(budget/(WORLD_W*WORLD_H))));
    return Math.min(limit,Math.max(2,Math.ceil(displayScale*requested)));
  }

  function setQuality(next) {
    if (!QUALITY.includes(next) || next === quality) return;
    quality = next;
    document.documentElement.dataset.bounceRemaster = quality;
    try { localStorage.setItem(KEY, quality); } catch (_) { /* Keep the session choice. */ }
  }
  api.setQuality = setQuality;

  function beginFrame(ctx, canvas) {
    if (!ctx || !canvas) return;
    if (quality === 'classic') {
      if (canvas.width !== WORLD_W || canvas.height !== WORLD_H) {
        canvas.width = WORLD_W;
        canvas.height = WORLD_H;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const cssW = rect.width || WORLD_W, cssH = rect.height || WORLD_H;
    const scale=renderingScale(cssW,cssH);
    const targetW = WORLD_W * scale;
    const targetH = WORLD_H * scale;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
  }
  api.beginFrame = beginFrame;

  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (e) { console.warn('Fullscreen unavailable',e); }
  }

  function bootToolbar() {
    const bar = document.createElement('div');
    bar.id = 'remaster-toolbar';
    const full = document.createElement('button');
    full.type = 'button';
    full.textContent = '⛶';
    full.title = 'Pantalla completa (F)';
    full.setAttribute('aria-label','Pantalla completa');
    full.addEventListener('click',fullScreen);
    bar.append(full);
    document.body.appendChild(bar);
  }
  const keyHandler = function (ev) {
    if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const tag = ev.target && ev.target.tagName;
    if (tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (ev.code === 'KeyF') { ev.preventDefault();fullScreen(); }
  };
  window.addEventListener('keydown',keyHandler);
  window.BounceRemaster = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bootToolbar,{once:true});
  else bootToolbar();
})();
