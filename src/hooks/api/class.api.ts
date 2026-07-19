import { api } from '../../lib/api'
import type {
  ApiResponse,
  PaginationMetadata,
  PaginatedResponse,
} from '@/types'

// Types (not in @/types yet)
export interface ClassItem {
  id: string
  schoolId: string
  branchId: string
  name: string
  level: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  branch?: { name: string }
  _count?: {
    students: number
    subjectAssignments: number
    classLeads: number
  }
}

export interface CreateClassDTO {
  branchId: string
  name: string
  level?: string
  sortOrder?: number
}

export interface ClassTeacher {
  id: string
  staffId: string
  classId: string
  staff: {
    id: string
    fullname: string
    email: string | null
    phone: string
    roles: string
    status: string
  }
}

export const classApi = {
  getAllClasses: async (
    branchId?: string,
    level?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<ClassItem>> => {
    const response = await api.get<
      ApiResponse<{ classes: Array<ClassItem>; pagination: PaginationMetadata }>
    >('/school/class', {
      params: { branchId, level, page, limit },
    })
    const { classes, pagination } = response.data.data
    return { data: classes, pagination }
  },

  getClassById: async (classId: string) => {
    const response = await api.get<ApiResponse<ClassItem>>(
      `/school/class/${classId}`,
    )
    return response.data.data
  },

  createClass: async (data: CreateClassDTO) => {
    const response = await api.post<ApiResponse<ClassItem>>(
      '/school/class',
      data,
    )
    return response.data.data
  },

  editClass: async (classId: string, data: Partial<CreateClassDTO>) => {
    const response = await api.patch<ApiResponse<ClassItem>>(
      `/school/class/${classId}`,
      data,
    )
    return response.data.data
  },

  deleteClasses: async (classIds: Array<string>) => {
    const response = await api.delete<ApiResponse<any>>('/school/class', {
      data: { classIds },
    })
    return response.data
  },

  // Class lead management
  getClassLeads: async (classId: string) => {
    const response = await api.get<ApiResponse<Array<ClassTeacher>>>(
      `/school/class/${classId}/teachers`,
    )
    return response.data.data
  },

  assignClassTeacher: async (classId: string, staffId: string) => {
    const response = await api.post<ApiResponse<any>>(
      `/school/class/${classId}/teachers`,
      { staffId },
    )
    return response.data.data
  },

  removeClassTeacher: async (classId: string, staffId: string) => {
    const response = await api.delete<ApiResponse<any>>(
      `/school/class/${classId}/teachers/${staffId}`,
    )
    return response.data
  },
}

