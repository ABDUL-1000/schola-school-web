import { useMemo, useState } from 'react'
import { CalendarPlus, FileText, Loader2, Search, Send, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DateField } from '@/components/ui/date-field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { FINAL, STAGES, fmtDate, initials, pct, stageInfo, useCandidates, useRecruitmentAction } from './recruitment'
import type { CandidateRow, Stage, Vacancy } from './recruitment'
import { CandidateSheet } from './candidate-sheet'

/**
 * Everyone who applied, filtered by stage, with the actions to move them on.
 * Shared by the school and staff portals (keep the copies in step).
 */
export function CandidatesPanel({ vacancy }: { vacancy: Vacancy }) {
  const { data, isLoading } = useCandidates(vacancy.id)
  const [stage, setStage] = useState<Stage | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null)
  const [dialog, setDialog] = useState<null | 'invite' | 'reject' | 'hire'>(null)

  const all = useMemo(() => data?.candidates ?? [], [data])
  const counts = useMemo(() => {
    const m = new Map<Stage, number>()
    for (const c of all) m.set(c.stage, (m.get(c.stage) ?? 0) + 1)
    return m
  }, [all])
  const rows = useMemo(() => {
    const t = search.trim().toLowerCase()
    return all.filter((c) => (stage === 'ALL' || c.stage === stage) && (!t || `${c.fullname} ${c.email} ${c.phone} ${c.qualification ?? ''}`.toLowerCase().includes(t)))
  }, [all, stage, search])
  const chosen = all.filter((c) => selected.has(c.id))
  const ids = chosen.map((c) => c.id)
  const clear = () => setSelected(new Set())

  const shortlist = useRecruitmentAction<{ ids: Array<string>; stage: string }, { updated: number }>('post', () => '/candidates/stage', {
    success: (r) => `${r.updated} shortlisted`,
    onDone: clear,
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <Chip active={stage === 'ALL'} onClick={() => setStage('ALL')} label="All" count={all.length} dot="bg-primary" />
        {STAGES.filter((s) => counts.get(s.value) || ['APPLIED', 'SHORTLISTED'].includes(s.value)).map((s) => (
          <Chip key={s.value} active={stage === s.value} onClick={() => setStage(s.value)} label={s.label} count={counts.get(s.value) ?? 0} dot={s.dot} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…" className="pl-8" />
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-primary/5 px-2 py-1.5 animate-in fade-in slide-in-from-top-1">
            <span className="px-1 text-xs font-medium">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={shortlist.isPending} onClick={() => shortlist.mutate({ ids, stage: 'SHORTLISTED' })}>
              <UserCheck className="size-3.5" /> Shortlist
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setDialog('invite')}>
              <CalendarPlus className="size-3.5" /> Invite
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setDialog('reject')}>
              <UserX className="size-3.5" /> Turn down
            </Button>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setDialog('hire')}>
              <UserPlus className="size-3.5" /> Hire
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="size-7 animate-spin text-primary" />
        </div>
      ) : !all.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-12 text-center">
          <Users className="size-8 text-muted-foreground" />
          <h3 className="font-semibold">No applications yet</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            {vacancy.status === 'OPEN' ? 'Share the job link. Applications appear here as they come in.' : 'Open the vacancy to publish its link, then share it.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 p-3">
                    <Checkbox
                      checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                      onCheckedChange={(c) => setSelected(c ? new Set([...selected, ...rows.map((r) => r.id)]) : new Set([...selected].filter((x) => !rows.some((r) => r.id === x))))}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="p-3 font-medium">Candidate</th>
                  <th className="hidden p-3 font-medium md:table-cell">Qualification</th>
                  <th className="p-3 font-medium">Stage</th>
                  {vacancy.useTest && <th className="p-3 text-right font-medium">CBT</th>}
                  {vacancy.useInterview && <th className="p-3 text-right font-medium">Interview</th>}
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="w-10 p-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <Row key={c.id} c={c} vacancy={vacancy} selected={selected.has(c.id)} onSelect={(on) => setSelected((s) => { const n = new Set(s); if (on) n.add(c.id); else n.delete(c.id); return n })} onOpen={() => setOpen(c.id)} />
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">
                      Nobody here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && <CandidateSheet id={open} onClose={() => setOpen(null)} onAction={(a) => { setSelected(new Set([open])); setDialog(a) }} />}
      {dialog === 'invite' && <InviteDialog vacancy={vacancy} people={chosen} onClose={() => setDialog(null)} onDone={clear} />}
      {dialog === 'reject' && <RejectDialog people={chosen} onClose={() => setDialog(null)} onDone={clear} />}
      {dialog === 'hire' && <HireDialog people={chosen} onClose={() => setDialog(null)} onDone={clear} />}
    </div>
  )
}

