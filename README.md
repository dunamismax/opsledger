# OpsLedger

OpsLedger is a self-hosted incident notebook, runbook workspace, and restore-drill tracker for small teams.

The goal is to give operators a calm place to track services, owners, runbooks, incident timelines, postmortems, and recurring drills without adopting a heavyweight platform portal.

## Current build

- React + Vite SPA with TanStack Router, Query, and Form
- Hono API with validated create flows for services, runbooks, incidents, postmortems, and drills
- Shared Zod contracts, domain logic, and environment validation used by both the API and SPA
- JSON-store integrity checks for duplicate service slugs, duplicate postmortems, and missing owner/service/incident references
- Seeded file-backed development data in [`apps/api/data/opsledger.json`](./apps/api/data/opsledger.json)

## Quick start

1. Install dependencies with `pnpm install --frozen-lockfile`
2. Copy `.env.example` to `.env` if you want to override defaults
3. Start the workspace with `pnpm dev`
4. Open the web app at `http://localhost:3000`

If port `3000` is already busy, Vite will print and use the next available port instead.

The API defaults to `http://localhost:3001` and safely falls back to the repo's [`apps/api/data/opsledger.json`](./apps/api/data/opsledger.json) even when started with `pnpm --filter @opsledger/api dev`.

If you need pinned alternate ports, start the apps separately:

```bash
API_PORT=3301 pnpm --filter @opsledger/api dev
VITE_API_URL=http://127.0.0.1:3301 pnpm --filter @opsledger/web exec vite --port 3310 --host 127.0.0.1
```

## Scripts

- `pnpm dev` builds shared packages, then starts the API and SPA together
- `pnpm build` generates the Prisma client and builds the full workspace
- `pnpm format` runs Biome formatting across the repo
- `pnpm test` builds shared packages and runs the Vitest suites
- `pnpm lint` runs Biome checks across the source tree
- `pnpm typecheck` runs TypeScript checks across the workspace

## Status

In development. See [`BUILD.md`](./BUILD.md) for the current milestone tracking and product contract.

## License

[MIT](./LICENSE)
