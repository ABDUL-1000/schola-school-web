import { DateRangeField } from '@/components/ui/date-field'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, GraduationCap, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { CardTable } from '@/lib/card-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/dashboard/promotion')({
  component: PromotionPage,
})

type Outcome = 'PROMOTED' | 'REPEATED' | 'GRADUATED' | 'LEFT'
const OUTCOME_LABEL: Record<Outcome, string> = { PROMOTED: 'Promote', REPEATED: 'Repeat', GRADUATED: 'Graduate', LEFT: 'Left school' }
const OUTCOME_STYLE: Record<Outcome, string> = {
  PROMOTED: 'text-emerald-700 dark:text-emerald-300',
  REPEATED: 'text-amber-700 dark:text-amber-300',
  GRADUATED: 'text-primary',
  LEFT: 'text-muted-foreground',
}

interface Setup {
  settings: { rule: 'ALL' | 'PASS_MARK'; passMark: number; basis: 'THIRD_TERM' | 'SESSION' }
  classes: Array<{ id: string; name: string; branch?: string; students: number; nextClassId: string | null; graduates: boolean }>
  progressionSaved: boolean
  currentSession: { id: string; name: string } | null
  currentTerm: { id: string; name: string; isLastTerm: boolean } | null
  suggestedNextSession: { name: string; startDate: string; endDate: string } | null
  lastBatch: Batch | null
}
interface Batch {
  id: string
  createdAt: string
  createdBy: string | null
  counts: { promoted: number; repeated: number; graduated: number; left: number }
  undoneAt: string | null
  undoUntil: string
  canUndo: boolean
}
interface Preview {
  classes: Array<{
    id: string
    name: string
    nextClassName: string | null
    graduates: boolean
    students: Array<{ id: string; fullname: string; regNumber: string | null; average: number | null; noScores: boolean; proposed: Outcome }>
  }>
}

const fieldSelect =
  'h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'
const STEPS = ['Next classes', 'Rule', 'Review', 'New session'] as const

