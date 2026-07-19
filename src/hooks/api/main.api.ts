import { api } from '@/lib/api'

export const mainApi = {
  getDashboardMetrics: async () => {
    const response = await api.get('/school/dashboard')
    return response.data.data
  },
}
