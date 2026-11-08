import { api } from '../../lib/api'
import type { ApiResponse } from '@/types'

export type OnboardingStatus = {
  id: string
  schoolName: string
  slug: string
  email: string
  logo: string | null
  isVerified: boolean
  onboardingStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  approvedAt: string | null
  isLocked: boolean
  lockReason: string | null
  subscriptionStatus: string | null
  subscriptionTier: string | null
  subscriptionExpiresAt: string | null
  steps: { profile: boolean; branches: boolean; academic: boolean }
  setupComplete: boolean
  nextStep: 'profile' | 'branch' | 'academic' | null
  /** Suspended by the Schola team (lockReason holds the reason). */
  suspended?: boolean
  approved: boolean
}

/** Fallback for older APIs: approval comes from the profile; setup steps can't be checked, so they count as done. */
async function statusFromProfile(): Promise<OnboardingStatus> {
  const { data } = await api.get<ApiResponse<any>>('/school/profile')
  const s = data.data || {}
  const suspended = s.status === 'SUSPENDED'
  const approved = s.onboardingStatus === 'APPROVED' && !suspended
  return {
    id: s.id,
    schoolName: s.schoolName,
    slug: s.slug,
    email: s.email,
    logo: s.logo ?? null,
    isVerified: s.isVerified ?? true,
    onboardingStatus: s.onboardingStatus || 'PENDING_APPROVAL',
    rejectionReason: s.rejectionReason ?? null,
    approvedAt: s.approvedAt ?? null,
    isLocked: !!s.isLocked,
    lockReason: s.lockReason ?? null,
    subscriptionStatus: s.subscriptionStatus ?? null,
    subscriptionTier: s.subscriptionTier ?? null,
    subscriptionExpiresAt: s.subscriptionExpiresAt ?? null,
    steps: { profile: true, branches: true, academic: true },
    setupComplete: true,
    nextStep: null,
    suspended,
    approved,
  }
}

export const onboardingApi = {
  getStatus: async (): Promise<OnboardingStatus> => {
    try {
      const response = await api.get<ApiResponse<OnboardingStatus>>('/school/onboarding/status')
      return response.data.data
    } catch (err: any) {
      // An API deployed before /onboarding/status existed answers 404. Work it out
      // from the school profile instead, so the app keeps working during an upgrade.
      if ((err?.statusCode ?? err?.response?.status) !== 404) throw err
      return statusFromProfile()
    }
  },

  setupBranches: async (data: { branches: Array<any> }) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/onboarding/branch-setup',
      data,
    )
    return response.data.data
  },

  setupAcademic: async (data: any) => {
    const response = await api.post<ApiResponse<any>>(
      '/school/onboarding/academic-setup',
      data,
    )
    return response.data.data
  },
}

