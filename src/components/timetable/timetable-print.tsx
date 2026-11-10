import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Download, Loader2 } from 'lucide-react'
import {
  isFreePeriod,
  timetableApi,
  type TimetableEntry,
  type TimetableOverview,
  type TimetablePeriod,
  type WeekDay,
} from '@/hooks/api/timetable.api'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { printA4 } from '@/lib/print-a4'
import { toast } from '@/lib/toast'

const DAYS: Array<WeekDay> = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_NAMES: Record<string, string> = { MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday', FRIDAY: 'Friday' }

const isTeaching = (p: TimetablePeriod) => !p.isBreak && (!p.periodType || p.periodType === 'ACADEMIC')

/** One timetable laid out for paper: days down the side, periods across. */
export function PrintSheet({
  school,
  branchName,
  heading,
  periods,
  timetable,
  by,
}: {
  school: TimetableOverview['school']
  branchName: string
  heading: string
  periods: Array<TimetablePeriod>
  timetable: Record<WeekDay, Array<TimetableEntry | null>>
  by: 'class' | 'teacher'
}) {
  return (
    <div className="bg-white p-2 font-sans text-black">
      <div className="mb-3 flex items-center gap-3 border-b-2 border-black pb-2">
        {school?.logo && <img src={school.logo} alt="" className="size-12 object-contain" />}
        <div className="flex-1">
          <div className="text-lg font-black uppercase tracking-wide">{school?.schoolName}</div>
          <div className="text-xs text-gray-600">{branchName}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold">{heading}</div>
          <div className="text-xs text-gray-600">{by === 'class' ? 'Class timetable' : 'Teacher timetable'}</div>
        </div>
      </div>
      <table className="w-full table-fixed border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-20 border border-black p-1 text-left">Day</th>
            {periods.map((p) => (
              <th key={p.id} className={`border border-black p-1 text-center ${isTeaching(p) ? '' : 'w-16 bg-gray-300 text-[9px] break-words'}`}>
                <div className="font-bold">{p.label}</div>
                <div className="font-normal text-gray-700">
                  {p.startTime}–{p.endTime}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, d) => (
            <tr key={day} className="h-20">
              <td className="border border-black bg-gray-100 p-1 font-bold">{DAY_NAMES[day]}</td>
              {periods.map((p, i) => {
                if (!isTeaching(p)) {
                  // One tall cell for the break / assembly down the whole week.
                  return d === 0 ? (
                    <td key={p.id} rowSpan={DAYS.length} className="border border-black bg-gray-100 p-1 text-center align-middle">
                      <span
                        className="mx-auto inline-block max-h-[22rem] overflow-hidden text-[10px] font-bold uppercase tracking-widest"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {p.globalActivityName || p.label}
                      </span>
                    </td>
                  ) : null
                }
                const e = timetable[day][i]
                return (
                  <td key={p.id} className="border border-black p-1 text-center align-middle leading-tight">
                    {e?.subject ? (
                      <>
                        <div className="font-semibold">{e.subject.name}</div>
                        <div className="text-[10px] text-gray-700">{by === 'class' ? e.staff?.fullname || '' : e.class?.name || ''}</div>
                        {e.note && <div className="text-[9px] text-gray-500">{e.note}</div>}
                      </>
                    ) : isFreePeriod(e) ? (
                      <span className="italic text-gray-500">Free</span>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

type Job = { data: TimetableOverview; by: 'class' | 'teacher'; title: string }

/**
 * "Download PDF" menu: the class or teacher on screen, every class, or every
 * teacher — one A4 landscape page each.
 */
export function TimetableDownloadMenu({
  branchId,
  current,
}: {
  branchId: string
  /** What is on screen now, if anything. */
  current?: { by: 'class' | 'teacher'; id: string; name: string }
}) {
  const [busy, setBusy] = useState(false)
  const [job, setJob] = useState<Job | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  const run = async (by: 'class' | 'teacher', only?: { id: string; name: string }) => {
    setBusy(true)
    try {
      const data = await timetableApi.getOverview(branchId, by)
      const items = only ? data.items.filter((x) => x.id === only.id) : data.items
      if (only && !items.length) items.push({ id: only.id, name: only.name, timetable: emptyWeek(data.periods) })
      if (!items.length) {
        toast.error(by === 'class' ? 'No classes in this branch yet.' : 'No teacher has lessons on the timetable yet.')
        return
      }
      const title = only
        ? `Timetable - ${only.name}`
        : `Timetable - ${by === 'class' ? 'all classes' : 'all teachers'} - ${data.branch.name}`
      setJob({ data: { ...data, items }, by, title })
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not load the timetable')
    } finally {
      setBusy(false)
    }
  }

  // Once the sheets are on the page, send them to print (one page each).
  useEffect(() => {
    if (!job || !boxRef.current) return
    const pages = Array.from(boxRef.current.children) as Array<HTMLElement>
    printA4(pages, { landscape: true, title: job.title })
  }, [job])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Download PDF
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {current && (
            <>
              <DropdownMenuItem onClick={() => run(current.by, current)}>
                This {current.by === 'class' ? 'class' : 'teacher'}: {current.name}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => run('class')}>Whole timetable (every class)</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('teacher')}>Every teacher’s timetable</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Off-screen sheets that get copied into the printout. */}
      {job && (
        <div aria-hidden className="pointer-events-none fixed top-0 -left-[20000px] w-[1100px]">
          <div ref={boxRef}>
            {job.data.items.map((item) => (
              <PrintSheet
                key={item.id}
                school={job.data.school}
                branchName={job.data.branch.name}
                heading={item.name}
                periods={job.data.periods}
                timetable={item.timetable}
                by={job.by}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function emptyWeek(periods: Array<TimetablePeriod>) {
  const week = {} as Record<WeekDay, Array<TimetableEntry | null>>
  for (const d of [...DAYS, 'SATURDAY', 'SUNDAY'] as Array<WeekDay>) week[d] = periods.map(() => null)
  return week
}
