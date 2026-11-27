import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Eye, ImageUp, Loader2, Mail, MailWarning, RotateCcw, Save, Search, Send, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { LetterViewer } from '@/components/letter/letter-viewer'
import { LetterPrintButton } from '@/components/letter/letter-print'
import { LETTER_INFO, PLACEHOLDERS, fmtLetterDate, sampleLetter } from '@/components/letter/letter'
import type { LetterContent, LetterKind, LetterSchool, LetterTemplate } from '@/components/letter/letter'

export const Route = createFileRoute('/_authenticated/dashboard/letters')({
  component: LettersPage,
})

type Templates = Record<LetterKind, LetterTemplate>
type Settings = {
  school: LetterSchool & { initials: string }
  session: string
  classes: Array<{ id: string; name: string }>
  templates: Templates
  defaults: Templates
}
type Person = { id: string; name: string; detail: string; email: string | null; lastLetter: { id: string; sentAt: string; sentTo: string | null } | null }

// The API client rejects with an error whose message is the server's message.
const errorText = (e: unknown, fallback: string) => {
  const err = e as { response?: { data?: { message?: string } }; message?: string } | null
  return err?.response?.data?.message || err?.message || fallback
}
const COLORS = ['#1e3a8a', '#065f46', '#7f1d1d', '#4c1d95', '#0f766e', '#0f172a', '#b45309', '#be123c']

function LettersPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['letters', 'settings'],
    queryFn: async () => (await api.get('/school/letters/settings')).data.data as Settings,
  })
  const [kind, setKind] = useState<LetterKind>('admission')
  const [draft, setDraft] = useState<Templates | null>(null)
  useEffect(() => {
    if (data) setDraft(data.templates)
  }, [data])
  const dirty = !!draft && !!data && JSON.stringify(draft) !== JSON.stringify(data.templates)

  const save = useMutation({
    mutationFn: async (t: Templates) => (await api.put('/school/letters/settings', t)).data.data,
    onSuccess: () => {
      toast.success('Letters saved')
      void qc.invalidateQueries({ queryKey: ['letters'] })
    },
    onError: (e) => toast.error(errorText(e, 'Could not save the letters')),
  })

  if (isLoading || !data || !draft) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const t = draft[kind]
  const set = <TKey extends keyof LetterTemplate>(k: TKey, v: LetterTemplate[TKey]) => setDraft((d) => (d ? { ...d, [kind]: { ...d[kind], [k]: v } } : d))
  const preview = sampleLetter(kind, t, data.school, data.session)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Mail className="size-6 text-primary" /> Letters
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Write your admission and appointment letters, then send them from the list below when you are ready. Each one is emailed as a PDF and saved on the student’s or staff member’s portal to view and download.
          </p>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDraft(data.templates)}>
              <RotateCcw className="size-4" /> Undo
            </Button>
          )}
          <Button size="sm" className="gap-1.5" disabled={!dirty || save.isPending} onClick={() => save.mutate(draft)}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </Button>
        </div>
      </div>

      <Tabs value={kind} onValueChange={(v) => setKind(v as LetterKind)}>
        <TabsList>
          <TabsTrigger value="admission">Admission letter (students)</TabsTrigger>
          <TabsTrigger value="appointment">Appointment letter (staff)</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <Section title="Sending">
            <p className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
              Nothing is sent when you approve {kind === 'admission' ? 'an enrolment' : 'a staff application'}. Choose people in the list below and press <span className="font-medium text-foreground">Send</span>: the letter goes to{' '}
              {kind === 'admission' ? 'the parent' : 'the staff member'} by email as a PDF attachment, and appears on their portal.
            </p>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Email subject</Label>
              <Input value={t.subject} maxLength={160} onChange={(e) => set('subject', e.target.value)} />
            </div>
          </Section>

          <Section title="Look">
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
                {(['classic', 'modern'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => set('style', s)} className={cn('rounded-md px-3 py-1.5 capitalize', t.style === s ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('accentColor', c)}
                    className={cn('size-7 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110', t.accentColor === c ? 'ring-primary' : 'ring-transparent')}
                    style={{ background: c }}
                    aria-label={`Colour ${c}`}
                  />
                ))}
                <input type="color" value={t.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="size-7 cursor-pointer rounded-md border bg-transparent p-0.5" aria-label="Custom colour" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={t.showLogo} onCheckedChange={(v) => set('showLogo', !!v)} /> School logo
              </label>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Motto (under the school name)</Label>
              <Input value={t.motto} maxLength={160} onChange={(e) => set('motto', e.target.value)} placeholder="Knowledge and Integrity" />
            </div>
          </Section>

          <WordingSection kind={kind} t={t} set={set} onReset={() => setDraft((d) => (d ? { ...d, [kind]: { ...d[kind], ...pickWording(data.defaults[kind]) } } : d))} />

          <Section title="Signature and stamp">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Closing</Label>
                <Input value={t.closing} maxLength={60} onChange={(e) => set('closing', e.target.value)} placeholder="Yours faithfully," />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Signed by (name)</Label>
                <Input value={t.signatoryName} maxLength={80} onChange={(e) => set('signatoryName', e.target.value)} placeholder="Dr. F. Okafor" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Their title</Label>
                <Input value={t.signatoryTitle} maxLength={80} onChange={(e) => set('signatoryTitle', e.target.value)} placeholder="Principal" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-6">
              <ImageField label="Signature" value={t.signatureUrl} onChange={(v) => set('signatureUrl', v)} />
              <ImageField label="School stamp" value={t.stampUrl} onChange={(v) => set('stampUrl', v)} round />
            </div>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Note at the bottom of the page</Label>
              <Input value={t.footerNote} maxLength={300} onChange={(e) => set('footerNote', e.target.value)} placeholder="This letter is valid only with the school's stamp and signature." />
            </div>
          </Section>
        </div>

        <div className="min-w-0 xl:sticky xl:top-20">
          <div className="rounded-3xl border bg-gradient-to-b from-muted/40 to-background p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold">Live preview</span>
              <span className="text-xs text-muted-foreground">Example {kind === 'admission' ? 'student' : 'staff member'}</span>
            </div>
            <LetterViewer content={preview} envelope={false} />
          </div>
        </div>
      </div>

      <Recipients key={kind} kind={kind} classes={data.classes} dirty={dirty} />
    </div>
  )
}

