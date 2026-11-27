import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { FINAL, fmtDate, pct, useCandidate, useRecruitmentAction } from './recruitment'
import type { CandidateDetail } from './recruitment'
import { Avatar, StagePill } from './candidates-panel'
import { Ring, ScoreForm } from './score-form'
import { confirmDialog } from '@/components/ui/confirm-dialog'

type Section = 'profile' | 'test' | 'interview' | 'result'

/**
 * Everything about one candidate: their application, CBT answers (with theory
 * marking), interview scores and the result.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function CandidateSheet({ id, onClose, onAction }: { id: string; onClose: () => void; onAction: (a: 'invite' | 'reject' | 'hire') => void }) {
  const { data, isLoading } = useCandidate(id)
  const [section, setSection] = useState<Section>('profile')

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        {isLoading || !data ? (
          <div className="flex flex-1 items-center justify-center p-20">
            <SheetTitle className="sr-only">Candidate</SheetTitle>
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        ) : (
          <Body data={data} section={section} setSection={setSection} onAction={onAction} onClose={onClose} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function Body({
  data,
  section,
  setSection,
  onAction,
  onClose,
}: {
  data: CandidateDetail
  section: Section
  setSection: (s: Section) => void
  onAction: (a: 'invite' | 'reject' | 'hire') => void
  onClose: () => void
}) {
  const { candidate: c, vacancy: v } = data
  const moveBack = useRecruitmentAction<object>('post', () => '/candidates/stage', { success: () => 'Moved back to Applied' })
  const shortlist = useRecruitmentAction<object>('post', () => '/candidates/stage', { success: () => 'Shortlisted' })
  const remove = useRecruitmentAction<object>('delete', () => `/candidates/${c.id}`, { success: () => 'Candidate deleted', onDone: onClose })
  const sections: Array<{ value: Section; label: string; show: boolean; badge?: string }> = [
    { value: 'profile', label: 'Application', show: true },
    { value: 'test', label: 'CBT', show: v.useTest, badge: data.attempt && !data.attempt.graded && data.attempt.status === 'SUBMITTED' ? 'mark' : undefined },
    { value: 'interview', label: 'Interview', show: v.useInterview, badge: data.scores.length ? String(data.scores.length) : undefined },
    { value: 'result', label: 'Result & notes', show: true },
  ]

  return (
    <>
      <div className="relative border-b bg-gradient-to-br from-primary/10 via-background to-violet-500/10 p-5 pr-12">
        <div className="flex items-start gap-4">
          <Avatar name={c.fullname} photo={c.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg">{[c.title, c.fullname].filter(Boolean).join(' ')}</SheetTitle>
            <SheetDescription asChild>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3" /> {c.email}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3" /> {c.phone}
                </span>
              </div>
            </SheetDescription>
            <div className="mt-2 flex items-center gap-2">
              <StagePill stage={c.stage} />
              <span className="text-[11px] text-muted-foreground">Applied {fmtDate(c.createdAt)}</span>
            </div>
          </div>
          {c.totalPercent !== null && <Ring percent={c.totalPercent} size={60} />}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {c.stage === 'APPLIED' && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={shortlist.isPending} onClick={() => shortlist.mutate({ ids: [c.id], stage: 'SHORTLISTED' })}>
              <UserCheck className="size-3.5" /> Shortlist
            </Button>
          )}
          {!FINAL.includes(c.stage) && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => onAction('invite')}>
              <CalendarDays className="size-3.5" /> {c.invite ? 'Invite again' : 'Invite'}
            </Button>
          )}
          {c.stage !== 'HIRED' && c.stage !== 'REJECTED' && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => onAction('reject')}>
              <UserX className="size-3.5" /> Turn down
            </Button>
          )}
          {(c.stage === 'REJECTED' || c.stage === 'FAILED') && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={moveBack.isPending} onClick={() => moveBack.mutate({ ids: [c.id], stage: 'APPLIED' })}>
              <RotateCcw className="size-3.5" /> Reconsider
            </Button>
          )}
          {c.stage !== 'HIRED' ? (
            <Button size="sm" className="h-8 gap-1.5" onClick={() => onAction('hire')}>
              <UserPlus className="size-3.5" /> Hire
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-3.5" /> Hired {fmtDate(c.hiredAt)}: approve them in pending staff applications
            </span>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-10 flex gap-1 border-b bg-background/95 px-3 pt-2 backdrop-blur">
        {sections
          .filter((s) => s.show)
          .map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSection(s.value)}
              className={cn(
                'relative -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                section === s.value ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {s.label}
              {s.badge && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{s.badge}</span>}
            </button>
          ))}
      </div>

      <div className="flex-1 p-5">
        {section === 'profile' && <Profile data={data} />}
        {section === 'test' && <TestSection data={data} />}
        {section === 'interview' && <InterviewSection data={data} />}
        {section === 'result' && <ResultSection data={data} />}
      </div>

      <div className="border-t p-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          disabled={remove.isPending}
          onClick={() => {
            void confirmDialog({ title: `Delete ${c.fullname}’s application?`, description: 'Their CV, test answers and scores are deleted too. This can’t be undone.', confirmText: 'Delete', danger: true }).then((ok) => {
              if (ok) remove.mutate({})
            })
          }}
        >
          <Trash2 className="size-3.5" /> Delete application
        </Button>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-line text-sm">{children}</div>
    </div>
  )
}

function Profile({ data }: { data: CandidateDetail }) {
  const { candidate: c, vacancy: v } = data
  return (
    <div className="space-y-5">
      {c.filesDeletedAt ? (
        <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">This candidate's CV and documents were deleted on {fmtDate(c.filesDeletedAt)}, a month after they were turned down.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {c.cvUrl && (
            <a href={c.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:text-primary">
              <FileText className="size-4 text-primary" /> {c.cvName || 'CV'} <ExternalLink className="size-3 opacity-60" />
            </a>
          )}
          {c.documents.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm hover:border-primary hover:text-primary">
              <FileText className="size-4 text-muted-foreground" /> {d.name}
            </a>
          ))}
        </div>
      )}

      {c.invite && (
        <div className="rounded-xl border bg-indigo-500/5 p-3 text-sm">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <CalendarDays className="size-3.5" /> Invited {fmtDate(c.invite.sentAt)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {fmtDate(c.invite.date)} {c.invite.time}
            </span>
            {c.invite.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {c.invite.venue}
              </span>
            )}
            {c.accessCode && (
              <span className="inline-flex items-center gap-1 font-mono">
                <KeyRound className="size-3" /> {c.accessCode}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Qualification">{c.qualification}</Field>
        <Field label="Experience">{c.experienceYears !== null ? `${c.experienceYears} years` : null}</Field>
        <Field label="Previous school / employer">{c.previousSchool}</Field>
        <Field label="Subjects">{c.subjects}</Field>
        <Field label="Gender">{c.gender}</Field>
        <Field label="Address">{c.address}</Field>
      </div>

      {v.questions.some((q) => c.answers[q.id]) && (
        <div className="space-y-3 rounded-xl border p-4">
          {v.questions.map((q) => (
            <Field key={q.id} label={q.label}>
              {c.answers[q.id]}
            </Field>
          ))}
        </div>
      )}
      <Field label="Cover letter">{c.coverLetter}</Field>
    </div>
  )
}

function TestSection({ data }: { data: CandidateDetail }) {
  const { candidate: c, attempt: a } = data
  const theory = a?.questions.filter((q) => q.type === 'theory') ?? []
  const [marks, setMarks] = useState<Record<string, string>>({})
  useEffect(() => {
    setMarks(Object.fromEntries(theory.map((q) => [q.id, q.mark === null ? '' : String(q.mark)])))
  }, [a?.theoryScore, a?.status])
  const save = useRecruitmentAction<object>('post', () => `/candidates/${c.id}/theory`, { success: () => 'Marks saved' })
  const reset = useRecruitmentAction<object>('post', () => `/candidates/${c.id}/reset-test`, { success: () => 'The candidate can take the test again' })

  if (!a) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        {c.accessCode ? (
          <>
            Not started yet. Their access code is <span className="font-mono font-semibold text-foreground">{c.accessCode}</span>.
          </>
        ) : (
          'Invite this candidate to give them an access code for the test.'
        )}
      </div>
    )
  }
  const percent = a.totalScore !== null && a.maxScore ? (a.totalScore / a.maxScore) * 100 : null
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border p-4">
        <Ring percent={a.status === 'SUBMITTED' ? percent : null} size={64} label={a.status === 'SUBMITTED' ? undefined : '…'} />
        <div className="flex-1 text-sm">
          <div className="font-semibold">
            {a.status === 'SUBMITTED' ? `${a.totalScore ?? 0} / ${a.maxScore} marks` : 'Writing the test now'}
          </div>
          <div className="text-xs text-muted-foreground">
            Objective {a.objectiveScore ?? 0} · Theory {a.theoryScore ?? 0}
            {a.submittedAt && ` · submitted ${new Date(a.submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`}
          </div>
          {!a.graded && a.status === 'SUBMITTED' && <div className="mt-1 text-xs font-medium text-amber-600">Some theory answers still need marks.</div>}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={reset.isPending}
          onClick={() => {
            void confirmDialog({ title: 'Let the candidate retake the test?', description: 'Their current answers and score are deleted so they can start again.', confirmText: 'Delete attempt', danger: true }).then((ok) => {
              if (ok) reset.mutate({})
            })
          }}
        >
          <RotateCcw className="size-3.5" /> Let them retake
        </Button>
      </div>
      {a.focusLost > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="size-4 shrink-0" /> Left the test page {a.focusLost} time{a.focusLost > 1 ? 's' : ''} while writing.
        </p>
      )}

      <ol className="space-y-3">
        {a.questions.map((q, i) => (
          <li key={q.id} className="rounded-xl border p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line text-sm">{q.text}</p>
                {q.type === 'objective' ? (
                  <div className="mt-2 grid gap-1.5">
                    {q.options.map((o) => {
                      const chosen = q.given === o.id
                      const right = q.answer === o.id
                      return (
                        <div
                          key={o.id}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs',
                            right && 'border-emerald-500/50 bg-emerald-500/10',
                            chosen && !right && 'border-rose-500/50 bg-rose-500/10',
                          )}
                        >
                          {right ? <Check className="size-3.5 text-emerald-600" /> : chosen ? <XCircle className="size-3.5 text-rose-600" /> : <span className="size-3.5" />}
                          {o.text}
                          {chosen && <span className="ml-auto text-[10px] text-muted-foreground">their answer</span>}
                        </div>
                      )
                    })}
                    {!q.given && <span className="text-xs text-muted-foreground">Not answered</span>}
                  </div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div className="whitespace-pre-line rounded-lg bg-muted/50 p-2.5 text-sm">{q.given || <span className="text-muted-foreground">Not answered</span>}</div>
                    {q.answer && <div className="text-xs text-muted-foreground">Guide: {q.answer}</div>}
                    {a.status === 'SUBMITTED' && (
                      <label className="flex items-center gap-2 text-xs">
                        Mark
                        <input
                          type="number"
                          min={0}
                          max={q.marks}
                          step={0.5}
                          value={marks[q.id] ?? ''}
                          onChange={(e) => setMarks((m) => ({ ...m, [q.id]: e.target.value }))}
                          className="h-8 w-20 rounded-md border bg-background px-2 text-right outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-muted-foreground">/ {q.marks}</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {q.type === 'objective' ? (q.correct ? q.marks : 0) : (q.mark ?? '–')}/{q.marks}
              </span>
            </div>
          </li>
        ))}
      </ol>
      {theory.length > 0 && a.status === 'SUBMITTED' && (
        <Button className="gap-1.5" disabled={save.isPending} onClick={() => save.mutate({ marks })}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save theory marks
        </Button>
      )}
    </div>
  )
}

function InterviewSection({ data }: { data: CandidateDetail }) {
  const { candidate: c, vacancy: v } = data
  const save = useRecruitmentAction<object>('post', () => `/candidates/${c.id}/score`, { success: () => 'Score saved' })
  const removeScore = useRecruitmentAction<{ scoreId: string }>('delete', (b) => `/candidates/${c.id}/score/${b.scoreId}`, { success: () => 'Score removed' })
  const [mine, setMine] = useState(false)
  return (
    <div className="space-y-4">
      {data.scores.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Panel scores</h4>
            <span className="text-xs text-muted-foreground">Average {pct(c.interviewPercent)}</span>
          </div>
          {data.scores.map((s) => (
            <div key={s.id} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{s.scorerName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {s.total}/{s.max}
                  </span>
                  <button
                    type="button"
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    onClick={() => {
                      void confirmDialog({ title: `Remove ${s.scorerName}’s score?`, confirmText: 'Remove', danger: true }).then((ok) => {
                        if (ok) removeScore.mutate({ scoreId: s.id })
                      })
                    }}
                    aria-label="Remove score"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {v.interviewCriteria.map((k) => (
                  <span key={k.id} className="rounded-md bg-muted px-2 py-0.5 text-[11px]">
                    {k.label}: <strong>{s.scores[k.id] ?? '–'}</strong>/{k.max}
                  </span>
                ))}
              </div>
              {s.comment && <p className="mt-2 whitespace-pre-line text-xs text-muted-foreground">“{s.comment}”</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No interview scores yet. Panel members score from “Interviews” in the staff portal, or score here.</p>
      )}

      {mine ? (
        <div className="rounded-xl border p-4">
          <h4 className="mb-3 text-sm font-semibold">Your score</h4>
          <ScoreForm
            criteria={v.interviewCriteria}
            initial={data.scores.find((s) => s.scorerKey === data.meKey) ?? null}
            pending={save.isPending}
            onSubmit={(b) => save.mutate(b, { onSuccess: () => setMine(false) })}
          />
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setMine(true)}>
          Score this interview
        </Button>
      )}
    </div>
  )
}

function ResultSection({ data }: { data: CandidateDetail }) {
  const { candidate: c, vacancy: v } = data
  const [notes, setNotes] = useState(c.notes ?? '')
  useEffect(() => setNotes(c.notes ?? ''), [c.notes])
  const update = useRecruitmentAction<object>('patch', () => `/candidates/${c.id}`, { success: () => 'Saved' })
  const decision = c.decision ?? ''
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {v.useTest && <Stat label={`CBT${v.useInterview ? ` · ${v.testWeight}%` : ''}`} value={pct(c.testPercent)} />}
        {v.useInterview && <Stat label={`Interview${v.useTest ? ` · ${v.interviewWeight}%` : ''}`} value={pct(c.interviewPercent)} />}
        <Stat label={`Total · pass mark ${v.passMark}%`} value={pct(c.totalPercent)} strong tone={c.passes === true ? 'good' : c.passes === false ? 'bad' : undefined} />
      </div>

      <div>
        <div className="mb-2 text-sm font-medium">Result</div>
        <div className="inline-flex rounded-xl border bg-muted/40 p-1 text-sm">
          {[
            ['', `Follow the pass mark${c.totalPercent !== null ? ` (${c.totalPercent >= v.passMark ? 'pass' : 'fail'})` : ''}`],
            ['PASS', 'Pass'],
            ['FAIL', 'Not successful'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              disabled={update.isPending}
              onClick={() => update.mutate({ decision: val || null })}
              className={cn('rounded-lg px-3 py-1.5 transition-colors', decision === val ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {c.resultSentAt ? `Result emailed ${fmtDate(c.resultSentAt)}.` : 'Publish results from the Results tab to email candidates their scores.'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Private notes</div>
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Only your school can see these." maxLength={5000} />
        <Button size="sm" variant="outline" className="gap-1.5" disabled={update.isPending || notes === (c.notes ?? '')} onClick={() => update.mutate({ notes })}>
          <Save className="size-3.5" /> Save notes
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'good' | 'bad' }) {
  return (
    <div className={cn('rounded-xl border p-3', strong && 'bg-muted/40')}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-0.5 text-xl font-bold tabular-nums', tone === 'good' && 'text-emerald-600', tone === 'bad' && 'text-rose-600')}>{value}</div>
    </div>
  )
}
