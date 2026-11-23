import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { planKeys, usePlanQuery } from '@/hooks/queries/plan.queries'

/**
 * Shared by the school and staff portals (keep both copies in step).
 * Opens whenever the API says the school's plan doesn't allow something
 * (402 PLAN_LIMIT, raised by the API client), or when a locked button calls requestUpgrade().
 */

export type UpgradeDetail = {
  message?: string
  feature?: string
  resource?: string
  requiredTier?: string
  contact?: { email?: string; whatsapp?: string | null }
}

const EVENT = 'schola:plan-limit'

/** Open the upgrade dialog (e.g. from a locked button). */
export function requestUpgrade(detail: UpgradeDetail) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

const TIER_LABEL: Record<string, string> = { STANDARD: 'Standard', CBT_PRO: 'CBT Pro', AI_ELITE: 'AI Elite' }

export function UpgradeDialog({ plansHref, isStaff }: { plansHref?: string; isStaff?: boolean }) {
  const [detail, setDetail] = useState<UpgradeDetail | null>(null)
  const { data: plan } = usePlanQuery()
  const queryClient = useQueryClient()

  useEffect(() => {
    const onLimit = (e: Event) => {
      setDetail((e as CustomEvent<UpgradeDetail | null>).detail ?? {})
      // Usage changed or the plan did: refresh the banner and locks.
      queryClient.invalidateQueries({ queryKey: planKeys.all })
    }
    window.addEventListener(EVENT, onLimit)
    return () => window.removeEventListener(EVENT, onLimit)
  }, [queryClient])

  const contact = { ...plan?.contact, ...detail?.contact }
  const whatsapp = contact.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hello Schola, I would like to upgrade our school plan.')}`
    : null
  const email = contact.email ? `mailto:${contact.email}?subject=${encodeURIComponent('Upgrade our Schola plan')}` : null

  return (
    <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
            <Lock className="size-6" />
          </div>
          <DialogTitle className="text-center">
            {detail?.requiredTier ? `Available on ${TIER_LABEL[detail.requiredTier] || 'a paid plan'}` : 'Upgrade to continue'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {detail?.message || "Your school's current plan doesn't include this."}
          </DialogDescription>
        </DialogHeader>

        {isStaff ? (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            Please let your school's administrator know. They can upgrade the school's plan.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Contact the Schola team to upgrade. Everything you've already added stays as it is.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {whatsapp && (
                <Button asChild className="gap-1.5">
                  <a href={whatsapp} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" /> Chat on WhatsApp
                  </a>
                </Button>
              )}
              {email && (
                <Button asChild variant={whatsapp ? 'outline' : 'default'} className="gap-1.5">
                  <a href={email}>
                    <Mail className="size-4" /> Email us
                  </a>
                </Button>
              )}
            </div>
            {plansHref && (
              <div className="text-center">
                <a href={plansHref} onClick={() => setDetail(null)} className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                  Compare plans
                </a>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
