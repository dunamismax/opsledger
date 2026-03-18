import { serve } from '@hono/node-server';
import { parseApiEnv } from '@opsledger/config';

import { createApp } from './app.js';
import { FileOpsLedgerStore } from './store.js';

const env = parseApiEnv(process.env);
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
