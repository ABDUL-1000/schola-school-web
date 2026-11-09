import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

/**
 * Dates for First, Second and Third Term. Changing First Term's dates suggests the
 * other two (same length, with a short break between terms) until they're edited
 * by hand. Any dates are allowed as long as the terms run in order — even a whole
 * session inside one week for testing.
 */

export interface TermDates {
  id?: string
  name: string
  startDate: string // yyyy-MM-dd
  endDate: string
}

export const TERM_NAMES = ['First Term', 'Second Term', 'Third Term']
const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** Second and Third Term after First: same length, 2-week break (1 day for short test terms). */
export function suggestFromFirst(first: TermDates, rest: Array<TermDates>): Array<TermDates> {
  if (!first.startDate || !first.endDate) return rest
  const start = parseISO(first.startDate)
  const end = parseISO(first.endDate)
  const len = Math.max(0, differenceInCalendarDays(end, start))
  const gap = len >= 28 ? 14 : 1
  let prevEnd = end
  return rest.map((t) => {
    const s = addDays(prevEnd, gap)
    const e = addDays(s, len)
    prevEnd = e
    return { ...t, startDate: iso(s), endDate: iso(e) }
  })
}

/** A fresh session: First Term starts on `from` and lasts about three months. */
export function defaultTerms(from = new Date()): Array<TermDates> {
  const first = { name: TERM_NAMES[0], startDate: iso(from), endDate: iso(addDays(from, 89)) }
  return [first, ...suggestFromFirst(first, TERM_NAMES.slice(1).map((name) => ({ name, startDate: '', endDate: '' })))]
}

/** Same rules as the server: each term ends after it starts, and starts after the previous ends. */
export function termProblem(terms: Array<TermDates>): string | null {
  for (const t of terms) {
    if (!t.startDate || !t.endDate) return `Enter both dates for ${t.name}.`
    if (t.endDate < t.startDate) return `${t.name} can't end before it starts.`
  }
  for (let i = 1; i < terms.length; i++) {
    if (terms[i].startDate <= terms[i - 1].endDate) {
      return `${terms[i].name} must start after ${terms[i - 1].name} ends (${format(parseISO(terms[i - 1].endDate), 'd MMM yyyy')}).`
    }
  }
  return null
}

export function TermDatesForm({
  terms,
  onChange,
  touched,
  onTouched,
}: {
  terms: Array<TermDates>
  onChange: (next: Array<TermDates>) => void
  /** Later terms the user has edited by hand (not auto-suggested any more). */
  touched: boolean
  onTouched: (v: boolean) => void
}) {
  const set = (i: number, field: 'startDate' | 'endDate', value: string) => {
    let next = terms.map((t, j) => (j === i ? { ...t, [field]: value } : t))
    if (i === 0) {
      // Keep First Term's length when its start moves.
      if (field === 'startDate' && terms[0].startDate && terms[0].endDate && value) {
        const len = differenceInCalendarDays(parseISO(terms[0].endDate), parseISO(terms[0].startDate))
        next[0] = { ...next[0], endDate: iso(addDays(parseISO(value), Math.max(0, len))) }
      }
      if (!touched) next = [next[0], ...suggestFromFirst(next[0], next.slice(1))]
    } else onTouched(true)
    onChange(next)
  }
  const problem = termProblem(terms)
  const days = (t: TermDates) =>
    t.startDate && t.endDate && t.endDate >= t.startDate ? differenceInCalendarDays(parseISO(t.endDate), parseISO(t.startDate)) + 1 : null

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {terms.map((t, i) => (
          <div key={t.id || t.name} className="grid grid-cols-[1fr] gap-2 rounded-lg border p-3 sm:grid-cols-[120px_1fr_1fr] sm:items-end">
            <div className="text-sm font-medium sm:pb-2">
              {t.name}
              {days(t) !== null && <span className="block text-xs font-normal text-muted-foreground">{days(t)} day{days(t) === 1 ? '' : 's'}</span>}
            </div>
            <label className="space-y-1 text-xs text-muted-foreground">
              Starts
              <Input type="date" value={t.startDate} onChange={(e) => set(i, 'startDate', e.target.value)} aria-label={`${t.name} start`} />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Ends
              <Input type="date" value={t.endDate} min={t.startDate || undefined} onChange={(e) => set(i, 'endDate', e.target.value)} aria-label={`${t.name} end`} />
            </label>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {touched ? 'Second and Third Term dates are your own.' : 'Second and Third Term follow First Term (same length, short break). Change them if you need to.'}
        </p>
        {touched && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 self-start"
            onClick={() => {
              onTouched(false)
              onChange([terms[0], ...suggestFromFirst(terms[0], terms.slice(1))])
            }}
          >
            <Sparkles className="size-4 text-amber-500" /> Suggest from First Term
          </Button>
        )}
      </div>
      {problem && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{problem}</p>}
    </div>
  )
}
