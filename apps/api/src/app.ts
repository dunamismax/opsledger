import {
  addTimelineEntryInputSchema,
  createDrillInputSchema,
  createIncidentInputSchema,
  createPostmortemInputSchema,
  createRunbookInputSchema,
  createServiceInputSchema,
  setFollowUpStatusInputSchema,
} from '@opsledger/contracts';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { z } from 'zod';

import type { FileOpsLedgerStore } from './store.js';

function getValidationErrorMessage(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
    .join(', ');
}

export function createApp(store: FileOpsLedgerStore) {
  const app = new Hono();

  app.use('/api/*', cors());

  app.get('/health', (context) =>
    context.json({
      status: 'ok',
      service: 'opsledger-api',
    }),
  );

  app.get('/api/bootstrap', async (context) => {
    const snapshot = await store.getSnapshot();
    return context.json(snapshot);
  });

  app.post('/api/services', async (context) => {
    const input = createServiceInputSchema.safeParse(await context.req.json());
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    const service = await store.createService(input.data);
    return context.json(service, 201);
  });

  app.post('/api/runbooks', async (context) => {
    const input = createRunbookInputSchema.safeParse(await context.req.json());
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    const runbook = await store.createRunbook(input.data);
    return context.json(runbook, 201);
  });

  app.post('/api/incidents', async (context) => {
    const input = createIncidentInputSchema.safeParse(await context.req.json());
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    const incident = await store.createIncident(input.data);
    return context.json(incident, 201);
  });

  app.post('/api/incidents/:incidentId/timeline', async (context) => {
    const input = addTimelineEntryInputSchema.safeParse(
      await context.req.json(),
    );
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    try {
      const incident = await store.addTimelineEntry(
        context.req.param('incidentId'),
        input.data,
      );
      return context.json(incident);
    } catch (error) {
      return context.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Unable to update incident',
        },
        404,
      );
    }
  });

  app.post('/api/postmortems', async (context) => {
    const input = createPostmortemInputSchema.safeParse(
      await context.req.json(),
    );
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    const postmortem = await store.createPostmortem(input.data);
    return context.json(postmortem, 201);
  });

  app.post('/api/follow-ups/:followUpId/status', async (context) => {
    const input = setFollowUpStatusInputSchema.safeParse(
      await context.req.json(),
    );
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    try {
      const task = await store.setFollowUpStatus(
        context.req.param('followUpId'),
        input.data,
      );
      return context.json(task);
    } catch (error) {
      return context.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Unable to update follow-up',
        },
        404,
      );
    }
  });

  app.post('/api/drills', async (context) => {
    const input = createDrillInputSchema.safeParse(await context.req.json());
    if (!input.success) {
      return context.json(
        { error: getValidationErrorMessage(input.error) },
        400,
      );
    }

    const drill = await store.createDrill(input.data);
    return context.json(drill, 201);
  });

  return app;
}
