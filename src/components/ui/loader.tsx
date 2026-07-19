'use client'

import { Loader2 } from 'lucide-react'

export function FullscreenLoader({
  message = 'Loading your dashboard...',
}: {
  message?: string
}) {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
    </div>
  )
}
