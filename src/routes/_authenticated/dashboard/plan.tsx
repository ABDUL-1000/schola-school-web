import { createFileRoute } from '@tanstack/react-router'
import { Check, Loader2, Mail, MessageCircle, Minus, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlanQuery } from '@/hooks/queries/plan.queries'
import type { PlanFeature, PlanResource, PlanTier, SchoolPlan } from '@/hooks/queries/plan.queries'

export const Route = createFileRoute('/_authenticated/dashboard/plan')({
  component: PlanRoute,
})

const RESOURCES: Array<{ key: PlanResource; label: string }> = [
  { key: 'students', label: 'Students' },
  { key: 'staff', label: 'Staff' },
  { key: 'branches', label: 'Branches' },
  { key: 'cbtExams', label: 'CBT exams' },
]

type Column = 'FREE' | PlanTier
const COLUMNS: Array<{ key: Column; label: string }> = [
  { key: 'FREE', label: 'Free' },
  { key: 'STANDARD', label: 'Standard' },
]

/** What each plan includes, row by row. A string is shown as-is; true/false as a tick or dash. */
const ROWS: Array<{ label: string; cells: (col: Column, feat: (f: PlanFeature) => boolean, free: Record<PlanResource, number | null>) => string | boolean }> = [
  { label: 'Students', cells: (c, _f, free) => (c === 'FREE' ? `Up to ${free.students}` : 'Unlimited') },
  { label: 'Staff', cells: (c, _f, free) => (c === 'FREE' ? `Up to ${free.staff}` : 'Unlimited') },
  { label: 'Branches / campuses', cells: (c, f, free) => (c === 'FREE' ? String(free.branches) : f('multiBranch') ? 'Unlimited' : '1') },
  { label: 'Attendance, timetable, lesson notes & plans', cells: () => true },
  { label: 'Score entry, broadsheet & positions', cells: () => true },
  { label: 'Fees & finance', cells: () => true },
  { label: 'ID cards (3D view, print, custom design)', cells: (c, _f, free) => (c === 'FREE' ? `First ${free.students} students & ${free.staff} staff` : 'Everyone') },
  { label: 'Report cards', cells: (c) => (c === 'FREE' ? 'With watermark' : 'Clean') },
  { label: 'Publish results to students & parents', cells: (_c, f) => f('publishResults') },
  { label: "Print a whole class's report cards at once", cells: (_c, f) => f('printAllReportCards') },
  { label: 'Report card design (layouts, colours, signature)', cells: (_c, f) => f('reportCardDesign') },
  { label: 'CBT exams', cells: (_c, f, free) => (f('unlimitedCbt') ? 'Unlimited' : `Up to ${free.cbtExams} to try`) },
  { label: 'AI tools (lesson notes, questions, scheme of work)', cells: (_c, f) => f('aiTools') },
]

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

