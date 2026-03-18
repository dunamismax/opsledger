import type { CreateServiceInput } from '@opsledger/contracts';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatusPill } from '../components/status-pill';
import { bootstrapQueryOptions, createService } from '../lib/api';
import { titleCase } from '../lib/format';

type ServiceFormValues = {
  slug: string;
  name: string;
  summary: string;
  ownerId: string;
  environment: string;
  tier: 'critical' | 'core' | 'support';
  status: 'healthy' | 'at_risk' | 'degraded';
  dependencyIdsCsv: string;
  linkLabel: string;
  linkUrl: string;
};

export function ServicesRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateServiceInput) => createService(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
    },
  });

  const defaultValues: ServiceFormValues = {
    slug: '',
    name: '',
    summary: '',
    ownerId: '',
    environment: 'production',
    tier: 'core',
    status: 'healthy',
    dependencyIdsCsv: '',
    linkLabel: '',
    linkUrl: '',
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      const dependencyIds = value.dependencyIdsCsv
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

      await mutation.mutateAsync({
        slug: value.slug,
        name: value.name,
        summary: value.summary,
        ownerId: value.ownerId,
        environment: value.environment,
        tier: value.tier,
        status: value.status,
        dependencyIds,
        links:
          value.linkLabel && value.linkUrl
            ? [{ label: value.linkLabel, url: value.linkUrl }]
            : [],
      });
      formApi.reset();
    },
  });

  if (isLoading) {
    return <p className="state-message">Loading services...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load services.</p>;
  }

  return (
    <div className="page-grid">
      <SectionCard title="Catalog" subtitle="Service inventory and ownership">
        <div className="stack">
          {data.services.map((service) => {
            const owner = data.owners.find(
              (record) => record.id === service.ownerId,
            );
            const dependencies = data.services.filter((record) =>
              service.dependencyIds.includes(record.id),
            );

            return (
              <article key={service.id} className="record-card">
                <div className="record-card__header">
                  <h3>{service.name}</h3>
                  <StatusPill
                    tone={
                      service.status === 'healthy'
                        ? 'healthy'
                        : service.status === 'at_risk'
                          ? 'warning'
                          : 'fail'
                    }
                  >
                    {titleCase(service.status)}
                  </StatusPill>
                </div>
                <p>{service.summary}</p>
                <small>
                  {service.environment} · {service.tier} ·{' '}
                  {owner?.name ?? 'Unassigned'}
                </small>
                <small>
                  Depends on{' '}
                  {dependencies.length > 0
                    ? dependencies
                        .map((dependency) => dependency.name)
                        .join(', ')
                    : 'No direct dependencies recorded'}
                </small>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="New service"
        subtitle="Capture ownership, links, and dependencies"
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
            name="name"
            children={(field) => (
              <label>
                Name
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <form.Field
            name="slug"
            children={(field) => (
              <label>
                Slug
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
            name="ownerId"
            children={(field) => (
              <label>
                Owner
                <select
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                >
                  <option value="">Select an owner</option>
                  {data.owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="environment"
              children={(field) => (
                <label>
                  Environment
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="tier"
              children={(field) => (
                <label>
                  Tier
                  <select
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(
                        event.target.value as 'critical' | 'core' | 'support',
                      )
                    }
                  >
                    <option value="critical">Critical</option>
                    <option value="core">Core</option>
                    <option value="support">Support</option>
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
                          | 'healthy'
                          | 'at_risk'
                          | 'degraded',
                      )
                    }
                  >
                    <option value="healthy">Healthy</option>
                    <option value="at_risk">At risk</option>
                    <option value="degraded">Degraded</option>
                  </select>
                </label>
              )}
            />
          </div>
          <form.Field
            name="dependencyIdsCsv"
            children={(field) => (
              <label>
                Dependencies
                <input
                  placeholder="service-2, service-3"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          />
          <div className="form-row">
            <form.Field
              name="linkLabel"
              children={(field) => (
                <label>
                  Link label
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
            <form.Field
              name="linkUrl"
              children={(field) => (
                <label>
                  Link URL
                  <input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                </label>
              )}
            />
          </div>
          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Add service'}
          </button>
          {mutation.error ? (
            <p className="form-error">{mutation.error.message}</p>
          ) : null}
        </form>
      </SectionCard>
    </div>
  );
}
