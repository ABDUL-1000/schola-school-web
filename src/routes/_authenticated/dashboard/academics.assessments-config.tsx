import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useAssessmentConfigQuery,
  useTermAssessmentConfigsQuery,
  useUpsertAssessmentConfigMutation,
} from '@/hooks/queries/assessment.queries'

export const Route = createFileRoute('/_authenticated/dashboard/academics/assessments-config')({
  component: AssessmentsConfigRoute,
})

type ComponentType = 'CA' | 'EXAM'
type Component = { name: string; maxScore: number | string; type: ComponentType }
type Scope = 'all' | 'one'

/** Every school starts with CA 1 + CA 2 + Exam. */
const DEFAULT_COMPONENTS: Array<Component> = [
  { name: 'CA 1', maxScore: 20, type: 'CA' },
  { name: 'CA 2', maxScore: 20, type: 'CA' },
  { name: 'Exam', maxScore: 60, type: 'EXAM' },
]
const MAX_CAS = 4

/** Older saved setups have no type: anything called "...exam..." is the exam. */
const withTypes = (list: Array<Partial<Component>> | null | undefined): Array<Component> | null =>
  list && list.length
    ? list.map((c) => ({
        name: String(c.name ?? ''),
        maxScore: c.maxScore ?? 0,
        type: c.type === 'EXAM' || c.type === 'CA' ? c.type : /exam/i.test(String(c.name ?? '')) ? 'EXAM' : 'CA',
      }))
    : null

const selectClass =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

/** Stable fingerprint of a setup, to compare subjects. */
const signature = (c: Array<Component>) =>
  JSON.stringify((withTypes(c) || []).map((x) => [String(x.name).trim().toLowerCase(), Number(x.maxScore), x.type]))

