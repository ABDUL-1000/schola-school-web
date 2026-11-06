import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect } from '@/components/ui/custom-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader, StatTile } from '@/components/lesson-plans/page-bits'
import { useLessonPlanComplianceQuery, useLessonPlanSettingsMutation, useReviewLessonPlansQuery } from '@/hooks/queries/lesson-plan.queries'
import { toast } from '@/lib/toast'
import { PlanStatusBadge, shiftWeek, weekLabel } from '@/components/lesson-plans/plan-utils'

export const Route = createFileRoute('/_authenticated/dashboard/lesson-plans/')({
  component: LessonPlanReviewPage,
})

function LessonPlanReviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson Plans"
        description="Teachers submit a lesson plan for each class and subject every week. Approve them or send them back with comments."
        actions={<DueDaySetting />}
      />
      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Review queue</TabsTrigger>
          <TabsTrigger value="week">Submissions by week</TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="pt-4"><Queue /></TabsContent>
        <TabsContent value="week" className="pt-4"><Compliance /></TabsContent>
      </Tabs>
    </div>
  )
}

function Queue() {
  const [status, setStatus] = useState('SUBMITTED')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useReviewLessonPlansQuery({ status, search: search.length >= 2 ? search : '', page })
  const plans = data?.plans || []

  return (
    <div className="space-y-4">
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Awaiting review" value={data.counts.submitted} tone={data.counts.submitted ? 'warn' : undefined} />
          <StatTile label="Changes requested" value={data.counts.changesRequested} />
          <StatTile label="Approved" value={data.counts.approved} tone="good" />
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <CustomSelect
          className="w-[200px]"
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1) }}
          items={[
            { label: 'Awaiting review', value: 'SUBMITTED' },
            { label: 'Changes requested', value: 'CHANGES_REQUESTED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'All submitted', value: 'ALL' },
          ]}
        />
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search teacher or topic" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <Loader2 className="mx-auto my-6 size-5 animate-spin text-primary" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Teacher</th>
                  <th className="px-4 py-2 text-left font-medium">Class & subject</th>
                  <th className="px-4 py-2 text-left font-medium">Week</th>
                  <th className="px-4 py-2 text-left font-medium">Topic</th>
                  <th className="px-4 py-2 text-left font-medium">Submitted</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 font-medium">{p.teacher.fullname}</td>
                    <td className="px-4 py-2">{p.class.name} — {p.subject.name}</td>
                    <td className="whitespace-nowrap px-4 py-2">{weekLabel(p.weekStart)}</td>
                    <td className="px-4 py-2">
                      <Link to="/dashboard/lesson-plans/$planId" params={{ planId: p.id }} className="font-medium text-primary hover:underline">
                        {p.topic}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs">{p.submittedAt ? format(new Date(p.submittedAt), 'd MMM, h:mm a') : '–'}</td>
                    <td className="px-4 py-2"><PlanStatusBadge status={p.status} late={p.late} /></td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nothing here.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      {data && data.pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={!data.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={!data.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}

function Compliance() {
  const [weekStart, setWeekStart] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)
  const { data, isLoading } = useLessonPlanComplianceQuery(weekStart || undefined)
  const shown = weekStart || data?.weekStart || ''
  const rows = (data?.rows || []).filter((r) => !onlyMissing || r.state === 'MISSING' || r.state === 'DRAFT')

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base">{shown ? `Week of ${weekLabel(shown)}` : 'Week'}</CardTitle>
          {data && <p className="text-xs text-muted-foreground">Due {format(new Date(data.dueAt), 'EEE d MMM, h:mm a')}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={onlyMissing ? 'default' : 'outline'} onClick={() => setOnlyMissing((v) => !v)}>
            Not submitted only
          </Button>
          <Button size="icon" variant="outline" disabled={!shown} onClick={() => setWeekStart(shiftWeek(shown, -1))}><ChevronLeft className="size-4" /></Button>
          {data && <Button size="sm" variant="ghost" onClick={() => setWeekStart(data.schedule.nextWeek)}>Next week</Button>}
          <Button size="icon" variant="outline" disabled={!shown} onClick={() => setWeekStart(shiftWeek(shown, 1))}><ChevronRight className="size-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          <Loader2 className="mx-auto size-5 animate-spin text-primary" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Expected" value={data.summary.expected} hint="class × subject assignments" />
              <StatTile label="Not submitted" value={data.summary.missing} tone={data.summary.missing ? 'bad' : 'good'} />
              <StatTile label="Awaiting review" value={data.summary.submitted} />
              <StatTile label="Approved" value={data.summary.approved} tone="good" />
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Teacher</th>
                    <th className="px-4 py-2 text-left font-medium">Class</th>
                    <th className="px-4 py-2 text-left font-medium">Subject</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.teacher.id}|${r.class.id}|${r.subject.id}`} className="border-t">
                      <td className="px-4 py-2 font-medium">{r.teacher.fullname}</td>
                      <td className="px-4 py-2">{r.class.name}</td>
                      <td className="px-4 py-2">{r.subject.name}</td>
                      <td className="px-4 py-2">
                        {r.planId ? (
                          <Link to="/dashboard/lesson-plans/$planId" params={{ planId: r.planId }}>
                            <PlanStatusBadge status={r.state as any} late={r.late} />
                          </Link>
                        ) : (
                          <PlanStatusBadge status={r.state === 'DRAFT' ? 'DRAFT' : 'MISSING'} late={r.late} />
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Everyone has submitted.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** When next week's plans are due (the school account sets this for everyone). */
function DueDaySetting() {
  const { data } = useLessonPlanComplianceQuery(undefined)
  const save = useLessonPlanSettingsMutation()
  if (!data) return null
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Due every</span>
      <CustomSelect
        className="w-[150px]"
        value={String(data.schedule.dueDay)}
        onValueChange={async (v) => {
          try {
            const res = await save.mutateAsync({ lessonPlanDueDay: Number(v) })
            toast.success(`Lesson plans now due ${res.dueDayName} of the week before`)
          } catch (e: any) {
            toast.error(e?.message || 'Could not update')
          }
        }}
        items={DAYS.map((d, i) => ({ label: d, value: String(i) }))}
      />
      <span className="text-muted-foreground">for the next week</span>
    </div>
  )
}
