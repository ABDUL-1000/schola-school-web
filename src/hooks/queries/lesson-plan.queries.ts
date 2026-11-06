import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ThreadItem } from '@/components/lesson-plans/review-thread'

export type LessonPlanStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED'

export const PLAN_TEXT_FIELDS = [
  'topic',
  'subTopic',
  'duration',
  'objectives',
  'instructionalMaterials',
  'previousKnowledge',
  'introduction',
  'content',
  'evaluation',
  'assignment',
  'teacherRemark',
] as const
export type PlanTextField = (typeof PLAN_TEXT_FIELDS)[number]
export type PlanFields = Record<PlanTextField, string>

export interface LessonPlan extends Partial<Record<PlanTextField, string | null>> {
  id: string
  classId: string
  subjectId: string
  weekStart: string
  weekNumber: number | null
  topic: string
  status: LessonPlanStatus
  aiDrafted: boolean
  submittedAt: string | null
  reviewedByName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  dueAt: string
  late: boolean
  class: { id: string; name: string; level?: string | null }
  subject: { id: string; name: string }
  teacher: { id: string; fullname: string }
  term: { id: string; name: string; session?: { name: string } } | null
  reviews?: Array<ThreadItem & { action: ThreadItem['action'] }>
  school?: { schoolName: string; logo?: string | null; address?: string | null }
}

export interface Schedule {
  dueDay: number
  dueDayName: string
  thisWeek: string
  nextWeek: string
  nextWeekDueAt: string
}

const data = async <T,>(p: Promise<any>): Promise<T> => (await p).data?.data
const clean = (params: Record<string, any> = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

const keys = { all: ['lesson-plans'] as const }

function usePlanMutation<T>(fn: (vars: T) => Promise<any>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }) })
}

// ── Reviewer (school account) ──

const REVIEW = '/school/lesson-plans'

export const useReviewLessonPlansQuery = (params: Record<string, any>) =>
  useQuery({
    queryKey: [...keys.all, 'review', params],
    queryFn: () =>
      data<{
        schedule: Schedule
        counts: { submitted: number; approved: number; changesRequested: number }
        plans: Array<LessonPlan>
        pagination: any
      }>(api.get(REVIEW, { params: clean(params) })),
  })

export interface ComplianceRow {
  teacher: { id: string; fullname: string }
  class: { id: string; name: string }
  subject: { id: string; name: string }
  planId: string | null
  state: 'MISSING' | 'DRAFT' | LessonPlanStatus
  late: boolean
}

export const useLessonPlanComplianceQuery = (weekStart?: string) =>
  useQuery({
    queryKey: [...keys.all, 'compliance', weekStart],
    queryFn: () =>
      data<{
        schedule: Schedule
        weekStart: string
        dueAt: string
        summary: { expected: number; missing: number; submitted: number; approved: number; changesRequested: number }
        rows: Array<ComplianceRow>
      }>(api.get(`${REVIEW}/compliance`, { params: clean({ weekStart }) })),
  })

export const useReviewLessonPlanQuery = (id?: string) =>
  useQuery({
    queryKey: [...keys.all, 'review-one', id],
    queryFn: () => data<LessonPlan>(api.get(`${REVIEW}/${id}`)),
    enabled: !!id,
  })

export const useDecideLessonPlanMutation = () =>
  usePlanMutation(({ id, action, comment }: { id: string; action: 'approve' | 'request-changes'; comment?: string }) =>
    data<LessonPlan>(api.post(`${REVIEW}/${id}/${action}`, { comment })),
  )

export const useLessonPlanSettingsMutation = () =>
  usePlanMutation((body: { lessonPlanDueDay: number }) => data<Schedule>(api.patch(`${REVIEW}/settings`, body)))
