# Auditoría V8 — estabilidad gráfica y contenido móvil

## Problemas reproducibles por revisión del código

1. \`syncMenuTextResolution()\` dimensionaba el canvas de texto por el DPR real y su tamaño CSS, independientemente del presupuesto del canvas principal. En pantallas grandes podía reservar decenas de millones de píxeles. Ahora ambas superficies tienen presupuesto por área: hasta 3,2 Mpx escritorio y 1,3 Mpx en equipos de puntero táctil, con límite 2800 píxeles por eje. También se sincronizan tras cambiar entre Clásico/HD/Ultra, además de al redimensionar.
2. \`remaster/scenery.js\` cargaba por anticipado los cuatro fondos 1200×1600. Ahora se carga el fondo activo por demanda con caché LRU de uno en dispositivos táctiles y dos en escritorio.
3. Las versiones móviles decodificaban las mismas imágenes de atlas de 4x que escritorio. Ahora Android/iOS (y navegador táctil) usan un atlas 2x regenerado del mismo catálogo de 326 sprites y validado separadamente. La versión 4x sigue disponible en equipos no táctiles.
4. \`tools/check-syntax.cjs\` comprobaba el juego, tests y herramientas, pero omitía \`remaster/\`. Ahora todos los archivos JS del renderizador se validan en cada \`npm run verify\`.

## Nuevas pruebas
- \`tests/render-memory-policy.test.cjs\`: presupuestos HD, reinicio Clásico 240×320, carga diferida de fondos y elección 2x/4x.
- \`tools/verify_mobile_bundle.cjs\`: comprueba el contenido real de la carpeta \`public\` después de generar recursos, incluyendo las dos políticas de sprites, los 15 niveles, libros, audio e imágenes.
- Un flujo de navegador Chromium de escritorio/táctil produce capturas y diagnóstico de errores en \`web\` (ver \`.github/workflows/browser-e2e.yml\`).

## Límites honestos
- Las mejoras anteriores no hacen fotorealistas los sprites originales; producir recursos 4K auténticos sigue requiriendo arte nuevo.
- Las pruebas Chromium no reemplazan un recorrido visual completo ni las pruebas en dispositivos iOS/Android reales.
- Las versiones móviles siguen siendo artefactos **de pruebas**; publicar en tiendas requiere autorizaciones de propiedad intelectual, cuentas y firma.
