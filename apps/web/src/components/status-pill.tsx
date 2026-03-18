import type { ReactNode } from 'react';

type StatusPillProps = {
  children: ReactNode;
  tone:
    | 'healthy'
    | 'warning'
    | 'stale'
    | 'open'
    | 'monitoring'
    | 'resolved'
    | 'pass'
    | 'partial'
    | 'fail'
    | 'neutral';
};

export function StatusPill({ children, tone }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{children}</span>;
}
