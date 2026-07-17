---
name: Vite build env requirements
description: Publishing build failures caused by dev-only env vars required in vite.config.ts
---

Scaffold `vite.config.ts` files in this workspace threw if `PORT`/`BASE_PATH` were unset. Production (publish) builds run without workflow env, so the build crashed before compiling.

**Why:** Workflow-provided env vars (PORT, BASE_PATH) exist only in development; the deploy build phase does not set them.

**How to apply:** In any artifact's vite config, require PORT only for dev/preview serve (`process.argv.includes('build')` guard) and default BASE_PATH. Also note: deploy build logs that stop at "Preparing PostgreSQL 16 tools" may hide the real build error — reproduce locally with `unset PORT BASE_PATH; CI=true pnpm --filter <pkg> run build`.
