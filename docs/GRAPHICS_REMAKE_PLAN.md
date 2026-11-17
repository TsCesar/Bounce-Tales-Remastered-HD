# Remake gráfico progresivo — plan de ejecución

Se conserva **sin cambios** el libro V13 (portada, páginas y adornos). El remake es visual: todos los niveles RLEF originales, física, colisiones, enemigos y scripts de eventos se conservan. Las ramas de destino siguen separadas: \`main\` motor compartido, \`web\`, \`android\` e \`ios\`.

## Fase 1 — V14, iniciada e implementada
- [x] **Bounce rojo:** cuerpo nuevo vectorial, sombreado cartoon y ojos dibujados en alta resolución.
- [x] **Bumpy piedra:** silueta rocosa original reinterpretada como polígono orgánico, caras y grietas nuevas. Rotación vinculada a la variable física existente.
- [x] **Wolly:** pelota de playa vectorial de seis paneles de color, rotación original y ojos nuevos.
- [x] **Terreno:** relleno vectorial de geometría original en una única pasada por malla, colores simplificados y luz consistente en coordenadas de pantalla. Se elimina el antiguo sombreado independiente por pieza que mostraba cortes rectangulares.
- [x] **Montones rompibles:** dibujo cohesionado nuevo para las formaciones originales 357/358. Se conserva la retirada por impacto con Bumpy ya implementada.
- [x] **Fondos:** las cuatro ilustraciones HD de V13 sustituyen en gameplay a las capas antiguas de sprites repetidos. No se generan uniones de tiras.
- [x] **Clásico:** los gráficos originales siguen disponibles y son el modo de comparación.
- [x] **Libro:** ninguna modificación al archivo \`remaster/book.js\`.

## Fase 2 — V15 en ejecución
- [x] **Muelles:** nuevas ilustraciones para los tres modelos de las fases originales (IDs animados 497/509/490); la compresión se sincroniza con el fotograma físico.
- [x] **Cañones:** redibujados como juguetes metálicos cartoon, con orientación y fogonazo según los estados del motor. No se modifican el lanzamiento ni la puntería.
- [x] **Enemigos (cuatro tipos):** Candle, bumper, mole y stalker sustituyen el pixelado; desaparecen los cuadrados de error magenta en los modos HD/Ultra. La animación de peeking del topo depende del mismo temporizador que su comportamiento.
- [x] **NPC aliados:** bola roja ilustrada con rostro y movimiento suave, sin modificar encuentros y diálogos.
- [ ] **Resto de props y plataformas:** identificar con evidencias cada familia de sprites de puentes, madera y decoración y sustituirla por arte sin uniones visibles, sin inventar IDs.
- [ ] **Animación fotograma a fotograma adicional:** mejorar gestos específicos de enemigos y props que aún estén representados de forma simplificada.
- [ ] **Efectos:** transformación, impactos, partículas, fragmentos, agua y daño con formas vectoriales coherentes.
- [ ] **HUD secundario y detalles de nivel:** sustituir los iconos de baja resolución aún visibles sin rehacer el libro.
- [ ] **Prueba visual integral:** recorrido manual de los quince capítulos, capturas de cada bioma y dispositivos físicos Android/iOS.

## Política de render

El **modo Clásico** usa exactamente el render original. **HD/Ultra** dibujan nuevas formas y bloques vectoriales sin editar datos físicos. No usar filtros globales para ampliar sprites ni capas de roca fotorealista. Cualquier prop sin remake aprobado conserva el arte anterior, nunca un dibujo inventado que pueda alterar la legibilidad del gameplay.

## Criterios de validación
- \`npm run verify\` y comprobación Chromium con las escenas de menú, juego y pausa.
- Verificar todas las ramas y la generación del APK Android y proyecto Xcode.
- En cada revisión, comparar capturas; un test de integración correcto no sustituye una revisión visual en móvil.

**Limitación actual:** V15 cubre las tres formas, las rocas, los fondos, los muelles, cañones, NPC y cuatro familias de enemigos. Quedan sprites de plataformas, madera y decoración por redibujar. El libro y las formas V14 permanecen sin cambios. Las mecánicas, físicas y niveles son las mismas.
