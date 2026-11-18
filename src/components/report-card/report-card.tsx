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
    return (
      <div
        ref={ref}
        data-report-sheet
        className="bg-white text-black p-6 sm:p-8 rounded-xl border border-gray-300 shadow-sm print:border-none print:shadow-none print:p-0 w-full max-w-6xl mx-auto font-sans overflow-hidden"
      >
        <Layout m={m} t={t} />
      </div>
    )
  },
)
