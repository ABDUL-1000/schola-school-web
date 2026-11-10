import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, FileText, Loader2, Printer, Search, Send, Sparkles, UserRound, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { CardTable } from '@/lib/card-table'
import { printA4 } from '@/lib/print-a4'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NigerianReportSheet } from '@/components/grading/nigerian-report-sheet'
import { ClassSubjectsSheet } from '@/components/curriculum/class-subjects-sheet'
import {
  useClassBroadsheetQuery,
  useGenerateReportSheetsMutation,
  usePublishReportSheetsMutation,
  useSingleReportSheetQuery,
} from '@/hooks/queries/grading.queries'

export const Route = createFileRoute('/_authenticated/dashboard/classes/$classId')({
  validateSearch: (s: Record<string, unknown>): { tab?: 'students' | 'subjects' | 'report' } =>
    s.tab === 'subjects' || s.tab === 'report' ? { tab: s.tab } : {},
  component: ClassPage,
})

interface ClassDetail {
  id: string
  name: string
  level: string | null
  branch?: { name: string }
  students: Array<{ id: string; fullname: string; regNumber: string | null; gender: string | null; profileImage: string | null; status: string }>
  classLeads: Array<{ staff: { id: string; fullname: string; email: string | null; phone: string | null } }>
  subjectAssignments: Array<{ id: string; teacher: { id: string; fullname: string } | null; subject: { id: string; name: string } }>
}

