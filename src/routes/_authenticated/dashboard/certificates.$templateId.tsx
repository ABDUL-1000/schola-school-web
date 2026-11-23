import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, ImageUp, Loader2, Plus, RotateCcw, Save, Send, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { COLOR_PRESETS } from '@/components/id-card/template'
import { CertificateViewer } from '@/components/certificate/certificate-viewer'
import { CertificateBack, CertificateFront } from '@/components/certificate/certificate-face'
import { MiniCert } from '@/components/certificate/mini-cert'
import { useCertificateFonts } from '@/components/certificate/fonts'
import { KIND_INFO, PLACEHOLDERS, SAMPLE_CERT, STYLE_INFO, normalizeDesign, suggestClasses } from '@/components/certificate/template'
import type { CertificateDesign, CertificateKind, CertificateStyle, Signatory } from '@/components/certificate/template'
import { certKeys, errorText } from '@/components/certificate/school-data'
import type { SchoolClass, TemplateResponse } from '@/components/certificate/school-data'

export const Route = createFileRoute('/_authenticated/dashboard/certificates/$templateId')({
  component: TemplateEditor,
})

type Draft = { name: string; kind: CertificateKind; design: CertificateDesign }

const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b)

/** "Positions held" → "positionsHeld", unique among the other fields. */
function keyFor(label: string, taken: Array<string>) {
  const words = label
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  let base = words.map((w, i) => (i ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join('')
  if (!/^[a-z]/.test(base)) base = `field${base}`
  base = base.slice(0, 26) || 'field'
  let key = base
  for (let n = 2; taken.includes(key); n++) key = `${base}${n}`
  return key
}

function TemplateEditor() {
  useCertificateFonts()
  const { templateId } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: certKeys.template(templateId),
    queryFn: async () => (await api.get(`/school/certificates/templates/${templateId}`)).data.data as TemplateResponse,
  })

  const saved: Draft | null = useMemo(
    () => (data ? { name: data.template.name, kind: data.template.kind, design: normalizeDesign(data.template.design) } : null),
    [data],
  )
  const [draft, setDraft] = useState<Draft | null>(null)
  useEffect(() => {
    if (saved) setDraft(saved)
  }, [saved])
  const dirty = !!draft && !!saved && !same(draft, saved)

  const save = useMutation({
    mutationFn: async (d: Draft) => (await api.put(`/school/certificates/templates/${templateId}`, d)).data.data,
    onSuccess: () => {
      toast.success('Certificate saved')
      void qc.invalidateQueries({ queryKey: ['certificates'] })
    },
    onError: (e) => toast.error(errorText(e, 'Could not save the certificate')),
  })
  const remove = useMutation({
    mutationFn: async () => (await api.delete(`/school/certificates/templates/${templateId}`)).data.data as { archived: boolean; issued: number },
    onSuccess: (r) => {
      toast.success(r.archived ? `Deleted. The ${r.issued} certificate${r.issued === 1 ? '' : 's'} already given stay on students’ portals.` : 'Certificate deleted')
      void qc.invalidateQueries({ queryKey: ['certificates'] })
      void navigate({ to: '/dashboard/certificates', search: { tab: 'templates' } })
    },
    onError: (e) => toast.error(errorText(e, 'Could not delete the certificate')),
  })

  if (isLoading || (!draft && !isError)) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !data || !draft) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        This certificate could not be found.{' '}
        <Link to="/dashboard/certificates" className="font-medium text-primary hover:underline">
          Back to certificates
        </Link>
      </div>
    )
  }

  const d = draft.design
  const set = <TKey extends keyof CertificateDesign>(k: TKey, v: CertificateDesign[TKey]) => setDraft((x) => (x ? { ...x, design: { ...x.design, [k]: v } } : x))
  const issued = data.template.issuedCount ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/dashboard/certificates" search={{ tab: 'templates' }}>
            <ArrowLeft className="size-4" /> Certificates
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-tight">{draft.name || 'Certificate'}</h1>
          <p className="text-xs text-muted-foreground">
            {KIND_INFO[draft.kind].name} · {issued ? `${issued} given` : 'None given yet'}
            {dirty && <span className="ml-2 font-medium text-amber-600">● Unsaved changes</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDraft(saved)}>
              <RotateCcw className="size-4" /> Undo
            </Button>
          )}
          <Button size="sm" className="gap-1.5" disabled={!dirty || save.isPending || !draft.name.trim()} onClick={() => save.mutate({ ...draft, name: draft.name.trim() })}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={dirty}
            title={dirty ? 'Save your changes first' : undefined}
            onClick={() => void navigate({ to: '/dashboard/certificates/issue', search: { templateId } })}
          >
            <Send className="size-4" /> Give certificates
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 space-y-4">
          <Section title="Name and type">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name (for you and on the back)</Label>
                <Input value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as CertificateKind })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(KIND_INFO) as Array<CertificateKind>).map((k) => (
                      <SelectItem key={k} value={k}>
                        {KIND_INFO[k].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Look">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(STYLE_INFO) as Array<CertificateStyle>).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('style', s)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all hover:border-primary/50',
                    d.style === s ? 'border-primary ring-2 ring-primary/20' : 'border-transparent bg-muted/40',
                  )}
                >
                  <div className="flex h-[84px] items-center">
                    <MiniCert design={{ ...d, style: s }} cert={SAMPLE_CERT} ctx={data} width={d.orientation === 'landscape' ? 112 : 60} tilt={false} />
                  </div>
                  <div className="text-xs font-semibold">{STYLE_INFO[s].name}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
                {(['landscape', 'portrait'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => set('orientation', o)}
                    className={cn('rounded-md px-3 py-1.5 capitalize', d.orientation === o ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <ColorInput label="Main colour" value={d.primaryColor} onChange={(v) => set('primaryColor', v)} />
              <ColorInput label="Gold / accent" value={d.accentColor} onChange={(v) => set('accentColor', v)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...COLOR_PRESETS, { name: 'Gold', primary: '#1f2937', accent: '#d4af37' }].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  onClick={() => setDraft({ ...draft, design: { ...d, primaryColor: c.primary, accentColor: c.accent } })}
                  className={cn('flex size-8 overflow-hidden rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110', d.primaryColor === c.primary ? 'ring-primary' : 'ring-transparent')}
                >
                  <span className="h-full w-1/2" style={{ background: c.primary }} />
                  <span className="h-full w-1/2" style={{ background: c.accent }} />
                </button>
              ))}
            </div>
          </Section>

          <WordingSection draft={draft} set={set} />

          <FieldsSection design={d} set={set} />

          <Section title="Signatures" hint="Up to three. Leave the name empty to sign by hand after printing.">
            <div className="space-y-3">
              {d.signatories.map((s, i) => (
                <SignatoryRow
                  key={i}
                  value={s}
                  onChange={(v) => set('signatories', d.signatories.map((x, j) => (j === i ? v : x)))}
                  onRemove={() => set('signatories', d.signatories.filter((_, j) => j !== i))}
                />
              ))}
              {d.signatories.length < 3 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => set('signatories', [...d.signatories, { name: '', title: '', signatureUrl: null }])}>
                  <Plus className="size-4" /> Add a signature
                </Button>
              )}
            </div>
          </Section>

          <Section title="Show on the certificate">
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['showLogo', 'School logo'],
                  ['showPhoto', 'Student’s photo (testimonials)'],
                  ['showSeal', 'Gold seal'],
                  ['showSerial', 'Certificate number'],
                  ['showWatermark', 'Faint logo behind the text'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={d[k]} onCheckedChange={(v) => set(k, !!v)} /> {label}
                </label>
              ))}
            </div>
            {d.showSeal && (
              <div className="mt-3 max-w-xs space-y-1.5">
                <Label className="text-xs">Word on the seal</Label>
                <Input value={d.sealText} maxLength={30} onChange={(e) => set('sealText', e.target.value)} placeholder="Excellence" />
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs">Back of the certificate</Label>
              <Textarea rows={2} value={d.backNote} maxLength={400} onChange={(e) => set('backNote', e.target.value)} />
            </div>
          </Section>

          <AudienceSection design={d} kind={draft.kind} classes={data.classes} set={set} />

          <Section title="Delete">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {issued ? `The ${issued} certificate${issued === 1 ? '' : 's'} already given stay on students’ portals.` : 'No certificates have been given from this yet.'}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                    <Trash2 className="size-4" /> Delete certificate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete “{data.template.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You won’t be able to give it any more.{issued ? ' Certificates already given are kept.' : ''}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => remove.mutate()}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>
        </div>

        <div className="min-w-0 xl:sticky xl:top-20">
          <div className="rounded-3xl border bg-gradient-to-b from-muted/40 to-background p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold">Live preview</span>
              <span className="text-xs text-muted-foreground">Example student</span>
            </div>
            <CertificateViewer
              front={<CertificateFront design={d} cert={SAMPLE_CERT} ctx={data} />}
              back={<CertificateBack design={d} cert={SAMPLE_CERT} ctx={data} name={draft.name} />}
              orientation={d.orientation}
              primaryColor={d.primaryColor}
              accentColor={d.accentColor}
              celebrate={draft.kind === 'graduation'}
              replayKey={`${d.orientation}-${d.style}`}
              maxHeight={d.orientation === 'portrait' ? 620 : 460}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <label className="flex items-center gap-2 text-xs font-medium">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-8 cursor-pointer rounded-md border bg-transparent p-0.5" />
      <span className="flex flex-col gap-0.5">
        {label}
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase())
          }}
          className="w-20 rounded border bg-background px-1 py-0.5 font-mono text-[11px]"
        />
      </span>
    </label>
  )
}

