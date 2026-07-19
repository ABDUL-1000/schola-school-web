import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi } from '@/hooks/api/auth.api'
import { useAuthStore } from '@/api'
import { getLoginUrl } from '@/lib/subdomain'

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: authApi.requestOtp,
  })
}

export function useVerifyOtpMutation() {
  const store = useAuthStore()

  return useMutation({
    mutationFn: authApi.verifyOtp,
    onSuccess: (data) => {
      // 1. Store auth state
      store.login({
        user: { ...data, role: 'SCHOOL' } as any,
        token: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      })
    },
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: ({ data, token }: { data: any; token: string }) =>
      authApi.register(data, token),
  })
}

export function useLoginMutation() {
  const store = useAuthStore()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // 1. Store auth state
      store.login({
        user: { ...data, role: 'SCHOOL' } as any,
        token: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      })
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export function useVerifyResetOtpMutation() {
  return useMutation({
    mutationFn: authApi.verifyResetOtp,
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: authApi.changePassword,
  })
}

export function useLogoutMutation() {
  const store = useAuthStore()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      store.logout()
      const loginUrl = getLoginUrl()
      // Add logged_out param so login portal clears any stale auth state
      const separator = loginUrl.includes('?') ? '&' : '?'
      window.location.href = `${loginUrl}${separator}logged_out=1`
    },
  })
}

export function useResolveSlugQuery(slug: string | null) {
  return useQuery({
    queryKey: ['auth', 'resolve', slug],
    queryFn: () => authApi.resolveSlug(slug!),
    enabled: !!slug,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: false,
  })
}

