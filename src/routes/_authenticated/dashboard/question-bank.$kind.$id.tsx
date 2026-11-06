import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrintableExamView } from '@/components/print/printable-exam-view'

export const Route = createFileRoute('/_authenticated/dashboard/question-bank/$kind/$id')({
  component: PrintExamPage,
})

function PrintExamPage() {
  const { kind, id } = Route.useParams()
  const router = useRouter()
  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="ghost" className="self-start print:hidden" onClick={() => router.history.back()}>
        <ArrowLeft className="mr-1.5 size-4" /> Back
      </Button>
      <PrintableExamView basePath="/school/question-bank" kind={kind} id={id} />
    </div>
  )
}
