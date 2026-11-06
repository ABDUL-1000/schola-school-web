import { createFileRoute } from '@tanstack/react-router'
import { resolveApplySlug } from '@/components/apply/apply-layout'
import { EnrolWizard } from '@/components/apply/enrol-wizard'

/** Path form for local dev / non-subdomain hosting: /<slug>/enroll */
export const Route = createFileRoute('/$schoolSlug/enroll')({
  validateSearch: (s: Record<string, unknown>) => ({ school: (s.school as string) || undefined }),
  component: Page,
})

function Page() {
  const { school } = Route.useSearch()
  const { schoolSlug } = Route.useParams()
  return <EnrolWizard slug={resolveApplySlug(schoolSlug, school)} />
}
