import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider'
import { useAuth } from './auth'
import { useAuthStore } from '@/api'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import './styles.css'
import reportWebVitals from './reportWebVitals.ts'
import { TooltipProvider } from './components/ui/tooltip.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'

// Handle logout signal from slug subdomain redirect
function handleLogoutSignal() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('logged_out') === '1') {
    // Clear any stale auth state on this origin
    const store = useAuthStore.getState()
    store.logout()
    // Clean the URL
    params.delete('logged_out')
    const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
    window.history.replaceState({}, '', cleanUrl)
  }
}

// Run cleanup before router initializes
handleLogoutSignal()

// Create a new router instance
const TanStackQueryProviderContext = TanStackQueryProvider.getContext()

const router = createRouter({
  routeTree,
  context: {
    ...TanStackQueryProviderContext,
    auth: undefined as any, // Placeholder for type safety
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

function InnerApp() {
  const auth = useAuth()

  return <RouterProvider router={router} context={{ auth }} />
}

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
        <TooltipProvider>
          <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
            <InnerApp />
          </ThemeProvider>
        </TooltipProvider>
      </TanStackQueryProvider.Provider>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

