type StatCardProps = {
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'danger';
};

export function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
