# Implementation decisions

## Revised simple brief — authoritative

The second user brief replaces the earlier full-cycle scope. The active entry point is `SimpleApp.tsx`; old dashboard/checkout/IoT/stubble code is inactive and retained for reference. Native now uses a three-tile home and stack navigation, with helpers under More.

- Home fits a viewport with three pictures, mic and More. Farmer actions use pictures, numeric pads, sliders and short labels; no text entry is required in the active core browser flows.
- Browser demo starts with a synthetic, pre-onboarded farm; native demonstrates first-launch language, numeric OTP/demo, village/GPS, field/crop and WhatsApp choices. Live auth/data integration remains a separate gate.
- Primary actions are at least 64px. Listen/back/repeat remain available as navigation/accessibility controls; they are not competing business actions.
- The word Pakka is always paired with a suggestion/sample notice, not a claim of certainty. Mock confidence modes are configurable under settings for testing.
- Chemical doses and harvest waiting periods are not invented. A farmer can enter a dose taken from a registered product label and calculate field quantity; a reviewed treatment catalogue is still required for automatic product-specific advice.
- Benchmarks in the browser contain only synthetic aggregate statistics. Production must call the secure database aggregate and enforce consent and the five-farmer threshold before sending results.
- WhatsApp templates cannot attach an audio header. Outside the service window use an approved template with a signed audio/app link; send a separate voice note only within the open service window. See the Meta reference linked in the README.
- No actual WhatsApp/SMS/push/call/owner notification is sent from demo controls. Mock WhatsApp channel entries require consent; local in-app fallback stays available. Quiet hours and the daily limit also apply to mocks, with deterministic daytime service tests.
- Land maps are explicitly illustrative until a real mapping/proximity integration is connected. Owner acceptance is explicitly a demo role switch; production acceptance is protected by a listing-owner RPC. No phone number or lease is exposed.
- New photos are IndexedDB-backed in the browser; native camera durability is still pending. Bundled home/land photos come from the three Unsplash image URLs already referenced in source history. They are pre-cached by the production service worker. Fonts still need complete offline bundling.
- Native SDK 54 remains a reference, not a release target: 39 dependency advisories remain after compatible fixes. Upgrade and device-test a supported SDK before production.

## Earlier full-cycle decisions (historical)

1. Preserve the existing Vite checkout as a browser preview (`frontend/Project name`). It is a React/TypeScript responsive demo, separate from the requested Expo native app.
2. Demo mode is explicit. Browser actions stay in Zustand/localStorage with an outbox. There is no silent upload, synthetic OTP verification, real diagnosis, real pump actuation, live market data, or real payment.
3. A pledge creates no credits. The seeded wallet is fixed sample data. Vouchers are non-redeemable previews. Server credit issuance must use the transactional Postgres function, not client arithmetic.
4. English/Hindi UI dictionaries are supplied; Hindi still needs an independent language reviewer. Punjabi and Marathi are partial, visibly marked needs-review and fall back to English. Dynamic seeded names currently remain English; full Bhashini translation is pending.
5. Reference prices and weather in the demo are illustrative, not legal or agronomic facts. Government-rate sources must be verified and populated by an administrator before real use.
6. Demo images use Unsplash URLs; Noto/DM Sans/Manrope are loaded from Google Fonts. Bundle fonts/assets for a genuinely offline Android release. System fonts are the fallback.
7. Native safety is mandatory before hardware: server safety rules cannot protect a pump when disconnected. Reference ESP32 controller defaults OFF and has a local timeout. Do not attach it directly to mains; a production installation requires an appropriate starter, isolation, commissioning and hardware review.
8. Production benchmark numbers are produced only by a secure aggregate function with consent, same crop/season, radius expansion and minimum 5 peers. Browser sample data is anonymous and synthetic. No real peer rows are included.
9. The complete specification is a multi-phase production programme. `PROGRESS.md` explicitly separates implemented browser flows, reference code, unvalidated infrastructure and outstanding production requirements; no phase is called complete based on scaffolding alone.
