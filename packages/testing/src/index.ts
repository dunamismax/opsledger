import type { BootstrapResponse } from '@opsledger/contracts';

export function createSampleSnapshot(): BootstrapResponse {
  return {
    workspace: {
      id: 'workspace-1',
      name: 'Northline Ops',
      slug: 'northline-ops',
      description: 'Operational memory for the platform team.',
    },
    operator: {
      id: 'operator-1',
      name: 'Riley Chen',
      email: 'riley@example.com',
      role: 'Platform Lead',
    },
    owners: [
      {
        id: 'owner-1',
        name: 'Riley Chen',
        email: 'riley@example.com',
        team: 'Platform',
      },
      {
        id: 'owner-2',
        name: 'Morgan Silva',
        email: 'morgan@example.com',
        team: 'Applications',
      },
    ],
    services: [],
    runbooks: [],
    incidents: [],
    postmortems: [],
    drills: [],
  };
}