/** Everything about one class: students, subjects & teachers, form master, report sheet and report cards. */
function ClassPage() {
  const { classId } = Route.useParams()
  const { tab = 'students' } = Route.useSearch()
  const navigate = useNavigate()
  const { data: cls, isLoading, refetch } = useQuery({
    queryKey: ['classes', 'detail', classId],
    queryFn: async () => (await api.get(`/school/class/${classId}`)).data?.data as ClassDetail,
  })
  const { data: sessions = [] } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => ((await api.get('/school/academic/sessions')).data?.data || []) as Array<any>,
  })
  const terms: Array<{ id: string; name: string; sessionName: string; isCurrent: boolean }> = sessions.flatMap((s: any) =>
    (s.terms || []).map((t: any) => ({ id: t.id, name: t.name, sessionName: s.name, isCurrent: !!t.isCurrent })),
  )
  const [termId, setTermId] = useState('')
  useEffect(() => {
    if (!termId && terms.length) setTermId((terms.find((t) => t.isCurrent) || terms[0]).id)
  }, [terms.length])

  const [subjectsOpen, setSubjectsOpen] = useState(false)
  const [cardFor, setCardFor] = useState<string | null>(null)

  // Distinct subjects (older data may list a subject twice).
  const subjects = useMemo(() => {
    const seen = new Map<string, ClassDetail['subjectAssignments'][number]>()
    for (const sa of cls?.subjectAssignments || []) {
      const cur = seen.get(sa.subject.id)
      if (!cur || (!cur.teacher && sa.teacher)) seen.set(sa.subject.id, sa)
    }
    return [...seen.values()].sort((a, b) => a.subject.name.localeCompare(b.subject.name))
  }, [cls])

  if (isLoading || !cls) return <Loader2 className="mx-auto mt-16 size-6 animate-spin text-primary" />
  const formMaster = cls.classLeads.at(0)?.staff
  const setTab = (t: string) => navigate({ to: '/dashboard/classes/$classId', params: { classId }, search: t === 'students' ? {} : { tab: t as any }, replace: true })

  return (
    // min-w-0 keeps wide tables scrolling inside their box instead of widening the page.
    <div className="min-w-0 max-w-full space-y-6">
      <div>
        <Link to="/dashboard/classes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Classes
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {cls.level && <Badge variant="secondary">{cls.level}</Badge>}
              {cls.branch?.name && <span>{cls.branch.name}</span>}
            </div>
          </div>
          <select
            aria-label="Term"
            className="h-9 rounded-md border border-input bg-background px-2 text-sm sm:w-64"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.sessionName}
                {t.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* At a glance */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat icon={<Users className="size-4" />} label="Students" value={String(cls.students.length)} />
        <Stat icon={<BookOpen className="size-4" />} label="Subjects" value={String(subjects.length)} hint={`${subjects.filter((s) => !s.teacher).length || 'No'} without a teacher`} />
        <Stat
          icon={<UserRound className="size-4" />}
          label="Form master"
          value={formMaster?.fullname || 'Not assigned'}
          hint={formMaster ? formMaster.phone || formMaster.email || undefined : 'Assign one from the Classes list'}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="students">Students & report cards</TabsTrigger>
          <TabsTrigger value="subjects">Subjects & teachers</TabsTrigger>
          <TabsTrigger value="report">Class report sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="pt-4">
          <StudentsTab cls={cls} onCard={setCardFor} />
        </TabsContent>

        <TabsContent value="subjects" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setSubjectsOpen(true)} className="gap-2">
              <BookOpen className="size-4" /> Edit subjects & teachers
            </Button>
          </div>
          {subjects.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No subjects yet. Use “Edit subjects & teachers”.</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {subjects.map((sa) => (
                <li key={sa.subject.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="font-medium">{sa.subject.name}</span>
                  <span className={cn(!sa.teacher && 'text-amber-700 dark:text-amber-300')}>{sa.teacher?.fullname || 'No teacher yet'}</span>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="report" className="pt-4">
          {termId ? <ReportSheetTab classId={classId} termId={termId} onCard={setCardFor} /> : <p className="text-sm text-muted-foreground">Create an academic session first.</p>}
        </TabsContent>
      </Tabs>

      <ClassSubjectsSheet
        classId={subjectsOpen ? classId : null}
        onClose={() => {
          setSubjectsOpen(false)
          void refetch()
        }}
      />
      <ReportCardDialog termId={termId} studentId={cardFor} onClose={() => setCardFor(null)} />
    </div>
  )
}

function Stat({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
      {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  )
}

function StudentsTab({ cls, onCard }: { cls: ClassDetail; onCard: (id: string) => void }) {
  const [q, setQ] = useState('')
  const list = cls.students.filter((s) => !q || `${s.fullname} ${s.regNumber || ''}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {cls.students.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No students in this class yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <CardTable className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">#</th>
                <th className="px-4 py-2 text-left font-medium">Student</th>
                <th className="px-4 py-2 text-left font-medium">Gender</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((s, i) => (
                <tr key={s.id} className="border-t">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{s.fullname}</div>
                    <div className="text-xs text-muted-foreground">{s.regNumber || ''}</div>
                  </td>
                  <td className="px-4 py-2">{s.gender || '–'}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/dashboard/students/$studentId" params={{ studentId: s.id }}>
                        Profile
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onCard(s.id)}>
                      <FileText className="size-4" /> Report card
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </CardTable>
        </div>
      )}
    </div>
  )
}

function ReportSheetTab({ classId, termId, onCard }: { classId: string; termId: string; onCard: (id: string) => void }) {
  const { data: sheet, isLoading } = useClassBroadsheetQuery(termId, classId)
  const generate = useGenerateReportSheetsMutation()
  const publish = usePublishReportSheetsMutation()
  const printRef = useRef<HTMLDivElement>(null)
  const allSubjects: Array<{ id: string; name: string }> = sheet?.subjects || []
  const rows: Array<any> = sheet?.students || []
  // Only subjects that have scores this term (others would be a column of dashes).
  const subjects = allSubjects.filter((s) => rows.some((r) => Number(r.subjectBreakdowns?.[s.id]?.totalScore) > 0))
  const hidden = allSubjects.length - subjects.length
  const scored = rows.filter((r) => r.subjectsCount > 0)
  const classAverage = scored.length ? Math.round((scored.reduce((a, r) => a + Number(r.averageScore || 0), 0) / scored.length) * 10) / 10 : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {sheet ? (
            <>
              {sheet.totalStudents} students
              {classAverage !== null && (
                <>
                  {' '}
                  · class average <b className="text-foreground">{classAverage}%</b>
                </>
              )}
              {hidden > 0 && ` · ${hidden} subject${hidden === 1 ? '' : 's'} without scores not shown`}
            </>
          ) : (
            ' '
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-2"
            disabled={generate.isPending}
            onClick={() =>
              generate.mutate(
                { termId, classId },
                { onSuccess: (r: any) => toast.success(r?.message || 'Report sheets prepared'), onError: (e: any) => toast.error(e?.message || 'Could not prepare report sheets') },
              )
            }
          >
            {generate.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Prepare report cards
          </Button>
          <Button
            className="gap-2"
            disabled={publish.isPending}
            onClick={() =>
              publish.mutate(
                { termId, classId },
                {
                  onSuccess: (r: any) => toast.success(r?.message || 'Published to students and parents'),
                  onError: (e: any) => toast.error(e?.message || 'Could not publish'),
                },
              )
            }
          >
            {publish.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Publish to students & parents
          </Button>
          <Button
            variant="ghost"
            className="gap-2"
            disabled={!scored.length}
            onClick={() =>
              printA4(printRef.current, {
                landscape: true,
                title: `Report sheet - ${sheet?.class?.name || ''} - ${sheet?.term?.name || ''} ${sheet?.term?.session?.name || ''}`.trim(),
              })
            }
          >
            <Printer className="size-4" /> Download / print
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : !rows.length || !subjects.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No scores for this term yet.</p>
      ) : (
        <div ref={printRef} className="bg-background">
        <div className="mb-2 hidden text-center [#a4-print-root_&]:block">
          <h2 className="text-lg font-bold">{sheet?.class?.school?.schoolName}</h2>
          <p className="text-sm">
            {sheet?.class?.name} — Report sheet, {sheet?.term?.name} {sheet?.term?.session?.name}
          </p>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <CardTable className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Pos.</th>
                <th className="px-3 py-2 text-left font-medium">Student</th>
                {subjects.map((s) => (
                  <th key={s.id} className="px-2 py-2 text-center font-medium" title={s.name}>
                    {s.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-center font-medium">Total</th>
                <th className="px-3 py-2 text-center font-medium">Average</th>
                <th className="px-3 py-2 [#a4-print-root_&]:hidden" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student.id} className="border-t">
                  <td className="px-3 py-2 font-semibold">{row.classPositionFormatted || '–'}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.student.fullname}</div>
                    <div className="text-xs text-muted-foreground">{row.student.regNumber || ''}</div>
                  </td>
                  {subjects.map((s) => {
                    const bd = row.subjectBreakdowns?.[s.id]
                    return (
                      <td key={s.id} className="px-2 py-2 text-center tabular-nums">
                        {bd && bd.totalScore ? (
                          <>
                            {bd.totalScore}
                            {bd.grade && bd.grade !== '-' && <span className="ml-1 text-[10px] text-muted-foreground">{bd.grade}</span>}
                          </>
                        ) : (
                          '–'
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-center font-semibold">{row.cumulativeTotal}</td>
                  <td className="px-3 py-2 text-center font-semibold text-primary">{row.averageScore}%</td>
                  <td className="px-3 py-2 text-right [#a4-print-root_&]:hidden">
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => onCard(row.student.id)}>
                      <FileText className="size-4" /> Report card
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </CardTable>
        </div>
        </div>
      )}
    </div>
  )
}

function ReportCardDialog({ termId, studentId, onClose }: { termId: string; studentId: string | null; onClose: () => void }) {
  const { data, isLoading } = useSingleReportSheetQuery(termId, studentId || '')
  return (
    <Dialog open={!!studentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-full max-w-[95vw] overflow-y-auto p-4 sm:max-w-6xl sm:p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Report card</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Loader2 className="mx-auto my-16 size-6 animate-spin text-primary" />
        ) : data ? (
          <NigerianReportSheet data={data} onClose={onClose} />
        ) : (
          <p className="p-8 text-center text-muted-foreground">Unable to load this report card.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
