import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { AppSidebar } from '@/components/app-sidebar'
import { UserNav } from '@/components/user-nav'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ProfileCompletionAlert } from '@/components/profile-completion-alert'
import { useOnboardingStatusQuery } from '@/hooks/queries/onboarding.queries'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  // Schools that haven't finished setup or aren't approved yet can't use the dashboard
  // (the API refuses it), so send them to the right step instead of a page full of errors.
  const { data: status, isLoading } = useOnboardingStatusQuery()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }
  if (status && !status.approved) {
    return status.nextStep ? (
      <Navigate to={`/onboarding/${status.nextStep}`} replace />
    ) : (
      <Navigate to="/pending-approval" replace />
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 backdrop-blur">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 px-4 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
          <Outlet />
        </div>
        <ProfileCompletionAlert />
      </SidebarInset>
    </SidebarProvider>
  )
}
