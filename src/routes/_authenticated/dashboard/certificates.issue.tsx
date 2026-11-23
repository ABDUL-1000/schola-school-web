import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Eye, GraduationCap, Loader2, Search, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateField } from '@/components/ui/date-field'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CertificateViewer } from '@/components/certificate/certificate-viewer'
import { CertificateBack, CertificateFront } from '@/components/certificate/certificate-face'
import { MiniCert } from '@/components/certificate/mini-cert'
import { useCertificateFonts } from '@/components/certificate/fonts'
import { KIND_INFO, SAMPLE_CERT, fmtLongDate, normalizeDesign } from '@/components/certificate/template'
import type { CertificateContext, CertificateDesign, CertificateRecord } from '@/components/certificate/template'
import { certKeys, errorText } from '@/components/certificate/school-data'
import type { TemplatesResponse } from '@/components/certificate/school-data'

export const Route = createFileRoute('/_authenticated/dashboard/certificates/issue')({
  component: IssuePage,
  validateSearch: (s: Record<string, unknown>): { templateId?: string } => ({
    templateId: typeof s.templateId === 'string' ? s.templateId : undefined,
  }),
})

type Candidate = {
  id: string
  fullname: string
  regNumber: string | null
  gender: string | null
  photo: string | null
  className: string | null
  level: string | null
  admissionYear: number
  graduated: boolean
  graduationSession: string | null
  certificate: { id: string; serial: string; issuedAt: string; sessionName: string | null } | null
}
type CandidatesResponse = { students: Array<Candidate>; graduateSessions: Array<{ id: string; name: string }> }

const today = () => new Date().toISOString().slice(0, 10)

