import { useEffect, useState } from 'react'
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import {
  isFreePeriod,
  timetableApi,
  type TimetableOverview,
  type TimetablePeriod,
  type WeekDay,
} from '@/hooks/api/timetable.api'
import { useSwapSlotsMutation } from '@/hooks/queries/timetable.queries'
import { Button } from '@/components/ui/button'
import { AppDrawer } from '@/components/ui/app-drawer'
import { toast } from '@/lib/toast'

const DAYS: Array<WeekDay> = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_NAME: Record<string, string> = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' }
const isTeaching = (p: TimetablePeriod) => !p.isBreak && (!p.periodType || p.periodType === 'ACADEMIC')

type Row = { classId: string; fromDay: WeekDay; fromPeriod: string; toDay: WeekDay; toPeriod: string }

const selectClass = 'h-9 w-full rounded-md border border-input bg-background px-2 text-sm'

/**
 * Fill in several swaps (class, slot ↔ slot) and apply them together. If any
 * would double-book a teacher, nothing changes and the reason is shown.
 */
export function SwapFormButton({
  branchId,
  classes,
  defaultClassId,
}: {
  branchId: string
  classes: Array<{ id: string; name: string }>
  defaultClassId?: string
}) {
  const [open, setOpen] = useState(false)
  const [overview, setOverview] = useState<TimetableOverview | null>(null)
  const [rows, setRows] = useState<Array<Row>>([])
  const swap = useSwapSlotsMutation()

  const periods = (overview?.periods || []).filter(isTeaching)
  const blankRow = (classId = defaultClassId || classes[0]?.id || ''): Row => ({
    classId,
    fromDay: 'MONDAY',
    fromPeriod: periods[0]?.id || '',
    toDay: 'MONDAY',
    toPeriod: periods[1]?.id || periods[0]?.id || '',
  })

  // Load every class's timetable so each row can show what is being swapped.
  useEffect(() => {
    if (!open) return
    setOverview(null)
    timetableApi
      .getOverview(branchId, 'class')
      .then(setOverview)
      .catch((e) => toast.error(e?.response?.data?.message || e?.message || 'Could not load the timetable'))
  }, [open, branchId])
  useEffect(() => {
    if (overview && !rows.length) setRows([blankRow()])
    // only when the timetable arrives
  }, [overview])

  const lessonAt = (classId: string, day: WeekDay, periodId: string) => {
    const item = overview?.items.find((x) => x.id === classId)
    const idx = overview?.periods.findIndex((p) => p.id === periodId) ?? -1
    const e = idx >= 0 ? item?.timetable[day][idx] : null
    if (!e) return 'Empty'
    if (isFreePeriod(e)) return 'Free period'
    return `${e.subject?.name || 'Lesson'}${e.staff ? ` (${e.staff.fullname})` : ''}`
  }

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))

  const apply = () => {
    const bad = rows.findIndex((r) => !r.classId || !r.fromPeriod || !r.toPeriod || (r.fromDay === r.toDay && r.fromPeriod === r.toPeriod))
    if (bad >= 0) return toast.error(`Swap ${bad + 1}: pick a class and two different slots`)
    swap.mutate(
      rows.map((r) => ({ classId: r.classId, from: { day: r.fromDay, periodId: r.fromPeriod }, to: { day: r.toDay, periodId: r.toPeriod } })),
      {
        onSuccess: (r) => {
          toast.success(r.message)
          setOpen(false)
          setRows([])
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Could not apply the swaps'),
      },
    )
  }

  const slotPicker = (i: number, r: Row, side: 'from' | 'to') => {
    const dayKey = side === 'from' ? 'fromDay' : 'toDay'
    const periodKey = side === 'from' ? 'fromPeriod' : 'toPeriod'
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1.5">
          <select className={selectClass} value={r[dayKey]} onChange={(e) => update(i, { [dayKey]: e.target.value as WeekDay })} aria-label={`${side} day`}>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {DAY_NAME[d]}
              </option>
            ))}
          </select>
          <select className={selectClass} value={r[periodKey]} onChange={(e) => update(i, { [periodKey]: e.target.value })} aria-label={`${side} period`}>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} · {p.startTime}
              </option>
            ))}
          </select>
        </div>
        <div className="truncate text-xs text-muted-foreground">{lessonAt(r.classId, r[dayKey], r[periodKey])}</div>
      </div>
    )
  }

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <ArrowLeftRight className="size-4" /> Swap form
      </Button>
      <AppDrawer
        open={open}
        onOpenChange={setOpen}
        title="Swap lessons"
        description="Add each swap you want, then apply them all at once. The two slots in each row trade places."
        footer={
          <>
            <Button onClick={apply} disabled={swap.isPending || !overview || !rows.length}>
              {swap.isPending ? 'Applying...' : `Apply ${rows.length} swap${rows.length === 1 ? '' : 's'}`}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </>
        }
      >
        {!overview ? (
          <p className="text-sm text-muted-foreground">Loading timetable…</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Swap {i + 1}</span>
                  <select className={`${selectClass} flex-1`} value={r.classId} onChange={(e) => update(i, { classId: e.target.value })} aria-label="Class">
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 shrink-0"
                    aria-label={`Remove swap ${i + 1}`}
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="grid items-start gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  {slotPicker(i, r, 'from')}
                  <ArrowLeftRight className="mx-auto mt-2 size-4 text-muted-foreground" />
                  {slotPicker(i, r, 'to')}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRows((rs) => [...rs, blankRow(rs[rs.length - 1]?.classId)])}>
              <Plus className="size-4" /> Add another swap
            </Button>
          </div>
        )}
      </AppDrawer>
    </>
  )
}
