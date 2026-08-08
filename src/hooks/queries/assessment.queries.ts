import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export const useAssessmentConfigQuery = (
  termId: string,
  subjectId: string,
  classId?: string,
) => {
  return useQuery({
    queryKey: ['assessmentConfig', termId, subjectId, classId],
    queryFn: async () => {
      if (!termId || !subjectId) return null
      const url = classId
        ? `/school/assessment/config/${termId}/subject/${subjectId}?classId=${classId}`
        : `/school/assessment/config/${termId}/subject/${subjectId}`
      const { data } = await api.get(url)
      return data?.data
    },
    enabled: !!termId && !!subjectId,
  })
}

export const useUpsertAssessmentConfigMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      termId,
      data,
    }: {
      termId: string
      data: { subjectId: string; classId?: string; components: Array<any> }
    }) => {
      const response = await api.post(`/school/assessment/config/${termId}`, data)
      return response.data?.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'assessmentConfig',
          variables.termId,
          variables.data.subjectId,
        ],
      })
    },
  })
}
