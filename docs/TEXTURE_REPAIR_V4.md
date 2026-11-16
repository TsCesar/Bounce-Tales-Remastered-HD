# Corrección general de texturas — V4

Esta versión elimina la causa del acabado borroso y artificial de la V3.

## Cambios aplicados

- Los 326 sprites originales se procesan de nuevo **sin grano, sin ruido artificial, sin realce de contornos agresivo y sin alterar su paleta**.
- Se distinguen 2 tratamientos: \`pixel\` para HUD, elementos pequeños y contornos delicados; \`smooth\` para recursos gráficos de mayor tamaño. Cada textura guarda su política de muestreo en \`manifest.json\`.
- El motor usa la resolución de píxeles completa de cada pantalla para **HD y Ultra**. Ya no reescala un lienzo interno al 72%.
- La pintura del suelo deja de aplicar ruido procedimental: mantiene el color original y añade únicamente una sombra direccional tenue.
- La bola roja recibe iluminación más contenida; se atenúan los velos de brillo que cubrían la imagen.
- El modo Clásico mantiene el aspecto original. Si falta un atlas HD, cada sprite vuelve automáticamente al original.
- Los fondos cinematográficos y el agua se conservan.

## Alcance y límites

Esta es una restauración de limpieza y nitidez de los recursos existentes, **no** 326 ilustraciones realistas nuevas. El juego sigue siendo una reconstrucción HTML5 de un título creado para una superficie de 240×320. La resolución de salida más alta no inventa información de imagen que no exista.

## Comprobaciones

\`npm run verify\` confirma que la lógica, los niveles y las pruebas originales siguen pasando. GitHub Actions genera las páginas HD, valida los 326 registros con \`tools/validate_hd_textures.py\` y despliega en Pages. Para distinguir visualmente, usa H: Clásico, HD, Ultra. Es posible necesitar una recarga forzada tras la publicación por el service worker.
