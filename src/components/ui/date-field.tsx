import { useEffect, useState } from 'react'
import { format, isValid, parseISO } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Date inputs on the shadcn Calendar. Values go in and out as plain
 * "YYYY-MM-DD" strings in local time, so the day tapped is the day saved.
 * (The old code turned the picked day into UTC, which saved the day before
 * for anyone east of UTC, e.g. Nigeria.)
 */

const ymd = (d: Date) => format(d, 'yyyy-MM-dd') // local, never UTC
const toDate = (v?: string | null) => {
  if (!v) return undefined
  const d = parseISO(v.slice(0, 10)) // local midnight
  return isValid(d) ? d : undefined
}
const show = (d?: Date) => (d ? format(d, 'd MMM yyyy') : '')

/** Two months side by side only when there is room. */
function useWide() {
  const query = '(min-width: 640px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

const triggerClass =
  'flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs outline-none transition-colors hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

function ClearButton({ onClear }: { onClear: () => void }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="Clear date"
      className="ml-auto shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={(e) => {
        e.stopPropagation()
        onClear()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          onClear()
        }
      }}
    >
      <X className="size-3.5" />
    </span>
  )
}

interface DateFieldProps {
  value?: string | null
  onChange: (value: string) => void
  /** Earliest / latest allowed day, "YYYY-MM-DD". */
  min?: string
  max?: string
  placeholder?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  className?: string
  /** Open on a date years back — handy for dates of birth (year/month dropdowns are always there). */
  startWithYear?: boolean
}

export function DateField({ value, onChange, min, max, placeholder = 'Pick a date', disabled, id, className, startWithYear, ...rest }: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const minD = toDate(min)
  const maxD = toDate(max)
  const today = new Date()
  const fallbackMonth = startWithYear ? new Date((maxD || today).getFullYear() - 10, 0, 1) : maxD && maxD < today ? maxD : today

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} aria-label={rest['aria-label']} disabled={disabled} className={cn(triggerClass, className)}>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected ? show(selected) : placeholder}</span>
          {selected && !disabled && <ClearButton onClear={() => onChange('')} />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" collisionPadding={8}>
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={selected || fallbackMonth}
          startMonth={minD || new Date(today.getFullYear() - 80, 0)}
          endMonth={maxD || new Date(today.getFullYear() + 5, 11)}
          disabled={[...(minD ? [{ before: minD }] : []), ...(maxD ? [{ after: maxD }] : [])]}
          onSelect={(d) => {
            onChange(d ? ymd(d) : '')
            if (d) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangeFieldProps {
  start?: string | null
  end?: string | null
  onChange: (start: string, end: string) => void
  min?: string
  max?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  className?: string
}

/** Start and end date (sessions, terms…): tap the first day, then the last. */
export function DateRangeField({ start, end, onChange, min, max, disabled, id, className, ...rest }: DateRangeFieldProps) {
  const [open, setOpen] = useState(false)
  const wide = useWide()
  const from = toDate(start)
  const to = toDate(end)
  const minD = toDate(min)
  const maxD = toDate(max)
  // While picking, the first tap sets the start; the second sets the end.
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)
  useEffect(() => {
    if (open) setDraft(undefined)
  }, [open])
  const range: DateRange | undefined = draft ?? (from ? { from, to } : undefined)
  const today = new Date()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} aria-label={rest['aria-label']} disabled={disabled} className={cn(triggerClass, className)}>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn('truncate', !from && 'text-muted-foreground')}>
            {from ? `${show(from)} – ${to ? show(to) : '…'}` : 'Start date – end date'}
          </span>
          {from && !disabled && <ClearButton onClear={() => onChange('', '')} />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-16px)] p-0" align="start" collisionPadding={8}>
        <p className="border-b px-3 py-2 text-xs text-muted-foreground">
          {!draft?.from ? 'Tap the first day' : 'Now tap the last day'}
        </p>
        <Calendar
          mode="range"
          captionLayout="dropdown"
          numberOfMonths={wide ? 2 : 1}
          selected={range}
          defaultMonth={from || today}
          startMonth={minD || new Date(today.getFullYear() - 10, 0)}
          endMonth={maxD || new Date(today.getFullYear() + 10, 11)}
          disabled={[...(minD ? [{ before: minD }] : []), ...(maxD ? [{ after: maxD }] : [])]}
          onSelect={(_r, day) => {
            // Our own two-tap flow (the default one changes whichever end is nearer).
            if (!draft?.from) {
              setDraft({ from: day, to: undefined })
              return
            }
            const [a, b] = day < draft.from ? [day, draft.from] : [draft.from, day]
            onChange(ymd(a), ymd(b))
            setDraft(undefined)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
