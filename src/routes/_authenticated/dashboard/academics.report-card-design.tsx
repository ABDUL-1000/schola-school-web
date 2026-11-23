import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, ImageUp, Loader2, Printer, RotateCcw, Save, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { printA4 } from '@/lib/print-a4'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useDeleteLevelReportTemplateMutation,
  useGradingConfigQuery,
  useSaveReportTemplateMutation,
} from '@/hooks/queries/grading.queries'
import { useProfileQuery } from '@/hooks/queries/profile.queries'
import { usePlanAllows } from '@/hooks/queries/plan.queries'
import { requestUpgrade } from '@/components/plan/upgrade-dialog'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { ReportCardDocument } from '@/components/report-card/report-card'
import { buildSampleReportCard } from '@/components/report-card/sample'
import {
  DEFAULT_LABELS,
  LABEL_INFO,
  LAYOUT_INFO,
  REPORT_LAYOUTS,
  SECTION_INFO,
  normalizeTemplate,
  textOn,
  tint,
} from '@/components/report-card/template'
import type { ReportLayout, ReportTemplate } from '@/components/report-card/template'

export const Route = createFileRoute('/_authenticated/dashboard/academics/report-card-design')({
  component: ReportCardDesignRoute,
})

const SWATCHES = ['#111827', '#1d4ed8', '#047857', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d', '#334155', '#a16207']

const sameLevel = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function ReportCardDesignRoute() {
  const { data: config, isLoading } = useGradingConfigQuery()
  const { data: school } = useProfileQuery()
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/school/class', { params: { limit: 100 } })
      return data?.data?.classes || data?.data
    },
  })
  const saveMutation = useSaveReportTemplateMutation()
  // Free plan: try every layout in the preview, but saving (and so using it) needs a paid plan.
  const canDesign = usePlanAllows('reportCardDesign')
  const deleteMutation = useDeleteLevelReportTemplateMutation()

  // '' = the school's default design; otherwise a class level (e.g. "Primary").
  const [scope, setScope] = useState('')
  const levelTemplates = (config?.levelTemplates || {}) as Record<string, unknown>
  const ownKey = scope ? Object.keys(levelTemplates).find((k) => sameLevel(k, scope)) : undefined
  const hasOwn = !!ownKey

  const levels = useMemo(() => {
    const list: Array<string> = []
    const add = (l?: string | null) => {
      const v = (l || '').trim()
      if (v && !list.some((x) => sameLevel(x, v))) list.push(v)
    }
    ;(Array.isArray(classesData) ? classesData : []).forEach((c: any) => add(c.level))
    Object.keys(levelTemplates).forEach(add)
    return list
  }, [classesData, levelTemplates])

  // The saved design for what's being edited (a level without its own design starts from the default).
  const baseline = useMemo(
    () => normalizeTemplate(ownKey ? levelTemplates[ownKey] : config?.reportTemplate),
    [config, ownKey],
  )
  const [draft, setDraft] = useState<ReportTemplate>(baseline)
  useEffect(() => setDraft(baseline), [baseline])
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline) || (!!scope && !hasOwn)

  const sample = useMemo(() => buildSampleReportCard({ school, config, level: scope || undefined }), [school, config, scope])
  const previewRef = useRef<HTMLDivElement>(null)

  const set = <TKey extends keyof ReportTemplate>(key: TKey, value: ReportTemplate[TKey]) => setDraft((d) => ({ ...d, [key]: value }))

  const pickLayout = (layout: ReportLayout) =>
    setDraft((d) => ({
      ...d,
      layout,
      // Keep a colour the school picked; otherwise switch to the new layout's colour.
      accentColor: d.accentColor === LAYOUT_INFO[d.layout].accent ? LAYOUT_INFO[layout].accent : d.accentColor,
    }))

  const save = async () => {
    if (!canDesign) {
      requestUpgrade({
        message: 'Saving a report card design is part of the paid plans. Try any layout in the preview; on the free plan, report cards use the Classic design.',
        requiredTier: 'STANDARD',
      })
      return
    }
    try {
      await saveMutation.mutateAsync({ level: scope || null, template: draft })
      toast.success(scope ? `Report card design saved for ${scope}` : 'Report card design saved')
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the design')
    }
  }

  const switchToDefault = async () => {
    if (!ownKey) return
    try {
      await deleteMutation.mutateAsync(ownKey)
      toast.success(`${scope} now uses the school's default design`)
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove this design')
    }
  }

  const printSample = () => {
    const el = previewRef.current?.querySelector<HTMLElement>('[data-report-sheet]')
    printA4(el || null, { title: 'Sample report card' })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Card Design</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose how your report cards look. Changes apply to every portal and to printing, including printing a whole class.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={printSample} className="gap-1.5">
            <Printer className="size-4" /> Print sample
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDraft(baseline)} disabled={!dirty || (!!scope && !hasOwn)} className="gap-1.5">
            <RotateCcw className="size-4" /> Undo changes
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || saveMutation.isPending} className="gap-1.5">
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save design
          </Button>
        </div>
      </div>

      {!canDesign && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <strong>Preview only on the free plan.</strong> Try any layout and setting below; saving a design is part of the paid plans.
          Until then, report cards use the Classic design.
        </div>
      )}

      {/* Which design is being edited */}
      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="text-sm font-semibold">Design for</div>
          <div className="flex flex-wrap gap-2">
            <ScopeChip active={!scope} onClick={() => setScope('')} label="Whole school (default)" />
            {levels.map((l) => {
              const own = Object.keys(levelTemplates).some((k) => sameLevel(k, l))
              return (
                <ScopeChip
                  key={l}
                  active={!!scope && sameLevel(scope, l)}
                  onClick={() => setScope(l)}
                  label={l}
                  note={own ? 'own design' : 'uses default'}
                />
              )
            })}
          </div>
          {!levels.length && (
            <p className="text-xs text-muted-foreground">
              To give a section (e.g. Nursery, Primary, JSS) its own design, set a level on your classes in Classes.
            </p>
          )}
          {scope && !hasOwn && (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">{scope}</strong> classes currently use the school's default design. Change anything below
              and save to give {scope} its own design.
            </p>
          )}
          {scope && hasOwn && (
            <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{scope}</strong> classes have their own design.
              </span>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-destructive" onClick={switchToDefault} disabled={deleteMutation.isPending}>
                <Trash2 className="size-3.5" /> Use the school default instead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
        {/* Settings */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>The preview updates as you go. Nothing changes for students until you save.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="layout">
              <TabsList className="mb-4 grid w-full grid-cols-5">
                <TabsTrigger value="layout" className="px-1 text-xs">Layout</TabsTrigger>
                <TabsTrigger value="branding" className="px-1 text-xs">Branding</TabsTrigger>
                <TabsTrigger value="sections" className="px-1 text-xs">Sections</TabsTrigger>
                <TabsTrigger value="wording" className="px-1 text-xs">Wording</TabsTrigger>
                <TabsTrigger value="signatures" className="px-1 text-xs">Signatures</TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="space-y-2">
                {REPORT_LAYOUTS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => pickLayout(l)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                      draft.layout === l && 'border-primary ring-1 ring-primary bg-primary/5',
                    )}
                  >
                    <LayoutThumb layout={l} color={draft.layout === l ? draft.accentColor : LAYOUT_INFO[l].accent} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        {LAYOUT_INFO[l].name}
                        {draft.layout === l && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{LAYOUT_INFO[l].description}</p>
                    </div>
                  </button>
                ))}
              </TabsContent>

              <TabsContent value="branding" className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Accent colour</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Use colour ${c}`}
                        onClick={() => set('accentColor', c)}
                        className={cn('size-7 rounded-full border-2 border-background ring-1 ring-border', draft.accentColor === c && 'ring-2 ring-primary')}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="color"
                        value={draft.accentColor}
                        onChange={(e) => set('accentColor', e.target.value)}
                        className="h-7 w-10 cursor-pointer rounded border bg-transparent"
                      />
                      Custom
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Used for headings and highlights. Dark colours print best on black-and-white printers.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">School motto</Label>
                  <Input value={draft.motto} maxLength={200} placeholder="e.g. Knowledge and Character" onChange={(e) => set('motto', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Footer note</Label>
                  <Input
                    value={draft.footerNote}
                    maxLength={300}
                    placeholder="e.g. This report is not valid without the school stamp."
                    onChange={(e) => set('footerNote', e.target.value)}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  School name, logo, address and phone come from your school profile in Settings.
                </p>
              </TabsContent>

              <TabsContent value="sections" className="space-y-5">
                {SECTION_INFO.map((g) => (
                  <div key={g.group} className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.group}</div>
                    {g.items.map((item) => (
                      <label key={item.key} className="flex cursor-pointer items-start gap-2.5 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={draft.sections[item.key]}
                          onCheckedChange={(v) => set('sections', { ...draft.sections, [item.key]: v === true })}
                        />
                        <span>
                          {item.label}
                          {item.hint && <span className="block text-[11px] text-muted-foreground">{item.hint}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Character and skills ratings only appear once teachers have rated the student.
                </p>
              </TabsContent>

              <TabsContent value="wording" className="space-y-4">
                {LABEL_INFO.map((l) => (
                  <div key={l.key} className="space-y-1.5">
                    <Label className="text-xs font-semibold">{l.label}</Label>
                    <Input
                      value={draft.labels[l.key] === DEFAULT_LABELS[l.key] ? '' : draft.labels[l.key]}
                      placeholder={DEFAULT_LABELS[l.key]}
                      maxLength={200}
                      onChange={(e) => set('labels', { ...draft.labels, [l.key]: e.target.value || DEFAULT_LABELS[l.key] })}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">Leave a box empty to use the wording shown in grey.</p>
              </TabsContent>

              <TabsContent value="signatures" className="space-y-5">
                <ImageField
                  label={`${draft.labels.principal}'s signature`}
                  hint="A clear photo or scan on a white background works best (PNG with a transparent background is ideal)."
                  value={draft.principalSignatureUrl}
                  fallback={config?.principalSignatureUrl}
                  onChange={(url) => set('principalSignatureUrl', url)}
                />
                <ImageField
                  label="School stamp"
                  hint="Printed next to the signature."
                  value={draft.stampUrl}
                  fallback={config?.schoolStampUrl}
                  onChange={(url) => set('stampUrl', url)}
                />
                {!draft.sections.signatures && (
                  <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                    "Signature and stamp" is switched off in Sections, so these won't print.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Live preview */}
        <div className="min-w-0 space-y-2 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Preview with sample scores{scope ? ` · ${scope}` : ''}</span>
            {dirty && <span className="font-medium text-amber-600">Unsaved changes</span>}
          </div>
          <div ref={previewRef} className="max-h-[calc(100vh-7rem)] overflow-auto rounded-xl border bg-muted/30 p-3">
            <ReportCardDocument data={sample} template={draft} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ScopeChip({ active, onClick, label, note }: { active: boolean; onClick: () => void; label: string; note?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
      )}
    >
      {label}
      {note && <span className={cn('ml-1.5 text-[11px]', active ? 'opacity-80' : 'text-muted-foreground')}>· {note}</span>}
    </button>
  )
}

