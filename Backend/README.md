# Local mock API

`node Backend/server.mjs` (Node 22+) serves on loopback port 8787. `GET /health`, `POST /intent {text}`, `POST /diagnose {crop}`, `POST /translate {text,from,to}`. All responses are demonstrative. The browser preview currently uses local state, not this API.

`providers.mjs` defines mock diagnosis, language, LLM, payment and partner provider seams. Bhashini pipeline adapter is reference code, not verified against a provisioned account. No provider credentials are shipped. Production writes belong in authenticated, rate-limited Supabase edge functions; do not expose this server as a production API.
