# Bounce Tales UHD 2.5D — versión 1.0

Esta implementación añade una capa visual procedimental no destructiva sobre la reconstrucción V62 de Bounce Tales.

## Cambios incluidos
- Render físico de Canvas adaptado a resolución del monitor: perfiles Clásico (240×320), HD (72% de densidad de salida) y Ultra (densidad física hasta 4096px por eje).
- Material esférico para Bounce: iluminación difusa, especulares, borde oscuro, destellos y reflejos. Se conserva el cuerpo original bajo el efecto y los ojos originales encima.
- Huevos con material dorado y reflejos, sin cambios en su posición lógica ni detección de recogida.
- Iluminación y relieve de mallas de terreno mediante gradientes y trazas visibles dentro de los triángulos originales.
- Ambiente según bioma, viñeta tenue y luz solar suave, sin modificar el mundo lógico.
- Pantalla grande en escritorio, controles táctiles solo en dispositivos táctiles, soporte full-screen.
- Botones de calidad y pantalla completa, atajos H / F.

**Limitación conocida:** es una primera remasterización 2.5D en Canvas2D, con apariencia de iluminación moderna; no es trazado RTX de rayos por hardware. Los sprites de entorno originales siguen presentes y no están redibujados fotográficamente en 4K. Se mantiene el modo Clásico para probar paridad y rendimiento.

## Reglas de preservación
- No se modificaron los archivos RLEF, las físicas, los eventos, la cámara ni los datos de niveles.
- Se añadieron cinco hooks visuales en game.js y dos recursos remasterizados: remaster/remaster.js y remaster/remaster.css.
- La diferencia de render se produce después del cálculo de posiciones y sin cambios a las hitboxes.
- Los overlays y las etiquetas originales se conservan.
- Los modos visuales se almacenan únicamente en localStorage (con fallback ante bloqueos).
- El repo conserva la licencia y atribución original del creador del port.

## Pruebas
Ejecutar \`npm run verify\`. Incluye \`tests/remaster-integration.cjs\`.
El workflow de Pages copia la carpeta remaster/ a la web estática.
