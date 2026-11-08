import { createFileRoute, redirect } from '@tanstack/react-router'

// The enrolment queue now lives on the Students page ("Pending applications" tab).
export const Route = createFileRoute('/_authenticated/dashboard/enrolment-queue')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/students', search: { tab: 'pending' } })
  },
})
