import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

import { AppShell } from './components/app-shell';
import { DashboardRoute } from './routes/dashboard';
import { DrillsRoute } from './routes/drills';
import { IncidentsRoute } from './routes/incidents';
import { PostmortemsRoute } from './routes/postmortems';
import { RunbooksRoute } from './routes/runbooks';
import { ServicesRoute } from './routes/services';

const rootRoute = createRootRoute({
  component: AppShell,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardRoute,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'services',
  component: ServicesRoute,
});

const runbooksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'runbooks',
  component: RunbooksRoute,
});

const incidentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'incidents',
  component: IncidentsRoute,
});

const postmortemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'postmortems',
  component: PostmortemsRoute,
});

const drillsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'drills',
  component: DrillsRoute,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  servicesRoute,
  runbooksRoute,
  incidentsRoute,
  postmortemsRoute,
  drillsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
