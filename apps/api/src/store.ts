import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  type AddTimelineEntryInput,
  type BootstrapResponse,
  type CreateDrillInput,
  type CreateIncidentInput,
  type CreatePostmortemInput,
  type CreateRunbookInput,
  type CreateServiceInput,
  type Drill,
  type FollowUpTask,
  type Incident,
  type Postmortem,
  type Runbook,
  type Service,
  type SetFollowUpStatusInput,
  bootstrapResponseSchema,
} from '@opsledger/contracts';

const defaultDataFile = new URL('../data/opsledger.json', import.meta.url);

function createId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export class StoreError extends Error {
  constructor(
    message: string,
    readonly statusCode: 404 | 409,
  ) {
    super(message);
    this.name = 'StoreError';
  }
}

export interface OpsLedgerStore {
  getSnapshot(): Promise<BootstrapResponse>;
  createService(input: CreateServiceInput): Promise<Service>;
  createRunbook(input: CreateRunbookInput): Promise<Runbook>;
  createIncident(input: CreateIncidentInput): Promise<Incident>;
  addTimelineEntry(
    incidentId: string,
    input: AddTimelineEntryInput,
  ): Promise<Incident>;
  createPostmortem(input: CreatePostmortemInput): Promise<Postmortem>;
  setFollowUpStatus(
    followUpId: string,
    input: SetFollowUpStatusInput,
  ): Promise<FollowUpTask>;
  createDrill(input: CreateDrillInput): Promise<Drill>;
}

export class FileOpsLedgerStore implements OpsLedgerStore {
  constructor(private readonly filePath: string) {}

  private async ensureFile() {
    const absolutePath = resolve(this.filePath);
    await mkdir(dirname(absolutePath), { recursive: true });

    try {
      await access(absolutePath);
    } catch {
      const seed = await readFile(defaultDataFile, 'utf8');
      await writeFile(absolutePath, seed, 'utf8');
    }
  }

  private async readSnapshot() {
    await this.ensureFile();
    const raw = await readFile(resolve(this.filePath), 'utf8');
    return bootstrapResponseSchema.parse(JSON.parse(raw));
  }

  private async writeSnapshot(snapshot: BootstrapResponse) {
    await writeFile(
      resolve(this.filePath),
      `${JSON.stringify(snapshot, null, 2)}\n`,
      'utf8',
    );
  }

  async getSnapshot() {
    return this.readSnapshot();
  }

  private assertOwnerExists(snapshot: BootstrapResponse, ownerId: string) {
    if (!snapshot.owners.some((owner) => owner.id === ownerId)) {
      throw new StoreError(`Owner not found: ${ownerId}`, 404);
    }
  }

  private assertServiceExists(snapshot: BootstrapResponse, serviceId: string) {
    if (!snapshot.services.some((service) => service.id === serviceId)) {
      throw new StoreError(`Service not found: ${serviceId}`, 404);
    }
  }

  private assertServiceIdsExist(
    snapshot: BootstrapResponse,
    serviceIds: string[],
  ) {
    for (const serviceId of serviceIds) {
      this.assertServiceExists(snapshot, serviceId);
    }
  }

  private assertIncidentExists(
    snapshot: BootstrapResponse,
    incidentId: string,
  ) {
    if (!snapshot.incidents.some((incident) => incident.id === incidentId)) {
      throw new StoreError(`Incident not found: ${incidentId}`, 404);
    }
  }

  private assertUniqueServiceSlug(snapshot: BootstrapResponse, slug: string) {
    if (snapshot.services.some((service) => service.slug === slug)) {
      throw new StoreError(`Service slug already exists: ${slug}`, 409);
    }
  }

  private assertPostmortemAvailable(
    snapshot: BootstrapResponse,
    incidentId: string,
  ) {
    if (
      snapshot.postmortems.some(
        (postmortem) => postmortem.incidentId === incidentId,
      )
    ) {
      throw new StoreError(
        `Incident already has a postmortem: ${incidentId}`,
        409,
      );
    }
  }

