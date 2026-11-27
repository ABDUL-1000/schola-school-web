import { useMemo, useState } from 'react'
import { Award, Loader2, Mail, Medal, Trophy, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { pct, useCandidates, useRecruitmentAction } from './recruitment'
import type { CandidateRow, Vacancy } from './recruitment'
import { Avatar, HireDialog, StagePill } from './candidates-panel'
import { CandidateSheet } from './candidate-sheet'

/**
 * Ranked results: combined scores, pass / not successful, publish by email, hire.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function ResultsPanel({ vacancy: v }: { vacancy: Vacancy }) {
  const { data, isLoading } = useCandidates(v.id)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState(false)
  const [hiring, setHiring] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const ranked = useMemo(
    () => (data?.candidates ?? []).filter((c) => c.totalPercent !== null || c.stage === 'PASSED' || c.stage === 'FAILED' || c.stage === 'HIRED').sort((a, b) => (b.totalPercent ?? -1) - (a.totalPercent ?? -1)),
    [data],
  )
  const waiting = (data?.candidates ?? []).filter((c) => c.totalPercent === null && !['REJECTED', 'HIRED', 'PASSED', 'FAILED'].includes(c.stage)).length
  const publishable = ranked.filter((c) => c.stage !== 'HIRED' && c.stage !== 'REJECTED' && c.passes !== null)
  const passing = ranked.filter((c) => c.passes === true).length
  const chosen = ranked.filter((c) => selected.has(c.id))

  const publish = useRecruitmentAction<object, { passed: number; failed: number; skipped: number; emailed: number }>('post', () => `/${v.id}/publish`, {
    success: (r) => `Results published: ${r.passed} passed, ${r.failed} not successful. ${r.emailed} emailed.`,
    error: 'Could not publish the results',
    onDone: () => {
      setSelected(new Set())
      setConfirm(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card icon={Trophy} label="Scored" value={ranked.length} />
        <Card icon={Award} label={`Passing (${v.passMark}%+)`} value={passing} tone="good" />
        <Card icon={Medal} label="Not yet scored" value={waiting} />
        <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">How the total works</div>
          {v.useTest && v.useInterview ? `CBT ${v.testWeight}% + interview ${v.interviewWeight}%.` : v.useTest ? 'CBT score only.' : v.useInterview ? 'Interview score only.' : 'No scored steps.'} Change it in Setup.
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelected(new Set(publishable.filter((c) => !c.resultSentAt).map((c) => c.id)))} disabled={!publishable.length}>
            Select everyone not yet told
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelected(new Set(ranked.filter((c) => c.passes === true && c.stage !== 'HIRED').map((c) => c.id)))} disabled={!passing}>
            Select everyone passing
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!chosen.length} onClick={() => setHiring(true)}>
            <UserPlus className="size-4" /> Hire {chosen.length || ''}
          </Button>
          <Button size="sm" className="gap-1.5" disabled={!chosen.length} onClick={() => setConfirm(true)}>
            <Mail className="size-4" /> Publish & email {chosen.length || ''}
          </Button>
        </div>
      </div>

      {!ranked.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No scores yet. Scores appear here as candidates finish the CBT and the panel scores their interviews.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 p-3">
                    <Checkbox
                      checked={ranked.length > 0 && ranked.every((c) => selected.has(c.id))}
                      onCheckedChange={(c) => setSelected(c ? new Set(ranked.map((r) => r.id)) : new Set())}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="w-12 p-3 font-medium">#</th>
                  <th className="p-3 font-medium">Candidate</th>
                  {v.useTest && <th className="p-3 text-right font-medium">CBT</th>}
                  {v.useInterview && <th className="p-3 text-right font-medium">Interview</th>}
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((c, i) => (
                  <ResultRow key={c.id} c={c} rank={i + 1} v={v} selected={selected.has(c.id)} onSelect={(on) => setSelected((s) => { const n = new Set(s); if (on) n.add(c.id); else n.delete(c.id); return n })} onOpen={() => setOpen(c.id)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirm && (
        <Dialog open onOpenChange={(o) => !o && setConfirm(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Publish results</DialogTitle>
              <DialogDescription>
                {chosen.length} candidate{chosen.length > 1 ? 's' : ''} will be emailed {v.useTest && v.useInterview ? 'their CBT, interview and total scores' : 'their score'}, the pass mark and whether they passed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <div className="text-2xl font-bold text-emerald-600">{chosen.filter((c) => c.passes === true).length}</div>
                <div className="text-xs text-muted-foreground">passed</div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-3">
                <div className="text-2xl font-bold text-rose-600">{chosen.filter((c) => c.passes === false).length}</div>
                <div className="text-xs text-muted-foreground">not successful</div>
              </div>
            </div>
            {chosen.some((c) => c.resultSentAt) && <p className="text-xs text-amber-600">Some have already been told. They'll get the email again.</p>}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button className="gap-1.5" disabled={publish.isPending} onClick={() => publish.mutate({ ids: chosen.map((c) => c.id) })}>
                {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Publish & email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {hiring && <HireDialog people={chosen} onClose={() => setHiring(false)} onDone={() => setSelected(new Set())} />}
      {open && (
        <CandidateSheet
          id={open}
          onClose={() => setOpen(null)}
          onAction={(a) => {
            if (a !== 'hire') return
            setSelected(new Set([open]))
            setHiring(true)
          }}
        />
      )}
    </div>
  )
}

function Card({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: number; tone?: 'good' }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn('size-4', tone === 'good' ? 'text-emerald-600' : 'text-primary')} /> {label}
      </div>
      <div className={cn('mt-1 text-2xl font-bold tabular-nums', tone === 'good' && 'text-emerald-600')}>{value}</div>
    </div>
  )
}

const MEDAL = ['bg-amber-400 text-amber-950', 'bg-zinc-300 text-zinc-800', 'bg-orange-300 text-orange-950']

function ResultRow({ c, rank, v, selected, onSelect, onOpen }: { c: CandidateRow; rank: number; v: Vacancy; selected: boolean; onSelect: (on: boolean) => void; onOpen: () => void }) {
  return (
    <tr className={cn('cursor-pointer border-t hover:bg-muted/40', selected && 'bg-primary/5')} onClick={onOpen}>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={(x) => onSelect(!!x)} aria-label={`Select ${c.fullname}`} />
      </td>
      <td className="p-3">
        <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold', rank <= 3 && c.totalPercent !== null ? MEDAL[rank - 1] : 'bg-muted text-muted-foreground')}>{rank}</span>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Avatar name={c.fullname} photo={c.photoUrl} />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.fullname}</div>
            <StagePill stage={c.stage} />
          </div>
        </div>
      </td>
      {v.useTest && <td className="p-3 text-right tabular-nums">{pct(c.testPercent)}</td>}
      {v.useInterview && <td className="p-3 text-right tabular-nums">{pct(c.interviewPercent)}</td>}
      <td className="p-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
            <div className={cn('h-full rounded-full', c.passes ? 'bg-emerald-500' : 'bg-rose-400')} style={{ width: `${Math.min(100, c.totalPercent ?? 0)}%` }} />
          </div>
          <span className="w-14 font-semibold tabular-nums">{pct(c.totalPercent)}</span>
        </div>
      </td>
      <td className="p-3">
        {c.passes === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', c.passes ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300')}>
            {c.passes ? 'Pass' : 'Not successful'}
            {c.decision && ' (set)'}
          </span>
        )}
        {c.resultSentAt && <div className="mt-0.5 text-[10px] text-muted-foreground">emailed</div>}
      </td>
    </tr>
  )
}
