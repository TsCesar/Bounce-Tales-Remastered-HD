/* Bounce Tales — two visual modes, one fully featured remaster.
 * Original physics, stage data, camera and menus remain unchanged.
 * Remastered uses clean vector art at bounded high-DPI resolution.
 */
(function () {
  'use strict';
  const WORLD_W = 240, WORLD_H = 320;
  const QUALITY = Object.freeze(['classic', 'remastered']);
  const KEY = 'tscesar-bounce-remaster-quality-v2';
  const LEGACY_KEY = 'tscesar-bounce-remaster-quality-v1';
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  let quality = 'remastered';
  try {
    // Migrate both older enhanced presets to the ONE remastered mode.
    const stored = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    if (stored === 'classic') quality = 'classic';
  } catch (_) { /* Private browsing may block storage. */ }

  const api = {
    version: '2.0.0',
    get quality() { return quality; },
    get qualityOptions() { return [...QUALITY]; },
    get renderResolutionFactor() { return resolutionFactor; }
  };
  let toolbar = null;
  const MAX_PIXELS = 2800;
  const TAU = Math.PI * 2;
  let lastMeasuredFrame=0,slowFrames=0,stableFrames=0,resolutionFactor=1;

  function renderingScale(cssW,cssH){
    // A SINGLE high-quality renderer for remastered on desktop and mobile.
    // Limit framebuffer memory independently of the visual preset; never
    // fall back to the low-resolution Classic art on a slow phone.
    const budget=coarse?1300000:3200000;
    const deviceDpr=Math.max(1,Math.min(coarse?2:2.25,window.devicePixelRatio||1));
    const requested=deviceDpr*resolutionFactor;
    return Math.min(requested,MAX_PIXELS/Math.max(cssW,cssH),
      Math.sqrt(budget/Math.max(1,cssW*cssH)));
  }

  function trackFrames(){
    if(typeof performance==='undefined'||typeof performance.now!=='function'||
       quality==='classic')return;
    const now=performance.now();
    if(lastMeasuredFrame&&now-lastMeasuredFrame<800&&
       !(typeof document!=='undefined'&&document.hidden)){
      const delta=now-lastMeasuredFrame;
      if(delta>38){
        slowFrames=Math.min(120,slowFrames+2);
        stableFrames=0;
      }else if(delta<22){
        stableFrames=Math.min(480,stableFrames+1);
        slowFrames=Math.max(0,slowFrames-2);
      }else{
        slowFrames=Math.max(0,slowFrames-1);
        stableFrames=0;
      }
      // Resolution-only adaptation with hysteresis prevents repeated
      // full-framebuffer reallocations when frame times fluctuate.
      if(slowFrames>=110){
        resolutionFactor=Math.max(.84,Math.round((resolutionFactor-.08)*100)/100);
        slowFrames=0;
      }else if(stableFrames>=420&&resolutionFactor<1){
        resolutionFactor=Math.min(1,Math.round((resolutionFactor+.04)*100)/100);
        stableFrames=0;
      }
    }
    lastMeasuredFrame=now;
  }

  function setQuality(next) {
    if (!QUALITY.includes(next)) return false;
    quality = next;
    lastMeasuredFrame=0;
    slowFrames=0;
    stableFrames=0;
    resolutionFactor=1;
    try { localStorage.setItem(KEY, next); } catch (_) {}
    if (toolbar) {
      const button = toolbar.querySelector('[data-remaster-mode]');
      if (button) {
        const label=quality==='classic'?'CLÁSICO':'REMASTERIZADO';
        button.textContent=label;
        button.title='Cambiar entre Clásico y Remasterizado (H)';
        button.setAttribute('aria-label','Gráficos: '+label+'. Pulsa H para alternar.');
        button.setAttribute('aria-pressed',String(quality==='remastered'));
      }
    }
    document.documentElement.dataset.bounceRemaster = quality;
    return true;
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
    const targetW = Math.max(WORLD_W, Math.round(cssW * scale));
    const targetH = Math.max(WORLD_H, Math.round(cssH * scale));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
    // Remastered art is built from vector paths and smooth HD backgrounds;
    // old bitmap sprites can override sampling independently.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
  api.beginFrame = beginFrame;

  function drawBounce(ctx,p){
    if(quality==='classic'||!p||p.r<=0||p.form !== 0)return;
    const r=p.r;
    ctx.save();ctx.translate(p.x,p.y);
    ctx.beginPath();ctx.ellipse(0,0,r*.9,r*.9,0,0,TAU);
    ctx.clip();
    const red=ctx.createLinearGradient(-r,-r,r,r);
    red.addColorStop(0,'#ff7770');red.addColorStop(.42,'#f33139');
    red.addColorStop(1,'#b81a2a');
    ctx.fillStyle=red;ctx.fillRect(-r,-r,r*2,r*2);
    ctx.fillStyle='rgba(255,202,172,.23)';
    ctx.beginPath();ctx.ellipse(-r*.30,-r*.40,r*.35,r*.24,-.48,0,TAU);ctx.fill();
    ctx.restore();
  }
  api.drawBounce = drawBounce;

  function drawEgg(ctx,x,y,seconds){
    if(quality==='classic')return false;
    ctx.save();ctx.translate(x,y);
    const pulse=1+Math.sin(seconds*2.7+x*.03)*.025;
    ctx.scale(pulse,pulse);
    ctx.beginPath();ctx.moveTo(0,-11);
    ctx.bezierCurveTo(7,-11,9,-3,9,2);
    ctx.bezierCurveTo(9,9,5,12,0,12);
    ctx.bezierCurveTo(-5,12,-9,9,-9,2);
    ctx.bezierCurveTo(-9,-3,-7,-11,0,-11);
    ctx.closePath();ctx.fillStyle='#F9CA45';ctx.fill();
    ctx.lineWidth=.8;ctx.strokeStyle='#986322';ctx.stroke();
    ctx.fillStyle='#FFE89C';
    ctx.beginPath();ctx.ellipse(-2.6,-4.8,2.7,4.1,-.27,0,TAU);ctx.fill();
    ctx.restore();
    return true;
  }
  api.drawEgg = drawEgg;

  function drawTerrain(ctx,poly,screenPoint){
    // Compatibility fallback; materials.js and world.js provide cel shading.
  }
  api.drawTerrain = drawTerrain;

  function finishScene(ctx,level,time){
    if(quality==='classic')return;
    ctx.save();
    ctx.fillStyle=level<=4?'rgba(235,251,203,.012)':
      level<=9?'rgba(191,246,234,.012)':'rgba(228,204,255,.012)';
    ctx.fillRect(0,0,WORLD_W,WORLD_H);
    ctx.restore();
  }
  api.finishScene = finishScene;

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
    bar.setAttribute('aria-label','Modo gráfico y pantalla completa');
    const preset = document.createElement('button');
    preset.type = 'button';
    preset.dataset.remasterMode = '1';
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
    if (ev.code === 'KeyH') {
      ev.preventDefault();
      setQuality(QUALITY[(QUALITY.indexOf(quality) + 1) % QUALITY.length]);
    }else if (ev.code === 'KeyF') {
      ev.preventDefault();fullScreen();
    }
  };
  window.addEventListener('keydown',keyHandler);
  window.BounceRemaster = api;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bootToolbar,{once:true});
  else bootToolbar();
})();
