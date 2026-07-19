import { api } from '../../lib/api'
import type { ApiResponse, Branch, BranchDTO } from '@/types'

export const branchApi = {
  listBranches: async () => {
    const response = await api.get<ApiResponse<Array<Branch>>>('/school/branch')
    return response.data.data
  },

  getBranchById: async (branchId: string) => {
    const response = await api.get<ApiResponse<Branch>>(
      `/school/branch/${branchId}`,
    )
    return response.data.data
  },

  addBranch: async (data: BranchDTO) => {
    const response = await api.post<ApiResponse<Branch>>('/school/branch', data)
    return response.data.data
  },

  updateBranch: async (branchId: string, data: Partial<BranchDTO>) => {
    const response = await api.patch<ApiResponse<Branch>>(
      `/school/branch/${branchId}`,
      data,
    )
    return response.data.data
  },

  setHQBranch: async (branchId: string) => {
    const response = await api.patch<ApiResponse<Branch>>(
      `/school/branch/${branchId}/set-hq`,
    )
    return response.data.data
  },

  deleteBranches: async (branchIds: Array<string> | string) => {
    const isBatch = Array.isArray(branchIds)
    const url = isBatch
      ? '/school/branch'
      : `/school/branch?branchId=${branchIds}`
    const data = isBatch ? { branchIds } : undefined

    const response = await api.delete<ApiResponse<any>>(url, { data })
    return response.data
  },
}

