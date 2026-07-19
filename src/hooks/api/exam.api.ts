import { api } from '../../lib/api'
import type {
  ApiResponse,
  Exam,
  SchoolExamMetrics,
  PaginatedResponse,
  PaginationMetadata,
} from '@/types'

export const examApi = {
  getExams: async (params: {
    classId?: string
    subjectId?: string
    staffId?: string
    status?: string
    type?: string
    isVerified?: boolean
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Exam>> => {
    const response = await api.get<
      ApiResponse<{ exams: Array<Exam>; pagination: PaginationMetadata }>
    >('/school/exam', { params })
    const { exams, pagination } = response.data.data
    return { data: exams, pagination }
  },

  getExamById: async (id: string): Promise<Exam> => {
    const response = await api.get<ApiResponse<{ exam: Exam }>>(
      `/school/exam/${id}`,
    )
    return response.data.data.exam
  },

  getMetrics: async (): Promise<SchoolExamMetrics> => {
    const response = await api.get<ApiResponse<SchoolExamMetrics>>(
      '/school/exam/metrics',
    )
    return response.data.data
  },

  approveExam: async (id: string): Promise<Exam> => {
    const response = await api.patch<ApiResponse<Exam>>(
      `/school/exam/${id}/approve`,
    )
    return response.data.data
  },

  deleteExam: async (id: string): Promise<void> => {
    await api.delete(`/school/exam/${id}`)
  },
}

