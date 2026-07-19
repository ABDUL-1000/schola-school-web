import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAssignments,
  getAssignmentMetrics,
  getAssignmentById,
  approveAssignment,
  type GetAssignmentsParams,
} from '../api/assignment.api'

export const assignmentKeys = {
  all: ['school-assignments'] as const,
  lists: () => [...assignmentKeys.all, 'list'] as const,
  list: (params: GetAssignmentsParams) =>
    [...assignmentKeys.lists(), params] as const,
  metrics: () => [...assignmentKeys.all, 'metrics'] as const,
  details: () => [...assignmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assignmentKeys.details(), id] as const,
}

export function useAssignmentsQuery(params: GetAssignmentsParams) {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: () => getAssignments(params),
  })
}

export function useAssignmentMetricsQuery() {
  return useQuery({
    queryKey: assignmentKeys.metrics(),
    queryFn: getAssignmentMetrics,
  })
}

export function useAssignmentByIdQuery(id: string) {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: () => getAssignmentById(id),
    enabled: !!id,
  })
}

export function useApproveAssignmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => approveAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all })
    },
  })
}
