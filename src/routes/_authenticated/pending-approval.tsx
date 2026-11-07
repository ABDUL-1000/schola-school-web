import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CheckCircle2, Circle, Clock, Loader2, LogOut, RefreshCw, XCircle } from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/api'
import { useOnboardingStatusQuery } from '@/hooks/queries/onboarding.queries'

export const Route = createFileRoute('/_authenticated/pending-approval')({
  component: PendingApprovalPage,
})

function PendingApprovalPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { data: status, isLoading, isFetching, refetch, error } = useOnboardingStatusQuery({ poll: true })

  // Approved → straight into the dashboard. Setup unfinished → back to the wizard.
  useEffect(() => {
    if (!status) return
    if (status.approved) navigate({ to: '/dashboard', replace: true })
    else if (status.nextStep) navigate({ to: `/onboarding/${status.nextStep}`, replace: true })
  }, [status, navigate])

  const signOut = () => {
    logout()
    window.location.href = '/login?logged_out=1'
  }

  const rejected = status?.onboardingStatus === 'REJECTED'

  return (
    <AuthLayout
      title={rejected ? 'Application not approved' : 'Waiting for approval'}
      description={
        rejected
          ? 'Your school registration was reviewed by the Schola team.'
          : 'Your school is set up. The Schola team is reviewing your registration.'
      }
    >
      {isLoading || !status ? (
        error ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Could not load your status.'}</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : (
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
        )
      ) : (
        <div className="space-y-6">
          {rejected ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <XCircle className="size-5" /> Not approved
              </div>
              <p className="mt-2 text-sm">{status.rejectionReason || 'Your registration details could not be verified.'}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                If you think this is a mistake, reply to the email we sent you or contact Schola support.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="size-5 text-amber-500" /> Under review
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                We'll email <span className="font-medium text-foreground">{status.email}</span> as soon as{' '}
                <span className="font-medium text-foreground">{status.schoolName}</span> is approved. This page also
                updates by itself — you can leave it open.
              </p>
            </div>
          )}

          <ul className="space-y-2 text-sm">
            <Step done label="Account created" />
            <Step done={status.isVerified} label="Email verified" />
            <Step done={status.steps.profile} label="School profile" />
            <Step done={status.steps.branches} label="Branches" />
            <Step done={status.steps.academic} label="Academic session & classes" />
            <Step done={status.approved} pending={!rejected} label="Approved by Schola" />
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 size-4 ${isFetching ? 'animate-spin' : ''}`} /> Check again
            </Button>
            <Button variant="ghost" className="flex-1" onClick={signOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}

function Step({ done, pending, label }: { done: boolean; pending?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-4 text-emerald-600" />
      ) : pending ? (
        <Clock className="size-4 text-amber-500" />
      ) : (
        <Circle className="size-4 text-muted-foreground" />
      )}
      <span className={done ? '' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}
