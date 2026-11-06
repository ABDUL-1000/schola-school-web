import { createFileRoute } from '@tanstack/react-router'
import { resolveApplySlug } from '@/components/apply/apply-layout'
import { StaffRegisterForm } from '@/components/apply/staff-register-form'

/** Public staff registration on the school subdomain: <slug>.<domain>/staff/register */
export const Route = createFileRoute('/staff/register')({
  validateSearch: (s: Record<string, unknown>) => ({ school: (s.school as string) || undefined }),
  component: Page,
})

function Page() {
  const { school } = Route.useSearch()
  return <StaffRegisterForm slug={resolveApplySlug(undefined, school)} />
}
