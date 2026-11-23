import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Frame, PartyPopper, Repeat2, Rotate3d, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { shade } from '../id-card/template'
import { certSize } from './template'
import type { CertificateOrientation } from './template'

/**
 * A certificate in 3D: it rises off the desk when it appears, a gold shimmer
 * runs across it, and confetti falls for graduations. Drag to turn it (it keeps
 * turning a little and settles on a side), tap to flip, show it in a frame.
 *
 * Shared by the school and student portals (keep the copies in step).
 * Pure CSS 3D + requestAnimationFrame: no libraries.
 */

type FrameKind = 'none' | 'gold' | 'wood'

type Props = {
  front: ReactNode
  back: ReactNode
  orientation: CertificateOrientation
  primaryColor: string
  accentColor: string
  /** Confetti when it appears (graduation). */
  celebrate?: boolean
  /** Change it (e.g. another student) to replay the entrance. */
  replayKey?: string | number
  /** Extra buttons next to Flip / 360° / Reset. */
  actions?: ReactNode
  /** Tallest the certificate may be on screen (px). */
  maxHeight?: number
  defaultFrame?: FrameKind
  className?: string
}

const THICK = 1.4 // half the paper's thickness (px)
const FRAME_DEPTH = 9 // half the frame's depth (px)

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const FRAMES: Record<Exclude<FrameKind, 'none'>, { face: string; edge: string; inner: string }> = {
  gold: {
    face: 'linear-gradient(135deg, #8a6a1f 0%, #f5d77a 18%, #b8902f 34%, #fff1b8 50%, #a07a24 66%, #f0cf6c 82%, #7a5c18 100%)',
    edge: '#8a6a1f',
    inner: '#5c4410',
  },
  wood: {
    face: 'repeating-linear-gradient(95deg, rgba(0,0,0,.08) 0 2px, transparent 2px 7px), linear-gradient(135deg, #3b2312, #6b4226 30%, #4a2c17 55%, #7a4d2c 80%, #3b2312)',
    edge: '#3b2312',
    inner: '#24140a',
  },
}

