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
- [x] **35 piezas de terreno y plataformas:** bosque 253–266, laguna 162–175 y franjas del tramo final 120–126 redibujados como siluetas vectoriales suavizadas. Se conservan los offsets y tamaños originales; se evita ampliar los píxeles de los atlas antiguos.
- [x] **19 familias decorativas y peligros:** flores, arbustos, hongos, cristales, árboles, calabazas, anillos del tronco y pinchos redibujados con los recortes y anclajes originales.
- [x] **Pilares altos del bosque:** decorados con bandas simples de corteza dentro de su geometría, sin cambiar la colisión.
- [x] **Piezas estructurales V19:** redibujadas las familias 130–132 (interior de cuevas) y 176–178 (columnas de la laguna), que se repiten cientos de veces entre los niveles originales.
- [x] **Carteles y señales V19:** tablas de madera 152/243, flechas y advertencias 153/154 y 244–250, conservando dimensiones y posiciones.
- [ ] **Resto de props:** comprobar uno a uno los elementos de maderas, puentes y decoración aún presentes en el atlas; no sustituir elementos sin correspondencia real con el nivel.
- [ ] **Animación fotograma a fotograma adicional:** mejorar gestos específicos de enemigos y props que aún estén representados de forma simplificada.
- [x] **Efectos V19:** partículas vectoriales de fragmentación de rocas (IDs de fuente 390/396/414); su simulación sigue siendo la original. Los otros efectos ya dibujaban formas en Canvas.
- [x] **HUD V19:** iconos y contadores de huevos y tiempo redibujados con texto nítido y contraste accesible, sin modificar el libro ni los valores internos.
- [ ] **Efectos/HUD restantes:** revisión visual de transiciones, checkpoints, avisos y estados concretos en los 15 niveles.
- [ ] **Prueba visual integral:** recorrido manual de los quince capítulos, capturas de cada bioma y dispositivos físicos Android/iOS.

## Política de render

El **modo Clásico** usa exactamente el render original. **HD/Ultra** dibujan nuevas formas y bloques vectoriales sin editar datos físicos. No usar filtros globales para ampliar sprites ni capas de roca fotorealista. Cualquier prop sin remake aprobado conserva el arte anterior, nunca un dibujo inventado que pueda alterar la legibilidad del gameplay.

## Criterios de validación
- \`npm run verify\` y comprobación Chromium con las escenas de menú, juego y pausa.
- Verificar todas las ramas y la generación del APK Android y proyecto Xcode.
- En cada revisión, comparar capturas; un test de integración correcto no sustituye una revisión visual en móvil.

**Limitación actual:** V19 amplía V18 con 6 tipos de piezas estructurales, 11 señales/carteles, un HUD nuevo y fragmentos de roca dibujados en Canvas. Aún quedan objetos secundarios de atlas y pruebas manuales de los 15 capítulos. El libro y las tres formas V14 permanecen intactos.
