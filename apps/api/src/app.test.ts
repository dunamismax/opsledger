import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createSampleSnapshot } from '@opsledger/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { FileOpsLedgerStore } from './store.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  while (tempDirectories.length > 0) {
    const directory = tempDirectories.pop();
    if (directory) {
      await rm(directory, { recursive: true, force: true });
    }
  }
});

async function createTestApp(snapshot = createSampleSnapshot()) {
  const directory = await mkdtemp(join(tmpdir(), 'opsledger-'));
  tempDirectories.push(directory);

  const dataPath = join(directory, 'opsledger.json');
  await writeFile(dataPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  const store = new FileOpsLedgerStore(dataPath);
  return createApp(store);
}

describe('OpsLedger API', () => {
  it('returns bootstrap data', async () => {
    const app = await createTestApp();
    const response = await app.request('/api/bootstrap');

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.workspace.name).toBe('Northline Ops');
  });

  it('creates services', async () => {
    const app = await createTestApp();
    const response = await app.request('/api/services', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'new-api',
        name: 'New API',
        summary: 'Tracks a new service.',
        ownerId: 'owner-1',
        environment: 'staging',
        tier: 'core',
        status: 'healthy',
        dependencyIds: [],
        links: [],
      }),
    });

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.slug).toBe('new-api');
  });

  it('rejects duplicate service slugs', async () => {
    const snapshot = createSampleSnapshot();
    snapshot.services.push({
      id: 'service-1',
      slug: 'edge-api',
      name: 'Edge API',
      summary: 'Handles public traffic.',
      ownerId: 'owner-1',
      environment: 'production',
      tier: 'critical',
      status: 'healthy',
      dependencyIds: [],
      links: [],
    });

    const app = await createTestApp(snapshot);
    const response = await app.request('/api/services', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'edge-api',
        name: 'Duplicate Edge API',
        summary: 'Should fail.',
        ownerId: 'owner-1',
        environment: 'staging',
        tier: 'core',
        status: 'healthy',
        dependencyIds: [],
        links: [],
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Service slug already exists: edge-api',
    });
  });

  it('rejects service creation when references are missing', async () => {
    const app = await createTestApp();
    const response = await app.request('/api/services', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'new-api',
        name: 'New API',
        summary: 'Tracks a new service.',
        ownerId: 'owner-404',
        environment: 'staging',
        tier: 'core',
        status: 'healthy',
        dependencyIds: ['service-404'],
        links: [],
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Owner not found: owner-404',
    });
  });

  it('rejects duplicate postmortems for the same incident', async () => {
    const snapshot = createSampleSnapshot();
    snapshot.services.push({
      id: 'service-1',
      slug: 'edge-api',
      name: 'Edge API',
      summary: 'Handles public traffic.',
      ownerId: 'owner-1',
      environment: 'production',
      tier: 'critical',
      status: 'healthy',
      dependencyIds: [],
      links: [],
    });
    snapshot.incidents.push({
      id: 'incident-1',
      title: 'Edge API latency',
      serviceIds: ['service-1'],
      severity: 'sev2',
      status: 'resolved',
      openedAt: '2026-03-18T00:00:00.000Z',
      closedAt: '2026-03-18T01:00:00.000Z',
      summary: 'Latency rose above SLO.',
      timeline: [],
    });
    snapshot.postmortems.push({
      id: 'postmortem-1',
      incidentId: 'incident-1',
      title: 'Edge API latency review',
      summary: 'Queue pressure caused the issue.',
      contributingFactors: ['Alert thresholds were too loose.'],
      followUps: [],
    });

    const app = await createTestApp(snapshot);
    const response = await app.request('/api/postmortems', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        incidentId: 'incident-1',
        title: 'Second review',
        summary: 'Should fail.',
        contributingFactors: ['Duplicate review attempt.'],
        followUpTitle: 'Fix alerts',
        followUpOwner: 'Riley Chen',
        followUpDueAt: null,
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Incident already has a postmortem: incident-1',
    });
  });

  it('rejects postmortems for missing incidents', async () => {
    const app = await createTestApp();
    const response = await app.request('/api/postmortems', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        incidentId: 'incident-404',
        title: 'Missing incident review',
        summary: 'Should fail.',
        contributingFactors: ['Missing incident.'],
        followUpTitle: 'Fix references',
        followUpOwner: 'Riley Chen',
        followUpDueAt: null,
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Incident not found: incident-404',
    });
  });
});
