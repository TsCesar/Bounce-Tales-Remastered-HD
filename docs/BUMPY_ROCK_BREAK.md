# Bumpy — montones de roca destructibles

El juego original permite que Bumpy (forma pesada/piedra) rompa montones y muros de rocas. La versión anterior del port tenía recursos y partículas de fragmentación, pero no una interacción explícita que relacionara su impacto con los montones renderizados.

## Reparación

- Se reconocen los sprites originales 357 y 358 definidos en \`src/image-map.json\`. No se aplica la destrucción a terreno normal, decoración ajena, elementos de máquinas ni otras texturas.
- La forma de piedra (forme=1) debe impactar con una velocidad significativa. Bounce rojo (forme=0) y Wolly (forme=2) no rompen esos elementos mediante esta interacción.
- Un mismo montón se representa a veces con dos objetos vecinos de una misma formación (intacto / fragmentable); se retiran ambos dibujos de la formación.
- Se reutilizan las 24 partículas animadas de roca originales del juego, ya implementadas en \`src/game-particles.js\`.
- El estado de rotura se mantiene durante el capítulo para evitar volver a destruir la misma formación; se restablece al reiniciar/cargar un nivel.
- Las modificaciones solo afectan a objetos de tipo sprite y al nuevo manejador \`src/rock-break.js\`. Las colisiones de geometría, los datos de niveles RLEF y las constantes de movimiento se preservan.

## Limitaciones

Esta reparación enlaza la forma Bumpy con la rotura de las **formaciones visuales originales identificadas**. No presupone que toda la geometría de color piedra pueda romperse: las mallas del terreno pueden representar suelo estructural que debe permanecer sólido. La equivalencia completa con cada interacción de la versión Java ME sigue necesitando pruebas de reproducción del escenario real.

## Pruebas

\`tests/bumpy-rock-break.test.cjs\` carga los niveles originales, verifica los tamaños de las zonas visuales, exige forma de piedra y un impacto, evita las roturas repetidas y comprueba el reinicio del estado.