function WordingSection({ draft, set }: { draft: Draft; set: <TKey extends keyof CertificateDesign>(k: TKey, v: CertificateDesign[TKey]) => void }) {
  const d = draft.design
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const insert = (key: string) => {
    const el = bodyRef.current
    const token = `{${key}}`
    if (!el) return set('body', `${d.body}${token}`)
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = d.body.slice(0, start) + token + d.body.slice(end)
    set('body', next.slice(0, 900))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }
  const chips = [...PLACEHOLDERS, ...d.fields.map((f) => ({ key: f.key, label: f.label }))]

  return (
    <Section title="Wording">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Heading</Label>
          <Input value={d.title} maxLength={60} onChange={(e) => set('title', e.target.value)} placeholder="Certificate" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Under the heading</Label>
          <Input value={d.subtitle} maxLength={80} onChange={(e) => set('subtitle', e.target.value)} placeholder="of Graduation" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Before the name</Label>
          <Input value={d.intro} maxLength={120} onChange={(e) => set('intro', e.target.value)} placeholder="This is to certify that" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Motto (under the school name)</Label>
          <Input value={d.footer} maxLength={160} onChange={(e) => set('footer', e.target.value)} placeholder="Knowledge and Integrity" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label className="text-xs">After the name</Label>
        <Textarea ref={bodyRef} rows={4} value={d.body} maxLength={900} onChange={(e) => set('body', e.target.value)} />
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground">Insert:</span>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => insert(c.key)}
              className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              title={`{${c.key}}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Words in {'{curly brackets}'} are filled in for each student. {'{he}'}, {'{his}'} and {'{him}'} become she / her for girls; start a sentence with {'{He}'} for a capital letter.
        </p>
      </div>
    </Section>
  )
}

function FieldsSection({ design: d, set }: { design: CertificateDesign; set: <TKey extends keyof CertificateDesign>(k: TKey, v: CertificateDesign[TKey]) => void }) {
  const [label, setLabel] = useState('')
  const add = () => {
    const l = label.trim()
    if (!l) return
    if (d.fields.length >= 8) return toast.error('Up to 8 lines')
    set('fields', [...d.fields, { key: keyFor(l, d.fields.map((f) => f.key)), label: l.slice(0, 40), value: '' }])
    setLabel('')
  }
  return (
    <Section title="Lines filled in for each student" hint="For example Conduct, Positions held or Subject. Set what most students get; change it for a student when giving the certificate.">
      <div className="space-y-2">
        {d.fields.map((f, i) => (
          <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-2">
            <Input
              value={f.label}
              maxLength={40}
              onChange={(e) => set('fields', d.fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              aria-label="Line name"
            />
            <Input
              value={f.value}
              maxLength={120}
              placeholder="Usual answer (optional)"
              onChange={(e) => set('fields', d.fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              aria-label={`${f.label}: usual answer`}
            />
            <Button variant="ghost" size="icon" className="size-8" onClick={() => set('fields', d.fields.filter((_, j) => j !== i))} aria-label={`Remove ${f.label}`}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
        {d.fields.length < 8 && (
          <div className="flex gap-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="New line, e.g. Conduct" className="max-w-xs" />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={add} disabled={!label.trim()}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">Lines not used in the wording are listed under it on the certificate (empty ones are left out).</p>
      </div>
    </Section>
  )
}

function SignatoryRow({ value, onChange, onRemove }: { value: Signatory; onChange: (v: Signatory) => void; onRemove: () => void }) {
  const { mutateAsync: upload, isPending } = useUploadFileMutation()
  const inputRef = useRef<HTMLInputElement>(null)
  const pick = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file')
    if (file.size > 2 * 1024 * 1024) return toast.error('Please choose an image under 2 MB')
    try {
      onChange({ ...value, signatureUrl: await upload(file) })
    } catch {
      toast.error('Upload failed, please try again')
    }
  }
  return (
    <div className="grid items-center gap-2 rounded-xl border bg-muted/20 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
      <Input value={value.title} maxLength={60} placeholder="Title, e.g. Principal" onChange={(e) => onChange({ ...value, title: e.target.value })} />
      <Input value={value.name} maxLength={60} placeholder="Name (optional)" onChange={(e) => onChange({ ...value, name: e.target.value })} />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-9 w-24 items-center justify-center overflow-hidden rounded-md border bg-white text-[11px] text-gray-400 hover:border-primary/50"
          title={value.signatureUrl ? 'Replace signature' : 'Upload a signature'}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : value.signatureUrl ? (
            <img src={value.signatureUrl} alt="Signature" className="max-h-8 max-w-[5.5rem] object-contain" />
          ) : (
            <span className="flex items-center gap-1">
              <ImageUp className="size-3.5" /> Signature
            </span>
          )}
        </button>
        {value.signatureUrl && (
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onChange({ ...value, signatureUrl: null })} aria-label="Remove signature">
            <X className="size-3.5" />
          </Button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0] || undefined)} />
      </div>
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onRemove} aria-label="Remove this signature">
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function AudienceSection({
  design: d,
  kind,
  classes,
  set,
}: {
  design: CertificateDesign
  kind: CertificateKind
  classes: Array<SchoolClass>
  set: <TKey extends keyof CertificateDesign>(k: TKey, v: CertificateDesign[TKey]) => void
}) {
  const groups = useMemo(() => {
    const m = new Map<string, Array<SchoolClass>>()
    for (const c of classes) {
      const g = c.level || 'Other classes'
      m.set(g, [...(m.get(g) ?? []), c])
    }
    return [...m.entries()]
  }, [classes])
  const toggle = (id: string, on: boolean) => set('classIds', on ? [...d.classIds, id] : d.classIds.filter((x) => x !== id))
  const suggested = suggestClasses(kind, classes)

  return (
    <Section title="Who gets it" hint="These classes come first when you give the certificate. Leave all unticked to offer every class.">
      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add classes first.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(([level, list]) => (
            <div key={level}>
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{level}</div>
              <div className="flex flex-wrap gap-2">
                {list.map((c) => {
                  const on = d.classIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id, !on)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                        on ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/40',
                      )}
                    >
                      {on && <Check className="size-3" />}
                      {c.name}
                      {c.graduatesClass && <span className="text-[10px] text-muted-foreground">· final</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {suggested.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => set('classIds', suggested)}>
                Pick final-year classes
              </Button>
            )}
            {d.classIds.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => set('classIds', [])}>
                Clear
              </Button>
            )}
          </div>
          <label className="flex items-center gap-2 border-t pt-3 text-sm">
            <Checkbox checked={d.includeGraduates} onCheckedChange={(v) => set('includeGraduates', !!v)} />
            Also offer past students who have graduated
          </label>
        </div>
      )}
    </Section>
  )
}
