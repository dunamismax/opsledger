import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';

import { bootstrapQueryOptions } from '../lib/api';

const navigation = [
  { to: '/', label: 'Overview' },
  { to: '/services', label: 'Services' },
  { to: '/runbooks', label: 'Runbooks' },
  { to: '/incidents', label: 'Incidents' },
  { to: '/postmortems', label: 'Postmortems' },
  { to: '/drills', label: 'Drills' },
];

export function AppShell() {
  const snapshot = useQuery(bootstrapQueryOptions);

  return (
    <div className="app-shell">
      <div className="app-shell__backdrop" />
      <header className="topbar">
        <div>
          <p className="eyebrow">OpsLedger</p>
          <h1>{snapshot.data?.workspace.name ?? 'Loading workspace...'}</h1>
          <p className="lede">
            {snapshot.data?.workspace.description ??
              'Operational memory for small teams.'}
          </p>
        </div>
        {snapshot.data ? (
          <div className="topbar__operator">
            <span>{snapshot.data.operator.name}</span>
            <small>{snapshot.data.operator.role}</small>
          </div>
        ) : null}
      </header>

      <div className="layout">
        <aside className="sidebar">
          <p className="eyebrow">Workspace</p>
          <nav className="nav-list">
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="nav-link"
                activeProps={{ className: 'nav-link nav-link--active' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
