import { buildDashboardMetrics, getRunbookReviewState } from '@opsledger/core';
import { useQuery } from '@tanstack/react-query';

import { SectionCard } from '../components/section-card';
import { StatCard } from '../components/stat-card';
import { StatusPill } from '../components/status-pill';
import { bootstrapQueryOptions } from '../lib/api';
import { formatDate, formatShortDate } from '../lib/format';

export function DashboardRoute() {
  const { data, isLoading, error } = useQuery(bootstrapQueryOptions);

  if (isLoading) {
    return <p className="state-message">Loading operations workspace...</p>;
  }

  if (error || !data) {
    return <p className="state-message">Unable to load workspace data.</p>;
  }

  const metrics = buildDashboardMetrics(data);
  const staleRunbooks = data.runbooks.filter(
    (runbook) => getRunbookReviewState(runbook).state === 'stale',
  );

  return (
    <div className="page-grid">
      <section className="stats-grid">
        <StatCard label="Services" value={metrics.services} />
        <StatCard
          label="Open incidents"
          value={metrics.openIncidents}
          tone="danger"
        />
        <StatCard
          label="Stale runbooks"
          value={metrics.staleRunbooks}
          tone="warning"
        />
        <StatCard label="Recent drills" value={metrics.recentDrills} />
      </section>

      <SectionCard
        title="Attention"
        subtitle="What needs review now"
        action={
          <StatusPill tone="neutral">
            {String(metrics.warningRunbooks)} near due
          </StatusPill>
        }
      >
        <div className="stack">
          {staleRunbooks.length === 0 ? (
            <p className="empty-state">
              No stale runbooks. Review pressure is under control.
            </p>
          ) : (
            staleRunbooks.map((runbook) => (
              <article key={runbook.id} className="record-card">
                <div className="record-card__header">
                  <h3>{runbook.title}</h3>
                  <StatusPill tone="stale">Stale</StatusPill>
                </div>
                <p>{runbook.summary}</p>
                <small>
                  Last reviewed {formatShortDate(runbook.reviewedAt)}
                </small>
              </article>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard title="Incidents" subtitle="Open response threads">
        <div className="stack">
          {data.incidents.map((incident) => (
            <article key={incident.id} className="record-card">
              <div className="record-card__header">
                <h3>{incident.title}</h3>
                <StatusPill tone={incident.status}>
                  {incident.status}
                </StatusPill>
              </div>
              <p>{incident.summary}</p>
              <small>Opened {formatDate(incident.openedAt)}</small>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Follow-ups" subtitle="Postmortem work tracking">
        <div className="stack">
          {data.postmortems.flatMap((postmortem) =>
            postmortem.followUps.map((task) => (
              <article key={task.id} className="record-card">
                <div className="record-card__header">
                  <h3>{task.title}</h3>
                  <StatusPill
                    tone={task.status === 'done' ? 'resolved' : 'warning'}
                  >
                    {task.status}
                  </StatusPill>
                </div>
                <p>{postmortem.title}</p>
                <small>Due {formatDate(task.dueAt)}</small>
              </article>
            )),
          )}
        </div>
      </SectionCard>
    </div>
  );
}
