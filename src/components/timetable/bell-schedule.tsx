import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { DEFAULT_BELL_SCHEDULE, type BellScheduleDTO } from '@/hooks/api/timetable.api'
import { useApplyBellScheduleMutation } from '@/hooks/queries/timetable.queries'
import { Button } from '@/components/ui/button'
import { AppDrawer } from '@/components/ui/app-drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'

type Options = Omit<BellScheduleDTO, 'branchId'>

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Same layout the server builds: each stretch of the day is shared evenly. */
function preview(o: Options): { rows: Array<{ label: string; start: string; end: string; isBreak: boolean }>; error?: string } {
  if (!/^\d\d:\d\d$/.test(o.startTime) || !/^\d\d:\d\d$/.test(o.endTime)) return { rows: [], error: 'Enter start and end times' }
  if (o.periodMinutes < 15 || o.periodMinutes > 120) return { rows: [], error: 'A period should be 15–120 minutes' }
  const s = toMin(o.startTime)
  const e = toMin(o.endTime)
  if (e <= s) return { rows: [], error: 'The day must end after it starts' }
  const split = (from: number, to: number, no: number) => {
    if (to - from < 10) return []
    const n = Math.max(1, Math.round((to - from) / o.periodMinutes))
    return Array.from({ length: n }, (_, i) => ({
      label: `Period ${no + i}`,
      start: toTime(from + Math.round((i * (to - from)) / n)),
      end: toTime(from + Math.round(((i + 1) * (to - from)) / n)),
      isBreak: false,
    }))
  }
  if (!o.breakAt || !o.breakMinutes) return { rows: split(s, e, 1) }
  const b = toMin(o.breakAt)
  const be = b + o.breakMinutes
  if (b <= s || be >= e) return { rows: [], error: 'The break must fall inside the school day' }
  const before = split(s, b, 1)
  return { rows: [...before, { label: 'Break', start: toTime(b), end: toTime(be), isBreak: true }, ...split(be, e, before.length + 1)] }
}

/**
 * Lay out the school day in one go. Starts from the default (8:00–14:00,
 * break at 10:00); the school can change any of it.
 */
export function BellScheduleButton({ branchId }: { branchId: string }) {
  const [open, setOpen] = useState(false)
  const [o, setO] = useState<Options>(DEFAULT_BELL_SCHEDULE)
  const apply = useApplyBellScheduleMutation()
  useEffect(() => {
    if (open) setO(DEFAULT_BELL_SCHEDULE)
  }, [open])
  const { rows, error } = useMemo(() => preview(o), [o])
  const set = (k: keyof Options, v: string | number | null) => setO((prev) => ({ ...prev, [k]: v }))

  const save = () =>
    apply.mutate(
      { branchId, ...o },
      {
        onSuccess: (r) => {
          toast.success(r.message)
          setOpen(false)
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || 'Could not set the bell schedule'),
      },
    )

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Clock className="size-4" /> Set up school day
      </Button>
      <AppDrawer
        open={open}
        onOpenChange={setOpen}
        title="Set up the school day"
        description="Periods are spread evenly between the times you set. Lessons already placed stay in their period."
        footer={
          <>
            <Button onClick={save} disabled={!!error || apply.isPending}>
              {apply.isPending ? 'Saving...' : 'Use this bell schedule'}
            </Button>
            <Button variant="outline" onClick={() => setO(DEFAULT_BELL_SCHEDULE)}>
              Back to default
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="School starts">
            <Input type="time" value={o.startTime} onChange={(e) => set('startTime', e.target.value)} />
          </Field>
          <Field label="School ends">
            <Input type="time" value={o.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </Field>
          <Field label="Break starts">
            <Input type="time" value={o.breakAt || ''} onChange={(e) => set('breakAt', e.target.value || null)} />
          </Field>
          <Field label="Break length (minutes)">
            <Input type="number" min={0} max={120} value={o.breakMinutes} onChange={(e) => set('breakMinutes', Number(e.target.value) || 0)} />
          </Field>
          <Field label="Period length (minutes)">
            <Input type="number" min={15} max={120} value={o.periodMinutes} onChange={(e) => set('periodMinutes', Number(e.target.value) || 0)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Leave “Break starts” empty for no break. Add assembly, sports or clubs afterwards with “Add period”.</p>

        <div className="mt-5 rounded-lg border">
          <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">Preview</div>
          {error ? (
            <p className="p-3 text-sm text-destructive">{error}</p>
          ) : (
            <ul className="divide-y text-sm">
              {rows.map((r) => (
                <li key={r.label + r.start} className={`flex justify-between px-3 py-1.5 ${r.isBreak ? 'bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' : ''}`}>
                  <span>{r.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.start} – {r.end} · {toMin(r.end) - toMin(r.start)} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppDrawer>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
