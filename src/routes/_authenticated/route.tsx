import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/api'
import { getLoginUrl, isLocalDev } from '@/lib/subdomain'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      const loginUrl = getLoginUrl()
      if (!isLocalDev()) {
        // Full cross-origin redirect to login portal
        window.location.href = loginUrl
        // Prevent further routing while redirect happens
        throw redirect({ to: '/login' })
      } else {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        })
      }
    }
  },
  component: RouteComponent,
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true

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
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

function RouteComponent() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  )
}

