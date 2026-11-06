import { createFileRoute } from '@tanstack/react-router'
import { EnrolmentQueue } from '@/components/applications/applications-manager'

export const Route = createFileRoute('/_authenticated/dashboard/enrolment-queue')({
  component: QueuePage,
})

function QueuePage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Enrolment Queue</h1>
        <p className="text-sm text-muted-foreground">Applications from parents through your enrolment link. Approve to enroll the student and email the parent their login details.</p>
      </div>
      <EnrolmentQueue mode="school" />
    </div>
  )
}
