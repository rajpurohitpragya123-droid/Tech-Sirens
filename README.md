# खेत Doctor — simple, voice-first edition

**Sahi rog, sahi dawai, sahi daam.**

The revised brief supersedes the earlier full-cycle product. The active interface has **three picture tiles, a mic and More**. Diagnosis, neighbour tips and land rental are the core experiences. Input prices, water advice, mandi offers and vehicles are single-screen helpers. There is no active checkout, IoT, transport booking, stubble or credits flow.

This is a runnable **seeded demo**, with a native Expo implementation and backend reference code. It is not a production deployment. Browser/server mocks do not send real WhatsApp messages, diagnose real disease, place calls or contact landowners. The existing `App.tsx`, full-cycle SQL tables, IoT/firmware references and older docs are retained as inactive previous-scope code. See `docs/FULL_CYCLE_ARCHIVE.md` for that history.

## Run

```powershell
npm install
npm install --prefix "frontend/Project name"
npm run dev
```

Open [the browser app](http://localhost:5173/#home). English/Hindi share locale files with native. Punjabi/Marathi have draft primary labels and English fallback. Change language using the header's language button. Browser voice recognition depends on browser support; picture choices always remain available. Speaker controls use browser speech in this demo; live Bhashini stays behind the server interface.

```powershell
npm test
npm run lint
npm run build
npm run preview --prefix "frontend/Project name"
```

The production service worker caches the application shell **and all three bundled photos** after the initial load. Query data is persisted; diary/drafts/preferences use localStorage; leaf photos use IndexedDB. Outbox records are saved locally and are **not uploaded**. Fonts currently load from Google Fonts, with Indic system fallbacks. Offline navigation still needs a production-browser test.

## Try the three core flows

- **Crop doctor:** picture crop → camera/photo or explicit demo → confidence word → care → thumbs feedback. Browser photos get a Laplacian blur check and longest-edge 1024px JPEG compression. Fixed demo output has no trained inference. Settings exposes demo confidence modes to exercise Pakka/Shayad/expert/healthy branches. Treatment shows low-cost care before a chemical-care placeholder. A field-size × **user-supplied product-label dose** calculator performs arithmetic; no unreviewed pesticide dose or harvest interval is invented. Treatment start creates a diary event.
- **Neighbour tips:** consent → anonymous three-bar picture → three tips → picture diary. Harvest uses a large number pad. The sample uses synthetic aggregates of 12 farms. The shared calculator rejects groups below five and ranks gaps using supplied aggregate associations. Secure Postgres aggregation is provided but has not been executed on this host.
- **Land on rent:** illustrative map + three cards → picture filters/rent slider → details/compare → state notice → interest → **explicit owner demo** acceptance → private greeting/masked-call placeholder. Listing uses village/GPS, number pad, water/soil pictures and a photo; drafts persist. Calls and owner notifications are mock; no public phone number or lease agreement is created.

**More:** three verified input-price results, one daily water suggestion, dated mandi samples + minimum-price number pad, three verified vehicle samples, settings and demo inbox. Helpers have no checkout or booking workflows.

## WhatsApp and language services

`Backend/notifications.mjs` implements mock delivery and a credential-gated Cloud API adapter. Policy checks cover explicit opt-in, separate SMS/push fallback consent, STOP, India quiet hours (21:00–06:00), two non-urgent updates/day, approved templates outside the 24-hour service window, and a final consent re-check after TTS. Local mock sends are serialized per farmer; production needs the transactional reservation function and a sending worker. Missing TTS falls back to text.

WhatsApp template headers do not support audio ([Meta SDK reference](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/types/HeaderObject/)). The adapter therefore uses an approved template/audio-link CTA outside the service window; an audio note is sent separately only inside the window. Actual template names, approvals, locale mappings, public app/deep-link domains and signed audio URLs must be configured before live delivery. No credentials are bundled.

`supabase/functions/whatsapp-webhook` validates a Meta HMAC signature, handles STOP and idempotently queues leaf/voice input. Its media-download/inference/reply worker is still pending. Local `NotificationService.inbound()` tests cover mock leaf and voice handling end to end without Meta. No external messages were sent during implementation.

`Backend/providers.mjs` contains mock/live Bhashini seams, translation caching, intent rules and mock diagnosis. Real provider response mapping and dynamic-content translation are unvalidated. `packages/shared/locales/*.json` are the shared UI dictionaries.

## Native, admin and infrastructure

```powershell
npm install --prefix apps/mobile
npm run typecheck --prefix apps/mobile
npm run mobile
npm install --prefix apps/admin
npm run build --prefix apps/admin
npm run admin
```

Native has the three-tile home, picture onboarding with numeric OTP keypad, optional GPS, field/crop choices, WhatsApp consent, camera, core-flow demo screens, persistent state and query cache. It has been type-checked, not Android/device tested. It still needs a supported Expo SDK upgrade: the reference SDK 54 dependency audit retains **39 advisories (16 moderate, 23 high)** after compatible fixes. Do not release it as-is.

Admin is a small synthetic preview for partner verification, diagnosis labels, price references, state notices, translations and CSV validation. It has no privileged production writes or production authentication.

```powershell
Copy-Item .env.example .env
supabase start
supabase db reset
docker compose --profile demo up --build
```

Docker and the Supabase CLI are not installed on this host. SQL/RLS migrations and Docker services are unvalidated here. The current compose file starts only the mock ML service. Older full-cycle broker setup is archived under `docs/`. Do not apply synthetic seed data or fixed test OTPs to production.

The seed supplies a synthetic Meerut district, crops/diseases/treatments, products/verified sellers, mandi histories, buyers, vehicles and land. Old-scope tables remain in the base migration for compatibility. Local farmer OTP fixture: `+919999990001` / `123456`, only with the local Supabase config. Browser demo needs no authentication. Real role-specific accounts, backend sync, private storage policies and cross-tenant security require integration testing before production.

## Handoff

[PROGRESS.md](PROGRESS.md) records the revised ten phases, checks and outstanding work. [DECISIONS.md](DECISIONS.md) records trust-preserving choices. ML train/evaluate/export scripts are references: no trained model, dataset, calibrated confidence, reviewed chemical treatment catalogue or performance claim is bundled. Live weather/Agmarknet, maps/routing, full translation review, scheduled WhatsApp delivery, Maestro/Detox and low-end-device usability testing remain required.
