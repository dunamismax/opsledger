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

async function createTestApp() {
  const directory = await mkdtemp(join(tmpdir(), 'opsledger-'));
  tempDirectories.push(directory);

  const dataPath = join(directory, 'opsledger.json');
  await writeFile(
    dataPath,
    `${JSON.stringify(createSampleSnapshot(), null, 2)}\n`,
    'utf8',
  );

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
});
