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

type AssessmentComponent = { name: string; maxScore: number; type?: 'CA' | 'EXAM' }

/** Every subject's setup for a term, plus the school's "All subjects" setup. */
export const useTermAssessmentConfigsQuery = (termId: string) => {
  return useQuery({
    queryKey: ['assessmentConfig', termId, 'all'],
    queryFn: async () => {
      const { data } = await api.get(`/school/assessment/config/${termId}`)
      return data?.data as {
        configs: Array<{ subjectId: string; components: Array<AssessmentComponent> }>
        schoolDefault: Array<AssessmentComponent>
      }
    },
    enabled: !!termId,
  })
}

export interface UpsertAssessmentConfigBody {
  subjectId?: string
  subjectIds?: Array<string>
  allSubjects?: boolean
  allTermsInSession?: boolean
  classId?: string
  components: Array<{ name: string; maxScore: number; type?: 'CA' | 'EXAM' }>
}

export const useUpsertAssessmentConfigMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ termId, data }: { termId: string; data: UpsertAssessmentConfigBody }) => {
      const response = await api.post(`/school/assessment/config/${termId}`, data)
      return { message: response.data?.message as string | undefined, config: response.data?.data }
    },
    // A save can touch many subjects and terms, so refresh every cached setup.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessmentConfig'] }),
  })
}
