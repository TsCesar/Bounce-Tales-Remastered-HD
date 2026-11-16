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
  const MAX_PIXELS = 4096;
  const TAU = Math.PI * 2;

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
    const deviceDpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const scale = quality === 'ultra' ? 1 : 0.72;
    // A 2160p monitor uses an approximately 1620×2160 3:4 canvas.
    const targetW = Math.min(MAX_PIXELS, Math.max(WORLD_W, Math.round(cssW * deviceDpr * scale)));
    const targetH = Math.min(MAX_PIXELS, Math.max(WORLD_H, Math.round(cssH * deviceDpr * scale)));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    ctx.setTransform(canvas.width / WORLD_W, 0, 0, canvas.height / WORLD_H, 0, 0);
    // Original low-res textures remain pixel-sharp during HD atlas loading.
    // The texture atlas loader enables high-quality sampling per 4x resource.
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = 'low';
  }
  api.beginFrame = beginFrame;

  function drawBounce(ctx, p) {
    if (quality === 'classic' || !p || p.r <= 0) return;
    const r = p.r;
    ctx.save();
    ctx.translate(p.x, p.y);
    const stretch = p.stretch || [];
    const n = stretch.length === 4 ?
      Math.max(-0.09, Math.min(0.09, ((stretch[0] + stretch[2]) - (stretch[1] + stretch[3])) / Math.max(r * 40, 1))) : 0;
    ctx.scale(1 + n, 1 - n);
    // The old form and collision silhouette remain; the new material fits INSIDE them.
    const inner = p.form === 0 ? 0.89 : 0.80;
    const rx = r * inner, ry = r * inner;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.clip();
    if (p.form === 0) {
      const surface = ctx.createRadialGradient(-r * .38, -r * .46, r * .04, r * .15, r * .20, r * 1.32);
      surface.addColorStop(0, '#ffe0c9');
      surface.addColorStop(.12, '#ff7551');
      surface.addColorStop(.35, '#ee1c26');
      surface.addColorStop(.7, '#aa101c');
      surface.addColorStop(1, '#28070e');
      ctx.fillStyle = surface;
      ctx.fillRect(-r, -r, r * 2, r * 2);
    } else {
      const shade = ctx.createLinearGradient(-r, -r, r, r);
      shade.addColorStop(0, 'rgba(255,255,255,.4)');
      shade.addColorStop(.43, 'rgba(255,255,255,.06)');
      shade.addColorStop(1, 'rgba(0,0,0,.52)');
      ctx.fillStyle = shade;
      ctx.fillRect(-r, -r, 2*r, 2*r);
    }
    const lustre = ctx.createRadialGradient(-r * .35, -r * .58, 0, -r * .35, -r * .58, r * .62);
    lustre.addColorStop(0, 'rgba(255,255,255,.77)');
    lustre.addColorStop(.25, 'rgba(255,255,255,.23)');
    lustre.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lustre;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    if (quality === 'ultra') {
      ctx.lineWidth = Math.max(.25, r * .025);
      ctx.strokeStyle = 'rgba(255,245,237,.21)';
      ctx.beginPath();
      ctx.arc(-r * .03, -r * .03, r * .7, Math.PI * 1.15, Math.PI * 1.81);
      ctx.stroke();
      const bounceShine = Math.sin(p.rotation * .7);
      ctx.fillStyle = 'rgba(255,255,255,.17)';
      ctx.beginPath();
      ctx.ellipse(-r * .30 + bounceShine * r * .07, -r * .53, r * .19, r * .065, -.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  api.drawBounce = drawBounce;

  function drawEgg(ctx, x, y, seconds) {
    if (quality === 'classic') return false;
    const pulse = .89 + .11 * Math.cos(seconds * 3 + x * .05);
    ctx.save();
    ctx.translate(x, y);
    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, 18);
    halo.addColorStop(0, 'rgba(255,222,117,.34)');
    halo.addColorStop(1, 'rgba(255,219,70,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-18, -18, 36, 36);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.bezierCurveTo(7, -11, 9, -3, 9, 2);
    ctx.bezierCurveTo(9, 9, 5, 12, 0, 12);
    ctx.bezierCurveTo(-5, 12, -9, 9, -9, 2);
    ctx.bezierCurveTo(-9, -3, -7, -11, 0, -11);
    ctx.closePath();
    const metal = ctx.createLinearGradient(-9, -9, 9, 12);
    metal.addColorStop(0, '#fff9ca');
    metal.addColorStop(.24, '#ffdf60');
    metal.addColorStop(.48, '#f4a92e');
    metal.addColorStop(.7, '#c97918');
    metal.addColorStop(1, '#713e13');
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.strokeStyle = 'rgba(91,45,9,.8)';
    ctx.lineWidth = .6;
    ctx.stroke();
    const shine = ctx.createRadialGradient(-3, -5, 0, -2, -4, 9);
    shine.addColorStop(0, 'rgba(255,255,255,.9)');
    shine.addColorStop(.25, 'rgba(255,255,255,.29)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 11, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    return true;
  }
  api.drawEgg = drawEgg;

  // Terrain materials are drawn ONLY inside the existing triangle mesh.
  // No edge positions, object transforms or hitboxes are modified.
  function drawTerrain(ctx, poly, screenPoint) {
    if (quality === 'classic' || !poly || !poly.faces || !poly.vertices) return;
    const vs = poly.vertices, faces = poly.faces;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const triangles = [];
    for (let i = 0; i + 2 < faces.length; i += 3) {
      const va = vs[faces[i]], vb = vs[faces[i + 1]], vc = vs[faces[i + 2]];
      if (!va || !vb || !vc) continue;
      const a = screenPoint(va), b = screenPoint(vb), c = screenPoint(vc);
      for (const pt of [a, b, c]) {
        minX = Math.min(minX, pt.x); minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x); maxY = Math.max(maxY, pt.y);
      }
      triangles.push([a, b, c]);
    }
    if (!triangles.length || maxX < -5 || minX > WORLD_W + 5 ||
        maxY < -5 || minY > WORLD_H + 5 || maxY - minY < .02) return;
    ctx.save();
    ctx.beginPath();
    for (const [a,b,c] of triangles) {
      ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
    }
    ctx.clip();
    const height = Math.max(1, maxY - minY);
    const material = ctx.createLinearGradient(minX, minY, minX + (maxX-minX) * .1, minY + height);
    material.addColorStop(0, 'rgba(250,255,218,.40)');
    material.addColorStop(.16, 'rgba(255,247,196,.18)');
    material.addColorStop(.55, 'rgba(25,28,25,.03)');
    material.addColorStop(1, 'rgba(5,16,18,.38)');
    ctx.fillStyle = material;
    ctx.fillRect(minX,minY,maxX-minX,height);
    if (quality === 'ultra') {
      // Surface relief lines are screen-space decoration, never collision geometry.
      const edge = Math.max(.22, Math.min(1.1, height / 80));
      for (const [a,b,c] of triangles) {
        const pts = [a,b,c];
        ctx.strokeStyle = 'rgba(255,246,201,.10)';
        ctx.lineWidth = edge;
        ctx.beginPath();
        for (let j=0; j<3; j++) {
          const one=pts[j], two=pts[(j+1)%3];
          if (Math.abs(one.y-two.y) < Math.abs(one.x-two.x)*.22) {
            ctx.moveTo(one.x,one.y+.35);ctx.lineTo(two.x,two.y+.35);
          }
        }
        ctx.stroke();
      }
      // Fine material variation, stable relative to the screen and subtly lit.
      const step = 6;
      ctx.fillStyle = 'rgba(255,255,245,.055)';
      for (let j=Math.floor(minY/step)*step; j<=Math.min(maxY,WORLD_H);j+=step)
        for(let i=Math.floor(minX/step)*step;i<=Math.min(maxX,WORLD_W);i+=step)
          if (((i*37+j*19+poly.color) & 7) === 0) ctx.fillRect(i+.5,j+.6,.55,.42);
    }
    ctx.restore();
  }
  api.drawTerrain = drawTerrain;

  function finishScene(ctx, level, time) {
    if (quality === 'classic') return;
    ctx.save();
    const biomes = level <= 4 ? ['rgba(255,244,187,.22)', 'rgba(116,205,255,.04)']
      : level <= 9 ? ['rgba(166,255,224,.18)','rgba(78,156,176,.04)']
      : ['rgba(246,190,255,.17)','rgba(92,64,255,.045)'];
    ctx.globalCompositeOperation = 'screen';
    const sun = ctx.createRadialGradient(35, 28, 2, 52, 64, 260);
    sun.addColorStop(0, biomes[0]);
    sun.addColorStop(.45, biomes[1]);
    sun.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    if (quality === 'ultra') {
      ctx.globalCompositeOperation = 'source-over';
      const vignette = ctx.createRadialGradient(120, 148, 80, 120, 160, 250);
      vignette.addColorStop(0,'rgba(0,0,0,0)');
      vignette.addColorStop(1,'rgba(2,7,20,.17)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0,0,WORLD_W,WORLD_H);
    }
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