function IssuePage() {
  useCertificateFonts()
  const search = Route.useSearch()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: certKeys.templates,
    queryFn: async () => (await api.get('/school/certificates/templates')).data.data as TemplatesResponse,
  })

  const [templateId, setTemplateId] = useState(search.templateId ?? '')
  useEffect(() => {
    if (!templateId && data?.templates.length) setTemplateId(data.templates[0].id)
  }, [data, templateId])
  const template = data?.templates.find((t) => t.id === templateId)
  const design = useMemo(() => normalizeDesign(template?.design), [template])

  const [source, setSource] = useState('')
  // Start with the first class the certificate is for.
  useEffect(() => {
    if (!template || !data) return
    const first = design.classIds.find((id) => data.classes.some((c) => c.id === id))
    setSource(first ? `class:${first}` : design.includeGraduates && !data.classes.length ? 'grad:all' : '')
  }, [template, data, design.classIds, design.includeGraduates])

  const [searchText, setSearchText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(searchText.trim()), 300)
    return () => clearTimeout(t)
  }, [searchText])

  const [kindOf, idOf] = source.split(':') as [string, string | undefined]
  const { data: cand, isFetching } = useQuery({
    queryKey: [...certKeys.candidates(templateId, source), q],
    enabled: !!templateId,
    queryFn: async () =>
      (
        await api.get('/school/certificates/candidates', {
          params: { templateId, classId: kindOf === 'class' ? idOf : undefined, graduates: kindOf === 'grad' ? idOf : undefined, search: q || undefined },
        })
      ).data.data as CandidatesResponse,
    placeholderData: (prev) => prev,
  })
  const students = useMemo(() => (source ? (cand?.students ?? []) : []), [cand, source])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [values, setValues] = useState<Record<string, Record<string, string> | undefined>>({})
  const [again, setAgain] = useState(false)
  const [issuedAt, setIssuedAt] = useState(today())
  const [sessionName, setSessionName] = useState('')
  const [preview, setPreview] = useState<Candidate | null>(null)
  useEffect(() => {
    if (data?.session && !sessionName) setSessionName(data.session.name)
  }, [data, sessionName])
  // New list: tick everyone who doesn't have this certificate yet.
  useEffect(() => {
    setSelected(new Set(students.filter((s) => !s.certificate).map((s) => s.id)))
  }, [students])
  useEffect(() => setValues({}), [templateId])

  const valueOf = (sid: string, key: string, fallback: string) => values[sid]?.[key] ?? fallback
  const setValue = (sid: string, key: string, v: string) => setValues((x) => ({ ...x, [sid]: { ...x[sid], [key]: v } }))
  const fillAll = (key: string, v: string) => setValues((x) => Object.fromEntries(students.map((s) => [s.id, { ...x[s.id], [key]: v }])))

  const picked = students.filter((s) => selected.has(s.id))
  const repeats = picked.filter((s) => s.certificate).length

  const issue = useMutation({
    mutationFn: async () =>
      (
        await api.post('/school/certificates/issue', {
          templateId,
          studentIds: picked.map((s) => s.id),
          values: Object.fromEntries(picked.map((s) => [s.id, Object.fromEntries(design.fields.map((f) => [f.key, valueOf(s.id, f.key, f.value)]))])),
          issuedAt,
          sessionName: sessionName.trim() || undefined,
          again,
        })
      ).data.data as { issued: number; skipped: number },
    onSuccess: (r) => {
      toast.success(`${r.issued} certificate${r.issued === 1 ? '' : 's'} given`, {
        description: r.skipped ? `${r.skipped} already had this certificate for the session and ${r.skipped === 1 ? 'was' : 'were'} skipped.` : 'Students can see them on their portal now.',
      })
      void qc.invalidateQueries({ queryKey: ['certificates'] })
      void navigate({ to: '/dashboard/certificates', search: { tab: 'given', templateId } })
    },
    onError: (e) => toast.error(errorText(e, 'Could not give the certificates')),
  })

  if (isLoading || !data) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!data.templates.length) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        Set up a certificate first.{' '}
        <Link to="/dashboard/certificates" className="font-medium text-primary hover:underline">
          Go to certificates
        </Link>
      </div>
    )
  }

  const usual = data.classes.filter((c) => design.classIds.includes(c.id))
  const others = data.classes.filter((c) => !design.classIds.includes(c.id))
  const toCert = (s: Candidate): CertificateRecord => ({
    ...SAMPLE_CERT,
    id: `preview-${s.id}`,
    studentId: s.id,
    serial: s.certificate?.serial ?? `${data.school.initials}/····/${new Date(issuedAt).getFullYear()}/······`,
    recipientName: s.fullname,
    className: s.className,
    sessionName: s.graduated ? (s.graduationSession ?? sessionName) : sessionName,
    values: Object.fromEntries(design.fields.map((f) => [f.key, valueOf(s.id, f.key, f.value)])),
    issuedAt: new Date(`${issuedAt}T12:00:00`).toISOString(),
    regNumber: s.regNumber,
    gender: s.gender,
    photo: s.photo,
    level: s.level,
    admissionYear: s.admissionYear,
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/dashboard/certificates">
            <ArrowLeft className="size-4" /> Certificates
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Give certificates</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">1. Certificate</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a certificate" />
                </SelectTrigger>
                <SelectContent>
                  {data.templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-muted-foreground">· {KIND_INFO[t.kind].name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">2. Students from</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {usual.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Usually for</SelectLabel>
                      {usual.map((c) => (
                        <SelectItem key={c.id} value={`class:${c.id}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {usual.length > 0 && others.length > 0 && <SelectSeparator />}
                  {others.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{usual.length ? 'Other classes' : 'Classes'}</SelectLabel>
                      {others.map((c) => (
                        <SelectItem key={c.id} value={`class:${c.id}`}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Past students</SelectLabel>
                    <SelectItem value="grad:all">All graduates</SelectItem>
                    {(cand?.graduateSessions ?? []).map((s) => (
                      <SelectItem key={s.id} value={`grad:${s.id}`}>
                        Graduated {s.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Tick one student, a few, or the whole list. To give a certificate to just one student, search for their name.
          </p>
        </div>
        {template && (
          <Link
            to="/dashboard/certificates/$templateId"
            params={{ templateId: template.id }}
            className="hidden items-center justify-center rounded-2xl border bg-gradient-to-b from-muted/50 to-muted/10 p-3 lg:flex"
            title="Edit the design"
          >
            <MiniCert design={design} cert={SAMPLE_CERT} ctx={data} width={design.orientation === 'landscape' ? 220 : 118} />
          </Link>
        )}
      </div>

      {source && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search name or reg number" className="pl-8" />
            </div>
            {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            <div className="ml-auto flex gap-2 text-xs">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set(students.map((s) => s.id)))}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set(students.filter((s) => !s.certificate).map((s) => s.id)))}>
                Only those without
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </div>

          {!students.length ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              {isFetching ? 'Loading students…' : q ? `No students match "${q}".` : 'No students here.'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="w-10 p-2.5">
                      <Checkbox
                        checked={students.every((s) => selected.has(s.id))}
                        onCheckedChange={(v) => setSelected(v ? new Set(students.map((s) => s.id)) : new Set())}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="p-2.5 font-medium">Student</th>
                    {design.fields.map((f) => (
                      <th key={f.key} className="min-w-[160px] p-2.5 font-medium">
                        <div className="flex items-center justify-between gap-2">
                          {f.label}
                          <FillAll label={f.label} onFill={(v) => fillAll(f.key, v)} />
                        </div>
                      </th>
                    ))}
                    <th className="p-2.5 font-medium">Status</th>
                    <th className="w-12 p-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr
                      key={s.id}
                      className={cn('border-t transition-colors animate-in fade-in', selected.has(s.id) ? 'bg-primary/[0.04]' : 'opacity-70')}
                      style={{ animationDelay: `${Math.min(i, 30) * 15}ms`, animationFillMode: 'backwards' }}
                    >
                      <td className="p-2.5">
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={(v) =>
                            setSelected((x) => {
                              const n = new Set(x)
                              if (v) n.add(s.id)
                              else n.delete(s.id)
                              return n
                            })
                          }
                          aria-label={`Select ${s.fullname}`}
                        />
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium">{s.fullname}</div>
                        <div className="text-xs text-muted-foreground">
                          {[s.regNumber, s.className, s.graduated ? `Graduated ${s.graduationSession ?? ''}`.trim() : null].filter(Boolean).join(' · ')}
                        </div>
                      </td>
                      {design.fields.map((f) => (
                        <td key={f.key} className="p-2">
                          <Input className="h-8" value={valueOf(s.id, f.key, f.value)} onChange={(e) => setValue(s.id, f.key, e.target.value)} />
                        </td>
                      ))}
                      <td className="p-2.5 text-xs">
                        {s.certificate ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400" title={s.certificate.serial}>
                            <CheckCircle2 className="size-3.5" /> Given {fmtLongDate(s.certificate.issuedAt)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not yet</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => setPreview(s)} aria-label={`Preview ${s.fullname}'s certificate`}>
                          <Eye className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* bottom bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 backdrop-blur md:-mx-8">
        <div className="flex flex-wrap items-end gap-3 px-4 py-3 md:px-8">
          <div className="space-y-1">
            <Label className="text-[11px]">Date on the certificate</Label>
            <DateField value={issuedAt} onChange={(v) => setIssuedAt(v || today())} className="h-9 w-44" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Session</Label>
            <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} maxLength={50} className="h-9 w-32" placeholder="2026/2027" />
          </div>
          {repeats > 0 && (
            <label className="flex items-center gap-2 pb-2 text-xs">
              <Checkbox checked={again} onCheckedChange={(v) => setAgain(!!v)} />
              Give again to the {repeats} who already have one
            </label>
          )}
          <Button className="ml-auto gap-1.5" size="lg" disabled={!picked.length || issue.isPending || !template} onClick={() => issue.mutate()}>
            {issue.isPending ? <Loader2 className="size-4 animate-spin" /> : design.includeGraduates ? <GraduationCap className="size-4" /> : <Send className="size-4" />}
            Give {picked.length || ''} certificate{picked.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>

      {preview && template && (
        <PreviewDialog cert={toCert(preview)} design={design} ctx={data} name={template.name} graduation={template.kind === 'graduation'} onClose={() => setPreview(null)} />
      )}
    </div>
  )
}

function FillAll({ label, onFill }: { label: string; onFill: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [v, setV] = useState('')
  if (!open) {
    return (
      <button type="button" className="text-[10px] font-medium text-primary hover:underline" onClick={() => setOpen(true)}>
        Same for all
      </button>
    )
  }
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault()
        onFill(v)
        setOpen(false)
        setV('')
      }}
    >
      <input autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder={label} className="h-6 w-24 rounded border bg-background px-1 text-[11px] text-foreground" />
      <button type="submit" className="text-[10px] font-semibold text-primary">
        Apply
      </button>
    </form>
  )
}

function PreviewDialog({
  cert,
  design,
  ctx,
  name,
  graduation,
  onClose,
}: {
  cert: CertificateRecord
  design: CertificateDesign
  ctx: CertificateContext
  name: string
  graduation: boolean
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{cert.recipientName}</DialogTitle>
          <DialogDescription>How {name} will look. The number is added when you give it.</DialogDescription>
        </DialogHeader>
        <CertificateViewer
          front={<CertificateFront design={design} cert={cert} ctx={ctx} />}
          back={<CertificateBack design={design} cert={cert} ctx={ctx} name={name} />}
          orientation={design.orientation}
          primaryColor={design.primaryColor}
          accentColor={design.accentColor}
          celebrate={graduation}
          maxHeight={500}
        />
      </DialogContent>
    </Dialog>
  )
}
