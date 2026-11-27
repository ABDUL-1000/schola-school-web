import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink, Loader2, MonitorPlay, Pause, Play, Settings2, Trash2, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { useRecruitmentAction, useVacancy } from './recruitment'
import { CopyLink, StatusPill } from './vacancy-list'
import { SetupPanel } from './setup-panel'
import { CandidatesPanel } from './candidates-panel'
import { TestPanel } from './test-panel'
import { ResultsPanel } from './results-panel'

export type VacancyTab = 'candidates' | 'setup' | 'test' | 'results'

/**
 * One vacancy: candidates, setup, CBT and results.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function VacancyPage({ vacancyId, tab, back, onDeleted }: { vacancyId: string; tab: VacancyTab; back: ReactNode; onDeleted: () => void }) {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useVacancy(vacancyId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const setTab = (t: VacancyTab) => void navigate({ to: '/dashboard/recruitment/$vacancyId', params: { vacancyId }, search: { tab: t }, replace: true })

  const setStatus = useRecruitmentAction<{ status: string }>('patch', () => `/${vacancyId}`, {
    success: () => 'Vacancy updated',
    error: 'Could not update the vacancy',
  })
  const remove = useRecruitmentAction<object>('delete', () => `/${vacancyId}`, {
    success: () => 'Vacancy deleted',
    error: 'Could not delete the vacancy',
    onDone: onDeleted,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isError || !data) {
    return <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">This vacancy could not be loaded.</div>
  }
  const v = data.vacancy
  const tabs: Array<{ value: VacancyTab; label: string; icon: typeof Users; show: boolean }> = [
    { value: 'candidates', label: 'Candidates', icon: Users, show: true },
    { value: 'test', label: 'CBT test', icon: MonitorPlay, show: v.useTest },
    { value: 'results', label: 'Results', icon: Trophy, show: true },
    { value: 'setup', label: 'Setup', icon: Settings2, show: true },
  ]

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {back}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{v.title}</h1>
              <StatusPill status={v.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{[v.roleLabel, v.employmentType].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {v.status === 'OPEN' && (
              <>
                <CopyLink link={v.link} label="Copy job link" />
                <Button variant="outline" size="sm" className="gap-1.5" asChild>
                  <a href={v.link} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-3.5" /> View
                  </a>
                </Button>
              </>
            )}
            {v.status === 'OPEN' ? (
              <Button variant="outline" size="sm" className="gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ status: 'CLOSED' })}>
                <Pause className="size-3.5" /> Close applications
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ status: 'OPEN' })}>
                <Play className="size-3.5" /> {v.status === 'DRAFT' ? 'Open & publish link' : 'Reopen'}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(true)} aria-label="Delete vacancy">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                tab === t.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
      </div>

      {tab === 'setup' ? (
        <SetupPanel detail={data} />
      ) : tab === 'test' && v.useTest ? (
        <TestPanel vacancy={v} />
      ) : tab === 'results' ? (
        <ResultsPanel vacancy={v} />
      ) : (
        <CandidatesPanel vacancy={v} />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vacancy?</AlertDialogTitle>
            <AlertDialogDescription>
              Its candidates, their CVs, test answers and interview scores are deleted too. If you only want to stop applications, close it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove.mutate({})}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
