# Ramas independientes: web, android, ios

## Estructura del repositorio

| Rama | Uso | Publicación | Qué NO hace |
|---|---|---|---|
| \`main\` | Base compartida y aprobada del motor, niveles y recursos | Ejecuta pruebas; **no** publica ninguna aplicación | No despliega Pages ni compila APK/iOS por cada push |
| \`web\` | Versión jugable de navegador/PWA y presentación web | \`pages.yml\`: GitHub Pages | No dispara las compilaciones nativas |
| \`android\` | Cambios y empaquetado Android + entregables Gradle | \`native-apps.yml\`: APK debug + proyecto Android Studio | No publica Pages ni compila iOS |
| \`ios\` | Cambios y empaquetado de iPhone/iPad + Xcode | \`native-apps.yml\`: proyecto Xcode sin firmar | No publica Pages ni compila Android |

La prueba \`quality.yml\` se ejecuta en las cuatro ramas y comprueba \`npm run verify\`.

## Dónde trabajar

1. Mecánicas, física, mapas, recursos del juego compartidos: desarrollar/validar en \`main\`.
2. Web, CSS de portal, PWA, optimizaciones específicas navegador: \`web\`.
3. Integración Android, Gradle, SDK, teclado Android, Play Store y firma AAB: \`android\`.
4. Integración iOS, interfaz segura iPhone/iPad, Xcode, TestFlight y firma IPA: \`ios\`.

Los cambios compartidos se incorporan de \`main\` mediante un **merge deliberado por rama**, no mezclando directamente los proyectos de plataforma.

\`\`\`bash
git checkout main
git pull
# Cambio compartido ya aprobado...
git checkout web
git merge main
git push
git checkout android
git merge main
git push
git checkout ios
git merge main
git push
\`\`\`

**Atención:** no hagas merge entre \`web\`, \`android\` e \`ios\` directamente, salvo que realmente quieras trasladar una mejora de una plataforma a otra y la hayas revisado. Si una corrección afecta al motor compartido, llévala primero a \`main\` y después incorpórala a cada rama.

## CI y publicación

- Solo la rama **web** activa automáticamente GitHub Pages (\`.github/workflows/pages.yml\`). La dirección es https://tscesar.github.io/Bounce-Tales-Remastered-HD/
- Solo la rama **android** activa el job Android de \`.github/workflows/native-apps.yml\`. En el run de Actions encontrarás \`Bounce-Tales-Android-debug-APK\` y \`Bounce-Tales-Android-Studio-project\`.
- Solo la rama **ios** activa el job iOS de \`.github/workflows/native-apps.yml\`. En el run de Actions encontrarás \`Bounce-Tales-iOS-Xcode-project-unsigned\`.
- Puedes seleccionar una rama desde **Actions → workflow → Run workflow**. Los jobs tienen una segunda protección a nivel de \`if: github.ref\`, de modo que no ejecuten la plataforma equivocada.

## Antes de distribuir en tiendas

El APK actual es de **depuración**, no el paquete final de Google Play; para Play necesitas un **AAB firmado**. iOS requiere un **IPA firmado**, cuenta Apple Developer, identificador y credenciales de firma. Ambas tiendas pueden pedir autorización de propiedad intelectual para los recursos originales de Bounce Tales. No se han completado esos pasos.

## Revisión

Antes de publicar una versión importante, anota aquí el commit incorporado desde \`main\` y comprueba que el workflow de la rama específica pasa.
