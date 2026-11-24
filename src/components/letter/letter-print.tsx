import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printA4 } from '@/lib/print-a4'
import { toast } from '@/lib/toast'
import { downloadSheetsPdf } from '../id-card/card-pdf'
import { LetterPage } from './letter-page'
import type { LetterContent } from './letter'

/**
 * Print letters (one per A4 page) or download them as one PDF.
 * Shared by the school, staff and student portals (keep the copies in step).
 */
export function LetterPrintButton({
  letters,
  mode = 'print',
  label,
  title = 'Letter',
  variant = 'outline',
  size = 'sm',
  disabled,
}: {
  letters: Array<LetterContent>
  mode?: 'print' | 'pdf'
  label?: string
  title?: string
  variant?: 'outline' | 'default' | 'secondary' | 'ghost'
  size?: 'sm' | 'default'
  disabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  useEffect(() => {
    if (!busy) return
    const el = ref.current
    if (!el) return
    let cancelled = false
    const imgs = Array.from(el.querySelectorAll('img'))
    Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((r) => {
              img.addEventListener('load', () => r(), { once: true })
              img.addEventListener('error', () => r(), { once: true })
            }),
      ),
    ).then(async () => {
      if (cancelled) return
      const sheets = Array.from(el.querySelectorAll<HTMLElement>('[data-letter-sheet]'))
      if (mode === 'print') {
        printA4(sheets, { title })
      } else {
        try {
          await downloadSheetsPdf(
            sheets,
            title,
            (done, total) => {
              if (!cancelled) setProgress(total > 1 ? `${Math.round((done / total) * 100)}%` : null)
            },
            { margin: 0, scale: 2 },
          )
        } catch {
          toast.error('Could not build the PDF. Use Print and choose "Save as PDF" instead.')
        }
      }
      setProgress(null)
      setBusy(false)
    })
    return () => {
      cancelled = true
    }
  }, [busy, mode, title])

  const Icon = mode === 'pdf' ? Download : Printer
  return (
    <>
      <Button variant={variant} size={size} className="gap-1.5" onClick={() => setBusy(true)} disabled={disabled || !letters.length || busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
        {busy && mode === 'pdf' ? `Building PDF${progress ? ` ${progress}` : ''}…` : (label ?? (mode === 'pdf' ? 'Download PDF' : 'Print'))}
      </Button>
      {busy && (
        <div ref={ref} aria-hidden style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
          {letters.map((c, i) => (
            <div key={i} data-letter-sheet style={{ width: 'fit-content' }}>
              <LetterPage content={c} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
