import { useMutation } from '@tanstack/react-query'
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
