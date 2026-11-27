import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Briefcase, Building2, CalendarClock, CheckCircle2, FileText, ImageUp, Loader2, MapPin, Paperclip, ShieldCheck, Upload, X, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { uploadApi } from '@/hooks/api/upload.api'
import { SchoolBadge, fieldClass } from '@/components/apply/apply-layout'

interface JobInfo {
  school: { schoolName: string; slug: string; logo: string | null; address: string | null; city: string | null; state: string | null; email: string | null; phone: string | null }
  vacancy: {
    code: string
    title: string
    roleLabel: string
    employmentType: string | null
    description: string | null
    requirements: string | null
    closingDate: string | null
    branchName: string | null
    questions: Array<{ id: string; label: string; required: boolean }>
  }
  closed: boolean
}

type FileRef = { url: string; name: string }
const errorText = (e: unknown, fallback: string) => (e as { response?: { data?: { message?: string } } } | null)?.response?.data?.message || fallback
const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** Public job page and application form: <school>.<domain>/jobs/<code> */
export function JobApply({ code }: { code: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-job', code],
    queryFn: async () => (await api.get(`/public/recruitment/jobs/${code}`)).data.data as JobInfo,
    retry: false,
  })
  const [done, setDone] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#111827]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-4 py-3">
          <SchoolBadge name={data?.school.schoolName} logo={data?.school.logo} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-bold">{data?.school.schoolName || 'Careers'}</div>
            <div className="truncate text-[11px] text-gray-500">Careers</div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <Loader2 className="mx-auto mt-24 size-7 animate-spin text-[#1a56ff]" />
      ) : isError || !data ? (
        <Status tone="error" title="Job not found" text="This job link is not valid or has been removed. Please check the link the school shared." />
      ) : done ? (
        <Status
          tone="success"
          title="Application sent!"
          text={`Thank you, ${done}. ${data.school.schoolName} has received your application for ${data.vacancy.title}. We've sent you a confirmation email, and the school will contact shortlisted candidates by email.`}
        />
      ) : (
        <main className="mx-auto max-w-5xl px-4 pb-16">
          <Hero info={data} />
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <JobDetails info={data} />
            {data.closed ? (
              <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                <XCircle className="mx-auto size-10 text-gray-400" />
                <h2 className="mt-3 text-lg font-bold">Applications are closed</h2>
                <p className="mt-1 text-sm text-gray-600">This vacancy is no longer taking applications.{data.school.email ? ` Contact ${data.school.email} for help.` : ''}</p>
              </div>
            ) : (
              <ApplyForm info={data} code={code} onDone={setDone} />
            )}
          </div>
        </main>
      )}
      <footer className="border-t border-black/5 py-5 text-center text-[11px] text-gray-500">
        © {new Date().getFullYear()} {data?.school.schoolName || 'Schola'}. Powered by Schola.
      </footer>
    </div>
  )
}

function Hero({ info }: { info: JobInfo }) {
  const v = info.vacancy
  const place = [info.school.city, info.school.state].filter(Boolean).join(', ')
  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a56ff] via-[#3b4fe0] to-[#7c3aed] p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          <Briefcase className="size-3.5" /> We're hiring
        </span>
        <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">{v.title}</h1>
        <p className="mt-1 text-sm text-white/80">at {info.school.schoolName}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Chip icon={Building2}>{v.roleLabel}</Chip>
          {v.employmentType && <Chip icon={Briefcase}>{v.employmentType}</Chip>}
          {(v.branchName || place) && <Chip icon={MapPin}>{[v.branchName, place].filter(Boolean).join(' · ')}</Chip>}
          {v.closingDate && <Chip icon={CalendarClock}>Closes {fmt(v.closingDate)}</Chip>}
        </div>
      </div>
    </div>
  )
}

function Chip({ icon: Icon, children }: { icon: typeof Briefcase; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
      <Icon className="size-3.5" /> {children}
    </span>
  )
}

