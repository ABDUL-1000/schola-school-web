import { createFileRoute } from '@tanstack/react-router'
import { StaffQueue } from '@/components/applications/applications-manager'

export const Route = createFileRoute('/_authenticated/dashboard/staff-queue')({
  component: QueuePage,
})

function QueuePage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Staff Queue</h1>
        <p className="text-sm text-muted-foreground">Applications from your staff registration link. Approving creates the account and emails an invite to set a password.</p>
      </div>
      <StaffQueue mode="school" />
    </div>
  )
}
