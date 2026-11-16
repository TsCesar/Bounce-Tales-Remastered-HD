/* Bounce Tales Remastered HD — presentation only; original game loop stays intact. */
(() => {
  'use strict';
  const source = document.getElementById('game');
  const wrapper = document.getElementById('game-wrap');
  if (!source || !wrapper) return;

  const output = document.createElement('canvas');
  output.id = 'remaster-display';
  output.setAttribute('aria-hidden', 'true');
  source.insertAdjacentElement('afterend', output);

  const out = output.getContext('2d', { alpha: false, desynchronized: true });
  if (!out) { output.remove(); return; }
  let quality = 'hd';
  try { quality = localStorage.getItem('tscesar-bounce-quality') === 'pixel' ? 'pixel' : 'hd'; } catch (_) {}
  let active = false;

  const controls = document.createElement('div');
  controls.className = 'remaster-controls';
  controls.setAttribute('aria-label', 'Controles de visualización');

  const qualityButton = document.createElement('button');
  qualityButton.type = 'button';
  qualityButton.className = 'remaster-chip';
  qualityButton.title = 'Alternar escala HD / píxel clásico (H)';

  const fullscreenButton = document.createElement('button');
  fullscreenButton.type = 'button';
  fullscreenButton.className = 'remaster-chip';
  fullscreenButton.title = 'Pantalla completa (F)';
  fullscreenButton.textContent = '⛶';
  fullscreenButton.setAttribute('aria-label', 'Pantalla completa');

  function labelQuality() {
    qualityButton.textContent = quality === 'hd' ? 'HD ✓' : 'Píxel';
    qualityButton.setAttribute('aria-pressed', String(quality === 'hd'));
    document.documentElement.classList.toggle('remaster-pixel', quality === 'pixel');
  }
  labelQuality();
  qualityButton.addEventListener('click', () => {
    quality = quality === 'hd' ? 'pixel' : 'hd';
    try { localStorage.setItem('tscesar-bounce-quality', quality); } catch (_) {}
    labelQuality();
  });

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) { console.warn('Pantalla completa no disponible:', error); }
  }
  fullscreenButton.addEventListener('click', toggleFullscreen);
  controls.append(qualityButton, fullscreenButton);
  document.body.append(controls);

  addEventListener('keydown', event => {
    const target = event.target;
    if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (event.code === 'KeyF') {
      event.preventDefault();
      toggleFullscreen();
    } else if (event.code === 'KeyH') {
      event.preventDefault();
      qualityButton.click();
    }
  }, { capture: true });

  function render() {
    try {
      const bounds = source.getBoundingClientRect();
      if (bounds.width > 0 && bounds.height > 0) {
        const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1));
        const scale = Math.min(1, 4096 / Math.max(bounds.width * dpr, bounds.height * dpr));
        const width = Math.max(240, Math.round(bounds.width * dpr * scale));
        const height = Math.max(320, Math.round(bounds.height * dpr * scale));
        if (output.width !== width || output.height !== height) {
          output.width = width;
          output.height = height;
        }
        out.imageSmoothingEnabled = quality === 'hd';
        out.imageSmoothingQuality = quality === 'hd' ? 'high' : 'low';
        out.filter = quality === 'hd' ? 'contrast(1.045) saturate(1.07)' : 'none';
        out.drawImage(source, 0, 0, width, height);
        out.filter = 'none';
        if (!active) {
          document.documentElement.classList.add('remaster-active');
          active = true;
        }
      }
    } catch (error) {
      if (active) {
        document.documentElement.classList.remove('remaster-active');
        active = false;
      }
      console.warn('Remaster HD: se utiliza el lienzo clásico.', error);
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();