function JobDetails({ info }: { info: JobInfo }) {
  const v = info.vacancy
  const reqs = (v.requirements ?? '')
    .split('\n')
    .map((l) => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(Boolean)
  return (
    <div className="space-y-4 lg:sticky lg:top-4">
      {v.description && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">About the job</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">{v.description}</p>
        </section>
      )}
      {reqs.length > 0 && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">What we're looking for</h2>
          <ul className="mt-2 space-y-2">
            {reqs.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#1a56ff]" /> {r}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-2xl border border-black/5 bg-white p-5 text-sm shadow-sm">
        <h2 className="text-sm font-bold">How it works</h2>
        <ol className="mt-3 space-y-2.5">
          {['Apply with your CV', 'Shortlisted candidates are invited by email', 'You may sit a short computer-based test and an interview', 'Successful candidates receive their offer'].map((s, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-700">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-xs font-bold text-[#1a56ff]">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function ApplyForm({ info, code, onDone }: { info: JobInfo; code: string; onDone: (name: string) => void }) {
  const [f, setF] = useState({
    title: '',
    fullname: '',
    email: '',
    phone: '',
    gender: '',
    qualification: '',
    experienceYears: '',
    previousSchool: '',
    subjects: '',
    coverLetter: '',
  })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [cv, setCv] = useState<FileRef | null>(null)
  const [photo, setPhoto] = useState<FileRef | null>(null)
  const [docs, setDocs] = useState<Array<FileRef>>([])
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => {
    setF((s) => ({ ...s, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const submit = useMutation({
    mutationFn: async () =>
      api.post(`/public/recruitment/jobs/${code}/apply`, {
        ...f,
        experienceYears: f.experienceYears === '' ? undefined : Number(f.experienceYears),
        answers,
        cvUrl: cv?.url,
        cvName: cv?.name,
        photoUrl: photo?.url,
        documents: docs,
        consent,
      }),
    onSuccess: () => {
      onDone(f.fullname.trim())
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (e) => toast.error(errorText(e, 'Could not send your application')),
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (f.fullname.trim().length < 2) e.fullname = 'Enter your full name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Enter a valid email address'
    if (f.phone.trim().length < 7) e.phone = 'Enter a valid phone number'
    if (!cv) e.cv = 'Upload your CV'
    for (const q of info.vacancy.questions) if (q.required && !(answers[q.id] as string | undefined)?.trim()) e[`q-${q.id}`] = 'Please answer this question'
    if (!consent) e.consent = 'Please tick this box to continue'
    setErrors(e)
    return !Object.values(e).some(Boolean)
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (validate()) submit.mutate()
        else toast.error('Please check the highlighted fields')
      }}
      className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-lg font-bold">Apply for this job</h2>
      <p className="mt-0.5 text-xs text-gray-500">Fields marked * are required. It takes about 5 minutes.</p>

      <Group title="Your details">
        <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
          <Field label="Title">
            <select className={fieldClass} value={f.title} onChange={(e) => set('title', e.target.value)}>
              <option value="">—</option>
              {['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Full name" required error={errors.fullname}>
            <input className={fieldClass} value={f.fullname} onChange={(e) => set('fullname', e.target.value)} autoComplete="name" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" required error={errors.email}>
            <input type="email" className={fieldClass} value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Phone" required error={errors.phone}>
            <input type="tel" className={fieldClass} value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
          </Field>
        </div>
        <Field label="Gender">
          <div className="flex gap-2">
            {['Male', 'Female'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set('gender', f.gender === g ? '' : g)}
                className={cn('h-10 flex-1 rounded-lg border text-sm transition-colors', f.gender === g ? 'border-[#1a56ff] bg-[#eef3ff] font-medium text-[#1a56ff]' : 'border-black/10 hover:bg-gray-50')}
              >
                {g}
              </button>
            ))}
          </div>
        </Field>
      </Group>

      <Group title="Experience">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <Field label="Highest qualification">
            <input className={fieldClass} value={f.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. B.Ed Mathematics" />
          </Field>
          <Field label="Years of experience">
            <input type="number" min={0} max={60} className={fieldClass} value={f.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Current / last school or employer">
            <input className={fieldClass} value={f.previousSchool} onChange={(e) => set('previousSchool', e.target.value)} />
          </Field>
          <Field label="Subjects you can teach">
            <input className={fieldClass} value={f.subjects} onChange={(e) => set('subjects', e.target.value)} placeholder="e.g. Mathematics, Further Maths" />
          </Field>
        </div>
      </Group>

      {info.vacancy.questions.length > 0 && (
        <Group title="A few questions">
          {info.vacancy.questions.map((q) => (
            <Field key={q.id} label={q.label} required={q.required} error={errors[`q-${q.id}`]}>
              <textarea
                rows={2}
                className={cn(fieldClass, 'h-auto py-2.5')}
                value={answers[q.id] ?? ''}
                onChange={(e) => {
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  if (errors[`q-${q.id}`]) setErrors((x) => ({ ...x, [`q-${q.id}`]: '' }))
                }}
              />
            </Field>
          ))}
        </Group>
      )}

      <Group title="Documents">
        <Field label="CV" required error={errors.cv}>
          <UploadBox
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            icon={FileText}
            hint="PDF or Word, up to 10MB"
            value={cv}
            onChange={(x) => {
              setCv(x)
              if (errors.cv) setErrors((e) => ({ ...e, cv: '' }))
            }}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Passport photo">
            <UploadBox accept="image/*" icon={ImageUp} hint="JPG or PNG" value={photo} onChange={setPhoto} image />
          </Field>
          <Field label="Other documents" hint="certificates, up to 3">
            <div className="space-y-2">
              {docs.map((d, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-black/10 bg-gray-50 px-3 py-2 text-xs">
                  <Paperclip className="size-3.5 text-gray-500" />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <button type="button" onClick={() => setDocs(docs.filter((_, j) => j !== i))} aria-label="Remove">
                    <X className="size-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
              {docs.length < 3 && <UploadBox accept="image/*,.pdf,.doc,.docx" icon={Paperclip} hint="Add a document" value={null} onChange={(x) => x && setDocs([...docs, x])} compact />}
            </div>
          </Field>
        </div>
      </Group>

      <Group title="Cover letter">
        <textarea
          rows={5}
          className={cn(fieldClass, 'h-auto py-2.5')}
          value={f.coverLetter}
          onChange={(e) => set('coverLetter', e.target.value)}
          maxLength={5000}
          placeholder="Tell the school why you're a great fit (optional)"
        />
      </Group>

      <label className={cn('mt-5 flex items-start gap-3 rounded-xl border p-3 text-xs text-gray-600', errors.consent ? 'border-red-300 bg-red-50' : 'border-black/5 bg-gray-50')}>
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[#1a56ff]"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked)
            if (errors.consent) setErrors((x) => ({ ...x, consent: '' }))
          }}
        />
        <span>
          <ShieldCheck className="mr-1 inline size-3.5 text-[#1a56ff]" />I agree that {info.school.schoolName} may keep my details and CV to consider my application. If I'm not successful, my CV and documents are deleted a month after the decision.
        </span>
      </label>

      <button
        type="submit"
        disabled={submit.isPending}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a56ff] to-[#6d4aff] text-sm font-semibold text-white shadow-md shadow-[#1a56ff]/25 transition hover:brightness-110 disabled:opacity-60"
      >
        {submit.isPending && <Loader2 className="size-4 animate-spin" />}
        Send application
      </button>
    </form>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 space-y-3 border-t border-black/[0.06] pt-5 first-of-type:border-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1a56ff]">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
        {hint && <span className="ml-1 text-[10px] font-normal text-gray-400">({hint})</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  )
}

function UploadBox({
  accept,
  icon: Icon,
  hint,
  value,
  onChange,
  image,
  compact,
}: {
  accept: string
  icon: typeof FileText
  hint: string
  value: FileRef | null
  onChange: (f: FileRef | null) => void
  image?: boolean
  compact?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const pick = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return toast.error('That file is larger than 10MB')
    setBusy(true)
    try {
      const url = await uploadApi.uploadFile(file)
      onChange({ url, name: file.name.slice(0, 120) })
    } catch (e) {
      toast.error(errorText(e, 'Upload failed. Please try again.'))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  return (
    <>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5">
          {image ? <img src={value.url} alt="" className="size-10 rounded-lg object-cover" /> : <Icon className="size-5 text-emerald-600" />}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-emerald-900">{value.name}</span>
          <button type="button" className="rounded p-1 text-emerald-700 hover:bg-emerald-100" onClick={() => onChange(null)} aria-label="Remove file">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/10 text-xs text-gray-500 transition-colors hover:border-[#1a56ff]/50 hover:bg-[#f7f9ff] hover:text-[#1a56ff]',
            compact ? 'py-2.5' : 'flex-col py-5',
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : compact ? <Upload className="size-4" /> : <Icon className="size-6" />}
          <span className="font-medium">{busy ? 'Uploading…' : compact ? hint : 'Click to upload'}</span>
          {!compact && !busy && <span className="text-[10px] text-gray-400">{hint}</span>}
        </button>
      )}
    </>
  )
}

function Status({ tone, title, text }: { tone: 'success' | 'error'; title: string; text: string }) {
  return (
    <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
      {tone === 'success' ? (
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-9 text-emerald-600" />
        </div>
      ) : (
        <XCircle className="mx-auto size-12 text-gray-400" />
      )}
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  )
}
