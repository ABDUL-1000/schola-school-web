import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Using api from @/lib/api

export const ACADEMIC_KEYS = {
  sessions: ['academic-sessions'] as const,
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ACADEMIC_KEYS.sessions,
    queryFn: async () => {
      const { data } = await api.get('/school/academic/sessions')
      return data.data as Array<any> // Using any[] for now, will type later if needed
    },
  })
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; startDate: Date; endDate: Date }) => {
      const { data } = await api.post('/school/academic/sessions', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACADEMIC_KEYS.sessions })
    },
  })
}

export function useActivateSessionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.patch(`/school/academic/sessions/${sessionId}/activate`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACADEMIC_KEYS.sessions })
    },
  })
}

export function useUpdateTermDatesMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ termId, startDate, endDate }: { termId: string; startDate: Date; endDate: Date }) => {
      const { data } = await api.patch(`/school/academic/terms/${termId}`, { startDate, endDate })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACADEMIC_KEYS.sessions })
    },
  })
}
