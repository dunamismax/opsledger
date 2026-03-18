import type {
  BootstrapResponse,
  Incident,
  Runbook,
} from '@opsledger/contracts';

export type RunbookReviewState = 'healthy' | 'warning' | 'stale';

export function getRunbookReviewState(
  runbook: Runbook,
  now = new Date(),
): {
  state: RunbookReviewState;
  nextReviewAt: string;
  daysUntilReview: number;
} {
  const reviewedAt = new Date(runbook.reviewedAt);
  const nextReview = new Date(reviewedAt);
  nextReview.setUTCDate(nextReview.getUTCDate() + runbook.reviewCadenceDays);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysUntilReview = Math.ceil(
    (nextReview.getTime() - now.getTime()) / millisecondsPerDay,
  );

  if (daysUntilReview < 0) {
    return {
      state: 'stale',
      nextReviewAt: nextReview.toISOString(),
      daysUntilReview,
    };
  }

  if (daysUntilReview <= 7) {
    return {
      state: 'warning',
      nextReviewAt: nextReview.toISOString(),
      daysUntilReview,
    };
  }

  return {
    state: 'healthy',
    nextReviewAt: nextReview.toISOString(),
    daysUntilReview,
  };
}

export function buildDashboardMetrics(
  snapshot: BootstrapResponse,
  now = new Date(),
) {
  const staleRunbooks = snapshot.runbooks.filter(
    (runbook) => getRunbookReviewState(runbook, now).state === 'stale',
  );
  const warningRunbooks = snapshot.runbooks.filter(
    (runbook) => getRunbookReviewState(runbook, now).state === 'warning',
  );
  const openIncidents = snapshot.incidents.filter(
    (incident) => incident.status !== 'resolved',
  );
  const overdueFollowUps = snapshot.postmortems.flatMap((postmortem) =>
    postmortem.followUps.filter((followUp) => {
      if (followUp.status === 'done' || !followUp.dueAt) {
        return false;
      }

      return new Date(followUp.dueAt) < now;
    }),
  );
  const recentDrills = snapshot.drills.filter((drill) => {
    const performedAt = new Date(drill.performedAt);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    return performedAt >= ninetyDaysAgo;
  });

  return {
    services: snapshot.services.length,
    runbooks: snapshot.runbooks.length,
    staleRunbooks: staleRunbooks.length,
    warningRunbooks: warningRunbooks.length,
    openIncidents: openIncidents.length,
    overdueFollowUps: overdueFollowUps.length,
    recentDrills: recentDrills.length,
  };
}

export function sortIncidents(incidents: Incident[]) {
  return [...incidents].sort(
    (left, right) =>
      new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime(),
  );
}

export function sortRunbooks(runbooks: Runbook[]) {
  return [...runbooks].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function serviceNameMap(snapshot: BootstrapResponse) {
  return new Map(
    snapshot.services.map((service) => [service.id, service.name]),
  );
}
