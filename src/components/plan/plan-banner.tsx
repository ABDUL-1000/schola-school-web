import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Clock, Sparkles, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlanQuery } from '@/hooks/queries/plan.queries'
import type { PlanResource } from '@/hooks/queries/plan.queries'

const WORDS: Record<PlanResource, string> = { students: 'students', staff: 'staff', branches: 'branches', cbtExams: 'CBT exams' }
const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

/** One line at the top of the school dashboard: trial days left, free-plan usage, or renewal soon. */
export function PlanBanner() {
  const { data: plan } = usePlanQuery()
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('plan-banner-hidden') === '1'
    } catch {
      return false
    }
  })
  if (!plan) return null

  const hide = () => {
    setHidden(true)
    try {
      sessionStorage.setItem('plan-banner-hidden', '1')
    } catch {
      /* private mode: just hide for now */
    }
  }

  // What Standard would cost this school per term (shown while on trial / free).
  const standardCost = plan.bill ? ` Standard for your school: ₦${plan.bill.total.toLocaleString('en-NG')} a term.` : ''

  let tone: 'info' | 'warn' | 'danger' = 'info'
  let icon = <Sparkles className="size-4 shrink-0" />
  let text: React.ReactNode = null
  let dismissible = false

  if (plan.state === 'TRIAL') {
    const soon = (plan.daysLeft ?? 0) <= 7
    tone = soon ? 'warn' : 'info'
    icon = <Clock className="size-4 shrink-0" />
    dismissible = !soon
    text = (
      <>
        <strong>Free trial: {plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'} left</strong> (until {fmt(plan.endsAt)}). Every feature is
        unlocked. After the trial you move to the free plan ({plan.freeLimits.students} students, {plan.freeLimits.staff} staff) unless you upgrade.
        {standardCost}
      </>
    )
  } else if (plan.state === 'FREE') {
    const over = plan.overLimit.filter((r) => r === 'students' || r === 'staff')
    tone = over.length ? 'danger' : 'warn'
    icon = <TriangleAlert className="size-4 shrink-0" />
    text = over.length ? (
      <>
        <strong>You're on the free plan.</strong>{' '}
        {over.map((r) => `${plan.usage[r]} ${WORDS[r]} (free plan: ${plan.limits[r]})`).join(' and ')}. Everyone you've added keeps working,
        but you can't add more, and report cards carry a watermark until you upgrade.
        {standardCost}
      </>
    ) : (
      <>
        <strong>You're on the free plan:</strong> {plan.usage.students} of {plan.limits.students} students, {plan.usage.staff} of{' '}
        {plan.limits.staff} staff. Report cards carry a watermark and publishing results is locked.
        {standardCost}
      </>
    )
  } else if (plan.daysLeft !== null && plan.daysLeft <= 14) {
    tone = 'warn'
    icon = <Clock className="size-4 shrink-0" />
    text = (
      <>
        <strong>Your {plan.label} plan ends on {fmt(plan.endsAt)}</strong> ({plan.daysLeft} day{plan.daysLeft === 1 ? '' : 's'}). Renew to keep
        every feature.
      </>
    )
  }

  if (!text || (dismissible && hidden)) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
        tone === 'info' && 'border-primary/30 bg-primary/5 text-foreground',
        tone === 'warn' && 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200',
        tone === 'danger' && 'border-destructive/40 bg-destructive/10 text-destructive',
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <p className="flex-1">{text}</p>
      <Link to="/dashboard/plan" className="shrink-0 font-semibold underline-offset-2 hover:underline">
        {plan.state === 'PAID' ? 'Renew' : 'See plans'}
      </Link>
      {dismissible && (
        <button type="button" onClick={hide} aria-label="Hide" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
