import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFinanceDashboard } from '@/hooks/queries/finance.queries'
import { useSessionsQuery } from '@/hooks/queries/academic.queries'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertCircle,
  Percent,
  Wallet,
  Receipt,
  PieChart as PieIcon,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/dashboard/finance/')({
  component: SchoolFinanceOverviewPage,
})

export function SchoolFinanceOverviewPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedTermId, setSelectedTermId] = useState<string>('')

  const { data: sessionsData } = useSessionsQuery()
  const sessions = sessionsData || []

  // Extract terms from selected session
  const activeSession = sessions.find((s: any) => s.id === selectedSessionId) || sessions.find((s: any) => s.isCurrent) || sessions[0]
  const terms = activeSession?.terms || []

  const { data: financeData, isLoading } = useFinanceDashboard({
    sessionId: selectedSessionId || activeSession?.id,
    termId: selectedTermId || undefined,
  })

  const kpis = financeData?.kpiCards || {
    totalRevenue: 0,
    totalCollected: 0,
    outstandingDebt: 0,
    totalExpenses: 0,
    payrollExpenses: 0,
    operationalExpenses: 0,
    netMargin: 0,
    collectionRate: 0,
  }

  const projections = financeData?.projections || {
    totalExpectedInflow: 0,
    totalPendingInflow: 0,
    totalExpectedOutflow: 0,
  }

  const classRates = financeData?.classCollectionRates || []
  const expensesByCategory = financeData?.expensesByCategory || {}

  const formatCurrency = (val: number) => `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header & Session / Term Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">School Finance & Accounting</h2>
          <p className="text-muted-foreground text-sm">
            Real-time cash flow, fee collection rate, payroll commitments, and net margin analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-48">
            <CustomSelect
              placeholder="Select Session"
              items={sessions.map((s: any) => ({
                label: `${s.name} ${s.isCurrent ? '(Current)' : ''}`,
                value: s.id,
              }))}
              value={selectedSessionId || activeSession?.id || ''}
              onValueChange={(val: string) => {
                setSelectedSessionId(val)
                setSelectedTermId('')
              }}
            />
          </div>
          <div className="w-44">
            <CustomSelect
              placeholder="All Terms"
              items={[
                { label: 'All Terms', value: '' },
                ...terms.map((t: any) => ({ label: t.name, value: t.id })),
              ]}
              value={selectedTermId}
              onValueChange={(val: string) => setSelectedTermId(val)}
            />
          </div>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Collected / Inflow */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collected Inflow
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(kpis.totalCollected)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Online & manual fee receipts
            </p>
          </CardContent>
        </Card>

        {/* Expected Inflow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Expected Fees
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projections.totalExpectedInflow)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Billed to all active students
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Debt */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Uncollected Debt
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full text-amber-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(kpis.outstandingDebt)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending student fee balances
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses (Payroll + Operational) */}
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Outflows
            </CardTitle>
            <div className="p-2 bg-rose-500/10 rounded-full text-rose-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{formatCurrency(kpis.totalExpenses)}</div>
            <div className="text-[11px] text-muted-foreground mt-1 flex justify-between">
              <span>Payroll: {formatCurrency(kpis.payrollExpenses)}</span>
              <span>Ops: {formatCurrency(kpis.operationalExpenses)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Margin */}
        <Card className={kpis.netMargin >= 0 ? "border-emerald-500/30" : "border-rose-500/30"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Net Margin
            </CardTitle>
            <div className={`p-2 rounded-full ${kpis.netMargin >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(kpis.netMargin)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net cash flow balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Health & Class Breakdown */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Class Collection Rates Progress */}
        <Card className="md:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Fee Collection Rate per Class</CardTitle>
                <CardDescription>Real-time fee payment completion across enrolled classrooms</CardDescription>
              </div>
              <Badge variant="outline" className="text-primary font-bold">
                Overall: {kpis.collectionRate}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {classRates.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No fee billing records found for this period. Create fee schedules to begin billing.
              </p>
            ) : (
              classRates.map((cls: any) => (
                <div key={cls.classId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{cls.className}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(cls.totalPaid)} of {formatCurrency(cls.totalBilled)} ({cls.rate}%)
                    </span>
                  </div>
                  <Progress value={cls.rate} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Expenses by Category Breakdown */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Operational Outflows by Category</CardTitle>
            <CardDescription>Distribution of school expenditures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Always include Payroll row */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold">Staff Payroll</span>
              </div>
              <span className="text-xs font-bold">{formatCurrency(kpis.payrollExpenses)}</span>
            </div>

            {Object.entries(expensesByCategory).map(([cat, amount]: [string, any]) => (
              <div key={cat} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold capitalize">
                    {cat.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
                <span className="text-xs font-bold">{formatCurrency(amount)}</span>
              </div>
            ))}

            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No ad-hoc operational expenses logged yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
