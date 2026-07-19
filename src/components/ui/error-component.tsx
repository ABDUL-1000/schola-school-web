

interface GlobalErrorComponentProps {
  error: any;
  reset?: () => void;
}

export function GlobalErrorComponent({ error, reset }: GlobalErrorComponentProps) {
  return (
    <div className="min-h-[400px] h-full w-full flex items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-md w-full text-center space-y-6 p-8 border border-red-100 dark:border-red-900/30 rounded-2xl shadow-sm bg-white dark:bg-black">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-red-600 dark:text-red-500"
          >
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Something went wrong!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-words">
            {error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Home
          </button>
          {reset && (
            <button 
              onClick={() => reset()} 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
