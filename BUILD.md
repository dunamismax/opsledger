# BUILD

This file is the build contract for OpsLedger. Agents should use it to stay aligned on scope, milestones, and progress tracking.

## Project Summary

- Name: OpsLedger
- Category: self-hosted operations workspace
- Primary users: small engineering teams, operators, homelabbers, internal platform owners
- Core promise: keep operational memory durable, reviewable, and actionable
- Current status: planning

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

## Milestones

## Milestone 0: Foundation

- [ ] Initialize pnpm workspace and project tooling
- [ ] Scaffold app and package layout
- [ ] Add environment validation and shared scripts
- [ ] Add baseline auth and workspace setup

## Milestone 1: Catalog and runbooks

- [ ] Model services, owners, environments, dependencies, and runbooks
- [ ] Build service catalog views
- [ ] Build runbook CRUD and review-date handling
- [ ] Add stale warning logic

## Milestone 2: Incidents and postmortems

- [ ] Model incidents, timeline entries, follow-ups, and postmortems
- [ ] Build incident timeline UI
- [ ] Build postmortem authoring and follow-up tracking
- [ ] Add test coverage for incident lifecycle flows

## Milestone 3: Drills and operational reviews

- [ ] Model restore drills and tabletop exercises
- [ ] Build drill history and evidence capture
- [ ] Build recurring review visibility
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

## Progress Notes

- 2026-03-17: Initial operations-product brief and milestone plan added.

## Decision Log

- 2026-03-17: OpsLedger will focus on operational memory, runbooks, and drills instead of trying to become a full developer portal.

## Open Questions

- What is the right minimal reminder/review system for v1 without turning the app into a notification platform?
- Should dependency relationships stay simple in the first release or support richer typed relationships immediately?
