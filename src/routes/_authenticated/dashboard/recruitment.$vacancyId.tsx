import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { VacancyPage } from '@/components/recruitment/vacancy-page'
import type { VacancyTab } from '@/components/recruitment/vacancy-page'

const TABS: Array<VacancyTab> = ['candidates', 'setup', 'test', 'results']

export const Route = createFileRoute('/_authenticated/dashboard/recruitment/$vacancyId')({
  validateSearch: (s: Record<string, unknown>): { tab?: VacancyTab } => (TABS.includes(s.tab as VacancyTab) ? { tab: s.tab as VacancyTab } : {}),
  component: Page,
})

function Page() {
  const { vacancyId } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate()
  return (
    <VacancyPage
      vacancyId={vacancyId}
      tab={tab ?? 'candidates'}
      onDeleted={() => void navigate({ to: '/dashboard/staff', search: { tab: 'recruitment' } })}
      back={
        <Link to="/dashboard/staff" search={{ tab: 'recruitment' }} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All vacancies
        </Link>
      }
    />
  )
}
