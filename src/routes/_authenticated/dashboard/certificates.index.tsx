import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Save, Search, Send, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CertificateViewer } from '@/components/certificate/certificate-viewer'
import { CertificateBack, CertificateFront } from '@/components/certificate/certificate-face'
import { CertificatePrintButton } from '@/components/certificate/certificate-print'
import { MiniCert } from '@/components/certificate/mini-cert'
import { useCertificateFonts } from '@/components/certificate/fonts'
import { KIND_INFO, PRESETS, SAMPLE_CERT, fmtLongDate, normalizeDesign, suggestClasses } from '@/components/certificate/template'
import type { CertificateContext, CertificateDesign, CertificateRecord, CertificateTemplate } from '@/components/certificate/template'
import { certKeys, errorText } from '@/components/certificate/school-data'
import type { TemplatesResponse } from '@/components/certificate/school-data'

type TabKey = 'given' | 'templates'

export const Route = createFileRoute('/_authenticated/dashboard/certificates/')({
  component: CertificatesPage,
  validateSearch: (s: Record<string, unknown>): { tab?: TabKey; templateId?: string } => ({
    tab: s.tab === 'templates' || s.tab === 'given' ? s.tab : undefined,
    templateId: typeof s.templateId === 'string' ? s.templateId : undefined,
  }),
})

type IssuedResponse = CertificateContext & { classNames: Array<string>; certificates: Array<CertificateRecord> }

