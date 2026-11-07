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
  approved: boolean
}

export const onboardingApi = {
  getStatus: async () => {
    const response = await api.get<ApiResponse<OnboardingStatus>>('/school/onboarding/status')
    return response.data.data
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

