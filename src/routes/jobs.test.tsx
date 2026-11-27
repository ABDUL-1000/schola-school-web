import { createFileRoute } from '@tanstack/react-router'
import { CandidateCbt } from '@/components/recruitment-public/candidate-cbt'

/** Recruitment CBT for invited candidates: <school>.<domain>/jobs/test */
export const Route = createFileRoute('/jobs/test')({
  component: CandidateCbt,
})
