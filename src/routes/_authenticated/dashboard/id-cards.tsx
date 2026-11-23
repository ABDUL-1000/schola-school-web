import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronLeft, ChevronRight, IdCard, ImageUp, Loader2, Lock, RotateCcw, Save, Search, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClassesQuery } from '@/hooks/queries/class.queries'
import { useUploadFileMutation } from '@/hooks/queries/upload.queries'
import { IdCardViewer } from '@/components/id-card/id-card-viewer'
import { IdCardBack, IdCardFront } from '@/components/id-card/id-card-face'
import { IdCardPrintButton } from '@/components/id-card/id-card-print'
import {
  COLOR_PRESETS,
  DEFAULT_ID_TEMPLATE,
  DESIGN_INFO,
  FIELD_INFO,
  SAMPLE_PEOPLE,
  cardSize,
  normalizeIdTemplate,
} from '@/components/id-card/template'
import type {
  IdCardContext,
  IdCardDesign,
  IdCardKind,
  IdCardOrientation,
  IdCardPerson,
  IdCardTemplate,
} from '@/components/id-card/template'

export const Route = createFileRoute('/_authenticated/dashboard/id-cards')({
  component: IdCardsPage,
})

const keys = {
  settings: ['idCards', 'settings'] as const,
  people: (kind: IdCardKind, classId: string, search: string) => ['idCards', 'people', kind, classId, search] as const,
}

type PeopleResponse = IdCardContext & { people: Array<IdCardPerson>; lockedCount: number; limit: number | null }

