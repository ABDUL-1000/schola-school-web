import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useSubmissionByIdQuery } from '@/hooks/queries/assignment.queries'
import { Loader2, ArrowLeft, Check, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export const Route = createFileRoute(
  '/_authenticated/dashboard/assignments/attempt/$attemptId',
)({
  component: GradingInterfaceReadOnlyRoute,
})

function GradingInterfaceReadOnlyRoute() {
  const { attemptId } = Route.useParams()
  const {
    data: attempt,
    isLoading,
    isError,
  } = useSubmissionByIdQuery(attemptId)

  const totalCurrentScore = useMemo(() => {
    if (!attempt) return 0
    let total = Number(attempt.objectiveScore || 0)
    attempt.answers?.forEach((ans: any) => {
      if (
        ans.question?.type !== 'MULTIPLE_CHOICE' &&
        ans.question?.type !== 'TRUE_FALSE'
      ) {
        total += Number(ans.manualScore || 0)
      }
    })
    return total
  }, [attempt])

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !attempt) {
    return (
      <div className="text-destructive p-8 text-center">
        Failed to load submission
      </div>
    )
  }

  const assignment = attempt.assignment

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link to={`/dashboard/assignments/${assignment.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              View Submission (Read Only)
            </h1>
            <p className="text-muted-foreground mt-1">
              {attempt.student?.fullname} &mdash; {assignment.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6 bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="text-right px-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Total Score
            </p>
            <p className="text-3xl font-bold text-primary">
              {totalCurrentScore.toFixed(1)}{' '}
              <span className="text-xl text-muted-foreground font-medium">
                / {assignment.totalScore}
              </span>
            </p>
          </div>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={assignment.sections?.map((s: any) => s.id)}
        className="w-full space-y-4"
      >
        {assignment.sections?.map((section: any) => (
          <AccordionItem
            value={section.id}
            key={section.id}
            className="border rounded-lg bg-card px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex justify-between w-full pr-4">
                <span className="font-semibold text-lg">{section.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {section.questions?.length} Questions
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4 pb-6">
              {section.questions?.map((q: any, index: number) => {
                const answer = attempt.answers?.find(
                  (a: any) => a.questionId === q.id,
                )
                const isAutoGraded =
                  q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE'

                return (
                  <Card key={q.id}>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-medium">
                            Question {index + 1}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {q.text}
                          </p>
                        </div>
                        <Badge variant="outline">{q.allocatedScore} pts</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Student's Answer */}
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase mb-2 block">
                          Student's Answer
                        </Label>
                        {isAutoGraded ? (
                          <div className="flex items-center space-x-2">
                            {answer?.isCorrect ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <X className="h-5 w-5 text-destructive" />
                            )}
                            <span className="font-medium">
                              {answer?.selectedOption?.text || 'No Answer'}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap">
                            {answer?.text || 'No text submitted.'}
                          </div>
                        )}
                        {answer?.files && answer.files.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {answer.files.map((file: any) => (
                              <a
                                key={file.id}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-blue-500 hover:underline block"
                              >
                                📎 View Attachment
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Grading Section */}
                      {!isAutoGraded && (
                        <div className="bg-secondary/10 p-5 rounded-xl border border-border space-y-4 mt-6">
                          <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-1/4 space-y-3">
                              <Label className="text-sm font-semibold">
                                Teacher's Score (Max: {q.allocatedScore})
                              </Label>
                              <div className="font-semibold text-xl">
                                {Number(answer?.manualScore || 0)}
                              </div>
                            </div>
                            <div className="w-full md:w-3/4 space-y-3">
                              <Label className="text-sm font-semibold">
                                Teacher's Remark
                              </Label>
                              <div className="bg-background border p-4 rounded-lg min-h-[80px] text-sm">
                                {answer?.teacherRemark || (
                                  <span className="text-muted-foreground italic">
                                    No remark added
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {isAutoGraded && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            This question was auto-graded. (Score:{' '}
                            {answer?.autoScore || 0})
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
