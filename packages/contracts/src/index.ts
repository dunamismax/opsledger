import { z } from 'zod';

const idSchema = z.string().min(1);

export const serviceTierSchema = z.enum(['critical', 'core', 'support']);
export const serviceStatusSchema = z.enum(['healthy', 'at_risk', 'degraded']);
export const incidentSeveritySchema = z.enum(['sev1', 'sev2', 'sev3', 'sev4']);
export const incidentStatusSchema = z.enum(['open', 'monitoring', 'resolved']);
export const timelineEntryKindSchema = z.enum([
  'detection',
  'assessment',
  'mitigation',
  'decision',
  'recovery',
  'note',
]);
export const followUpStatusSchema = z.enum(['open', 'in_progress', 'done']);
export const drillKindSchema = z.enum(['restore', 'tabletop']);
export const drillOutcomeSchema = z.enum(['pass', 'partial', 'fail']);

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
});

export const operatorSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
});

export const ownerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  email: z.string().email(),
  team: z.string().min(1),
});

export const serviceSchema = z.object({
  id: idSchema,
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  ownerId: idSchema,
  environment: z.string().min(1),
  tier: serviceTierSchema,
  status: serviceStatusSchema,
  dependencyIds: z.array(idSchema),
  links: z.array(linkSchema),
});

export const runbookSchema = z.object({
  id: idSchema,
  serviceId: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  body: z.string().min(1),
  reviewedAt: z.string().datetime(),
  reviewCadenceDays: z.number().int().positive(),
  updatedAt: z.string().datetime(),
  version: z.number().int().positive(),
});

export const incidentTimelineEntrySchema = z.object({
  id: idSchema,
  occurredAt: z.string().datetime(),
  kind: timelineEntryKindSchema,
  body: z.string().min(1),
  author: z.string().min(1),
});

export const incidentSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  serviceIds: z.array(idSchema).min(1),
  severity: incidentSeveritySchema,
  status: incidentStatusSchema,
  openedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  summary: z.string().min(1),
  timeline: z.array(incidentTimelineEntrySchema),
});

export const followUpTaskSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  owner: z.string().min(1),
  dueAt: z.string().datetime().nullable(),
  status: followUpStatusSchema,
});

export const postmortemSchema = z.object({
  id: idSchema,
  incidentId: idSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  contributingFactors: z.array(z.string().min(1)),
  followUps: z.array(followUpTaskSchema),
});

export const drillEvidenceSchema = z.object({
  id: idSchema,
  label: z.string().min(1),
  url: z.string().url(),
  notes: z.string().min(1).nullable(),
});

export const drillSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  serviceIds: z.array(idSchema).min(1),
  kind: drillKindSchema,
  performedAt: z.string().datetime(),
  facilitator: z.string().min(1),
  outcome: drillOutcomeSchema,
  notes: z.string().min(1),
  evidence: z.array(drillEvidenceSchema),
});

export const bootstrapResponseSchema = z.object({
  workspace: workspaceSchema,
  operator: operatorSchema,
  owners: z.array(ownerSchema),
  services: z.array(serviceSchema),
  runbooks: z.array(runbookSchema),
  incidents: z.array(incidentSchema),
  postmortems: z.array(postmortemSchema),
  drills: z.array(drillSchema),
});

export const createServiceInputSchema = serviceSchema.omit({
  id: true,
});

export const createRunbookInputSchema = runbookSchema.omit({
  id: true,
  updatedAt: true,
  version: true,
});

export const createIncidentInputSchema = incidentSchema
  .omit({
    id: true,
    openedAt: true,
    closedAt: true,
    timeline: true,
  })
  .extend({
    initialUpdate: z.string().min(1),
  });

export const addTimelineEntryInputSchema = incidentTimelineEntrySchema.omit({
  id: true,
  occurredAt: true,
});

export const createPostmortemInputSchema = postmortemSchema
  .omit({
    id: true,
    followUps: true,
  })
  .extend({
    followUpTitle: z.string().min(1),
    followUpOwner: z.string().min(1),
    followUpDueAt: z.string().datetime().nullable(),
  });

export const setFollowUpStatusInputSchema = z.object({
  status: followUpStatusSchema,
});

export const createDrillInputSchema = drillSchema
  .omit({
    id: true,
    performedAt: true,
    evidence: true,
  })
  .extend({
    evidenceLabel: z.string().min(1),
    evidenceUrl: z.string().url(),
    evidenceNotes: z.string().min(1).nullable(),
  });

export type Workspace = z.infer<typeof workspaceSchema>;
export type Operator = z.infer<typeof operatorSchema>;
export type Owner = z.infer<typeof ownerSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Runbook = z.infer<typeof runbookSchema>;
export type IncidentTimelineEntry = z.infer<typeof incidentTimelineEntrySchema>;
export type Incident = z.infer<typeof incidentSchema>;
export type FollowUpTask = z.infer<typeof followUpTaskSchema>;
export type Postmortem = z.infer<typeof postmortemSchema>;
export type DrillEvidence = z.infer<typeof drillEvidenceSchema>;
export type Drill = z.infer<typeof drillSchema>;
export type BootstrapResponse = z.infer<typeof bootstrapResponseSchema>;
export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;
export type CreateRunbookInput = z.infer<typeof createRunbookInputSchema>;
export type CreateIncidentInput = z.infer<typeof createIncidentInputSchema>;
export type AddTimelineEntryInput = z.infer<typeof addTimelineEntryInputSchema>;
export type CreatePostmortemInput = z.infer<typeof createPostmortemInputSchema>;
export type SetFollowUpStatusInput = z.infer<
  typeof setFollowUpStatusInputSchema
>;
export type CreateDrillInput = z.infer<typeof createDrillInputSchema>;
