import { format } from 'date-fns'
import type { LessonPlan } from '@/hooks/queries/lesson-plan.queries'
import { PLAN_SECTIONS, PlanStatusBadge, weekLabel } from '@/components/lesson-plans/plan-utils'

/** Read-only lesson plan laid out like a printed plan; prints cleanly with window.print(). */
export function LessonPlanView({ plan }: { plan: LessonPlan }) {
  const meta: Array<[string, string | null | undefined]> = [
    ['Teacher', plan.teacher.fullname],
    ['Class', plan.class.name],
    ['Subject', plan.subject.name],
    ['Week', `${plan.weekNumber ? `Week ${plan.weekNumber} · ` : ''}${weekLabel(plan.weekStart)}`],
    ['Term', plan.term ? `${plan.term.name}${plan.term.session ? ` · ${plan.term.session.name}` : ''}` : null],
    ['Duration', plan.duration],
    ['Sub-topic', plan.subTopic],
  ]

  return (
    <article className="space-y-5 rounded-xl border bg-card p-5 print:border-0 print:p-0">
      <header className="space-y-2 border-b pb-4">
        {plan.school && <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{plan.school.schoolName}</p>}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xl font-bold">{plan.topic}</h2>
          <span className="print:hidden">
            <PlanStatusBadge status={plan.status} late={plan.late} />
          </span>
        </div>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {meta
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>
        <p className="text-xs text-muted-foreground print:hidden">
          Due {format(new Date(plan.dueAt), 'EEE d MMM, h:mm a')}
          {plan.submittedAt && ` · submitted ${format(new Date(plan.submittedAt), 'EEE d MMM, h:mm a')}`}
          {plan.aiDrafted && ' · drafted with AI, edited by the teacher'}
        </p>
      </header>

      {PLAN_SECTIONS.map(({ key, label }) =>
        plan[key] ? (
          <section key={key} className="break-inside-avoid">
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{plan[key]}</p>
          </section>
        ) : null,
      )}

      {plan.status === 'APPROVED' && plan.reviewedByName && (
        <footer className="border-t pt-3 text-sm text-muted-foreground">
          Approved by <b className="text-foreground">{plan.reviewedByName}</b>
          {plan.reviewedAt && ` on ${format(new Date(plan.reviewedAt), 'd MMM yyyy')}`}
        </footer>
      )}
    </article>
  )
}