function AssessmentsConfigRoute() {
  const [scope, setScope] = useState<Scope>('all')
  const [termId, setTermId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [allTerms, setAllTerms] = useState(false)
  const [components, setComponents] = useState<Array<Component>>([])

  const { data: sessions } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => (await api.get('/school/academic/sessions')).data?.data,
  })
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/school/subject', { params: { limit: 500 } })
      return (data?.data?.subjects || data?.data || []) as Array<{ id: string; name: string; branch?: { name?: string } }>
    },
  })
  const subjects = subjectsData || []
  const terms: Array<{ id: string; name: string; sessionName: string }> = (sessions || []).flatMap((s: any) =>
    (s.terms || []).map((t: any) => ({ id: t.id, name: t.name, sessionName: s.name })),
  )
  const term = terms.find((t) => t.id === termId)

  // Pick the current/first term automatically so the page is usable straight away.
  useEffect(() => {
    if (!termId && terms.length) {
      const now = Date.now()
      const all = (sessions || []).flatMap((s: any) => s.terms || [])
      // The school's current term, else the one containing today.
      const current = all.find((t: any) => t.isCurrent) || all.find((t: any) => +new Date(t.startDate) <= now && now <= +new Date(t.endDate))
      setTermId(current?.id || terms[0].id)
    }
  }, [terms.length])

  const { data: termData, isLoading: termLoading } = useTermAssessmentConfigsQuery(termId)
  const termConfigs = termData?.configs || []
  const schoolDefault = withTypes(termData?.schoolDefault)
  const { data: subjectConfig, isLoading: subjectLoading } = useAssessmentConfigQuery(scope === 'one' ? termId : '', subjectId)
  const upsert = useUpsertAssessmentConfigMutation()

  // The setup most subjects already use this term (used to prefill "All subjects").
  const common = useMemo(() => {
    const counts = new Map<string, { n: number; components: Array<Component> }>()
    for (const c of termConfigs) {
      const comps = c.components as Array<Component>
      const key = signature(comps)
      counts.set(key, { n: (counts.get(key)?.n || 0) + 1, components: comps })
    }
    return [...counts.values()].sort((a, b) => b.n - a.n).at(0)?.components ?? null
  }, [termConfigs])

  const configBySubject = useMemo(() => new Map(termConfigs.map((c: any) => [c.subjectId, c.components as Array<Component>])), [termConfigs])

  useEffect(() => {
    // "All subjects" starts from the school's saved setup (default CA 1/CA 2/Exam).
    if (scope === 'all') setComponents(schoolDefault || withTypes(common) || DEFAULT_COMPONENTS)
  }, [scope, termData, termId])

  useEffect(() => {
    if (scope === 'one')
      setComponents(subjectId ? withTypes(subjectConfig?.components) || schoolDefault || DEFAULT_COMPONENTS : [])
  }, [scope, subjectId, subjectConfig, termData])

  const total = components.reduce((acc, c) => acc + (Number(c.maxScore) || 0), 0)
  const currentSig = signature(components)
  const differing = subjects.filter((s) => {
    const cfg = configBySubject.get(s.id)
    return !cfg || signature(cfg) !== currentSig
  }).length

  const update = (i: number, field: keyof Component, value: string) =>
    setComponents((cur) => cur.map((c, j) => (j === i ? { ...c, [field]: value } : c)))
  // Only one component can be the exam: choosing a new one turns the old one into a CA.
  const setType = (i: number, type: ComponentType) =>
    setComponents((cur) => cur.map((c, j) => (j === i ? { ...c, type } : type === 'EXAM' && c.type === 'EXAM' ? { ...c, type: 'CA' } : c)))
  const caCount = components.filter((c) => c.type === 'CA').length
  const examCount = components.filter((c) => c.type === 'EXAM').length
  const problem =
    examCount === 0
      ? 'Mark one component as the Exam.'
      : examCount > 1
        ? 'Only one component can be the Exam.'
        : caCount > MAX_CAS
          ? `You can have at most ${MAX_CAS} CAs plus the exam.`
          : components.some((c) => !(Number(c.maxScore) > 0))
            ? 'Every component needs a max score above 0.'
            : ''

  const save = async () => {
    if (components.some((c) => !String(c.name).trim())) return toast.error('Give every component a name.')
    if (problem) return toast.error(problem)
    if (total !== 100) return toast.error(`The total must be exactly 100. It is ${total} now.`)
    try {
      const res = await upsert.mutateAsync({
        termId,
        data: {
          ...(scope === 'all' ? { allSubjects: true } : { subjectId }),
          allTermsInSession: allTerms,
          components: components.map((c) => ({ name: String(c.name).trim(), maxScore: Number(c.maxScore), type: c.type })),
        },
      })
      toast.success(res.message || 'Assessment setup saved')
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the assessment setup.')
    }
  }

  const ready = !!termId && (scope === 'all' || !!subjectId)
  const loading = scope === 'all' ? termLoading : subjectLoading

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assessment Configuration</h1>
        <p className="mt-1 text-muted-foreground">
          Set how many CAs and exams make up a subject's 100 marks. Set it once for every subject, then change any subject that is different.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What are you setting up?</CardTitle>
          <CardDescription>Most schools use one setup for all subjects.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: 'all', title: 'All subjects', text: 'One setup applied to every subject.' },
                { value: 'one', title: 'One subject', text: 'A different setup for a single subject.' },
              ] as Array<{ value: Scope; title: string; text: string }>
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setScope(o.value)}
                className={cn(
                  'rounded-lg border p-4 text-left transition-colors',
                  scope === o.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50',
                )}
              >
                <div className="font-medium">{o.title}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{o.text}</div>
              </button>
            ))}
          </div>

          <div className={cn('grid gap-4', scope === 'one' && 'sm:grid-cols-2')}>
            <div className="space-y-2">
              <Label>Term</Label>
              <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
                <option value="" disabled>
                  {terms.length ? 'Select term' : 'Create an academic session first'}
                </option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.sessionName}
                  </option>
                ))}
              </select>
            </div>
            {scope === 'one' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <select className={selectClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="" disabled>
                    Select subject
                  </option>
                  {subjects.map((s) => {
                    const cfg = configBySubject.get(s.id)
                    const custom = cfg && common && signature(cfg) !== signature(common)
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.branch?.name ? ` (${s.branch.name})` : ''}
                        {custom ? ' · custom' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
          </div>

          {term && (
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox checked={allTerms} onCheckedChange={(v) => setAllTerms(v === true)} className="mt-0.5" />
              <span>
                Use this for every term in {term.sessionName}
                <span className="block text-xs text-muted-foreground">Otherwise it only applies to {term.name}.</span>
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      {ready && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Grading components</CardTitle>
                <CardDescription>CAs and exams. The total must be 100.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() =>
                  setComponents((c) => {
                    // New components are CAs, added before the exam.
                    const next = { name: `CA ${c.filter((x) => x.type === 'CA').length + 1}`, maxScore: 0, type: 'CA' as const }
                    const examAt = c.findIndex((x) => x.type === 'EXAM')
                    return examAt < 0 ? [...c, next] : [...c.slice(0, examAt), next, ...c.slice(examAt)]
                  })
                }
                disabled={caCount >= MAX_CAS}>
                <Plus className="mr-2 size-4" /> Add component
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {components.map((comp, i) => (
                  <div key={i} className="flex items-end gap-3 rounded-lg border bg-muted/40 p-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input value={comp.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="e.g. CA 1, Mid-term, Exam" />
                    </div>
                    <div className="w-[88px] space-y-1">
                      <Label className="text-xs">Type</Label>
                      <select
                        className={selectClass + ' h-9 px-2'}
                        value={comp.type}
                        onChange={(e) => setType(i, e.target.value as ComponentType)}
                        aria-label="Component type"
                      >
                        <option value="CA">CA</option>
                        <option value="EXAM">Exam</option>
                      </select>
                    </div>
                    <div className="w-20 space-y-1 sm:w-28">
                      <Label className="text-xs">Max score</Label>
                      <Input type="number" min={0} value={comp.maxScore} onChange={(e) => update(i, 'maxScore', e.target.value)} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/90"
                      onClick={() => setComponents((c) => c.filter((_, j) => j !== i))}
                      aria-label="Remove component"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}

                <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      Total: <span className={total === 100 ? 'text-green-600' : 'text-destructive'}>{total} / 100</span>
                    </div>
                    {problem && <p className="text-xs text-destructive">{problem}</p>}
                    {scope === 'all' && subjects.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {differing === 0
                          ? `All ${subjects.length} subjects already use this setup.`
                          : `Saving updates ${subjects.length} subject${subjects.length === 1 ? '' : 's'}, including ${differing} with a different or no setup.`}
                      </p>
                    )}
                  </div>
                  <Button onClick={save} disabled={upsert.isPending || !components.length}>
                    {upsert.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {scope === 'all' ? 'Save for all subjects' : 'Save for this subject'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
