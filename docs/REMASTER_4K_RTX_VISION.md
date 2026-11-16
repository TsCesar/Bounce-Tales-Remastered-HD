# Dirección artística y técnica — Bounce Tales Remastered 4K / RTX-look

**Estado:** especificación, no implementación.
**Base:** proyecto web V62 importado de PrasannaOne/BounceTales.
**Objetivo:** misma campaña, mismos 15 capítulos, mismas físicas y colisiones; aspecto visual nuevo, tridimensional en iluminación pero con juego y geometría 2D originales.

## 1. Resultado visual

- Bounce sigue siendo una esfera roja reconocible, con materiales de alta definición, reflejos especulares, rugosidad controlada, ojos/expresiones fieles al clásico y deformación visual al rebotar.
- Praderas, tierra, roca, madera, agua, maquinaria y vegetación se redibujan en alta resolución; el perfil, ubicación y **silueta jugable** de cada plataforma se mantienen exactamente donde están.
- Iluminación dinámica que responda a la posición del jugador, sombras suaves sobre el terreno, oclusión ambiental simulada (AO), brillo sobre huevos y efectos de refracción/reflejo en agua.
- Profundidad en capas (parallax), partículas ambientales, niebla atmosférica sutil y postprocesado ligero; evitar ruido, desenfoque excesivo o decoraciones que tapen obstáculos.
- Menús y HUD de alta resolución; respetar símbolos, accesibilidad, tamaño de pulsación y diseño reconocible.

> «4K RTX» se interpreta como objetivo visual de **alta definición e iluminación tipo ray tracing**. No equivale a que el navegador ejecute NVIDIA RTX nativo ni a un ray tracing completo. La API WebGPU expone GPU/shaders y computación, con soporte dependiente de navegador/dispositivo. Debe existir fallback WebGL2 o Canvas2D.

## 2. Resolución y cámara

- **El mundo lógico sigue siendo 240 × 320.** No alterar datos de cámara, límites, velocidades ni posiciones.
- Un monitor UHD 3840 × 2160 en modo 3:4 presenta el juego a **1620 × 2160**, centrado, salvo que el usuario opte explícitamente por marcos decorativos laterales.
- Escala visual adaptativa en CSS + `devicePixelRatio`, con tope configurable de resolución física para controlar memoria y rendimiento.
- Las imágenes **deben redibujarse** o renderizarse a resolución adecuada; ampliar los sprites existentes con un filtro no aumenta el detalle real.

## 3. Arquitectura de renderizado

```text
V62: lógica a 60 Hz + niveles RLEF + colisiones (INALTERADOS)
  -> estado visual, IDs de sprites, mapas y cámara original
  -> capa remaster 2.5D (WebGL2 inicial, WebGPU opcional)
      atlas HD + normal maps + roughness/emission masks
      iluminación 2D/2.5D + sombras visuales + parallax
      agua/partículas + postprocesado opcional
  -> salida HD adaptativa 3:4
  -> HUD y overlays nítidos
```

Integración por módulos propios (sin modificar los algoritmos físicos):
- `remaster/renderer/renderer.js`: compositor/capabilities/performance.
- `remaster/renderer/materials.js`: normal maps, roughness, metalness estilizada, emission.
- `remaster/renderer/lighting.js`: luces dinámicas y sombras 2D.
- `remaster/renderer/particles.js`: efectos exclusivamente visuales.
- `remaster/renderer/backgrounds.js`: fondos y parallax sin afectar geometría.
- `remaster/css/remaster.css`: fullscreen, 3:4, controles móviles y UI.
- `remaster/assets/hd/`: sprites HD, mapas de normales/materiales.
- `remaster/assets/manifest.json`: ID de sprite -> recurso HD, origen, escala, pivote y máscara.

Puntos existentes a respetar:
- `game.js`: `imgFor()`, `drawImageMap()`, `drawGameplayScene()`, `draw()`, `loop()`.
- `src/sprite-atlas.js`: 326 descriptores estáticos, 46 imágenes PNG. No renumerar sprite IDs ni cambiar pivotes.
- `src/original-camera.js`, `src/bounce-physics.js`, `src/original-collision.js`, `src/terrain-collision.js`, `src/event-engine.js`: no modificar.
- `sw.js` y `index.html`: versionar y cachear los nuevos assets sin afectar carga de V62.

## 4. Restricciones para preservar la identidad

1. Mismo contorno jugable: el jugador puede reconocer los saltos, huecos, trampas y rutas de cada nivel.
2. Los assets nuevos deben reutilizar los mismos puntos de anclaje, dimensiones lógicas y secuencias de animación, incluso si una capa decorativa sobresale visualmente.
3. No alterar la lectura de hitboxes ni la cámara para hacer sitio a decoraciones.
4. Si se representa volumen 3D, que sea un **2.5D de cámara fija**: no crear plataformas 3D navegables ni controles nuevos.
5. La escena no debe perder legibilidad por bloom, luz intensa, niebla, parallax o partículas.
6. Toda la nueva estética tiene que poder apagarse para comparar con la versión V62 original.

## 5. Calidad gráfica (perfiles)

| Perfil | Render | Efectos |
|---|---|---|
| Clásico | V62 sin cambios | Sin efectos remaster |
| HD | HD sprites y fullscreen | Luces básicas, sombras suaves, parallax moderado |
| Ultra | Alta resolución adaptativa | Materiales PBR 2.5D, reflejos, AO simulada, partículas |
| Cinemático | Máxima resolución según GPU/viewport | Más efectos y calidad de sombras; objetivo flexible de FPS, nunca promesa de 60 FPS |

El motor de simulación sigue funcionando a 60 Hz en todos los perfiles. Calidad visual, render y rendimiento deben desacoplarse.

## 6. Orden de trabajo

1. **Vertical slice**: nivel 1, primera pantalla; Bounce y dos tipos de terreno con materiales HD y una luz dinámica.
2. Comparar captura original vs remaster; confirmar paridad de movimientos, objetos y visibilidad.
3. Completar sprites de Bounce, huevos, enemigos, transformaciones y peligros.
4. Rehacer atlas de terrenos/decoración de todos los capítulos y fondos coherentes con cada bioma.
5. Introducir agua, partículas, iluminación especial y postprocesado.
6. Adaptar menús, HUD y controles responsive; mantener opciones para móvil y fullscreen.
7. Ensayar los 15 capítulos y performance en desktop con fallback móvil.

## 7. Criterios de aceptación

- `npm run verify` pasa.
- Los mapas/RLEF originales y módulos físicos no presentan diffs.
- Capturas de referencia originales vs remaster conservan geometría, posiciones y visibilidad útil.
- Se puede jugar y completar los capítulos en la versión web.
- Browser PC: fullscreen sin deformación, sin controles táctiles visibles; móvil: controles accesibles y compactos.
- GitHub Pages carga todos los assets y no tiene 404, sin pantallas en negro ni errores bloqueantes.
- El usuario puede activar/desactivar el remaster y regular calidad.
- Se mide FPS real y consumo; no confundir salida 4K con texturas 4K ni con ray tracing por hardware.

## 8. Derechos y atribución

El titular del repositorio ha afirmado disponer de permiso de modificación/distribución. Esa afirmación no altera la licencia de referencia ni los derechos sobre materiales de Nokia/Rovio u otros terceros. Conservar avisos y derechos pertinentes. Crear gráficos nuevos bajo condiciones de uso autorizadas y registrar su procedencia.
