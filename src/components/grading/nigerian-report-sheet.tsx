import React, { useRef } from 'react'
import { Award, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printA4 } from '@/lib/print-a4'
import { ReportCardDocument } from '@/components/report-card/report-card'
import type { ReportTemplate } from '@/components/report-card/template'

interface NigerianReportSheetProps {
  data: any
  onClose?: () => void
  /** Render only the printable sheet (no action bar), e.g. for printing a whole class. */
  sheetOnly?: boolean
  /** Show this design instead of the school's saved one (design preview). */
  template?: ReportTemplate
}

/** The school's report card, in its chosen design. Used on every portal; prints on one A4 page. */
export const NigerianReportSheet: React.FC<NigerianReportSheetProps> = ({ data, onClose, sheetOnly, template }) => {
  const sheetRef = useRef<HTMLDivElement>(null)
  if (!data || !data.student) return null

  const { student, term, reportSheet } = data
  const sheet = <ReportCardDocument ref={sheetRef} data={data} template={template} />
  if (sheetOnly) return sheet

  const handlePrint = () =>
    printA4(sheetRef.current, { title: `Report card - ${student.fullname} - ${term.name} ${term.sessionName || ''}`.trim() })

  return (
    <div className="space-y-4">
      {/* Action Bar (Hidden during Print) */}
      <div className="flex items-center justify-between bg-muted/40 p-3 rounded-lg border border-border print:hidden">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">Student Report Card</span>
          {reportSheet?.status && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                reportSheet.status === 'PUBLISHED' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
              }`}
            >
              {reportSheet.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {sheet}
    </div>
  )
}
