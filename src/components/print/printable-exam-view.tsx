import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Eye, EyeOff, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { ExamPaperSheet } from './exam-paper-sheet'
import type { PrintableExam } from './exam-print.types'
import { pdfFileName } from './exam-print.types'

export function usePrintableExam(basePath: string, kind: string, id: string, answers: boolean) {
  return useQuery({
    queryKey: ['printable-exam', basePath, kind, id, answers],
    queryFn: async (): Promise<PrintableExam> =>
      (await api.get(`${basePath}/${kind}/${id}`, { params: { answers } })).data?.data,
    enabled: !!kind && !!id,
  })
}

/** Download as a real PDF file. Fetches the printable data first if needed. */
export async function downloadPrintable(basePath: string, kind: string, id: string, answers = false) {
  const data: PrintableExam = (await api.get(`${basePath}/${kind}/${id}`, { params: { answers } })).data?.data
  const { downloadExamPdf } = await import('./exam-paper-pdf')
  await downloadExamPdf(data)
}

/**
 * Full printable page: letterhead preview + Print + Download PDF, with an
 * optional marking-guide toggle for people allowed to see answers.
 */
export function PrintableExamView({ basePath, kind, id }: { basePath: string; kind: string; id: string }) {
  const [answers, setAnswers] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { data, isLoading, error } = usePrintableExam(basePath, kind, id, answers)

  const print = () => {
    if (!data) return
    // Browsers use the document title as the default "Save as PDF" file name.
    const previous = document.title
    document.title = pdfFileName(data.paper).replace(/\.pdf$/, '')
    window.print()
    document.title = previous
  }

  const download = async () => {
    if (!data) return
    setDownloading(true)
    try {
      const { downloadExamPdf } = await import('./exam-paper-pdf')
      await downloadExamPdf(data)
    } catch (e: any) {
      toast.error('Could not create the PDF', e?.message || 'Use Print → Save as PDF instead.')
    } finally {
      setDownloading(false)
    }
  }

  if (isLoading) return <Loader2 className="mx-auto mt-12 size-6 animate-spin text-primary" />
  if (error || !data) {
    return <p className="text-sm text-muted-foreground">{(error as any)?.message || 'This exam could not be loaded.'}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        {data.paper.canShowAnswers && (
          <Button variant="outline" onClick={() => setAnswers((a) => !a)}>
            {answers ? <EyeOff className="mr-1.5 size-4" /> : <Eye className="mr-1.5 size-4" />}
            {answers ? 'Hide answers' : 'Show marking guide'}
          </Button>
        )}
        <Button variant="outline" onClick={print}>
          <Printer className="mr-1.5 size-4" /> Print
        </Button>
        <Button onClick={download} disabled={downloading}>
          {downloading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />}
          Download PDF
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg bg-muted/40 p-4 print:overflow-visible print:bg-transparent print:p-0">
        <ExamPaperSheet data={data} />
      </div>
    </div>
  )
}
