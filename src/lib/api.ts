import { createApiClient } from '@/api'
import { API_BASE_URL } from '@/constants'
import { toast } from '@/lib/toast'
import { getLoginUrl, isLocalDev } from '@/lib/subdomain'

export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || API_BASE_URL,
  refreshPath: '/school/auth/refresh-token',
  onAuthFailure: () => {
    toast.warning('Session expired', {
      description: 'You have been logged out. Redirecting to login...',
    })

    setTimeout(() => {
      const loginUrl = getLoginUrl()
      if (isLocalDev()) {
        window.location.href = '/login'
      } else {
        window.location.href = loginUrl
      }
    }, 2000)
  },
})