function Chip({ active, onClick, label, count, dot }: { active: boolean; onClick: () => void; label: string; count: number; dot: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
      <span className={cn('rounded-full px-1.5 tabular-nums', active ? 'bg-background/20' : 'bg-muted')}>{count}</span>
    </button>
  )
}

export function StagePill({ stage }: { stage: Stage }) {
  const s = stageInfo(stage)
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', s.tone)}>{s.label}</span>
}

export function Avatar({ name, photo, size = 'md' }: { name: string; photo: string | null; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-16 text-lg' : 'size-9 text-xs'
  if (photo) return <img src={photo} alt="" className={cn(box, 'shrink-0 rounded-full object-cover ring-2 ring-background')} />
  return <div className={cn(box, 'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-violet-500 font-semibold text-white')}>{initials(name)}</div>
}

function Row({ c, vacancy, selected, onSelect, onOpen }: { c: CandidateRow; vacancy: Vacancy; selected: boolean; onSelect: (on: boolean) => void; onOpen: () => void }) {
  return (
    <tr className={cn('cursor-pointer border-t transition-colors hover:bg-muted/40', selected && 'bg-primary/5')} onClick={onOpen}>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} aria-label={`Select ${c.fullname}`} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <Avatar name={c.fullname} photo={c.photoUrl} />
          <div className="min-w-0">
            <div className="truncate font-medium">{c.fullname}</div>
            <div className="truncate text-xs text-muted-foreground">
              {c.email} · applied {fmtDate(c.createdAt)}
            </div>
          </div>
        </div>
      </td>
      <td className="hidden p-3 text-xs text-muted-foreground md:table-cell">
        {c.qualification || '—'}
        {c.experienceYears !== null && <div>{c.experienceYears} yr{c.experienceYears === 1 ? '' : 's'} experience</div>}
      </td>
      <td className="p-3">
        <StagePill stage={c.stage} />
        {c.resultSentAt && <div className="mt-0.5 text-[10px] text-muted-foreground">result sent</div>}
      </td>
      {vacancy.useTest && (
        <td className="p-3 text-right tabular-nums">
          {c.testPercent !== null ? pct(c.testPercent) : c.test?.status === 'IN_PROGRESS' ? <span className="text-xs text-violet-600">writing…</span> : '—'}
          {c.test && c.test.status === 'SUBMITTED' && !c.test.graded && <div className="text-[10px] text-amber-600">theory to mark</div>}
        </td>
      )}
      {vacancy.useInterview && (
        <td className="p-3 text-right tabular-nums">
          {pct(c.interviewPercent)}
          {c.scorers > 0 && <div className="text-[10px] text-muted-foreground">{c.scorers} scorer{c.scorers > 1 ? 's' : ''}</div>}
        </td>
      )}
      <td className="p-3 text-right">
        <span className={cn('font-semibold tabular-nums', c.passes === true && 'text-emerald-600', c.passes === false && 'text-rose-600')}>{pct(c.totalPercent)}</span>
      </td>
      <td className="p-3" onClick={(e) => e.stopPropagation()}>
        {c.cvUrl && (
          <a href={c.cvUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" title="Open CV">
            <FileText className="size-4" />
          </a>
        )}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Dialogs (also used from the candidate panel)

function Names({ people }: { people: Array<{ fullname: string }> }) {
  const shown = people.slice(0, 4).map((p) => p.fullname)
  return (
    <span className="font-medium text-foreground">
      {shown.join(', ')}
      {people.length > 4 && ` and ${people.length - 4} more`}
    </span>
  )
}

export function InviteDialog({ vacancy, people, onClose, onDone }: { vacancy: Vacancy; people: Array<CandidateRow>; onClose: () => void; onDone?: () => void }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('9:00 AM')
  const [venue, setVenue] = useState('')
  const [note, setNote] = useState('')
  const [forTest, setForTest] = useState(vacancy.useTest)
  const [forInterview, setForInterview] = useState(vacancy.useInterview)
  const decided = people.filter((p) => FINAL.includes(p.stage))
  const send = useRecruitmentAction<object, { invited: number; emailed: number }>('post', () => '/candidates/invite', {
    success: (r) => `${r.invited} invited, ${r.emailed} emailed`,
    error: 'Could not send the invitations',
    onDone: () => {
      onDone?.()
      onClose()
    },
  })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite {people.length === 1 ? people[0].fullname : `${people.length} candidates`}</DialogTitle>
          <DialogDescription>
            Each one gets an email with the date and venue{vacancy.useTest ? ', and their own access code for the CBT' : ''}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <DateField value={date} onChange={setDate} min={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 9:00 AM" maxLength={40} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Venue</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. ICT / CBT centre, Main campus" maxLength={300} />
          </div>
          {(vacancy.useTest || vacancy.useInterview) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {vacancy.useTest && (
                <label className="flex items-center gap-2">
                  <Checkbox checked={forTest} onCheckedChange={(c) => setForTest(!!c)} /> CBT test
                </label>
              )}
              {vacancy.useInterview && (
                <label className="flex items-center gap-2">
                  <Checkbox checked={forInterview} onCheckedChange={(c) => setForInterview(!!c)} /> Interview
                </label>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Note (optional)</Label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="e.g. Come with your original certificates and a lesson plan for a 10-minute demonstration." />
          </div>
          {decided.length > 0 && <p className="text-xs text-amber-600">{decided.length} already decided (passed, failed, hired or turned down) and won't be invited.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="gap-1.5"
            disabled={send.isPending || !date}
            onClick={() => send.mutate({ ids: people.map((p) => p.id), date, time, venue, note, forTest, forInterview })}
          >
            {send.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send invitation{people.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RejectDialog({ people, onClose, onDone }: { people: Array<{ id: string; fullname: string }>; onClose: () => void; onDone?: () => void }) {
  const [sendEmail, setSendEmail] = useState(true)
  const [note, setNote] = useState('')
  const go = useRecruitmentAction<object, { updated: number; emailed: number }>('post', () => '/candidates/reject', {
    success: (r) => `${r.updated} turned down${r.emailed ? `, ${r.emailed} emailed` : ''}`,
    onDone: () => {
      onDone?.()
      onClose()
    },
  })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Turn down</DialogTitle>
          <DialogDescription>
            <Names people={people} /> will be marked as turned down. Their CV and documents are deleted after a month.
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(!!c)} className="mt-0.5" />
          <span>Send a polite email to let them know</span>
        </label>
        {sendEmail && <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a line of your own (optional)" maxLength={2000} />}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={go.isPending} onClick={() => go.mutate({ ids: people.map((p) => p.id), sendEmail, note })}>
            {go.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />} Turn down
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function HireDialog({ people, onClose, onDone }: { people: Array<{ id: string; fullname: string }>; onClose: () => void; onDone?: () => void }) {
  const go = useRecruitmentAction<object, { hired: number; problems: Array<string> }>('post', () => '/candidates/hire', {
    success: (r) => (r.hired ? `${r.hired} moved to Pending applications` : null),
    onDone: (r) => {
      if (r.problems.length) toast.error('Some candidates could not be hired', r.problems.join('; '))
      onDone?.()
      onClose()
    },
  })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hire</DialogTitle>
          <DialogDescription>
            <Names people={people} /> will move to the <strong>pending staff applications</strong>. Approve them there to create their staff account and send their invite, then send the appointment letter from Letters.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button className="gap-1.5" disabled={go.isPending} onClick={() => go.mutate({ ids: people.map((p) => p.id) })}>
            {go.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Hire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
