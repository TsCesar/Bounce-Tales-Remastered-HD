# Release plan — browser, Android APK and iOS Xcode project

The same original game remains at 240 × 320 logical resolution; gameplay data, checkpoints, collisions and 15 chapters are shared across all three targets.

## Changes included
- The cover / chapter book are now rendered with vector gradients, lettering, ornaments, spine and paper, rather than blown-up low-resolution decorative bitmaps in HD/Ultra. Classic continues drawing the original book.
- Rendering resolution now uses device-sensitive area budgets (1.3 million pixels for coarse touch devices, 3.2 million pixels on desktop) with uniform scaling. An excessively slow device automatically steps down a visual tier.
- All assets, audio, sprites, levels and cinematic scenery are bundled **locally** for Android and iOS. Launching either app does not fetch the live GitHub Pages game.
- Native WebViews skip PWA service-worker registration to avoid duplicate stale caches.
- Capacitor 8 is configured with API 36 (Android 16) and supports iOS via WKWebView. Temporary bundle identifier: \`com.tscesar.bouncetalesremastered\`; confirm ownership before store registration.

## Browser
Existing \`.github/workflows/pages.yml\` publishes on pushes to main:
https://tscesar.github.io/Bounce-Tales-Remastered-HD/

## Android (APK)
The new \`.github/workflows/native-apps.yml\` creates an **unsigned-for-store, debug-signed, installable APK** with \`./gradlew assembleDebug\`. Its build artifact is labeled \`Bounce-Tales-Android-debug-APK\` on the Actions run page. The generated Android Studio project is provided as a second Actions artifact.

The debug APK is for device testing. Google Play requires a **signed Android App Bundle (.aab)** from a release build. The project's Play signing key must be generated and stored securely in the Google Play / CI signing workflow. API 36 is required for new Google Play apps from August 31 2026.

## iOS
The same workflow generates the \`ios/\` project on a macOS runner, with all offline HTML/CSS/JS/levels/audio included, and uploads \`Bounce-Tales-iOS-Xcode-project-unsigned\` as an artifact. The App Store does not accept an APK. A signed **IPA** must be produced with Xcode + Apple Developer Team ID + signing certificates/provisioning profiles, then uploaded to App Store Connect (typically via TestFlight first). We do not keep signing certificates or secret credentials in GitHub.

## Run locally
\`\`\`bash
npm install
python -m pip install pillow numpy
node tools/build_mobile_web.cjs
python tools/build_hd_textures.py --output public/remaster/assets/hd --scale 4
python tools/build_hd_scenery.py --output public/remaster/assets/scenery
npx cap add android      # once
npx cap sync android
cd android && ./gradlew assembleDebug
\`\`\`
On macOS, \`npx cap add ios && npx cap sync ios && npx cap open ios\` and build with Xcode.

## Publication and legal requirements
**Do not submit either store listing until rights for the original Bounce Tales game assets, music, brand and characters have been confirmed with the copyright owner(s)**. Having permission to fork an open-source port is not the same as permission to distribute a commercial mobile game made from Nokia/Rovio intellectual property. This repo's LICENSE expressly excludes original-game proprietary materials. Apple also evaluates IP and whether apps provide adequate standalone functionality under review guideline 4.2.

Before release: obtain IP permission, decide a final title/brand and bundle identifier, create signing keys, register Play Console / Apple Developer, define age rating, create screenshots, app privacy disclosures, test on actual Android and iOS devices. No claim is made that store approval is automatic.

## Limitations
Graphics improvements here target book clarity and rendering stability. Source sprites, enemies and environmental textures are still based on original low-resolution artwork; photorealistic 4K art would require genuine replacement assets and a larger renderer/art pipeline. This build does not establish that the binary has been tested across real devices until a device-test run is completed.
