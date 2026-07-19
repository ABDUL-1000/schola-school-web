import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '../api/staff.api'
import type { CreateStaffDTO } from '@/types'

export const staffKeys = {
  all: ['staffs'] as const,
  lists: (branchId?: string, page?: number, limit?: number) =>
    [...staffKeys.all, 'list', { branchId, page, limit }] as const,
  detail: (id: string) => [...staffKeys.all, 'detail', id] as const,
}

export function useStaffsQuery(
  branchId?: string,
  page: number = 1,
  limit: number = 50,
) {
  return useQuery({
    queryKey: staffKeys.lists(branchId, page, limit),
    queryFn: () => staffApi.getAllStaffs(branchId, page, limit),
  })
}

export function useStaffByIdQuery(staffId?: string) {
  return useQuery({
    queryKey: staffKeys.detail(staffId!),
    queryFn: () => staffApi.getStaffById(staffId!),
    enabled: !!staffId,
  })
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: staffApi.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useBulkCreateStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: staffApi.bulkCreateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useEditStaffMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      staffId,
      data,
    }: {
      staffId: string
      data: Partial<CreateStaffDTO>
    }) => staffApi.editStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useDeleteStaffsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: staffApi.deleteStaffs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all })
    },
  })
}

export function useResendStaffInviteMutation() {
  return useMutation({
    mutationFn: staffApi.resendInvite,
  })
}

