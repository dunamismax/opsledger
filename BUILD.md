# BUILD

This file is the build contract for OpsLedger. Agents should use it to stay aligned on scope, milestones, and progress tracking.

## Project Summary

- Name: OpsLedger
- Category: self-hosted operations workspace
- Primary users: small engineering teams, operators, homelabbers, internal platform owners
- Core promise: keep operational memory durable, reviewable, and actionable
- Current status: initial MVP foundation implemented

## Product Vision

OpsLedger should sit in the space between scattered docs and heavyweight incident-management platforms. It should help small teams answer:

- What services do we run?
- Who owns them?
- What is the correct runbook?
- When did we last test recovery?
- What happened during the last incident?
- Which follow-ups are still open?

The product should feel calmer and more durable than chat-driven incident response, with explicit support for review cycles and operational memory.

## Goals

- Track services, dependencies, owners, links, and environments.
- Store runbooks with review dates and stale warnings.
- Capture incident timelines, notes, and postmortems.
- Track restore drills and tabletop exercises over time.
- Provide a simple self-hosted setup for small teams.

## Non-Goals

- Not a full developer portal platform.
- Not a replacement for full observability tooling.
- Not a chat-first incident commander product.
- Not a generic wiki with weak structure.

## Product Scope

## MVP

- auth and team/workspace basics
- service catalog with owners and metadata
- dependency links between services
- runbooks with review cadence and version history
- incident records with timeline entries and outcomes
- postmortem records with follow-up tasks
- restore drill records with evidence and results
- stale content warnings for overdue runbook reviews

## v1

- service health links and external references
- recurring review reminders
- templates for incidents, runbooks, and postmortems
- exportable timeline and postmortem views
- audit log for sensitive edits

## Later

- change-calendar style views
- drill scheduling
- lightweight integrations with external monitors
- public or internal read-only status surfaces

## Architecture Direction

- Frontend: React + Vite SPA
- App shell: TanStack Router
- Server state: TanStack Query
- Forms: TanStack Form
- API: Hono
- Database: PostgreSQL
- ORM: Prisma
- Auth: Better Auth
- Validation: Zod
- Tooling: Biome, Vitest, Playwright

## Suggested Repository Shape

```text
apps/
  api/            Hono API and review/drill workflows
  web/            React SPA for operators
packages/
  contracts/      shared Zod schemas and API contracts
  db/             Prisma schema, generated client, migrations
  core/           service catalog, runbook, incident, and drill domain logic
  config/         environment validation
  testing/        shared test helpers
```

## Repository Reality

As of 2026-03-17, the repository is no longer planning-only. The current implementation includes:

- a pnpm workspace with `apps/api`, `apps/web`, and shared packages under `packages/*`
- a Hono API with validated CRUD flows for services, runbooks, incidents, postmortems, follow-up status updates, and drills
- a React + Vite SPA using TanStack Router, TanStack Query, and TanStack Form
- shared Zod contracts and core domain logic for stale runbook review state and dashboard metrics
- a Prisma schema and generated client for the intended PostgreSQL-backed future state
- a file-backed development store seeded from `apps/api/data/opsledger.json`

Important: the live application currently persists to the JSON file store, not PostgreSQL. Prisma/PostgreSQL is scaffolded but not yet wired into runtime flows.

## Verified Baseline

The following commands were verified successfully on 2026-03-17:

- `pnpm build`
- `pnpm test`
- `pnpm lint`

If a future change breaks any of these, restore this baseline before expanding scope.

## Current Gaps

- Better Auth is not implemented yet.
- Workspace/team setup is represented in seeded data, not in a real auth/session flow.
- API persistence is JSON-file based; Prisma/PostgreSQL is not the active source of truth yet.
- Incident lifecycle testing exists at a basic API/domain level only and should be expanded.
- Export flows, audit logging, deployment/backups guidance, and search/filter polish are still open.

## Source Of Truth

- Product scope and milestone intent live in this file.
- Shared data shapes must remain aligned with `packages/contracts`.
- Cross-entity business rules belong in `packages/core`.
- The current runnable seed/demo state lives in `apps/api/data/opsledger.json`.
- Until the database migration is complete, changes to persistence behavior should preserve local development ergonomics.

