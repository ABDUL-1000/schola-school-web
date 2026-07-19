import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { examApi } from '../api/exam.api'

export const examKeys = {
  all: ['exams'] as const,
  lists: (params: any) => [...examKeys.all, 'list', params] as const,
  detail: (id: string) => [...examKeys.all, 'detail', id] as const,
  metrics: () => [...examKeys.all, 'metrics'] as const,
}

export function useExamsQuery(params: {
  classId?: string
  subjectId?: string
  staffId?: string
  status?: string
  type?: string
  isVerified?: boolean
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: examKeys.lists(params),
    queryFn: () => examApi.getExams(params),
  })
}

export function useExamByIdQuery(id?: string) {
  return useQuery({
    queryKey: examKeys.detail(id!),
    queryFn: () => examApi.getExamById(id!),
    enabled: !!id,
  })
}

export function useExamMetricsQuery() {
  return useQuery({
    queryKey: examKeys.metrics(),
    queryFn: () => examApi.getMetrics(),
  })
}

export function useApproveExamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => examApi.approveExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.all })
    },
  })
}

export function useDeleteExamMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => examApi.deleteExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.all })
    },
  })
}
