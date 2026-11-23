import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { CertificateFront } from './certificate-face'
import { certSize } from './template'
import type { CertificateContext, CertificateDesign, CertificateRecord } from './template'

/**
 * A small certificate that leans toward the pointer, for grids and pickers.
 * Shared by the school and student portals (keep the copies in step).
 */
export function MiniCert({
  design,
  cert,
  ctx,
  width,
  className,
  tilt = true,
}: {
  design: CertificateDesign
  cert: CertificateRecord
  ctx: CertificateContext
  width: number
  className?: string
  tilt?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const glare = useRef<HTMLDivElement>(null)
  const { w, h } = certSize(design.orientation)
  const zoom = width / w

  const move = (e: React.PointerEvent) => {
    if (!tilt || e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ref.current.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 16}deg) rotateX(${(0.5 - py) * 12}deg) translateZ(8px)`
    if (glare.current) {
      glare.current.style.opacity = '1'
      glare.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,.45), transparent 55%)`
    }
  }
  const leave = () => {
    if (ref.current) ref.current.style.transform = ''
    if (glare.current) glare.current.style.opacity = '0'
  }

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      className={cn('relative overflow-hidden rounded-sm shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-out', className)}
      style={{ width, height: h * zoom, transformStyle: 'preserve-3d' }}
    >
      <div style={{ zoom, width: w, height: h, pointerEvents: 'none' }}>
        <CertificateFront design={design} cert={cert} ctx={ctx} />
      </div>
      <div ref={glare} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity" style={{ mixBlendMode: 'soft-light' }} />
    </div>
  )
}
