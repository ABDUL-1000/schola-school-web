import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from '@/components/ui/sonner'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query'
import type { AuthState } from '@/types'

import { NotFound } from '@/components/not-found'
import { GlobalErrorComponent } from '@/components/ui/error-component'
import { authApi } from '@/hooks/api/auth.api'
import { useSchoolStore } from '@/api/school-store'

interface MyRouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    // 1. Extract Subdomain
    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Check if we are on a subdomain (e.g., [slug].edumatrix.xyz)
    // This simple check assumes the domain is at least 3 parts if it has a subdomain on a .xyz
    // e.g. school.edumatrix.xyz (3 parts), localhost (1 part)
    let subdomain = ''
    if (parts.length >= 3 && hostname.includes('edumatrix.xyz')) {
      subdomain = parts[0]
    } else if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Handle other custom domains or environments if needed
      // For now, assume no subdomain if not matching pattern
    }

    // 2. Ignore reserved subdomains or local testing
    if (
      !subdomain ||
      subdomain === 'school' ||
      subdomain === 'api' ||
      subdomain === 'www'
    ) {
      return // Proceed normally to generic dashboard login or landing
    }

    // 3. Skip check if we are already on the unauthorized route
    if (location.pathname === '/unauthorized') {
      return
    }

    // 4. Validate the slug
    try {
      const store = useSchoolStore.getState()
      // If we already have the school loaded for this slug, skip the network request
      if (store.school?.slug === subdomain) {
        return
      }

      const schoolData = await authApi.resolveSlug(subdomain)

      // Save to store
      store.setSchool({
        id: schoolData.id,
        schoolName: schoolData.schoolName,
        slug: schoolData.slug,
        logo: schoolData.logo,
      })
    } catch (error) {
      // 404 or other error means invalid slug
      throw redirect({
        to: '/unauthorized',
      })
    }
  },
  component: () => (
    <>
      <Outlet />
      <Toaster richColors closeButton />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error, reset }) => (
    <GlobalErrorComponent error={error} reset={reset} />
  ),
})