## Milestones

## Milestone 0: Foundation

- [x] Initialize pnpm workspace and project tooling
- [x] Scaffold app and package layout
- [x] Add environment validation and shared scripts
- [ ] Add baseline auth and workspace setup

## Milestone 1: Catalog and runbooks

- [x] Model services, owners, environments, dependencies, and runbooks
- [x] Build service catalog views
- [x] Build runbook CRUD and review-date handling
- [x] Add stale warning logic

## Milestone 2: Incidents and postmortems

- [x] Model incidents, timeline entries, follow-ups, and postmortems
- [x] Build incident timeline UI
- [x] Build postmortem authoring and follow-up tracking
- [ ] Add test coverage for incident lifecycle flows

## Milestone 3: Drills and operational reviews

- [x] Model restore drills and tabletop exercises
- [x] Build drill history and evidence capture
- [x] Build recurring review visibility
- [ ] Add exportable records for incidents and drills

## Milestone 4: Hardening

- [ ] Add audit logging for critical edits
- [ ] Add deployment docs and backups guidance
- [ ] Add polish for search and filtering
- [ ] Prepare first release notes and demo data

## Definition of Done

OpsLedger is ready for its first real release when:

- a team can model services and ownership clearly
- runbooks can be written, reviewed, and flagged as stale
- incident timelines and postmortems can be recorded end to end
- drill history is durable and easy to review
- the app is self-hostable on a small-team setup
- the main flows have automated tests and documentation

## Agent Working Rules

- Keep the product incident-first and operations-first.
- Do not let the scope drift into a generic portal or wiki.
- Prefer durable records and explicit review cycles over chat-style ephemera.
- Update this file when milestones or product boundaries change.
- Record important product and architecture decisions below.
- Before adding major new scope, check whether the work is better framed as auth, persistence hardening, workflow completion, or export/review support.
- Preserve the calm operator-focused UI voice; avoid generic admin-dashboard drift.
- Keep local development simple. New setup requirements should be documented in `README.md` and reflected in `.env.example`.

## Next Pass Priorities

The next agent should prefer one of these tracks, in order:

1. Implement baseline auth and workspace setup with Better Auth, without turning the product into a multi-tenant portal.
2. Replace or abstract the JSON file store behind a repository boundary so Prisma/PostgreSQL can become the active persistence layer.
3. Expand automated coverage around incident lifecycle flows, follow-up transitions, and drill/runbook regressions.
4. Add exportable incident and drill records, keeping records durable and review-friendly.

If scope is unclear, default to whichever of auth or persistence most cleanly reduces the gap between the current build and the MVP definition.

## Next Agent Checklist

- Read `README.md` and this file before changing scope.
- Confirm the current baseline with `pnpm build`, `pnpm test`, and `pnpm lint`.
- Decide whether the pass is primarily auth, persistence, testing, or workflow polish.
- Update milestone checkboxes and progress notes when meaningful work lands.
- Record any architecture decision that changes the persistence or auth direction.

## Progress Notes

- 2026-03-17: Initial operations-product brief and milestone plan added.
- 2026-03-17: Built a pnpm workspace with React/Vite web app, Hono API, shared contracts/core packages, Prisma schema, seeded development data, and verified `pnpm build`, `pnpm test`, and `pnpm lint`.
- 2026-03-17: Build contract updated to document the implemented baseline, active gaps, and recommended next-pass priorities for the next agent handoff.

## Decision Log

- 2026-03-17: OpsLedger will focus on operational memory, runbooks, and drills instead of trying to become a full developer portal.
- 2026-03-17: Development persistence will use a repo-local JSON data file first while the PostgreSQL/Prisma package is prepared for the next persistence and auth phase.

## Open Questions

- What is the right minimal reminder/review system for v1 without turning the app into a notification platform?
- Should dependency relationships stay simple in the first release or support richer typed relationships immediately?
- What is the smallest Better Auth rollout that preserves the calm single-workspace setup without blocking self-hosted adoption?
