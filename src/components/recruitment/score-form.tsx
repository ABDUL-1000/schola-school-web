import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { Criterion } from './recruitment'

/**
 * Score one candidate's interview against the vacancy's criteria.
 * Used in the candidate panel and on the staff "Interviews" page.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function ScoreForm({
  criteria,
  initial,
  pending,
  onSubmit,
  submitLabel = 'Save my score',
}: {
  criteria: Array<Criterion>
  initial?: { scores: Record<string, number>; comment: string | null } | null
  pending: boolean
  onSubmit: (v: { scores: Record<string, number>; comment: string }) => void
  submitLabel?: string
}) {
  const [scores, setScores] = useState<Record<string, number | ''>>(() => Object.fromEntries(criteria.map((c) => [c.id, initial?.scores[c.id] ?? ''])))
  const [comment, setComment] = useState(initial?.comment ?? '')
  const max = criteria.reduce((s, c) => s + c.max, 0)
  const total = criteria.reduce((s, c) => s + (Number(scores[c.id]) || 0), 0)
  const complete = criteria.every((c) => scores[c.id] !== '')
  const p = max ? Math.round((total / max) * 100) : 0

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!complete) return
        onSubmit({ scores: Object.fromEntries(criteria.map((c) => [c.id, Number(scores[c.id]) || 0])), comment })
      }}
    >
      <div className="flex items-center gap-4 rounded-xl border bg-gradient-to-br from-primary/5 to-violet-500/5 p-4">
        <Ring percent={p} />
        <div>
          <div className="text-2xl font-bold tabular-nums">
            {total}
            <span className="text-base font-normal text-muted-foreground"> / {max}</span>
          </div>
          <div className="text-xs text-muted-foreground">{complete ? 'Total for this interview' : 'Score every criterion'}</div>
        </div>
      </div>

      <div className="space-y-3">
        {criteria.map((c) => {
          const v = scores[c.id]
          return (
            <div key={c.id} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{c.label}</span>
                <div className="flex items-center gap-1 text-sm">
                  <input
                    type="number"
                    min={0}
                    max={c.max}
                    step={0.5}
                    value={v}
                    onChange={(e) => setScores((s) => ({ ...s, [c.id]: e.target.value === '' ? '' : Math.min(c.max, Math.max(0, Number(e.target.value))) }))}
                    className="h-8 w-16 rounded-md border bg-background px-2 text-right tabular-nums outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label={`${c.label} score`}
                  />
                  <span className="text-muted-foreground">/ {c.max}</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={c.max}
                step={0.5}
                value={v === '' ? 0 : v}
                onChange={(e) => setScores((s) => ({ ...s, [c.id]: Number(e.target.value) }))}
                className={cn('h-2 w-full cursor-pointer accent-primary', v === '' && 'opacity-40')}
                aria-label={`${c.label} slider`}
              />
            </div>
          )
        })}
      </div>

      <Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comments (optional): strengths, concerns, how the demo went…" maxLength={3000} />
      <Button type="submit" className="w-full gap-1.5" disabled={pending || !complete}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} {submitLabel}
      </Button>
    </form>
  )
}

export function Ring({ percent, size = 56, label }: { percent: number | null; size?: number; label?: string }) {
  const r = size / 2 - 5
  const c = 2 * Math.PI * r
  const p = percent === null ? 0 : Math.max(0, Math.min(100, percent))
  const color = percent === null ? 'stroke-muted' : p >= 70 ? 'stroke-emerald-500' : p >= 50 ? 'stroke-primary' : 'stroke-rose-500'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-muted" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn('fill-none transition-all duration-700', color)}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (p / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">{label ?? (percent === null ? '—' : `${Math.round(p)}%`)}</div>
    </div>
  )
}