function PlanRoute() {
  const { data: plan, isLoading } = usePlanQuery()

  if (isLoading || !plan) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  // One paid plan: Standard (older schools saved as CBT Pro / AI Elite are Standard too).
  const current: Column = plan.state === 'FREE' ? 'FREE' : 'STANDARD'
  const standard = plan.tiers.at(0)?.features
  const featuresOf = (col: Column) => (f: PlanFeature) => (col === 'FREE' ? false : !!standard?.[f])
  const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`

  const whatsapp = plan.contact.whatsapp
    ? `https://wa.me/${plan.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Schola, I would like to upgrade our school plan.')}`
    : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-16 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan & Upgrade</h1>
        <p className="mt-1 text-sm text-muted-foreground">What your school's plan includes, and how much of it you're using.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            {plan.label}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                plan.state === 'TRIAL' && 'bg-primary/10 text-primary',
                plan.state === 'PAID' && 'bg-green-500/15 text-green-700 dark:text-green-400',
                plan.state === 'FREE' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
              )}
            >
              {plan.state === 'TRIAL' ? 'All features unlocked' : plan.state === 'PAID' ? 'Paid' : 'Limited'}
            </span>
          </CardTitle>
          <CardDescription>
            {plan.state === 'TRIAL' &&
              `Your free trial ends on ${fmt(plan.endsAt)} (${plan.daysLeft} day${plan.daysLeft === 1 ? '' : 's'} left). After that you move to the free plan unless you upgrade. Nothing you've added is removed.`}
            {plan.state === 'PAID' && (plan.endsAt ? `Paid until ${fmt(plan.endsAt)}.` : 'Thank you for using Schola.')}
            {plan.state === 'FREE' &&
              'Everyone you have already added keeps working. Upgrade to add more students and staff, remove the report card watermark and publish results.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RESOURCES.map(({ key, label }) => {
              const used = plan.usage[key]
              const limit = plan.limits[key]
              const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
              const over = limit !== null && used > limit
              return (
                <div key={key} className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {used}
                    <span className="text-sm font-normal text-muted-foreground"> / {limit === null ? 'unlimited' : limit}</span>
                  </div>
                  {limit !== null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', over ? 'bg-destructive' : pct >= 80 ? 'bg-amber-500' : 'bg-primary')}
                        style={{ width: `${over ? 100 : pct}%` }}
                      />
                    </div>
                  )}
                  {over && <p className="mt-1.5 text-[11px] text-destructive">Over the limit: you can't add more until you upgrade.</p>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {plan.bill && <TermBill plan={plan} naira={naira} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Compare plans</CardTitle>
          <CardDescription>
            Standard is {naira(plan.price.perStudentPerTerm)} per student, per term
            {plan.price.agreed ? ' (your agreed price)' : ''}, with everything included. Billed for at least{' '}
            {plan.price.minimumStudents} students
            {plan.price.maximumStudents > 0 ? ` and at most ${plan.price.maximumStudents}, however many you have` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left font-medium text-muted-foreground" />
                {COLUMNS.map((c) => (
                  <th key={c.key} className={cn('px-3 py-2 text-center font-semibold', c.key === current && 'rounded-t-md bg-primary/10 text-primary')}>
                    {c.label}
                    <div className="text-[11px] font-normal text-muted-foreground">
                      {c.key === 'FREE' ? '₦0' : `${naira(plan.price.perStudentPerTerm)} / student / term`}
                    </div>
                    {c.key === current && <div className="text-[10px] font-medium uppercase tracking-wide">{plan.state === 'TRIAL' ? 'Trial' : 'Current'}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 text-muted-foreground">{row.label}</td>
                  {COLUMNS.map((c) => {
                    const v = row.cells(c.key, featuresOf(c.key), plan.freeLimits)
                    return (
                      <td key={c.key} className={cn('px-3 py-2.5 text-center', c.key === current && 'bg-primary/5')}>
                        {v === true ? (
                          <Check className="mx-auto size-4 text-green-600" />
                        ) : v === false ? (
                          <Minus className="mx-auto size-4 text-muted-foreground/50" />
                        ) : (
                          <span className="text-xs font-medium">{v}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold">Ready to upgrade?</div>
            <p className="text-sm text-muted-foreground">Talk to the Schola team and we'll switch your school over the same day.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <Button asChild className="gap-1.5">
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> Chat on WhatsApp
                </a>
              </Button>
            )}
            <Button asChild variant={whatsapp ? 'outline' : 'default'} className="gap-1.5">
              <a href={`mailto:${plan.contact.email}?subject=${encodeURIComponent('Upgrade our Schola plan')}`}>
                <Mail className="size-4" /> {plan.contact.email}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/** What the school pays each term on Standard. Billing is done by the Schola team (bank transfer) for now. */
function TermBill({ plan, naira }: { plan: SchoolPlan; naira: (n: number) => string }) {
  const bill = plan.bill
  if (!bill) return null
  const how = bill.flatFee
    ? 'Your agreed flat fee per term.'
    : `${bill.billedStudents} student${bill.billedStudents === 1 ? '' : 's'} × ${naira(bill.rate)}${plan.price.agreed ? ' (your agreed price)' : ''}`
  const note = bill.flatFee
    ? null
    : bill.capped
      ? `You have ${bill.activeStudents} students, but you only pay for ${bill.cap}.`
      : bill.floorApplied
        ? `You have ${bill.activeStudents} students; the minimum billed is ${bill.billedStudents}.`
        : `Based on your ${bill.activeStudents} active students today. It changes as students join or leave.`
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {plan.state === 'PAID' ? 'Your term bill on Standard' : 'Your term bill if you choose Standard'}
            </div>
            <div className="text-3xl font-bold tabular-nums">
              {naira(bill.total)}
              <span className="text-sm font-normal text-muted-foreground"> / term</span>
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {how} · about {naira(bill.total * 3)} for the 3-term session
            </div>
            {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
          </div>
        </div>
        <p className="max-w-sm rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Payment is by bank transfer for now. Contact the Schola team and we will send you the account details, then switch your
          school to Standard as soon as payment is confirmed.
        </p>
      </CardContent>
    </Card>
  )
}
