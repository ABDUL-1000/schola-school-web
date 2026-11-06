import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { QuestionBankBrowser } from '@/components/print/question-bank-browser'

export const Route = createFileRoute('/_authenticated/dashboard/question-bank/')({
  component: QuestionBankPage,
})

function QuestionBankPage() {
  const navigate = useNavigate()
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Every exam, test and question paper set in the school — current and previous terms. Filter, print or download as PDF.
        </p>
      </div>
      <QuestionBankBrowser
        basePath="/school/question-bank"
        onOpen={(item) => navigate({ to: '/dashboard/question-bank/$kind/$id', params: { kind: item.kind, id: item.id } })}
      />
    </div>
  )
}
