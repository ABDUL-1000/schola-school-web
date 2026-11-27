import { useEffect, useState } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * In-app replacements for the browser's confirm(), alert() and prompt() boxes.
 * Call them from anywhere (no hooks needed) and await the answer:
 *
 *   if (!(await confirmDialog({ title: 'Delete this paper?', danger: true }))) return
 *
 * <DialogHost /> (mounted once in the root layout) shows them.
 * Shared by the school, staff and student portals (keep the copies in step).
 */

export interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  /** Red button for deleting or other things that can't be undone. */
  danger?: boolean
}
export interface PromptField {
  label: string
  defaultValue?: string
  type?: 'text' | 'number'
  min?: number
  max?: number
}

type Request =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'alert'; opts: { title: string; description?: string; okText?: string }; resolve: () => void }
  | { kind: 'prompt'; opts: { title: string; description?: string; fields: Array<PromptField>; confirmText?: string }; resolve: (v: Array<string> | null) => void }

let queue: Array<Request> = []
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const push = (r: Request) => {
  queue = [...queue, r]
  notify()
}

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => push({ kind: 'confirm', opts, resolve }))
}

export function alertDialog(opts: { title: string; description?: string; okText?: string }): Promise<void> {
  return new Promise((resolve) => push({ kind: 'alert', opts, resolve }))
}

/** Ask for one or more values. Resolves with the values, or null if cancelled. */
export function promptDialog(opts: { title: string; description?: string; fields: Array<PromptField>; confirmText?: string }): Promise<Array<string> | null> {
  return new Promise((resolve) => push({ kind: 'prompt', opts, resolve }))
}

export function DialogHost() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const l = () => setTick((t) => t + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  const current = queue.at(0)
  const [values, setValues] = useState<Array<string>>([])
  useEffect(() => {
    if (current?.kind === 'prompt') setValues(current.opts.fields.map((f) => f.defaultValue ?? ''))
  }, [current])

  const close = (answer: unknown) => {
    if (!current) return
    queue = queue.slice(1)
    ;(current.resolve as (v: unknown) => void)(answer)
    notify()
  }
  if (!current) return null

  const danger = current.kind === 'confirm' && current.opts.danger
  const Icon = danger ? AlertTriangle : Info

  return (
    <AlertDialog
      open
      onOpenChange={(o) => {
        if (!o) close(current.kind === 'confirm' ? false : current.kind === 'prompt' ? null : undefined)
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            close(current.kind === 'confirm' ? true : current.kind === 'prompt' ? values : undefined)
          }}
        >
          <AlertDialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
            <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', danger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <AlertDialogTitle className="text-base leading-snug">{current.opts.title}</AlertDialogTitle>
              {current.opts.description ? (
                <AlertDialogDescription className="text-sm">{current.opts.description}</AlertDialogDescription>
              ) : (
                <AlertDialogDescription className="sr-only">{current.opts.title}</AlertDialogDescription>
              )}
            </div>
          </AlertDialogHeader>

          {current.kind === 'prompt' && (
            <div className={cn('mt-4 grid gap-3', current.opts.fields.length > 1 && 'grid-cols-2')}>
              {current.opts.fields.map((f, i) => (
                <div key={i} className="space-y-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    autoFocus={i === 0}
                    type={f.type ?? 'text'}
                    min={f.min}
                    max={f.max}
                    value={values[i] ?? ''}
                    onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                  />
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter className="mt-5 gap-2 sm:gap-2">
            {current.kind !== 'alert' && (
              <Button type="button" variant="outline" onClick={() => close(current.kind === 'confirm' ? false : null)}>
                {current.kind === 'confirm' ? (current.opts.cancelText ?? 'Cancel') : 'Cancel'}
              </Button>
            )}
            <Button type="submit" variant={danger ? 'destructive' : 'default'} autoFocus={current.kind !== 'prompt'}>
              {current.kind === 'confirm' ? (current.opts.confirmText ?? 'Continue') : current.kind === 'prompt' ? (current.opts.confirmText ?? 'OK') : (current.opts.okText ?? 'OK')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