  async createService(input: CreateServiceInput) {
    const snapshot = await this.readSnapshot();
    this.assertUniqueServiceSlug(snapshot, input.slug);
    this.assertOwnerExists(snapshot, input.ownerId);
    this.assertServiceIdsExist(snapshot, input.dependencyIds);

    const service: Service = {
      id: createId('service'),
      ...input,
    };

    snapshot.services.unshift(service);
    await this.writeSnapshot(snapshot);
    return service;
  }

  async createRunbook(input: CreateRunbookInput) {
    const snapshot = await this.readSnapshot();
    this.assertServiceExists(snapshot, input.serviceId);

    const runbook: Runbook = {
      id: createId('runbook'),
      updatedAt: new Date().toISOString(),
      version: 1,
      ...input,
    };

    snapshot.runbooks.unshift(runbook);
    await this.writeSnapshot(snapshot);
    return runbook;
  }

  async createIncident(input: CreateIncidentInput) {
    const snapshot = await this.readSnapshot();
    this.assertServiceIdsExist(snapshot, input.serviceIds);

    const incident: Incident = {
      id: createId('incident'),
      title: input.title,
      serviceIds: input.serviceIds,
      severity: input.severity,
      status: input.status,
      openedAt: new Date().toISOString(),
      closedAt: input.status === 'resolved' ? new Date().toISOString() : null,
      summary: input.summary,
      timeline: [
        {
          id: createId('timeline'),
          occurredAt: new Date().toISOString(),
          kind: 'note',
          body: input.initialUpdate,
          author: 'OpsLedger operator',
        },
      ],
    };

    snapshot.incidents.unshift(incident);
    await this.writeSnapshot(snapshot);
    return incident;
  }

  async addTimelineEntry(incidentId: string, input: AddTimelineEntryInput) {
    const snapshot = await this.readSnapshot();
    const incident = snapshot.incidents.find(
      (record) => record.id === incidentId,
    );

    if (!incident) {
      throw new StoreError('Incident not found', 404);
    }

    incident.timeline.push({
      id: createId('timeline'),
      occurredAt: new Date().toISOString(),
      ...input,
    });

    await this.writeSnapshot(snapshot);
    return incident;
  }

  async createPostmortem(input: CreatePostmortemInput) {
    const snapshot = await this.readSnapshot();
    this.assertIncidentExists(snapshot, input.incidentId);
    this.assertPostmortemAvailable(snapshot, input.incidentId);

    const postmortem: Postmortem = {
      id: createId('postmortem'),
      incidentId: input.incidentId,
      title: input.title,
      summary: input.summary,
      contributingFactors: input.contributingFactors,
      followUps: [
        {
          id: createId('followup'),
          title: input.followUpTitle,
          owner: input.followUpOwner,
          dueAt: input.followUpDueAt,
          status: 'open',
        },
      ],
    };

    snapshot.postmortems.unshift(postmortem);
    await this.writeSnapshot(snapshot);
    return postmortem;
  }

  async setFollowUpStatus(
    followUpId: string,
    input: SetFollowUpStatusInput,
  ): Promise<FollowUpTask> {
    const snapshot = await this.readSnapshot();

    for (const postmortem of snapshot.postmortems) {
      const followUp = postmortem.followUps.find(
        (task) => task.id === followUpId,
      );
      if (followUp) {
        followUp.status = input.status;
        await this.writeSnapshot(snapshot);
        return followUp;
      }
    }

    throw new StoreError('Follow-up not found', 404);
  }

  async createDrill(input: CreateDrillInput): Promise<Drill> {
    const snapshot = await this.readSnapshot();
    this.assertServiceIdsExist(snapshot, input.serviceIds);

    const drill: Drill = {
      id: createId('drill'),
      title: input.title,
      serviceIds: input.serviceIds,
      kind: input.kind,
      performedAt: new Date().toISOString(),
      facilitator: input.facilitator,
      outcome: input.outcome,
      notes: input.notes,
      evidence: [
        {
          id: createId('evidence'),
          label: input.evidenceLabel,
          url: input.evidenceUrl,
          notes: input.evidenceNotes,
        },
      ],
    };

    snapshot.drills.unshift(drill);
    await this.writeSnapshot(snapshot);
    return drill;
  }
}
