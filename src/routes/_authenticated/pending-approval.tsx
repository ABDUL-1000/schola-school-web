import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  LogOut,
  Mail,
  PartyPopper,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/api'
import { useOnboardingStatusQuery } from '@/hooks/queries/onboarding.queries'

export const Route = createFileRoute('/_authenticated/pending-approval')({
  component: PendingApprovalPage,
})

const SUPPORT_EMAIL = 'schola.com.ng@gmail.com'

/**
 * Shown right after a school verifies its email. Sign-up stops here until the
 * Schola team approves the application; then the school continues to setup
 * (profile, branches, academic session). The page checks by itself every 30s.
 */
function PendingApprovalPage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { data: status, isLoading, isFetching, refetch, error } = useOnboardingStatusQuery({ poll: true })

  // Approved → continue to setup (or the dashboard if setup is already done).
  useEffect(() => {
    if (!status?.approved) return
    navigate({ to: status.nextStep ? `/onboarding/${status.nextStep}` : '/dashboard', replace: true })
  }, [status, navigate])

  const signOut = () => {
    logout()
    window.location.href = '/login?logged_out=1'
  }

  const rejected = status?.onboardingStatus === 'REJECTED'

  return (
    <AuthLayout
      title={rejected ? 'Application not approved' : 'Application submitted'}
      description={
        rejected
          ? 'The Schola team has reviewed your school registration.'
          : "You're all set for now. We'll take it from here."
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
                If you think this is a mistake, reply to the email we sent you or write to{' '}
                <a className="font-medium text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  <PartyPopper className="size-5" /> Congratulations, your application is in!
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{status.schoolName}</span> has been submitted to Schola
                  for review. We usually review applications within one working day.
                </p>
              </div>

              <div className="flex gap-3 rounded-xl border bg-muted/40 p-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  We've emailed <span className="font-medium text-foreground">{status.email}</span> a confirmation. Once
                  you're approved, we'll email you a link to sign in and finish setting up your school: branches,
                  academic session and classes. You can also leave this page open, as it updates by itself.
                </p>
              </div>
            </>
          )}

          <ul className="space-y-2 text-sm">
            <Step done label="School account created" />
            <Step done={status.isVerified} label="Email verified" />
            <Step done={status.approved} pending={!rejected} failed={rejected} label="Approved by Schola" />
            <Step done={false} label="Set up branches, session and classes (after approval)" />
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 size-4 ${isFetching ? 'animate-spin' : ''}`} /> Check status
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

function Step({ done, pending, failed, label }: { done: boolean; pending?: boolean; failed?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
      ) : failed ? (
        <XCircle className="size-4 shrink-0 text-destructive" />
      ) : pending ? (
        <Clock className="size-4 shrink-0 text-amber-500" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className={done ? '' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}
