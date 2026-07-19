import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/api'
import { profileApi } from '@/hooks/api/profile.api'
import { useQueryClient } from '@tanstack/react-query'
import { profileKeys } from '@/hooks/queries/profile.queries'
import { getLoginUrl, isLocalDev } from '@/lib/subdomain'
import { Loader2, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/redirect')({
  component: RedirectPage,
})

function RedirectPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<
    'hydrating' | 'loading' | 'ready' | 'error'
  >('hydrating')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function handleRedirect() {
      try {
        // Step 1: Hydrate auth from URL params if present
        const params = new URLSearchParams(window.location.search)
        const authParam = params.get('auth')

        if (authParam) {
          const authData = JSON.parse(atob(decodeURIComponent(authParam)))
          const store = useAuthStore.getState()
          store.login({
            user: authData.user,
            token: authData.token,
            refreshToken: authData.refreshToken,
          })

          // Clean the URL
          window.history.replaceState({}, '', '/redirect')
        }

        // Verify we actually have auth state
        const store = useAuthStore.getState()
        if (!store.isAuthenticated || !store.token) {
          const loginUrl = getLoginUrl()
          window.location.href = loginUrl
          return
        }

        // Step 2: Fetch user profile
        setStatus('loading')
        const profile = await profileApi.getProfile()

        // Pre-fill the query cache so the dashboard doesn't re-fetch
        queryClient.setQueryData(profileKeys.all, profile)

        // Extract the user's first name for the welcome message
        const firstName =
          profile.fullname.split(' ')[0] ||
          (store.user as any)?.fullname?.split(' ')[0] ||
          ''
        setUserName(firstName)

        // Step 3: Brief pause for the welcome message to be visible
        setStatus('ready')
        await new Promise((r) => setTimeout(r, 1500))

        // Step 4: Navigate to dashboard
        navigate({ to: '/dashboard', replace: true })
      } catch (err) {
        console.error('Redirect failed:', err)
        setStatus('error')

        // Wait a moment then redirect to login
        setTimeout(() => {
          const loginUrl = getLoginUrl()
          if (!isLocalDev()) {
            window.location.href = loginUrl
          } else {
            navigate({ to: '/login', replace: true })
          }
        }, 2000)
      }
    }

    handleRedirect()
  }, [navigate, queryClient])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle animated background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/10 animate-pulse" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        {/* Animated icon */}
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            {status === 'error' ? (
              <span className="text-2xl">⚠️</span>
            ) : (
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            )}
          </div>
        </div>

        {/* Status messages */}
        <div className="space-y-2">
          {status === 'hydrating' && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                Signing you in...
              </h2>
              <p className="text-sm text-muted-foreground">
                Verifying your credentials
              </p>
            </>
          )}

          {status === 'loading' && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome back{userName ? `, ${userName}` : ''}! 👋
              </h2>
              <p className="text-sm text-muted-foreground">
                We're personalizing your dashboard...
              </p>
            </>
          )}

          {status === 'ready' && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                All set{userName ? `, ${userName}` : ''}! 🎉
              </h2>
              <p className="text-sm text-muted-foreground">
                Taking you to your dashboard now
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                Redirecting you to login...
              </p>
            </>
          )}
        </div>

        {/* Loading spinner */}
        {status !== 'error' && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

