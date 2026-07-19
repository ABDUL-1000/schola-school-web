import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { branchApi } from '../api/branch.api'
import type { BranchDTO } from '@/types'

export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  detail: (id: string) => [...branchKeys.all, 'detail', id] as const,
}

export function useBranchesQuery() {
  return useQuery({
    queryKey: branchKeys.lists(),
    queryFn: branchApi.listBranches,
  })
}

export function useBranchByIdQuery(branchId?: string) {
  return useQuery({
    queryKey: branchKeys.detail(branchId!),
    queryFn: () => branchApi.getBranchById(branchId!),
    enabled: !!branchId,
  })
}

export function useAddBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: branchApi.addBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      branchId,
      data,
    }: {
      branchId: string
      data: Partial<BranchDTO>
    }) => branchApi.updateBranch(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useSetHQBranchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: branchApi.setHQBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

export function useDeleteBranchesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: branchApi.deleteBranches,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all })
    },
  })
}

