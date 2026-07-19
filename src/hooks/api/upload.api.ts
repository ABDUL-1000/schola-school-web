import { api } from '../../lib/api'
import type { ApiResponse } from '@/types'

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<{ url: string }>>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data.data.url
  },
}