export function CertificateViewer({
  front,
  back,
  orientation,
  primaryColor,
  accentColor,
  celebrate = false,
  replayKey,
  actions,
  maxHeight = 560,
  defaultFrame = 'none',
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const objRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const glareRefs = useRef<Array<HTMLDivElement | null>>([])
  const shimmerRefs = useRef<Array<HTMLDivElement | null>>([])
  const confettiRef = useRef<HTMLCanvasElement>(null)

  const { w, h } = certSize(orientation)
  const [frame, setFrame] = useState<FrameKind>(defaultFrame)
  const [scale, setScale] = useState(0.5)
  const [side, setSide] = useState<'front' | 'back'>('front')
  const framePx = frame === 'none' ? 0 : orientation === 'landscape' ? 46 : 42

  const m = useRef({
    ry: -28,
    vy: 0,
    rx: 72, // lying on the desk
    vx: 0,
    lift: 140, // starts low, rises
    vlift: 0,
    s: 0.72,
    vs: 0,
    base: 0,
    hoverX: 0,
    hoverY: 0,
    float: 0,
    lastInput: 0,
    dragging: false,
    pointer: { x: 0, y: 0, t: 0, startT: 0, moved: 0 },
    side: 'front',
    shimmerAt: performance.now() + 650,
  })

  // Fit to the space available.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => {
      const avail = (el.clientWidth - 32) * 0.9
      const fw = w + framePx * 2
      const fh = h + framePx * 2
      setScale(Math.max(0.2, Math.min(1, avail / fw, maxHeight / fh)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h, framePx, maxHeight])

  // ----- confetti -----
  const burst = useCallback(() => {
    const canvas = confettiRef.current
    if (!canvas || reducedMotion()) return
    const g = canvas.getContext('2d')
    if (!g) return
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    g.scale(dpr, dpr)
    const colors = [accentColor, primaryColor, '#f5d77a', '#ffffff', shade(accentColor, 0.4), '#ef4444', '#22c55e']
    const parts = Array.from({ length: 160 }, (_, i) => {
      const fromLeft = i % 2 === 0
      return {
        x: fromLeft ? rect.width * 0.08 : rect.width * 0.92,
        y: rect.height * 0.75,
        vx: (fromLeft ? 1 : -1) * (180 + Math.random() * 340),
        vy: -(420 + Math.random() * 420),
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 12,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        c: colors[i % colors.length],
        wob: Math.random() * 10,
      }
    })
    let last = performance.now()
    const start = last
    const step = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      g.clearRect(0, 0, rect.width, rect.height)
      for (const p of parts) {
        p.vy += 900 * dt
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += (p.vx + Math.sin(now / 200 + p.wob) * 40) * dt
        p.y += p.vy * dt
        p.r += p.vr * dt
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.r)
        g.scale(1, Math.cos(now / 120 + p.wob))
        g.fillStyle = p.c
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        g.restore()
      }
      if (now - start < 3800) requestAnimationFrame(step)
      else g.clearRect(0, 0, rect.width, rect.height)
    }
    requestAnimationFrame(step)
  }, [accentColor, primaryColor])

  // Entrance: rise off the desk. Replays when replayKey changes.
  const first = useRef(true)
  useEffect(() => {
    const s = m.current
    if (reducedMotion()) {
      Object.assign(s, { ry: 0, rx: 0, lift: 0, s: 1, vy: 0, vx: 0, vlift: 0, vs: 0, base: 0 })
      return
    }
    if (!first.current) Object.assign(s, { ry: -24, rx: 64, lift: 120, s: 0.78, base: 0, vy: 0, vx: 0 })
    first.current = false
    s.shimmerAt = performance.now() + 650
    if (celebrate) {
      const t = setTimeout(burst, 550)
      return () => clearTimeout(t)
    }
  }, [replayKey, celebrate, burst])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const calm = reducedMotion()

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = m.current
      const idle = !s.dragging && now - s.lastInput > 2200 && Math.abs(s.vy) < 8

      s.float += ((idle && !calm ? 1 : 0) - s.float) * Math.min(1, dt * 1.2)
      const t = now / 1000
      const sway = Math.sin(t * 0.45) * 6 * s.float
      const bob = Math.sin(t * 1.1) * 4 * s.float

      if (!s.dragging) {
        const ty = s.base + s.hoverY + sway
        const tx = s.hoverX + Math.sin(t * 0.7) * 2 * s.float
        s.vy += (60 * (ty - s.ry) - 10 * s.vy) * dt
        s.ry += s.vy * dt
        s.vx += (55 * (tx - s.rx) - 10 * s.vx) * dt
        s.rx += s.vx * dt
      }
      s.vlift += (70 * (0 - s.lift) - 13 * s.vlift) * dt
      s.lift += s.vlift * dt
      s.vs += (70 * (1 - s.s) - 12 * s.vs) * dt
      s.s += s.vs * dt

      const norm = ((s.ry % 360) + 360) % 360
      const facing = norm > 90 && norm < 270 ? 'back' : 'front'
      const off = facing === 'front' ? (norm > 180 ? norm - 360 : norm) : norm - 180

      if (objRef.current) objRef.current.style.transform = `translateY(${s.lift + bob}px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.s})`
      if (shadowRef.current) {
        const sx = Math.max(0.25, Math.abs(Math.cos((off * Math.PI) / 180))) * s.s
        shadowRef.current.style.transform = `scale(${sx}, ${s.s})`
        shadowRef.current.style.opacity = String(Math.max(0.1, 0.5 - s.float * 0.12 - Math.abs(s.rx) / 260))
      }
      const gx = 50 - off * 1.6
      const gy = 50 + s.rx * 1.6
      const strength = Math.min(1, (Math.abs(off) + Math.abs(s.rx)) / 40)
      for (const el of glareRefs.current) {
        if (!el) continue
        el.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.5), rgba(255,255,255,.06) 40%, transparent 65%)`
        el.style.opacity = String(0.15 + strength * 0.5)
      }
      // One gold sweep after it lands.
      const p = (now - s.shimmerAt) / 1300
      for (const el of shimmerRefs.current) {
        if (!el) continue
        el.style.opacity = p > 0 && p < 1 && !calm ? '1' : '0'
        el.style.backgroundPosition = `${-60 + Math.max(0, Math.min(1, p)) * 220}% 0`
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
  }, [])
  const spin = useCallback(() => {
    const s = m.current
    touch()
    s.base = Math.round(s.ry / 180) * 180 + 360
    s.vy += 160
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
  const changeFrame = (f: FrameKind) => {
    setFrame(f)
    const s = m.current
    touch()
    s.vs -= 1.2 // a little bounce as the frame goes on
    s.shimmerAt = performance.now() + 150
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const s = m.current
    touch()
    s.dragging = true
    s.pointer = { x: e.clientX, y: e.clientY, t: performance.now(), startT: performance.now(), moved: 0 }
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
      s.ry += dx * 0.4
      s.rx = Math.max(-40, Math.min(40, s.rx - dy * 0.3))
      s.vy = s.vy * 0.6 + ((dx * 0.4) / dt) * 0.4
      s.vx = s.vx * 0.6 + ((-dy * 0.3) / dt) * 0.4
      s.pointer.moved += Math.abs(dx) + Math.abs(dy)
      s.pointer.x = e.clientX
      s.pointer.y = e.clientY
      s.pointer.t = now
    } else if (e.pointerType === 'mouse' && stageRef.current) {
      const r = stageRef.current.getBoundingClientRect()
      s.hoverY = ((e.clientX - r.left) / r.width - 0.5) * 16
      s.hoverX = (0.5 - (e.clientY - r.top) / r.height) * 10
      touch()
    }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const s = m.current
    if (!s.dragging) return
    s.dragging = false
    touch()
    if (s.pointer.moved < 6 && performance.now() - s.pointer.startT < 320) {
      flip()
      return
    }
    const vy = Math.max(-1200, Math.min(1200, s.vy))
    s.vy = vy
    s.base = Math.round((s.ry + vy * 0.2) / 180) * 180
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
      s.vy += e.key === 'ArrowLeft' ? -220 : 220
      s.base = Math.round((s.ry + (e.key === 'ArrowLeft' ? -180 : 180)) / 180) * 180
    }
  }

  const cw = w * scale
  const ch = h * scale
  const fp = framePx * scale
  const ow = cw + fp * 2
  const oh = ch + fp * 2
  const stageH = oh + 90
  const half = frame === 'none' ? THICK : FRAME_DEPTH
  const fr = frame === 'none' ? null : FRAMES[frame]
  const layers = frame === 'none' ? 3 : 7

  const face = (content: ReactNode, i: 0 | 1) => (
    <div
      className="absolute inset-0"
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: i === 0 ? `translateZ(${half}px)` : `rotateY(180deg) translateZ(${half}px)`,
        background: fr ? fr.face : undefined,
        borderRadius: fr ? 3 : 1,
        boxShadow: fr ? `inset 0 0 0 1px ${fr.edge}, inset 0 2px 2px rgba(255,255,255,.35), inset 0 -2px 3px rgba(0,0,0,.35)` : '0 0 0 0.5px rgba(0,0,0,.12)',
      }}
    >
      <div
        className="absolute overflow-hidden"
        style={{
          inset: fp,
          boxShadow: fr ? `0 0 0 ${Math.max(2, fp * 0.12)}px ${fr.inner}, inset 0 0 ${fp * 0.4}px rgba(0,0,0,.35)` : undefined,
        }}
      >
        <div style={{ zoom: scale, width: w, height: h }}>{content}</div>
        {/* gold sweep */}
        <div
          ref={(el) => {
            shimmerRefs.current[i] = el
          }}
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(105deg, transparent 35%, ${shade(accentColor, 0.6)}aa 45%, rgba(255,255,255,.9) 50%, ${shade(accentColor, 0.6)}aa 55%, transparent 65%)`,
            backgroundSize: '250% 100%',
            mixBlendMode: 'soft-light',
            opacity: 0,
          }}
        />
        {/* light on the paper */}
        <div
          ref={(el) => {
            glareRefs.current[i] = el
          }}
          className="pointer-events-none absolute inset-0"
          style={{ mixBlendMode: 'soft-light' }}
        />
        {frame !== 'none' && <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(150deg, rgba(255,255,255,.16), transparent 40%)' }} />}
      </div>
    </div>
  )

  return (
    <div ref={wrapRef} className={cn('w-full select-none', className)}>
      <div
        ref={stageRef}
        role="img"
        tabIndex={0}
        aria-label={`Certificate, showing the ${side}. Drag to turn, press Enter to flip.`}
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
          perspective: 2000,
          background: `radial-gradient(ellipse at 50% 30%, ${shade(primaryColor, 0.9)}66, transparent 70%)`,
        }}
      >
        <div
          ref={shadowRef}
          className="pointer-events-none absolute left-1/2"
          style={{
            bottom: 18,
            width: ow * 0.9,
            height: 26,
            marginLeft: -(ow * 0.9) / 2,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,.42), transparent 70%)',
            filter: 'blur(7px)',
          }}
        />
        <div className="absolute left-1/2 top-[30px]" style={{ marginLeft: -ow / 2, transformStyle: 'preserve-3d' }}>
          <div ref={objRef} className="relative" style={{ width: ow, height: oh, transformStyle: 'preserve-3d', willChange: 'transform' }}>
            {/* paper / frame thickness, seen at the edges */}
            {Array.from({ length: layers }, (_, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  borderRadius: fr ? 3 : 1,
                  background: fr ? (i % 2 ? fr.edge : shade(fr.edge, 0.15)) : '#e7e2d6',
                  transform: `translateZ(${-half + ((i + 0.5) * 2 * half) / layers}px)`,
                }}
              />
            ))}
            {face(front, 0)}
            {face(back, 1)}
          </div>
        </div>
        <canvas ref={confettiRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        <p className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[11px] text-muted-foreground">Drag to turn · tap to flip</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-xs font-medium">
          {(['front', 'back'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => showSide(s)}
              className={cn('rounded-md px-3 py-1.5 capitalize transition-colors', side === s ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs font-medium" title="Show it in a frame">
          <Frame className="mx-1.5 size-3.5 text-muted-foreground" />
          {(['none', 'gold', 'wood'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => changeFrame(f)}
              className={cn('rounded-md px-2.5 py-1.5 capitalize transition-colors', frame === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
              {f === 'none' ? 'No frame' : f}
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
        {celebrate && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={burst}>
            <PartyPopper className="size-4" /> Celebrate
          </Button>
        )}
        {actions}
      </div>
    </div>
  )
}
