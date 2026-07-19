import { api } from '../../lib/api'
import type { ApiResponse, School } from '@/types'

export const profileApi = {
  getProfile: async () => {
    const response = await api.get<ApiResponse<School>>('/school/profile')
    return response.data.data
  },

  updateProfile: async (data: Partial<School>) => {
    const response = await api.patch<ApiResponse<School>>(
      '/school/profile',
      data,
    )
    return response.data.data
  },

  checkSlugAvailability: async (slug: string) => {
    const response = await api.get<ApiResponse<{ available: boolean }>>(
      `/school/profile/check-slug/${slug}`,
    )
    return response.data.data
  },

  generateSlug: async (name?: string) => {
    const url = name ? `/school/profile/generate-slug?name=${encodeURIComponent(name)}` : '/school/profile/generate-slug'
    const response = await api.get<ApiResponse<{ slug: string }>>(url)
    return response.data.data
  },
}

