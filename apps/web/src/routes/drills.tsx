import type { CreateDrillInput } from '@opsledger/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatusPill } from '../components/status-pill';
import { bootstrapQueryOptions, createDrill } from '../lib/api';
import { formatDate } from '../lib/format';

type DrillFormValues = {
  serviceId: string;
  title: string;
  kind: 'restore' | 'tabletop';
  facilitator: string;
  outcome: 'pass' | 'partial' | 'fail';
  notes: string;
  evidenceLabel: string;
  evidenceUrl: string;
  evidenceNotes: string;
};

export function DrillsRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateDrillInput) => createDrill(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const defaultValues: DrillFormValues = {
    serviceId: '',
    title: '',
    kind: 'restore',
    facilitator: '',
    outcome: 'pass',
    notes: '',
    evidenceLabel: '',
    evidenceUrl: '',
    evidenceNotes: '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync({
        title: value.title,
        serviceIds: [value.serviceId],
        kind: value.kind,
        facilitator: value.facilitator,
        outcome: value.outcome,
        notes: value.notes,
        evidenceLabel: value.evidenceLabel,
        evidenceUrl: value.evidenceUrl,
        evidenceNotes: value.evidenceNotes || null,
      });
      formApi.reset();
    },
  });

  if (isLoading) {
    return <p className="state-message">Loading drills...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load drills.</p>;
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="Drills"
        subtitle="Restore and tabletop rehearsal history"
      >
        <div className="stack">
          {data.drills.map((drill) => (
            <article key={drill.id} className="record-card">
              <div className="record-card__header">
                <h3>{drill.title}</h3>
                <StatusPill
                  tone={
                    drill.outcome === 'pass'
                      ? 'pass'
                      : drill.outcome === 'partial'
                        ? 'partial'
                        : 'fail'
                  }
                >
                  {drill.outcome}
                </StatusPill>
              </div>
              <p>{drill.notes}</p>
              <small>
                {drill.kind} · {drill.facilitator} ·{' '}
                {formatDate(drill.performedAt)}
              </small>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="New drill" subtitle="Record evidence and outcome">
        <form
          className="ops-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="serviceId"
            children={(field) => (
              <label>
                Service
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
          <div className="form-row">
            <form.Field
              name="kind"
              children={(field) => (
                <label>
                  Drill type
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value as 'restore' | 'tabletop',
                      )
                    }
                  >
                    <option value="restore">Restore</option>
                    <option value="tabletop">Tabletop</option>
                  </select>
                </label>
              )}
            />
            <form.Field
              name="outcome"
              children={(field) => (
                <label>
                  Outcome
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value as 'pass' | 'partial' | 'fail',
                      )
                    }
                  >
                    <option value="pass">Pass</option>
                    <option value="partial">Partial</option>
                    <option value="fail">Fail</option>
                  </select>
                </label>
              )}
            />
            <form.Field
              name="facilitator"
              children={(field) => (
                <label>
                  Facilitator
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
            name="notes"
            children={(field) => (
              <label>
                Notes
                <textarea
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="evidenceLabel"
              children={(field) => (
                <label>
                  Evidence label
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="evidenceUrl"
              children={(field) => (
                <label>
                  Evidence URL
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
            name="evidenceNotes"
            children={(field) => (
              <label>
                Evidence notes
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
            {mutation.isPending ? 'Saving...' : 'Add drill'}
          </button>
          {mutation.error ? (
            <p className="form-error">{mutation.error.message}</p>
          ) : null}
        </form>
      </SectionCard>
    </div>
  );
}
