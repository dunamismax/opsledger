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
  Env defaults and parsing. Also contains one current footgun noted below.
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
- pnpm warned that some dependency build scripts were ignored and suggested `pnpm approve-builds`
- this warning did not block the workspace because `pnpm build` explicitly runs `prisma generate`

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
- current verified test count: 5 tests total

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

Default ports `3000` and `3001` were occupied on the review machine by another repo, so verification used alternate ports.

```bash
API_PORT=3301 OPSLEDGER_DATA_PATH="$PWD/apps/api/data/opsledger.json" pnpm --filter @opsledger/api dev
```

Verified follow-up checks:

```bash
curl -sS http://127.0.0.1:3301/health
curl -sS http://127.0.0.1:3301/api/bootstrap
```

Verified result:

- API started successfully
- `/health` returned `{"status":"ok","service":"opsledger-api"}`
- `/api/bootstrap` returned the expected seeded workspace snapshot

#### Verified web dev startup

To avoid the occupied default ports and to point the SPA at the verified API instance:

```bash
VITE_API_URL=http://127.0.0.1:3301 pnpm --filter @opsledger/web exec vite --port 3310 --host 127.0.0.1
```

Verified follow-up check:

```bash
curl -sS http://127.0.0.1:3310
```

Verified result:

- Vite served the OpsLedger HTML shell successfully
- page title was `OpsLedger`

### Unverified or currently unsafe commands

These commands exist or are implied by the repo, but they were either not verified end-to-end or are currently unsafe as checked in.

#### Checked in, but currently broken or misleading

```bash
pnpm dev
```

Current status:

- not trustworthy as written
- the script in root `package.json` uses `pnpm --parallel --filter @opsledger/api dev --filter @opsledger/web dev`
- in practice, pnpm treats the trailing filter segment incorrectly and the command does not reliably launch both apps
- recommended future fix is likely:

```bash
pnpm --parallel --filter @opsledger/api --filter @opsledger/web dev
```

Do not document `pnpm dev` as safe again until it is re-tested after a script fix.

```bash
pnpm --filter @opsledger/api dev
```

Current status:

- unsafe if you rely on the default `OPSLEDGER_DATA_PATH`
- because filtered package commands run from `apps/api`, the default `./apps/api/data/opsledger.json` fallback resolves to `apps/api/apps/api/data/opsledger.json`
- this causes a shadow data file to be created outside the intended location

Use an explicit absolute path or `"$PWD/apps/api/data/opsledger.json"` from repo root instead.

#### Likely-valid but not directly run in isolation during review

```bash
pnpm db:generate
pnpm format
```

Notes:

- `pnpm db:generate` was exercised indirectly through `pnpm build`
- `pnpm format` is inferred from `package.json` and Biome config, but was not run

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
- `README.md` says `pnpm dev` starts the workspace together; that is not currently trustworthy without fixing the root script.
- `README.md` does not warn about the `OPSLEDGER_DATA_PATH` relative-path trap for filtered API runs.
- `packages/db/prisma/schema.prisma` encodes stronger constraints than the current JSON store enforces.
- `packages/config/src/index.ts` exports `parseWebEnv`, but the web app currently reads `import.meta.env` directly in `apps/web/src/lib/api.ts`; web env validation is not centrally enforced.

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

- Root `pnpm dev` script is malformed and should be fixed before trusting it.
- Filtered API dev runs can create a shadow data file under `apps/api/apps/api/data/opsledger.json` if `OPSLEDGER_DATA_PATH` is not set explicitly.
- The file store rewrites the entire JSON snapshot on each write and has no locking or conflict protection.
- There is no repository abstraction yet; `createApp` depends on `FileOpsLedgerStore` directly.

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
- The JSON store does not enforce referential integrity between services, owners, incidents, and drills.
- The JSON store does not enforce service slug uniqueness even though Prisma intends `@@unique([workspaceId, slug])`.
- The JSON store does not enforce one-postmortem-per-incident even though Prisma intends `incidentId @unique`.
- Moving to Prisma without first aligning runtime invariants will likely surface existing data-quality issues.

### Testing gaps

- No web tests.
- No Playwright tests.
- Current automated coverage is limited to:
  - `packages/core/src/index.test.ts`
  - `apps/api/src/app.test.ts`
- The happy path is tested more than edge cases and persistence constraints.

## Next-pass priorities

### Highest-impact work

1. Fix local dev safety first.
   - Repair the root `pnpm dev` script.
   - Fix `OPSLEDGER_DATA_PATH` so filtered API runs use the intended repo-root file.
   - Update `README.md` after re-verifying the corrected commands.
2. Introduce a persistence boundary before attempting a Prisma cutover.
   - Replace direct `FileOpsLedgerStore` coupling with an interface or repository abstraction.
   - Align current runtime invariants with the Prisma schema before switching backends.
3. Decide whether auth or persistence is the next true milestone.
   - Auth is still completely absent.
   - Persistence hardening is currently the sharper operational risk.

### Quick wins

- fix `pnpm dev`
- fix the default API data-path behavior
- add API tests for duplicate slugs, duplicate postmortems, and missing foreign references
- document a safe local run recipe in both `README.md` and this file

### Deeper refactors

- define a store interface shared by JSON and Prisma implementations
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

3. Do not trust `pnpm dev` until you have fixed and re-verified it.
4. If you need to run the API before fixing the root script, use:

   ```bash
   API_PORT=3301 OPSLEDGER_DATA_PATH="$PWD/apps/api/data/opsledger.json" pnpm --filter @opsledger/api dev
   ```

5. If you need to run the web app against that API, use:

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

- 2026-03-18: Verified `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm typecheck`.
- 2026-03-18: Verified API startup with explicit `OPSLEDGER_DATA_PATH="$PWD/apps/api/data/opsledger.json"` and alternate port `3301`.
- 2026-03-18: Verified Vite startup with explicit `VITE_API_URL=http://127.0.0.1:3301` and alternate port `3310`.
- 2026-03-18: Confirmed that the checked-in root `pnpm dev` script is not currently a reliable source of truth.
- 2026-03-18: Confirmed that filtered API dev runs can create a shadow JSON data file unless `OPSLEDGER_DATA_PATH` is set explicitly.
