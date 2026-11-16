# Bounce Tales Remastered HD — TsCesar

Proyecto de remasterización visual **para navegador** basado en la versión V62 de [PrasannaOne/BounceTales](https://github.com/PrasannaOne/BounceTales). El objetivo es conservar sus 15 niveles y mecánicas y modificar exclusivamente la presentación.

## Estado y funcionamiento

Este repositorio contiene el remaster y un flujo de GitHub Actions que importa el código y los recursos del repositorio de referencia en la **primera ejecución**. No se sustituye su lógica jugable.

**Después de activar GitHub Pages (fuente: GitHub Actions):**
https://tscesar.github.io/Bounce-Tales-Remastered-HD/

- Ordenador: A/D o flechas para moverse; Espacio para saltar; Mayús/Q para transformar; Esc para pausar; F para pantalla completa; H para alternar escalado HD/clásico.
- Móvil: controles táctiles compactos, solo en dispositivos táctiles.
- Renderizado: lienzo adaptado a la densidad de píxeles de la pantalla y suavizado de alta calidad automático. **No son sprites redibujados nativamente en 4K**; la mejora actual es de presentación/escalado.
- Se respeta la relación de aspecto 3:4, sin deformar los niveles.

## Importación y publicación

1. Abre **Actions → Import original and deploy remaster** para ver la importación automática. También puedes lanzarla manualmente con *Run workflow*.
2. Si GitHub Pages no está habilitado, entra en **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El flujo incorpora los archivos originales (manteniendo `LICENSE`), inserta las hojas de estilo y el renderizado del remaster y publica la aplicación web.
4. El archivo `.upstream-imported` marca que los recursos originales ya se han importado. Las modificaciones del remaster permanecen en `remaster/`.

## Procedencia y derechos

- Código de referencia: © 2026 Prasanna; véase `LICENSE` una vez importado.
- Gráficos, sonido y nivelado originales: pertenecen a sus respectivos titulares.
- El titular de este repositorio ha declarado contar con autorización para modificar y distribuir el proyecto. Esa declaración no convierte el código original en código abierto ni modifica los derechos de terceros.
- Sin afiliación oficial con Nokia, Rovio ni el autor de la adaptación web.

Este proyecto es independiente de la web original.