import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, differenceInCalendarDays } from 'date-fns'
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, PlayCircle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type TermView = { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean; startedAt?: string | null; startedBy?: string | null }
interface Calendar {
  session: { id: string; name: string } | null
  currentTerm: TermView | null
  nextTerm: TermView | null
  terms: Array<TermView>
  phase?: 'before' | 'in_term' | 'holiday'
  isLastTerm?: boolean
  autoAdvanceTerm: boolean
  checklist: { reportSheets: { publishedClasses: number; classes: number }; fees: { currentTerm: number; nextTerm: number } } | null
}

const KEY = ['academic-calendar']
const day = (d: string) => format(new Date(d), 'd MMM yyyy')

/** Where the school is in the year, and moving to the next term. */
export function AcademicCalendarCard() {
  const qc = useQueryClient()
  const { data: cal, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get('/school/academic/calendar')).data?.data as Calendar,
  })
  const [confirming, setConfirming] = useState(false)
  const [copySetup, setCopySetup] = useState(true)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: KEY })
    void qc.invalidateQueries({ queryKey: ['academic-sessions'] })
  }
  const toggleAuto = useMutation({
    mutationFn: async (autoAdvanceTerm: boolean) => (await api.patch('/school/academic/settings', { autoAdvanceTerm })).data,
    onSuccess: (r: any) => {
      toast.success(r?.message || 'Saved')
      refresh()
    },
    onError: (e: any) => toast.error(e?.message || 'Could not save'),
  })
  const start = useMutation({
    mutationFn: async (termId: string) => (await api.post(`/school/academic/terms/${termId}/start`, { copySetup })).data,
    onSuccess: (r: any) => {
      const c = r?.data?.copied
      const parts = c
        ? [c.feeStructures && `${c.feeStructures} fee structure${c.feeStructures === 1 ? '' : 's'}`, c.assessmentSetups && `${c.assessmentSetups} subject assessment setups`, c.gradingModes && `${c.gradingModes} CBT settings`].filter(Boolean)
        : []
      toast.success(r?.message || 'Term started', parts.length ? `Copied from last term: ${parts.join(', ')}.` : undefined)
      setConfirming(false)
      refresh()
    },
    onError: (e: any) => toast.error(e?.message || 'Could not start the term'),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border p-6">
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      </div>
    )
  }
  if (!cal?.currentTerm || !cal.session) {
    return (
      <div className="rounded-xl border p-5 text-sm text-muted-foreground">
        No academic session yet. Create one on the Sessions page to start your first term.
      </div>
    )
  }

  const cur = cal.currentTerm
  const next = cal.nextTerm
  const today = new Date()
  const daysToNext = next ? differenceInCalendarDays(new Date(next.startDate), today) : null
  const reports = cal.checklist?.reportSheets
  const fees = cal.checklist?.fees

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <CalendarClock className="size-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{cal.session.name} session</div>
            <div className="text-lg font-semibold">Current: {cur.name}</div>
            <div className="text-sm text-muted-foreground">
              {day(cur.startDate)} – {day(cur.endDate)}
              {cal.phase === 'holiday' && ' · holiday (term has ended)'}
            </div>
          </div>
        </div>
        {next && (
          <Button onClick={() => setConfirming(true)} className="gap-2 sm:shrink-0">
            <PlayCircle className="size-4" /> Start {next.name} now
          </Button>
        )}
      </div>

      {/* Term strip */}
      <ol className="grid grid-cols-3 gap-2 text-xs">
        {cal.terms.map((t) => {
          const past = new Date(t.startDate) < new Date(cur.startDate)
          return (
            <li
              key={t.id}
              className={cn(
                'rounded-lg border px-3 py-2',
                t.isCurrent ? 'border-primary bg-primary/5 font-medium text-primary' : past ? 'text-muted-foreground' : '',
              )}
            >
              <div className="truncate">{t.name}</div>
              <div className="text-[11px] text-muted-foreground">{format(new Date(t.startDate), 'd MMM')}</div>
            </li>
          )
        })}
      </ol>

      {next ? (
        <p className="text-sm">
          {cal.autoAdvanceTerm ? (
            <>
              <b>{next.name}</b> starts automatically on <b>{day(next.startDate)}</b>
              {daysToNext !== null && daysToNext > 0 ? ` (in ${daysToNext} day${daysToNext === 1 ? '' : 's'})` : ''}.
            </>
          ) : (
            <>
              <b>{next.name}</b> is planned for {day(next.startDate)}. Start it when you're ready.
            </>
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>
            This is the last term of {cal.session.name}. The next session starts with <b>promotion</b>: students move to their next class and final classes graduate.
          </span>
          <Button asChild size="sm" className="shrink-0">
            <Link to="/dashboard/promotion">Review promotion</Link>
          </Button>
        </div>
      )}

      <label className="flex items-start gap-2.5 text-sm">
        <Checkbox
          checked={cal.autoAdvanceTerm}
          disabled={toggleAuto.isPending}
          onCheckedChange={(v) => toggleAuto.mutate(v === true)}
          className="mt-0.5"
        />
        <span>
          Move to the next term automatically on its start date
          <span className="block text-xs text-muted-foreground">The holiday after a term still counts as that term, so teachers can finish scores and report cards.</span>
        </span>
      </label>

      {next && reports && fees && (
        <ul className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
          <Check ok={reports.classes > 0 && reports.publishedClasses >= reports.classes}>
            {cur.name} report sheets published for {reports.publishedClasses} of {reports.classes} class{reports.classes === 1 ? '' : 'es'}
          </Check>
          <Check ok={fees.nextTerm > 0 || fees.currentTerm === 0}>
            {fees.nextTerm > 0
              ? `${next.name} fees are set up`
              : fees.currentTerm > 0
                ? `${next.name} fees will be copied from ${cur.name} when it starts`
                : 'No term fees set up'}
          </Check>
          <Check ok>Subjects, teachers, timetable and form masters stay the same</Check>
        </ul>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start {next?.name} now?</DialogTitle>
            <DialogDescription>
              {next?.name} becomes the current term for everyone: attendance, CBT, assignments and scores will go into {next?.name}.
              {next && new Date(next.startDate) > today ? ` It was planned for ${day(next.startDate)}.` : ''}
            </DialogDescription>
          </DialogHeader>
          {reports && reports.publishedClasses < reports.classes && (
            <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                {cur.name} report sheets are published for only {reports.publishedClasses} of {reports.classes} classes. Teachers can still finish them after.
              </span>
            </div>
          )}
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={copySetup} onCheckedChange={(v) => setCopySetup(v === true)} className="mt-0.5" />
            <span>
              Copy {cur.name}'s setup
              <span className="block text-xs text-muted-foreground">Fees (with new due dates), subject assessment setups and CBT settings. Anything {next?.name} already has is kept.</span>
            </span>
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button onClick={() => next && start.mutate(next.id)} disabled={start.isPending}>
              {start.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Start {next?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />}
      <span>{children}</span>
    </li>
  )
}
