# Dirección artística retro-cartoon (V13)

La V13 cambia **solo la presentación gráfica** para acercarla al Bounce Tales Java ME original. Los 15 mapas RLEF, las físicas de Bounce/Bumpy/Wolly, los eventos, la destrucción de montones de roca y los controles no se han modificado.

## Arte de escenarios
- Cuatro fondos ilustrados de 1200 × 1600: bosque, laguna, crepúsculo y atardecer.
- Cielo con degradado suave de tres colores, nubes redondeadas, colinas de silueta limpia y árboles/piedras grandes dibujados en planos de color.
- Las antiguas variaciones por píxel, ruido, microrelieve rocoso, polvo ambiental y fondos de aspecto fotográfico se han sustituido por grandes formas ilustradas.
- Los terrenos físicos usan su color original y un sombreado cel-shaded leve, sin mosaicos de ruido ni fototexturas.
- El agua conserva la física original y se muestra con colores turquesa y 3–4 bandas de olas dibujadas.

## Personajes, objetos y menús
- La bola roja tiene dos o tres tonos sólidos de rojo y un brillo suave tipo dibujo animado.
- Los huevos son dorados mate, con una única marca clara, no de metal reflectante.
- Bumpy (32 imágenes originales), Wolly (seis sectores), enemigos, plataformas y los demás 326 sprites **conservan la imagen de origen limpiamente ampliada**. No aplicar tratamientos agresivos para intentar extraer detalles que no existen.
- El libro de portada mantiene las piezas vectoriales y el texto legible, con cuero y herrajes de colores planos.
- El modo Clásico sigue mostrando el arte original.

## Reglas de fidelidad
- No usar fotografías, materiales PBR, bloom, ray tracing, viñetas oscuras ni ruido procedural por píxel.
- No modificar la geometría de colisión ni los flags de los objetos.
- El modo HD dibuja las mismas capas de nivel, sin efectos adicionales innecesarios.

## Validación
- \`tests/retro-cartoon-art.test.cjs\` verifica que no reaparezcan los anteriores generadores de grano/relieve ni las caústicas del agua.
- Los workflows de web, Android e iOS regeneran los cuatro fondos y cargan los mismos archivos, cada uno desde su rama.
- La web usa la ruta de assets con versión v13 y un nuevo service worker para actualizar copias en caché.

**Límite:** los objetos originales se conservan porque son fieles al videojuego. La V13 es un remaster artístico de escenarios y efectos, no un redibujado manual de los 326 sprites ni un motor 3D.
