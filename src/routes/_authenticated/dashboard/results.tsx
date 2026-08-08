import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useClassBroadsheetQuery, useSubjectGradebookQuery } from '@/hooks/queries/gradebook.queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Download } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute('/_authenticated/dashboard/results')({
  component: ResultsIndexRoute,
})

function ResultsIndexRoute() {
  const [selectedTermId, setSelectedTermId] = useState<string | undefined>()
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')

  // Fetch terms
  const { data: academicData } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/school/academic/sessions')
      return data?.data
    }
  })
  
  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/school/class', { params: { limit: 100 } })
      return data?.data?.classes || data?.data
    }
  })

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/school/subject', { params: { limit: 100 } })
      return data?.data?.subjects || data?.data
    }
  })

  const terms = academicData?.flatMap((session: any) => session.terms) || []
  const classes = classesData || []
  const subjects = subjectsData || []

  // Broadsheet Data
  const { data: broadsheet, isLoading: isBroadsheetLoading } = useClassBroadsheetQuery(
    selectedSubjectId === 'all' ? selectedTermId || '' : '', 
    selectedSubjectId === 'all' ? selectedClassId || '' : ''
  )

  // Subject Gradebook Data
  const { data: subjectGradebook, isLoading: isSubjectGradebookLoading } = useSubjectGradebookQuery(
    selectedSubjectId !== 'all' ? selectedTermId || '' : '', 
    selectedSubjectId !== 'all' ? selectedClassId || '' : '', 
    selectedSubjectId !== 'all' ? selectedSubjectId : ''
  )

  const handleExportCSV = () => {
    if (!broadsheet || !broadsheet.students || !broadsheet.subjects) return
    
    // Create CSV header
    const headers = ['Student Name', 'Admission Number']
    broadsheet.subjects.forEach((sub: any) => headers.push(sub.name))
    headers.push('Total Score')

    // Create rows
    const rows = broadsheet.students.map((student: any) => {
      const row = [student.fullname, student.regNumber || '']
      let totalScore = 0
      
      broadsheet.subjects.forEach((sub: any) => {
        // Find all records for this student and subject
        const studentRecords = broadsheet.records.filter((r: any) => r.studentId === student.id && r.subjectId === sub.id)
        const subjectTotal = studentRecords.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0)
        row.push(subjectTotal.toFixed(1))
        totalScore += subjectTotal
      })

      row.push(totalScore.toFixed(1))
      return row.join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `broadsheet_${selectedClassId}_${selectedTermId}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Results & Gradebook</h1>
          <p className="text-muted-foreground mt-1">View class broadsheets and subject grades.</p>
        </div>
        {selectedTermId && selectedClassId && selectedSubjectId === 'all' && (
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Broadsheet
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Context</CardTitle>
          <CardDescription>Choose the class, term, and view type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedTermId || ''} 
                onChange={(e) => setSelectedTermId(e.target.value)}
              >
                <option value="" disabled>Select Term</option>
                {terms.map((term: any) => (
                  <option key={term.id} value={term.id}>{term.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedClassId || ''} 
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="" disabled>Select Class</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>View Mode (Subject)</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedSubjectId || ''} 
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="all">Class Broadsheet (All Subjects)</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} Gradebook</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTermId && selectedClassId && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedSubjectId === 'all' ? 'Class Broadsheet' : 'Subject Gradebook'}</CardTitle>
            <CardDescription>
              {selectedSubjectId === 'all' 
                ? 'Overview of total scores across all subjects.' 
                : 'Detailed breakdown of CA and Exam scores for the selected subject (Read-only).'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Broadsheet View */}
            {selectedSubjectId === 'all' && (
              isBroadsheetLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : broadsheet?.students ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px] sticky left-0 bg-muted/50">Student Name</TableHead>
                        {broadsheet.subjects.map((sub: any) => (
                          <TableHead key={sub.id} className="text-center whitespace-nowrap px-4">{sub.code || sub.name}</TableHead>
                        ))}
                        <TableHead className="text-center font-bold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {broadsheet.students.map((student: any) => {
                        let totalScore = 0
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium sticky left-0 bg-background">{student.fullname}</TableCell>
                            {broadsheet.subjects.map((sub: any) => {
                              const studentRecords = broadsheet.records.filter((r: any) => r.studentId === student.id && r.subjectId === sub.id)
                              const subjectTotal = studentRecords.reduce((sum: number, r: any) => sum + (Number(r.score) || 0), 0)
                              totalScore += subjectTotal
                              return (
                                <TableCell key={sub.id} className="text-center border-l">
                                  {subjectTotal > 0 ? subjectTotal.toFixed(1) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center font-bold text-lg bg-secondary/10">
                              {totalScore.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {broadsheet.students.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={broadsheet.subjects.length + 2} className="text-center p-8 text-muted-foreground">
                            No students found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : null
            )}

            {/* Subject Gradebook View (Read Only) */}
            {selectedSubjectId !== 'all' && (
              isSubjectGradebookLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : subjectGradebook?.config?.length ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[250px]">Student Name</TableHead>
                        {subjectGradebook.config.map((comp: any) => (
                          <TableHead key={comp.name} className="w-[120px] text-center">
                            {comp.name} <br/> <span className="text-xs font-normal text-muted-foreground">(/{comp.maxScore})</span>
                          </TableHead>
                        ))}
                        <TableHead className="w-[120px] text-center">Total Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectGradebook.students.map((student: any) => {
                        let totalScore = 0
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.fullname}</TableCell>
                            {subjectGradebook.config.map((comp: any) => {
                              const record = subjectGradebook.records.find((r: any) => r.studentId === student.id && r.componentType === comp.name)
                              const score = record ? Number(record.score) : 0
                              totalScore += score
                              return (
                                <TableCell key={comp.name} className="text-center p-2">
                                  {record ? score.toFixed(1) : '-'}
                                </TableCell>
                              )
                            })}
                            <TableCell className="text-center font-bold text-lg bg-secondary/10">
                              {totalScore.toFixed(1)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {subjectGradebook.students.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={subjectGradebook.config.length + 2} className="text-center p-8 text-muted-foreground">
                            No students enrolled.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground border rounded-lg bg-muted/20">
                  No Assessment Configuration found for this subject. Configure it in Assessment Settings first.
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