function IdCardsPage() {
  const qc = useQueryClient()
  const { data: ctx, isLoading } = useQuery({
    queryKey: keys.settings,
    queryFn: async () => (await api.get('/school/id-cards/settings')).data?.data as IdCardContext,
  })
  const saved = useMemo(() => normalizeIdTemplate(ctx?.template), [ctx?.template])
  const [draft, setDraft] = useState<IdCardTemplate>(DEFAULT_ID_TEMPLATE)
  useEffect(() => setDraft(saved), [saved])
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const save = useMutation({
    mutationFn: async (template: IdCardTemplate) => (await api.put('/school/id-cards/settings', { template })).data?.data,
    onSuccess: () => {
      toast.success('ID card design saved. Staff and students see it on their portals now.')
      qc.invalidateQueries({ queryKey: ['idCards'] })
    },
    onError: () => toast.error('Could not save the design, please try again'),
  })

  if (isLoading || !ctx) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <IdCard className="size-6 text-primary" /> ID Cards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Design your school's ID card once. Every student and staff member gets theirs, and sees it in 3D on their portal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs font-medium text-amber-600 animate-in fade-in">Unsaved changes</span>}
          <Button variant="ghost" size="sm" className="gap-1.5" disabled={!dirty || save.isPending} onClick={() => setDraft(saved)}>
            <RotateCcw className="size-4" /> Undo
          </Button>
          <Button size="sm" className="gap-1.5" disabled={!dirty || save.isPending} onClick={() => save.mutate(draft)}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save design
          </Button>
        </div>
      </div>

      <Tabs defaultValue="design">
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="design" className="mt-4">
          <DesignTab ctx={ctx} draft={draft} setDraft={setDraft} />
        </TabsContent>
        <TabsContent value="student" className="mt-4">
          <PeopleTab kind="student" template={draft} dirty={dirty} />
        </TabsContent>
        <TabsContent value="staff" className="mt-4">
          <PeopleTab kind="staff" template={draft} dirty={dirty} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------- Design ----------------

function DesignTab({
  ctx,
  draft,
  setDraft,
}: {
  ctx: IdCardContext
  draft: IdCardTemplate
  setDraft: React.Dispatch<React.SetStateAction<IdCardTemplate>>
}) {
  const [sample, setSample] = useState<IdCardKind>('student')
  const set = <TKey extends keyof IdCardTemplate>(k: TKey, v: IdCardTemplate[TKey]) => setDraft((d) => ({ ...d, [k]: v }))
  const person = SAMPLE_PEOPLE[sample]

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Shape</CardTitle>
            <CardDescription>Portrait cards hang well on a lanyard. Landscape fits more details side by side.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(['portrait', 'landscape'] as Array<IdCardOrientation>).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => set('orientation', o)}
                className={cn(
                  'flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all hover:border-primary/60',
                  draft.orientation === o ? 'border-primary bg-primary/5' : 'border-border',
                )}
              >
                <div
                  className={cn(
                    'shrink-0 rounded-md border-2 transition-transform',
                    draft.orientation === o ? 'border-primary bg-primary/15 scale-105' : 'border-muted-foreground/40 bg-muted',
                    o === 'portrait' ? 'h-14 w-9' : 'h-9 w-14',
                  )}
                />
                <div>
                  <div className="font-semibold capitalize">{o}</div>
                  <div className="text-xs text-muted-foreground">{o === 'portrait' ? '54 × 86 mm, upright' : '86 × 54 mm, sideways'}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Design</CardTitle>
            <CardDescription>Pick a look. Your colours, logo and details fill it in.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(Object.keys(DESIGN_INFO) as Array<IdCardDesign>).map((d) => {
              const t = { ...draft, design: d }
              const { w, h } = cardSize(t.orientation)
              const zoom = draft.orientation === 'portrait' ? 0.5 : 0.42
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('design', d)}
                  className={cn(
                    'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md',
                    draft.design === d ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  {draft.design === d && (
                    <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                  <div className="pointer-events-none overflow-hidden rounded-lg shadow-sm" style={{ width: w * zoom, height: h * zoom }}>
                    <div style={{ zoom }}>
                      <IdCardFront template={t} ctx={ctx} person={person} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold">{DESIGN_INFO[d].name}</div>
                    <div className="text-[11px] leading-tight text-muted-foreground">{DESIGN_INFO[d].blurb}</div>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Colours</CardTitle>
            <CardDescription>Start from a pair, or use your school colours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => {
                const on = draft.primaryColor === c.primary && draft.accentColor === c.accent
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => setDraft((d) => ({ ...d, primaryColor: c.primary, accentColor: c.accent }))}
                    className={cn('flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-all hover:shadow', on && 'border-primary ring-2 ring-primary/30')}
                  >
                    <span className="flex">
                      <span className="size-4 rounded-full border border-white" style={{ background: c.primary }} />
                      <span className="-ml-1.5 size-4 rounded-full border border-white" style={{ background: c.accent }} />
                    </span>
                    {c.name}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Main colour" value={draft.primaryColor} onChange={(v) => set('primaryColor', v)} />
              <ColorField label="Accent colour" value={draft.accentColor} onChange={(v) => set('accentColor', v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Wording</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <TextField label="Motto (optional)" value={draft.motto} max={120} placeholder="e.g. Knowledge and Character" onChange={(v) => set('motto', v)} />
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valid until</Label>
              <Input type="date" value={draft.validUntil ?? ''} onChange={(e) => set('validUntil', e.target.value || null)} />
              <p className="text-[11px] text-muted-foreground">
                Leave empty to use the end of the current session{ctx.session?.endDate ? ` (${new Date(ctx.session.endDate).toLocaleDateString('en-GB')})` : ''}.
              </p>
            </div>
            <TextField label="Student card title" value={draft.studentTitle} max={40} onChange={(v) => set('studentTitle', v)} />
            <TextField label="Staff card title" value={draft.staffTitle} max={40} onChange={(v) => set('staffTitle', v)} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Note on the back (optional)</Label>
              <Textarea
                rows={2}
                maxLength={240}
                value={draft.returnNote}
                placeholder={`This card is the property of ${ctx.school.schoolName}. It must be carried at all times and shown on request. If found, please return it to the school.`}
                onChange={(e) => set('returnNote', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Signature</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <SignatureField value={draft.signatureUrl} onChange={(v) => set('signatureUrl', v)} />
            <TextField label="Signed by" value={draft.signatoryTitle} max={40} placeholder="Principal" onChange={(v) => set('signatoryTitle', v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">What the card shows</CardTitle>
            <CardDescription>Details left empty on someone's record are skipped on their card.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            {(['front', 'back'] as const).map((side) => (
              <div key={side} className="space-y-2.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{side}</div>
                {FIELD_INFO.filter((f) => f.side === side).map((f) => (
                  <label key={f.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={draft.fields[f.key]}
                      onCheckedChange={(c) => setDraft((d) => ({ ...d, fields: { ...d.fields, [f.key]: c === true } }))}
                    />
                    {f.label}
                    {f.who && <span className="text-[11px] text-muted-foreground">({f.who} only)</span>}
                  </label>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="xl:sticky xl:top-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Sparkles className="size-4 text-primary" /> Live preview
              </CardTitle>
              <CardDescription>Drag the card to turn it.</CardDescription>
            </div>
            <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
              {(['student', 'staff'] as Array<IdCardKind>).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSample(k)}
                  className={cn('rounded-md px-3 py-1.5 capitalize', sample === k ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                >
                  {k}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="bg-gradient-to-b from-muted/30 to-background pt-2">
            <IdCardViewer
              replayKey={`${sample}-${draft.orientation}-${draft.design}`}
              front={<IdCardFront template={draft} ctx={ctx} person={person} />}
              back={<IdCardBack template={draft} ctx={ctx} person={person} />}
              orientation={draft.orientation}
              primaryColor={draft.primaryColor}
              accentColor={draft.accentColor}
              strapText={`${ctx.school.schoolName} · `.repeat(3)}
              maxScale={1.35}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 cursor-pointer rounded-md border bg-transparent p-0.5" />
        <Input
          value={text}
          maxLength={7}
          className="font-mono uppercase"
          onChange={(e) => {
            setText(e.target.value)
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value.toLowerCase())
          }}
        />
      </div>
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  max,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  max: number
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <Input value={value} maxLength={max} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function SignatureField({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
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
      <Label className="text-xs font-semibold">Signature image</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-28 items-center justify-center rounded-md border bg-white">
          {value ? <img src={value} alt="Signature" className="max-h-12 max-w-[6.5rem] object-contain" /> : <span className="text-[11px] text-gray-400">None</span>}
        </div>
        <div className="flex flex-col gap-1">
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
      <p className="text-[11px] text-muted-foreground">A signature on white or a clear background works best.</p>
    </div>
  )
}

// ---------------- Students / Staff ----------------

const PAGE = 48

function PeopleTab({ kind, template, dirty }: { kind: IdCardKind; template: IdCardTemplate; dirty: boolean }) {
  const [classId, setClassId] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<number | null>(null)
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim()), 300)
    return () => clearTimeout(t)
  }, [searchText])
  useEffect(() => setShown(PAGE), [classId, search])

  const { data: classPage } = useClassesQuery(undefined, undefined, 1, 200)
  const classes = kind === 'student' ? (classPage?.data ?? []) : []

  const { data, isLoading, isFetching } = useQuery({
    queryKey: keys.people(kind, classId, search),
    queryFn: async () =>
      (
        await api.get('/school/id-cards/people', {
          params: { type: kind, classId: classId === 'all' ? undefined : classId, search: search || undefined },
        })
      ).data?.data as PeopleResponse,
    placeholderData: (prev) => prev,
  })
  const people = data?.people ?? []
  const word = kind === 'student' ? 'students' : 'staff'
  const className = classes.find((c) => c.id === classId)?.name

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {kind === 'student' && (
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All classes" />
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
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={kind === 'student' ? 'Search name or reg number' : 'Search name'}
            className="pl-8"
          />
        </div>
        {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <span className="text-sm text-muted-foreground">
            {people.length - (data?.lockedCount ?? 0)} card{people.length - (data?.lockedCount ?? 0) === 1 ? '' : 's'}
          </span>
          {data && (
            <>
              <IdCardPrintButton
                people={people}
                template={template}
                ctx={data}
                mode="pdf"
                variant="default"
                label={kind === 'student' ? (className ? `Download ${className} PDF` : 'Download all students PDF') : 'Download all staff PDF'}
                title={`${data.school.schoolName} - ${className ? `${className} ID cards` : kind === 'student' ? 'student ID cards' : 'staff ID cards'}${search ? ` (${search})` : ''}`}
              />
              <IdCardPrintButton
                people={people}
                template={template}
                ctx={data}
                label="Print"
                title={`ID cards - ${className || (kind === 'student' ? 'students' : 'staff')}`}
              />
            </>
          )}
        </div>
      </div>

      {dirty && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
          These cards show your unsaved design. Save it so {word} see the same card on their portal.
        </p>
      )}
      {!!data?.lockedCount && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <Lock className="size-4 shrink-0" />
          <span className="flex-1">
            The free plan includes ID cards for your first {data.limit} {word}. {data.lockedCount} {data.lockedCount === 1 ? 'person has' : 'people have'} no card until you upgrade.
          </span>
          <Link to="/dashboard/plan" className="font-semibold underline-offset-2 hover:underline">
            See plans
          </Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !people.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          {search ? `No ${word} match "${search}".` : `No ${word} yet. Add ${word} and their cards appear here.`}
        </div>
      ) : (
        <>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${template.orientation === 'portrait' ? 140 : 200}px, 1fr))` }}
          >
            {people.slice(0, shown).map((p, i) => (
              <CardTile key={p.id} index={i} person={p} template={template} ctx={data!} onOpen={() => setOpen(i)} />
            ))}
          </div>
          {shown < people.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShown((s) => s + PAGE)}>
                Show more ({people.length - shown} left)
              </Button>
            </div>
          )}
        </>
      )}

      {data && open !== null && people[open] && (
        <CardDialog
          people={people}
          index={open}
          setIndex={setOpen}
          template={template}
          ctx={data}
        />
      )}
    </div>
  )
}

/** A card in the grid: tilts toward the pointer, lifts on hover. */
function CardTile({
  person,
  template,
  ctx,
  index,
  onOpen,
}: {
  person: IdCardPerson
  template: IdCardTemplate
  ctx: IdCardContext
  index: number
  onOpen: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const { w, h } = cardSize(template.orientation)
  const zoom = template.orientation === 'portrait' ? 0.62 : 0.56
  const move = (e: React.PointerEvent) => {
    const el = ref.current
    if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', `${-y * 14}deg`)
    el.style.setProperty('--ry', `${x * 18}deg`)
    el.style.setProperty('--gx', `${(x + 0.5) * 100}%`)
    el.style.setProperty('--gy', `${(y + 0.5) * 100}%`)
  }
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg')
    ref.current?.style.setProperty('--ry', '0deg')
  }
  return (
    <div
      className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
      style={{ animationDuration: '450ms', animationDelay: `${Math.min(index, 24) * 35}ms`, perspective: 700 }}
    >
      <button
        ref={ref}
        type="button"
        onClick={person.locked ? undefined : onOpen}
        onPointerMove={move}
        onPointerLeave={leave}
        disabled={person.locked}
        className="group relative rounded-xl shadow-md transition-[transform,box-shadow] duration-200 ease-out hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed"
        style={{
          width: w * zoom,
          height: h * zoom,
          transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateZ(0)',
        }}
        aria-label={`Open ${person.fullname}'s ID card`}
      >
        <div className={cn('overflow-hidden rounded-xl', person.locked && 'blur-[2px] grayscale')} style={{ width: w * zoom, height: h * zoom }}>
          <div style={{ zoom }}>
            <IdCardFront template={template} ctx={ctx} person={person} />
          </div>
        </div>
        {!person.locked && (
          <div
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ background: 'radial-gradient(circle at var(--gx, 50%) var(--gy, 30%), rgba(255,255,255,.45), transparent 55%)', mixBlendMode: 'overlay' }}
          />
        )}
        {person.locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-background/50 text-xs font-semibold">
            <Lock className="size-5 text-amber-600" />
            Upgrade to unlock
          </div>
        )}
      </button>
      <div className="w-full text-center">
        <div className="truncate text-xs font-semibold">{person.fullname}</div>
        <div className="truncate text-[11px] text-muted-foreground">{person.kind === 'student' ? person.className || person.idNumber : person.role}</div>
      </div>
    </div>
  )
}

function CardDialog({
  people,
  index,
  setIndex,
  template,
  ctx,
}: {
  people: Array<IdCardPerson>
  index: number
  setIndex: (i: number | null) => void
  template: IdCardTemplate
  ctx: IdCardContext
}) {
  const unlocked = people.map((p, i) => (p.locked ? -1 : i)).filter((i) => i >= 0)
  const pos = unlocked.indexOf(index)
  const can = (d: number) => pos + d >= 0 && pos + d < unlocked.length
  const go = (d: number) => {
    if (can(d)) setIndex(unlocked[pos + d])
  }
  const person = people[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('[role="img"]')) return // the card uses arrows to turn
      if (e.key === 'PageDown' || (e.key === 'ArrowRight' && e.shiftKey)) go(1)
      if (e.key === 'PageUp' || (e.key === 'ArrowLeft' && e.shiftKey)) go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nav = (d: number, icon: ReactNode, label: string) => (
    <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-full" disabled={!can(d)} onClick={() => go(d)} aria-label={label}>
      {icon}
    </Button>
  )

  return (
    <Dialog open onOpenChange={(o) => !o && setIndex(null)}>
      <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person.fullname}</DialogTitle>
          <DialogDescription>
            {person.idNumber}
            {unlocked.length > 1 && ` · ${pos + 1} of ${unlocked.length}`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          {nav(-1, <ChevronLeft className="size-4" />, 'Previous card')}
          <div className="min-w-0 flex-1">
            <IdCardViewer
              replayKey={person.id}
              front={<IdCardFront template={template} ctx={ctx} person={person} />}
              back={<IdCardBack template={template} ctx={ctx} person={person} />}
              orientation={template.orientation}
              primaryColor={template.primaryColor}
              accentColor={template.accentColor}
              strapText={`${ctx.school.schoolName} · `.repeat(3)}
              maxScale={1.3}
              actions={
                <>
                  <IdCardPrintButton people={[person]} template={template} ctx={ctx} mode="pdf" label="Download PDF" title={`${person.fullname} - ID card`} />
                  <IdCardPrintButton people={[person]} template={template} ctx={ctx} label="Print card" title={`${person.fullname} - ID card`} />
                </>
              }
            />
          </div>
          {nav(1, <ChevronRight className="size-4" />, 'Next card')}
        </div>
      </DialogContent>
    </Dialog>
  )
}
