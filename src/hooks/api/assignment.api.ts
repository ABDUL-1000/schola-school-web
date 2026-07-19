import { api } from '@/lib/api'
import type { ApiResponse, PaginationMetadata, AssignmentStatus, AssignmentType } from '@/types'

export interface AssignmentItem {
  id: string
  title: string
  description?: string
  status: AssignmentStatus
  type: AssignmentType
  isVerified: boolean
  dueDate: string
  classId: string
  subjectId: string
  staffId: string
  schoolId: string
  createdAt: string
  updatedAt: string
  class?: {
    name: string
  }
  subject?: {
    name: string
  }
  teacher?: {
    fullname: string
    profileImage: string | null
  }
  _count?: {
    questions: number
    submissions: number
  }
}

export interface AssignmentMetrics {
  totalAssignments: number
  pendingApproval: number
  approvedAssignments: number
  typeStats: Record<string, number>
  statusStats: Record<string, number>
}

export interface GetAssignmentsParams {
  classId?: string
  subjectId?: string
  staffId?: string
  status?: string
  type?: string
  isVerified?: boolean | string
  page?: number
  limit?: number
}

export interface GetAssignmentsResponse {
  assignments: Array<AssignmentItem>
  pagination: PaginationMetadata
}

export const getAssignments = async (params: GetAssignmentsParams = {}) => {
  const { data } = await api.get<ApiResponse<GetAssignmentsResponse>>(
    '/school/assignment',
    { params },
  )
  return data.data
}

export const getAssignmentMetrics = async () => {
  const { data } = await api.get<ApiResponse<AssignmentMetrics>>(
    '/school/assignment/metrics',
  )
  return data.data
}

export const getAssignmentById = async (id: string) => {
  const { data } = await api.get<ApiResponse<{ assignment: any }>>(
    `/school/assignment/${id}`,
  )
  return data.data.assignment
}

export const approveAssignment = async (id: string) => {
  const { data } = await api.patch<ApiResponse<any>>(
    `/school/assignment/${id}/approve`,
  )
  return data
}

