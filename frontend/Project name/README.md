# Simple खेत Doctor browser demo

`npm install`, `npm run dev`, `npm run build`, `npm run preview`.

The entry point is `src/SimpleApp.tsx`. Home contains three picture tiles, mic and More. The old `App.tsx` dashboard is inactive reference code. Core flows use pictures, local photo capture, voice/picture fallback, read-aloud, large number pads and short labels. Helpers have no checkout or booking flow.

Locales are shared with native in `packages/shared/locales`. Query data, preferences, diary, listing drafts, interests and an unsent outbox persist locally. Photos are compressed/blur-checked and stored in IndexedDB. The production service worker caches the app and bundled photos after a successful first load. Actual offline navigation, low-memory performance and complete font bundling still need validation.

All disease results, reference prices, statistics, maps, calls, messages and owner acceptance are clearly demo/illustrative. No real photo inference, service notification, contact or payment occurs. Native/live-backend gaps and checks are listed in the root README and PROGRESS.
