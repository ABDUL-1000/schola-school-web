import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PlanState = 'TRIAL' | 'PAID' | 'FREE'
export type PlanResource = 'students' | 'staff' | 'branches' | 'cbtExams'
export type PlanFeature =
  | 'cleanReportCards'
  | 'publishResults'
  | 'printAllReportCards'
  | 'reportCardDesign'
  | 'multiBranch'
  | 'aiTools'
  | 'unlimitedCbt'
export type PlanTier = 'STANDARD' | 'CBT_PRO' | 'AI_ELITE'

/** The school's plan (from the API): trial, a paid tier, or the free plan. */
export interface SchoolPlan {
  state: PlanState
  tier: PlanTier
  label: string
  endsAt: string | null
  daysLeft: number | null
  limits: Record<PlanResource, number | null>
  features: Record<PlanFeature, boolean>
  usage: Record<PlanResource, number>
  overLimit: Array<PlanResource>
  tiers: Array<{ tier: PlanTier; label: string; features: Record<PlanFeature, boolean> }>
  freeLimits: Record<PlanResource, number | null>
  contact: { email: string; whatsapp: string | null }
  /** Standard plan price for this school, per student per term (₦). */
  price: { perStudentPerTerm: number; agreed: boolean; minimumStudents: number; maximumStudents: number }
  /** What the school pays per term on Standard (worked out like the Schola team bills it). */
  bill: {
    activeStudents: number
    billedStudents: number
    rate: number
    total: number
    capped: boolean
    cap: number
    floorApplied: boolean
    flatFee: boolean
  } | null
}

export const planKeys = { all: ['plan'] as const }

export function usePlanQuery() {
  return useQuery({
    queryKey: planKeys.all,
    queryFn: async () => (await api.get('/school/plan')).data?.data as SchoolPlan | null,
    staleTime: 60_000,
  })
}

/** True unless the school's plan is known and leaves the feature out (so nothing flickers while loading). */
export function usePlanAllows(feature: PlanFeature) {
  const { data } = usePlanQuery()
  return !data || data.features[feature]
}
