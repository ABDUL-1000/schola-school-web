import { createFileRoute } from '@tanstack/react-router'
import { resolveApplySlug } from '@/components/apply/apply-layout'
import { StaffRegisterForm } from '@/components/apply/staff-register-form'

/** Path form for local dev / non-subdomain hosting: /<slug>/staff/register */
export const Route = createFileRoute('/$schoolSlug/staff/register')({
  validateSearch: (s: Record<string, unknown>) => ({ school: (s.school as string) || undefined }),
  component: Page,
})

function Page() {
  const { school } = Route.useSearch()
  const { schoolSlug } = Route.useParams()
  return <StaffRegisterForm slug={resolveApplySlug(schoolSlug, school)} />
}
