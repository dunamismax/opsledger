import {
  type AddTimelineEntryInput,
  type BootstrapResponse,
  type CreateDrillInput,
  type CreateIncidentInput,
  type CreatePostmortemInput,
  type CreateRunbookInput,
  type CreateServiceInput,
  bootstrapResponseSchema,
} from '@opsledger/contracts';
import { queryOptions } from '@tanstack/react-query';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function request<T>(
  path: string,
  init?: RequestInit,
  parser?: (value: unknown) => T,
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Request failed');
  }

  const payload = (await response.json()) as unknown;
  return parser ? parser(payload) : (payload as T);
}

export const bootstrapQueryOptions = queryOptions({
  queryKey: ['bootstrap'],
  queryFn: () =>
    request('/api/bootstrap', undefined, (value) =>
      bootstrapResponseSchema.parse(value),
    ),
});

export function createService(input: CreateServiceInput) {
  return request('/api/services', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createRunbook(input: CreateRunbookInput) {
  return request('/api/runbooks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createIncident(input: CreateIncidentInput) {
  return request('/api/incidents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function addTimelineEntry(
  incidentId: string,
  input: AddTimelineEntryInput,
) {
  return request(`/api/incidents/${incidentId}/timeline`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createPostmortem(input: CreatePostmortemInput) {
  return request('/api/postmortems', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function setFollowUpStatus(followUpId: string, status: string) {
  return request(`/api/follow-ups/${followUpId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export function createDrill(input: CreateDrillInput) {
  return request('/api/drills', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type { BootstrapResponse };
