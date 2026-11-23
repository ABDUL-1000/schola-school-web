import { forwardRef } from 'react'
import { buildReportModel } from './model'
import { normalizeTemplate } from './template'
import type { ReportTemplate } from './template'
import { ClassicLayout } from './layouts/classic'
import { ModernLayout } from './layouts/modern'
import { CompactLayout } from './layouts/compact'
import { PrimaryLayout } from './layouts/primary'

const LAYOUTS = {
  classic: ClassicLayout,
  modern: ModernLayout,
  compact: CompactLayout,
  primary: PrimaryLayout,
}

/**
 * The printable report card, in the school's chosen design. The design comes
 * from `data.config.reportTemplate` unless `template` is given (design preview).
 * The root carries `data-report-sheet` so a whole class can be printed at once.
 */
export const ReportCardDocument = forwardRef<HTMLDivElement, { data: any; template?: ReportTemplate }>(
  function ReportCardDocument({ data, template }, ref) {
    const t = template ?? normalizeTemplate(data?.config?.reportTemplate)
    const m = buildReportModel(data, t)
    const Layout = LAYOUTS[t.layout]
    const watermark = !!data?.config?.plan?.watermark
    return (
      <div
        ref={ref}
        data-report-sheet
        className="relative bg-white text-black p-6 sm:p-8 rounded-xl border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0 w-full max-w-6xl mx-auto font-sans overflow-hidden"
      >
        <Layout m={m} t={t} />
        {watermark && <FreePlanWatermark />}
      </div>
    )
  },
)

/** Free plan: a diagonal "Schola free plan" pattern over the whole card (prints too), and a footer line. */
function FreePlanWatermark() {
  const rows = Array.from({ length: 9 })
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 20 }}>
        <div
          className="absolute left-1/2 top-1/2 flex flex-col gap-24"
          style={{ width: '220%', transform: 'translate(-50%, -50%) rotate(-30deg)' }}
        >
          {rows.map((_, i) => (
            <div
              key={i}
              className="whitespace-nowrap text-center text-3xl font-black uppercase tracking-[0.3em]"
              style={{ color: 'rgba(220, 38, 38, 0.10)', marginLeft: i % 2 ? '12%' : 0 }}
            >
              {'Schola free plan · '.repeat(8)}
            </div>
          ))}
        </div>
      </div>
      <p className="relative mt-3 text-center text-[10px] font-semibold uppercase tracking-wider text-red-600/80">
        Created on the Schola free plan · schola.com.ng
      </p>
    </>
  )
}
