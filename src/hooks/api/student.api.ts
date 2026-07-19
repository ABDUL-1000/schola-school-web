import { api } from '../../lib/api'
import type {
  ApiResponse,
  PaginationMetadata,
  PaginatedResponse,
} from '@/types'

export interface StudentItem {
  id: string
  schoolId: string
  branchId: string
  classId: string
  fullname: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  dateOfBirth: string | null
  gender: string | null
  bloodGroup: string | null
  genotype: string | null
  stateOfOrigin: string | null
  lga: string | null
  religion: string | null
  nationality: string | null
  address: string | null

  email: string | null
  phone: string | null
  regNumber: string

  previousSchool: string | null
  transferReason: string | null
  knownAllergies: string | null
  medicalConditions: string | null

  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  updatedAt: string
  branch?: { name: string }
  class?: { id: string; name: string; level: string | null }
  department?: { id: string; name: string } | null
  guardians?: Array<any>
  documents?: Array<any>
}

export interface CreateStudentDTO {
  branchId: string
  classId: string
  departmentId?: string
  
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth?: string | Date
  gender?: string
  bloodGroup?: string
  genotype?: string
  stateOfOrigin?: string
  lga?: string
  religion?: string
  nationality?: string
  address?: string
  
  email?: string
  phone?: string
  regNumber?: string
  
  previousSchool?: string
  transferReason?: string
  knownAllergies?: string
  medicalConditions?: string

  guardians?: Array<any>
  documents?: Array<any>
}

export interface ReassignStudentDTO {
  classId: string
  branchId?: string
}

export const studentApi = {
  getAllStudents: async (
    branchId?: string,
    classId?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<StudentItem>> => {
    const response = await api.get<
      ApiResponse<{
        students: Array<StudentItem>
        pagination: PaginationMetadata
      }>
    >('/school/student', { params: { branchId, classId, page, limit } })
    const { students, pagination } = response.data.data
    return { data: students, pagination }
  },

  getStudentById: async (studentId: string) => {
    const response = await api.get<ApiResponse<StudentItem>>(
      `/school/student/${studentId}`,
    )
    return response.data.data
  },

  createStudent: async (data: CreateStudentDTO) => {
    const response = await api.post<ApiResponse<StudentItem>>(
      '/school/student',
      data,
    )
    return response.data.data
  },

  editStudent: async (studentId: string, data: Partial<CreateStudentDTO>) => {
    const response = await api.patch<ApiResponse<StudentItem>>(
      `/school/student/${studentId}`,
      data,
    )
    return response.data.data
  },

  reassignStudent: async (studentId: string, data: ReassignStudentDTO) => {
    const response = await api.patch<ApiResponse<StudentItem>>(
      `/school/student/${studentId}/reassign`,
      data,
    )
    return response.data.data
  },

  deleteStudents: async (studentIds: Array<string>) => {
    const response = await api.delete<ApiResponse<any>>('/school/student', {
      data: { studentIds },
    })
    return response.data
  },

  resetStudentPassword: async (studentId: string) => {
    const response = await api.patch<ApiResponse<any>>(
      `/school/student/${studentId}/reset-password`,
    )
    return response.data
  },
}

