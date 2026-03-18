# OpsLedger

OpsLedger is a self-hosted incident notebook, runbook workspace, and restore-drill tracker for small teams.

The goal is to give operators a calm place to track services, owners, runbooks, incident timelines, postmortems, and recurring drills without adopting a heavyweight platform portal.

## Current build

- React + Vite SPA with TanStack Router, Query, and Form
- Hono API with validated CRUD flows for services, runbooks, incidents, postmortems, and drills
- Shared Zod contracts, domain logic, environment validation, and Prisma/PostgreSQL foundation
- Seeded file-backed development data in [`apps/api/data/opsledger.json`](./apps/api/data/opsledger.json)

## Quick start

1. Install dependencies with `pnpm install`
2. Copy `.env.example` to `.env` if you want to override defaults
3. Start the workspace with `pnpm dev`
4. Open the web app at `http://localhost:3000`

The API defaults to `http://localhost:3001` and reads from `apps/api/data/opsledger.json`.

## Scripts

- `pnpm dev` starts the API and SPA together
- `pnpm build` generates the Prisma client and builds the full workspace
- `pnpm test` builds shared packages and runs the Vitest suites
- `pnpm lint` runs Biome across the source tree

## Status

In development. See [`BUILD.md`](./BUILD.md) for the current milestone tracking and product contract.

## License

[MIT](./LICENSE)
