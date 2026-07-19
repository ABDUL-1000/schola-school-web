import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
}

interface RegistrationStepperProps {
  currentStep: number
  steps: Array<Step>
  variant?: 'default' | 'white'
  orientation?: 'vertical' | 'horizontal'
}

export function RegistrationStepper({
  currentStep,
  steps,
  variant = 'default',
  orientation = 'vertical',
}: RegistrationStepperProps) {
  const isHorizontal = orientation === 'horizontal'

  return (
    <div
      className={cn(
        'flex',
        isHorizontal
          ? 'flex-row items-center justify-between w-full'
          : 'flex-col space-y-8',
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isActive = currentStep === step.id
        const isLast = index === steps.length - 1

        return (
          <div
            key={step.id}
            className={cn(
              'relative flex items-center',
              isHorizontal ? 'flex-1 last:flex-none' : 'gap-4',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  isCompleted
                    ? variant === 'white'
                      ? 'bg-blue-300 border-blue-300 text-blue-950'
                      : 'bg-primary border-primary text-primary-foreground'
                    : isActive
                      ? variant === 'white'
                        ? 'border-blue-300 text-blue-300'
                        : 'border-primary text-primary'
                      : variant === 'white'
                        ? 'border-white/30 text-white/50'
                        : 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>

              <div
                className={cn(
                  'flex flex-col',
                  isHorizontal && 'hidden sm:flex',
                )}
              >
                <span
                  className={cn(
                    'text-sm font-semibold whitespace-nowrap',
                    isActive
                      ? variant === 'white'
                        ? 'text-blue-300'
                        : 'text-primary'
                      : variant === 'white'
                        ? 'text-white'
                        : 'text-foreground',
                  )}
                >
                  {step.title}
                </span>
                {!isHorizontal && (
                  <span
                    className={cn(
                      'text-xs',
                      variant === 'white'
                        ? 'text-white/60'
                        : 'text-muted-foreground',
                    )}
                  >
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'flex-1',
                  isHorizontal
                    ? 'mx-4 h-[2px] min-w-[20px]'
                    : 'absolute left-5 top-10 w-[2px] h-full -ml-px',
                  isCompleted
                    ? variant === 'white'
                      ? 'bg-blue-300'
                      : 'bg-primary'
                    : variant === 'white'
                      ? 'bg-white/20'
                      : 'bg-border',
                  isHorizontal ? '' : 'border-dashed border-l-2',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
