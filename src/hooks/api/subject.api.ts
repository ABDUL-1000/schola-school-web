import { api } from '../../lib/api'
import type {
  ApiResponse,
  PaginationMetadata,
  PaginatedResponse,
} from '@/types'

export interface SubjectItem {
  id: string
  schoolId: string
  branchId: string
  name: string
  createdAt: string
  updatedAt: string
  branch?: { name: string }
  _count?: { subjectAssignments: number }
}

export interface SubjectDetail extends SubjectItem {
  subjectAssignments: Array<SubjectTeacherAssignment>
}

export interface SubjectTeacherAssignment {
  id: string
  days: string
  teacher: {
    id: string
    fullname: string
    email: string | null
    phone: string
  }
  class: {
    id: string
    name: string
    level: string | null
  }
}

export interface CreateSubjectDTO {
  branchId: string
  name: string
}

export interface AssignTeacherDTO {
  staffId: string
  classId: string
  days: string
}

export const subjectApi = {
  getAllSubjects: async (
    branchId?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<SubjectItem>> => {
    const response = await api.get<
      ApiResponse<{
        subjects: Array<SubjectItem>
        pagination: PaginationMetadata
      }>
    >('/school/subject', { params: { branchId, page, limit } })
    const { subjects, pagination } = response.data.data
    return { data: subjects, pagination }
  },

  getSubjectById: async (subjectId: string) => {
    const response = await api.get<ApiResponse<SubjectDetail>>(
      `/school/subject/${subjectId}`,
    )
    return response.data.data
  },

  createSubject: async (data: CreateSubjectDTO) => {
    const response = await api.post<ApiResponse<any>>('/school/subject', data)
    return response.data.data
  },

  editSubject: async (subjectId: string, data: Partial<CreateSubjectDTO>) => {
    const response = await api.patch<ApiResponse<any>>(
      `/school/subject/${subjectId}`,
      data,
    )
    return response.data.data
  },

  deleteSubjects: async (subjectIds: Array<string>) => {
    const response = await api.delete<ApiResponse<any>>('/school/subject', {
      data: { subjectIds },
    })
    return response.data
  },

  assignTeacher: async (subjectId: string, data: AssignTeacherDTO) => {
    const response = await api.post<ApiResponse<any>>(
      `/school/subject/${subjectId}/assign`,
      data,
    )
    return response.data.data
  },

  removeTeacherAssignment: async (subjectId: string, assignmentId: string) => {
    const response = await api.delete<ApiResponse<any>>(
      `/school/subject/${subjectId}/assign/${assignmentId}`,
    )
    return response.data
  },
}

