/* The three display modes share the original game renderer and camera. */
(function () {
  'use strict';
  const WORLD_W = 240, WORLD_H = 320;
  const QUALITY = ['classic', 'hd', 'ultra'];
  const KEY = 'tscesar-bounce-remaster-quality-v1';
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let quality = coarse ? 'hd' : 'ultra';
  try {
    const stored = localStorage.getItem(KEY);
    if (QUALITY.includes(stored)) quality = stored;
  } catch (_) { /* Private browsing may block storage. */ }
  const api = { version: '1.0.0', get quality() { return quality; } };
  let toolbar = null;
  const MAX_PIXELS = 2800;
  let lastMeasuredFrame=0,slowFrames=0;
  function renderingScale(cssW,cssH){
    // Use whole logical pixels on the backing canvas within the device budget.
    const budget=coarse?1300000:3200000;
    const deviceDpr=Math.max(1,Math.min(coarse?2:2.25,window.devicePixelRatio||1));
    const requested=quality==='ultra'?Math.max(1.5,deviceDpr):Math.min(deviceDpr,1.5);
    const displayScale=Math.max(cssW/WORLD_W,cssH/WORLD_H);
    const limit=Math.floor(Math.min(MAX_PIXELS/Math.max(WORLD_W,WORLD_H),
      Math.sqrt(budget/(WORLD_W*WORLD_H))));
    return Math.min(limit,Math.max(quality==='ultra'?3:2,Math.ceil(displayScale*requested)));
  }
  function trackFrames(){
    if(typeof performance==='undefined'||typeof performance.now!=='function'||quality==='classic')return;
    const now=performance.now();
    if(lastMeasuredFrame&&now-lastMeasuredFrame<800&&
       !(typeof document!=='undefined'&&document.hidden)){
      const delta=now-lastMeasuredFrame;
      slowFrames=delta>35?Math.min(150,slowFrames+2):Math.max(0,slowFrames-1);
      // Quality adaptation does not alter the 60Hz fixed-step game simulation.
      if(slowFrames>=120){
        setQuality(quality==='ultra'?'hd':'classic');
        slowFrames=0;
        console.warn('Visual quality reduced to keep the game responsive');
      }
    }
    lastMeasuredFrame=now;
  }

  function setQuality(next) {
    if (!QUALITY.includes(next)) return;
    quality = next;
    try { localStorage.setItem(KEY, next); } catch (_) {}
    if (toolbar) {
      const button = toolbar.querySelector('[data-hd-quality]');
      if (button) {
        button.textContent = ({ classic: 'CLÁSICO', hd: 'HD', ultra: 'ULTRA' })[quality];
        button.setAttribute('aria-label', 'Calidad gráfica: ' + quality + '. Pulsa H para cambiar.');
      }
    }
    document.documentElement.dataset.bounceRemaster = quality;
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
    trackFrames();
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
    bar.setAttribute('role','group');
    bar.setAttribute('aria-label','Gráficos remasterizados');
    const preset = document.createElement('button');
    preset.type = 'button';
    preset.dataset.hdQuality = '1';
    preset.title = 'Cambiar gráficos: Clásico / HD / Ultra (H)';
    preset.addEventListener('click',function () {
      setQuality(QUALITY[(QUALITY.indexOf(quality) + 1) % QUALITY.length]);
    });
    const full = document.createElement('button');
    full.type = 'button';
    full.textContent = '⛶';
    full.title = 'Pantalla completa (F)';
    full.setAttribute('aria-label','Pantalla completa');
    full.addEventListener('click',fullScreen);
    bar.append(preset,full);
    document.body.appendChild(bar);
    toolbar = bar;
    setQuality(quality);
  }
  const keyHandler = function (ev) {
    if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const tag = ev.target && ev.target.tagName;
    if (tag && /^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (ev.code === 'KeyH') { ev.preventDefault();setQuality(QUALITY[(QUALITY.indexOf(quality) + 1) % QUALITY.length]); }
    else if (ev.code === 'KeyF') { ev.preventDefault();fullScreen(); }
  };
  window.addEventListener('keydown',keyHandler);
  window.BounceRemaster = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bootToolbar,{once:true});
  else bootToolbar();
})();
