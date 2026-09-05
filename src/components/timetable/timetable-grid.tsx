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

  const isNonAcademic = (period: TimetablePeriod) => {
    return (
      period.isBreak ||
      (period.periodType && period.periodType !== 'ACADEMIC')
    )
  }

  const openDrawer = (
    day: WeekDay,
    period: TimetablePeriod,
    entry: TimetableEntry | null,
  ) => {
    if (isNonAcademic(period) || readOnly) return
    setDrawerState({
      open: true,
      day,
      periodId: period.id,
      periodLabel: period.label,
      entry,
    })
  }

  const getPeriodHeaderStyle = (period: TimetablePeriod) => {
    const pType = period.periodType || (period.isBreak ? 'BREAK' : 'ACADEMIC')
    switch (pType) {
      case 'ASSEMBLY':
        return 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-800/40 text-purple-900 dark:text-purple-200'
      case 'BREAK':
        return 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
      case 'SPORTS':
        return 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
      case 'PREP':
        return 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40 text-blue-900 dark:text-blue-200'
      case 'CLUB':
        return 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/50 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200'
      default:
        return ''
    }
  }

  const renderNonAcademicCell = (period: TimetablePeriod) => {
    const pType = period.periodType || (period.isBreak ? 'BREAK' : 'ACADEMIC')
    switch (pType) {
      case 'ASSEMBLY':
        return (
          <div className="flex h-full min-h-[3.5rem] flex-col items-center justify-center rounded bg-purple-50/80 p-1 text-center dark:bg-purple-950/40">
            <span className="text-sm">📢</span>
            <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">
              {period.globalActivityName || period.label || 'Assembly'}
            </span>
          </div>
        )
      case 'BREAK':
        return (
          <div className="flex h-full min-h-[3.5rem] flex-col items-center justify-center rounded bg-amber-50/80 p-1 text-center dark:bg-amber-950/40">
            <span className="text-sm">☕</span>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              {period.globalActivityName || period.label || 'Break'}
            </span>
          </div>
        )
      case 'SPORTS':
        return (
          <div className="flex h-full min-h-[3.5rem] flex-col items-center justify-center rounded bg-emerald-50/80 p-1 text-center dark:bg-emerald-950/40">
            <span className="text-sm">⚽</span>
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              {period.globalActivityName || period.label || 'Sports & Games'}
            </span>
          </div>
        )
      case 'PREP':
        return (
          <div className="flex h-full min-h-[3.5rem] flex-col items-center justify-center rounded bg-blue-50/80 p-1 text-center dark:bg-blue-950/40">
            <span className="text-sm">📖</span>
            <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300">
              {period.globalActivityName || period.label || 'Prep'}
            </span>
          </div>
        )
      case 'CLUB':
        return (
          <div className="flex h-full min-h-[3.5rem] flex-col items-center justify-center rounded bg-indigo-50/80 p-1 text-center dark:bg-indigo-950/40">
            <span className="text-sm">🎨</span>
            <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">
              {period.globalActivityName || period.label || 'Clubs'}
            </span>
          </div>
        )
      default:
        return (
          <div className="flex h-full min-h-[3.5rem] items-center justify-center text-xs text-muted-foreground italic">
            Break
          </div>
        )
    }
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
                    className={`min-w-[140px] text-center ${getPeriodHeaderStyle(period)}`}
                  >
                    <div className="font-semibold text-sm">{period.label}</div>
                    <div className="text-muted-foreground text-[10px] font-normal">
                      {period.startTime} – {period.endTime}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAYS.map((day) => {
                let skipPeriods = 0
                return (
                  <TableRow key={day}>
                    <TableCell className="bg-muted/50 sticky left-0 z-10 border-r font-semibold text-center">
                      {DAY_LABELS[day]}
                    </TableCell>
                    {periods.map((period, periodIdx) => {
                      if (skipPeriods > 0) {
                        skipPeriods--
                        return null
                      }

                      // Check non-academic global slot
                      if (isNonAcademic(period)) {
                        return (
                          <TableCell
                            key={period.id}
                            className="p-1.5 text-center select-none"
                          >
                            {renderNonAcademicCell(period)}
                          </TableCell>
                        )
                      }

                      const entry = timetable?.[day]?.[periodIdx] || null

                      // Consecutive double period spanning
                      let colSpan = 1
                      if (entry?.subject) {
                        for (let j = periodIdx + 1; j < periods.length; j++) {
                          if (isNonAcademic(periods[j])) break
                          const nextEntry = timetable?.[day]?.[j]
                          if (
                            nextEntry?.subject?.id === entry.subject.id &&
                            nextEntry?.staff?.id === entry.staff?.id &&
                            nextEntry?.isLocked === entry.isLocked
                          ) {
                            colSpan++
                            skipPeriods++
                          } else {
                            break
                          }
                        }
                      }

                      const isSport = entry?.isSport

                      return (
                        <TableCell
                          key={period.id}
                          colSpan={colSpan}
                          className={`cursor-pointer transition-colors p-2 hover:bg-muted/50 ${
                            colSpan > 1
                              ? 'border-x-2 border-primary/30 bg-primary/5 dark:bg-primary/10'
                              : ''
                          }`}
                          onClick={() => openDrawer(day, period, entry)}
                        >
                          {entry?.subject ? (
                            <div className="relative space-y-0.5 text-center rounded border bg-background/80 p-2 shadow-xs">
                              {entry.isLocked && (
                                <span
                                  className="absolute top-1 right-1 text-[10px] select-none"
                                  title="Locked: Protected from auto-generator"
                                >
                                  🔒
                                </span>
                              )}
                              <div className="text-sm font-semibold flex items-center justify-center gap-1">
                                {isSport && <span>⚽</span>}
                                <span>{entry.subject.name}</span>
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
                              {entry.note && (
                                <div className="text-[10px] text-primary/80 font-medium">
                                  {entry.note}
                                </div>
                              )}
                            </div>
                          ) : isSport ? (
                            <div className="text-muted-foreground bg-primary/5 flex h-full min-h-[3rem] items-center justify-center gap-1 rounded-md border border-dashed border-primary/20 text-xs italic">
                              <span>⚽</span> Sport
                            </div>
                          ) : (
                            <div className="text-muted-foreground/60 bg-muted/20 hover:bg-muted/40 transition-colors flex h-full min-h-[3rem] items-center justify-center rounded-md border border-dashed text-xs italic">
                              + Free Slot
                            </div>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {isFetching && (
          <div className="bg-muted/50 border-t px-4 py-2 text-center">
            <span className="text-muted-foreground text-xs">Refreshing timetable...</span>
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
        existingIsLocked={drawerState.entry?.isLocked}
        existingNote={drawerState.entry?.note}
        subjects={subjects}
        staffs={staffs}
        onSaved={onEntrySaved}
      />
    </>
  )
}
