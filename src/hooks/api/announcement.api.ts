import { api } from '@/lib/api'
import type { ApiResponse } from '@/types'

export const announcementApi = {
  getAnnouncements: async (filters: any = {}) => {
    const response = await api.get<ApiResponse<any>>('/school/announcements', { params: filters })
    return response.data.data
  },

  createAnnouncement: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/school/announcements', data)
    return response.data.data.announcement
  },

  deleteAnnouncement: async (announcementId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/school/announcements/${announcementId}`)
    return response.data
  },
}