function PromotionPage() {
  const qc = useQueryClient()
  const { data: setup, isLoading } = useQuery({
    queryKey: ['promotion-setup'],
    queryFn: async () => (await api.get('/school/promotion/setup')).data?.data as Setup,
  })
  const [step, setStep] = useState(0)

  // Step 1: next classes
  const [progression, setProgression] = useState<Record<string, string>>({}) // classId → nextClassId | 'GRADUATE'
  // Step 2: rule
  const [rule, setRule] = useState<Setup['settings']>({ rule: 'ALL', passMark: 40, basis: 'THIRD_TERM' })
  // Step 3: per-student overrides
  const [decisions, setDecisions] = useState<Partial<Record<string, Outcome>>>({})
  const [openClass, setOpenClass] = useState<string | null>(null)
  // Step 4: new session
  const [session, setSession] = useState({ name: '', startDate: '', endDate: '' })
  const [copyFees, setCopyFees] = useState(true)
  const [clearFormMasters, setClearFormMasters] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!setup) return
    setProgression(Object.fromEntries(setup.classes.map((c) => [c.id, c.graduates ? 'GRADUATE' : c.nextClassId || ''])))
    setRule(setup.settings)
    if (setup.suggestedNextSession)
      setSession({
        name: setup.suggestedNextSession.name,
        startDate: setup.suggestedNextSession.startDate.slice(0, 10),
        endDate: setup.suggestedNextSession.endDate.slice(0, 10),
      })
  }, [setup])

  const preview = useQuery({
    queryKey: ['promotion-preview'],
    queryFn: async () => (await api.get('/school/promotion/preview')).data?.data as Preview,
    enabled: step >= 2,
  })

  const saveProgression = useMutation({
    mutationFn: async () =>
      api.put('/school/promotion/progression', {
        classes: Object.entries(progression).map(([classId, v]) => ({ classId, nextClassId: v && v !== 'GRADUATE' ? v : null, graduates: v === 'GRADUATE' })),
      }),
  })
  const saveRule = useMutation({ mutationFn: async () => api.patch('/school/promotion/settings', rule) })
  const apply = useMutation({
    mutationFn: async () =>
      (await api.post('/school/promotion/apply', { session, decisions, copyFees, clearFormMasters })).data as { message: string; data: { feesCopied: number } },
    onSuccess: (r) => {
      toast.success(r.message, r.data.feesCopied ? `${r.data.feesCopied} fee structure(s) copied into the new First Term.` : undefined)
      setConfirming(false)
      setStep(0)
      setDecisions({})
      for (const k of [['promotion-setup'], ['promotion-preview'], ['academic-calendar'], ['academic-sessions'], ['classes'], ['students']]) void qc.invalidateQueries({ queryKey: k })
    },
    onError: (e: any) => toast.error(e?.message || 'Promotion failed. Nothing was changed.'),
  })
  const undo = useMutation({
    mutationFn: async (id: string) => (await api.post(`/school/promotion/batches/${id}/undo`)).data as { message: string },
    onSuccess: (r) => {
      toast.success(r.message)
      for (const k of [['promotion-setup'], ['promotion-preview'], ['academic-calendar'], ['academic-sessions'], ['classes'], ['students']]) void qc.invalidateQueries({ queryKey: k })
    },
    onError: (e: any) => toast.error(e?.message || 'Could not undo'),
  })

  const outcomeOf = (s: Preview['classes'][number]['students'][number]) => decisions[s.id] ?? s.proposed
  const totals = useMemo(() => {
    const t = { PROMOTED: 0, REPEATED: 0, GRADUATED: 0, LEFT: 0 } as Record<Outcome, number>
    for (const c of preview.data?.classes || []) for (const s of c.students) t[outcomeOf(s)]++
    return t
  }, [preview.data, decisions])

  const next = async () => {
    try {
      if (step === 0) {
        const missing = setup?.classes.find((c) => c.students > 0 && !progression[c.id])
        if (missing) return toast.error(`Choose where ${missing.name} goes next.`)
        await saveProgression.mutateAsync()
      }
      if (step === 1) await saveRule.mutateAsync()
      if (step <= 1) void qc.invalidateQueries({ queryKey: ['promotion-preview'] })
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e: any) {
      toast.error(e?.message || 'Could not save')
    }
  }

  if (isLoading || !setup) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-primary" />
  if (!setup.currentSession) {
    return <p className="rounded-xl border p-6 text-sm text-muted-foreground">Create an academic session first.</p>
  }

  const classOptions = setup.classes
  const busy = saveProgression.isPending || saveRule.isPending

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotion</h1>
        <p className="text-sm text-muted-foreground">
          End {setup.currentSession.name}: move students to their next class, let some repeat, graduate the final classes and start the new session.
        </p>
      </div>

      {setup.lastBatch && !setup.lastBatch.undoneAt && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>
              Last promotion on {format(new Date(setup.lastBatch.createdAt), 'd MMM yyyy, h:mm a')}: {setup.lastBatch.counts.promoted} promoted,{' '}
              {setup.lastBatch.counts.repeated} repeating, {setup.lastBatch.counts.graduated} graduated.
              {setup.lastBatch.canUndo && ` You can undo it until ${format(new Date(setup.lastBatch.undoUntil), 'd MMM')}.`}
            </span>
          </div>
          {setup.lastBatch.canUndo && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={undo.isPending}
              onClick={() => {
                if (window.confirm('Undo the last promotion? Every student goes back to the class they were in, and the previous session becomes current again.'))
                  undo.mutate(setup.lastBatch!.id)
              }}
            >
              {undo.isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />} Undo promotion
            </Button>
          )}
        </div>
      )}

      {setup.currentTerm && !setup.currentTerm.isLastTerm && (
        <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span>You're in {setup.currentTerm.name}. Promotion is usually done after Third Term results are in.</span>
        </div>
      )}

      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-1 text-xs">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={cn(
                'w-full rounded-md border px-2 py-2 text-left',
                i === step ? 'border-primary bg-primary/5 font-medium text-primary' : i < step ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span className="block text-[10px] uppercase tracking-wide">Step {i + 1}</span>
              <span className="block truncate">{s}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Step 1 */}
      {step === 0 && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Where each class goes next. We've suggested an order{setup.progressionSaved ? ' (your saved choices are shown)' : ''}; check it once and it's remembered for next year.
          </p>
          <CardTable className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Class</th>
                <th className="px-4 py-2 text-left font-medium">Students</th>
                <th className="px-4 py-2 text-left font-medium">Moves to</th>
              </tr>
            </thead>
            <tbody>
              {setup.classes.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-medium">
                    {c.name}
                    {c.branch && <span className="block text-xs font-normal text-muted-foreground">{c.branch}</span>}
                  </td>
                  <td className="px-4 py-2">{c.students}</td>
                  <td className="px-4 py-2">
                    <select
                      aria-label={`${c.name} moves to`}
                      className={cn(fieldSelect, 'sm:w-64')}
                      value={progression[c.id] || ''}
                      onChange={(e) => setProgression((p) => ({ ...p, [c.id]: e.target.value }))}
                    >
                      <option value="">Choose…</option>
                      <option value="GRADUATE">🎓 Graduates</option>
                      {classOptions
                        .filter((o) => o.id !== c.id)
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </CardTable>
        </section>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <section className="space-y-4 rounded-xl border p-5">
          {(['ALL', 'PASS_MARK'] as const).map((r) => (
            <label key={r} className={cn('flex cursor-pointer gap-3 rounded-lg border p-4', rule.rule === r && 'border-primary bg-primary/5')}>
              <input type="radio" name="rule" className="mt-1" checked={rule.rule === r} onChange={() => setRule((x) => ({ ...x, rule: r }))} />
              <span className="space-y-1">
                <span className="block font-medium">{r === 'ALL' ? 'Everyone moves up' : 'Students below a pass mark repeat'}</span>
                <span className="block text-sm text-muted-foreground">
                  {r === 'ALL' ? 'All students go to their next class. You can still mark anyone to repeat in the review.' : 'Students whose average is below the mark are set to repeat. You can still change anyone in the review.'}
                </span>
                {r === 'PASS_MARK' && rule.rule === 'PASS_MARK' && (
                  <span className="flex flex-wrap items-center gap-2 pt-2 text-sm">
                    Pass mark
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="h-9 w-20"
                      value={rule.passMark}
                      onChange={(e) => setRule((x) => ({ ...x, passMark: Number(e.target.value) }))}
                    />
                    % using
                    <select
                      className={cn(fieldSelect, 'w-auto')}
                      value={rule.basis}
                      onChange={(e) => setRule((x) => ({ ...x, basis: e.target.value as Setup['settings']['basis'] }))}
                    >
                      <option value="THIRD_TERM">the Third Term average</option>
                      <option value="SESSION">the average of all three terms</option>
                    </select>
                  </span>
                )}
              </span>
            </label>
          ))}
        </section>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <section className="space-y-3">
          {preview.isLoading || !preview.data ? (
            <Loader2 className="mx-auto size-5 animate-spin text-primary" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(OUTCOME_LABEL) as Array<Outcome>).map((o) => (
                  <div key={o} className="rounded-lg border p-3">
                    <div className={cn('text-2xl font-semibold', OUTCOME_STYLE[o])}>{totals[o]}</div>
                    <div className="text-xs text-muted-foreground">{o === 'PROMOTED' ? 'Promoted' : o === 'REPEATED' ? 'Repeating' : o === 'GRADUATED' ? 'Graduating' : 'Leaving'}</div>
                  </div>
                ))}
              </div>
              {preview.data.classes.map((c) => {
                const counts = c.students.reduce((a, s) => ((a[outcomeOf(s)] = (a[outcomeOf(s)] || 0) + 1), a), {} as Record<Outcome, number>)
                const noScores = c.students.filter((s) => s.noScores).length
                const open = openClass === c.id
                return (
                  <div key={c.id} className="rounded-xl border">
                    <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenClass(open ? null : c.id)}>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 font-medium">
                          {c.name}
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                          <span className={c.graduates ? 'text-primary' : ''}>{c.graduates ? 'Graduates' : c.nextClassName || 'No next class'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(Object.keys(OUTCOME_LABEL) as Array<Outcome>)
                            .filter((o) => counts[o])
                            .map((o) => `${counts[o]} ${OUTCOME_LABEL[o].toLowerCase()}`)
                            .join(' · ')}
                          {noScores ? ` · ${noScores} without scores` : ''}
                        </div>
                      </div>
                      <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
                    </button>
                    {open && (
                      <div className="border-t p-2 sm:p-0">
                        <CardTable className="w-full text-sm">
                          <thead className="bg-muted/40 text-xs text-muted-foreground">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Student</th>
                              <th className="px-4 py-2 text-left font-medium">Average</th>
                              <th className="px-4 py-2 text-left font-medium">Decision</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.students.map((s) => {
                              const o = outcomeOf(s)
                              return (
                                <tr key={s.id} className="border-t">
                                  <td className="px-4 py-2">
                                    <div className="font-medium">{s.fullname}</div>
                                    <div className="text-xs text-muted-foreground">{s.regNumber}</div>
                                  </td>
                                  <td className="px-4 py-2">{s.noScores ? <span className="text-xs text-amber-700">No scores</span> : `${s.average}%`}</td>
                                  <td className="px-4 py-2">
                                    <select
                                      aria-label={`Decision for ${s.fullname}`}
                                      className={cn(fieldSelect, 'sm:w-40', OUTCOME_STYLE[o], decisions[s.id] && 'font-medium')}
                                      value={o}
                                      onChange={(e) => setDecisions((d) => ({ ...d, [s.id]: e.target.value as Outcome }))}
                                    >
                                      {(Object.keys(OUTCOME_LABEL) as Array<Outcome>)
                                        .filter((x) => (c.graduates ? x !== 'PROMOTED' : x !== 'GRADUATED' || o === 'GRADUATED'))
                                        .map((x) => (
                                          <option key={x} value={x}>
                                            {OUTCOME_LABEL[x]}
                                          </option>
                                        ))}
                                    </select>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </CardTable>
                      </div>
                    )}
                  </div>
                )
              })}
              {Object.keys(decisions).length > 0 && (
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDecisions({})}>
                  <RotateCcw className="size-4" /> Reset my changes ({Object.keys(decisions).length})
                </Button>
              )}
            </>
          )}
        </section>
      )}

      {/* Step 4 */}
      {step === 3 && (
        <section className="space-y-4 rounded-xl border p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="sess-name">New session</Label>
              <Input id="sess-name" value={session.name} onChange={(e) => setSession((s) => ({ ...s, name: e.target.value }))} placeholder="2026/2027" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sess-dates">Starts – ends</Label>
              <DateRangeField
                id="sess-dates"
                start={session.startDate}
                end={session.endDate}
                onChange={(startDate, endDate) => setSession((s) => ({ ...s, startDate, endDate }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Three terms are created inside these dates. You can adjust term dates on the Sessions page.</p>
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={copyFees} onCheckedChange={(v) => setCopyFees(v === true)} className="mt-0.5" />
            <span>
              Copy last session's First Term fees into the new First Term
              <span className="block text-xs text-muted-foreground">Students are billed for their new class. Change amounts afterwards if fees went up.</span>
            </span>
          </label>
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={clearFormMasters} onCheckedChange={(v) => setClearFormMasters(v === true)} className="mt-0.5" />
            <span>
              Clear form masters
              <span className="block text-xs text-muted-foreground">Leave unticked to keep each class's form master. Subjects and subject teachers always stay with the class.</span>
            </span>
          </label>
        </section>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={busy || (step === 2 && !preview.data)}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Continue
          </Button>
        ) : (
          <Button className="gap-2" onClick={() => setConfirming(true)} disabled={!session.name || !session.startDate || !session.endDate}>
            <GraduationCap className="size-4" /> Promote & start {session.name || 'new session'}
          </Button>
        )}
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Promote and start {session.name}?</DialogTitle>
            <DialogDescription>
              {totals.PROMOTED} promoted · {totals.REPEATED} repeating · {totals.GRADUATED} graduating{totals.LEFT ? ` · ${totals.LEFT} leaving` : ''}. {session.name} becomes the
              current session. You can undo this for 7 days.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
              {apply.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Promote now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="text-center text-xs text-muted-foreground">
        Graduates are listed under <Link to="/dashboard/alumni" className="underline">Alumni</Link> and keep read-only access to their results.
      </p>
    </div>
  )
}
