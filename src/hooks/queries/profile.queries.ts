import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '../api/profile.api'

export const profileKeys = {
  all: ['profile'] as const,
}

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: profileApi.getProfile,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useCheckSlugAvailabilityMutation() {
  return useMutation({
    mutationFn: profileApi.checkSlugAvailability,
  })
}

export function useGenerateSlugMutation() {
  return useMutation({
    mutationFn: profileApi.generateSlug,
  })
}
