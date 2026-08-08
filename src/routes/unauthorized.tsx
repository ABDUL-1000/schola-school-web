import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedComponent,
})

function UnauthorizedComponent() {
  const handleReturnHome = () => {
    // Navigate back to the generic school login
    window.location.href = 'https://school.edumatrix.xyz'
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          School Not Found
        </h1>
        
        <p className="mt-4 text-base text-gray-500 dark:text-gray-400">
          We couldn't find a school associated with this web address. Please check the URL and try again.
        </p>
        
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleReturnHome} size="lg">
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  )
}
