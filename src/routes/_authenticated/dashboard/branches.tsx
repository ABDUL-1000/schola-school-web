import { createFileRoute } from '@tanstack/react-router'
import { BranchManager } from '@/components/branches/branch-manager'

export const Route = createFileRoute('/_authenticated/dashboard/branches')({
  component: BranchManager,
})
