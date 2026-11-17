/* Bounce Tales Remastered UHD — independent presentation overlay.
 * Gameplay, physics, level data and camera model remain the V62 original.
 * "RTX look" means 2.5D material/lighting simulation, not hardware ray tracing.
 */
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
  const TAU = Math.PI * 2;
  let lastMeasuredFrame=0,slowFrames=0;
  function renderingScale(cssW,cssH){
    // Maintain aspect ratio and limit both texture dimensions and pixel area.
    // These budgets are intentionally conservative for GPU-less WebViews.
    const budget=coarse?1300000:3200000;
    const deviceDpr=Math.max(1,Math.min(coarse?2:2.25,window.devicePixelRatio||1));
    const requested=quality==='ultra'?deviceDpr:Math.min(deviceDpr,1.5);
    return Math.min(requested,MAX_PIXELS/Math.max(cssW,cssH),
      Math.sqrt(budget/Math.max(1,cssW*cssH)));
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
    // Constrain by total pixels, not just width/height separately; use the
    // same scale on both axes to preserve camera/UI proportions.
    const targetW = Math.max(WORLD_W, Math.round(cssW * scale));
    const targetH = Math.max(WORLD_H, Math.round(cssH * scale));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
    // Preserve pixel-accurate originals. Individual HD sprites may override
    // sampling locally; menus and text never inherit a global blur.
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
  }
  api.beginFrame = beginFrame;

  function drawBounce(ctx,p){
    // Gentle arcade colour bands, not glossy PBR. Bumpy/Wolly keep their own
    // original animations, and no physics or hitboxes are modified.
    if(quality==='classic'||!p||p.r<=0||p.form !== 0)return;
    const r=p.r;
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.beginPath();
    ctx.ellipse(0,0,r*.9,r*.9,0,0,TAU);
    ctx.clip();
    const red=ctx.createLinearGradient(-r,-r,r,r);
    red.addColorStop(0,'#ff7770');
    red.addColorStop(.42,'#f33139');
    red.addColorStop(1,'#b81a2a');
    ctx.fillStyle=red;
    ctx.fillRect(-r,-r,r*2,r*2);
    ctx.fillStyle='rgba(255,202,172,.23)';
    ctx.beginPath();
    ctx.ellipse(-r*.30,-r*.40,r*.35,r*.24,-.48,0,TAU);
    ctx.fill();
    ctx.restore();
  }
  api.drawBounce = drawBounce;

  function drawEgg(ctx,x,y,seconds){
    if(quality==='classic')return false;
    ctx.save();
    ctx.translate(x,y);
    // Small, flat gold egg — no metallic glare, volumetric halo or caustics.
    const pulse=1+Math.sin(seconds*2.7+x*.03)*.025;
    ctx.scale(pulse,pulse);
    ctx.beginPath();
    ctx.moveTo(0,-11);
    ctx.bezierCurveTo(7,-11,9,-3,9,2);
    ctx.bezierCurveTo(9,9,5,12,0,12);
    ctx.bezierCurveTo(-5,12,-9,9,-9,2);
    ctx.bezierCurveTo(-9,-3,-7,-11,0,-11);
    ctx.closePath();
    ctx.fillStyle='#F9CA45';
    ctx.fill();
    ctx.lineWidth=.8;ctx.strokeStyle='#986322';ctx.stroke();
    ctx.fillStyle='#FFE89C';
    ctx.beginPath();ctx.ellipse(-2.6,-4.8,2.7,4.1,-.27,0,TAU);ctx.fill();
    ctx.restore();
    return true;
  }
  api.drawEgg = drawEgg;

  // Terrain materials are drawn ONLY inside the existing triangle mesh.
  // No edge positions, object transforms or hitboxes are modified.
  function drawTerrain(ctx,poly,screenPoint){
    // Safe original-colour fallback when optional materials.js is not loaded.
    // With materials.js present, this function is replaced by cel shading.
  }
  api.drawTerrain = drawTerrain;

  function finishScene(ctx,level,time){
    if(quality==='classic')return;
    // Almost invisible colour unity across layers. No vignette, bloom,
    // photoreal post-processing or loss of enemy/platform contrast.
    if(quality==='ultra'){
      ctx.save();
      ctx.fillStyle=level<=4?'rgba(235,251,203,.016)':
        level<=9?'rgba(191,246,234,.016)':'rgba(228,204,255,.016)';
      ctx.fillRect(0,0,WORLD_W,WORLD_H);
      ctx.restore();
    }
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