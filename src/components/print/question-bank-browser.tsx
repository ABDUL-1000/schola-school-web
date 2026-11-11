import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Download, Eye, Loader2, Paperclip, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CustomSelect } from '@/components/ui/custom-select'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { downloadPrintable } from './printable-exam-view'
import { typeLabel } from './exam-print.types'

export interface BankItem {
  kind: 'paper' | 'cbt'
  id: string
  title: string
  type: string
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  class: { id: string; name: string }
  subject: { id: string; name: string }
  teacher: { id: string; fullname: string }
  isMine: boolean
  term: { id: string; name: string; sessionName: string } | null
  questionCount: number
  hasAttachment: boolean
  totalMarks: number | null
  date: string
}

const STATUS: Record<BankItem['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  SUBMITTED: { label: 'Awaiting approval', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  REJECTED: { label: 'Needs changes', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
}

const clean = (p: Record<string, any>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null && v !== false))

/**
 * Archive of every exam, test and question paper — current and previous —
 * filterable by session, term, class, subject and type, with print/download.
 */
export function QuestionBankBrowser({
  basePath,
  onOpen,
  showMine = false,
}: {
  basePath: string
  onOpen: (item: BankItem) => void
  /** Staff portal: offer a "My papers only" toggle. */
  showMine?: boolean
}) {
  const [sessionId, setSessionId] = useState('')
  const [termId, setTermId] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [mine, setMine] = useState(false)
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<string | null>(null)

  const { data: filters } = useQuery({
    queryKey: ['question-bank-filters', basePath],
    queryFn: async () => (await api.get(`${basePath}/filters`)).data?.data,
    staleTime: 5 * 60 * 1000,
  })
  const sessions: Array<any> = filters?.sessions || []
  // Start on the current session and term (the lists still offer "All").
  const defaulted = useRef(false)
  useEffect(() => {
    if (defaulted.current || !sessions.length) return
    defaulted.current = true
    const cur = sessions.find((x) => x.isCurrent)
    if (!cur) return
    setSessionId(cur.id)
    const term = (cur.terms || []).find((t: any) => t.isCurrent)
    if (term) setTermId(term.id)
  }, [sessions])
  const terms: Array<any> = useMemo(
    () => (sessionId ? sessions.find((s) => s.id === sessionId)?.terms || [] : []),
    [sessions, sessionId],
  )
  // Subjects are per branch, so the same name can appear more than once.
  const subjects: Array<any> = useMemo(() => {
    const seen = new Set<string>()
    return (filters?.subjects || []).filter((s: any) => (seen.has(s.name) ? false : (seen.add(s.name), true)))
  }, [filters])

  const params = clean({ sessionId, termId, classId, subjectId, type, kind, status, search: search.length >= 2 ? search : '', mine, page, limit: 20 })
  const { data, isLoading } = useQuery({
    queryKey: ['question-bank', basePath, params],
    queryFn: async () => (await api.get(basePath, { params })).data?.data,
  })
  const items: Array<BankItem> = data?.items || []
  const canSeeAll = !!data?.canSeeAll

  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  const download = async (item: BankItem) => {
    setDownloading(item.id)
    try {
      await downloadPrintable(basePath, item.kind, item.id)
    } catch (e: any) {
      toast.error('Could not download', e?.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <CustomSelect
          value={sessionId}
          onValueChange={(v) => { setSessionId(v); setTermId(''); setPage(1) }}
          items={[{ label: 'All sessions', value: '' }, ...sessions.map((s) => ({ label: `${s.name}${s.isCurrent ? ' (current)' : ''}`, value: s.id }))]}
        />
        <CustomSelect
          value={termId}
          onValueChange={reset(setTermId)}
          disabled={!sessionId}
          placeholder={sessionId ? 'All terms' : 'Pick a session first'}
          items={[{ label: 'All terms', value: '' }, ...terms.map((t) => ({ label: `${t.name}${t.isCurrent ? ' (current)' : ''}`, value: t.id }))]}
        />
        <CustomSelect
          value={classId}
          onValueChange={reset(setClassId)}
          items={[{ label: 'All classes', value: '' }, ...(filters?.classes || []).map((c: any) => ({ label: c.name, value: c.id }))]}
        />
        <CustomSelect
          value={subjectId}
          onValueChange={reset(setSubjectId)}
          items={[{ label: 'All subjects', value: '' }, ...subjects.map((s) => ({ label: s.name, value: s.id }))]}
        />
        <CustomSelect
          value={type}
          onValueChange={reset(setType)}
          items={[
            { label: 'All types', value: '' },
            { label: 'Examination', value: 'EXAM' },
            { label: 'Test', value: 'TEST' },
            { label: 'Continuous Assessment', value: 'CA' },
            { label: 'Quiz', value: 'QUIZ' },
            { label: 'Assignment', value: 'ASSIGNMENT' },
          ]}
        />
        <CustomSelect
          value={kind}
          onValueChange={reset(setKind)}
          items={[
            { label: 'Written & CBT', value: '' },
            { label: 'Written papers', value: 'paper' },
            { label: 'CBT', value: 'cbt' },
          ]}
        />
        {(canSeeAll || mine) && (
          <CustomSelect
            value={status}
            onValueChange={reset(setStatus)}
            items={[
              { label: canSeeAll && !mine ? 'All submitted' : 'Any status', value: '' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Awaiting approval', value: 'SUBMITTED' },
              { label: 'Needs changes', value: 'REJECTED' },
              ...(mine ? [{ label: 'Draft', value: 'DRAFT' }] : []),
            ]}
          />
        )}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search title" value={search} onChange={(e) => reset(setSearch)(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {data ? `${data.pagination.totalDocs} result${data.pagination.totalDocs === 1 ? '' : 's'}` : ' '}
          {!canSeeAll && !mine && ' · showing approved papers and your own'}
        </span>
        {showMine && (
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="accent-primary" checked={mine} onChange={(e) => { setMine(e.target.checked); setStatus(''); setPage(1) }} />
            My papers only
          </label>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : items.length === 0 ? (
        <div className="rounded-lg border bg-card/50 py-12 text-center text-sm text-muted-foreground">No exams or tests match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Title</th>
                <th className="px-4 py-2 text-left font-medium">Subject · Class</th>
                <th className="px-4 py-2 text-left font-medium">Session · Term</th>
                <th className="px-4 py-2 text-left font-medium">Set by</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.kind}-${item.id}`} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2">
                    <button type="button" className="text-left font-medium hover:text-primary" onClick={() => onOpen(item)}>
                      {item.title}
                    </button>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-px text-[10px] font-semibold uppercase">{item.kind === 'cbt' ? 'CBT' : 'Written'}</span>
                      {typeLabel(item.type)} · {item.questionCount} question{item.questionCount === 1 ? '' : 's'}
                      {item.totalMarks ? ` · ${item.totalMarks} marks` : ''}
                      {item.hasAttachment && <Paperclip className="size-3" />}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div>{item.subject.name}</div>
                    <div className="text-xs text-muted-foreground">{item.class.name}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {item.term ? (
                      <>
                        <div>{item.term.sessionName}</div>
                        <div className="text-muted-foreground">{item.term.name}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">{item.isMine ? 'You' : item.teacher.fullname}</td>
                  <td className="px-4 py-2">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS[item.status].className)}>
                      {STATUS[item.status].label}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => onOpen(item)}>
                      <Eye className="mr-1 size-3.5" /> View / print
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => download(item)} disabled={downloading === item.id}>
                      {downloading === item.id ? <Loader2 className="mr-1 size-3.5 animate-spin" /> : <Download className="mr-1 size-3.5" />}
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={!data.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={!data.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
