# Target: ANDROID / PLAY STORE

Branch: `android`.

Branch for Android native wrapper, device integration and Android App Bundle signing work. Only this branch runs the Android APK+Android Studio CI job; it does not deploy Pages or run the iOS job.

## Next step
Test the generated debug APK on Android devices, then configure a secure Play Store release AAB workflow when publishing rights and signing credentials are available.

## Shared code
All three platforms inherit gameplay fixes from `main` only through a deliberate merge/PR. See `docs/BRANCHING.md`.
