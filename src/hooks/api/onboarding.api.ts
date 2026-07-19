import { api } from '../../lib/api'
import type { ApiResponse } from '@/types'

export const onboardingApi = {
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

