import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Briefcase, CalendarClock, Check, ClipboardList, Copy, Loader2, MonitorPlay, Plus, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CustomSelect } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { STAGES, fmtDate, useRecruitmentAction, useVacancies } from './recruitment'
import type { VacancyDetail, VacancyListItem } from './recruitment'

/**
 * The Recruitment tab: the school's vacancies, each with its pipeline at a glance.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function RecruitmentHome() {
  const { data, isLoading } = useVacancies()
  const [creating, setCreating] = useState(false)
  const vacancies = data?.vacancies ?? []
  const open = vacancies.filter((v) => v.status === 'OPEN').length

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-violet-500/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Briefcase className="size-5 text-primary" /> Recruitment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Post a vacancy and share its link. Candidates apply with their CV, then you shortlist, test them on CBT, interview and score them, and hire. Every step is optional: you can hire from any stage.
            </p>
          </div>
          <Button className="gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New vacancy
          </Button>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
          {[
            [ClipboardList, 'Apply with CV'],
            [Users, 'Shortlist & invite'],
            [MonitorPlay, 'CBT test'],
            [Sparkles, 'Interview scores'],
            [Check, 'Results & hire'],
          ].map(([Icon, label], i) => {
            const I = Icon as typeof Check
            return (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full border bg-background/70 px-2.5 py-1 text-muted-foreground backdrop-blur">
                <I className="size-3.5 text-primary" /> {label as string}
              </span>
            )
          })}
        </div>
      </div>

      {data?.freePlan && (
        <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
          Your free plan includes {data.freeOpenLimit} open vacancy at a time ({open} open now). Upgrade to advertise more at once.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : !vacancies.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="size-7" />
          </div>
          <h3 className="font-semibold">No vacancies yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">Create your first vacancy, for example “Mathematics Teacher”, then share its link on WhatsApp, Facebook or your website.</p>
          <Button className="mt-1 gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> New vacancy
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vacancies.map((v) => (
            <VacancyCard key={v.id} v={v} />
          ))}
        </div>
      )}

      {creating && <NewVacancyDialog roles={data?.roles ?? []} onClose={() => setCreating(false)} />}
    </div>
  )
}

const STATUS_STYLE: Record<string, string> = {
  OPEN: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  DRAFT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  CLOSED: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
}
const STATUS_LABEL: Record<string, string> = { OPEN: 'Open', DRAFT: 'Draft', CLOSED: 'Closed' }

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[status])}>
      {status === 'OPEN' && <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />}
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function CopyLink({ link, label = 'Copy link', className }: { link: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true)
          toast.success('Link copied')
          setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />} {label}
    </Button>
  )
}

function VacancyCard({ v }: { v: VacancyListItem }) {
  const pipeline = STAGES.filter((s) => v.counts[s.value] > 0)
  const closingSoon = v.closingDate && new Date(v.closingDate).getTime() - Date.now() < 3 * 86400000 && v.status === 'OPEN'
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={cn('h-1', v.status === 'OPEN' ? 'bg-gradient-to-r from-emerald-500 via-primary to-violet-500' : v.status === 'DRAFT' ? 'bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-700')} />
      <Link to="/dashboard/recruitment/$vacancyId" params={{ vacancyId: v.id }} className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold group-hover:text-primary">{v.title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[v.roleLabel, v.employmentType, v.branchName].filter(Boolean).join(' · ')}
            </p>
          </div>
          <StatusPill status={v.status} />
        </div>

        <div className="mt-4 flex items-end gap-3">
          <div>
            <div className="text-3xl font-bold tabular-nums">{v.total}</div>
            <div className="text-[11px] text-muted-foreground">{v.total === 1 ? 'candidate' : 'candidates'}</div>
          </div>
          <div className="flex-1 space-y-1.5 pb-1">
            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
              {pipeline.map((s) => (
                <div key={s.value} className={s.dot} style={{ width: `${(v.counts[s.value] / Math.max(1, v.total)) * 100}%` }} title={`${s.label}: ${v.counts[s.value]}`} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              {pipeline.slice(0, 4).map((s) => (
                <span key={s.value} className="inline-flex items-center gap-1">
                  <span className={cn('size-1.5 rounded-full', s.dot)} /> {s.label} {v.counts[s.value]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {v.useTest && (
            <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5', v.sessionOpen ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-muted text-muted-foreground')}>
              <MonitorPlay className="size-3" /> CBT {v.testQuestions ? `· ${v.testQuestions} questions` : '· not set'}
              {v.sessionOpen && ' · live'}
            </span>
          )}
          {v.useInterview && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
              <Users className="size-3" /> Interview
            </span>
          )}
          {v.closingDate && (
            <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5', closingSoon ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-muted text-muted-foreground')}>
              <CalendarClock className="size-3" /> Closes {fmtDate(v.closingDate)}
            </span>
          )}
        </div>
      </Link>
      {v.status === 'OPEN' && (
        <div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{v.link}</span>
          <CopyLink link={v.link} label="Copy" className="h-7" />
        </div>
      )}
    </div>
  )
}

function NewVacancyDialog({ roles, onClose }: { roles: Array<{ value: string; label: string }>; onClose: () => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [role, setRole] = useState('TEACHER')
  const create = useRecruitmentAction<{ title: string; roleAppliedFor: string }, VacancyDetail>('post', () => '', {
    success: () => 'Vacancy created. Finish setting it up, then open it.',
    error: 'Could not create the vacancy',
    onDone: (r) => {
      onClose()
      void navigate({ to: '/dashboard/recruitment/$vacancyId', params: { vacancyId: r.vacancy.id }, search: { tab: 'setup' } })
    },
  })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New vacancy</DialogTitle>
          <DialogDescription>Give it a name. You'll add the details, test and interview next.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (title.trim().length < 3) return toast.error('Enter a title, e.g. Mathematics Teacher')
            create.mutate({ title: title.trim(), roleAppliedFor: role })
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="vac-title">Job title</Label>
            <Input id="vac-title" autoFocus value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics Teacher (SSS)" />
          </div>
          <CustomSelect label="Role" value={role} onValueChange={setRole} items={roles.map((r) => ({ label: r.label, value: r.value }))} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending} className="gap-1.5">
              {create.isPending && <Loader2 className="size-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
