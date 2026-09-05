import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { useSchoolReportsQuery } from '@/hooks/queries/reports.queries'
import { useSessionsQuery } from '@/hooks/queries/academic.queries'
import { useBranchesQuery } from '@/hooks/queries/branch.queries'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileSpreadsheet,
  Printer,
  RotateCw,
  GraduationCap,
  Landmark,
  ClipboardCheck,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Building2,
  CalendarDays,
  Percent,
  ChevronRight,
  ShieldCheck,
  Receipt,
  Layers,
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/dashboard/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('overview')

  // Queries
  const { data: sessions } = useSessionsQuery()
  const { data: branches } = useBranchesQuery()

  // Derive available terms from selected session
  const currentSession = sessions?.find(
    (s: any) => (selectedSessionId ? s.id === selectedSessionId : s.isCurrent),
  )
  const availableTerms = currentSession?.terms || []

  const {
    data: reportData,
    isLoading,
    isRefetching,
    refetch,
  } = useSchoolReportsQuery({
    sessionId: selectedSessionId || currentSession?.id,
    termId: selectedTermId || undefined,
    branchId: selectedBranchId || undefined,
  })

  const exec = reportData?.executiveSummary || {
    totalStudents: 0,
    totalTeachers: 0,
    studentTeacherRatio: '0',
    schoolAverageScore: 0,
    collectionRate: 0,
    staffPunctualityRate: 0,
    totalFeesCollected: 0,
    totalOutstandingDebt: 0,
    totalOperationalExpenses: 0,
    netOperatingMargin: 0,
  }

  const academics = reportData?.academics
  const finance = reportData?.finance
  const attendance = reportData?.attendance
  const demographics = reportData?.demographics

  const formatCurrency = (val: number) =>
    `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

  return (
    <div className="space-y-6 pb-16 print:p-0 print:space-y-4">
      {/* Official Print Header (Only visible on print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-xl font-black tracking-wide uppercase">
          Emerald Heights Academy
        </h1>
        <p className="text-xs text-slate-600">
          14 Victoria Island Boulevard, Victoria Island, Lagos State, Nigeria
        </p>
        <div className="mt-2 inline-block bg-slate-100 text-slate-800 text-[11px] font-bold px-3 py-1 rounded border">
          EXECUTIVE SCHOOL INTELLIGENCE & ACADEMIC AUDIT REPORT
        </div>
        <div className="mt-2 text-[10px] text-slate-500 flex justify-between px-4">
          <span>Session: {currentSession?.name || '2025/2026 Academic Session'}</span>
          <span>
            Generated: {format(new Date(), 'EEEE, MMMM d, yyyy - hh:mm a')}
          </span>
          <span>Status: Official School Record</span>
        </div>
      </div>

      {/* Screen Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
            School Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Executive institutional intelligence across Academics, Finance, Attendance, and Enrollment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="text-xs gap-1.5 h-9"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
            className="text-xs gap-1.5 h-9 font-semibold shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" /> Print Executive Report
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl border bg-card shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Academic Session</label>
          <CustomSelect
            value={selectedSessionId || currentSession?.id || ''}
            onValueChange={(val) => {
              setSelectedSessionId(val)
              setSelectedTermId('')
            }}
            items={(sessions || []).map((s: any) => ({
              label: `${s.name} ${s.isCurrent ? '(Current)' : ''}`,
              value: s.id,
            }))}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Term / Period</label>
          <CustomSelect
            value={selectedTermId}
            onValueChange={setSelectedTermId}
            items={[
              { label: 'All Terms in Session', value: '' },
              ...availableTerms.map((t: any) => ({ label: t.name, value: t.id })),
            ]}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Campus Branch</label>
          <CustomSelect
            value={selectedBranchId}
            onValueChange={setSelectedBranchId}
            items={[
              { label: 'All Campuses (Whole School)', value: '' },
              ...(branches || []).map((b: any) => ({ label: b.name, value: b.id })),
            ]}
          />
        </div>
      </div>

      {/* Top-Line Executive KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-card border rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Enrollment</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold">{exec.totalStudents}</div>
          <p className="text-[10px] text-muted-foreground">
            {exec.studentTeacherRatio}:1 Student/Staff
          </p>
        </div>

        <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 text-xs font-medium">
            <span>Staff Headcount</span>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-600">{exec.totalTeachers}</div>
          <p className="text-[10px] text-blue-600/80">Teaching & Admin</p>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span>School Average</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">
            {exec.schoolAverageScore}%
          </div>
          <p className="text-[10px] text-emerald-600/80">Term WAEC average</p>
        </div>

        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <span>Collection Rate</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-600">{exec.collectionRate}%</div>
          <p className="text-[10px] text-emerald-600/80">
            {formatCurrency(exec.totalFeesCollected)}
          </p>
        </div>

        <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-xs font-medium">
            <span>Staff Punctuality</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-600">
            {exec.staffPunctualityRate}%
          </div>
          <p className="text-[10px] text-purple-600/80">On-time arrival rate</p>
        </div>

        <div className="p-3.5 bg-card border rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Net Margin</span>
            <Landmark className="h-4 w-4 text-primary" />
          </div>
          <div
            className={`text-xl font-bold ${
              exec.netOperatingMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatCurrency(exec.netOperatingMargin)}
          </div>
          <p className="text-[10px] text-muted-foreground">Inflow minus expenses</p>
        </div>
      </div>

      {/* Main Tabbed Analytics Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl gap-1 print:hidden">
          <TabsTrigger value="overview" className="text-xs gap-1.5 px-4 py-2">
            <Layers className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="academics" className="text-xs gap-1.5 px-4 py-2">
            <GraduationCap className="h-3.5 w-3.5" /> Academics & Results
          </TabsTrigger>
          <TabsTrigger value="finance" className="text-xs gap-1.5 px-4 py-2">
            <Landmark className="h-3.5 w-3.5" /> Finance & Debt
          </TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs gap-1.5 px-4 py-2">
            <Clock className="h-3.5 w-3.5" /> Staff Punctuality
          </TabsTrigger>
          <TabsTrigger value="demographics" className="text-xs gap-1.5 px-4 py-2">
            <Users className="h-3.5 w-3.5" /> Enrollment & Demographics
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW & SCORECARD */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic & Quality Highlights */}
            <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span>Academic Performance Summary</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                  {academics?.totalPublishedSheets || 0} Reports Published
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">School Overall Average:</span>
                  <span className="font-bold text-foreground">{exec.schoolAverageScore}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Top Performing Class:</span>
                  <span className="font-semibold text-foreground">
                    {academics?.classPerformance?.slice().sort((a, b) => b.averageScore - a.averageScore)[0]?.className || 'JSS 1 Gold'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Highest Scoring Student:</span>
                  <span className="font-semibold text-emerald-600">
                    {academics?.honorRoll[0]?.studentName || 'Chidinma Eze'} ({academics?.honorRoll[0]?.averageScore || 92}%)
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Curriculum Standards:</span>
                  <span className="font-medium text-foreground">WAEC 9-Point Scale Compliant</span>
                </div>
              </div>
            </div>

            {/* Financial Health Summary */}
            <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Landmark className="h-4 w-4 text-primary" />
                  <span>Financial Position & Inflows</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                  {exec.collectionRate}% Recovered
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Total Expected Fee Revenue:</span>
                  <span className="font-bold text-foreground">{formatCurrency(finance?.totalBilled || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Total Collected Cash Inflow:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(finance?.totalPaid || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Outstanding School Fee Debt:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(finance?.totalOutstanding || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Operating Expenses:</span>
                  <span className="font-medium text-foreground">{formatCurrency(finance?.totalExpenses || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* School Honor Roll Quick Peek */}
          <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>Institutional Honor Roll &mdash; Top Academic Scholars</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Highest aggregate percentage scores recorded this academic term.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {(academics?.honorRoll || []).map((student, idx) => (
                <div
                  key={student.studentId}
                  className="p-3.5 rounded-lg border bg-gradient-to-b from-card to-muted/20 space-y-1.5 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-500">#{idx + 1}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {student.className}
                    </Badge>
                  </div>
                  <div className="font-bold text-sm truncate text-foreground">
                    {student.studentName}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {student.regNumber || 'REG-001'}
                  </div>
                  <div className="text-base font-black text-emerald-600 pt-1">
                    {student.averageScore}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ACADEMICS & EXAMS */}
        <TabsContent value="academics" className="space-y-6">
          {/* Class Academic Performance Table */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm">Class Academic Performance & Grade Distribution</h3>
              <p className="text-xs text-muted-foreground">
                Aggregated term scores, pass rates, and letter grade breakdowns across all class cohorts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Enrolled</th>
                    <th className="py-3 px-4">Assessed</th>
                    <th className="py-3 px-4">Class Average</th>
                    <th className="py-3 px-4">Pass Rate</th>
                    <th className="py-3 px-4">Highest</th>
                    <th className="py-3 px-4">Lowest</th>
                    <th className="py-3 px-4">WAEC Grade Spread</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(academics?.classPerformance || []).map((cls) => (
                    <tr key={cls.classId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {cls.className}
                      </td>
                      <td className="py-3 px-4 font-mono">{cls.enrolledStudents}</td>
                      <td className="py-3 px-4 font-mono">{cls.assessedStudents}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground">{cls.averageScore}%</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[11px] ${
                            cls.passRate >= 70
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {cls.passRate}% Pass
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold font-mono">
                        {cls.highestScore}%
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {cls.lowestScore}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">
                            A:{cls.gradeDistribution?.A || 0}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                            B:{cls.gradeDistribution?.B || 0}
                          </span>
                          <span className="bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                            C:{cls.gradeDistribution?.C || 0}
                          </span>
                          <span className="bg-rose-100 text-rose-800 px-1 py-0.5 rounded">
                            F:{cls.gradeDistribution?.F || 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Performance Ranking */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm">Subject Performance & Difficulty Ranking</h3>
              <p className="text-xs text-muted-foreground">
                School-wide averages across all subjects to identify academic strengths and subject intervention needs.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Students Assessed</th>
                    <th className="py-3 px-4">Subject Average</th>
                    <th className="py-3 px-4">Pass Rate</th>
                    <th className="py-3 px-4">Academic Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(academics?.subjectPerformance || []).map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{sub.name}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{sub.code}</td>
                      <td className="py-3 px-4 font-mono">{sub.studentsCount}</td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {sub.averageScore}%
                      </td>
                      <td className="py-3 px-4 font-semibold font-mono">{sub.passRate}%</td>
                      <td className="py-3 px-4">
                        {sub.averageScore >= 70 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                            Distinction Tier
                          </Badge>
                        ) : sub.averageScore >= 55 ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                            Proficient
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                            Needs Intervention
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: FINANCE & DEBT */}
        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-card border rounded-xl space-y-1">
              <span className="text-xs text-muted-foreground">Expected Inflow (Billed)</span>
              <div className="text-xl font-bold">{formatCurrency(finance?.totalBilled || 0)}</div>
              <p className="text-[10px] text-muted-foreground">From student bills</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Collected Inflow
              </span>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(finance?.totalPaid || 0)}
              </div>
              <p className="text-[10px] text-emerald-600/80">{finance?.collectionRate}% recovery rate</p>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
              <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                Uncollected Fee Arrears
              </span>
              <div className="text-xl font-bold text-rose-600">
                {formatCurrency(finance?.totalOutstanding || 0)}
              </div>
              <p className="text-[10px] text-rose-600/80">Pending parent payments</p>
            </div>
            <div className="p-4 bg-muted/40 border rounded-xl space-y-1">
              <span className="text-xs text-muted-foreground">Total Operational Expenses</span>
              <div className="text-xl font-bold">{formatCurrency(finance?.totalExpenses || 0)}</div>
              <p className="text-[10px] text-muted-foreground">Outflow commitments</p>
            </div>
          </div>

          {/* Class Fee Collection Table */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm">Fee Collection by Class Cohort</h3>
              <p className="text-xs text-muted-foreground">
                Breakdown of billed fee revenue, settled payments, and pending collection arrears.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Class Level</th>
                    <th className="py-3 px-4">Total Billed</th>
                    <th className="py-3 px-4">Paid / Collected</th>
                    <th className="py-3 px-4">Outstanding Balance</th>
                    <th className="py-3 px-4">Collection Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(finance?.feeByClass || []).map((f, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{f.className}</td>
                      <td className="py-3 px-4 font-mono font-medium">
                        {formatCurrency(f.totalBilled)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600">
                        {formatCurrency(f.totalPaid)}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-rose-600">
                        {formatCurrency(f.outstanding)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, f.collectionRate)}%` }}
                            />
                          </div>
                          <span className="font-bold font-mono text-[11px]">
                            {f.collectionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Expenses Breakdown */}
          <div className="border rounded-xl bg-card shadow-sm p-4 space-y-4">
            <h3 className="font-bold text-sm">Operating Outflows by Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(finance?.expensesByCategory || []).map((exp, idx) => (
                <div key={idx} className="p-3 bg-muted/30 border rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase font-semibold tracking-wider">
                      {exp.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold">{exp.percentage}%</span>
                  </div>
                  <div className="text-base font-bold text-foreground">
                    {formatCurrency(exp.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: STAFF PUNCTUALITY & ATTENDANCE */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-card border rounded-xl space-y-1">
              <span className="text-xs text-muted-foreground">Total Working Day Logs</span>
              <div className="text-xl font-bold">{attendance?.totalStaffRecords || 0}</div>
              <p className="text-[10px] text-muted-foreground">Across all teachers</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                On-Time Clock-Ins
              </span>
              <div className="text-xl font-bold text-emerald-600">
                {attendance?.onTimeStaffArrivals || 0}
              </div>
              <p className="text-[10px] text-emerald-600/80">Before 08:15 AM</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Late Arrivals
              </span>
              <div className="text-xl font-bold text-amber-600">
                {attendance?.lateStaffArrivals || 0}
              </div>
              <p className="text-[10px] text-amber-600/80">Penalties applied</p>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1">
              <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                Accrued Late Fees
              </span>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(attendance?.totalLateFeesAccrued || 0)}
              </div>
              <p className="text-[10px] text-purple-600/80">Payroll deductions</p>
            </div>
          </div>

          {/* Teacher Punctuality Leaderboard */}
          <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-bold text-sm">Staff Attendance & Punctuality Audit Table</h3>
              <p className="text-xs text-muted-foreground">
                Individual teacher punctuality rates, arrival compliance, and accrued late penalties.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="py-3 px-4">Teacher Name</th>
                    <th className="py-3 px-4">Total Days</th>
                    <th className="py-3 px-4">On Time</th>
                    <th className="py-3 px-4">Late Arrivals</th>
                    <th className="py-3 px-4">Absent</th>
                    <th className="py-3 px-4">Excused</th>
                    <th className="py-3 px-4">Punctuality Rate</th>
                    <th className="py-3 px-4">Late Penalty Fees</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(attendance?.staffPunctualityLeaderboard || []).map((t) => (
                    <tr key={t.staffId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{t.fullname}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{t.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{t.totalDays}</td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">
                        {t.onTime}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                        {t.late}
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600">{t.absent}</td>
                      <td className="py-3 px-4 font-mono text-blue-600">{t.excused}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`text-[11px] ${
                            t.punctualityRate >= 90
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : t.punctualityRate >= 75
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {t.punctualityRate}% Punctual
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        {t.lateFees > 0 ? (
                          <span className="text-rose-600">{formatCurrency(t.lateFees)}</span>
                        ) : (
                          <span className="text-muted-foreground">₦0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: DEMOGRAPHICS & ENROLLMENT */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gender Demographics */}
            <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
              <h3 className="font-bold text-sm">Student Gender Distribution</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Male Students</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {demographics?.genderDemographics?.male || 0}
                  </div>
                  <p className="text-xs text-blue-600/80">
                    {demographics?.genderDemographics?.malePercentage || 50}% of student body
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20 space-y-1">
                  <div className="text-xs text-pink-700 dark:text-pink-400 font-medium">Female Students</div>
                  <div className="text-2xl font-bold text-pink-600">
                    {demographics?.genderDemographics?.female || 0}
                  </div>
                  <p className="text-xs text-pink-600/80">
                    {demographics?.genderDemographics?.femalePercentage || 50}% of student body
                  </p>
                </div>
              </div>

              {/* Gender Visual Progress Bar */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Male ({demographics?.genderDemographics?.malePercentage || 50}%)</span>
                  <span>Female ({demographics?.genderDemographics?.femalePercentage || 50}%)</span>
                </div>
                <div className="h-3 w-full bg-pink-200 dark:bg-pink-900/40 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full"
                    style={{
                      width: `${demographics?.genderDemographics?.malePercentage || 50}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Class Population Distribution */}
            <div className="p-5 rounded-xl border bg-card space-y-4 shadow-sm">
              <h3 className="font-bold text-sm">Enrollment by Class Level</h3>
              <div className="space-y-2.5">
                {(demographics?.classDistribution || []).map((cls, idx) => (
                  <div key={idx} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">{cls.className}</span>
                      <span className="text-muted-foreground font-mono">
                        {cls.studentsCount} students ({cls.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.max(5, cls.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Official Sign-off Block (Visible only on print) */}
      <div className="hidden print:grid grid-cols-3 gap-8 pt-12 mt-12 border-t text-xs">
        <div className="border-t pt-2 text-center">
          <p className="font-bold">Dr. Chukwuemeka Obi</p>
          <p className="text-slate-500 text-[10px]">Executive Principal & Administrator</p>
        </div>
        <div className="border-t pt-2 text-center">
          <p className="font-bold">Mrs. Fatima Bello</p>
          <p className="text-slate-500 text-[10px]">Head Bursar & Chief Financial Officer</p>
        </div>
        <div className="border-t pt-2 text-center">
          <p className="font-bold">Board of Governors</p>
          <p className="text-slate-500 text-[10px]">Emerald Heights Academy</p>
        </div>
      </div>
    </div>
  )
}
