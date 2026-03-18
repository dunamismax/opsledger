# BUILD

This is the primary operational handoff document for OpsLedger.

This file is a living document. Every future agent and developer who changes behavior, tooling, architecture, workflows, docs, or project status is responsible for keeping `BUILD.md` accurate, current, and up to date before handing work off.

Last reviewed and re-verified: 2026-03-18

## Project baseline

### What the application currently does

OpsLedger is a self-hosted operations workspace for small teams. The current build supports:

- a dashboard with service, incident, runbook, follow-up, and drill summary metrics
- a service catalog with owners, environments, dependencies, and external links
- runbook creation and stale-review highlighting
- incident creation plus timeline entry append
- postmortem creation plus follow-up status advancement
- drill creation with evidence metadata

### Current implemented state

The app is no longer planning-only. It is a working pnpm monorepo with:

- a React 19 + Vite SPA in `apps/web`
- a Hono API in `apps/api`
- shared Zod contracts in `packages/contracts`
- shared domain helpers in `packages/core`
- shared env parsing in `packages/config`
- shared test fixtures in `packages/testing`
- a Prisma/PostgreSQL package scaffold in `packages/db`

Important current reality:

- Runtime persistence is the JSON file at `apps/api/data/opsledger.json`.
- Prisma and PostgreSQL are scaffolded but are not used by the running API.
- There is no auth or session layer yet.
- The SPA reads one bootstrap payload from `/api/bootstrap` and then re-fetches that payload after mutations.
- The API currently exposes create-oriented endpoints only; there are no general edit or delete flows.

### Major components, modules, and entry points

- `package.json`
  Source of truth for workspace scripts.
- `apps/api/src/index.ts`
  API entry point. Parses env, creates `FileOpsLedgerStore`, starts Hono server.
- `apps/api/src/app.ts`
  HTTP routes. Current routes are `GET /health`, `GET /api/bootstrap`, and POST endpoints for services, runbooks, incidents, timeline entries, postmortems, follow-up status, and drills.
- `apps/api/src/store.ts`
  Current persistence implementation. Reads and rewrites the entire JSON snapshot on every write.
- `apps/api/data/opsledger.json`
  Active dev/demo data and current runtime source of truth.
- `apps/web/src/main.tsx`
  SPA entry point.
- `apps/web/src/router.tsx`
  Route map.
- `apps/web/src/routes/*.tsx`
  Feature pages: dashboard, services, runbooks, incidents, postmortems, drills.
- `apps/web/src/lib/api.ts`
  Client-side fetch layer. All pages depend on the bootstrap query here.
- `packages/contracts/src/index.ts`
  Authoritative runtime shapes and input schemas.
- `packages/core/src/index.ts`
  Shared domain logic for runbook-review state, dashboard metrics, and sorting helpers.
- `packages/config/src/index.ts`
  Env defaults and parsing used by both the API and SPA.
- `packages/db/prisma/schema.prisma`
  Intended future relational schema. Treat it as target-state reference, not current runtime truth.

## Verified build and run workflow

### Verified environment

These versions were directly observed during review on 2026-03-18:

- Node.js `v24.13.1`
- pnpm `10.32.1`

Observed repo/tooling facts:

- package manager is pinned as `pnpm@10.32.1` in `package.json`
- TypeScript is workspace-wide
- Biome is the configured formatter/linter
- PostgreSQL is not required for the current runnable app

### Verified commands run successfully

All commands below were run successfully from the repository root on 2026-03-18 unless otherwise noted.

#### Install

```bash
pnpm install --frozen-lockfile
```

Verified result:

- succeeded
- lockfile was up to date
- no install drift was reported

#### Build

```bash
pnpm build
```

Verified result:

- succeeded
- ran `pnpm db:generate`
- built shared packages
- built `apps/api`
- built `apps/web`

#### Test

```bash
pnpm test
```

Verified result:

- succeeded
- ran package builds first
- executed Vitest suites in `packages/core` and `apps/api`
- current verified test count: 9 tests total

#### Lint

```bash
pnpm lint
```

Verified result:

- succeeded
- `biome check .`

#### Typecheck

```bash
pnpm typecheck
```

Verified result:

- succeeded across `packages/*`, `apps/web`, and `apps/api`

