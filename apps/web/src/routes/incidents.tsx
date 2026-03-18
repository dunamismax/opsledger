import type {
  AddTimelineEntryInput,
  CreateIncidentInput,
  Incident,
} from '@opsledger/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatusPill } from '../components/status-pill';
import {
  addTimelineEntry,
  bootstrapQueryOptions,
  createIncident,
} from '../lib/api';
import { formatDate, titleCase } from '../lib/format';

type TimelineFormValues = {
  kind:
    | 'detection'
    | 'assessment'
    | 'mitigation'
    | 'decision'
    | 'recovery'
    | 'note';
  body: string;
  author: string;
};

type IncidentFormValues = {
  title: string;
  serviceId: string;
  severity: 'sev1' | 'sev2' | 'sev3' | 'sev4';
  status: 'open' | 'monitoring' | 'resolved';
  summary: string;
  initialUpdate: string;
};

function TimelineComposer({ incident }: { incident: Incident }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: AddTimelineEntryInput) =>
      addTimelineEntry(incident.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const defaultValues: TimelineFormValues = {
    kind: 'note',
    body: '',
    author: '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync(value);
      formApi.reset();
    },
  });

  return (
    <form
      className="ops-form ops-form--compact"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="form-row">
        <form.Field
          name="kind"
          children={(field) => (
            <label>
              Update type
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value as
                      | 'detection'
                      | 'assessment'
                      | 'mitigation'
                      | 'decision'
                      | 'recovery'
                      | 'note',
                  )
                }
              >
                <option value="note">Note</option>
                <option value="assessment">Assessment</option>
                <option value="mitigation">Mitigation</option>
                <option value="decision">Decision</option>
                <option value="recovery">Recovery</option>
              </select>
            </label>
          )}
        />
        <form.Field
          name="author"
          children={(field) => (
            <label>
              Author
              <input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            </label>
          )}
        />
      </div>
      <form.Field
        name="body"
        children={(field) => (
          <label>
            Timeline note
            <textarea
              rows={3}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </label>
        )}
      />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Add timeline entry'}
      </button>
    </form>
  );
}

export function IncidentsRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateIncidentInput) => createIncident(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const defaultValues: IncidentFormValues = {
    title: '',
    serviceId: '',
    severity: 'sev2',
    status: 'open',
    summary: '',
    initialUpdate: '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync({
        title: value.title,
        serviceIds: [value.serviceId],
        severity: value.severity,
        status: value.status,
        summary: value.summary,
        initialUpdate: value.initialUpdate,
      });
      formApi.reset();
    },
  });

  if (isLoading) {
    return <p className="state-message">Loading incidents...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load incidents.</p>;
  }

  return (
    <div className="page-grid">
      <SectionCard title="Incidents" subtitle="Timeline-first response records">
        <div className="stack">
          {data.incidents.map((incident) => (
            <article key={incident.id} className="record-card">
              <div className="record-card__header">
                <h3>{incident.title}</h3>
                <StatusPill tone={incident.status}>
                  {titleCase(incident.status)}
                </StatusPill>
              </div>
              <p>{incident.summary}</p>
              <small>Opened {formatDate(incident.openedAt)}</small>
              <div className="timeline">
                {incident.timeline.map((entry) => (
                  <div key={entry.id} className="timeline__entry">
                    <strong>{titleCase(entry.kind)}</strong>
                    <p>{entry.body}</p>
                    <small>
                      {entry.author} · {formatDate(entry.occurredAt)}
                    </small>
                  </div>
                ))}
              </div>
              <TimelineComposer incident={incident} />
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="New incident"
        subtitle="Start a response thread with the first note"
      >
        <form
          className="ops-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="title"
            children={(field) => (
              <label>
                Title
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <form.Field
            name="serviceId"
            children={(field) => (
              <label>
                Primary service
                <select
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  <option value="">Select a service</option>
                  {data.services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="severity"
              children={(field) => (
                <label>
                  Severity
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value as 'sev1' | 'sev2' | 'sev3' | 'sev4',
                      )
                    }
                  >
                    <option value="sev1">SEV 1</option>
                    <option value="sev2">SEV 2</option>
                    <option value="sev3">SEV 3</option>
                    <option value="sev4">SEV 4</option>
                  </select>
                </label>
              )}
            />
            <form.Field
              name="status"
              children={(field) => (
                <label>
                  Status
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value as
                          | 'open'
                          | 'monitoring'
                          | 'resolved',
                      )
                    }
                  >
                    <option value="open">Open</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
              )}
            />
          </div>
          <form.Field
            name="summary"
            children={(field) => (
              <label>
                Summary
                <textarea
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <form.Field
            name="initialUpdate"
            children={(field) => (
              <label>
                First timeline note
                <textarea
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Create incident'}
          </button>
          {mutation.error ? (
            <p className="form-error">{mutation.error.message}</p>
          ) : null}
        </form>
      </SectionCard>
    </div>
  );
}
