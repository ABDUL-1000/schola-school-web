import { useMemo, useState } from 'react'
import { BookOpen, Loader2, Plus, Search, X } from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  LEVELS,
  levelKey,
  sortClasses,
  useAllClasses,
  useAllSubjects,
  useAssignTeaching,
  useSetFormClass,
  useStaffTeaching,
  useUnassignTeaching,
  type LevelKey,
} from '@/hooks/queries/curriculum.queries'

const fieldSelect =
  'h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

/** What a teacher teaches (subjects × classes) and the class they're form master of. */
export function StaffTeachingPanel({ staffId, staffName }: { staffId: string; staffName: string }) {
  const { data, isLoading } = useStaffTeaching(staffId)
  const { data: classes = [] } = useAllClasses()
  const unassign = useUnassignTeaching(staffId)
  const setForm = useSetFormClass(staffId)
  const [assignOpen, setAssignOpen] = useState(false)

  const bySubject = useMemo(() => {
    const m = new Map<string, Array<{ id: string; className: string }>>()
    for (const a of data?.assignments || []) {
      const list = m.get(a.subject.name) || []
      list.push({ id: a.id, className: a.class.name })
      m.set(a.subject.name, list)
    }
    return [...m.entries()]
  }, [data])

  const changeFormClass = async (classId: string) => {
    const target = classes.find((c) => c.id === classId)
    const current = target?.classLeads?.[0]?.staff
    let replace = false
    if (current && current.id !== staffId) {
      if (!window.confirm(`${current.fullname} is form master of ${target.name}. Make ${staffName} form master instead?`)) return
      replace = true
    }
    try {
      const res = await setForm.mutateAsync({ classId: classId || null, replace })
      toast.success(res.message)
    } catch (e: any) {
      toast.error(e?.message || 'Could not change the form class')
    }
  }

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-4 text-primary" /> Subjects & classes
          </h3>
          <p className="text-xs text-muted-foreground">
            {data ? `${data.counts.subjects} subject${data.counts.subjects === 1 ? '' : 's'} in ${data.counts.classes} class${data.counts.classes === 1 ? '' : 'es'}` : ' '}
          </p>
        </div>
        <Button size="sm" onClick={() => setAssignOpen(true)}>
          <Plus className="mr-1.5 size-4" /> Assign subjects
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`form-class-${staffId}`}>Form master of</Label>
        <select
          id={`form-class-${staffId}`}
          className={fieldSelect}
          value={data?.formClass?.id || ''}
          disabled={!data || setForm.isPending}
          onChange={(e) => changeFormClass(e.target.value)}
        >
          <option value="">Not a form master</option>
          {sortClasses(classes).map((c) => {
            const lead = c.classLeads?.[0]?.staff
            return (
              <option key={c.id} value={c.id}>
                {c.name}
                {lead && lead.id !== staffId ? ` (now: ${lead.fullname})` : ''}
              </option>
            )
          })}
        </select>
        <p className="text-xs text-muted-foreground">A teacher can be form master of only one class.</p>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : bySubject.length === 0 ? (
        <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">No subjects assigned yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {bySubject.map(([subject, list]) => (
            <li key={subject} className="flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
              <span className="text-sm font-medium sm:w-48 sm:shrink-0">{subject}</span>
              <div className="flex flex-wrap gap-1.5">
                {list.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs text-primary">
                    {a.className}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-primary/20"
                      aria-label={`Remove ${subject} in ${a.className}`}
                      disabled={unassign.isPending}
                      onClick={() =>
                        unassign.mutate(a.id, {
                          onSuccess: () => toast.success(`${subject} in ${a.className} removed from ${staffName}`),
                          onError: (e: any) => toast.error(e?.message || 'Could not remove'),
                        })
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AssignTeachingDialog open={assignOpen} onClose={() => setAssignOpen(false)} staffId={staffId} staffName={staffName} />
    </section>
  )
}

/** Pick several subjects and several classes; the teacher teaches every pair. */
function AssignTeachingDialog({ open, onClose, staffId, staffName }: { open: boolean; onClose: () => void; staffId: string; staffName: string }) {
  const { data: subjects = [] } = useAllSubjects()
  const { data: classes = [] } = useAllClasses()
  const assign = useAssignTeaching(staffId)
  const [subjectIds, setSubjectIds] = useState<Set<string>>(new Set())
  const [classIds, setClassIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState<LevelKey | ''>('')

  // One entry per subject name (multi-branch schools list a name per branch).
  const uniqueSubjects = useMemo(() => {
    const m = new Map<string, (typeof subjects)[number]>()
    for (const s of subjects) if (!m.has(s.name.toLowerCase())) m.set(s.name.toLowerCase(), s)
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [subjects])
  const q = search.trim().toLowerCase()
  const shownSubjects = uniqueSubjects.filter(
    (s) => (!q || s.name.toLowerCase().includes(q)) && (!level || !s.levels?.length || s.levels.includes(level) || subjectIds.has(s.id)),
  )
  const groups = useMemo(() => {
    const out: Array<{ key: string; label: string; items: typeof classes }> = []
    for (const l of [...LEVELS, { key: 'OTHER' as const, label: 'Other classes' }]) {
      const items = sortClasses(classes.filter((c) => (levelKey(c.level, c.name) || 'OTHER') === l.key))
      if (items.length) out.push({ key: l.key, label: l.label, items })
    }
    return out
  }, [classes])

  const toggleIn = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set)
    on ? next.add(id) : next.delete(id)
    return next
  }
  const pairs = subjectIds.size * classIds.size

  const close = () => {
    setSubjectIds(new Set())
    setClassIds(new Set())
    setSearch('')
    onClose()
  }

  const submit = async () => {
    try {
      const res = await assign.mutateAsync({ subjectIds: [...subjectIds], classIds: [...classIds] })
      const replaced = res.data.replaced
      toast.success(
        res.message,
        replaced.length
          ? `Took over from: ${replaced.map((r) => `${r.previousTeacher} (${r.subject}, ${r.class})`).join('; ')}`
          : undefined,
      )
      close()
    } catch (e: any) {
      toast.error(e?.message || 'Could not assign')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[92vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign subjects to {staffName}</DialogTitle>
          <DialogDescription>Choose subjects and classes. {staffName} will teach each subject in each class.</DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto sm:grid-cols-2">
          {/* Subjects */}
          <section className="flex min-h-0 flex-col rounded-lg border">
            <div className="space-y-2 border-b p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search subjects" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1">
                {[{ key: '' as const, label: 'All' }, ...LEVELS].map((l) => (
                  <button
                    key={l.key || 'all'}
                    type="button"
                    onClick={() => setLevel(l.key)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px]',
                      level === l.key ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs font-medium text-muted-foreground px-3 pt-2">Subjects · {subjectIds.size} selected</div>
            <ul className="max-h-72 overflow-y-auto p-1 sm:max-h-none">
              {shownSubjects.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-muted/50">
                    <Checkbox checked={subjectIds.has(s.id)} onCheckedChange={(v) => setSubjectIds((cur) => toggleIn(cur, s.id, v === true))} />
                    {s.name}
                  </label>
                </li>
              ))}
              {shownSubjects.length === 0 && <li className="px-2 py-4 text-center text-sm text-muted-foreground">No subjects match.</li>}
            </ul>
          </section>

          {/* Classes */}
          <section className="flex min-h-0 flex-col rounded-lg border">
            <div className="border-b px-3 py-2.5 text-xs font-medium text-muted-foreground">Classes · {classIds.size} selected</div>
            <div className="max-h-72 space-y-3 overflow-y-auto p-2 sm:max-h-none">
              {groups.map((g) => {
                const all = g.items.every((c) => classIds.has(c.id))
                return (
                  <div key={g.key}>
                    <label className="flex items-center gap-2.5 px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Checkbox
                        checked={all}
                        onCheckedChange={(v) =>
                          setClassIds((cur) => {
                            const next = new Set(cur)
                            for (const c of g.items) v === true ? next.add(c.id) : next.delete(c.id)
                            return next
                          })
                        }
                      />
                      {g.label}
                    </label>
                    <div className="grid grid-cols-2 gap-x-2">
                      {g.items.map((c) => (
                        <label key={c.id} className="flex min-w-0 items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-muted/50">
                          <Checkbox checked={classIds.has(c.id)} onCheckedChange={(v) => setClassIds((cur) => toggleIn(cur, c.id, v === true))} />
                          <span className="truncate">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <p className="text-xs text-muted-foreground">
          {pairs
            ? `${subjectIds.size} subject${subjectIds.size === 1 ? '' : 's'} × ${classIds.size} class${classIds.size === 1 ? '' : 'es'}. Subjects a class doesn't have yet are added to it. Where another teacher teaches it, ${staffName} takes over.`
            : 'Pick at least one subject and one class.'}
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!pairs || assign.isPending}>
            {assign.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
