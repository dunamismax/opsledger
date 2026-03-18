import type { CreateRunbookInput } from '@opsledger/contracts';
import { getRunbookReviewState } from '@opsledger/core';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatusPill } from '../components/status-pill';
import { bootstrapQueryOptions, createRunbook } from '../lib/api';
import { formatShortDate } from '../lib/format';

export function RunbooksRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateRunbookInput) => createRunbook(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const form = useForm({
    defaultValues: {
      serviceId: '',
      title: '',
      summary: '',
      body: '',
      reviewedAt: '',
      reviewCadenceDays: '30',
    },
    onSubmit: async ({ value, formApi }) => {
      await mutation.mutateAsync({
        serviceId: value.serviceId,
        title: value.title,
        summary: value.summary,
        body: value.body,
        reviewedAt: new Date(value.reviewedAt).toISOString(),
        reviewCadenceDays: Number(value.reviewCadenceDays),
      });
      formApi.reset();
    },
  });

  if (isLoading) {
    return <p className="state-message">Loading runbooks...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load runbooks.</p>;
  }

  return (
    <div className="page-grid">
      <SectionCard
        title="Runbooks"
        subtitle="Review cadence and recovery knowledge"
      >
        <div className="stack">
          {data.runbooks.map((runbook) => {
            const reviewState = getRunbookReviewState(runbook);
            const service = data.services.find(
              (record) => record.id === runbook.serviceId,
            );
            return (
              <article key={runbook.id} className="record-card">
                <div className="record-card__header">
                  <h3>{runbook.title}</h3>
                  <StatusPill tone={reviewState.state}>
                    {reviewState.state}
                  </StatusPill>
                </div>
                <p>{runbook.summary}</p>
                <small>
                  {service?.name ?? 'Unknown service'} · Reviewed{' '}
                  {formatShortDate(runbook.reviewedAt)}
                </small>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="New runbook"
        subtitle="Store the current recovery path"
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
            name="body"
            children={(field) => (
              <label>
                Procedure
                <textarea
                  rows={8}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="reviewedAt"
              children={(field) => (
                <label>
                  Last reviewed
                  <input
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="reviewCadenceDays"
              children={(field) => (
                <label>
                  Cadence days
                  <input
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
          </div>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Add runbook'}
          </button>
          {mutation.error ? (
            <p className="form-error">{mutation.error.message}</p>
          ) : null}
        </form>
      </SectionCard>
    </div>
  );
}
