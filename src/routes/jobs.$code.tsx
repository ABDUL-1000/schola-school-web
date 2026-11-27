import { createFileRoute } from '@tanstack/react-router'
import { JobApply } from '@/components/recruitment-public/job-apply'

/** Public job page and application form: <school>.<domain>/jobs/<code> */
export const Route = createFileRoute('/jobs/$code')({
  component: Page,
})

function Page() {
  const { code } = Route.useParams()
  return <JobApply code={code.toUpperCase()} />
}
