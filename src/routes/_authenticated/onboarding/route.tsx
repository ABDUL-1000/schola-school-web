import { Navigate, Outlet, createFileRoute } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { useOnboardingStore } from '@/hooks/stores/onboarding.store'
import { useOnboardingStatusQuery } from '@/hooks/queries/onboarding.queries'

export const Route = createFileRoute('/_authenticated/onboarding')({
  component: OnboardingLayout,
})

const STEPS = [
  { id: 1, title: 'School Profile', description: 'Set up category and slug' },
  { id: 2, title: 'Branches', description: 'Configure school branches' },
  { id: 3, title: 'Academic Foundation', description: 'Set up session & terms' },
]

function OnboardingLayout() {
  const step = useOnboardingStore((s) => s.step)
  // Setup opens only after Schola approves the application.
  const { data: status, isLoading } = useOnboardingStatusQuery()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }
  if (status && !status.approved) return <Navigate to="/pending-approval" replace />

  return (
    <AuthLayout
      title={
        step === 1
          ? 'School Profile'
          : step === 2
            ? 'Branch Configuration'
            : 'Academic Foundation'
      }
      description={
        step === 1
          ? 'Let’s get your school identity set up'
          : step === 2
            ? 'Set up your school branches'
            : 'Configure your first academic session'
      }
      stepperSteps={STEPS}
      currentStep={step}
    >
      <Outlet />
    </AuthLayout>
  )
}
