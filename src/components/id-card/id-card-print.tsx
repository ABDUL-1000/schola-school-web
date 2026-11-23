import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printA4 } from '@/lib/print-a4'
import { toast } from '@/lib/toast'
import { downloadSheetsPdf } from './card-pdf'
import { IdCardBack, IdCardFront } from './id-card-face'
import { cardSize } from './template'
import type { IdCardContext, IdCardPerson, IdCardTemplate } from './template'

/**
 * Print ID cards at real size (85.6 × 54 mm) on A4, with light cutting guides.
 * Each page of fronts is followed by a page of their backs, mirrored, so
 * printing double-sided (flip on long edge) puts every back behind its front.
 *
 * Shared by the school, staff and student portals (keep the copies in step).
 */

const GAP_MM = 4

function perPage(t: IdCardTemplate) {
  return t.orientation === 'portrait' ? { cols: 3, rows: 3 } : { cols: 2, rows: 4 }
}

function Sheet({
  people,
  template,
  ctx,
  side,
}: {
  people: Array<IdCardPerson | null>
  template: IdCardTemplate
  ctx: Pick<IdCardContext, 'school' | 'session'>
  side: 'front' | 'back'
}) {
  const { cols } = perPage(template)
  const { w, h } = cardSize(template.orientation)
  return (
    <div data-id-sheet style={{ background: '#fff', display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${w}px)`, gap: `${GAP_MM}mm`, direction: side === 'back' ? 'rtl' : 'ltr' }}>
        {people.map((p, i) => (
          <div key={i} style={{ width: w, height: h, outline: p ? '0.5px dashed #cbd5e1' : undefined, outlineOffset: 1, borderRadius: 12, direction: 'ltr' }}>
            {p && (side === 'front' ? <IdCardFront template={template} ctx={ctx} person={p} /> : <IdCardBack template={template} ctx={ctx} person={p} />)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function IdCardPrintButton({
  people,
  template,
  ctx,
  label = 'Print',
  title = 'ID cards',
  variant = 'outline',
  size = 'sm',
  disabled,
  mode = 'print',
}: {
  people: Array<IdCardPerson>
  template: IdCardTemplate
  ctx: Pick<IdCardContext, 'school' | 'session'>
  label?: string
  title?: string
  variant?: 'outline' | 'default' | 'secondary'
  size?: 'sm' | 'default'
  disabled?: boolean
  /** 'print' opens the print dialog; 'pdf' downloads a PDF file straight away. */
  mode?: 'print' | 'pdf'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<Array<Array<IdCardPerson | null>> | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const printable = people.filter((p) => !p.locked)

  const start = () => {
    if (!printable.length) return
    const { cols, rows } = perPage(template)
    const n = cols * rows
    const out: Array<Array<IdCardPerson | null>> = []
    for (let i = 0; i < printable.length; i += n) {
      const chunk: Array<IdCardPerson | null> = printable.slice(i, i + n)
      // Fill the last row so the mirrored backs line up with their fronts.
      while (chunk.length % cols) chunk.push(null)
      out.push(chunk)
    }
    setPages(out)
  }

  useEffect(() => {
    if (!pages) return
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
      const sheets = Array.from(el.querySelectorAll<HTMLElement>('[data-id-sheet]'))
      if (mode === 'print') {
        printA4(sheets, { title })
      } else {
        try {
          await downloadSheetsPdf(sheets, title, (done, total) => {
            if (!cancelled) setProgress(total > 2 ? `${Math.round((done / total) * 100)}%` : null)
          })
        } catch {
          toast.error('Could not build the PDF. Use Print and choose "Save as PDF" instead.')
        }
      }
      setProgress(null)
      setPages(null)
    })
    return () => {
      cancelled = true
    }
  }, [pages, title, mode])

  return (
    <>
      <Button variant={variant} size={size} className="gap-1.5" onClick={start} disabled={disabled || !printable.length || !!pages}>
        {pages ? <Loader2 className="size-4 animate-spin" /> : mode === 'pdf' ? <Download className="size-4" /> : <Printer className="size-4" />}
        {pages && mode === 'pdf' ? `Building PDF${progress ? ` ${progress}` : ''}…` : label}
      </Button>
      {pages && (
        <div ref={ref} aria-hidden style={{ position: 'fixed', left: -100000, top: 0, width: 760, pointerEvents: 'none' }}>
          {pages.flatMap((page, i) => [
            <Sheet key={`f${i}`} people={page} template={template} ctx={ctx} side="front" />,
            <Sheet key={`b${i}`} people={page} template={template} ctx={ctx} side="back" />,
          ])}
        </div>
      )}
    </>
  )
}
