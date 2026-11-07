import { useMutation, useQuery } from '@tanstack/react-query'
import { onboardingApi } from '../api/onboarding.api'

export function useSetupBranchesMutation() {
  return useMutation({
    mutationFn: onboardingApi.setupBranches,
  })
}

export function useSetupAcademicMutation() {
  return useMutation({
    mutationFn: onboardingApi.setupAcademic,
  })
}

export const onboardingKeys = { status: ['onboarding', 'status'] as const }

/** Signup → setup → approval status. Polls while the school is waiting for approval. */
export function useOnboardingStatusQuery(options: { poll?: boolean; enabled?: boolean } = {}) {
  return useQuery({
    queryKey: onboardingKeys.status,
    queryFn: onboardingApi.getStatus,
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: (q) => (options.poll && q.state.data && !q.state.data.approved ? 30_000 : false),
    refetchOnWindowFocus: true,
  })
}
