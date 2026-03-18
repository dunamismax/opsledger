import type { CreatePostmortemInput } from '@opsledger/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatusPill } from '../components/status-pill';
import {
  bootstrapQueryOptions,
  createPostmortem,
  setFollowUpStatus,
} from '../lib/api';
import { formatDate } from '../lib/format';

export function PostmortemsRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (input: CreatePostmortemInput) => createPostmortem(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });
  const followUpMutation = useMutation({
    mutationFn: ({
      followUpId,
      status,
    }: { followUpId: string; status: string }) =>
      setFollowUpStatus(followUpId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const form = useForm({
    defaultValues: {
      incidentId: '',
      title: '',
      summary: '',
      contributingFactorsText: '',
      followUpTitle: '',
      followUpOwner: '',
      followUpDueAt: '',
    },
    onSubmit: async ({ value, formApi }) => {
      await createMutation.mutateAsync({
        incidentId: value.incidentId,
        title: value.title,
        summary: value.summary,
        contributingFactors: value.contributingFactorsText
          .split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean),
        followUpTitle: value.followUpTitle,
        followUpOwner: value.followUpOwner,
        followUpDueAt: value.followUpDueAt
          ? new Date(value.followUpDueAt).toISOString()
          : null,
      });
      formApi.reset();
    },
  });

  if (isLoading) {
    return <p className="state-message">Loading postmortems...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load postmortems.</p>;
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="Postmortems"
        subtitle="Outcomes and follow-up ownership"
      >
        <div className="stack">
          {data.postmortems.map((postmortem) => (
            <article key={postmortem.id} className="record-card">
              <div className="record-card__header">
                <h3>{postmortem.title}</h3>
                <StatusPill tone="neutral">
                  {String(postmortem.followUps.length)} follow-up
                  {postmortem.followUps.length === 1 ? '' : 's'}
                </StatusPill>
              </div>
              <p>{postmortem.summary}</p>
              <div className="stack stack--tight">
                {postmortem.followUps.map((followUp) => (
                  <div key={followUp.id} className="inline-card">
                    <div>
                      <strong>{followUp.title}</strong>
                      <small>
                        {followUp.owner} · due {formatDate(followUp.dueAt)}
                      </small>
                    </div>
                    <div className="inline-card__actions">
                      <StatusPill
                        tone={
                          followUp.status === 'done' ? 'resolved' : 'warning'
                        }
                      >
                        {followUp.status}
                      </StatusPill>
                      {followUp.status !== 'done' ? (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() =>
                            followUpMutation.mutate({
                              followUpId: followUp.id,
                              status:
                                followUp.status === 'open'
                                  ? 'in_progress'
                                  : 'done',
                            })
                          }
                        >
                          Advance
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="New postmortem"
        subtitle="Capture causes and first follow-up"
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
            name="incidentId"
            children={(field) => (
              <label>
                Incident
                <select
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  <option value="">Select an incident</option>
                  {data.incidents.map((incident) => (
                    <option key={incident.id} value={incident.id}>
                      {incident.title}
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
          <form.Field
            name="summary"
            children={(field) => (
              <label>
                Summary
                <textarea
                  rows={4}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <form.Field
            name="contributingFactorsText"
            children={(field) => (
              <label>
                Contributing factors
                <textarea
                  rows={5}
                  placeholder="One factor per line"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="followUpTitle"
              children={(field) => (
                <label>
                  First follow-up
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="followUpOwner"
              children={(field) => (
                <label>
                  Follow-up owner
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="followUpDueAt"
              children={(field) => (
                <label>
                  Due date
                  <input
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
          </div>
          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving...' : 'Add postmortem'}
          </button>
          {createMutation.error ? (
            <p className="form-error">{createMutation.error.message}</p>
          ) : null}
        </form>
      </SectionCard>
    </div>
  );
}
