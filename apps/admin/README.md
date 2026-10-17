# Next.js operations preview

`cd apps/admin && npm install && npm run dev` serves on port 3001. Dependencies were installed; `npm run build` and `npm run typecheck` passed. The build produces a static demo page.

The revised small admin has synthetic usage counts, local verification decisions, diagnosis labels, reference-price flags, a state-notice review, language-review status and local CSV validation. There are no real admin credentials, production queries or privileged writes. Approval controls change only in-memory demo rows. Production requires Supabase sign-in plus server-side `admin` role enforcement, signed private documents, rate limits and audit logs. Do not deploy this preview as a production admin console.
