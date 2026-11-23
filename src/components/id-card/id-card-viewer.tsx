import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Rotate3d, RotateCcw, Repeat2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cardSize, shade, textOn } from './template'
import type { IdCardOrientation } from './template'

/**
 * A 3D ID card on a lanyard: drag to turn it (it keeps spinning a little and
 * settles on a side), tap to flip, "360°" to show it off. Light catches the
 * plastic and the hologram shimmers as it turns; when left alone it floats.
 *
 * Shared by the school, staff and student portals (keep the copies in step).
 * Pure CSS 3D + requestAnimationFrame: no libraries.
 */

type Props = {
  front: ReactNode
  back: ReactNode
  orientation: IdCardOrientation
  primaryColor: string
  accentColor: string
  /** Printed along the lanyard strap. */
  strapText?: string
  lanyard?: boolean
  maxScale?: number
  /** Change it (e.g. a different person) to replay the swap-in spin. */
  replayKey?: string | number
  /** Extra buttons next to Flip / 360° / Reset. */
  actions?: ReactNode
  className?: string
}

const STRAP = 64 // lanyard length above the card (px)
const THICK = 2.4 // half the card's thickness (px)
const LAYERS = 5

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function IdCardViewer({
  front,
  back,
  orientation,
  primaryColor,
  accentColor,
  strapText,
  lanyard = true,
  maxScale = 1.55,
  replayKey,
  actions,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const swingRef = useRef<HTMLDivElement>(null)
  const floatRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const shineRefs = useRef<Array<HTMLDivElement | null>>([])
  const holoRefs = useRef<Array<HTMLDivElement | null>>([])

  const { w, h } = cardSize(orientation)
  const [scale, setScale] = useState(1)
  const [side, setSide] = useState<'front' | 'back'>('front')

  // Everything the animation loop needs, kept out of React state so it runs at 60fps.
  const m = useRef({
    ry: -540, // turn (deg)
    vy: 0,
    rx: 38, // tilt (deg)
    vx: 0,
    base: 0, // the side it settles on (a multiple of 180)
    hoverX: 0,
    hoverY: 0,
    s: 0.35, // entrance scale
    vs: 0,
    swing: 0, // lanyard swing (deg)
    vswing: 0,
    float: 0, // 0..1, how much it floats (only when idle)
    lastInput: 0,
    dragging: false,
    pointer: { x: 0, y: 0, t: 0, startX: 0, startY: 0, startT: 0, moved: 0 },
    side: 'front',
  })

  // Fit the card to the space available.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      // Leave room for the sway and perspective so the card never touches the edges.
      const avail = (el.clientWidth - 24) * 0.84
      const tall = orientation === 'portrait' ? 430 : 300
      setScale(Math.max(0.6, Math.min(maxScale, avail / w, tall / h)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [orientation, w, h, maxScale])

  // Entrance: spin in from afar. Replays (shorter) when replayKey changes.
  const first = useRef(true)
  useEffect(() => {
    const s = m.current
    if (reducedMotion()) {
      Object.assign(s, { ry: s.base, rx: 0, s: 1, vy: 0, vx: 0, vs: 0 })
      return
    }
    if (first.current) {
      first.current = false
      return // initial values above already set the big entrance
    }
    s.base = 0
    s.ry = -360
    s.rx = 18
    s.s = 0.82
    s.vswing += 40
  }, [replayKey])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const calm = reducedMotion()

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = m.current
      const idle = !s.dragging && now - s.lastInput > 1800 && Math.abs(s.vy) < 8

      // Float gently when nobody is touching it.
      s.float += ((idle && !calm ? 1 : 0) - s.float) * Math.min(1, dt * 1.5)
      const t = now / 1000
      const sway = Math.sin(t * 0.55) * 9 * s.float
      const bob = Math.sin(t * 1.4) * 5 * s.float

      if (!s.dragging) {
        // Springs: turn settles on its side (with a small overshoot), tilt returns level.
        const ty = s.base + s.hoverY + sway
        const tx = s.hoverX + Math.sin(t * 0.9) * 3 * s.float
        s.vy += (90 * (ty - s.ry) - 10.5 * s.vy) * dt
        s.ry += s.vy * dt
        s.vx += (110 * (tx - s.rx) - 13 * s.vx) * dt
        s.rx += s.vx * dt
      }
      s.vs += (80 * (1 - s.s) - 11 * s.vs) * dt
      s.s += s.vs * dt
      s.vswing += (-26 * s.swing - 2.6 * s.vswing) * dt
      s.swing += s.vswing * dt
      s.swing = Math.max(-28, Math.min(28, s.swing))

      // How far it is turned away from facing you, -90..90.
      const norm = ((s.ry % 360) + 360) % 360
      const facing = norm > 90 && norm < 270 ? 'back' : 'front'
      const off = facing === 'front' ? (norm > 180 ? norm - 360 : norm) : norm - 180

      if (cardRef.current) cardRef.current.style.transform = `rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.s})`
      if (floatRef.current) floatRef.current.style.transform = `translateY(${bob}px)`
      if (swingRef.current) swingRef.current.style.transform = `rotate(${s.swing}deg)`
      if (shadowRef.current) {
        const sx = Math.max(0.3, Math.abs(Math.cos((off * Math.PI) / 180))) * s.s
        shadowRef.current.style.transform = `translateX(${-s.swing * 2.2}px) scale(${sx}, ${s.s})`
        shadowRef.current.style.opacity = String(0.55 - s.float * 0.15 - Math.abs(s.rx) / 200)
      }
      const gx = 50 - off * 1.4
      const gy = 50 + s.rx * 1.8
      const strength = Math.min(1, (Math.abs(off) + Math.abs(s.rx)) / 35)
      for (const el of shineRefs.current) {
        if (!el) continue
        el.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.55), rgba(255,255,255,.08) 38%, transparent 62%)`
        el.style.opacity = String(0.25 + strength * 0.55)
      }
      for (const el of holoRefs.current) {
        if (!el) continue
        el.style.backgroundPosition = `${50 + off * 2.2}% ${50 + s.rx * 2}%`
        el.style.opacity = String(0.08 + strength * 0.32)
      }
      if (facing !== s.side) {
        s.side = facing
        setSide(facing)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const touch = () => {
    m.current.lastInput = performance.now()
  }

  const flip = useCallback(() => {
    const s = m.current
    touch()
    s.base = Math.round(s.ry / 180) * 180 + 180
    s.vswing += 18
  }, [])
  const spin = useCallback(() => {
    const s = m.current
    touch()
    s.base = Math.round(s.ry / 180) * 180 + 360
    s.vy += 200
    s.vswing -= 25
  }, [])
  const reset = useCallback(() => {
    const s = m.current
    touch()
    s.base = Math.round(s.ry / 360) * 360
    s.hoverX = s.hoverY = 0
  }, [])
  const showSide = (want: 'front' | 'back') => {
    if (want !== m.current.side) flip()
  }

  // ----- pointer: drag to turn, tap to flip, hover to tilt -----
  const onPointerDown = (e: React.PointerEvent) => {
    const s = m.current
    touch()
    s.dragging = true
    s.pointer = { x: e.clientX, y: e.clientY, t: performance.now(), startX: e.clientX, startY: e.clientY, startT: performance.now(), moved: 0 }
    s.vy = 0
    s.vx = 0
    s.hoverX = s.hoverY = 0
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = m.current
    if (s.dragging) {
      touch()
      const now = performance.now()
      const dt = Math.max(1, now - s.pointer.t) / 1000
      const dx = e.clientX - s.pointer.x
      const dy = e.clientY - s.pointer.y
      s.ry += dx * 0.5
      s.rx = Math.max(-45, Math.min(45, s.rx - dy * 0.35))
      // Smoothed velocity, used for the throw when you let go.
      s.vy = s.vy * 0.6 + ((dx * 0.5) / dt) * 0.4
      s.vx = s.vx * 0.6 + ((-dy * 0.35) / dt) * 0.4
      s.vswing += dx * 0.9
      s.pointer.moved += Math.abs(dx) + Math.abs(dy)
      s.pointer.x = e.clientX
      s.pointer.y = e.clientY
      s.pointer.t = now
    } else if (e.pointerType === 'mouse' && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      s.hoverY = (px - 0.5) * 24
      s.hoverX = (0.5 - py) * 16
      touch()
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = m.current
    if (!s.dragging) return
    s.dragging = false
    touch()
    const quick = performance.now() - s.pointer.startT < 320
    if (s.pointer.moved < 6 && quick) {
      flip()
      return
    }
    // Throw: carry on in the direction of the drag, then land on the nearest side.
    const vy = Math.max(-1400, Math.min(1400, s.vy))
    s.vy = vy
    s.base = Math.round((s.ry + vy * 0.22) / 180) * 180
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }
  const onLeave = () => {
    m.current.hoverX = m.current.hoverY = 0
  }
  const onKey = (e: React.KeyboardEvent) => {
    const s = m.current
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      flip()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      touch()
      s.vy += e.key === 'ArrowLeft' ? -260 : 260
      s.base = Math.round((s.ry + (e.key === 'ArrowLeft' ? -180 : 180)) / 180) * 180
    }
  }

  const cw = w * scale
  const ch = h * scale
  const strapLen = lanyard ? STRAP : 0
  const stageH = strapLen + ch + 70
  const onP = textOn(primaryColor)

  const face = (content: ReactNode, i: 0 | 1) => (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        borderRadius: 12 * scale,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: i === 0 ? `translateZ(${THICK}px)` : `rotateY(180deg) translateZ(${THICK}px)`,
        boxShadow: '0 0 0 1px rgba(0,0,0,.06)',
      }}
    >
      <div style={{ zoom: scale, width: w, height: h }}>{content}</div>
      {/* hologram foil */}
      <div
        ref={(el) => {
          holoRefs.current[i] = el
        }}
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(115deg, transparent 18%, rgba(255,0,170,.55) 30%, rgba(0,210,255,.55) 42%, rgba(0,255,140,.5) 54%, rgba(255,230,0,.55) 66%, transparent 80%)',
          backgroundSize: '300% 300%',
          mixBlendMode: 'color-dodge',
          opacity: 0.1,
        }}
      />
      {/* light on the plastic */}
      <div
        ref={(el) => {
          shineRefs.current[i] = el
        }}
        className="pointer-events-none absolute inset-0"
        style={{ mixBlendMode: 'overlay' }}
      />
      {/* laminate edge highlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ borderRadius: 12 * scale, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(0,0,0,.08)' }}
      />
    </div>
  )

  return (
    <div ref={wrapRef} className={cn('w-full select-none', className)}>
      <div
        ref={stageRef}
        role="img"
        tabIndex={0}
        aria-label={`ID card, showing the ${side}. Drag to turn, press Enter to flip.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onLeave}
        onKeyDown={onKey}
        className="relative mx-auto cursor-grab overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
        style={{
          height: stageH,
          touchAction: 'none',
          perspective: 1300,
          background: `radial-gradient(ellipse at 50% 35%, ${shade(primaryColor, 0.88)}55, transparent 70%)`,
        }}
      >
        {/* floor shadow */}
        <div
          ref={shadowRef}
          className="pointer-events-none absolute left-1/2"
          style={{
            bottom: 22,
            width: cw * 0.85,
            height: 22,
            marginLeft: -(cw * 0.85) / 2,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,.45), transparent 70%)',
            filter: 'blur(6px)',
          }}
        />
        {/* lanyard + card swing together from the top */}
        <div ref={swingRef} className="absolute inset-x-0 top-0" style={{ transformOrigin: '50% 0', transformStyle: 'preserve-3d' }}>
          {lanyard && (
            <>
              <div
                className="absolute left-1/2 top-0 flex items-center justify-center overflow-hidden"
                style={{
                  width: 24,
                  marginLeft: -12,
                  height: strapLen - 8,
                  background: `repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 1px, transparent 1px 3px), linear-gradient(90deg, ${shade(primaryColor, -0.35)}, ${primaryColor} 30%, ${primaryColor} 70%, ${shade(primaryColor, -0.35)})`,
                  boxShadow: '0 2px 4px rgba(0,0,0,.25)',
                }}
              >
                <span
                  className="whitespace-nowrap text-[8px] font-extrabold uppercase tracking-[0.3em]"
                  style={{ writingMode: 'vertical-rl', color: accentColor || onP }}
                >
                  {strapText}
                </span>
              </div>
              {/* metal clip */}
              <div
                className="absolute left-1/2"
                style={{
                  top: strapLen - 14,
                  width: 30,
                  height: 22,
                  marginLeft: -15,
                  zIndex: 2,
                  borderRadius: 5,
                  background: 'linear-gradient(180deg, #f8fafc, #94a3b8 45%, #e2e8f0 55%, #64748b)',
                  boxShadow: '0 2px 4px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.9)',
                  transform: 'translateZ(30px)',
                }}
              >
                <div className="absolute inset-x-[7px] top-[5px] h-[4px] rounded-full bg-slate-500/60" />
              </div>
            </>
          )}
          <div ref={floatRef} className="absolute left-1/2" style={{ top: strapLen, marginLeft: -cw / 2, transformStyle: 'preserve-3d' }}>
            <div ref={cardRef} className="relative" style={{ width: cw, height: ch, transformStyle: 'preserve-3d', willChange: 'transform' }}>
              {/* card thickness: layers between the two faces show at the edges */}
              {Array.from({ length: LAYERS }, (_, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    borderRadius: 12 * scale,
                    background: i === 0 || i === LAYERS - 1 ? '#cbd5e1' : '#e2e8f0',
                    transform: `translateZ(${-THICK + ((i + 0.5) * 2 * THICK) / LAYERS}px)`,
                  }}
                />
              ))}
              {face(front, 0)}
              {face(back, 1)}
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] text-muted-foreground">
          Drag to turn · tap to flip
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
          {(['front', 'back'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => showSide(s)}
              className={cn('rounded-md px-3 py-1.5 capitalize transition-colors', side === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {s}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={flip}>
          <Repeat2 className="size-4" /> Flip
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={spin}>
          <Rotate3d className="size-4" /> 360°
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        {actions}
      </div>
    </div>
  )
}
