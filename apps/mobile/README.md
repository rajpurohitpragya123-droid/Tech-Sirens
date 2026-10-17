# Expo native foundation

Native Expo Router implementation for the revised simple brief: three picture tiles, mic and More; language/numeric OTP onboarding, optional GPS/village fallback, field/crop choices and explicit WhatsApp consent. Picture-driven diagnosis, neighbour, diary, land-interest and single-screen helper demos use shared locale JSON and a persistent outbox/query cache. Noto Devanagari is bundled. Native is less complete than the browser demo and has not been device-tested.

```
cd apps/mobile
npm install
npx expo install --fix
npm run typecheck
npm start
```

The reference targets SDK 54 / Router 6 and its matching React Native 0.81 stack ([Expo release reference](https://expo.dev/changelog/sdk-54)). Use a matching development build; a current Expo Go may require an SDK upgrade. Dependencies were installed and TypeScript checking passed. The app has not been compiled for Android or run on a device. Before release, migrate to a currently supported SDK and replace deprecated expo-av with the supported audio package. Run `npx expo-doctor` and Android emulator/device tests. The initial dependency audit reported 39 advisories (16 moderate, 23 high); see the final verification notes in the root progress file. Do not treat this reference stack as production-ready.

Copy the two `EXPO_PUBLIC_SUPABASE_*` values to a local `.env` to enable real phone OTP. Without them, the explicit demo button proceeds to onboarding; no OTP is falsely verified. Local Supabase test number `+919999990001`, OTP `123456` is configured only in `supabase/config.toml`. Never enable test OTPs in production.

Pending: soil/season onboarding details, real audio/Bhashini, on-device blur check, durable camera-file copy, private uploads and sync, real maps, complete listing/compare/harvest screens, WhatsApp delivery, Gurmukhi font bundling, accessibility and physical low-memory-device/performance checks. The current native microphone always offers picture fallback; it does not claim actual speech recognition. Demo owner acceptance never grants backend privileges.
