import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printA4 } from '@/lib/print-a4'
import { toast } from '@/lib/toast'
import { downloadSheetsPdf } from '../id-card/card-pdf'
import { CertificateFront } from './certificate-face'
import { CERT_FONT_CSS } from './fonts'
import type { CertificateContext, CertificateDesign, CertificateRecord } from './template'

/**
 * Print certificates (one per A4 page) or download them as one PDF.
 * Shared by the school and student portals (keep the copies in step).
 */

export type PrintableCertificate = { cert: CertificateRecord; design: CertificateDesign }

export function CertificatePrintButton({
  items,
  ctx,
  mode = 'print',
  label,
  title = 'Certificates',
  variant = 'outline',
  size = 'sm',
  disabled,
}: {
  items: Array<PrintableCertificate>
  ctx: CertificateContext
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
    Promise.all([
      document.fonts.ready,
      ...imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((r) => {
              img.addEventListener('load', () => r(), { once: true })
              img.addEventListener('error', () => r(), { once: true })
            }),
      ),
    ]).then(async () => {
      if (cancelled) return
      const sheets = Array.from(el.querySelectorAll<HTMLElement>('[data-cert-sheet]'))
      if (mode === 'print') {
        printA4(sheets, { title, landscape: items[0]?.design.orientation === 'landscape' })
      } else {
        try {
          await downloadSheetsPdf(
            sheets,
            title,
            (done, total) => {
              if (!cancelled) setProgress(total > 1 ? `${Math.round((done / total) * 100)}%` : null)
            },
            { landscape: 'auto', margin: 0, scale: 2, fontCss: CERT_FONT_CSS },
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
  }, [busy, mode, title, items])

  const Icon = mode === 'pdf' ? Download : Printer
  return (
    <>
      <Button variant={variant} size={size} className="gap-1.5" onClick={() => setBusy(true)} disabled={disabled || !items.length || busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
        {busy && mode === 'pdf' ? `Building PDF${progress ? ` ${progress}` : ''}…` : (label ?? (mode === 'pdf' ? 'Download PDF' : 'Print'))}
      </Button>
      {busy && (
        <div ref={ref} aria-hidden style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
          {items.map(({ cert, design }) => (
            <div key={cert.id} data-cert-sheet style={{ width: 'fit-content' }}>
              <CertificateFront design={design} cert={cert} ctx={ctx} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
