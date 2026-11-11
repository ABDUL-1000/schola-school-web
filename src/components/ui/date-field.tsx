import { useEffect, useState } from 'react'
import { ConfigProvider, DatePicker, theme } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

/**
 * Date inputs built on antd's DatePicker. Values go in and out as plain
 * "YYYY-MM-DD" strings with no time zone, so the day picked is the day saved
 * (the old picker saved the day before for anyone east of UTC, e.g. Nigeria).
 */

const FORMAT = 'YYYY-MM-DD'
const DISPLAY = 'D MMM YYYY'
const toDay = (v?: string | null) => (v ? dayjs(v.slice(0, 10), FORMAT) : null)
const fromDay = (d: Dayjs | null) => (d ? d.format(FORMAT) : '')

/** Follow the app's light/dark theme (the `dark` class on <html>). */
function useIsDark() {
  const [dark, setDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setDark(el.classList.contains('dark')))
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function Theme({ children }: { children: React.ReactNode }) {
  const dark = useIsDark()
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#0b6bb3', borderRadius: 6, fontFamily: 'inherit', controlHeight: 36 },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

// Keep the calendar inside dialogs/drawers so it stays clickable there.
const popupInside = (trigger: HTMLElement) => trigger.parentElement ?? document.body

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
  /** Open on the year list first — handy for dates of birth. */
  startWithYear?: boolean
}

export function DateField({ value, onChange, min, max, placeholder = 'Pick a date', disabled, id, className, startWithYear, ...rest }: DateFieldProps) {
  const minD = toDay(min)
  const maxD = toDay(max)
  return (
    <Theme>
      <DatePicker
        id={id}
        aria-label={rest['aria-label']}
        className={className}
        style={{ width: '100%' }}
        value={toDay(value)}
        onChange={(d) => onChange(fromDay(d))}
        format={DISPLAY}
        placeholder={placeholder}
        disabled={disabled}
        inputReadOnly // no phone keyboard; pick from the calendar
        picker="date"
        {...(startWithYear && !value ? { defaultPickerValue: (maxD || dayjs()).subtract(10, 'year') } : {})}
        disabledDate={(d) => (!!minD && d.isBefore(minD, 'day')) || (!!maxD && d.isAfter(maxD, 'day'))}
        getPopupContainer={popupInside}
      />
    </Theme>
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

/** Start and end date in one picker (sessions, terms, …). */
export function DateRangeField({ start, end, onChange, min, max, disabled, id, className, ...rest }: DateRangeFieldProps) {
  const minD = toDay(min)
  const maxD = toDay(max)
  return (
    <Theme>
      <DatePicker.RangePicker
        id={id}
        aria-label={rest['aria-label']}
        className={className}
        style={{ width: '100%' }}
        value={[toDay(start), toDay(end)]}
        onChange={(v) => onChange(fromDay(v?.[0] ?? null), fromDay(v?.[1] ?? null))}
        format={DISPLAY}
        placeholder={['Start date', 'End date']}
        disabled={disabled}
        inputReadOnly
        allowEmpty={[true, true]}
        disabledDate={(d) => (!!minD && d.isBefore(minD, 'day')) || (!!maxD && d.isAfter(maxD, 'day'))}
        getPopupContainer={popupInside}
      />
    </Theme>
  )
}
