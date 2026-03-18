import type { BootstrapResponse, Runbook } from '@opsledger/contracts';
import { describe, expect, it } from 'vitest';

import { buildDashboardMetrics, getRunbookReviewState } from './index';

function createRunbook(overrides: Partial<Runbook>): Runbook {
  return {
    id: 'runbook-1',
    serviceId: 'service-1',
    title: 'API failover',
    summary: 'Fail over the API stack.',
    body: 'Promote the standby database and shift traffic.',
    reviewedAt: '2026-01-01T00:00:00.000Z',
    reviewCadenceDays: 30,
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...overrides,
  };
}

describe('getRunbookReviewState', () => {
  it('marks overdue runbooks as stale', () => {
    const result = getRunbookReviewState(
      createRunbook({}),
      new Date('2026-02-10T00:00:00.000Z'),
    );

    expect(result.state).toBe('stale');
  });

  it('marks near-due runbooks as warning', () => {
    const result = getRunbookReviewState(
      createRunbook({ reviewedAt: '2026-02-01T00:00:00.000Z' }),
      new Date('2026-02-24T00:00:00.000Z'),
    );

    expect(result.state).toBe('warning');
  });
});

describe('buildDashboardMetrics', () => {
  it('counts open work that needs attention', () => {
    const snapshot: BootstrapResponse = {
      workspace: {
        id: 'workspace-1',
        name: 'OpsLedger',
        slug: 'opsledger',
        description: 'Test workspace',
      },
      operator: {
        id: 'user-1',
        name: 'Alex',
        email: 'alex@example.com',
        role: 'SRE',
      },
      owners: [
        {
          id: 'owner-1',
          name: 'Alex',
          email: 'alex@example.com',
          team: 'Platform',
        },
      ],
      services: [
        {
          id: 'service-1',
          slug: 'api',
          name: 'API',
          summary: 'Core API',
          ownerId: 'owner-1',
          environment: 'prod',
          tier: 'critical',
          status: 'healthy',
          dependencyIds: [],
          links: [],
        },
      ],
      runbooks: [createRunbook({})],
      incidents: [
        {
          id: 'incident-1',
          title: 'API latency',
          serviceIds: ['service-1'],
          severity: 'sev2',
          status: 'open',
          openedAt: '2026-02-09T00:00:00.000Z',
          closedAt: null,
          summary: 'Latency rose above SLO.',
          timeline: [],
        },
      ],
      postmortems: [
        {
          id: 'pm-1',
          incidentId: 'incident-1',
          title: 'Latency postmortem',
          summary: 'Queue saturation.',
          contributingFactors: ['Missing queue alerts'],
          followUps: [
            {
              id: 'fu-1',
              title: 'Add queue alarm',
              owner: 'Alex',
              dueAt: '2026-02-01T00:00:00.000Z',
              status: 'open',
            },
          ],
        },
      ],
      drills: [
        {
          id: 'drill-1',
          title: 'Restore drill',
          serviceIds: ['service-1'],
          kind: 'restore',
          performedAt: '2026-02-05T00:00:00.000Z',
          facilitator: 'Alex',
          outcome: 'pass',
          notes: 'Recovered within objective.',
          evidence: [],
        },
      ],
    };

    const metrics = buildDashboardMetrics(
      snapshot,
      new Date('2026-02-10T00:00:00.000Z'),
    );

    expect(metrics.staleRunbooks).toBe(1);
    expect(metrics.openIncidents).toBe(1);
    expect(metrics.overdueFollowUps).toBe(1);
    expect(metrics.recentDrills).toBe(1);
  });
});
