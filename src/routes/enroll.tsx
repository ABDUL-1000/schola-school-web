import { createFileRoute } from '@tanstack/react-router'
import { resolveApplySlug } from '@/components/apply/apply-layout'
import { EnrolWizard } from '@/components/apply/enrol-wizard'

/** Public enrolment on the school subdomain: <slug>.<domain>/enroll */
export const Route = createFileRoute('/enroll')({
  validateSearch: (s: Record<string, unknown>) => ({ school: (s.school as string) || undefined }),
  component: Page,
})

function Page() {
  const { school } = Route.useSearch()
  return <EnrolWizard slug={resolveApplySlug(undefined, school)} />
}