const pickWording = (t: LetterTemplate) => ({ subject: t.subject, title: t.title, salutation: t.salutation, body: t.body, closing: t.closing, footerNote: t.footerNote })

function Section({ title, hint, children, action }: { title: string; hint?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function WordingSection({
  kind,
  t,
  set,
  onReset,
}: {
  kind: LetterKind
  t: LetterTemplate
  set: <TKey extends keyof LetterTemplate>(k: TKey, v: LetterTemplate[TKey]) => void
  onReset: () => void
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const insert = (key: string) => {
    const el = bodyRef.current
    const token = `{${key}}`
    if (!el) return set('body', t.body + token)
    const start = el.selectionStart
    const next = t.body.slice(0, start) + token + t.body.slice(el.selectionEnd)
    set('body', next.slice(0, 5000))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }
  return (
    <Section
      title="Wording"
      action={
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
          Use the standard wording
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Heading</Label>
          <Input value={t.title} maxLength={80} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Greeting</Label>
          <Input value={t.salutation} maxLength={120} onChange={(e) => set('salutation', e.target.value)} />
        </div>
        {kind === 'admission' && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Resumption date (used as {'{resumptionDate}'})</Label>
            <Input value={t.resumptionDate} maxLength={80} onChange={(e) => set('resumptionDate', e.target.value)} placeholder="Monday, 12 January 2027" />
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs">Letter (leave an empty line between paragraphs)</Label>
        <Textarea ref={bodyRef} rows={12} value={t.body} maxLength={5000} onChange={(e) => set('body', e.target.value)} className="font-serif leading-relaxed" />
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground">Insert:</span>
          {PLACEHOLDERS[kind].map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => insert(c.key)}
              title={`{${c.key}}`}
              className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Words in {'{curly brackets}'} are filled in for each {kind === 'admission' ? 'student' : 'staff member'}. Start a sentence with {'{He}'} or {'{His}'} for a capital letter.
        </p>
      </div>
    </Section>
  )
}

function ImageField({ label, value, onChange, round }: { label: string; value: string | null; onChange: (v: string | null) => void; round?: boolean }) {
  const { mutateAsync: upload, isPending } = useUploadFileMutation()
  const inputRef = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (file.size > 2 * 1024 * 1024) return toast.error('Please choose an image under 2 MB')
    try {
      onChange(await upload(file))
    } catch {
      toast.error('Upload failed, please try again')
    }
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn('flex h-16 w-28 items-center justify-center overflow-hidden border bg-white text-[11px] text-gray-400 hover:border-primary/50', round ? 'rounded-full !w-16' : 'rounded-md')}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : value ? <img src={value} alt={label} className="max-h-14 max-w-[6.5rem] object-contain" /> : <ImageUp className="size-4" />}
        </button>
        {value && (
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange(null)} aria-label={`Remove ${label}`}>
            <X className="size-3.5" />
          </Button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0] || undefined)} />
      </div>
      <p className="text-[11px] text-muted-foreground">{round ? 'A clear PNG works best.' : 'On white or a clear background.'}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Recipients({ kind, classes, dirty }: { kind: LetterKind; classes: Array<{ id: string; name: string }>; dirty: boolean }) {
  const qc = useQueryClient()
  const [classId, setClassId] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<Person | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 300)
    return () => clearTimeout(t)
  }, [searchText])
  useEffect(() => setSelected(new Set()), [classId, search])

  const { data, isFetching } = useQuery({
    queryKey: ['letters', 'recipients', kind, classId, search],
    queryFn: async () =>
      (await api.get(`/school/letters/${kind}/recipients`, { params: { classId: classId === 'all' ? undefined : classId, search: search || undefined } })).data.data as {
        people: Array<Person>
      },
    placeholderData: (prev) => prev,
  })
  const people = useMemo(() => data?.people ?? [], [data])

  const send = useMutation({
    mutationFn: async (ids: Array<string>) => (await api.post(`/school/letters/${kind}/send`, { ids })).data.data as { emailed: number; savedOnly: number; failed: number },
    onSuccess: (r) => {
      const parts = [
        r.emailed ? `${r.emailed} emailed` : '',
        r.savedOnly ? `${r.savedOnly} saved to the portal only (no email on file)` : '',
        r.failed ? `${r.failed} could not be emailed` : '',
      ].filter(Boolean)
      if (r.failed) toast.error('Some letters were not emailed', { description: parts.join(', ') })
      else toast.success('Letters sent', { description: parts.join(', ') })
      setSelected(new Set())
      void qc.invalidateQueries({ queryKey: ['letters', 'recipients', kind] })
    },
    onError: (e) => toast.error(errorText(e, 'Could not send the letters')),
  })

  const info = LETTER_INFO[kind]
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">Send {info.name.toLowerCase()}s</h2>
          <p className="text-xs text-muted-foreground">
            Tick the {info.who} to send it to, or open one to check it first. Each letter is emailed to {info.sentTo} as a PDF and saved on their portal, where they can view and download it.
          </p>
        </div>
        <Button className="gap-1.5" disabled={!selected.size || send.isPending || dirty} onClick={() => send.mutate([...selected])} title={dirty ? 'Save your changes first' : undefined}>
          {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send to {selected.size || ''} selected
        </Button>
      </div>
      {dirty && <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">Save your changes first: letters are sent with the saved wording.</p>}

      <div className="flex flex-wrap items-center gap-3">
        {kind === 'admission' && (
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={kind === 'admission' ? 'Search name or reg number' : 'Search name or email'} className="pl-8" />
        </div>
        {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set(people.filter((p) => !p.lastLetter).map((p) => p.id)))}>
            Select those not sent
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      </div>

      {!people.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{isFetching ? 'Loading…' : `No ${info.who} found.`}</div>
      ) : (
        <div className="max-h-[520px] overflow-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted text-left text-xs text-muted-foreground">
              <tr>
                <th className="w-10 p-2.5">
                  <Checkbox checked={people.every((p) => selected.has(p.id))} onCheckedChange={(v) => setSelected(v ? new Set(people.map((p) => p.id)) : new Set())} aria-label="Select all" />
                </th>
                <th className="p-2.5 font-medium">{kind === 'admission' ? 'Student' : 'Staff member'}</th>
                <th className="p-2.5 font-medium">Sends to</th>
                <th className="p-2.5 font-medium">Letter</th>
                <th className="w-12 p-2.5" />
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2.5">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={(v) =>
                        setSelected((s) => {
                          const n = new Set(s)
                          if (v) n.add(p.id)
                          else n.delete(p.id)
                          return n
                        })
                      }
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="p-2.5">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.detail || '—'}</div>
                  </td>
                  <td className="p-2.5 text-xs">
                    {p.email ?? (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                        <MailWarning className="size-3.5" /> No email: portal only
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-xs">
                    {p.lastLetter ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> {p.lastLetter.sentTo ? 'Sent' : 'Saved'} {fmtLetterDate(p.lastLetter.sentAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not sent</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setView(p)} aria-label={`View ${p.name}'s letter`}>
                      <Eye className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && <LetterDialog kind={kind} person={view} onClose={() => setView(null)} onSend={() => send.mutate([view.id])} sending={send.isPending} dirty={dirty} />}
    </section>
  )
}

function LetterDialog({ kind, person, onClose, onSend, sending, dirty }: { kind: LetterKind; person: Person; onClose: () => void; onSend: () => void; sending: boolean; dirty: boolean }) {
  // The letter as it was sent, or a draft with the saved wording if none was sent yet.
  const { data, isLoading } = useQuery({
    queryKey: ['letters', 'view', kind, person.id, person.lastLetter?.id],
    queryFn: async () =>
      person.lastLetter
        ? ((await api.get(`/school/letters/sent/${person.lastLetter.id}`)).data.data as { content: LetterContent })
        : ((await api.get(`/school/letters/${kind}/preview/${person.id}`)).data.data as { content: LetterContent }),
  })
  const title = `${person.name} - ${LETTER_INFO[kind].name}`
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {person.lastLetter
              ? `${person.lastLetter.sentTo ? `Emailed to ${person.lastLetter.sentTo}` : 'Saved to their portal'} on ${fmtLetterDate(person.lastLetter.sentAt)}.`
              : `Not sent yet. This is how it will look${person.email ? `; it will go to ${person.email}` : ''}.`}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="flex justify-center p-16">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <LetterViewer
            content={data.content}
            replayKey={person.id}
            actions={
              <>
                <LetterPrintButton letters={[data.content]} mode="pdf" label="Download PDF" title={title} />
                <LetterPrintButton letters={[data.content]} label="Print" title={title} />
                <Button size="sm" className="gap-1.5" onClick={onSend} disabled={sending || dirty} title={dirty ? 'Save your changes first' : undefined}>
                  {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {person.lastLetter ? 'Send again' : 'Send now'}
                </Button>
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
