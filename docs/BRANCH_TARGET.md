# Target: iOS / APP STORE

Branch: `ios`.

Branch for iOS/Xcode native wrapper, iPhone/iPad gestures and safe areas, App Store Connect/TestFlight signing. Only this branch runs the Xcode project CI job; it does not deploy Pages or build APKs.

## Next step
Test the generated Xcode project on a real iPhone, set up Apple Developer signing and create a signed IPA for TestFlight once publishing rights are confirmed.

## Shared code
All three platforms inherit gameplay fixes from `main` only through a deliberate merge/PR. See `docs/BRANCHING.md`.
