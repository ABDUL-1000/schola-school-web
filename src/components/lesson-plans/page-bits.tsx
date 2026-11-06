import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
      <div>
        <h1 className="text-[24px] font-bold text-foreground">{title}</h1>
        {description && <p className="text-[14px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'good' | 'warn' | 'bad'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'bad'
          ? 'text-red-600 dark:text-red-400'
          : 'text-foreground'
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border bg-card/50 py-12 text-center">
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}
