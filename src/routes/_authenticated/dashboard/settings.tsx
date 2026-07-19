import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { ProfileTab } from '@/components/settings/profile-tab'
import { SecurityTab } from '@/components/settings/security-tab'
import { User, ShieldCheck, EyeOff, CreditCard, Zap } from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'

// Define the valid tabs we support
const tabsSchema = z.object({
  tab: z
    .enum(['profile', 'security', 'billing', 'privacy', 'capabilities'])
    .catch('profile'),
})

export const Route = createFileRoute('/_authenticated/dashboard/settings')({
  validateSearch: tabsSchema,
  component: SettingsPage,
})

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User },

  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy', icon: EyeOff },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'capabilities', label: 'Capabilities', icon: Zap },
] as const

function SettingsPage() {
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const handleTabChange = (newTab: string) => {
    navigate({ search: { tab: newTab } })
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>

        {/* Scrollable Tabs Container with Edge Fade */}
        <div className="relative border-b w-full">
          {/* Edge fade mask on the scroll container */}
          <div
            className="overflow-x-auto scrollbar-hide"
            style={{
              maskImage:
                'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, black 85%, transparent 100%)',
            }}
          >
            <nav
              className="flex items-center min-w-max pb-px"
              aria-label="Settings Tabs"
            >
              {SETTINGS_TABS.map((t) => {
                const isActive = tab === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={cn(
                      'relative px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap outline-none cursor-pointer',
                      isActive
                        ? 'text-foreground bg-accent/50 rounded-t-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/25 rounded-t-md',
                    )}
                  >
                    <t.icon className="size-4" />
                    <span className="hidden sm:inline-block">{t.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      <div className="pb-10 transition-all duration-300">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'security' && <SecurityTab />}

        {/* Placeholders for future tabs */}
        {['billing', 'privacy', 'capabilities'].includes(tab) && (
          <ComingSoon
            title="Coming Soon"
            description={`The ${tab} settings are currently under development. Check back later.`}
          />
        )}
      </div>
    </div>
  )
}
