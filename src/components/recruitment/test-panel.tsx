import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  Library,
  ListChecks,
  Loader2,
  MonitorPlay,
  PenLine,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Shuffle,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { errorText, newId, useMonitor, useRecruitmentAction, useRecruitmentBase, useTest } from './recruitment'
import type { TestQuestion, TestSettings, Vacancy } from './recruitment'
import { CopyLink } from './vacancy-list'

type Draft = Pick<TestSettings, 'title' | 'instructions' | 'durationMinutes' | 'shuffle' | 'supervised' | 'questions'>
const LETTERS = 'ABCDEF'

const blank = (title: string): Draft => ({ title: `${title} test`, instructions: '', durationMinutes: 30, shuffle: true, supervised: true, questions: [] })
const toDraft = (t: TestSettings): Draft => ({ title: t.title, instructions: t.instructions ?? '', durationMinutes: t.durationMinutes, shuffle: t.shuffle, supervised: t.supervised, questions: t.questions })

const newObjective = (): TestQuestion => {
  const options = [0, 1, 2, 3].map(() => ({ id: newId(), text: '' }))
  return { id: newId(), type: 'objective', text: '', options, answer: options[0].id, marks: 1 }
}
const newTheory = (): TestQuestion => ({ id: newId(), type: 'theory', text: '', options: [], answer: '', marks: 5 })

