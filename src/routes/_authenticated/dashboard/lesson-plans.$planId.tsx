import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, Printer, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/lesson-plans/page-bits'
import { ReviewThread } from '@/components/lesson-plans/review-thread'
import { LessonPlanView } from '@/components/lesson-plans/lesson-plan-view'
import { useDecideLessonPlanMutation, useReviewLessonPlanQuery } from '@/hooks/queries/lesson-plan.queries'
import { toast } from '@/lib/toast'

export const Route = createFileRoute('/_authenticated/dashboard/lesson-plans/$planId')({
  component: ReviewPlanPage,
})

function ReviewPlanPage() {
  const { planId } = Route.useParams()
  const { data: plan, isLoading, error } = useReviewLessonPlanQuery(planId)
  const decide = useDecideLessonPlanMutation()
  const [comment, setComment] = useState('')
  const [pending, setPending] = useState<'approve' | 'request-changes' | null>(null)

  if (isLoading) return <Loader2 className="mx-auto mt-10 size-6 animate-spin text-primary" />
  if (!plan) return <p className="text-sm text-muted-foreground">{(error as any)?.message || 'Lesson plan not found.'}</p>

  const canDecide = plan.status === 'SUBMITTED'

  const act = async (action: 'approve' | 'request-changes') => {
    if (action === 'request-changes' && !comment.trim()) return toast.error('Tell the teacher what to change')
    setPending(action)
    try {
      await decide.mutateAsync({ id: plan.id, action, comment: comment.trim() || undefined })
      toast.success(action === 'approve' ? 'Lesson plan approved' : 'Sent back to the teacher')
      setComment('')
    } catch (e: any) {
      toast.error(e?.message || 'Action failed')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-12">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link to="/dashboard/lesson-plans"><ArrowLeft className="size-4" /></Link>
            </Button>
            Review Lesson Plan
          </span>
        }
        description={`${plan.teacher.fullname} · ${plan.class.name} — ${plan.subject.name}`}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="mr-1.5 size-4" /> Print</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <LessonPlanView plan={plan} />
        <div className="space-y-4 print:hidden">
          {canDecide && (
            <Card>
              <CardHeader><CardTitle className="text-base">Your decision</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment for the teacher (required when asking for changes)" />
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                  <Button variant="outline" onClick={() => act('request-changes')} disabled={!!pending}>
                    {pending === 'request-changes' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Undo2 className="mr-1.5 size-4" />}
                    Request changes
                  </Button>
                  <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => act('approve')} disabled={!!pending}>
                    {pending === 'approve' ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 size-4" />}
                    Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Review history</CardTitle></CardHeader>
            <CardContent><ReviewThread items={plan.reviews || []} /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
