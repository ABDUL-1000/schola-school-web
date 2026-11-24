import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MailOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LETTER_H, LETTER_W, LetterPage } from './letter-page'
import type { LetterContent } from './letter'

/**
 * Opening a letter: the envelope drops in, the wax seal breaks, the flap opens
 * and the letter slides out, then unfolds to full size. After that it can be
 * read, tilted and downloaded. "Read again" replays it.
 * Shared by the school, staff and student portals (keep the copies in step).
 */

type Phase = 'drop' | 'open' | 'out' | 'read'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16)
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const to = amount > 0 ? 255 : 0
  const t = Math.abs(amount)
  return `rgb(${rgb.map((v) => Math.round(v + (to - v) * t)).join(', ')})`
}

export function LetterViewer({
  content,
  actions,
  envelope = true,
  replayKey,
  className,
}: {
  content: LetterContent
  actions?: ReactNode
  /** Play the envelope opening first. */
  envelope?: boolean
  replayKey?: string | number
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [phase, setPhase] = useState<Phase>(envelope ? 'drop' : 'read')
  const [run, setRun] = useState(0)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth(el.clientWidth))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!envelope || reducedMotion()) {
      setPhase('read')
      return
    }
    setPhase('drop')
    const timers = [setTimeout(() => setPhase('open'), 650), setTimeout(() => setPhase('out'), 1350), setTimeout(() => setPhase('read'), 2450)]
    return () => timers.forEach(clearTimeout)
  }, [envelope, replayKey, run])

  const a = content.accentColor
  const scale = Math.min(1, (width - 8) / LETTER_W)
  const ew = Math.min(width - 32, 440)
  const eh = ew * 0.62
  const inner = (ew - 28) / LETTER_W

  // A gentle tilt toward the pointer while reading.
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !paperRef.current) return
    const r = paperRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    paperRef.current.style.transform = `perspective(1600px) rotateY(${px * 5}deg) rotateX(${-py * 4}deg)`
  }
  const leave = () => {
    if (paperRef.current) paperRef.current.style.transform = ''
  }

  return (
    <div ref={wrapRef} className={cn('w-full', className)}>
      {phase === 'read' ? (
        <div className="flex justify-center animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700" onPointerMove={move} onPointerLeave={leave}>
          <div
            ref={paperRef}
            className="relative shadow-[0_12px_40px_-8px_rgba(0,0,0,.35)] ring-1 ring-black/5 transition-transform duration-300 ease-out"
            style={{ width: LETTER_W * scale, height: LETTER_H * scale }}
          >
            <div style={{ zoom: scale, width: LETTER_W, height: LETTER_H }}>
              <LetterPage content={content} />
            </div>
            {/* faint fold lines, as if it came out of the envelope */}
            <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
          </div>
        </div>
      ) : (
        <div className="relative mx-auto select-none" style={{ width: ew, height: eh + eh * 1.05, perspective: 1200 }} aria-label="Opening the letter">
          <div
            className={cn('absolute inset-x-0 bottom-0 transition-all duration-700', phase === 'drop' && 'animate-in fade-in slide-in-from-top-24 zoom-in-90 duration-700')}
            style={{ height: eh, transformStyle: 'preserve-3d' }}
          >
            {/* back of the envelope */}
            <div className="absolute inset-0 rounded-md" style={{ background: shade(a, -0.25), boxShadow: '0 18px 40px -10px rgba(0,0,0,.45)' }} />
            {/* the letter, sliding out */}
            <div
              className="absolute overflow-hidden bg-white shadow-md"
              style={{
                left: 14,
                right: 14,
                height: eh - 18,
                bottom: 10,
                transform: phase === 'out' ? `translateY(${-eh * 0.95}px)` : 'translateY(0)',
                transition: 'transform 1000ms cubic-bezier(.2,.8,.2,1)',
                zIndex: phase === 'out' ? 3 : 1,
              }}
            >
              <div style={{ zoom: inner, width: LETTER_W, height: LETTER_H }}>
                <LetterPage content={content} />
              </div>
            </div>
            {/* front pocket */}
            <div
              className="absolute inset-0 rounded-md"
              style={{
                zIndex: 2,
                background: `linear-gradient(160deg, ${shade(a, 0.15)}, ${a})`,
                clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)',
              }}
            >
              <div className="absolute inset-x-0 bottom-3 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">{content.school.schoolName}</div>
            </div>
            {/* flap */}
            <div
              className="absolute inset-x-0 top-0 origin-top"
              style={{
                height: eh * 0.56,
                zIndex: phase === 'drop' ? 4 : 0,
                transform: phase === 'drop' ? 'rotateX(0deg)' : 'rotateX(180deg)',
                transition: 'transform 650ms cubic-bezier(.4,.1,.2,1)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="absolute inset-0" style={{ background: shade(a, -0.1), clipPath: 'polygon(0 0, 100% 0, 50% 100%)', backfaceVisibility: 'hidden' }} />
              <div className="absolute inset-0" style={{ background: shade(a, -0.35), clipPath: 'polygon(0 0, 100% 0, 50% 100%)', transform: 'rotateX(180deg)', backfaceVisibility: 'hidden' }} />
            </div>
            {/* wax seal: cracks and falls away as the flap lifts */}
            <div
              className="absolute left-1/2 flex items-center justify-center rounded-full text-[11px] font-bold text-white/90"
              style={{
                zIndex: 5,
                width: 46,
                height: 46,
                marginLeft: -23,
                top: eh * 0.56 - 26,
                background: 'radial-gradient(circle at 35% 30%, #ef4444, #991b1b 70%)',
                boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.35), 0 3px 6px rgba(0,0,0,.35)',
                transform: phase === 'drop' ? 'scale(1) rotate(0deg)' : 'translateY(60px) scale(.6) rotate(40deg)',
                opacity: phase === 'drop' ? 1 : 0,
                transition: 'transform 600ms ease-in, opacity 500ms ease-in',
              }}
            >
              {content.school.schoolName
                .split(/\s+/)
                .filter((w) => /^[a-z]/i.test(w))
                .map((w) => w[0].toUpperCase())
                .join('')
                .slice(0, 3)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {envelope && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setRun((n) => n + 1)} disabled={phase !== 'read'}>
            <MailOpen className="size-4" /> Open again
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