function CertificatesPage() {
  useCertificateFonts()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data, isLoading } = useQuery({
    queryKey: certKeys.templates,
    queryFn: async () => (await api.get('/school/certificates/templates')).data.data as TemplatesResponse,
  })
  const templates = data?.templates ?? []
  const tab: TabKey = search.tab ?? (templates.some((t) => t.issuedCount) ? 'given' : 'templates')
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Award className="size-6 text-primary" /> Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Graduation certificates, testimonials, club and society certificates (MSSN, FCS…) and awards. Students see theirs on their portal.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New certificate
          </Button>
          {templates.length > 0 && (
            <Button className="gap-1.5" asChild>
              <Link to="/dashboard/certificates/issue">
                <Send className="size-4" /> Give certificates
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <PresetPicker data={data} onDone={() => undefined} />
      ) : (
        <Tabs value={tab} onValueChange={(v) => void navigate({ search: { tab: v as TabKey, templateId: search.templateId } })}>
          <TabsList>
            <TabsTrigger value="given">Certificates given</TabsTrigger>
            <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="given" className="mt-4">
            <GivenTab data={data} templateId={search.templateId} />
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <TemplatesTab data={data} onNew={() => setCreating(true)} />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>New certificate</DialogTitle>
            <DialogDescription>Pick a starting point. You can change the wording, colours and look next.</DialogDescription>
          </DialogHeader>
          {data && <PresetPicker data={data} onDone={() => setCreating(false)} embedded />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Presets

function PresetPicker({ data, onDone, embedded }: { data: TemplatesResponse; onDone: () => void; embedded?: boolean }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation({
    mutationFn: async (preset: (typeof PRESETS)[number]) => {
      const design = { ...preset.design, classIds: suggestClasses(preset.kind, data.classes) }
      return (await api.post('/school/certificates/templates', { name: preset.name, kind: preset.kind, design })).data.data as CertificateTemplate
    },
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: certKeys.templates })
      onDone()
      void navigate({ to: '/dashboard/certificates/$templateId', params: { templateId: t.id } })
    },
    onError: (e) => toast.error(errorText(e, 'Could not create the certificate')),
  })

  return (
    <div className={cn(!embedded && 'rounded-2xl border bg-gradient-to-b from-muted/40 to-background p-6')}>
      {!embedded && (
        <div className="mb-5 text-center">
          <h2 className="text-lg font-semibold">Set up your first certificate</h2>
          <p className="text-sm text-muted-foreground">Start from one of these. Every word, colour and signature can be changed.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((p, i) => {
          const design = normalizeDesign(p.design)
          return (
            <button
              key={p.id}
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate(p)}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-3 text-left transition-all animate-in fade-in slide-in-from-bottom-2 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg disabled:opacity-60"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
            >
              <div className="flex h-[150px] items-center justify-center">
                <MiniCert design={design} cert={SAMPLE_CERT} ctx={data} width={design.orientation === 'landscape' ? 200 : 106} />
              </div>
              <div className="w-full">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  {create.isPending && create.variables.id === p.id && <Loader2 className="size-3.5 animate-spin" />}
                  {p.name}
                </div>
                <div className="text-xs text-muted-foreground">{p.blurb}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Templates

function TemplatesTab({ data, onNew }: { data: TemplatesResponse; onNew: () => void }) {
  const classNames = new Map(data.classes.map((c) => [c.id, c.name]))
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.templates.map((t, i) => {
        const design = normalizeDesign(t.design)
        const audience = design.classIds.map((id) => classNames.get(id)).filter(Boolean)
        return (
          <div
            key={t.id}
            className="flex flex-col overflow-hidden rounded-xl border bg-card animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
          >
            <Link
              to="/dashboard/certificates/$templateId"
              params={{ templateId: t.id }}
              className="flex h-56 items-center justify-center bg-gradient-to-b from-muted/50 to-muted/10 p-4"
            >
              <MiniCert design={design} cert={SAMPLE_CERT} ctx={data} width={design.orientation === 'landscape' ? 270 : 142} />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{t.name}</div>
                <Badge variant="secondary" className="shrink-0">
                  {KIND_INFO[t.kind].name}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {t.issuedCount ? `${t.issuedCount} given` : 'None given yet'}
                {audience.length ? ` · For ${audience.slice(0, 3).join(', ')}${audience.length > 3 ? ` +${audience.length - 3}` : ''}` : ''}
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
                  <Link to="/dashboard/certificates/$templateId" params={{ templateId: t.id }}>
                    <Pencil className="size-3.5" /> Edit design
                  </Link>
                </Button>
                <Button size="sm" className="flex-1 gap-1.5" asChild>
                  <Link to="/dashboard/certificates/issue" search={{ templateId: t.id }}>
                    <Send className="size-3.5" /> Give
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )
      })}
      <button
        type="button"
        onClick={onNew}
        className="flex min-h-[300px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Plus className="size-6" />
        <span className="text-sm font-medium">New certificate</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Certificates given

const PAGE = 60

function GivenTab({ data, templateId: initialTemplate }: { data: TemplatesResponse; templateId?: string }) {
  const qc = useQueryClient()
  const [templateId, setTemplateId] = useState(initialTemplate ?? 'all')
  const [className, setClassName] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<number | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 300)
    return () => clearTimeout(t)
  }, [searchText])
  useEffect(() => {
    setSelected(new Set())
    setShown(PAGE)
  }, [templateId, className, search])

  const { data: issued, isLoading, isFetching } = useQuery({
    queryKey: certKeys.issued(templateId, className, search),
    queryFn: async () =>
      (
        await api.get('/school/certificates', {
          params: { templateId: templateId === 'all' ? undefined : templateId, className: className === 'all' ? undefined : className, search: search || undefined },
        })
      ).data.data as IssuedResponse,
    placeholderData: (prev) => prev,
  })
  const certs = issued?.certificates ?? []
  const templates = useMemo(() => new Map(data.templates.map((t) => [t.id, t])), [data.templates])
  const itemOf = (c: CertificateRecord) => ({ cert: c, design: normalizeDesign(templates.get(c.templateId)?.design) })
  const picked = certs.filter((c) => selected.has(c.id))
  const forPrint = (picked.length ? picked : certs).map(itemOf)
  const label = picked.length ? `${picked.length} selected` : className !== 'all' ? className : templateId !== 'all' ? (templates.get(templateId)?.name ?? 'all') : 'all'
  const fileTitle = `${data.school.schoolName} - ${templateId !== 'all' ? (templates.get(templateId)?.name ?? 'Certificates') : 'Certificates'}${className !== 'all' ? ` - ${className}` : ''}`

  const remove = useMutation({
    mutationFn: async (ids: Array<string>) => (await api.post('/school/certificates/remove', { ids })).data.data as { deleted: number },
    onSuccess: (r) => {
      toast.success(`${r.deleted} certificate${r.deleted === 1 ? '' : 's'} removed`)
      setSelected(new Set())
      void qc.invalidateQueries({ queryKey: ['certificates'] })
    },
    onError: (e) => toast.error(errorText(e, 'Could not remove the certificates')),
  })

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const allChecked = certs.length > 0 && certs.every((c) => selected.has(c.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All certificates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All certificates</SelectItem>
            {data.templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={className} onValueChange={setClassName}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {(issued?.classNames ?? []).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Name, reg number or serial" className="pl-8" />
        </div>
        {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {certs.length > 0 && issued && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={allChecked} onCheckedChange={(v) => setSelected(v ? new Set(certs.map((c) => c.id)) : new Set())} />
            {picked.length ? `${picked.length} selected` : `${certs.length} certificate${certs.length === 1 ? '' : 's'}`}
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <CertificatePrintButton items={forPrint} ctx={issued} mode="pdf" variant="default" label={`Download ${label} PDF`} title={fileTitle} />
            <CertificatePrintButton items={forPrint} ctx={issued} label="Print" title={fileTitle} />
            {picked.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
                <Trash2 className="size-4" /> Remove
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !certs.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {search || className !== 'all' || templateId !== 'all' ? 'No certificates match.' : 'No certificates given yet.'}{' '}
          <Link to="/dashboard/certificates/issue" className="font-medium text-primary hover:underline">
            Give certificates
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {certs.slice(0, shown).map((c, i) => {
              const item = itemOf(c)
              const t = templates.get(c.templateId)
              return (
                <div
                  key={c.id}
                  className={cn(
                    'group relative flex flex-col rounded-xl border bg-card p-3 transition-shadow animate-in fade-in slide-in-from-bottom-2 hover:shadow-lg',
                    selected.has(c.id) && 'ring-2 ring-primary',
                  )}
                  style={{ animationDelay: `${Math.min(i, 20) * 30}ms`, animationFillMode: 'backwards' }}
                >
                  <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} className="absolute left-3 top-3 z-10 bg-background" aria-label={`Select ${c.recipientName}`} />
                  <button type="button" onClick={() => setOpen(i)} className="flex h-44 items-center justify-center rounded-lg bg-muted/40">
                    <MiniCert design={item.design} cert={c} ctx={issued!} width={item.design.orientation === 'landscape' ? 230 : 122} />
                  </button>
                  <div className="mt-3 min-w-0">
                    <div className="truncate font-semibold">{c.recipientName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t?.name ?? 'Certificate'} · {c.className ?? '—'}
                      {c.sessionName ? ` · ${c.sessionName}` : ''}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">{c.serial}</span>
                      <span>{fmtLongDate(c.issuedAt)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {shown < certs.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>
                Show more ({certs.length - shown} left)
              </Button>
            </div>
          )}
        </>
      )}

      {issued && open !== null && certs[open] && (
        <CertificateDialog certs={certs} index={open} setIndex={setOpen} ctx={issued} templates={templates} />
      )}

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {picked.length} certificate{picked.length === 1 ? '' : 's'}?</AlertDialogTitle>
            <AlertDialogDescription>
              They disappear from the students’ portals. Use this for certificates given by mistake.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => remove.mutate(picked.map((c) => c.id))}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CertificateDialog({
  certs,
  index,
  setIndex,
  ctx,
  templates,
}: {
  certs: Array<CertificateRecord>
  index: number
  setIndex: (i: number | null) => void
  ctx: CertificateContext
  templates: Map<string, CertificateTemplate>
}) {
  const qc = useQueryClient()
  const cert = certs[index]
  const template = templates.get(cert.templateId)
  const design: CertificateDesign = normalizeDesign(template?.design)
  const [name, setName] = useState(cert.recipientName)
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    setName(cert.recipientName)
    setValues(Object.fromEntries(design.fields.map((f) => [f.key, cert.values[f.key] ?? f.value])))
  }, [cert.id])
  // Show edits on the certificate as they are typed.
  const live: CertificateRecord = { ...cert, recipientName: name.trim() || cert.recipientName, values: { ...cert.values, ...values } }
  const dirty = name.trim() !== cert.recipientName || design.fields.some((f) => (values[f.key] ?? '') !== (cert.values[f.key] ?? f.value))

  const save = useMutation({
    mutationFn: async () => (await api.patch(`/school/certificates/${cert.id}`, { recipientName: name.trim(), values })).data.data,
    onSuccess: () => {
      toast.success('Certificate updated')
      void qc.invalidateQueries({ queryKey: ['certificates', 'issued'] })
    },
    onError: (e) => toast.error(errorText(e, 'Could not save the changes')),
  })

  const go = (d: number) => {
    const n = index + d
    if (n >= 0 && n < certs.length) setIndex(n)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && setIndex(null)}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{cert.recipientName}</DialogTitle>
          <DialogDescription>
            {template?.name ?? 'Certificate'} · {cert.className ?? '—'} · No. {cert.serial}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <CertificateViewer
              front={<CertificateFront design={design} cert={live} ctx={ctx} />}
              back={<CertificateBack design={design} cert={live} ctx={ctx} name={template?.name} />}
              orientation={design.orientation}
              primaryColor={design.primaryColor}
              accentColor={design.accentColor}
              celebrate={template?.kind === 'graduation'}
              replayKey={cert.id}
              maxHeight={480}
              actions={
                <>
                  <CertificatePrintButton items={[{ cert: live, design }]} ctx={ctx} mode="pdf" label="Download PDF" title={`${cert.recipientName} - ${template?.name ?? 'Certificate'}`} />
                  <CertificatePrintButton items={[{ cert: live, design }]} ctx={ctx} label="Print" title={`${cert.recipientName} - ${template?.name ?? 'Certificate'}`} />
                </>
              }
            />
            <div className="mt-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" className="gap-1" disabled={index === 0} onClick={() => go(-1)}>
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {index + 1} of {certs.length}
              </span>
              <Button variant="ghost" size="sm" className="gap-1" disabled={index === certs.length - 1} onClick={() => go(1)}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
            <div className="text-sm font-semibold">Edit this certificate</div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name on the certificate</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            {design.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input value={values[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
              </div>
            ))}
            <Button className="w-full gap-1.5" disabled={!dirty || save.isPending || !name.trim()} onClick={() => save.mutate()}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save changes
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Changes show on the student’s portal straight away. To change the wording or look for everyone, edit the template.
            </p>
            {template && (
              <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                <Link to="/dashboard/certificates/$templateId" params={{ templateId: template.id }}>
                  <Pencil className="size-3.5" /> Edit template
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
