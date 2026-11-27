import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { GripVertical, Loader2, MonitorPlay, Plus, RotateCcw, Save, Search, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { DateField } from '@/components/ui/date-field'
import { cn } from '@/lib/utils'
import { newId, useRecruitmentAction } from './recruitment'
import type { Criterion, ExtraQuestion, Vacancy, VacancyDetail } from './recruitment'

type Form = Pick<
  Vacancy,
  | 'title'
  | 'roleAppliedFor'
  | 'employmentType'
  | 'description'
  | 'requirements'
  | 'closingDate'
  | 'branchId'
  | 'questions'
  | 'useTest'
  | 'useInterview'
  | 'interviewCriteria'
  | 'testWeight'
  | 'interviewWeight'
  | 'passMark'
  | 'panelStaffIds'
>

const pick = (v: Vacancy): Form => ({
  title: v.title,
  roleAppliedFor: v.roleAppliedFor,
  employmentType: v.employmentType,
  description: v.description,
  requirements: v.requirements,
  closingDate: v.closingDate ? v.closingDate.slice(0, 10) : null,
  branchId: v.branchId,
  questions: v.questions,
  useTest: v.useTest,
  useInterview: v.useInterview,
  interviewCriteria: v.interviewCriteria,
  testWeight: v.testWeight,
  interviewWeight: v.interviewWeight,
  passMark: v.passMark,
  panelStaffIds: v.panelStaffIds,
})

/**
 * Setup: the job advert, the application form, which steps to use, the
 * interview marking scheme, the weighting and the panel.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function SetupPanel({ detail }: { detail: VacancyDetail }) {
  const v = detail.vacancy
  const [form, setForm] = useState<Form>(() => pick(v))
  // Only reset when what's saved actually changes (not on every refetch).
  const saved = JSON.stringify(pick(v))
  useEffect(() => setForm(JSON.parse(saved) as Form), [saved])
  const dirty = JSON.stringify(form) !== saved
  const set = <TKey extends keyof Form>(k: TKey, val: Form[TKey]) => setForm((f) => ({ ...f, [k]: val }))

  const save = useRecruitmentAction<Form>('patch', () => `/${v.id}`, { success: () => 'Saved', error: 'Could not save' })
  const criteriaMax = form.interviewCriteria.reduce((s, c) => s + c.max, 0)
  const both = form.useTest && form.useInterview
  const weightTotal = form.testWeight + form.interviewWeight || 1

  return (
    <div className="space-y-5 pb-20">
      <Section title="The job" hint="What candidates see on the job page.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Job title</Label>
            <Input value={form.title} maxLength={160} onChange={(e) => set('title', e.target.value)} />
          </div>
          <CustomSelect label="Role" value={form.roleAppliedFor} onValueChange={(x) => set('roleAppliedFor', x)} items={detail.roles.map((r) => ({ label: r.label, value: r.value }))} />
          <CustomSelect
            label="Branch"
            value={form.branchId ?? ''}
            onValueChange={(x) => set('branchId', x || null)}
            items={[{ label: 'Any / main campus', value: '' }, ...detail.branches.map((b) => ({ label: b.name, value: b.id }))]}
          />
          <CustomSelect
            label="Employment type"
            value={form.employmentType ?? ''}
            onValueChange={(x) => set('employmentType', x || null)}
            items={[
              { label: 'Not stated', value: '' },
              { label: 'Full-time', value: 'Full-time' },
              { label: 'Part-time', value: 'Part-time' },
              { label: 'Contract', value: 'Contract' },
              { label: 'Internship', value: 'Internship' },
            ]}
          />
          <div className="space-y-1.5">
            <Label>Closing date</Label>
            <DateField value={form.closingDate ?? ''} onChange={(x) => set('closingDate', x || null)} placeholder="No closing date" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>About the job</Label>
            <Textarea rows={4} value={form.description ?? ''} maxLength={8000} onChange={(e) => set('description', e.target.value)} placeholder="What the person will do, the classes or subjects, who they report to…" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Requirements</Label>
            <Textarea rows={4} value={form.requirements ?? ''} maxLength={8000} onChange={(e) => set('requirements', e.target.value)} placeholder={'One per line, e.g.\nB.Sc / B.Ed in Mathematics\nAt least 2 years teaching experience\nTRCN registration'} />
          </div>
        </div>
      </Section>

      <Section title="Application form" hint="Name, email, phone and CV are always asked. Add your own questions below.">
        <QuestionsEditor value={form.questions} onChange={(q) => set('questions', q)} />
      </Section>

      <Section title="Steps" hint="Use what suits you. You can hire a candidate at any stage, even straight after they apply.">
        <div className="grid gap-3 sm:grid-cols-2">
          <StepToggle icon={MonitorPlay} title="CBT test" text="Candidates sit a timed computer-based test at your school, on a phone or computer. Objective answers mark themselves." on={form.useTest} onChange={(x) => set('useTest', x)} />
          <StepToggle icon={Users} title="Interview" text="Your panel scores each candidate on the criteria below, from the school or staff portal." on={form.useInterview} onChange={(x) => set('useInterview', x)} />
        </div>
        {(form.useTest || form.useInterview) && (
          <div className="mt-4 grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
            {both && (
              <div className="space-y-2 sm:col-span-2">
                <Label>How the total is worked out</Label>
                <div className="flex items-center gap-3">
                  <span className="w-28 text-xs text-muted-foreground">CBT {Math.round((form.testWeight / weightTotal) * 100)}%</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round((form.testWeight / weightTotal) * 100)}
                    onChange={(e) => {
                      const t = Number(e.target.value)
                      setForm((f) => ({ ...f, testWeight: t, interviewWeight: 100 - t }))
                    }}
                    className="h-2 flex-1 cursor-pointer accent-primary"
                    aria-label="CBT weight"
                  />
                  <span className="w-28 text-right text-xs text-muted-foreground">Interview {Math.round((form.interviewWeight / weightTotal) * 100)}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">If a candidate skips a step, their total is worked out from the step they did.</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Pass mark (total)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={100} className="w-24" value={form.passMark} onChange={(e) => set('passMark', Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">You can still pass or fail anyone yourself on the Results tab.</p>
            </div>
          </div>
        )}
      </Section>

      {form.useInterview && (
        <Section title="Interview" hint={`Marks for each criterion, out of ${criteriaMax} in all. Each panel member scores on their own; Schola averages them.`}>
          <CriteriaEditor value={form.interviewCriteria} onChange={(c) => set('interviewCriteria', c)} />
          <div className="mt-5">
            <Label>Interview panel</Label>
            <p className="mb-2 text-xs text-muted-foreground">Staff on the panel score candidates from “Interviews” in their staff portal. You can also score here.</p>
            <PanelPicker staff={detail.staff} value={form.panelStaffIds} onChange={(ids) => set('panelStaffIds', ids)} />
          </div>
        </Section>
      )}

      <div
        className={cn(
          'fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-3 rounded-full border bg-background/95 px-4 py-2 shadow-xl backdrop-blur transition-all',
          dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
        )}
      >
        <span className="text-sm text-muted-foreground">Unsaved changes</span>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setForm(pick(v))}>
          <RotateCcw className="size-3.5" /> Undo
        </Button>
        <Button size="sm" className="gap-1.5 rounded-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
        </Button>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">{title}</h3>
      {hint && <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </section>
  )
}

function StepToggle({ icon: Icon, title, text, on, onChange }: { icon: typeof Users; title: string; text: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={cn('flex items-start gap-3 rounded-xl border p-4 text-left transition-all', on ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50')}
    >
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{title}</span>
          <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-muted-foreground/30')}>
            <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      </div>
    </button>
  )
}

function QuestionsEditor({ value, onChange }: { value: Array<ExtraQuestion>; onChange: (v: Array<ExtraQuestion>) => void }) {
  const update = (i: number, patch: Partial<ExtraQuestion>) => onChange(value.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  return (
    <div className="space-y-2">
      {value.map((q, i) => (
        <div key={q.id} className="flex items-center gap-2 rounded-xl border bg-muted/20 p-2">
          <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
          <Input value={q.label} maxLength={200} onChange={(e) => update(i, { label: e.target.value })} placeholder="e.g. Which subjects can you teach?" className="flex-1" />
          <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={q.required} onCheckedChange={(c) => update(i, { required: !!c })} /> Required
          </label>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove question">
            <X className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < 10 && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...value, { id: newId(), label: '', required: false }])}>
          <Plus className="size-3.5" /> Add a question
        </Button>
      )}
    </div>
  )
}

function CriteriaEditor({ value, onChange }: { value: Array<Criterion>; onChange: (v: Array<Criterion>) => void }) {
  const update = (i: number, patch: Partial<Criterion>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)))
  return (
    <div className="space-y-2">
      {value.map((c, i) => (
        <div key={c.id} className="flex items-center gap-2">
          <Input value={c.label} maxLength={80} onChange={(e) => update(i, { label: e.target.value })} placeholder="e.g. Subject knowledge" className="flex-1" />
          <div className="flex items-center gap-1.5">
            <Input type="number" min={1} max={100} value={c.max} onChange={(e) => update(i, { max: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })} className="w-20" aria-label="Marks" />
            <span className="text-xs text-muted-foreground">marks</span>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8" disabled={value.length <= 1} onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove criterion">
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < 12 && (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => onChange([...value, { id: newId(), label: '', max: 10 }])}>
          <Plus className="size-3.5" /> Add a criterion
        </Button>
      )}
    </div>
  )
}

function PanelPicker({ staff, value, onChange }: { staff: Array<{ id: string; name: string }>; value: Array<string>; onChange: (v: Array<string>) => void }) {
  const [q, setQ] = useState('')
  const chosen = useMemo(() => staff.filter((s) => value.includes(s.id)), [staff, value])
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase()
    return staff.filter((s) => !value.includes(s.id) && (!t || s.name.toLowerCase().includes(t))).slice(0, 8)
  }, [staff, value, q])
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {chosen.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-xs font-medium text-primary">
            {s.name}
            <button type="button" className="rounded-full p-0.5 hover:bg-primary/20" onClick={() => onChange(value.filter((x) => x !== s.id))} aria-label={`Remove ${s.name}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {!chosen.length && <span className="text-xs text-muted-foreground">No one yet.</span>}
      </div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add staff to the panel…" className="pl-8" />
        {q.trim() && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-lg">
            {matches.length ? (
              matches.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    onChange([...value, s.id])
                    setQ('')
                  }}
                >
                  {s.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No staff found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