/**
 * The recruitment CBT: questions, settings and the live session.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function TestPanel({ vacancy }: { vacancy: Vacancy }) {
  const [view, setView] = useState<'questions' | 'session'>('questions')
  const { data, isLoading } = useTest(vacancy.id)
  if (isLoading || !data) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border bg-muted/40 p-1 text-sm">
        {(
          [
            ['questions', 'Questions & settings', ListChecks],
            ['session', 'Live session', Radio],
          ] as const
        ).map(([val, label, Icon]) => (
          <button
            key={val}
            type="button"
            onClick={() => setView(val)}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors', view === val ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground')}
          >
            <Icon className="size-4" /> {label}
            {val === 'session' && data.test?.sessionOpen && <span className="size-2 animate-pulse rounded-full bg-emerald-500" />}
          </button>
        ))}
      </div>
      {view === 'questions' ? <Editor vacancy={vacancy} test={data.test} /> : <Session vacancy={vacancy} test={data.test} testLink={data.testLink} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Questions and settings

function Editor({ vacancy, test }: { vacancy: Vacancy; test: TestSettings | null }) {
  const saved = JSON.stringify(test ? toDraft(test) : blank(vacancy.title))
  const [draft, setDraft] = useState<Draft>(() => JSON.parse(saved) as Draft)
  useEffect(() => setDraft(JSON.parse(saved) as Draft), [saved])
  const dirty = JSON.stringify(draft) !== saved
  const [importing, setImporting] = useState(false)
  const save = useRecruitmentAction<Draft>('put', () => `/${vacancy.id}/test`, { success: () => 'Test saved', error: 'Could not save the test' })

  const qs = draft.questions
  const setQ = (i: number, q: TestQuestion) => setDraft((d) => ({ ...d, questions: d.questions.map((x, j) => (j === i ? q : x)) }))
  const move = (i: number, by: number) =>
    setDraft((d) => {
      const list = [...d.questions]
      const j = i + by
      if (j < 0 || j >= list.length) return d
      ;[list[i], list[j]] = [list[j], list[i]]
      return { ...d, questions: list }
    })
  const add = (q: TestQuestion) => {
    setDraft((d) => ({ ...d, questions: [...d.questions, q] }))
    setTimeout(() => document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }
  const totalMarks = qs.reduce((s, q) => s + (Number(q.marks) || 0), 0)
  const problems = qs.filter((q) => !q.text.trim() || (q.type === 'objective' && q.options.filter((o) => o.text.trim()).length < 2)).length

  return (
    <div className="grid items-start gap-5 pb-20 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        {!qs.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
              <MonitorPlay className="size-7" />
            </div>
            <h3 className="font-semibold">No questions yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">Write objective questions (marked automatically) and theory questions (you mark them), or bring questions in from your question bank.</p>
          </div>
        ) : (
          qs.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              n={i + 1}
              onChange={(x) => setQ(i, x)}
              onUp={i > 0 ? () => move(i, -1) : undefined}
              onDown={i < qs.length - 1 ? () => move(i, 1) : undefined}
              onCopy={() => add({ ...q, id: newId(), options: q.options.map((o) => ({ ...o, id: newId() })), answer: q.type === 'objective' ? null : q.answer })}
              onDelete={() => setDraft((d) => ({ ...d, questions: d.questions.filter((x) => x.id !== q.id) }))}
            />
          ))
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => add(newObjective())}>
            <Plus className="size-4" /> Objective question
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => add(newTheory())}>
            <PenLine className="size-4" /> Theory question
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => setImporting(true)}>
            <Library className="size-4" /> From question bank
          </Button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4">
        <div className="rounded-2xl border bg-card p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini label="Questions" value={qs.length} />
            <Mini label="Marks" value={totalMarks} />
            <Mini label="Minutes" value={draft.durationMinutes} />
          </div>
          {problems > 0 && <p className="mt-3 text-xs text-amber-600">{problems} question{problems > 1 ? 's are' : ' is'} incomplete and won't be saved.</p>}
        </div>
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <div className="space-y-1.5">
            <Label>Test title</Label>
            <Input value={draft.title} maxLength={160} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Time allowed (minutes)</Label>
            <Input type="number" min={1} max={300} value={draft.durationMinutes} onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: Math.min(300, Math.max(1, Number(e.target.value) || 1)) }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea rows={3} value={draft.instructions ?? ''} maxLength={4000} onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))} placeholder="e.g. Answer all questions. No calculators." />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={draft.shuffle} onCheckedChange={(c) => setDraft((d) => ({ ...d, shuffle: !!c }))} className="mt-0.5" />
            <span>
              <span className="inline-flex items-center gap-1 font-medium">
                <Shuffle className="size-3.5" /> Shuffle
              </span>
              <span className="block text-xs text-muted-foreground">Each candidate gets the questions and options in a different order.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={draft.supervised} onCheckedChange={(c) => setDraft((d) => ({ ...d, supervised: !!c }))} className="mt-0.5" />
            <span>
              <span className="inline-flex items-center gap-1 font-medium">
                <ShieldCheck className="size-3.5" /> Supervised
              </span>
              <span className="block text-xs text-muted-foreground">Candidates can only start when you open the session and give them its code in the room.</span>
            </span>
          </label>
        </div>
      </aside>

      <div
        className={cn(
          'fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-full border bg-background/95 px-4 py-2 shadow-xl backdrop-blur transition-all',
          dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
        )}
      >
        <span className="text-sm text-muted-foreground">Unsaved changes</span>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDraft(JSON.parse(saved) as Draft)}>
          <RotateCcw className="size-3.5" /> Undo
        </Button>
        <Button size="sm" className="gap-1.5 rounded-full" disabled={save.isPending} onClick={() => save.mutate(draft)}>
          {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save test
        </Button>
      </div>

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImport={(list) => {
            setDraft((d) => ({ ...d, questions: [...d.questions, ...list] }))
            toast.success(`${list.length} questions added. Check them, then save.`)
            setImporting(false)
          }}
        />
      )}
    </div>
  )
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  )
}

function QuestionCard({
  q,
  n,
  onChange,
  onUp,
  onDown,
  onCopy,
  onDelete,
}: {
  q: TestQuestion
  n: number
  onChange: (q: TestQuestion) => void
  onUp?: () => void
  onDown?: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const setOption = (id: string, text: string) => onChange({ ...q, options: q.options.map((o) => (o.id === id ? { ...o, text } : o)) })
  return (
    <div id={`q-${q.id}`} className="group rounded-2xl border bg-card p-4 transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-primary/30">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{n}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', q.type === 'objective' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300')}>
          {q.type === 'objective' ? 'Objective · auto-marked' : 'Theory · you mark'}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <label className="mr-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Input type="number" min={0.5} max={100} step={0.5} value={q.marks} onChange={(e) => onChange({ ...q, marks: Number(e.target.value) || 1 })} className="h-7 w-16 text-xs" aria-label="Marks" />
            marks
          </label>
          <IconBtn label="Move up" onClick={onUp} icon={ArrowUp} />
          <IconBtn label="Move down" onClick={onDown} icon={ArrowDown} />
          <IconBtn label="Duplicate" onClick={onCopy} icon={Copy} />
          <IconBtn label="Delete" onClick={onDelete} icon={Trash2} danger />
        </div>
      </div>
      <Textarea rows={2} value={q.text} onChange={(e) => onChange({ ...q, text: e.target.value })} placeholder="Type the question…" maxLength={4000} className="resize-y text-sm" />

      {q.type === 'objective' ? (
        <div className="mt-3 space-y-2">
          {q.options.map((o, i) => {
            const right = q.answer === o.id
            return (
              <div key={o.id} className={cn('flex items-center gap-2 rounded-xl border p-1.5 pl-2 transition-colors', right && 'border-emerald-500/60 bg-emerald-500/5')}>
                <button type="button" onClick={() => onChange({ ...q, answer: o.id })} className="shrink-0" title="Mark as the right answer" aria-label={`Option ${LETTERS[i]} is the right answer`}>
                  {right ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Circle className="size-5 text-muted-foreground/50 hover:text-emerald-600" />}
                </button>
                <span className="w-4 text-xs font-semibold text-muted-foreground">{LETTERS[i]}</span>
                <input
                  value={o.text}
                  onChange={(e) => setOption(o.id, e.target.value)}
                  placeholder={`Option ${LETTERS[i]}`}
                  maxLength={500}
                  className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                {q.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...q, options: q.options.filter((x) => x.id !== o.id), answer: right ? q.options.find((x) => x.id !== o.id)!.id : q.answer })}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Remove option"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )
          })}
          {q.options.length < 6 && (
            <button type="button" onClick={() => onChange({ ...q, options: [...q.options, { id: newId(), text: '' }] })} className="text-xs font-medium text-primary hover:underline">
              + Add option
            </button>
          )}
          {!q.answer && <p className="text-xs text-amber-600">Tick the right answer.</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Marking guide (only you see this)</Label>
          <Textarea rows={2} value={q.answer ?? ''} onChange={(e) => onChange({ ...q, answer: e.target.value })} placeholder="What a good answer includes…" maxLength={4000} className="text-sm" />
        </div>
      )}
    </div>
  )
}

function IconBtn({ label, onClick, icon: Icon, danger }: { label: string; onClick?: () => void; icon: typeof Copy; danger?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={!onClick}
      onClick={onClick}
      className={cn('rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30', danger ? 'hover:text-destructive' : 'hover:text-foreground')}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

interface BankItem {
  kind: 'cbt' | 'paper'
  id: string
  title: string
  type: string
  class?: { name?: string } | null
  subject?: { name?: string } | null
  questionCount: number
  date: string
}

function ImportDialog({ onClose, onImport }: { onClose: () => void; onImport: (q: Array<TestQuestion>) => void }) {
  const { base, bankBase } = useRecruitmentBase()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  const { data, isLoading } = useQuery({
    queryKey: ['recruitment-bank', bankBase, term],
    queryFn: async () => (await api.get(bankBase, { params: { search: term || undefined, limit: 30 } })).data.data as { items: Array<BankItem> },
  })
  const items = useMemo(() => (data?.items ?? []).filter((i) => i.questionCount > 0), [data])
  const pick = async (it: BankItem) => {
    setLoadingId(it.id)
    try {
      const r = (await api.get(`${base}/import/${it.kind}/${it.id}`)).data.data as { questions: Array<TestQuestion> }
      if (!r.questions.length) toast.error('No questions could be brought in from this one')
      else onImport(r.questions)
    } catch (e) {
      toast.error(errorText(e, 'Could not load the questions'))
    } finally {
      setLoadingId(null)
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>From the question bank</DialogTitle>
          <DialogDescription>Pick a CBT exam or written paper. Its questions are added to this test, with the right answers where they were set.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or subject…" className="pl-8" autoFocus />
        </div>
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : !items.length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Nothing found.</p>
          ) : (
            items.map((it) => (
              <button
                key={`${it.kind}-${it.id}`}
                type="button"
                disabled={!!loadingId}
                onClick={() => void pick(it)}
                className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-60"
              >
                <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', it.kind === 'cbt' ? 'bg-violet-500/10 text-violet-600' : 'bg-sky-500/10 text-sky-600')}>
                  {it.kind === 'cbt' ? <MonitorPlay className="size-4" /> : <ListChecks className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{[it.subject?.name, it.class?.name, `${it.questionCount} questions`].filter(Boolean).join(' · ')}</div>
                </div>
                {loadingId === it.id && <Loader2 className="size-4 animate-spin" />}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Live session (invigilator)

function fmtLeft(s: number | null) {
  if (s === null) return '—'
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function Session({ vacancy, test, testLink }: { vacancy: Vacancy; test: TestSettings | null; testLink: string }) {
  const open = !!test?.sessionOpen
  const { data, isLoading } = useMonitor(vacancy.id, true)
  const toggle = useRecruitmentAction<{ open: boolean }>('post', () => `/${vacancy.id}/test/session`, {
    success: () => null,
    error: 'Could not change the session',
  })
  if (!test || !test.questions.length) {
    return <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Add questions to the test and save it first.</div>
  }
  const people = data?.candidates ?? []
  const writing = people.filter((p) => p.status === 'IN_PROGRESS').length
  const done = people.filter((p) => p.status === 'SUBMITTED').length

  return (
    <div className="space-y-4">
      <div className={cn('relative overflow-hidden rounded-2xl border p-5 sm:p-6', open ? 'bg-gradient-to-br from-emerald-500/15 via-background to-primary/10' : 'bg-card')}>
        <div className="flex flex-wrap items-center gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {open ? <span className="size-2.5 animate-pulse rounded-full bg-emerald-500" /> : <span className="size-2.5 rounded-full bg-muted-foreground/40" />}
              {open ? 'Session is open' : 'Session is closed'}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {test.supervised
                ? open
                  ? 'Candidates open the test page, enter their email and access code, then this session code.'
                  : 'Open the session when candidates are seated. They need its code to start.'
                : 'This test is not supervised: invited candidates can start any time with their access code.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="max-w-full truncate rounded-lg bg-muted px-2.5 py-1 font-mono text-xs">{testLink}</span>
              <CopyLink link={testLink} label="Copy" className="h-7" />
              <Button variant="outline" size="sm" className="h-7 gap-1.5" asChild>
                <a href={testLink} target="_blank" rel="noreferrer">
                  <Eye className="size-3.5" /> Open
                </a>
              </Button>
            </div>
          </div>
          {test.supervised && open && test.sessionCode && (
            <div className="rounded-2xl border-2 border-dashed border-emerald-500/50 bg-background px-6 py-3 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Session code</div>
              <div className="font-mono text-4xl font-bold tracking-[0.3em] text-emerald-600 sm:text-5xl">{test.sessionCode}</div>
            </div>
          )}
          {test.supervised && (
            <Button size="lg" variant={open ? 'outline' : 'default'} className="gap-2" disabled={toggle.isPending} onClick={() => toggle.mutate({ open: !open })}>
              {toggle.isPending ? <Loader2 className="size-4 animate-spin" /> : open ? <Square className="size-4" /> : <Radio className="size-4" />}
              {open ? 'Close session' : 'Open session'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Mini label="Invited with a code" value={people.length} />
        <Mini label="Writing now" value={writing} />
        <Mini label="Submitted" value={done} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h3 className="text-sm font-semibold">Candidates</h3>
          <span className="text-[11px] text-muted-foreground">Updates every few seconds</span>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : !people.length ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Invite candidates from the Candidates tab to give them access codes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Candidate</th>
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Progress</th>
                  <th className="p-3 text-right font-medium">Time left</th>
                  <th className="p-3 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-medium">
                      {p.fullname}
                      {p.focusLost > 0 && <div className="text-[10px] font-normal text-amber-600">left the page {p.focusLost}×</div>}
                    </td>
                    <td className="p-3 font-mono text-xs">{p.accessCode}</td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          p.status === 'IN_PROGRESS' ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : p.status === 'SUBMITTED' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {p.status === 'IN_PROGRESS' && <span className="size-1.5 animate-pulse rounded-full bg-violet-500" />}
                        {p.status === 'IN_PROGRESS' ? 'Writing' : p.status === 'SUBMITTED' ? 'Submitted' : 'Not started'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${data?.questions ? (p.answered / data.questions) * 100 : 0}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {p.answered}/{data?.questions}
                        </span>
                      </div>
                    </td>
                    <td className={cn('p-3 text-right font-mono text-xs tabular-nums', p.secondsLeft !== null && p.secondsLeft < 120 && 'text-rose-600')}>{fmtLeft(p.secondsLeft)}</td>
                    <td className="p-3 text-right text-xs tabular-nums">
                      {p.score ? (
                        <>
                          {p.score.total ?? 0}/{p.score.max}
                          {!p.score.graded && <div className="text-[10px] text-amber-600">+ theory</div>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
