import { createFileRoute } from '@tanstack/react-router'
import { useDefaultToCurrent } from '@/lib/current-term'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Loader2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useSessionsQuery } from '@/hooks/queries/academic.queries'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/dashboard/finance/balances')({
  component: SchoolFinancePage,
})

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
const money = (v: unknown) => naira.format(Number(v || 0))

const METHOD: Record<string, string> = {
  CASH: 'Cash', MANUAL_CASH: 'Cash', BANK_TRANSFER: 'Bank transfer', OFFLINE_BANK_TRANSFER: 'Bank transfer',
  POS: 'POS', BANK_DRAFT: 'Bank draft', MANUAL_WIRE: 'Wire', PAYSTACK: 'Paystack', FLUTTERWAVE: 'Flutterwave', MONNIFY: 'Monnify',
}

const STATUS: Partial<Record<string, { label: string; className: string }>> = {
  PAID: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  PARTIAL: { label: 'Part paid', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  OWING: { label: 'Owing', className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' },
  NO_BILL: { label: 'No bill', className: 'bg-muted text-muted-foreground' },
}

const clean = (p: Record<string, any>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null))
const fetchFinance = (path: string, params: Record<string, any> = {}) =>
  api.get(`/school/finance${path}`, { params: clean(params) }).then((r) => r.data?.data)

/**
 * Who has paid and who owes, per class and per student, for a term. Bills come from
 * the fee schedules (Fee Schedules page); discounts and offline payments can also be
 * recorded by staff with the Bursar role in the staff portal.
 */
function SchoolFinancePage() {
  const { data: sessions = [] } = useSessionsQuery()
  const terms = useMemo(
    () =>
      sessions
        .flatMap((s: any) => (s.terms || []).map((t: any) => ({ ...t, sessionName: s.name })))
        .sort((a: any, b: any) => +new Date(b.startDate) - +new Date(a.startDate)),
    [sessions],
  )
  const [termId, setTermId] = useState('')
  // Open on the current term.
  useDefaultToCurrent(sessions, ({ term }) => term && setTermId(term.id))
  const overview = useQuery({
    queryKey: ['school-finance', 'overview', termId],
    queryFn: () => fetchFinance('/overview', { termId }),
  })
  const data = overview.data

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Fee Balances</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.term.name} · ${data.term.session?.name}. ` : ''}
            Bills come from your fee schedules; the bursar can add discounts and record payments in the staff portal.
          </p>
        </div>
        <CustomSelect
          className="w-[240px]"
          value={termId}
          onValueChange={setTermId}
          items={[{ label: 'Current term', value: '' }, ...terms.map((t: any) => ({ label: `${t.name} · ${t.sessionName}`, value: t.id }))]}
        />
      </div>

      {overview.isLoading ? (
        <Loader2 className="mx-auto size-6 animate-spin text-primary" />
      ) : overview.isError || !data ? (
        <p className="text-sm text-muted-foreground">
          {(overview.error as any)?.message || 'Could not load finance data. Create an academic session first.'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Expected this term" value={money(data.summary.totalDue)} hint={`${data.summary.students} students`} />
            <Tile label="Collected" value={money(data.summary.totalPaid)} hint={`${data.summary.collectionRate}% of expected`} />
            <Tile label="Outstanding" value={money(data.summary.outstanding)} />
            <Tile label="Payroll (term months)" value={money(data.payroll.paid)} hint={data.payroll.pending ? `${money(data.payroll.pending)} pending` : 'paid to staff'} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Fully paid" value={data.summary.paidCount} />
            <Tile label="Part paid" value={data.summary.partialCount} />
            <Tile label="Not paid" value={data.summary.owingCount} />
            <Tile label="Overdue" value={data.summary.overdueCount ?? 0} hint={data.summary.noBillCount ? `${data.summary.noBillCount} with no bill` : undefined} />
          </div>

          <Tabs defaultValue="classes">
            <TabsList>
              <TabsTrigger value="classes">By class</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="payments">Payment records</TabsTrigger>
            </TabsList>
            <TabsContent value="classes" className="pt-4">
              <Card>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Class</th>
                        <th className="px-4 py-2 text-right font-medium">Students</th>
                        <th className="px-4 py-2 text-right font-medium">Expected</th>
                        <th className="px-4 py-2 text-right font-medium">Collected</th>
                        <th className="px-4 py-2 text-right font-medium">Outstanding</th>
                        <th className="px-4 py-2 text-right font-medium">Collected %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byClass.map((c: any) => (
                        <tr key={c.classId || 'none'} className="border-t">
                          <td className="px-4 py-2 font-medium">{c.className}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{c.students}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{money(c.totalDue)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{money(c.paid)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{money(c.outstanding)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{c.totalDue > 0 ? `${Math.round((c.paid / c.totalDue) * 100)}%` : '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="students" className="pt-4"><StudentsTab termId={termId} /></TabsContent>
            <TabsContent value="payments" className="pt-4"><PaymentsTab termId={termId || data.term.id} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function Tile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}

function StudentsTab({ termId }: { termId: string }) {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['school-finance', 'students', termId, status, search, page],
    queryFn: () => fetchFinance('/students', { termId, status, search: search.length >= 2 ? search : '', page, limit: 50 }),
  })
  const rows: Array<any> = data?.students || []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <CustomSelect
          className="w-[180px]"
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1) }}
          items={[{ label: 'All students', value: '' }, { label: 'Paid', value: 'PAID' }, { label: 'Part paid', value: 'PARTIAL' }, { label: 'Owing', value: 'OWING' }, { label: 'Overdue', value: 'OVERDUE' }, { label: 'No bill', value: 'NO_BILL' }]}
        />
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search name or reg. no." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      {isLoading ? (
        <Loader2 className="mx-auto size-5 animate-spin text-primary" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Student</th>
                <th className="px-4 py-2 text-left font-medium">Class</th>
                <th className="px-4 py-2 text-right font-medium">Total due</th>
                <th className="px-4 py-2 text-right font-medium">Paid</th>
                <th className="px-4 py-2 text-right font-medium">Balance</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = STATUS[r.status] ?? { label: r.status, className: 'bg-muted' }
                return (
                  <tr key={r.studentId} className="border-t">
                    <td className="px-4 py-2"><div className="font-medium">{r.fullname}</div><div className="text-xs text-muted-foreground">{r.regNumber || ''}</div></td>
                    <td className="px-4 py-2">{r.className || 'Unassigned'}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(r.totalDue)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(r.paid)}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">{money(r.balance)}</td>
                    <td className="px-4 py-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.className)}>{st.label}</span>
                      {r.overdue && <span className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">Overdue</span>}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No students match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <Pager pagination={data?.pagination} setPage={setPage} />
    </div>
  )
}

function PaymentsTab({ termId }: { termId: string }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['school-finance', 'payments', termId, page],
    queryFn: () => fetchFinance('/payments', { termId, page, limit: 25 }),
  })
  const payments: Array<any> = data?.payments || []
  if (isLoading) return <Loader2 className="mx-auto size-5 animate-spin text-primary" />
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Total recorded: <b className="text-foreground">{money(data?.totalAmount)}</b></p>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Date</th>
              <th className="px-4 py-2 text-left font-medium">Student</th>
              <th className="px-4 py-2 text-left font-medium">Method</th>
              <th className="px-4 py-2 text-left font-medium">Receipt / ref.</th>
              <th className="px-4 py-2 text-left font-medium">Recorded by</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="whitespace-nowrap px-4 py-2">{format(new Date(p.paidAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-2"><div className="font-medium">{p.student?.fullname}</div><div className="text-xs text-muted-foreground">{p.student?.class?.name}</div></td>
                <td className="px-4 py-2">{METHOD[p.method] || p.method}</td>
                <td className="px-4 py-2 text-xs"><div className="font-medium">{p.receiptNumber}</div><div className="text-muted-foreground">{p.feeTitle || ''}{p.reference && p.reference !== p.transactionRef ? ` · ${p.reference}` : ''}</div></td>
                <td className="px-4 py-2 text-xs">{p.recordedByName || '–'}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{money(p.amount)}</td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No payments this term.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager pagination={data?.pagination} setPage={setPage} />
    </div>
  )
}

function Pager({ pagination, setPage }: { pagination: any; setPage: (fn: (p: number) => number) => void }) {
  if (!pagination || pagination.totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
      <Button variant="outline" size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
    </div>
  )
}