/** A tiny sketch of each layout, so schools can tell them apart at a glance. */
function LayoutThumb({ layout, color }: { layout: ReportLayout; color: string }) {
  const bar = 'h-1 rounded-sm bg-gray-300'
  return (
    <div className="flex h-16 w-12 shrink-0 flex-col gap-1 rounded border bg-white p-1">
      {layout === 'modern' && <div className="h-3 rounded-sm" style={{ background: color }} />}
      {layout === 'classic' && (
        <>
          <div className="mx-auto h-1.5 w-8 rounded-sm bg-gray-700" />
          <div className="mx-auto h-1 w-6 rounded-sm" style={{ background: color }} />
        </>
      )}
      {layout === 'compact' && <div className="h-1.5 border-b-2" style={{ borderColor: color }} />}
      {layout === 'primary' && <div className="h-3 rounded-md border-2" style={{ borderColor: color, background: tint(color, 0.1) }} />}
      <div className="flex-1 space-y-[3px] rounded-sm border border-gray-200 p-[2px]">
        {Array.from({ length: layout === 'compact' ? 7 : layout === 'primary' ? 3 : 5 }).map((_, i) => (
          <div key={i} className={bar} style={i === 0 && layout !== 'classic' ? { background: color } : undefined} />
        ))}
      </div>
      <div className="h-1.5 rounded-sm" style={{ background: layout === 'classic' ? '#d1d5db' : tint(color, 0.3), color: textOn(color) }} />
    </div>
  )
}

function ImageField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string
  hint: string
  value: string | null
  fallback?: string | null
  onChange: (url: string | null) => void
}) {
  const { mutateAsync: upload, isPending } = useUploadFileMutation()
  const inputRef = useRef<HTMLInputElement>(null)
  const shown = value || fallback || null

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
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-32 items-center justify-center rounded-md border bg-white">
          {shown ? <img src={shown} alt={label} className="max-h-14 max-w-[7.5rem] object-contain" /> : <span className="text-[11px] text-gray-400">None</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
            {value ? 'Replace' : 'Upload'}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || undefined)} />
      </div>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  )
}
