import { toast as sonnerToast } from 'sonner'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info' | 'warning' | 'loading'
}

const ToastComponent = ({
  title,
  description,
  variant = 'info',
}: ToastProps) => {
  const variantStyles = {
    success: {
      border: 'border-l-green-500',
      icon: <CheckCircle2 className="size-5 text-green-500 shrink-0" />,
    },
    error: {
      border: 'border-l-red-500',
      icon: <XCircle className="size-5 text-red-500 shrink-0" />,
    },
    info: {
      border: 'border-l-blue-500',
      icon: <Info className="size-5 text-blue-500 shrink-0" />,
    },
    warning: {
      border: 'border-l-yellow-500',
      icon: <AlertCircle className="size-5 text-yellow-500 shrink-0" />,
    },
    loading: {
      border: 'border-l-blue-500',
      icon: <Loader2 className="size-5 text-blue-500 shrink-0 animate-spin" />,
    },
  }

  const { border, icon } = variantStyles[variant]

  return (
    <div
      className={cn(
        'bg-popover text-popover-foreground border-border rounded-md flex w-[356px] items-start gap-3 border border-l-4 p-4 shadow-lg animate-in fade-in slide-in-from-top-2',
        border,
      )}
    >
      {icon}
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold leading-none">{title}</p>
        {description && (
          <p className="text-muted-foreground text-xs leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => sonnerToast.dismiss()}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

type ToastOptions = {
  description?: string
}

const getArgs = (
  title: string,
  optionsOrDescription?: string | ToastOptions,
) => {
  if (typeof optionsOrDescription === 'string') {
    return { title, description: optionsOrDescription }
  }
  return { title, description: optionsOrDescription?.description }
}

export const toast = {
  success: (title: string, optionsOrDescription?: string | ToastOptions) => {
    const { description } = getArgs(title, optionsOrDescription)
    return sonnerToast.custom(() => (
      <ToastComponent
        title={title}
        description={description}
        variant="success"
      />
    ))
  },
  error: (title: string, optionsOrDescription?: string | ToastOptions) => {
    const { description } = getArgs(title, optionsOrDescription)
    return sonnerToast.custom(() => (
      <ToastComponent title={title} description={description} variant="error" />
    ))
  },
  info: (title: string, optionsOrDescription?: string | ToastOptions) => {
    const { description } = getArgs(title, optionsOrDescription)
    return sonnerToast.custom(() => (
      <ToastComponent title={title} description={description} variant="info" />
    ))
  },
  warning: (title: string, optionsOrDescription?: string | ToastOptions) => {
    const { description } = getArgs(title, optionsOrDescription)
    return sonnerToast.custom(() => (
      <ToastComponent
        title={title}
        description={description}
        variant="warning"
      />
    ))
  },
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    },
  ) => {
    const id = sonnerToast.custom(() => (
      <ToastComponent title={loading} variant="loading" />
    ))

    promise
      .then((data) => {
        const title = typeof success === 'function' ? success(data) : success
        sonnerToast.custom(
          () => <ToastComponent title={title} variant="success" />,
          { id },
        )
      })
      .catch((err) => {
        const title = typeof error === 'function' ? error(err) : error
        sonnerToast.custom(
          () => <ToastComponent title={title} variant="error" />,
          { id },
        )
      })

    return promise
  },
  dismiss: sonnerToast.dismiss,
}
