import { api } from '../../lib/api'
import type {
  ApiResponse,
  Staff,
  CreateStaffDTO,
  PaginationMetadata,
  PaginatedResponse,
} from '@/types'

export const staffApi = {
  getAllStaffs: async (
    branchId?: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<Staff>> => {
    const response = await api.get<
      ApiResponse<{ staffs: Array<Staff>; pagination: PaginationMetadata }>
    >('/school/staff', { params: { branchId, page, limit } })
    const { staffs, pagination } = response.data.data
    return { data: staffs, pagination }
  },

  getStaffById: async (staffId: string) => {
    const response = await api.get<ApiResponse<Staff>>(
      `/school/staff/${staffId}`,
    )
    return response.data.data
  },

  createStaff: async (data: CreateStaffDTO) => {
    const response = await api.post<ApiResponse<Staff>>('/school/staff', data)
    return response.data.data
  },

  bulkCreateStaff: async (data: { branchId: string; staffs: Array<CreateStaffDTO> }) => {
    const response = await api.post<ApiResponse<any>>('/school/staff/bulk', data)
    return response.data.data
  },

  editStaff: async (staffId: string, data: Partial<CreateStaffDTO>) => {
    const response = await api.patch<ApiResponse<Staff>>(
      `/school/staff/${staffId}`,
      data,
    )
    return response.data.data
  },

  deleteStaffs: async (staffIds: Array<string>) => {
    const response = await api.delete<ApiResponse<any>>('/school/staff', {
      data: { staffIds },
    })
    return response.data
  },

  resendInvite: async (staffId: string) => {
    const response = await api.post<ApiResponse<any>>(
      `/school/staff/${staffId}/resend-invite`
    )
    return response.data
  },
}

