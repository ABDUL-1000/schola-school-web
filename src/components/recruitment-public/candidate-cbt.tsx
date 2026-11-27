import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  CloudOff,
  Flag,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Timer,
  Wifi,
  X,
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

/**
 * The recruitment CBT a candidate takes: <school>.<domain>/jobs/test
 * Email + access code (from the invitation), then the session code from the
 * invigilator when the test is supervised. Answers save as you go; the test
 * submits itself when time runs out.
 */

interface Intro {
  candidate: { fullname: string }
  school: { schoolName: string; logo: string | null }
  vacancyTitle: string
  test: { title: string; instructions: string | null; durationMinutes: number; questions: number; objective: number; theory: number; totalMarks: number; supervised: boolean; sessionOpen: boolean }
  state: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED'
}
interface Paper extends Intro {
  attempt?: {
    deadline: string
    serverNow: string
    answers: Record<string, string>
    questions: Array<{ id: string; type: 'objective' | 'theory'; text: string; marks: number; options: Array<{ id: string; text: string }> }>
  }
}
type Creds = { email: string; accessCode: string }

const KEY = 'schola-recruit-cbt'
/** An answer that isn't blank (missing keys are undefined at runtime). */
const filled = (v: string | undefined) => !!v && v.trim().length > 0
const LETTERS = 'ABCDEF'
// The API client rejects with an error whose message is the server's message.
const errorText = (e: unknown, fallback: string) => {
  const err = e as { response?: { data?: { message?: string } }; message?: string } | null
  return err?.response?.data?.message || err?.message || fallback
}
const readStore = <T,>(k: string): T | null => {
  try {
    const v = sessionStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
const writeStore = (k: string, v: unknown) => {
  try {
    if (v === null) sessionStorage.removeItem(k)
    else sessionStorage.setItem(k, JSON.stringify(v))
  } catch {
    /* private mode */
  }
}

export function CandidateCbt() {
  const [creds, setCreds] = useState<Creds | null>(() => readStore<Creds>(KEY))
  const [intro, setIntro] = useState<Intro | null>(null)
  const [paper, setPaper] = useState<Paper | null>(null)
  const [finished, setFinished] = useState<{ timeUp: boolean } | null>(null)

  const signOut = () => {
    writeStore(KEY, null)
    setCreds(null)
    setIntro(null)
    setPaper(null)
    setFinished(null)
  }

  const school = paper?.school ?? intro?.school

  // The page behind the test is dark too (no white strip on short screens or in full screen).
  useEffect(() => {
    const html = document.documentElement
    const before = [html.style.background, document.body.style.background]
    html.style.background = '#0b1020'
    document.body.style.background = '#0b1020'
    return () => {
      html.style.background = before[0]
      document.body.style.background = before[1]
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <Backdrop />
      <div className="relative">
        {!creds || !intro ? (
          <Entry
            initial={creds}
            onEnter={(c, i) => {
              writeStore(KEY, c)
              setCreds(c)
              setIntro(i)
              if (i.state === 'SUBMITTED') setFinished({ timeUp: false })
            }}
            onForget={signOut}
          />
        ) : finished || intro.state === 'SUBMITTED' ? (
          <Done intro={intro} timeUp={!!finished?.timeUp} onExit={signOut} />
        ) : paper?.attempt ? (
          <Exam
            creds={creds}
            paper={paper}
            onFinish={(timeUp) => {
              setFinished({ timeUp })
              setIntro({ ...intro, state: 'SUBMITTED' })
            }}
          />
        ) : (
          <Lobby creds={creds} intro={intro} setIntro={setIntro} onStart={setPaper} onExit={signOut} onSubmitted={() => setFinished({ timeUp: false })} />
        )}
      </div>
      {school && !paper?.attempt && (
        <footer className="relative pb-6 text-center text-[11px] text-white/40">
          {school.schoolName} · Powered by Schola
        </footer>
      )}
    </div>
  )
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-[#1a56ff]/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />
    </div>
  )
}

function Glass({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/40 backdrop-blur-xl', className)}>{children}</div>
}

function SchoolMark({ school }: { school?: { schoolName: string; logo: string | null } }) {
  if (school?.logo) return <img src={school.logo} alt="" className="size-12 rounded-2xl bg-white object-contain p-1" />
  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a56ff] to-fuchsia-500 text-lg font-bold">
      {(school?.schoolName || 'S').charAt(0)}
    </div>
  )
}

const input =
  'h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-[#5b8cff] focus:bg-white/10 focus:ring-4 focus:ring-[#1a56ff]/20'
const primary =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a56ff] to-[#8b5cf6] text-sm font-semibold text-white shadow-lg shadow-[#1a56ff]/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50'

// ---------------------------------------------------------------------------
// 1. Enter with email and access code

function Entry({ initial, onEnter, onForget }: { initial: Creds | null; onEnter: (c: Creds, i: Intro) => void; onForget: () => void }) {
  const [email, setEmail] = useState(initial?.email ?? '')
  const [code, setCode] = useState(initial?.accessCode ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const tried = useRef(false)

  const go = useCallback(
    async (c: Creds) => {
      setBusy(true)
      setError('')
      try {
        const r = (await api.post('/public/recruitment/test/enter', c)).data.data as Intro
        onEnter(c, r)
      } catch (e) {
        setError(errorText(e, 'Could not open the test. Check your details.'))
      } finally {
        setBusy(false)
      }
    },
    [onEnter],
  )
  // Coming back after a refresh: go straight in.
  useEffect(() => {
    if (initial && !tried.current) {
      tried.current = true
      void go(initial)
    }
  }, [initial, go])

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
      <Glass className="w-full max-w-md p-7 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a56ff] to-fuchsia-500 shadow-lg shadow-[#1a56ff]/40">
            <Sparkles className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Recruitment test</h1>
          <p className="mt-1 text-sm text-white/60">Use the email you applied with and the access code from your invitation.</p>
        </div>
        <form
          className="mt-7 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void go({ email: email.trim().toLowerCase(), accessCode: code.trim().toUpperCase().replace(/\s+/g, '') })
          }}
        >
          <label className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={cn(input, 'pl-11')} />
          </label>
          <label className="relative block">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Access code"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className={cn(input, 'pl-11 font-mono tracking-[0.3em] placeholder:font-sans placeholder:tracking-normal')}
              maxLength={12}
            />
          </label>
          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
              <AlertTriangle className="size-4 shrink-0" /> {error}
            </p>
          )}
          <button type="submit" disabled={busy || !email || code.length < 6} className={primary}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Continue
          </button>
          {initial && (
            <button type="button" onClick={onForget} className="w-full text-center text-xs text-white/40 hover:text-white/70">
              Not you? Use different details
            </button>
          )}
        </form>
      </Glass>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. Lobby: details, rules, session code, start

function Lobby({
  creds,
  intro,
  setIntro,
  onStart,
  onExit,
  onSubmitted,
}: {
  creds: Creds
  intro: Intro
  setIntro: (i: Intro) => void
  onStart: (p: Paper) => void
  onExit: () => void
  onSubmitted: () => void
}) {
  const t = intro.test
  const resuming = intro.state === 'IN_PROGRESS'
  const [session, setSession] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const needsCode = t.supervised && !resuming

  // While waiting for the invigilator, check every few seconds whether the session has opened.
  useEffect(() => {
    if (!needsCode || t.sessionOpen) return
    const id = setInterval(() => {
      api
        .post('/public/recruitment/test/enter', creds)
        .then((r) => setIntro(r.data.data as Intro))
        .catch(() => undefined)
    }, 5000)
    return () => clearInterval(id)
  }, [needsCode, t.sessionOpen, creds, setIntro])

  const start = async () => {
    setBusy(true)
    setError('')
    try {
      const r = (await api.post('/public/recruitment/test/start', { ...creds, sessionCode: session.trim() })).data.data as Paper
      if (r.state === 'SUBMITTED') onSubmitted()
      else if (r.attempt) {
        try {
          void document.documentElement.requestFullscreen().catch(() => undefined)
        } catch {
          /* not supported */
        }
        onStart(r)
      }
    } catch (e) {
      setError(errorText(e, 'Could not start the test'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <SchoolMark school={intro.school} />
        <div className="min-w-0">
          <div className="truncate text-sm text-white/60">{intro.school.schoolName}</div>
          <div className="truncate font-semibold">{intro.vacancyTitle}</div>
        </div>
        <button type="button" onClick={onExit} className="ml-auto rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Exit">
          <X className="size-5" />
        </button>
      </div>

      <Glass className="mt-6 p-6 sm:p-8">
        <p className="text-sm text-white/60">Welcome,</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{intro.candidate.fullname}</h1>
        <p className="mt-1 text-white/70">{t.title}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat icon={LayoutGrid} value={t.questions} label="questions" />
          <Stat icon={Timer} value={t.durationMinutes} label="minutes" />
          <Stat icon={CheckCircle2} value={t.totalMarks} label="marks" />
        </div>

        {t.instructions && <p className="mt-6 whitespace-pre-line rounded-2xl bg-white/5 p-4 text-sm text-white/80">{t.instructions}</p>}

        <ul className="mt-6 space-y-2.5 text-sm text-white/70">
          <Rule icon={Clock}>The timer starts when you press Start and keeps running even if you close the page.</Rule>
          <Rule icon={Wifi}>Your answers save automatically. If your connection drops, keep going; they'll save when it's back.</Rule>
          <Rule icon={ShieldCheck}>Stay on this page. Leaving it is recorded and shown to the school.</Rule>
          {t.objective > 0 && t.theory > 0 && <Rule icon={LayoutGrid}>{t.objective} objective and {t.theory} written questions. You can move between them freely.</Rule>}
        </ul>

        <div className="mt-7 space-y-3">
          {needsCode &&
            (t.sessionOpen ? (
              <label className="relative block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <input
                  inputMode="numeric"
                  value={session}
                  onChange={(e) => setSession(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Session code from the invigilator"
                  className={cn(input, 'pl-11 text-center font-mono text-xl tracking-[0.5em] placeholder:font-sans placeholder:text-sm placeholder:tracking-normal')}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-amber-400" />
                </span>
                Waiting for the invigilator to open the session. This page will update by itself.
              </div>
            ))}
          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
              <AlertTriangle className="size-4 shrink-0" /> {error}
            </p>
          )}
          <button type="button" disabled={busy || (needsCode && (!t.sessionOpen || session.length < 6))} onClick={() => void start()} className={primary}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {resuming ? 'Continue my test' : 'Start the test'}
          </button>
        </div>
      </Glass>
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Timer; value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <Icon className="mx-auto size-5 text-[#8fb0ff]" />
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  )
}

function Rule({ icon: Icon, children }: { icon: typeof Clock; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-[#8fb0ff]" />
      <span>{children}</span>
    </li>
  )
}

// ---------------------------------------------------------------------------
// 3. The test

type SaveState = 'saved' | 'saving' | 'offline'

function Exam({ creds, paper, onFinish }: { creds: Creds; paper: Paper; onFinish: (timeUp: boolean) => void }) {
  const a = paper.attempt!
  const questions = a.questions
  const backupKey = `${KEY}-answers-${creds.accessCode}`
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...a.answers, ...(readStore<Record<string, string>>(backupKey) ?? {}) }))
  const [flags, setFlags] = useState<Set<string>>(new Set())
  const [index, setIndex] = useState(() => Math.max(0, questions.findIndex((q) => !a.answers[q.id])))
  const [save, setSave] = useState<SaveState>('saved')
  const [showGrid, setShowGrid] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [warning, setWarning] = useState(false)
  const offset = useMemo(() => new Date(a.serverNow).getTime() - Date.now(), [a.serverNow])
  const deadline = new Date(a.deadline).getTime()
  const [left, setLeft] = useState(() => Math.max(0, Math.round((deadline - (Date.now() + offset)) / 1000)))

  const pending = useRef<Record<string, string | null>>({})
  const focusLost = useRef(0)
  const done = useRef(false)

  // Save what changed (and keep a local copy in case the network drops).
  const flush = useCallback(async () => {
    const batch = pending.current
    if (!Object.keys(batch).length && !focusLost.current) return
    pending.current = {}
    setSave('saving')
    try {
      const r = (await api.post('/public/recruitment/test/answers', { ...creds, answers: batch, focusLost: focusLost.current })).data.data as { state: string; timeUp?: boolean }
      setSave('saved')
      if (r.state === 'SUBMITTED' && !done.current) {
        done.current = true
        onFinish(!!r.timeUp)
      }
    } catch {
      pending.current = { ...batch, ...pending.current }
      setSave('offline')
    }
  }, [creds, onFinish])

  useEffect(() => {
    writeStore(backupKey, answers)
  }, [answers, backupKey])

  useEffect(() => {
    const id = setInterval(() => void flush(), 8000)
    return () => clearInterval(id)
  }, [flush])

  const submit = useCallback(
    async (timeUp: boolean) => {
      if (done.current) return
      setSubmitting(true)
      try {
        await api.post('/public/recruitment/test/submit', { ...creds, answers: { ...answers, ...pending.current }, focusLost: focusLost.current })
        done.current = true
        writeStore(backupKey, null)
        try {
          if (document.fullscreenElement) void document.exitFullscreen()
        } catch {
          /* ignore */
        }
        onFinish(timeUp)
      } catch (e) {
        setSubmitting(false)
        setSave('offline')
        if (!timeUp) alert(errorText(e, 'Could not submit. Check your connection and try again.'))
      }
    },
    [answers, backupKey, creds, onFinish],
  )

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.max(0, Math.round((deadline - (Date.now() + offset)) / 1000))
      setLeft(s)
      if (s <= 0) {
        clearInterval(id)
        void submit(true)
      }
    }, 500)
    return () => clearInterval(id)
  }, [deadline, offset, submit])

  // Leaving the page is counted.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !done.current) {
        focusLost.current += 1
        setWarning(true)
        void flush()
      }
    }
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!done.current) e.preventDefault()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [flush])

  const answer = (qid: string, value: string | null) => {
    setAnswers((s) => {
      const n = { ...s }
      if (value === null || value === '') delete n[qid]
      else n[qid] = value
      return n
    })
    pending.current[qid] = value === '' ? null : value
    setSave('saving')
  }
  // Objective answers save quickly; typing saves after a pause.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueSave = (ms: number) => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => void flush(), ms)
  }

  const q = questions[index]
  const answered = questions.filter((x) => filled(answers[x.id])).length
  const go = (i: number) => {
    setIndex(Math.max(0, Math.min(questions.length - 1, i)))
    setShowGrid(false)
  }

  // Keyboard: A–F to choose, ← → to move.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirm || (e.target as HTMLElement | null)?.tagName === 'TEXTAREA' || (e.target as HTMLElement | null)?.tagName === 'INPUT') return
      if (e.key === 'ArrowRight') go(index + 1)
      else if (e.key === 'ArrowLeft') go(index - 1)
      else if (q.type === 'objective') {
        const i = LETTERS.indexOf(e.key.toUpperCase())
        if (i >= 0 && q.options[i]) {
          answer(q.id, q.options[i].id)
          queueSave(400)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const mins = Math.floor(left / 60)
  const secs = left % 60
  const urgent = left <= 60
  const low = left <= 300

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <SchoolMark school={paper.school} />
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-sm font-semibold">{paper.test.title}</div>
            <div className="truncate text-xs text-white/50">{paper.candidate.fullname}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SaveBadge state={save} />
            <div
              className={cn(
                'flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-lg font-bold tabular-nums transition-colors',
                urgent ? 'animate-pulse border-rose-400/60 bg-rose-500/20 text-rose-200' : low ? 'border-amber-400/50 bg-amber-400/15 text-amber-100' : 'border-white/15 bg-white/5',
              )}
              aria-live="polite"
            >
              <Timer className="size-4" />
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="h-1 bg-white/5">
          <div className="h-full bg-gradient-to-r from-[#1a56ff] via-[#8b5cf6] to-fuchsia-500 transition-all duration-500" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
      </header>

      {warning && (
        <div className="mx-auto mt-3 flex w-full max-w-6xl items-center gap-3 px-4">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="size-4 shrink-0" /> You left the test page. This has been recorded. Please stay on this page until you finish.
            <button type="button" className="ml-auto rounded p-1 hover:bg-white/10" onClick={() => setWarning(false)} aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Question */}
        <main key={q.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white">
              Question {index + 1} <span className="text-white/50">of {questions.length}</span>
            </span>
            <span>
              {q.marks} mark{q.marks === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() =>
                setFlags((f) => {
                  const n = new Set(f)
                  if (n.has(q.id)) n.delete(q.id)
                  else n.add(q.id)
                  return n
                })
              }
              className={cn('ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors', flags.has(q.id) ? 'bg-amber-400/20 text-amber-200' : 'hover:bg-white/10')}
            >
              <Flag className="size-3.5" /> {flags.has(q.id) ? 'Flagged' : 'Flag for review'}
            </button>
          </div>

          <Glass className="mt-4 p-6 sm:p-8">
            <p className="whitespace-pre-line text-lg leading-relaxed sm:text-xl">{q.text}</p>

            {q.type === 'objective' ? (
              <div className="mt-7 grid gap-3">
                {q.options.map((o, i) => {
                  const on = answers[q.id] === o.id
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        answer(q.id, on ? null : o.id)
                        queueSave(400)
                      }}
                      className={cn(
                        'group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
                        on
                          ? 'scale-[1.01] border-[#5b8cff] bg-gradient-to-r from-[#1a56ff]/30 to-[#8b5cf6]/20 shadow-lg shadow-[#1a56ff]/20'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.07]',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors',
                          on ? 'bg-white text-[#1a56ff]' : 'bg-white/10 text-white/70 group-hover:bg-white/15',
                        )}
                      >
                        {on ? <CheckCircle2 className="size-5" /> : LETTERS[i]}
                      </span>
                      <span className="text-base">{o.text}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="mt-6">
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => {
                    answer(q.id, e.target.value)
                    queueSave(1500)
                  }}
                  rows={9}
                  placeholder="Type your answer here…"
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-base leading-relaxed text-white outline-none transition placeholder:text-white/30 focus:border-[#5b8cff] focus:ring-4 focus:ring-[#1a56ff]/20"
                />
                <div className="mt-1.5 text-right text-xs text-white/40">{(answers[q.id] ?? '').trim().split(/\s+/).filter(Boolean).length} words</div>
              </div>
            )}
          </Glass>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-30"
            >
              <ArrowLeft className="size-4" /> Previous
            </button>
            <button type="button" onClick={() => setShowGrid(true)} className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm lg:hidden">
              <LayoutGrid className="size-4" /> {answered}/{questions.length}
            </button>
            {index < questions.length - 1 ? (
              <button type="button" onClick={() => go(index + 1)} className={cn(primary, 'ml-auto w-auto px-6')}>
                Next <ArrowRight className="size-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="ml-auto inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition hover:brightness-110">
                <CheckCircle2 className="size-4" /> Finish
              </button>
            )}
          </div>
          <p className="mt-4 hidden text-center text-xs text-white/30 sm:block">Tip: press A–{LETTERS[Math.max(0, (q.options.length || 1) - 1)]} to choose, ← → to move.</p>
        </main>

        {/* Navigator */}
        <aside className={cn('lg:block', showGrid ? 'fixed inset-0 z-30 flex items-end bg-black/60 backdrop-blur-sm lg:static lg:bg-transparent' : 'hidden')} onClick={() => setShowGrid(false)}>
          <Glass className="w-full rounded-b-none p-5 lg:sticky lg:top-24 lg:rounded-3xl" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Questions</h3>
                <span className="text-xs text-white/50">
                  {answered} of {questions.length} answered
                </span>
              </div>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {questions.map((x, i) => {
                  const isAnswered = filled(answers[x.id])
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => go(i)}
                      className={cn(
                        'relative flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-all',
                        i === index ? 'ring-2 ring-white ring-offset-2 ring-offset-[#151b30]' : '',
                        isAnswered ? 'bg-gradient-to-br from-[#1a56ff] to-[#8b5cf6] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20',
                      )}
                    >
                      {i + 1}
                      {flags.has(x.id) && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-amber-400 ring-2 ring-[#151b30]" />}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-white/50">
                <Legend className="bg-gradient-to-br from-[#1a56ff] to-[#8b5cf6]">Answered</Legend>
                <Legend className="bg-white/10">Not yet</Legend>
                <Legend className="bg-amber-400">Flagged</Legend>
              </div>
              <button type="button" onClick={() => setConfirm(true)} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold shadow-lg shadow-emerald-500/20 transition hover:brightness-110">
                <CheckCircle2 className="size-4" /> Submit test
              </button>
            </div>
          </Glass>
        </aside>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => !submitting && setConfirm(false)}>
          <Glass className="w-full max-w-md bg-[#151b30]/95 p-6 animate-in zoom-in-95">
            <div onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold">Submit your test?</h2>
              <p className="mt-1 text-sm text-white/60">You can't change your answers after submitting.</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Mini value={answered} label="answered" tone="text-emerald-300" />
                <Mini value={questions.length - answered} label="unanswered" tone={questions.length - answered ? 'text-rose-300' : 'text-white/60'} />
                <Mini value={flags.size} label="flagged" tone={flags.size ? 'text-amber-300' : 'text-white/60'} />
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" disabled={submitting} onClick={() => setConfirm(false)} className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10">
                  Keep working
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit(false)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Submit
                </button>
              </div>
            </div>
          </Glass>
        </div>
      )}

      {submitting && !confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-4">
            <Loader2 className="size-5 animate-spin" /> Time's up. Submitting your answers…
          </div>
        </div>
      )}
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:inline-flex',
        state === 'offline' ? 'bg-rose-500/15 text-rose-200' : state === 'saving' ? 'text-white/50' : 'text-emerald-300/80',
      )}
    >
      {state === 'offline' ? <CloudOff className="size-3.5" /> : state === 'saving' ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
      {state === 'offline' ? 'Offline, will retry' : state === 'saving' ? 'Saving' : 'Saved'}
    </span>
  )
}

function Legend({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-3 rounded', className)} /> {children}
    </span>
  )
}

function Mini({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className={cn('text-2xl font-bold tabular-nums', tone)}>{value}</div>
      <div className="text-[11px] text-white/50">{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. Done

function Done({ intro, timeUp, onExit }: { intro: Intro; timeUp: boolean; onExit: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-4 py-10">
      <Glass className="relative w-full max-w-md overflow-hidden p-8 text-center animate-in fade-in zoom-in-90 duration-700">
        <Confetti />
        <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/40">
          <CheckCircle2 className="size-11" />
        </div>
        <h1 className="relative mt-5 text-2xl font-bold">{timeUp ? "Time's up. Test submitted" : 'Test submitted'}</h1>
        <p className="relative mt-2 text-sm text-white/70">
          Well done, {intro.candidate.fullname.split(' ')[0]}. Your answers for <strong>{intro.vacancyTitle}</strong> have been sent to {intro.school.schoolName}. The school will email you your result.
        </p>
        <button type="button" onClick={onExit} className="relative mt-6 text-sm text-white/50 hover:text-white">
          Close
        </button>
      </Glass>
    </div>
  )
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 1.8 + Math.random() * 1.4,
        color: ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'][i % 5],
        size: 5 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`@keyframes cbt-fall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(420px) rotate(540deg);opacity:0}}@media (prefers-reduced-motion: reduce){.cbt-bit{display:none}}`}</style>
      {bits.map((b, i) => (
        <span
          key={i}
          className="cbt-bit absolute top-0 rounded-sm"
          style={{ left: `${b.left}%`, width: b.size, height: b.size * 0.5, background: b.color, animation: `cbt-fall ${b.dur}s ${b.delay}s ease-in forwards` }}
        />
      ))}
    </div>
  )
}
