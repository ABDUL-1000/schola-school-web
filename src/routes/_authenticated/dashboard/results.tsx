import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  useClassBroadsheetQuery,
  useGenerateReportSheetsMutation,
  usePublishReportSheetsMutation,
  useSingleReportSheetQuery,
  useGradingConfigQuery,
  useUpdateGradingConfigMutation,
} from '@/hooks/queries/grading.queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Loader2,
  Download,
  FileCheck,
  Share2,
  Settings,
  Eye,
  Award,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/lib/toast'
import { NigerianReportSheet } from '@/components/grading/nigerian-report-sheet'

export const Route = createFileRoute('/_authenticated/dashboard/results')({
  component: ResultsIndexRoute,
})

function ResultsIndexRoute() {
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')

  // Selected student for Report Sheet modal
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Fetch terms
  const { data: academicData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/school/academic/sessions')
      return data?.data
    },
  })

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/school/class', { params: { limit: 100 } })
      return data?.data?.classes || data?.data
    },
  })

  const terms = academicData?.flatMap((session: any) => session.terms) || []
  const classes = classesData || []

  // Broadsheet Data
  const { data: broadsheet, isLoading: isBroadsheetLoading } = useClassBroadsheetQuery(
    selectedTermId,
    selectedClassId
  )

  // Single Student Report Sheet Data
  const { data: singleReportData, isLoading: isSingleReportLoading } = useSingleReportSheetQuery(
    selectedTermId,
    viewingStudentId || ''
  )

  // Grading Config
  const { data: gradingConfig } = useGradingConfigQuery()
  const updateConfigMutation = useUpdateGradingConfigMutation()

  // Batch Mutations
  const generateMutation = useGenerateReportSheetsMutation()
  const publishMutation = usePublishReportSheetsMutation()

  // Local settings state
  const [settingsForm, setSettingsForm] = useState({
    cbtMode: 'HYBRID',
    ca1MaxScore: 10,
    ca2MaxScore: 10,
    ca3MaxScore: 10,
    assignmentMaxScore: 10,
    examMaxScore: 60,
    nextTermBegins: '',
  })

  const openSettings = () => {
    if (gradingConfig) {
      setSettingsForm({
        cbtMode: gradingConfig.cbtMode || 'HYBRID',
        ca1MaxScore: Number(gradingConfig.ca1MaxScore) || 10,
        ca2MaxScore: Number(gradingConfig.ca2MaxScore) || 10,
        ca3MaxScore: Number(gradingConfig.ca3MaxScore) || 10,
        assignmentMaxScore: Number(gradingConfig.assignmentMaxScore) || 10,
        examMaxScore: Number(gradingConfig.examMaxScore) || 60,
        nextTermBegins: gradingConfig.nextTermBegins
          ? new Date(gradingConfig.nextTermBegins).toISOString().split('T')[0]
          : '',
      })
    }
    setIsSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    try {
      await updateConfigMutation.mutateAsync(settingsForm)
      toast.success('Grading configuration updated successfully')
      setIsSettingsOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update configuration')
    }
  }

  const handleGenerateReportSheets = async () => {
    if (!selectedTermId || !selectedClassId) return
    try {
      const res = await generateMutation.mutateAsync({
        termId: selectedTermId,
        classId: selectedClassId,
      })
      toast.success(res?.message || 'Report sheets generated successfully')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report sheets')
    }
  }

  const handlePublishReportSheets = async () => {
    if (!selectedTermId || !selectedClassId) return
    try {
      const res = await publishMutation.mutateAsync({
        termId: selectedTermId,
        classId: selectedClassId,
      })
      toast.success(res?.message || 'Report sheets published to students & parents')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish report sheets')
    }
  }

  const handleExportCSV = () => {
    if (!broadsheet?.students || !broadsheet?.subjects) return

    const headers = ['Rank', 'Admission No', 'Student Name']
    broadsheet.subjects.forEach((sub: any) => {
      headers.push(`${sub.name} (CA)`)
      headers.push(`${sub.name} (Exam)`)
      headers.push(`${sub.name} (Total)`)
      headers.push(`${sub.name} (Grade)`)
    })
    headers.push('Cumulative Total', 'Average %', 'Class Position')

    const rows = broadsheet.students.map((row: any) => {
      const line = [
        row.classPositionFormatted || '',
        row.student.regNumber || '',
        `"${row.student.fullname}"`,
      ]

      broadsheet.subjects.forEach((sub: any) => {
        const bd = row.subjectBreakdowns?.[sub.id]
        line.push(bd?.caTotal ?? 0)
        line.push(bd?.examTotal ?? 0)
        line.push(bd?.totalScore ?? 0)
        line.push(bd?.grade ?? '-')
      })

      line.push(row.cumulativeTotal, `${row.averageScore}%`, row.classPositionFormatted || '')
      return line.join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `broadsheet_${selectedClassId}_${selectedTermId}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading & Nigerian Standard Report Sheets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Master Broad Sheet, cumulative positions, subject averages, and report cards.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openSettings} className="gap-1.5">
            <Settings className="w-4 h-4" />
            Grading Config
          </Button>

          {selectedTermId && selectedClassId && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReportSheets}
                disabled={generateMutation.isPending}
                className="gap-1.5"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4 text-primary" />
                )}
                Compile Report Sheets
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handlePublishReportSheets}
                disabled={publishMutation.isPending}
                className="gap-1.5"
              >
                {publishMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                Publish to Students & Parents
              </Button>

              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filter Selection Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Context</CardTitle>
          <CardDescription>Choose Academic Term and Class to view Broad Sheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic Term</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedTermId}
                onChange={(e) => setSelectedTermId(e.target.value)}
              >
                <option value="">Select Term</option>
                {terms.map((term: any) => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({term.session?.name || 'Session'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class / Arm</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadsheet Display */}
      {selectedTermId && selectedClassId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Class Master Broad Sheet</CardTitle>
                <CardDescription>
                  Cumulative class record, subject totals, student class positions, and letter grades.
                </CardDescription>
              </div>
              {broadsheet && (
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                  <span>
                    Enrolled Students: <strong className="text-foreground">{broadsheet.totalStudents}</strong>
                  </span>
                  <span>
                    Class Average: <strong className="text-primary">{broadsheet.overallClassAverage}%</strong>
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isBroadsheetLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : broadsheet?.students ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 text-center text-xs">
                      <TableHead className="w-12 text-center">Rank</TableHead>
                      <TableHead className="w-48 text-left sticky left-0 bg-muted/50 z-10">
                        Student Fullname
                      </TableHead>
                      <TableHead className="w-28 text-left">Reg No</TableHead>

                      {/* Subject Columns */}
                      {broadsheet.subjects.map((sub: any) => (
                        <TableHead
                          key={sub.id}
                          colSpan={3}
                          className="border-l text-center font-bold px-2 whitespace-nowrap"
                        >
                          {sub.name}
                          <div className="text-[10px] font-normal text-muted-foreground">
                            CA (40) | Exam (60) | Total
                          </div>
                        </TableHead>
                      ))}

                      <TableHead className="text-center font-bold border-l w-24">Cum. Total</TableHead>
                      <TableHead className="text-center font-bold w-20">Average</TableHead>
                      <TableHead className="text-center font-bold w-20">Position</TableHead>
                      <TableHead className="text-center w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadsheet.students.map((row: any) => (
                      <TableRow key={row.student.id} className="text-xs hover:bg-muted/20">
                        <TableCell className="text-center font-bold text-muted-foreground">
                          {row.classPositionFormatted || '-'}
                        </TableCell>
                        <TableCell className="font-semibold sticky left-0 bg-background z-10">
                          {row.student.fullname}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.student.regNumber || '-'}
                        </TableCell>

                        {/* Subject Breakdowns */}
                        {broadsheet.subjects.map((sub: any) => {
                          const bd = row.subjectBreakdowns?.[sub.id]
                          return (
                            <TableCell
                              key={sub.id}
                              colSpan={3}
                              className="border-l text-center p-1 font-mono text-[11px]"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span className="text-muted-foreground">{bd?.caTotal ?? '-'}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">{bd?.examTotal ?? '-'}</span>
                                <span className="text-muted-foreground">=</span>
                                <strong className="text-foreground">{bd?.totalScore ?? '-'}</strong>
                                {bd?.grade && bd.grade !== '-' && (
                                  <span
                                    className={`px-1 rounded text-[10px] font-bold ${
                                      bd.grade.startsWith('A')
                                        ? 'bg-green-100 text-green-800'
                                        : bd.grade.startsWith('F')
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {bd.grade}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )
                        })}

                        <TableCell className="text-center font-bold border-l bg-secondary/10">
                          {row.cumulativeTotal}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-primary">
                          {row.averageScore}%
                        </TableCell>
                        <TableCell className="text-center font-black text-purple-700">
                          {row.classPositionFormatted || '-'}
                        </TableCell>
                        <TableCell className="text-center p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setViewingStudentId(row.student.id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Report Card
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Class Summary Statistics Footer */}
                    {broadsheet.students.length > 0 && (
                      <TableRow className="bg-muted/40 font-semibold text-xs border-t-2 border-border">
                        <TableCell colSpan={3} className="text-right pr-4 uppercase tracking-wide">
                          Subject Class Average:
                        </TableCell>
                        {broadsheet.subjects.map((sub: any) => (
                          <TableCell key={sub.id} colSpan={3} className="border-l text-center text-primary font-bold">
                            {sub.stats?.average ? `${sub.stats.average.toFixed(1)}%` : '-'}
                          </TableCell>
                        ))}
                        <TableCell colSpan={4} className="text-center text-primary font-bold">
                          Class Avg: {broadsheet.overallClassAverage}%
                        </TableCell>
                      </TableRow>
                    )}

                    {broadsheet.students.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={broadsheet.subjects.length * 3 + 7}
                          className="text-center p-12 text-muted-foreground"
                        >
                          No student assessment records found for this class and term.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Single Student Report Sheet Modal */}
      <Dialog
        open={!!viewingStudentId}
        onOpenChange={(open) => !open && setViewingStudentId(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-6xl lg:max-w-7xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Student Report Sheet</DialogTitle>
          </DialogHeader>
          {isSingleReportLoading ? (
            <div className="flex justify-center p-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : singleReportData ? (
            <NigerianReportSheet
              data={singleReportData}
              onClose={() => setViewingStudentId(null)}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Unable to load student report sheet.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Grading Configuration Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Grading & Assessment Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">School CBT Mode</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={settingsForm.cbtMode}
                onChange={(e) => setSettingsForm({ ...settingsForm, cbtMode: e.target.value })}
              >
                <option value="HYBRID">Hybrid (CBT Objective + Teacher Essay/Theory)</option>
                <option value="CBT_ONLY">100% CBT Automated</option>
                <option value="MANUAL_ONLY">100% Manual Grading by Teachers</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                Determines whether exam scores are automated, manual, or split between CBT and essay.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">1st CA Max Score</Label>
                <Input
                  type="number"
                  value={settingsForm.ca1MaxScore}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ca1MaxScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">2nd CA Max Score</Label>
                <Input
                  type="number"
                  value={settingsForm.ca2MaxScore}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ca2MaxScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">3rd CA Max Score</Label>
                <Input
                  type="number"
                  value={settingsForm.ca3MaxScore}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ca3MaxScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assignment Max Score</Label>
                <Input
                  type="number"
                  value={settingsForm.assignmentMaxScore}
                  onChange={(e) => setSettingsForm({ ...settingsForm, assignmentMaxScore: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold">Terminal Exam Max Score</Label>
              <Input
                type="number"
                value={settingsForm.examMaxScore}
                onChange={(e) => setSettingsForm({ ...settingsForm, examMaxScore: Number(e.target.value) })}
              />
              <p className="text-[11px] text-muted-foreground">
                Usually 60 or 70 (so that Continuous Assessment + Exam = 100).
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t">
              <Label className="text-xs font-semibold">Next Term Resumption Date</Label>
              <Input
                type="date"
                value={settingsForm.nextTermBegins}
                onChange={(e) => setSettingsForm({ ...settingsForm, nextTermBegins: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={updateConfigMutation.isPending}>
                {updateConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