#### Verified API dev startup

Default ports `3000` and `3001` were occupied on the review machine by another repo, so verification used an alternate API port.

```bash
API_PORT=3402 pnpm --filter @opsledger/api dev
```

Verified follow-up checks:

```bash
curl -sS http://127.0.0.1:3402/health
```

Verified result:

- API started successfully
- the API logged `...using /Users/sawyer/github/opsledger/apps/api/data/opsledger.json`
- `/health` returned `{"status":"ok","service":"opsledger-api"}`
- no shadow file was created under `apps/api/apps/api/data/opsledger.json`

#### Verified root workspace dev startup

To verify the repaired root workflow while default ports were occupied:

```bash
API_PORT=3401 VITE_API_URL=http://127.0.0.1:3401 pnpm dev -- --port 3410 --host 127.0.0.1
```

Verified follow-up check:

```bash
curl -sS http://127.0.0.1:3401/health
curl -sS http://localhost:3002
```

Verified result:

- root `pnpm dev` launched both apps successfully
- the API served `{"status":"ok","service":"opsledger-api"}` on `3401`
- Vite auto-selected `http://localhost:3002` because `3000` and `3001` were already occupied
- the SPA served the OpsLedger HTML shell and page title `OpsLedger`

#### Verified format

```bash
pnpm format
```

Verified result:

- succeeded
- ran `biome format --write .`
- no additional changes were needed after the earlier targeted formatting pass

### Unverified or currently unsafe commands

These commands exist or are implied by the repo, but they were either not verified end-to-end or are currently unsafe as checked in.

#### Likely-valid but not directly run in isolation during review

```bash
pnpm db:generate
```

Notes:

- `pnpm db:generate` was exercised indirectly through `pnpm build`

#### Command caveats

- `pnpm dev` is now trustworthy for normal local startup.
- Forwarding extra CLI arguments through root `pnpm dev` did not reliably pin the Vite port in this pass; Vite still fell back to the next available port.
- If you need a fixed alternate SPA port, run the web app directly with `pnpm --filter @opsledger/web exec vite --port ... --host ...`.

#### Absent workflows

There are currently no checked-in commands for:

- Prisma migrations
- database seeding
- Playwright or browser E2E tests
- production deployment
- backups or restore automation

## Source-of-truth notes

### Authoritative files and directories

- `BUILD.md`
  Primary operational handoff. This file should supersede stale assumptions elsewhere.
- `package.json`
  Root workflow commands.
- `pnpm-lock.yaml`
  Dependency lockfile.
- `pnpm-workspace.yaml`
  Workspace membership.
- `apps/api/src/app.ts`
  Current API behavior.
- `apps/api/src/store.ts`
  Current persistence behavior.
- `apps/api/data/opsledger.json`
  Current live dev snapshot and runtime seed.
- `apps/web/src/router.tsx`
  SPA route surface.
- `apps/web/src/routes/*.tsx`
  User-visible feature surface.
- `packages/contracts/src/index.ts`
  Runtime data contracts and request validation.
- `packages/core/src/index.ts`
  Shared business logic currently used by the SPA.
- `packages/db/prisma/schema.prisma`
  Target relational model for future persistence work.
- `.env.example`
  Intended environment variables and default local ports.

### Conflicts, stale docs, and ambiguous areas

- `README.md` is useful for orientation, but it is incomplete as an operational source of truth.
- `packages/db/prisma/schema.prisma` still encodes stronger constraints than the current JSON store enforces globally.
- The JSON store now rejects duplicate service slugs, duplicate postmortems per incident, and missing owner/service/incident references on create flows, but it is still not a full relational integrity layer.

### Important environment and config files

- `.env.example`
  Declares `DATABASE_URL`, `OPSLEDGER_DATA_PATH`, `API_PORT`, `VITE_API_URL`.
- `packages/config/src/index.ts`
  Supplies defaults for API and web env parsing.
- `apps/web/vite.config.ts`
  Sets default dev server port `3000`.
- `biome.json`
  Lint/format rules.
- `tsconfig.base.json`
  Shared TS config and workspace path aliases.

## Current gaps and known issues

### Runtime and workflow issues

- The file store rewrites the entire JSON snapshot on each write and has no locking or conflict protection.
- There is now a small `OpsLedgerStore` boundary, but only a single JSON-backed implementation exists.

