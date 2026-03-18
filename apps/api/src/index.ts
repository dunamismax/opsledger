import { fileURLToPath } from 'node:url';

import { serve } from '@hono/node-server';
import { parseApiEnv } from '@opsledger/config';

import { createApp } from './app.js';
import { FileOpsLedgerStore } from './store.js';

const env = parseApiEnv(process.env, {
  defaultDataPath: fileURLToPath(
    new URL('../data/opsledger.json', import.meta.url),
  ),
});
const store = new FileOpsLedgerStore(env.OPSLEDGER_DATA_PATH);
const app = createApp(store);

serve(
  {
    fetch: app.fetch,
    port: env.API_PORT,
  },
  (info) => {
    console.log(
      `OpsLedger API listening on http://localhost:${info.port} using ${env.OPSLEDGER_DATA_PATH}`,
    );
  },
);
