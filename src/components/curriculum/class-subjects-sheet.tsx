import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, Search } from 'lucide-react'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  LEVEL_LABEL,
  levelKey,
  sortClasses,
  useAllClasses,
  useAllStaff,
  useAllSubjects,
  useClassSubjects,
  useSetClassSubjects,
  type LevelKey,
} from '@/hooks/queries/curriculum.queries'

const fieldSelect =
  'h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

/**
 * Pick a class's subjects in one go: tick all / some, choose each subject's
 * teacher, and optionally give the same subjects to other classes.
 */
export function ClassSubjectsSheet({ classId, onClose }: { classId: string | null; onClose: () => void }) {
  const { data, isLoading } = useClassSubjects(classId)
  const { data: allSubjects = [] } = useAllSubjects()
  const { data: allClasses = [] } = useAllClasses()
  const { data: staff = [] } = useAllStaff()
  const save = useSetClassSubjects()

  const cls = data?.class
  const classLevel: LevelKey | null = cls ? cls.levelKey || levelKey(cls.level, cls.name) : null

  // subjectId → teacher id ('' = no teacher yet)
  const [picked, setPicked] = useState<Map<string, string>>(new Map())
  const [onlyLevel, setOnlyLevel] = useState(true)
  const [search, setSearch] = useState('')
  const [also, setAlso] = useState<Set<string>>(new Set())
  const [copyTeachers, setCopyTeachers] = useState(true)

  // Load the class's current subjects.
  useEffect(() => {
    if (!data) return
    setPicked(new Map(data.subjects.map((s) => [s.subjectId, s.teacher?.id || ''])))
    setSearch('')
    setAlso(new Set())
    setCopyTeachers(true)
  }, [data])

  const branchSubjects = useMemo(
    () => allSubjects.filter((s) => s.branchId === cls?.branchId).sort((a, b) => a.name.localeCompare(b.name)),
    [allSubjects, cls?.branchId],
  )
  const hasLevelTags = branchSubjects.some((s) => s.levels?.length)
  const levelFilterOn = onlyLevel && !!classLevel && hasLevelTags
  const q = search.trim().toLowerCase()
  const visible = branchSubjects.filter(
    (s) =>
      (!levelFilterOn || !s.levels?.length || s.levels.includes(classLevel) || picked.has(s.id)) &&
      (!q || s.name.toLowerCase().includes(q)),
  )
  const allVisiblePicked = visible.length > 0 && visible.every((s) => picked.has(s.id))
  const removed = (data?.subjects || []).filter((s) => !picked.has(s.subjectId))

  const toggle = (id: string, on: boolean) =>
    setPicked((cur) => {
      const next = new Map(cur)
      if (on) next.set(id, cur.get(id) ?? '')
      else next.delete(id)
      return next
    })
  const toggleAllVisible = (on: boolean) =>
    setPicked((cur) => {
      const next = new Map(cur)
      for (const s of visible) on ? next.set(s.id, cur.get(s.id) ?? '') : next.delete(s.id)
      return next
    })

  const otherClasses = sortClasses(allClasses.filter((c) => c.id !== classId))
  const sameLevel = otherClasses.filter((c) => classLevel && levelKey(c.level, c.name) === classLevel)

  const submit = async () => {
    if (!classId) return
    try {
      const res = await save.mutateAsync({
        classId,
        subjects: [...picked].map(([subjectId, staffId]) => ({ subjectId, staffId: staffId || null })),
        alsoClassIds: [...also],
        copyTeachers,
      })
      toast.success(res.message || 'Subjects saved')
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the subjects')
    }
  }

  return (
    <Sheet open={!!classId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle>{cls ? `${cls.name} subjects` : 'Class subjects'}</SheetTitle>
          <SheetDescription>Tick the subjects this class offers and choose who teaches each one.</SheetDescription>
        </SheetHeader>

        {isLoading || !cls ? (
          <Loader2 className="mx-auto mt-10 size-5 animate-spin text-primary" />
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            {/* Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search subjects" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {classLevel && hasLevelTags && (
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[true, false].map((only) => (
                    <button
                      key={String(only)}
                      type="button"
                      onClick={() => setOnlyLevel(only)}
                      className={cn(
                        'rounded-full border px-3 py-1',
                        onlyLevel === only ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {only ? `${LEVEL_LABEL[classLevel]} subjects` : 'All subjects'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subject list */}
            <section className="rounded-lg border">
              <label className="flex items-center gap-3 border-b bg-muted/40 px-3 py-2.5 text-sm font-medium">
                <Checkbox checked={allVisiblePicked} onCheckedChange={(v) => toggleAllVisible(v === true)} />
                <span className="flex-1">Select all{q || levelFilterOn ? ' shown' : ''}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {picked.size} selected
                </span>
              </label>
              {branchSubjects.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No subjects yet. Add subjects (or the default Nigerian subjects) on the Subjects page first.
                </p>
              ) : visible.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No subjects match.</p>
              ) : (
                <ul className="divide-y">
                  {visible.map((s) => {
                    const on = picked.has(s.id)
                    return (
                      <li key={s.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                        <label className="flex min-w-0 flex-1 items-center gap-3 text-sm">
                          <Checkbox checked={on} onCheckedChange={(v) => toggle(s.id, v === true)} />
                          <span className={cn('truncate', !on && 'text-muted-foreground')}>{s.name}</span>
                        </label>
                        {on && (
                          <select
                            aria-label={`Teacher for ${s.name}`}
                            className={cn(fieldSelect, 'sm:w-52')}
                            value={picked.get(s.id) || ''}
                            onChange={(e) => setPicked((cur) => new Map(cur).set(s.id, e.target.value))}
                          >
                            <option value="">No teacher yet</option>
                            {staff.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.fullname}
                              </option>
                            ))}
                          </select>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            {removed.length > 0 && (
              <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  Saving removes {removed.map((r) => r.name).join(', ')} from {cls.name}. Scores already entered are kept.
                </span>
              </div>
            )}

            {/* Copy to other classes */}
            {otherClasses.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Also give these subjects to</div>
                    <p className="text-xs text-muted-foreground">Their other subjects are kept.</p>
                  </div>
                  {sameLevel.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAlso((cur) =>
                          sameLevel.every((c) => cur.has(c.id))
                            ? new Set([...cur].filter((id) => !sameLevel.some((c) => c.id === id)))
                            : new Set([...cur, ...sameLevel.map((c) => c.id)]),
                        )
                      }
                    >
                      {sameLevel.every((c) => also.has(c.id)) ? 'Clear' : `All ${classLevel ? LEVEL_LABEL[classLevel] : ''}`}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg border p-3 sm:grid-cols-3">
                  {otherClasses.map((c) => (
                    <label key={c.id} className="flex min-w-0 items-center gap-2 text-sm">
                      <Checkbox
                        checked={also.has(c.id)}
                        onCheckedChange={(v) =>
                          setAlso((cur) => {
                            const next = new Set(cur)
                            v === true ? next.add(c.id) : next.delete(c.id)
                            return next
                          })
                        }
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
                {also.size > 0 && (
                  <label className="flex items-start gap-2.5 text-sm">
                    <Checkbox checked={copyTeachers} onCheckedChange={(v) => setCopyTeachers(v === true)} className="mt-0.5" />
                    <span>
                      Use the same teachers there
                      <span className="block text-xs text-muted-foreground">
                        Untick if those classes have different teachers (e.g. a separate senior-school maths teacher).
                      </span>
                    </span>
                  </label>
                )}
              </section>
            )}
          </div>
        )}

        <SheetFooter className="flex-row gap-2 border-t px-4 py-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={submit} disabled={save.isPending || !cls}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save{also.size ? ` for ${also.size + 1} classes` : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
