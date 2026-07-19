import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export const passwordCriteria = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One digit', test: (p: string) => /[0-9]/.test(p) },
  {
    label: 'One special character',
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
]

interface PasswordStrengthIndicatorProps {
  password: string
  showCriteria?: boolean
  showBar?: boolean
}

export function PasswordStrengthIndicator({
  password,
  showCriteria = true,
  showBar = true,
}: PasswordStrengthIndicatorProps) {
  const score = passwordCriteria.filter((c) => c.test(password)).length

  return (
    <div className="space-y-3">
      {showBar && (
        <div className="flex gap-1 justify-end">
          {[1, 2, 3].map((s) => {
            let color = 'bg-muted'
            if (score >= 1 && s === 1) color = 'bg-red-500'
            if (score >= 3 && s <= 2) color = 'bg-yellow-500'
            if (score === 4) color = 'bg-green-500'

            return (
              <div
                key={s}
                className={cn('h-1 w-8 rounded-full transition-colors', color)}
              />
            )
          })}
        </div>
      )}

      {showCriteria && (
        <div className="flex flex-wrap gap-2 pt-1">
          {passwordCriteria.map((c, i) => {
            const isMet = c.test(password)
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all border',
                  isMet
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-muted/30 text-muted-foreground border-transparent',
                )}
              >
                {isMet ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                )}
                {c.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
