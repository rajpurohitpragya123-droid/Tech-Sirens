# खेत Doctor

**Learn from your neighbours. Buy at a neutral price. See your real earnings.**

Sahi rog. Sahi dawai. Sahi daam.

This repository contains a runnable, synthetic-data browser demo and an initial Expo/Supabase/Next.js/service implementation. It is **not the completed production MVP** described in the brief. Live diagnosis, market/weather ingestion, Bhashini, payments, hardware control and server synchronization are not connected to the browser. See [PROGRESS.md](PROGRESS.md) for the exact phase status and [DECISIONS.md](DECISIONS.md) for assumptions.

## Run the working browser demo

Requires Node 22+ and npm.

```powershell
npm install --prefix "frontend/Project name"
npm run dev
```

Open http://localhost:5173. The app starts directly in a seeded farmer profile. No sign-in or API keys are needed for the demo.

```powershell
npm run build
npm test
npm run preview --prefix "frontend/Project name"
```

The production build emits a service worker caching the same-origin application shell. Load the production preview once before going offline. Diary, pledges, pickup orders and pending operations are stored locally. Remote photos/fonts are not guaranteed offline. No operation is silently marked server-synced; backend synchronization remains pending.

## Try the core flows

1. **Parali Badlo:** pledge wheat residue, choose harvest date and access details. The pledge appears as awaiting partner. No credit is issued merely for pledging.
2. **Input bazaar:** filter categories and radius, search products, compare unit prices, see the above-reference-MRP flag and place a demo pay-at-pickup order. Only approved sample sellers appear. Calculator quantities are illustrative, not treatment advice.
3. **My farm & diary:** toggle anonymous benchmark participation and add a diary entry. The benchmark uses synthetic aggregate patterns.
4. **Sell & store:** raise the wheat minimum above ₹2,700 to see no matching buyers and save a local price alert. Lower it to compare net earnings after transport, fees and loading.
5. **Irrigation:** switch the simulated pump on/off and log field feedback. Controls never touch hardware.
6. **Transport / land:** filter vehicles by load capacity; request a booking; compare up to three plots and save interest. No contracts or payments are created.
7. **Languages:** switch English/Hindi in the header. Punjabi/Marathi have partial strings and English fallback. Browser voice recognition, if supported, can route keywords; text fallback is always available. No Bhashini credentials are sent to the client.

## Repository layout

| Path                    | Purpose                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `frontend/Project name` | Existing Vite checkout, now the React browser demo                                     |
| `apps/mobile`           | Expo Router native foundation, onboarding, OTP adapter, camera and seeded flows        |
| `apps/admin`            | Next.js synthetic operations preview                                                   |
| `Backend`               | Local mock API and provider seams                                                      |
| `packages/shared`       | Deterministic calculation/ranking/privacy/safety rules and TS declarations             |
| `supabase`              | PostGIS schema, RLS, private bucket, seed and transactional credit/aggregate functions |
| `services/ml`           | FastAPI fixed-mock service and reference train/evaluate/ONNX scripts                   |
| `services/iot`          | MQTT reference worker, simulator, demo and production broker configurations            |
| `firmware/esp32`        | Reference low-voltage relay controller                                                 |
| `tests`                 | Node rule/provider/API tests                                                           |

## Native app and operations preview

```powershell
npm install --prefix apps/mobile
npm run typecheck --prefix apps/mobile
npm run mobile
npm install --prefix apps/admin
npm run build --prefix apps/admin
npm run admin
```

Follow the per-app READMEs for limitations and device setup. Native dependency versions target the SDK 54 reference stack; a supported-SDK upgrade and physical-device checks are required before release. Role selection is a preference, not backend authorization. The admin preview modifies only synthetic in-memory records and has no privileged production access.

## Local services and database

Install Docker Desktop and the Supabase CLI separately; neither is available on the development host used for this implementation. Do not apply the seed to a production database.

```powershell
Copy-Item .env.example .env
supabase start
supabase db reset
docker compose --profile demo up --build
```

The mock ML API is on http://127.0.0.1:8000/docs. MQTT is isolated inside Docker with no host port. Its anonymous listener is exclusively for the isolated simulation. The worker deliberately refuses automatic ON until reliable weather, power slots and authenticated control are implemented. Production MQTT must use the TLS configuration, individual device credentials and exact-topic ACLs.

`node Backend/server.mjs` serves a separate loopback mock API on port 8787. See its README for request shapes. The browser currently does not use it.

Regenerate the deterministic database seed with `node scripts/generate-seed.mjs`. It supplies 40 farmers across four villages, ten crop references, thirty disease records, twenty-five products, six approved sellers plus one pending, five mandis with sixty days per crop, eight buyers, ten vehicles and three return trips, three cold storages, two stubble partners, twelve pledges, four confirmed collections/credits, eight plots and three simulated devices. All values, government references and treatment text are explicitly synthetic and need review.

Run `supabase/tests/security.sql` using psql against the local database (default local connection: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`). It checks RLS, peer privacy, role escalation and ledger immutability inside a rolled-back transaction. These database tests have not been executed here.

## Local demo accounts

The browser has no authentication and always uses synthetic Ramesh Kumar. The seed creates local-only phone identities:

| Role                  | Phone         |
| --------------------- | ------------- |
| Farmer                | +919999990001 |
| Seller                | +919999990041 |
| Buyer                 | +919999990042 |
| Transporter           | +919999990043 |
| Cold storage operator | +919999990044 |
| Landowner             | +919999990045 |
| Stubble partner       | +919999990046 |
| Technician            | +919999990047 |
| Expert                | +919999990048 |
| Admin                 | +919999990049 |

`supabase/config.toml` configures fixed OTP `123456` only for local test farmer numbers `+919999990001` and `+919999990002`. Other role accounts are data fixtures, not implemented role-specific login experiences. Use local Studio/auth testing to provision their test sign-in; never copy fixed OTP settings to production.

## Checks and release boundary

The core Node tests cover dose/pack rounding, commission invariance, government-price flags, water balance, IoT safety/invalid data, benchmark consent/minimum groups, buyer price filtering/net earnings, shared fare conservation, residue estimates, collection-only credits and duplicate/overdraw redemption rejection. Provider/API tests check keyword routing, translation cache boundaries, mock payment mode and request validation.

The full production release still requires authenticated edge-function writes with Zod, distributed rate limits, database migration/security testing, ownership consistency constraints, complete RLS for partner workflows, backend outbox replay, real providers, calibrated trained models, government-source review, maps, complete native workflows, OTP integration testing, hardware commissioning, end-to-end tests, translation review and accessibility/performance audits. No production claim is made for scaffolded components.
