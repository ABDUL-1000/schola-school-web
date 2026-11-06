import { addDays, format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import type { LessonPlanStatus, PlanFields } from '@/hooks/queries/lesson-plan.queries'

/** "9 – 13 Nov 2026" for a Monday-based teaching week (Mon–Fri). */
export const weekLabel = (weekStart: string) => {
  const start = parseISO(weekStart)
  const end = addDays(start, 4)
  const sameMonth = start.getMonth() === end.getMonth()
  return `${format(start, sameMonth ? 'd' : 'd MMM')} – ${format(end, 'd MMM yyyy')}`
}

export const shiftWeek = (weekStart: string, weeks: number) => format(addDays(parseISO(weekStart), weeks * 7), 'yyyy-MM-dd')

/** Monday of the week containing the date (local calendar). */
export const mondayOf = (d: Date) => {
  const day = (d.getDay() + 6) % 7
  return format(addDays(d, -day), 'yyyy-MM-dd')
}

const STATUS: Record<string, { label: string; className: string }> = {
  MISSING: { label: 'Not started', className: 'bg-muted text-muted-foreground' },
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300' },
  SUBMITTED: { label: 'Awaiting review', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  CHANGES_REQUESTED: { label: 'Changes requested', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
}

export function PlanStatusBadge({ status, late }: { status: LessonPlanStatus | 'MISSING'; late?: boolean }) {
  const s = STATUS[status] ?? STATUS.DRAFT
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', s.className)}>{s.label}</span>
      {late && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/15 dark:text-red-300">Late</span>}
    </span>
  )
}

/** Field labels in the order Nigerian lesson plan templates use. */
export const PLAN_SECTIONS: Array<{ key: keyof PlanFields; label: string; rows?: number; hint?: string }> = [
  { key: 'objectives', label: 'Behavioural Objectives', rows: 4, hint: 'By the end of the lesson, students should be able to…' },
  { key: 'instructionalMaterials', label: 'Instructional Materials', rows: 2 },
  { key: 'previousKnowledge', label: 'Previous Knowledge', rows: 3 },
  { key: 'introduction', label: 'Introduction', rows: 3 },
  { key: 'content', label: 'Content / Procedure', rows: 8, hint: 'Steps, teacher’s and students’ activities, board summary' },
  { key: 'evaluation', label: 'Evaluation', rows: 4 },
  { key: 'assignment', label: 'Assignment', rows: 3 },
  { key: 'teacherRemark', label: 'Teacher’s Remark', rows: 2 },
]
