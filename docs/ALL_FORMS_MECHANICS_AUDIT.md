# Auditoría de mecánicas de todas las formas — noviembre 2026

**Origen técnico:** decompilación original \`c.java\` y recursos RLEF del JAR 2.0.3 conservados en el proyecto. Comparación adicional con los módulos HTML5 existentes. Esto es una auditoría de lógica, no una prueba de recorrido humano de los 15 niveles.

| Mecánica | Bounce rojo | Bumpy piedra | Wolly playa |
|---|---|---|---|
| Radio de colisión | 20 | 20 | 20 |
| Escala de gravedad | 1.0 | 1.4 | 0.5 |
| Fricción | 0.6 | 0.3 | 0.6 |
| Aceleración horizontal | 500 | 350 | 312.5 |
| Velocidad horizontal máxima | 280 | 350 | 150 |
| Atenuación control aéreo | 1.5 | 2.5 | 1.2 |
| Impulso de salto | 288 | 255 | 162.5 |
| Rebote/ricochet | 0.1 | 0.1 | 0.1 |
| Enemigo bumper (tipo 1) | Te daña | Lo destruye | Te daña |
| Montones de piedra 357/358 | No | Interacción por impacto (adaptación reciente) | No |

La gravedad total y el impulso se normalizan mediante \`1/gravity[form]\` en \`BounceBody.update\`. Por eso el salto de Wolly resulta superior al rojo pese a que el valor \`jumpAcceleration\` nominal sea menor. No alterar los valores fuente para reproducir la apariencia de un salto aislado.

## Desbloqueos
- Bumpy: superar \`Bumpy Cracks\` (índice 3 de campaña).
- Wolly: superar \`Trapped in Machine\` (índice 8 de campaña).
- Super Bounce: no es una cuarta \`forme\`. Es una mejora oculta **solo del rojo** después de conseguir todas las medallas doradas del libro, incluidos los capítulos extras que otorgan huevos. \`BounceBody.moveLeft/moveRight(true)\` ya conserva un aumento horizontal de +50 definido en el port; V6 activa ese camino a partir del guardado real, sin habilitarlo para Bumpy ni Wolly. No se modifica \`jump()\`: el efecto exacto sobre el salto del modo secreto requiere reproducción diferencial de la versión J2ME.

## Correcciones V6
1. La capa \`remaster/remaster.js\` deja de superponer la esfera roja sobre Bumpy (32 cuadros de roca) y Wolly (seis segmentos de playa). Sus dibujos originales quedan visibles.
2. El juego conecta el incremento de velocidad lateral de Super Bounce con \`superBounceUnlocked(progress)\`, función derivada de los récords y medallas originales, también tras cargar un guardado existente.
3. Los montones de rocas se agrupan para rotura únicamente por cercanía **y variedad complementaria** (357 frente a 358). Evitamos que dos montones que comparten imagen y padre se borren a la vez sin relación.
4. Pruebas automatizadas comprueban las tres formas, sus interacciones, desbloqueos y persistencia, además de los originales 15 niveles.

## Limitaciones pendientes de verificación comparativa
- La rotura de piedras en \`src/rock-break.js\` sigue siendo una **adaptación**: el JAR utiliza eventos específicos de nivel y es necesaria una prueba jugable para demostrar que cada muro se rompe exactamente en el mismo momento que el original.
- El comportamiento exacto del efecto estelar de Super Bounce y su impulso vertical final no se han implementado/reclamado sin evidencia de código.
- La paridad original-vs-web solo está medida de forma diferencial sobre secuencias cortas del primer nivel. Los 15 niveles tienen verificaciones de lectura, arranque y scripting; no recorridos completos de cada forma con un emulador.
- El sistema de enemigos conserva algunas representaciones visuales antiguas provisionales. El resultado de una prueba lógica no demuestra su calidad gráfica.

## Verificación
Ejecutar \`npm run verify\` en GitHub Actions; incluye \`tests/all-forms-mechanics-audit.test.cjs\`.
