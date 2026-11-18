import type { ReportModel } from './model'
import type { ReportTemplate } from './template'

/** Small pieces shared by the report card layouts. */

export function SchoolLogo({ m, size = 80 }: { m: ReportModel; size?: number }) {
  if (m.school?.logo) {
    return (
      <img
        src={m.school.logo}
        alt="School Logo"
        className="object-contain rounded shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-gray-100 border border-gray-400 flex items-center justify-center font-bold text-gray-700 shrink-0"
      style={{ width: size * 0.8, height: size * 0.8, fontSize: size * 0.28 }}
    >
      {m.school?.schoolName?.charAt(0) || 'S'}
    </div>
  )
}

export function StudentPhoto({ m, size = 80 }: { m: ReportModel; size?: number }) {
  return m.student?.profileImage ? (
    <img
      src={m.student.profileImage}
      alt="Student"
      className="object-cover rounded border border-gray-400 shrink-0"
      style={{ width: size, height: size * 1.15 }}
    />
  ) : (
    <div
      className="rounded border border-dashed border-gray-400 flex items-center justify-center text-[10px] text-gray-400 shrink-0"
      style={{ width: size, height: size * 1.15 }}
    >
      Photo
    </div>
  )
}

/** A faint copy of the logo behind the whole card. */
export function Watermark({ m, t }: { m: ReportModel; t: ReportTemplate }) {
  if (!t.sections.watermark || !m.school?.logo) return null
  return (
    <img
      src={m.school.logo}
      alt=""
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 w-[55%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 object-contain"
      style={{ opacity: 0.06 }}
    />
  )
}

export function Signature({ m, t, align = 'right' }: { m: ReportModel; t: ReportTemplate; align?: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <span className="font-bold text-gray-700 block">{t.labels.principal}'s Signature{m.stamp ? ' & Stamp' : ''}:</span>
      <div className={`h-12 mt-1 flex items-end gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        {m.principalSignature ? (
          <img src={m.principalSignature} alt="Signature" className="max-h-12 object-contain" />
        ) : (
          <span className="font-serif italic text-sm text-gray-800 border-b border-black px-4">Authorized Signature</span>
        )}
        {m.stamp && <img src={m.stamp} alt="School stamp" className="max-h-14 object-contain opacity-90" />}
      </div>
    </div>
  )
}

export function GradeKey({ m, className = '' }: { m: ReportModel; className?: string }) {
  if (!m.gradeKey.length) return null
  return (
    <div className={`flex flex-wrap justify-center gap-x-2.5 gap-y-0.5 text-[10px] text-gray-600 ${className}`}>
      <span className="font-semibold text-gray-800 whitespace-nowrap">Grade Key:</span>
      {m.gradeKey.map((g) => (
        <span key={g.grade} className="whitespace-nowrap">
          <strong className="text-gray-900">{g.grade}</strong> {g.min}–{g.max} {g.remark}
        </span>
      ))}
    </div>
  )
}

export function RatingKey({ className = '' }: { className?: string }) {
  return (
    <div className={`text-[10px] text-gray-500 ${className}`}>
      <span className="font-semibold text-gray-700 mr-2">Behavioural / Skill Rating Key:</span>5 - Excellent | 4 - Good | 3 - Fair / Average | 2 -
      Poor | 1 - Very Poor
    </div>
  )
}

export function FooterNote({ t, className = '' }: { t: ReportTemplate; className?: string }) {
  if (!t.footerNote.trim()) return null
  return <p className={`text-center text-[10px] italic text-gray-600 ${className}`}>{t.footerNote}</p>
}

export function Stars({ rating, color }: { rating: number; color: string }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
  return (
    <span className="tracking-tight" aria-label={`${n} of 5`}>
      <span style={{ color }}>{'★'.repeat(n)}</span>
      <span className="text-gray-300">{'★'.repeat(5 - n)}</span>
    </span>
  )
}
