import { useState } from 'react'
import type {
  WeekDay,
  TimetableEntry,
  TimetablePeriod,
} from '@/hooks/api/timetable.api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TimetableEntryDrawer } from './timetable-cell-editor'

const DAYS: Array<WeekDay> = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
]

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

interface TimetableGridProps {
  periods: Array<TimetablePeriod>
  timetable: Record<WeekDay, Array<TimetableEntry | null>> | undefined
  subjects: Array<{ id: string; name: string }>
  staffs: Array<{ id: string; fullname: string }>
  classId: string
  isFetching: boolean
  onEntrySaved: () => void
  readOnly?: boolean
  viewType?: 'CLASS' | 'TEACHER'
}

export function TimetableGrid({
  periods,
  timetable,
  subjects,
  staffs,
  classId,
  isFetching,
  onEntrySaved,
  readOnly = false,
  viewType = 'CLASS',
}: TimetableGridProps) {
  const [drawerState, setDrawerState] = useState<{
    open: boolean
    day: WeekDay
    periodId: string
    periodLabel: string
    entry: TimetableEntry | null
  }>({
    open: false,
    day: 'MONDAY',
    periodId: '',
    periodLabel: '',
    entry: null,
  })

  const openDrawer = (
    day: WeekDay,
    period: TimetablePeriod,
    entry: TimetableEntry | null,
  ) => {
    if (period.isBreak || readOnly) return
    setDrawerState({
      open: true,
      day,
      periodId: period.id,
      periodLabel: period.label,
      entry,
    })
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/50 sticky left-0 z-10 w-[80px] border-r font-semibold">
                  Day
                </TableHead>
                {periods.map((period) => (
                  <TableHead
                    key={period.id}
                    className={`min-w-[140px] text-center ${
                      period.isBreak ? 'bg-amber-50 dark:bg-amber-950/30' : ''
                    }`}
                  >
                    <div className="font-semibold">{period.label}</div>
                    <div className="text-muted-foreground text-[10px] font-normal">
                      {period.startTime} – {period.endTime}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((day) => {
                let skipPeriods = 0;
                return (
                <TableRow key={day}>
                  <TableCell className="bg-muted/50 sticky left-0 z-10 border-r font-semibold">
                    {DAY_LABELS[day]}
                  </TableCell>
                  {periods.map((period, periodIdx) => {
                    if (skipPeriods > 0) {
                      skipPeriods--;
                      return null;
                    }

                    const entry = timetable?.[day][periodIdx] || null

                    if (period.isBreak) {
                      return (
                        <TableCell
                          key={period.id}
                          className="bg-amber-50/50 text-center dark:bg-amber-950/20"
                        >
                          <span className="text-amber-600/70 text-xs italic">
                            Break
                          </span>
                        </TableCell>
                      )
                    }

                    let colSpan = 1;
                    if (entry?.subject) {
                      for (let j = periodIdx + 1; j < periods.length; j++) {
                        if (periods[j].isBreak) break;
                        const nextEntry = timetable?.[day][j];
                        if (
                          nextEntry?.subject?.id === entry.subject.id &&
                          nextEntry.staff?.id === entry.staff?.id
                        ) {
                          colSpan++;
                          skipPeriods++;
                        } else {
                          break;
                        }
                      }
                    }

                    const isSport = entry?.isSport;

                    return (
                      <TableCell
                        key={period.id}
                        colSpan={colSpan}
                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${colSpan > 1 ? 'border-x-2 border-primary/20 bg-primary/5 dark:bg-primary/10' : ''}`}
                        onClick={() => openDrawer(day, period, entry)}
                      >
                        {entry?.subject ? (
                          <div className="space-y-0.5 text-center">
                            <div className="text-sm font-medium flex items-center justify-center gap-1">
                              {isSport && <span>⚽</span>}
                              {entry.subject.name}
                            </div>
                            {viewType === 'CLASS' && entry.staff && (
                              <div className="text-muted-foreground text-[11px]">
                                {entry.staff.fullname}
                              </div>
                            )}
                            {viewType === 'TEACHER' && entry.class && (
                              <div className="text-muted-foreground text-[11px]">
                                {entry.class.name}
                              </div>
                            )}
                          </div>
                        ) : isSport ? (
                          <div className="text-muted-foreground bg-primary/5 flex h-full min-h-[3rem] items-center justify-center gap-1 rounded-md border border-dashed border-primary/20 text-xs italic">
                            <span>⚽</span> Sport
                          </div>
                        ) : (
                          <div className="text-muted-foreground bg-muted/30 flex h-full min-h-[3rem] items-center justify-center rounded-md border border-dashed text-xs italic">
                            Free Period
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
        {isFetching && (
          <div className="bg-muted/50 border-t px-4 py-2 text-center">
            <span className="text-muted-foreground text-xs">Refreshing...</span>
          </div>
        )}
      </div>

      {/* Entry editing drawer */}
      <TimetableEntryDrawer
        open={drawerState.open}
        onOpenChange={(open) => setDrawerState({ ...drawerState, open })}
        classId={classId}
        periodId={drawerState.periodId}
        periodLabel={drawerState.periodLabel}
        day={drawerState.day}
        existingEntryId={drawerState.entry?.id}
        existingSubjectId={drawerState.entry?.subject?.id}
        existingStaffId={drawerState.entry?.staff?.id}
        existingIsSport={drawerState.entry?.isSport}
        subjects={subjects}
        staffs={staffs}
        onSaved={onEntrySaved}
      />
    </>
  )
}
