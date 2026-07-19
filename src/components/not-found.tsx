import { Link } from '@tanstack/react-router'
import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center transition-colors duration-300">
      <div className="space-y-8 max-w-md animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="relative group">
            <SearchX className="size-32 text-muted-foreground/20 transition-transform group-hover:scale-110 duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black tracking-tighter opacity-30 select-none">
                404
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl italic">
            Lost?
          </h2>
          <p className="text-muted-foreground text-lg max-w-[280px] mx-auto leading-relaxed">
            Sorry, the page you are looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <div className="flex items-center justify-center pt-4">
          <Button
            asChild
            size="lg"
            className="rounded-full px-12 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