### Product and feature gaps

- No auth, sessions, or Better Auth integration.
- No multi-workspace behavior beyond seeded workspace metadata.
- No edit or delete flows for services, runbooks, incidents, postmortems, or drills.
- Incident status cannot be updated after creation through a dedicated endpoint.
- Follow-up status changes are limited to the current simple advance flow in the UI.
- No export flows for incidents, postmortems, or drills.
- No search, filtering, audit log, reminders, or deployment/backups guidance.

### Persistence and model mismatch risks

- Prisma is scaffolded but unused at runtime.
- There are no Prisma migration files; only `schema.prisma` exists.
- The JSON store now enforces several Prisma-aligned create-time invariants, but it still cannot audit or repair pre-existing invalid data automatically.
- The JSON store still does not provide transactionality, locking, or full dataset-wide relational guarantees.
- Moving to Prisma without first aligning runtime invariants will likely surface existing data-quality issues.

### Testing gaps

- No web tests.
- No Playwright tests.
- Current automated coverage is limited to:
  - `packages/core/src/index.test.ts`
  - `apps/api/src/app.test.ts`
- API coverage now includes duplicate-slug, duplicate-postmortem, and missing-reference cases.
- The happy path is still tested more than UI behavior, concurrency, and migration edge cases.

## Next-pass priorities

### Highest-impact work

1. Keep hardening persistence before any Prisma cutover.
   - Extend invariant checks beyond create-time happy paths.
   - Add a data audit/backfill strategy for invalid legacy snapshots before introducing stricter storage.
2. Decide whether auth or persistence is the next true milestone.
   - Auth is still completely absent.
   - Persistence hardening is currently the sharper operational risk.
3. Add broader verification at the app boundary.
   - Cover the SPA with route/component tests or Playwright flows.
   - Exercise failure states in the UI for the new 404/409 API responses.

### Quick wins

- add API tests for runbook and drill foreign-key failures, not just service and postmortem cases
- surface 404/409 mutation errors in the SPA with clearer inline feedback
- add a tiny data-audit command that checks the JSON snapshot for referential drift
- document a canonical alternate-port recipe for root development, if keeping that workflow matters

### Deeper refactors

- define a fuller store interface shared by JSON and Prisma implementations
- migrate runtime writes from whole-file rewrites to a database-backed implementation
- add real mutation/update flows instead of create-only records plus bootstrap refetch
- add browser-level tests for the core CRUD paths

## Next-agent checklist

Follow this checklist before starting new feature work:

1. Read `BUILD.md` first, then `README.md`.
2. Verify the baseline from repo root:

   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   pnpm test
   pnpm lint
   pnpm typecheck
   ```

3. For normal local startup, `pnpm dev` is now a valid default.
4. If default ports are occupied and you need a pinned alternate API port, use:

   ```bash
   API_PORT=3301 pnpm --filter @opsledger/api dev
   ```

5. If you need to run the web app against that API on a fixed alternate port, use:

   ```bash
   VITE_API_URL=http://127.0.0.1:3301 pnpm --filter @opsledger/web exec vite --port 3310 --host 127.0.0.1
   ```

6. Before touching persistence, compare:
   - `apps/api/src/store.ts`
   - `packages/contracts/src/index.ts`
   - `packages/db/prisma/schema.prisma`

7. Treat `apps/api/data/opsledger.json` as the active runtime dataset until a persistence migration is complete.
8. If you change workflows, architecture, invariants, ports, env behavior, or source-of-truth guidance, update this file in the same pass.

## Verification log

- 2026-03-18: Verified `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`, `pnpm format`, `pnpm lint`, and `pnpm typecheck`.
- 2026-03-18: Verified filtered API startup with `API_PORT=3402 pnpm --filter @opsledger/api dev`; confirmed it now uses `/Users/sawyer/github/opsledger/apps/api/data/opsledger.json` by default and does not create a shadow JSON file.
- 2026-03-18: Verified root `pnpm dev` now launches both apps; with `3000` and `3001` occupied, Vite selected `http://localhost:3002` and the SPA still served the OpsLedger shell.
- 2026-03-18: Added API coverage for duplicate service slugs, duplicate postmortems, and missing foreign references.
