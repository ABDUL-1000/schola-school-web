import { createFileRoute, redirect } from '@tanstack/react-router'

// The staff queue now lives on the Staff page ("Pending applications" tab).
export const Route = createFileRoute('/_authenticated/dashboard/staff-queue')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/staff', search: { tab: 'pending' } })
  },
})
