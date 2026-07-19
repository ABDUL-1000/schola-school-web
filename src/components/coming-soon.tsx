import { cn } from '@/lib/utils'

interface ComingSoonProps {
  title?: string
  description?: React.ReactNode
  className?: string
}

export function ComingSoon({
  title = 'Currently in Development',
  description = 'We are working hard to bring this feature to you. Please check back later.',
  className,
}: ComingSoonProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed rounded-3xl bg-linear-to-b from-card/50 to-muted/20',
        className,
      )}
    >
      <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
        {/* Glow behind */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse duration-3000" />

        {/* Main Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10 w-24 h-24 text-primary drop-shadow-sm opacity-90"
        >
          <path d="M12 3v3" />
          <path d="M18.36 5.64l-2.12 2.12" />
          <path d="M21 12h-3" />
          <path d="M18.36 18.36l-2.12-2.12" />
          <path d="M12 21v-3" />
          <path d="M5.64 18.36l2.12-2.12" />
          <path d="M3 12h3" />
          <path d="M5.64 5.64l2.12 2.12" />
          <circle cx="12" cy="12" r="4" className="fill-primary/20" />
        </svg>

        {/* Floating Elements */}
        <div
          className="absolute -top-2 -right-4 text-primary/60 animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 18l6-6-6-6" />
          </svg>
        </div>
        <div
          className="absolute -bottom-2 -left-4 text-primary/60 animate-bounce"
          style={{ animationDuration: '4s' }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 6l-6 6 6 6" />
          </svg>
        </div>
      </div>

      <h3 className="text-2xl font-bold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-base text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  )
}
